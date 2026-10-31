# Quickstart: running and proving repeat avoidance, "Repeat this question", and sessions

Phase 1 output for [plan.md](plan.md). How to run the feature once implemented and what to expect. Implementation steps belong in `tasks.md`.

## Prerequisites

As [spec 004's quickstart](../004-progress-view/quickstart.md): .NET SDK 10.0, Node.js 22 and npm (at the root and in `src/web`), and the Playwright browsers.

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
dotnet test src/backend/MathKX.slnx
```

Expected, in addition to specs 002 to 004: `QuestionPoolTests` and the pool contract tests in [contracts/pool.md](contracts/pool.md).

```bash
cd src/web && npm test
```

Expected: `selection.test.ts`, `repeat.test.tsx`, `session.test.tsx`, the extended `progress.test.ts`, `record-page.test.tsx`, `replay.test.tsx`, and `progress-wording.test.tsx`, dictionary parity, and literals.

The end-to-end checks need spec 003's build order (web build, then `dotnet build src/backend/MathKX.Api`, then `npm run e2e`). Expected: earlier checks plus `e2e/repeats.spec.ts` on the desktop and iPad projects.

## Scenario 1: no repeat by chance (User Story 1)

1. Clear your work, then practise within ten and press "Another question" twenty times.
2. Note each question: none of them equals, in either order, any of the eight before it.
3. Check the browser's network panel: each question took one or two requests to `/api/instances/…`, and at most one request went to `/api/definitions/…/pool`.
4. Reload and continue: the questions still avoid the last eight.

## Scenario 2: an exhausted pool (User Story 1)

The pilot pools do not run out within eight questions, so this scenario uses the component tests' scripted pool of five questions. While all five are among the last eight, each question repeats, says "This variation has no other questions right now, so this one repeats.", and is tagged "Repeated question" in "My work". As soon as one of the five leaves the window, the next question is that one, without the notice.

## Scenario 3: repeating on purpose (User Story 2)

1. Answer a question wrongly with visual help, then correctly.
2. Choose "Repeat this question": the same question appears with an empty field and help closed. Answer it correctly at once.
3. "My work" counts both. The second is "Correct on first response, no help", tagged "Repeated on request". The skill keeps spec 004's sentence, "1 of them repeated a question you had already had.", and adds "1 of these you repeated on purpose."
4. In "My work", open the first question's replay and choose "Repeat this question": practice continues with that question again.

## Scenario 4: finishing a session (User Story 3)

1. Answer three questions, take a lesson detour, and type a draft on a fourth.
2. Choose "Finish practice": "Your practice session" counts 4 questions, one unfinished, with no percentage or score.
3. "Practise again" brings back the fourth question with its draft. Answer it correctly and finish again: the new summary counts it in a session of its own, as "1 question: 1 correct with help", because the lesson detour counts as help. (If the fourth question's sum is 10, the lesson asks first; cancel there so the answer stays unshown.)
4. Choose "Practise again" once more: since the last session ended on an answered question, a new question appears, not the finished one.

## CI

`build-and-test.yml` runs everything above on each pull request, with no new job; `deploy.yml` deploys `main`. Measured on PR 48 (2026-10-31, head `db9a5f6`, with every spec 005 check):
- **Build and test**: 3 min 1 s of wall time. The backend (33 s) and web (50 s) jobs run in parallel, then end to end (1 min 53 s).
- **Content validation**: 29 s alongside.

The spec SC-006 limit is 10 minutes.

**Run by hand** on 2026-10-31 against the built app and service on `localhost:5080`, in the browser pane of the Claude desktop app, in English:
- **Scenario 1** passes: 21 questions with none repeating one of the eight before it, 29 instance requests, and one pool request. After a reload, the question in progress came back, and eight more questions still avoided the last eight.
- **Scenario 2** is covered by the component tests in `avoidance.test.tsx` ("an exhausted pool") and by end-to-end check 4, which serves a one-question pool.
- **Scenarios 3 and 4** pass as written above.
