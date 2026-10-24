# Tasks: Practice Flow with Help-First Feedback

**Input**: Design documents from `specs/002-practice-flow/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md)

**Tests**: Included. The specification requires every behaviour to be covered by automated tests in CI (FR-025, SC-001 to SC-005) and the constitution requires behaviour to ship with tests. Write each test before the code it covers and confirm it fails first. Backend tests are xUnit under `src/backend/`; web tests are vitest under `src/web/tests/`; end-to-end checks are Playwright under `src/web/e2e/`.

**Organization**: Tasks are grouped by user story. User Story 2 (reproducible questions: domain and service) comes before User Story 1 (the practice screen) because the screen consumes the service; each story is still independently testable at its own layer.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story the task belongs to (US1–US5)
- Every task names the exact file(s) it touches

## Path Conventions

Backend under `src/backend/` (one solution, five projects), learner app under `src/web/` (one Vite package). The root `package.json` stays the content-tooling package. See plan.md "Project Structure".

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Both application roots exist, build, and run an empty test suite in CI.

- [X] T001 Create `src/backend/MathKX.slnx` with `MathKX.Domain` (classlib, no package references), `MathKX.Content` (classlib referencing Domain, packages `YamlDotNet` pinned), `MathKX.Api` (webapi minimal, referencing Content), `MathKX.Domain.Tests` and `MathKX.Api.Tests` (xunit, the latter with `Microsoft.AspNetCore.Mvc.Testing`), all `net10.0`; add `src/backend/Directory.Build.props` (nullable, implicit usings, `TreatWarningsAsErrors`, MIT metadata) and `src/backend/.editorconfig`; `dotnet build` and `dotnet test` succeed with zero tests
- [X] T002 [P] Create `src/web/` with `package.json` (private, pinned versions from research R6: react 19.3.1, react-dom 19.3.1, @digdir/designsystemet-react 1.23.0, @digdir/designsystemet-css 1.23.0, @digdir/designsystemet 1.23.0, @navikt/aksel-icons 8.20.0, tailwindcss 4.3.3, @tailwindcss/vite 4.3.3, vite 8.3.5, @vitejs/plugin-react 6.1.2, typescript 5.9.3, vitest 5.0.5, @testing-library/react 16.3.3, jsdom, playwright 1.64.1), scripts `dev`, `build`, `test`, `e2e`, `typecheck`; `vite.config.ts` with the React and Tailwind plugins, a `/api` proxy to the service, and vitest config with jsdom; `tsconfig.json` strict; `index.html`; `src/main.tsx` rendering an empty `App`; `npm ci`, `npm run build`, `npm test` succeed
- [X] T003 [P] Create `src/web/src/styles/index.css` as the one stylesheet entry point: import Designsystemet CSS first, then Tailwind with Preflight scoped so it does not restyle Designsystemet controls, following the CSS package's Tailwind guidance (ADR 0007); document the layer order in a comment
- [X] T004 [P] Create `.github/workflows/build-and-test.yml` with jobs `backend` (actions/setup-dotnet 10.0.x, `dotnet test src/backend/MathKX.slnx --configuration Release`) and `web` (setup-node 22 with npm cache keyed on `src/web/package-lock.json`, `npm ci`, `npm run typecheck`, `npm test`, `npm run build` in `src/web`), on pull requests and pushes to `main`; leave `validate-content.yml` unchanged
- [X] T005 [P] Extend `.gitignore` for the new roots if needed (`src/web/dist/`, `src/web/node_modules/`, `src/web/test-results/`, `src/web/playwright-report/`; the .NET patterns already exist) and add `src/web/.gitignore` for Playwright artifacts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The random source with its fixtures, the content loader, and the domain records every story reads.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T006 [P] Add tests `src/backend/MathKX.Domain.Tests/Random/SplitMix64Tests.cs`: the five raw-output vectors of the seed proposal (seeds 0, 1, 42, 1234567890123456789, 18446744073709551615: three outputs each, decimal and hex), state wraparound, and a fresh stream per seed
- [X] T007 [P] Add tests `src/backend/MathKX.Domain.Tests/Random/BoundedSamplerTests.cs`: the four bounded-draw vectors; the four injected-rejection rows (bound, injected raw outputs, expected result, outputs consumed) using an injectable raw source; invalid bounds `0` and above `2^64 − 1`; the `limit == 2^64` case accepting every raw value; the draw after a rejection continues the stream
- [X] T008 [P] Add tests `src/backend/MathKX.Domain.Tests/Random/SeedTests.cs`: parse and format at both limits, reject `-1`, `01`, `abc`, `18446744073709551616`, `+5`, whitespace; never serialize as a number
- [X] T009 Implement `src/backend/MathKX.Domain/Random/IRawSource.cs`, `SplitMix64.cs` (the proposal's three-line step with `ulong` wrapping arithmetic and logical shifts), `BoundedSampler.cs` (`NextBelow(ulong n)` with rejection, explicit handling of `limit == 2^64`), and `Seed.cs` (`Parse`, `TryParse`, `Format`); T006–T008 pass
- [X] T010 [P] Create the content record types in `src/backend/MathKX.Domain/Content/`: `ExerciseDefinition.cs` (with `GeneratorSpec`, `InstanceSpec`, `Bounds`), `Registries.cs` (`GeneratorEntry`, `ValidatorEntry`, `RepresentationEntry`, `VisualComponentEntry`, `MisconceptionCodeEntry`), `Skill.cs` (with `LadderEntry`), `LessonMetadata.cs`, `LessonFrontMatter.cs`; records, no I/O
- [X] T011 [P] Add tests `src/backend/MathKX.Domain.Tests/Content/ContentCatalogTests.cs`: loads the repository's `content/` (path relative to the test assembly) and finds 2 pilot skills with the ladder, 3 pilot definitions, 5 registries, 1 lesson with both front matters; the `0.1` example is skipped by schema name; a definition naming an unregistered generator fails with the file path; front matter cases: double-quoted title, single-quoted title, folded `objective: >-` over two lines, an inline `# comment`, all decoded as the validator would
- [X] T012 Implement `src/backend/MathKX.Content/ContentCatalog.cs` (`Load(string contentRoot)`: registries by kind, skills by id, definitions by `id@version`, lessons by id; `System.Text.Json` with case-sensitive camelCase; schema basename dispatch; fail fast with path) and `FrontMatterReader.cs` (extract the `---` block, parse with YamlDotNet, return `title` and `objective` as strings); T011 passes
- [X] T013 Create `src/backend/MathKX.Api/Program.cs` with the minimal API host, `MathKX:ContentRoot` configuration (default `../../../content` relative to the project in development), the catalog registered as a singleton loaded at startup, problem-details error handling with a `code` extension, and a health route `GET /api/health` returning the loaded counts; `dotnet run` starts and serves it

**Checkpoint**: Random-source fixtures pass; the service starts on the repository content.

---

## Phase 3: User Story 2 - A maintainer can reproduce any question exactly (Priority: P1) 🎯 MVP

**Goal**: `(definition, version, seed)` resolves to the same question everywhere; validation is deterministic; nothing unsolicited carries the answer.

**Independent Test**: The replay fixture for `(numbers.addition.crossing-ten, 1, 42)` passes under four conditions; golden seeds, property tests, boundary fixtures, and the service contract tests pass.

### Tests for User Story 2

- [X] T014 [P] [US2] Add `src/backend/MathKX.Domain.Tests/Fixtures/addition-pair-v1.golden.json` with the structure of `contracts/generator-addition-pair.md` (ten seeds per pilot definition including 0, 1, 42, 1234567890123456789, 18446744073709551615; `poolSize` 45 and 36) with placeholder pairs, and tests `src/backend/MathKX.Domain.Tests/Generators/AdditionPairTests.cs`: golden seeds; pool size equals the canonical enumeration length; property test over 10 000 seeds per definition (bounds, every listed representation's `supports` box, every feasible pair observed); boundary fixtures (`4 + 4` in `within-10`, `9 + 9` in `crossing-ten`, `19 + 1` in no pilot definition); registry agreement (name, version, parameter names and domains equal `content/registry/generators.json`)
- [X] T015 [P] [US2] Add tests `src/backend/MathKX.Domain.Tests/Validators/IntegerAnswerTests.cs`: the reading table of `contracts/validation-result.md` (` 8 `, `08`, `-3`, ``, `abc`, `7,5`, `7.5`, `1 3`); one case per precedence row and the overlap cases (`3 + 5` → `35` is `add.concat`; `1 + 2` → `1` is `add.oneGroup`); determinism; registry agreement (artifact bounds, emitted codes); incorrect and invalid results carry no `sum`
- [X] T016 [P] [US2] Add tests `src/backend/MathKX.Domain.Tests/Instances/InstanceResolverTests.cs`: the replay fixture (resolve `crossing-ten@1` seed 42 in two languages, after two ladder moves and return, and with a stub `addition-pair@2` registered: identical; a v2 definition pinned to `@2` differs); fixed task `numbers.addition.four-plus-four@1` resolves without a seed and ignores a supplied one; unknown definition or version throws a typed error
- [X] T017 [P] [US2] Add contract tests `src/backend/MathKX.Api.Tests/ContractTests.cs` with `WebApplicationFactory`: the five numbered tests of `contracts/api.md` (identical bodies on repeated and post-restart resolution; no `sum` or `validation` key in instance, lesson, skill bodies, incorrect and invalid results, or non-revealing steps, and exactly one revealing step per sequence, the last; identical validation results; `lang` does not change mathematics; `400 invalid-seed` for `-1`, `01`, `abc`, `18446744073709551616`; `404 unknown-definition`; `400 invalid-artifact`; `404 unknown-step`; the step checks run for all four pilot sequences, including `groups` explanation on `within-10` and `four-plus-four`)

### Implementation for User Story 2

- [X] T018 [US2] Implement `src/backend/MathKX.Domain/Generators/IGenerator.cs` and `AdditionPairGenerator.cs`: canonical enumeration (first operand ascending, then second, filtered by the sum bounds), `PoolSize`, one `NextBelow(N)` draw on a fresh `SplitMix64(seed)`; freeze the golden fixture values after a reviewer checks two seeds by hand against the raw vectors (seed 42's first raw output modulo 45 and 36); T014 passes
- [X] T019 [P] [US2] Implement `src/backend/MathKX.Domain/Results/ResponseArtifact.cs` (reading rules), `ValidationStatus.cs`, `FeedbackCode.cs`, `ValidationResult.cs`, and `src/backend/MathKX.Domain/Validators/IntegerAnswerValidator.cs` with the precedence table; T015 passes
- [X] T020 [US2] Implement `src/backend/MathKX.Domain/Instances/InstanceIdentity.cs`, `Instance.cs` (no `Sum` member), and `InstanceResolver.cs` (definition at pinned version → generator at pinned version or fixed prompt → representations from the definition; validator identity from the definition); a `GeneratorRegistry` keyed by `name@version` so a stub `@2` can be registered in tests; T016 passes
- [X] T021 [US2] Implement the service endpoints in `src/backend/MathKX.Api/Endpoints/InstancesEndpoints.cs` (`GET /api/instances/{definitionId}/{version}/{seed}` with `-` for fixed tasks), `ValidationsEndpoints.cs` (`POST /api/validations` re-resolving the instance), `SkillsEndpoints.cs`, `LessonsEndpoints.cs` (`GET /api/lessons`, `GET /api/lessons/{id}` with titles and objectives per language from the front matter), and the DTOs in `src/backend/MathKX.Api/Dto/` with no `sum` or `validation` members by construction; problem-details codes `unknown-definition`, `invalid-seed`, `invalid-artifact`, `unknown-lesson`, `unknown-skill`; T017 passes except the step cases

**Checkpoint**: `dotnet test` green; `curl` reproduces `crossing-ten/1/42` byte-identically.

---

## Phase 4: User Story 1 - A learner practises addition with help before answering (Priority: P1)

**Goal**: The practice screen: a question, visual help before answering with stepped reveals, integer answer, typed feedback by code, input guidance, explanation after either result, another question, state preserved across language switch and resize, and the minimum delivery record.

**Independent Test**: A tester answers three questions (correct at once; incorrect then corrected after an explanation reveal; after opening visual help), switches language mid-question, and sees question, draft, and help preserved with every text in the active language.

### Tests for User Story 1

- [X] T022 [P] [US1] Add tests `src/backend/MathKX.Domain.Tests/Explanations/StepModelTests.cs`: `groups` help for `4 + 4` has four steps with only the last revealing and `sum` present only there; `groups` explanation for `4 + 4` (show the two labelled groups, combine them, the total counts all objects in both groups) has only its last step revealing and `sum` present only there; `make-ten` explanation for `8 + 5` has three steps with `need = 2`, `rest = 3`, `sum` only on the last; `make-ten` help sequence ends in a revealing step; every representation a pilot definition lists for `help` or `explanation` has a sequence for that kind; step values agree with the instance's operands for every pilot-definition seed in the golden fixture; an index out of range or a kind the definition's representations do not offer throws a typed error
- [ ] T023 [P] [US1] Add tests `src/web/tests/dictionaries.test.ts` (flattened `nb` and `en` key sets equal; non-empty strings; `feedback.*` keys equal the registered codes plus `correct`, `invalid.empty`, `invalid.notAnInteger`; `outcome.*` keys equal the outcome list; `explain.*` keys equal the step text codes exported by a shared constant) and `src/web/tests/translate.test.ts` (placeholder substitution; missing key throws in test)
- [ ] T024 [P] [US1] Add tests `src/web/tests/exercise-shell.test.tsx` with a mocked API client: initial render shows expression, field, submit, help toggle, no total in the accessibility tree; correct answer shows the completed equation; incorrect answer keeps the field editable and shows the code's text; unreadable input shows guidance and records `input-guidance`; opening help shows two labelled groups and keeps the draft; each "Next step" fetches one step and records `help-step` with its `reveals`; the groups' last step records `counting-complete`; "Show explanation" is available after correct and after incorrect results and records `explanation-open` and `explanation-step`; language switch and resize preserve question, draft, help state; "Another question" requests a new seed in the current definition; the lesson link records `lesson-opened` (non-revealing support) and returning to the practice route restores the question, draft, help state, and pending change; the status rendering is exhaustive (a `review-needed` result renders the reserved wording and no default branch exists)
- [ ] T025 [P] [US1] Add tests `src/web/tests/storage.test.ts`: round-trip under `mathkx.guest.v1`; `localStorage` throwing → memory fallback with `kept: false`; unknown schema version → discarded with a flag

### Implementation for User Story 1

- [X] T026 [US1] Implement `src/backend/MathKX.Domain/Explanations/StepModels.cs` (`For(instance, representation, kind)` returning the step list for the four pilot sequences: `groups` help, `groups` explanation (used by `within-10` and `four-plus-four`, which list `groups` for explanation), `make-ten` help, and `make-ten` explanation, each step with `Index`, `Count`, `Reveals`, `Visual` state, `Text { Code, Values }`; `sum` only when `Reveals`) and a `StepTextCodes` constant list; T022 passes
- [X] T027 [US1] Implement `src/backend/MathKX.Api/Endpoints/StepsEndpoints.cs` (`GET /api/instances/{definitionId}/{version}/{seed}/steps/{kind}/{index}`) with its DTO; the remaining step cases of T017 pass
- [ ] T028 [P] [US1] Create `src/web/src/i18n/nb.ts`, `en.ts`, `index.ts` (`translate`, `LANGS`, the namespaces of `contracts/dictionaries.md`; feedback and explanation texts from the prototype's `math.js` and `i18n.js`, status wordings and outcome labels from `contracts/observations.md`) and `src/web/src/i18n/codes.ts` exporting the feedback, outcome, and step-text code lists; T023 passes
- [ ] T029 [P] [US1] Create `src/web/src/api/types.ts` (the DTO shapes of `contracts/api.md`) and `src/web/src/api/client.ts` (`getLessons`, `getLesson`, `getSkill`, `getInstance`, `getStep`, `validate`, typed errors for the problem-details codes, no retries that could duplicate a submission)
- [ ] T030 [P] [US1] Create `src/web/src/state/storage.ts` (versioned `localStorage` wrapper with memory fallback and `kept` flag) and `src/web/src/state/observations.ts` (`SessionRecord`, `Delivery`, `Event` types from `data-model.md`; `recordEvent` dropping duplicate `submissionId`s; new delivery per resolved instance; `newSeed()` from `crypto.getRandomValues` formatted as a decimal string); T025 passes
- [ ] T031 [US1] Create `src/web/src/state/store.tsx` (context + reducer: language, current delivery and instance, draft, help open/step, explanation open/step, pending ladder change, deliveries, resumable; persisted through `storage.ts` on every change; hydrated on start)
- [ ] T032 [P] [US1] Port the math components to `src/web/src/components/math/MathExpr.tsx`, `Counters.tsx` (groups with step state from the service: counted counters, labels "First group, 4 counters", no total in any name), `MakeTen.tsx` (ten-frame state from the step's `frame` and `split`), `TenFrame.tsx`; props are the instance operands and the delivered step state only
- [ ] T033 [US1] Create `src/web/src/components/ExerciseShell.tsx` (anatomy items 2–5 of `contracts/learner-app.md`: expression with spoken form, field with numeric hint, submit, help toggle with `aria-expanded`, help panel with "Next step" fetching steps and recording events, result area as a live region with the feedback text, editable field after incorrect, "Show explanation" after either result with stepped fetching and reveal handling, "The answer has been shown" notice; and anatomy item 7, the link to the lesson page that records `lesson-opened` on the current delivery as non-revealing support and never `lesson-reveal`), `Feedback.tsx`, and `src/web/src/pages/PracticePage.tsx` wiring "Another question" (new seed, previous delivery `skipped` when it had no submission) and resuming the current delivery with its draft, help state, and pending change when the learner returns from the lesson; T024 passes
- [ ] T034 [US1] Create `src/web/src/pages/LessonPage.tsx` (title and objective from the lesson endpoint for the active language, practice entries as buttons, the note that the lesson text arrives with a later release), `src/web/src/App.tsx` with routes `/`, `/lessons/:id`, `/practice/:skillId`, `/record` (placeholder until Phase 6), the header with `LanguageSwitch.tsx`; the lesson list page at `/`
- [ ] T035 [US1] Package the deployable: `src/backend/MathKX.Api/Program.cs` maps static files from `wwwroot` (populated from `src/web/dist` by a documented build step in `src/backend/MathKX.Api/MathKX.Api.csproj` or a script) with history-API fallback that never shadows `/api/*`; `MathKX.Api.csproj` copies the repository `content/` into the publish output as `content/` (research R2), and `Program.cs` resolves `MathKX:ContentRoot` in this order: explicit configuration, `content/` beside the binaries, the repository-relative development default; add a smoke script `src/backend/scripts/smoke-published.sh` that runs `dotnet publish` to a temporary folder, starts the output from outside the checkout, and resolves `GET /api/lessons/number-bonds-to-ten` and `GET /api/instances/numbers.addition.within-10/1/42`; document the development proxy in `src/web/README.md`

**Checkpoint**: Scenario 1 of the quickstart works end to end against the running service; vitest and dotnet suites green.

---

## Phase 5: User Story 3 - A learner moves along the challenge ladder (Priority: P2)

**Goal**: "Make it easier" and "More challenge" move along the skill's ladder for the next question with the entry's sentence and honest end messages; "More like this" cancels a pending change; the make-ten help serves crossing-ten.

**Independent Test**: From `within-10`, "More challenge" leads to a `crossing-ten` question with its sentence and make-ten help; again at the top shows the honest message; "Make it easier" returns; the earlier `crossing-ten` identity reproduces.

### Tests for User Story 3

- [ ] T036 [P] [US3] Add tests `src/web/tests/ladder.test.tsx`: pending change set by "More challenge" shows the crossing-ten sentence and keeps the current question, draft, and help; "Another question" consumes the pending definition; "More like this" keeps the current definition and clears the pending change with a notice; at either end the honest message appears and nothing else changes; challenge requests are recorded as `challenge-request` events with the right `outcome` and never as submissions

### Implementation for User Story 3

- [ ] T037 [US3] Create `src/web/src/components/LadderControls.tsx` and the ladder logic in `src/web/src/state/store.tsx` (current entry from `getSkill`, pending change, apply on "Another question", clear on "More like this", `unavailable` at the ends) and show the ladder sentence and pending notice on `PracticePage.tsx` (anatomy item 1); T036 passes
- [ ] T038 [US3] Select the help representation per definition in `ExerciseShell.tsx` from the instance's `representations.help` (`groups` → `Counters`, `make-ten` → `MakeTen`) and add a vitest case that a `crossing-ten` instance renders the make-ten help with the frame never needing an operand above nine

**Checkpoint**: Scenario 3 of the quickstart works; the replay fixture still passes after ladder moves (covered by T016 at the domain level and by the end-to-end check in Phase 7).

---

## Phase 6: User Story 4 - A learner sees an honest record of their work (Priority: P2)

**Goal**: Outcomes derived per DL-029 from the recorded events, a record page with counts, the "kept in this browser only" notice, reload persistence, and the storage-unavailable notice.

**Independent Test**: A scripted session produces one delivery per outcome row; the record page shows those labels and counts in both languages; reload keeps them; blocked storage shows the notice and practice continues.

### Tests for User Story 4

- [ ] T039 [P] [US4] Add tests `src/web/tests/outcomes.test.ts`: one case per outcome row and per tag of `contracts/observations.md`, plus help closed without counting → `correctWithVisualHelp`; counting the last counter → `correctAfterExplanation` with `revealCounting`; make-ten help stepped to the end then correct → `correctAfterExplanation` with `revealHelp`; make-ten help stopped early → `correctWithVisualHelp`; explanation after correct → unchanged with `explainAfter`; input guidance then correct → `correctFirst`; incorrect then explanation reveal then correct → `correctAfterExplanation` with `feedbackBefore`; duplicate `submissionId` → one submission; resumable delivery → `unfinished`; summary counts only
- [ ] T040 [P] [US4] Add tests `src/web/tests/record-page.test.tsx`: labels and tags in both languages; the summary sentence has no `%`, no score, no streak; the notice switches between "kept in this browser only" and "not being kept" with the `kept` flag; "Clear my work" asks for confirmation and empties the record

### Implementation for User Story 4

- [ ] T041 [US4] Implement `src/web/src/state/outcomes.ts` (`deriveOutcome(delivery)`, `deriveTags(delivery)`, `summarize(record)`) exactly per `contracts/observations.md`; T039 passes
- [ ] T042 [US4] Create `src/web/src/pages/RecordPage.tsx` (deliveries with outcome labels and tags, summary counts, storage notice, clear action) and wire the `ended` event and the resumable draft on leaving and returning to `PracticePage.tsx` (FR-017); T040 passes

**Checkpoint**: Scenario 4 of the quickstart works, including reload and the private-window case.

---

## Phase 7: User Story 5 - Both languages and assistive technology (Priority: P3)

**Goal**: Every string from the dictionaries with parity enforced; keyboard and screen-reader operation; no total before reveal; touch targets; the end-to-end checks in CI.

**Independent Test**: The bilingual walkthrough passes in both languages; keyboard-only completion; the accessibility tree exposes no total before reveal.

### Tests for User Story 5

- [ ] T043 [P] [US5] Add `src/web/tests/literals.test.ts`: scan `src/web/src/**/*.tsx` for JSX text nodes and `aria-label`, `title`, `placeholder`, `alt` string literals containing a letter; allowlist notation, numbers, `MathKX`, `Designsystemet`, language self-names, `data-testid` values, class names; report file and line per violation
- [ ] T044 [P] [US5] Add `src/web/e2e/practice.spec.ts` and `src/web/playwright.config.ts` (web server: the built app served by the service; projects: Chromium desktop and an iPad viewport): the seven checks of `contracts/learner-app.md` (keyboard only; no total in the accessibility tree before the counting step; language switch mid-question preserves state and changes every string; ladder move shows the crossing-ten sentence and make-ten help, honest message at the top; privacy: no `sum` in instance, lesson, skill, non-revealing step, incorrect or invalid responses, and a revealing step only after the step control was pressed and recorded; touch targets at least 44 by 44; incorrect → explanation reveal → corrected shows "Answered after the answer was shown")

### Implementation for User Story 5

- [ ] T045 [US5] Make the practice screen pass T043 and T044: replace any remaining literal with `translate(...)`, add `aria-expanded` to the help toggle, move focus to the result area after submission, add `prefers-reduced-motion` handling and stepped equivalents to the math components, ensure 44 by 44 targets with Tailwind utilities on the Designsystemet buttons, and add the spoken form of the expression
- [ ] T046 [US5] Add the Playwright job to `.github/workflows/build-and-test.yml`: build the app, start the service with `MathKX:ContentRoot` pointing at the repository `content/`, `npx playwright install --with-deps chromium`, `npm run e2e`; upload the report on failure; add a `publish-smoke` step to the `backend` job that runs `src/backend/scripts/smoke-published.sh` so a published service resolves content outside the checkout

**Checkpoint**: All suites green in CI; Scenario 5 of the quickstart passes by hand.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, the walkthrough, and the measurements the spec asks for.

- [ ] T047 [P] Write `src/backend/README.md` (solution layout, how content is located, `dotnet run`, `dotnet test`, the golden-seed review rule, the no-platform-random rule) and `src/web/README.md` (scripts, proxy, dictionaries and the two checks, how to add a math component)
- [ ] T048 [P] Update `README.md` and `docs/architecture/architecture.md` ("System shape": `src/backend/` and `src/web/` now exist with their roles; the content check list unchanged) and `CONTRIBUTING.md` (how to run the three suites)
- [ ] T049 [P] Record the walkthrough: add `docs/reviews/walkthroughs/2026-practice-flow-bilingual.md` with the revised brief §7 script and the two language columns ticked, device and browser noted; no learner-session claim beyond what was done
- [ ] T050 Run the five quickstart scenarios by hand against the repository, correct any wording in `src/web/src/i18n/*.ts` or the contracts so the quoted texts match, and record the measured CI wall time in `specs/002-practice-flow/quickstart.md` (SC-007, under 10 minutes)
- [ ] T051 Confirm the seed-proposal fixtures pass in CI and note in the pull-request description that DL-024's trigger for ADR 0011 is met; do not write the ADR in this feature (research R13)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001 first; T002–T005 in parallel
- **Foundational (Phase 2)**: needs Phase 1; T006–T008 in parallel, then T009; T010 and T011 in parallel, then T012, then T013; blocks all stories
- **US2 (Phase 3)**: needs Phase 2; T014–T017 in parallel (tests), then T018 and T019 in parallel, T020, T021
- **US1 (Phase 4)**: needs Phase 3 (the shell consumes the service); T022–T025 in parallel; T026 → T027; T028, T029, T030, T032 in parallel; T031 → T033 → T034 → T035
- **US3 (Phase 5)**: needs Phase 4 (store and shell)
- **US4 (Phase 6)**: needs Phase 4 (observations and store); independent of Phase 5
- **US5 (Phase 7)**: needs Phases 4–6 for the full end-to-end run; T043 and T044 can be written after Phase 4
- **Polish (Phase 8)**: T047–T049 after Phase 7; T050 and T051 last

### Within Each Story

- Tests first, confirmed failing, then implementation
- Domain before service before learner app
- Record types before loaders; loaders before endpoints

### Parallel Opportunities

- Phase 1: T002 ∥ T003 ∥ T004 ∥ T005
- Phase 2: T006 ∥ T007 ∥ T008; T010 ∥ T011
- Phase 3: T014 ∥ T015 ∥ T016 ∥ T017; T018 ∥ T019
- Phase 4: T022 ∥ T023 ∥ T024 ∥ T025; T028 ∥ T029 ∥ T030 ∥ T032
- Phases 5 and 6 can run in parallel after Phase 4 (different files: `LadderControls.tsx` and ladder tests versus `outcomes.ts`, `RecordPage.tsx` and their tests; both touch `store.tsx`, so land those edits as separate commits)
- Phase 8: T047 ∥ T048 ∥ T049

---

## Parallel Example: User Story 2

```bash
# Tests together:
Task: "Golden seeds, property, boundary, registry agreement in src/backend/MathKX.Domain.Tests/Generators/AdditionPairTests.cs"   # T014
Task: "Reading and precedence in src/backend/MathKX.Domain.Tests/Validators/IntegerAnswerTests.cs"                              # T015
Task: "Replay fixture in src/backend/MathKX.Domain.Tests/Instances/InstanceResolverTests.cs"                                     # T016
Task: "Contract tests in src/backend/MathKX.Api.Tests/ContractTests.cs"                                                           # T017

# Then, together:
Task: "AdditionPairGenerator in src/backend/MathKX.Domain/Generators/"   # T018
Task: "Results and IntegerAnswerValidator in src/backend/MathKX.Domain/"  # T019
```

---

## Implementation Strategy

### MVP First (Phases 1–3)

1. Setup and the random source with its fixtures
2. US2: generator, validator, resolver, service with contract tests
3. **STOP and VALIDATE**: `curl` reproduces a question; the privacy tests pass; DL-024's trigger is met

### Incremental Delivery

1. US1: the practice screen with help, feedback, explanation, and the minimum record → Scenario 1 works
2. US3: the ladder → Scenario 3
3. US4: outcomes and the record page → Scenario 4
4. US5: dictionaries, accessibility, end-to-end in CI → Scenario 5
5. Polish: docs, walkthrough, measurements

### Single-Contributor Order

Phases run 1 → 2 → 3 → 4 → (5 ∥ 6) → 7 → 8.

---

## Notes

- `[P]` test tasks within one phase touch different files; the shared `store.tsx` edits of Phases 5 and 6 are the one place to coordinate.
- Golden-seed values are frozen once and reviewed by hand (two seeds); changing them afterwards means a new generator version.
- No ADR, constitution, content, or schema change is part of this feature; `content/` is read, never written.
- Commit after each task or checkpoint.
