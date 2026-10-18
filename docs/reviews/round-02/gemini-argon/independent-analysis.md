# Phase 1: Independent Analysis of MathKX

- **Reviewer model identity:** Gemini 4 Argon (Medium)
- **Inspected commit:** `7fe5b26c92e7eb4e47bfc89c8bfa02f95d5f72d5` (`main`)
- **Review phase:** Phase 1 (conducted prior to reading any files under `docs/reviews/`)

---

## 1. Executive Summary

MathKX has an unusually thoughtful, coherent conceptual and architectural foundation. Its core premise—that digital mathematics learning should diagnose prerequisite gaps, make mathematical structure visible through accessible representations, separate canonical mathematical skills from jurisdiction-specific curricula, and record honest evidence rather than gamified exercise counts—solves a real problem that worksheet-style platforms fail to address.

At commit `7fe5b26c92e7eb4e47bfc89c8bfa02f95d5f72d5`, the repository is strictly in the **foundation and design stage**. No production backend (`src/backend/`) or production frontend (`src/web/`) exists yet. What exists is:
1. A strong set of product, pedagogical, design, and architectural documents (including 7 accepted ADRs and a comprehensive capability model).
2. Minimal `0.1` exploratory JSON schemas (`schemas/skill.schema.json`, `schemas/exercise.schema.json`), 7 seed skill files, 1 example exercise definition, and a working Node content validator (`tools/validate-content.mjs`) with 18 regression tests running in CI.
3. Two interactive prototypes under `Prototype/`:
   - `Prototype/mathkx-designsystemet/`: A bilingual (Norwegian Bokmål and English) React 19 + Designsystemet 1.23 + Tailwind 4.3 prototype demonstrating the end-to-end learner and contributor user journey with simulated local state.
   - `Prototype/MathKX Learner Experience.dc.html`: An earlier English-only single-file prototype illustrating a Pythagorean theorem → square roots prerequisite detour and skill map, but using unvalidated mastery percentages and custom styling superseded by later documentation and ADR 0007.

Our independent inspection found **no architectural contradictions that invalidate the core vision**, but identified **13 concrete technical, pedagogical, and product gaps** across the documentation, schemas, validator, and prototypes that must be addressed as implementation begins.

---

## 2. Verification Checks Executed and Limitations

### Checks actually executed
1. **Repository & commit verification:**
   - Ran `git rev-parse HEAD` and `git status --short`; confirmed clean checkout at commit `7fe5b26c92e7eb4e47bfc89c8bfa02f95d5f72d5`.
2. **Content validation CLI (`npm run validate`):**
   - Executed `node tools/validate-content.mjs`. Passed: `8 content file(s), 7 skill(s), 1 exercise definition(s)`.
3. **Validator regression suite (`npm test`):**
   - Executed `node --test tools/validate-content.test.mjs`. Passed: 18/18 tests in ~2.46s.
4. **Prototype production build (`npm --prefix Prototype/mathkx-designsystemet run build`):**
   - Executed `vite build` with `vite-plugin-singlefile`. Succeeded in 313ms, producing `dist/index.html` (791.62 kB / 207.50 kB gzip) with zero build or bundling errors.
5. **Deterministic PRNG & bounded sampling verification:**
   - Implemented the exact `SplitMix64` and `nextBelow(n)` algorithms from `docs/architecture/proposals/seed-and-random-source.md` in Node `BigInt` and verified all 5 raw 64-bit seed vectors (`0`, `1`, `42`, `1234567890123456789`, `18446744073709551615`) and all 4 bounded draw sequences (`(42, 10)`, `(42, 6)`, `(0, 1000)`, `(1, 7)`). All outputs matched the specification 100%.
6. **Prototype mathematical domain logic probe:**
   - Imported `Prototype/mathkx-designsystemet/src/domain/math.js` in Node and executed `parseAnswer` and `evaluateAnswer` across boundary cases (integers, decimal commas/points, explicit `+` sign, reversed equation syntax `4 = x`, space/comma thousands separators, 64-bit integer overflow, and misconception distractors).

### Limitations of verification
- **No physical iPad or assistive technology execution:** We could not test on physical iPad hardware, iPadOS Safari, the iPadOS on-screen keyboard, or VoiceOver/NVDA screen readers in this CLI environment.
- **No backend code exists:** There is no `.NET` solution, C# generator, or backend test suite in the repository to build or run.

---

## 3. Classification of Repository Artifacts by Status

To avoid conflating aspirations with reality, table below classifies the current state of the repository:

| Category | What is in the repository | Evidence |
| --- | --- | --- |
| **Implemented & tested behavior** | Node JSON Schema + graph validator for `0.1` skills and exercises; 18 automated CLI tests; GitHub Actions workflow. | `tools/validate-content.mjs`, `tools/validate-content.test.mjs`, `.github/workflows/validate-content.yml` |
| **Exploratory content (`0.1`)** | 7 skill JSON files (Pythagoras / square roots / linear equations seed graph) and 1 exercise definition (`algebra.linear-equations.basic` v1). | `content/skills/*.json`, `content/exercises/examples/linear-equation-basic.json`, `schemas/*.schema.json` |
| **Prototype simulations (non-production)** | Bilingual Designsystemet React prototype (2 topics, 2 Markdown lessons, 9 fixed practice questions, 7 check questions, simulated localStorage profiles/recovery, simulated issue reporting) + legacy `.dc.html` Pythagoras prototype. | `Prototype/mathkx-designsystemet/`, `Prototype/MathKX Learner Experience.dc.html` |
| **Established requirements & ADRs** | Monorepo (ADR 0001), curriculum-independent skills (ADR 0002), hybrid data + .NET code definitions (ADR 0003), deterministic `(id, version, seed)` generation (ADR 0004), 12 independent capability dimensions (ADR 0005), anonymous profiles with optional recovery email (ADR 0006), Designsystemet + Tailwind UI (ADR 0007), bilingual `nb` + `en` first release, iPad-first touch & accessibility, honest progress summaries before mastery. | `docs/vision.md`, `docs/product-principles.md`, `docs/design/*.md`, `docs/learning/*.md`, `docs/architecture/*.md`, `docs/architecture/decisions/0001..0007*.md` |
| **Proposals (unadopted)** | `SplitMix64` PRNG and decimal `uint64` string seeds; Markdown lesson authoring format with front matter and named component embeds. | `docs/architecture/proposals/seed-and-random-source.md`, `docs/design/learning-experience.md` |
| **Unresolved decisions** | Exercise Format v1 schema; `.NET` project layout & interfaces; persistence/DB & auth implementation; mastery & recommendation algorithms; localization storage layout; open-source code/content license; Norwegian written standard (Bokmål assumed) & English regional standard. | `README.md`, `CONTRIBUTING.md`, `docs/architecture/architecture.md`, `docs/learning/mastery.md` |

---

## 4. Detailed Evaluation by Review Area

### 4.1 Concept and Learner Problem
- **Strengths:** The core problem statement in `docs/vision.md` is compelling. Struggling learners (such as the motivating 14-year-old persona) frequently fail on a target topic (e.g., the Pythagorean theorem or linear equations) not because the new rule is incomprehensible, but because an upstream skill (square roots, signed arithmetic, fraction operations, or the relational meaning of `=`) is shaky. Separating skills from grade levels allows an older learner to repair a foundational skill without being placed in a childish "Grade 2" environment.
- **Finding 1 — Disconnect between the 14-year-old target persona, the `content/skills/` graph, and the prototype's primary-school entry content:**
  - `docs/vision.md:7` and `docs/design/design-principles.md:13` center the product on a 14-year-old who finds parts of mathematics difficult.
  - `content/skills/` models a coherent lower-secondary graph (`numbers.integer-operations` → `numbers.powers` → `numbers.square-roots` + `geometry.area-perimeter` → `geometry.pythagorean-theorem` → `geometry.right-triangle-trigonometry`, plus `algebra.linear-equations`).
  - However, `Prototype/mathkx-designsystemet/` (`src/content/catalog.js` and `src/pages/Home.jsx:20-37`) defaults the learner experience to **primary-school addition within 20** (`4 + 4 = ?`, counting individual squares one by one, and number bonds to 10), using a completely disjoint set of skill IDs (`arithmetic.add-within-10`, `arithmetic.number-bonds-10`, `arithmetic.add-make-ten`, `algebra.equality-meaning`, `algebra.solve-x-plus-a`, `algebra.check-solution`) that do not exist in `content/skills/`.
  - While the UI styling is calm and non-childish, making `4 + 4 = ?` ("Tap to count one counter at a time") the default starting experience risks alienating a 14-year-old learner unless the initial implementation slice also delivers the lower-secondary entry point (`algebra.linear-equations` / `geometry.pythagorean-theorem` / `numbers.square-roots`).

### 4.2 Navigation Through Domains, Topics, Skills, and Prerequisites
- **Strengths:** `docs/learning/mathematics-domains.md` defines a clean two-layer model: a human-friendly browsing hierarchy (**domains → topics → skills → exercise families**) overlaid on a cross-domain **skill prerequisite DAG**.
- **Finding 2 — Prerequisite edges are disconnected from skill navigation in the Designsystemet prototype and unrepresented in browsing schemas:**
  - In `schemas/skill.schema.json`, a skill has only `id` and `prerequisites`. There is no defined schema for domains, topics, or skill-to-topic membership.
  - In `Prototype/mathkx-designsystemet/src/pages/Library.jsx:169-189` (`TopicPage`), prerequisites (`details.prereq`) are hardcoded links to *topics* (`topic: 'arithmetic.counting'`), while "Skills in this topic" (`details.skills`) is rendered as a non-interactive plain text list (`<li>{L(s.title)}</li>`) with no prerequisite edges and no status per skill.
  - Conversely, `Prototype/MathKX Learner Experience.dc.html` had an explicit interactive Skill Map (both visual graph and accessible list view) showing how upstream prerequisites connect to the current goal, which was dropped entirely in `Prototype/mathkx-designsystemet/`.

### 4.3 Learning, Exploration, Practice, and Self-Checks
- **Strengths:** The four learning purposes (`Learn`, `Explore`, `Practice`, `Check understanding`) in `docs/design/learning-experience.md` are pedagogically sound and well-integrated in the Designsystemet prototype: learners can read a lesson, play with an embedded explorer (`TenFrameExplorer`), practice with immediate feedback, and take a self-check with deferred feedback and section-linked review recommendations.
- **Finding 3 — Premature "Lesson explored" trigger in `Lesson.jsx`:**
  - In `Prototype/mathkx-designsystemet/src/pages/Lesson.jsx:55-61`, a lesson is permanently marked `explored` either after a 20-second timer OR immediately when `readyRef` (the call-to-action card at the bottom of the lesson) intersects the viewport via `IntersectionObserver`.
  - On large screens, short lessons, or when following a deep link from a self-check summary (`#/lesson/number-bonds-to-ten?s=try`), `readyRef` intersects immediately on load, recording the lesson as "explored" in under 1 second.
- **Finding 4 — Self-check skipped items and run summaries are lost across sessions, and independent self-checks are unmodeled:**
  - In `Prototype/mathkx-designsystemet/src/pages/Practice.jsx:77-82`, when a learner skips a question during a self-check (`onSkip`), `record` checks `if (!resp.skipped) dispatch({ type: 'attempt', ... })`. Skipped questions are never recorded in `progress.attempts`, and the check run object (`state.checks[id]`) is stored only in `sessionStorage` (`store.jsx:94` resets `checks: {}` on sign-in/sign-out).
  - Furthermore, `docs/design/exercise-experience.md:91-92` requires supporting checks that observe independent work (with an explicit transition if help is requested), whereas the prototype only models a single fixed check policy where visual help is always open inside the check.

### 4.4 Authored Examples and Deterministic Generated Exercises
- **Strengths:** `ADR 0003`, `ADR 0004`, and `docs/architecture/exercise-capability-model.md` make the right architectural call: do not turn JSON into a Turing-complete DSL, and do not force fixed authored tasks through dummy random generators.
- **Finding 5 — Total disconnect between the repository's example exercise definition and the prototype's exercise engine:**
  - The repository's sole exercise definition (`content/exercises/examples/linear-equation-basic.json`) specifies `generator: "linear-equation"` with `coefficientMin: 2, coefficientMax: 8, solutionMin: -10, solutionMax: 10` (equations involving coefficients $\ge 2$ and negative solutions).
  - The prototype (`Prototype/mathkx-designsystemet/src/content/catalog.js:185-229`) does not use exercise definitions, seeds, or generators at all—it uses hardcoded arrays of `{ id, kind, a, b/c }`. Moreover, its `linear` kind (`src/domain/math.js:43-59`) and `Balance.jsx` component (`src/components/math/Balance.jsx:6-43`) only support $x + a = c$ with unit coefficient ($1x$) and positive integers $0 < a < c$. Thus the prototype's `Balance` component cannot represent the repository's own `linear-equation-basic.json` example.

### 4.5 More Practice and Understandable Difficulty Controls
- **Strengths:** `docs/design/learning-experience.md:28-55` defines a clear, respectful model for learner control: `Another question`, `More like this`, `Make it easier`, `More challenge`, and `Check my understanding`, applying changes to the next question while preserving current work and explaining concretely what mathematical feature changes.
- **Finding 6 — Practice and challenge controls are completely absent from the prototype and unmapped to the deterministic identity contract:**
  - `Prototype/mathkx-designsystemet/` implements none of `More like this`, `Make it easier`, or `More challenge` (neither UI controls in `ExerciseShell.jsx`/`Practice.jsx` nor translations in `i18n.js`). Practice is just a fixed 4–5 item stepper with a `Start again` reset button.
  - Architecturally, `learning-experience.md:54` notes that challenge selection *"must resolve to reproducible content: do not change generator parameters invisibly under the same definition ID, version, and seed."* Format v1 therefore needs an explicit mechanism—either separate exercise definitions linked as easier/harder variants in a topic/skill progression, or named preset difficulty tiers within a definition—so that `(definitionId, version, seed)` remains self-contained and deterministic.

### 4.6 Progress Tracking Versus Evidence of Mastery
- **Strengths:** `docs/learning/mastery.md` wisely defers premature mastery formulas (avoiding the arbitrary `38% -> 61%` percentages shown in the older `.dc.html` prototype) in favor of an honest observation and activity-summary model.
- **Finding 7 — Two concrete bugs in the prototype's activity and independence tracking violate `mastery.md`:**
  1. **Permanent help taint (`Prototype/mathkx-designsystemet/src/activity.js:15-17`):**
     ```js
     const correct = attempts.filter((a) => a.correct);
     if (correct.some((a) => a.help?.length)) return 'practicedHelp';
     if (correct.length) return 'practicedIndependent';
     ```
     Because `progress.attempts` is an append-only log and `correct.some(...)` checks whether *any* historical correct attempt ever used help, a learner who uses visual help once on their very first question can **never** achieve `practicedIndependent` ("Practised independently"), no matter how many subsequent questions or full sessions they complete without help. This directly contradicts `docs/product-principles.md:13` and `docs/learning/mastery.md:35`.
  2. **Misclassification of retries after corrective mathematical feedback as "independent" (`Prototype/mathkx-designsystemet/src/components/ExerciseShell.jsx:32-45`):**
     `docs/learning/mastery.md:31` explicitly requires: *"A successful retry after mathematical feedback must not be presented as a first independent answer."*
     In `ExerciseShell.jsx`, `work.helpUsed` only records visual help toggles/steps. When a learner submits a wrong answer in practice mode, receives specific corrective mathematical feedback (e.g., `lin.added`: *"It looks like you added 3... Try subtracting 3 from both sides"*), and then submits the right answer on try #2, `ExerciseShell.jsx:43` dispatches `{ correct: true, help: [] }`. `Home.jsx:61` and `activity.js:17` then display this attempt as `"Correct, independently"` (`Riktig på egen hånd`).
  3. **Post-solution help toggle mutates `work.helpUsed` (`ExerciseShell.jsx:30`):**
     If a learner solves an exercise independently and *then* clicks `Show visual help` before clicking `Next exercise`, `toggleHelp` still appends `'visual'` to `work.helpUsed` in session state, blurring pre-answer vs. post-answer support (`docs/design/exercise-experience.md:79`).

### 4.7 Visual Explanations of Why Answers Are Correct
- **Strengths:** The visual models in `Prototype/mathkx-designsystemet/src/components/math/` (`GroupsHelp`, `TenFrameExplorer`, `MakeTen`, `Balance`) are pedagogically clear, calm, button-driven (avoiding finicky drag-and-drop), and use dual visual encoding (color + heavy border + interior pip) so meaning never relies on color alone.
- **Finding 8 — Post-answer worked explanation steps are unreachable in `ExerciseShell.jsx`, and visual components lack domain guards:**
  - In `ExerciseShell.jsx:58-64`, `MakeTen` and `Balance` are hardcoded with `revealFinal={false}`, which caps `last` at step index `2` (`x = ?` or `What is 10 and 3 altogether?`) even *after* `work.solved === true`. Thus, in practice mode, a learner who solves `8 + 5` or `x + 3 = 7` and opens visual help to see the full worked explanation (`docs/design/exercise-experience.md:63`) can never view the final explanation step (`step 3`).
  - None of `GroupsHelp`, `MakeTen`, or `Balance` validate their input domain. `MakeTen` assumes $1 \le a \le 9$, $1 \le b \le 9$, and $a + b > 10$ (if $a > 10$, `need = 10 - a` is negative, breaking the ten-frame cell array); `Balance` assumes $a > 0$ and $c > a$. As `docs/design/exercise-experience.md:77` warns, each visual component must enforce its supported parameter domain in code rather than silently rendering nonsensical visuals.

### 4.8 Anonymous Profile Setup, Optional Recovery Email, and Cross-Device Progress
- **Strengths:** `ADR 0006` and `Prototype/mathkx-designsystemet/src/pages/Profile.jsx` set a high bar for privacy-respecting design: no personal details required, unambiguous 8-character Crockford-style ID (`MKX-XXXX-XXXX`), hidden `username` field for password manager auto-save, downloadable `.txt` ID reminder, mandatory save-confirmation checkbox, optional verified recovery email, and non-enumerating recovery responses.
- **Finding 9 — Premature profile commit at Step 1 of the 4-step signup flow and missing guest-merge policy:**
  - In `Profile.jsx:106-116`, `submitStep1` dispatches `createProfile` (which sets `state.profileId`) *before* Step 2 (saving/downloading the ID and checking the confirmation box) and Step 3 (optional recovery email). If the learner clicks any navigation link during Step 2 or closes the tab before saving their ID, the profile is already active without the learner having saved their auto-generated ID.
  - In `Profile.jsx:66-77` (`EmailSetup` verify stage), if a learner mistypes their email address in Step 3, there is no button to edit the email or cancel back to "Continue without email"—only `Confirm` and `Confirm later`.
  - In `store.jsx:92-95`, signing into an existing profile (`signIn`) overwrites `state.progress` with `p.progress`, silently discarding any guest activity completed in the current session prior to signing in.

### 4.9 Norwegian and English Coverage
- **Strengths:** Both UI copy (`src/i18n.js`) and lesson/exercise content (`src/content/`) in `Prototype/mathkx-designsystemet/` are written in idiomatic Norwegian Bokmål (`nb`) and English (`en`). Language switching is instant and preserves route, typed answers, open visual help, and step indices.
- **Finding 10 — Untranslated accessibility labels and locale-blind number parsing in the prototype:**
  - In `Prototype/mathkx-designsystemet/src/components/math/Counters.jsx:61`, the screen-reader label for the `+` operator between counter groups is hardcoded in Norwegian (`<span className="ds-sr-only">pluss</span>`), so English screen-reader users hear `"pluss"`.
  - In `Prototype/mathkx-designsystemet/src/components/math/TenFrame.jsx:19`, the counter legend list has a hardcoded English `aria-label="Legend"` even in Norwegian (`nb`).
  - In `Prototype/mathkx-designsystemet/src/domain/math.js:5-21`, `parseAnswer(raw, { variable })` does not accept a `lang`/`locale` parameter. It strips spaces and replaces `,` with `.` unconditionally (`Number(s.replace(',', '.'))`). As a result:
    - An English learner typing `1,000` (comma thousands separator) has their answer silently parsed as `1` (`1.000`).
    - Explicit leading plus signs (`+4`) and reversed equations (`4 = x`) are rejected as `unparseable`.
    - Large integers exceeding `Number.MAX_SAFE_INTEGER` silently lose precision via `parseInt`/`Number`.

### 4.10 iPad Usability and Accessibility
- **Strengths:** The Designsystemet prototype uses real accessible primitives (`@digdir/designsystemet-react` 1.23.0), generous touch targets (`2.75rem` counters, `data-size="lg"` inputs/buttons), explicit CSS `@layer theme, base, ds, mathkx, components, utilities` so Tailwind Preflight does not strip Designsystemet focus rings or button borders, polite live regions for feedback, and step buttons instead of drag gestures.
- **Finding 11 — iPad on-screen keyboard `inputMode` mismatch and fragile custom MathML tokenizer:**
  - In `ExerciseShell.jsx:91`, `inputMode` is set to `q.kind === 'linear' ? 'text' : 'numeric'`. On iPadOS Safari:
    - Setting `inputMode="text"` for `linear` equations opens the full alphabetic QWERTY keyboard (taking up half the iPad screen and hiding the top number row on smaller iPads) even though the expected answer is an integer (`4`).
    - Setting `inputMode="numeric"` for arithmetic will fail as soon as negative integers (`numbers.integer-operations`) or fractions are introduced, because iOS/iPadOS numeric keypads do not reliably provide `-` or `/`.
  - In `src/components/math/MathExpr.jsx:3`, the custom regex tokenizer (`/\s*(\d+(?:[.,]\d+)?|[a-zA-Z]|[+\-−=×·?()□])\s*/g`) produces flat `<mrow>` elements and silently drops any character outside that set (such as `<`, `>`, `≤`, `≥`, `/`, `^`, `√`). While sufficient for `4 + 4` and `x + 3 = 7`, it cannot render exponents (`6²`), roots (`√81`), or fractions (`3/4`), and inside `Markdown.jsx` lessons it lacks the `spoken` screen-reader fallback used in `ExerciseShell.jsx`.

### 4.11 Educator and Translator Contribution Workflows
- **Strengths:** The two-path contribution model (`CONTRIBUTING.md`) and the in-lesson "Suggest an improvement" / "View or edit lesson source" dialogs in `Lesson.jsx` are well-conceived and protect learner privacy by omitting profile IDs from issue templates.
- **Finding 12 — Unchosen open-source license blocks external contributions, and lesson/catalog IDs lack validation:**
  - Both `README.md:60` and `CONTRIBUTING.md:63` note that **neither a code license nor a content license has been selected**. In open-source projects, accepting external PRs before a license is adopted creates copyright encumbrance. Choosing and recording the code and content licenses (e.g., MIT/Apache-2.0 for code, CC BY-SA 4.0 or CC BY 4.0 for content) is a hard prerequisite before accepting external contributions.
  - Because Markdown lessons have no validator yet, the prototype's own two lessons already exhibit an ID mismatch between their YAML front matter (`id: arithmetic.number-bonds-to-ten` and `id: algebra.equations-as-a-balance` in `src/content/lessons/*.md`) and their catalog keys (`number-bonds-to-ten` and `equations-as-a-balance` in `src/content/catalog.js:171-182`).

### 4.12 Mathematical Correctness, Reproducibility, and Implementation Feasibility
- **Strengths:** `docs/architecture/proposals/seed-and-random-source.md` is mathematically rigorous. Its choice of `SplitMix64`, decimal string representation for `uint64` seeds (`^(0|[1-9][0-9]*)$`), and unbiased rejection sampling (`nextBelow(n)`) avoids JavaScript `Number` 53-bit truncation and `.NET` `System.Random` cross-version drift. Our independent script verified every test vector in the proposal.
- **Finding 13 — Minor validator gaps in `tools/validate-content.mjs`:**
  - In `tools/validate-content.mjs:123-139`, the validator branches on `schemaName === SKILL_SCHEMA` (`skill.schema.json`) and `else if (schemaName === EXERCISE_SCHEMA)` (`exercise.schema.json`). Any content file pointing to another schema inside `schemas/` (as new schemas are added) would pass JSON Schema validation and be counted in `files.length` without an explicit handler or error if unrecognized.
  - In `tools/validate-content.mjs:126`, duplicate skill ID errors print `skills.get(data.id).file` (which is an unnormalized absolute filesystem path), whereas duplicate exercise ID errors (`line 133`) normalize the path with `path.relative(repoRoot, ...).replaceAll("\\", "/")`.

---

## 5. Summary of Phase 1 Independent Findings

| # | Area | Severity | Summary |
| --- | --- | --- | --- |
| 1 | Concept / Scope | Medium | Disjoint skill sets between `content/skills/` (lower-secondary Pythagoras/algebra) and `Prototype/mathkx-designsystemet/` (primary-school addition within 20 as default entry). |
| 2 | Navigation / Graph | Medium | Designsystemet prototype models prerequisites at the topic level and renders topic skills as static text with no skill-graph navigation. |
| 3 | Learning / Lessons | Low | `Lesson.jsx` marks a lesson "Explored" immediately if the bottom card intersects the viewport on load or via section jump links. |
| 4 | Self-Checks | Medium | Skipped check questions are omitted from `progress.attempts`, check summaries live only in `sessionStorage`, and independent self-check mode is unimplemented. |
| 5 | Exercises / Generators | High | `content/exercises/examples/linear-equation-basic.json` (`ax + b = c` with negative solutions and coefficients 2–8) has no generator implementation and cannot be rendered by the prototype's unit-coefficient positive-only `Balance.jsx`. |
| 6 | Practice / Challenge | Medium | Required practice/challenge controls (`More like this`, `Make it easier`, `More challenge`) are absent from the prototype and need a deterministic identity mapping in Format v1. |
| 7 | Progress / Evidence | High | `activity.js` permanently taints a practice set as `practicedHelp` if help was ever used once; `ExerciseShell.jsx` mislabels retries after corrective mathematical feedback as `"Correct, independently"`. |
| 8 | Visual Explanations | Medium | `ExerciseShell.jsx` passes `revealFinal={false}` to `MakeTen` and `Balance` even after an exercise is solved, hiding the final explanation step; visual components lack parameter domain guards. |
| 9 | Profiles & Auth UX | Medium | `Profile.jsx` creates and signs into the profile at Step 1 *before* Step 2 (saving the learner ID); Step 3 email verification lacks a back/edit action; `signIn` overwrites guest session progress. |
| 10 | Localization (`nb`/`en`) | Medium | Hardcoded `"pluss"` (`Counters.jsx:61`) and `"Legend"` (`TenFrame.jsx:19`) in screen-reader labels; `parseAnswer` is locale-blind and misparses English `1,000` as `1`. |
| 11 | iPad & Accessibility | Medium | `ExerciseShell.jsx` uses `inputMode="text"` for `linear` (forcing full QWERTY keyboard on iPad) and `numeric` for addition (no minus key for negative numbers); `MathExpr.jsx` only tokenizes flat tokens. |
| 12 | Contribution / License | High | Unchosen code and content licenses block external contributions; lesson YAML front-matter IDs disagree with `catalog.js` keys. |
| 13 | Validator Tooling | Low | `tools/validate-content.mjs` prints unnormalized absolute paths on duplicate skill IDs and silently ignores unknown schema basenames inside `schemas/`. |
