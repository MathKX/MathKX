// One focus ring across the app: links and the language buttons show the same focus style as Designsystemet's
// buttons (self-checks walkthrough of 2026-11-19, "Links show the browser's focus ring, not the app's").
import { expect, test, type Page } from "@playwright/test";
import { focusShows, recordUnfocused } from "./focus";

const CHECK = "/checks/numbers.addition.check-within-20";

/** The focused element's name and its focus style: outline, offset, and shadow as computed. */
const focused = (page: Page) =>
  page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el || el === document.body) return null;
    const s = getComputedStyle(el);
    return {
      name: el.dataset.testid ?? `${el.tagName.toLowerCase()}:${(el.textContent ?? "").trim()}`,
      tag: el.tagName.toLowerCase(),
      style: [s.outlineStyle, s.outlineWidth, s.outlineColor, s.outlineOffset, s.boxShadow].join(" | "),
    };
  });

test("links and the language buttons show the buttons' focus ring", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  // An unfinished check, so the start page shows "Continue the check" beside "Start the check".
  await page.goto(CHECK);
  await page.getByTestId("check-start").click();
  await expect(page.getByTestId("check-position")).toBeVisible();
  await page.goto(CHECK);
  await expect(page.getByTestId("check-continue")).toBeVisible();
  await expect(page.getByTestId("check-start")).toBeVisible();

  // Unfocused styles first, so a ring that is always painted does not count as showing focus.
  await recordUnfocused(page);
  const seen: { name: string; tag: string; style: string }[] = [];
  for (let i = 0; i < 20; i++) {
    await page.keyboard.press("Tab");
    const f = await focused(page);
    if (!f) continue;
    expect((await focusShows(page)).visible, `${f.name} shows focus only when focused`).toBe(true);
    seen.push(f);
    if (f.name === "check-start") break;
  }

  const button = seen.find((f) => f.name === "check-start");
  expect(button, "Tab reached Start the check").toBeTruthy();
  expect(button!.style).toMatch(/solid/);

  const others = seen.filter((f) => f.name !== "check-start");
  // The skip link, the header's two links, both language buttons, and "Continue the check" come before the button.
  expect(others.filter((f) => f.tag === "a").length).toBeGreaterThanOrEqual(4);
  expect(others.map((f) => f.name)).toEqual(expect.arrayContaining(["lang-en", "lang-nb", "check-continue"]));
  for (const f of others) expect(f.style, `${f.name} has the buttons' focus ring`).toBe(button!.style);
});
