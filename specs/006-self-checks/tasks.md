# Tasks: Self-Checks ("Check My Understanding")

**Input**: Design documents from `specs/006-self-checks/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md)

**Tests**: Included. The specification requires every requirement to be covered by automated tests in CI (FR-024, SC-001 to SC-004, SC-007), and the constitution requires behaviour to ship with tests. Write each test before the code it covers, and confirm it fails first. The test suites are:
- **Content check**: Node's test runner in `tools/validate-content.test.mjs`.
- **Backend**: xUnit under `src/backend/`.
- **Web**: vitest under `src/web/tests/`.
- **End to end**: Playwright under `src/web/e2e/`.

**Organization**: Tasks are grouped by user story in priority order. The foundational phase carries everything the stories share:
- the pilot check file with its schema;
- the loader and the three endpoints;
- the `checkRuns` record field;
- the practice workspace, extracted from `ExerciseShell`.

User Story 3's cross-file content rules and domain tests come after the learner stories, because the pilot file already exists and passes the schema.

**Deployment**: every push to `main` deploys to production (`.github/workflows/deploy.yml`). Each merge below must be honest on its own:
- **Phases 1–2** (Setup, Foundational): the endpoints exist, but nothing a learner sees changes. The workspace extraction is guarded by the unchanged practice tests. This may merge alone.
- **Phases 3–4** (US1 and US2) **merge together**. The start screen's policy promises the switch to supported practice (DL-028), so "Check my understanding" must not be offered without it.
- **Phase 5** (US3, content rules and domain tests): may merge any time after Phase 2.
- **Phase 6** (US4, "My work" and resuming), **Phase 7** (US5), and **Phase 8** (Polish): each may merge alone. Until Phase 6, checks are recorded but not listed in "My work". That is incomplete, not misleading: nothing claims they are listed, and "Clear my work" already clears them.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story the task belongs to (US1–US5)
- Every task names the exact file(s) it touches

## Path Conventions

Content under `content/` and `schemas/`, the content check under `tools/`, the backend under `src/backend/` (solution `MathKX.slnx`), and the learner app under `src/web/`. See plan.md "Project Structure". Contract references are to `specs/006-self-checks/contracts/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Test fixtures every story reads.

- [ ] T001 [P] Extend `src/web/tests/fakeApi.ts` and `src/web/tests/records.ts`:
  - **The fake's checks**: `getChecks()`, `getCheck(id, version)`, and `getAnswer(identity)`, each logged (`getChecks`, `getCheck …`, `getAnswer …`) like the other calls. By default the fake serves one check shaped like the pilot (`numbers.addition.check-within-20`, version 1, the four identities of `contracts/api.md`). Its `getInstance` resolves those seeds to `7 + 3`, `5 + 4`, `8 + 5`, and `9 + 4`, and its `getAnswer` returns their operands and sums, as `contracts/api.md` shapes the response.
  - **New `FakeOptions`**: `checks` (replace the list; `[]` for none), `checksFail` (reject `getChecks`), `answerFails` (reject `getAnswer`), `validateFailsOnce` (reject the next `validate`), and `resolveDiffers` (a check identity resolves to other operands, in both `getInstance` and `getAnswer`, for the "explanation unavailable" case).
  - **`records.ts`**: a builder `checkRun(spec)` that returns a `CheckRun` from per-position scripts. A script is `"correct"`, `"wrong"`, `"skipped"`, `"guidance"`, `"reached"` (a delivery that is not answered), a list of supported events, or `null` (unreached), with `position`, `switchAt`, `finishedAt`, and `endedAt`. The deliveries use the four pilot questions.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The pilot check exists as content, the service serves checks and answers, the app can fetch them, the record has `checkRuns`, and the practice workspace can be reused. Every story reads these.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Tests

- [ ] T002 [P] Add the `contracts/api.md` contract tests to `src/backend/MathKX.Api.Tests/ContractTests.cs`:
  - **`GET /api/checks`**: the pilot's shape in full, with no key `answer`, `sum`, `a`, or `b` anywhere.
  - **`GET /api/checks/{id}/{version}`**: the pilot; `404 unknown-check` for an unknown ID and for an unknown version.
  - **`GET …/answer`**: `7 + 3` → 10, `5 + 4` → 9, `8 + 5` → 13, and `9 + 4` → 13 for the four pilot identities, operands included; 8 for `numbers.addition.four-plus-four/1/-`; `404 unknown-definition`; `400 invalid-seed`.
  - **Health**: `/api/health` reports `checks: 1`.

  Add `/api/checks` to the unsolicited-response `[InlineData]` list.
- [ ] T003 [P] Extend `src/backend/MathKX.Domain.Tests/Content/ContentCatalogTests.cs`:
  - the repository content loads one check, `numbers.addition.check-within-20@1`, with its skill, both titles, both scopes, and four questions in order;
  - `LatestChecks()` returns the newest version per ID; test it with a temp copy that adds version 2;
  - a duplicate `id@version` fails the load, naming the second file.
- [ ] T004 [P] Extend `tools/validate-content.test.mjs`:
  - the repository content passes, and the summary line includes `1 check(s)`;
  - a file naming `self-check.pilot.schema.json` is dispatched to that schema, so a missing `title.en`, an empty `questions`, eleven questions, and a seed `"01"` each fail as schema violations naming the path;
  - an unknown-schema error lists the new schema;
  - a lesson with a `check` field fails with the new message of `contracts/check-content.md`.

  Update every existing assertion on the summary line.
- [ ] T005 [P] Extend `src/web/tests/lesson-views.test.tsx`'s old-record test: a record without `checkRuns` hydrates with `checkRuns: []`, and its deliveries, lesson views, and session are intact. "Clear my work" empties `checkRuns`.

### Implementation

- [ ] T006 [P] Create `schemas/self-check.pilot.schema.json` per `contracts/check-content.md` "The schema" (JSON Schema 2020-12, `additionalProperties: false` throughout, with a description in the style of `exercise-definition.pilot.schema.json`).
- [ ] T007 Create `content/checks/numbers/addition-within-20.json`, the pilot check, exactly as in `contracts/check-content.md` "The file".
- [ ] T008 Register the kind in the content check:
  - **`tools/lib/files.mjs`**: add `check: "self-check.pilot.schema.json"` to `SCHEMAS`, and change the lesson `check` hint to the new message.
  - **`tools/validate-content.mjs`**: count the `check` entries.
  - **`tools/lib/diagnostics.mjs`**: the `summary` line includes `<n> check(s)` after the definitions.

  T004 passes, except for the cross-file rules, which come in T042.
- [ ] T009 Load checks in the backend:
  - **`src/backend/MathKX.Domain/Content/Records.cs`**: add `SelfCheck(Id, Version, Skill, Localized Title, Localized Scope, IReadOnlyList<CheckQuestion> Questions)` with `Key`, and `CheckQuestion(Definition, Version, string? Seed)` with `Key`.
  - **`src/backend/MathKX.Domain/Content/ContentCatalog.cs`**: add `Checks` (by `id@version`) and `LatestChecks()` (the newest version of each ID, ordered by ID). Add the constructor parameter, and update every caller and test helper that builds a catalog.
  - **`src/backend/MathKX.Content/ContentLoader.cs`**: a `self-check.pilot.schema.json` case that deserializes into `SelfCheck` and adds it with the duplicate check.

  T003 passes.
- [ ] T010 Serve checks and answers in `src/backend/MathKX.Api`:
  - **`Endpoints/ChecksEndpoints.cs`** (new): `GET /api/checks` and `GET /api/checks/{id}/{version:int}`, with `Problems.NotFound("unknown-check", …)`.
  - **`Endpoints/InstancesEndpoints.cs`**: `GET /api/instances/{definitionId}/{version:int}/{seed}/answer`. It resolves as `Resolve` does and returns `AnswerDto` with the resolved operands and the instance's validation answer, from the resolved `Instance`'s private validation data; do not add the operands to compute it. It has the same errors as `Resolve`.
  - **`Dto/Dtos.cs`**: `CheckDto`, `CheckQuestionDto`, and `AnswerDto`.
  - **`Program.cs`**: map the endpoints; health gains `checks = catalog.Checks.Count`.
  - **`specs/002-practice-flow/contracts/api.md`**: extend the private-data sentence with a link to spec 006's third exception.

  T002 passes.
- [ ] T011 [P] Extend `src/backend/scripts/smoke-published.sh`: `GET /api/checks` from the published service lists `numbers.addition.check-within-20` and contains no `"sum"`, and `GET /api/instances/numbers.addition.within-10/1/22/answer` gives 10.
- [ ] T012 [P] In `src/web/src/api/types.ts`, add `CheckDto`, `CheckQuestionDto`, and `AnswerDto`, and add `getChecks()`, `getCheck(id, version)`, and `getAnswer(identity)` to `PracticeApi`. Implement them in `src/web/src/api/client.ts`; the answer route uses `-` for a fixed task, as `getStep` does.
- [ ] T013 [P] Add the record field:
  - **`src/web/src/state/checks.ts`** (new): the `CheckRun` and `CheckResume` types of `data-model.md`.
  - **`src/web/src/state/observations.ts`**: widen `Delivery.purpose` to `"practice" | "check"`.
  - **`src/web/src/state/store.tsx`**: add `checkRuns: CheckRun[]` to `PersistedState` and `initialPersisted`. Default a missing field to `[]` in the reducer initializer and in `hydrate`, and reset it in `clear`. Leave `SCHEMA_VERSION` unchanged.

  T005 passes.
- [ ] T014 In `src/web/src/state/store.tsx`, factor the "a step is recorded only when it is shown" rule out of the `helpStep` and `explanationStep` cases into one pure helper. It takes the question's screen state, its delivery, the presenting flag, and a step, and returns the new state and delivery, or nothing when the step is not shown. Practice's cases call it; behaviour is unchanged, and every existing web test passes.
- [ ] T015 Extract `src/web/src/components/QuestionWorkspace.tsx` from `src/web/src/components/ExerciseShell.tsx` (research R8):
  - **The workspace**: the prompt with its focus rule, the answer form with "Check answer" and "Show visual help", the help panel, the result region with `Feedback` and the unreachable notice, the explanation, and the lesson link.
  - **Props**: a `QuestionController` that supplies the instance, draft, open panels, steps, result, checking flag, notice, and lesson link target, and handles the draft, submit, help, and explanation calls. The props also take a `controls` slot rendered where practice's controls are.
  - **`ExerciseShell`**: becomes the workspace, driven by a store-bound controller, with practice's controls in the slot. Every `data-testid` and focus behaviour is unchanged.

  All existing unit and end-to-end tests pass without edits.

**Checkpoint**: `npm test` (root and `src/web`), `dotnet test`, and the end-to-end checks pass. Nothing a learner sees changes, so this may merge.

---

## Phase 3: User Story 1 - A learner checks their understanding on their own and sees an honest summary (Priority: P1) 🎯 MVP

**Goal**: "Check my understanding" leads to the start screen with the policy, then the four questions answered on their own with no help or result, then a three-group summary with answers, explanations, "Practise more", and "Take a new check".

**Independent Test**: 2 correct, 1 wrong, and 1 skipped give 2 correct on your own, 1 worth revisiting, and 1 skipped, in both languages. No help, explanation, lesson, or result is shown, announced, or requested before the summary (spec User Story 1).

### Tests for User Story 1

- [ ] T016 [P] [US1] Add `src/web/tests/checks.test.ts` for `contracts/summary.md` "The grouping" and data-model "Answered", over `checkRun` fixtures with no switch:
  - **Answered**: membership reads only the deliveries' events; a finished run's last question is in its group, with no later delivery.
  - **The matrix**: all 81 combinations of correct, wrong, and skipped on four positions put each position in exactly one group, with "Worth revisiting" only on the wrong ones (DL-036).
  - **Input guidance**: a `"guidance"` position followed by a save is grouped by the save.
  - **Purity**: `summarizeRun` reads only the run (deep-frozen input).
- [ ] T017 [P] [US1] Add `src/web/tests/check-run.test.tsx` with the fake API and `App`, in English and in Norwegian where marked:
  - **Start screen** (both languages): the title, scope, "4 questions", the five policy sentences, and "Start the check". An unknown check or a failed list shows `check.unavailable`.
  - **Starting**: creates one run with a copy of the four identities, replaces the address with `/checks/{checkId}/{runId}`, and shows "Question 1 of 4" with `7 + 3`, focused on the prompt.
  - **Absences in the independent part**: no `toggle-help`, `toggle-explanation`, `to-lesson`, `result-region`, `another`, `repeat-question`, `easier`, `harder`, or `more-like-this`. No element with the text of any `status`, `outcome`, or `feedback` dictionary entry except input guidance. In the fake's log, no `getStep`, `getAnswer`, `getLessonContent`, or `getVisualSteps`, through all four questions.
  - **Saving**: a correct and an incorrect save each record one submission and move on with no result in the DOM. `4+4` shows the guidance, records `input-guidance`, and stays. With `validateFailsOnce`, `check.unsaved` shows, nothing is recorded, and the draft stays. The save button is disabled while a save is under way.
  - **Skipping**: records `skipped` and moves on.
  - **The end**: after question 4, the run has `finishedAt` and the summary shows, with focus on its heading.
  - **Separation**: a practice question with a draft and help open before the check is still resumable with both afterwards, and practice's `deliveries` and `session` are unchanged by the check.
- [ ] T018 [P] [US1] Add `src/web/tests/check-summary.test.tsx`:
  - **Groups**: the scripted run of quickstart scenario 1 shows the counts, its questions, "Your answer"/"Correct answer", and the tag "Worth revisiting" once.
  - **Answer requests**: `getAnswer` is called only for the wrong and the skipped question. With `answerFails`, `check.answerUnavailable` shows and nothing reads as wrong.
  - **Explanations**: opening one shows its steps and dispatches nothing; the record is deep-equal before and after. With `resolveDiffers`, `check.explanationUnavailable` replaces it, and the wrong and skipped questions show `check.answerUnavailable`, never the answer `getAnswer` returned for the other operands.
  - **Wording**: no digit followed by `/`, no `%`, and none of the wording scan's words.
  - **Actions**: "Practise more" (with its note) to `/practice/numbers.addition-within-20`, and "Take a new check" to the start screen.
- [ ] T019 [P] [US1] Add `src/web/e2e/checks.spec.ts` with check 1 (quickstart scenario 1, steps 1–7), on both projects:
  - it records every request URL from "Start the check" to the summary, and asserts that none is under `/steps/`, `/answer`, `/content/`, or `/api/visuals`;
  - `getByRole` and the accessibility snapshot find no result text before the summary.

  Add the Norwegian pass (step 8) as a second test.

### Implementation for User Story 1

- [ ] T020 [US1] In `src/web/src/state/checks.ts`, add `isAnswered(delivery)` (a submission or `skipped`), `isUnfinished(run)`, `partOf(run, position)`, and `summarizeRun(run)` per `contracts/summary.md`, all pure. The supported and not-answered parts may stay empty until T034 and T048; T016 passes.
- [ ] T021 [US1] Add the check actions to `StoreApi` in `src/web/src/state/store.tsx` (`contracts/check-run.md`):
  - **`startCheck(checkId)`**: fetches the newest version with `getChecks`, ends an unfinished run of the same skill with `endedAt`, creates the run, and resolves to its ID.
  - **`openRun(runId)`**: marks the check view as presenting and loads the instance at the run's position, restoring `resume.draft`.
  - **`setCheckDraft`**, **`saveCheckAnswer`**, and **`skipCheckQuestion`**: as in the contract's independent part.
  - **`leaveCheck()`**: on unmount; ends presenting and keeps `resume`.

  The check screen state is a non-persisted `check` field of `State`, left out by `persistedOf`. The check has its own load token, so a check load never supersedes practice's or the reverse. Recording uses `recordEvent` on the run's delivery; a save's response never enters `check`.
- [ ] T022 [P] [US1] Create `src/web/src/components/IndependentQuestion.tsx` per `contracts/check-run.md` "Independent part". It imports only the prompt, `Textfield`, `Button`, and the dictionaries; it never imports `StepPanel`, `Feedback`, `QuestionWorkspace`, or `Link`. Input guidance is rendered with `translateCode(lang, "feedback", code, { text })`.
- [ ] T023 [P] [US1] Create `src/web/src/pages/CheckStartPage.tsx` per `contracts/check-run.md` "The start screen". "Start the check" calls `store.startCheck` and replaces the address with the run's.
- [ ] T024 [US1] Create `src/web/src/pages/CheckRunPage.tsx`. It calls `openRun` on mount and `leaveCheck` on unmount, and shows the independent question, the summary of a run that is over, or `check.runNotFound`. Focus moves to the prompt on each new question, and to the summary heading at the end.
- [ ] T025 [US1] Create `src/web/src/pages/CheckSummary.tsx` per `contracts/summary.md` "The summary":
  - the check's title from `getCheck`;
  - answers from the record, or from `getAnswer` for questions without a correct submission, shown only when the response's operands equal the recorded ones;
  - one `getInstance` per question to confirm its operands;
  - explanations through a local `StepPanel` fed by `api.getStep`, with no store call.
- [ ] T026 [US1] Add the routes:
  - **`src/web/src/router.tsx`**: `{ name: "check"; checkId }` for `/checks/{checkId}` and `{ name: "checkRun"; checkId; runId }` for `/checks/{checkId}/{runId}`.
  - **`src/web/src/App.tsx`**: render `CheckStartPage` and `CheckRunPage` (keyed by run ID).

  Extend `src/web/tests/app.test.tsx`'s route table.
- [ ] T027 [US1] Create `src/web/src/components/CheckEntry.tsx`: it loads `getChecks` once and shows one link per check of the given skill (`contracts/check-run.md` "Entry"), or nothing on failure. Place it:
  - **`src/web/src/pages/LessonPage.tsx`**: below the practice entries, for the lesson's skills;
  - **`src/web/src/pages/PracticePage.tsx`**: below "Finish practice".
- [ ] T028 [P] [US1] Add the whole `check` section of `contracts/check-run.md` "Texts" and `contracts/summary.md` "Texts" to `src/web/src/i18n/en.ts` and `nb.ts`, with singular keys (`…One`) for `groupCount`, `recordCounts`, and `recordSupported`. The dictionary-parity and literal checks pass.
- [ ] T029 [US1] Make T017–T019 pass against the built app and service on both projects. The spec 002 to 005 end-to-end checks still pass.

**Checkpoint**: quickstart scenario 1 passes. Do not merge before Phase 4: the policy promises the switch.

---

## Phase 4: User Story 2 - A learner who needs help switches to supported practice (Priority: P1)

**Goal**: "I need help" explains the switch, and a confirmed switch makes the current and remaining questions practice: help, feedback, retries, explanation, and the lesson link with spec 003's notice. The summary shows them apart from the three groups.

**Independent Test**: Quickstart scenario 2 gives the independent part 0, 1, and 1, and "Supported practice (from question 3)" with "Correct with visual help" and "Correct after feedback", neither tagged "Worth revisiting" (spec User Story 2).

### Tests for User Story 2

- [ ] T030 [P] [US2] Extend `src/web/tests/checks.test.ts`:
  - with a switch at each of positions 1 to 4 over the 81 independent combinations of the positions before it, positions from `switchAt` are only in `supported`, each with spec 002's `derive` outcome;
  - `revisit` never holds a supported position, including a supported question answered wrongly and never correctly;
  - a switch at position 1 leaves the three groups empty (shown as `check.noIndependent`);
  - **the PR 51 review cases**: a switch, the last question answered, and "See summary" put the last question in `supported` with its outcome. A run ended after a supported question was answered, but before "Next question", keeps that question in `supported` with its outcome, not in `notAnswered`.
- [ ] T031 [P] [US2] Extend `src/web/tests/check-run.test.tsx` for the switch and the supported part:
  - **"I need help"**: opens the dialog with focus on its heading and the position in its body. "Continue without help" and Escape record nothing, leave `switchAt` null, and return focus.
  - **"Switch"**: sets `switchAt` to the current position, keeps the draft, and shows the workspace with the mode line.
  - **Before an answer**: only "Skip".
  - **After an answer**: only "Next question", or "See summary" on question 4.
  - **Never offered**: "Another question", "Repeat this question", "Make it easier", "More challenge", or "More like this".
  - **Recording**: opening help and a help step record on the run's delivery only when shown; retries after feedback work; the explanation after a result records as in practice.
  - **Lesson link**: points to `/lessons/number-bonds-to-ten?from=check`.
  - **No way back**: after the switch, nothing on the screen can undo it.
- [ ] T032 [P] [US2] Extend `src/web/tests/lesson-gate.test.tsx` (spec 003's detour tests) for `?from=check`:
  - **The detour question**: the run's current supported question, with the gate when the lesson discloses its answer.
  - **Recording**: `lesson-opened` or `lesson-reveal` on that check delivery, never on practice's question.
  - **Return**: "Back to your question" goes to the run's address.
  - **Other visits**: without `from=check`, the visit is spec 003's, about practice's current question.
  - **The independent part**: a visit while the run is independent records nothing on the run.
- [ ] T033 [P] [US2] Add check 2 to `src/web/e2e/checks.spec.ts` (quickstart scenario 2), on both projects.

### Implementation for User Story 2

- [ ] T034 [US2] Complete `summarizeRun` in `src/web/src/state/checks.ts` with the `supported` part (answered positions from `switchAt`, spec 002's `derive`). T030 passes.
- [ ] T035 [US2] Add the supported part to the store, `src/web/src/state/store.tsx`:
  - **`switchToSupported()`**: sets `switchAt` to the current position.
  - **A check-bound question controller** for the workspace: submit with retries; help, explanation, and their steps through T014's helper; `resume` kept current, including `result`.
  - **`nextCheckQuestion()`**: advances `position` after a submission; on the last question ("See summary") it sets `finishedAt` without creating a delivery.
  - **`skipCheckQuestion()`**: in the supported part, skips before any submission.
- [ ] T036 [US2] In `src/web/src/pages/CheckRunPage.tsx`, add the switch dialog of `contracts/check-run.md` "The switch" (from `IndependentQuestion`'s "I need help"). For a supported position, render `QuestionWorkspace` with the check controller, the mode line, and the check's controls in its slot.
- [ ] T037 [US2] In `src/web/src/pages/CheckSummary.tsx`, add the supported part: its heading naming `switchAt`, the note, and each question with its outcome label, answers, correct answer, and explanation. Add `check.noIndependent` when `switchAt` is 1.
- [ ] T038 [US2] Wire the lesson detour from a supported check question (research R10):
  - **`src/web/src/pages/LessonPage.tsx`**: read `from=check` like `from=question`. With it, take the detour question from the run the check view last presented, and pass its delivery to `lessonShown`.
  - **`src/web/src/state/store.tsx`**: `lessonShown` and `updateDelivery` find a delivery in `checkRuns` as well as in `deliveries`.
  - **`src/web/src/components/ReturnBanner.tsx`**: "Back to your question" returns to the run's address.

  T031–T033 pass.

**Checkpoint (first visible merge)**: quickstart scenarios 1 and 2 pass, and the spec 002 to 005 end-to-end checks still pass. Phases 3–4 merge together.

---

## Phase 5: User Story 3 - A maintainer defines a self-check as content (Priority: P2)

**Goal**: The content check reports every malformed check with file, field, and problem. The domain tests confirm every check question resolves and is distinct, and pin the pilot. The authoring guide describes it all.

**Independent Test**: The pilot passes; each FR-018 case fails with a message naming the file, the position, and the problem; `dotnet test` pins `7 + 3`, `5 + 4`, `8 + 5`, and `9 + 4` (spec User Story 3).

### Tests for User Story 3

- [ ] T039 [P] [US3] Extend `tools/validate-content.test.mjs` with one temp-copy case per row of `contracts/check-content.md` "The content check". Each asserts the exact diagnostic line, field included:
  - a duplicate identity;
  - an unknown skill;
  - an unknown definition, and an unknown version;
  - another skill's definition;
  - a generated question without a seed, and a fixed one with a seed;
  - a seed of 2^64;
  - the same question listed twice (generated, and fixed).
- [ ] T040 [P] [US3] Add `src/backend/MathKX.Domain.Tests/Content/CheckQuestionsTests.cs` and `src/backend/MathKX.Domain.Tests/Fixtures/checks.pilot.json` for `contracts/check-content.md` "The domain tests" 1–3. Every check in `content/` resolves and is distinct as questions; the pilot resolves to the fixture's operands. Add a temp-copy case where two seeds give the same question, to show the test catches it.
- [ ] T041 [P] [US3] Extend `src/backend/MathKX.Domain.Tests/Content/ContentCatalogTests.cs`: a check naming an unknown skill, an unknown definition, a generated definition without a seed, or a fixed one with a seed fails the load with `ContentLoadException` naming the check's file.

### Implementation for User Story 3

- [ ] T042 [US3] Create `tools/lib/checks.mjs` with `checkChecks(entries, { skills, definitions, diagnostics })` per `contracts/check-content.md`, with seeds compared as `BigInt`. Call it from `tools/validate-content.mjs` after `checkLadders`. T039 passes.
- [ ] T043 [US3] In `src/backend/MathKX.Content/ContentLoader.cs`, check each check's references after the definitions load: the skill exists, each definition exists, and a seed is present exactly when the definition is generated. Fail with `ContentLoadException(<file>, …)`. T040 and T041 pass.
- [ ] T044 [P] [US3] Document checks:
  - **`content/AUTHORING.md`**: a "Self-checks" section with every field, every rule of T042 and T043, finding a seed through `GET /api/definitions/{id}/{version}/pool`, and the pilot as the example.
  - **`content/README.md`**: list `checks/` in the layout and describe it in one paragraph.

**Checkpoint**: quickstart "Automated checks" rows 1 and 2 pass; this phase may merge on its own after Phase 2.

---

## Phase 6: User Story 4 - A learner finds their checks in "My work" and can continue an unfinished one (Priority: P2)

**Goal**: "My work" lists each skill's checks apart from practice, newest first, with counts for runs that are over. An unfinished check survives a reload, a language switch, and a visit elsewhere. A new check ends it, and its unreached questions show as "not answered".

**Independent Test**: Quickstart scenario 3: a reload and "Continue the check" restore question 3 with its draft; a new check ends the old one with "2 not answered"; practice's counts are unchanged (spec User Story 4).

### Tests for User Story 4

- [ ] T045 [P] [US4] Add `src/web/tests/check-record.test.tsx` for `contracts/summary.md` "Checks in 'My work'":
  - **Order**: runs under their skill, newest first.
  - **Counts**: a finished run shows its counts; a switch adds the supported sentence; an ended run adds "not answered".
  - **An unfinished run**: shows only its position and "Continue the check", and no count or group word.
  - **Skills with only checks**: a skill with only check runs is listed with `progress.noPractice`.
  - **Separation**: the practice sentence, repeat sentences, lesson lines, and question list are identical before and after a finished check (compare the rendered text of the practice lines).
  - **Opening a summary**: a run's link opens its summary, which records nothing.
- [ ] T046 [P] [US4] Extend `src/web/tests/check-run.test.tsx` for resuming:
  - **A reload** (new `App` over the same storage) on question 3 restores the question, draft, and part; in the supported part, it also restores the help and explanation steps reached, fetched again without new events.
  - **A language switch** keeps the run, the draft, and the position.
  - **The start screen** with an unfinished run of the skill shows `check.unfinished` and "Continue the check".
  - **"Start the check"** ends the old run with `endedAt`, and its summary lists the unreached and the reached but unanswered questions under "Not answered", never under "Skipped". A supported question answered before the new start keeps its outcome in the supported part.
  - **The finished summary**: a reload on it shows the same summary.
  - **An ended run's summary** (PR 51 review), ended on question 1 with question 1 typed but not saved. Question 1 is reached: its expression is from the record, and its answer is shown only when `getAnswer`'s operands match. Questions 2–4 are unreached: each shows the expression and answer from its `getAnswer` response, with its explanation offered. With `answerFails`, each unreached question shows `check.unreachedUnavailable` and stays counted under "Not answered". With `resolveDiffers`, the reached question shows `check.answerUnavailable`, while the unreached ones show the resolved expression with its matching answer.
- [ ] T047 [P] [US4] Add checks 3 and 4 to `src/web/e2e/checks.spec.ts` (quickstart scenarios 3 and 4), on both projects.

### Implementation for User Story 4

- [ ] T048 [US4] Complete `summarizeRun` in `src/web/src/state/checks.ts` with `notAnswered` for ended runs. Add `runsBySkill(checkRuns)`, newest first.
- [ ] T049 [US4] In `src/web/src/state/progress.ts`, let `groupBySkill` take the check runs, so that a skill with runs and no practice or lesson views is listed. Use the latest run's `startedAt` in `lastActivity`. Practice's fields are computed exactly as before. Extend `src/web/tests/progress.test.ts`.
- [ ] T050 [US4] In `src/web/src/pages/RecordPage.tsx`, add the checks part of each skill group, with `CheckEntry` after the runs.
- [ ] T051 [US4] Complete resuming:
  - **`src/web/src/pages/CheckStartPage.tsx`**: `check.unfinished` and "Continue the check".
  - **`src/web/src/state/store.tsx`**: `openRun` restores the supported part's help and explanation steps from `resume`, fetched again and not recorded, as spec 005's resume does.
  - **`src/web/src/pages/CheckSummary.tsx`**: the "Not answered" section, with unreached questions on their own path: the expression and answer from one `getAnswer` response, and the explanation when `getInstance` gives the same operands (`contracts/summary.md`).

  T045–T047 pass.

**Checkpoint**: quickstart scenarios 3 and 4 pass; this phase may merge on its own.

---

## Phase 7: User Story 5 - Self-checks work in both languages and with assistive technology (Priority: P3)

**Goal**: Every new text in both languages and free of forbidden wording; the whole check by keyboard and screen reader, with focus where each step lands and 44-pixel targets.

**Independent Test**: The parity, literal, and wording scans pass; a keyboard-only tester takes the check, switches on question 3, and opens an explanation (spec User Story 5, SC-005).

### Tests for User Story 5

- [ ] T052 [P] [US5] Extend `src/web/tests/progress-wording.test.tsx` and `src/web/tests/literals.test.ts`:
  - **The wording scan**: covers the `check` section of both dictionaries and renders the start screen, both parts, the summary of a switched and of an ended run, and the checks part of "My work", in both languages.
  - **The literal check**: covers the new components.
- [ ] T053 [P] [US5] Add check 5 to `src/web/e2e/checks.spec.ts` (quickstart scenario 5): keyboard only with `tabTo`, focus after each step, and `boundingBox` at least 44 by 44 for every new control on the iPad project.

### Implementation for User Story 5

- [ ] T054 [US5] Fix what T052 and T053 find in the check components and `src/web/src/styles/index.css`. Record what was found, or that nothing was, in this task.

**Checkpoint**: All five stories work; quickstart scenarios 1–5 can be run.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [ ] T055 Update the documentation:
  - **`README.md`** "Current status" and the spec 006 row of `specs/README.md`: self-checks are implemented.
  - **`docs/learning/mastery.md`**: the guest record holds check runs apart from practice, and a check gives evidence, not a mastery judgement.
- [ ] T056 Run quickstart scenarios 1–5 by hand on the built app and service. Correct any quoted wording in `specs/006-self-checks/quickstart.md` or the contracts to match the dictionaries, and record the measured CI wall time in the quickstart (SC-007).
- [ ] T057 Record the open human validation item in the pull-request description: the learner check of SC-006, recorded as findings, not scores, alongside the learner checks carried forward by DL-041.
- [ ] T058 After Phases 3–4 deploy, take the pilot check on the production URL in both languages, with a switch on question 3, and check the summary. After Phase 6 deploys, check "My work" and "Continue the check" there too. Add the results to a dated walkthrough under `docs/reviews/walkthroughs/`.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001, no dependencies.
- **Foundational (Phase 2)**:
  - **Tests**: T002 ∥ T003 ∥ T004 ∥ T005.
  - **Content and backend track**: T006 → T007 → T008, and T009 → T010 → T011.
  - **Web track**: T012 ∥ T013, then T014 → T015.

  Phase 2 blocks all stories.
- **US1 (Phase 3)**: needs Phases 1–2.
  - **Tests**: T016 ∥ T017 ∥ T018 ∥ T019.
  - **Implementation**: T020 → T021 → T024 → T025. T022, T023, and T028 run alongside; T026 and T027 follow T023 and T024; T029 is last.
- **US2 (Phase 4)**: needs Phase 3.
  - **Tests**: T030 ∥ T031 ∥ T032 ∥ T033.
  - **Implementation**: T034 → T035 → T036 → T037, with T038 after T035.
- **US3 (Phase 5)**: needs Phase 2 only.
  - **Tests**: T039 ∥ T040 ∥ T041.
  - **Implementation**: T042 ∥ T043, with T044 alongside.
- **US4 (Phase 6)**: needs Phase 4 for the summary's parts.
  - **Tests**: T045 ∥ T046 ∥ T047.
  - **Implementation**: T048 → T049 → T050, with T051 alongside T049.
- **US5 (Phase 7)**: needs the screens it checks (Phases 3, 4, and 6). T052 ∥ T053, then T054.
- **Polish (Phase 8)**: T058 after each release deploys; T055–T057 last.

### Within Each Story

- Tests first, confirmed failing, then implementation
- Content before the loader, the loader before the endpoints, the endpoints before the app
- Pure functions (`checks.ts`, `progress.ts`) before the store, the store before the components that call it

### Parallel Opportunities

- **Phase 2**: the content and backend track (T006–T011) runs alongside the web track (T012–T015).
- **Phase 5** (US3) touches only `tools/`, the loader, backend tests, and `content/` documentation. It can run in parallel with Phases 3, 4, and 6.
- **Within Phase 3**: T022, T023, and T028 touch separate new files.
- **Phases 4 and 6** both touch `store.tsx`, `checks.ts`, and `CheckSummary.tsx`, so run them in order.

---

## Parallel Example: Phase 2

```bash
# Tests together:
Task: "Check endpoint contract tests in src/backend/MathKX.Api.Tests/ContractTests.cs"     # T002
Task: "Loader tests in src/backend/MathKX.Domain.Tests/Content/ContentCatalogTests.cs"      # T003
Task: "Content check tests in tools/validate-content.test.mjs"                             # T004
Task: "Old-record test in src/web/tests/lesson-views.test.tsx"                             # T005

# Then the two tracks side by side:
Task: "Schema, pilot file, content-check kind, loader, endpoints, smoke test"   # T006–T011
Task: "API client, record field, step helper, QuestionWorkspace"               # T012–T015
```

## Parallel Example: User Stories 1 and 3

```bash
# One contributor on the learner app, another on the content contract:
Task: "US1: checks.ts, store check actions, IndependentQuestion, pages"   # T016–T029
Task: "US3: tools/lib/checks.mjs, loader references, domain tests"       # T039–T044
```

---

## Implementation Strategy

### First merge (Phases 1–2)

1. The fixtures, the pilot file and its schema, the loader, the three endpoints, the client, the record field, and the workspace extraction.
2. **STOP and VALIDATE**: every existing unit and end-to-end test passes unchanged; merge. Nothing a learner sees changes.

### MVP: the first visible merge (Phases 3–4)

1. US1: the start screen, the independent part, and the summary → quickstart scenario 1.
2. US2: the switch, the supported part, and the lesson detour → scenario 2.
3. **STOP and VALIDATE**: the spec 002 to 005 end-to-end checks still pass; merge. The deploy runs, and T058 checks production.

### Later merges

1. US3: the content rules and domain tests (any time after the first merge).
2. US4: "My work" and resuming → scenarios 3 and 4; T058's second check after it deploys.
3. US5, then polish.

### Single-Contributor Order

T001–T015 and merge; US1 (T016–T029) and US2 (T030–T038), then merge; US3 (T039–T044); US4 (T045–T051); US5 (T052–T054); Polish (T055–T058).

---

## Notes

- Commit after each task or logical group; each checkpoint is a pull-request boundary.
- **Never let a save's validation response reach rendered state** in the independent part. Record it, and nothing else.
- **Never put a check delivery in `deliveries`**: practice's derivations rely on it.
- **Never compute a sum in the app**: the summary's correct answers come from `getAnswer` or from a correct submission.
- **Opening an explanation in the summary dispatches nothing.**
- **Do not bump `SCHEMA_VERSION`**: it would discard every learner's existing record.
