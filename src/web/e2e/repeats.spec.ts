// The end-to-end checks of specs/005 (quickstart scenarios), against the real service and the built app.
import { expect, test, type Page } from "@playwright/test";

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
