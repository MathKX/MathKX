// The seven end-to-end checks of specs/002 contracts/learner-app.md, against the real service and the built app.
import { expect, test, type Page, type Request, type Response } from "@playwright/test";

const LESSON = "/lessons/number-bonds-to-ten";
const PRACTICE = "/practice/numbers.addition-within-20";

async function operands(page: Page): Promise<{ a: number; b: number }> {
  const label = (await page.getByTestId("prompt").getAttribute("aria-label")) ?? "";
  const match = /(\d+)\D+(\d+)/.exec(label);
  if (!match) throw new Error(`no operands in "${label}"`);
  return { a: Number(match[1]), b: Number(match[2]) };
}

async function startPractice(page: Page) {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.goto(LESSON);
  await page.getByTestId("practice-numbers.addition.within-10").click();
  await expect(page.getByTestId("prompt")).toBeVisible();
}

test.describe("practice flow", () => {
  test("1. keyboard only: start, help, answer, feedback, next question", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => window.localStorage.clear());
    await page.goto(LESSON);
    await page.getByTestId("practice-numbers.addition.within-10").focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("prompt")).toBeVisible();
    const { a, b } = await operands(page);

    await page.getByTestId("toggle-help").focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("toggle-help")).toHaveAttribute("aria-expanded", "true");
    await page.getByTestId("answer").focus();
    await page.keyboard.type(String(a + b));
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("result")).toHaveAttribute("data-status", "correct");
    await expect(page.getByTestId("result-region")).toBeFocused();
    await page.getByTestId("another").focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("result")).toHaveCount(0);
    await expect(page.getByTestId("prompt")).toBeVisible();
  });

  test("2. the accessibility tree exposes no total before the revealing step", async ({ page }) => {
    await startPractice(page);
    const { a, b } = await operands(page);
    const sum = a + b;
    await page.getByTestId("toggle-help").click();
    const before = await page.getByTestId("exercise-shell").ariaSnapshot();
    expect(before).not.toMatch(new RegExp(`(^|\\D)${sum}(\\D|$)`));
    for (let i = 0; i < 4; i++) await page.getByTestId("help-next").click();
    await expect(page.getByTestId("help-revealed")).toBeVisible();
    const after = await page.getByTestId("exercise-shell").ariaSnapshot();
    expect(after).toMatch(new RegExp(`(^|\\D)${sum}(\\D|$)`));
  });

  test("3. switching language mid-question keeps the question, draft, and help state", async ({ page }) => {
    await startPractice(page);
    const { a, b } = await operands(page);
    await page.getByTestId("answer").fill("7");
    await page.getByTestId("toggle-help").click();
    await page.getByTestId("lang-en").click();
    await expect(page.getByTestId("prompt")).toHaveAttribute("aria-label", `${a} plus ${b}. What is the sum?`);
    await expect(page.getByTestId("answer")).toHaveValue("7");
    await expect(page.getByTestId("toggle-help")).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByTestId("toggle-help")).toHaveText("Hide visual help");
    await expect(page.getByTestId("check")).toHaveText("Check answer");
    await expect(page.getByTestId("ladder-current")).toHaveText(/^Now: /);
  });

  test("4. the ladder moves to crossing ten with its sentence and make-ten help, and is honest at the top", async ({ page }) => {
    await startPractice(page);
    await page.getByTestId("harder").click();
    await expect(page.getByTestId("ladder-pending")).toContainText("Neste oppgave:");
    await page.getByTestId("another").click();
    await expect(page.getByTestId("ladder-current")).toContainText("Over ti");
    const { a, b } = await operands(page);
    expect(a + b).toBeGreaterThanOrEqual(11);
    expect(a + b).toBeLessThanOrEqual(18);
    await page.getByTestId("toggle-help").click();
    await expect(page.getByTestId("make-ten")).toBeVisible();
    await page.getByTestId("harder").click();
    await expect(page.getByTestId("notice")).toHaveText("Det finnes ingen vanskeligere variant ennå.");
  });

  test("5. no unsolicited response carries the sum; a revealing step arrives only after the learner advances", async ({ page }) => {
    const responses: { url: string; body: unknown; at: number; sentAt: number }[] = [];
    const clicks: number[] = [];
    const sent = new Map<Request, number>();
    page.on("request", (request: Request) => void sent.set(request, Date.now()));
    page.on("response", async (response: Response) => {
      const url = response.url();
      if (!url.includes("/api/") || !(response.headers()["content-type"] ?? "").includes("json")) return;
      const sentAt = sent.get(response.request()) ?? Date.now();
      try {
        responses.push({ url, body: await response.json(), at: Date.now(), sentAt });
      } catch {
        // not JSON
      }
    });
    await startPractice(page);
    const questionShown = Date.now();
    const { a, b } = await operands(page);
    await page.getByTestId("toggle-help").click();
    await page.waitForTimeout(200);
    clicks.push(Date.now());
    for (let i = 0; i < 4; i++) {
      await page.getByTestId("help-next").click();
      await page.waitForTimeout(100);
    }
    await page.getByTestId("answer").fill(String(a));
    await page.getByTestId("check").click();
    await expect(page.getByTestId("result")).toHaveAttribute("data-status", "incorrect");
    await page.getByTestId("answer").fill(String(a + b));
    await page.getByTestId("check").click();
    await expect(page.getByTestId("result")).toHaveAttribute("data-status", "correct");

    const hasKey = (value: unknown, key: string): boolean => {
      if (Array.isArray(value)) return value.some((v) => hasKey(v, key));
      if (value && typeof value === "object") return Object.entries(value as Record<string, unknown>).some(([k, v]) => k === key || hasKey(v, key));
      return false;
    };
    // The lesson read before this question existed (to press its practice entry) brings its own worked visual,
    // whose last step shows that example's total (specs/003 contracts/api.md): lesson content, not this question's
    // answer. Once the question is shown, no lesson content or visual may arrive at all in this flow.
    const lessonContent = (url: string) => url.includes("/api/visuals/") || url.includes("/api/lessons/number-bonds-to-ten/content/");
    for (const r of responses) {
      const body = r.body as { status?: string; reveals?: boolean };
      if (lessonContent(r.url)) {
        expect(r.sentAt, `${r.url} was requested after the question was shown`).toBeLessThan(questionShown);
        continue;
      }
      const allowed = (r.url.includes("/validations") && body.status === "correct") || (r.url.includes("/steps/") && body.reveals === true);
      if (!allowed) expect(hasKey(r.body, "sum") || hasKey(r.body, "total") || hasKey(r.body, "countedAll"), r.url).toBe(false);
    }
    const revealing = responses.filter((r) => r.url.includes("/steps/") && (r.body as { reveals?: boolean }).reveals === true);
    expect(revealing).toHaveLength(1);
    expect(revealing[0]!.at).toBeGreaterThanOrEqual(clicks[0]!);
    const stored = await page.evaluate(() => JSON.parse(window.localStorage.getItem("mathkx.guest.v1") ?? "{}"));
    const kinds = stored.value.deliveries[0].events.map((e: { kind?: string; type: string }) => e.kind ?? e.type);
    expect(kinds).toContain("counting-complete");
  });

  test("6. interactive controls are at least 44 by 44 at the iPad viewport", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "ipad", "iPad viewport only");
    await startPractice(page);
    await page.getByTestId("toggle-help").click();
    for (const id of ["check", "toggle-help", "another", "more-like-this", "easier", "harder", "help-next", "lang-nb", "lang-en"]) {
      const box = await page.getByTestId(id).boundingBox();
      expect(box, id).not.toBeNull();
      expect(box!.width, `${id} width`).toBeGreaterThanOrEqual(44);
      expect(box!.height, `${id} height`).toBeGreaterThanOrEqual(44);
    }
  });

  test("7. incorrect, explanation reveal, corrected: the record says the answer was shown; after a correct answer it is a tag", async ({ page }) => {
    await startPractice(page);
    const first = await operands(page);
    await page.getByTestId("answer").fill(String(first.a));
    await page.getByTestId("check").click();
    await expect(page.getByTestId("result")).toHaveAttribute("data-status", "incorrect");
    await page.getByTestId("toggle-explanation").click();
    for (let i = 0; i < 6 && (await page.getByTestId("explanation-revealed").count()) === 0; i++) {
      await page.getByTestId("explanation-next").click();
      await expect(page.getByTestId("explanation-step-text")).toContainText(`Steg ${i + 1} av`);
    }
    await expect(page.getByTestId("explanation-revealed")).toBeVisible();
    await page.getByTestId("answer").fill(String(first.a + first.b));
    await page.getByTestId("check").click();
    await expect(page.getByTestId("result")).toHaveAttribute("data-status", "correct");

    await page.getByTestId("another").click();
    await expect(page.getByTestId("result")).toHaveCount(0);
    const second = await operands(page);
    await page.getByTestId("answer").fill(String(second.a + second.b));
    await page.getByTestId("check").click();
    await expect(page.getByTestId("result")).toHaveAttribute("data-status", "correct");
    await page.getByTestId("toggle-explanation").click();
    await page.getByTestId("explanation-next").click();

    await page.getByText("Mitt arbeid").click();
    await page.getByTestId("progress-questions").click(); // specs/004: the list is behind "Show the questions", newest first
    const items = page.getByTestId("record-item");
    await expect(items).toHaveCount(2);
    await expect(items.nth(1)).toHaveAttribute("data-outcome", "correctAfterExplanation");
    await expect(items.nth(1)).toContainText("Feil svar først");
    await expect(items.nth(0)).toHaveAttribute("data-outcome", "correctFirst");
    await expect(items.nth(0)).toContainText("Forklaring åpnet etter svaret");
    await expect(page.getByTestId("record-summary")).not.toContainText("%");
  });

  test("8. loading a practice address directly (reload, bookmark, shared link) shows the practice screen", async ({ page }) => {
    await startPractice(page);
    // The skill ID has a dot in its last segment, which the service must not take for a file request.
    const response = await page.goto(PRACTICE);
    expect(response?.status()).toBe(200);
    expect(response?.headers()["content-type"]).toContain("text/html");
    await expect(page.getByTestId("practice-page")).toBeVisible();
    await expect(page.getByTestId("prompt")).toBeVisible();
  });
});
