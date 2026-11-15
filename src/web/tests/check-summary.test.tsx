// specs/006 contracts/summary.md "The summary" (tasks T018): the three groups of quickstart scenario 1, the answer
// requests and their guard, explanations that record nothing, the wording, and the actions.
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { App } from "../src/App";
import type { CheckRun } from "../src/state/checks";
import { createFakeApi, PILOT_CHECK, type FakeOptions } from "./fakeApi";
import { at, beforeThisFeature, checkRun } from "./records";

const KEY = "mathkx.guest.v1";
const FORBIDDEN_WORDS = /\b(score|scores|streak|streaks|mastery|mastered|level|grade|poeng|rekke|mestring|mestret|nivå|karakter)\b/i;

afterEach(() => {
  window.localStorage.clear();
  window.history.replaceState(null, "", "/");
});

/** Quickstart scenario 1: `7 + 3` and `5 + 4` correct, `8 + 5` answered 12, `9 + 4` skipped. */
const scenarioOne = (): CheckRun => checkRun({ id: "run-1", positions: ["correct", "correct", [{ type: "submission", submissionId: "w", originalText: "12", value: 12, status: "incorrect", code: "add.generic" }], "skipped"], finishedAt: at(5) });

function show(run: CheckRun, options: FakeOptions = {}, language: "en" | "nb" = "en") {
  window.localStorage.setItem(KEY, JSON.stringify({ schema: 1, value: { ...beforeThisFeature(), deliveries: [], language, checkRuns: [run] } }));
  const api = createFakeApi(options);
  render(<App api={api} initialPath={`/checks/${PILOT_CHECK.id}/${run.id}`} />);
  return { api, user: userEvent.setup() };
}

const group = (name: "correct" | "revisit" | "skipped") => screen.getByTestId(`check-group-${name}`);
const questionsIn = (name: "correct" | "revisit" | "skipped") => within(group(name)).queryAllByTestId("check-question");
const stored = () => JSON.parse(window.localStorage.getItem(KEY) ?? "{}").value;

describe("the groups", () => {
  it("shows quickstart scenario 1's counts, questions, answers, and the tag once", async () => {
    const { api } = show(scenarioOne());
    await screen.findByTestId("check-summary");
    expect(screen.getByTestId("check-summary-heading").textContent).toBe("Your check");
    expect(await screen.findByTestId("check-title")).toBeTruthy();
    expect(screen.getByTestId("check-title").textContent).toBe("Number bonds and addition");
    expect(screen.getByTestId("check-snapshot").textContent).toBe("A check is a snapshot, not a final judgement of what you know.");

    expect(within(group("correct")).getByRole("heading").textContent).toBe("Correct on your own");
    expect(within(group("correct")).getByTestId("check-group-count").textContent).toBe("2 questions");
    expect(within(group("revisit")).getByTestId("check-group-count").textContent).toBe("1 question");
    expect(within(group("skipped")).getByTestId("check-group-count").textContent).toBe("1 question");
    expect(questionsIn("correct").map((q) => within(q).getByTestId("check-expression").textContent)).toEqual(["7 + 3", "5 + 4"]);
    expect(questionsIn("revisit").map((q) => within(q).getByTestId("check-expression").textContent)).toEqual(["8 + 5"]);
    expect(questionsIn("skipped").map((q) => within(q).getByTestId("check-expression").textContent)).toEqual(["9 + 4"]);

    const [wrong] = questionsIn("revisit");
    expect(within(wrong!).getByTestId("check-your-answer").textContent).toBe("Your answer: 12");
    expect((await within(wrong!).findByTestId("check-correct-answer")).textContent).toBe("Correct answer: 13");
    const [skippedQ] = questionsIn("skipped");
    expect(within(skippedQ!).getByTestId("check-your-answer").textContent).toBe("You skipped this question.");
    expect((await within(skippedQ!).findByTestId("check-correct-answer")).textContent).toBe("Correct answer: 13");
    const [first] = questionsIn("correct");
    expect(within(first!).getByTestId("check-your-answer").textContent).toBe("Your answer: 10");
    expect(within(first!).getByTestId("check-correct-answer").textContent).toBe("Correct answer: 10");

    expect(screen.getAllByTestId("check-revisit-tag")).toHaveLength(1);
    expect(within(wrong!).getByTestId("check-revisit-tag").textContent).toBe("Worth revisiting");
    // Only the wrong and the skipped question ask the service for their answer.
    await waitFor(() => expect(api.calls.filter((c) => c.startsWith("getAnswer"))).toEqual(["getAnswer numbers.addition.crossing-ten@1 105", "getAnswer numbers.addition.crossing-ten@1 62"]));
  });

  it("shows the counts in Norwegian", async () => {
    show(scenarioOne(), {}, "nb");
    await screen.findByTestId("check-summary");
    expect(screen.getByTestId("check-summary-heading").textContent).toBe("Sjekken din");
    expect(within(group("correct")).getByRole("heading").textContent).toBe("Riktig på egen hånd");
    expect(within(group("correct")).getByTestId("check-group-count").textContent).toBe("2 oppgaver");
    expect(within(group("revisit")).getByTestId("check-group-count").textContent).toBe("1 oppgave");
    expect(within(group("skipped")).getByRole("heading").textContent).toBe("Hoppet over");
  });

  it("says when a group is empty", async () => {
    show(checkRun({ positions: ["correct", "correct", "correct", "correct"], finishedAt: at(5) }));
    await screen.findByTestId("check-summary");
    expect(within(group("revisit")).getByText("No questions here.")).toBeTruthy();
    expect(within(group("skipped")).getByText("No questions here.")).toBeTruthy();
    expect(screen.queryAllByTestId("check-revisit-tag")).toHaveLength(0);
  });
});

describe("answer requests", () => {
  it("never shows a missing answer as a wrong one", async () => {
    show(scenarioOne(), { answerFails: true });
    await screen.findByTestId("check-summary");
    for (const name of ["revisit", "skipped"] as const) {
      const [q] = questionsIn(name);
      expect((await within(q!).findByTestId("check-answer-unavailable")).textContent).toBe("The correct answer cannot be shown just now.");
      expect(within(q!).queryByTestId("check-correct-answer")).toBeNull();
    }
    expect(questionsIn("revisit")).toHaveLength(1); // still in its group, unchanged
  });
});

describe("explanations", () => {
  it("show their steps and record nothing", async () => {
    const { api, user } = show(scenarioOne());
    await screen.findByTestId("check-summary");
    const before = JSON.stringify(stored());
    const [wrong] = questionsIn("revisit");
    const toggle = await within(wrong!).findByTestId("check-explanation-toggle");
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    await user.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect((await within(wrong!).findByTestId("explanation-step-text")).textContent).toContain("8 in the ten-frame and 5 loose.");
    await user.click(within(wrong!).getByTestId("explanation-next"));
    await waitFor(() => expect(within(wrong!).getByTestId("explanation-step-text").textContent).toContain("8 needs 2 to make 10."));
    expect(api.calls.filter((c) => c.startsWith("getStep"))).toEqual(["getStep explanation 0", "getStep explanation 1"]);
    expect(JSON.stringify(stored())).toBe(before);
    expect(questionsIn("revisit")).toHaveLength(1);
  });

  it("are unavailable when the identity resolves to other operands, and so are fetched answers", async () => {
    show(scenarioOne(), { resolveDiffers: true });
    await screen.findByTestId("check-summary");
    await waitFor(() => expect(screen.getAllByTestId("check-explanation-unavailable")).toHaveLength(4));
    expect(screen.queryAllByTestId("check-explanation-toggle")).toHaveLength(0);
    for (const name of ["revisit", "skipped"] as const) {
      const [q] = questionsIn(name);
      expect((await within(q!).findByTestId("check-answer-unavailable")).textContent).toBe("The correct answer cannot be shown just now.");
      expect(within(q!).queryByTestId("check-correct-answer")).toBeNull();
    }
    // The recorded expressions stay, and a correct answer is the learner's own validated one.
    expect(questionsIn("revisit").map((q) => within(q).getByTestId("check-expression").textContent)).toEqual(["8 + 5"]);
    expect(within(questionsIn("correct")[0]!).getByTestId("check-correct-answer").textContent).toBe("Correct answer: 10");
  });
});

describe("wording", () => {
  it("has no fraction, percentage, score, streak, or mastery word", async () => {
    for (const language of ["en", "nb"] as const) {
      cleanup();
      show(scenarioOne(), {}, language);
      await screen.findByTestId("check-summary");
      await screen.findAllByTestId("check-explanation-toggle");
      const text = screen.getByTestId("check-summary").textContent ?? "";
      expect(text).not.toMatch(/\d\s*\//);
      expect(text).not.toContain("%");
      expect(text).not.toMatch(FORBIDDEN_WORDS);
    }
  });
});

describe("actions", () => {
  it("offer more practice with its note, a new check, and my work", async () => {
    const { user } = show(scenarioOne());
    await screen.findByTestId("check-summary");
    expect(screen.getByTestId("check-practise-more").getAttribute("href")).toBe("/practice/numbers.addition-within-20");
    expect(screen.getByTestId("check-practise-more").textContent).toBe("Practise more");
    expect(screen.getByTestId("check-practise-more-note").textContent).toBe("More practice does not change the result of this check.");
    expect(screen.getByTestId("check-summary-note").textContent).toBe(
      "Help is part of learning. Questions worth revisiting are good candidates for a little more practice, whenever you choose.",
    );
    await user.click(screen.getByTestId("check-again"));
    await screen.findByTestId("check-start");
    expect(window.location.pathname).toBe(`/checks/${PILOT_CHECK.id}`);
  });
});
