// Scripted guest records for the progress and replay tests (specs/004 tasks T001). Plain data shaped like the
// store's deliveries; nothing here derives anything.
import type { SkillDto } from "../src/api/types";
import type { CheckResume, CheckRun } from "../src/state/checks";
import type { Delivery, Event } from "../src/state/observations";

export const WITHIN_TEN = "numbers.addition.within-10";
export const CROSSING = "numbers.addition.crossing-ten";
export const FOUR_PLUS_FOUR = "numbers.addition.four-plus-four";
/** A definition only the test skill list knows, so a second skill has practice. */
export const BONDS_DEFINITION = "numbers.bonds.to-ten";

/** The skill list the pure progress functions are tested against. */
export const SKILLS: SkillDto[] = [
  {
    id: "numbers.addition-within-20",
    name: { nb: "Addisjon opp til 20", en: "Addition within 20" },
    prerequisites: ["numbers.number-bonds-to-ten"],
    ladder: [],
    definitions: [`${CROSSING}@1`, `${FOUR_PLUS_FOUR}@1`, `${WITHIN_TEN}@1`],
  },
  {
    id: "numbers.number-bonds-to-ten",
    name: { nb: "Tiervenner", en: "Number bonds to ten" },
    prerequisites: [],
    ladder: [],
    definitions: [`${BONDS_DEFINITION}@1`],
  },
];

let counter = 0;
const nextId = (prefix: string) => `${prefix}${++counter}`;

export interface DeliverySpec {
  id?: string;
  definitionId?: string;
  version?: number;
  /** `null` for a fixed task (no seed). */
  seed?: string | null;
  a?: number;
  b?: number;
  startedAt?: string;
  events?: Event[];
  repeatOf?: string;
  repeatReason?: "requested" | "exhausted";
}

export function delivery(spec: DeliverySpec = {}): Delivery {
  const { definitionId = WITHIN_TEN, version = 1, seed = "1", a = 4, b = 4 } = spec;
  const instance: Delivery["instance"] = { definitionId, version, validatorName: "integer-answer", validatorVersion: 1, a, b };
  if (seed !== null) instance.seed = seed;
  const d: Delivery = {
    id: spec.id ?? nextId("d"),
    instance,
    purpose: "practice",
    provenance: "guest",
    startedAt: spec.startedAt ?? "2026-10-24T10:00:00.000Z",
    events: spec.events ?? [],
  };
  if (spec.repeatOf) d.repeatOf = spec.repeatOf;
  if (spec.repeatReason) d.repeatReason = spec.repeatReason;
  return d;
}

/** One answered delivery per pair, oldest first, one minute apart (specs/005: a recent window). */
export function recentWindow(definitionId: string, pairs: [number, number][], startMinute = 0): Delivery[] {
  return pairs.map(([a, b], i) => delivery({ definitionId, a, b, seed: String(1000 + startMinute + i), startedAt: at(startMinute + i), events: [correct(a + b)] }));
}

export const correct = (value: number): Event => ({ type: "submission", submissionId: nextId("s"), originalText: String(value), value, status: "correct", code: "correct" });
export const incorrect = (value: number, code = "add.generic"): Event => ({ type: "submission", submissionId: nextId("s"), originalText: String(value), value, status: "incorrect", code });
export const guidance = (text = "abc"): Event => ({ type: "input-guidance", submissionId: nextId("s"), originalText: text, code: "invalid.notAnInteger" });
export const support = (kind: Extract<Event, { type: "support" }>["kind"], reveals?: boolean): Event =>
  reveals === undefined ? { type: "support", kind } : { type: "support", kind, reveals };
export const ended: Event = { type: "ended" };
export const skipped: Event = { type: "skipped" };

/** Minutes after a fixed start, so records have a known order. */
export const at = (minute: number) => new Date(Date.UTC(2026, 9, 24, 10, minute)).toISOString();

/**
 * Spec User Story 1 scenario 1 (nine questions on addition: four correct on first response, two with visual help,
 * one after feedback, one answered after the answer was shown, one skipped), then one of each remaining outcome.
 */
export function everyOutcome(): Delivery[] {
  const d = (minute: number, events: Event[], a = 4, b = 4) => delivery({ startedAt: at(minute), events, a, b, seed: String(minute) });
  return [
    d(1, [correct(8)]),
    d(2, [correct(8)]),
    d(3, [correct(8)]),
    d(4, [correct(8)]),
    d(5, [support("visual-help-opened"), correct(8)]),
    d(6, [support("visual-help-opened"), correct(8)]),
    d(7, [incorrect(5), correct(8)]),
    d(8, [support("explanation-open"), support("explanation-step", true), correct(8)]),
    d(9, [skipped]),
    // the remaining outcomes
    d(10, [support("lesson-opened"), correct(8)]),
    d(11, [incorrect(5)]),
    d(12, [ended]),
  ];
}

/** Addition and number bonds, interleaved in time. */
export function twoSkills(): Delivery[] {
  return [
    delivery({ startedAt: at(1), events: [correct(8)] }),
    delivery({ definitionId: BONDS_DEFINITION, startedAt: at(2), a: 3, b: 7, events: [correct(10)] }),
    delivery({ definitionId: CROSSING, startedAt: at(3), a: 8, b: 5, events: [incorrect(12), correct(13)] }),
  ];
}

/** `3 + 7` twice and `7 + 3` once, same definition and version; the second `3 + 7` is the only repeat. */
export function withRepeats(): Delivery[] {
  return [
    delivery({ id: "first", startedAt: at(1), a: 3, b: 7, seed: "10", events: [correct(10)] }),
    delivery({ id: "swapped", startedAt: at(2), a: 7, b: 3, seed: "11", events: [correct(10)] }),
    delivery({ id: "again", startedAt: at(3), a: 3, b: 7, seed: "12", events: [correct(10)] }),
  ];
}

/**
 * A question with help, a repeat of it on request, a repeat of that repeat, and a chance repeat in the other order
 * (specs/005): three repeats, two of them on purpose.
 */
export function withRequestedRepeats(): Delivery[] {
  return [
    delivery({ id: "first", startedAt: at(1), a: 3, b: 7, seed: "10", events: [incorrect(9), support("visual-help-opened"), correct(10)] }),
    delivery({ id: "asked", startedAt: at(2), a: 3, b: 7, seed: "10", repeatOf: "first", repeatReason: "requested", events: [correct(10)] }),
    delivery({ id: "askedAgain", startedAt: at(3), a: 3, b: 7, seed: "10", repeatOf: "asked", repeatReason: "requested", events: [correct(10)] }),
    delivery({ id: "chance", startedAt: at(4), a: 7, b: 3, seed: "11", repeatOf: "first", repeatReason: "exhausted", events: [correct(10)] }),
  ];
}

/** A delivery whose definition the content no longer has. */
export function unknownDefinition(): Delivery[] {
  return [delivery({ definitionId: "numbers.removed", startedAt: at(1), a: 2, b: 2, events: [correct(4)] })];
}

/** Only unreadable input: outcome "none", neither counted nor listed. */
export function guidanceOnly(): Delivery[] {
  return [delivery({ startedAt: at(1), events: [guidance()] })];
}

/** A persisted state as spec 003 wrote it: no `lessonViews`. */
export function beforeThisFeature(): Record<string, unknown> {
  return {
    language: "en",
    skillId: "numbers.addition-within-20",
    ladder: { entries: [], current: null, pending: null },
    deliveries: [delivery({ startedAt: at(1), events: [correct(8)] }), delivery({ startedAt: at(2), events: [incorrect(5), correct(8)] })],
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
}

/** The pilot check's questions with the operands they resolve to (specs/006 data-model.md). */
export const PILOT_QUESTIONS = [
  { definitionId: WITHIN_TEN, version: 1, seed: "22", a: 7, b: 3 },
  { definitionId: WITHIN_TEN, version: 1, seed: "24", a: 5, b: 4 },
  { definitionId: CROSSING, version: 1, seed: "105", a: 8, b: 5 },
  { definitionId: CROSSING, version: 1, seed: "62", a: 9, b: 4 },
] as const;

/**
 * One position of a scripted run: a correct or wrong save, a skip, input guidance only, a delivery with no events
 * ("reached"), the events of a supported question, or `null` for a question never reached.
 */
export type PositionScript = "correct" | "wrong" | "skipped" | "guidance" | "reached" | Event[] | null;

export interface CheckRunSpec {
  id?: string;
  /** One script per pilot position; reached positions come first, unreached (`null`) ones last. */
  positions: PositionScript[];
  /** Default: the last reached position, or 1. */
  position?: number;
  switchAt?: number | null;
  startedAt?: string;
  finishedAt?: string;
  endedAt?: string;
  resume?: CheckResume | null;
}

const scriptEvents = (script: Exclude<PositionScript, null>, sum: number): Event[] => {
  switch (script) {
    case "correct":
      return [correct(sum)];
    case "wrong":
      return [incorrect(sum + 2)];
    case "skipped":
      return [skipped];
    case "guidance":
      return [guidance()];
    case "reached":
      return [];
    default:
      return script;
  }
};

/** A run of the pilot check from per-position scripts (specs/006 tasks T001). Plain data; nothing is derived. */
export function checkRun(spec: CheckRunSpec): CheckRun {
  const unreached = spec.positions.indexOf(null);
  const count = unreached === -1 ? spec.positions.length : unreached;
  if (spec.positions.slice(count).some((p) => p !== null)) throw new Error("reached positions must come before unreached ones");
  const startedAt = spec.startedAt ?? at(0);
  const deliveries = spec.positions.slice(0, count).map((script, i): Delivery => {
    const q = PILOT_QUESTIONS[i]!;
    const d = delivery({ definitionId: q.definitionId, seed: q.seed, a: q.a, b: q.b, startedAt, events: scriptEvents(script!, q.a + q.b) });
    return { ...d, purpose: "check" };
  });
  const run: CheckRun = {
    id: spec.id ?? nextId("run"),
    checkId: "numbers.addition.check-within-20",
    checkVersion: 1,
    skillId: "numbers.addition-within-20",
    questions: PILOT_QUESTIONS.slice(0, spec.positions.length).map(({ definitionId, version, seed }) => ({ definitionId, version, seed })),
    deliveries,
    position: spec.position ?? Math.max(1, count),
    switchAt: spec.switchAt ?? null,
    startedAt,
    resume: spec.resume ?? null,
  };
  if (spec.finishedAt) run.finishedAt = spec.finishedAt;
  if (spec.endedAt) run.endedAt = spec.endedAt;
  return run;
}
