// specs/006 contracts/summary.md "The grouping" and data-model "Answered" (tasks T016, T030), over scripted runs:
// membership reads only each delivery's events, every position of a finished run is in exactly one part, "Worth
// revisiting" holds only independent wrong answers (DL-036), and from `switchAt` on, answered questions are only in
// `supported`, each with spec 002's outcome.
import { describe, expect, it } from "vitest";
import { checkDetourOf, isAnswered, isUnfinished, partOf, summarizeRun, supportedQuestionOf, type CheckRun, type RunSummary } from "../src/state/checks";
import { derive, type Outcome } from "../src/state/outcomes";
import type { Event } from "../src/state/observations";
import { at, checkRun, correct, delivery, guidance, incorrect, skipped, support, type PositionScript } from "./records";

type Answer = "correct" | "wrong" | "skipped";
const ANSWERS: Answer[] = ["correct", "wrong", "skipped"];
const PARTS: (keyof RunSummary)[] = ["correct", "revisit", "skipped", "supported", "notAnswered"];

/** Every combination of n answers, in order. */
function combinations(n: number): Answer[][] {
  if (n === 0) return [[]];
  return combinations(n - 1).flatMap((rest) => ANSWERS.map((a) => [...rest, a]));
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object") {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

const finished = (positions: PositionScript[]): CheckRun => checkRun({ positions, finishedAt: at(5) });

describe("Answered (data-model)", () => {
  it("is a submission or a skip, in a delivery's events only", () => {
    expect(isAnswered(undefined)).toBe(false);
    expect(isAnswered(delivery({ events: [] }))).toBe(false);
    expect(isAnswered(delivery({ events: [guidance()] }))).toBe(false);
    expect(isAnswered(delivery({ events: [correct(8)] }))).toBe(true);
    expect(isAnswered(delivery({ events: [skipped] }))).toBe(true);
  });

  it("puts a finished run's last question in its group, with no later delivery", () => {
    const run = finished(["correct", "correct", "correct", "wrong"]);
    expect(run.deliveries).toHaveLength(4);
    expect(summarizeRun(run).revisit).toEqual([4]);
  });

  it("never reads the run's position", () => {
    const run = finished(["correct", "wrong", "skipped", "correct"]);
    const expected = summarizeRun(run);
    for (const position of [1, 2, 3, 4]) expect(summarizeRun({ ...run, position })).toEqual(expected);
  });

  it("tells unfinished runs and parts apart", () => {
    const run = checkRun({ positions: ["correct", "reached", null, null] });
    expect(isUnfinished(run)).toBe(true);
    expect(isUnfinished({ ...run, finishedAt: at(5) })).toBe(false);
    expect(isUnfinished({ ...run, endedAt: at(5) })).toBe(false);
    expect([1, 2, 3, 4].map((p) => partOf(run, p))).toEqual(["independent", "independent", "independent", "independent"]);
    expect([1, 2, 3, 4].map((p) => partOf({ ...run, switchAt: 3 }, p))).toEqual(["independent", "independent", "supported", "supported"]);
  });

  it("places no position of an unfinished run that is not answered yet", () => {
    const summary = summarizeRun(checkRun({ positions: ["correct", "reached", null, null] }));
    expect(summary).toEqual({ correct: [1], revisit: [], skipped: [], supported: [], notAnswered: [] });
  });
});

describe("the matrix (SC-002, no switch)", () => {
  const all = combinations(4);

  it("covers all 81 combinations", () => {
    expect(all).toHaveLength(81);
  });

  it.each(all.map((answers) => [answers.join(", "), answers] as const))("%s: each position in exactly one group, and only wrong ones worth revisiting", (_, answers) => {
    const summary = summarizeRun(finished([...answers]));
    const placed = PARTS.flatMap((part) => summary[part]);
    expect([...placed].sort()).toEqual([1, 2, 3, 4]);
    expect(summary.supported).toEqual([]);
    expect(summary.notAnswered).toEqual([]);
    answers.forEach((answer, i) => {
      const group = answer === "wrong" ? "revisit" : answer;
      expect(summary[group], `position ${i + 1}`).toContain(i + 1);
    });
    expect(summary.revisit).toEqual(answers.flatMap((a, i) => (a === "wrong" ? [i + 1] : [])));
  });
});

describe("input guidance", () => {
  it("does not count; the save after it decides the group", () => {
    const run = finished([[guidance("4+4"), correct(10)], [guidance(), { type: "submission", submissionId: "w", originalText: "11", value: 11, status: "incorrect", code: "add.generic" }], [guidance(), skipped], "correct"]);
    expect(summarizeRun(run)).toEqual({ correct: [1, 4], revisit: [2], skipped: [3], supported: [], notAnswered: [] });
  });
});

describe("purity", () => {
  it("reads only the run, and never changes it", () => {
    const run = deepFreeze(finished(["correct", "wrong", "skipped", "correct"]));
    expect(() => summarizeRun(run)).not.toThrow();
    expect(summarizeRun(run)).toEqual({ correct: [1, 4], revisit: [2], skipped: [3], supported: [], notAnswered: [] });
  });
});

/** Supported questions scripted as practice, with the outcome spec 002's `derive` gives each (the pilot's sums). */
const SUPPORTED: { events: (sum: number) => Event[]; outcome: Outcome }[] = [
  { events: (sum) => [support("visual-help-opened"), correct(sum)], outcome: "correctWithVisualHelp" },
  { events: (sum) => [incorrect(sum + 1), correct(sum)], outcome: "correctAfterFeedback" },
  { events: (sum) => [incorrect(sum + 1)], outcome: "notYetCorrect" }, // wrong, and never correct
  { events: () => [skipped], outcome: "skipped" },
];
const SUMS = [10, 9, 13, 13];

describe("the matrix with a switch (SC-002)", () => {
  const cases = [1, 2, 3, 4].flatMap((switchAt) =>
    combinations(switchAt - 1).map((answers, n) => {
      const supported = SUMS.slice(switchAt - 1).map((sum, i) => SUPPORTED[(n + i) % SUPPORTED.length]!);
      return { switchAt, answers, supported, label: `switch at ${switchAt}: ${answers.join(", ") || "none on your own"}, then ${supported.map((s) => s.outcome).join(", ")}` };
    }),
  );

  it("covers every independent combination before each switch position", () => {
    expect(cases).toHaveLength(1 + 3 + 9 + 27);
  });

  it.each(cases.map((c) => [c.label, c] as const))("%s", (_, { switchAt, answers, supported }) => {
    const positions: PositionScript[] = [...answers, ...supported.map((s, i) => s.events(SUMS[switchAt - 1 + i]!))];
    const run = checkRun({ positions, switchAt, finishedAt: at(5) });
    const summary = summarizeRun(run);
    expect([...PARTS.flatMap((part) => summary[part])].sort()).toEqual([1, 2, 3, 4]);
    expect(summary.supported).toEqual([1, 2, 3, 4].filter((p) => p >= switchAt));
    expect(summary.notAnswered).toEqual([]);
    // The independent groups hold only positions before the switch, each in its own group.
    expect(summary.revisit).toEqual(answers.flatMap((a, i) => (a === "wrong" ? [i + 1] : [])));
    expect(summary.correct).toEqual(answers.flatMap((a, i) => (a === "correct" ? [i + 1] : [])));
    expect(summary.skipped).toEqual(answers.flatMap((a, i) => (a === "skipped" ? [i + 1] : [])));
    // Each supported question keeps spec 002's outcome; a wrong one is never "Worth revisiting".
    summary.supported.forEach((position, i) => expect(derive(run.deliveries[position - 1]!).outcome, `position ${position}`).toBe(supported[i]!.outcome));
  });

  it("leaves the three groups empty with a switch at question 1", () => {
    const run = checkRun({ positions: SUMS.map((sum) => [incorrect(sum + 1)]), switchAt: 1, finishedAt: at(5) });
    expect(summarizeRun(run)).toEqual({ correct: [], revisit: [], skipped: [], supported: [1, 2, 3, 4], notAnswered: [] });
  });
});

describe("the PR 51 review cases", () => {
  it("puts the last question in supported after a switch, an answer, and \"See summary\"", () => {
    const run = checkRun({ positions: ["wrong", "skipped", [support("visual-help-opened"), correct(13)], [incorrect(12), correct(13)]], switchAt: 3, position: 4, finishedAt: at(5) });
    const summary = summarizeRun(run);
    expect(summary).toEqual({ correct: [], revisit: [1], skipped: [2], supported: [3, 4], notAnswered: [] });
    expect(derive(run.deliveries[3]!).outcome).toBe("correctAfterFeedback");
  });

  it("keeps a supported question answered before the run was ended, without \"Next question\", in supported", () => {
    const run = checkRun({ positions: ["correct", [incorrect(10)], null, null], switchAt: 2, position: 2, endedAt: at(5) });
    const summary = summarizeRun(run);
    expect(summary.supported).toEqual([2]);
    expect(summary.notAnswered).toEqual([3, 4]);
    expect(derive(run.deliveries[1]!).outcome).toBe("notYetCorrect");
    expect(summary.revisit).toEqual([]);
  });

  it("puts a supported question reached but not answered in an ended run under not answered", () => {
    const run = checkRun({ positions: ["correct", [support("visual-help-opened")], null, null], switchAt: 2, position: 2, endedAt: at(5) });
    expect(summarizeRun(run)).toEqual({ correct: [1], revisit: [], skipped: [], supported: [], notAnswered: [2, 3, 4] });
  });
});

describe("the supported question on screen (research R10)", () => {
  it("is the delivery at the position of an unfinished run in its supported part", () => {
    const run = checkRun({ id: "r", positions: ["wrong", "reached", null, null], switchAt: 2 });
    expect(supportedQuestionOf(run)).toBe(run.deliveries[1]);
    expect(supportedQuestionOf({ ...run, switchAt: null })).toBeNull();
    expect(supportedQuestionOf({ ...run, finishedAt: at(5) })).toBeNull();
  });

  it("comes from the run last presented, or else the newest run with one", () => {
    const older = checkRun({ id: "older", positions: ["reached", null, null, null], switchAt: 1, startedAt: at(1) });
    const newer = checkRun({ id: "newer", positions: ["reached", null, null, null], switchAt: 1, startedAt: at(2) });
    const independent = checkRun({ id: "independent", positions: ["reached", null, null, null], startedAt: at(3) });
    expect(checkDetourOf([older, newer, independent], null)?.run.id).toBe("newer");
    expect(checkDetourOf([older, newer, independent], "older")?.run.id).toBe("older");
    // The run last presented is independent: the visit is not about any check question.
    expect(checkDetourOf([older, newer, independent], "independent")).toBeNull();
  });
});
