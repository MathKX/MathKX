// specs/005 contracts/selection.md tests 1–4: the recent window and choosing a question (pure functions).
import { describe, expect, it } from "vitest";
import { choose, pairKey, recentWindow } from "../src/state/selection";
import { CROSSING, WITHIN_TEN, at, delivery, recentWindow as scripted } from "./records";

const pool = (pairs: [number, number][]) => pairs.map(([a, b], i) => ({ seed: `p${i}`, a, b }));

describe("recentWindow", () => {
  it("holds the last eight deliveries of the variation, oldest first, whatever their outcome", () => {
    const record = [
      ...scripted(WITHIN_TEN, [[1, 1], [1, 2], [1, 3], [1, 4], [1, 5]], 0),
      delivery({ definitionId: WITHIN_TEN, a: 1, b: 6, startedAt: at(5), events: [] }), // unanswered
      delivery({ definitionId: WITHIN_TEN, a: 1, b: 7, startedAt: at(6), events: [{ type: "skipped" }] }),
      delivery({ definitionId: WITHIN_TEN, a: 1, b: 8, startedAt: at(7), events: [{ type: "input-guidance", submissionId: "g", originalText: "x", code: "invalid.notAnInteger" }] }),
      delivery({ definitionId: WITHIN_TEN, a: 2, b: 2, startedAt: at(8), repeatReason: "requested", repeatOf: "x" }),
    ];
    expect(recentWindow(record, WITHIN_TEN, 1).map((d) => [d.instance.a, d.instance.b])).toEqual([
      [1, 2], [1, 3], [1, 4], [1, 5], [1, 6], [1, 7], [1, 8], [2, 2],
    ]);
  });

  it("keeps variations and versions apart, and orders by start time before record order", () => {
    const record = [
      delivery({ id: "late", definitionId: WITHIN_TEN, a: 3, b: 3, startedAt: at(9) }),
      delivery({ id: "early", definitionId: WITHIN_TEN, a: 2, b: 2, startedAt: at(1) }),
      delivery({ id: "other", definitionId: CROSSING, a: 8, b: 5, startedAt: at(5) }),
      delivery({ id: "v2", definitionId: WITHIN_TEN, version: 2, a: 4, b: 4, startedAt: at(6) }),
    ];
    expect(recentWindow(record, WITHIN_TEN, 1).map((d) => d.id)).toEqual(["early", "late"]);
  });
});

describe("pairKey", () => {
  it("ignores the order of the two numbers", () => {
    expect(pairKey(3, 7)).toBe(pairKey(7, 3));
    expect(pairKey(3, 7)).not.toBe(pairKey(3, 6));
  });
});

describe("choose", () => {
  const recent = new Set([pairKey(1, 1), pairKey(1, 2), pairKey(2, 1)]);
  const five = pool([[1, 1], [1, 2], [2, 1], [1, 3], [3, 1]]);

  it("keeps a first draw that is not recent", () => {
    expect(choose({ seed: "7", a: 1, b: 3 }, recent, five)).toEqual({ kind: "fresh" });
  });

  it("treats a first draw recent in either order as recent", () => {
    expect(choose({ seed: "7", a: 2, b: 1 }, new Set([pairKey(1, 2)]), five).kind).not.toBe("fresh");
  });

  it("chooses the question at seed mod n among those outside the window, in pool order", () => {
    // Outside the window: 1 + 3 and 3 + 1 (n = 2). Seed 7 → index 1 → 3 + 1; seed 8 → index 0 → 1 + 3.
    expect(choose({ seed: "7", a: 1, b: 1 }, recent, five)).toEqual({ kind: "chosen", seed: "p4", a: 3, b: 1 });
    expect(choose({ seed: "8", a: 1, b: 1 }, recent, five)).toEqual({ kind: "chosen", seed: "p3", a: 1, b: 3 });
  });

  it("never chooses a recent pair, for any seed", () => {
    for (let seed = 0; seed < 50; seed++) {
      const choice = choose({ seed: String(seed), a: 1, b: 2 }, recent, five);
      expect(choice.kind).toBe("chosen");
      if (choice.kind === "chosen") expect(recent.has(pairKey(choice.a, choice.b))).toBe(false);
    }
  });

  it("handles seeds beyond the safe integer range", () => {
    const choice = choose({ seed: "18446744073709551615", a: 1, b: 1 }, recent, five); // 2^64 − 1, odd
    expect(choice).toEqual({ kind: "chosen", seed: "p4", a: 3, b: 1 });
  });

  it("is exhausted only while every pool question is in the window", () => {
    const all = new Set(five.map((q) => pairKey(q.a, q.b)));
    expect(choose({ seed: "7", a: 1, b: 1 }, all, five)).toEqual({ kind: "exhausted" });
    const fixed = [{ seed: null, a: 4, b: 4 }];
    expect(choose({ seed: null, a: 4, b: 4 }, new Set([pairKey(4, 4)]), fixed)).toEqual({ kind: "exhausted" });
    expect(choose({ seed: null, a: 4, b: 4 }, new Set(), fixed)).toEqual({ kind: "fresh" });
  });

  it("gives the same choice for the same inputs", () => {
    expect(choose({ seed: "123", a: 1, b: 1 }, recent, five)).toEqual(choose({ seed: "123", a: 1, b: 1 }, recent, five));
  });
});
