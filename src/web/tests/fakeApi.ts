// A deterministic in-memory PracticeApi for component tests. It mirrors the service's shapes; the
// mathematics here exists only so tests can drive the screen, it is not the product's validator.
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Identity, InstanceDto, LadderEntry, LessonDetail, LessonSummary, PracticeApi, SkillDto, StepDto, StepKind, ValidationResponse } from "../src/api/types";

export const LADDER: LadderEntry[] = [
  { definition: "numbers.addition.within-10", version: 1, description: { nb: "Summen er høyst 10.", en: "The sum is at most 10." } },
  { definition: "numbers.addition.crossing-ten", version: 1, description: { nb: "Over tieren, som 8 + 5.", en: "Across ten, like 8 + 5." } },
];

export const SKILL: SkillDto = {
  id: "numbers.addition-within-20",
  name: { nb: "Addisjon opp til 20", en: "Addition within 20" },
  prerequisites: ["numbers.number-bonds-to-ten"],
  ladder: LADDER,
  definitions: ["numbers.addition.crossing-ten@1", "numbers.addition.four-plus-four@1", "numbers.addition.within-10@1"],
};

export const BONDS_SKILL: SkillDto = {
  id: "numbers.number-bonds-to-ten",
  name: { nb: "Tiervenner", en: "Number bonds to ten" },
  prerequisites: [],
  ladder: [],
  definitions: [],
};

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
  /** Whether the pilot lesson shows the answer to an instance (the service's disclosure flag). Default: never. */
  discloses?: (a: number, b: number) => boolean;
  /** Leave `lessons` off instances, as instances stored before spec 003 were. */
  omitLessons?: boolean;
  /** IDs of lessons that practise both pilot definitions (default: the pilot lesson). Titles are the IDs. */
  lessonIds?: string[];
  /** The skill list (default: addition and number bonds, as the service gives them). */
  skills?: SkillDto[];
  /** `getSkills` rejects, as with the service unreachable. */
  skillsFail?: boolean;
  /** `getLessons` rejects. */
  lessonsFail?: boolean;
}

/** The repository's own lesson files, so component tests render the real lesson. */
export function lessonMarkdown(lang: string): string {
  // A path, not `new URL(…, import.meta.url)`: Vite would turn that into an asset import outside its root.
  return readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "../../../content/lessons/number-bonds-to-ten", `${lang}.md`), "utf8");
}

type Method = "getInstance" | "getStep" | "validate" | "getLessonContent" | "getVisualSteps" | "getTenFrameExplorer";

/** Test controls: hold a method's responses until released, or make it fail, to drive timing and failure cases. */
export interface FakeControls {
  calls: string[];
  hold(method: Method): void;
  release(method: Method): void;
  /** Methods that throw while listed here. */
  fail: Set<Method>;
}

export function createFakeApi(options: FakeOptions = {}): PracticeApi & FakeControls {
  const pairs: Record<string, [number, number]> = { "numbers.addition.within-10": [4, 4], "numbers.addition.crossing-ten": [8, 5], ...options.pairs };
  const calls: string[] = [];
  const skills = options.skills ?? [SKILL, BONDS_SKILL];
  const lessonIds = [...(options.lessonIds ?? [LESSON.id])].sort();
  const lessonFor = (id: string): LessonDetail =>
    id === LESSON.id ? LESSON : { ...LESSON, id, titles: { nb: id, en: id } };
  const held = new Set<Method>();
  const waiting: Record<Method, (() => void)[]> = { getInstance: [], getStep: [], validate: [], getLessonContent: [], getVisualSteps: [], getTenFrameExplorer: [] };
  const fail = new Set<Method>();
  const gate = async (method: Method) => {
    if (fail.has(method)) throw new Error(`${method} failed`);
    if (held.has(method)) await new Promise<void>((resolve) => waiting[method].push(resolve));
  };
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
    if (!options.omitLessons) {
      const listed = LESSON.practice.some((p) => p.definition === identity.definitionId && p.version === identity.version);
      dto.lessons = listed ? lessonIds.map((id) => ({ id, discloses: options.discloses?.(pair[0], pair[1]) ?? false })) : [];
    }
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
    fail,
    hold: (method) => held.add(method),
    release(method) {
      held.delete(method);
      waiting[method].splice(0).forEach((resolve) => resolve());
    },
    getLessons: async () => {
      calls.push("getLessons");
      if (options.lessonsFail) throw new Error("unreachable");
      return lessonIds.map((id): LessonSummary => {
        const l = lessonFor(id);
        return { id: l.id, version: l.version, status: l.status, skills: l.skills, titles: l.titles, practice: l.practice };
      });
    },
    getLesson: async (id) => {
      calls.push(`getLesson ${id}`);
      if (!lessonIds.includes(id)) throw new Error("unknown-lesson");
      return lessonFor(id);
    },
    getSkills: async () => {
      calls.push("getSkills");
      if (options.skillsFail) throw new Error("unreachable");
      return skills;
    },
    getSkill: async (id) => {
      calls.push(`getSkill ${id}`);
      return skills.find((s) => s.id === id) ?? SKILL;
    },
    getInstance: async (definitionId, version, seed) => {
      calls.push(`getInstance ${definitionId}@${version} ${seed ?? "-"}`);
      await gate("getInstance");
      const identity: Identity = { definitionId, version };
      if (seed !== null) identity.seed = seed;
      return instanceOf(identity);
    },
    getStep: async (identity, kind, index) => {
      calls.push(`getStep ${kind} ${index}`);
      await gate("getStep");
      const step = steps(instanceOf(identity), kind)[index];
      if (!step) throw new Error("unknown-step");
      return step;
    },
    validate: async (identity, originalText, submissionId) => {
      calls.push(`validate ${originalText}`);
      if (options.failValidate) throw new Error("unreachable");
      await gate("validate");
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
    getLessonContent: async (id, lang) => {
      calls.push(`getLessonContent ${id} ${lang}`);
      await gate("getLessonContent");
      if (!lessonIds.includes(id)) throw new Error("unknown-lesson");
      return { id, version: LESSON.version, language: lang, markdown: lessonMarkdown(lang) };
    },
    getVisualSteps: async (type, a, b) => {
      calls.push(`getVisualSteps ${type} ${a} ${b}`);
      await gate("getVisualSteps");
      const identity: Identity = { definitionId: type === "make-ten" ? "numbers.addition.crossing-ten" : "numbers.addition.within-10", version: 1 };
      const instance = { ...instanceOf(identity), a, b, representations: { help: [type], explanation: [type] } };
      return { type, a, b, steps: steps(instance, "explanation") };
    },
    getTenFrameExplorer: async () => {
      calls.push("getTenFrameExplorer");
      await gate("getTenFrameExplorer");
      return { type: "ten-frame-explorer", states: Array.from({ length: 11 }, (_, filled) => ({ filled, partner: 10 - filled })) };
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
