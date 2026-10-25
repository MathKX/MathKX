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

  /**
   * Records each control's unfocused outline and shadow, so a focus indicator is told apart from a permanent
   * decoration (PR 41 review). Runs before Tab reaches the controls, while none of them has focus.
   */
  const recordUnfocused = (page: Page) =>
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
  const focusShows = (page: Page) =>
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

  async function tabTo(page: Page, testId: string) {
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

  test("4b. the focus check rejects invisible indicators (negative controls)", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "a check of the check; one project is enough");
    await page.goto("/");
    await page.evaluate(() => {
      const style = document.createElement("style");
      style.textContent = ".shadow-on-focus:focus { outline: none; box-shadow: 0 0 0 3px rgb(0, 0, 255); } .outline-on-focus:focus { outline: 3px solid rgb(0, 0, 255); }";
      document.head.append(style);
      const cases: [string, string, string][] = [
        ["transparent-outline", "outline: 3px solid transparent;", ""],
        ["clear-outline", "outline: 3px solid rgba(0, 0, 0, 0);", ""],
        ["zero-shadow", "outline: none; box-shadow: 0 0 0 0 rgb(0, 0, 0);", ""],
        ["clear-shadow", "outline: none; box-shadow: 0 0 0 3px rgba(0, 0, 0, 0);", ""],
        ["decorative-shadow", "outline: none; box-shadow: 0 0 0 3px rgb(0, 0, 0);", ""],
        ["decorative-outline", "outline: 3px solid rgb(0, 0, 255);", ""],
        ["outline-on-focus", "", "outline-on-focus"],
        ["shadow-on-focus", "", "shadow-on-focus"],
      ];
      for (const [id, css, className] of cases) {
        const a = document.createElement("a");
        a.href = "#";
        a.textContent = id;
        a.dataset.testid = id;
        a.setAttribute("style", css);
        if (className) a.className = className;
        document.body.prepend(a);
      }
    });
    await recordUnfocused(page);
    const results: Record<string, boolean> = {};
    for (const id of ["transparent-outline", "clear-outline", "zero-shadow", "clear-shadow", "decorative-shadow", "decorative-outline", "outline-on-focus", "shadow-on-focus"]) {
      await page.getByTestId(id).focus();
      results[id] = (await focusShows(page)).visible;
    }
    expect(results).toEqual({
      "transparent-outline": false,
      "clear-outline": false,
      "zero-shadow": false,
      "clear-shadow": false,
      "decorative-shadow": false,
      "decorative-outline": false,
      "outline-on-focus": true,
      "shadow-on-focus": true,
    });
  });

  test("5. My work and replay at 200 percent zoom do not scroll sideways", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "desktop viewport only");
    await twoQuestions(page);
    await page.getByTestId("lang-nb").click(); // the longer language
    await page.setViewportSize({ width: 512, height: 384 }); // 1024 by 768 at 200 percent
    await page.getByRole("link", { name: "Mitt arbeid" }).click();
    await page.getByTestId("progress-questions").first().click();
    await expect(page.getByTestId("record-item").first()).toBeVisible(); // the list has opened
    // The page must not scroll sideways, and no box inside it may clip or scroll content sideways either: the
    // question list sits in a box that hides its own overflow, which the page width alone would not reveal.
    const overflow = () =>
      page.evaluate(() => ({
        page: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
        clipped: [...document.querySelectorAll("main *")]
          .filter((el) => el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflowX !== "visible")
          .map((el) => (el as HTMLElement).dataset.testid ?? el.tagName.toLowerCase()),
      }));
    expect(await overflow(), "My work").toEqual({ page: 0, clipped: [] });

    // Replay shows the expression only once the instance request settles: delay it, and measure only after it.
    await page.route("**/api/instances/**", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await route.continue();
    });
    await page.getByTestId("record-question").first().click();
    await expect(page.getByTestId("replay-outcome")).toBeVisible();
    await expect(page.getByTestId("prompt")).toHaveCount(0); // the delayed request has not settled yet
    await expect(page.getByTestId("prompt")).toBeVisible();
    expect(await overflow(), "replay").toEqual({ page: 0, clipped: [] });
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

  test("7. a record from before this feature, and the service unreachable (quickstart scenario 4)", async ({ page }) => {
    // A guest record as spec 003 wrote it: deliveries, no lessonViews field.
    const delivery = (id: string, definitionId: string, a: number, b: number, minute: number, value: number) => ({
      id,
      instance: { definitionId, version: 1, seed: String(minute), generatorVersion: 1, validatorName: "integer-answer", validatorVersion: 1, a, b },
      purpose: "practice",
      provenance: "guest",
      startedAt: new Date(Date.UTC(2026, 9, 20, 10, minute)).toISOString(),
      events: [{ type: "submission", submissionId: "s" + id, originalText: String(value), value, status: "correct", code: "correct" }],
    });
    const old = {
      language: "en",
      skillId: "numbers.addition-within-20",
      ladder: { entries: [], current: null, pending: null },
      deliveries: [
        delivery("old-1", "numbers.addition.within-10", 3, 4, 1, 7),
        delivery("old-2", "numbers.addition.within-10", 2, 6, 2, 8),
        delivery("old-3", "numbers.addition.crossing-ten", 8, 5, 3, 13),
      ],
      currentDeliveryId: null,
      instance: null,
      draft: "",
      helpOpen: false,
      helpSteps: [],
      helpStep: -1,
      explanationOpen: false,
      explanationSteps: [],
      explanationStep: -1,
      result: null,
      resumable: null,
    };
    await page.goto("/");
    await page.evaluate((value) => window.localStorage.setItem("mathkx.guest.v1", JSON.stringify({ schema: 1, value })), old);

    await page.goto("/record");
    await expect(page.getByTestId("skill-name")).toHaveText(["Addition within 20"]);
    await expect(page.getByTestId("record-summary")).toHaveText("3 questions: 3 correct on first response, no help");
    await expect(page.getByTestId("record-item")).toHaveCount(3);
    await expect(page.getByTestId("lesson-viewed")).toHaveCount(0);
    const kept = await page.evaluate(() => JSON.parse(window.localStorage.getItem("mathkx.guest.v1") ?? "{}"));
    expect(kept.schema).toBe(1);
    expect(kept.value.deliveries).toEqual(old.deliveries);

    // The service unreachable: every question stays visible, under Other practice, and replay says what it can.
    await page.route("**/api/skills", (route) => route.abort());
    await page.route("**/api/lessons", (route) => route.abort());
    await page.route("**/api/instances/**", (route) => route.abort());
    await page.reload();
    await expect(page.getByTestId("progress-unavailable")).toHaveText("Skill names could not be loaded just now. Your work is all here.");
    await expect(page.getByTestId("skill-name")).toHaveText(["Other practice"]);
    await expect(page.getByTestId("record-item")).toHaveCount(3);
    await page.getByTestId("progress-questions").click();
    await page.getByTestId("record-question").first().click();
    await expect(page.getByTestId("replay-unavailable")).toBeVisible();
    await expect(page.getByTestId("prompt")).toHaveAttribute("aria-label", "8 plus 5. What is the sum?");
    await expect(page.getByTestId("replay-submission")).toContainText("Correct. 8 + 5 = 13.");
  });
});
