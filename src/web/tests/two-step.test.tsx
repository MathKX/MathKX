// specs/011: ax + c = b. The lesson's two-step explorer, and practice of 2x + 3 = 11 with both steps on the balance as
// visual help. The service supplies every state and judges every answer; the app draws what it is given.
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { App } from "../src/App";
import { TwoStepExplorer } from "../src/components/math/TwoStepExplorer";
import { BONDS_SKILL, EQUATIONS_SKILL, SKILL, TWO_STEP_SKILL, createFakeApi } from "./fakeApi";

const figure = () => screen.getByTestId("two-step-explorer");
const button = (id: string) => screen.getByTestId(id) as HTMLButtonElement;
const equation = () => screen.getByTestId("two-step-equation").textContent?.replace(/\s+/g, "");
const sentence = () => screen.getByTestId("two-step-sentence").textContent;
const live = () => screen.getByTestId("two-step-live").textContent;

afterEach(() => window.localStorage.clear());

describe("the two-step explorer", () => {
  it("asks the service for 2x + 3 = 11 and starts with the loose weights beside the boxes", async () => {
    const api = createFakeApi();
    render(<TwoStepExplorer a={2} c={3} b={11} lang="en" api={api} />);
    await screen.findByTestId("balance-scale");
    expect(api.calls).toContain("getTwoStepExplorer 2 3 11");
    expect(equation()).toBe("2x+3=11");
    expect(figure().dataset.left).toBe("3");
    expect(screen.getByTestId("balance-pan-left").querySelectorAll(".mkx-balance__unknown")).toHaveLength(2);
    expect(screen.getByTestId("balance-pan-left").getAttribute("data-left")).toBe("3");
    expect(sentence()).toBe("3 loose weights are still beside the boxes. Take them off both pans first, so the boxes stand alone.");
    // Sharing waits until the boxes stand alone.
    expect(button("two-step-deal").disabled).toBe(true);
    expect(button("two-step-keep").disabled).toBe(true);
    expect(button("two-step-take").disabled).toBe(false);
  });

  it("takes the loose weights off both pans, then shares, then keeps one box and one group to find x", async () => {
    render(<TwoStepExplorer a={2} c={3} b={11} lang="en" api={createFakeApi()} />);
    const user = userEvent.setup();
    await screen.findByTestId("balance-scale");

    await user.click(button("two-step-take"));
    expect(equation()).toBe("2x+2=10");
    expect(live()).toBe(
      "Left pan: 2 boxes of x and 2 weights. Right pan: 10 weights. The scale is level. 2 loose weights are still beside the boxes. Take them off both pans first, so the boxes stand alone.",
    );
    // A weight taken off is drawn as an outline on both pans.
    expect(screen.getByTestId("balance-pan-left").querySelectorAll(".mkx-balance__unit--taken")).toHaveLength(1);
    expect(screen.getByTestId("balance-pan-right").querySelectorAll(".mkx-balance__unit--taken")).toHaveLength(1);

    for (let i = 0; i < 2; i++) await user.click(button("two-step-take"));
    expect(equation()).toBe("2x=8");
    expect(button("two-step-take").disabled).toBe(true);
    expect(button("two-step-deal").disabled).toBe(false);
    expect(live()).toContain("The boxes stand alone: 2x = 8. Now share the 8 weights into 2 equal groups.");

    for (let i = 0; i < 4; i++) await user.click(button("two-step-deal"));
    expect(figure().dataset.loose).toBe("0");
    expect(live()).toContain("Every weight is shared. Now keep one box and one group.");

    await user.click(button("two-step-keep"));
    expect(figure().dataset.solved).toBe("true");
    expect(equation()).toBe("x=4");
    expect(sentence()).toBe("One box balances one group, so x = 4. Check: 2 × 4 + 3 = 11.");
    expect(screen.getByRole("img").getAttribute("aria-label")).toContain("x = 4");

    await user.click(button("two-step-undo"));
    expect(figure().dataset.solved).toBe("false");
    await user.click(button("two-step-reset"));
    expect(equation()).toBe("2x+3=11");
    expect(button("two-step-undo").disabled).toBe(true);
  });

  it("labels its controls as one group with 44-pixel targets, in Norwegian too", async () => {
    render(<TwoStepExplorer a={2} c={3} b={11} lang="nb" api={createFakeApi()} />);
    const group = await screen.findByRole("group", { name: "Løs i to steg" });
    const buttons = within(group).getAllByRole("button");
    expect(buttons.map((b) => b.textContent)).toEqual(["Ta ett lodd av begge skålene", "Gi hver gruppe ett lodd", "Behold én boks og én gruppe", "Angre", "Start på nytt"]);
    expect(buttons.every((b) => b.classList.contains("mkx-target"))).toBe(true);
  });

  it("offers a retry when the service fails", async () => {
    const api = createFakeApi();
    api.fail.add("getTwoStepExplorer");
    render(<TwoStepExplorer a={2} c={3} b={11} lang="en" api={api} />);
    await screen.findByTestId("visual-failed");
    api.fail.delete("getTwoStepExplorer");
    await userEvent.setup().click(within(screen.getByTestId("visual-failed")).getByRole("button"));
    expect(await screen.findByTestId("balance-scale")).toBeTruthy();
  });
});

describe("practice of ax + c = b", () => {
  async function renderTwoStep() {
    window.localStorage.clear();
    const api = createFakeApi({ skills: [SKILL, BONDS_SKILL, EQUATIONS_SKILL, TWO_STEP_SKILL] });
    render(<App api={api} initialPath="/practice/algebra.two-step-equations" />);
    await waitFor(() => expect(screen.getByTestId("prompt").dataset.form).toBe("two-step"));
    return { api, user: userEvent.setup() };
  }

  const answer = async (user: ReturnType<typeof userEvent.setup>, text: string) => {
    const field = screen.getByTestId("answer");
    await user.clear(field);
    await user.type(field, text);
    await user.click(screen.getByTestId("check"));
    return screen.findByTestId("result");
  };

  it("asks 2x + 3 = 11, reads it aloud, and names the likely mistake", async () => {
    const { user } = await renderTwoStep();
    const prompt = screen.getByTestId("prompt");
    expect(prompt.textContent?.replace(/\s+/g, "")).toBe("2x+3=11");
    expect(prompt.getAttribute("aria-label")).toBe("2 ganger x pluss 3 er lik 11. Hva er x?");
    expect((await answer(user, "8")).textContent).toContain("8 er 11 − 3: Det var riktig å ta bort 3.");
    expect((await answer(user, "7")).textContent).toContain("Det ser ut som du la til 3.");
    expect((await answer(user, "6")).textContent).toContain("2x betyr 2 ganger x, ikke 2 + x.");
    await answer(user, "4");
    await waitFor(() => expect(screen.getByTestId("result").getAttribute("data-status")).toBe("correct"));
    expect(screen.getByTestId("result").textContent).toContain("Riktig. x = 4, fordi 2 × 4 + 3 = 11.");
  });

  it("steps through both moves in visual help, showing x only on the last step", async () => {
    const { user } = await renderTwoStep();
    await user.click(screen.getByTestId("toggle-help"));
    const panel = await screen.findByTestId("help-panel");
    await within(panel).findByTestId("two-step-step");

    await user.click(within(panel).getByTestId("help-next"));
    expect((await within(panel).findByTestId("help-step-text")).textContent).toContain("Vekta er i balanse: 2 bokser med x og 3 lodd i venstre skål, 11 lodd i høyre.");
    await user.click(within(panel).getByTestId("help-next"));
    await waitFor(() => expect(within(panel).getByTestId("balance-pan-left").getAttribute("data-left")).toBe("0"));
    expect(within(panel).getByTestId("help-step-text").textContent).toContain("boksene står alene: 2x = 8.");
    await user.click(within(panel).getByTestId("help-next"));
    await waitFor(() => expect(within(panel).getByTestId("balance-pan-right").getAttribute("data-each")).toBe("1"));
    expect(panel.textContent).not.toMatch(/x = 4/);

    await user.click(within(panel).getByTestId("help-next"));
    await within(panel).findByTestId("help-revealed");
    expect(within(panel).getByTestId("help-step-text").textContent).toContain("så x = 4. Sjekk: 2 × 4 + 3 = 11.");
  });
});
