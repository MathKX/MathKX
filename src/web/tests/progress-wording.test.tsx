// specs/004 SC-002 and FR-002 (constitution I): "My work" and replay show counts in words, never a percentage, ratio,
// score, streak, or mastery word, in either language. Scans the rendered pages (text, aria-label, title) and the
// dictionary sections they draw on. specs/005 T031 adds the session summary, repeats on request, and the new
// practice wording. specs/006 T052 adds the self-checks: the start screen, both parts, the summary of a switched and of an
// ended run, and the checks part of "My work".
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { App } from "../src/App";
import { en } from "../src/i18n/en";
import { nb } from "../src/i18n/nb";
import type { CheckRun } from "../src/state/checks";
import type { Delivery } from "../src/state/observations";
import { createFakeApi, PILOT_CHECK } from "./fakeApi";
import { CROSSING, at, beforeThisFeature, checkRun, correct, everyOutcome, incorrect, support, withRepeats, withRequestedRepeats } from "./records";

const FORBIDDEN_WORDS = /\b(score|scores|streak|streaks|mastery|mastered|poeng|rekke|mestring|mestret)\b/i;
const RATIO = /\d+\s*\/\s*\d+|\d+\s+(of|av)\s+\d+/i;

function violations(text: string): string[] {
  const found: string[] = [];
  if (text.includes("%")) found.push(`"%" in ${JSON.stringify(text)}`);
  if (FORBIDDEN_WORDS.test(text)) found.push(`a forbidden word in ${JSON.stringify(text)}`);
  if (RATIO.test(text)) found.push(`a ratio in ${JSON.stringify(text)}`);
  return found;
}

/** Every text node, aria-label, and title in the page. */
function pageTexts(): string[] {
  const texts: string[] = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const value = node.textContent?.trim();
    if (value) texts.push(value);
  }
  for (const el of document.body.querySelectorAll("[aria-label], [title]")) {
    for (const attribute of ["aria-label", "title"]) {
      const value = el.getAttribute(attribute);
      if (value) texts.push(value);
    }
  }
  return texts;
}

/** specs/005's repeats on request, renamed so their ids do not meet those of `withRepeats`. */
const requested = (): Delivery[] =>
  withRequestedRepeats().map((d) => ({ ...d, id: `r-${d.id}`, ...(d.repeatOf ? { repeatOf: `r-${d.repeatOf}` } : {}) }));

const record = (): Delivery[] => [
  ...everyOutcome(),
  ...withRepeats(),
  ...requested(),
  { ...everyOutcome()[1]!, id: "crossing", instance: { ...everyOutcome()[1]!.instance, definitionId: CROSSING, a: 8, b: 5 }, events: [{ type: "support", kind: "lesson-reveal" }, { type: "ended" }] },
];
const lessonViews = [
  { lessonId: "number-bonds-to-ten", language: "nb", at: at(20) },
  { lessonId: "number-bonds-to-ten", language: "en", at: at(21) },
];

function store(deliveries: Delivery[], language: "nb" | "en") {
  window.localStorage.setItem("mathkx.guest.v1", JSON.stringify({ schema: 1, value: { ...beforeThisFeature(), language, deliveries, lessonViews, currentDeliveryId: deliveries.at(-1)!.id } }));
}

afterEach(() => window.localStorage.clear());

describe("no percentage, ratio, score, streak, or mastery word (SC-002)", () => {
  it.each(["nb", "en"] as const)("in My work, in %s", async (language) => {
    store(record(), language);
    render(<App api={createFakeApi()} initialPath="/record" />);
    await screen.findAllByTestId("lesson-viewed");
    expect(screen.getAllByTestId("record-item").length).toBeGreaterThan(10);
    expect(screen.getAllByTestId("record-repeats-requested").length).toBeGreaterThan(0);
    expect(pageTexts().flatMap(violations)).toEqual([]);
  });

  it.each(["nb", "en"] as const)("in the replay of every recorded question, in %s", async (language) => {
    const deliveries = record();
    for (const d of deliveries) {
      store(deliveries, language);
      render(<App api={createFakeApi()} initialPath={`/record/${d.id}`} />);
      await screen.findByTestId("replay-outcome");
      expect(pageTexts().flatMap(violations), d.id).toEqual([]);
      cleanup();
    }
  });

  it.each(["nb", "en"] as const)("in the session summary, in %s", async (language) => {
    // Every outcome and every kind of repeat worked in one session, finished from the practice screen.
    const deliveries = record();
    window.localStorage.setItem(
      "mathkx.guest.v1",
      JSON.stringify({ schema: 1, value: { ...beforeThisFeature(), language, deliveries, lessonViews, session: { current: deliveries.map((d) => d.id), last: null } } }),
    );
    render(<App api={createFakeApi()} initialPath="/practice/numbers.addition-within-20" />);
    await screen.findByTestId("prompt");
    await userEvent.setup().click(screen.getByTestId("finish-practice"));
    await screen.findAllByTestId("session-summary");
    expect(screen.getAllByTestId("session-repeats").length).toBeGreaterThan(0);
    expect(screen.getAllByTestId("session-repeats-requested").length).toBeGreaterThan(0);
    expect(pageTexts().flatMap(violations)).toEqual([]);
  });

  it.each([
    ["nb", nb],
    ["en", en],
  ] as const)("in the record, progress, replay, and session sections of the %s dictionary, and the new practice wording", (_language, dictionary) => {
    const sections = [dictionary.record, dictionary.progress, dictionary.replay, dictionary.session];
    const practice = [dictionary.practice.poolExhausted, dictionary.practice.repeat, dictionary.practice.finish];
    const texts = [...sections.flatMap((section) => Object.values(section as Record<string, string>)), ...practice];
    expect(texts.length).toBeGreaterThan(25);
    expect(texts.flatMap(violations)).toEqual([]);
  });

  it("catches what it looks for", () => {
    expect(checkViolations("Question 3 of 4")).toEqual([]);
    expect(checkViolations("Ikke ferdig, på oppgave 3 av 4")).toEqual([]);
    expect(checkViolations("Steg 1 av 3")).toEqual([]);
    expect(checkViolations("3 of 4 correct")).not.toEqual([]);
    expect(checkViolations("Question 3 of 4, 3 of 4 correct")).not.toEqual([]);
    expect(checkViolations("Your level")).not.toEqual([]);
    expect(checkViolations("Karakter: 5")).not.toEqual([]);
    expect(checkViolations("Done in 4 minutes")).not.toEqual([]);
    expect(checkViolations("Ferdig på 30 sekunder")).not.toEqual([]);
    expect(checkViolations("There is no time limit.")).toEqual([]);
    expect(violations("80% correct")).not.toEqual([]);
    expect(violations("3/4 riktig")).not.toEqual([]);
    expect(violations("3 of 4 questions")).not.toEqual([]);
    expect(violations("3 av 4 oppgaver")).not.toEqual([]);
    expect(violations("Your score")).not.toEqual([]);
    expect(violations("a 5-day streak")).not.toEqual([]);
    expect(violations("Mestring")).not.toEqual([]);
    expect(violations("1 of them repeated a question you had already had.")).toEqual([]);
    expect(violations("24. oktober 2026")).toEqual([]);
  });
});

// specs/006 contracts/summary.md "Never shown" (FR-012): no score, fraction, percentage, streak, time taken, or mastery
// word ("mastered", "level", "grade"). A question's or a step's position ("Question 3 of 4", "Step 1 of 3") is where the
// learner is, not a result, so it is allowed; any other "n of m" is not.
const POSITION = /\b(question|oppgave|step|steg)\s+\d+\s+(of|av)\s+\d+/gi;
const CHECK_WORDS = /\b(level|levels|grade|grades|nivå|nivåer|karakter|karakterer)\b/i;
const TIME_TAKEN = /\d+\s*(seconds?|minutes?|hours?|sekund(er)?|minutt(er)?|timer?)\b/i;

function checkViolations(text: string): string[] {
  const found = violations(text.replace(POSITION, ""));
  if (CHECK_WORDS.test(text)) found.push(`a level or grade word in ${JSON.stringify(text)}`);
  if (TIME_TAKEN.test(text)) found.push(`time taken in ${JSON.stringify(text)}`);
  return found;
}

const CHECK_PATH = `/checks/${PILOT_CHECK.id}`;
const unfinishedResume = { draft: "5", helpOpen: false, helpStep: -1, explanationOpen: false, explanationStep: -1, result: null };
/** Questions 1 and 2 saved; question 3 open with a draft. */
const unfinished = () => checkRun({ id: "run-u", positions: ["correct", "wrong", "reached", null], position: 3, startedAt: at(30), resume: unfinishedResume });
/** Switched at question 3: question 3 open in the supported part, with help shown. */
const switchedOpen = () =>
  checkRun({ id: "run-o", positions: ["correct", "skipped", [support("visual-help-opened")], null], position: 3, switchAt: 3, startedAt: at(31), resume: { ...unfinishedResume, helpOpen: true, helpStep: 0 } });
/** Quickstart scenario 2: wrong, skipped, then a switch at question 3 with help and a retry. */
const switched = () =>
  checkRun({ id: "run-s", positions: ["wrong", "skipped", [support("visual-help-opened"), correct(13)], [incorrect(15), correct(13)]], position: 4, switchAt: 3, startedAt: at(32), finishedAt: at(33) });
/** Ended by a new check at question 3, with question 3 reached and question 4 not. */
const endedRun = () => checkRun({ id: "run-e", positions: ["correct", "wrong", "reached", null], position: 3, startedAt: at(34), endedAt: at(35) });

function storeChecks(language: "nb" | "en", checkRuns: CheckRun[]) {
  window.localStorage.setItem("mathkx.guest.v1", JSON.stringify({ schema: 1, value: { ...beforeThisFeature(), language, deliveries: record(), lessonViews, checkRuns } }));
}

describe("self-checks: no score, fraction, percentage, streak, time taken, or mastery word (FR-012)", () => {
  it.each(["nb", "en"] as const)("on the start screen, with an unfinished check, in %s", async (language) => {
    storeChecks(language, [unfinished()]);
    render(<App api={createFakeApi()} initialPath={CHECK_PATH} />);
    await screen.findByTestId("check-unfinished");
    expect(screen.getAllByTestId("check-policy")).toHaveLength(5);
    expect(pageTexts().flatMap(checkViolations)).toEqual([]);
  });

  it.each(["nb", "en"] as const)("in the independent part, with the switch's confirmation open, in %s", async (language) => {
    storeChecks(language, [unfinished()]);
    render(<App api={createFakeApi()} initialPath={`${CHECK_PATH}/run-u`} />);
    await screen.findByTestId("independent-question");
    await userEvent.setup().click(screen.getByTestId("check-need-help"));
    await screen.findByTestId("check-switch-body");
    expect(pageTexts().flatMap(checkViolations)).toEqual([]);
  });

  it.each(["nb", "en"] as const)("in the supported part, with help shown, in %s", async (language) => {
    storeChecks(language, [switchedOpen()]);
    render(<App api={createFakeApi()} initialPath={`${CHECK_PATH}/run-o`} />);
    await screen.findByTestId("supported-question");
    await screen.findByTestId("help-panel");
    expect(screen.getByTestId("check-mode").textContent).toBeTruthy();
    expect(pageTexts().flatMap(checkViolations)).toEqual([]);
  });

  it.each(["nb", "en"] as const)("in the summary of a switched run, with an explanation open, in %s", async (language) => {
    storeChecks(language, [switched()]);
    render(<App api={createFakeApi()} initialPath={`${CHECK_PATH}/run-s`} />);
    const supported = await screen.findByTestId("check-supported");
    await waitFor(() => expect(screen.getAllByTestId("check-explanation-toggle")).toHaveLength(4));
    expect(within(supported).getAllByTestId("check-outcome")).toHaveLength(2);
    await userEvent.setup().click(screen.getAllByTestId("check-explanation-toggle")[0]!);
    await screen.findByTestId("explanation-step-text");
    expect(screen.getByTestId("check-snapshot")).toBeTruthy();
    expect(pageTexts().flatMap(checkViolations)).toEqual([]);
  });

  it.each(["nb", "en"] as const)("in the summary of a run ended by a new check, in %s", async (language) => {
    storeChecks(language, [endedRun()]);
    render(<App api={createFakeApi()} initialPath={`${CHECK_PATH}/run-e`} />);
    const notAnswered = await screen.findByTestId("check-not-answered");
    await waitFor(() => expect(within(notAnswered).getAllByTestId("check-correct-answer")).toHaveLength(2));
    expect(pageTexts().flatMap(checkViolations)).toEqual([]);
  });

  it.each(["nb", "en"] as const)("in the checks part of My work, in %s", async (language) => {
    storeChecks(language, [unfinished(), switched(), endedRun()]);
    render(<App api={createFakeApi()} initialPath="/record" />);
    const part = await screen.findByTestId("check-record");
    expect(within(part).getAllByTestId("check-run").map((r) => r.getAttribute("data-state"))).toEqual(["ended", "finished", "unfinished"]);
    expect(within(part).getAllByTestId("check-run-link")).toHaveLength(2);
    expect(within(part).getByTestId("check-run-continue")).toBeTruthy();
    expect(pageTexts().flatMap(checkViolations)).toEqual([]);
  });

  it.each([
    ["nb", nb],
    ["en", en],
  ] as const)("in the check section of the %s dictionary", (_language, dictionary) => {
    const texts = Object.values(dictionary.check as Record<string, string>);
    expect(texts.length).toBeGreaterThan(50);
    expect(texts.flatMap(checkViolations)).toEqual([]);
  });
});
