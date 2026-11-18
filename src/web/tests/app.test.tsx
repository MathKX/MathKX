import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { App } from "../src/App";
import { matchRoute } from "../src/router";
import { createFakeApi, PILOT_CHECK } from "./fakeApi";

// A practice page leaves its question in the record; each test starts from a cleared one.
afterEach(() => {
  window.localStorage.clear();
  window.history.replaceState(null, "", "/");
});

describe("routes", () => {
  it.each([
    ["/", { name: "lessons" }],
    ["/lessons/number-bonds-to-ten", { name: "lesson", id: "number-bonds-to-ten" }],
    ["/practice/numbers.addition-within-20", { name: "practice", skillId: "numbers.addition-within-20" }],
    ["/record", { name: "record" }],
    ["/record/d1", { name: "replay", deliveryId: "d1" }],
    ["/session", { name: "session" }],
    ["/checks/numbers.addition.check-within-20", { name: "check", checkId: "numbers.addition.check-within-20" }],
    ["/checks/numbers.addition.check-within-20/run-1", { name: "checkRun", checkId: "numbers.addition.check-within-20", runId: "run-1" }],
    ["/checks", { name: "unknown" }],
    ["/checks/a/b/c", { name: "unknown" }],
  ])("%s", (path, route) => {
    expect(matchRoute(path)).toEqual(route);
  });
});

describe("Check my understanding", () => {
  it("is offered on the lesson page for the skills it teaches", async () => {
    render(<App api={createFakeApi()} initialPath="/lessons/number-bonds-to-ten" />);
    const entry = await screen.findByTestId(`check-entry-${PILOT_CHECK.id}`);
    expect(entry.textContent).toBe("Sjekk forståelsen min");
    expect(entry.getAttribute("href")).toBe(`/checks/${PILOT_CHECK.id}`);
  });

  it("is offered on the practice page of the skill", async () => {
    render(<App api={createFakeApi()} initialPath="/practice/numbers.addition-within-20" />);
    expect((await screen.findByTestId(`check-entry-${PILOT_CHECK.id}`)).getAttribute("href")).toBe(`/checks/${PILOT_CHECK.id}`);
  });

  it("is not offered when the list cannot be loaded, or for another skill", async () => {
    const { unmount } = render(<App api={createFakeApi({ checksFail: true })} initialPath="/practice/numbers.addition-within-20" />);
    await screen.findByTestId("prompt");
    expect(screen.queryByTestId(`check-entry-${PILOT_CHECK.id}`)).toBeNull();
    unmount();
    render(<App api={createFakeApi()} initialPath="/practice/numbers.number-bonds-to-ten" />);
    await screen.findByTestId("practice-page");
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(screen.queryByTestId(`check-entry-${PILOT_CHECK.id}`)).toBeNull();
  });
});

describe("App", () => {
  it("lists lessons from the service in the active language", async () => {
    render(<App api={createFakeApi()} initialPath="/" />);
    expect(await screen.findByText("Tiervenner")).toBeTruthy();
    expect(screen.getByTestId("app-root")).toBeTruthy();
  });

  it("shows a lesson's title, objective, body, and practice entries in the selected language", async () => {
    render(<App api={createFakeApi()} initialPath="/lessons/number-bonds-to-ten" />);
    await screen.findByTestId("lesson-page");
    // The title is the h1; the lesson body, once rendered, names it too.
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Tiervenner");
    expect(screen.getByText("Du lærer tiervennene.")).toBeTruthy();
    expect(await screen.findByRole("heading", { level: 2, name: /Hva er tiervenner\?/ })).toBeTruthy();
    expect((await screen.findByTestId("practice-numbers.addition.within-10")).textContent).toBe("Øv: Summen er høyst 10.");
    expect(document.documentElement.lang).toBe("nb");
  });
});
