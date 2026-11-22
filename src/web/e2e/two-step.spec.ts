// specs/011: the two-step lesson, its explorer, and practice of ax + c = b, against the real service and the built app.
import { expect, test } from "@playwright/test";
import { tabTo } from "./focus";

const LESSON = "/lessons/two-step-equations";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
});

test.describe("two-step equations (specs/011)", () => {
  test("1. the lesson list opens the lesson, and the explorer loads 2x + 3 = 11 from the service", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "To steg på skålvekta" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "To steg på skålvekta" })).toBeVisible();
    const scale = page.getByTestId("two-step-explorer");
    await expect(scale.getByTestId("two-step-equation")).toHaveText(/2\s*x\s*\+\s*3\s*=\s*11/);
    await expect(scale.getByTestId("two-step-deal")).toBeDisabled();
  });

  test("2. by keyboard: take the loose weights off, share, keep one box and one group, x = 4", async ({ page }) => {
    await page.goto(LESSON);
    await page.getByTestId("lang-en").click();
    const scale = page.getByTestId("two-step-explorer");
    await expect(scale.getByTestId("balance-scale")).toBeVisible();

    // A click on the equation sets where keyboard navigation starts, as a reader's click would.
    await scale.getByTestId("two-step-equation").click();
    await tabTo(page, "two-step-take");
    for (let i = 0; i < 3; i++) await page.keyboard.press("Enter");
    await expect(scale).toHaveAttribute("data-left", "0");
    await expect(scale.getByTestId("two-step-equation")).toHaveText(/2\s*x\s*=\s*8/);
    await expect(scale.getByTestId("two-step-live")).toContainText("The boxes stand alone: 2x = 8.");

    await tabTo(page, "two-step-deal");
    for (let i = 0; i < 4; i++) await page.keyboard.press("Enter");
    await expect(scale).toHaveAttribute("data-loose", "0");
    await expect(scale.getByTestId("two-step-live")).toContainText("Now keep one box and one group.");

    await tabTo(page, "two-step-keep");
    await page.keyboard.press("Enter");
    await expect(scale).toHaveAttribute("data-solved", "true");
    await expect(scale.getByTestId("two-step-equation")).toHaveText(/x\s*=\s*4/);
    await expect(scale.getByTestId("two-step-live")).toContainText("x = 4. Check: 2 × 4 + 3 = 11.");

    for (const button of await scale.getByRole("button").all()) {
      const box = await button.boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
      expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
    }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("3. practice from the lesson: feedback that names the mistake, both steps as help, and My work", async ({ page }) => {
    await page.goto(LESSON);
    await page.getByTestId("lang-en").click();
    await page.getByTestId("practice-algebra.two-step.within-20").click();
    const prompt = page.getByTestId("prompt");
    await expect(prompt).toHaveAttribute("data-form", "two-step");
    const match = /^(\d+) times x plus (\d+) equals (\d+)\. What is x\?$/.exec((await prompt.getAttribute("aria-label")) ?? "");
    expect(match).not.toBeNull();
    const [a, c, b] = [Number(match![1]), Number(match![2]), Number(match![3])];
    const x = (b - c) / a;
    await expect(prompt).toHaveText(new RegExp(`${a}\\s*x\\s*\\+\\s*${c}\\s*=\\s*${b}`));

    await page.getByTestId("answer").fill(String(b - c));
    await page.getByTestId("check").click();
    await expect(page.getByTestId("result")).toContainText(`${b - c} is ${b} − ${c}: taking away ${c} was right.`);

    await page.getByTestId("toggle-help").click();
    const panel = page.getByTestId("help-panel");
    await expect(panel.getByTestId("balance-scale")).toBeVisible();
    for (let i = 0; i < 4; i++) await panel.getByTestId("help-next").click();
    await expect(panel.getByTestId("help-revealed")).toBeVisible();
    await expect(panel.getByTestId("help-step-text")).toContainText(`so x = ${x}. Check: ${a} × ${x} + ${c} = ${b}.`);

    await page.getByTestId("answer").fill(String(x));
    await page.getByTestId("check").click();
    await expect(page.getByTestId("result")).toContainText(`Correct. x = ${x}, because ${a} × ${x} + ${c} = ${b}.`);
    await page.getByRole("link", { name: "My work" }).click();
    await expect(page.getByTestId("record-question").first()).toHaveText(`${a}x + ${c} = ${b}`);
  });
});
