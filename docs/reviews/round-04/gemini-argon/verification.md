# Round-04 Final Verification — `gemini-argon`

## 1. Baseline and identity

- **Baseline SHA:** `60031f76ee80a0b1783e4d49b2cb3c0d48b8686e` (`<SHA>` was not supplied in the prompt; used `HEAD` of `main` at branch creation: `Merge pull request #7 from MathKX/claude/project-analysis-recommendations-5d72c1`).
- **Branch:** `review/round-04-gemini-argon`
- **Model identity:** Gemini 4 Argon (Medium), reviewer slug `gemini-argon`
- **Date:** 2026-10-18
- **`git status --short --branch` before verification:**
  ```text
  ## main...origin/main
  ?? docs/reviews/round-04/codex/
  ```
  *(Untracked `docs/reviews/round-04/codex/` existed in the working tree before checkout; it was not read or staged.)*
- **`git status --short --branch` after verification (before commit):**
  ```text
  ## review/round-04-gemini-argon
  ?? docs/reviews/round-04/codex/
  ?? docs/reviews/round-04/gemini-argon/
  ```

---

## 2. Commands run

All commands below were executed directly (not inferred):

1. **Root install (`d:\repos\MathKX`):** `npm ci` → exit `0` (`added 6 packages, and audited 7 packages in 2s`, `0 vulnerabilities`).
2. **Root tests (`d:\repos\MathKX`):** `npm test` (`node --test tools/validate-content.test.mjs`) → exit `0`, **18/18 tests passed** (`pass 18`, `fail 0`, `356.2089ms`).
3. **Root content validation (`d:\repos\MathKX`):** `npm run validate` (`node tools/validate-content.mjs`) → exit `0`:
   `Content validation passed: 8 content file(s), 7 skill(s), 1 exercise definition(s).`
4. **Prototype install (`Prototype/mathkx-designsystemet`):** `npm ci` → exit `0` (`added 215 packages, and audited 216 packages in 5s`).
5. **Prototype domain tests (`Prototype/mathkx-designsystemet`):** `npm test` (`node --test tests/domain.test.mjs`) → exit `0`, **16/16 tests passed** (`pass 16`, `fail 0`, `113.0637ms`).
6. **Prototype production build (`Prototype/mathkx-designsystemet`):** `npm run build` (`vite build`) → exit `0` (`594 modules transformed`, `dist/index.html 935.77 kB │ gzip: 244.31 kB`, `built in 341ms`).
7. **Prototype browser suite (`Prototype/mathkx-designsystemet`):** `npm run test:browser` (`node tests/browser/review-checks.mjs`) → first run exited `1` because Playwright Chromium headless shell was not yet installed on this machine; after running `npx playwright install chromium` (downloaded Chromium `141.0.7390.37` build `v1194`), re-running `npm run test:browser` exited `0` with **80/80 checks passed, 0 failed** (20 scenarios across 4 configurations: `nb-820-light`, `en-390-dark`, `en-1180-light`, `nb-390-dark`, including `axe-core` WCAG 2 A/AA, 2.1 AA, and best-practice checks on main routes).
8. **Auxiliary verification scripts (executed via `node -e`):**
   - Dictionary key parity (`src/i18n.js` merged `DICT.nb` vs `DICT.en`): **610 keys in `nb`, 610 keys in `en`, 0 keys only in `nb`, 0 keys only in `en`**.
   - Lesson section-ID and directive parity (`src/content/lessons/{number-bonds-to-ten,equations-as-a-balance}/{nb,en}.md`): identical heading IDs (`what, pairs, ten-frame, why, try, practice` and `meaning, balance, both-sides, check, mistake, practice`) and identical directive sequences across both languages.
   - `SplitMix64` and `NextBelow` reference check against all vectors in `docs/architecture/proposals/seed-and-random-source.md` (`#raw-uint64-vectors`, `#nextbelown-vectors`, `#boundary-cases`): **all raw and bounded vectors matched exactly**.

---

## 3. Ten verification checklist items

### 1. Consistency of the record — **No**
- **Evidence:** Accepted ADRs `0001`–`0009` agree with `docs/architecture/architecture.md` (lines 78–104), `docs/vision.md`, `docs/product-principles.md`, `docs/design/{design-principles,learning-experience,exercise-experience}.md`, and `docs/learning/{learning-model,skill-graph,mathematics-domains}.md`. However, `docs/learning/mastery.md` under `## Persistence and current implementation status` (line 41) states: *"The database, authentication mechanism, retention rules, and exact record format remain undecided."* That contradicts accepted `docs/architecture/decisions/0008-store-profiles-and-progress-in-postgresql.md` (`Status: Accepted`, `PostgreSQL is the primary relational database for learner profiles and progress records`) and `docs/architecture/architecture.md#persistence-and-learner-profiles` (line 80). (`docs/reviews/round-01/decision-log.md` logs this as open item `DL-025`.)
- **Smallest correction:** Update `docs/learning/mastery.md` line 41 to state that PostgreSQL is chosen for relational profile and progress storage per ADR 0008 while authentication mechanism, retention rules, and exact table/record schemas remain open, and mark `DL-025` resolved in `docs/reviews/round-01/decision-log.md`.

### 2. Decisions resolved or explicitly deferred — **No**
- **Evidence:** In `docs/reviews/round-01/decision-log.md`, only `DL-001`, `DL-002`, and `DL-003` carry `"Decided by owner, 2026-10-18"`. Ten items remain `Pending` without a recorded owner decision:
  - `DL-004` (First milestone learning objectives and skill IDs `D1`) — **blocks F1, F2, F5, F7**.
  - `DL-005` (Where the mathematics runs in the first milestone `D2`: `.NET + thin API` vs TypeScript fallback) — **blocks F2, F3**.
  - `DL-006` (First topic `D3`: addition within 20 vs one-step equations) — **blocks F1, F2, F4, F5, F7**.
  - `DL-007` (Proposed release additions) — no owner decision or deferral trigger; **affects F9** optional scope.
  - `DL-008` (Code and content licenses) — deferred trigger `"Decide before accepting outside contributions"`; does not block F1–F9 specs.
  - `DL-022` & `DL-027` (Profile setup sequencing and email replacement; profile created at step 1) — deferred to profile design (`CLAUDE-FABLE-R01-007`); **blocks F9** final step-order contract unless decided or confirmed in the F9 brief.
  - `DL-024` (Accept `seed-and-random-source.md` as ADR 0010 once `dotnet test` passes fixtures) — has trigger (`dotnet test`); does not block specifying F2.
  - `DL-025` (Reconcile `mastery.md` with ADR 0008) — documentation cleanup; does not block F1–F9.
  - `DL-026` (Confirm four prototype behaviour rules: counting last counter = reveal; lesson disclosure rule; `"More like this"` replaces pending change with notice; finishing session keeps unanswered question resumable) — **blocks F4, F5, F6, F7**.
  - `DL-028` (Confirm default self-check policy: independent by default with explicit one-way switch to supported practice) — **blocks F8**.
- **Smallest correction:** Record owner decisions for `DL-004`, `DL-005`, `DL-006`, `DL-026`, and `DL-028` (and an explicit deferral trigger for `DL-007`, `DL-022`, `DL-027`) in `docs/reviews/round-01/decision-log.md`.

### 3. Planning reference — **No**
- **Evidence:** `docs/reviews/round-01/claude-fable/revised-build-brief-corrections.md` updates `revised-build-brief.md` to align with `docs/learning/mastery.md#progress-tracking-before-a-mastery-algorithm` and `docs/design/exercise-experience.md#explaining-why-the-result-follows`, except for two internal inconsistencies in `revised-build-brief-corrections.md`:
  1. **Cut-order contradiction (§D):** Under `## D. Realistic weekend cut order`, line 74 places `crossing-ten` after the first deliverable, and Backlog row `7` (line 87, below `--- First deliverable complete ---` on line 84) lists `crossing-ten definition, make-ten help, challenge transitions`, yet Backlog row `2` (line 80, *above* `--- First deliverable complete ---`) requires `definitions within-10 and crossing-ten; golden and 10,000-seed property tests`.
  2. **Outcome precedence omission (§E):** Under `### Outcome of a delivery` (lines 118–129), the table defines `correctAfterFeedback` as `"correct after an incorrect with feedback-shown, no teaching support"` and `correctWithVisualHelp` / `correctWithHelp` without stating which wins when a learner submits an `incorrect` response *and then* uses visual help or partial explanation before answering `correct`. Prototype `src/domain/observations.js` (lines 85–89) and `tests/domain.test.mjs` (line 186) enforce exact precedence (`correctAfterExplanation > correctAfterFeedback > correctWithHelp > correctWithVisualHelp > correctFirst`, attaching support tags like `visualBefore` alongside `correctAfterFeedback`).
- **Smallest correction:** In `docs/reviews/round-01/claude-fable/revised-build-brief-corrections.md`, remove `crossing-ten` from §D row 2 (leaving it in row 7) and add the explicit 5-way outcome precedence order (`correctAfterExplanation > correctAfterFeedback > correctWithHelp > correctWithVisualHelp > correctFirst`) to §E `### Outcome of a delivery`.

### 4. Prototype domain logic and tests — **Yes**
- **Evidence:** Executed `npm test` (`16/16` pass in `Prototype/mathkx-designsystemet/tests/domain.test.mjs`), `npm run build` (exit `0`), and `npm run test:browser` (`80/80` pass in `tests/browser/review-checks.mjs`). Inspected `src/domain/{numbers,math,observations,practice,explanations,disclosure,notation}.js`:
  - `numbers.js` (`parseNumberInput`): handles `nb` comma (`1,5` ok; `1.5` → `decimalComma`) and `en` point (`1.5` ok; `1,5` → `grouping`), rejects expressions (`3+4`, `2/3` → `expression`), grouping (`1 000` → `grouping`), out-of-range (`1e9` → `range`), and strips `x =` only when `allowXPrefix` is true.
  - `math.js`: deterministic diagnosis codes (`add.oneGroup`, `add.concat`, `add.offByOne`, `add.subtracted`, `lin.added`, `lin.copied`, `lin.substitute`, `generic`).
  - `observations.js` & `disclosure.js`: distinguishes non-revealing steps (`explainPartBefore` → `correctWithHelp`), final explanation step (`reveal:explanation`), counting to final counter (`reveal:counting`), and lesson worked-example match (`lessonDisclosesQuestion`: `8 + 5` / `5 + 8` in `number-bonds-to-ten`, `x + 5 = 9` / `x + 3 = 7` in `equations-as-a-balance` → `reveal:lesson`).
  - `practice.js`: SplitMix64 64-bit stream, variation ladders (`within-10` ↔ `across-10` ↔ `within-20`; `to-10` ↔ `to-20`), pending next-question variation changes, and honest pool-exhaustion `repeat: true` tagging.

### 5. Prototype user journeys and edge cases — **Yes**
- **Evidence:** Executed `tests/browser/review-checks.mjs` (`80/80` pass) and inspected `src/store.jsx` and `src/pages/{Practice,Home,Lesson,Profile,Preview}.jsx`:
  - Check mode (`Practice.jsx` `CheckPage`): one-way switch (`checkSwitch`) preserves earlier answers as `independent: true` and marks current/subsequent items as supported practice (`R03-05b`); topic link (`?new=1`) starts a fresh check while offering a link to the last summary; every check summary item renders a step-by-step explanation (`G3`); in-progress checks appear on Home (`G4`).
  - Practice & lesson (`Practice.jsx`, `Lesson.jsx`): `"More like this"` keeps current variation and notifies if a pending change was dropped (`R03-04`); opposite challenge steps cancel back to current (`G2`); finishing a session with an unanswered question records `unfinished` and keeps draft/support resumable (`R03-07`); starting a different variation from a link prompts first and ends the old session with `endedReason: 'replaced'` (`C9`).
  - Profile & guest continuity (`Profile.jsx`, `store.jsx`): guest work is tagged `fromGuest: true` on creation and sign-in import (`C7+C8`); changing a confirmed recovery email keeps the confirmed `email` active in `pendingReplace` until the new address is verified (`G7`).

### 6. Content contract readiness — **No**
- **Evidence:** `schemas/` contains only `skill.schema.json` and `exercise.schema.json` (v0.1). Neither `schemas/lesson.schema.json` nor `schemas/exercise-definition.pilot.schema.json` exists yet, and `docs/reviews/round-01/claude-fable/revised-build-brief-corrections.md` §F explicitly labels its table `"Shape (responsibilities, not final field names)"`. Specifically:
  1. **Lesson metadata & directives:** Prototype `lesson.json` uses `"practice": [{ "skill": "...", "variant": "..." }]` and `"check": "check-addition"`, and `nb.md`/`en.md` use `:::practice{skill="..." variant="..."}` plus `:::example{title="..." id="..."}` and border-pipe tables *without* GFM `| --- |` delimiter rows (`src/content/lessons/number-bonds-to-ten/nb.md` lines 18–24). In contrast, `revised-build-brief-corrections.md` §F specifies `practice[] {definition}` in `lesson.json`, `:::practice` directives naming a `definition`, GFM delimiter rows (`revised-build-brief.md` Task 1), and omits `check` and `:::example` from the §F validator column.
  2. **Pilot exercise definition & skill ladder fields:** `revised-build-brief-corrections.md` §F lists responsibilities for `schemas/exercise-definition.pilot.schema.json` and the `ladder[]` extension on `schemas/skill.schema.json`, but exact JSON property names, generator parameter keys for `addition-pair` (`aMin`, `aMax`, `bMin`, `bMax`, `sumMin`, `sumMax`), and localization object shapes (`{nb, en}`) are not specified.
- **Smallest correction:** Specify concrete field names, required properties, directive attribute syntax (`:::visual`, `:::practice`, `:::example`), and GFM table delimiter requirements in `docs/reviews/round-01/claude-fable/revised-build-brief-corrections.md` §F.

### 7. Determinism and mathematical correctness — **Yes**
- **Evidence:**
  - Verified all test vectors in `docs/architecture/proposals/seed-and-random-source.md` (`#raw-uint64-vectors`, `#nextbelown-vectors`, `#boundary-cases`) via Node `BigInt` execution and `Prototype/mathkx-designsystemet/src/domain/practice.js` (`splitMix64`); `npm test` in prototype verifies golden vectors (`tests/domain.test.mjs` lines 13–21).
  - Verified all worked examples, self-check items, and misconception diagnoses in `src/domain/{math,explanations}.js`, `src/content/catalog.js`, and `src/content/lessons/{number-bonds-to-ten,equations-as-a-balance}/{nb,en}.md`: math and step-by-step explanations are accurate in both languages, including the substitution check step in `Visuals.jsx` (`BalanceVisual` `check` mode showing `xVal` ones in place of `x`, verified by browser test `R03-06`).

### 8. Bilingual completeness — **Yes**
- **Evidence:**
  - Dictionary parity check executed on `DICT.nb` and `DICT.en` (`src/i18n.js` merging `i18n.js`, `i18n-iteration2.js`, and `i18n-review.js`): **610 keys in `nb`, 610 keys in `en`, 0 missing in either language**.
  - Lesson parity check executed on `number-bonds-to-ten` and `equations-as-a-balance`: both `nb.md` and `en.md` exist, with identical section IDs and directive structures.
  - Browser suite (`80/80` pass) verified both `nb` and `en` across routes (`R03-08`, `C11`) with zero raw translation keys or `undefined` strings.

### 9. Accessibility and iPad readiness — **Cannot verify** (for physical iPad/AT hardware; **Yes** for automated and code-level checks)
- **Evidence:**
  - **Verified by execution (`80/80` pass in `tests/browser/review-checks.mjs`):** `axe-core` passes with 0 violations (`wcag2a`, `wcag2aa`, `wcag21aa`, `best-practice`) across light/dark themes and `390×844`, `820×1180`, and `1180×820` viewports; touch targets on lesson and practice pages measure $\ge 44\text{ CSS px}$ (`C12`); simulated on-screen keyboard (`G5`, `App.jsx` lines 109–133) keeps the answer field and Check button visible above `.mkx-kbd`; equation chains wrap cleanly at `390 px` (`C6`, `.mkx-eqchain` in `styles.css` lines 76–78); disabled buttons maintain readable contrast (`styles.css` lines 139–145).
  - **Cannot verify:** Physical iPad Safari layout with the real iPadOS on-screen keyboard (`visualViewport`), hardware rotation, and Apple VoiceOver reading of `<math>` MathML and live regions (explicitly required by `docs/design/design-principles.md#ipad-and-touch-use` and `docs/design/exercise-experience.md#answering-on-ipad`).

### 10. Open-source and privacy posture — **Yes**
- **Evidence:**
  - Learner-ID profile flow (`src/pages/Profile.jsx`, `src/store.jsx`) requires no name, email, birth date, school, or external account (`docs/architecture/decisions/0006-support-profiles-without-personal-details.md`), warns that the profile is pseudonymous rather than network-anonymous (`profile.notAnon`), requires explicit confirmation that the learner ID was saved, and treats recovery email as optional and inactive until confirmed (`G7`).
  - Lesson improvement dialog (`src/pages/Lesson.jsx` `ReportForm`, lines 142–207) shows an explicit payload preview before submission (`report.previewTitle`), lists excluded personal data (`report.ni1`–`ni3`: learner ID/password, learning history, email), and clearly labels prototype simulation (`proto.banner`, `report.sentProto`).

---

## 4. Candidate feature verdicts (`F1`–`F9`)

| ID | Candidate feature | Verdict | Rationale |
| --- | --- | --- | --- |
| **F1** | Content schemas and validator v0.2 | **Ready with corrections** | Needs owner decisions `DL-004` (canonical skill IDs) and `DL-006` (first topic) in `decision-log.md`, plus concrete field names and directive/table syntax in `revised-build-brief-corrections.md` §F (Checklist 2, 6). |
| **F2** | Seeded random source and first exercise generator | **Ready with corrections** | `seed-and-random-source.md` test vectors are complete and verified, but needs owner decisions `DL-004`, `DL-005` (runtime boundary), and `DL-006` in `decision-log.md`, plus fixing the `crossing-ten` cut-order contradiction in `revised-build-brief-corrections.md` §D (Checklist 2, 3). |
| **F3** | Number input parser and answer evaluator | **Ready with corrections** | Domain contracts, locale rules, and misconception codes are fully verified in `numbers.js`, `math.js`, and `revised-build-brief-corrections.md` §E; needs only owner decision `DL-005` (C# + thin API vs TS boundary) in `decision-log.md` (Checklist 2). |
| **F4** | Exercise workspace and step-by-step visual help / explanation player | **Ready with corrections** | Behavior, disclosure boundaries, and responsive layout are verified in prototype and `exercise-experience.md`; needs owner decisions `DL-006` (first topic visual) and `DL-026` items 1–2 (counting reveal and lesson disclosure confirmation) in `decision-log.md` (Checklist 2). |
| **F5** | Practice session loop and variation controls | **Ready with corrections** | Variation ladders and pending-change rules are verified in `practice.js`; needs owner decisions `DL-004`, `DL-006`, and `DL-026` items 3–4 (`"More like this"` pending-change notice and unfinished question resumption) in `decision-log.md`, plus §D cut-order cleanup in `revised-build-brief-corrections.md` (Checklist 2, 3). |
| **F6** | Delivery observation and honest session summary | **Ready with corrections** | Taxonomy matches `mastery.md` and `observations.js`; needs owner confirmation `DL-026` in `decision-log.md` and explicit 5-way outcome precedence (`correctAfterExplanation > correctAfterFeedback > correctWithHelp > correctWithVisualHelp > correctFirst`) in `revised-build-brief-corrections.md` §E (Checklist 2, 3). |
| **F7** | Lesson page and portable Markdown renderer | **Ready with corrections** | Lesson layout and return-to-exercise banner work in prototype; needs owner decisions `DL-004`, `DL-006`, `DL-026` (item 2) in `decision-log.md` and aligning `lesson.json` / `:::practice` / `:::example` / GFM table delimiter rules in `revised-build-brief-corrections.md` §F (Checklist 2, 6). |
| **F8** | Self-check mode | **Ready with corrections** | Independent-by-default check flow and one-way switch to supported practice are verified in `Practice.jsx` (`CheckPage`) and browser checks (`R03-01`, `R03-05b`, `G3`, `G4`); needs only owner confirmation of `DL-028` in `decision-log.md` (Checklist 2). |
| **F9** | Learner-ID profile design document (`CLAUDE-FABLE-R01-007`) | **Ready with corrections** | ADR 0006, ADR 0008, `CLAUDE-FABLE-R01-007`, and prototype `Profile.jsx` provide complete design inputs; needs owner decisions or explicit deferral notes on `DL-007`, `DL-022`, and `DL-027` in `decision-log.md` so the design author knows whether step-1 profile creation is fixed (Checklist 2). |

---

## 5. List of corrections

1. **`docs/learning/mastery.md` (`#persistence-and-current-implementation-status`, line 41):** Replace `"The database ... remain undecided"` with a reference to PostgreSQL as decided in ADR 0008 (closing `DL-025`).
2. **`docs/reviews/round-01/decision-log.md` (`DL-004`, `DL-005`, `DL-006`, `DL-007`, `DL-022`, `DL-026`, `DL-027`, `DL-028`):** Record the owner's decisions for the first-milestone blockers (`DL-004`–`DL-006`, `DL-026`, `DL-028`) and explicit deferral triggers for `DL-007`, `DL-022`, and `DL-027`.
3. **`docs/reviews/round-01/claude-fable/revised-build-brief-corrections.md` (§D `## D. Realistic weekend cut order`, line 80):** Remove `crossing-ten` from Backlog row 2 so it appears only in Backlog row 7 after the first deliverable cutoff.
4. **`docs/reviews/round-01/claude-fable/revised-build-brief-corrections.md` (§E `### Outcome of a delivery`, lines 118–129):** State the deterministic 5-way outcome precedence (`correctAfterExplanation > correctAfterFeedback > correctWithHelp > correctWithVisualHelp > correctFirst`) when multiple events precede the first `correct` response.
5. **`docs/reviews/round-01/claude-fable/revised-build-brief-corrections.md` (§F `## F. Content schemas to add before moving files`, lines 133–142):** Specify exact field names for `schemas/lesson.schema.json`, `schemas/exercise-definition.pilot.schema.json`, and `skill.schema.json` `ladder[]`, include `:::example` and `check` metadata, reconcile `:::practice` attributes (`definition` vs `skill`+`variant`), and require GFM table delimiter rows (`| --- |`).

---

## 6. What could not be verified

- **Physical iPad Safari and Apple VoiceOver (`docs/design/design-principles.md#ipad-and-touch-use`, `docs/design/exercise-experience.md#answering-on-ipad`):** Real iPadOS on-screen keyboard geometry (`visualViewport`), device rotation under keyboard focus, touch ergonomics, and VoiceOver reading of native `<math>` MathML and live regions could not be tested in headless Chromium on Windows.
- **Human usability and comprehension (`Prototype/mathkx-designsystemet/USABILITY-TEST-SCRIPT.md`):** Whether learners understand the learner-ID save step and outcome labels, and whether educators/translators find the Markdown lesson dialect clear without developer assistance, requires human sessions.
- **.NET 10 / C# execution of `SplitMix64` (`DL-024`):** No `.NET` project exists in the repository yet; `SplitMix64` test vectors were verified in Node (`BigInt` and `src/domain/practice.js`), not via `dotnet test`.

---

## 7. Overall verdict

**`ready to specify with the named corrections`**. The mathematical domain logic, observation and disclosure model, bilingual (`nb`/`en`) coverage, accessibility checks in headless Chromium (`80/80` browser checks and `16/16` domain unit tests in the prototype; `18/18` validator unit tests at root), and architectural foundations (`ADR 0001`–`0009`) are coherent, tested, and verified. Before authoring the individual feature specifications `F1`–`F9`, five small, bounded documentation corrections are needed: recording the pending owner decisions (`DL-004`–`DL-006`, `DL-026`, `DL-028` and deferral triggers for `DL-007`, `DL-022`, `DL-027`) in `docs/reviews/round-01/decision-log.md`, updating `docs/learning/mastery.md` line 41 to reflect ADR 0008 (`DL-025`), and tightening `docs/reviews/round-01/claude-fable/revised-build-brief-corrections.md` (§D cut-order row 2, §E outcome precedence, and §F concrete schema field and directive definitions).
