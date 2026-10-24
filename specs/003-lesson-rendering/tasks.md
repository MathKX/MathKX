# Tasks: Lesson Rendering and the Detour Back to an Exercise

**Input**: Design documents from `specs/003-lesson-rendering/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md)

**Tests**: Included. The specification requires every requirement to be covered by automated tests in CI (FR-022, SC-001 to SC-004) and the constitution requires behaviour to ship with tests. Write each test before the code it covers and confirm it fails first. Backend tests are xUnit under `src/backend/`; web tests are vitest under `src/web/tests/`; end-to-end checks are Playwright under `src/web/e2e/`; the content-tooling test is `tools/validate-content.test.mjs`.

**Organization**: Tasks are grouped by user story in priority order, except that User Story 4 (practice entries and the lesson link) follows User Story 2, because its link reads the `lessons` field User Story 2 adds to the instance. User Story 1 renders the `:::practice` entries itself (spec SC-001 counts them, and spec 002's end-to-end checks press them), so User Story 4 only replaces the hard-coded lesson link and adds the origin lesson.

**Deployment**: every push to `main` deploys to production (`.github/workflows/deploy.yml`: the build-and-test and content workflows, then `dotnet publish` with `content/` and the learner app, then Azure App Service and a health check). What reaches `main` must therefore be honest on its own. Phase 3 alone is not: the lesson would show `8 + 5 = 13` while the existing link still records a plain `lesson-opened` at click, so a learner's later correct answer would read "Correct with help" instead of "Answered after the answer was shown". Phases 1–5 (Setup, Foundational, US1, US2, US3) therefore reach `main` together as the first release; US4, US5, and the polish tasks may follow as separate merges. Work on a branch and merge only at those boundaries.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story the task belongs to (US1–US5)
- Every task names the exact file(s) it touches

## Path Conventions

Backend under `src/backend/` (existing solution `MathKX.slnx`), learner app under `src/web/`, content tooling at the root. See plan.md "Project Structure". Contract references are to `specs/003-lesson-rendering/contracts/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Dependencies and CI steps the stories need.

- [X] T001 [P] Add to `src/web/package.json` `dependencies` the exact versions the root `package.json` pins: `unified` 11.0.5, `remark-parse` 11.0.0, `remark-gfm` 4.0.1, `remark-frontmatter` 5.0.0, `remark-directive` 4.0.0, `remark-math` 6.0.0, `unist-util-visit` 5.1.0, `mdast-util-to-string` 4.0.0; add `@types/mdast` (latest 4.x, exact) to `devDependencies`; run `npm install` in `src/web` to update `src/web/package-lock.json`; `npm run typecheck`, `npm test`, and `npm run build` still pass
- [X] T002 [P] Add the `Markdig` package (latest stable at implementation, exact version) to `src/backend/MathKX.Content/MathKX.Content.csproj` only; `dotnet build src/backend/MathKX.slnx` passes with warnings as errors
- [X] T003 [P] In `.github/workflows/build-and-test.yml`, job `web`: add a step before "Install" that sets up the root npm cache (`cache-dependency-path` listing both `package-lock.json` and `src/web/package-lock.json`) and runs `npm ci` with `working-directory: .`, so web tests can import `tools/lib/*.mjs` (research R1, R11); no other job changes

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The content snapshot keeps each translation's Markdown and each lesson's asset names; the app's API layer knows the new calls. Every story reads these.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 [P] Extend `src/backend/MathKX.Domain.Tests/Content/ContentCatalogTests.cs`: for `number-bonds-to-ten`, `catalog.Translation(id, "nb").Markdown` and `"en"` equal the files' text exactly; `catalog.Assets(id)` is `["ten-frame-3-7.svg"]`; `catalog.LessonsForDefinition("numbers.addition.within-10@1")` and `crossing-ten@1` return the lesson, `four-plus-four@1` returns none; a temporary content root whose lesson `assets/` holds a file named `bad name.svg` or a subdirectory fails the load with the path (data-model.md "Content snapshot")
- [X] T005 Add `LessonTranslation` (Language, File, Markdown, FrontMatter; `Facts` added in T030) and `LessonAssets` records to `src/backend/MathKX.Domain/Content/Records.cs`, and to `src/backend/MathKX.Domain/Content/ContentCatalog.cs` the members `Translation(lessonId, language)`, `Assets(lessonId)`, and `LessonsForDefinition(definitionKey)` (lessons whose `practice` lists the key, ordered by ID), keeping `FrontMatters` and `FrontMatter(...)` for existing callers
- [X] T006 In `src/backend/MathKX.Content/ContentLoader.cs`, keep each translation's full text alongside its front matter and list each lesson's `assets/` folder (regular files directly inside, names matching `^[A-Za-z0-9][A-Za-z0-9._-]*$`, sorted ordinally; anything else throws `ContentLoadException` with the relative path; a missing folder is an empty list); T004 passes
- [X] T007 [P] In `src/web/src/api/types.ts` add `LessonContentDto { id; version; language; markdown }`, `VisualStepsDto { type; a; b; steps: StepDto[] }`, `TenFrameExplorerDto { type; states: { filled; partner }[] }`, and `lessons?: { id: string; discloses: boolean }[]` on `InstanceDto`; add `getLessonContent(id, lang)`, `getVisualSteps(type, a, b)`, and `getTenFrameExplorer()` to `PracticeApi`; implement them in `src/web/src/api/client.ts` against `contracts/api.md`
- [X] T008 [P] Extend `src/web/tests/fakeApi.ts`: `getLessonContent` returns the repository's `content/lessons/number-bonds-to-ten/{nb,en}.md` read with `node:fs` (so web tests render the real lesson); `getVisualSteps` and `getTenFrameExplorer` return fixed shapes matching `contracts/api.md`; instances carry `lessons` from a new `FakeOptions.lessons` map (default: the pilot lesson with `discloses` from a `FakeOptions.discloses` predicate, default false); a `FakeOptions.contentFails` flag rejects `getLessonContent`; a call log records every method call for the privacy tests

**Checkpoint**: `dotnet test` and `npm test` pass; nothing visible changes yet.

---

## Phase 3: User Story 1 - A learner reads the lesson in their language (Priority: P1) 🎯 MVP

**Goal**: The whole pilot lesson renders in both languages from the service's Markdown, with tables, mathematics, the illustration, the worked example, and the practice entries in place; switching language keeps the section.

**Independent Test**: Open the lesson in each language and compare it with the source section by section; switch language at "Why is this useful?" and stay there (spec User Story 1).

### Tests for User Story 1

- [X] T009 [P] [US1] Add contract tests to `src/backend/MathKX.Api.Tests/ContractTests.cs` for `contracts/api.md` tests 2 and 3: `GET /api/lessons/number-bonds-to-ten/content/nb` and `/en` return the files byte for byte with `id`, `version`, `language`; `unknown-lesson` and `unknown-language` problems; the asset endpoint serves `ten-frame-3-7.svg` as `image/svg+xml` with `X-Content-Type-Options: nosniff`, the stated `Content-Security-Policy`, and `Cache-Control: no-cache`; `../lesson.json`, `..%2Flesson.json`, `lesson.json`, and a name with a disallowed extension are `404 unknown-asset`; two calls give identical bodies
- [X] T010 [P] [US1] Add `src/web/tests/notation.test.ts`: every mathematics source in both pilot files (collected with `tools/lib/markdown.mjs`) and every example row of `specs/001-pilot-content-contract/contracts/directives-and-notation.md` parse with `src/web/src/lesson/notation.ts` to the same tree and normalized string as `tools/lib/notation.mjs`; an unsupported command (`\sqrt{2}`) is an error in both
- [X] T011 [P] [US1] Add `src/web/tests/parse-agreement.test.ts`: for `nb.md` and `en.md`, `src/web/src/lesson/parse.ts` and `tools/lib/markdown.mjs` yield equal heading anchors with their texts, equal directive names and attributes in order, equal mathematics sources in order, and equal image URLs and alternative texts (research R1)
- [X] T012 [P] [US1] Add `src/web/tests/lesson-render.test.tsx` for `contracts/lesson-renderer.md` tests 1–5 with the fake API: every heading (with `id`), paragraph, list item, table cell (header cells as `th scope="col"`), mathematics node, image, example, and practice entry of each file is present, counted against the parsed tree (SC-001); the worked example's one-line `$$…$$` renders as `math[display="block"]` and table mathematics inline; an `html` node, an unknown directive, an unknown visual type, and an unparsable expression render the placeholder text and never raw markup; image `src` points at `/api/lessons/number-bonds-to-ten/assets/ten-frame-3-7.svg`; an external link has `rel="noopener noreferrer"` and a `javascript:` link renders as text; with the `#why` section marked in view, switching to `nb` shows "Hvorfor er det nyttig?" as the section in view (spec User Story 1 scenario 6)

### Implementation for User Story 1

- [X] T013 [P] [US1] Add `GET /api/lessons/{id}/content/{lang}` and `GET /api/lessons/{id}/assets/{name}` to `src/backend/MathKX.Api/Endpoints/ContentEndpoints.cs` with `LessonContentDto` in `src/backend/MathKX.Api/Dto/Dtos.cs`, per `contracts/api.md` (asset name must be in `catalog.Assets(id)`, extension allowlist, the three headers, file streamed from the lesson's `assets/` folder under the content root); T009 passes
- [X] T014 [P] [US1] Port the grammar of `tools/lib/notation.mjs` to `src/web/src/lesson/notation.ts` (exported `parseNotation` and `normalize` with the same tree node names `row`, `mn`, `mi`, `mo`, `sup`, `sub`, `frac`, `prime`) and add `src/web/src/lesson/MathNotation.tsx` (not `Notation.tsx`: it would collide with `notation.ts` on case-insensitive file systems) rendering the tree as MathML Core (`<math display="inline|block">`, `mrow`, `mn`, `mi`, `mo`, `msup`, `msub`, `mfrac`; prime as `msup` with `′`; no `aria-label`; the placeholder with the source text and `lesson.expressionFailed` on a parse error); T010 passes
- [X] T015 [P] [US1] Create `src/web/src/lesson/parse.ts`: the processor `unified().use(remarkParse).use(remarkGfm).use(remarkFrontmatter, ["yaml"]).use(remarkDirective).use(remarkMath)`, `parseLesson(markdown)` returning the tree, and helpers `headingAnchor(node)` (the validator's pattern, also returning the heading text without it) and `directiveAttributes(node)`; T011 passes
- [X] T016 [US1] Create `src/web/src/lesson/render.tsx`: `LessonBody({ tree, lessonId, lang, components })` mapping nodes to React elements per the table in `contracts/lesson-renderer.md` (headings with anchors and a "link to section" control, lists, links with the scheme rules, images rewritten to the assets endpoint, tables with `th scope="col"` in a scrollable labelled container, `inlineMath`/`math` through `Notation` with the one-line `$$` display rule, `:::example` as a framed `section`, references resolved, `html` and anything unknown as the placeholder `lesson.unsupported`); `:::visual` and `:::practice` are rendered through the `components` prop so later stories plug in; no `dangerouslySetInnerHTML` anywhere
- [X] T017 [P] [US1] Create `src/web/src/lesson/PracticeEntry.tsx`: the stub page's practice button moved here ("Practise: {description}" with the ladder description for the directive's definition and version, `data-testid="practice-{definition}"`, the same `startPractice` call and navigation as `src/web/src/pages/LessonPage.tsx` today)
- [X] T018 [P] [US1] Create `src/web/src/lesson/sections.ts`: a hook that observes the level-2 and level-3 headings with `IntersectionObserver`, returns the anchor of the last heading above the viewport top, and `restoreSection(anchor)` scrolling to it (instant under `prefers-reduced-motion`, top of the page when the anchor is missing) without moving focus (research R8)
- [X] T019 [US1] Rewrite `src/web/src/pages/LessonPage.tsx`: keep loading the lesson metadata and skills; lazy-load the lesson module (`React.lazy` over `src/web/src/lesson/LessonView.tsx`, the chunk entry that parses, renders, restores the section, and reports its first commit through `onShown`; the page imports only `Placeholder.tsx` and types from the chunk's modules, so the Markdown stack stays out of the main bundle) so Vite emits it as a separate chunk; fetch the selected language's content with `getLessonContent` (cache each language for the visit), parse it, render title and objective from metadata as `<h1>` and lead paragraph, then `LessonBody` with `PracticeEntry` for `:::practice` and the placeholder for `:::visual` until T046; on a language switch, render the other language and restore the section; on a content failure show `lesson.contentFailed` with a retry button; remove the `lesson.bodyLater` note
- [X] T020 [P] [US1] Set `document.documentElement.lang` from the store's language in `src/web/src/App.tsx` (an effect), keeping `lang` on `<main>`; MathML is then read in the selected language (research R2)
- [X] T021 [P] [US1] Add the strings `lesson.unsupported` ("This part of the lesson cannot be shown here." / "Denne delen av leksjonen kan ikke vises her."), `lesson.expressionFailed` ("This expression could not be shown." / "Dette uttrykket kunne ikke vises."), `lesson.contentFailed`, `lesson.retry`, `lesson.sectionLink` ("Link to section: {heading}" / "Lenke til avsnittet: {heading}"), and `lesson.tableScroll` to `src/web/src/i18n/en.ts` and `src/web/src/i18n/nb.ts`; remove `lesson.bodyLater` from both; `tests/dictionaries.test.ts` and `tests/literals.test.ts` pass; T012 passes

**Checkpoint**: The lesson reads in both languages; spec 002's end-to-end checks still press the practice entries on the lesson page and pass.

---

## Phase 4: User Story 2 - A learner leaves a question for the lesson and comes back to it (Priority: P1)

**Goal**: The lesson page gates a disclosing lesson behind the notice, records `lesson-opened` or `lesson-reveal` only when the lesson is shown, works by any route, and offers the way back with the question's state intact; `lessonAfter` exists.

**Independent Test**: The three detours of spec User Story 2's Independent Test (`6 + 5`, `5 + 8`, `9 + 1`), each returning to the same question and producing the stated outcome and tag.

### Tests for User Story 2

- [X] T022 [P] [US2] Add `src/backend/MathKX.Domain.Tests/Lessons/LessonFactsReaderTests.cs`: for every case of `specs/003-lesson-rendering/contracts/lesson-facts.fixture.json` (read from the repository; prefix the stated front matter), `LessonFactsReader.Read(markdown)` yields the expected expression sources in order and the expected visuals with their attributes as strings compared to the integers read
- [X] T023 [P] [US2] Add a test to `tools/validate-content.test.mjs` that runs every case of `specs/003-lesson-rendering/contracts/lesson-facts.fixture.json` through `parseLessonMarkdown` from `tools/lib/markdown.mjs` and asserts the expected expressions and visuals (so a remark upgrade that changes them fails here first)
- [X] T024 [P] [US2] Create `src/backend/MathKX.Domain.Tests/Fixtures/disclosure.number-bonds-to-ten.json` with the 11 disclosing instances of `contracts/disclosure.md` (definition, a, b, `where`) and add `src/backend/MathKX.Domain.Tests/Lessons/LessonDisclosureTests.cs`: for all 45 `within-10` and 36 `crossing-ten` pairs, the decision against the repository lesson equals the fixture (absent means not disclosing), the `nb` and `en` translations agree on every pair, and the synthetic cases of `contracts/disclosure.md` hold (`9+4` and `9+1` do not disclose; commuted expression and commuted visual do; `ten-frame-explorer` never does); failures name the instance, translation, and expected and actual decision
- [X] T025 [P] [US2] Add contract test 1 of `contracts/api.md` to `src/backend/MathKX.Api.Tests/ContractTests.cs`: every pilot instance response has `lessons` with `discloses` matching the fixture of T024; the fixed task has `[]`; no instance body contains `sum` or any lesson expression text
- [X] T026 [P] [US2] Add `src/web/tests/lesson-gate.test.tsx` for `contracts/detour.md` unit tests 1–8 and 10 with the fake API (its call log proves "no content request"): non-disclosing detour records one `lesson-opened` after render; disclosing detour shows the notice with no content call; "Cancel" records nothing; "Show visual help instead" records no lesson event and no content call, and after the practice view mounts exactly one `visual-help-opened` is recorded and a correct answer derives `correctWithVisualHelp`; "Open the lesson anyway" calls for content and records one `lesson-reveal` after render; with `contentFails`, nothing is recorded and the way back is offered; leaving before the content resolves records nothing; the lesson-list route behaves like the link; no question or an unlisted definition records nothing; an answered question records `lesson-opened` only when reached with `from=question`, which is then removed from the address; a language switch records nothing new; a stored instance without `lessons` is re-resolved first; return by the banner restores draft, help step, explanation state, and pending change; modified activation of the lesson link (Ctrl, Meta, Shift, Alt) leaves the source tab and its store unchanged, a page opened at the link's address records the post-answer opening, and a later plain visit in the source tab records nothing (unit test 10)
- [X] T027 [P] [US2] Extend `src/web/tests/outcomes.test.ts`: `lesson-opened` after the first `correct` adds `lessonAfter` and leaves the outcome unchanged; tag order ends `visualAfter, explainAfter, lessonAfter`; `lesson-opened` before `correct` still gives `correctWithHelp` with `lessonBefore`, and `lesson-reveal` still gives `correctAfterExplanation` with `revealLesson`
- [X] T028 [US2] Add `src/web/e2e/lesson.spec.ts` with `contracts/detour.md` end-to-end checks 1–5, pinning questions with a Playwright init script that makes `crypto.getRandomValues` fill the next 8-byte array with the big-endian bytes of the golden seed (`crossing-ten` 1234567890123456789 for `6 + 5`, `crossing-ten` 100 for `5 + 8`, `within-10` 100 for `9 + 1`); assert the absence of any `/api/lessons/number-bonds-to-ten/content/` request before "Open the lesson anyway" from the page's request log; run on both Playwright projects

### Implementation for User Story 2

- [X] T029 [P] [US2] Create `src/backend/MathKX.Domain/Lessons/LessonFacts.cs` (records `LessonFacts`, `LessonExpression { Source, Normalized }`, `LessonVisual { Type, Attributes }`, with `Normalize` removing whitespace and reading `−` and `–` as `-`) and `src/backend/MathKX.Domain/Lessons/LessonDisclosure.cs` (`For(LessonFacts, Instance)` and `For(IEnumerable<LessonFacts>, Instance)` per `contracts/disclosure.md`, returning `DisclosureDecision { Discloses, Where }`)
- [X] T030 [US2] Create `src/backend/MathKX.Content/LessonFactsReader.cs` (Markdig pipeline with `UseMathematics()` and the pipe-table extension; expressions from `MathInline` and `MathBlock` in document order, never inside code; visuals from paragraph blocks whose first line matches `^:::visual\{(.*)\}\s*$`, attributes parsed as `key="value"` pairs and integer-converted; no visuals from code blocks), add `Facts` to `LessonTranslation`, and fill it in `src/backend/MathKX.Content/ContentLoader.cs`; T022 passes
- [X] T031 [US2] Add `lessons` to `InstanceDto` in `src/backend/MathKX.Api/Dto/Dtos.cs` (`LessonDisclosureDto { Id, Discloses }`) and fill it in `src/backend/MathKX.Api/Endpoints/InstancesEndpoints.cs` from `catalog.LessonsForDefinition` and `LessonDisclosure.For` over both translations' facts; T024 and T025 pass
- [X] T032 [US2] In `src/web/src/state/store.tsx`: add the derived `currentQuestion(state)` (current delivery with no `correct` submission and no `skipped` event; `contracts/detour.md` "Terms"); add `lessonShown(lessonId, { detour, discloses, fromQuestion })` that appends at most one `support` event to the current delivery per the recording table of `contracts/detour.md`; add `showHelpInstead()` storing `pendingHelpOpen` (the current delivery ID, in memory) and, in the path that runs when the practice view mounts and presents, consume it by calling `toggleHelp()` when that delivery is still current and help is closed (so `visual-help-opened` is recorded on the one path spec 002 records it), dropping it otherwise; add `ensureInstanceLessons()` re-resolving the current identity when `instance.lessons` is absent; stop recording at click time (T035 removes `openLesson()`; the lesson page records instead)
- [X] T033 [P] [US2] Create `src/web/src/components/LessonGate.tsx`: a labelled region with the heading `detour.noticeTitle` ("This lesson shows the answer to {prompt}"), the text `detour.noticeBody`, and the actions "Open the lesson anyway" (primary), "Show visual help instead" (only when the instance lists a help representation), and "Cancel", all 44 by 44 on touch; focus moves to the heading when it appears; the prompt is the question's expression, never the result
- [X] T034 [P] [US2] Create `src/web/src/components/ReturnBanner.tsx`: "Back to your question" with `AdditionPrompt` for the current question as a link to `/practice/{skillId}`, and "Dismiss" hiding it for the visit; a labelled region above the lesson title
- [X] T035 [US2] In `src/web/src/router.tsx`, make `matchRoute` and the router state use the path only (strip `?…` and `#…` before splitting) and expose the query as `search`; in `src/web/src/components/ExerciseShell.tsx`, give the lesson link the target `{lessonHref}?from=question` and no `onActivate` (the router's `Link` calls `onActivate` before filtering modified clicks), and remove `openLesson()` from the store API (keep the link's lesson as it is until T050)
- [X] T036 [US2] Integrate the gate in `src/web/src/pages/LessonPage.tsx`: on entry create the visit (detour if `currentQuestion` exists and the lesson's practice lists its definition and version; wait for `ensureInstanceLessons`); with a closed gate render `LessonGate` and do not call `getLessonContent`; after the lesson content's first commit call `lessonShown` once per visit (an effect keyed on the visit, not on the language); read `from=question` from the router's query when the visit starts and remove it with `history.replaceState`; render `ReturnBanner` during a detour; "Show visual help instead" calls `showHelpInstead()` and navigates to `/practice/{skillId}`; "Cancel" navigates there; T026 passes
- [X] T037 [P] [US2] Add `lessonAfter` to `src/web/src/state/outcomes.ts` (type, `TAG_ORDER` after `explainAfter`, derived from `lesson-opened` after the first `correct`), the tag labels `tag.lessonAfter` ("Lesson opened after answering" / "Leksjon åpnet etter svaret") to both dictionaries, and the tag with "(added by spec 003)" to the tag paragraph and test list of `specs/002-practice-flow/contracts/observations.md`; T027 passes
- [X] T038 [P] [US2] Add the strings `detour.noticeTitle`, `detour.noticeBody` ("If you open it now, your answer will be recorded as given after the answer was shown. You can also get visual help with the question instead."), `detour.openAnyway`, `detour.helpInstead`, `detour.cancel`, `detour.back` ("Back to your question"), `detour.dismiss`, and the region labels to `src/web/src/i18n/en.ts` and `nb.ts` with Norwegian wording reviewed against the prototype's `ex.lessonReveal*` strings in `Prototype/mathkx-designsystemet/src/i18n-review.js`; dictionary and literal checks pass
- [X] T039 [US2] Make `src/web/e2e/lesson.spec.ts` (T028) pass against the real service and the built app on both projects

**Checkpoint**: Detours by link and by lesson list behave as specified; the record shows the honest outcomes; spec SC-003 and SC-004 hold.

---

## Phase 5: User Story 3 - A learner explores the lesson's visual models (Priority: P2)

**Goal**: The ten-frame explorer and the step-through `make-ten` and `groups` visuals work in the lesson by touch, keyboard, and screen reader, from the same models as practice.

**Independent Test**: Set the explorer to every value 0–10 by keyboard and touch; step the make-ten model for `8 + 5` both ways; its steps equal the practice explanation for `8 + 5`.

### Tests for User Story 3

- [X] T040 [P] [US3] Extend `src/backend/MathKX.Domain.Tests/Explanations/StepModelTests.cs`: `StepModels.ForValues(a, b, rep, Explanation)` equals `StepModels.For(instance, rep, Explanation)` for every pilot instance and its explanation representation; add `TenFrameExplorerTests` in the same folder (eleven states, `filled + partner = 10`, in order)
- [X] T041 [P] [US3] Add `contracts/api.md` contract tests 4 and 5 to `src/backend/MathKX.Api.Tests/ContractTests.cs`: `GET /api/visuals/make-ten?a=8&b=5` equals the explanation steps of an `8 + 5` instance step for step; `groups` with 4 and 4 likewise; `groups` 9 and 9, `make-ten` 2 and 2, a missing or non-integer value give `400 unsupported-values`; an unregistered type gives `404 unknown-visual`; `ten-frame-explorer` returns eleven states
- [X] T042 [P] [US3] Add `src/web/tests/lesson-visuals.test.tsx`: the explorer starts at `start`, arrow keys, Home, and End change the value, the sentence "{filled} and {partner} make 10." is shown, and the live region announces once per settled change; `StepVisual` steps forward and back by keyboard, shows "Step n of count", and no accessible name or live text contains the total before the last step; a failing data call shows `lesson.visualFailed` with retry while the rest of the lesson stays rendered

### Implementation for User Story 3

- [X] T043 [US3] Refactor `src/backend/MathKX.Domain/Explanations/StepModels.cs` so `ForValues(int a, int b, string representation, StepKind kind)` builds the steps and `For(Instance, …)` checks the instance offers the representation and calls it; add `src/backend/MathKX.Domain/Explanations/TenFrameExplorer.cs` with `States()`; spec 002's step tests and T040 pass
- [X] T044 [US3] Create `src/backend/MathKX.Api/Endpoints/VisualsEndpoints.cs` (`GET /api/visuals/{type}` with `a` and `b` checked against `catalog.VisualComponents[type].Attributes` and the linked representation's `Supports`; `ten-frame-explorer` without values) with `VisualStepsDto` and `TenFrameExplorerDto` in `src/backend/MathKX.Api/Dto/Dtos.cs`, and map it in `src/backend/MathKX.Api/Program.cs`; T041 passes
- [X] T045 [P] [US3] Create `src/web/src/components/math/TenFrameExplorer.tsx` (the existing `TenFrame` with the chosen value filled; a radio group of eleven 44-pixel options labelled 0–10 with arrow, Home, and End keys; the sentence `lesson.explorerPair`; a polite live region updated 250 ms after the last change) and `src/web/src/components/math/StepVisual.tsx` (the existing `MakeTen` or `Groups` drawing for the current step, "Previous step" and "Next step", `practice.stepOf`, the step sentence from the `explain.*` keys, motion only without reduced motion, the failure state with retry)
- [X] T046 [US3] Wire `:::visual` in `src/web/src/pages/LessonPage.tsx` through `LessonBody`'s `components` to `TenFrameExplorer` (data from `getTenFrameExplorer`, initial `start`) and `StepVisual` (data from `getVisualSteps(type, a, b)`), requested only when the lesson content is shown; add `lesson.explorerPair` ("{filled} and {partner} make 10." / "{filled} og {partner} blir 10."), `lesson.explorerLabel`, `lesson.previousStep`, and `lesson.visualFailed` to both dictionaries; T042 passes

**Checkpoint**: Both visuals work in both languages; the lesson has no placeholders.

---

## Phase 6: User Story 4 - A learner starts practice from the place in the lesson that names it (Priority: P2)

**Goal**: Practice entries start practice with spec 002's explicit-choice behaviour (rendered since US1); the practice screen's lesson link comes from the instance's `lessons` and the lesson that started practice.

**Independent Test**: Both entries start practice in both languages; the lesson link opens this lesson; a definition no lesson lists has no link; with two lessons on one definition, the link follows the originating lesson.

### Tests for User Story 4

- [X] T047 [P] [US4] Add `contracts/detour.md` unit test 9 to `src/web/tests/lesson-gate.test.tsx` with a fake catalogue of `a-lesson` and `b-lesson` listing the same definition: practice started from `b-lesson` links to `b-lesson` on the first question, after "Another question", after a ladder move and back, and after a reload; practice started from the practice route links to `a-lesson`
- [X] T048 [P] [US4] Extend `src/web/tests/exercise-shell.test.tsx`: an instance with `lessons: []` (the fixed task) shows no lesson link; with the pilot lesson the link targets `/lessons/number-bonds-to-ten`; choosing a practice entry on another variation replaces the question in progress and closes it as `skipped` when unsubmitted (spec User Story 4 scenario 2; spec 002 behaviour unchanged)

### Implementation for User Story 4

- [X] T049 [US4] Add `originLessonId?` to `Delivery` in `src/web/src/state/observations.ts`; in `src/web/src/state/store.tsx` give `startPractice` a third parameter `originLessonId`, record it on the first delivery, and copy it from the previous delivery into every new one (another, more like this, ladder moves, resume); pass the lesson ID from `src/web/src/lesson/PracticeEntry.tsx`; deliveries stored before this feature load without it
- [X] T050 [US4] In `src/web/src/components/ExerciseShell.tsx`, compute the lesson link from `instance.lessons` and the current delivery's `originLessonId` per `contracts/detour.md`, keeping the `?from=question` suffix of T035 (no link for an empty list) and remove the hard-coded `lessonHref` from `src/web/src/App.tsx` and `src/web/src/pages/PracticePage.tsx`; T047 and T048 pass; spec 002's end-to-end checks still pass

**Checkpoint**: The link back is derived from content; the multi-lesson case is covered.

---

## Phase 7: User Story 5 - A contributor can find, preview, and propose a change to the lesson (Priority: P3)

**Goal**: "Edit this lesson" and "Suggest an improvement" on every lesson, with no learner data; documented local preview.

**Independent Test**: The links point at the right file and contain only lesson identity, version, language, and section; following the preview steps shows an edited sentence.

### Tests for User Story 5

- [ ] T051 [P] [US5] Add `contracts/lesson-renderer.md` test 6 to `src/web/tests/lesson-render.test.tsx`: in `nb`, "Edit this lesson" is `https://github.com/MathKX/MathKX/blob/main/content/lessons/number-bonds-to-ten/nb.md`; the issue link's decoded `title` and `body` contain the lesson ID, `1`, `nb`, and the section anchor in view and contain none of the store's delivery IDs, seeds, drafts, or prompts (checked with a store holding a question and a draft); both have `target="_blank"` and `rel="noopener noreferrer"`

### Implementation for User Story 5

- [ ] T052 [P] [US5] Create `src/web/src/lesson/contribute.ts` (`editUrl(id, file)` and `issueUrl({ id, version, lang, section })` per research R10, using `URLSearchParams`) and render the footer links in `src/web/src/pages/LessonPage.tsx` with `lesson.edit` ("Edit this lesson" / "Rediger leksjonen") and `lesson.suggest` ("Suggest an improvement" / "Foreslå en forbedring") plus the issue's title and body templates in both dictionaries; T051 passes
- [ ] T053 [P] [US5] Add a "Preview a lesson" section to `CONTRIBUTING.md` and a pointer in `src/web/README.md`: root `npm ci`, `dotnet run --project src/backend/MathKX.Api`, `npm run dev` in `src/web`, open `/lessons/{id}`, restart the service after editing a lesson file (the snapshot loads at startup), `npm run validate` before opening a pull request (FR-018)

**Checkpoint**: All five stories work; quickstart scenarios 1–5 can be run.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [ ] T054 [P] Confirm the lesson renderer is a separate chunk in the `npm run build` output of `src/web` and the practice route does not load it (network log in a Playwright check added to `src/web/e2e/lesson.spec.ts`)
- [ ] T055 [P] Add a keyboard-only and 200 percent zoom pass of the lesson page to `src/web/e2e/lesson.spec.ts`: every control reachable in order with visible focus, the explorer and the step visual operable, no horizontal page scroll at 1024 pixels except inside the table container, controls at least 44 by 44 on the iPad project (FR-021, SC-006)
- [ ] T056 Update `README.md` "Current status" and the spec 003 row of `specs/README.md` to say lesson rendering and the detour are implemented
- [ ] T057 Run line 1 of the bilingual walkthrough script (revised brief §7) in both languages and record the result as a new dated file under `docs/reviews/walkthroughs/`, referencing the spec 002 walkthrough's "partial" line (SC-005); note what still needs a physical iPad with VoiceOver
- [ ] T058 Run the five quickstart scenarios by hand, correct any quoted wording in `specs/003-lesson-rendering/quickstart.md` or the contracts to match the dictionaries, and record the measured CI wall time there (SC-008)
- [ ] T059 Record the first contributor check (SC-007) as an open human validation item in the pull-request description: a contributor who has not seen the code edits a sentence, previews, and validates; findings recorded, not scored
- [X] T060 [P] Extend `src/backend/scripts/smoke-published.sh` (run by the backend job and therefore before every deploy): from the published service started outside the checkout, `GET /api/lessons/number-bonds-to-ten/content/en` returns the lesson's Markdown and `GET /api/lessons/number-bonds-to-ten/assets/ten-frame-3-7.svg` returns `image/svg+xml`, proving the deploy package carries the lesson files and assets
- [X] T061 After the first release (Phases 1–5) has deployed, run quickstart scenarios 1 and 3 against the production URL from the deploy job's `environment.url`, in both languages, and add the result to the walkthrough file of T057; record any difference from the local run

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001 ∥ T002 ∥ T003
- **Foundational (Phase 2)**: needs Phase 1; T004 then T005 then T006; T007 ∥ T008 alongside; blocks all stories
- **US1 (Phase 3)**: needs Phase 2; tests T009–T012 in parallel; T013, T014, T015, T017, T018, T020, T021 in parallel; T016 after T014 and T015; T019 after T016–T018
- **US2 (Phase 4)**: needs Phase 3 (the gate wraps the rendered lesson); tests T022–T028 in parallel; T029 → T030 → T031; T032 → T035 (router query and link) → T036 (gate integration, which reads the query and needs T033 and T034 done); T033, T034, T037, T038 in parallel; T039 last
- **US3 (Phase 5)**: needs Phase 3 only (independent of US2); T040–T042 in parallel; T043 → T044; T045 → T046
- **US4 (Phase 6)**: needs Phase 4 (`instance.lessons`); T047 ∥ T048; T049 → T050
- **US5 (Phase 7)**: needs Phase 3 only; T051, then T052; T053 any time
- **Polish (Phase 8)**: after the stories it checks; T054 ∥ T055; T060 before the first release merge (it guards the deploy); T061 after that release has deployed; T056–T059 last

### Within Each Story

- Tests first, confirmed failing, then implementation
- Domain before content loader before service before learner app
- Store changes before the components that call them

### Parallel Opportunities

- Phase 1: all three tasks
- Phase 3: T009 ∥ T010 ∥ T011 ∥ T012; then T013 ∥ T014 ∥ T015 ∥ T017 ∥ T018 ∥ T020 ∥ T021
- Phase 4: T022 ∥ T023 ∥ T024 ∥ T025 ∥ T026 ∥ T027 ∥ T028; T029 (backend) alongside T032 (web); T033 ∥ T034 ∥ T037 ∥ T038
- Phases 5 and 7 can run in parallel with Phase 4 after Phase 3 (US3 touches `StepModels.cs`, `VisualsEndpoints.cs`, and the math components; US5 touches `contribute.ts` and the docs; both also edit `LessonPage.tsx` and the dictionaries, so land those edits as separate commits)
- Phase 8: T054 ∥ T055 ∥ T060

---

## Parallel Example: User Story 2

```bash
# Tests together:
Task: "Lesson-facts fixture in src/backend/MathKX.Domain.Tests/Lessons/LessonFactsReaderTests.cs"        # T022
Task: "Lesson-facts fixture through remark in tools/validate-content.test.mjs"                            # T023
Task: "81-instance disclosure table in src/backend/MathKX.Domain.Tests/Lessons/LessonDisclosureTests.cs"  # T024
Task: "Instance lessons contract test in src/backend/MathKX.Api.Tests/ContractTests.cs"                   # T025
Task: "Gate and recording in src/web/tests/lesson-gate.test.tsx"                                          # T026
Task: "lessonAfter in src/web/tests/outcomes.test.ts"                                                      # T027

# Then backend and web side by side:
Task: "LessonFacts and LessonDisclosure in src/backend/MathKX.Domain/Lessons/"   # T029
Task: "Visit state and recording in src/web/src/state/store.tsx"                 # T032
```

---

## Implementation Strategy

### MVP First (Phases 1–3, on the branch)

1. Setup and the snapshot additions
2. US1: the lesson renders in both languages with its practice entries
3. **STOP and VALIDATE** locally: quickstart scenario 1; the walkthrough's line 1 can pass apart from the visuals; spec 002's checks still pass. Do not merge yet: on `main` this would deploy a lesson that can show an answer without recording a reveal (see "Deployment" above).

### First release (Phases 1–5, one merge to `main`)

1. US2: the gate, honest recording, the way back → quickstart scenarios 2 and 3
2. US3: the visuals → scenario 4 (first half); the production lesson then has no placeholders
3. T060 (the published package carries lesson files and assets), then merge; the deploy runs; T061 checks production

### Later merges

1. US4: the derived lesson link and origin lesson → scenario 4 (second half)
2. US5: contribution links and preview docs → scenario 5
3. Polish: chunking, keyboard and zoom pass, docs, walkthrough, measurements

### Single-Contributor Order

T001–T008, then US1 (T009–T021), US2 (T022–T039), US3 (T040–T046), T060, first release merge, T061, then US4 (T047–T050), US5 (T051–T053), Polish (T054–T059).

---

## Notes

- Commit after each task or logical group; each story's checkpoint is a good pull-request boundary.
- Never send the instance's sum to the browser to decide anything; the only new answer-bearing responses are lesson content and lesson-visual steps, fetched only with an open gate.
- Record a lesson event only after the lesson content has rendered; never on a click or a confirmation.
- The renderer implements `0.1-pilot` exactly; a need for a new directive, component, or notation is a content-contract change, not a renderer patch.
