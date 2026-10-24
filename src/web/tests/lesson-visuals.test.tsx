// specs/003 User Story 3 and FR-007 to FR-009: the ten-frame explorer and the step-through visuals in the lesson.
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { App } from "../src/App";
import { StepVisual } from "../src/components/math/StepVisual";
import { TenFrameExplorer } from "../src/components/math/TenFrameExplorer";
import { createFakeApi } from "./fakeApi";

afterEach(() => window.localStorage.clear());

describe("the ten-frame explorer", () => {
  it("starts at the authored value with its partner, and moves by arrow keys, Home, and End", async () => {
    render(<TenFrameExplorer start={3} lang="nb" api={createFakeApi()} />);
    const user = userEvent.setup();
    expect((await screen.findByTestId("explorer-sentence")).textContent).toBe("3 og 7 blir 10.");
    expect(screen.getByTestId("ten-frame").querySelectorAll(".mkx-cell--a")).toHaveLength(3);
    expect((screen.getByTestId("explorer-3") as HTMLInputElement).checked).toBe(true);

    await user.click(screen.getByTestId("explorer-3"));
    await user.keyboard("{ArrowRight}");
    expect(screen.getByTestId("explorer-sentence").textContent).toBe("4 og 6 blir 10.");
    await user.keyboard("{End}");
    expect(screen.getByTestId("explorer-sentence").textContent).toBe("10 og 0 blir 10.");
    expect(document.activeElement).toBe(screen.getByTestId("explorer-10"));
    await user.keyboard("{Home}");
    expect(screen.getByTestId("explorer-sentence").textContent).toBe("0 og 10 blir 10.");
    expect(screen.getByTestId("ten-frame").querySelectorAll(".mkx-cell--a")).toHaveLength(0);
  });

  it("announces the settled pair once, not every value on the way", async () => {
    render(<TenFrameExplorer start={3} lang="en" api={createFakeApi()} />);
    const user = userEvent.setup();
    const live = await screen.findByTestId("explorer-live");
    await waitFor(() => expect(live.textContent).toBe("3 and 7 make 10."));
    await user.click(screen.getByTestId("explorer-3"));
    await user.keyboard("{ArrowRight}{ArrowRight}{ArrowRight}");
    expect(live.textContent).toBe("3 and 7 make 10.");
    await waitFor(() => expect(live.textContent).toBe("6 and 4 make 10."));
  });

  it("labels every choice and gives each a 44-pixel target class", async () => {
    render(<TenFrameExplorer start={0} lang="en" api={createFakeApi()} />);
    const group = await screen.findByRole("group", { name: "Choose how many are filled" });
    expect(within(group).getAllByRole("radio")).toHaveLength(11);
    expect(group.querySelectorAll("label.mkx-target")).toHaveLength(11);
  });
});

describe("the step-through visual", () => {
  it("steps forward and back by keyboard and shows the total only on its last step", async () => {
    render(<StepVisual type="make-ten" a={8} b={5} lang="en" api={createFakeApi()} />);
    const user = userEvent.setup();
    const text = await screen.findByTestId("step-visual-text");
    const panel = screen.getByTestId("step-visual-make-ten");
    const hasTotal = () => (panel.textContent ?? "").includes("13") || [...panel.querySelectorAll("[aria-label]")].some((e) => (e.getAttribute("aria-label") ?? "").includes("13"));

    expect(text.textContent).toMatch(/^Step 1 of 4/);
    expect(hasTotal()).toBe(false);
    expect((screen.getByTestId("step-visual-previous") as HTMLButtonElement).disabled).toBe(true);
    screen.getByTestId("step-visual-next").focus();
    await user.keyboard("{Enter}");
    await user.keyboard("{Enter}");
    expect(text.textContent).toMatch(/^Step 3 of 4/);
    expect(hasTotal()).toBe(false);
    await user.keyboard("{Enter}");
    expect(text.textContent).toMatch(/^Step 4 of 4/);
    expect(hasTotal()).toBe(true);
    expect((screen.getByTestId("step-visual-next") as HTMLButtonElement).disabled).toBe(true);
    screen.getByTestId("step-visual-previous").focus();
    await user.keyboard("{Enter}");
    expect(text.textContent).toMatch(/^Step 3 of 4/);
  });

  it("asks for the authored values from the service", async () => {
    const api = createFakeApi();
    render(<StepVisual type="groups" a={4} b={4} lang="nb" api={api} />);
    await screen.findByTestId("step-visual-text");
    expect(api.calls).toContain("getVisualSteps groups 4 4");
  });
});

describe("the visuals inside the lesson", () => {
  it("render both visuals of the pilot lesson, and a failing one leaves the rest of the lesson usable", async () => {
    const api = createFakeApi();
    api.fail.add("getVisualSteps");
    render(<App api={api} initialPath="/lessons/number-bonds-to-ten" />);
    await screen.findByTestId("lesson-content");
    expect(await screen.findByTestId("ten-frame-explorer")).toBeTruthy();
    expect((await screen.findByTestId("visual-failed")).textContent).toContain("Denne illustrasjonen kunne ikke lastes.");
    expect(screen.getByRole("heading", { level: 2, name: /Hvorfor er det nyttig\?/ })).toBeTruthy();
    expect(screen.queryAllByTestId("lesson-unsupported")).toHaveLength(0);

    api.fail.delete("getVisualSteps");
    await userEvent.setup().click(within(screen.getByTestId("visual-failed")).getByRole("button"));
    expect(await screen.findByTestId("step-visual-make-ten")).toBeTruthy();
  });
});
