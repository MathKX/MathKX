import { describe, expect, it } from "vitest";
import { derive, summarize } from "../src/state/outcomes";
import { recordEvent, type Delivery, type Event, type SupportKind } from "../src/state/observations";

const base = (): Delivery => ({
  id: "d1",
  instance: { definitionId: "numbers.addition.within-10", version: 1, seed: "1", validatorName: "integer-answer", validatorVersion: 1, a: 4, b: 4 },
  purpose: "practice",
  provenance: "guest",
  startedAt: "2026-10-24T00:00:00Z",
  events: [],
});

let n = 0;
const correct = (): Event => ({ type: "submission", submissionId: `s${++n}`, originalText: "8", value: 8, status: "correct", code: "correct" });
const incorrect = (): Event => ({ type: "submission", submissionId: `s${++n}`, originalText: "4", value: 4, status: "incorrect", code: "add.oneGroup" });
const guidance = (): Event => ({ type: "input-guidance", submissionId: `s${++n}`, originalText: "abc", code: "invalid.notAnInteger" });
const support = (kind: SupportKind, extra: Partial<{ reveals: boolean }> = {}): Event => ({ type: "support", kind, ...extra });
const with_ = (...events: Event[]) => events.reduce((d, e) => recordEvent(d, e), base());

describe("outcome derivation", () => {
  it.each([
    ["correctFirst", with_(correct()), []],
    ["correctAfterFeedback", with_(incorrect(), correct()), []],
    ["correctWithVisualHelp", with_(support("visual-help-opened"), correct()), ["visualBefore"]],
    ["correctWithVisualHelp", with_(incorrect(), support("visual-help-opened"), correct()), ["feedbackBefore", "visualBefore"]],
    ["correctWithHelp", with_(support("explanation-open"), support("explanation-step", { reveals: false }), correct()), ["explainPartBefore"]],
    ["correctWithHelp", with_(support("lesson-opened"), correct()), ["lessonBefore"]],
    ["correctAfterExplanation", with_(support("visual-help-opened"), support("help-step", { reveals: false }), support("help-step", { reveals: true }), support("counting-complete"), correct()), ["visualBefore", "revealCounting", "revealHelp"]],
    ["correctAfterExplanation", with_(support("explanation-open"), support("explanation-step", { reveals: true }), correct()), ["revealExplanation"]],
    ["correctAfterExplanation", with_(incorrect(), support("explanation-open"), support("explanation-step", { reveals: true }), correct()), ["feedbackBefore", "revealExplanation"]],
    ["notYetCorrect", with_(incorrect()), []],
    ["skipped", with_({ type: "skipped" }), []],
    ["unfinished", with_({ type: "ended" }), []],
    ["none", with_(guidance()), []],
    ["none", base(), []],
  ] as const)("%s", (outcome, delivery, tags) => {
    const derived = derive(delivery);
    expect(derived.outcome).toBe(outcome);
    expect(derived.tags).toEqual(tags);
  });

  it("treats reserved statuses honestly", () => {
    const partial: Event = { type: "submission", submissionId: "p", originalText: "x", value: 0, status: "partially-correct", code: "none" };
    const review: Event = { type: "submission", submissionId: "r", originalText: "x", value: 0, status: "review-needed", code: "none" };
    expect(derive(with_(partial)).outcome).toBe("partiallyCorrect");
    expect(derive(with_(partial, review)).outcome).toBe("notAssessed");
  });

  it("help closed without counting is visual help; make-ten help stopped early is visual help", () => {
    expect(derive(with_(support("visual-help-opened"), correct())).outcome).toBe("correctWithVisualHelp");
    expect(derive(with_(support("visual-help-opened"), support("help-step", { reveals: false }), support("help-step", { reveals: false }), correct())).outcome).toBe("correctWithVisualHelp");
  });

  it("make-ten help stepped to its revealing last step is a reveal with the revealHelp tag", () => {
    const derived = derive(with_(support("visual-help-opened"), support("help-step", { reveals: false }), support("help-step", { reveals: true }), correct()));
    expect(derived.outcome).toBe("correctAfterExplanation");
    expect(derived.tags).toEqual(["visualBefore", "revealHelp"]);
  });

  it("support after the first correct answer never changes the outcome but is tagged", () => {
    const derived = derive(with_(correct(), support("explanation-open"), support("explanation-step", { reveals: true }), support("visual-help-opened")));
    expect(derived.outcome).toBe("correctFirst");
    expect(derived.tags).toEqual(["visualAfter", "explainAfter"]);
  });

  it("input guidance never produces after feedback", () => {
    expect(derive(with_(guidance(), correct())).outcome).toBe("correctFirst");
  });

  it("drops a duplicate submission id", () => {
    const first: Event = { type: "submission", submissionId: "dup", originalText: "8", value: 8, status: "correct", code: "correct" };
    const delivery = with_(first, first);
    expect(delivery.events).toHaveLength(1);
    expect(derive(delivery).submissions).toHaveLength(1);
  });

  it("marks the resumable delivery as unfinished", () => {
    expect(derive(base(), { resumable: true }).outcome).toBe("unfinished");
  });

  it("summarizes as counts only", () => {
    const summary = summarize([with_(correct()), with_(incorrect(), correct()), with_(guidance()), with_(incorrect())], null);
    expect(summary).toEqual({ questions: 3, counts: { correctFirst: 1, correctAfterFeedback: 1, notYetCorrect: 1 } });
    expect(JSON.stringify(summary)).not.toMatch(/%|ratio|score/);
  });
});
