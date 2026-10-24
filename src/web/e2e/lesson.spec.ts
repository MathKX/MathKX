// The end-to-end checks of specs/003 contracts/detour.md, against the real service and the built app.
// Questions are pinned to golden seeds of addition-pair-v1.golden.json: an init script makes the next 8-byte
// crypto.getRandomValues call (the app's newSeed) yield the seed's big-endian bytes; nothing in the app changes.
import { expect, test, type Page, type Request } from "@playwright/test";

const LESSON = "/lessons/number-bonds-to-ten";
const CONTENT = "/api/lessons/number-bonds-to-ten/content/";

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

/** Starts practice on a definition from the lesson page, in English, with the next seed pinned. */
async function startOn(page: Page, definition: string, seed: string) {
  await pinSeeds(page, [seed]);
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.goto(LESSON);
  await page.getByTestId("lang-en").click();
  await page.getByTestId(`practice-${definition}`).click();
  await expect(page.getByTestId("prompt")).toBeVisible();
}

function contentRequests(page: Page): Request[] {
  const seen: Request[] = [];
  page.on("request", (request) => {
    if (request.url().includes(CONTENT)) seen.push(request);
  });
  return seen;
}

async function answerAndOpenRecord(page: Page, value: string) {
  await page.getByTestId("answer").fill(value);
  await page.getByTestId("check").click();
  await expect(page.getByTestId("result")).toHaveAttribute("data-status", "correct");
  await page.getByRole("link", { name: "My work" }).click();
  return page.getByTestId("record-item").first();
}

test.describe("the detour from a question to its lesson", () => {
  test("1. 6 + 5: the lesson opens without a notice and the way back keeps the draft and help step", async ({ page }) => {
    await startOn(page, "numbers.addition.crossing-ten", "1234567890123456789");
    await expect(page.getByTestId("prompt")).toHaveAttribute("aria-label", "6 plus 5. What is the sum?");
    await page.getByTestId("answer").fill("1");
    await page.getByTestId("toggle-help").click();
    await page.getByTestId("help-next").click();
    await page.getByTestId("help-next").click();
    await expect(page.getByTestId("help-step-text")).toContainText("2");
    const step = await page.getByTestId("help-step-text").textContent();

    await page.getByTestId("to-lesson").click();
    await expect(page.getByTestId("lesson-content")).toBeVisible();
    await expect(page.getByTestId("lesson-gate")).toHaveCount(0);
    await page.getByTestId("return-to-question").click();

    await expect(page.getByTestId("answer")).toHaveValue("1");
    await expect(page.getByTestId("toggle-help")).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByTestId("help-step-text")).toHaveText(step ?? "");
    const item = await answerAndOpenRecord(page, "11");
    await expect(item).toHaveAttribute("data-outcome", "correctWithHelp");
    await expect(item.getByTestId("record-tag").filter({ hasText: "Lesson opened" })).toHaveCount(1);
  });

  test("2. 5 + 8: the notice comes first, nothing is requested until the learner chooses, and the reveal is recorded", async ({ page }) => {
    await startOn(page, "numbers.addition.crossing-ten", "100");
    const requests = contentRequests(page); // from here on: the lesson was read before this question existed
    await expect(page.getByTestId("prompt")).toHaveAttribute("aria-label", "5 plus 8. What is the sum?");

    await page.getByTestId("to-lesson").click();
    const gate = page.getByTestId("lesson-gate");
    await expect(gate.getByRole("heading")).toHaveText("This lesson shows the answer to 5 + 8");
    await page.getByTestId("lang-nb").click();
    await expect(gate.getByRole("heading")).toHaveText("Leksjonen viser svaret på 5 + 8");
    await page.getByTestId("lang-en").click();
    expect(requests).toHaveLength(0);

    await page.getByTestId("gate-open").click();
    await expect(page.getByTestId("lesson-content")).toBeVisible();
    expect(requests.length).toBeGreaterThan(0);
    await page.getByTestId("return-to-question").click();
    const item = await answerAndOpenRecord(page, "13");
    await expect(item).toHaveAttribute("data-outcome", "correctAfterExplanation");
    await expect(item.getByTestId("record-tag").filter({ hasText: "Answer shown in the lesson" })).toHaveCount(1);
  });

  test("3. 9 + 1 reached through the lesson list gets the same notice, with nothing requested", async ({ page }) => {
    await startOn(page, "numbers.addition.within-10", "100");
    const requests = contentRequests(page);
    await expect(page.getByTestId("prompt")).toHaveAttribute("aria-label", "9 plus 1. What is the sum?");
    await page.getByRole("link", { name: "Lessons" }).click();
    await page.getByRole("link", { name: "Number bonds to ten" }).click();
    await expect(page.getByTestId("lesson-gate")).toBeVisible();
    expect(requests).toHaveLength(0);
  });

  test("4. the browser's back action restores the question as the banner does", async ({ page }) => {
    await startOn(page, "numbers.addition.crossing-ten", "1234567890123456789");
    await page.getByTestId("answer").fill("2");
    await page.getByTestId("to-lesson").click();
    await expect(page.getByTestId("lesson-content")).toBeVisible();
    await page.goBack();
    await expect(page.getByTestId("prompt")).toHaveAttribute("aria-label", "6 plus 5. What is the sum?");
    await expect(page.getByTestId("answer")).toHaveValue("2");
  });

  test("5. keyboard only: open the lesson from the question, use the notice, return", async ({ page }) => {
    await startOn(page, "numbers.addition.crossing-ten", "100");
    await page.getByTestId("to-lesson").focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("lesson-gate").getByRole("heading")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByTestId("gate-open")).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("lesson-content")).toBeVisible();
    await page.getByTestId("return-to-question").focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("prompt")).toBeVisible();
  });
});
