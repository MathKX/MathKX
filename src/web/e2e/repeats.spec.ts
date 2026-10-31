// The end-to-end checks of specs/005 (quickstart scenarios), against the real service and the built app.
import { expect, test, type Page } from "@playwright/test";
import { tabTo } from "./focus";

const LESSON = "/lessons/number-bonds-to-ten";

async function operands(page: Page): Promise<{ a: number; b: number }> {
  const label = (await page.getByTestId("prompt").getAttribute("aria-label")) ?? "";
  const match = /(\d+)\D+(\d+)/.exec(label);
  if (!match) throw new Error(`no operands in "${label}"`);
  return { a: Number(match[1]), b: Number(match[2]) };
}

const pairKey = ({ a, b }: { a: number; b: number }) => (a <= b ? `${a}+${b}` : `${b}+${a}`);

test.describe("repeat avoidance", () => {
  test("1. twenty questions within ten never repeat one of the eight before, with at most two instance requests each", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => window.localStorage.clear());
    await page.goto(LESSON);
    await page.getByTestId("lang-en").click();

    const instanceRequests: string[] = [];
    const poolRequests: string[] = [];
    page.on("request", (request) => {
      const path = new URL(request.url()).pathname;
      if (path.startsWith("/api/instances/") && !path.includes("/steps/")) instanceRequests.push(path);
      if (path.startsWith("/api/definitions/")) poolRequests.push(path);
    });

    await page.getByTestId("practice-numbers.addition.within-10").click();
    await expect(page.getByTestId("prompt")).toBeVisible();
    const seen = [await operands(page)];
    for (let i = 0; i < 20; i++) {
      const before = await page.getByTestId("prompt").getAttribute("aria-label");
      await page.getByTestId("another").click();
      await expect(page.getByTestId("prompt")).not.toHaveAttribute("aria-label", before ?? "");
      seen.push(await operands(page));
    }

    seen.forEach((question, i) => {
      const window = seen.slice(Math.max(0, i - 8), i).map(pairKey);
      expect(window, `question ${i + 1}: ${question.a} + ${question.b}`).not.toContain(pairKey(question));
    });
    expect(instanceRequests.length).toBeLessThanOrEqual(2 * seen.length);
    expect(poolRequests.length).toBeLessThanOrEqual(1);
    await expect(page.getByTestId("notice")).toHaveCount(0); // within ten is never exhausted by eight questions
  });
});

async function answer(page: Page, value: number) {
  await page.getByTestId("answer").fill(String(value));
  await page.getByTestId("check").click();
  await expect(page.getByTestId("result")).toBeVisible();
}

test.describe("Repeat this question", () => {
  test("2. a repeat on the practice screen gets its own outcome and tag, and a replay repeats the same question", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => window.localStorage.clear());
    await page.goto(LESSON);
    await page.getByTestId("lang-en").click();
    await page.getByTestId("practice-numbers.addition.within-10").click();
    await expect(page.getByTestId("prompt")).toBeVisible();
    const first = await operands(page);
    const prompt = await page.getByTestId("prompt").getAttribute("aria-label");
    await expect(page.getByTestId("repeat-question")).toHaveCount(0);

    // Wrong, then visual help, then right.
    await answer(page, first.a + first.b + 1);
    await page.getByTestId("toggle-help").click();
    await answer(page, first.a + first.b);
    await expect(page.getByTestId("result")).toHaveAttribute("data-status", "correct");

    // The same question again, answered at once.
    await page.getByTestId("repeat-question").click();
    await expect(page.getByTestId("result")).toHaveCount(0);
    await expect(page.getByTestId("prompt")).toHaveAttribute("aria-label", prompt ?? "");
    await expect(page.getByTestId("answer")).toHaveValue("");
    await answer(page, first.a + first.b);

    await page.getByRole("link", { name: "My work" }).click();
    await expect(page.getByTestId("record-repeats-requested")).toHaveText("1 of these you repeated on purpose.");
    await page.getByTestId("progress-questions").first().click();
    const [newest, oldest] = [page.getByTestId("record-item").nth(0), page.getByTestId("record-item").nth(1)];
    await expect(newest).toHaveAttribute("data-outcome", "correctFirst");
    await expect(newest.getByTestId("record-tag")).toHaveText(["Repeated on request"]);
    await expect(oldest).not.toHaveAttribute("data-outcome", "correctFirst");

    // From the first question's replay.
    await oldest.getByTestId("record-question").click();
    await expect(page.getByTestId("replay-outcome")).toBeVisible();
    await page.getByTestId("replay-repeat").click();
    await expect(page.getByTestId("practice-page")).toBeVisible();
    await expect(page.getByTestId("prompt")).toHaveAttribute("aria-label", prompt ?? "");
    await expect(page.getByTestId("answer")).toHaveValue("");
  });
});

test.describe("Finish practice", () => {
  test("3. a session's summary counts its questions, and Practise again resumes the unfinished one", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => window.localStorage.clear());
    await page.goto(LESSON);
    await page.getByTestId("lang-en").click();
    await page.getByTestId("practice-numbers.addition.within-10").click();

    await expect(page.getByTestId("prompt")).toBeVisible();
    for (let i = 0; i < 3; i++) {
      const { a, b } = await operands(page);
      await answer(page, a + b);
      // Wait for the next question itself, so its operands are never read from the one before.
      await page.getByTestId("another").click();
      await expect(page.getByTestId("result")).toHaveCount(0);
    }
    const fourth = await operands(page);
    await page.getByTestId("answer").fill("7");
    // A detour from the unanswered question does not end the session. A lesson that would show the answer asks
    // first; leaving its gate closed keeps the answer unshown, so the question can still be answered correctly.
    await page.getByTestId("to-lesson").click();
    await expect(page.getByTestId("lesson-content").or(page.getByTestId("lesson-gate"))).toBeVisible();
    await page.getByTestId("return-to-question").click();
    await expect(page.getByTestId("answer")).toHaveValue("7");

    await page.getByTestId("finish-practice").click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Your practice session");
    await expect(page.getByTestId("session-summary")).toHaveText(/^4 questions: .*, 1 unfinished$/);

    // The unfinished question comes back with its draft and belongs to the next session.
    await page.getByTestId("session-again").click();
    await expect(page.getByTestId("answer")).toHaveValue("7");
    await answer(page, fourth.a + fourth.b);
    const finished = await page.getByTestId("prompt").getAttribute("aria-label");
    await page.getByTestId("finish-practice").click();
    await expect(page.getByTestId("session-summary")).toHaveText(/^1 question: 1 correct/);

    // After a finish on an answered question, practice goes on with a new one.
    await page.getByTestId("session-again").click();
    await expect(page.getByTestId("prompt")).toBeVisible();
    await expect(page.getByTestId("prompt")).not.toHaveAttribute("aria-label", finished ?? "");
    await expect(page.getByTestId("answer")).toHaveValue("");
    await expect(page.getByTestId("result")).toHaveCount(0);
  });
});

test.describe("Keyboard and targets", () => {
  test("4. Repeat this question, the exhausted notice, Finish practice, Practise again, and a replay's repeat, by keyboard", async ({ page }, testInfo) => {
    // The pilot pools do not run out (quickstart scenario 2), so every draw is made the same question and its pool
    // that one question: the second "Another question" then repeats it with the notice.
    const SEED = "20261031";
    const fixed = (await (await page.request.get(`/api/instances/numbers.addition.within-10/1/${SEED}`)).json()) as { a: number; b: number };
    await page.route(/\/api\/instances\/numbers\.addition\.within-10\/1\/[^/]+$/, (route) => route.continue({ url: route.request().url().replace(/[^/]+$/, SEED) }));
    await page.route("**/api/definitions/numbers.addition.within-10/1/pool", (route) =>
      route.fulfill({ json: { definition: "numbers.addition.within-10", version: 1, questions: [{ seed: SEED, a: fixed.a, b: fixed.b }] } }),
    );
    const atLeast44 = async (testId: string) => {
      if (testInfo.project.name !== "ipad") return; // touch targets are checked on the touch project
      const box = await page.getByTestId(testId).boundingBox();
      expect(box && box.width >= 44 && box.height >= 44, `${testId} is ${JSON.stringify(box)}`).toBe(true);
    };

    await page.goto("/");
    await page.evaluate(() => window.localStorage.clear());
    await page.goto(LESSON);
    await page.getByTestId("lang-en").click();
    await page.getByTestId("practice-numbers.addition.within-10").click();
    await expect(page.getByTestId("prompt")).toBeVisible();
    await page.getByTestId("answer").focus();
    await page.keyboard.type(String(fixed.a + fixed.b));
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("result")).toBeVisible();

    // "Repeat this question" goes away with its question; focus lands on the repeated question.
    await atLeast44("repeat-question");
    await tabTo(page, "repeat-question");
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("result")).toHaveCount(0);
    await expect(page.getByTestId("prompt")).toBeFocused();

    // The exhausted notice is announced politely, and focus stays where the learner is working.
    await tabTo(page, "another");
    await page.keyboard.press("Enter");
    const notice = page.getByTestId("notice");
    await expect(notice).toHaveText("This variation has no other questions right now, so this one repeats.");
    await expect(notice).toHaveAttribute("role", "status");
    await expect(page.getByTestId("another")).toBeFocused();

    // "Finish practice" leads to the summary, with focus on its heading.
    await atLeast44("finish-practice");
    await tabTo(page, "finish-practice");
    await page.keyboard.press("Enter");
    await expect(page.getByRole("heading", { level: 1, name: "Your practice session" })).toBeFocused();

    // "Practise again" resumes the unfinished question, with focus on it.
    await atLeast44("session-again");
    await tabTo(page, "session-again");
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("prompt")).toBeFocused();

    // A replay's "Repeat this question" continues practice with focus on the question.
    await page.getByRole("link", { name: "My work" }).click();
    await page.getByTestId("progress-questions").click();
    await page.getByTestId("record-question").last().click(); // the first question, answered; newer ones are listed first
    await expect(page.getByTestId("replay-page")).toBeVisible();
    await atLeast44("replay-repeat");
    await tabTo(page, "replay-repeat");
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("practice-page")).toBeVisible();
    await expect(page.getByTestId("prompt")).toBeFocused();
  });
});
