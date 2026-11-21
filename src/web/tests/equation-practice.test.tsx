// specs/009: practising x + a = b, with the balance as visual help. The service decides the form, judges the
// answer, and steps the balance; the app draws what it is given.
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { App } from "../src/App";
import { BONDS_SKILL, EQUATIONS_SKILL, SKILL, createFakeApi } from "./fakeApi";

const practicePath = "/practice/algebra.one-step-equations";

async function renderPractice(pairs: Record<string, [number, number]> = {}) {
  window.localStorage.clear();
  const api = createFakeApi({ skills: [SKILL, BONDS_SKILL, EQUATIONS_SKILL], pairs });
  const result = render(<App api={api} initialPath={practicePath} />);
  await screen.findByTestId("prompt");
  return { ...result, api, user: userEvent.setup() };
}

const answer = async (user: ReturnType<typeof userEvent.setup>, text: string) => {
  const field = screen.getByTestId("answer");
  await user.clear(field);
  await user.type(field, text);
  await user.click(screen.getByTestId("check"));
  return screen.findByTestId("result");
};

afterEach(() => {
  window.localStorage.clear();
  window.history.replaceState(null, "", "/");
});

const stored = () => JSON.parse(window.localStorage.getItem("mathkx.guest.v1") ?? "{}").value;

/** An in-app move to another address, as the browser's back and forward do. */
function go(path: string) {
  act(() => {
    window.history.pushState(null, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
}

async function renderAddition() {
  window.localStorage.clear();
  const api = createFakeApi({ skills: [SKILL, BONDS_SKILL, EQUATIONS_SKILL] });
  render(<App api={api} initialPath="/practice/numbers.addition-within-20" />);
  await screen.findByTestId("prompt");
  return { api, user: userEvent.setup() };
}

describe("practice of one-step equations", () => {
  it("asks x + a = b, reads it aloud as an equation, and shows no answer", async () => {
    await renderPractice();
    const prompt = screen.getByTestId("prompt");
    expect(prompt.dataset.form).toBe("unknown-addend");
    expect(prompt.textContent?.replace(/\s+/g, "")).toBe("x+3=7");
    expect(prompt.getAttribute("aria-label")).toBe("x pluss 3 er lik 7. Hva er x?");
    expect(screen.getByTestId("exercise-shell").textContent).not.toMatch(/\b4\b/);
  });

  it("confirms x with its check, and names the likely mistake for a wrong answer", async () => {
    const { user } = await renderPractice({ "algebra.one-step.within-10": [2, 9] });
    expect((await answer(user, "11")).textContent).toContain("11 er 2 + 9. For å få x alene skal du heller ta bort 2 fra begge sider.");
    expect((await answer(user, "9")).textContent).toContain("9 er høyre side.");
    expect((await answer(user, "2")).textContent).toContain("2 er tallet ved siden av x.");
    expect((await answer(user, "6")).textContent).toContain("Nesten. Sett 6 inn for x: 6 + 2 er én unna 9.");
    await answer(user, "7");
    await waitFor(() => expect(screen.getByTestId("result").getAttribute("data-status")).toBe("correct"));
    expect(screen.getByTestId("result").textContent).toContain("Riktig. x = 7, fordi 7 + 2 = 9.");
  });

  it("steps through the balance in visual help, showing x only on the last step", async () => {
    const { user } = await renderPractice();
    await user.click(screen.getByTestId("toggle-help"));
    const panel = await screen.findByTestId("help-panel");
    // Before the first step: the authored scale, level, with nothing asked of the service yet.
    expect((await within(panel).findByTestId("balance-step")).dataset.marked).toBe("0");
    expect(within(panel).getByTestId("balance-pan-left").getAttribute("data-remaining")).toBe("3");

    await user.click(within(panel).getByTestId("help-next"));
    expect((await within(panel).findByTestId("help-step-text")).textContent).toContain("Vekta er i balanse: x og 3 lodd i venstre skål, 7 lodd i høyre.");
    expect(within(panel).getByTestId("balance-pan-left").getAttribute("data-remaining")).toBe("3");
    expect(within(panel).getByTestId("balance-pan-right").getAttribute("data-remaining")).toBe("7");
    expect(within(panel).queryByTestId("help-revealed")).toBeNull();

    await user.click(within(panel).getByTestId("help-next"));
    await waitFor(() => expect(within(panel).getByTestId("balance-step").dataset.marked).toBe("3"));
    expect(within(panel).getAllByRole("img")[0]!.getAttribute("aria-label")).toBe("Venstre skål: x og 3. Høyre skål: 7. Vekta er i balanse. 3 lodd i hver skål er merket for å tas av.");
    expect(panel.querySelectorAll(".mkx-balance__unit--marked")).toHaveLength(6);
    expect(panel.textContent).not.toMatch(/x = 4/);

    await user.click(within(panel).getByTestId("help-next"));
    await within(panel).findByTestId("help-revealed");
    expect(within(panel).getByTestId("help-step-text").textContent).toContain("x står alene og vekta er i balanse, så x = 4. Sjekk: 4 + 3 = 7.");
    expect(within(panel).getByTestId("balance-pan-left").getAttribute("data-remaining")).toBe("0");
    expect(within(panel).getByTestId("balance-pan-right").getAttribute("data-remaining")).toBe("4");
    expect(panel.querySelectorAll(".mkx-balance__unit--taken")).toHaveLength(6);
  });

  it("lists the question in My work as an equation", async () => {
    const { user } = await renderPractice();
    await answer(user, "4");
    await waitFor(() => expect(screen.getByTestId("result").getAttribute("data-status")).toBe("correct"));
    await user.click(screen.getByRole("link", { name: "Mitt arbeid" }));
    const question = await screen.findByTestId("record-question");
    expect(question.textContent).toBe("x + 3 = 7");
  });
});

describe("moving between addition and equations (PR 63 review)", () => {
  it("drops a pending addition change when equations start, so Another question stays on the equations ladder", async () => {
    const { user, api } = await renderAddition();
    await user.click(screen.getByTestId("harder"));
    expect(screen.getByTestId("ladder-pending")).toBeTruthy();

    go("/practice/algebra.one-step-equations");
    await waitFor(() => expect(screen.getByTestId("prompt").dataset.form).toBe("unknown-addend"));
    expect(screen.queryByTestId("ladder-pending")).toBeNull();
    expect(stored().ladder.pending).toBeNull();

    await user.click(screen.getByTestId("another"));
    await waitFor(() => expect(api.calls.filter((c) => c.startsWith("getInstance algebra.one-step.within-10"))).toHaveLength(2));
    expect(api.calls.some((c) => c.startsWith("getInstance numbers.addition.crossing-ten"))).toBe(false);
    expect(screen.getByTestId("prompt").dataset.form).toBe("unknown-addend");
  });

  async function leaveAnUnansweredAdditionQuestion() {
    const { user } = await renderAddition();
    await user.type(screen.getByTestId("answer"), "7");
    await user.click(screen.getByTestId("finish-practice"));
    await screen.findByTestId("session-page");
    return { user, unfinished: stored().resumable.deliveryId as string };
  }

  it("does not resume an unanswered addition question under equations", async () => {
    const { unfinished } = await leaveAnUnansweredAdditionQuestion();
    go("/practice/algebra.one-step-equations");
    await waitFor(() => expect(screen.getByTestId("prompt").dataset.form).toBe("unknown-addend"));
    expect((screen.getByTestId("answer") as HTMLInputElement).value).toBe("");
    expect(stored().currentDeliveryId).not.toBe(unfinished);
    expect(screen.getByTestId("ladder-current").textContent).toBe("Nå: Likninger der høyre side er høyst 10.");
  });

  it("still resumes it, with its draft, in addition practice", async () => {
    const { unfinished } = await leaveAnUnansweredAdditionQuestion();
    go("/practice/numbers.addition-within-20");
    await waitFor(() => expect(stored().currentDeliveryId).toBe(unfinished));
    expect(screen.getByTestId("prompt").dataset.form).toBe("addition");
    expect((screen.getByTestId("answer") as HTMLInputElement).value).toBe("7");
  });
});
