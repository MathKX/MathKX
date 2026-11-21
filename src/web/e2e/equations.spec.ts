// specs/008: the one-step equations lesson and its balance explorer, against the real service and the built app.
import { expect, test } from "@playwright/test";

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

  test("2. keyboard only: tip the scale, undo, and solve x + 3 = 7, with visible focus", async ({ page }) => {
    await page.goto(LESSON);
    const scale = page.getByTestId("balance-explorer").first();
    await expect(scale.getByTestId("balance-scale")).toBeVisible();
    const beam = scale.locator(".mkx-balance__beam");
    const level = await beam.evaluate((el) => getComputedStyle(el).transform);

    await scale.getByTestId("balance-right").focus();
    await page.keyboard.press("Enter");
    await expect(scale).toHaveAttribute("data-tilt", "left-down");
    await expect(scale.getByTestId("balance-hint")).toBeVisible();
    await expect.poll(() => beam.evaluate((el) => getComputedStyle(el).transform)).not.toBe(level);

    await page.keyboard.press("Tab");
    await expect(scale.getByTestId("balance-undo")).toBeFocused();
    const ring = await scale.getByTestId("balance-undo").evaluate((el) => {
      const style = getComputedStyle(el);
      return (style.outlineStyle !== "none" && style.outlineWidth !== "0px") || style.boxShadow !== "none";
    });
    expect(ring, "Undo shows focus").toBe(true);
    await page.keyboard.press("Enter");
    await expect(scale).toHaveAttribute("data-tilt", "balanced");

    await scale.getByTestId("balance-both").focus();
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
