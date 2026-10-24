import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { App } from "../src/App";
import { createFakeApi } from "./fakeApi";

const practicePath = "/practice/numbers.addition-within-20";

async function renderPractice(api = createFakeApi()) {
  window.localStorage.clear();
  const result = render(<App api={api} initialPath={practicePath} />);
  await screen.findByTestId("prompt");
  return { ...result, api, user: userEvent.setup() };
}

afterEach(() => {
  window.localStorage.clear();
});

describe("the practice screen", () => {
  it("shows the expression, field, submit, and help toggle, and no total anywhere", async () => {
    await renderPractice();
    expect(screen.getByTestId("prompt").getAttribute("aria-label")).toBe("4 pluss 4. Hva er summen?");
    expect(screen.getByTestId("answer")).toBeTruthy();
    expect(screen.getByTestId("check")).toBeTruthy();
    expect(screen.getByTestId("toggle-help").getAttribute("aria-expanded")).toBe("false");
    expect(screen.getByTestId("exercise-shell").textContent).not.toMatch(/\b8\b/);
  });

  it("confirms a correct answer with the completed equation", async () => {
    const { user } = await renderPractice();
    await user.type(screen.getByTestId("answer"), "8");
    await user.click(screen.getByTestId("check"));
    const result = await screen.findByTestId("result");
    expect(result.getAttribute("data-status")).toBe("correct");
    expect(result.textContent).toContain("Riktig. 4 + 4 = 8.");
  });

  it("keeps the field editable after an incorrect answer and shows the code text", async () => {
    const api = createFakeApi({ pairs: { "numbers.addition.within-10": [3, 5] } });
    const { user } = await renderPractice(api);
    await user.type(screen.getByTestId("answer"), "3");
    await user.click(screen.getByTestId("check"));
    const result = await screen.findByTestId("result");
    expect(result.getAttribute("data-status")).toBe("incorrect");
    expect(result.textContent).toContain("3 er antallet i én av gruppene");
    expect(result.textContent).toContain("Du kan endre svaret og sjekke igjen.");
    const field = screen.getByTestId("answer") as HTMLInputElement;
    expect(field.value).toBe("3");
    await user.clear(field);
    await user.type(field, "8");
    await user.click(screen.getByTestId("check"));
    await waitFor(() => expect(screen.getByTestId("result").getAttribute("data-status")).toBe("correct"));
  });

  it("treats unreadable input as guidance and records input-guidance, not a submission", async () => {
    const { user } = await renderPractice();
    await user.type(screen.getByTestId("answer"), "abc");
    await user.click(screen.getByTestId("check"));
    const result = await screen.findByTestId("result");
    expect(result.getAttribute("data-status")).toBe("invalid-response");
    expect(result.textContent).toContain("abc");
    const stored = JSON.parse(window.localStorage.getItem("mathkx.guest.v1") ?? "{}");
    const events = stored.value.deliveries[0].events;
    expect(events.map((e: { type: string }) => e.type)).toEqual(["input-guidance"]);
    expect(screen.queryByTestId("toggle-explanation")).toBeNull();
  });

  it("opens help showing the operands only, fetches steps one at a time, and records the reveal", async () => {
    const { user, api } = await renderPractice();
    await user.type(screen.getByTestId("answer"), "7");
    await user.click(screen.getByTestId("toggle-help"));
    expect(screen.getByTestId("toggle-help").getAttribute("aria-expanded")).toBe("true");
    const panel = screen.getByTestId("help-panel");
    expect(within(panel).getByLabelText("Første gruppe, 4 brikker")).toBeTruthy();
    expect(within(panel).getByLabelText("Andre gruppe, 4 brikker")).toBeTruthy();
    expect(panel.textContent).not.toMatch(/\b8\b/);
    expect(api.calls.filter((c) => c.startsWith("getStep"))).toHaveLength(0);
    expect((screen.getByTestId("answer") as HTMLInputElement).value).toBe("7");

    await user.click(screen.getByTestId("help-next"));
    await screen.findByTestId("help-step-text");
    expect(api.calls.filter((c) => c.startsWith("getStep"))).toEqual(["getStep help 0"]);
    await user.click(screen.getByTestId("help-next"));
    await user.click(screen.getByTestId("help-next"));
    await user.click(screen.getByTestId("help-next"));
    await screen.findByTestId("help-revealed");
    expect(screen.getByTestId("help-revealed").textContent).toBe("Svaret er vist.");
    expect(screen.queryByTestId("help-next")).toBeNull();
    const stored = JSON.parse(window.localStorage.getItem("mathkx.guest.v1") ?? "{}");
    const kinds = stored.value.deliveries[0].events.map((e: { kind?: string; type: string }) => e.kind ?? e.type);
    expect(kinds).toEqual(["visual-help-opened", "help-step", "help-step", "help-step", "help-step", "counting-complete"]);
  });

  it("offers the explanation after a correct and after an incorrect result and records its steps", async () => {
    const api = createFakeApi({ pairs: { "numbers.addition.within-10": [3, 5] } });
    const { user } = await renderPractice(api);
    await user.type(screen.getByTestId("answer"), "3");
    await user.click(screen.getByTestId("check"));
    await screen.findByTestId("result");
    await user.click(screen.getByTestId("toggle-explanation"));
    await user.click(screen.getByTestId("explanation-next"));
    await screen.findByTestId("explanation-step-text");
    let stored = JSON.parse(window.localStorage.getItem("mathkx.guest.v1") ?? "{}");
    let kinds = stored.value.deliveries[0].events.map((e: { kind?: string; type: string }) => e.kind ?? e.type);
    expect(kinds).toEqual(["submission", "explanation-open", "explanation-step"]);

    await user.clear(screen.getByTestId("answer"));
    await user.type(screen.getByTestId("answer"), "8");
    await user.click(screen.getByTestId("check"));
    await waitFor(() => expect(screen.getByTestId("result").getAttribute("data-status")).toBe("correct"));
    expect(screen.getByTestId("toggle-explanation")).toBeTruthy();
    stored = JSON.parse(window.localStorage.getItem("mathkx.guest.v1") ?? "{}");
    kinds = stored.value.deliveries[0].events.map((e: { kind?: string; type: string }) => e.kind ?? e.type);
    expect(kinds.at(-1)).toBe("submission");
  });

  it("preserves question, draft, and help state across a language switch", async () => {
    const { user } = await renderPractice();
    await user.type(screen.getByTestId("answer"), "6");
    await user.click(screen.getByTestId("toggle-help"));
    await user.click(screen.getByTestId("lang-en"));
    expect(screen.getByTestId("prompt").getAttribute("aria-label")).toBe("4 plus 4. What is the sum?");
    expect((screen.getByTestId("answer") as HTMLInputElement).value).toBe("6");
    expect(screen.getByTestId("toggle-help").getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByTestId("toggle-help").textContent).toBe("Hide visual help");
    expect(screen.getByTestId("check").textContent).toBe("Check answer");
  });

  it("requests a new seed in the current definition for another question", async () => {
    const { user, api } = await renderPractice();
    await user.click(screen.getByTestId("another"));
    await waitFor(() => expect(api.calls.filter((c) => c.startsWith("getInstance numbers.addition.within-10"))).toHaveLength(2));
    const seeds = api.calls.filter((c) => c.startsWith("getInstance")).map((c) => c.split(" ").at(-1));
    expect(seeds[0]).not.toBe(seeds[1]);
    expect(seeds.every((s) => /^(0|[1-9][0-9]*)$/.test(s ?? ""))).toBe(true);
  });

  it("records the lesson link as non-revealing support and resumes the question on return", async () => {
    const { user } = await renderPractice();
    await user.type(screen.getByTestId("answer"), "5");
    await user.click(screen.getByTestId("to-lesson"));
    await screen.findByTestId("lesson-page");
    let stored = JSON.parse(window.localStorage.getItem("mathkx.guest.v1") ?? "{}");
    const kinds = stored.value.deliveries[0].events.map((e: { kind?: string; type: string }) => e.kind ?? e.type);
    expect(kinds).toEqual(["lesson-opened", "ended"]);
    expect(stored.value.resumable.draft).toBe("5");
    await user.click(screen.getByTestId("practice-numbers.addition.within-10"));
    await screen.findByTestId("prompt");
    expect((screen.getByTestId("answer") as HTMLInputElement).value).toBe("5");
    stored = JSON.parse(window.localStorage.getItem("mathkx.guest.v1") ?? "{}");
    expect(stored.value.deliveries).toHaveLength(1);
  });

  it("keeps the typed answer and says the answer could not be checked when the service is unreachable", async () => {
    const { user } = await renderPractice(createFakeApi({ failValidate: true }));
    await user.type(screen.getByTestId("answer"), "8");
    await user.click(screen.getByTestId("check"));
    const notice = await screen.findByTestId("notice");
    expect(notice.textContent).toContain("kunne ikke sjekkes");
    expect((screen.getByTestId("answer") as HTMLInputElement).value).toBe("8");
  });
});
