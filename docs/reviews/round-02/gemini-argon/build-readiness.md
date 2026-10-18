# Build Readiness Assessment

- **Reviewer model identity:** Gemini 4 Argon (Medium)
- **Inspected commit:** `7fe5b26c92e7eb4e47bfc89c8bfa02f95d5f72d5` (`main`)
- **Companion documents:**
  - [independent-analysis.md](file:///d:/repos/MathKX/docs/reviews/round-02/gemini-argon/independent-analysis.md)
  - [comparison-and-recommendations.md](file:///d:/repos/MathKX/docs/reviews/round-02/gemini-argon/comparison-and-recommendations.md)

---

## 1. Readiness Verdict

### Verdict: **Ready with specific conditions** (for the first internal implementation milestone) / **Not ready** (for public learner release)

MathKX is **ready with specific conditions** to begin building its first vertical engineering slice (`src/` + `tests/`), because:
1. The core architectural decisions (`ADR 0001`–`0007`) and deterministic RNG specification ([seed-and-random-source.md](file:///d:/repos/MathKX/docs/architecture/proposals/seed-and-random-source.md)) are sound, internally consistent, and mathematically verified.
2. The two authoritative documentation gaps identified in Round 1—pre-mastery observation semantics in [docs/learning/mastery.md](file:///d:/repos/MathKX/docs/learning/mastery.md#L13-L46) and bounded visual explanations / post-answer help timing in [docs/design/exercise-experience.md](file:///d:/repos/MathKX/docs/design/exercise-experience.md#L61-L88)—are **already resolved** in `main` at commit `7fe5b26c92e7eb4e47bfc89c8bfa02f95d5f72d5`.

### Specific Conditions to Meet When Starting Milestone 1
1. **Do not implement the flawed `missing-part-to-ten@1` or `numbers.addition.within-20` items from Round 1's `revised-build-brief.md` (`GEMINI-R02-001`):** Keep Milestone 1 to `addition-pair@1` with `numbers.addition.within-10` ($1 \le a, b \le 9,\; a + b \le 10$) and `numbers.addition.crossing-ten` ($2 \le a, b \le 9,\; 11 \le a + b \le 18$), where the single-ten-frame (`GroupsHelp`) and double-ten-frame (`MakeTen`) visual models are mathematically exact and cannot produce invalid `need <= 0` states or exhaust a 5-pair repeat-avoidance pool.
2. **Follow [mastery.md](file:///d:/repos/MathKX/docs/learning/mastery.md#L13-L46) and [exercise-experience.md](file:///d:/repos/MathKX/docs/design/exercise-experience.md#L79) rather than Round 1's `Observation` table (`GEMINI-R02-002`, `GEMINI-R02-003`):**
   - Separate `partially-correct`, `review-needed`, and `invalid-response` (never count `invalid-response` as a mathematical error or retry).
   - Compare support event timestamps against the solving submission timestamp so post-answer visual inspection (`revealFinal={work.solved}`) never marks an independent answer as `"with visual help"`.
   - Ensure subsequent independent solves advance topic status from `"Practised with visual help"` to `"Practised"`.
3. **Standardize lesson front-matter `id` and validate bilingual parity (`GEMINI-R02-004`):** Fix `id: arithmetic.number-bonds-to-ten` $\rightarrow$ `id: number-bonds-to-ten` when moving lessons to `content/lessons/<lesson-id>/{nb,en}.md` and enforce identical `id`, `skills`, `related`, `practice`, section `{#anchor}` IDs, and `:::visual[...]` blocks in `tools/validate-content.mjs`.

---

## 2. The Smallest Useful First Implementation (Milestone 1)

Rather than expanding the first milestone to four definitions, two generators, or four topics, the **smallest useful first implementation** that proves the end-to-end architecture ([ADR 0003](file:///d:/repos/MathKX/docs/architecture/decisions/0003-technology-direction.md), [ADR 0007](file:///d:/repos/MathKX/docs/architecture/decisions/0007-deterministic-exercise-generation.md)) is:

1. **Deterministic `.NET` Domain Core (`src/MathKX.Domain` + `tests/MathKX.Domain.Tests`):**
   - `SeededRandom` (`SplitMix64` + `NextInt`/`NextBelow`) passing all test vectors from [seed-and-random-source.md](file:///d:/repos/MathKX/docs/architecture/proposals/seed-and-random-source.md#L101-L120) (`GEMINI-R02-005`).
   - One generator (`addition-pair@1`) and one validator (`numeric-equality@1`) supporting misconception detection (`off-by-one`, `forgot-carry-ten`, `subtracted-instead-of-added`) and `invalid-response` separation.
   - Repeat avoidance on **ordered pairs `(a, b)`** bounded by `min(windowSize, candidatePoolSize / 2)`.
2. **Validated Repository Content (`content/` + `tools/validate-content.mjs`):**
   - Two arithmetic exercise definitions in `content/exercises/arithmetic/`:
     - `numbers.addition.within-10.json` ($1 \le a, b \le 9,\; 2 \le a + b \le 10$, targeting `numbers.addition.within-20` / prerequisite `numbers.number-bonds.to-10`).
     - `numbers.addition.crossing-ten.json` ($2 \le a, b \le 9,\; 11 \le a + b \le 18$, targeting `numbers.addition.within-20`).
   - Bilingual lessons in `content/lessons/<lesson-id>/{nb,en}.md` for the arithmetic slice (`number-bonds-to-ten` and `crossing-ten-addition`), validated by `npm run validate` for skill/exercise references and `nb`/`en` structural parity (`GEMINI-R02-004`).
3. **Minimal API + React/TypeScript Practice Loop (`src/MathKX.Api` + `src/MathKX.Web`):**
   - Endpoints to serve validated catalog/lesson content, generate an exercise instance for `(exerciseId, seed, locale)`, and validate a learner submission (`(exerciseId, version, seed, response, locale)`).
   - Lesson $\rightarrow$ Practice $\rightarrow$ `"More practice"` loop for `within-10` and `crossing-ten`, including:
     - Difficulty control (`Easier` $\rightarrow$ `numbers.addition.within-10`, `Standard` $\rightarrow$ `numbers.addition.crossing-ten`).
     - Pre-answer visual help (`step 1..2`) vs. post-answer worked explanation (`step 1..3` via `revealFinal={work.solved}`, `GEMINI-R02-003`).
     - Honest session observation tracking in browser `localStorage` implementing [mastery.md](file:///d:/repos/MathKX/docs/learning/mastery.md#L13-L46) (`GEMINI-R02-002`).
     - Fixes for localization leaks (`TenFrame.jsx`, `Counters.jsx`), `MathExpr` spoken labels, and `Lesson.jsx` exploration tracking (`GEMINI-R02-006`, `GEMINI-R02-007`).

---

## 3. Decisions Genuinely Requiring the Owner

Only three brief decisions require owner sign-off to start Milestone 1, plus one optional requirement clarification prior to public release:

### Decisions Needed Now (Before / At Milestone 1 Start)
1. **Promote `seed-and-random-source.md` to Accepted ADR 0008?**
   - *Recommendation:* **Yes**, promote [docs/architecture/proposals/seed-and-random-source.md](file:///d:/repos/MathKX/docs/architecture/proposals/seed-and-random-source.md) to `docs/architecture/decisions/0008-seed-and-random-source.md` as written.
2. **Confirm Milestone 1 Exercise Scope (`GEMINI-R02-001`):**
   - *Question:* Confirm that Milestone 1 starts with `addition-pair@1` across `numbers.addition.within-10` and `numbers.addition.crossing-ten` (where `GroupsHelp` and `MakeTen` visuals are exact), deferring `numbers.number-bonds.missing-part` (`a + ? = 10`) and full `within-20` ($a \ge 10$ or $b \ge 10$) to Milestone 2 so their visual models are built properly rather than hacked.
3. **Confirm Dev-Slice Treatment of Unbuilt Features (Profiles, Self-Checks, Linear Equations):**
   - *Question:* While Milestone 1 wires the arithmetic vertical slice to the `.NET` backend, should the linear-equation topic (`linear-equations-balance`), self-checks (`#/check/:id`), and profile modal be hidden behind a dev flag or shown with an explicit `"Preview / Coming soon"` badge?
   - *Recommendation:* Hide profile creation and self-checks in Milestone 1 (`GEMINI-R02-009`, `GEMINI-R02-010`), and wire `linear-equations-balance` in Milestone 2 as the second generator family (`linear-equation-ax-plus-b@1`).

### Proposed Requirement Clarifications (For the Future Profile Milestone — Explicitly Labeled)
- **[Proposed Requirement Addition to ADR 0006 — Optional]:** When anonymous profile creation (`ADR 0006`) is implemented in a later milestone, we recommend adding two concrete UX safeguards to the implementation spec:
  1. Do not activate the profile session until the learner completes Step 2 (*"I have saved my learner ID"* or recovery file download) (`GEMINI-R02-009`).
  2. Provide an explicit `"Edit email"` and `"Continue without email"` escape hatch on the Step 3 verification screen (`GEMINI-R02-009`).
  *(Note: We do **not** propose changing any established principle in `ADR 0006` itself—server-generated opaque recovery code, optional recovery email, untrusted guest import, and clear reset remain unchanged.)*

---

## 4. What Should Be Deferred

In accordance with [AGENTS.md](file:///d:/repos/MathKX/AGENTS.md#L38) (*"Do not scaffold infrastructure or application layers without a concrete need. Do not expand the first milestone simply to accommodate more ideas"*), defer the following from Milestone 1:

1. **Missing-part (`a + ? = 10`) and teen-addend (`14 + 3`, `19 + 1`) generators and visual models** — defer to Milestone 2 where dedicated missing-part ten-frame visuals and 20-frame teen addition visuals can be designed cleanly.
2. **Linear equation runtime migration (`linear-equation-ax-plus-b@1`)** — defer to Milestone 2 once `addition-pair@1` proves the `.NET` generation/validation API contract.
3. **Self-checks (`#/check/:id`)** — defer until mixed-skill item selection and per-skill check evidence attribution are specified (`GEMINI-R02-010`).
4. **Anonymous profile persistence, recovery codes, optional recovery email, and guest history import (`ADR 0006`)** — defer until relational persistence (PostgreSQL) is introduced.
5. **Freezing Exercise Format v1 (`schemas/exercise.schema.json`)** — defer until at least two distinct generator families (`addition-pair@1` and `linear-equation-ax-plus-b@1`) and one non-numeric interaction mode run in production code.
6. **Mastery scoring algorithms, spaced repetition, and adaptive scheduling** — explicitly deferred by [mastery.md](file:///d:/repos/MathKX/docs/learning/mastery.md#L13-L16).
7. **Curriculum mappings (LK20) and educator authoring UI** — keep authoring in Git/JSON/Markdown with `npm run validate`.

---

## 5. Questions Requiring Learner, Educator, or Device Testing (Rather Than More Model Review)

Further LLM review rounds on the repository's current markdown and prototype files will have diminishing returns. The following questions can **only** be answered empirically with real learners, educators, and physical hardware:

### 5.1 Physical Device & Assistive Technology Testing
1. **iPad Safari & iPadOS On-Screen Keyboard Ergonomics:**
   - When the on-screen numeric keypad opens on an 11" iPad (landscape and portrait) or iPad mini, does the sticky submit bar or the expanded `MakeTen` / `Balance` visual panel get pushed off-screen or require awkward scrolling?
   - How does iPadOS Scribble (Apple Pencil handwriting in the answer input) interact with `parseAnswer`?
2. **Screen Reader Navigation of Visual Models (VoiceOver on iPadOS/macOS, NVDA on Windows):**
   - When a blind or low-vision learner steps through `MakeTen` (`step 1 -> 2 -> 3`) or `Balance`, does `aria-live="polite"` announce the mathematical transition clearly, or are the SVG counter descriptions too verbose/silent?

### 5.2 Learner Comprehension & Pedagogical Testing
3. **Visual Model Comprehension (Ages 6–10 for Arithmetic, Ages 11–14 for Balance):**
   - Do young learners immediately understand the hollow dashed counters (`emptyNeeded`) and yellow moved counters in [`TenFrame.jsx`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/components/TenFrame.jsx), or do they confuse hollow slots with existing counters?
   - When learners click `"Easier"` or `"Slightly harder"`, do they understand why the problem family changed?
4. **Status Badge Interpretation:**
   - Do learners and parents understand the difference between `"Practised with visual help"` and `"Practised"`, and does the phrasing encourage them to try one more question without help rather than feeling penalized?
5. **Anonymous Recovery Code Flow (`ADR 0006`, once implemented):**
   - In real classroom or home use on shared iPads, can learners successfully save and later re-enter a recovery code (`MKX-4829-LION`) without teacher intervention?

### 5.3 Educator & Translator Testing
6. **Norwegian (`nb`) Pedagogical Naturalness:**
   - Do Norwegian primary/lower-secondary mathematics teachers find terms like *tiervenner*, *tierovergang*, *vektstang*, and the misconception feedback hints natural and aligned with Norwegian classroom language?
7. **Git/Schema Authoring Workflow:**
   - Can a mathematics educator who is not a software engineer author a new lesson or tweak an exercise definition using `npm run validate` error messages alone?
