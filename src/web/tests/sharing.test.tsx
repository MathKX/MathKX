// specs/010: ax = b. The lesson's sharing explorer, and practice of 3x = 12 with the sharing as visual help. The
// service supplies every state and judges every answer; the app draws what it is given.
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { App } from "../src/App";
import { SharingExplorer } from "../src/components/math/SharingExplorer";
import { BONDS_SKILL, EQUATIONS_SKILL, SKILL, createFakeApi } from "./fakeApi";

const figure = () => screen.getByTestId("sharing-explorer");
const button = (id: string) => screen.getByTestId(id) as HTMLButtonElement;
const equation = () => screen.getByTestId("sharing-equation").textContent?.replace(/\s+/g, "");

afterEach(() => window.localStorage.clear());

describe("the sharing explorer", () => {
  it("asks the service for 3x = 12 and starts with nothing shared", async () => {
    const api = createFakeApi();
    render(<SharingExplorer a={3} b={12} lang="en" api={api} />);
    await screen.findByTestId("balance-scale");
    expect(api.calls).toContain("getSharingExplorer 3 12");
    expect(equation()).toBe("3x=12");
    expect(figure().dataset.loose).toBe("12");
    expect(screen.getByTestId("balance-pan-left").querySelectorAll(".mkx-balance__unknown")).toHaveLength(3);
    expect(screen.getAllByTestId("sharing-group")).toHaveLength(3);
    expect(screen.getByTestId("sharing-sentence").textContent).toBe("Each group has 0. 12 weights are not shared yet.");
    expect(button("sharing-keep").disabled).toBe(true);
    expect(button("sharing-undo").disabled).toBe(true);
    expect(button("sharing-reset").disabled).toBe(true);
  });

  it("shares one round at a time, then keeps one box and one group to find x", async () => {
    render(<SharingExplorer a={3} b={12} lang="en" api={createFakeApi()} />);
    const user = userEvent.setup();
    await screen.findByTestId("balance-scale");

    await user.click(button("sharing-deal"));
    expect(figure().dataset.each).toBe("1");
    expect(figure().dataset.loose).toBe("9");
    expect(screen.getByTestId("sharing-live").textContent).toBe("Left pan: 3 boxes of x. Right pan: 1 weights in each of 3 groups, 9 not shared yet. The scale is level.");
    for (let i = 0; i < 3; i++) await user.click(button("sharing-deal"));
    expect(figure().dataset.loose).toBe("0");
    expect(button("sharing-deal").disabled).toBe(true);
    expect(screen.getByTestId("sharing-sentence").textContent).toBe("Every weight is shared: each group has 4. Now keep one box and one group.");

    await user.click(button("sharing-keep"));
    expect(figure().dataset.solved).toBe("true");
    expect(equation()).toBe("x=4");
    expect(screen.getByTestId("sharing-sentence").textContent).toBe("One box balances one group, so x = 4. Check: 3 × 4 = 12.");
    expect(screen.getByTestId("balance-pan-left").querySelectorAll(".mkx-balance__unknown--aside")).toHaveLength(2);
    expect(screen.getByTestId("balance-pan-right").querySelectorAll(".mkx-balance__unit--taken")).toHaveLength(8);
    expect(screen.getByRole("img").getAttribute("aria-label")).toContain("x = 4");

    await user.click(button("sharing-undo"));
    expect(figure().dataset.solved).toBe("false");
    await user.click(button("sharing-reset"));
    expect(figure().dataset.loose).toBe("12");
    expect(button("sharing-undo").disabled).toBe(true);
  });

  it("labels its controls as one group with 44-pixel targets, in Norwegian too", async () => {
    render(<SharingExplorer a={2} b={10} lang="nb" api={createFakeApi()} />);
    const group = await screen.findByRole("group", { name: "Del loddene" });
    const buttons = within(group).getAllByRole("button");
    expect(buttons.map((b) => b.textContent)).toEqual(["Gi hver gruppe ett lodd", "Behold én boks og én gruppe", "Angre", "Start på nytt"]);
    expect(buttons.every((b) => b.classList.contains("mkx-target"))).toBe(true);
  });

  it("offers a retry when the service fails", async () => {
    const api = createFakeApi();
    api.fail.add("getSharingExplorer");
    render(<SharingExplorer a={3} b={12} lang="en" api={api} />);
    await screen.findByTestId("visual-failed");
    api.fail.delete("getSharingExplorer");
    await userEvent.setup().click(within(screen.getByTestId("visual-failed")).getByRole("button"));
    expect(await screen.findByTestId("balance-scale")).toBeTruthy();
  });
});

describe("practice of ax = b", () => {
  async function renderTimes() {
    window.localStorage.clear();
    const api = createFakeApi({ skills: [SKILL, BONDS_SKILL, EQUATIONS_SKILL] });
    render(<App api={api} initialPath="/practice/algebra.one-step-equations" />);
    await screen.findByTestId("prompt");
    const user = userEvent.setup();
    // Up the ladder one rung at a time: right sides to 15, then ax = b.
    for (const rung of ["algebra.one-step.to-15", "algebra.one-step.times"]) {
      await user.click(screen.getByTestId("harder"));
      await user.click(screen.getByTestId("another"));
      await waitFor(() => expect(api.calls.some((c) => c.startsWith(`getInstance ${rung}@1`))).toBe(true));
    }
    await waitFor(() => expect(screen.getByTestId("prompt").dataset.form).toBe("unknown-factor"));
    return { api, user };
  }

  const answer = async (user: ReturnType<typeof userEvent.setup>, text: string) => {
    const field = screen.getByTestId("answer");
    await user.clear(field);
    await user.type(field, text);
    await user.click(screen.getByTestId("check"));
    return screen.findByTestId("result");
  };

  it("asks 3x = 12, reads it aloud, and names the likely mistake", async () => {
    const { user } = await renderTimes();
    const prompt = screen.getByTestId("prompt");
    expect(prompt.textContent?.replace(/\s+/g, "")).toBe("3x=12");
    expect(prompt.getAttribute("aria-label")).toBe("3 ganger x er lik 12. Hva er x?");
    expect(screen.getByTestId("ladder-current").textContent).toBe("Nå: Likninger som 3x = 12: del likt i grupper.");
    expect((await answer(user, "36")).textContent).toContain("36 er 3 × 12.");
    expect((await answer(user, "9")).textContent).toContain("9 er 12 − 3.");
    expect((await answer(user, "3")).textContent).toContain("3 er tallet foran x");
    await answer(user, "4");
    await waitFor(() => expect(screen.getByTestId("result").getAttribute("data-status")).toBe("correct"));
    expect(screen.getByTestId("result").textContent).toContain("Riktig. x = 4, fordi 3 × 4 = 12.");
  });

  it("steps through the sharing in visual help, showing x only on the last step", async () => {
    const { user } = await renderTimes();
    await user.click(screen.getByTestId("toggle-help"));
    const panel = await screen.findByTestId("help-panel");
    expect((await within(panel).findByTestId("sharing-step")).dataset.groups).toBe("false");

    await user.click(within(panel).getByTestId("help-next"));
    expect((await within(panel).findByTestId("help-step-text")).textContent).toContain("Vekta er i balanse: 3 bokser med x i venstre skål, 12 lodd i høyre.");
    await user.click(within(panel).getByTestId("help-next"));
    await waitFor(() => expect(within(panel).getByTestId("sharing-step").dataset.groups).toBe("true"));
    expect(panel.textContent).not.toMatch(/x = 4/);

    await user.click(within(panel).getByTestId("help-next"));
    await within(panel).findByTestId("help-revealed");
    expect(within(panel).getByTestId("help-step-text").textContent).toContain("Én boks veier like mye som én gruppe på 4, så x = 4. Sjekk: 3 × 4 = 12.");
    expect(within(panel).getByTestId("balance-pan-right").getAttribute("data-kept")).toBe("true");
  });
});
