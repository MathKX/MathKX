// specs/004 contracts/replay.md tests 1–7: a read-only replay of a recorded question at /record/{id}. One instance
// request, nothing recorded, no answer controls, and no sum the learner has not given.
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { App } from "../src/App";
import { formatDate } from "../src/i18n";
import type { Delivery, Event } from "../src/state/observations";
import { createFakeApi } from "./fakeApi";
import { CROSSING, FOUR_PLUS_FOUR, at, beforeThisFeature, correct, delivery, ended, guidance, incorrect, support } from "./records";

afterEach(() => {
  window.localStorage.clear();
  window.history.replaceState(null, "", "/");
});

const KEY = "mathkx.guest.v1";

function store(deliveries: Delivery[], extra: Record<string, unknown> = {}) {
  window.localStorage.setItem(KEY, JSON.stringify({ schema: 1, value: { ...beforeThisFeature(), language: "en", deliveries, lessonViews: [], ...extra } }));
}

function replay(deliveries: Delivery[], id: string, api = createFakeApi({ pairs: { [CROSSING]: [8, 5] } }), extra: Record<string, unknown> = {}) {
  store(deliveries, extra);
  render(<App api={api} initialPath={`/record/${id}`} />);
  return { api, user: userEvent.setup() };
}

const eightPlusFive = (events: Event[], id = "q") => delivery({ id, definitionId: CROSSING, a: 8, b: 5, startedAt: at(3), events });

describe("a recorded question, replayed (tests 1 and 2)", () => {
  it("shows the question, each answer with its status and feedback, the outcome, tags, and date; the sum only from the correct answer", async () => {
    const { api, user } = replay([eightPlusFive([incorrect(12, "add.offByOne"), correct(13)])], "q");
    expect((await screen.findByTestId("prompt")).getAttribute("aria-label")).toBe("8 plus 5. What is the sum?");
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(`Question from ${formatDate("en", at(3))}`);
    const answers = screen.getAllByTestId("replay-submission");
    expect(answers.map((a) => a.getAttribute("data-status"))).toEqual(["incorrect", "correct"]);
    expect(answers[0]!.textContent).toContain("12");
    expect(answers[0]!.textContent).toContain("Not correct yet");
    expect(answers[0]!.textContent).toContain("Nearly. The answer is right next to 12.");
    expect(answers[1]!.textContent).toContain("Correct. 8 + 5 = 13.");
    expect(screen.getByTestId("replay-outcome").textContent).toBe("Correct after feedback");
    expect(api.calls.filter((c) => c.startsWith("getInstance"))).toEqual(["getInstance numbers.addition.crossing-ten@1 1"]);
    expect(api.calls.some((c) => c.startsWith("getStep") || c.startsWith("validate") || c.startsWith("getLessonContent"))).toBe(false);

    // The same question and work in Norwegian.
    await user.click(screen.getByTestId("lang-nb"));
    expect(screen.getByTestId("prompt").getAttribute("aria-label")).toBe("8 pluss 5. Hva er summen?");
    expect(screen.getByTestId("replay-outcome").textContent).toBe("Riktig etter tilbakemelding");
    expect(screen.getAllByTestId("replay-submission")[1]!.textContent).toContain("Riktig. 8 + 5 = 13.");
    expect(api.calls.filter((c) => c.startsWith("getInstance"))).toHaveLength(1);
  });

  it("never shows the sum of a question that was never answered correctly, anywhere in the page", async () => {
    const { api } = replay([delivery({ id: "q", definitionId: CROSSING, a: 6, b: 5, events: [incorrect(10)] })], "q", createFakeApi({ pairs: { [CROSSING]: [6, 5] } }));
    expect((await screen.findByTestId("prompt")).getAttribute("aria-label")).toBe("6 plus 5. What is the sum?");
    expect(screen.getByTestId("replay-outcome").textContent).toBe("Not correct yet");
    expect(document.body.innerHTML).not.toMatch(/\b11\b/);
    expect(api.calls).toEqual(["getInstance numbers.addition.crossing-ten@1 1"]);
  });

  it("lists unreadable input as could not be read, and says when no answer was given", async () => {
    replay([eightPlusFive([guidance("tretten"), correct(13)])], "q");
    const [unread] = await screen.findAllByTestId("replay-submission");
    expect(unread!.getAttribute("data-status")).toBe("invalid-response");
    expect(unread!.textContent).toContain("Could not be read");
    expect(unread!.textContent).toContain("We couldn't read “tretten” as a whole number.");
  });

  it("says no answer was given for a skipped question", async () => {
    replay([eightPlusFive([{ type: "skipped" }])], "q");
    expect((await screen.findByTestId("replay-no-answers")).textContent).toBe("No answer was given.");
    expect(screen.getByTestId("replay-outcome").textContent).toBe("Skipped");
  });
});

describe("a reveal without a correct answer (test 3)", () => {
  it.each([
    ["lesson", [support("lesson-reveal"), ended], "Answer shown in the lesson"],
    ["help", [support("visual-help-opened"), support("help-step", true), ended], "Answer shown in the help"],
    ["explanation", [support("explanation-open"), support("explanation-step", true), ended], "Answer shown in the explanation"],
    ["counting", [support("counting"), support("counting-complete"), ended], "Counted to the answer"],
  ] as const)("a %s reveal shows its tag and no sum", async (_name, events, tag) => {
    replay([eightPlusFive([...events])], "q");
    await screen.findByTestId("prompt");
    expect(screen.getAllByTestId("record-tag").map((t) => t.textContent)).toContain(tag);
    expect(document.body.innerHTML).not.toMatch(/\b13\b/);
  });
});

describe("replay records nothing (test 4)", () => {
  it("leaves the stored record byte for byte as it was, with no new lesson view", async () => {
    const deliveries = [eightPlusFive([incorrect(12), correct(13)], "a"), delivery({ id: "b", startedAt: at(5), events: [incorrect(5)] })];
    store(deliveries);
    render(<App api={createFakeApi({ pairs: { [CROSSING]: [8, 5] } })} initialPath="/record" />);
    const user = userEvent.setup();
    await screen.findAllByTestId("skill-name");
    const before = window.localStorage.getItem(KEY);

    for (const id of ["a", "b"]) {
      await user.click(screen.getAllByTestId("progress-questions")[0]!);
      const link = screen.getAllByTestId("record-question").find((l) => l.getAttribute("href") === `/record/${id}`)!;
      await user.click(link);
      await screen.findByTestId("replay-outcome");
      await user.click(screen.getByTestId("lang-nb"));
      await user.click(screen.getByTestId("lang-en"));
      await user.click(screen.getByTestId("replay-back"));
      await screen.findAllByTestId("skill-name");
    }
    await new Promise((resolve) => setTimeout(resolve, 20));
    // A language switch is a setting, not work: compare the record with the language put back.
    expect(window.localStorage.getItem(KEY)).toBe(before);
  });
});

describe("when the question cannot be shown (test 5)", () => {
  it.each([
    ["the service resolves different operands", createFakeApi({ instanceOperands: [7, 6] })],
    ["the definition is unknown", createFakeApi({ instanceFails: "404" })],
    ["the service is unreachable", createFakeApi({ instanceFails: "network" })],
  ])("%s: shows the recorded expression and work, and says so", async (_case, api) => {
    replay([eightPlusFive([incorrect(12), correct(13)])], "q", api);
    expect((await screen.findByTestId("replay-unavailable")).textContent).toBe("This question can no longer be shown as it was asked. Here is what was recorded.");
    expect(screen.getByTestId("prompt").getAttribute("aria-label")).toBe("8 plus 5. What is the sum?");
    expect(screen.getAllByTestId("replay-submission")).toHaveLength(2);
    expect(document.body.textContent).not.toMatch(/7 \+ 6|7 plus 6/);
  });
});

describe("the question in progress and unknown questions (test 6)", () => {
  it("offers to continue the question in progress, with no answer control of its own", async () => {
    const { user } = replay([eightPlusFive([incorrect(12)], "now")], "now", undefined, { currentDeliveryId: "now", skillId: "numbers.addition-within-20" });
    const go = await screen.findByTestId("replay-continue");
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.queryByRole("button", { name: /check/i })).toBeNull();
    expect(go.getAttribute("href")).toBe("/practice/numbers.addition-within-20");
    await user.click(go);
    await screen.findByTestId("answer");
  });

  it("says a question that is not in the record is not in this browser's work", async () => {
    const { api, user } = replay([], "nope");
    expect((await screen.findByTestId("replay-not-found")).textContent).toBe("This question is not in your work in this browser.");
    expect(api.calls.some((c) => c.startsWith("getInstance"))).toBe(false);
    await user.click(screen.getByTestId("replay-back"));
    expect(await screen.findByRole("heading", { level: 1, name: "My work" })).toBeTruthy();
  });
});

describe("a fixed task (test 7)", () => {
  it("resolves without a seed", async () => {
    const { api } = replay([delivery({ id: "f", definitionId: FOUR_PLUS_FOUR, seed: null, a: 4, b: 4, events: [correct(8)] })], "f", createFakeApi({ pairs: { [FOUR_PLUS_FOUR]: [4, 4] } }));
    await screen.findByTestId("replay-outcome");
    expect(api.calls.filter((c) => c.startsWith("getInstance"))).toEqual(["getInstance numbers.addition.four-plus-four@1 -"]);
    expect(within(screen.getByTestId("replay-page")).getByTestId("prompt").getAttribute("aria-label")).toBe("4 plus 4. What is the sum?");
    await waitFor(() => expect(screen.queryByTestId("replay-unavailable")).toBeNull());
  });
});
