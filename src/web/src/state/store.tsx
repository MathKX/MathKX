// The session store: one reducer for language, the current question, draft, help and explanation state,
// the ladder position, and the guest record. Persisted on every change through storage.ts.
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from "react";
import type { InstanceDto, LadderEntry, PoolDto, PracticeApi, StepDto, StepKind, ValidationResponse } from "../api/types";
import { newSeed, practiceApi } from "../api/client";
import type { Lang } from "../i18n";
import { derive, type Outcome } from "./outcomes";
import { createStorage, type Storage } from "./storage";
import { hasCorrect, hasSubmission, identityOf, newId, recordEvent, type ChallengeRequest, type Delivery, type Event } from "./observations";
import { repeatKind, repeats, type RepeatKind } from "./progress";
import { choose, pairKey, recentWindow } from "./selection";
import { isUnfinished, partOf, type CheckResume, type CheckRun } from "./checks";

export interface DefinitionRef {
  definition: string;
  version: number;
}

export interface PendingChange extends DefinitionRef {
  request: "easier" | "harder";
}

/** The help and explanation steps a resumed question had reached, fetched again to show them. */
interface RestoredSteps {
  help: StepDto[];
  explanation: StepDto[];
}

export interface Resumable {
  deliveryId: string;
  draft: string;
  helpOpen: boolean;
  helpStep: number;
  explanationOpen: boolean;
  explanationStep: number;
}

/** One visit in which a lesson's content was shown (specs/004 contracts/lesson-views.md); never evidence about a skill. */
export interface LessonView {
  lessonId: string;
  language: Lang;
  at: string;
}

/** What survives a reload. */
export interface PersistedState {
  language: Lang;
  skillId: string | null;
  ladder: { entries: LadderEntry[]; current: DefinitionRef | null; pending: PendingChange | null };
  deliveries: Delivery[];
  currentDeliveryId: string | null;
  instance: InstanceDto | null;
  draft: string;
  helpOpen: boolean;
  helpSteps: StepDto[];
  helpStep: number; // index of the last fetched help step, -1 before the first
  explanationOpen: boolean;
  explanationSteps: StepDto[];
  explanationStep: number;
  result: ValidationResponse | null;
  resumable: Resumable | null;
  /** Added by specs/004 without a schema version change; a record written before it has none. No cap, like deliveries. */
  lessonViews: LessonView[];
  /** Added by specs/005 without a schema version change (contracts/session.md). */
  session: PracticeSession;
  /** Added by specs/006 without a schema version change: self-check runs, kept apart from practice's deliveries. */
  checkRuns: CheckRun[];
}

/** The questions worked in the current session, and a snapshot of the last finished one (specs/005). */
export interface PracticeSession {
  current: string[];
  last: { finishedAt: string; questions: { id: string; outcome: Exclude<Outcome, "none">; repeat: RepeatKind | null }[] } | null;
}

/** A record written before specs/005 has no session: every question in it belongs to the first one. */
const sessionOf = (value: Partial<PersistedState>): PracticeSession =>
  value.session ?? { current: (value.deliveries ?? []).map((d) => d.id), last: null };

/** What the check run page shows beside its run (specs/006 data-model "Check screen state"); never persisted. */
export interface CheckScreen {
  runId: string;
  /** The question at the run's position, once fetched; never a result. */
  instance: InstanceDto | null;
  helpSteps: StepDto[];
  explanationSteps: StepDto[];
  /** A save is under way. */
  checking: boolean;
  /** The run page is mounted. */
  presenting: boolean;
  /** Input guidance after an unreadable save, or "not saved" after a failed request. Never a result. */
  notice: { kind: "guidance"; code: string; text: string } | { kind: "unsaved" } | null;
  /** The question could not be loaded, or its identity now resolves to other operands than the recorded ones. */
  loadError: false | "failed" | "changed";
}

export interface State extends PersistedState {
  kept: boolean;
  checking: boolean;
  notice: { key: string; params?: Record<string, string | number> } | null;
  loadError: boolean;
  /** The practice view is mounted. A step is presented, and so recorded, only while it is and its panel is open. */
  presenting: boolean;
  check: CheckScreen | null;
}

const emptyResume = (): CheckResume => ({ draft: "", helpOpen: false, helpStep: -1, explanationOpen: false, explanationStep: -1, result: null });

const initialPersisted: PersistedState = {
  language: "nb",
  skillId: null,
  ladder: { entries: [], current: null, pending: null },
  deliveries: [],
  currentDeliveryId: null,
  instance: null,
  draft: "",
  helpOpen: false,
  helpSteps: [],
  helpStep: -1,
  explanationOpen: false,
  explanationSteps: [],
  explanationStep: -1,
  result: null,
  resumable: null,
  lessonViews: [],
  session: { current: [], last: null },
  checkRuns: [],
};

type Action =
  | { type: "hydrate"; state: PersistedState; kept: boolean }
  | { type: "language"; language: Lang }
  | { type: "kept"; kept: boolean }
  | { type: "ladder"; skillId: string; entries: LadderEntry[]; current: DefinitionRef }
  | { type: "question"; instance: InstanceDto; delivery: Delivery; resumedFrom?: Resumable; restored?: RestoredSteps; applied?: PendingChange; clearPending?: boolean }
  | { type: "draft"; draft: string }
  // Asynchronous responses carry the id of the delivery they were requested for. A response that arrives after
  // the learner moved on is recorded on that delivery and never changes the screen of the current one.
  | { type: "checking"; checking: boolean; deliveryId: string }
  | { type: "result"; result: ValidationResponse; event: Event; deliveryId: string }
  | { type: "event"; event: Event; deliveryId?: string }
  | { type: "help"; open: boolean }
  // A step is recorded as support only when it is presented, so the reducer records it together with showing it.
  | { type: "helpStep"; step: StepDto; deliveryId: string }
  | { type: "explanation"; open: boolean }
  | { type: "explanationStep"; step: StepDto; deliveryId: string }
  | { type: "pending"; pending: PendingChange | null }
  | { type: "notice"; notice: State["notice"] }
  | { type: "loadError"; failed: boolean }
  | { type: "present" }
  | { type: "instanceLessons"; deliveryId: string; lessons: NonNullable<InstanceDto["lessons"]> }
  | { type: "end" }
  | { type: "finish"; at: string }
  | { type: "lessonViewed"; view: LessonView }
  | { type: "clear" }
  // Self-checks (specs/006 contracts/check-run.md). Each names its run, and the position it was requested for where
  // a response may arrive late; a stale one changes nothing.
  | { type: "checkStart"; run: CheckRun; at: string }
  | { type: "checkOpen"; runId: string }
  | { type: "checkLeave" }
  /** `restored`: a resumed supported question's steps, fetched again and shown without being recorded. */
  | { type: "checkInstance"; runId: string; position: number; instance: InstanceDto; delivery: Delivery; restored?: RestoredSteps }
  | { type: "checkLoadError"; runId: string; error: CheckScreen["loadError"] }
  | { type: "checkDraft"; runId: string; draft: string }
  | { type: "checkSaving"; runId: string; checking: boolean }
  | { type: "checkNotice"; runId: string; notice: CheckScreen["notice"] }
  /** Records the event, if any, on the delivery at `position`; `advance` then moves on, or finishes the run after the last question. */
  | { type: "checkEvent"; runId: string; position: number; event: Event | null; advance: boolean; at: string }
  // The supported part (specs/006 contracts/check-run.md "Supported part").
  | { type: "checkSwitch"; runId: string; position: number }
  | { type: "checkPanels"; runId: string; position: number; panels: Partial<Pick<CheckResume, "helpOpen" | "explanationOpen">> }
  | { type: "checkResult"; runId: string; position: number; event: Event; result: ValidationResponse }
  | { type: "checkStep"; runId: string; position: number; kind: StepKind; step: StepDto };

function updateRun(state: State, runId: string, fn: (run: CheckRun) => CheckRun): State {
  return { ...state, checkRuns: state.checkRuns.map((r) => (r.id === runId ? fn(r) : r)) };
}

const updateScreen = (state: State, runId: string, fn: (screen: CheckScreen) => CheckScreen): State =>
  state.check && state.check.runId === runId ? { ...state, check: fn(state.check) } : state;

/** The unfinished run whose question at `position` is on screen now, or null: a stale action changes nothing. */
function onScreen(state: State, runId: string, position: number): CheckRun | null {
  const run = state.checkRuns.find((r) => r.id === runId);
  return run && isUnfinished(run) && run.position === position && run.deliveries[position - 1] ? run : null;
}

const withDelivery = (run: CheckRun, position: number, fn: (d: Delivery) => Delivery): Delivery[] =>
  run.deliveries.map((d, i) => (i === position - 1 ? fn(d) : d));

function checkReducer(state: State, action: Extract<Action, { type: `check${string}` }>): State {
  switch (action.type) {
    case "checkStart": {
      // One unfinished run per skill: starting another ends it (FR-003).
      const ended = state.checkRuns.map((r) => (r.skillId === action.run.skillId && isUnfinished(r) ? { ...r, endedAt: action.at } : r));
      return { ...state, checkRuns: [...ended, action.run] };
    }
    case "checkOpen":
      return { ...state, check: { runId: action.runId, instance: null, helpSteps: [], explanationSteps: [], checking: false, presenting: true, notice: null, loadError: false } };
    case "checkLeave":
      return state.check ? { ...state, check: null } : state; // `resume` stays on the run
    case "checkInstance": {
      const run = state.checkRuns.find((r) => r.id === action.runId);
      if (!run || !state.check || state.check.runId !== action.runId || run.position !== action.position || !isUnfinished(run)) return state;
      // A question is reached once it is shown: its delivery joins the run at its index.
      let reached = run.deliveries.length >= action.position ? run : { ...run, deliveries: [...run.deliveries, action.delivery] };
      const restored = action.restored;
      // Steps that could not be fetched again start over, so the next step asked for is the next one shown.
      if (restored && reached.resume) reached = { ...reached, resume: { ...reached.resume, helpStep: restored.help.length - 1, explanationStep: restored.explanation.length - 1 } };
      return {
        ...updateRun(state, run.id, () => reached),
        check: { ...state.check, instance: action.instance, helpSteps: restored?.help ?? [], explanationSteps: restored?.explanation ?? [], loadError: false },
      };
    }
    case "checkSwitch": {
      // One way (FR-008): from this position on, the run is supported practice; the draft stays.
      const run = onScreen(state, action.runId, action.position);
      if (!run || run.switchAt !== null) return state;
      return updateScreen(updateRun(state, run.id, (r) => ({ ...r, switchAt: action.position })), run.id, (s) => ({ ...s, notice: null }));
    }
    case "checkPanels": {
      const run = onScreen(state, action.runId, action.position);
      if (!run) return state;
      return updateRun(state, run.id, (r) => ({ ...r, resume: { ...(r.resume ?? emptyResume()), ...action.panels } }));
    }
    case "checkResult": {
      const run = onScreen(state, action.runId, action.position);
      if (!run || partOf(run, action.position) !== "supported") return updateScreen(state, action.runId, (s) => ({ ...s, checking: false }));
      const next = updateRun(state, run.id, (r) => ({ ...r, deliveries: withDelivery(r, action.position, (d) => recordEvent(d, action.event)), resume: { ...(r.resume ?? emptyResume()), result: action.result } }));
      return updateScreen(next, run.id, (s) => ({ ...s, checking: false, notice: null }));
    }
    case "checkStep": {
      // Practice's rule through the same helper: a step is shown, and recorded, only while the view presents it.
      const run = onScreen(state, action.runId, action.position);
      const screen = state.check;
      if (!run || !screen || screen.runId !== run.id || partOf(run, action.position) !== "supported") return state;
      const resume = run.resume ?? emptyResume();
      const stepScreen: StepScreen = { ...resume, helpSteps: screen.helpSteps, explanationSteps: screen.explanationSteps };
      const shown = presentStep(stepScreen, run.deliveries[action.position - 1]!, screen.presenting, action.kind, action.step);
      if (!shown) return state;
      const s = shown.screen;
      const next = updateRun(state, run.id, (r) => ({ ...r, deliveries: withDelivery(r, action.position, () => shown.delivery), resume: { ...resume, helpStep: s.helpStep, explanationStep: s.explanationStep } }));
      return { ...next, check: { ...screen, helpSteps: s.helpSteps, explanationSteps: s.explanationSteps } };
    }
    case "checkLoadError":
      return updateScreen(state, action.runId, (s) => ({ ...s, loadError: action.error }));
    case "checkDraft":
      return updateRun(state, action.runId, (r) => ({ ...r, resume: { ...(r.resume ?? emptyResume()), draft: action.draft } }));
    case "checkSaving":
      return updateScreen(state, action.runId, (s) => ({ ...s, checking: action.checking }));
    case "checkNotice":
      return updateScreen(state, action.runId, (s) => ({ ...s, notice: action.notice }));
    case "checkEvent": {
      const run = state.checkRuns.find((r) => r.id === action.runId);
      const target = run?.deliveries[action.position - 1];
      // Only the question on screen: an action that raced a move on (a second press before the render) changes nothing.
      if (!run || !target || !isUnfinished(run) || run.position !== action.position) return state;
      const event = action.event;
      const deliveries = event ? withDelivery(run, action.position, (d) => recordEvent(d, event)) : run.deliveries;
      if (!action.advance) return updateRun(state, run.id, (r) => ({ ...r, deliveries }));
      const last = action.position >= run.questions.length;
      const moved: CheckRun = last ? { ...run, deliveries, resume: null, finishedAt: action.at } : { ...run, deliveries, position: action.position + 1, resume: null };
      const next = updateRun(state, run.id, () => moved);
      return updateScreen(next, run.id, (s) => ({ ...s, instance: null, helpSteps: [], explanationSteps: [], checking: false, notice: null, loadError: false }));
    }
    default:
      return state;
  }
}

/** Changes the delivery with this ID, in practice's deliveries or in a check run's (a lesson detour from a check, R10). */
function updateDelivery(state: State, deliveryId: string | null | undefined, fn: (d: Delivery) => Delivery): State {
  if (!deliveryId) return state;
  if (!state.deliveries.some((d) => d.id === deliveryId) && state.checkRuns.some((r) => r.deliveries.some((d) => d.id === deliveryId))) {
    return { ...state, checkRuns: state.checkRuns.map((r) => (r.deliveries.some((d) => d.id === deliveryId) ? { ...r, deliveries: r.deliveries.map((d) => (d.id === deliveryId ? fn(d) : d)) } : r)) };
  }
  return { ...state, deliveries: state.deliveries.map((d) => (d.id === deliveryId ? fn(d) : d)) };
}

const updateCurrent = (state: State, fn: (d: Delivery) => Delivery): State => updateDelivery(state, state.currentDeliveryId, fn);

const isCurrent = (state: State, deliveryId: string) => state.currentDeliveryId === deliveryId;

/** Notices about the question they came with; the next question clears them. */
const questionNotices = new Set(["practice.poolExhausted", "practice.resumed"]);

/** A question's help and explanation panels as shown: practice's screen, and a supported check question's (specs/006). */
export interface StepScreen {
  helpOpen: boolean;
  helpSteps: StepDto[];
  helpStep: number;
  explanationOpen: boolean;
  explanationSteps: StepDto[];
  explanationStep: number;
}

/**
 * "A step is recorded only when it is shown" (spec 002): the step is shown, and recorded on the question's delivery,
 * only while the view presents the question with that panel open. Returns the new screen and delivery together, or
 * null when the step is not shown, so nothing is recorded either.
 */
export function presentStep<S extends StepScreen>(screen: S, delivery: Delivery, presenting: boolean, kind: StepKind, step: StepDto): { screen: S; delivery: Delivery } | null {
  if (!presenting) return null;
  if (kind === "help") {
    if (!screen.helpOpen) return null;
    const events: Event[] = [{ type: "support", kind: "help-step", step: step.index, reveals: step.reveals }];
    if (step.reveals && step.representation === "groups") events.push({ type: "support", kind: "counting-complete" });
    return { screen: { ...screen, helpSteps: [...screen.helpSteps.slice(0, step.index), step], helpStep: step.index }, delivery: events.reduce(recordEvent, delivery) };
  }
  if (!screen.explanationOpen) return null;
  return {
    screen: { ...screen, explanationSteps: [...screen.explanationSteps.slice(0, step.index), step], explanationStep: step.index },
    delivery: recordEvent(delivery, { type: "support", kind: "explanation-step", step: step.index, reveals: step.reveals }),
  };
}

/** Practice's step cases: the step belongs to the current question, and is shown and recorded through `presentStep`. */
function practiceStep(state: State, deliveryId: string, kind: StepKind, step: StepDto): State {
  // Not presented (the learner moved on, closed the panel, or left the view): nothing shown, nothing recorded.
  const delivery = isCurrent(state, deliveryId) ? state.deliveries.find((d) => d.id === deliveryId) : undefined;
  const shown = delivery ? presentStep(state, delivery, state.presenting, kind, step) : null;
  if (!shown) return state;
  return { ...shown.screen, deliveries: state.deliveries.map((d) => (d.id === deliveryId ? shown.delivery : d)) };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "hydrate":
      return { ...state, ...action.state, lessonViews: action.state.lessonViews ?? [], session: sessionOf(action.state), checkRuns: action.state.checkRuns ?? [], kept: action.kept };
    case "language":
      return { ...state, language: action.language };
    case "kept":
      return { ...state, kept: action.kept };
    case "ladder":
      return { ...state, skillId: action.skillId, ladder: { entries: action.entries, current: action.current, pending: state.ladder.pending } };
    case "question": {
      // The applied challenge change, the clearing of the pending choice, and an explicit selection's ladder
      // position commit together with the question that was actually loaded; a failed load changes none of them.
      const applied = action.applied;
      const withApplied = applied
        ? updateCurrent(state, (d) => recordEvent(d, { type: "challenge-request", request: applied.request, outcome: "applied" }))
        : state;
      const previousClosed = updateCurrent(withApplied, (d) => (hasSubmission(d) ? d : recordEvent(d, { type: "skipped" })));
      const deliveries = previousClosed.deliveries.some((d) => d.id === action.delivery.id)
        ? previousClosed.deliveries
        : [...previousClosed.deliveries, action.delivery];
      const resumed = action.resumedFrom;
      // Delivered, resumed, or repeated: the question is worked in the current session (specs/005 FR-014).
      const current = previousClosed.session.current.includes(action.delivery.id) ? previousClosed.session.current : [...previousClosed.session.current, action.delivery.id];
      return {
        ...previousClosed,
        deliveries,
        session: { ...previousClosed.session, current },
        currentDeliveryId: action.delivery.id,
        instance: action.instance,
        draft: resumed?.draft ?? "",
        helpOpen: resumed?.helpOpen ?? false,
        // A resumed question shows the steps the learner had reached; they were recorded when first shown.
        helpSteps: action.restored?.help ?? [],
        helpStep: (action.restored?.help.length ?? 0) - 1,
        explanationOpen: resumed?.explanationOpen ?? false,
        explanationSteps: action.restored?.explanation ?? [],
        explanationStep: (action.restored?.explanation.length ?? 0) - 1,
        result: null,
        resumable: null,
        loadError: false,
        checking: false,
        ladder: {
          ...state.ladder,
          current: { definition: action.instance.identity.definitionId, version: action.instance.identity.version },
          pending: applied || action.clearPending ? null : state.ladder.pending,
        },
      };
    }
    case "draft":
      return { ...state, draft: action.draft };
    case "checking":
      return isCurrent(state, action.deliveryId) ? { ...state, checking: action.checking } : state;
    case "result": {
      const recorded = updateDelivery(state, action.deliveryId, (d) => recordEvent(d, action.event));
      if (!isCurrent(state, action.deliveryId)) return recorded; // a late answer to an earlier question
      return { ...recorded, result: action.result, checking: false, notice: null };
    }
    case "event":
      return updateDelivery(state, action.deliveryId ?? state.currentDeliveryId, (d) => recordEvent(d, action.event));
    case "help":
      return { ...state, helpOpen: action.open };
    case "helpStep":
      return practiceStep(state, action.deliveryId, "help", action.step);
    case "explanation":
      return { ...state, explanationOpen: action.open };
    case "explanationStep":
      return practiceStep(state, action.deliveryId, "explanation", action.step);
    case "pending":
      return { ...state, ladder: { ...state.ladder, pending: action.pending } };
    case "notice":
      return { ...state, notice: action.notice };
    case "loadError":
      return { ...state, loadError: action.failed };
    case "present":
      return state.presenting ? state : { ...state, presenting: true };
    case "instanceLessons":
      return isCurrent(state, action.deliveryId) && state.instance ? { ...state, instance: { ...state.instance, lessons: action.lessons } } : state;
    case "end": {
      if (!state.currentDeliveryId || !state.instance) return { ...state, presenting: false };
      const current = state.deliveries.find((d) => d.id === state.currentDeliveryId);
      const unanswered = current ? !hasSubmission(current) : false;
      const resumable: Resumable | null = unanswered
        ? { deliveryId: state.currentDeliveryId, draft: state.draft, helpOpen: state.helpOpen, helpStep: state.helpStep, explanationOpen: state.explanationOpen, explanationStep: state.explanationStep }
        : null;
      return { ...updateCurrent(state, (d) => recordEvent(d, { type: "ended" })), resumable, presenting: false };
    }
    case "finish": {
      // "Finish practice" (specs/005 contracts/session.md): close the question as leaving practice does (an
      // unanswered one stays resumable), snapshot the session's questions as they are now, release the question,
      // and start the next session. Repeats are judged against the whole record, not the session alone.
      const ended = reducer(state, { type: "end" });
      const resumableId = ended.resumable?.deliveryId ?? null;
      const ordered = repeats(ended.deliveries);
      const questions = ended.session.current.flatMap((id) => {
        const d = ended.deliveries.find((x) => x.id === id);
        const outcome = d ? derive(d, { resumable: id === resumableId }).outcome : "none";
        return d && outcome !== "none" ? [{ id, outcome, repeat: repeatKind(d, ordered) }] : [];
      });
      return {
        ...ended,
        instance: null,
        currentDeliveryId: null,
        draft: "",
        helpOpen: false,
        helpSteps: [],
        helpStep: -1,
        explanationOpen: false,
        explanationSteps: [],
        explanationStep: -1,
        result: null,
        checking: false,
        session: { current: [], last: { finishedAt: action.at, questions } },
      };
    }
    case "lessonViewed":
      return { ...state, lessonViews: [...state.lessonViews, action.view] };
    case "clear":
      return { ...state, ...initialPersisted, language: state.language, check: null };
    case "checkStart":
    case "checkOpen":
    case "checkLeave":
    case "checkInstance":
    case "checkLoadError":
    case "checkDraft":
    case "checkSaving":
    case "checkNotice":
    case "checkEvent":
    case "checkSwitch":
    case "checkPanels":
    case "checkResult":
    case "checkStep":
      return checkReducer(state, action);
    default:
      return state;
  }
}

export interface StoreApi {
  state: State;
  setLanguage(language: Lang): void;
  /** `originLessonId`: the lesson whose practice entry was chosen; it carries over through the practice run. */
  startPractice(skillId: string, preferred?: DefinitionRef, originLessonId?: string): Promise<void>;
  nextQuestion(request: "another" | "same"): Promise<void>;
  setDraft(draft: string): void;
  submit(): Promise<void>;
  toggleHelp(): Promise<void>;
  nextHelpStep(): Promise<void>;
  toggleExplanation(): Promise<void>;
  nextExplanationStep(): Promise<void>;
  requestChallenge(request: "easier" | "harder"): void;
  /** Records the lesson visit on the delivery it began with, once the lesson content is shown (specs/003). */
  lessonShown(visit: { deliveryId: string | null; detour: boolean; discloses: boolean; fromQuestion: boolean }): void;
  /** Records that a lesson's content was shown in a visit; the page calls it once per visit (specs/004). */
  lessonViewed(lessonId: string, language: Lang): void;
  /** "Show visual help instead": help opens through toggleHelp() when the practice view next presents this question. */
  showHelpInstead(): void;
  /** Re-resolves the current question when it was stored before instances carried their lessons; false on failure. */
  ensureInstanceLessons(): Promise<boolean>;
  /**
   * "Repeat this question" (specs/005 contracts/repeat.md): the delivery's identity again, as a new question with a
   * fresh state, moving practice to its skill when needed. Resolves to that skill, or null when it could not be
   * loaded or `signal` abandoned it.
   */
  repeatQuestion(deliveryId: string, signal?: AbortSignal): Promise<string | null>;
  endSession(): void;
  /** "Finish practice" (specs/005 contracts/session.md): ends the session and keeps its summary in `session.last`. */
  finishPractice(): void;
  clearRecord(): void;
  dismissNotice(): void;
  /**
   * "Start the check" (specs/006 contracts/check-run.md): the check's newest version, ending an unfinished run of the
   * same skill. Resolves to the new run's ID, or null when the check cannot be loaded. A start still under way when
   * `signal` aborts (the start screen is left) or the record is cleared creates nothing and resolves to null.
   */
  startCheck(checkId: string, signal?: AbortSignal): Promise<string | null>;
  /** The run page is mounted: presents the run and, while it is unfinished, loads the question at its position. */
  openRun(runId: string): Promise<void>;
  /** Fetches the current question again after a failed load. */
  retryCheckQuestion(): Promise<void>;
  setCheckDraft(draft: string): void;
  /** "Save answer" in the independent part: validates, records the only submission, and moves on, showing no result. */
  saveCheckAnswer(): Promise<void>;
  /** "Skip": records `skipped` and moves on. */
  skipCheckQuestion(): Promise<void>;
  /** The run page unmounts; the run keeps its `resume`. */
  leaveCheck(): void;
  /** "Switch to supported practice": `switchAt` becomes the current position, for good; the draft stays. */
  switchToSupported(): void;
  /** "Check answer" on a supported question: practice's submit, with feedback and retries. */
  submitCheckAnswer(): Promise<void>;
  /** Opens or closes a supported question's help or explanation; opening records it, as in practice. */
  toggleCheckPanel(kind: StepKind): void;
  /** Fetches the next help or explanation step; it is recorded only when shown. */
  nextCheckStep(kind: StepKind): Promise<void>;
  /** "Next question", or "See summary" on the last one: only after a submission. */
  nextCheckQuestion(): Promise<void>;
  /** "Show visual help instead" from a lesson's notice: help opens when the run page next shows that question. */
  showCheckHelpInstead(runId: string): void;
}

const StoreContext = createContext<StoreApi | null>(null);

export interface StoreProviderProps {
  children: ReactNode;
  api?: PracticeApi;
  storage?: Storage<PersistedState>;
}

const persistedOf = (s: State): PersistedState => {
  const { kept: _kept, checking: _checking, notice: _notice, loadError: _loadError, presenting: _presenting, check: _check, ...persisted } = s;
  return persisted;
};

export function StoreProvider({ children, api = practiceApi, storage }: StoreProviderProps) {
  const store = useMemo(() => storage ?? createStorage<PersistedState>(), [storage]);
  const [state, dispatch] = useReducer(reducer, undefined, (): State => {
    const loaded = store.load();
    const value = loaded.value ?? {};
    return { ...initialPersisted, ...value, session: loaded.value ? sessionOf(loaded.value) : initialPersisted.session, checkRuns: loaded.value?.checkRuns ?? [], kept: loaded.kept, checking: false, notice: null, loadError: false, presenting: false, check: null };
  });
  const checkToken = useRef(0); // the check's own load token: a check load never supersedes practice's, or the reverse
  const checkStarts = useRef(0); // a check start still under way belongs to the record it began in
  const latest = useRef(state);
  latest.current = state;
  const loadToken = useRef(0); // only the most recent instance request may become the current question
  const practiceRun = useRef(0); // a practice start still under way belongs to the run it began in
  const pendingHelpOpen = useRef<string | null>(null); // "Show visual help instead", for this delivery
  const pendingCheckHelp = useRef<{ runId: string; position: number } | null>(null); // the same, for a supported check question

  useEffect(() => {
    const kept = store.save(persistedOf(state));
    if (kept !== state.kept) dispatch({ type: "kept", kept });
  }, [state, store]);

  const toDelivery = useCallback((instance: InstanceDto, originLessonId?: string, repeat?: Pick<Delivery, "repeatOf" | "repeatReason">, purpose: Delivery["purpose"] = "practice"): Delivery => {
    const d: Delivery["instance"] = {
      definitionId: instance.identity.definitionId,
      version: instance.identity.version,
      validatorName: instance.validator.name,
      validatorVersion: instance.validator.version,
      a: instance.a,
      b: instance.b,
    };
    if (instance.identity.seed !== undefined) d.seed = instance.identity.seed;
    if (instance.generator) d.generatorVersion = instance.generator.version;
    if (instance.form && instance.form !== "addition") d.form = instance.form;
    const delivery: Delivery = { id: newId(), instance: d, purpose, provenance: "guest", startedAt: new Date().toISOString(), events: [] };
    if (originLessonId) delivery.originLessonId = originLessonId;
    if (repeat?.repeatOf) delivery.repeatOf = repeat.repeatOf;
    if (repeat?.repeatReason) delivery.repeatReason = repeat.repeatReason;
    return delivery;
  }, []);

  /** A variation's pool, fetched at most once per visit; null when it cannot be loaded (questions are then delivered as before). */
  const pools = useRef(new Map<string, PoolDto>());
  const poolFor = useCallback(
    async (ref: DefinitionRef): Promise<PoolDto | null> => {
      const key = `${ref.definition}@${ref.version}`;
      const cached = pools.current.get(key);
      if (cached) return cached;
      try {
        const pool = await api.getPool(ref.definition, ref.version);
        pools.current.set(key, pool);
        return pool;
      } catch {
        return null;
      }
    },
    [api],
  );

  /**
   * Loads a fresh question; returns it when it became the current one, else null. `applied` is the pending change it
   * fulfils; `clearPending` drops a pending change an explicit selection supersedes. Both take effect only with the
   * question. `repeat` asks for that seed again, as a repeat on request of the delivery `of`, with no avoidance.
   * `signal` abandons the request: once it is aborted, nothing is recorded and no error is shown.
   */
  const load = useCallback(
    async (
      ref: DefinitionRef,
      fixed: boolean,
      commit: { applied?: PendingChange; clearPending?: boolean; origin?: string | null; repeat?: { of: string; seed: string | null }; signal?: AbortSignal | undefined } = {},
    ): Promise<InstanceDto | null> => {
      const token = ++loadToken.current;
      const stale = () => token !== loadToken.current || commit.signal?.aborted === true; // superseded or abandoned
      // The lesson that started this practice run carries over to every later question of the run (specs/003).
      const current = latest.current;
      const continued = current.deliveries.find((x) => x.id === current.currentDeliveryId)?.originLessonId;
      const origin = commit.origin === undefined ? continued : (commit.origin ?? undefined);
      const { origin: _origin, repeat: requested, signal: _signal, ...questionCommit } = commit;
      try {
        let instance = await api.getInstance(ref.definition, ref.version, requested ? requested.seed : fixed ? null : newSeed());
        if (stale()) return null;
        // specs/005: a question the learner did not choose avoids the variation's last eight, in either order.
        const window = recentWindow(latest.current.deliveries, ref.definition, ref.version);
        const recent = new Set(window.map((d) => pairKey(d.instance.a, d.instance.b)));
        let repeat: Pick<Delivery, "repeatOf" | "repeatReason"> | undefined;
        if (requested) {
          repeat = { repeatOf: requested.of, repeatReason: "requested" };
          // From a replay, practice moves to the question's skill and its ladder; the position follows the question.
          const now = latest.current;
          if (now.skillId !== instance.skill || !now.instance) {
            const skill = await api.getSkill(instance.skill);
            if (stale()) return null;
            dispatch({ type: "ladder", skillId: skill.id, entries: skill.ladder, current: ref });
            questionCommit.clearPending = true; // a pending change belonged to the practice that was left
          }
        } else if (recent.has(pairKey(instance.a, instance.b))) {
          const pool = await poolFor(ref);
          if (stale()) return null;
          const choice = pool ? choose({ seed: instance.identity.seed ?? null, a: instance.a, b: instance.b }, recent, pool.questions) : { kind: "fresh" as const };
          if (choice.kind === "chosen") {
            instance = await api.getInstance(ref.definition, ref.version, choice.seed); // the first draw is never shown or recorded
            if (stale()) return null;
          } else if (choice.kind === "exhausted") {
            const key = pairKey(instance.a, instance.b);
            repeat = { repeatReason: "exhausted", repeatOf: [...window].reverse().find((d) => pairKey(d.instance.a, d.instance.b) === key)!.id };
          }
        }
        dispatch({ type: "question", instance, delivery: toDelivery(instance, origin, repeat), ...questionCommit });
        if (repeat?.repeatReason === "exhausted") dispatch({ type: "notice", notice: { key: "practice.poolExhausted" } });
        else if (questionNotices.has(latest.current.notice?.key ?? "")) dispatch({ type: "notice", notice: null }); // true only of the question it came with
        return instance;
      } catch {
        if (!stale()) dispatch({ type: "loadError", failed: true });
        return null;
      }
    },
    [api, toDelivery, poolFor],
  );

  /** Resumes the unanswered question; "cancelled" when a later request or a finish superseded it, "failed" on an error. */
  const resume = useCallback(
    async (resumable: Resumable): Promise<"resumed" | "cancelled" | "failed"> => {
      const delivery = latest.current.deliveries.find((d) => d.id === resumable.deliveryId);
      if (!delivery) return "failed";
      const token = ++loadToken.current;
      try {
        const identity = identityOf(delivery);
        const instance = await api.getInstance(identity.definitionId, identity.version, identity.seed ?? null);
        if (token !== loadToken.current) return "cancelled";
        // Steps that cannot be fetched again start over rather than keep the question from resuming.
        const stepsUpTo = (kind: StepKind, last: number) =>
          Promise.all(Array.from({ length: last + 1 }, (_, i) => api.getStep(instance.identity, kind, i))).catch(() => []);
        const restored = { help: await stepsUpTo("help", resumable.helpStep), explanation: await stepsUpTo("explanation", resumable.explanationStep) };
        if (token !== loadToken.current) return "cancelled";
        dispatch({ type: "question", instance, delivery, resumedFrom: resumable, restored });
        dispatch({ type: "notice", notice: { key: "practice.resumed" } });
        return "resumed";
      } catch {
        return token !== loadToken.current ? "cancelled" : "failed";
      }
    },
    [api],
  );

  // Opening help is recorded on this one path (spec 002), whether the learner pressed "Show visual help" or chose
  // "Show visual help instead" on a lesson's notice (specs/003 contracts/detour.md).
  const openHelp = useCallback(() => {
    dispatch({ type: "help", open: true });
    dispatch({ type: "event", event: { type: "support", kind: "visual-help-opened" } });
  }, []);

  /** Carries out "Show visual help instead" once the practice view presents that same question; drops it otherwise. */
  const consumePendingHelp = useCallback(() => {
    const wanted = pendingHelpOpen.current;
    pendingHelpOpen.current = null;
    const current = latest.current;
    if (wanted && wanted === current.currentDeliveryId && !current.helpOpen && (current.instance?.representations.help.length ?? 0) > 0) openHelp();
  }, [openHelp]);

  const startPracticeOnly = useCallback(
    async (skillId: string, preferred?: DefinitionRef, originLessonId?: string) => {
      dispatch({ type: "present" }); // the practice view is mounted (its unmount dispatches "end")
      const current = latest.current;
      // An explicitly chosen variation (a lesson's practice button) that differs from the one in progress or
      // the one that would be resumed replaces it; the practice route itself passes no preference and resumes.
      const differsFrom = (ref: DefinitionRef | null | undefined) =>
        preferred !== undefined && (!ref || ref.definition !== preferred.definition || ref.version !== preferred.version);
      if (current.skillId === skillId && current.instance && current.currentDeliveryId) {
        if (!preferred || !differsFrom(current.ladder.current)) return; // already in progress
        // The ladder position and the dropped pending change commit with the loaded question; on failure the
        // question in progress and its ladder position stay as they were, and the selection can be retried.
        await load(preferred, false, { clearPending: true, origin: originLessonId ?? null });
        return;
      }
      const run = practiceRun.current;
      const skill = await api.getSkill(skillId);
      if (run !== practiceRun.current) return; // finished or cleared while the skill was on its way
      const first = preferred ?? (skill.ladder[0] ? { definition: skill.ladder[0].definition, version: skill.ladder[0].version } : null);
      if (!first) return;
      dispatch({ type: "ladder", skillId, entries: skill.ladder, current: first });
      const resumable = current.resumable;
      const resumableDelivery = resumable ? current.deliveries.find((d) => d.id === resumable.deliveryId) : undefined;
      // Only a question of this skill resumes here (PR 63 review): an unanswered addition question stays resumable
      // from addition practice, and is not shown under the equations ladder.
      const ofSkill = resumableDelivery ? skill.definitions.includes(`${resumableDelivery.instance.definitionId}@${resumableDelivery.instance.version}`) : false;
      const resumeFits = resumableDelivery ? ofSkill && !differsFrom({ definition: resumableDelivery.instance.definitionId, version: resumableDelivery.instance.version }) : false;
      if (resumable && resumeFits && (await resume(resumable)) !== "failed") return;
      if (run !== practiceRun.current) return;
      // A new practice run: its origin, or none. A pending change of another skill's practice is dropped with the
      // first question of this one (PR 63 review), as a selection's is.
      await load(first, false, { origin: originLessonId ?? null, clearPending: current.skillId !== null && current.skillId !== skillId });
    },
    [api, load, resume],
  );

  /**
   * Fetches the question at `position` of the run (default: its position as last rendered). A run's question is always
   * its listed identity, never avoided. Callers that just dispatched a move pass the new position, since `latest` is
   * only updated by the next render.
   */
  const loadCheckQuestion = useCallback(async (runId: string, at?: number) => {
    const run = latest.current.checkRuns.find((r) => r.id === runId);
    if (!run || !isUnfinished(run)) return;
    const token = ++checkToken.current;
    const position = at ?? run.position;
    const question = run.questions[position - 1];
    if (!question) return;
    try {
      const instance = await api.getInstance(question.definitionId, question.version, question.seed ?? null);
      if (token !== checkToken.current) return;
      // A reached question is the one recorded: an identity that now resolves to other operands is not shown, so an
      // answer can never be recorded against operands the learner did not see (PR 53 review). The run and draft stay.
      const recorded = run.deliveries[position - 1];
      if (recorded && (recorded.instance.a !== instance.a || recorded.instance.b !== instance.b)) {
        dispatch({ type: "checkLoadError", runId: run.id, error: "changed" });
        return;
      }
      // A resumed supported question shows the steps it had reached; they were recorded when first shown. Only the
      // rendered position has a `resume` of its own: after a move on, `latest` still holds the previous one's.
      const resume = at === undefined && partOf(run, position) === "supported" ? run.resume : null;
      let restored: RestoredSteps | undefined;
      if (resume) {
        const stepsUpTo = (kind: StepKind, last: number) =>
          Promise.all(Array.from({ length: last + 1 }, (_, i) => api.getStep(instance.identity, kind, i))).catch(() => []);
        restored = { help: await stepsUpTo("help", resume.helpStep), explanation: await stepsUpTo("explanation", resume.explanationStep) };
        if (token !== checkToken.current) return;
      }
      dispatch({ type: "checkInstance", runId: run.id, position, instance, delivery: run.deliveries[position - 1] ?? toDelivery(instance, undefined, undefined, "check"), ...(restored ? { restored } : {}) });
      const wanted = pendingCheckHelp.current;
      pendingCheckHelp.current = null;
      if (wanted?.runId === run.id && wanted.position === position && partOf(run, position) === "supported" && !resume?.helpOpen && instance.representations.help.length > 0) {
        dispatch({ type: "checkPanels", runId: run.id, position, panels: { helpOpen: true } });
        dispatch({ type: "checkEvent", runId: run.id, position, event: { type: "support", kind: "visual-help-opened" }, advance: false, at: new Date().toISOString() });
      }
    } catch {
      if (token === checkToken.current) dispatch({ type: "checkLoadError", runId: run.id, error: "failed" });
    }
  }, [api, toDelivery]);

  /** The shown run, its current position, and that position's delivery, while the run is unfinished. */
  const shownQuestion = useCallback(() => {
    const current = latest.current;
    const screen = current.check;
    const run = screen ? current.checkRuns.find((r) => r.id === screen.runId) : undefined;
    const delivery = run?.deliveries[run.position - 1];
    if (!screen || !run || !isUnfinished(run) || !screen.instance || !delivery) return null;
    return { screen, run, delivery, position: run.position };
  }, []);

  const value = useMemo<StoreApi>(
    () => ({
      state,
      setLanguage: (language) => dispatch({ type: "language", language }),
      async startPractice(skillId, preferred, originLessonId) {
        try {
          await startPracticeOnly(skillId, preferred, originLessonId);
        } finally {
          consumePendingHelp();
        }
      },
      async nextQuestion(request) {
        const current = latest.current;
        const pending = current.ladder.pending;
        if (request === "same" && pending) {
          dispatch({ type: "event", event: { type: "challenge-request", request: "same", outcome: "cleared" } });
          dispatch({ type: "pending", pending: null });
          dispatch({ type: "notice", notice: { key: "ladder.cleared" } });
        } else {
          dispatch({ type: "event", event: { type: "challenge-request", request, outcome: "requested" } });
        }
        // A pending change applies only on its own ladder: one left from another skill never loads here.
        const onLadder = pending ? current.ladder.entries.some((e) => e.definition === pending.definition && e.version === pending.version) : false;
        const applying = request === "another" && pending && onLadder ? pending : null;
        const target: DefinitionRef | null = applying ?? current.ladder.current;
        if (!target) return;
        await load(target, false, applying ? { applied: applying } : {}); // the applied event and the clearing commit with the question
      },
      setDraft: (draft) => dispatch({ type: "draft", draft }),
      async submit() {
        const current = latest.current;
        const deliveryId = current.currentDeliveryId;
        if (!current.instance || !deliveryId || current.checking) return;
        const submissionId = newId();
        dispatch({ type: "checking", checking: true, deliveryId });
        try {
          const result = await api.validate(current.instance.identity, current.draft, submissionId);
          const event: Event =
            result.status === "invalid-response"
              ? { type: "input-guidance", submissionId, originalText: current.draft, code: result.code }
              : { type: "submission", submissionId, originalText: current.draft, value: Number(result.values.v), status: result.status, code: result.code };
          dispatch({ type: "result", result, event, deliveryId });
        } catch {
          dispatch({ type: "checking", checking: false, deliveryId });
          if (latest.current.currentDeliveryId === deliveryId) dispatch({ type: "notice", notice: { key: "practice.unreachable" } });
        }
      },
      async toggleHelp() {
        const current = latest.current;
        if (current.helpOpen) {
          dispatch({ type: "help", open: false });
          return;
        }
        openHelp();
      },
      async nextHelpStep() {
        const current = latest.current;
        const deliveryId = current.currentDeliveryId;
        if (!current.instance || !deliveryId) return;
        const index = current.helpStep + 1;
        if (current.helpSteps[0] && index >= current.helpSteps[0].count) return;
        const step = await api.getStep(current.instance.identity, "help", index);
        dispatch({ type: "helpStep", step, deliveryId }); // shown and recorded together, or neither
      },
      async toggleExplanation() {
        const current = latest.current;
        if (current.explanationOpen) {
          dispatch({ type: "explanation", open: false });
          return;
        }
        dispatch({ type: "explanation", open: true });
        dispatch({ type: "event", event: { type: "support", kind: "explanation-open" } });
      },
      async nextExplanationStep() {
        const current = latest.current;
        const deliveryId = current.currentDeliveryId;
        if (!current.instance || !deliveryId) return;
        const index = current.explanationStep + 1;
        if (current.explanationSteps[0] && index >= current.explanationSteps[0].count) return;
        const step = await api.getStep(current.instance.identity, "explanation", index);
        dispatch({ type: "explanationStep", step, deliveryId }); // shown and recorded together, or neither
      },
      requestChallenge(request) {
        const current = latest.current;
        const entries = current.ladder.entries;
        const position = entries.findIndex((e) => e.definition === current.ladder.current?.definition && e.version === current.ladder.current?.version);
        const target = entries[request === "easier" ? position - 1 : position + 1];
        if (position < 0 || !target) {
          dispatch({ type: "event", event: { type: "challenge-request", request, outcome: "unavailable" } });
          dispatch({ type: "notice", notice: { key: request === "easier" ? "ladder.noEasier" : "ladder.noHarder" } });
          return;
        }
        dispatch({ type: "event", event: { type: "challenge-request", request, outcome: "requested" } });
        dispatch({ type: "pending", pending: { definition: target.definition, version: target.version, request } });
        dispatch({ type: "notice", notice: null });
      },
      lessonShown({ deliveryId, detour, discloses, fromQuestion }) {
        const current = latest.current;
        // Practice's question, or a supported check question (`?from=check`, research R10).
        const delivery = deliveryId ? (current.deliveries.find((d) => d.id === deliveryId) ?? current.checkRuns.flatMap((r) => r.deliveries).find((d) => d.id === deliveryId)) : undefined;
        if (!delivery || !deliveryId) return;
        // The recording table of specs/003 contracts/detour.md: one event, only once the lesson is shown.
        const kind = detour ? (discloses ? "lesson-reveal" : "lesson-opened") : fromQuestion && hasCorrect(delivery) ? "lesson-opened" : null;
        if (kind) dispatch({ type: "event", event: { type: "support", kind }, deliveryId });
      },
      lessonViewed(lessonId, language) {
        dispatch({ type: "lessonViewed", view: { lessonId, language, at: new Date().toISOString() } });
      },
      showHelpInstead() {
        pendingHelpOpen.current = latest.current.currentDeliveryId;
      },
      async ensureInstanceLessons() {
        const current = latest.current;
        const deliveryId = current.currentDeliveryId;
        if (!current.instance || !deliveryId || current.instance.lessons) return true;
        const { definitionId, version, seed } = current.instance.identity;
        try {
          const instance = await api.getInstance(definitionId, version, seed ?? null);
          // Only a service that knows lessons answers with the field; never invent "no lessons" from its absence.
          if (!instance.lessons) return false;
          dispatch({ type: "instanceLessons", deliveryId, lessons: instance.lessons });
          return true;
        } catch {
          return false; // the caller keeps the lesson behind the notice rather than guess
        }
      },
      async repeatQuestion(deliveryId, signal) {
        const source = latest.current.deliveries.find((d) => d.id === deliveryId);
        if (!source) return null;
        const { definitionId, version, seed } = identityOf(source);
        const instance = await load({ definition: definitionId, version }, false, { repeat: { of: deliveryId, seed: seed ?? null }, signal });
        return instance ? instance.skill : null;
      },
      endSession: () => dispatch({ type: "end" }),
      finishPractice() {
        loadToken.current++; // a question still on its way belongs to the finished session
        practiceRun.current++; // and so does a practice start still under way
        dispatch({ type: "finish", at: new Date().toISOString() });
      },
      clearRecord() {
        loadToken.current++; // a question still on its way belongs to the record being cleared
        practiceRun.current++;
        checkToken.current++;
        checkStarts.current++;
        store.clear();
        dispatch({ type: "clear" });
      },
      dismissNotice: () => dispatch({ type: "notice", notice: null }),
      async startCheck(checkId, signal) {
        const token = ++checkStarts.current;
        let check;
        try {
          check = (await api.getChecks()).find((c) => c.id === checkId);
        } catch {
          return null;
        }
        // Left or cleared while the list was on its way: no run is created, and no older one is ended (PR 53 review).
        if (token !== checkStarts.current || signal?.aborted) return null;
        if (!check || check.questions.length === 0) return null;
        const at = new Date().toISOString();
        const run: CheckRun = {
          id: newId(),
          checkId: check.id,
          checkVersion: check.version,
          skillId: check.skill,
          questions: check.questions.map((q) => (q.seed === undefined ? { definitionId: q.definition, version: q.version } : { definitionId: q.definition, version: q.version, seed: q.seed })),
          deliveries: [],
          position: 1,
          switchAt: null,
          startedAt: at,
          resume: null,
        };
        dispatch({ type: "checkStart", run, at });
        return run.id;
      },
      async openRun(runId) {
        dispatch({ type: "checkOpen", runId });
        await loadCheckQuestion(runId);
      },
      async retryCheckQuestion() {
        const screen = latest.current.check;
        if (!screen) return;
        dispatch({ type: "checkLoadError", runId: screen.runId, error: false });
        await loadCheckQuestion(screen.runId);
      },
      setCheckDraft(draft) {
        const screen = latest.current.check;
        if (screen) dispatch({ type: "checkDraft", runId: screen.runId, draft });
      },
      async saveCheckAnswer() {
        const shown = shownQuestion();
        if (!shown || shown.screen.checking) return;
        const { run, position, delivery, screen } = shown;
        const draft = run.resume?.draft ?? "";
        const submissionId = newId();
        const token = checkToken.current;
        dispatch({ type: "checkSaving", runId: run.id, checking: true });
        dispatch({ type: "checkNotice", runId: run.id, notice: null });
        let result: ValidationResponse;
        try {
          result = await api.validate(identityOf(delivery), draft, submissionId);
        } catch {
          if (token !== checkToken.current) return;
          // Not saved: nothing is recorded, and the draft stays to save again.
          dispatch({ type: "checkSaving", runId: run.id, checking: false });
          dispatch({ type: "checkNotice", runId: run.id, notice: { kind: "unsaved" } });
          return;
        }
        // A response to a screen that is gone (the page left, the record cleared, another question loaded) belongs to
        // none: nothing is recorded or loaded, and the question on screen now keeps its own state (PR 53 review).
        if (token !== checkToken.current) return;
        const at = new Date().toISOString();
        if (result.status === "invalid-response") {
          dispatch({ type: "checkEvent", runId: run.id, position, event: { type: "input-guidance", submissionId, originalText: draft, code: result.code }, advance: false, at });
          dispatch({ type: "checkSaving", runId: run.id, checking: false });
          dispatch({ type: "checkNotice", runId: run.id, notice: { kind: "guidance", code: result.code, text: draft } });
          return;
        }
        // The question's only submission; the response itself never reaches the screen.
        const event: Event = { type: "submission", submissionId, originalText: draft, value: Number(result.values.v), status: result.status, code: result.code };
        dispatch({ type: "checkEvent", runId: run.id, position, event, advance: true, at });
        if (position < run.questions.length) await loadCheckQuestion(run.id, position + 1);
      },
      async skipCheckQuestion() {
        const shown = shownQuestion();
        if (!shown || shown.screen.checking) return;
        const { run, position } = shown;
        if (partOf(run, position) === "supported" && hasSubmission(shown.delivery)) return; // after an answer, only "Next question"
        dispatch({ type: "checkEvent", runId: run.id, position, event: { type: "skipped" }, advance: true, at: new Date().toISOString() });
        if (position < run.questions.length) await loadCheckQuestion(run.id, position + 1);
      },
      leaveCheck() {
        checkToken.current++; // a question still on its way belongs to the page being left
        dispatch({ type: "checkLeave" });
      },
      switchToSupported() {
        const shown = shownQuestion();
        if (!shown || shown.screen.checking || shown.run.switchAt !== null) return;
        dispatch({ type: "checkSwitch", runId: shown.run.id, position: shown.position });
      },
      async submitCheckAnswer() {
        const shown = shownQuestion();
        if (!shown || shown.screen.checking || partOf(shown.run, shown.position) !== "supported") return;
        const { run, position, delivery } = shown;
        const draft = run.resume?.draft ?? "";
        const submissionId = newId();
        const token = checkToken.current;
        dispatch({ type: "checkSaving", runId: run.id, checking: true });
        let result: ValidationResponse;
        try {
          result = await api.validate(identityOf(delivery), draft, submissionId);
        } catch {
          if (token !== checkToken.current) return;
          dispatch({ type: "checkSaving", runId: run.id, checking: false });
          dispatch({ type: "checkNotice", runId: run.id, notice: { kind: "unsaved" } });
          return;
        }
        // A response to a screen that is gone (the page left, the record cleared, another question loaded) belongs to
        // none: nothing is recorded or loaded, and the question on screen now keeps its own state (PR 53 review).
        if (token !== checkToken.current) return;
        const event: Event =
          result.status === "invalid-response"
            ? { type: "input-guidance", submissionId, originalText: draft, code: result.code }
            : { type: "submission", submissionId, originalText: draft, value: Number(result.values.v), status: result.status, code: result.code };
        dispatch({ type: "checkResult", runId: run.id, position, event, result });
      },
      toggleCheckPanel(kind) {
        const shown = shownQuestion();
        if (!shown || partOf(shown.run, shown.position) !== "supported") return;
        const { run, position } = shown;
        const resume = run.resume ?? emptyResume();
        const open = kind === "help" ? resume.helpOpen : resume.explanationOpen;
        dispatch({ type: "checkPanels", runId: run.id, position, panels: kind === "help" ? { helpOpen: !open } : { explanationOpen: !open } });
        if (open) return;
        // Opening is recorded on this one path, as in practice (spec 002).
        const event: Event = { type: "support", kind: kind === "help" ? "visual-help-opened" : "explanation-open" };
        dispatch({ type: "checkEvent", runId: run.id, position, event, advance: false, at: new Date().toISOString() });
      },
      async nextCheckStep(kind) {
        const shown = shownQuestion();
        const instance = shown?.screen.instance;
        if (!shown || !instance || partOf(shown.run, shown.position) !== "supported") return;
        const { run, position, screen } = shown;
        const resume = run.resume ?? emptyResume();
        const index = (kind === "help" ? resume.helpStep : resume.explanationStep) + 1;
        const steps = kind === "help" ? screen.helpSteps : screen.explanationSteps;
        if (steps[0] && index >= steps[0].count) return;
        const token = checkToken.current;
        let step: StepDto;
        try {
          step = await api.getStep(instance.identity, kind, index);
        } catch {
          return; // nothing shown, nothing recorded
        }
        if (token !== checkToken.current) return; // asked for on a screen that is gone
        dispatch({ type: "checkStep", runId: run.id, position, kind, step }); // shown and recorded together, or neither
      },
      async nextCheckQuestion() {
        const shown = shownQuestion();
        if (!shown || shown.screen.checking || partOf(shown.run, shown.position) !== "supported" || !hasSubmission(shown.delivery)) return;
        const { run, position } = shown;
        dispatch({ type: "checkEvent", runId: run.id, position, event: null, advance: true, at: new Date().toISOString() });
        if (position < run.questions.length) await loadCheckQuestion(run.id, position + 1);
      },
      showCheckHelpInstead(runId) {
        const run = latest.current.checkRuns.find((r) => r.id === runId);
        pendingCheckHelp.current = run ? { runId, position: run.position } : null;
      },
    }),
    [api, load, state, store, startPracticeOnly, consumePendingHelp, openHelp, loadCheckQuestion, shownQuestion],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreApi {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useStore must be used inside StoreProvider");
  return store;
}

export const challengeRequestOf = (request: ChallengeRequest) => request;
