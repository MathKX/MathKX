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

Expected: `progress.test.ts`, `record-page.test.tsx`, `lesson-views.test.tsx`, `replay.test.tsx`, dictionary parity, literals, and the no-percentage scan.

The end-to-end checks need the build order of spec 003's quickstart (web build, then `dotnet build src/backend/MathKX.Api`, then `npm run e2e`). Expected: earlier checks plus `e2e/progress.spec.ts` on the desktop and iPad projects.

## Scenario 1: progress per skill (User Story 1)

Start with "Clear my work". Practise addition: answer one question right at once, one after a wrong answer, one with visual help, and leave one unanswered. Open "My work": under "Addition within 20" the sentence counts four questions with those outcomes (spec 002's wording); the unanswered one shows "Continue". Get another question, and if it repeats an earlier one, the skill says "1 of them repeated a question you had already had" and the question carries "Repeated question". Switch to Norsk: the heading reads the Norwegian name; no skill ID, percentage, or score appears in either language.

## Scenario 2: lesson history (User Story 2)

Open "Number bonds to ten" from the lesson list. Start a question, choose "To the lesson" for a question whose answer the lesson does not show (one view), then for `3 + 7` choose "To the lesson" and "Cancel" at the notice (no view). "My work" shows "Number bonds to ten: viewed 2 times, last on {today}" under both "Number bonds to ten" and "Addition within 20", with the note that a view is not understanding. Reload the lesson page and switch language while on it: one more view, not two.

## Scenario 3: replay (User Story 3)

In "My work", open "Show the questions" and follow a correctly answered question: the same expression, the answers in order with their feedback, the outcome and tags, and the completed equation. Follow the unanswered one: the expression and "Continue", no answer field and no sum anywhere (check the page's text and the network panel: one request to `/api/instances/…`, nothing to `…/steps/…` or `/api/validations`). Go back: "My work" shows the same counts as before.

## Scenario 4: an old record and missing content (Edge cases)

With a record written before this feature (no `lessonViews`), "My work" shows every delivery under its skill and an empty lesson history. Stop the service and open "My work": the record is all there under "Other practice" with the content-unavailable message; a replay shows the recorded expression with `replay.unavailable`.

## CI

`build-and-test.yml` runs everything above on each pull request, with no new job; `deploy.yml` deploys `main`. Measured CI time is recorded here at the end of implementation (spec SC-006, limit 10 minutes).
