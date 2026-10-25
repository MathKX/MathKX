// "My work" as the progress view (specs/004 contracts/progress-view.md), with spec 002's notice, reload, and
// clearing behaviour kept.
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { App } from "../src/App";
import { formatDate } from "../src/i18n";
import type { Delivery } from "../src/state/observations";
import { brokenStorage, createFakeApi } from "./fakeApi";
import { at, beforeThisFeature, correct, delivery, unknownDefinition, withRepeats } from "./records";

const practicePath = "/practice/numbers.addition-within-20";
afterEach(() => window.localStorage.clear());

async function practiseThree(api = createFakeApi({ pairs: { "numbers.addition.within-10": [3, 5] } })) {
  window.localStorage.clear();
  render(<App api={api} initialPath={practicePath} />);
  const user = userEvent.setup();
  await screen.findByTestId("prompt");
  // 1: correct at once
  await user.type(screen.getByTestId("answer"), "8");
  await user.click(screen.getByTestId("check"));
  await screen.findByTestId("result");
  await user.click(screen.getByTestId("another"));
  await waitFor(() => expect(screen.queryByTestId("result")).toBeNull());
  // 2: incorrect then correct
  await user.type(screen.getByTestId("answer"), "3");
  await user.click(screen.getByTestId("check"));
  await screen.findByTestId("result");
  await user.clear(screen.getByTestId("answer"));
  await user.type(screen.getByTestId("answer"), "8");
  await user.click(screen.getByTestId("check"));
  await waitFor(() => expect(screen.getByTestId("result").getAttribute("data-status")).toBe("correct"));
  await user.click(screen.getByTestId("another"));
  await waitFor(() => expect(screen.queryByTestId("result")).toBeNull());
  // 3: visual help then correct
  await user.click(screen.getByTestId("toggle-help"));
  await user.type(screen.getByTestId("answer"), "8");
  await user.click(screen.getByTestId("check"));
  await screen.findByTestId("result");
  return user;
}

/** Stores a record as the app would have written it, then opens "My work" in the given language. */
function openRecord(
  deliveries: Delivery[],
  { language = "en", api = createFakeApi(), lessonViews }: { language?: "nb" | "en"; api?: ReturnType<typeof createFakeApi>; lessonViews?: { lessonId: string; language: string; at: string }[] } = {},
) {
  window.localStorage.setItem("mathkx.guest.v1", JSON.stringify({ schema: 1, value: { ...beforeThisFeature(), language, deliveries, ...(lessonViews ? { lessonViews } : {}) } }));
  render(<App api={api} initialPath="/record" />);
  return userEvent.setup();
}

describe("the record page", () => {
  it("groups the work under the skill's name with spec 002's counts, newest first, in the active language, and survives a reload", async () => {
    const user = await practiseThree();
    await user.click(screen.getByText("Mitt arbeid"));
    await screen.findByTestId("record-page");
    const heading = await screen.findByTestId("skill-name");
    expect(heading.textContent).toBe("Addisjon opp til 20");
    expect(document.activeElement).toBe(screen.getByRole("heading", { level: 1 })); // reached by navigation
    const items = screen.getAllByTestId("record-item");
    expect(items.map((i) => i.getAttribute("data-outcome"))).toEqual(["correctWithVisualHelp", "correctAfterFeedback", "correctFirst"]);
    // The fake serves 3 + 5 every time, so the second and third questions are repeats of the first.
    expect(screen.getAllByTestId("record-tag").map((t) => t.textContent)).toEqual(["Visuell hjelp", "Gjentatt oppgave", "Gjentatt oppgave"]);
    expect(screen.getByTestId("record-repeats").textContent).toBe("2 av dem var en oppgave du hadde hatt før.");
    const summary = screen.getByTestId("record-summary").textContent ?? "";
    expect(summary).toContain("3 oppgaver:");
    expect(summary).not.toMatch(/%|poeng|score/i);
    expect(screen.getByTestId("storage-note").textContent).toBe("Arbeidet ditt lagres bare i denne nettleseren.");
    expect(screen.getByTestId("record-page").textContent).not.toContain("numbers.addition-within-20");

    // The list opens, and stays open across a language switch.
    await user.click(screen.getByTestId("progress-questions"));
    const details = screen.getByTestId("progress-questions").closest("details")!;
    expect(details.open).toBe(true);
    await user.click(screen.getByTestId("lang-en"));
    expect(screen.getByTestId("skill-name").textContent).toBe("Addition within 20");
    expect(screen.getAllByTestId("record-item")[1]?.textContent).toContain("Correct after feedback");
    expect(screen.getByTestId("progress-questions").closest("details")!.open).toBe(true);

    // Reload: a fresh app on the same storage shows the same record.
    render(<App api={createFakeApi()} initialPath="/record" />);
    await waitFor(() => expect(screen.getAllByTestId("record-item").length).toBeGreaterThanOrEqual(6));
  });

  it("shows each question's date, answers, and outcome, and the repeat sentence and tag", async () => {
    openRecord(withRepeats());
    await screen.findByTestId("skill-name");
    expect(screen.getByTestId("record-summary").textContent).toBe("3 questions: 3 correct on first response, no help");
    expect(screen.getByTestId("record-repeats").textContent).toBe("1 of them repeated a question you had already had.");
    const [newest, , oldest] = screen.getAllByTestId("record-item");
    expect(newest!.textContent).toContain("3 + 7");
    expect(within(newest!).getAllByTestId("record-tag").map((t) => t.textContent)).toEqual(["Repeated question"]);
    expect(newest!.textContent).toContain(formatDate("en", at(3)));
    expect(newest!.textContent).toContain("Answers: 10");
    expect(within(oldest!).queryAllByTestId("record-tag")).toHaveLength(0);
  });

  it("lists a question whose answer was shown but never given with its reveal tag", async () => {
    openRecord([delivery({ startedAt: at(1), events: [{ type: "support", kind: "lesson-reveal" }, { type: "ended" }] })]);
    const item = await screen.findByTestId("record-item");
    expect(item.getAttribute("data-outcome")).toBe("unfinished");
    expect(within(item).getAllByTestId("record-tag").map((t) => t.textContent)).toEqual(["Answer shown in the lesson"]);
  });

  it("puts a definition the content no longer has under Other practice, last", async () => {
    openRecord([...unknownDefinition().map((d) => ({ ...d, startedAt: at(9) })), delivery({ startedAt: at(1), events: [correct(8)] })]);
    await waitFor(() => expect(screen.getAllByTestId("skill-name")).toHaveLength(2));
    expect(screen.getAllByTestId("skill-name").map((h) => h.textContent)).toEqual(["Addition within 20", "Other practice"]);
    expect(screen.getAllByTestId("record-item")[1]!.textContent).toContain("2 + 2");
  });

  it("keeps every question under Other practice and says why when the skills cannot be loaded", async () => {
    openRecord(withRepeats(), { api: createFakeApi({ skillsFail: true }) });
    expect((await screen.findByTestId("progress-unavailable")).textContent).toBe("Skill names could not be loaded just now. Your work is all here.");
    expect(screen.getAllByTestId("skill-name").map((h) => h.textContent)).toEqual(["Other practice"]);
    expect(screen.getAllByTestId("record-item")).toHaveLength(3);
  });

  it("says there is no work yet and points to the lessons", async () => {
    const user = openRecord([]);
    const empty = await screen.findByTestId("record-empty");
    expect(empty.textContent).toContain("No questions yet.");
    await user.click(within(empty).getByRole("link", { name: "Go to the lessons" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Lessons" })).toBeTruthy();
  });

  it("offers to continue the question in progress, which practice resumes", async () => {
    window.localStorage.clear();
    render(<App api={createFakeApi({ pairs: { "numbers.addition.within-10": [3, 5] } })} initialPath={practicePath} />);
    const user = userEvent.setup();
    await screen.findByTestId("prompt");
    await user.type(screen.getByTestId("answer"), "7");
    await user.click(screen.getByText("Mitt arbeid"));
    const item = await screen.findByTestId("record-item");
    expect(item.getAttribute("data-outcome")).toBe("unfinished");
    await user.click(within(item).getByTestId("record-continue"));
    expect((await screen.findByTestId("answer")).getAttribute("value") ?? (screen.getByTestId("answer") as HTMLInputElement).value).toBe("7");
    expect(screen.getByTestId("prompt").getAttribute("aria-label")).toContain("3");
  });

  it("lists a viewed lesson under every skill it teaches, with its title, count, and last date, and the note once", async () => {
    const lessonViews = [
      { lessonId: "number-bonds-to-ten", language: "nb", at: at(2) },
      { lessonId: "number-bonds-to-ten", language: "en", at: at(5) },
    ];
    const user = openRecord([delivery({ startedAt: at(1), events: [correct(8)] })], { language: "nb", lessonViews });
    await waitFor(() => expect(screen.getAllByTestId("skill-name")).toHaveLength(2));
    // The lesson teaches both skills, so its latest view is the latest activity of both; on a tie the practised skill stays first.
    expect(screen.getAllByTestId("skill-name").map((h) => h.textContent)).toEqual(["Addisjon opp til 20", "Tiervenner"]);
    const lines = screen.getAllByTestId("lesson-viewed").map((l) => l.textContent);
    expect(lines).toEqual([`Tiervenner: vist 2 ganger, sist ${formatDate("nb", at(5))}`, `Tiervenner: vist 2 ganger, sist ${formatDate("nb", at(5))}`]);
    expect(screen.getAllByTestId("lesson-view-note").map((n) => n.textContent)).toEqual(["At en leksjon er vist, betyr at du åpnet den, ikke at du har forstått den."]);
    expect(screen.getByTestId("record-no-practice").textContent).toBe("Ingen oppgaver øvd ennå.");
    expect(screen.getAllByTestId("record-summary")).toHaveLength(1);

    await user.click(screen.getByTestId("lang-en"));
    expect(screen.getAllByTestId("lesson-viewed")[0]!.textContent).toBe(`Number bonds to ten: viewed 2 times, last on ${formatDate("en", at(5))}`);
    expect(screen.getByTestId("lesson-view-note").textContent).toBe("A view shows that you opened the lesson, not that you understood it.");
  });

  it("says viewed once for a single view, and shows a skill with views only", async () => {
    openRecord([], { lessonViews: [{ lessonId: "number-bonds-to-ten", language: "en", at: at(3) }] });
    await waitFor(() => expect(screen.getAllByTestId("skill-name")).toHaveLength(2));
    expect(screen.getAllByTestId("lesson-viewed")[0]!.textContent).toBe(`Number bonds to ten: viewed once, on ${formatDate("en", at(3))}`);
    expect(screen.queryByTestId("record-empty")).toBeNull();
    expect(screen.getAllByTestId("record-no-practice")).toHaveLength(2);
  });

  it("leaves the history out, with the note, when the lessons cannot be loaded", async () => {
    openRecord([delivery({ startedAt: at(1), events: [correct(8)] })], { api: createFakeApi({ lessonsFail: true }), lessonViews: [{ lessonId: "number-bonds-to-ten", language: "en", at: at(3) }] });
    expect((await screen.findByTestId("history-unavailable")).textContent).toBe("Your lesson history could not be loaded just now. It is still kept.");
    expect(screen.getAllByTestId("skill-name").map((h) => h.textContent)).toEqual(["Addition within 20"]);
    expect(screen.queryByTestId("progress-unavailable")).toBeNull();
    expect(screen.queryAllByTestId("lesson-viewed")).toHaveLength(0);
  });

  it("continues practice and says the work is not being kept when storage is unavailable", async () => {
    render(<App api={createFakeApi()} initialPath={practicePath} storage={brokenStorage()} />);
    await screen.findByTestId("prompt");
    expect(screen.getByTestId("storage-note").textContent).toBe("Arbeidet ditt blir ikke lagret i denne nettleseren.");
    const user = userEvent.setup();
    await user.type(screen.getByTestId("answer"), "8");
    await user.click(screen.getByTestId("check"));
    expect((await screen.findByTestId("result")).getAttribute("data-status")).toBe("correct");
  });

  it("asks for confirmation before clearing and then empties the record", async () => {
    const user = await practiseThree();
    await user.click(screen.getByText("Mitt arbeid"));
    await screen.findByTestId("skill-name");
    await user.click(screen.getByTestId("clear"));
    expect(screen.getAllByTestId("record-item")).toHaveLength(3);
    await user.click(screen.getByTestId("confirm-clear"));
    expect(screen.getByTestId("record-empty")).toBeTruthy();
    expect(JSON.parse(window.localStorage.getItem("mathkx.guest.v1") ?? "{}").value.deliveries).toEqual([]);
  });
});
