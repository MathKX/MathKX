import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { App } from "../src/App";
import { createFakeApi } from "./fakeApi";

const practicePath = "/practice/numbers.addition-within-20";
const stored = () => JSON.parse(window.localStorage.getItem("mathkx.guest.v1") ?? "{}").value;

async function renderPractice(api = createFakeApi()) {
  window.localStorage.clear();
  render(<App api={api} initialPath={practicePath} />);
  await screen.findByTestId("prompt");
  return { api, user: userEvent.setup() };
}

afterEach(() => window.localStorage.clear());

describe("the challenge ladder", () => {
  it("shows the current sentence and sets a pending change that keeps the current question", async () => {
    const { user, api } = await renderPractice();
    expect(screen.getByTestId("ladder-current").textContent).toBe("Nå: Summen er høyst 10.");
    await user.type(screen.getByTestId("answer"), "7");
    await user.click(screen.getByTestId("toggle-help"));
    await user.click(screen.getByTestId("harder"));
    expect(screen.getByTestId("ladder-pending").textContent).toBe("Neste oppgave: Over tieren, som 8 + 5.");
    expect(screen.getByTestId("prompt").getAttribute("aria-label")).toBe("4 pluss 4. Hva er summen?");
    expect((screen.getByTestId("answer") as HTMLInputElement).value).toBe("7");
    expect(screen.getByTestId("toggle-help").getAttribute("aria-expanded")).toBe("true");
    expect(api.calls.filter((c) => c.startsWith("getInstance"))).toHaveLength(1);
  });

  it("consumes the pending change on another question and offers make-ten help for crossing ten", async () => {
    const { user, api } = await renderPractice();
    await user.click(screen.getByTestId("harder"));
    await user.click(screen.getByTestId("another"));
    await waitFor(() => expect(screen.getByTestId("prompt").getAttribute("aria-label")).toBe("8 pluss 5. Hva er summen?"));
    expect(api.calls.at(-1)).toMatch(/^getInstance numbers\.addition\.crossing-ten@1 \d+$/);
    expect(screen.queryByTestId("ladder-pending")).toBeNull();
    expect(screen.getByTestId("ladder-current").textContent).toBe("Nå: Over tieren, som 8 + 5.");
    await user.click(screen.getByTestId("toggle-help"));
    expect(screen.getByTestId("make-ten")).toBeTruthy();
    const frame = screen.getByTestId("ten-frame");
    expect(frame.querySelectorAll(".mkx-cell--a")).toHaveLength(8);
    expect(frame.querySelectorAll(".mkx-cell").length).toBe(10);
    const events = stored().deliveries[0].events.filter((e: { type: string }) => e.type === "challenge-request");
    expect(events.map((e: { request: string; outcome: string }) => `${e.request}:${e.outcome}`)).toEqual(["harder:requested", "another:requested", "harder:applied"]);
  });

  it("keeps the current definition and clears a pending change on more like this, with a notice", async () => {
    const { user, api } = await renderPractice();
    await user.click(screen.getByTestId("harder"));
    await user.click(screen.getByTestId("more-like-this"));
    await waitFor(() => expect(api.calls.filter((c) => c.startsWith("getInstance numbers.addition.within-10"))).toHaveLength(2));
    expect(screen.queryByTestId("ladder-pending")).toBeNull();
    expect(screen.getByTestId("notice").textContent).toBe("Endringen ble ikke brukt. Du fortsetter med samme variant.");
    const events = stored().deliveries[0].events.filter((e: { type: string }) => e.type === "challenge-request");
    expect(events.at(-1)).toMatchObject({ request: "same", outcome: "cleared" });
  });

  it("says honestly that no easier or harder variation exists at the ends", async () => {
    const { user } = await renderPractice();
    await user.click(screen.getByTestId("easier"));
    expect(screen.getByTestId("notice").textContent).toBe("Det finnes ingen enklere variant ennå.");
    expect(screen.queryByTestId("ladder-pending")).toBeNull();
    await user.click(screen.getByTestId("harder"));
    await user.click(screen.getByTestId("another"));
    await waitFor(() => expect(screen.getByTestId("ladder-current").textContent).toBe("Nå: Over tieren, som 8 + 5."));
    await user.click(screen.getByTestId("harder"));
    expect(screen.getByTestId("notice").textContent).toBe("Det finnes ingen vanskeligere variant ennå.");
    type Ev = { type: string; outcome?: string };
    const all: Ev[] = stored().deliveries.flatMap((d: { events: Ev[] }) => d.events);
    expect(all.filter((e) => e.type === "challenge-request" && e.outcome === "unavailable")).toHaveLength(2);
    expect(all.filter((e) => e.type === "submission")).toHaveLength(0);
  });
});
