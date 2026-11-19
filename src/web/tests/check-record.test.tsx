// specs/006 contracts/summary.md "Checks in 'My work'" (task T045): each skill's runs newest first, counts only for runs
// that are over, an unfinished run's position and "Continue the check", skills with only checks, practice's lines
// unchanged by a check, and a run's summary that records nothing.
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { App } from "../src/App";
import { formatDate } from "../src/i18n";
import { en } from "../src/i18n/en";
import type { CheckRun } from "../src/state/checks";
import type { Delivery } from "../src/state/observations";
import { createFakeApi, PILOT_CHECK } from "./fakeApi";
import { at, BONDS_DEFINITION, beforeThisFeature, checkRun, correct, delivery, everyOutcome, incorrect, SKILLS, withRepeats } from "./records";

const KEY = "mathkx.guest.v1";
const ADDITION = "numbers.addition-within-20";
const stored = () => JSON.parse(window.localStorage.getItem(KEY) ?? "{}").value ?? {};

afterEach(() => {
  window.localStorage.clear();
  window.history.replaceState(null, "", "/");
});

interface Seed {
  deliveries?: Delivery[];
  checkRuns?: CheckRun[];
  lessonViews?: { lessonId: string; language: string; at: string }[];
  language?: "en" | "nb";
  /** The test skill list, where number bonds has a definition of its own. */
  bothSkills?: boolean;
}

function openRecord({ deliveries = [], checkRuns = [], lessonViews = [], language = "en", bothSkills = false }: Seed) {
  window.localStorage.setItem(KEY, JSON.stringify({ schema: 1, value: { ...beforeThisFeature(), language, deliveries, lessonViews, checkRuns } }));
  const api = createFakeApi(bothSkills ? { skills: SKILLS } : {});
  render(<App api={api} initialPath="/record" />);
  return { api, user: userEvent.setup() };
}

async function groupOf(skillId: string) {
  await waitFor(() => expect(screen.getAllByTestId("skill-group").some((g) => g.getAttribute("data-skill") === skillId)).toBe(true));
  return screen.getAllByTestId("skill-group").find((g) => g.getAttribute("data-skill") === skillId)!;
}

const lines = (group: HTMLElement) => within(group).queryAllByTestId("check-run");
const texts = (group: HTMLElement) => lines(group).map((l) => within(l).getByTestId("check-run-text").textContent);
const follows = (earlier: Element, later: Element) => (earlier.compareDocumentPosition(later) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;

/** Quickstart scenario 1: two correct, `8 + 5` answered 12, `9 + 4` skipped. */
const scenarioOne = (id: string, startedAt: string) => checkRun({ id, positions: ["correct", "correct", "wrong", "skipped"], startedAt, finishedAt: startedAt });
const allCorrect = (id: string, startedAt: string) => checkRun({ id, positions: ["correct", "correct", "correct", "correct"], startedAt, finishedAt: startedAt });
const unfinishedAtThree = (id = "run-u") =>
  checkRun({ id, positions: ["correct", "correct", "reached", null], position: 3, startedAt: at(8), resume: { draft: "5", helpOpen: false, helpStep: -1, explanationOpen: false, explanationStep: -1, result: null } });

describe("checks in 'My work'", () => {
  it("lists a skill's runs under 'Checks', newest first, after practice's lines, with the entry after the runs", async () => {
    openRecord({ deliveries: [delivery({ startedAt: at(0), events: [correct(8)] })], checkRuns: [scenarioOne("run-old", at(1)), allCorrect("run-new", at(5))] });
    const group = await groupOf(ADDITION);
    const part = within(group).getByTestId("check-record");
    expect(within(part).getByRole("heading", { level: 3 }).textContent).toBe("Checks");
    expect(lines(group).map((l) => within(l).getByTestId("check-run-link").textContent)).toEqual([formatDate("en", at(5)), formatDate("en", at(1))]);
    expect(texts(group)).toEqual(["4 correct on your own, 0 worth revisiting, 0 skipped", "2 correct on your own, 1 worth revisiting, 1 skipped"]);
    expect(within(group).getAllByTestId("check-run-link")[0]!.getAttribute("aria-label")).toBe(`Your check from ${formatDate("en", at(5))}`);

    expect(follows(within(group).getByTestId("record-summary"), part)).toBe(true);
    expect(follows(part, within(group).getByTestId("progress-questions"))).toBe(true);
    const entry = await within(group).findByTestId(`check-entry-${PILOT_CHECK.id}`);
    expect(follows(part, entry)).toBe(true);
    expect(follows(entry, within(group).getByTestId("progress-questions"))).toBe(true);
  });

  it("states the counts in Norwegian", async () => {
    openRecord({ checkRuns: [scenarioOne("run-1", at(1))], language: "nb" });
    const group = await groupOf(ADDITION);
    expect(within(within(group).getByTestId("check-record")).getByRole("heading", { level: 3 }).textContent).toBe("Sjekker");
    expect(texts(group)).toEqual(["2 riktig på egen hånd, 1 verdt å se på igjen, 1 hoppet over"]);
  });

  it("adds a switch's supported part and an ended run's questions not answered", async () => {
    const switched = checkRun({ id: "run-s", positions: ["correct", [incorrect(7), correct(9)], "correct", "skipped"], switchAt: 2, startedAt: at(2), finishedAt: at(3) });
    const ended = checkRun({ id: "run-e", positions: ["correct", "wrong", "reached", null], position: 3, startedAt: at(4), endedAt: at(6) });
    openRecord({ checkRuns: [switched, ended] });
    const group = await groupOf(ADDITION);
    expect(texts(group)).toEqual([
      "1 correct on your own, 1 worth revisiting, 0 skipped, 2 not answered",
      "1 correct on your own, 0 worth revisiting, 0 skipped, 3 as supported practice from question 2",
    ]);
    expect(lines(group).map((l) => l.getAttribute("data-state"))).toEqual(["ended", "finished"]);
    for (const text of texts(group)) expect(text).not.toMatch(/\d\s*\/\s*\d|%/);
  });

  it("shows an unfinished run's position and 'Continue the check' only, which opens the run with its draft", async () => {
    const { user } = openRecord({ checkRuns: [unfinishedAtThree()] });
    const group = await groupOf(ADDITION);
    const [line] = lines(group);
    expect(line!.getAttribute("data-state")).toBe("unfinished");
    expect(within(line!).getByTestId("check-run-text").textContent).toBe("Unfinished, at question 3 of 4");
    expect(within(line!).queryByTestId("check-run-link")).toBeNull();
    expect(line!.textContent).not.toMatch(/correct|revisiting|skipped|not answered/i);

    await user.click(within(line!).getByTestId("check-run-continue"));
    await screen.findByTestId("independent-question");
    expect(window.location.pathname).toBe(`/checks/${PILOT_CHECK.id}/run-u`);
    expect(screen.getByTestId("check-position").textContent).toBe("Question 3 of 4");
    expect((screen.getByTestId("answer") as HTMLInputElement).value).toBe("5");
  });

  it("lists a skill whose only activity is check runs, with 'No questions practised yet.'", async () => {
    openRecord({ checkRuns: [scenarioOne("run-1", at(1))] });
    const group = await groupOf(ADDITION);
    expect(screen.queryByTestId("record-empty")).toBeNull();
    expect(within(group).getByTestId("skill-name").textContent).toBe("Addition within 20");
    expect(within(group).getByTestId("record-no-practice").textContent).toBe(en.progress.noPractice);
    expect(within(group).queryByTestId("progress-questions")).toBeNull();
    expect(lines(group)).toHaveLength(1);
  });

  it("orders skills by their latest activity, a check included", async () => {
    const deliveries = [delivery({ startedAt: at(1), events: [correct(8)] }), delivery({ definitionId: BONDS_DEFINITION, startedAt: at(3), a: 3, b: 7, events: [correct(10)] })];
    const order = () => screen.getAllByTestId("skill-group").map((g) => g.getAttribute("data-skill"));
    openRecord({ deliveries, bothSkills: true });
    await groupOf(ADDITION);
    expect(order()).toEqual(["numbers.number-bonds-to-ten", ADDITION]);
    cleanup();

    openRecord({ deliveries, bothSkills: true, checkRuns: [scenarioOne("run-1", at(5))] });
    await groupOf(ADDITION);
    expect(order()).toEqual([ADDITION, "numbers.number-bonds-to-ten"]);
  });

  it("leaves practice's sentence, repeat sentences, lesson lines, and question list unchanged by a finished check", async () => {
    const practice = [...everyOutcome(), ...withRepeats()];
    const lessonViews = [{ lessonId: "number-bonds-to-ten", language: "en", at: at(30) }];
    const practiceLines = (group: HTMLElement) =>
      ["record-summary", "record-no-practice", "record-repeats", "record-repeats-requested", "lesson-viewed", "record-item"].flatMap((id) => within(group).queryAllByTestId(id).map((e) => `${id}: ${e.textContent}`));

    openRecord({ deliveries: practice, lessonViews });
    const before = practiceLines(await groupOf(ADDITION));
    expect(before.length).toBeGreaterThan(10);
    cleanup();

    openRecord({ deliveries: practice, lessonViews, checkRuns: [scenarioOne("run-1", at(40))] });
    const group = await groupOf(ADDITION);
    expect(lines(group)).toHaveLength(1);
    expect(practiceLines(group)).toEqual(before);
  });

  it("opens a run's summary from its link, and the summary records nothing", async () => {
    const { user } = openRecord({ checkRuns: [scenarioOne("run-1", at(1))] });
    const group = await groupOf(ADDITION);
    const before = JSON.stringify({ deliveries: stored().deliveries, checkRuns: stored().checkRuns });
    await user.click(within(group).getByTestId("check-run-link"));
    await screen.findByTestId("check-summary");
    expect(window.location.pathname).toBe(`/checks/${PILOT_CHECK.id}/run-1`);
    await waitFor(() => expect(screen.getAllByTestId("check-correct-answer")).toHaveLength(4));
    await user.click(screen.getAllByTestId("check-explanation-toggle")[0]!);
    await screen.findByTestId("explanation-panel");
    expect(JSON.stringify({ deliveries: stored().deliveries, checkRuns: stored().checkRuns })).toBe(before);
  });

  it("shows no checks part for 'Other practice'", async () => {
    openRecord({ deliveries: [delivery({ definitionId: "numbers.unknown", startedAt: at(1), events: [correct(8)] })], checkRuns: [scenarioOne("run-1", at(2))] });
    await groupOf(ADDITION);
    const other = await groupOf("");
    expect(within(other).queryByTestId("check-record")).toBeNull();
    expect(within(other).queryByTestId(`check-entry-${PILOT_CHECK.id}`)).toBeNull();
  });
});
