// The end-to-end checks of specs/004 (quickstart scenarios), against the real service and the built app.
import { expect, test, type Page } from "@playwright/test";

const LESSON = "/lessons/number-bonds-to-ten";

async function operands(page: Page): Promise<{ a: number; b: number }> {
  const label = (await page.getByTestId("prompt").getAttribute("aria-label")) ?? "";
  const match = /(\d+)\D+(\d+)/.exec(label);
  if (!match) throw new Error(`no operands in "${label}"`);
  return { a: Number(match[1]), b: Number(match[2]) };
}

async function answer(page: Page, value: number, status: "correct" | "incorrect") {
  await page.getByTestId("answer").fill(String(value));
  await page.getByTestId("check").click();
  await expect(page.getByTestId("result")).toHaveAttribute("data-status", status);
}

/** Pins the next 8-byte crypto.getRandomValues calls (the app's newSeed) to golden seeds, as e2e/lesson.spec.ts does. */
async function pinSeeds(page: Page, seeds: string[]) {
  await page.addInitScript((queue: string[]) => {
    const original = crypto.getRandomValues.bind(crypto);
    crypto.getRandomValues = (<T extends ArrayBufferView | null>(array: T): T => {
      const next = array instanceof Uint8Array && array.length === 8 ? queue.shift() : undefined;
      if (next === undefined || !(array instanceof Uint8Array)) return original(array as never) as T;
      let value = BigInt(next);
      for (let i = 7; i >= 0; i--) {
        array[i] = Number(value & 0xffn);
        value >>= 8n;
      }
      return array;
    }) as typeof crypto.getRandomValues;
  }, seeds);
}

async function next(page: Page) {
  await page.getByTestId("another").click();
  await expect(page.getByTestId("result")).toHaveCount(0);
}

test.describe("the progress view", () => {
  test("1. My work counts the practice under the skill's name, and Continue resumes the question in progress", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => window.localStorage.clear());
    await page.goto(LESSON);
    await page.getByTestId("lang-en").click();
    await page.getByTestId("practice-numbers.addition.within-10").click();
    await expect(page.getByTestId("prompt")).toBeVisible();

    const first = await operands(page); // correct at once
    await answer(page, first.a + first.b, "correct");
    await next(page);
    const second = await operands(page); // a wrong answer, then correct
    await answer(page, second.a, "incorrect");
    await answer(page, second.a + second.b, "correct");
    await next(page);
    const third = await operands(page); // with visual help
    await page.getByTestId("toggle-help").click();
    await answer(page, third.a + third.b, "correct");
    await next(page);
    const fourth = await operands(page); // left unanswered

    await page.getByRole("link", { name: "My work" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "My work" })).toBeFocused();
    // The lesson page was shown on the way in, so number bonds is listed with its lesson view and no practice.
    await expect(page.getByTestId("skill-name")).toHaveText(["Addition within 20", "Number bonds to ten"]);
    const summary = page.getByTestId("record-summary");
    await expect(summary).toContainText("4 questions:");
    for (const outcome of ["1 correct on first response, no help", "1 correct after feedback", "1 correct with visual help", "1 unfinished"]) {
      await expect(summary).toContainText(outcome);
    }
    await expect(page.getByTestId("record-page")).not.toContainText("numbers.addition-within-20");
    await expect(page.getByTestId("record-page")).not.toContainText("%");

    await page.getByTestId("progress-questions").click();
    const items = page.getByTestId("record-item");
    await expect(items).toHaveCount(4);
    await expect(items.first()).toHaveAttribute("data-outcome", "unfinished");

    await page.getByTestId("lang-nb").click();
    await expect(page.getByTestId("skill-name").first()).toHaveText("Addisjon opp til 20");
    await expect(page.getByTestId("progress-questions").locator("xpath=..")).toHaveAttribute("open", "");

    await items.first().getByTestId("record-continue").click();
    await expect(page.getByTestId("prompt")).toBeVisible();
    expect(await operands(page)).toEqual(fourth);
  });

  test("2. lesson history: views when the lesson is shown, under both skills, none behind the notice", async ({ page }) => {
    await pinSeeds(page, ["1234567890123456789", "100"]); // crossing ten: 6 + 5 (not shown in the lesson), then 5 + 8 (shown)
    await page.goto("/");
    await page.evaluate(() => window.localStorage.clear());
    await page.goto("/lessons");
    await page.getByTestId("lang-en").click();
    await page.getByRole("link", { name: "Number bonds to ten" }).click(); // view 1: from the lesson list
    await expect(page.getByTestId("lesson-content")).toBeVisible();

    await page.getByTestId("practice-numbers.addition.crossing-ten").click();
    await expect(page.getByTestId("prompt")).toHaveAttribute("aria-label", "6 plus 5. What is the sum?");
    await page.getByTestId("to-lesson").click(); // view 2: a detour to a lesson that does not show 11
    await expect(page.getByTestId("lesson-content")).toBeVisible();
    await page.getByTestId("return-to-question").click();
    await answer(page, 11, "correct");
    await next(page);
    await expect(page.getByTestId("prompt")).toHaveAttribute("aria-label", "5 plus 8. What is the sum?");
    await page.getByTestId("to-lesson").click(); // the notice: cancelled, so no view
    await expect(page.getByTestId("lesson-gate")).toBeVisible();
    await page.getByTestId("gate-cancel").click();
    await expect(page.getByTestId("prompt")).toBeVisible();
    await answer(page, 13, "correct"); // answered, so a later visit to the lesson is not a detour behind the notice

    await page.getByRole("link", { name: "My work" }).click();
    await expect(page.getByTestId("skill-name")).toHaveText(["Addition within 20", "Number bonds to ten"]);
    const lines = page.getByTestId("lesson-viewed");
    await expect(lines).toHaveCount(2);
    for (const line of await lines.all()) await expect(line).toContainText("Number bonds to ten: viewed 2 times, last on");
    await expect(page.getByTestId("lesson-view-note")).toHaveCount(1);
    await expect(page.getByTestId("record-no-practice")).toHaveText("No questions practised yet.");

    // A reload of the lesson page is a new visit; a language switch on it is not.
    await page.goto("/lessons/number-bonds-to-ten");
    await expect(page.getByTestId("lesson-content")).toBeVisible();
    await page.getByTestId("lang-nb").click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Tiervenner – tall som blir 10");
    await page.getByRole("link", { name: "Mitt arbeid" }).click();
    await expect(page.getByTestId("lesson-viewed").first()).toContainText("vist 3 ganger, sist");
    const stored = await page.evaluate(() => JSON.parse(window.localStorage.getItem("mathkx.guest.v1") ?? "{}").value.lessonViews.map((v: { language: string }) => v.language));
    expect(stored).toEqual(["en", "en", "en"]);
  });

  test("3. replay: one request for the question, nothing recorded, no unrevealed sum, and the counts unchanged", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => window.localStorage.clear());
    await page.goto(LESSON);
    await page.getByTestId("lang-en").click();
    await page.getByTestId("practice-numbers.addition.within-10").click();
    await expect(page.getByTestId("prompt")).toBeVisible();
    const done = await operands(page);
    await answer(page, done.a + done.b, "correct");
    await next(page);
    const open = await operands(page); // left unanswered

    await page.getByRole("link", { name: "My work" }).click();
    const summary = await page.getByTestId("record-summary").textContent();
    const before = await page.evaluate(() => window.localStorage.getItem("mathkx.guest.v1"));
    await page.getByTestId("progress-questions").click();

    const requests: string[] = [];
    page.on("request", (r) => {
      if (r.url().includes("/api/")) requests.push(new URL(r.url()).pathname);
    });

    // The answered question (the older one, so the second in the list).
    await page.getByTestId("record-question").nth(1).click();
    await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
    await expect(page.getByTestId("prompt")).toHaveAttribute("aria-label", `${done.a} plus ${done.b}. What is the sum?`);
    await expect(page.getByTestId("replay-outcome")).toHaveText("Correct on first response, no help");
    await expect(page.getByTestId("replay-submission")).toContainText(`Correct. ${done.a} + ${done.b} = ${done.a + done.b}.`);
    expect(requests.filter((p) => p.startsWith("/api/instances/"))).toHaveLength(1);
    await page.getByTestId("replay-back").click();

    // The unanswered question: Continue, no answer field, and its sum nowhere on the page or in its accessibility tree.
    await page.getByTestId("progress-questions").click();
    await page.getByTestId("record-question").first().click();
    await expect(page.getByTestId("prompt")).toHaveAttribute("aria-label", `${open.a} plus ${open.b}. What is the sum?`);
    await expect(page.getByTestId("replay-continue")).toBeVisible();
    await expect(page.getByRole("textbox")).toHaveCount(0);
    const sum = new RegExp(`\\b${open.a + open.b}\\b`);
    expect(await page.getByTestId("replay-page").innerText()).not.toMatch(sum);
    expect(await page.locator("body").ariaSnapshot()).not.toMatch(sum);
    expect(requests.filter((p) => p.startsWith("/api/instances/"))).toHaveLength(2);
    expect(requests.filter((p) => p.includes("/steps/") || p.startsWith("/api/validations"))).toEqual([]);

    // Loading the replay address directly (a reload or a shared link) shows the replay, not a 404.
    await page.reload();
    await expect(page.getByTestId("replay-continue")).toBeVisible();

    await page.getByTestId("replay-back").click();
    await expect(page.getByTestId("record-summary")).toHaveText(summary ?? "");
    expect(await page.evaluate(() => window.localStorage.getItem("mathkx.guest.v1"))).toBe(before);
  });

  /** Practises two questions: one answered correctly, one left unanswered (the question in progress). */
  async function twoQuestions(page: Page) {
    await page.goto("/");
    await page.evaluate(() => window.localStorage.clear());
    await page.goto(LESSON);
    await page.getByTestId("lang-en").click();
    await page.getByTestId("practice-numbers.addition.within-10").click();
    await expect(page.getByTestId("prompt")).toBeVisible();
    const done = await operands(page);
    await answer(page, done.a + done.b, "correct");
    await next(page);
  }

  const focusShows = (page: Page) =>
    page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return { name: "none", visible: false };
      const style = getComputedStyle(el);
      const visible = (style.outlineStyle !== "none" && style.outlineWidth !== "0px") || style.boxShadow !== "none";
      return { name: el.dataset.testid ?? el.tagName.toLowerCase(), visible };
    });

  async function tabTo(page: Page, testId: string) {
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press("Tab");
      const focus = await focusShows(page);
      if (focus.name === testId) {
        expect(focus.visible, `${testId} shows focus`).toBe(true);
        return;
      }
    }
    throw new Error(`Tab never reached ${testId}`);
  }

  test("4. keyboard only: My work, a question, its replay, and back, with focus visible and on each heading", async ({ page }) => {
    await twoQuestions(page);
    await page.getByRole("link", { name: "My work" }).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("heading", { level: 1, name: "My work" })).toBeFocused();
    await tabTo(page, "progress-questions");
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("progress-questions").locator("xpath=..")).toHaveAttribute("open", "");
    await tabTo(page, "record-question");
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("replay-page")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
    await tabTo(page, "replay-continue");
    await tabTo(page, "replay-back");
    await page.keyboard.press("Enter");
    await expect(page.getByRole("heading", { level: 1, name: "My work" })).toBeFocused();
  });

  test("5. My work and replay at 200 percent zoom do not scroll sideways", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "desktop viewport only");
    await twoQuestions(page);
    await page.getByTestId("lang-nb").click(); // the longer language
    await page.setViewportSize({ width: 512, height: 384 }); // 1024 by 768 at 200 percent
    await page.getByRole("link", { name: "Mitt arbeid" }).click();
    await page.getByTestId("progress-questions").first().click();
    const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(await overflow(), "My work").toBeLessThanOrEqual(0);
    await page.getByTestId("record-question").first().click();
    await expect(page.getByTestId("replay-outcome")).toBeVisible();
    expect(await overflow(), "replay").toBeLessThanOrEqual(0);
  });

  test("6. the controls of My work and replay are at least 44 by 44 at the iPad viewport", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "ipad", "iPad viewport only");
    await twoQuestions(page);
    const check = async (locator: ReturnType<Page["locator"]>, label: string) => {
      const count = await locator.count();
      expect(count, label).toBeGreaterThan(0);
      for (let i = 0; i < count; i++) {
        const box = await locator.nth(i).boundingBox();
        expect(box, `${label} ${i}`).not.toBeNull();
        expect(box!.width, `${label} ${i} width`).toBeGreaterThanOrEqual(44);
        expect(box!.height, `${label} ${i} height`).toBeGreaterThanOrEqual(44);
      }
    };
    await page.getByRole("link", { name: "My work" }).click();
    await expect(page.getByTestId("progress-questions").first()).toBeVisible(); // the skills have loaded
    for (const summary of await page.getByTestId("progress-questions").all()) await summary.click();
    await check(page.getByTestId("progress-questions"), "Show the questions");
    await check(page.getByTestId("record-question"), "question link");
    await check(page.getByTestId("record-continue"), "Continue");
    await check(page.getByTestId("clear"), "Clear my work");
    await page.getByTestId("record-question").first().click();
    await expect(page.getByTestId("replay-outcome")).toBeVisible();
    await check(page.getByTestId("replay-continue"), "replay Continue");
    await check(page.getByTestId("replay-back"), "Back to my work");
  });
});
