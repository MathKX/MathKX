// specs/003 contracts/detour.md unit tests 1–8 and 10: the gate, recording only when the lesson is shown, any
// route, the way back, and the link's origin carried in its address. The fake API's call log proves that a
// disclosing lesson is not requested before the learner chooses.
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { App } from "../src/App";
import { matchRoute } from "../src/router";
import { derive } from "../src/state/outcomes";
import type { Delivery } from "../src/state/observations";
import type { CheckRun } from "../src/state/checks";
import { createFakeApi, PILOT_CHECK } from "./fakeApi";
import { beforeThisFeature, checkRun, support, type PositionScript } from "./records";

const practicePath = "/practice/numbers.addition-within-20";
const lessonPath = "/lessons/number-bonds-to-ten";
const stored = () => JSON.parse(window.localStorage.getItem("mathkx.guest.v1") ?? "{}").value;
const deliveries = (): Delivery[] => stored()?.deliveries ?? [];
const lessonEvents = (index = 0) => (deliveries()[index]?.events ?? []).filter((e) => e.type === "support" && (e.kind === "lesson-opened" || e.kind === "lesson-reveal")).map((e) => (e.type === "support" ? e.kind : ""));
const supportKinds = (index = 0) => (deliveries()[index]?.events ?? []).flatMap((e) => (e.type === "support" ? [e.kind] : []));
const contentCalls = (api: ReturnType<typeof createFakeApi>) => api.calls.filter((c) => c.startsWith("getLessonContent"));
const disclosing = () => createFakeApi({ discloses: () => true });

async function practice(api = createFakeApi(), clear = true) {
  if (clear) window.localStorage.clear();
  const view = render(<App api={api} initialPath={practicePath} />);
  await screen.findByTestId("prompt");
  return { api, view, user: userEvent.setup() };
}

afterEach(() => {
  window.localStorage.clear();
  window.history.replaceState(null, "", "/");
});

describe("a detour to a lesson that does not show the answer", () => {
  it("requests the lesson at once and records one lesson-opened after it renders (test 1)", async () => {
    const { api, user } = await practice();
    await user.click(screen.getByTestId("to-lesson"));
    await screen.findByTestId("lesson-content");
    await waitFor(() => expect(lessonEvents()).toEqual(["lesson-opened"]));
    expect(contentCalls(api)).toEqual(["getLessonContent number-bonds-to-ten nb"]);
    expect(screen.getByTestId("return-banner")).toBeTruthy();
    expect(screen.queryByTestId("lesson-gate")).toBeNull();
  });

  it("records nothing when the content fails, and offers the way back (test 3)", async () => {
    const api = createFakeApi();
    api.fail.add("getLessonContent");
    const { user } = await practice(api);
    await user.click(screen.getByTestId("to-lesson"));
    await screen.findByTestId("lesson-content-failed");
    expect(lessonEvents()).toEqual([]);
    expect(screen.getByTestId("return-to-question")).toBeTruthy();
  });

  it("records nothing when the learner leaves before the content arrives (test 3)", async () => {
    const api = createFakeApi();
    api.hold("getLessonContent");
    const { user } = await practice(api);
    await user.click(screen.getByTestId("to-lesson"));
    await user.click(await screen.findByTestId("return-to-question"));
    await screen.findByTestId("prompt");
    api.release("getLessonContent");
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(lessonEvents()).toEqual([]);
  });
});

describe("a detour to a lesson that shows the answer", () => {
  it("shows the notice, requests nothing, and Cancel records nothing (test 2)", async () => {
    const { api, user } = await practice(disclosing());
    await user.click(screen.getByTestId("to-lesson"));
    const gate = await screen.findByTestId("lesson-gate");
    expect(within(gate).getByRole("heading").textContent).toBe("Leksjonen viser svaret på 4 + 4");
    expect(within(gate).getByRole("heading").textContent).not.toContain("8");
    expect(contentCalls(api)).toEqual([]);
    await user.click(screen.getByTestId("gate-cancel"));
    await screen.findByTestId("prompt");
    expect(lessonEvents()).toEqual([]);
    expect(contentCalls(api)).toEqual([]);
  });

  it("Show visual help instead opens help through the help path and records no lesson event (test 2)", async () => {
    const { api, user } = await practice(disclosing());
    await user.click(screen.getByTestId("to-lesson"));
    await user.click(await screen.findByTestId("gate-help"));
    await screen.findByTestId("prompt");
    await waitFor(() => expect(screen.getByTestId("toggle-help").getAttribute("aria-expanded")).toBe("true"));
    expect(supportKinds().filter((k) => k === "visual-help-opened")).toHaveLength(1);
    expect(lessonEvents()).toEqual([]);
    expect(contentCalls(api)).toEqual([]);

    await user.type(screen.getByTestId("answer"), "8");
    await user.click(screen.getByTestId("check"));
    await screen.findByTestId("result");
    const delivery = deliveries()[0];
    expect(delivery && derive(delivery).outcome).toBe("correctWithVisualHelp");
  });

  it("Open the lesson anyway requests the content and records one lesson-reveal after it renders (test 2)", async () => {
    const { api, user } = await practice(disclosing());
    await user.click(screen.getByTestId("to-lesson"));
    await user.click(await screen.findByTestId("gate-open"));
    await screen.findByTestId("lesson-content");
    await waitFor(() => expect(lessonEvents()).toEqual(["lesson-reveal"]));
    expect(contentCalls(api)).toHaveLength(1);
  });

  it("Open the lesson anyway with a failing load records nothing (test 3)", async () => {
    const api = disclosing();
    api.fail.add("getLessonContent");
    const { user } = await practice(api);
    await user.click(screen.getByTestId("to-lesson"));
    await user.click(await screen.findByTestId("gate-open"));
    await screen.findByTestId("lesson-content-failed");
    expect(lessonEvents()).toEqual([]);
  });

  it("is reached the same way through the lesson list (test 4, the clarification)", async () => {
    const { api, user } = await practice(disclosing());
    await user.click(screen.getByRole("link", { name: "Leksjoner" }));
    await user.click(await screen.findByRole("link", { name: "Tiervenner" }));
    await screen.findByTestId("lesson-gate");
    expect(contentCalls(api)).toEqual([]);
    expect(lessonEvents()).toEqual([]);
  });

  it("re-resolves a stored question that has no lessons before deciding (test 7)", async () => {
    const old = createFakeApi({ omitLessons: true });
    const first = await practice(old);
    first.view.unmount();
    const current = disclosing();
    render(<App api={current} initialPath={lessonPath} />);
    await screen.findByTestId("lesson-gate");
    expect(current.calls.some((c) => c.startsWith("getInstance"))).toBe(true);
    expect(contentCalls(current)).toEqual([]);
  });
});

describe("loading the selected translation", () => {
  it("shows the failure and a retry for the selected language even when another language is cached", async () => {
    window.localStorage.clear();
    const api = createFakeApi();
    render(<App api={api} initialPath={lessonPath} />);
    const user = userEvent.setup();
    await screen.findByRole("heading", { level: 2, name: /Hva er tiervenner\?/ });

    api.fail.add("getLessonContent");
    await user.click(screen.getByTestId("lang-en"));
    const failed = await screen.findByTestId("lesson-content-failed");
    expect(failed.textContent).toContain("The lesson text could not be loaded.");
    expect(screen.queryByTestId("lesson-content")).toBeNull();
    expect(document.documentElement.lang).toBe("en");

    api.fail.delete("getLessonContent");
    await user.click(within(failed).getByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("heading", { level: 2, name: /What are number bonds to ten\?/ })).toBeTruthy();
  });

  it("keeps a section fragment when it drops the question's origin from the address", async () => {
    window.localStorage.clear();
    window.history.replaceState(null, "", `${lessonPath}?from=question#why`);
    render(<App api={createFakeApi()} initialPath={`${lessonPath}?from=question#why`} />);
    await screen.findByTestId("lesson-content");
    expect(window.location.search).toBe("");
    expect(window.location.hash).toBe("#why");
  });
});

describe("visits that are not detours", () => {
  it("record nothing without a question, or for a lesson that does not list it (test 5)", async () => {
    window.localStorage.clear();
    render(<App api={createFakeApi()} initialPath={lessonPath} />);
    await screen.findByTestId("lesson-content");
    expect(deliveries()).toEqual([]);
    expect(screen.queryByTestId("return-banner")).toBeNull();
  });

  it("after a correct answer, record nothing when reached through the lesson list (test 5)", async () => {
    const { user } = await practice();
    await user.type(screen.getByTestId("answer"), "8");
    await user.click(screen.getByTestId("check"));
    await screen.findByTestId("result");
    await user.click(screen.getByRole("link", { name: "Leksjoner" }));
    await user.click(await screen.findByRole("link", { name: "Tiervenner" }));
    await screen.findByTestId("lesson-content");
    expect(lessonEvents()).toEqual([]);
    expect(screen.queryByTestId("return-banner")).toBeNull();
  });

  it("after a correct answer, record lesson-opened from the question's link, tagged lessonAfter (test 5)", async () => {
    const { user } = await practice();
    await user.type(screen.getByTestId("answer"), "8");
    await user.click(screen.getByTestId("check"));
    await screen.findByTestId("result");
    await user.click(screen.getByTestId("to-lesson"));
    await screen.findByTestId("lesson-content");
    await waitFor(() => expect(lessonEvents()).toEqual(["lesson-opened"]));
    const delivery = deliveries()[0];
    expect(delivery && derive(delivery)).toMatchObject({ outcome: "correctFirst", tags: ["lessonAfter"] });
    expect(window.location.search).toBe("");
  });
});

describe("the way back and the visit", () => {
  it("returns by the banner with the draft, help, and step as they were (test 8)", async () => {
    const { user } = await practice();
    await user.type(screen.getByTestId("answer"), "1");
    await user.click(screen.getByTestId("toggle-help"));
    await user.click(await screen.findByTestId("help-next"));
    const stepText = (await screen.findByTestId("help-step-text")).textContent;
    await user.click(screen.getByTestId("to-lesson"));
    await screen.findByTestId("lesson-content");
    await user.click(screen.getByTestId("return-to-question"));
    await screen.findByTestId("prompt");
    expect((screen.getByTestId("answer") as HTMLInputElement).value).toBe("1");
    expect(screen.getByTestId("toggle-help").getAttribute("aria-expanded")).toBe("true");
    expect((await screen.findByTestId("help-step-text")).textContent).toBe(stepText);
  });

  it("records nothing new when the language changes during the visit (test 6)", async () => {
    const { api, user } = await practice();
    await user.click(screen.getByTestId("to-lesson"));
    await screen.findByTestId("lesson-content");
    await waitFor(() => expect(lessonEvents()).toEqual(["lesson-opened"]));
    await user.click(screen.getByTestId("lang-en"));
    await waitFor(() => expect(contentCalls(api)).toContain("getLessonContent number-bonds-to-ten en"));
    await screen.findByRole("heading", { level: 2, name: /What are number bonds to ten\?/ });
    expect(lessonEvents()).toEqual(["lesson-opened"]);
  });
});

describe("the lesson link follows the lesson that started practice (test 9)", () => {
  const href = () => screen.getByTestId("to-lesson").getAttribute("href");
  const count = () => deliveries().length;

  it("keeps linking to b-lesson through another question, ladder moves, and a reload", async () => {
    window.localStorage.clear();
    const api = createFakeApi({ lessonIds: ["a-lesson", "b-lesson"] });
    const user = userEvent.setup();
    const view = render(<App api={api} initialPath="/lessons/b-lesson" />);
    await user.click(await screen.findByTestId("practice-numbers.addition.within-10"));
    await screen.findByTestId("prompt");
    expect(href()).toBe("/lessons/b-lesson?from=question");
    expect(deliveries()[0]?.originLessonId).toBe("b-lesson");

    await user.click(screen.getByTestId("another"));
    await waitFor(() => expect(count()).toBe(2));
    expect(href()).toBe("/lessons/b-lesson?from=question");

    await user.click(screen.getByTestId("harder"));
    await user.click(screen.getByTestId("another"));
    await waitFor(() => expect(count()).toBe(3));
    expect(deliveries()[2]?.instance.definitionId).toBe("numbers.addition.crossing-ten");
    expect(href()).toBe("/lessons/b-lesson?from=question");

    await user.click(screen.getByTestId("easier"));
    await user.click(screen.getByTestId("another"));
    await waitFor(() => expect(count()).toBe(4));
    expect(href()).toBe("/lessons/b-lesson?from=question");

    view.unmount();
    render(<App api={api} initialPath={practicePath} />);
    await screen.findByTestId("prompt");
    expect(href()).toBe("/lessons/b-lesson?from=question");
  });

  it("links to the first lesson by ID when practice started from the practice route", async () => {
    const { user } = await practice(createFakeApi({ lessonIds: ["b-lesson", "a-lesson"] }));
    expect(href()).toBe("/lessons/a-lesson?from=question");
    expect(deliveries()[0]?.originLessonId).toBeUndefined();
    await user.click(screen.getByTestId("another"));
    await waitFor(() => expect(count()).toBe(2));
    expect(href()).toBe("/lessons/a-lesson?from=question");
  });
});

describe("the lesson link's origin travels in its address (test 10)", () => {
  it("is part of the link's address, and a modified click leaves the source tab and its store unchanged", async () => {
    const { user } = await practice();
    const link = screen.getByTestId("to-lesson");
    expect(link.getAttribute("href")).toBe(`${lessonPath}?from=question`);
    // The store persists in an effect after the prompt renders; compare against the persisted question, not a race.
    await waitFor(() => expect(deliveries()).toHaveLength(1));
    const before = JSON.stringify(deliveries());
    for (const key of ["Control", "Meta", "Shift", "Alt"]) {
      await user.keyboard(`{${key}>}`);
      await user.click(link);
      await user.keyboard(`{/${key}}`);
    }
    expect(screen.getByTestId("prompt")).toBeTruthy();
    expect(JSON.stringify(deliveries())).toBe(before);
  });

  it("is honoured by a page opened at that address (the new tab), which then drops it", async () => {
    const { user, view } = await practice();
    await user.type(screen.getByTestId("answer"), "8");
    await user.click(screen.getByTestId("check"));
    await screen.findByTestId("result");
    view.unmount();

    render(<App api={createFakeApi()} initialPath={`${lessonPath}?from=question`} />);
    await screen.findByTestId("lesson-content");
    await waitFor(() => expect(lessonEvents()).toEqual(["lesson-opened"]));
    const delivery = deliveries()[0];
    expect(delivery && derive(delivery)).toMatchObject({ outcome: "correctFirst", tags: ["lessonAfter"] });
    expect(window.location.pathname + window.location.search).toBe(lessonPath);
  });

  it("matches routes on the path only", () => {
    expect(matchRoute(`${lessonPath}?from=question`)).toEqual({ name: "lesson", id: "number-bonds-to-ten" });
    expect(matchRoute(`${practicePath}#x`)).toEqual({ name: "practice", skillId: "numbers.addition-within-20" });
  });
});

// specs/006 research R10 (tasks T032): a lesson visit `?from=check` is about the supported check question on screen,
// with spec 003's gate, recording, and way back; every other visit stays spec 003's, about practice.
describe("a detour from a supported check question (?from=check)", () => {
  const runPath = (id: string) => `/checks/${PILOT_CHECK.id}/${id}`;
  const runs = (): CheckRun[] => stored()?.checkRuns ?? [];
  const runKinds = (position: number) => (runs()[0]?.deliveries[position - 1]?.events ?? []).flatMap((e) => (e.type === "support" ? [e.kind] : []));
  const supported = (events: PositionScript = "reached") => checkRun({ id: "run-s", positions: ["wrong", "skipped", events, null], switchAt: 3, position: 3 });

  async function fromCheck(run: CheckRun, api = createFakeApi()) {
    window.localStorage.setItem("mathkx.guest.v1", JSON.stringify({ schema: 1, value: { ...beforeThisFeature(), deliveries: [], checkRuns: [run] } }));
    const view = render(<App api={api} initialPath={runPath(run.id)} />);
    const user = userEvent.setup();
    await screen.findByTestId(run.switchAt ? "supported-question" : "independent-question");
    return { api, user, view };
  }

  it("records lesson-opened on the check question, never on practice's, and returns to the run", async () => {
    const { api, user } = await fromCheck(supported());
    await user.click(screen.getByTestId("to-lesson"));
    await screen.findByTestId("lesson-content");
    await waitFor(() => expect(runKinds(3)).toEqual(["lesson-opened"]));
    expect(deliveries()).toEqual([]);
    expect(contentCalls(api)).toHaveLength(1);
    const back = screen.getByTestId("return-to-question");
    expect(back.getAttribute("href")).toBe(runPath("run-s"));
    await user.click(back);
    await screen.findByTestId("supported-question");
    expect(window.location.pathname).toBe(runPath("run-s"));
    expect(screen.getByTestId("check-position").textContent).toBe("Question 3 of 4");
  });

  it("shows the gate for a lesson that shows the answer, and Open anyway records lesson-reveal on the check question", async () => {
    const { api, user } = await fromCheck(supported(), disclosing());
    await user.click(screen.getByTestId("to-lesson"));
    const gate = await screen.findByTestId("lesson-gate");
    expect(within(gate).getByRole("heading").textContent).toBe("This lesson shows the answer to 8 + 5");
    expect(contentCalls(api)).toEqual([]);
    await user.click(screen.getByTestId("gate-open"));
    await screen.findByTestId("lesson-content");
    await waitFor(() => expect(runKinds(3)).toEqual(["lesson-reveal"]));
    expect(deliveries()).toEqual([]);
  });

  it("Cancel returns to the run, and Show visual help instead opens the check question's help, recording no lesson event", async () => {
    const { api, user } = await fromCheck(supported(), disclosing());
    await user.click(screen.getByTestId("to-lesson"));
    await user.click(await screen.findByTestId("gate-cancel"));
    await screen.findByTestId("supported-question");
    expect(window.location.pathname).toBe(runPath("run-s"));
    expect(runKinds(3)).toEqual([]);

    await user.click(screen.getByTestId("to-lesson"));
    await user.click(await screen.findByTestId("gate-help"));
    await screen.findByTestId("supported-question");
    await waitFor(() => expect(screen.getByTestId("toggle-help").getAttribute("aria-expanded")).toBe("true"));
    expect(runKinds(3)).toEqual(["visual-help-opened"]);
    expect(contentCalls(api)).toEqual([]);
  });

  it("after a correct answer, records lesson-opened from the question's link, tagged lessonAfter", async () => {
    const { user } = await fromCheck(supported([support("visual-help-opened"), { type: "submission", submissionId: "c", originalText: "13", value: 13, status: "correct", code: "correct" }]));
    await user.click(screen.getByTestId("to-lesson"));
    await screen.findByTestId("lesson-content");
    expect(screen.queryByTestId("return-banner")).toBeNull();
    await waitFor(() => expect(runKinds(3)).toEqual(["visual-help-opened", "lesson-opened"]));
    expect(derive(runs()[0]!.deliveries[2]!).tags).toContain("lessonAfter");
  });

  it("is spec 003's visit without ?from=check: nothing is recorded on the run", async () => {
    const { view } = await fromCheck(supported(), disclosing());
    view.unmount();
    render(<App api={disclosing()} initialPath={lessonPath} />);
    await screen.findByTestId("lesson-content");
    expect(screen.queryByTestId("lesson-gate")).toBeNull();
    expect(screen.queryByTestId("return-banner")).toBeNull();
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(runKinds(3)).toEqual([]);
  });

  it("records nothing on a run in its independent part, even with ?from=check", async () => {
    const run = checkRun({ id: "run-i", positions: ["wrong", "reached", null, null], position: 2 });
    const { view } = await fromCheck(run, disclosing());
    view.unmount();
    render(<App api={disclosing()} initialPath={`${lessonPath}?from=check`} />);
    await screen.findByTestId("lesson-content");
    expect(screen.queryByTestId("lesson-gate")).toBeNull();
    expect(screen.queryByTestId("return-banner")).toBeNull();
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(runs()[0]!.deliveries.flatMap((d) => d.events.filter((e) => e.type === "support"))).toEqual([]);
  });
});
