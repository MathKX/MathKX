import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { App } from "../src/App";
import { brokenStorage, createFakeApi } from "./fakeApi";

const practicePath = "/practice/numbers.addition-within-20";
afterEach(() => window.localStorage.clear());

async function practiseThree(api = createFakeApi({ pairs: { "numbers.addition.within-10": [3, 5] } })) {
  window.localStorage.clear();
  render(<App api={api} initialPath={practicePath} />);
  const user = userEvent.setup();
  await screen.findByTestId("prompt");
  // 1: correct at once
  await user.type(screen.getByTestId("answer"), "8");
  await user.click(screen.getByTestId("check"));
  await screen.findByTestId("result");
  await user.click(screen.getByTestId("another"));
  await waitFor(() => expect(screen.queryByTestId("result")).toBeNull());
  // 2: incorrect then correct
  await user.type(screen.getByTestId("answer"), "3");
  await user.click(screen.getByTestId("check"));
  await screen.findByTestId("result");
  await user.clear(screen.getByTestId("answer"));
  await user.type(screen.getByTestId("answer"), "8");
  await user.click(screen.getByTestId("check"));
  await waitFor(() => expect(screen.getByTestId("result").getAttribute("data-status")).toBe("correct"));
  await user.click(screen.getByTestId("another"));
  await waitFor(() => expect(screen.queryByTestId("result")).toBeNull());
  // 3: visual help then correct
  await user.click(screen.getByTestId("toggle-help"));
  await user.type(screen.getByTestId("answer"), "8");
  await user.click(screen.getByTestId("check"));
  await screen.findByTestId("result");
  return user;
}

describe("the record page", () => {
  it("shows outcome labels, tags, and counts only, in the active language, and survives a reload", async () => {
    const user = await practiseThree();
    await user.click(screen.getByText("Mitt arbeid"));
    await screen.findByTestId("record-page");
    const items = screen.getAllByTestId("record-item");
    expect(items.map((i) => i.getAttribute("data-outcome"))).toEqual(["correctFirst", "correctAfterFeedback", "correctWithVisualHelp"]);
    expect(screen.getAllByTestId("record-tag").map((t) => t.textContent)).toEqual(["Visuell hjelp"]);
    const summary = screen.getByTestId("record-summary").textContent ?? "";
    expect(summary).toContain("3 oppgaver:");
    expect(summary).not.toMatch(/%|poeng|score/i);
    expect(screen.getByTestId("storage-note").textContent).toBe("Arbeidet ditt lagres bare i denne nettleseren.");

    await user.click(screen.getByTestId("lang-en"));
    expect(screen.getAllByTestId("record-item")[1]?.textContent).toContain("Correct after feedback");

    // Reload: a fresh app on the same storage shows the same record.
    const api = createFakeApi();
    render(<App api={api} initialPath="/record" />);
    await waitFor(() => expect(screen.getAllByTestId("record-item").length).toBeGreaterThanOrEqual(3));
  });

  it("continues practice and says the work is not being kept when storage is unavailable", async () => {
    render(<App api={createFakeApi()} initialPath={practicePath} storage={brokenStorage()} />);
    await screen.findByTestId("prompt");
    expect(screen.getByTestId("storage-note").textContent).toBe("Arbeidet ditt blir ikke lagret i denne nettleseren.");
    const user = userEvent.setup();
    await user.type(screen.getByTestId("answer"), "8");
    await user.click(screen.getByTestId("check"));
    expect((await screen.findByTestId("result")).getAttribute("data-status")).toBe("correct");
  });

  it("asks for confirmation before clearing and then empties the record", async () => {
    const user = await practiseThree();
    await user.click(screen.getByText("Mitt arbeid"));
    await screen.findByTestId("record-page");
    await user.click(screen.getByTestId("clear"));
    expect(screen.getAllByTestId("record-item")).toHaveLength(3);
    await user.click(screen.getByTestId("confirm-clear"));
    expect(screen.getByTestId("record-empty")).toBeTruthy();
    expect(JSON.parse(window.localStorage.getItem("mathkx.guest.v1") ?? "{}").value.deliveries).toEqual([]);
  });
});
