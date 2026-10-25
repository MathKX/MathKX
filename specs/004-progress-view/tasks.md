# Tasks: Progress View, Lesson History, and Replay

**Input**: Design documents from `specs/004-progress-view/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md)

**Tests**: Included. The specification requires every requirement to be covered by automated tests in CI (FR-018, SC-001 to SC-004), and the constitution requires behaviour to ship with tests. Write each test before the code it covers and confirm it fails first. Backend tests are xUnit under `src/backend/`; web tests are vitest under `src/web/tests/`; end-to-end checks are Playwright under `src/web/e2e/`; the content-tooling test is `tools/validate-content.test.mjs`.

**Organization**: Tasks are grouped by user story in priority order. The skill names and the skill list are foundational: User Story 1 shows skills by name, and User Story 2 places lessons under the skills they teach. User Story 3 (replay) turns User Story 1's question list into links, so it follows User Story 1.

**Deployment**: every push to `main` deploys to production (`.github/workflows/deploy.yml`). What reaches `main` must be honest on its own:
- **First release: Phases 1–3** (Setup, Foundational, US1). The progress view by skill, with names reviewed in the pull request. The question list is not yet linked, because replay does not exist yet.
- **Second release: Phase 4** (US2) in one merge. Recording lesson views, clearing them with "Clear my work", and showing them belong together: a record that keeps views the learner cannot see or clear would break FR-010 and the "kept in this browser only" notice.
- **Later merges**: Phase 5 (US3), Phase 6 (US4), and Phase 7 (Polish), each on its own.

Work on a branch and merge only at those boundaries.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story the task belongs to (US1–US4)
- Every task names the exact file(s) it touches

## Path Conventions

Backend under `src/backend/` (solution `MathKX.slnx`), learner app under `src/web/`, content and tooling at the root. See plan.md "Project Structure". Contract references are to `specs/004-progress-view/contracts/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: The scripted records every progress and replay test reads.

- [ ] T001 [P] Create `src/web/tests/records.ts` exporting builders for scripted deliveries (`delivery({ definitionId, version, seed, a, b, startedAt, events })`) and named records:
  - `everyOutcome`: the nine-question record of spec User Story 1 scenario 1, plus one of each remaining outcome;
  - `twoSkills`: deliveries for `numbers.addition-within-20` and one for a definition the fake lists under `numbers.number-bonds-to-ten`;
  - `withRepeats`: `3 + 7` twice and `7 + 3` once, same definition and version;
  - `unknownDefinition`: one delivery for `numbers.removed@1`;
  - `beforeThisFeature`: a persisted state of spec 003 without `lessonViews`;
  - `guidanceOnly`: one delivery with only `input-guidance`.

  Each builder returns plain data typed with `Delivery` from `src/web/src/state/observations.ts`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Skills carry a reviewed localized name in the content, the service delivers every skill with its name and its definitions, and the app can ask for them. Every story reads these.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Tests

- [ ] T002 [P] Extend `tools/validate-content.test.mjs` for `contracts/skill-name.md`:
  - **Helper**: give the `skill()` helper a default `name: { nb: id, en: id }` and override it with `extra`, so existing tests still pass.
  - **Cases**: a valid named skill passes; a skill without `name` fails as a schema violation; a skill without `name.en` fails; `name.nb` of `"  "` fails with `content/skills/<file>: skill name in nb is missing or empty (field name.nb)`; an extra `name.de` fails.
- [ ] T003 [P] Extend `src/backend/MathKX.Domain.Tests/Content/ContentCatalogTests.cs`:
  - all nine repository skills load with a non-empty `Name.Nb` and `Name.En`;
  - `catalog.DefinitionsForSkill("numbers.addition-within-20")` is `["numbers.addition.crossing-ten@1", "numbers.addition.four-plus-four@1", "numbers.addition.within-10@1"]`;
  - `numbers.number-bonds-to-ten` has none;
  - a temporary content root whose skill file lacks `name` fails the load with the file's relative path.
- [ ] T004 [P] Add `contracts/api.md` contract tests 1–5 to `src/backend/MathKX.Api.Tests/ContractTests.cs`:
  - `GET /api/skills` lists nine skills in ID order with names and `definitions`;
  - `GET /api/skills/{id}` equals the list element;
  - `unknown-skill` gives a 404;
  - no `sum` or `validation` appears in any skill body;
  - two calls give identical bodies.

  Add `/api/skills` to the existing route `[InlineData]` list, and extend the existing `/api/skills/numbers.addition-within-20` test (near line 155) for `name` and `definitions`.

### Implementation

- [ ] T005 In `schemas/skill.schema.json`:
  - add `"name"` to `required`;
  - add the property `name`: an object with required `nb` and `en`, each `{ "type": "string", "minLength": 1 }`, and `additionalProperties: false`;
  - rewrite `description` so it says the skill carries its localized name, and that descriptions and curriculum mappings still live elsewhere.

  Keep `schemaVersion` `"0.1"` (research R1).
- [ ] T006 In `tools/lib/skills.mjs`, add a check in `indexSkills` (or a new exported `checkNames` called from the same place as `checkLadders`): for `nb` and `en`, a missing value or a string that is empty after `trim()` reports `skill name in {language} is missing or empty` with `{ field: "name.{language}" }`. T002 passes.
- [ ] T007 Add `name` (after `id`) to all nine files in `content/skills/` with the proposed names of `contracts/skill-name.md`; `npm run validate` at the root passes.
- [ ] T008 [P] Add a "Name a skill" section before "Add a ladder" in `content/AUTHORING.md`, covering:
  - the field, with an example;
  - both languages required;
  - the name is shown to learners and reviewed like lesson text;
  - it is never an identity.

  Also replace "Names, descriptions, and curriculum mappings … will live elsewhere" in `content/README.md` with a sentence saying each skill file carries its localized name, while descriptions and curriculum mappings live elsewhere.
- [ ] T009 In `src/backend/MathKX.Domain/Content/Records.cs`, change `Skill` to `Skill(string Id, Localized Name, IReadOnlyList<string> Prerequisites, IReadOnlyList<LadderEntry>? Ladder)`. In `src/backend/MathKX.Domain/Content/ContentCatalog.cs`:
  - add `DefinitionsForSkill(string skillId)`, the ordinally sorted `id@version` keys of the definitions whose `Skill` equals it;
  - make `src/backend/MathKX.Content/ContentLoader.cs` throw `ContentLoadException` with the relative path when a skill's `Name` (or either language) is null.

  T003 passes.
- [ ] T010 In `src/backend/MathKX.Api/Dto/Dtos.cs`, make `SkillDto(string Id, LocalizedDto Name, IReadOnlyList<string> Prerequisites, IReadOnlyList<LadderEntryDto> Ladder, IReadOnlyList<string> Definitions)`. In `src/backend/MathKX.Api/Endpoints/ContentEndpoints.cs`:
  - move the existing mapping into a private `Skill(ContentCatalog, Skill)` helper;
  - add `GET /api/skills` returning every skill ordered by ID through it;
  - keep `GET /api/skills/{id}` on the same helper;
  - update the class summary.

  T004 passes.
- [ ] T011 [P] In `src/web/src/api/types.ts`, add `name: { nb: string; en: string }` and `definitions: string[]` to `SkillDto`, and `getSkills(): Promise<SkillDto[]>` to `PracticeApi`. Implement it in `src/web/src/api/client.ts` as `request<SkillDto[]>("/api/skills")`.
- [ ] T012 [P] Extend `src/web/tests/fakeApi.ts`:
  - **Skills**: `SKILL` and a new `BONDS_SKILL` carry names and `definitions` (the three pilot keys under addition, none under number bonds).
  - **`getSkills()`**: returns both and logs `getSkills`.
  - **`getSkill(id)`**: returns the matching one.
  - **New `FakeOptions`**: `skillsFail` rejects `getSkills`; `lessonsFail` rejects `getLessons`.
- [ ] T013 [P] Extend `src/backend/scripts/smoke-published.sh`: `GET /api/skills` from the published service contains `"name":{"nb":"Addisjon opp til 20"` (or the reviewed name). This proves the deploy package carries the named skill files.

**Checkpoint**: `npm test` (root), `dotnet test`, and `npm test` in `src/web` pass; the app looks unchanged.

---

## Phase 3: User Story 1 - A learner sees what they have worked on, skill by skill (Priority: P1) 🎯 MVP

**Goal**: "My work" groups the record by skill, under each skill's name, with spec 002's counts, the repeat sentence, and the newest-first question list, with "Continue" for the question in progress.

**Independent Test**: The `everyOutcome` and `twoSkills` records show each skill with the right counts in both languages, the questions under the right skill newest first, and no percentage, score, streak, or mastery word (spec User Story 1).

### Tests for User Story 1

- [ ] T014 [P] [US1] Add `src/web/tests/progress.test.ts` for `contracts/progress-view.md` "Derivation", over the records of T001:
  - per-skill `summary` equals `summarize` of the same deliveries (SC-001);
  - outcome "none" (`guidanceOnly`) is neither counted nor listed;
  - `unknownDefinition` goes to the "Other practice" group;
  - `repeats(withRepeats)` marks only the second `3 + 7`, with a different version or seed giving the same answer for the same operands;
  - deliveries are newest first, by `startedAt` then record order;
  - `skillOrder` puts the latest activity first and "Other practice" last;
  - a definition that moved skill counts under its current skill.
- [ ] T015 [P] [US1] Rewrite `src/web/tests/record-page.test.tsx` for `contracts/progress-view.md` "What the page shows" (deliveries only) with the fake API, keeping its storage-notice, reload, and clear tests:
  - **Names**: skill headings show `name.en`, and `name.nb` after the language switch, never the ID.
  - **Counts**: one `record-summary` per skill with spec 002's sentence; the repeat sentence and the `progress.repeatTag` tag appear for `withRepeats`.
  - **Question list**: "Show the questions" reveals the items newest first with date, outcome, tags, and answers; switching language keeps it open.
  - **Continue**: the resumable question shows "Continue" to `/practice/numbers.addition-within-20`.
  - **Empty state**: the empty record shows `record.empty` and a link to `/lessons`.
  - **Content unavailable**: `skillsFail` shows every delivery under "Other practice" with `progress.contentUnavailable`.
- [ ] T016 [P] [US1] Add `src/web/e2e/progress.spec.ts` with check 1 (quickstart scenario 1):
  - clear the record, then answer one question correctly at once, one after a wrong answer, one with visual help, and leave one unanswered (seeds pinned with the `crypto.getRandomValues` init script of `src/web/e2e/lesson.spec.ts`);
  - "My work" shows "Addition within 20" with "4 questions:" and the three outcomes plus "Unfinished";
  - "Continue" returns to the same question;
  - in Norsk the heading is the Norwegian name.

  Run it on both Playwright projects.

### Implementation for User Story 1

- [ ] T017 [US1] Create `src/web/src/state/progress.ts` with the pure functions `skillOfDefinition`, `repeats`, `groupBySkill`, and `skillOrder` of `contracts/progress-view.md`:
  - `groupBySkill(deliveries, skills, resumableId)` returns `SkillGroup[]`, with `skillId: null` for "Other practice" (data-model.md);
  - it uses `derive` and `summarize` from `src/web/src/state/outcomes.ts` unchanged;
  - `lessons` stays `[]` until T033.

  T014 passes.
- [ ] T018 [P] [US1] Add `formatDate(lang, iso)` to `src/web/src/i18n/index.ts`: `Intl.DateTimeFormat` with `nb-NO` or `en-GB` and `{ dateStyle: "long" }` (research R7). Add `progress.other`, `progress.repeats`, `progress.repeatTag`, `progress.showQuestions`, `progress.continue`, `progress.contentUnavailable`, and `progress.skillsLabel` (the region label) to `src/web/src/i18n/en.ts` and `nb.ts` with the wording of `contracts/progress-view.md`. `tests/dictionaries.test.ts` and `tests/literals.test.ts` pass.
- [ ] T019 [P] [US1] Create `src/web/src/components/PageHeading.tsx`: an `h1` (Designsystemet `Heading level={1}`) with `tabIndex={-1}` that takes focus on mount when the page was reached by in-app navigation (the router's `navigate`, tracked with a module-level flag the router sets), not on the first load of the app. Add the flag to `src/web/src/router.tsx`.
- [ ] T020 [US1] Rewrite `src/web/src/pages/RecordPage.tsx` as the progress view of `contracts/progress-view.md`:
  - **Data**: take an optional `api` prop (default `practiceApi`), as `LessonPage` does, and request `getSkills()` once per visit.
  - **Heading and notices**: render `PageHeading`, then the storage notice.
  - **Per skill**: for each `SkillGroup` in `skillOrder`, an `h2` with the name in the selected language (`progress.other` for `null`); the `record-summary` sentence; the repeat sentence; and a `details` with the summary `progress.showQuestions` (`data-testid="progress-questions"`) holding an `ol` of `record-item` entries. Each entry shows the expression via `record.question`, `formatDate` of `startedAt`, the outcome, `record-tag` tags plus `progress.repeatTag`, and `record.answers`, with `progress.continue` as a `Link` for the resumable question.
  - **Other states**: the empty state with a `Link` to `/lessons`; `progress.contentUnavailable` when the skill request fails.
  - **Clear**: keep "Clear my work" as it is.

  Pass `api` from `src/web/src/App.tsx`. T015 passes.
- [ ] T021 [US1] Update the checks that read the record so they open "Show the questions" first:
  - the `record-item` helper near line 49 of `src/web/e2e/lesson.spec.ts`;
  - check 7 of `src/web/e2e/practice.spec.ts`;
  - the `record-item` reads in `src/web/tests/delivery-binding.test.tsx` and `src/web/tests/exercise-shell.test.tsx`, if they assert visibility.

  Make T016 pass against the built app and service (build order of spec 003's quickstart); spec 002's and 003's end-to-end checks pass on both projects.

**Checkpoint (first release)**: quickstart scenario 1 passes locally; the names in `contracts/skill-name.md` are listed in the pull request for content review; merge Phases 1–3.

---

## Phase 4: User Story 2 - A learner sees a truthful history of the lessons they have looked at (Priority: P1)

**Goal**: A view is recorded when spec 003 reports the lesson shown, kept in the guest record, cleared with it, and listed under every skill the lesson teaches, with the honest note.

**Independent Test**: Three openings of the pilot lesson (list, question, cancelled detour) record two views; "My work" shows "Number bonds to ten: viewed 2 times, last on {date}" under both skills in both languages, with the note (spec User Story 2).

### Tests for User Story 2

- [ ] T022 [P] [US2] Add `src/web/tests/lesson-views.test.tsx` for `contracts/lesson-views.md` tests 1–6 with the fake API, reusing the visit setup of `src/web/tests/lesson-gate.test.tsx`:
  - **One view when shown**: one view after the content renders, none before.
  - **Detours**: a non-disclosing detour records one view plus `lesson-opened`; a disclosing lesson cancelled at the notice, or left through "Show visual help instead", records neither; opened anyway, it records one view plus `lesson-reveal`.
  - **Not shown**: `contentFails` records no view, and leaving before the content resolves records none.
  - **Repeat visits**: a language switch records nothing; leaving and returning records a second view; two views within one second (fake timers) give one.
  - **Old records**: `beforeThisFeature` hydrates with `lessonViews: []` and its deliveries intact.
  - **Clear and cap**: "Clear my work" empties the views; the 501st view drops the oldest.
- [ ] T023 [P] [US2] Extend `src/web/tests/progress.test.ts`:
  - `lessonHistory` counts and gives the latest `at` per lesson;
  - a lesson teaching two skills appears in both groups with the same counts;
  - a skill with views and no deliveries is listed;
  - `skillOrder` uses the latest view as activity.

  Extend `src/web/tests/record-page.test.tsx`:
  - `progress.lessonViewed` and `progress.lessonViewedOnce` with the lesson title in the selected language and `formatDate`;
  - `progress.viewNote` exactly once on the page;
  - `progress.noPractice` for a skill with views only;
  - `lessonsFail` leaves the history out with `progress.contentUnavailable`.
- [ ] T024 [P] [US2] Add check 2 (quickstart scenario 2) to `src/web/e2e/progress.spec.ts`:
  - open the lesson from the list, then by a non-disclosing detour, then cancel the notice for `3 + 7` (pinned seed);
  - "My work" shows "viewed 2 times" under both skill headings;
  - a reload of the lesson page adds one view;
  - a language switch on it adds none.

### Implementation for User Story 2

- [ ] T025 [US2] In `src/web/src/state/store.tsx`:
  - **Types and hydrate**: add `LessonView` and `lessonViews: LessonView[]` to `PersistedState` and `initialPersisted`; in the `hydrate` case, default a missing `lessonViews` to `[]`.
  - **Action**: add an action `{ type: "lessonViewed"; view: LessonView }` that appends unless the last view has the same `lessonId` and is less than 1000 ms earlier, then keeps the last 500.
  - **Store API**: add `lessonViewed(lessonId, language)` to `StoreApi`, dispatching with `new Date().toISOString()`.
  - **Clear**: make the `clear` case empty `lessonViews`.

  Leave `STORAGE_KEY` and `SCHEMA_VERSION` in `src/web/src/state/storage.ts` unchanged.
- [ ] T026 [US2] In `src/web/src/pages/LessonPage.tsx`, call `store.lessonViewed(id, <the language the content was shown in>)` inside the existing `onShown` callback, beside `store.lessonShown(...)`, so it runs once per visit after the first commit (spec 003's "shown"). T022 passes.
- [ ] T027 [US2] Add `lessonHistory` to `src/web/src/state/progress.ts`, and extend `groupBySkill` and `skillOrder` to take the views and the lesson list (`LessonSummary.skills`): fill `SkillGroup.lessons`, list skills with views only, and use the latest view as activity.
- [ ] T028 [US2] In `src/web/src/pages/RecordPage.tsx`:
  - request `getLessons()` once per visit;
  - per skill, render the lesson lines (`progress.lessonViewed` or `progress.lessonViewedOnce` with `titles[lang]` and `formatDate(last)`), `progress.viewNote` once after the first lesson line on the page, and `progress.noPractice` for a group without deliveries;
  - leave the history out with `progress.contentUnavailable` when the lesson request fails.

  Add `progress.lessonViewed`, `progress.lessonViewedOnce`, `progress.viewNote`, and `progress.noPractice` to both dictionaries. T023 and T024 pass.

**Checkpoint (second release)**: quickstart scenario 2 passes; merge Phase 4 as one change.

---

## Phase 5: User Story 3 - A learner looks at a recorded question again (Priority: P2)

**Goal**: Every listed question opens a read-only replay at `/record/{deliveryId}` that re-resolves the identity, shows the recorded work, records nothing, and never shows an unrevealed result.

**Independent Test**: For every delivery of the scripted records, replay shows the recorded expression in both languages, the persisted record is byte-identical afterwards, and an unanswered question shows no sum anywhere (spec User Story 3).

### Tests for User Story 3

- [ ] T029 [P] [US3] Add `src/web/tests/replay.test.tsx` for `contracts/replay.md` tests 1–7. First extend `src/web/tests/fakeApi.ts` with `FakeOptions.instanceOperands` (overrides the resolved `a` and `b`) and `instanceFails` (`404` or network). Then cover:
  - **Spec scenarios 1 and 2**: `8 + 5` answered `12` then `13` shows both answers with status and feedback, "Correct after feedback", the date, and `8 + 5 = 13`; `6 + 5` answered `10` shows no `11` in `document.body.innerHTML`.
  - **Requests**: the call log holds exactly one `getInstance`.
  - **A reveal without a correct answer**: shows its reveal tag and no sum.
  - **Nothing recorded**: `localStorage` is byte-identical before and after, with no new lesson view.
  - **Unavailable**: a mismatch, a 404, and a network failure each show the recorded expression and `replay.unavailable`.
  - **Question in progress and unknown IDs**: the resumable question shows "Continue" and no `input`; an unknown ID shows `replay.notFound`.
  - **Fixed task**: resolves with seed `null`.
  - **Language switch**: keeps the page.
- [ ] T030 [P] [US3] Add check 3 (quickstart scenario 3) to `src/web/e2e/progress.spec.ts`:
  - from "My work", open a correctly answered question and then the unfinished one;
  - the page's request log shows one `/api/instances/` request per replay and none to `/steps/` or `/api/validations`;
  - the unfinished replay's text and accessibility tree hold no sum;
  - after "Back to my work", the counts are unchanged.

### Implementation for User Story 3

- [ ] T031 [US3] In `src/web/src/router.tsx`, make `matchRoute` return `{ name: "replay", deliveryId }` for `/record/{id}` (decoded), keeping `{ name: "record" }` for `/record`. Render `ReplayPage` for it in `src/web/src/App.tsx` with `api`, keyed on the delivery ID.
- [ ] T032 [US3] Create `src/web/src/pages/ReplayPage.tsx` per `contracts/replay.md`:
  - **Lookup and request**: find the delivery in `state.deliveries`, or show `replay.notFound`; call `api.getInstance(definitionId, version, seed ?? null)` once.
  - **States**: `loading`, `matched`, `unavailable`, and `notFound` from data-model.md.
  - **Content**: `PageHeading` with `replay.title`; `AdditionPrompt` from the resolved instance when matched, or from the record otherwise; an `ol` of submissions (text, `translateCode(lang, "status", status)`, feedback via `translateCode(lang, "feedback", code, { a, b, v: value, sum: value })`) and input-guidance entries; `replay.noAnswers` when there are none; the outcome and tags from `derive`, plus the repeat tag from `repeats`; the completed equation only from a `correct` submission; `progress.continue` for the resumable delivery; `replay.back`.
  - **No store writes**: no store action is dispatched anywhere on the page.
- [ ] T033 [P] [US3] Add `replay.title`, `replay.unavailable`, `replay.notFound`, `replay.back`, and `replay.noAnswers` to `src/web/src/i18n/en.ts` and `nb.ts` with the wording of `contracts/replay.md`; the dictionary and literal checks pass.
- [ ] T034 [US3] In `src/web/src/pages/RecordPage.tsx`, make each `record-item` expression a `Link` to `/record/{deliveryId}` whose accessible name is the expression and the date. T029 and T030 pass.

**Checkpoint**: quickstart scenario 3 passes; this phase may merge on its own.

---

## Phase 6: User Story 4 - The view works in both languages and with assistive technology (Priority: P3)

**Goal**: Every new string in both languages, counts as sentences, keyboard operation with focus on the heading after navigation, 44-pixel targets, and no forbidden wording anywhere.

**Independent Test**: The parity, literal, and wording scans pass; a keyboard-only pass through "My work" and a replay and back keeps focus visible and lands on each page heading.

### Tests for User Story 4

- [ ] T035 [P] [US4] Add `src/web/tests/progress-wording.test.tsx`, which renders "My work" over `everyOutcome`, `withRepeats`, and lesson views, and a replay of each delivery, in both languages. It asserts that no text node, `aria-label`, or `title`:
  - contains `%`;
  - matches `/\b(score|streak|mastery|mastered|poeng|rekke|mestring|mestret)\b/i`;
  - matches a ratio such as `\d+\s*/\s*\d+` or `\d+ of \d+` outside the repeat sentence.

  The same patterns are scanned over the `progress`, `replay`, and `record` sections of both dictionaries (SC-002).
- [ ] T036 [P] [US4] Add check 4 to `src/web/e2e/progress.spec.ts` (keyboard and zoom):
  - **Keyboard only**: Tab from the header link "My work", open "Show the questions" with Enter, follow a question, and return with "Back to my work". Focus is visible at each step and lands on the `h1` after each navigation.
  - **Zoom**: at 200 percent zoom on 1024 pixels there is no horizontal page scroll.
  - **Targets**: on the iPad project the summary, links, and "Continue" are at least 44 by 44.

### Implementation for User Story 4

- [ ] T037 [US4] Fix what T035 and T036 find in `src/web/src/pages/RecordPage.tsx`, `src/web/src/pages/ReplayPage.tsx`, and `src/web/src/styles/index.css` (the `mkx-target` class on the `details` summary and the links; wrapping of long names and dates). Each skill's count sentence must stay one `p` that a screen reader reads as text.

**Checkpoint**: All four stories work; quickstart scenarios 1–4 can be run.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [ ] T038 [P] Add check 5 (quickstart scenario 4) to `src/web/e2e/progress.spec.ts`: a record of spec 003's shape without `lessonViews`, injected through `localStorage` before load, shows every delivery under its skill and no lesson lines.
- [ ] T039 Update `README.md` "Current status", the spec 004 row of `specs/README.md`, and `docs/learning/mastery.md` "Persistence and current implementation status" (if it lists what the guest record holds) to say the progress view, lesson history, and replay are implemented.
- [ ] T040 Run the four quickstart scenarios by hand. Correct any quoted wording in `specs/004-progress-view/quickstart.md` or the contracts to match the dictionaries as reviewed, and record the measured CI wall time in the quickstart's CI section (SC-006).
- [ ] T041 Record two open human validation items in the pull-request description:
  - the learner check of SC-005 (after one minute on "My work", the learner can say which skill they practised, how the questions went, and which lesson they looked at);
  - the content review of the nine skill names in both languages.

  Findings are recorded, not scored.
- [ ] T042 After the first release (Phases 1–3) has deployed, open "My work" on the production URL (the deploy job's `environment.url`) in both languages and check that the skill names render from the deployed content. Do the same for the lesson history after the second release. Add both results to a dated walkthrough file under `docs/reviews/walkthroughs/`.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001, no dependencies.
- **Foundational (Phase 2)**: tests T002 ∥ T003 ∥ T004. Then T005 → T006 → T007; T009 → T010. T008, T011, T012, and T013 can run alongside. Phase 2 blocks all stories.
- **US1 (Phase 3)**: needs Phases 1–2. Tests T014 ∥ T015 ∥ T016. T017 ∥ T018 ∥ T019, then T020, then T021.
- **US2 (Phase 4)**: needs Phase 3 (it extends `progress.ts` and the record page). Tests T022 ∥ T023 ∥ T024. T025 → T026; T027 → T028.
- **US3 (Phase 5)**: needs Phase 3 (the question list and `PageHeading`); independent of US2. Tests T029 ∥ T030. T031 → T032 → T034; T033 alongside.
- **US4 (Phase 6)**: needs the pages it checks (Phases 3–5). T035 ∥ T036, then T037.
- **Polish (Phase 7)**: T038 any time after Phase 4. T042 after each release deploys. T039–T041 last.

### Within Each Story

- Tests first, confirmed failing, then implementation
- Content and schema before validator before service before learner app
- Pure functions in `progress.ts` before the pages that render them; store changes before the page that calls them

### Parallel Opportunities

- Phase 2: T002 ∥ T003 ∥ T004, then content (T005–T008) ∥ backend (T009–T010) ∥ web (T011–T012) ∥ T013
- Phase 3: T014 ∥ T015 ∥ T016, then T017 ∥ T018 ∥ T019
- Phases 4 and 5 can run in parallel after Phase 3. US2 touches `store.tsx`, `LessonPage.tsx`, and the lesson part of `progress.ts`; US3 touches the router, `App.tsx`, and `ReplayPage.tsx`. Both edit `RecordPage.tsx` and the dictionaries, so land those edits as separate commits.
- Phase 6: T035 ∥ T036

---

## Parallel Example: Phase 2

```bash
# Tests together:
Task: "Skill-name cases in tools/validate-content.test.mjs"                        # T002
Task: "Names and DefinitionsForSkill in .../Content/ContentCatalogTests.cs"         # T003
Task: "GET /api/skills contract tests in src/backend/MathKX.Api.Tests/ContractTests.cs"  # T004

# Then three tracks side by side:
Task: "Schema, validator check, nine names, authoring guide"                       # T005–T008
Task: "Skill.Name, DefinitionsForSkill, GET /api/skills"                            # T009–T010
Task: "getSkills in the app types, client, and fake API"                            # T011–T012
```

---

## Implementation Strategy

### MVP and first release (Phases 1–3, one merge to `main`)

1. Setup, then skill names in the content, the service, and the app.
2. US1: the progress view by skill → quickstart scenario 1.
3. **STOP and VALIDATE**: spec 002's and 003's checks still pass with the list inside "Show the questions"; the nine names are reviewed in the pull request; merge. The deploy runs, and T042 checks production.

### Second release (Phase 4, one merge)

US2: recording, clearing, and showing lesson views together → quickstart scenario 2. Merge only when all three are in.

### Later merges

1. US3: replay, and the list becomes links → scenario 3.
2. US4: wording scan, keyboard, zoom, and targets.
3. Polish: the old-record check, docs, the hand run, and measurements.

### Single-Contributor Order

T001–T013, then US1 (T014–T021) and the first release merge, then US2 (T022–T028) and the second release merge, then US3 (T029–T034), US4 (T035–T037), and Polish (T038–T042).

---

## Notes

- Commit after each task or logical group; each release checkpoint is a pull-request boundary.
- Outcome derivation stays spec 002's: `progress.ts` groups and counts, and never decides an outcome.
- Replay sends only the identity and computes nothing mathematical; the only sum it shows is a recorded correct answer.
- A lesson view is recorded only from `onShown`, never on a click, route entry, or confirmation.
- Do not bump `SCHEMA_VERSION`: it would discard every learner's existing record.
