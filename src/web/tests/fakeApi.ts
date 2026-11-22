// A deterministic in-memory PracticeApi for component tests. It mirrors the service's shapes; the
// mathematics here exists only so tests can drive the screen, it is not the product's validator.
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ApiError, type CheckDto, type Identity, type InstanceDto, type LadderEntry, type LessonDetail, type LessonSummary, type PracticeApi, type SkillDto, type StepDto, type StepKind, type ValidationResponse } from "../src/api/types";

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

/** specs/009: one-step equations, with the two rungs of x + a = b. Not among the default skills. */
export const EQUATIONS_SKILL: SkillDto = {
  id: "algebra.one-step-equations",
  name: { nb: "Likninger med ett steg", en: "One-step equations" },
  prerequisites: ["numbers.addition-within-20"],
  ladder: [
    { definition: "algebra.one-step.within-10", version: 1, description: { nb: "Likninger der høyre side er høyst 10.", en: "Equations with a right side up to 10." } },
    { definition: "algebra.one-step.to-15", version: 1, description: { nb: "Likninger der høyre side er fra 11 til 15.", en: "Equations with a right side from 11 to 15." } },
    { definition: "algebra.one-step.times", version: 1, description: { nb: "Likninger som 3x = 12: del likt i grupper.", en: "Equations like 3x = 12: share into equal groups." } },
  ],
  definitions: ["algebra.one-step.times@1", "algebra.one-step.to-15@1", "algebra.one-step.within-10@1"],
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

/** The pilot check as the service lists it (specs/006 contracts/api.md). */
export const PILOT_CHECK: CheckDto = {
  id: "numbers.addition.check-within-20",
  version: 1,
  skill: SKILL.id,
  title: { nb: "Tiervenner og addisjon", en: "Number bonds and addition" },
  scope: { nb: "Addisjon innenfor ti og over tieren", en: "Addition within ten and across ten" },
  questions: [
    { definition: "numbers.addition.within-10", version: 1, seed: "22" },
    { definition: "numbers.addition.within-10", version: 1, seed: "24" },
    { definition: "numbers.addition.crossing-ten", version: 1, seed: "105" },
    { definition: "numbers.addition.crossing-ten", version: 1, seed: "62" },
  ],
};

/** What the pilot check's identities resolve to, keyed `definition@version:seed`: 7 + 3, 5 + 4, 8 + 5, and 9 + 4. */
export const PILOT_OPERANDS: Record<string, [number, number]> = {
  "numbers.addition.within-10@1:22": [7, 3],
  "numbers.addition.within-10@1:24": [5, 4],
  "numbers.addition.crossing-ten@1:105": [8, 5],
  "numbers.addition.crossing-ten@1:62": [9, 4],
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
  /** Operands the service resolves every identity to, as if the generator had changed (specs/004 replay). */
  instanceOperands?: [number, number];
  /**
   * Serve each variation's pool (specs/005): the canonical ordered pairs, each with the seed `p{index}`. With a pool,
   * a first draw (a numeric seed) resolves like the real generator, to the pair at `seed mod n`. Without one (the
   * default), `getPool` rejects and the app delivers first draws as before, so earlier tests keep their questions.
   */
  pool?: boolean;
  /** Limit every pool to its first n pairs (a small pool, for exhaustion). */
  poolSize?: number;
  /** With `pool`, `getPool` rejects anyway. */
  poolFails?: boolean;
  /** With `pool`, the pairs successive first draws resolve to, in order (a seed keeps its pair once drawn). */
  sequence?: [number, number][];
  /** `getInstance` fails: an unknown definition (404) or an unreachable service. */
  instanceFails?: "404" | "network";
  /** The check list (default: the pilot check); `[]` for none (specs/006). */
  checks?: CheckDto[];
  /** `getChecks` rejects. */
  checksFail?: boolean;
  /** `getAnswer` rejects. */
  answerFails?: boolean;
  /** The next `validate` rejects; later ones answer. */
  validateFailsOnce?: boolean;
  /** A check identity resolves to other operands (each `b` one more), in `getInstance` and `getAnswer` alike. */
  resolveDiffers?: boolean;
}

/** The repository's own lesson files, so component tests render the real lesson. */
export function lessonMarkdown(lang: string): string {
  // A path, not `new URL(…, import.meta.url)`: Vite would turn that into an asset import outside its root.
  return readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "../../../content/lessons/number-bonds-to-ten", `${lang}.md`), "utf8");
}

const isProduct = (definitionId: string) => definitionId === "algebra.one-step.times";
const isEquation = (definitionId: string) => definitionId.startsWith("algebra.one-step.") && !isProduct(definitionId);

type Method = "getSkill" | "getInstance" | "getStep" | "validate" | "getLessonContent" | "getVisualSteps" | "getTenFrameExplorer" | "getBalanceExplorer" | "getSharingExplorer" | "getAnswer" | "getChecks";

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
  const waiting: Record<Method, (() => void)[]> = { getSkill: [], getInstance: [], getStep: [], validate: [], getLessonContent: [], getVisualSteps: [], getTenFrameExplorer: [], getBalanceExplorer: [], getSharingExplorer: [], getAnswer: [], getChecks: [] };
  const fail = new Set<Method>();
  const gate = async (method: Method) => {
    if (fail.has(method)) throw new Error(`${method} failed`);
    if (held.has(method)) await new Promise<void>((resolve) => waiting[method].push(resolve));
  };
  const poolOf = (definitionId: string): [number, number][] => {
    const all = canonicalPool(definitionId);
    return options.poolSize ? all.slice(0, options.poolSize) : all;
  };
  const sequence = [...(options.sequence ?? [])];
  const drawn = new Map<string, [number, number]>(); // definition@version:seed -> the pair a first draw resolved to
  const poolPair = (identity: Identity): [number, number] | undefined => {
    if (!options.pool || identity.seed === undefined) return undefined;
    const pool = poolOf(identity.definitionId);
    const indexed = /^p(\d+)$/.exec(identity.seed);
    if (indexed) return pool[Number(indexed[1])];
    const key = `${identity.definitionId}@${identity.version}:${identity.seed}`;
    const known = drawn.get(key);
    if (known) return known;
    const next = sequence.shift() ?? (/^\d+$/.test(identity.seed) ? pool[Number(BigInt(identity.seed) % BigInt(pool.length))] : undefined);
    if (next) drawn.set(key, next);
    return next;
  };
  const checks = options.checks ?? [PILOT_CHECK];
  let validateFailures = options.validateFailsOnce ? 1 : 0;
  const checkPair = (identity: Identity): [number, number] | undefined => {
    const pair = PILOT_OPERANDS[`${identity.definitionId}@${identity.version}:${identity.seed ?? "-"}`];
    return pair && options.resolveDiffers ? [pair[0], pair[1] + 1] : pair;
  };
  const instanceOf = (identity: Identity): InstanceDto => {
    const bySeed = identity.seed !== undefined ? options.bySeed?.[identity.seed] : undefined;
    const equation = isEquation(identity.definitionId);
    const product = isProduct(identity.definitionId);
    const pair: [number, number] = options.instanceOperands ?? bySeed ?? checkPair(identity) ?? poolPair(identity) ?? pairs[identity.definitionId] ?? (product ? [3, 12] : equation ? [3, 7] : [3, 5]);
    const crossing = identity.definitionId.includes("crossing");
    const representation = product ? "balance-sharing" : equation ? "balance" : crossing ? "make-ten" : "groups";
    const dto: InstanceDto = {
      identity,
      skill: equation || product ? "algebra.one-step-equations" : SKILL.id,
      a: pair[0],
      b: pair[1],
      prompt: product ? `${pair[0]}x = ${pair[1]}` : equation ? `x + ${pair[0]} = ${pair[1]}` : `${pair[0]} + ${pair[1]}`,
      form: product ? "unknown-factor" : equation ? "unknown-addend" : "addition",
      representations: { help: [representation], explanation: [representation] },
      validator: { name: product ? "factor-answer" : equation ? "equation-answer" : "integer-answer", version: 1 },
    };
    if (identity.seed !== undefined) dto.generator = { name: product ? "unknown-factor" : equation ? "unknown-addend" : "addition-pair", version: 1 };
    if (!options.omitLessons) {
      const listed = LESSON.practice.some((p) => p.definition === identity.definitionId && p.version === identity.version);
      dto.lessons = listed ? lessonIds.map((id) => ({ id, discloses: options.discloses?.(pair[0], pair[1]) ?? false })) : [];
    }
    return dto;
  };
  const steps = (instance: InstanceDto, kind: StepKind): StepDto[] => {
    const { a, b } = instance;
    const representation = instance.representations[kind][0] ?? "groups";
    if (representation === "balance-sharing") {
      // specs/010: the service's sharing steps for ax = b.
      const x = b / a;
      return [
        { kind, representation, index: 0, count: 3, reveals: false, visual: { each: 0, loose: b, kept: false, groups: false }, text: { code: "explain.sharing.show", values: { a, b } } },
        { kind, representation, index: 1, count: 3, reveals: false, visual: { each: 1, loose: b - a, kept: false, groups: true }, text: { code: "explain.sharing.share", values: { a, b } } },
        { kind, representation, index: 2, count: 3, reveals: true, visual: { each: x, loose: 0, kept: true, groups: true, x }, text: { code: "explain.sharing.solved", values: { a, b, x } } },
      ];
    }
    if (representation === "balance") {
      // specs/009: the service's balance steps for x + a = b.
      return [
        { kind, representation, index: 0, count: 3, reveals: false, visual: { left: a, right: b, marked: 0 }, text: { code: "explain.balance.show", values: { a, b } } },
        { kind, representation, index: 1, count: 3, reveals: false, visual: { left: a, right: b, marked: a }, text: { code: "explain.balance.takeAway", values: { a } } },
        { kind, representation, index: 2, count: 3, reveals: true, visual: { left: 0, right: b - a, marked: 0, x: b - a }, text: { code: "explain.balance.solved", values: { a, b, x: b - a } } },
      ];
    }
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
      await gate("getSkill");
      return skills.find((s) => s.id === id) ?? SKILL;
    },
    getPool: async (definitionId, version) => {
      calls.push(`getPool ${definitionId}@${version}`);
      if (!options.pool || options.poolFails) throw new Error("no pool");
      const fixed = definitionId === "numbers.addition.four-plus-four";
      return { definition: definitionId, version, questions: poolOf(definitionId).map(([a, b], i) => ({ seed: fixed ? null : `p${i}`, a, b })) };
    },
    getInstance: async (definitionId, version, seed) => {
      calls.push(`getInstance ${definitionId}@${version} ${seed ?? "-"}`);
      await gate("getInstance");
      if (options.instanceFails === "404") throw new ApiError(404, "unknown-definition", `Definition ${definitionId}@${version} is not defined.`);
      if (options.instanceFails === "network") throw new TypeError("Failed to fetch");
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
      if (validateFailures > 0) {
        validateFailures--;
        throw new Error("unreachable");
      }
      await gate("validate");
      const { a, b } = instanceOf(identity);
      const trimmed = originalText.trim();
      const equation = isEquation(identity.definitionId);
      const product = isProduct(identity.definitionId);
      const base = { validator: { name: product ? "factor-answer" : equation ? "equation-answer" : "integer-answer", version: 1 }, submissionId };
      if (!/^-?[0-9]+$/.test(trimmed)) {
        return { ...base, status: "invalid-response", code: trimmed ? "invalid.notAnInteger" : "invalid.empty", values: { text: originalText } } satisfies ValidationResponse;
      }
      const v = Number(trimmed);
      if (product) {
        // specs/010 FR-003, in its precedence.
        const x = b / a;
        if (v === x) return { ...base, status: "correct", code: "fac.correct", values: { a, b, v, x } };
        const code = v === a * b ? "fac.multiplied" : v === b ? "fac.total" : v === b - a ? "fac.subtracted" : v === a ? "fac.factor" : Math.abs(v - x) === 1 ? "fac.offByOne" : "fac.generic";
        return { ...base, status: "incorrect", code, values: { a, b, v } };
      }
      if (equation) {
        // specs/009 FR-002, in its precedence.
        if (v === b - a) return { ...base, status: "correct", code: "eq.correct", values: { a, b, v, x: b - a } };
        const code = v === a + b ? "eq.added" : v === b ? "eq.total" : v === a ? "eq.addend" : Math.abs(v - (b - a)) === 1 ? "eq.offByOne" : "eq.generic";
        return { ...base, status: "incorrect", code, values: { a, b, v } };
      }
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
    getBalanceExplorer: async (a, b) => {
      calls.push(`getBalanceExplorer ${a} ${b}`);
      await gate("getBalanceExplorer");
      // The service's states (BalanceExplorer.cs), reproduced for the fake only.
      const states = [];
      for (let left = a; left >= 0; left--) {
        for (let right = b; right >= 0; right--) {
          const difference = b - a + left - right;
          const tilt = difference === 0 ? ("balanced" as const) : difference > 0 ? ("left-down" as const) : ("right-down" as const);
          states.push({ left, right, tilt, solved: left === 0 && tilt === "balanced" });
        }
      }
      return { type: "balance-explorer", a, b, states };
    },
    getSharingExplorer: async (a, b) => {
      calls.push(`getSharingExplorer ${a} ${b}`);
      await gate("getSharingExplorer");
      // The service's states (SharingExplorer.cs), reproduced for the fake only.
      const x = b / a;
      const states = Array.from({ length: x + 1 }, (_, each) => ({ each, loose: b - a * each, kept: false, solved: false }));
      states.push({ each: x, loose: 0, kept: true, solved: true });
      return { type: "balance-sharing-explorer", a, b, states };
    },
    getChecks: async () => {
      calls.push("getChecks");
      if (options.checksFail) throw new Error("unreachable");
      await gate("getChecks");
      return checks;
    },
    getCheck: async (id, version) => {
      calls.push(`getCheck ${id}@${version}`);
      if (options.checksFail) throw new Error("unreachable");
      const check = checks.find((c) => c.id === id && c.version === version);
      if (!check) throw new ApiError(404, "unknown-check", `Check ${id}@${version} is not defined.`);
      return check;
    },
    getAnswer: async (identity) => {
      calls.push(`getAnswer ${identity.definitionId}@${identity.version} ${identity.seed ?? "-"}`);
      await gate("getAnswer");
      if (options.answerFails) throw new Error("unreachable");
      const { a, b } = instanceOf(identity);
      return { identity, a, b, answer: { kind: "integer", value: a + b } };
    },
  };
}

/** The canonical ordered pairs of the fake's variations, as the generator enumerates them (specs/005 pools). */
export function canonicalPool(definitionId: string): [number, number][] {
  if (definitionId === "numbers.addition.four-plus-four") return [[4, 4]];
  const [min, max] = definitionId.includes("crossing") ? [11, 18] : definitionId.includes("within-10") ? [2, 10] : [8, 8];
  const pool: [number, number][] = [];
  for (let a = 1; a <= 9; a++) for (let b = 1; b <= 9; b++) if (a + b >= min && a + b <= max) pool.push([a, b]);
  return pool;
}

/** A storage that throws, to exercise the memory fallback. */
export function brokenStorage<T>() {
  return {
    load: () => ({ value: null as T | null, kept: false, discarded: false }),
    save: () => false,
    clear: () => undefined,
  };
}
