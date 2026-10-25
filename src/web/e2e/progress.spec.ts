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
    await expect(page.getByTestId("skill-name")).toHaveText("Addition within 20");
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
    await expect(page.getByTestId("skill-name")).toHaveText("Addisjon opp til 20");
    await expect(page.getByTestId("progress-questions").locator("xpath=..")).toHaveAttribute("open", "");

    await items.first().getByTestId("record-continue").click();
    await expect(page.getByTestId("prompt")).toBeVisible();
    expect(await operands(page)).toEqual(fourth);
  });
});
