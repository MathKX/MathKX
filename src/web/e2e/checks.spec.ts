// The end-to-end checks of specs/006 (quickstart scenarios), against the real service and the built app.
import { expect, test, type Page } from "@playwright/test";

const LESSON = "/lessons/number-bonds-to-ten";
const CHECK = "numbers.addition.check-within-20";

/** Requests the independent part must never make (contracts/check-run.md "Requests allowed"). */
const FORBIDDEN = [/\/steps\//, /\/answer$/, /\/api\/lessons\/[^/]+\/content/, /\/api\/visuals/];

/** Text that would state a result: status words and feedback openings in both languages. */
const RESULT_TEXT = /\b(Correct|Not correct yet|Nearly|Riktig|Ikke riktig ennå|Nesten)\b/;

async function clearedLesson(page: Page, lang: "en" | "nb") {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.goto(LESSON);
  await page.getByTestId(`lang-${lang}`).click();
}

async function expectNoResult(page: Page) {
  for (const id of ["toggle-help", "toggle-explanation", "to-lesson", "result", "another", "repeat-question", "easier", "harder", "more-like-this"]) {
    await expect(page.getByTestId(id)).toHaveCount(0);
  }
  await expect(page.getByRole("status").filter({ hasText: RESULT_TEXT })).toHaveCount(0);
  const snapshot = await page.locator("main").ariaSnapshot();
  expect(snapshot).not.toMatch(RESULT_TEXT);
}

async function saveAnswer(page: Page, answer: string, next: string | null) {
  await page.getByTestId("answer").fill(answer);
  await page.getByTestId("check-save").click();
  if (next) await expect(page.getByTestId("check-position")).toHaveText(next);
}

/** Quickstart scenario 1, steps 1–7, in the given language. */
async function scenarioOne(page: Page, lang: "en" | "nb") {
  const t =
    lang === "en"
      ? { title: "Check your understanding: Number bonds and addition", count: "4 questions", q: (n: number) => `Question ${n} of 4`, correct: "Correct on your own", revisit: "Worth revisiting", skipped: "Skipped", two: "2 questions", one: "1 question", your: "Your answer: 12", answer: "Correct answer: 13", heading: "Your check" }
      : { title: "Sjekk forståelsen: Tiervenner og addisjon", count: "4 oppgaver", q: (n: number) => `Oppgave ${n} av 4`, correct: "Riktig på egen hånd", revisit: "Verdt å se på igjen", skipped: "Hoppet over", two: "2 oppgaver", one: "1 oppgave", your: "Ditt svar: 12", answer: "Riktig svar: 13", heading: "Sjekken din" };

  await clearedLesson(page, lang);
  // 1. The start screen.
  await page.getByTestId(`check-entry-${CHECK}`).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(t.title);
  await expect(page.getByTestId("check-count")).toHaveText(t.count);
  await expect(page.getByTestId("check-policy")).toHaveCount(5);

  const requests: string[] = [];
  page.on("request", (request) => requests.push(new URL(request.url()).pathname));

  // 2. The first question.
  await page.getByTestId("check-start").click();
  await expect(page).toHaveURL(new RegExp(`/checks/${CHECK.replace(/\./g, "\\.")}/[^/]+$`));
  await expect(page.getByTestId("check-position")).toHaveText(t.q(1));
  await expect(page.getByTestId("prompt")).toHaveAttribute("aria-label", /7\D+3/);
  await expect(page.getByTestId("check-save")).toBeVisible();
  await expect(page.getByTestId("check-skip")).toBeVisible();
  await expectNoResult(page);

  // 3. Unreadable input: guidance, and the question stays.
  await saveAnswer(page, "4+4", null);
  await expect(page.getByTestId("check-guidance")).toBeVisible();
  await expect(page.getByTestId("check-position")).toHaveText(t.q(1));
  await expectNoResult(page);

  // 4. Two correct, one wrong, one skipped; no result after any of them.
  await saveAnswer(page, "10", t.q(2));
  await expectNoResult(page);
  await saveAnswer(page, "9", t.q(3));
  await expectNoResult(page);
  await saveAnswer(page, "12", t.q(4));
  await expectNoResult(page);
  const beforeSummary = requests.length; // the summary's own requests come after the last skip
  await page.getByTestId("check-skip").click();

  // 6. The summary, with focus on its heading.
  const heading = page.getByTestId("check-summary-heading");
  await expect(heading).toHaveText(t.heading);
  await expect(heading).toBeFocused();

  // 5. No help, explanation, lesson, or answer was requested before the summary.
  const during = requests.slice(0, beforeSummary);
  expect(during.filter((path) => path.startsWith("/api/validations"))).toHaveLength(4);
  expect(during.filter((path) => FORBIDDEN.some((f) => f.test(path)))).toEqual([]);
  // The summary does ask for the wrong and the skipped question's answers: the check above is not vacuous.
  await expect.poll(() => requests.slice(beforeSummary).filter((path) => /\/answer$/.test(path)).length).toBe(2);

  const group = (name: string) => page.getByTestId(`check-group-${name}`);
  await expect(group("correct").getByRole("heading")).toHaveText(t.correct);
  await expect(group("correct").getByTestId("check-group-count")).toHaveText(t.two);
  await expect(group("correct").getByTestId("check-expression")).toHaveText(["7 + 3", "5 + 4"]);
  await expect(group("revisit").getByTestId("check-group-count")).toHaveText(t.one);
  await expect(group("revisit").getByTestId("check-expression")).toHaveText(["8 + 5"]);
  await expect(group("revisit").getByTestId("check-your-answer")).toHaveText(t.your);
  await expect(group("revisit").getByTestId("check-correct-answer")).toHaveText(t.answer);
  await expect(group("skipped").getByRole("heading")).toHaveText(t.skipped);
  await expect(group("skipped").getByTestId("check-expression")).toHaveText(["9 + 4"]);
  await expect(group("skipped").getByTestId("check-correct-answer")).toHaveText(t.answer);
  await expect(page.getByTestId("check-revisit-tag")).toHaveCount(1);
  await expect(page.getByTestId("check-revisit-tag")).toHaveText(t.revisit);
  const summaryText = (await page.getByTestId("check-summary").textContent()) ?? "";
  expect(summaryText).not.toMatch(/\d\s*\/|%/);
  await expect(page.getByTestId("check-snapshot")).toBeVisible();
  await expect(page.getByTestId("check-practise-more")).toBeVisible();
  await expect(page.getByTestId("check-again")).toBeVisible();

  // 7. An explanation shows its steps; after a reload the summary is the same and nothing was recorded.
  await group("revisit").getByTestId("check-explanation-toggle").click();
  await expect(group("revisit").getByTestId("explanation-step-text")).toBeVisible();
  await page.reload();
  await expect(page.getByTestId("check-summary-heading")).toHaveText(t.heading);
  await expect(group("correct").getByTestId("check-group-count")).toHaveText(t.two);
  await expect(group("revisit").getByTestId("check-expression")).toHaveText(["8 + 5"]);
  const events = await page.evaluate(() => {
    const value = JSON.parse(window.localStorage.getItem("mathkx.guest.v1") ?? "{}").value;
    return (value.checkRuns ?? []).flatMap((r: { deliveries: { events: { type: string; kind?: string }[] }[] }) => r.deliveries.flatMap((d) => d.events));
  });
  expect(events.filter((e: { type: string }) => e.type === "support")).toEqual([]);
}

test.describe("an independent check with an honest summary", () => {
  test("1. a check from the lesson: no help or result before the summary, then three honest groups", async ({ page }) => {
    await scenarioOne(page, "en");
  });

  test("1. the same check in Norwegian", async ({ page }) => {
    await scenarioOne(page, "nb");
  });
});

/** A supported question's "Check answer": the answer, then its feedback. */
async function checkAnswer(page: Page, answer: string) {
  await page.getByTestId("answer").fill(answer);
  await page.getByTestId("check").click();
  await expect(page.getByTestId("result")).toBeVisible();
}

const storedRun = (page: Page) =>
  page.evaluate(() => {
    const value = JSON.parse(window.localStorage.getItem("mathkx.guest.v1") ?? "{}").value;
    const run = (value.checkRuns ?? [])[0];
    return run ? { switchAt: run.switchAt as number | null, position: run.position as number } : null;
  });

test.describe("the switch to supported practice", () => {
  test("2. a switch at question 3: help, feedback, retries, and a summary that keeps them apart", async ({ page }) => {
    await clearedLesson(page, "en");
    await page.getByTestId(`check-entry-${CHECK}`).click();
    await page.getByTestId("check-start").click();
    await expect(page.getByTestId("check-position")).toHaveText("Question 1 of 4");

    // 1. Question 1 wrong, question 2 skipped.
    await saveAnswer(page, "11", "Question 2 of 4");
    await page.getByTestId("check-skip").click();
    await expect(page.getByTestId("check-position")).toHaveText("Question 3 of 4");

    // 2. "I need help", then "Continue without help": nothing changes.
    await page.getByTestId("check-need-help").click();
    const dialog = page.getByRole("dialog", { name: "Switch to supported practice?" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading")).toBeFocused();
    await expect(page.getByTestId("check-switch-body")).toContainText("From question 3 on");
    await page.getByTestId("check-switch-no").click();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByTestId("check-need-help")).toBeFocused();
    expect(await storedRun(page)).toEqual({ switchAt: null, position: 3 });
    await expectNoResult(page);

    // 3. The switch: help, "Check answer", and "Skip", with the mode line.
    await page.getByTestId("check-need-help").click();
    await page.getByTestId("check-switch-yes").click();
    await expect(page.getByTestId("check-mode")).toHaveText("Supported practice (from question 3)");
    await expect(page.getByTestId("toggle-help")).toBeVisible();
    await expect(page.getByTestId("check")).toBeVisible();
    await expect(page.getByTestId("check-skip")).toBeVisible();
    await expect(page.getByTestId("check-need-help")).toHaveCount(0);
    expect(await storedRun(page)).toEqual({ switchAt: 3, position: 3 });

    // 4. Visual help, then 13: feedback, and only "Next question".
    await page.getByTestId("toggle-help").click();
    await expect(page.getByTestId("help-panel")).toBeVisible();
    await checkAnswer(page, "13");
    await expect(page.getByTestId("check-next")).toBeVisible();
    await expect(page.getByTestId("check-skip")).toHaveCount(0);
    for (const id of ["another", "repeat-question", "easier", "harder", "more-like-this"]) await expect(page.getByTestId(id)).toHaveCount(0);

    // 5. Question 4: 12, then 13, then "See summary".
    await page.getByTestId("check-next").click();
    await expect(page.getByTestId("check-position")).toHaveText("Question 4 of 4");
    await checkAnswer(page, "12");
    await checkAnswer(page, "13");
    await page.getByTestId("check-finish").click();

    // 6. The summary keeps the two parts apart.
    await expect(page.getByTestId("check-summary-heading")).toBeFocused();
    const group = (name: string) => page.getByTestId(`check-group-${name}`);
    await expect(group("correct").getByTestId("check-group-count")).toHaveText("0 questions");
    await expect(group("revisit").getByTestId("check-expression")).toHaveText(["7 + 3"]);
    await expect(group("skipped").getByTestId("check-expression")).toHaveText(["5 + 4"]);
    const supported = page.getByTestId("check-supported");
    await expect(supported.getByRole("heading", { level: 2 })).toHaveText("Supported practice (from question 3)");
    await expect(supported.getByTestId("check-expression")).toHaveText(["8 + 5", "9 + 4"]);
    await expect(supported.getByTestId("check-outcome")).toHaveText(["Correct with visual help", "Correct after feedback"]);
    await expect(supported.getByTestId("check-revisit-tag")).toHaveCount(0);
    await expect(page.getByTestId("check-revisit-tag")).toHaveCount(1);
  });
});

/** The "My work" group of the pilot's skill. */
const additionGroup = (page: Page) => page.locator('[data-testid="skill-group"][data-skill="numbers.addition-within-20"]');

async function toRecord(page: Page) {
  await page.getByRole("link", { name: "My work", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1, name: "My work" })).toBeVisible();
}

test.describe("resuming a check and checks in My work", () => {
  test("3. a reload, a language switch, and Continue keep question 3 and its draft; a new check ends the old run", async ({ page }) => {
    await clearedLesson(page, "en");
    await page.getByTestId(`check-entry-${CHECK}`).click();
    await page.getByTestId("check-start").click();

    // 1. Save questions 1 and 2, and type 5 into question 3.
    await saveAnswer(page, "10", "Question 2 of 4");
    await saveAnswer(page, "9", "Question 3 of 4");
    await page.getByTestId("answer").fill("5");
    const runUrl = page.url();

    // 2. A reload restores question 3 with its draft, in the independent part.
    await page.reload();
    await expect(page.getByTestId("check-position")).toHaveText("Question 3 of 4");
    await expect(page.getByTestId("check-mode")).toHaveText("On your own");
    await expect(page.getByTestId("answer")).toHaveValue("5");
    await expectNoResult(page);

    // 3. A language switch keeps the question, the draft, and the position.
    await page.getByTestId("lang-nb").click();
    await expect(page.getByTestId("check-position")).toHaveText("Oppgave 3 av 4");
    await expect(page.getByTestId("answer")).toHaveValue("5");
    await page.getByTestId("lang-en").click();

    // 4. My work: the run is unfinished at question 3 of 4, with no counts; no practice yet.
    await toRecord(page);
    const group = additionGroup(page);
    await expect(group.getByTestId("check-record").getByRole("heading", { level: 3 })).toHaveText("Checks");
    await expect(group.getByTestId("check-run")).toHaveCount(1);
    await expect(group.getByTestId("check-run-text")).toHaveText("Unfinished, at question 3 of 4");
    await expect(group.getByTestId("check-run")).not.toContainText(/correct|revisiting|skipped/);
    await expect(group.getByTestId("check-run-link")).toHaveCount(0);
    await expect(group.getByTestId("record-no-practice")).toHaveText("No questions practised yet.");

    // 5. "Continue the check": question 3 with its draft.
    await group.getByTestId("check-run-continue").click();
    await expect(page).toHaveURL(runUrl);
    await expect(page.getByTestId("check-position")).toHaveText("Question 3 of 4");
    await expect(page.getByTestId("answer")).toHaveValue("5");

    // 6. "Check my understanding" again: the start screen offers both, and "Start the check" starts anew.
    await toRecord(page);
    await additionGroup(page).getByTestId(`check-entry-${CHECK}`).click();
    await expect(page.getByTestId("check-unfinished")).toContainText("You have a check you have not finished, at question 3 of 4.");
    await expect(page.getByTestId("check-continue")).toBeVisible();
    await page.getByTestId("check-start").click();
    await expect(page.getByTestId("check-position")).toHaveText("Question 1 of 4");
    await expect(page.getByTestId("answer")).toHaveValue("");

    // 7. The old run shows its counts and "2 not answered"; its summary lists questions 3 and 4 as not answered.
    await toRecord(page);
    const runs = additionGroup(page).getByTestId("check-run");
    await expect(runs).toHaveCount(2);
    await expect(runs.nth(0).getByTestId("check-run-text")).toHaveText("Unfinished, at question 1 of 4");
    await expect(runs.nth(1).getByTestId("check-run-text")).toHaveText("2 correct on your own, 0 worth revisiting, 0 skipped, 2 not answered");
    await runs.nth(1).getByTestId("check-run-link").click();
    const notAnswered = page.getByTestId("check-not-answered");
    await expect(notAnswered.getByRole("heading", { level: 2 })).toHaveText("Not answered");
    await expect(notAnswered.getByTestId("check-expression")).toHaveText(["8 + 5", "9 + 4"]);
    await expect(notAnswered.getByTestId("check-correct-answer")).toHaveText(["Correct answer: 13", "Correct answer: 13"]);
    await expect(page.getByTestId("check-group-skipped").getByTestId("check-group-count")).toHaveText("0 questions");
    await expect(page.getByTestId("check-group-correct").getByTestId("check-expression")).toHaveText(["7 + 3", "5 + 4"]);
  });

  test("4. a finished check leaves practice's sentence, question list, and question in progress unchanged", async ({ page }) => {
    await clearedLesson(page, "en");
    await page.getByTestId("practice-numbers.addition.within-10").click();

    // 1. Three practice questions answered, the fourth left with a draft.
    for (let i = 0; i < 3; i++) {
      const label = (await page.getByTestId("prompt").getAttribute("aria-label")) ?? "";
      const [, a, b] = /(\d+)\D+(\d+)/.exec(label) ?? [];
      await page.getByTestId("answer").fill(String(Number(a) + Number(b)));
      await page.getByTestId("check").click();
      await expect(page.getByTestId("result")).toHaveAttribute("data-status", "correct");
      await page.getByTestId("another").click();
      await expect(page.getByTestId("result")).toHaveCount(0);
    }
    const fourth = await page.getByTestId("prompt").getAttribute("aria-label");
    await page.getByTestId("answer").fill("1");

    await toRecord(page);
    const group = additionGroup(page);
    const practiceLines = async () => ({
      summary: await group.getByTestId("record-summary").textContent(),
      repeats: await group.getByTestId("record-repeats").allTextContents(),
      lessons: await group.getByTestId("lesson-viewed").allTextContents(),
      questions: await group.getByTestId("record-item").allTextContents(),
    });
    await expect(group.getByTestId("record-summary")).toContainText("4 questions:");
    const before = await practiceLines();

    // 2. Take and finish a check.
    await group.getByTestId(`check-entry-${CHECK}`).click();
    await page.getByTestId("check-start").click();
    await saveAnswer(page, "10", "Question 2 of 4");
    await saveAnswer(page, "9", "Question 3 of 4");
    await saveAnswer(page, "13", "Question 4 of 4");
    await page.getByTestId("answer").fill("13");
    await page.getByTestId("check-save").click();
    await expect(page.getByTestId("check-summary-heading")).toHaveText("Your check");

    // 3. Practice's lines are unchanged, and the check is listed apart.
    await toRecord(page);
    await expect(group.getByTestId("check-run-text")).toHaveText("4 correct on your own, 0 worth revisiting, 0 skipped");
    expect(await practiceLines()).toEqual(before);

    // "Practise more" resumes the fourth practice question with its draft; "Finish practice" sums up practice only.
    await group.getByTestId("check-run-link").click();
    await page.getByTestId("check-practise-more").click();
    await expect(page.getByTestId("prompt")).toHaveAttribute("aria-label", fourth ?? "");
    await expect(page.getByTestId("answer")).toHaveValue("1");
    await page.getByTestId("finish-practice").click();
    await expect(page.getByTestId("session-summary")).toHaveText(/^4 questions: .*, 1 unfinished$/);
  });
});
