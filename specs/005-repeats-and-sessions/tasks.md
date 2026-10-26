# Tasks: Repeat Avoidance, "Repeat This Question", and Session Controls

**Input**: Design documents from `specs/005-repeats-and-sessions/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md)

**Tests**: Included. The specification requires every requirement to be covered by automated tests in CI (FR-018, SC-001 to SC-004), and the constitution requires behaviour to ship with tests. Write each test before the code it covers and confirm it fails first. Backend tests are xUnit under `src/backend/`; web tests are vitest under `src/web/tests/`; end-to-end checks are Playwright under `src/web/e2e/`.

**Organization**: Tasks are grouped by user story in priority order. The pool endpoint and the new record fields are foundational. User Story 1 introduces `repeatKind` for chance repeats, and User Story 2 adds repeats on request to it.

**Deployment**: every push to `main` deploys to production (`.github/workflows/deploy.yml`). Each phase below is honest on its own and may merge separately:
- **Phases 1–3** (Setup, Foundational, US1): the first draw is unchanged, so practice only gets better. The exhausted-pool notice ships with the avoidance that produces it.
- **Phase 4** (US2): "Repeat this question" must ship with its tag and sentence in "My work" and replay. Otherwise a deliberate repeat would read as a chance repeat.
- **Phase 5** (US3), **Phase 6** (US4), and **Phase 7** (Polish): each on its own.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story the task belongs to (US1–US4)
- Every task names the exact file(s) it touches

## Path Conventions

Backend under `src/backend/` (solution `MathKX.slnx`), learner app under `src/web/`. See plan.md "Project Structure". Contract references are to `specs/005-repeats-and-sessions/contracts/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Test fixtures every story reads.

- [ ] T001 [P] Extend `src/web/tests/fakeApi.ts` and `src/web/tests/records.ts`:
  - **`getPool(definitionId, version)` in the fake**: returns every question of the fake's pool for the definition in canonical order, each with a seed the fake's `getInstance` resolves to it. Use a seed-to-pair map the fake also honours, so a pool seed resolves to its pair. It logs `getPool …`.
  - **New `FakeOptions`**: `poolSize` (limits a definition's pool to its first n pairs, for the exhausted case), `poolFails` (rejects `getPool`), and `sequence` (the pairs successive first draws resolve to, so a test can force a recent first draw).
  - **`records.ts`**: add `repeatOf` and `repeatReason` to `DeliverySpec`, and a builder `recentWindow(definitionId, pairs)` that returns one delivery per pair, oldest first.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The service publishes each variation's pool; the app can fetch it; the guest record has the new fields. Every story reads these.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Tests

- [ ] T002 [P] Add `src/backend/MathKX.Domain.Tests/Generators/QuestionPoolTests.cs` for `contracts/pool.md` "Tests" 1–6:
  - **Sizes**: 45 for `within-10`, 36 for `crossing-ten`, and 1 for `four-plus-four`.
  - **Seeds**: each seed generates its pair; no smaller seed does; all seeds are below 65,536.
  - **Fixture**: the first ten entries of each generated pool match `src/backend/MathKX.Domain.Tests/Fixtures/pools.json`, which you create from the first run and review by hand against `Generate`.
  - **The limit**: with a lowered limit, building a pool fails with the definition key.
- [ ] T003 [P] Add the `contracts/pool.md` contract tests 1–6 to `src/backend/MathKX.Api.Tests/ContractTests.cs`:
  - the shape, in canonical order;
  - every seed resolving through the instance endpoint to the listed operands (both pilot definitions);
  - the fixed task with `seed: null`;
  - no `sum` or `validation`;
  - `404 unknown-definition`;
  - identical bodies.

  Add `/api/definitions/numbers.addition.within-10/1/pool` to the unsolicited-response `[InlineData]` list.

### Implementation

- [ ] T004 Create `src/backend/MathKX.Domain/Generators/QuestionPool.cs`: `QuestionPool.For(ExerciseDefinition, GeneratorRegistry, ulong limit = 65_536)` returning the definition key and `IReadOnlyList<(Seed? Seed, int A, int B)>` per `contracts/pool.md`. A generated pool comes from `AdditionPairGenerator.Enumerate` and the smallest-seed search; a fixed task's pool is its prompt with no seed. Failure throws with the definition key. T002 passes.
- [ ] T005 In `src/backend/MathKX.Api`:
  - **Pools at startup**: add `QuestionPools` (a singleton holding every catalog definition's pool, built in its constructor) and register it in `Program.cs`. Resolve it once before `app.Run()`, so a pool that cannot be covered fails the start.
  - **Endpoint**: add `Endpoints/DefinitionsEndpoints.cs` with `GET /api/definitions/{definitionId}/{version:int}/pool`, returning `PoolDto` (new in `Dto/Dtos.cs`: `Definition`, `Version`, `Questions: { Seed, A, B }[]`, with the seed as a decimal string or null). An unknown definition gives `Problems.NotFound("unknown-definition", …)`. Map it in `Program.cs`.

  T003 passes.
- [ ] T006 [P] In `src/web/src/api/types.ts`, add `PoolDto` and `getPool(definitionId, version): Promise<PoolDto>` to `PracticeApi`. Implement it in `src/web/src/api/client.ts`.
- [ ] T007 [P] Record fields:
  - **`src/web/src/state/observations.ts`**: add optional `repeatOf?: string` and `repeatReason?: "requested" | "exhausted"` to `Delivery`.
  - **`src/web/src/state/store.tsx`**: add `session: { start: string | null; last: { from: string | null; to: string } | null }` to `PersistedState` and `initialPersisted`; default a missing `session` on hydrate (the reducer initializer and the `hydrate` case); reset it in `clear`.

  Leave `SCHEMA_VERSION` unchanged. Extend `src/web/tests/lesson-views.test.tsx`'s old-record test to check `session` defaults and the deliveries stay intact.
- [ ] T008 [P] Extend `src/backend/scripts/smoke-published.sh`: `GET /api/definitions/numbers.addition.within-10/1/pool` from the published service lists 45 questions and contains no `"sum"`.

**Checkpoint**: `dotnet test` and `npm test` pass; nothing visible changes.

---

## Phase 3: User Story 1 - A learner does not get the same question again by chance (Priority: P1) 🎯 MVP

**Goal**: Questions the learner did not choose avoid the variation's last eight (in either order), within at most two instance requests; an exhausted pool repeats honestly with a notice and a marked repeat.

**Independent Test**: 100 "Another question" requests per pilot variation never repeat one of the previous eight; a five-question pool repeats after the fifth with the notice (spec User Story 1).

### Tests for User Story 1

- [ ] T009 [P] [US1] Add `src/web/tests/selection.test.ts` for `contracts/selection.md` tests 1–4:
  - `recentPairs`: the eight most recent per variation, by time, whatever the outcome or repeat reason;
  - either order;
  - `choose` returns `fresh`, `chosen` (index `seed mod n`, never a recent pair), and `exhausted`;
  - determinism.
- [ ] T010 [P] [US1] Add `src/web/tests/avoidance.test.tsx` for the `contracts/selection.md` store tests 1–7, with the fake API and `records.ts`:
  - 100 requests on each pilot variation with no pair from the previous eight;
  - `poolSize: 5`: every request after the fifth is a repeat with `repeatReason: "exhausted"`, a `repeatOf`, and the notice;
  - the record never holds the passed-over question;
  - at most two `getInstance` calls per question, and one `getPool` per variation;
  - `poolFails` still delivers a question;
  - after a remount on the same storage, the window still applies;
  - a ladder change avoids the target variation's window.
- [ ] T011 [P] [US1] Add `src/web/e2e/repeats.spec.ts` with check 1, on both projects:
  - clear the record, start within ten, and ask for "Another question" 20 times, reading each prompt;
  - no question equals, in either order, any of the eight before it;
  - the page's request log shows at most two `/api/instances/` requests per question and one `/api/definitions/…/pool` request.

### Implementation for User Story 1

- [ ] T012 [US1] Create `src/web/src/state/selection.ts` with `recentPairs(record, definitionId, version)` and `choose(firstDraw, window, pool)` per `contracts/selection.md` (pure; `BigInt` for the index). T009 passes.
- [ ] T013 [US1] In `src/web/src/state/store.tsx`, extend `load()` for questions the learner did not choose:
  - **First draw**: as today.
  - **Window**: compute it from the record.
  - **Pool**: when the first draw is recent, get the pool from a per-visit cache (a `useRef<Map<string, PoolDto>>`).
  - **Choice**: on `chosen`, request the chosen seed and dispatch that question only. On `exhausted`, dispatch the first draw with `repeatReason: "exhausted"` and `repeatOf` (the most recent same-pair delivery in the window) through `toDelivery`, and dispatch the notice `practice.poolExhausted`.
  - **Pool failure**: dispatch the first draw.

  Keep the supersede token checks around both requests. T010 passes.
- [ ] T014 [P] [US1] Add `practice.poolExhausted` to `src/web/src/i18n/en.ts` and `nb.ts` with the wording of `contracts/selection.md`. The dictionary and literal checks pass.
- [ ] T015 [US1] Add `repeatKind(delivery, record)` to `src/web/src/state/progress.ts`, returning `"chance"` for `repeatReason: "exhausted"` or spec 004's ordered match, and none otherwise (`"requested"` follows in T022). Use it for the repeat tag in `src/web/src/pages/RecordPage.tsx` and `src/web/src/pages/ReplayPage.tsx` and for `repeatCount` in `groupBySkill`, so an exhausted repeat in either order is tagged "Repeated question". Extend `src/web/tests/progress.test.ts` for it.
- [ ] T016 [US1] Make T011 pass against the built app and service on both projects. The spec 002 to 004 end-to-end checks still pass, since their golden first draws are unchanged and start from a cleared record.

**Checkpoint (first merge)**: quickstart scenarios 1 and 2 pass; Phases 1–3 may merge.

---

## Phase 4: User Story 2 - A learner deliberately repeats a question (Priority: P1)

**Goal**: "Repeat this question" from practice and from replay delivers the same identity as a new question tagged "Repeated on request", with an outcome of its own.

**Independent Test**: A wrong answer with help, then a repeat answered correctly without help, gives two questions; the second is "Correct on first response, no help" with "Repeated on request", and "My work" says one was repeated on purpose (spec User Story 2).

### Tests for User Story 2

- [ ] T017 [P] [US2] Add `src/web/tests/repeat.test.tsx` for `contracts/repeat.md` tests 1–8, with the fake API:
  - the practice button appears only after a submission;
  - same identity, fresh state;
  - one `getInstance` and no `getPool`;
  - outcome independence;
  - from a replay: skill and variation set, an unanswered question in progress `skipped`, the replay recording nothing, and "Continue" instead of repeat for the question in progress;
  - spec 003's notice on a disclosing repeat;
  - a failed repeat records nothing;
  - every repeated delivery replays to the same question.
- [ ] T018 [P] [US2] Extend the "My work" and replay tests:
  - **`src/web/tests/progress.test.ts`**: `repeatKind` is `"requested"` before `"chance"`, and `groupBySkill` counts repeats on request.
  - **`src/web/tests/record-page.test.tsx`**: "Repeated on request" replaces "Repeated question" for those questions, and `progress.repeatsRequested` appears in both languages.
  - **`src/web/tests/replay.test.tsx`**: the replay of a repeat shows its tag, and replay offers "Repeat this question" except for the question in progress.
- [ ] T019 [P] [US2] Add check 2 to `src/web/e2e/repeats.spec.ts` (quickstart scenario 3):
  - **On the practice screen**: answer a question wrongly with help and then correctly, choose "Repeat this question", and answer at once. "My work" shows "Repeated on request" and "1 of these you repeated on purpose."
  - **From a replay**: open the first question's replay, choose "Repeat this question", and see the same prompt on the practice screen.

### Implementation for User Story 2

- [ ] T020 [US2] Add `repeatQuestion(deliveryId)` to `StoreApi` in `src/web/src/state/store.tsx` per `contracts/repeat.md`:
  - **Skill and ladder**: when needed, set the skill and its ladder from the resolved instance's `skill` and `getSkill`, with the ladder position on the question's variation when it is on the ladder.
  - **Load**: call `load()` with the seed fixed, no avoidance, and `repeatOf` and `repeatReason: "requested"` on the new delivery. Extend `toDelivery` and the `question` action for these fields.
  - **Failure**: leave the state unchanged.
- [ ] T021 [P] [US2] In `src/web/src/components/ExerciseShell.tsx`, add the "Repeat this question" button (`data-testid="repeat-question"`, `mkx-target`) beside "Another question". Show it only when the current delivery has a submission.
- [ ] T022 [US2] Extend `repeatKind` in `src/web/src/state/progress.ts` with `"requested"`. In `src/web/src/pages/RecordPage.tsx` and `src/web/src/pages/ReplayPage.tsx`, use `progress.repeatRequestedTag` for it, and in `RecordPage.tsx` add the `progress.repeatsRequested` sentence after `progress.repeats`.
- [ ] T023 [US2] In `src/web/src/pages/ReplayPage.tsx`, add "Repeat this question" (`data-testid="replay-repeat"`) for every delivery except the one `inProgress`. It calls `store.repeatQuestion(deliveryId)` and, on success, navigates to `/practice/{skillId}`. The page itself dispatches nothing.
- [ ] T024 [P] [US2] Add `practice.repeat`, `progress.repeatRequestedTag`, and `progress.repeatsRequested` to `src/web/src/i18n/en.ts` and `nb.ts` with the wording of `contracts/repeat.md`. T017–T019 pass.

**Checkpoint**: quickstart scenario 3 passes; this phase may merge on its own, with its tags.

---

## Phase 5: User Story 3 - A learner finishes a practice session and sees what they did (Priority: P2)

**Goal**: "Finish practice" ends the session (keeping an unanswered question resumable) and shows a summary of the questions since the previous finish, with "Practise again".

**Independent Test**: Three answered questions and a draft on the fourth, then "Finish practice", give a summary of four questions with one unfinished; "Practise again" resumes the draft (spec User Story 3).

### Tests for User Story 3

- [ ] T025 [P] [US3] Add `src/web/tests/session.test.tsx` for `contracts/session.md` tests 1–9, with the fake API:
  - the summary counts;
  - "Practise again" resumes;
  - a detour and a look at "My work" do not split the session;
  - a second session counts only its own questions;
  - `session.empty`;
  - an old record's first finish counts everything;
  - the summary survives a reload, and "Clear my work" gives `session.none`;
  - the repeat sentences;
  - both languages.
- [ ] T026 [P] [US3] Add check 3 to `src/web/e2e/repeats.spec.ts` (quickstart scenario 4):
  - answer three questions, take a lesson detour, and type a draft on a fourth;
  - "Finish practice" shows "4 questions" with "1 unfinished";
  - "Practise again" shows the draft;
  - finishing again at once shows the empty sentence.

### Implementation for User Story 3

- [ ] T027 [US3] Add `finishPractice()` to `StoreApi` in `src/web/src/state/store.tsx`: dispatch `end`, then an action `{ type: "finish"; at: string }` that sets `session.last` to `{ from: session.start, to: at }` and `session.start` to `at`.
- [ ] T028 [US3] Create `src/web/src/pages/SessionPage.tsx` per `contracts/session.md`:
  - `PageHeading` with `session.title`;
  - `groupBySkill` over the deliveries in `session.last` (no lesson history, no question list), with each skill's name from `getSkills`, its count sentence, and the repeat sentences;
  - `session.empty` or `session.none` when there is nothing to count;
  - "Practise again" as a `Link` to `/practice/{skillId}`, and a link to `/record`.

  Add the route `{ name: "session" }` for `/session` to `src/web/src/router.tsx`, and render the page in `src/web/src/App.tsx` with `api`.
- [ ] T029 [P] [US3] In `src/web/src/components/ExerciseShell.tsx`, add "Finish practice" (`data-testid="finish-practice"`, `mkx-target`), which calls `store.finishPractice()` and navigates to `/session`.
- [ ] T030 [P] [US3] Add `practice.finish`, `session.title`, `session.empty`, `session.none`, and `session.again` to `src/web/src/i18n/en.ts` and `nb.ts` with the wording of `contracts/session.md`. T025 and T026 pass.

**Checkpoint**: quickstart scenario 4 passes; this phase may merge on its own.

---

## Phase 6: User Story 4 - The controls work in both languages and with assistive technology (Priority: P3)

**Goal**: The new controls, notice, tags, and summary in both languages, keyboard-operable, with polite announcements and 44-pixel targets, and no forbidden wording.

**Independent Test**: The parity, literal, and wording scans pass; a keyboard-only tester repeats a question, hears the exhausted notice once, and finishes a session.

### Tests for User Story 4

- [ ] T031 [P] [US4] Extend `src/web/tests/progress-wording.test.tsx`:
  - render `/session` after finishing a scripted session, in both languages, and scan it like "My work";
  - scan the `session` dictionary section and the new `practice` keys (`poolExhausted`, `repeat`, `finish`);
  - render "My work" and replay over records with repeats on request.
- [ ] T032 [P] [US4] Add check 4 to `src/web/e2e/repeats.spec.ts` (keyboard and targets):
  - **Keyboard**: using spec 004's `recordUnfocused` and `focusShows` (move them to a shared `src/web/e2e/focus.ts` and import them in both files), reach "Repeat this question" and "Finish practice" by Tab with visible focus; activate them with Enter; focus lands on the question and on the summary's `h1`.
  - **Notice**: `poolExhausted` is in the `role="status"` region (`data-testid="notice"`).
  - **Targets**: on the iPad project, "Repeat this question", "Finish practice", "Practise again", and replay's "Repeat this question" are at least 44 by 44.

### Implementation for User Story 4

- [ ] T033 [US4] Fix what T031 and T032 find in `src/web/src/components/ExerciseShell.tsx`, `src/web/src/pages/SessionPage.tsx`, `src/web/src/pages/ReplayPage.tsx`, and `src/web/src/styles/index.css`. Record what was found, or that nothing was, in this task.

**Checkpoint**: All four stories work; quickstart scenarios 1–4 can be run.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [ ] T034 Update `README.md` "Current status" and the spec 005 row of `specs/README.md` to say repeat avoidance, "Repeat this question", and "Finish practice" are implemented.
- [ ] T035 Run the four quickstart scenarios by hand on the built app and service. Correct any quoted wording in `specs/005-repeats-and-sessions/quickstart.md` or the contracts to match the dictionaries, and record the measured CI wall time in the quickstart's CI section (SC-006).
- [ ] T036 Record the open human validation item in the pull-request description: the learner check of SC-005 (a learner repeats a question they found hard and, after one minute on "My work", says which questions they repeated on purpose). Findings are recorded, not scored.
- [ ] T037 After Phases 1–3 deploy, check on the production URL in both languages that 20 "Another question" requests within ten do not repeat one of the previous eight. After Phase 4 deploys, check "Repeat this question" there too. Add both results to a dated walkthrough file under `docs/reviews/walkthroughs/`.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001, no dependencies.
- **Foundational (Phase 2)**: tests T002 ∥ T003. Then T004 → T005; T006, T007, and T008 alongside. Phase 2 blocks all stories.
- **US1 (Phase 3)**: needs Phases 1–2. Tests T009 ∥ T010 ∥ T011. T012 → T013; T014 and T015 alongside; T016 last.
- **US2 (Phase 4)**: needs Phase 2, and Phase 3 for `repeatKind` (T015). Tests T017 ∥ T018 ∥ T019. T020 → T021 and T023; T022 and T024 alongside.
- **US3 (Phase 5)**: needs Phase 2 (the `session` field); independent of US1 and US2 except for the repeat sentences, which appear once they exist. Tests T025 ∥ T026. T027 → T028 → T029; T030 alongside.
- **US4 (Phase 6)**: needs the controls it checks (Phases 3–5). T031 ∥ T032, then T033.
- **Polish (Phase 7)**: T037 after each release deploys; T034–T036 last.

### Within Each Story

- Tests first, confirmed failing, then implementation
- Domain before service before learner app
- Pure functions (`selection.ts`, `progress.ts`) before the store, the store before the components that call it

### Parallel Opportunities

- **Phase 2**: T002 ∥ T003, then the backend track (T004–T005) alongside the web track (T006–T007) and T008.
- **Phase 3**: T009 ∥ T010 ∥ T011; then T014 ∥ T015 alongside T012–T013.
- **Phases 4 and 5** can run in parallel after Phase 3. US2 touches `store.tsx` (`repeatQuestion`), `ExerciseShell.tsx`, `ReplayPage.tsx`, and `RecordPage.tsx`; US3 touches `store.tsx` (`finishPractice`), `SessionPage.tsx`, the router, and `ExerciseShell.tsx`. Land their `store.tsx` and `ExerciseShell.tsx` edits as separate commits.
- **Phase 6**: T031 ∥ T032.

---

## Parallel Example: Phase 2

```bash
# Tests together:
Task: "QuestionPool tests in src/backend/MathKX.Domain.Tests/Generators/QuestionPoolTests.cs"   # T002
Task: "Pool contract tests in src/backend/MathKX.Api.Tests/ContractTests.cs"                    # T003

# Then backend and web side by side:
Task: "QuestionPool and the pool endpoint"           # T004–T005
Task: "getPool in the app; record fields"            # T006–T007
Task: "Published smoke test for the pool"            # T008
```

---

## Implementation Strategy

### MVP and first merge (Phases 1–3)

1. Setup, then the pool in the service and the record fields in the app.
2. US1: avoidance in `load()`, the exhausted notice, and chance repeats tagged → quickstart scenarios 1 and 2.
3. **STOP and VALIDATE**: the spec 002 to 004 end-to-end checks still pass; merge. The deploy runs, and T037 checks production.

### Later merges

1. US2: "Repeat this question" with its tags → scenario 3; T037's second check after it deploys.
2. US3: "Finish practice" and the summary → scenario 4.
3. US4, then polish.

### Single-Contributor Order

T001–T008, US1 (T009–T016) and merge, US2 (T017–T024), US3 (T025–T030), US4 (T031–T033), Polish (T034–T037).

---

## Notes

- Commit after each task or logical group; each checkpoint is a pull-request boundary.
- Avoidance only chooses an identity; never change generation, the seed format, or what an identity resolves to.
- The recent questions never leave the browser; the service sees only the identities it already sees.
- A repeat's outcome uses its own events only; never carry help or reveals across deliveries.
- Do not bump `SCHEMA_VERSION`: it would discard every learner's existing record.
