// specs/006 contracts/summary.md "The grouping" and data-model "Answered" (tasks T016), over scripted runs with no
// switch: membership reads only each delivery's events, every position of a finished run is in exactly one
// independent group, and "Worth revisiting" holds only wrong answers (DL-036).
import { describe, expect, it } from "vitest";
import { isAnswered, isUnfinished, partOf, summarizeRun, type CheckRun, type RunSummary } from "../src/state/checks";
import { at, checkRun, correct, delivery, guidance, skipped, type PositionScript } from "./records";

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
