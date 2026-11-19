// specs/006 contracts/check-run.md (tasks T017, T031): the start screen, starting a run, the independent part's absences,
// saving with its guidance and failures, skipping, the end of the run, separation from practice, and the switch.
import { act, cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { App } from "../src/App";
import { en } from "../src/i18n/en";
import { nb } from "../src/i18n/nb";
import type { CheckRun } from "../src/state/checks";
import type { Delivery } from "../src/state/observations";
import { createFakeApi, PILOT_CHECK } from "./fakeApi";
import { at, beforeThisFeature, checkRun } from "./records";

const KEY = "mathkx.guest.v1";
const CHECK_PATH = `/checks/${PILOT_CHECK.id}`;
const PRACTICE_PATH = "/practice/numbers.addition-within-20";
const stored = () => JSON.parse(window.localStorage.getItem(KEY) ?? "{}").value ?? {};
const runs = (): CheckRun[] => stored().checkRuns ?? [];
const onlyRun = () => {
  expect(runs()).toHaveLength(1);
  return runs()[0]!;
};
type User = ReturnType<typeof userEvent.setup>;
type Api = ReturnType<typeof createFakeApi>;

afterEach(() => {
  window.localStorage.clear();
  window.history.replaceState(null, "", "/");
});

function go(path: string) {
  act(() => {
    window.history.pushState(null, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
}

async function openStart(lang: "en" | "nb", api: Api = createFakeApi()) {
  window.localStorage.clear();
  render(<App api={api} initialPath={CHECK_PATH} />);
  const user = userEvent.setup();
  await user.click(screen.getByTestId(`lang-${lang}`));
  await screen.findByTestId("check-start");
  return { api, user };
}

async function startCheck(api: Api = createFakeApi()) {
  const opened = await openStart("en", api);
  await opened.user.click(screen.getByTestId("check-start"));
  await screen.findByTestId("independent-question");
  return opened;
}

const position = () => screen.getByTestId("check-position").textContent;

async function save(user: User, answer: string) {
  const before = position();
  const field = screen.getByTestId("answer");
  await user.clear(field);
  await user.type(field, answer);
  await user.click(screen.getByTestId("check-save"));
  return before;
}

async function moveOn(user: User, action: () => Promise<unknown>, last = false) {
  const before = position();
  await action();
  if (last) await screen.findByTestId("check-summary");
  else await waitFor(() => expect(screen.getByTestId("check-position").textContent).not.toBe(before));
  void user;
}

/** Static parts of every result text: the status, outcome, and feedback entries, input guidance excepted. */
function resultTexts(dictionary: typeof en | typeof nb): string[] {
  const feedback = Object.entries(dictionary.feedback).filter(([code]) => !code.startsWith("invalid."));
  const all = [...Object.values(dictionary.status), ...Object.values(dictionary.outcome), ...feedback.map(([, text]) => text), dictionary.practice.changeAnswer];
  return all.flatMap((text) => text.split(/\{\w+\}/).map((s) => s.trim())).filter((s) => s.length >= 6);
}

const FORBIDDEN_IDS = ["toggle-help", "toggle-explanation", "to-lesson", "result-region", "result", "another", "repeat-question", "easier", "harder", "more-like-this", "help-panel", "explanation-panel"];
const FORBIDDEN_CALLS = /^(getStep|getAnswer|getLessonContent|getVisualSteps)/;

function expectNothingBeyondTheQuestion(api: Api) {
  for (const id of FORBIDDEN_IDS) expect(screen.queryByTestId(id), id).toBeNull();
  const text = document.body.textContent ?? "";
  for (const fragment of resultTexts(en)) expect(text, fragment).not.toContain(fragment);
  for (const el of document.body.querySelectorAll("[aria-label]")) {
    const label = el.getAttribute("aria-label") ?? "";
    for (const fragment of resultTexts(en)) expect(label, fragment).not.toContain(fragment);
  }
  expect(api.calls.filter((c) => FORBIDDEN_CALLS.test(c))).toEqual([]);
}

describe("the start screen", () => {
  it("states the title, scope, size, and policy in English", async () => {
    await openStart("en");
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Check your understanding: Number bonds and addition");
    expect(screen.getByTestId("check-scope").textContent).toBe("What this checks: Addition within ten and across ten");
    expect(screen.getByTestId("check-count").textContent).toBe("4 questions");
    expect(screen.getAllByTestId("check-policy").map((p) => p.textContent)).toEqual([
      en.check.policyIndependent,
      en.check.policyFeedback,
      en.check.policySwitch,
      en.check.policyAccess,
      en.check.policySnapshot,
    ]);
    expect(screen.getByTestId("check-start").textContent).toBe("Start the check");
    expect(runs()).toEqual([]); // leaving the start screen records nothing
  });

  it("states them in Norwegian", async () => {
    await openStart("nb");
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Sjekk forståelsen: Tiervenner og addisjon");
    expect(screen.getByTestId("check-scope").textContent).toBe("Dette sjekkes: Addisjon innenfor ti og over tieren");
    expect(screen.getByTestId("check-count").textContent).toBe("4 oppgaver");
    expect(screen.getAllByTestId("check-policy").map((p) => p.textContent)).toEqual([
      nb.check.policyIndependent,
      nb.check.policyFeedback,
      nb.check.policySwitch,
      nb.check.policyAccess,
      nb.check.policySnapshot,
    ]);
    expect(screen.getByTestId("check-start").textContent).toBe("Start sjekken");
  });

  it("says the check is unavailable when it is unknown or the list fails", async () => {
    window.localStorage.clear();
    const { unmount } = render(<App api={createFakeApi()} initialPath="/checks/numbers.unknown" />);
    expect((await screen.findByTestId("check-unavailable")).textContent).toBe(nb.check.unavailable);
    unmount();
    render(<App api={createFakeApi({ checksFail: true })} initialPath={CHECK_PATH} />);
    expect((await screen.findByTestId("check-unavailable")).textContent).toBe(nb.check.unavailable);
  });
});

describe("starting", () => {
  it("creates one run with a copy of the four identities and shows question 1, focused", async () => {
    await startCheck();
    const run = onlyRun();
    expect(run.questions).toEqual([
      { definitionId: "numbers.addition.within-10", version: 1, seed: "22" },
      { definitionId: "numbers.addition.within-10", version: 1, seed: "24" },
      { definitionId: "numbers.addition.crossing-ten", version: 1, seed: "105" },
      { definitionId: "numbers.addition.crossing-ten", version: 1, seed: "62" },
    ]);
    expect({ checkId: run.checkId, checkVersion: run.checkVersion, skillId: run.skillId, position: run.position, switchAt: run.switchAt }).toEqual({
      checkId: PILOT_CHECK.id,
      checkVersion: 1,
      skillId: "numbers.addition-within-20",
      position: 1,
      switchAt: null,
    });
    expect(window.location.pathname).toBe(`${CHECK_PATH}/${run.id}`);
    expect(position()).toBe("Question 1 of 4");
    expect(screen.getByTestId("check-mode").textContent).toBe("On your own");
    expect(screen.getByTestId("prompt").getAttribute("aria-label")).toBe("7 plus 3. What is the sum?");
    await waitFor(() => expect(document.activeElement).toBe(screen.getByTestId("prompt")));
    // The question is reached: its delivery belongs to the run, never to practice.
    expect(run.deliveries).toHaveLength(1);
    expect(run.deliveries[0]!.purpose).toBe("check");
    expect(stored().deliveries).toEqual([]);
  });
});

describe("the independent part", () => {
  it("shows no help, explanation, lesson, result, or practice control, and requests none, through all four questions", async () => {
    const { api, user } = await startCheck();
    expectNothingBeyondTheQuestion(api);
    for (const [answer, last] of [["10", false], ["4", false], ["12", false], ["13", true]] as const) {
      await moveOn(user, () => save(user, answer), last);
      if (!last) expectNothingBeyondTheQuestion(api); // the summary that follows the last one may request answers
    }
  });

  it("records a correct and an incorrect save as the only submission each, and moves on with no result", async () => {
    const { user } = await startCheck();
    await moveOn(user, () => save(user, "10"));
    await moveOn(user, () => save(user, "7"));
    const run = onlyRun();
    expect(run.position).toBe(3);
    expect(run.deliveries[0]!.events).toEqual([expect.objectContaining({ type: "submission", status: "correct", value: 10 })]);
    expect(run.deliveries[1]!.events).toEqual([expect.objectContaining({ type: "submission", status: "incorrect", value: 7 })]);
    expect(screen.queryByTestId("result")).toBeNull();
    expect((screen.getByTestId("answer") as HTMLInputElement).value).toBe("");
  });

  it("shows input guidance for unreadable input, records it, and stays", async () => {
    const { user } = await startCheck();
    await save(user, "4+4");
    expect((await screen.findByTestId("check-guidance")).textContent).toBe("We couldn't read “4+4” as a whole number. Enter a number such as 8.");
    expect(screen.getByTestId("check-guidance").getAttribute("role")).toBe("status");
    expect(position()).toBe("Question 1 of 4");
    const run = onlyRun();
    expect(run.position).toBe(1);
    expect(run.deliveries[0]!.events).toEqual([expect.objectContaining({ type: "input-guidance", originalText: "4+4" })]);
    expect((screen.getByTestId("answer") as HTMLInputElement).value).toBe("4+4");
  });

  it("says an answer could not be saved, records nothing, and keeps the draft", async () => {
    const { user } = await startCheck(createFakeApi({ validateFailsOnce: true }));
    await save(user, "10");
    expect((await screen.findByTestId("check-unsaved")).textContent).toBe(en.check.unsaved);
    expect(screen.getByTestId("check-unsaved").getAttribute("role")).toBe("alert");
    expect(onlyRun().deliveries[0]!.events).toEqual([]);
    expect(onlyRun().resume?.draft).toBe("10");
    expect((screen.getByTestId("answer") as HTMLInputElement).value).toBe("10");
    await moveOn(user, () => user.click(screen.getByTestId("check-save")));
    expect(onlyRun().deliveries[0]!.events).toEqual([expect.objectContaining({ type: "submission", status: "correct" })]);
  });

  it("disables saving while a save is under way", async () => {
    const api = createFakeApi();
    const { user } = await startCheck(api);
    api.hold("validate");
    await save(user, "10");
    await waitFor(() => expect((screen.getByTestId("check-save") as HTMLButtonElement).disabled).toBe(true));
    await user.click(screen.getByTestId("check-save"));
    act(() => api.release("validate"));
    await waitFor(() => expect(position()).toBe("Question 2 of 4"));
    expect(onlyRun().deliveries[0]!.events).toHaveLength(1);
    expect(api.calls.filter((c) => c.startsWith("validate"))).toHaveLength(1);
  });

  it("records a skip and moves on", async () => {
    const { user } = await startCheck();
    await moveOn(user, () => user.click(screen.getByTestId("check-skip")));
    expect(onlyRun().deliveries[0]!.events).toEqual([{ type: "skipped" }]);
    expect(position()).toBe("Question 2 of 4");
    expect(screen.getByTestId("prompt").getAttribute("aria-label")).toBe("5 plus 4. What is the sum?");
  });
});

describe("the end", () => {
  it("finishes the run after question 4 and shows the summary with focus on its heading", async () => {
    const { user } = await startCheck();
    await moveOn(user, () => save(user, "10"));
    await moveOn(user, () => save(user, "9"));
    await moveOn(user, () => save(user, "12"));
    await moveOn(user, () => user.click(screen.getByTestId("check-skip")), true);
    const run = onlyRun();
    expect(run.finishedAt).toBeTruthy();
    expect(run.endedAt).toBeUndefined();
    expect(run.position).toBe(4);
    expect(run.resume).toBeNull();
    await waitFor(() => expect(document.activeElement).toBe(screen.getByTestId("check-summary-heading")));
    expect(screen.getByTestId("check-summary-heading").textContent).toBe("Your check");
  });
});

describe("separation from practice", () => {
  it("keeps a practice question resumable with its draft and help, and leaves practice's record unchanged", async () => {
    window.localStorage.clear();
    const api = createFakeApi();
    render(<App api={api} initialPath={PRACTICE_PATH} />);
    const user = userEvent.setup();
    await user.click(screen.getByTestId("lang-en"));
    await screen.findByTestId("prompt");
    await user.type(screen.getByTestId("answer"), "7");
    await user.click(screen.getByTestId("toggle-help"));
    await screen.findByTestId("help-panel");

    go(CHECK_PATH);
    await screen.findByTestId("check-start");
    const before = { deliveries: stored().deliveries as Delivery[], session: stored().session, resumable: stored().resumable };
    expect(before.resumable).toEqual(expect.objectContaining({ draft: "7", helpOpen: true }));

    await user.click(screen.getByTestId("check-start"));
    await screen.findByTestId("independent-question");
    await moveOn(user, () => save(user, "10"));
    await moveOn(user, () => user.click(screen.getByTestId("check-skip")));
    await moveOn(user, () => save(user, "13"));
    await moveOn(user, () => save(user, "13"), true);
    expect({ deliveries: stored().deliveries, session: stored().session, resumable: stored().resumable }).toEqual(before);

    go(PRACTICE_PATH);
    await screen.findByTestId("exercise-shell");
    expect((screen.getByTestId("answer") as HTMLInputElement).value).toBe("7");
    expect(screen.getByTestId("toggle-help").getAttribute("aria-expanded")).toBe("true");
    expect(stored().deliveries).toHaveLength(before.deliveries.length);
  });
});

/** Question 1 saved wrong and question 2 skipped (quickstart scenario 2, step 1): question 3 is on screen. */
async function atQuestionThree(api: Api = createFakeApi()) {
  const started = await startCheck(api);
  await moveOn(started.user, () => save(started.user, "11"));
  await moveOn(started.user, () => started.user.click(screen.getByTestId("check-skip")));
  expect(position()).toBe("Question 3 of 4");
  return started;
}

async function switchHere(user: User) {
  await user.click(screen.getByTestId("check-need-help"));
  await user.click(screen.getByTestId("check-switch-yes"));
  await screen.findByTestId("supported-question");
}

const PRACTICE_CONTROLS = ["another", "repeat-question", "easier", "harder", "more-like-this"];
const supportKinds = (index: number) => onlyRun().deliveries[index]!.events.flatMap((e) => (e.type === "support" ? [e.kind] : []));
const NO_WAY_BACK = ["check-need-help", "check-switch", "check-save", "independent-question"];

async function check(user: User, answer: string) {
  const run = onlyRun();
  const submissions = () => onlyRun().deliveries[run.position - 1]!.events.filter((e) => e.type === "submission").length;
  const before = submissions();
  const field = screen.getByTestId("answer");
  await user.clear(field);
  await user.type(field, answer);
  await user.click(screen.getByTestId("check"));
  await waitFor(() => expect(submissions()).toBe(before + 1));
  await screen.findByTestId("result");
}

describe("the switch", () => {
  it("'I need help' explains the switch, focused on its heading, and 'Continue without help' records nothing", async () => {
    const { user } = await atQuestionThree();
    const before = JSON.stringify(stored());
    const needHelp = screen.getByTestId("check-need-help");
    await user.click(needHelp);
    const dialog = screen.getByTestId("check-switch");
    expect(dialog.getAttribute("role")).toBe("dialog");
    const heading = screen.getByRole("heading", { name: "Switch to supported practice?" });
    expect(dialog.getAttribute("aria-labelledby")).toBe(heading.id);
    await waitFor(() => expect(document.activeElement).toBe(heading));
    expect(screen.getByTestId("check-switch-body").textContent).toBe(en.check.switchBody.replace(/\{i\}/g, "3"));
    await user.click(screen.getByTestId("check-switch-no"));
    expect(screen.queryByTestId("check-switch")).toBeNull();
    expect(document.activeElement).toBe(needHelp);
    expect(onlyRun().switchAt).toBeNull();
    expect(JSON.stringify(stored())).toBe(before);
  });

  it("closes on Escape as 'Continue without help' does", async () => {
    const { user } = await atQuestionThree();
    await user.click(screen.getByTestId("check-need-help"));
    await user.keyboard("{Escape}");
    expect(screen.queryByTestId("check-switch")).toBeNull();
    expect(document.activeElement).toBe(screen.getByTestId("check-need-help"));
    expect(onlyRun().switchAt).toBeNull();
    expect(screen.getByTestId("independent-question")).toBeTruthy();
  });

  it("'Switch' sets switchAt, keeps the draft, and shows the question as supported practice", async () => {
    const { user } = await atQuestionThree();
    await user.type(screen.getByTestId("answer"), "1");
    await switchHere(user);
    expect(onlyRun().switchAt).toBe(3);
    expect(onlyRun().position).toBe(3);
    expect(screen.getByTestId("check-mode").textContent).toBe("Supported practice (from question 3)");
    expect(position()).toBe("Question 3 of 4");
    expect((screen.getByTestId("answer") as HTMLInputElement).value).toBe("1");
    expect(screen.getByTestId("toggle-help")).toBeTruthy();
    expect(screen.getByTestId("check")).toBeTruthy();
    await waitFor(() => expect(document.activeElement).toBe(screen.getByTestId("prompt")));
    // The switch itself records nothing on the question, and the earlier answers stay as they were.
    expect(onlyRun().deliveries[2]!.events).toEqual([]);
    expect(onlyRun().deliveries[0]!.events).toEqual([expect.objectContaining({ type: "submission", status: "incorrect" })]);
  });

  it("cannot be undone: nothing on the screen offers a way back, on this question or the next", async () => {
    const { user } = await atQuestionThree();
    await switchHere(user);
    for (const id of NO_WAY_BACK) expect(screen.queryByTestId(id), id).toBeNull();
    await check(user, "13");
    await moveOn(user, () => user.click(screen.getByTestId("check-next")));
    expect(screen.getByTestId("check-mode").textContent).toBe("Supported practice (from question 3)");
    for (const id of NO_WAY_BACK) expect(screen.queryByTestId(id), id).toBeNull();
  });
});

describe("the supported part", () => {
  it("offers only 'Skip' before an answer, only 'Next question' after one, and 'See summary' on question 4", async () => {
    const { user } = await atQuestionThree();
    await switchHere(user);
    const controls = () => ["check-skip", "check-next", "check-finish"].filter((id) => screen.queryByTestId(id));
    expect(controls()).toEqual(["check-skip"]);
    await check(user, "12"); // wrong: feedback, and a retry is possible
    expect(screen.getByTestId("result")).toBeTruthy();
    expect(controls()).toEqual(["check-next"]);
    await check(user, "13");
    expect(controls()).toEqual(["check-next"]);
    for (const id of PRACTICE_CONTROLS) expect(screen.queryByTestId(id), id).toBeNull();
    await moveOn(user, () => user.click(screen.getByTestId("check-next")));
    expect(position()).toBe("Question 4 of 4");
    expect(controls()).toEqual(["check-skip"]);
    await check(user, "13");
    expect(controls()).toEqual(["check-finish"]);
    for (const id of PRACTICE_CONTROLS) expect(screen.queryByTestId(id), id).toBeNull();
    await moveOn(user, () => user.click(screen.getByTestId("check-finish")), true);
    expect(onlyRun().finishedAt).toBeTruthy();
    expect(onlyRun().deliveries).toHaveLength(4); // "See summary" creates no delivery
  });

  it("records help, steps, retries, and the explanation on the run's delivery, as practice does", async () => {
    const { api, user } = await atQuestionThree();
    await switchHere(user);
    await user.click(screen.getByTestId("toggle-help"));
    await screen.findByTestId("help-panel");
    expect(supportKinds(2)).toEqual(["visual-help-opened"]);
    await user.click(screen.getByTestId("help-next"));
    await screen.findByTestId("help-step-text");
    expect(supportKinds(2)).toEqual(["visual-help-opened", "help-step"]);
    await check(user, "12");
    await check(user, "13");
    await user.click(screen.getByTestId("toggle-explanation"));
    await user.click(await screen.findByTestId("explanation-next"));
    await screen.findByTestId("explanation-step-text");
    const events = onlyRun().deliveries[2]!.events;
    expect(events.map((e) => (e.type === "submission" ? e.status : e.type === "support" ? e.kind : e.type))).toEqual([
      "visual-help-opened",
      "help-step",
      "incorrect",
      "correct",
      "explanation-open",
      "explanation-step",
    ]);
    expect(api.calls.filter((c) => c.startsWith("getStep"))).toEqual(["getStep help 0", "getStep explanation 0"]);
    expect(stored().deliveries).toEqual([]); // practice's record is untouched
  });

  it("links to the lesson with ?from=check and the question it is about", async () => {
    const { user } = await atQuestionThree();
    await switchHere(user);
    const id = onlyRun().deliveries[2]!.id;
    expect(screen.getByTestId("to-lesson").getAttribute("href")).toBe(`/lessons/number-bonds-to-ten?from=check&checkQuestion=${id}`);
  });

  it("records a skip before an answer and moves on", async () => {
    const { user } = await atQuestionThree();
    await switchHere(user);
    await moveOn(user, () => user.click(screen.getByTestId("check-skip")));
    expect(onlyRun().deliveries[2]!.events).toEqual([{ type: "skipped" }]);
    expect(onlyRun().position).toBe(4);
  });

  it("restores the draft, open help, and its steps after a reload, without recording them again", async () => {
    const api = createFakeApi();
    const { user } = await atQuestionThree(api);
    await switchHere(user);
    await user.click(screen.getByTestId("toggle-help"));
    await user.click(await screen.findByTestId("help-next"));
    await screen.findByTestId("help-step-text");
    await user.type(screen.getByTestId("answer"), "13");
    const before = onlyRun().deliveries[2]!.events;
    const path = window.location.pathname;
    cleanup();
    render(<App api={api} initialPath={path} />);
    expect((await screen.findByTestId("help-step-text")).textContent).toBeTruthy();
    expect((screen.getByTestId("answer") as HTMLInputElement).value).toBe("13");
    expect(screen.getByTestId("toggle-help").getAttribute("aria-expanded")).toBe("true");
    expect(onlyRun().deliveries[2]!.events).toEqual(before);
  });
});

// PR 53 review: a reached question is shown only when its identity still resolves to the recorded operands.
describe("a resumed question whose identity now resolves to other operands", () => {
  const seed = (run: CheckRun) => window.localStorage.setItem(KEY, JSON.stringify({ schema: 1, value: { ...beforeThisFeature(), deliveries: [], checkRuns: [run] } }));
  const resume = { draft: "9", helpOpen: true, helpStep: 0, explanationOpen: false, explanationStep: -1, result: null };

  it("is not shown in the independent part: the run and its draft stay, and nothing can be saved against it", async () => {
    seed(checkRun({ id: "run-r", positions: ["wrong", "reached", null, null], position: 2, resume: { ...resume, helpOpen: false, helpStep: -1 } }));
    const api = createFakeApi({ resolveDiffers: true });
    render(<App api={api} initialPath={`${CHECK_PATH}/run-r`} />);
    expect((await screen.findByTestId("check-load-error")).textContent).toBe("Question 2 cannot be shown just now.");
    expect(screen.getByTestId("check-retry")).toBeTruthy();
    for (const id of ["prompt", "answer", "check-save", "check-skip"]) expect(screen.queryByTestId(id), id).toBeNull();
    const run = onlyRun();
    expect(run.resume?.draft).toBe("9");
    expect(run.position).toBe(2);
    expect(run.deliveries[1]!.instance).toMatchObject({ a: 5, b: 4 });
    expect(run.deliveries[1]!.events).toEqual([]);
    expect(api.calls.filter((c) => c.startsWith("validate"))).toEqual([]);
  });

  it("is not shown in the supported part, and its help steps are not fetched again", async () => {
    seed(checkRun({ id: "run-s", positions: ["wrong", "reached", null, null], position: 2, switchAt: 2, resume }));
    const api = createFakeApi({ resolveDiffers: true });
    render(<App api={api} initialPath={`${CHECK_PATH}/run-s`} />);
    expect((await screen.findByTestId("check-load-error")).textContent).toBe("Question 2 cannot be shown just now.");
    for (const id of ["prompt", "answer", "check", "toggle-help", "help-panel"]) expect(screen.queryByTestId(id), id).toBeNull();
    expect(api.calls.filter((c) => c.startsWith("getStep"))).toEqual([]);
    expect(onlyRun().resume).toEqual(resume);
    expect(onlyRun().deliveries[1]!.events).toEqual([]);
  });

  it("is shown as before when the identity resolves to the recorded operands", async () => {
    seed(checkRun({ id: "run-ok", positions: ["wrong", "reached", null, null], position: 2, resume: { ...resume, helpOpen: false, helpStep: -1 } }));
    render(<App api={createFakeApi()} initialPath={`${CHECK_PATH}/run-ok`} />);
    await screen.findByTestId("independent-question");
    expect(screen.getByTestId("prompt").getAttribute("aria-label")).toBe("5 plus 4. What is the sum?");
    expect((screen.getByTestId("answer") as HTMLInputElement).value).toBe("9");
    expect(screen.queryByTestId("check-load-error")).toBeNull();
  });
});

// PR 53 review: a start or a save still on its way belongs to the screen it was asked from.
describe("responses that arrive after the learner has moved on", () => {
  it("creates no run when the start screen is left while the start is under way", async () => {
    const { api, user } = await openStart("en");
    api.hold("getChecks");
    await user.click(screen.getByTestId("check-start"));
    go("/record");
    await screen.findByTestId("clear");
    act(() => api.release("getChecks"));
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(runs()).toEqual([]);
    expect(window.location.pathname).toBe("/record");
  });

  it("creates no run when the record is cleared while the start is under way", async () => {
    const { api, user } = await openStart("en");
    api.hold("getChecks");
    await user.click(screen.getByTestId("check-start"));
    go("/record");
    await user.click(await screen.findByTestId("clear"));
    await user.click(screen.getByTestId("confirm-clear"));
    act(() => api.release("getChecks"));
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(runs()).toEqual([]);
    expect(window.location.pathname).toBe("/record");
  });

  it("drops a save from a screen that was left, and the question on screen now still loads", async () => {
    const api = createFakeApi();
    const { user } = await startCheck(api);
    const runPath = window.location.pathname;
    api.hold("validate");
    await save(user, "10");
    // Leave and come back while the save is under way, then skip questions 1 and 2.
    go("/record");
    await screen.findByTestId("clear");
    go(runPath);
    await screen.findByTestId("independent-question");
    await moveOn(user, () => user.click(screen.getByTestId("check-skip")));
    api.hold("getInstance");
    await user.click(screen.getByTestId("check-skip"));
    act(() => api.release("validate"));
    act(() => api.release("getInstance"));
    await waitFor(() => expect(position()).toBe("Question 3 of 4"));
    expect(screen.getByTestId("prompt").getAttribute("aria-label")).toBe("8 plus 5. What is the sum?");
    const run = onlyRun();
    expect(run.position).toBe(3);
    expect(run.deliveries.map((d) => d.events)).toEqual([[{ type: "skipped" }], [{ type: "skipped" }], []]);
  });
});

// specs/006 contracts/check-run.md "Resuming" and contracts/summary.md "Not answered" (task T046).
describe("resuming", () => {
  async function typedAtThree(api: Api = createFakeApi()) {
    const started = await startCheck(api);
    await moveOn(started.user, () => save(started.user, "10"));
    await moveOn(started.user, () => save(started.user, "9"));
    await started.user.type(screen.getByTestId("answer"), "5");
    await waitFor(() => expect(onlyRun().resume?.draft).toBe("5"));
    return started;
  }

  it("restores question 3, its draft, and the independent part after a reload", async () => {
    const { api } = await typedAtThree();
    const path = window.location.pathname;
    const before = onlyRun();
    cleanup();
    render(<App api={api} initialPath={path} />);
    await screen.findByTestId("independent-question");
    expect(position()).toBe("Question 3 of 4");
    expect(screen.getByTestId("check-mode").textContent).toBe("On your own");
    expect(screen.getByTestId("prompt").getAttribute("aria-label")).toBe("8 plus 5. What is the sum?");
    expect((screen.getByTestId("answer") as HTMLInputElement).value).toBe("5");
    expect(onlyRun().deliveries).toEqual(before.deliveries);
  });

  it("restores the supported part's result and explanation steps after a reload, fetched again without new events", async () => {
    const api = createFakeApi();
    const { user } = await atQuestionThree(api);
    await switchHere(user);
    await check(user, "13");
    await user.click(screen.getByTestId("toggle-explanation"));
    await user.click(await screen.findByTestId("explanation-next"));
    await screen.findByTestId("explanation-step-text");
    const before = onlyRun().deliveries[2]!.events;
    const path = window.location.pathname;
    cleanup();
    const calls = api.calls.length;
    render(<App api={api} initialPath={path} />);
    expect((await screen.findByTestId("explanation-step-text")).textContent).toBeTruthy();
    expect(screen.getByTestId("toggle-explanation").getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByTestId("result")).toBeTruthy();
    expect(screen.getByTestId("check-next")).toBeTruthy();
    expect(api.calls.slice(calls)).toContain("getStep explanation 0");
    expect(onlyRun().deliveries[2]!.events).toEqual(before);
  });

  it("keeps the run, the draft, and the position across a language switch", async () => {
    const { user } = await typedAtThree();
    const before = onlyRun();
    await user.click(screen.getByTestId("lang-nb"));
    await waitFor(() => expect(position()).toBe("Oppgave 3 av 4"));
    expect(screen.getByTestId("check-mode").textContent).toBe("På egen hånd");
    expect((screen.getByTestId("answer") as HTMLInputElement).value).toBe("5");
    expect(onlyRun()).toEqual(before);
  });

  it("offers 'Continue the check' on the start screen, which returns to question 3 with its draft", async () => {
    const { user } = await typedAtThree();
    const runPath = window.location.pathname;
    go(CHECK_PATH);
    expect((await screen.findByTestId("check-unfinished")).textContent).toBe("You have a check you have not finished, at question 3 of 4. Continue the check");
    expect(screen.getByTestId("check-start")).toBeTruthy();
    await user.click(screen.getByTestId("check-continue"));
    await screen.findByTestId("independent-question");
    expect(window.location.pathname).toBe(runPath);
    expect(position()).toBe("Question 3 of 4");
    expect((screen.getByTestId("answer") as HTMLInputElement).value).toBe("5");
    expect(runs()).toHaveLength(1);
  });

  it("ends the old run on 'Start the check'; its summary lists questions 3 and 4 as not answered, never as skipped", async () => {
    const { user } = await typedAtThree();
    const oldId = onlyRun().id;
    go(CHECK_PATH);
    await user.click(await screen.findByTestId("check-start"));
    await waitFor(() => expect(runs()).toHaveLength(2));
    await screen.findByTestId("independent-question");
    expect(position()).toBe("Question 1 of 4");
    const old = runs().find((r) => r.id === oldId)!;
    const fresh = runs().find((r) => r.id !== oldId)!;
    expect(old.endedAt).toBeTruthy();
    expect(old.finishedAt).toBeUndefined();
    expect(fresh.position).toBe(1);
    expect(fresh.switchAt).toBeNull();
    expect(fresh.endedAt).toBeUndefined();

    go(`${CHECK_PATH}/${oldId}`);
    const notAnswered = await screen.findByTestId("check-not-answered");
    expect(within(notAnswered).getByRole("heading", { level: 2 }).textContent).toBe("Not answered");
    expect(within(notAnswered).getByTestId("check-not-answered-note").textContent).toBe("You started a new check before answering these questions.");
    const questions = within(notAnswered).getAllByTestId("check-question");
    expect(questions.map((q) => q.getAttribute("data-position"))).toEqual(["3", "4"]);
    await waitFor(() => expect(within(notAnswered).getAllByTestId("check-expression").map((e) => e.textContent)).toEqual(["8 + 5", "9 + 4"]));
    expect(within(questions[0]!).getByTestId("check-your-answer").textContent).toBe("Not answered");
    expect(within(screen.getByTestId("check-group-skipped")).getByTestId("check-group-count").textContent).toBe("0 questions");
    expect(within(screen.getByTestId("check-group-correct")).getByTestId("check-group-count").textContent).toBe("2 questions");
  });

  it("keeps a supported question answered before a new start in the supported part, with its outcome", async () => {
    const { user } = await atQuestionThree();
    await switchHere(user);
    await check(user, "13");
    const oldId = onlyRun().id;
    go(CHECK_PATH);
    await user.click(await screen.findByTestId("check-start"));
    await waitFor(() => expect(runs()).toHaveLength(2));
    go(`${CHECK_PATH}/${oldId}`);
    const supported = await screen.findByTestId("check-supported");
    const [question] = within(supported).getAllByTestId("check-question");
    expect(question!.getAttribute("data-position")).toBe("3");
    expect(within(question!).getByTestId("check-outcome").textContent).toBe(en.outcome.correctFirst);
    const notAnswered = within(screen.getByTestId("check-not-answered")).getAllByTestId("check-question");
    expect(notAnswered.map((q) => q.getAttribute("data-position"))).toEqual(["4"]);
  });

  it("shows the same summary after a reload on a finished run", async () => {
    const api = createFakeApi();
    const { user } = await startCheck(api);
    await moveOn(user, () => save(user, "10"));
    await moveOn(user, () => save(user, "9"));
    await moveOn(user, () => save(user, "12"));
    await moveOn(user, () => user.click(screen.getByTestId("check-skip")), true);
    const settled = async () => {
      await screen.findByTestId("check-title");
      await waitFor(() => expect(screen.getAllByTestId("check-correct-answer")).toHaveLength(4));
      await waitFor(() => expect(screen.getAllByTestId("check-explanation-toggle")).toHaveLength(4));
      return screen.getByTestId("check-summary").textContent;
    };
    const before = await settled();
    const path = window.location.pathname;
    cleanup();
    render(<App api={api} initialPath={path} />);
    expect(await settled()).toBe(before);
  });
});

// PR 51 review: an ended run's reached and unreached questions take different paths to their expression and answer.
describe("an ended run's summary", () => {
  const resume = { draft: "7", helpOpen: false, helpStep: -1, explanationOpen: false, explanationStep: -1, result: null };
  function show(options: Parameters<typeof createFakeApi>[0] = {}) {
    const run = checkRun({ id: "run-e", positions: ["reached", null, null, null], position: 1, startedAt: at(1), endedAt: at(5), resume });
    window.localStorage.setItem(KEY, JSON.stringify({ schema: 1, value: { ...beforeThisFeature(), deliveries: [], checkRuns: [run] } }));
    const api = createFakeApi(options);
    render(<App api={api} initialPath={`${CHECK_PATH}/run-e`} />);
    return { api, user: userEvent.setup() };
  }
  const notAnswered = () => within(screen.getByTestId("check-not-answered")).getAllByTestId("check-question");
  const textsOf = (id: string) => notAnswered().map((q) => within(q).queryByTestId(id)?.textContent ?? null);

  it("shows question 1 from the record and questions 2 to 4 from their answers, each with its explanation", async () => {
    const { api, user } = show();
    await screen.findByTestId("check-not-answered");
    await waitFor(() => expect(textsOf("check-correct-answer")).toEqual(["Correct answer: 10", "Correct answer: 9", "Correct answer: 13", "Correct answer: 13"]));
    expect(textsOf("check-expression")).toEqual(["7 + 3", "5 + 4", "8 + 5", "9 + 4"]);
    expect(textsOf("check-your-answer")).toEqual(["Not answered", "Not answered", "Not answered", "Not answered"]);
    await waitFor(() => expect(textsOf("check-explanation-toggle")).toEqual(Array(4).fill("Show explanation")));
    for (const name of ["correct", "revisit", "skipped"]) expect(within(screen.getByTestId(`check-group-${name}`)).getByTestId("check-group-count").textContent).toBe("0 questions");

    const before = JSON.stringify(stored().checkRuns);
    await user.click(within(notAnswered()[1]!).getByTestId("check-explanation-toggle"));
    await screen.findByTestId("explanation-panel");
    expect(JSON.stringify(stored().checkRuns)).toBe(before);
    expect(api.calls.filter((c) => c.startsWith("getAnswer"))).toHaveLength(4);
  });

  it("lists an unreached question it cannot show by its position, still under 'Not answered'", async () => {
    show({ answerFails: true });
    await screen.findByTestId("check-not-answered");
    await waitFor(() => expect(textsOf("check-unreached-unavailable")).toEqual([null, "Question 2 cannot be shown just now.", "Question 3 cannot be shown just now.", "Question 4 cannot be shown just now."]));
    expect(textsOf("check-answer-unavailable")).toEqual(["The correct answer cannot be shown just now.", null, null, null]);
    expect(textsOf("check-expression")).toEqual(["7 + 3", null, null, null]);
    expect(notAnswered()).toHaveLength(4);
  });

  it("shows a reached question's answer only for its recorded operands, and an unreached one with the operands it resolves to", async () => {
    show({ resolveDiffers: true });
    await screen.findByTestId("check-not-answered");
    await waitFor(() => expect(textsOf("check-correct-answer")).toEqual([null, "Correct answer: 10", "Correct answer: 14", "Correct answer: 14"]));
    expect(textsOf("check-expression")).toEqual(["7 + 3", "5 + 5", "8 + 6", "9 + 5"]);
    expect(textsOf("check-answer-unavailable")).toEqual(["The correct answer cannot be shown just now.", null, null, null]);
    await waitFor(() => expect(textsOf("check-explanation-unavailable")[0]).toBe("The explanation for this question is no longer available. Your answer is kept."));
    await waitFor(() => expect(textsOf("check-explanation-toggle")).toEqual([null, "Show explanation", "Show explanation", "Show explanation"]));
  });
});
