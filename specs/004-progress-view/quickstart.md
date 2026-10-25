# Quickstart: running and proving the progress view, lesson history, and replay

Phase 1 output for [plan.md](plan.md). How to run the feature once implemented and what to expect. Implementation steps belong in `tasks.md`.

## Prerequisites

As [spec 003's quickstart](../003-lesson-rendering/quickstart.md): .NET SDK 10.0, Node.js 22 and npm (at the root and in `src/web`), and the Playwright browsers for the end-to-end checks.

## Run

```bash
npm ci
```

```bash
dotnet run --project src/backend/MathKX.Api
```

```bash
cd src/web && npm ci && npm run dev
```

## Test

```bash
npm test
```

Expected (root): the validator tests, now including the skill-name cases in [contracts/skill-name.md](contracts/skill-name.md); `npm run validate` passes with all nine skill files named.

```bash
dotnet test src/backend/MathKX.slnx
```

Expected, in addition to specs 002 and 003: skill names loaded, definitions per skill, and the contract tests in [contracts/api.md](contracts/api.md).

```bash
cd src/web && npm test
```

Expected: `progress.test.ts`, `record-page.test.tsx`, `lesson-views.test.tsx`, `replay.test.tsx`, `progress-wording.test.tsx` (the no-percentage scan), dictionary parity, and literals.

The end-to-end checks need the build order of spec 003's quickstart (web build, then `dotnet build src/backend/MathKX.Api`, then `npm run e2e`). Expected: earlier checks plus `e2e/progress.spec.ts` on the desktop and iPad projects. Its checks are:
1. the counts;
2. the lesson history;
3. replay;
4. the keyboard, with 4b checking the focus check itself;
5. 200 percent zoom (desktop only);
6. 44-pixel targets (iPad only);
7. an old record and the service unreachable.

## Scenario 1: progress per skill (User Story 1)

Start with "Clear my work". Practise addition from the lesson's practice entry: answer one question right at once, one after a wrong answer, one with visual help, and leave one unanswered. Open "My work": under "Addition within 20" the sentence counts four questions with those outcomes (spec 002's wording); the unanswered one shows "Continue". The lesson page you started from was shown, so it counts as a view: "Number bonds to ten" is listed too, with "No questions practised yet." and the lesson line. Get another question, and if it repeats an earlier one, the skill says "1 of them repeated a question you had already had." and the question carries "Repeated question". Switch to Norsk: the heading reads the Norwegian name; no skill ID, percentage, or score appears in either language.

## Scenario 2: lesson history (User Story 2)

From a cleared record, open "Number bonds to ten" from the lesson list (one view). Start a question, choose "To the lesson" for a question whose answer the lesson does not show (one view), then for a question it does show (such as `3 + 7` or `4 + 6`) choose "To the lesson" and "Cancel" at the notice (no view). "My work" shows "Number bonds to ten: viewed 2 times, last on {today}" under both "Number bonds to ten" and "Addition within 20", with the note that a view is not understanding. Reload the lesson page and switch language while on it: one more view, not two.

## Scenario 3: replay (User Story 3)

In "My work", open "Show the questions" and follow a correctly answered question: the same expression, the answers in order with their feedback, the outcome and tags, and the completed equation. Follow the unanswered one: the expression and "Continue", no answer field and no sum anywhere (check the page's text and the network panel: one request to `/api/instances/…`, nothing to `…/steps/…` or `/api/validations`). Go back: "My work" shows the same counts as before.

## Scenario 4: an old record and missing content (Edge cases)

With a record written before this feature (no `lessonViews`), "My work" shows every delivery under its skill and an empty lesson history. With the app already loaded, stop the service and open "My work" from the header (a full reload needs the service for the app itself): the record is all there under "Other practice" with "Skill names could not be loaded just now. Your work is all here.", and a replay shows the recorded expression and work with "This question can no longer be shown as it was asked. Here is what was recorded."

## CI

`build-and-test.yml` runs everything above on each pull request, with no new job; `deploy.yml` deploys `main`. Measured on PR 41 (2026-10-25, head `13fae99`, with every spec 004 check but end-to-end check 7):
- **Build and test**: 2 min 29 s of wall time. The backend (33 s) and web (42 s) jobs run in parallel, then end to end (1 min 39 s).
- **Content validation**: 37 s alongside.

The spec SC-006 limit is 10 minutes.

**Run by hand** on 2026-10-25 against the built app and service on `localhost:5080`, in the browser pane of the Claude desktop app. Scenarios 1 to 3 pass as written; scenario 4 passes with the service stopped after the app had loaded. The old-record half of scenario 4 is covered by end-to-end check 7 and by the production run in `docs/reviews/walkthroughs/2026-10-25-progress-view-production.md`, which loaded a 143-question record from before this feature intact.
