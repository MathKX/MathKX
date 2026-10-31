// specs/004 SC-002 and FR-002 (constitution I): "My work" and replay show counts in words, never a percentage, ratio,
// score, streak, or mastery word, in either language. Scans the rendered pages (text, aria-label, title) and the
// dictionary sections they draw on. specs/005 T031 adds the session summary, repeats on request, and the new
// practice wording.
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { App } from "../src/App";
import { en } from "../src/i18n/en";
import { nb } from "../src/i18n/nb";
import type { Delivery } from "../src/state/observations";
import { createFakeApi } from "./fakeApi";
import { CROSSING, at, beforeThisFeature, everyOutcome, withRepeats, withRequestedRepeats } from "./records";

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
