// specs/008: the one-step equations lesson and its balance explorer, against the real service and the built app.
import { expect, test } from "@playwright/test";
import { tabTo } from "./focus";

const LESSON = "/lessons/one-step-equations";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
});

test.describe("the balance explorer (specs/008)", () => {
  test("1. the lesson list opens the lesson, and both scales load from the service", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Likninger og skålvekta" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Likninger og skålvekta" })).toBeVisible();
    const scales = page.getByTestId("balance-explorer");
    await expect(scales).toHaveCount(2);
    await expect(scales.nth(0).getByTestId("balance-equation")).toHaveText(/x\s*\+\s*3\s*=\s*7/);
    await expect(scales.nth(1).getByTestId("balance-equation")).toHaveText(/x\s*\+\s*5\s*=\s*12/);
  });

  test("2. keyboard only: every control is reached by Tab, shows focus, and works with Enter; x + 3 = 7 is solved", async ({ page }) => {
    await page.goto(LESSON);
    const scale = page.getByTestId("balance-explorer").first();
    await expect(scale.getByTestId("balance-scale")).toBeVisible();
    const beam = scale.locator(".mkx-balance__beam");
    const level = await beam.evaluate((el) => getComputedStyle(el).transform);
    const hint = "De to sidene er ikke lenger like. Angre, og ta like mye av begge skålene.";
    const equation = scale.getByTestId("balance-equation");

    // Both pans, then the left pan alone: the scale tips right, and the hint is shown and announced.
    await tabTo(page, "balance-both");
    await page.keyboard.press("Enter");
    await expect(equation).toHaveText(/x\s*\+\s*2\s*=\s*6/);
    await tabTo(page, "balance-left");
    await page.keyboard.press("Enter");
    await expect(scale).toHaveAttribute("data-tilt", "right-down");
    await expect(scale.getByTestId("balance-hint")).toBeVisible();
    await expect(scale.getByTestId("balance-live")).toContainText(hint);
    await expect.poll(() => beam.evaluate((el) => getComputedStyle(el).transform)).not.toBe(level);

    // Undo levels it again; Start again returns the authored equation.
    await tabTo(page, "balance-undo");
    await page.keyboard.press("Enter");
    await expect(scale).toHaveAttribute("data-tilt", "balanced");
    await expect(equation).toHaveText(/x\s*\+\s*2\s*=\s*6/);
    await tabTo(page, "balance-reset");
    await page.keyboard.press("Enter");
    await expect(equation).toHaveText(/x\s*\+\s*3\s*=\s*7/);

    // The right pan alone tips the scale left; Undo returns to the start.
    await tabTo(page, "balance-right", { backward: true });
    await page.keyboard.press("Enter");
    await expect(scale).toHaveAttribute("data-tilt", "left-down");
    await tabTo(page, "balance-undo");
    await page.keyboard.press("Enter");
    await expect(scale).toHaveAttribute("data-tilt", "balanced");

    await tabTo(page, "balance-both", { backward: true });
    for (let i = 0; i < 3; i++) await page.keyboard.press("Enter");
    await expect(scale).toHaveAttribute("data-solved", "true");
    await expect(scale.getByTestId("balance-equation")).toHaveText(/x\s*=\s*4/);
    await expect(scale.getByTestId("balance-solved")).toHaveText("x står alene og vekta er i balanse, så x = 4. Sjekk: 4 + 3 = 7.");
    await expect(scale.getByTestId("balance-live")).toContainText("x = 4");
  });

  test("3. the controls are 44-pixel targets and the scale fits the column without scrolling sideways", async ({ page }) => {
    await page.goto(LESSON);
    const scale = page.getByTestId("balance-explorer").first();
    await expect(scale.getByTestId("balance-scale")).toBeVisible();
    for (const button of await scale.getByRole("button").all()) {
      const box = await button.boundingBox();
      expect(box?.height ?? 0, `${await button.textContent()} is tall enough`).toBeGreaterThanOrEqual(44);
      expect(box?.width ?? 0, `${await button.textContent()} is wide enough`).toBeGreaterThanOrEqual(44);
    }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
