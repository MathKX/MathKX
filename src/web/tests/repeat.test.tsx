// specs/005 contracts/repeat.md tests 1–8: "Repeat this question" delivers the same identity as a new question with
// a fresh state and an outcome of its own, from the practice screen and from a replay, with one instance request.
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { App } from "../src/App";
import { identityOf, type Delivery } from "../src/state/observations";
import { derive } from "../src/state/outcomes";
import { createFakeApi } from "./fakeApi";
import { CROSSING, at, beforeThisFeature, correct, delivery } from "./records";

const practicePath = "/practice/numbers.addition-within-20";
const KEY = "mathkx.guest.v1";
const stored = () => JSON.parse(window.localStorage.getItem(KEY) ?? "{}").value;
const deliveries = (): Delivery[] => stored()?.deliveries ?? [];
const instanceCalls = (api: ReturnType<typeof createFakeApi>) => api.calls.filter((c) => c.startsWith("getInstance"));

afterEach(() => {
  window.localStorage.clear();
  window.history.replaceState(null, "", "/");
});

async function practise(api = createFakeApi({ pool: true })) {
  window.localStorage.clear();
  render(<App api={api} initialPath={practicePath} />);
  await screen.findByTestId("prompt");
  await waitFor(() => expect(deliveries()).toHaveLength(1));
  return { api, user: userEvent.setup() };
}

async function answer(user: ReturnType<typeof userEvent.setup>, value: number) {
  const field = screen.getByTestId("answer");
  await user.clear(field);
  await user.type(field, String(value));
  await user.click(screen.getByTestId("check"));
  await screen.findByTestId("result");
}

async function repeat(user: ReturnType<typeof userEvent.setup>) {
  const before = deliveries().length;
  await user.click(screen.getByTestId("repeat-question"));
  await waitFor(() => expect(deliveries()).toHaveLength(before + 1));
  await waitFor(() => expect(screen.queryByTestId("result")).toBeNull());
}

const sumOf = (d: Delivery) => d.instance.a + d.instance.b;

describe("from the practice screen (tests 1 and 2)", () => {
  it("is offered only after an answer, and delivers the same identity with a fresh state", async () => {
    const { user } = await practise();
    expect(screen.queryByTestId("repeat-question")).toBeNull();
    await user.type(screen.getByTestId("answer"), "abc"); // a reply that could not be read is not an answer
    await user.click(screen.getByTestId("check"));
    await screen.findByTestId("result");
    expect(screen.queryByTestId("repeat-question")).toBeNull();

    const [first] = deliveries();
    await answer(user, sumOf(first!) + 1);
    expect(screen.getByTestId("repeat-question").textContent).toBe("Gjenta denne oppgaven");
    await user.click(screen.getByTestId("toggle-help"));
    await repeat(user);

    const [, again] = deliveries();
    expect(identityOf(again!)).toEqual(identityOf(first!));
    expect([again!.instance.a, again!.instance.b]).toEqual([first!.instance.a, first!.instance.b]);
    expect(again).toMatchObject({ repeatOf: first!.id, repeatReason: "requested", events: [] });
    expect(stored().currentDeliveryId).toBe(again!.id);
    expect((screen.getByTestId("answer") as HTMLInputElement).value).toBe("");
    expect(screen.getByTestId("toggle-help").getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByTestId("toggle-explanation")).toBeNull();
    expect(screen.queryByTestId("repeat-question")).toBeNull(); // the repeat itself is not answered yet
  });

  it("makes one instance request for the same seed, and no pool request, even when the question is recent", async () => {
    const { api, user } = await practise();
    const [first] = deliveries();
    await answer(user, sumOf(first!));
    const calls = api.calls.length;
    await repeat(user);
    const made = api.calls.slice(calls);
    expect(made.filter((c) => c.startsWith("getInstance"))).toEqual([`getInstance ${first!.instance.definitionId}@1 ${first!.instance.seed}`]);
    expect(made.some((c) => c.startsWith("getPool"))).toBe(false);
    expect(deliveries()[1]!.repeatReason).toBe("requested"); // never "exhausted", and no notice about the pool
    expect(screen.queryByTestId("notice")).toBeNull();
  });
});

describe("outcomes (tests 3 and 6)", () => {
  it("gives the repeat its own outcome and leaves the first one as it was", async () => {
    const { user } = await practise();
    const [first] = deliveries();
    await answer(user, sumOf(first!) + 1);
    await user.click(screen.getByTestId("toggle-help"));
    await answer(user, sumOf(first!));
    const before = derive(deliveries()[0]!).outcome;
    expect(before).toBe("correctWithVisualHelp");

    await repeat(user);
    await answer(user, sumOf(first!));
    const [then, again] = deliveries();
    expect(derive(then!).outcome).toBe(before);
    expect(derive(again!).outcome).toBe("correctFirst");

    await user.click(screen.getByTestId("lang-en"));
    await user.click(screen.getByRole("link", { name: "My work" }));
    expect((await screen.findByTestId("record-repeats-requested")).textContent).toBe("1 of these you repeated on purpose.");
    const [newest, oldest] = screen.getAllByTestId("record-item");
    expect(newest!.getAttribute("data-outcome")).toBe("correctFirst");
    expect(within(newest!).getAllByTestId("record-tag").map((t) => t.textContent)).toEqual(["Repeated on request"]);
    expect(oldest!.getAttribute("data-outcome")).toBe("correctWithVisualHelp");
  });

  it("repeats a repeat: the new question points to the one it repeated", async () => {
    const { user } = await practise();
    const [first] = deliveries();
    await answer(user, sumOf(first!));
    await repeat(user);
    await answer(user, sumOf(first!));
    await repeat(user);
    const [, second, third] = deliveries();
    expect(third).toMatchObject({ repeatOf: second!.id, repeatReason: "requested" });
    expect(identityOf(third!)).toEqual(identityOf(first!));
  });
});

describe("from a replay (test 4)", () => {
  const old = delivery({ id: "old", definitionId: CROSSING, a: 8, b: 5, seed: "77", startedAt: at(1), events: [correct(13)] });
  const store = (extra: Record<string, unknown> = {}) =>
    window.localStorage.setItem(KEY, JSON.stringify({ schema: 1, value: { ...beforeThisFeature(), language: "en", deliveries: [old], lessonViews: [], ...extra } }));

  it("opens practice on the question's skill and variation when practice is not running, and the replay records nothing", async () => {
    store({ skillId: null });
    const api = createFakeApi({ pairs: { [CROSSING]: [8, 5] } });
    render(<App api={api} initialPath="/record/old" />);
    const user = userEvent.setup();
    const button = await screen.findByTestId("replay-repeat");
    await screen.findByTestId("prompt");
    expect(instanceCalls(api)).toHaveLength(1); // the replay's own request
    expect(deliveries()).toEqual([old]); // showing the replay recorded nothing

    await user.click(button);
    await screen.findByTestId("practice-page");
    expect((await screen.findByTestId("prompt")).getAttribute("aria-label")).toBe("8 plus 5. What is the sum?");
    expect(window.location.pathname).toBe(practicePath);
    expect(instanceCalls(api)).toEqual(["getInstance numbers.addition.crossing-ten@1 77", "getInstance numbers.addition.crossing-ten@1 77"]);
    await waitFor(() => expect(deliveries()).toHaveLength(2));
    const state = stored();
    expect(state.skillId).toBe("numbers.addition-within-20");
    expect(state.ladder.entries).toHaveLength(2);
    expect(state.ladder.current).toEqual({ definition: CROSSING, version: 1 });
    expect(deliveries()[1]).toMatchObject({ repeatOf: "old", repeatReason: "requested", instance: { definitionId: CROSSING, seed: "77", a: 8, b: 5 } });
    expect(deliveries()[0]).toEqual(old); // the earlier question keeps its record
  });

  it("closes the unanswered question in progress as skipped, and the in-progress question offers Continue", async () => {
    store();
    const api = createFakeApi({ pairs: { [CROSSING]: [8, 5] } });
    render(<App api={api} initialPath={practicePath} />);
    const user = userEvent.setup();
    await screen.findByTestId("prompt");
    await waitFor(() => expect(deliveries()).toHaveLength(2));
    const inProgress = stored().currentDeliveryId as string;
    await user.type(screen.getByTestId("answer"), "7");

    await user.click(screen.getByRole("link", { name: "My work" }));
    await user.click((await screen.findAllByTestId("progress-questions"))[0]!);
    await user.click(screen.getAllByTestId("record-question").find((l) => l.getAttribute("href") === `/record/${inProgress}`)!);
    await screen.findByTestId("replay-continue");
    expect(screen.queryByTestId("replay-repeat")).toBeNull();

    await user.click(screen.getByTestId("replay-back"));
    await user.click((await screen.findAllByTestId("progress-questions"))[0]!);
    await user.click(screen.getAllByTestId("record-question").find((l) => l.getAttribute("href") === "/record/old")!);
    await user.click(await screen.findByTestId("replay-repeat"));
    expect((await screen.findByTestId("prompt")).getAttribute("aria-label")).toBe("8 plus 5. What is the sum?");
    await waitFor(() => expect(deliveries()).toHaveLength(3));
    const closed = deliveries().find((d) => d.id === inProgress)!;
    expect(closed.events.map((e) => e.type)).toEqual(["ended", "skipped"]);
    expect(derive(closed).outcome).toBe("skipped");
    expect(stored().resumable).toBeNull();
    expect((screen.getByTestId("answer") as HTMLInputElement).value).toBe("");
  });
});

describe("a repeat still on its way (test 7)", () => {
  const old = delivery({ id: "old", definitionId: CROSSING, a: 8, b: 5, seed: "77", startedAt: at(1), events: [correct(13)] });
  const settle = () => new Promise((resolve) => setTimeout(resolve, 20));

  async function leaveReplayWhileRepeating() {
    window.localStorage.setItem(KEY, JSON.stringify({ schema: 1, value: { ...beforeThisFeature(), language: "en", skillId: null, deliveries: [old], lessonViews: [] } }));
    const api = createFakeApi({ pairs: { [CROSSING]: [8, 5] } });
    render(<App api={api} initialPath="/record/old" />);
    const user = userEvent.setup();
    const button = await screen.findByTestId("replay-repeat");
    await screen.findByTestId("prompt");
    api.hold("getInstance");
    await user.click(button);
    await user.click(screen.getByTestId("replay-back"));
    await screen.findByRole("heading", { level: 1, name: "My work" });
    return { api, user };
  }

  it("is abandoned when the learner leaves the replay: nothing recorded, no move to practice", async () => {
    const { api } = await leaveReplayWhileRepeating();
    api.release("getInstance");
    await settle();
    expect(window.location.pathname).toBe("/record");
    expect(deliveries()).toEqual([old]);
    expect(screen.queryByText("The question could not be loaded. Try again.")).toBeNull();
  });

  it("does not come back into a record cleared after leaving the replay", async () => {
    const { api, user } = await leaveReplayWhileRepeating();
    await user.click(screen.getByTestId("clear"));
    await user.click(screen.getByTestId("confirm-clear"));
    api.release("getInstance");
    await settle();
    expect(window.location.pathname).toBe("/record");
    expect(deliveries()).toEqual([]);
  });

  it("does not come back into a record cleared while a practice-screen repeat was loading", async () => {
    const { api, user } = await practise();
    const [first] = deliveries();
    await answer(user, sumOf(first!));
    api.hold("getInstance");
    await user.click(screen.getByTestId("repeat-question"));
    await user.click(screen.getByRole("link", { name: "Mitt arbeid" }));
    await user.click(await screen.findByTestId("clear"));
    await user.click(screen.getByTestId("confirm-clear"));
    api.release("getInstance");
    await settle();
    expect(deliveries()).toEqual([]);
    expect(stored().currentDeliveryId).toBeNull();
  });
});

describe("spec 003's notice (test 5)", () => {
  it("still stands between a repeated question and a lesson that shows its answer", async () => {
    const { user } = await practise(createFakeApi({ pool: true, discloses: () => true }));
    const [first] = deliveries();
    await answer(user, sumOf(first!) + 1);
    await repeat(user);
    await user.click(screen.getByTestId("to-lesson"));
    expect(await screen.findByTestId("gate-open")).toBeTruthy();
    expect(screen.queryByTestId("lesson-content")).toBeNull();
  });
});

describe("failure (test 7)", () => {
  it("records nothing and keeps the question in progress when the repeat cannot be loaded", async () => {
    const { api, user } = await practise();
    const [first] = deliveries();
    await answer(user, sumOf(first!));
    const before = window.localStorage.getItem(KEY);
    api.fail.add("getInstance");
    fireEvent.click(screen.getByTestId("repeat-question"));
    expect(await screen.findByText("Oppgaven kunne ikke hentes. Prøv igjen.")).toBeTruthy();
    expect(window.localStorage.getItem(KEY)).toBe(before);
    expect(screen.getByTestId("result")).toBeTruthy(); // the answered question is still on screen
  });

  it("says so on the replay and stays there when the repeat cannot be loaded", async () => {
    window.localStorage.setItem(KEY, JSON.stringify({ schema: 1, value: { ...beforeThisFeature(), language: "en", lessonViews: [] } }));
    const [d] = stored().deliveries as Delivery[];
    const api = createFakeApi();
    render(<App api={api} initialPath={`/record/${d!.id}`} />);
    const button = await screen.findByTestId("replay-repeat");
    await screen.findByTestId("prompt");
    const before = window.localStorage.getItem(KEY);
    api.fail.add("getInstance");
    fireEvent.click(button);
    expect((await screen.findByTestId("replay-repeat-failed")).textContent).toBe("The question could not be loaded. Try again.");
    expect(screen.getByTestId("replay-page")).toBeTruthy();
    expect(window.localStorage.getItem(KEY)).toBe(before);
  });
});

describe("replay of a repeat (test 8)", () => {
  it("replays every repeated question to the same question", async () => {
    const { api, user } = await practise();
    const [first] = deliveries();
    await answer(user, sumOf(first!));
    await repeat(user);
    await answer(user, sumOf(first!));
    await repeat(user);
    await user.click(screen.getByTestId("lang-en"));
    for (const d of deliveries().slice(1)) {
      await user.click(screen.getByRole("link", { name: "My work" }));
      await user.click((await screen.findAllByTestId("progress-questions"))[0]!);
      const calls = instanceCalls(api).length;
      await user.click(screen.getAllByTestId("record-question").find((l) => l.getAttribute("href") === `/record/${d.id}`)!);
      await screen.findByTestId("replay-outcome");
      expect(within(screen.getByTestId("replay-page")).getByTestId("prompt").getAttribute("aria-label")).toBe(`${d.instance.a} plus ${d.instance.b}. What is the sum?`);
      expect(screen.queryByTestId("replay-unavailable")).toBeNull();
      expect(instanceCalls(api).slice(calls)).toEqual([`getInstance ${d.instance.definitionId}@1 ${d.instance.seed}`]);
    }
  });
});
