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
