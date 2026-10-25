// Regressions from the PR 24 review: responses bound to the delivery they were requested for, lesson support
// recorded on keyboard activation, an explicitly chosen variation honoured, and a pending change kept until a
// question actually loads.
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { App } from "../src/App";
import { createFakeApi } from "./fakeApi";

const practicePath = "/practice/numbers.addition-within-20";
const lessonPath = "/lessons/number-bonds-to-ten";
const stored = () => JSON.parse(window.localStorage.getItem("mathkx.guest.v1") ?? "{}").value;
type StoredEvent = { type: string; kind?: string; request?: string; outcome?: string };
const kindsOf = (index: number): string[] => stored().deliveries[index].events.map((e: StoredEvent) => e.kind ?? e.type);
const challengesOf = (index: number): string[] =>
  stored()
    .deliveries[index].events.filter((e: StoredEvent) => e.type === "challenge-request")
    .map((e: StoredEvent) => `${e.request}:${e.outcome}`);
const prompt = () => screen.getByTestId("prompt").getAttribute("aria-label");

async function renderAt(path: string, api = createFakeApi()) {
  window.localStorage.clear();
  render(<App api={api} initialPath={path} />);
  return { api, user: userEvent.setup() };
}

async function renderPractice(api = createFakeApi()) {
  const result = await renderAt(practicePath, api);
  await screen.findByTestId("prompt");
  return result;
}

afterEach(() => window.localStorage.clear());

describe("responses are bound to the question they were requested for", () => {
  it("records a late validation on the question it answered and leaves the new question untouched", async () => {
    const api = createFakeApi();
    api.hold("validate");
    const { user } = await renderPractice(api);
    await user.type(screen.getByTestId("answer"), "8");
    await user.click(screen.getByTestId("check"));
    await user.click(screen.getByTestId("harder"));
    await user.click(screen.getByTestId("another"));
    await waitFor(() => expect(prompt()).toBe("8 pluss 5. Hva er summen?"));
    expect(screen.queryByTestId("result")).toBeNull();
    expect((screen.getByTestId("check") as HTMLButtonElement).disabled).toBe(false);

    api.release("validate");
    await waitFor(() => expect(kindsOf(0)).toContain("submission"));
    expect(kindsOf(0).filter((k) => k === "submission")).toHaveLength(1);
    expect(kindsOf(1)).not.toContain("submission");
    expect(screen.queryByTestId("result")).toBeNull();
    expect((screen.getByTestId("answer") as HTMLInputElement).value).toBe("");
  });

  it("neither shows nor records a help step that arrives after the learner moved on", async () => {
    const api = createFakeApi();
    const { user } = await renderPractice(api);
    await user.click(screen.getByTestId("toggle-help"));
    api.hold("getStep");
    await user.click(screen.getByTestId("help-next"));
    await user.click(screen.getByTestId("harder"));
    await user.click(screen.getByTestId("another"));
    await waitFor(() => expect(prompt()).toBe("8 pluss 5. Hva er summen?"));
    expect(screen.getByTestId("toggle-help").getAttribute("aria-expanded")).toBe("false");

    api.release("getStep");
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(kindsOf(0)).toContain("visual-help-opened"); // the request was recorded; the step was never presented
    expect(kindsOf(0)).not.toContain("help-step");
    expect(kindsOf(1)).not.toContain("help-step");
    expect(screen.getByTestId("toggle-help").getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByTestId("help-step-text")).toBeNull();
    await user.click(screen.getByTestId("toggle-help"));
    expect(screen.queryByTestId("help-step-text")).toBeNull(); // the late step did not become this question's first step
  });

  it("does not record a reveal that was requested but never presented", async () => {
    const api = createFakeApi();
    const { user } = await renderPractice(api);
    await user.click(screen.getByTestId("toggle-help"));
    for (let i = 0; i < 3; i++) await user.click(screen.getByTestId("help-next")); // the non-revealing steps
    await waitFor(() => expect(kindsOf(0).filter((k) => k === "help-step")).toHaveLength(3));
    api.hold("validate");
    await user.type(screen.getByTestId("answer"), "8");
    await user.click(screen.getByTestId("check"));
    api.hold("getStep");
    await user.click(screen.getByTestId("help-next")); // the revealing step, never shown
    await user.click(screen.getByTestId("harder"));
    await user.click(screen.getByTestId("another"));
    await waitFor(() => expect(prompt()).toBe("8 pluss 5. Hva er summen?"));

    api.release("getStep");
    api.release("validate");
    await waitFor(() => expect(kindsOf(0)).toContain("submission"));
    expect(kindsOf(0)).not.toContain("counting-complete");
    expect(kindsOf(0).filter((k) => k === "help-step")).toHaveLength(3);
    expect(stored().deliveries[0].events.some((e: StoredEvent & { reveals?: boolean }) => e.reveals === true)).toBe(false);
    expect(kindsOf(1)).toEqual([]);

    await user.click(screen.getByText("Mitt arbeid"));
    const items = await screen.findAllByTestId("record-item");
    expect(items.at(-1)?.getAttribute("data-outcome")).toBe("correctWithVisualHelp"); // newest first: the first question is last
  });

  it("does not record an explanation step that was requested but never presented", async () => {
    const api = createFakeApi();
    const { user } = await renderPractice(api);
    await user.type(screen.getByTestId("answer"), "3");
    await user.click(screen.getByTestId("check"));
    await screen.findByTestId("result");
    await user.click(screen.getByTestId("toggle-explanation"));
    api.hold("getStep");
    await user.click(screen.getByTestId("explanation-next"));
    await user.click(screen.getByTestId("harder"));
    await user.click(screen.getByTestId("another"));
    await waitFor(() => expect(prompt()).toBe("8 pluss 5. Hva er summen?"));
    api.release("getStep");
    await waitFor(() => expect(api.calls.filter((c) => c.startsWith("getStep explanation"))).toHaveLength(1));
    await new Promise((resolve) => setTimeout(resolve, 20));
    const supportKinds = (index: number) => stored().deliveries[index].events.filter((e: StoredEvent) => e.type === "support").map((e: StoredEvent) => e.kind);
    expect(supportKinds(0)).toEqual(["explanation-open"]); // the request was recorded; the step was never presented
    expect(kindsOf(0)).not.toContain("skipped"); // answered, so not skipped
    expect(kindsOf(1)).toEqual([]);
  });

  it("does not record a reveal whose panel was closed before it arrived", async () => {
    const api = createFakeApi();
    const { user } = await renderPractice(api);
    await user.click(screen.getByTestId("toggle-help"));
    for (let i = 0; i < 3; i++) await user.click(screen.getByTestId("help-next"));
    await waitFor(() => expect(kindsOf(0).filter((k) => k === "help-step")).toHaveLength(3));
    api.hold("getStep");
    await user.click(screen.getByTestId("help-next")); // the revealing step
    await user.click(screen.getByTestId("toggle-help")); // closed before it arrives
    api.release("getStep");
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(kindsOf(0)).not.toContain("counting-complete");
    expect(kindsOf(0).filter((k) => k === "help-step")).toHaveLength(3);

    await user.click(screen.getByTestId("toggle-help")); // reopened: still at the last presented step
    expect(screen.queryByTestId("help-revealed")).toBeNull();
    expect(screen.getByTestId("help-step-text").textContent).toContain("Steg 3 av 4");

    await user.type(screen.getByTestId("answer"), "8");
    await user.click(screen.getByTestId("check"));
    await screen.findByTestId("result");
    await user.click(screen.getByText("Mitt arbeid"));
    const items = await screen.findAllByTestId("record-item");
    expect(items[0]?.getAttribute("data-outcome")).toBe("correctWithVisualHelp");
  });

  it("does not record a reveal that arrives after the learner left the practice view", async () => {
    const api = createFakeApi();
    const { user } = await renderPractice(api);
    await user.click(screen.getByTestId("toggle-help"));
    for (let i = 0; i < 3; i++) await user.click(screen.getByTestId("help-next"));
    await waitFor(() => expect(kindsOf(0).filter((k) => k === "help-step")).toHaveLength(3));
    api.hold("getStep");
    await user.click(screen.getByTestId("help-next"));
    await user.click(screen.getByText("Mitt arbeid"));
    await screen.findAllByTestId("record-item");
    api.release("getStep");
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(kindsOf(0)).not.toContain("counting-complete");
    expect(kindsOf(0).filter((k) => k === "help-step")).toHaveLength(3);
    expect(kindsOf(0).at(-1)).toBe("ended");
  });

  it("does not record an explanation step whose panel was closed before it arrived", async () => {
    const api = createFakeApi();
    const { user } = await renderPractice(api);
    await user.type(screen.getByTestId("answer"), "3");
    await user.click(screen.getByTestId("check"));
    await screen.findByTestId("result");
    await user.click(screen.getByTestId("toggle-explanation"));
    api.hold("getStep");
    await user.click(screen.getByTestId("explanation-next"));
    await user.click(screen.getByTestId("toggle-explanation"));
    api.release("getStep");
    await new Promise((resolve) => setTimeout(resolve, 20));
    const supportKinds = stored().deliveries[0].events.filter((e: StoredEvent) => e.type === "support").map((e: StoredEvent) => e.kind);
    expect(supportKinds).toEqual(["explanation-open"]);
  });

  it("lets only the most recent question request become the current question", async () => {
    const api = createFakeApi();
    const { user } = await renderPractice(api);
    api.hold("getInstance");
    await user.click(screen.getByTestId("another"));
    await user.click(screen.getByTestId("harder"));
    await user.click(screen.getByTestId("another"));
    api.release("getInstance");
    await waitFor(() => expect(prompt()).toBe("8 pluss 5. Hva er summen?"));
    expect(stored().deliveries).toHaveLength(2); // the superseded within-ten request never became a delivery
    expect(screen.getByTestId("ladder-current").textContent).toBe("Nå: Over tieren, som 8 + 5.");
  });
});

describe("the lesson link", () => {
  it("leads to the lesson from the keyboard, which records lesson support once it is shown (specs/003)", async () => {
    const { user } = await renderPractice();
    screen.getByTestId("to-lesson").focus();
    await user.keyboard("{Enter}");
    await screen.findByTestId("lesson-page");
    await screen.findByTestId("lesson-content");
    await waitFor(() => expect(kindsOf(0)).toEqual(["ended", "lesson-opened"]));
  });
});

describe("choosing a practice entry on the lesson page", () => {
  it("honours a different variation than the one in progress", async () => {
    const { user } = await renderAt(lessonPath);
    await user.click(await screen.findByTestId("practice-numbers.addition.within-10"));
    await waitFor(() => expect(prompt()).toBe("4 pluss 4. Hva er summen?"));
    await user.click(screen.getByTestId("to-lesson"));
    await user.click(await screen.findByTestId("practice-numbers.addition.crossing-ten"));
    await waitFor(() => expect(prompt()).toBe("8 pluss 5. Hva er summen?"));
    expect(screen.getByTestId("ladder-current").textContent).toBe("Nå: Over tieren, som 8 + 5.");
    expect(screen.queryByTestId("ladder-pending")).toBeNull();
    expect(stored().deliveries).toHaveLength(2);
    expect(kindsOf(0)).toContain("skipped");
  });

  it("resumes the question in progress when the same variation is chosen again", async () => {
    const { user } = await renderAt(lessonPath);
    await user.click(await screen.findByTestId("practice-numbers.addition.within-10"));
    await waitFor(() => expect(prompt()).toBe("4 pluss 4. Hva er summen?"));
    await user.type(screen.getByTestId("answer"), "5");
    await user.click(screen.getByTestId("to-lesson"));
    await user.click(await screen.findByTestId("practice-numbers.addition.within-10"));
    await waitFor(() => expect(prompt()).toBe("4 pluss 4. Hva er summen?"));
    expect((screen.getByTestId("answer") as HTMLInputElement).value).toBe("5");
    expect(stored().deliveries).toHaveLength(1);
  });

  it("keeps the question and ladder position in progress when the chosen variation cannot be fetched, and retries", async () => {
    const api = createFakeApi();
    const { user } = await renderAt(lessonPath, api);
    await user.click(await screen.findByTestId("practice-numbers.addition.within-10"));
    await waitFor(() => expect(prompt()).toBe("4 pluss 4. Hva er summen?"));
    await user.click(screen.getByTestId("harder"));
    expect(screen.getByTestId("ladder-pending")).toBeTruthy();
    await user.click(screen.getByTestId("to-lesson"));
    api.fail.add("getInstance");
    await user.click(await screen.findByTestId("practice-numbers.addition.crossing-ten"));
    await screen.findByText("Oppgaven kunne ikke hentes. Prøv igjen.");
    expect(prompt()).toBe("4 pluss 4. Hva er summen?");
    expect(screen.getByTestId("ladder-current").textContent).toBe("Nå: Summen er høyst 10.");
    expect(screen.getByTestId("ladder-pending")).toBeTruthy(); // nothing committed on failure
    expect(stored().deliveries).toHaveLength(1);

    api.fail.delete("getInstance");
    await user.click(screen.getByTestId("to-lesson"));
    await user.click(await screen.findByTestId("practice-numbers.addition.crossing-ten"));
    await waitFor(() => expect(prompt()).toBe("8 pluss 5. Hva er summen?"));
    expect(screen.getByTestId("ladder-current").textContent).toBe("Nå: Over tieren, som 8 + 5.");
    expect(screen.queryByTestId("ladder-pending")).toBeNull();
    expect(stored().deliveries).toHaveLength(2);
  });

  it("honours a different variation after a reload restored the old session", async () => {
    const first = await renderAt(lessonPath);
    await first.user.click(await screen.findByTestId("practice-numbers.addition.within-10"));
    await waitFor(() => expect(prompt()).toBe("4 pluss 4. Hva er summen?"));
    await first.user.click(screen.getByTestId("to-lesson"));
    await screen.findByTestId("lesson-page");
    const saved = window.localStorage.getItem("mathkx.guest.v1");
    document.body.innerHTML = "";

    window.localStorage.setItem("mathkx.guest.v1", saved ?? "");
    render(<App api={createFakeApi()} initialPath={lessonPath} />);
    const user = userEvent.setup();
    await user.click(await screen.findByTestId("practice-numbers.addition.crossing-ten"));
    await waitFor(() => expect(prompt()).toBe("8 pluss 5. Hva er summen?"));
    expect(stored().deliveries).toHaveLength(2);
  });
});

describe("a pending challenge change", () => {
  it("stays pending when the question cannot be fetched and applies with the question that loads", async () => {
    const api = createFakeApi();
    const { user } = await renderPractice(api);
    await user.click(screen.getByTestId("harder"));
    api.fail.add("getInstance");
    await user.click(screen.getByTestId("another"));
    await screen.findByText("Oppgaven kunne ikke hentes. Prøv igjen.");
    expect(screen.getByTestId("ladder-pending").textContent).toBe("Neste oppgave: Over tieren, som 8 + 5.");
    expect(prompt()).toBe("4 pluss 4. Hva er summen?");
    expect(challengesOf(0)).toEqual(["harder:requested", "another:requested"]);

    api.fail.delete("getInstance");
    await user.click(screen.getByTestId("another"));
    await waitFor(() => expect(prompt()).toBe("8 pluss 5. Hva er summen?"));
    expect(screen.queryByTestId("ladder-pending")).toBeNull();
    expect(challengesOf(0)).toEqual(["harder:requested", "another:requested", "another:requested", "harder:applied"]);
    expect(challengesOf(1)).toEqual([]);
  });
});
