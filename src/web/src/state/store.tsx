// The session store: one reducer for language, the current question, draft, help and explanation state,
// the ladder position, and the guest record. Persisted on every change through storage.ts.
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from "react";
import type { InstanceDto, LadderEntry, PracticeApi, StepDto, ValidationResponse } from "../api/types";
import { newSeed, practiceApi } from "../api/client";
import type { Lang } from "../i18n";
import { createStorage, type Storage } from "./storage";
import { hasSubmission, identityOf, newId, recordEvent, type ChallengeRequest, type Delivery, type Event } from "./observations";

export interface DefinitionRef {
  definition: string;
  version: number;
}

export interface PendingChange extends DefinitionRef {
  request: "easier" | "harder";
}

export interface Resumable {
  deliveryId: string;
  draft: string;
  helpOpen: boolean;
  helpStep: number;
  explanationOpen: boolean;
  explanationStep: number;
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
}

export interface State extends PersistedState {
  kept: boolean;
  checking: boolean;
  notice: { key: string; params?: Record<string, string | number> } | null;
  loadError: boolean;
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
};

type Action =
  | { type: "hydrate"; state: PersistedState; kept: boolean }
  | { type: "language"; language: Lang }
  | { type: "kept"; kept: boolean }
  | { type: "ladder"; skillId: string; entries: LadderEntry[]; current: DefinitionRef }
  | { type: "question"; instance: InstanceDto; delivery: Delivery; resumedFrom?: Resumable; applied?: PendingChange; clearPending?: boolean }
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
  | { type: "end" }
  | { type: "clear" };

function updateDelivery(state: State, deliveryId: string | null | undefined, fn: (d: Delivery) => Delivery): State {
  if (!deliveryId) return state;
  return { ...state, deliveries: state.deliveries.map((d) => (d.id === deliveryId ? fn(d) : d)) };
}

const updateCurrent = (state: State, fn: (d: Delivery) => Delivery): State => updateDelivery(state, state.currentDeliveryId, fn);

const isCurrent = (state: State, deliveryId: string) => state.currentDeliveryId === deliveryId;

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "hydrate":
      return { ...state, ...action.state, kept: action.kept };
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
      return {
        ...previousClosed,
        deliveries,
        currentDeliveryId: action.delivery.id,
        instance: action.instance,
        draft: resumed?.draft ?? "",
        helpOpen: resumed?.helpOpen ?? false,
        helpSteps: [],
        helpStep: -1,
        explanationOpen: resumed?.explanationOpen ?? false,
        explanationSteps: [],
        explanationStep: -1,
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
      if (!isCurrent(state, action.deliveryId)) return state; // never presented: nothing shown, nothing recorded
      const { step } = action;
      const events: Event[] = [{ type: "support", kind: "help-step", step: step.index, reveals: step.reveals }];
      if (step.reveals && step.representation === "groups") events.push({ type: "support", kind: "counting-complete" });
      const recorded = updateCurrent(state, (d) => events.reduce(recordEvent, d));
      return { ...recorded, helpSteps: [...state.helpSteps.slice(0, step.index), step], helpStep: step.index };
    }
    case "explanation":
      return { ...state, explanationOpen: action.open };
    case "explanationStep": {
      if (!isCurrent(state, action.deliveryId)) return state;
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
    case "end": {
      if (!state.currentDeliveryId || !state.instance) return state;
      const current = state.deliveries.find((d) => d.id === state.currentDeliveryId);
      const unanswered = current ? !hasSubmission(current) : false;
      const resumable: Resumable | null = unanswered
        ? { deliveryId: state.currentDeliveryId, draft: state.draft, helpOpen: state.helpOpen, helpStep: state.helpStep, explanationOpen: state.explanationOpen, explanationStep: state.explanationStep }
        : null;
      return { ...updateCurrent(state, (d) => recordEvent(d, { type: "ended" })), resumable };
    }
    case "clear":
      return { ...state, ...initialPersisted, language: state.language };
    default:
      return state;
  }
}

export interface StoreApi {
  state: State;
  setLanguage(language: Lang): void;
  startPractice(skillId: string, preferred?: DefinitionRef): Promise<void>;
  nextQuestion(request: "another" | "same"): Promise<void>;
  setDraft(draft: string): void;
  submit(): Promise<void>;
  toggleHelp(): Promise<void>;
  nextHelpStep(): Promise<void>;
  toggleExplanation(): Promise<void>;
  nextExplanationStep(): Promise<void>;
  requestChallenge(request: "easier" | "harder"): void;
  openLesson(): void;
  endSession(): void;
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
  const { kept: _kept, checking: _checking, notice: _notice, loadError: _loadError, ...persisted } = s;
  return persisted;
};

export function StoreProvider({ children, api = practiceApi, storage }: StoreProviderProps) {
  const store = useMemo(() => storage ?? createStorage<PersistedState>(), [storage]);
  const [state, dispatch] = useReducer(reducer, undefined, (): State => {
    const loaded = store.load();
    return { ...initialPersisted, ...(loaded.value ?? {}), kept: loaded.kept, checking: false, notice: null, loadError: false };
  });
  const latest = useRef(state);
  latest.current = state;
  const loadToken = useRef(0); // only the most recent instance request may become the current question

  useEffect(() => {
    const kept = store.save(persistedOf(state));
    if (kept !== state.kept) dispatch({ type: "kept", kept });
  }, [state, store]);

  const toDelivery = useCallback((instance: InstanceDto): Delivery => {
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
    return { id: newId(), instance: d, purpose: "practice", provenance: "guest", startedAt: new Date().toISOString(), events: [] };
  }, []);

  /**
   * Loads a fresh question; returns whether it became the current one. `applied` is the pending change it fulfils;
   * `clearPending` drops a pending change an explicit selection supersedes. Both take effect only with the question.
   */
  const load = useCallback(
    async (ref: DefinitionRef, fixed: boolean, commit: { applied?: PendingChange; clearPending?: boolean } = {}): Promise<boolean> => {
      const token = ++loadToken.current;
      try {
        const instance = await api.getInstance(ref.definition, ref.version, fixed ? null : newSeed());
        if (token !== loadToken.current) return false; // superseded by a later request
        dispatch({ type: "question", instance, delivery: toDelivery(instance), ...commit });
        return true;
      } catch {
        if (token === loadToken.current) dispatch({ type: "loadError", failed: true });
        return false;
      }
    },
    [api, toDelivery],
  );

  const resume = useCallback(
    async (resumable: Resumable) => {
      const delivery = latest.current.deliveries.find((d) => d.id === resumable.deliveryId);
      if (!delivery) return false;
      const token = ++loadToken.current;
      try {
        const identity = identityOf(delivery);
        const instance = await api.getInstance(identity.definitionId, identity.version, identity.seed ?? null);
        if (token !== loadToken.current) return false;
        dispatch({ type: "question", instance, delivery, resumedFrom: resumable });
        dispatch({ type: "notice", notice: { key: "practice.resumed" } });
        return true;
      } catch {
        return false;
      }
    },
    [api],
  );

  const value = useMemo<StoreApi>(
    () => ({
      state,
      setLanguage: (language) => dispatch({ type: "language", language }),
      async startPractice(skillId, preferred) {
        const current = latest.current;
        // An explicitly chosen variation (a lesson's practice button) that differs from the one in progress or
        // the one that would be resumed replaces it; the practice route itself passes no preference and resumes.
        const differsFrom = (ref: DefinitionRef | null | undefined) =>
          preferred !== undefined && (!ref || ref.definition !== preferred.definition || ref.version !== preferred.version);
        if (current.skillId === skillId && current.instance && current.currentDeliveryId) {
          if (!preferred || !differsFrom(current.ladder.current)) return; // already in progress
          // The ladder position and the dropped pending change commit with the loaded question; on failure the
          // question in progress and its ladder position stay as they were, and the selection can be retried.
          await load(preferred, false, { clearPending: true });
          return;
        }
        const skill = await api.getSkill(skillId);
        const first = preferred ?? (skill.ladder[0] ? { definition: skill.ladder[0].definition, version: skill.ladder[0].version } : null);
        if (!first) return;
        dispatch({ type: "ladder", skillId, entries: skill.ladder, current: first });
        const resumable = current.resumable;
        const resumableDelivery = resumable ? current.deliveries.find((d) => d.id === resumable.deliveryId) : undefined;
        const resumeFits = resumableDelivery ? !differsFrom({ definition: resumableDelivery.instance.definitionId, version: resumableDelivery.instance.version }) : false;
        if (resumable && resumeFits && (await resume(resumable))) return;
        await load(first, false);
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
        dispatch({ type: "help", open: true });
        dispatch({ type: "event", event: { type: "support", kind: "visual-help-opened" } });
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
      openLesson() {
        dispatch({ type: "event", event: { type: "support", kind: "lesson-opened" } });
      },
      endSession: () => dispatch({ type: "end" }),
      clearRecord() {
        store.clear();
        dispatch({ type: "clear" });
      },
      dismissNotice: () => dispatch({ type: "notice", notice: null }),
    }),
    [api, load, resume, state, store],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreApi {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useStore must be used inside StoreProvider");
  return store;
}

export const challengeRequestOf = (request: ChallengeRequest) => request;
