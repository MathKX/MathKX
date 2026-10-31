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
}

/** The questions worked in the current session, and a snapshot of the last finished one (specs/005). */
export interface PracticeSession {
  current: string[];
  last: { finishedAt: string; questions: { id: string; outcome: Exclude<Outcome, "none">; repeat: RepeatKind | null }[] } | null;
}

/** A record written before specs/005 has no session: every question in it belongs to the first one. */
const sessionOf = (value: Partial<PersistedState>): PracticeSession =>
  value.session ?? { current: (value.deliveries ?? []).map((d) => d.id), last: null };

export interface State extends PersistedState {
  kept: boolean;
  checking: boolean;
  notice: { key: string; params?: Record<string, string | number> } | null;
  loadError: boolean;
  /** The practice view is mounted. A step is presented, and so recorded, only while it is and its panel is open. */
  presenting: boolean;
}

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
  | { type: "clear" };

function updateDelivery(state: State, deliveryId: string | null | undefined, fn: (d: Delivery) => Delivery): State {
  if (!deliveryId) return state;
  return { ...state, deliveries: state.deliveries.map((d) => (d.id === deliveryId ? fn(d) : d)) };
}

const updateCurrent = (state: State, fn: (d: Delivery) => Delivery): State => updateDelivery(state, state.currentDeliveryId, fn);

const isCurrent = (state: State, deliveryId: string) => state.currentDeliveryId === deliveryId;

/** Notices about the question they came with; the next question clears them. */
const questionNotices = new Set(["practice.poolExhausted", "practice.resumed"]);

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "hydrate":
      return { ...state, ...action.state, lessonViews: action.state.lessonViews ?? [], session: sessionOf(action.state), kept: action.kept };
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
    case "helpStep": {
      // Not presented (the learner moved on, closed the panel, or left the view): nothing shown, nothing recorded.
      if (!isCurrent(state, action.deliveryId) || !state.presenting || !state.helpOpen) return state;
      const { step } = action;
      const events: Event[] = [{ type: "support", kind: "help-step", step: step.index, reveals: step.reveals }];
      if (step.reveals && step.representation === "groups") events.push({ type: "support", kind: "counting-complete" });
      const recorded = updateCurrent(state, (d) => events.reduce(recordEvent, d));
      return { ...recorded, helpSteps: [...state.helpSteps.slice(0, step.index), step], helpStep: step.index };
    }
    case "explanation":
      return { ...state, explanationOpen: action.open };
    case "explanationStep": {
      if (!isCurrent(state, action.deliveryId) || !state.presenting || !state.explanationOpen) return state;
      const { step } = action;
      const recorded = updateCurrent(state, (d) => recordEvent(d, { type: "support", kind: "explanation-step", step: step.index, reveals: step.reveals }));
      return { ...recorded, explanationSteps: [...state.explanationSteps.slice(0, step.index), step], explanationStep: step.index };
    }
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
      return { ...state, ...initialPersisted, language: state.language };
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
}

const StoreContext = createContext<StoreApi | null>(null);

export interface StoreProviderProps {
  children: ReactNode;
  api?: PracticeApi;
  storage?: Storage<PersistedState>;
}

const persistedOf = (s: State): PersistedState => {
  const { kept: _kept, checking: _checking, notice: _notice, loadError: _loadError, presenting: _presenting, ...persisted } = s;
  return persisted;
};

export function StoreProvider({ children, api = practiceApi, storage }: StoreProviderProps) {
  const store = useMemo(() => storage ?? createStorage<PersistedState>(), [storage]);
  const [state, dispatch] = useReducer(reducer, undefined, (): State => {
    const loaded = store.load();
    const value = loaded.value ?? {};
    return { ...initialPersisted, ...value, session: loaded.value ? sessionOf(loaded.value) : initialPersisted.session, kept: loaded.kept, checking: false, notice: null, loadError: false, presenting: false };
  });
  const latest = useRef(state);
  latest.current = state;
  const loadToken = useRef(0); // only the most recent instance request may become the current question
  const practiceRun = useRef(0); // a practice start still under way belongs to the run it began in
  const pendingHelpOpen = useRef<string | null>(null); // "Show visual help instead", for this delivery

  useEffect(() => {
    const kept = store.save(persistedOf(state));
    if (kept !== state.kept) dispatch({ type: "kept", kept });
  }, [state, store]);

  const toDelivery = useCallback((instance: InstanceDto, originLessonId?: string, repeat?: Pick<Delivery, "repeatOf" | "repeatReason">): Delivery => {
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
    const delivery: Delivery = { id: newId(), instance: d, purpose: "practice", provenance: "guest", startedAt: new Date().toISOString(), events: [] };
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
      const resumeFits = resumableDelivery ? !differsFrom({ definition: resumableDelivery.instance.definitionId, version: resumableDelivery.instance.version }) : false;
      if (resumable && resumeFits && (await resume(resumable)) !== "failed") return;
      if (run !== practiceRun.current) return;
      await load(first, false, { origin: originLessonId ?? null }); // a new practice run: its origin, or none
    },
    [api, load, resume],
  );

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
        const applying = request === "another" && pending ? pending : null;
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
        const delivery = deliveryId ? latest.current.deliveries.find((d) => d.id === deliveryId) : undefined;
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
        store.clear();
        dispatch({ type: "clear" });
      },
      dismissNotice: () => dispatch({ type: "notice", notice: null }),
    }),
    [api, load, state, store, startPracticeOnly, consumePendingHelp, openHelp],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreApi {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useStore must be used inside StoreProvider");
  return store;
}

export const challengeRequestOf = (request: ChallengeRequest) => request;
