// specs/005 contracts/session.md tests 1–11: "Finish practice" closes the question in progress (keeping it
// resumable), snapshots the session's questions, and /session summarizes them by skill with "Practise again".
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { App } from "../src/App";
import type { Delivery } from "../src/state/observations";
import { createFakeApi } from "./fakeApi";
import { at, beforeThisFeature, correct, delivery } from "./records";

const practicePath = "/practice/numbers.addition-within-20";
const KEY = "mathkx.guest.v1";
const stored = () => JSON.parse(window.localStorage.getItem(KEY) ?? "{}").value;
const deliveries = (): Delivery[] => stored()?.deliveries ?? [];
const currentDelivery = () => deliveries().find((d) => d.id === stored().currentDeliveryId)!;
type User = ReturnType<typeof userEvent.setup>;

afterEach(() => {
  window.localStorage.clear();
  window.history.replaceState(null, "", "/");
});

/** Practice in English on a cleared record; the first question is on screen and recorded. */
async function practise(api = createFakeApi({ pool: true })) {
  window.localStorage.clear();
  render(<App api={api} initialPath={practicePath} />);
  const user = userEvent.setup();
  await user.click(screen.getByTestId("lang-en"));
  await screen.findByTestId("prompt");
  await waitFor(() => expect(deliveries()).toHaveLength(1));
  return { api, user };
}

/** Answers the question on screen correctly. */
async function answerCorrectly(user: User) {
  const { a, b } = currentDelivery().instance;
  await user.type(screen.getByTestId("answer"), String(a + b));
  await user.click(screen.getByTestId("check"));
  await screen.findByTestId("result");
}

async function another(user: User) {
  const before = deliveries().length;
  await user.click(screen.getByTestId("another"));
  await waitFor(() => expect(deliveries()).toHaveLength(before + 1));
  await waitFor(() => expect(screen.queryByTestId("result")).toBeNull());
}

async function finish(user: User) {
  await user.click(screen.getByTestId("finish-practice"));
  await screen.findByTestId("session-page");
  expect(window.location.pathname).toBe("/session");
}

async function practiseAgain(user: User) {
  await user.click(screen.getByTestId("session-again"));
  await screen.findByTestId("prompt");
}

/** An in-app move to another address, as the browser's back and forward do. */
function go(path: string) {
  act(() => {
    window.history.pushState(null, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
}

const summaries = () => screen.getAllByTestId("session-summary").map((p) => p.textContent);

describe("the summary (test 1)", () => {
  it("counts three answered questions and one unfinished with a draft", async () => {
    const { user } = await practise();
    for (let i = 0; i < 3; i++) {
      await answerCorrectly(user);
      await another(user);
    }
    await user.type(screen.getByTestId("answer"), "7");
    await finish(user);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Your practice session");
    expect(screen.getByTestId("session-skill").textContent).toBe("Addition within 20");
    expect(summaries()).toEqual(["4 questions: 3 correct on first response, no help, 1 unfinished"]);
    expect(screen.queryByTestId("session-repeats")).toBeNull();
    expect(screen.getByTestId("session-record").getAttribute("href")).toBe("/record");
    expect(stored().session.current).toEqual([]);
    expect(stored().instance).toBeNull();
    expect(stored().currentDeliveryId).toBeNull();
  });
});

describe("Practise again (tests 2 and 3)", () => {
  it("resumes an unfinished question with its draft and help", async () => {
    const { user } = await practise();
    await user.click(screen.getByTestId("toggle-help"));
    await user.type(screen.getByTestId("answer"), "7");
    const unfinished = currentDelivery().id;
    await finish(user);
    expect(stored().resumable).toMatchObject({ deliveryId: unfinished, draft: "7", helpOpen: true });

    await practiseAgain(user);
    expect((screen.getByTestId("answer") as HTMLInputElement).value).toBe("7");
    expect(stored().helpOpen).toBe(true);
    expect(stored().currentDeliveryId).toBe(unfinished);
    expect(deliveries()).toHaveLength(1);
    expect(stored().session.current).toEqual([unfinished]); // the resumed question belongs to the new session
  });

  it("delivers a new question after a finish on an answered one", async () => {
    const { user } = await practise();
    await answerCorrectly(user);
    const finished = currentDelivery().id;
    await finish(user);
    expect(stored().resumable).toBeNull();

    await practiseAgain(user);
    await waitFor(() => expect(deliveries()).toHaveLength(2));
    expect(stored().currentDeliveryId).not.toBe(finished);
    expect((screen.getByTestId("answer") as HTMLInputElement).value).toBe("");
  });
});

describe("a question resumed across sessions (test 4)", () => {
  it("counts its new outcome in the next summary, and leaves the first summary as it was", async () => {
    const { user } = await practise();
    await user.type(screen.getByTestId("answer"), "7");
    const resumed = currentDelivery().id;
    await finish(user);
    expect(summaries()).toEqual(["1 question: 1 unfinished"]);

    await practiseAgain(user);
    await user.clear(screen.getByTestId("answer"));
    await answerCorrectly(user);
    // The first summary, read before the second finish, still says what it said.
    go("/session");
    await screen.findByTestId("session-page");
    expect(summaries()).toEqual(["1 question: 1 unfinished"]);

    go(practicePath);
    await screen.findByTestId("result"); // the answered question is still the one in progress
    await finish(user);
    expect(stored().session.last.questions.map((q: { id: string }) => q.id)).toEqual([resumed]);
    expect(summaries()).toEqual(["1 question: 1 correct on first response, no help"]);
  });
});

describe("detours (test 5)", () => {
  it("a lesson detour and a look at My work do not split the session", async () => {
    const { user } = await practise();
    await answerCorrectly(user);
    await another(user);
    await user.click(screen.getByTestId("to-lesson"));
    await user.click(await screen.findByTestId("return-to-question"));
    await screen.findByTestId("prompt");
    await user.click(screen.getByRole("link", { name: "My work" }));
    await screen.findAllByTestId("skill-name");
    go(practicePath);
    await screen.findByTestId("prompt");
    await answerCorrectly(user);
    await finish(user);
    expect(summaries()).toEqual(["2 questions: 2 correct on first response, no help"]);
  });
});

describe("a second session (test 6)", () => {
  it("counts its own questions and the one it resumed", async () => {
    const { user } = await practise();
    await answerCorrectly(user);
    await finish(user);
    expect(summaries()).toEqual(["1 question: 1 correct on first response, no help"]);

    await practiseAgain(user);
    await answerCorrectly(user);
    await another(user);
    await user.type(screen.getByTestId("answer"), "7");
    await finish(user);
    expect(summaries()).toEqual(["2 questions: 1 correct on first response, no help, 1 unfinished"]);

    await practiseAgain(user);
    await user.clear(screen.getByTestId("answer"));
    await answerCorrectly(user);
    await finish(user);
    expect(summaries()).toHaveLength(1);
    expect(summaries()[0]).toMatch(/^1 question: 1 correct/);
    expect(deliveries()).toHaveLength(3);
  });
});

describe("repeats against the full record (test 7)", () => {
  it("counts a chance repeat of an earlier session's question as a repeat", async () => {
    // An earlier, finished session asked 4 + 4; with no pool to choose from, practice delivers 4 + 4 again.
    const earlier = delivery({ id: "earlier", a: 4, b: 4, startedAt: at(1), events: [correct(8)] });
    window.localStorage.setItem(
      KEY,
      JSON.stringify({ schema: 1, value: { ...beforeThisFeature(), language: "en", deliveries: [earlier], session: { current: [], last: null } } }),
    );
    render(<App api={createFakeApi()} initialPath={practicePath} />);
    const user = userEvent.setup();
    await screen.findByTestId("prompt");
    await waitFor(() => expect(deliveries()).toHaveLength(2));
    await answerCorrectly(user);
    await finish(user);
    expect(summaries()).toEqual(["1 question: 1 correct on first response, no help"]);
    expect(screen.getByTestId("session-repeats").textContent).toBe("1 of them repeated a question you had already had.");
    expect(screen.queryByTestId("session-repeats-requested")).toBeNull();
  });

  it("says how many the learner repeated on purpose", async () => {
    const { user } = await practise();
    await answerCorrectly(user);
    await user.click(screen.getByTestId("repeat-question"));
    await waitFor(() => expect(deliveries()).toHaveLength(2));
    await waitFor(() => expect(screen.queryByTestId("result")).toBeNull());
    await answerCorrectly(user);
    await finish(user);
    expect(summaries()).toEqual(["2 questions: 2 correct on first response, no help"]);
    expect(screen.getByTestId("session-repeats").textContent).toBe("1 of them repeated a question you had already had.");
    expect(screen.getByTestId("session-repeats-requested").textContent).toBe("1 of these you repeated on purpose.");
  });
});

describe("old records (test 8)", () => {
  it("summarize all their questions on the first finish", async () => {
    window.localStorage.setItem(KEY, JSON.stringify({ schema: 1, value: beforeThisFeature() }));
    render(<App api={createFakeApi()} initialPath={practicePath} />);
    const user = userEvent.setup();
    await screen.findByTestId("prompt");
    await waitFor(() => expect(deliveries()).toHaveLength(3));
    await answerCorrectly(user);
    await finish(user);
    expect(summaries()).toEqual(["3 questions: 2 correct on first response, no help, 1 correct after feedback"]);
  });
});

describe("reload and clearing (test 9)", () => {
  it("keeps the summary across a reload; Clear my work leaves no finished session", async () => {
    const { user } = await practise();
    await answerCorrectly(user);
    await finish(user);
    const before = summaries();

    cleanup();
    render(<App api={createFakeApi({ pool: true })} initialPath="/session" />);
    await screen.findByTestId("session-page");
    await waitFor(() => expect(summaries()).toEqual(before));

    const again = userEvent.setup();
    await again.click(screen.getByTestId("session-record"));
    await again.click(await screen.findByTestId("clear"));
    await again.click(screen.getByTestId("confirm-clear"));
    go("/session");
    expect((await screen.findByTestId("session-none")).textContent).toBe("You have no finished practice session yet.");
    expect(screen.queryByTestId("session-summary")).toBeNull();
  });
});

describe("no questions (test 10)", () => {
  it("says no questions were answered when the question never loaded", async () => {
    window.localStorage.clear();
    render(<App api={createFakeApi({ instanceFails: "network" })} initialPath={practicePath} />);
    const user = userEvent.setup();
    await user.click(screen.getByTestId("lang-en"));
    await screen.findByText("The question could not be loaded. Try again.");
    await finish(user);
    expect(screen.getByTestId("session-empty").textContent).toBe("You did not answer any questions in this session.");
    expect(screen.queryByTestId("session-summary")).toBeNull();
  });
});

describe("languages (test 11)", () => {
  it("shows the summary and its controls in Norwegian too", async () => {
    const { user } = await practise();
    await answerCorrectly(user);
    await another(user);
    await user.click(screen.getByTestId("lang-nb"));
    expect(screen.getByTestId("finish-practice").textContent).toBe("Avslutt øvingen");
    await finish(user);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Øvingsøkten din");
    expect(screen.getByTestId("session-skill").textContent).toBe("Addisjon opp til 20");
    expect(summaries()).toEqual(["2 oppgaver: 1 riktig på første svar, uten hjelp, 1 uferdig"]);
    expect(screen.getByTestId("session-again").textContent).toBe("Øv igjen");
    await user.click(screen.getByTestId("lang-en"));
    expect(screen.getByTestId("session-again").textContent).toBe("Practise again");
  });
});
