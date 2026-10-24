// A deterministic in-memory PracticeApi for component tests. It mirrors the service's shapes; the
// mathematics here exists only so tests can drive the screen, it is not the product's validator.
import type { Identity, InstanceDto, LadderEntry, LessonDetail, LessonSummary, PracticeApi, SkillDto, StepDto, StepKind, ValidationResponse } from "../src/api/types";

export const LADDER: LadderEntry[] = [
  { definition: "numbers.addition.within-10", version: 1, description: { nb: "Summen er høyst 10.", en: "The sum is at most 10." } },
  { definition: "numbers.addition.crossing-ten", version: 1, description: { nb: "Over tieren, som 8 + 5.", en: "Across ten, like 8 + 5." } },
];

const SKILL: SkillDto = { id: "numbers.addition-within-20", prerequisites: ["numbers.number-bonds-to-ten"], ladder: LADDER };

const LESSON: LessonDetail = {
  id: "number-bonds-to-ten",
  version: 1,
  status: "pilot",
  skills: ["numbers.number-bonds-to-ten", "numbers.addition-within-20"],
  titles: { nb: "Tiervenner", en: "Number bonds to ten" },
  objectives: { nb: "Du lærer tiervennene.", en: "You learn the number bonds to ten." },
  practice: LADDER.map((l) => ({ definition: l.definition, version: l.version, skill: SKILL.id })),
  visuals: ["ten-frame-explorer", "make-ten"],
  translations: { nb: "nb.md", en: "en.md" },
};

export interface FakeOptions {
  /** Operands per definition; the seed is ignored unless `bySeed` is given. */
  pairs?: Record<string, [number, number]>;
  bySeed?: Record<string, [number, number]>;
  failValidate?: boolean;
}

export function createFakeApi(options: FakeOptions = {}): PracticeApi & { calls: string[] } {
  const pairs: Record<string, [number, number]> = { "numbers.addition.within-10": [4, 4], "numbers.addition.crossing-ten": [8, 5], ...options.pairs };
  const calls: string[] = [];
  const instanceOf = (identity: Identity): InstanceDto => {
    const bySeed = identity.seed !== undefined ? options.bySeed?.[identity.seed] : undefined;
    const pair: [number, number] = bySeed ?? pairs[identity.definitionId] ?? [3, 5];
    const crossing = identity.definitionId.includes("crossing");
    const representation = crossing ? "make-ten" : "groups";
    const dto: InstanceDto = {
      identity,
      skill: SKILL.id,
      a: pair[0],
      b: pair[1],
      prompt: `${pair[0]} + ${pair[1]}`,
      representations: { help: [representation], explanation: [representation] },
      validator: { name: "integer-answer", version: 1 },
    };
    if (identity.seed !== undefined) dto.generator = { name: "addition-pair", version: 1 };
    return dto;
  };
  const steps = (instance: InstanceDto, kind: StepKind): StepDto[] => {
    const { a, b } = instance;
    const representation = instance.representations[kind][0] ?? "groups";
    if (representation === "make-ten") {
      const need = 10 - a;
      const rest = b - need;
      const frame = (filled: number, marked: number) => Array.from({ length: 10 }, (_, i) => (i < filled ? "a" : i < filled + marked ? "b" : "empty"));
      return [
        { kind, representation, index: 0, count: 4, reveals: false, visual: { frame: frame(a, 0), loose: b }, text: { code: "explain.makeTen.frame", values: { a, b } } },
        { kind, representation, index: 1, count: 4, reveals: false, visual: { frame: frame(a, 0), loose: b, need }, text: { code: "explain.makeTen.need", values: { a, need } } },
        { kind, representation, index: 2, count: 4, reveals: false, visual: { frame: frame(a, need), loose: rest, split: { need, rest } }, text: { code: "explain.makeTen.split", values: { a, b, need, rest } } },
        { kind, representation, index: 3, count: 4, reveals: true, visual: { frame: frame(a, need), loose: rest, total: a + b }, text: { code: "explain.makeTen.total", values: { ten: 10, rest, sum: a + b } } },
      ];
    }
    if (kind === "help") {
      return [
        { kind, representation, index: 0, count: 4, reveals: false, visual: { countedFirst: 0, countedSecond: 0 }, text: { code: "explain.groups.show", values: { a, b } } },
        { kind, representation, index: 1, count: 4, reveals: false, visual: { countedFirst: a, countedSecond: 0 }, text: { code: "explain.groups.countFirst", values: { a } } },
        { kind, representation, index: 2, count: 4, reveals: false, visual: { countedFirst: a, countedSecond: b }, text: { code: "explain.groups.countSecond", values: { b } } },
        { kind, representation, index: 3, count: 4, reveals: true, visual: { countedFirst: a, countedSecond: b, countedAll: a + b }, text: { code: "explain.groups.countAll", values: { a, b, sum: a + b } } },
      ];
    }
    return [
      { kind, representation, index: 0, count: 3, reveals: false, visual: { combined: false }, text: { code: "explain.groups.twoGroups", values: { a, b } } },
      { kind, representation, index: 1, count: 3, reveals: false, visual: { combined: true }, text: { code: "explain.groups.combine", values: { a, b } } },
      { kind, representation, index: 2, count: 3, reveals: true, visual: { combined: true, countedAll: a + b }, text: { code: "explain.groups.total", values: { a, b, sum: a + b } } },
    ];
  };
  return {
    calls,
    getLessons: async () => {
      calls.push("getLessons");
      const summary: LessonSummary = { id: LESSON.id, version: LESSON.version, status: LESSON.status, skills: LESSON.skills, titles: LESSON.titles, practice: LESSON.practice };
      return [summary];
    },
    getLesson: async (id) => {
      calls.push(`getLesson ${id}`);
      if (id !== LESSON.id) throw new Error("unknown-lesson");
      return LESSON;
    },
    getSkill: async (id) => {
      calls.push(`getSkill ${id}`);
      return SKILL;
    },
    getInstance: async (definitionId, version, seed) => {
      calls.push(`getInstance ${definitionId}@${version} ${seed ?? "-"}`);
      const identity: Identity = { definitionId, version };
      if (seed !== null) identity.seed = seed;
      return instanceOf(identity);
    },
    getStep: async (identity, kind, index) => {
      calls.push(`getStep ${kind} ${index}`);
      const step = steps(instanceOf(identity), kind)[index];
      if (!step) throw new Error("unknown-step");
      return step;
    },
    validate: async (identity, originalText, submissionId) => {
      calls.push(`validate ${originalText}`);
      if (options.failValidate) throw new Error("unreachable");
      const { a, b } = instanceOf(identity);
      const trimmed = originalText.trim();
      const base = { validator: { name: "integer-answer", version: 1 }, submissionId };
      if (!/^-?[0-9]+$/.test(trimmed)) {
        return { ...base, status: "invalid-response", code: trimmed ? "invalid.notAnInteger" : "invalid.empty", values: { text: originalText } } satisfies ValidationResponse;
      }
      const v = Number(trimmed);
      if (v === a + b) return { ...base, status: "correct", code: "correct", values: { a, b, v, sum: a + b } };
      if (v === a || v === b) return { ...base, status: "incorrect", code: "add.oneGroup", values: { a, b, v } };
      return { ...base, status: "incorrect", code: "add.generic", values: { a, b, v } };
    },
  };
}

/** A storage that throws, to exercise the memory fallback. */
export function brokenStorage<T>() {
  return {
    load: () => ({ value: null as T | null, kept: false, discarded: false }),
    save: () => false,
    clear: () => undefined,
  };
}
