// specs/008: the balance explorer for x + a = b. It draws the service's states and computes nothing itself.
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { BalanceExplorer } from "../src/components/math/BalanceExplorer";
import { createFakeApi } from "./fakeApi";

const figure = () => screen.getByTestId("balance-explorer");
const equation = () => screen.getByTestId("balance-equation").textContent?.replace(/\s+/g, "");
const button = (id: string) => screen.getByTestId(id) as HTMLButtonElement;

describe("the balance explorer", () => {
  it("asks the service for the authored equation and starts level", async () => {
    const api = createFakeApi();
    render(<BalanceExplorer a={3} b={7} lang="en" api={api} />);
    expect(await screen.findByTestId("balance-scale")).toBeTruthy();
    expect(api.calls).toContain("getBalanceExplorer 3 7");
    expect(figure().dataset.tilt).toBe("balanced");
    expect(equation()).toBe("x+3=7");
    expect(screen.getByTestId("balance-sentence").textContent).toBe("The scale is level.");
    expect(screen.queryByTestId("balance-hint")).toBeNull();
    expect(button("balance-undo").disabled).toBe(true);
    expect(button("balance-reset").disabled).toBe(true);
    expect(screen.getByTestId("balance-pan-left").querySelectorAll(".mkx-balance__unit:not(.mkx-balance__unit--taken)")).toHaveLength(3);
    expect(screen.getByTestId("balance-pan-right").querySelectorAll(".mkx-balance__unit:not(.mkx-balance__unit--taken)")).toHaveLength(7);
  });

  it("tips toward the heavier pan when only one side changes, and Undo levels it again", async () => {
    render(<BalanceExplorer a={3} b={7} lang="en" api={createFakeApi()} />);
    const user = userEvent.setup();
    await screen.findByTestId("balance-scale");

    await user.click(button("balance-right"));
    expect(figure().dataset.tilt).toBe("left-down");
    expect(equation()).toBe("x+3≠6");
    expect(screen.getByTestId("balance-sentence").textContent).toBe("The scale tips: the left pan is heavier.");
    expect(screen.getByTestId("balance-hint")).toBeTruthy();
    expect(screen.getByTestId("balance-pan-right").querySelectorAll(".mkx-balance__unit--taken")).toHaveLength(1);

    await user.click(button("balance-undo"));
    expect(figure().dataset.tilt).toBe("balanced");
    expect(equation()).toBe("x+3=7");

    await user.click(button("balance-left"));
    expect(figure().dataset.tilt).toBe("right-down");
    const hint = "The two sides are no longer equal. Undo, and take the same off both pans.";
    const live = screen.getByTestId("balance-live").textContent ?? "";
    expect(live).toBe(`Left pan: x and 2. Right pan: 7. The scale tips: the right pan is heavier. ${hint}`);
    expect(live.split(hint)).toHaveLength(2); // announced once
    expect(screen.getByRole("img").getAttribute("aria-label")).toContain(hint);

    await user.click(button("balance-undo"));
    expect(screen.getByTestId("balance-live").textContent).not.toContain(hint);
  });

  it("solves the equation when the same is taken off both pans until x stands alone", async () => {
    render(<BalanceExplorer a={3} b={7} lang="nb" api={createFakeApi()} />);
    const user = userEvent.setup();
    await screen.findByTestId("balance-scale");

    for (let i = 0; i < 3; i++) {
      await user.click(button("balance-both"));
      expect(figure().dataset.tilt).toBe("balanced");
    }
    expect(figure().dataset.solved).toBe("true");
    expect(equation()).toBe("x=4");
    expect(screen.getByTestId("balance-solved").textContent).toBe("x står alene og vekta er i balanse, så x = 4. Sjekk: 4 + 3 = 7.");
    expect(screen.getByTestId("balance-live").textContent).toBe("Venstre skål: bare x. Høyre skål: 4. Vekta er i balanse. x står alene og vekta er i balanse, så x = 4. Sjekk: 4 + 3 = 7.");
    expect(button("balance-both").disabled).toBe(true);
    expect(button("balance-left").disabled).toBe(true);
    expect(screen.getByRole("img").getAttribute("aria-label")).toContain("x = 4");

    await user.click(button("balance-reset"));
    expect(figure().dataset.solved).toBe("false");
    expect(equation()).toBe("x+3=7");
    expect(button("balance-undo").disabled).toBe(true);
  });

  it("labels its controls as one group with 44-pixel targets", async () => {
    render(<BalanceExplorer a={5} b={12} lang="en" api={createFakeApi()} />);
    const group = await screen.findByRole("group", { name: "Change the scale" });
    const buttons = within(group).getAllByRole("button");
    expect(buttons.map((b) => b.textContent)).toEqual(["Take 1 off both pans", "Take 1 off the left pan", "Take 1 off the right pan", "Undo", "Start again"]);
    expect(buttons.every((b) => b.classList.contains("mkx-target"))).toBe(true);
  });

  it("offers a retry when the service fails", async () => {
    const api = createFakeApi();
    api.fail.add("getBalanceExplorer");
    render(<BalanceExplorer a={3} b={7} lang="en" api={api} />);
    expect((await screen.findByTestId("visual-failed")).textContent).toContain("This illustration could not be loaded.");

    api.fail.delete("getBalanceExplorer");
    await userEvent.setup().click(within(screen.getByTestId("visual-failed")).getByRole("button"));
    expect(await screen.findByTestId("balance-scale")).toBeTruthy();
  });
});
