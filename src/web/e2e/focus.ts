// Keyboard focus checks shared by the end-to-end specs (specs/004, moved here by specs/005 T032).
import { expect, type Page } from "@playwright/test";

/**
 * Records each control's unfocused outline and shadow, so a focus indicator is told apart from a permanent
 * decoration (PR 41 review). Runs before Tab reaches the controls, while none of them has focus.
 */
export const recordUnfocused = (page: Page) =>
  page.evaluate(() => {
    const store = new WeakMap<Element, string>();
    for (const el of document.querySelectorAll("a, button, summary, input, [tabindex]")) {
      if (el === document.activeElement) continue;
      const style = getComputedStyle(el);
      store.set(el, style.outlineStyle + " " + style.outlineWidth + " " + style.outlineColor + " | " + style.boxShadow);
    }
    (window as unknown as { __mkxUnfocused: WeakMap<Element, string> }).__mkxUnfocused = store;
  });

/**
 * Whether the focused element shows a painted focus indicator: an outline with width and a visible colour, or a
 * box shadow with a visible colour and some extent, either of which the element does not have unfocused. A
 * transparent outline, a transparent or zero-size shadow, and an unchanged decorative shadow do not count.
 */
export const focusShows = (page: Page) =>
  page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el || el === document.body) return { name: "none", visible: false };
    const alpha = (color: string) => {
      if (color === "transparent") return 0;
      const match = /rgba?\(([^)]*)\)/.exec(color);
      if (!match) return 1;
      const parts = match[1]!.split(/[\s,/]+/).filter(Boolean);
      return parts.length >= 4 ? Number.parseFloat(parts[3]!) : 1;
    };
    const style = getComputedStyle(el);
    const outline = style.outlineStyle !== "none" && Number.parseFloat(style.outlineWidth) > 0 && alpha(style.outlineColor) > 0;
    // Computed shadows list the colour first: "rgb(0, 0, 255) 0px 0px 0px 2px, ...".
    const shadows = style.boxShadow === "none" ? [] : style.boxShadow.split(/,(?![^(]*\))/);
    const paintedShadow = shadows.some((shadow) => {
      const color = /rgba?\([^)]*\)|transparent/.exec(shadow)?.[0] ?? "rgb(0, 0, 0)";
      const lengths = (shadow.replace(color, "").match(/-?[\d.]+px/g) ?? []).map((n) => Math.abs(Number.parseFloat(n)));
      return alpha(color) > 0 && lengths.some((n) => n > 0);
    });
    const unfocused = (window as unknown as { __mkxUnfocused?: WeakMap<Element, string> }).__mkxUnfocused?.get(el);
    const now = style.outlineStyle + " " + style.outlineWidth + " " + style.outlineColor + " | " + style.boxShadow;
    const changed = unfocused === undefined || unfocused !== now;
    return { name: el.dataset.testid ?? el.tagName.toLowerCase(), visible: changed && (outline || paintedShadow) };
  });

/** Tabs forward until `testId` has focus, and expects it to show that it has. */
export async function tabTo(page: Page, testId: string) {
  await recordUnfocused(page);
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
