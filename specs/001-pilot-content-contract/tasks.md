# Tasks: Pilot Content Contract and Validator

**Input**: Design documents from `specs/001-pilot-content-contract/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md)

**Tests**: Included. The specification requires regression tests for every failing scenario and edge case (SC-002, SC-006) and the constitution requires every behaviour to ship with tests. Tests live in `tools/validate-content.test.mjs` and run the real CLI against isolated fixtures, as the existing tests do. Write each test before the check it covers and confirm it fails first.

**Organization**: Tasks are grouped by user story so each story is an independently testable increment. The validator is one CLI, so the stories share modules under `tools/lib/`; each story adds its own module(s) and checks without editing another story's module.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story the task belongs to (US1–US5)
- Every task names the exact file(s) it touches

## Path Conventions

Tooling at the repository root (`tools/`, `schemas/`, `package.json`); content under `content/`; no `src/` is created by this feature. See plan.md "Project Structure".

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Dependencies and the module split the validator needs before any check grows.

- [ ] T001 Add the Markdown stack to `devDependencies` in `package.json` with exact versions (`unified`, `remark-parse`, `remark-gfm`, `remark-frontmatter`, `remark-directive`, `remark-math`, `unist-util-visit`, `yaml`), run `npm install`, and commit the updated `package-lock.json`
- [ ] T002 Create `tools/lib/diagnostics.mjs`: a collector with `error(file, message, { line, field, expected })` and `warning(...)`, the line format from `contracts/diagnostics.md` (`<repo-relative path>[:<line>] <field>: <message>[ (<expected>)]`, forward slashes, `warning:` prefix), ; when `field` is omitted (file-level errors such as `content must be a JSON object`, `invalid JSON`, `missing "$schema"`) the line is `<path> <message>` with no field segment, so the existing test patterns keep matching; and a `summary(counts)` function producing `Content validation passed|failed: N file(s), S skill(s), L lesson(s), D definition(s), R registr(y|ies)[, E error(s), W warning(s)]`
- [ ] T003 Create `tools/lib/files.mjs` by moving discovery, `$schema` resolution, known-schema dispatch, and Ajv setup out of `tools/validate-content.mjs`; add the five known schema basenames; skip exactly one directory, `content/_templates/`, and nothing else (an underscore-prefixed path anywhere else, for example `content/exercises/_draft/bad.json`, is still discovered and checked, FR-016)
- [ ] T004 Refactor `tools/validate-content.mjs` into orchestration only (parse `--root`, call `files.mjs`, run check modules in the order of `contracts/diagnostics.md`, print diagnostics and summary, exit 0/1/2) and move the skill checks (unique IDs, prerequisites resolve, self-reference, cycle DFS) into `tools/lib/skills.mjs` with a shared `resolveSkill(id)` helper that, for an unknown ID starting with `arithmetic.`, appends the hint `the registry uses numbers.*` (spec edge case 10); make the duplicate-skill message print the first file as a repository-relative forward-slash path (today it prints the absolute path) and assert that in `tools/validate-content.test.mjs`; switch the summary to `summary(counts)` and update the two existing assertions (`1 exercise definition(s)`, `2 exercise definition(s)`) to the new `definition(s)` wording in the same change; run `npm test` and confirm all 18 tests pass

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The registries and registry schema every definition and directive check reads.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T005 [P] Create `schemas/registry.schema.json` from `specs/001-pilot-content-contract/contracts/registry.schema.json` (description updated to final wording; confirm it compiles under Ajv 2020 strict)
- [ ] T006 [P] Create `content/registry/generators.json` (kind `generators`): `addition-pair` version 1, relation `sum-of-two-operands`, parameters `operand` (quantity `operand`, 0–20) and `sum` (quantity `sum`, 0–20), produces `a`, `b`, `sum`
- [ ] T007 [P] Create `content/registry/validators.json` (kind `validators`): `integer-answer` version 1, artifact `{ type: integer, min: 0, max: 40 }`, emits `add.oneGroup`, `add.concat`, `add.offByOne`, `add.subtracted`, `add.generic`
- [ ] T008 [P] Create `content/registry/representations.json` (kind `representations`): `groups` (roles help+explanation, reads `a`, `b`, supports operand 1–9 and sum 2–10), `make-ten` (roles help+explanation, reads `a`, `b`, supports operand 1–9 and sum 11–18), `ten-frame-explorer` (role explanation, reads `start`, supports start 0–10), matching the prototype's `supports()` ranges in `Prototype/mathkx-designsystemet/src/domain/explanations.js`
- [ ] T009 [P] Create `content/registry/visual-components.json` (kind `visual-components`): `ten-frame-explorer` (`start` integer 0–10, required), `groups` (`a`, `b` integers 1–9, required; representation `groups`), `make-ten` (`a`, `b` integers 1–9, required; representation `make-ten`)
- [ ] T010 [P] Create `content/registry/misconception-codes.json` (kind `misconception-codes`): the five `add.*` codes above, each with validator `integer-answer`
- [ ] T011 Create `tools/lib/registry.mjs`: load and index `content/registry/*.json` by kind and name@version; checks: unique names per kind, every misconception code names an existing validator, every validator `emits` code is registered, every visual component's `representation` exists; register `registry.schema.json` in `files.mjs` dispatch
- [ ] T012 Add tests in `tools/validate-content.test.mjs` for registry consistency (duplicate name, code naming an unknown validator, component naming an unknown representation) and for discovery (a file under `content/` naming an unknown schema fails with `unknown schema` naming it, FR-016; `content/exercises/_draft/bad.json` with invalid JSON is still reported; `content/_templates/lesson/lesson.json` with placeholder values is skipped), and extend the shared `fixture()` helper to write the five registry files by default

**Checkpoint**: `npm run validate` passes and reports `5 registries`; registry failures are reported with file and field.

---

## Phase 3: User Story 2 - Exercise definitions tested code can generate (Priority: P1) 🎯 MVP

**Goal**: Pilot exercise definitions (generated or fixed) validate against the registries, including representation range coverage and validator artifact shape.

**Independent Test**: `within-10`, `crossing-ten`, and the fixed `4 + 4` definitions pass; a definition whose sum bound exceeds the make-ten range fails naming both ranges.

Ordered before User Story 1 because lesson `practice` entries reference definitions; User Story 1's checks resolve against the definitions this phase makes possible.

### Tests for User Story 2

- [ ] T013 [P] [US2] Add tests in `tools/validate-content.test.mjs` for pilot definitions: valid generated passes and reports resolved skill and generator; valid fixed passes; unknown generator or version; parameter outside generator domain; `min > max`; unknown parameter key; bounds with no feasible pair (operand 1–2 with sum 11–18) fail naming both ranges; generated with `instance` or fixed with `generator` rejected; duplicate (`id`, `version`) across pilot and `0.1` files; `skill: arithmetic.addition` fails with the `numbers.*` hint
- [ ] T014 [P] [US2] Add tests for representation coverage and validators: make-ten with sum max 20 fails naming `make-ten supports … sum ≤ 18` and `definition allows … sum ≤ 20`; fixed `4 + 4` with `groups` passes; fixed `9 + 9` with `groups` fails (sum 18 outside 2–10); fixed `2 + 2` with `make-ten` fails (sum 4 outside 11–18); unknown representation; unknown validator; fixed `validation.answer` as string fails naming the validator and `expected integer`; misconception code not registered; code registered but not emitted by the named validator

### Implementation for User Story 2

- [ ] T015 [US2] Create `schemas/exercise-definition.pilot.schema.json` from `contracts/exercise-definition.pilot.schema.json` and register it in `tools/lib/files.mjs`
- [ ] T016 [US2] Create `tools/lib/definitions.mjs`: index pilot definitions and the `0.1` example by (`id`, `version`); checks for skill resolution, validator registration, generator registration and parameter domain, fixed-instance artifact conformance, `instance.prompt` carrying the quantities each representation `reads`, misconception codes registered and emitted; move the existing duplicate-identity check here
- [ ] T017 [US2] Create `tools/lib/quantities.mjs` implementing the pilot quantity model from `data-model.md` (relation `sum-of-two-operands`: `operand` is the range covering `a` and `b`, `sum` is `a + b`): `domainBox(parameters)` for generated definitions, `pointBox({ a, b })` → `{ operand: [min(a,b), max(a,b)], sum: [a+b, a+b] }` for fixed tasks and visual directives, `feasible(parameters)` (some pair in the operand range has a sum in the sum range: `[2·operand.min, 2·operand.max]` intersects `[sum.min, sum.max]`); then implement in `tools/lib/definitions.mjs` the feasibility check (message names both ranges) and the box-containment check: for each representation in `help` and `explanation`, every quantity's `[min, max]` must lie inside the representation's `supports`; message names the representation, the quantity, both bounds
- [ ] T018 [US2] Wire the definition checks into `tools/validate-content.mjs` after the skill checks; counts in the summary say `D definition(s)` and the `0.1` example's existing test expectation `1 exercise definition(s)` is updated to the new wording in the same change

**Checkpoint**: Fixture definitions pass; all T013–T014 tests pass; existing `0.1` tests pass.

---

## Phase 4: User Story 1 - A contributor adds a bilingual lesson (Priority: P1)

**Goal**: A lesson folder with `lesson.json`, `nb.md`, `en.md`, and assets validates structurally: metadata schema, folder equals `id`, both translations present, references resolve, anchors match, tables have delimiter rows, directives known and in range, notation parses.

**Independent Test**: A lesson created from the template passes; folder/`id` mismatch, missing `en.md`, missing anchor, unknown skill or practice definition, and a table without a delimiter row each fail with file, line or field, and expected value.

### Tests for User Story 1

- [ ] T019 [P] [US1] Add a lesson fixture helper in `tools/validate-content.test.mjs` (`lesson(id, { json, nb, en, assets })` writing the folder) with a minimal valid pair, and tests: valid lesson passes and the summary counts `1 lesson(s)`; folder name differs from `id`; `en.md` missing; `translations.en` names a file that does not exist; unknown skill; `skills: [arithmetic.addition]` fails with the `numbers.*` hint; unknown practice definition or version; practice definition whose skill is not in `skills` produces `warning:` and exit 0 (edge case 7); unknown `relatedLessons`; `check` field present; `status: released` with a missing translation; `translations: { nb: "en.md", en: "en.md" }` rejected by the schema; an extra `sv.md` in the folder reported as an unsupported language file (edge case 1)
- [ ] T020 [P] [US1] Add tests for translation structure: front matter missing `objective`; unknown front-matter key; heading without `{#anchor}`; duplicate anchor in one file; anchor in `nb.md` missing from `en.md` (names both files); table without a delimiter row (names the line, shows `| --- |`); image with empty alt text; image pointing at a missing asset; relative link to a missing file
- [ ] T021 [P] [US1] Add tests for directives and notation: unknown directive name; `:::visual` with unknown `type`; `type` not listed in `lesson.json` `visuals`; `start="11"` out of range; `groups` with `a="9" b="9"` fails naming the `groups` representation's sum bound 2–10; `make-ten` with `a="2" b="2"` fails naming the sum bound 11–18; unknown attribute; `:::practice` without a matching metadata entry; metadata entry without a directive; `:::example` without `id`; `$\sqrt{2}$` reported as unsupported notation naming the section; `$2,5$` accepted

### Implementation for User Story 1

- [ ] T022 [P] [US1] Create `schemas/lesson.schema.json` from `contracts/lesson.schema.json` and register it in `tools/lib/files.mjs`
- [ ] T023 [P] [US1] Create `tools/lib/markdown.mjs`: unified pipeline (`remark-parse`, `remark-gfm`, `remark-frontmatter`, `remark-directive`, `remark-math`); functions returning front matter (parsed with `yaml`), headings with anchors and line numbers, sections (anchor → nodes), container directives with attributes and line numbers, math nodes with their section, images and links, and pipe-only paragraphs (table without delimiter row)
- [ ] T024 [P] [US1] Create `tools/lib/notation.mjs`: tokenizer and parser for the grammar in `contracts/directives-and-notation.md` (numbers with `.`/`,`, single letters, `f(x)`, operators `+ − - = × · * < > ≤ ≥ ≠ ? □ ( ) [ ] , →`, `^`, `^{}`, `²`, `³`, `_`, `\frac{}{}`, `/`, prime, `\Delta \cdot \le \ge \neq \to \lim`); `parse(text)` returns a tree or throws with the unsupported token; `normalize(text)` returns the canonical string (decimal `.`, `*`→`·`, `-`→`−`, `²`→`^2`, no whitespace)
- [ ] T025 [US1] Create `tools/lib/lessons.mjs`: discover `content/lessons/*/lesson.json`; checks for folder equals `id`, unique IDs, `translations` files exist, any other `*.md` in the folder is reported as an unsupported language file, `released` requires both, references resolve (`skills`, `prerequisites`, `relatedSkills`, `relatedLessons`, `practice` via `definitions.mjs`), `check` forbidden, warning when a practice definition's skill is not in `skills`
- [ ] T026 [US1] Add per-translation checks to `tools/lib/lessons.mjs` using `markdown.mjs` and `notation.mjs`: front matter keys, anchors present and unique on level 2 and 3 headings, delimiter-row rule, images and links resolve with non-empty alt, directive names known, attributes typed and in range per `visual-components.json`, and for a component with a `representation` link the box from `quantities.mjs` `pointBox({ a, b })` must lie inside that representation's `supports` (so `groups` 9 + 9 and `make-ten` 2 + 2 are rejected), `visual` types listed in `visuals`, `:::practice` ↔ metadata correspondence, `:::example` has `id` and non-empty `title`, every math node parses (unsupported notation reported with section anchor)
- [ ] T027 [US1] Wire lesson checks into `tools/validate-content.mjs` after definitions; summary counts `L lesson(s)`; run `npm test`

**Checkpoint**: T019–T021 pass; a template-shaped lesson validates end to end.

---

## Phase 5: User Story 4 - A translator improves one language without breaking the pair (Priority: P2)

**Goal**: Cross-language comparison by identity and normalized mathematics, never by prose or order.

**Independent Test**: Prose-only and title-only changes in `en.md` pass; a changed directive attribute, a deleted anchor, and a changed expression each fail naming the element and both files, all within one run.

### Tests for User Story 4

- [ ] T028 [P] [US4] Add pairing tests in `tools/validate-content.test.mjs`: prose rewritten and sentences reordered passes; `:::example` title differs passes; two directives swapped within a section passes; `2,5` versus `2.5` passes; `start="3"` versus `start="4"` fails naming the directive, attribute, and both values; `$3+7=10$` versus `$3+6=9$` fails naming the expression and section; an `:::example` with `id` present in one language only fails; `:::practice` present in one language only fails; anchor deleted, attribute changed, and expression changed in one fixture are all three reported in the same run (SC-005)

### Implementation for User Story 4

- [ ] T029 [US4] Create `tools/lib/pairing.mjs`: given two parsed translations, compare anchor sets (order free), directive identity multisets (name + `id` / `definition`+`version` / `type`+all attributes), non-localized attribute equality on matched directives, localized attributes present and non-empty, and per-section multisets of `notation.normalize()` results; messages per `contracts/diagnostics.md`
- [ ] T030 [US4] Call `pairing.mjs` from `tools/lib/lessons.mjs` for every lesson with both translations parsed, after the per-translation checks, so divergences are reported alongside structural errors in one run

**Checkpoint**: T028 passes; the three divergence cases appear together in one output.

---

## Phase 6: User Story 3 - A maintainer declares a skill's challenge ladder (Priority: P2)

**Goal**: Skills may carry an ordered `ladder` of their own definitions with a sentence per language.

**Independent Test**: A ladder of two definitions of the skill passes; a ladder entry of another skill fails naming the entry and both skills; a missing language sentence fails naming the entry and the language.

### Tests for User Story 3

- [ ] T031 [P] [US3] Add ladder tests in `tools/validate-content.test.mjs`: valid two-entry ladder passes; entry naming a definition of another skill fails naming `ladder[i]`, the definition, and both skill IDs; entry missing `en` fails naming `ladder[i].description` and `en`; duplicate entries fail; entry naming a definition version that does not exist fails; empty `ladder` rejected by schema

### Implementation for User Story 3

- [ ] T032 [US3] Extend `schemas/skill.schema.json` with the optional `ladder` from `contracts/skill.schema.json` and update its `description` so it no longer says a skill carries only its ID and prerequisites (FR-020)
- [ ] T033 [US3] Add ladder checks to `tools/lib/skills.mjs` (entries unique, each definition@version exists via `definitions.mjs`, each definition's `skill` equals this skill), run after definitions are indexed

**Checkpoint**: T031 passes.

---

## Phase 7: User Story 5 - The milestone's content lives in the repository (Priority: P3)

**Goal**: Real pilot content under `content/` passes in CI; the `0.1` fixture and the prototype are unchanged.

**Independent Test**: `npm run validate` on the repository passes and the summary reads `9 skill(s), 1 lesson(s), 4 definition(s), 5 registries`; `git diff -- content/exercises/examples/ Prototype/` is empty against the merge base.

- [ ] T034 [P] [US5] Create `content/skills/numbers.number-bonds-to-ten.json` (no prerequisites) and `content/skills/numbers.addition-within-20.json` (prerequisite `numbers.number-bonds-to-ten`; ladder: `numbers.addition.within-10`@1 then `numbers.addition.crossing-ten`@1 with nb/en step sentences taken from the prototype's `practice.js` variant descriptions)
- [ ] T035 [P] [US5] Create `content/exercises/numbers/addition-within-10.json` (`numbers.addition.within-10` v1, skill `numbers.addition-within-20`, generator `addition-pair`@1 with operand 1–9 and sum 2–10, validator `integer-answer`@1, help and explanation `groups`, codes `add.oneGroup add.concat add.offByOne add.subtracted add.generic`)
- [ ] T036 [P] [US5] Create `content/exercises/numbers/addition-crossing-ten.json` (`numbers.addition.crossing-ten` v1, same skill and validator, operand 2–9 and sum 11–18, representations `make-ten`, same codes)
- [ ] T037 [P] [US5] Create `content/exercises/numbers/addition-4-plus-4.json` (`numbers.addition.four-plus-four` v1, `source: fixed`, `instance.prompt { a: 4, b: 4 }`, `instance.validation { answer: 8 }`, validator `integer-answer`@1, representations `groups`, same codes)
- [ ] T038 [US5] Copy `Prototype/mathkx-designsystemet/src/content/lessons/number-bonds-to-ten/{nb.md,en.md,assets/ten-frame-3-7.svg}` to `content/lessons/number-bonds-to-ten/`; add delimiter rows to every table; replace `:::practice{skill="…" variant="…"}` with `:::practice{definition="numbers.addition.within-10" version="1"}` (and `crossing-ten` where the prototype used `across-10`); keep anchors, mathematics, and visual attributes unchanged
- [ ] T039 [US5] Write `content/lessons/number-bonds-to-ten/lesson.json` in the pilot shape: `id`, `version: 1`, `status: pilot`, `skills` `[numbers.number-bonds-to-ten, numbers.addition-within-20]` (the lesson teaches both, as the prototype's two-skill list and DL-004 say; listing both avoids the cross-skill practice warning on a clean tree), no `relatedSkills`, `practice` for both definitions, `visuals` as used in the body, `translations { nb: nb.md, en: en.md }`; drop the prototype's `check` and `related` fields
- [ ] T040 [US5] Run `npm run validate` and `npm test`; fix content (not checks) until the summary passes; confirm `git diff origin/main -- content/exercises/examples/ Prototype/` is empty and `git grep -l "arithmetic\." content/` returns nothing

**Checkpoint**: CI green on the pilot content.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Template, guide, documentation, and the quickstart proof.

- [ ] T041 [P] Create `content/_templates/lesson/` with `lesson.json`, `nb.md`, `en.md`, and `assets/.gitkeep` holding placeholder values and comments that name every field, directive, and attribute (SC-004); the discovery skip and its test are T003 and T012
- [ ] T042 [P] Write `content/AUTHORING.md`: lesson folder and metadata fields (from `data-model.md`), front matter, anchors, table rule, the three directives with attribute tables, the notation grammar and normalization rule (from `contracts/directives-and-notation.md`), definition fields and the registries, the ladder, how to read a diagnostic, and the copy-the-template walkthrough from `quickstart.md`
- [ ] T043 [P] Update `content/AGENTS.md`: point to `content/AUTHORING.md`; add rules for lessons (folder equals `id`, both languages, anchors and directives match, mathematics normalized), definitions (registered names only, representation coverage), and registries (reviewed data, changed together with code)
- [ ] T044 [P] Update `content/README.md`: layout now includes `lessons/`, `registry/`, `_templates/`; the validation list covers lessons, definitions, registries, ladders; remove the statements that `lessons/` does not exist and that a skill carries only ID and prerequisites; keep the `0.1` note
- [ ] T045 [P] Update `docs/architecture/proposals/lesson-markdown-and-delivery.md` with a status note that the pilot contract implemented in spec 001 supersedes the proposal's open points (metadata fields, `practice` by definition, `relatedSkills`/`relatedLessons`), linking to `content/AUTHORING.md`
- [ ] T046 Run the five quickstart scenarios from `specs/001-pilot-content-contract/quickstart.md` by hand against the repository, correct any message text in `tools/lib/*.mjs` and the matching test so the quickstart's quoted messages are exact, and record the measured `npm run validate` wall time (must be under 30 s, SC-003) in `quickstart.md`
- [ ] T047 Update `.specify/memory/constitution.md`-dependent documents only if terminology changed; otherwise confirm no ADR or constitution edit is needed and note it in the PR description

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: starts immediately; T002 and T003 are independent, T004 needs both
- **Foundational (Phase 2)**: needs Phase 1; T005–T010 in parallel, then T011, then T012; blocks all stories
- **US2 (Phase 3)**: needs Phase 2; first story because lessons and ladders reference definitions
- **US1 (Phase 4)**: needs Phase 3 (practice references resolve through `definitions.mjs`); T022–T024 in parallel, T025 → T026 → T027
- **US4 (Phase 5)**: needs Phase 4 (`markdown.mjs`, `notation.mjs`, `lessons.mjs`)
- **US3 (Phase 6)**: needs Phase 3 only; can run in parallel with Phases 4–5
- **US5 (Phase 7)**: needs Phases 3–6
- **Polish (Phase 8)**: T041–T045 after Phase 7; T046 last

### Within Each Story

- Tests first, confirmed failing, then implementation
- Schema file before the module that checks against it
- Module before wiring into `tools/validate-content.mjs`

### Parallel Opportunities

- Phase 2: T005–T010 (six registry/schema files)
- Phase 3: T013 ∥ T014
- Phase 4: T019 ∥ T020 ∥ T021; T022 ∥ T023 ∥ T024 (T026 also uses `quantities.mjs` from T017)
- Phase 6 can run alongside Phases 4–5 (different files: `skills.mjs`, `skill.schema.json`)
- Phase 7: T034–T037 (five content files)
- Phase 8: T041–T045

---

## Parallel Example: User Story 1

```bash
# Tests together:
Task: "Lesson metadata and folder tests in tools/validate-content.test.mjs"      # T019
Task: "Translation structure tests in tools/validate-content.test.mjs"            # T020
Task: "Directive and notation tests in tools/validate-content.test.mjs"           # T021
# (one file: land as three commits or one coordinated edit)

# Modules together:
Task: "Create schemas/lesson.schema.json"                                          # T022
Task: "Create tools/lib/markdown.mjs"                                              # T023
Task: "Create tools/lib/notation.mjs"                                              # T024
```

---

## Implementation Strategy

### MVP First (Phases 1–3)

1. Setup and registries
2. US2: definitions validate with range coverage
3. **STOP and VALIDATE**: a bad `19 + 1` definition is rejected; the `0.1` fixture still passes

### Incremental Delivery

1. US1: a lesson validates structurally → template-shaped lesson passes
2. US4: pairing → translator workflow safe
3. US3: ladder → practice controls have their data
4. US5: real content in `content/`, CI green
5. Polish: template, guide, docs, quickstart proof

### Single-Contributor Order

Phases run 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8; Phase 6 may be pulled forward after Phase 3 when waiting on review of Phase 4.

---

## Notes

- All test tasks edit one file (`tools/validate-content.test.mjs`); [P] on them means independent content, not independent files. Coordinate as separate commits.
- Diagnostic message texts are the test contract (see `contracts/diagnostics.md`); change a message and its test together.
- No ADR, constitution, or `Prototype/` change is part of this feature.
- Commit after each task or checkpoint.
