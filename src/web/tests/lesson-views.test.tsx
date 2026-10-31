// specs/004 contracts/lesson-views.md tests 1–6: a lesson view is recorded once per visit that shows the lesson,
// through the same guard that records spec 003's lesson event; never behind the notice, never by time.
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { App } from "../src/App";
import type { Delivery } from "../src/state/observations";
import { createFakeApi } from "./fakeApi";
import { beforeThisFeature } from "./records";

const practicePath = "/practice/numbers.addition-within-20";
const lessonPath = "/lessons/number-bonds-to-ten";
const stored = () => JSON.parse(window.localStorage.getItem("mathkx.guest.v1") ?? "{}").value;
const views = (): { lessonId: string; language: string; at: string }[] => stored()?.lessonViews ?? [];
const deliveries = (): Delivery[] => stored()?.deliveries ?? [];
const lessonEvents = () =>
  (deliveries()[0]?.events ?? []).flatMap((e) => (e.type === "support" && (e.kind === "lesson-opened" || e.kind === "lesson-reveal") ? [e.kind] : []));
const settle = () => new Promise((resolve) => setTimeout(resolve, 20));

async function practice(api = createFakeApi()) {
  window.localStorage.clear();
  const view = render(<App api={api} initialPath={practicePath} />);
  await screen.findByTestId("prompt");
  await waitFor(() => expect(deliveries()).toHaveLength(1));
  return { api, view, user: userEvent.setup() };
}

async function openLesson(api = createFakeApi(), clear = true) {
  if (clear) window.localStorage.clear();
  const view = render(<App api={api} initialPath={lessonPath} />);
  await screen.findByTestId("lesson-content");
  return { api, view, user: userEvent.setup() };
}

afterEach(() => {
  window.localStorage.clear();
  window.history.replaceState(null, "", "/");
});

describe("recording a view when the lesson is shown (test 1)", () => {
  it("records one view from the lesson list once the content renders, and none before", async () => {
    window.localStorage.clear();
    const api = createFakeApi();
    api.hold("getLessonContent");
    render(<App api={api} initialPath="/lessons" />);
    const user = userEvent.setup();
    await user.click(await screen.findByRole("link", { name: "Tiervenner" }));
    await screen.findByTestId("lesson-page");
    await settle();
    expect(views()).toEqual([]);

    api.release("getLessonContent");
    await screen.findByTestId("lesson-content");
    await waitFor(() => expect(views()).toHaveLength(1));
    const [view] = views();
    expect(view).toMatchObject({ lessonId: "number-bonds-to-ten", language: "nb" });
    expect(Number.isNaN(Date.parse(view!.at))).toBe(false);
  });

  it("records the language the content was shown in", async () => {
    window.localStorage.clear();
    const api = createFakeApi();
    render(<App api={api} initialPath="/lessons" />);
    const user = userEvent.setup();
    await user.click(await screen.findByTestId("lang-en"));
    await user.click(await screen.findByRole("link", { name: "Number bonds to ten" }));
    await screen.findByTestId("lesson-content");
    await waitFor(() => expect(views().map((v) => v.language)).toEqual(["en"]));
  });
});

describe("detours (test 2)", () => {
  it("a lesson that does not show the answer records one view and spec 003's lesson-opened", async () => {
    const { user } = await practice();
    await user.click(screen.getByTestId("to-lesson"));
    await screen.findByTestId("lesson-content");
    await waitFor(() => expect(views()).toHaveLength(1));
    expect(lessonEvents()).toEqual(["lesson-opened"]);
  });

  it("a lesson behind the notice records nothing when cancelled or left for visual help", async () => {
    const { user } = await practice(createFakeApi({ discloses: () => true }));
    await user.click(screen.getByTestId("to-lesson"));
    await user.click(await screen.findByTestId("gate-cancel"));
    await screen.findByTestId("prompt");
    await user.click(screen.getByTestId("to-lesson"));
    await user.click(await screen.findByTestId("gate-help"));
    await screen.findByTestId("prompt");
    await settle();
    expect(views()).toEqual([]);
    expect(lessonEvents()).toEqual([]);
  });

  it("opened anyway, records one view and spec 003's lesson-reveal", async () => {
    const { user } = await practice(createFakeApi({ discloses: () => true }));
    await user.click(screen.getByTestId("to-lesson"));
    await user.click(await screen.findByTestId("gate-open"));
    await screen.findByTestId("lesson-content");
    await waitFor(() => expect(views()).toHaveLength(1));
    expect(lessonEvents()).toEqual(["lesson-reveal"]);
  });
});

describe("a lesson that is not shown (test 3)", () => {
  it("records no view when the content fails", async () => {
    window.localStorage.clear();
    const api = createFakeApi();
    api.fail.add("getLessonContent");
    render(<App api={api} initialPath={lessonPath} />);
    await screen.findByTestId("lesson-content-failed");
    await settle();
    expect(views()).toEqual([]);
  });

  it("records no view when the learner leaves before the content arrives", async () => {
    window.localStorage.clear();
    const api = createFakeApi();
    api.hold("getLessonContent");
    render(<App api={api} initialPath={lessonPath} />);
    const user = userEvent.setup();
    await screen.findByTestId("lesson-page");
    await user.click(screen.getByRole("link", { name: "Mitt arbeid" }));
    await screen.findByTestId("record-page");
    api.release("getLessonContent");
    await settle();
    expect(views()).toEqual([]);
  });
});

describe("visits, not time (test 4)", () => {
  it("a language switch, and the re-renders it causes, record nothing new", async () => {
    const { api, user } = await openLesson();
    await waitFor(() => expect(views()).toHaveLength(1));
    await user.click(screen.getByTestId("lang-en"));
    await waitFor(() => expect(api.calls).toContain("getLessonContent number-bonds-to-ten en"));
    await screen.findByRole("heading", { level: 1, name: "Number bonds to ten" });
    await user.click(screen.getByTestId("lang-nb"));
    await settle();
    expect(views()).toHaveLength(1);
  });

  it("a second onShown in the same visit records nothing: the lesson re-rendered after a failed language and a retry", async () => {
    const { api, user } = await openLesson();
    await waitFor(() => expect(views()).toHaveLength(1));
    api.fail.add("getLessonContent");
    await user.click(screen.getByTestId("lang-en"));
    const failed = await screen.findByTestId("lesson-content-failed"); // the lesson view unmounts
    api.fail.delete("getLessonContent");
    await user.click(within(failed).getByRole("button", { name: "Try again" }));
    await screen.findByRole("heading", { level: 2, name: /What are number bonds to ten\?/ }); // mounted again: onShown again
    await settle();
    expect(views()).toHaveLength(1);
  });

  it("leaving and returning records a second view", async () => {
    const { user } = await openLesson();
    await waitFor(() => expect(views()).toHaveLength(1));
    await user.click(screen.getByRole("link", { name: "Leksjoner" }));
    await user.click(await screen.findByRole("link", { name: "Tiervenner" }));
    await screen.findByTestId("lesson-content");
    await waitFor(() => expect(views()).toHaveLength(2));
  });

  it("a reload that renders within a second of the first view is a new visit and a new view", async () => {
    const first = await openLesson();
    await waitFor(() => expect(views()).toHaveLength(1));
    first.view.unmount();
    await openLesson(createFakeApi(), false);
    await waitFor(() => expect(views()).toHaveLength(2));
    const [a, b] = views();
    expect(Date.parse(b!.at) - Date.parse(a!.at)).toBeLessThan(1000);
  });
});

describe("the record (tests 5 and 6)", () => {
  it("loads a record written before this feature with no lesson views and every delivery", async () => {
    window.localStorage.setItem("mathkx.guest.v1", JSON.stringify({ schema: 1, value: beforeThisFeature() }));
    render(<App api={createFakeApi()} initialPath="/record" />);
    await screen.findByTestId("skill-name");
    await waitFor(() => expect(stored().lessonViews).toEqual([]));
    expect(deliveries()).toHaveLength(2);
    // specs/005: without a session, every question of the old record belongs to the first one.
    expect(stored().session).toEqual({ current: deliveries().map((d) => d.id), last: null });
    expect(stored()).not.toHaveProperty("schema"); // the value, inside the unchanged envelope
    expect(JSON.parse(window.localStorage.getItem("mathkx.guest.v1")!).schema).toBe(1);
  });

  it("keeps every view (no cap) and empties them with Clear my work", async () => {
    const many = Array.from({ length: 600 }, (_, i) => ({ lessonId: "number-bonds-to-ten", language: "nb", at: new Date(Date.UTC(2026, 9, 1) + i * 60000).toISOString() }));
    window.localStorage.setItem("mathkx.guest.v1", JSON.stringify({ schema: 1, value: { ...beforeThisFeature(), language: "nb", lessonViews: many } }));
    const { user } = await openLesson(createFakeApi(), false);
    await waitFor(() => expect(views()).toHaveLength(601));
    expect(views()[0]).toEqual(many[0]);

    await user.click(screen.getByRole("link", { name: "Mitt arbeid" }));
    await user.click(await screen.findByTestId("clear"));
    await user.click(screen.getByTestId("confirm-clear"));
    await waitFor(() => expect(views()).toEqual([]));
    expect(deliveries()).toEqual([]);
  });
});
