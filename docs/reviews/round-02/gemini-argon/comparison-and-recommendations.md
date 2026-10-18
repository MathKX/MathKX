# Phase 2 — Comparison with Round 1 Reviews and Actionable Recommendations

- **Reviewer model identity:** Gemini 4 Argon (Medium)
- **Inspected commit:** `7fe5b26c92e7eb4e47bfc89c8bfa02f95d5f72d5` (`main`)
- **Review phase:** Phase 2 (after completing [independent-analysis.md](file:///d:/repos/MathKX/docs/reviews/round-02/gemini-argon/independent-analysis.md) and reading all reports in [docs/reviews/round-01/](file:///d:/repos/MathKX/docs/reviews/round-01/))
- **Inspected Round 1 documents:**
  - [claude-fable/analysis.md](file:///d:/repos/MathKX/docs/reviews/round-01/claude-fable/analysis.md)
  - [claude-fable/recommendations.md](file:///d:/repos/MathKX/docs/reviews/round-01/claude-fable/recommendations.md)
  - [claude-fable/proposed-build-brief.md](file:///d:/repos/MathKX/docs/reviews/round-01/claude-fable/proposed-build-brief.md)
  - [claude-fable/response-to-codex.md](file:///d:/repos/MathKX/docs/reviews/round-01/claude-fable/response-to-codex.md)
  - [claude-fable/revised-build-brief.md](file:///d:/repos/MathKX/docs/reviews/round-01/claude-fable/revised-build-brief.md)
  - [codex/challenge.md](file:///d:/repos/MathKX/docs/reviews/round-01/codex/challenge.md)
  - [codex/readiness.md](file:///d:/repos/MathKX/docs/reviews/round-01/codex/readiness.md)
  - [2026-10-18-fable-project-review.md](file:///d:/repos/MathKX/docs/reviews/2026-10-18-fable-project-review.md)

---

## 1. Important Issues Earlier Reviewers Missed

While Round 1 (`claude-fable` and `codex`) identified several important architectural and schema issues, both reviewers missed concrete behavioral defects in the prototype and introduced subtle flaws in the proposed build brief:

### 1.1 Post-answer visual explanation (`step === 3`) is dead code, and post-answer inspection retroactively taints the attempt as "helped"
- **What was missed:** Neither `claude-fable` nor `codex` inspected how [`ExerciseShell`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/pages/ExerciseShell.jsx#L29-L64) wires `revealFinal` and `openVisual` into [`MakeTen`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/components/Counters.jsx#L74-L81) and [`Balance`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/components/Balance.jsx#L10-L11).
- **Repository evidence:**
  - [`ExerciseShell.jsx`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/pages/ExerciseShell.jsx#L58-L64) hardcodes `revealFinal={false}` even after `work.solved === true`. Inside `MakeTen` and `Balance`, `const last = revealFinal ? 3 : 2;` permanently blocks step `3` (the worked conclusion: `8 + 5 = 10 + 3 = 13` or `x = 4, because 4 + 3 = 7`).
  - [`ExerciseShell.jsx`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/pages/ExerciseShell.jsx#L30) appends `'visual'` to `work.helpUsed` whenever `openVisual` is clicked, even *after* the learner has already solved the question independently (`work.solved === true`).
- **Why it matters:** This directly violates [exercise-experience.md](file:///d:/repos/MathKX/docs/design/exercise-experience.md#L63-L79): learners in practice mode can never reach the visual explanation of *why* the final answer follows, and curious learners who inspect the visual model *after* answering right are retroactively downgraded to `"Practised with visual help"`.

### 1.2 Permanent "with visual help" taint across topic summaries and within the Round 1 `revised-build-brief.md`
- **What was missed:** Both reviewers analyzed [`topicStatus`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/domain/activity.js#L6-L19), and `codex` ([C04](file:///d:/repos/MathKX/docs/reviews/round-01/codex/challenge.md#L88-L108)) caught static `qid` matching and retry-after-feedback erasure. However, neither reviewer caught line 16 of [`activity.js`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/domain/activity.js#L16):
  ```js
  if (correct.some((a) => a.help?.length)) return 'practicedHelp';
  ```
  Worse, [`claude-fable/revised-build-brief.md`](file:///d:/repos/MathKX/docs/reviews/round-01/claude-fable/revised-build-brief.md#L151-L157) **re-specifies the same bug** at the instance and topic levels:
  - Instance rule in `revised-build-brief.md` (§6, line 153): *"Any `correct` and any `help-*` support -> Right with visual help"*. If a learner uses help on submission 1, or solves a later generated instance without help, `any` historical help permanently suppresses `"Practised"` in favor of `"Practised with visual help"`.
  - This directly violates [product-principles.md](file:///d:/repos/MathKX/docs/product-principles.md#L13) (*"Never punish struggle: hints and mistakes should not permanently taint a learner's record"*) and [mastery.md](file:///d:/repos/MathKX/docs/learning/mastery.md#L35).

### 1.3 Lesson front-matter `id` mismatch with catalog and route identities
- **What was missed:** `claude-fable` proposed moving the prototype lessons to `content/lessons/<lesson-id>/{nb,en}.md` and adding a lesson validator (`FABLE-R01-002` / `revised-build-brief.md` Task 1), and `codex` (`C05`) asked for schema rules, but **neither reviewer noticed that the existing lesson files already have mismatched `id` fields**:
  - [`number-bonds-to-ten.nb.md`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/content/lessons/number-bonds-to-ten.nb.md#L2) and [`number-bonds-to-ten.en.md`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/content/lessons/number-bonds-to-ten.en.md#L2) declare `id: arithmetic.number-bonds-to-ten` (with an `arithmetic.` prefix).
  - [`crossing-ten-addition.nb.md`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/content/lessons/crossing-ten-addition.nb.md#L2) and [`linear-equations-balance.nb.md`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/content/lessons/linear-equations-balance.nb.md#L2) omit the prefix (`crossing-ten-addition`, `linear-equations-balance`).
  - [`catalog.js`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/content/catalog.js#L50) uses `id: 'number-bonds-to-ten'`, while [`Lesson.jsx`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/pages/Lesson.jsx#L185) reports `meta.id` in learner issue reports.
- **Why it matters:** Without an explicit parity check between directory name, `nb.md` `id`, `en.md` `id`, and section anchor `{#id}` sets, migrating existing lesson files into `content/lessons/` immediately carries broken cross-references into the repository.

### 1.4 Premature `lessonExplored` trigger via bottom-CTA `IntersectionObserver`
- **What was missed:** [`Lesson.jsx`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/pages/Lesson.jsx#L55-L61) marks a lesson as explored (`lessonExplored`) the instant `readyRef` (the bottom CTA card) intersects with `threshold: 0.35`. On large desktop/iPad viewports, short lessons, or section deep-links (`#/lesson/number-bonds-to-ten?s=try`), the bottom CTA intersects immediately on load without reading or interacting with the lesson.

### 1.5 Profile flow state leaks (Step 1 premature login, Step 3 verification dead-end)
- **What was missed:** Even though profile persistence is deferred from Milestone 1, neither reviewer noted the two state machine traps in [`Profile.jsx`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/pages/Profile.jsx#L57-L116):
  - `submitStep1` dispatches `createProfile` and signs the learner in *before* Step 2 (saving/downloading the learner ID and checking the confirmation checkbox). Leaving Step 2 strands the learner in an active profile whose recovery ID was never saved.
  - In `EmailSetup` (`stage === 'verify'`), there is no "Change email" or "Skip / Continue without email" button if the user mistypes their email address.

### 1.6 Additional accessibility, localization, and parser edge cases
- **Untranslated legend:** `claude-fable` caught hardcoded Norwegian `'pluss'` in [`Counters.jsx:61`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/components/Counters.jsx#L61), but missed hardcoded English `aria-label="Legend"` in [`TenFrame.jsx:19`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/components/TenFrame.jsx#L19).
- **iPad keyboard mode on linear equations:** `claude-fable` noted that `inputMode="numeric"` lacks `-` and `,` for future negative/decimal tasks, but missed that [`ExerciseShell.jsx:91`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/pages/ExerciseShell.jsx#L91) currently sets `inputMode={kind === 'linear' ? 'text' : 'numeric'}`, forcing a full alphabetical keyboard on iPad Safari when the answer to `x + 3 = 7` is the integer `4`.
- **`MathExpr` silent token dropping:** [`MathExpr.jsx`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/components/MathExpr.jsx#L3) uses `expr.match(TOKEN)` without checking whether the matched tokens reconstruct `expr`, silently deleting unsupported characters (such as `/`, `<`, `>`, or Unicode superscripts) and providing no `spoken` aria-label when invoked from [`Markdown.jsx`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/components/Markdown.jsx#L15).
- **`parseAnswer` ambiguity:** [`domain/math.js`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/domain/math.js#L5-L21) unconditionally converts `,` to `.` after stripping spaces, parsing English `1,000` as `1`, rejecting `+8`, and rejecting `4 = x`.

---

## 2. Conclusions Independently Reached

In [independent-analysis.md](file:///d:/repos/MathKX/docs/reviews/round-02/gemini-argon/independent-analysis.md), we reached the following conclusions independently before reading Round 1:

1. **The pedagogical concept and calm Nordic visual direction are strong and well-aligned with learner needs:** The four-step loop (*See it → Try it → Practise → Check*) and honest separation of exploration, helped practice, independent practice, and self-checks solve a genuine learner problem without gamified anxiety.
2. **A two-tier readiness split is essential:** MathKX is **ready with conditions** to start its first internal engineering milestone, and **not ready** for a public learner release until real persistence, cross-device profile recovery, and accessibility/device verification exist.
3. **The runtime exercise generator and validator belong in the `.NET`/C# backend (`src/`), not duplicated in TypeScript:** `SplitMix64` (`SeededRandom`) has exact, verified test vectors in [seed-and-random-source.md](file:///d:/repos/MathKX/docs/architecture/proposals/seed-and-random-source.md) and maps cleanly to C# `ulong` arithmetic (`ADR 0003`).
4. **The prototype's `src/content/catalog.js` and `src/domain/activity.js` are the two largest gaps between vision and implementation:** Static 3-question arrays break "More practice", and naive boolean attempt logging erases the distinction between independent mastery, post-feedback retries, and helped practice.
5. **Exercise Schema v1 (`schemas/exercise.schema.json`) should not be frozen before the first runtime slice:** The schema's open `parameters`, `generator`, and `validation` objects are appropriate as an envelope while concrete generator/validator pairs prove the runtime contract.

---

## 3. Disagreements and Challenges to Round 1 Recommendations

We do not treat agreement between earlier reviewers as proof of correctness. Below are specific recommendations in `claude-fable` and `codex` that we challenge with concrete mathematical or code evidence:

### 3.1 Challenge to `revised-build-brief.md` (§3 & §4): Including `missing-part-to-ten@1` (`numbers.number-bonds.missing-part`) in Milestone 1
- **What Round 1 proposed:** After `codex` ([R1](file:///d:/repos/MathKX/docs/reviews/round-01/codex/readiness.md#L15-L27)) rightly pointed out that `numbers.addition.within-20` (`a + b <= 20`) allows `19 + 1` and breaks [`MakeTen`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/components/Counters.jsx#L47) (`need = 10 - a = -9`), `claude-fable` revised Milestone 1 in [`revised-build-brief.md`](file:///d:/repos/MathKX/docs/reviews/round-01/claude-fable/revised-build-brief.md#L40-L120) to keep four definitions and add a **second** generator, `missing-part-to-ten@1` (`a + ? = 10`), alongside `numbers.addition.within-20`.
- **Why we disagree (two independent reasons):**
  1. **Combinatorial exhaustion on repeat-avoidance window (`W = 8`):** `revised-build-brief.md` (§4, lines 82–90) specifies `missing-part-to-ten@1` with `minSum: 10, maxSum: 10, minKnownPart: 1, maxKnownPart: 9`, and specifies a repeat-avoidance rule (lines 110–115): *"Retry sampling up to 8 times if the unordered pair `{a, b}` appears in the caller-supplied `recentPairs` window (up to the last 8 generated instances)"*. For $a + b = 10$ with $a, b \in \{1..9\}$, there are **only 5 unordered pairs** in the entire mathematical universe: $\{1,9\}, \{2,8\}, \{3,7\}, \{4,6\}, \{5,5\}$! Even if $0$ and $10$ are included, there are only **6 unordered pairs**. Comparing unordered pairs `{a, b}` against a window of 8 recent instances guarantees that after the 5th question, **every single candidate in the universe is rejected across all 8 retries**, forcing degraded fallback behavior on every subsequent question.
  2. **Missing visual help model and misconception codes in the prototype:** The prototype's [`Kinds.addition`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/domain/math.js#L51-L97), [`GroupsHelp`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/components/Counters.jsx#L8-L35), and [`MakeTen`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/components/Counters.jsx#L44-L82) only render `a + b = ?` (combining two known addends). They have **no visual help view** for finding a missing part ($a + \square = 10$) and **no misconception detector** for when a learner adds $a + 10$ instead of finding $10 - a$. Furthermore, keeping `numbers.addition.within-20` in Milestone 1 still leaves `19 + 1` in the repo without a double-ten-frame visual model.
- **Better resolution:** Restrict Milestone 1 to **one** generator (`addition-pair@1`) and **two** exercise definitions whose visual models already exist and work:
  1. `numbers.addition.within-10` ($1 \le a, b \le 9,\; a + b \le 10$, 25 unordered / 45 ordered pairs, using `GroupsHelp` + single `TenFrame`).
  2. `numbers.addition.crossing-ten` ($2 \le a, b \le 9,\; 11 \le a + b \le 18$, 20 unordered / 36 ordered pairs, using `MakeTen` double `TenFrame`).
  And compare **ordered pairs `(a, b)`** (because in `MakeTen`, $8 + 5$ starts with 8 in the first frame and moves 2, whereas $5 + 8$ starts with 5 and moves 5), capping the repeat-avoidance window at `min(8, Math.floor(poolSize / 2))`.

### 3.2 Challenge to `revised-build-brief.md` (§6): Single mutable `Observation` record per instance and outcome mapping table
- **What Round 1 proposed:** [`revised-build-brief.md`](file:///d:/repos/MathKX/docs/reviews/round-01/claude-fable/revised-build-brief.md#L124-L163) models an `Observation` with mutable `submissions: SubmissionRecord[]` and `supportEvents: SupportEvent[]`, and maps instance status via a priority table (lines 149–157).
- **Why we disagree:**
  1. **Still conflates `partially-correct` with `review-needed`:** Line 156 maps `"Only review-needed or partially-correct -> Could not be checked automatically"`. Telling a learner who gave a *partially correct* answer that their answer *"could not be checked automatically"* is factually false—it *was* checked automatically and found partially correct! This also contradicts [mastery.md](file:///d:/repos/MathKX/docs/learning/mastery.md#L33).
  2. **Counts `invalid-response` as a mathematical submission:** Line 154 says `"First submission was incorrect, later submission correct, no help-* -> Right after feedback"`. What if the first submission was `invalid-response` (e.g., an accidental Enter key press or typo) and the second submission was `correct`? The table leaves that case undefined or treats it as a mathematical retry. [mastery.md](file:///d:/repos/MathKX/docs/learning/mastery.md#L32) explicitly requires that `invalid-response` not be counted as a mathematical error or retry.
  3. **Ignores timestamp ordering of `supportEvents` vs. `submissions`:** Line 153 says `"Any correct and any help-* support -> Right with visual help"`. If a learner submits a `correct` answer at $t = 10\text{s}$ and clicks "Show visual explanation" at $t = 15\text{s}$ (`post-answer` timing), `any help-* support` misclassifies the independent solve as `"Right with visual help"`, violating [exercise-experience.md](file:///d:/repos/MathKX/docs/design/exercise-experience.md#L79).

### 3.3 Challenge to `FABLE-R01-009` (`claude-fable/recommendations.md`): Promoting localStorage / IndexedDB schemas to an accepted ADR now
- **What Round 1 proposed:** `FABLE-R01-009` recommended creating ADR 0008 for a browser-local progress schema before backend storage exists.
- **Why we disagree:** We agree with `codex` ([C09](file:///d:/repos/MathKX/docs/reviews/round-01/codex/challenge.md#L211-L222)) and [AGENTS.md](file:///d:/repos/MathKX/AGENTS.md#L36) (*"Record durable architectural choices as concise ADRs in `docs/architecture/decisions/`; do not use ADRs for tentative ideas"*). A temporary browser `localStorage` envelope for Milestone 1 is an implementation detail, not a durable architectural decision.

---

## 4. Findings Already Resolved by Current Documentation

Between Round 1 and commit `7fe5b26c92e7eb4e47bfc89c8bfa02f95d5f72d5`, the repository owner already updated authoritative documentation to resolve several conceptual gaps raised in Round 1:

1. **Pre-mastery observation and progress semantics (`docs/learning/mastery.md`):**
   - [mastery.md](file:///d:/repos/MathKX/docs/learning/mastery.md#L13-L46) now contains the section *"Progress tracking before a mastery algorithm"*, which normatively defines:
     - Recording exercise definition ID/version, seed, delivery/session reference, and submission IDs.
     - Recording teaching support used and its ordering relative to learner responses.
     - Distinguishing first-attempt independent success, retry after mathematical feedback, success with hint/visual help, unresolved attempts, `partially-correct`, `review-needed` (without implying a live teacher queue), and `invalid-response` (input guidance rather than mathematical error).
     - Preserving provenance (`guest-local-import`) when importing untrusted browser history.
2. **Bounded visual explanations and post-answer inspection timing (`docs/design/exercise-experience.md`):**
   - [exercise-experience.md](file:///d:/repos/MathKX/docs/design/exercise-experience.md#L61-L88) now contains the section *"Explaining why the result follows"*, which normatively defines:
     - Explaining the mathematical reason (`8 + 5 = 10 + 3 = 13`), not just showing the final value.
     - Explicitly warning against unbounded visuals such as `19 + 1` in a single-ten-frame make-ten model (line 77).
     - Requiring pre-answer vs. post-answer timing so post-answer explanation viewing never retroactively marks an answer as helped (line 79).

> [!IMPORTANT]
> Because `docs/learning/mastery.md` and `docs/design/exercise-experience.md` are **already updated** at commit `7fe5b26c92e7eb4e47bfc89c8bfa02f95d5f72d5`, no further documentation debate is needed on these two topics—the remaining work is strictly to align the implementation and build brief with these authoritative documents.

---

## 5. Remaining Implementation Blockers vs. Development-Time Issues

### Genuine Blockers Before Starting Milestone 1 Code
There are **no architectural blockers** preventing the start of Milestone 1, provided the scope and specification bugs in the Milestone 1 build brief are corrected:
1. **Owner confirmation of the 3 concrete Milestone 1 scope choices** (backend hosting pattern for the dev slice, scope of the 2 arithmetic exercise definitions, and keeping profile/self-check flows hidden or clearly labeled in the dev build).
2. **Fixing the specification bugs in the Milestone 1 brief** (`GEMINI-R02-001` through `GEMINI-R02-004` below) so developers do not implement the broken `within-20`/`missing-part` visual states or the broken `Observation` outcome table from Round 1.

### Issues That Can Be Handled During Development (Not Blockers to Starting)
- Fixing the post-answer explanation reachability (`revealFinal={work.solved}`) and pre/post-answer help timing in `ExerciseShell.jsx` (`GEMINI-R02-003`).
- Fixing the `IntersectionObserver` premature `lessonExplored` trigger in `Lesson.jsx` (`GEMINI-R02-006`).
- Fixing hardcoded locale strings (`TenFrame.jsx` `'Legend'`, `Counters.jsx` `'pluss'`), iPad `inputMode="numeric"` on integer linear equations, and `MathExpr` fallback (`GEMINI-R02-007`).
- Cleaning up the minor path-formatting and unknown-schema checks in `tools/validate-content.mjs` (`GEMINI-R02-008`).

### Blockers Before Public Learner Release (Defer from Milestone 1)
- Real server-side learner profile persistence, optional recovery email verification, and untrusted guest import (`ADR 0006` + `GEMINI-R02-009`).
- Dedicated self-check / mixed-check generator and multi-skill evidence attribution (`GEMINI-R02-010`).

---

## 6. Actionable Recommendations (`GEMINI-R02-001` .. `GEMINI-R02-010`)

### `GEMINI-R02-001` — Scope Milestone 1 to `addition-pair@1` with `within-10` and `crossing-ten` (exclude `within-20` and `missing-part-to-ten@1`)
- **Evidence:**
  - [`Prototype/mathkx-designsystemet/src/components/Counters.jsx`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/components/Counters.jsx#L8-L82) implements only two addition visual help models: `GroupsHelp` (for sums $\le 10$ in a single `TenFrame`) and `MakeTen` (for crossing 10 where $1 \le a \le 9$, $need = 10 - a > 0$, and $a + b \le 20$).
  - [`docs/design/exercise-experience.md`](file:///d:/repos/MathKX/docs/design/exercise-experience.md#L77) explicitly notes that a single-ten-frame make-ten model cannot represent `19 + 1`.
  - [`claude-fable/revised-build-brief.md`](file:///d:/repos/MathKX/docs/reviews/round-01/claude-fable/revised-build-brief.md#L82-L115) proposed adding `missing-part-to-ten@1` ($a + ? = 10$, $a \in \{1..9\}$) with an 8-item unordered-pair repeat-avoidance window, even though only **5 unordered pairs** exist in $\{1..9\}$ summing to 10 and the prototype has no visual help or misconception feedback for missing-addend items.
- **Impact:** Prevents shipping broken visual explanations (`need <= 0`), unimplemented missing-addend visual states, and guaranteed repeat-avoidance exhaustion in Milestone 1.
- **Proposed correction:**
  1. Author **two** generated exercise definitions in `content/exercises/` for Milestone 1 using a single generator `addition-pair@1` and validator `numeric-equality@1`:
     - `numbers.addition.within-10` (`minOperand: 1, maxOperand: 9, minSum: 2, maxSum: 10`, 45 ordered pairs, paired with `GroupsHelp`).
     - `numbers.addition.crossing-ten` (`minOperand: 2, maxOperand: 9, minSum: 11, maxSum: 18`, 36 ordered pairs, paired with `MakeTen`).
  2. Compare **ordered** pairs `(a, b)` for repeat avoidance and bound the window size to `min(requestedWindow, Math.floor(candidatePoolSize / 2))`.
  3. Defer `numbers.number-bonds.missing-part` (`a + ? = 10`) and `numbers.addition.within-20` until dedicated missing-part visual help (a 10-frame showing $a$ filled slots and $10 - a$ highlighted empty slots) and double-ten-frame `within-20` visuals are implemented.
- **Tradeoffs:** Milestone 1 covers 2 generated arithmetic exercise definitions instead of 4, which slightly narrows the initial content footprint in exchange for 100% visual-explanation fidelity and zero throwaway generator hacks.
- **Acceptance criteria:**
  - Every generated instance of `numbers.addition.within-10` satisfies $1 \le a, b \le 9$ and $2 \le a + b \le 10$.
  - Every generated instance of `numbers.addition.crossing-ten` satisfies $2 \le a, b \le 9$ and $11 \le a + b \le 18$ (so `need = 10 - a` is always in $1..8$ and `rem = b - need` is always in $1..8$).
  - Repeat avoidance never exceeds half the candidate pool size and never deadlocks.

---

### `GEMINI-R02-002` — Enforce [mastery.md](file:///d:/repos/MathKX/docs/learning/mastery.md) observation rules: timestamp-ordered support, separate `partially-correct` / `review-needed` / `invalid-response`, and non-punitive topic rollup
- **Evidence:**
  - [`Prototype/mathkx-designsystemet/src/domain/activity.js`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/domain/activity.js#L15-L17) permanently locks a topic to `'practicedHelp'` if *any* correct attempt ever used help (`if (correct.some((a) => a.help?.length)) return 'practicedHelp'`).
  - [`claude-fable/revised-build-brief.md`](file:///d:/repos/MathKX/docs/reviews/round-01/claude-fable/revised-build-brief.md#L149-L157) conflates `partially-correct` with `review-needed`, counts `invalid-response` as a prior submission, and ignores whether `help-*` occurred before or after the correct submission.
- **Impact:** Aligns runtime progress tracking with [mastery.md](file:///d:/repos/MathKX/docs/learning/mastery.md#L13-L46), [exercise-experience.md](file:///d:/repos/MathKX/docs/design/exercise-experience.md#L79), and [product-principles.md](file:///d:/repos/MathKX/docs/product-principles.md#L13).
- **Proposed correction:**
  1. Partition submissions into `validMathematicalSubmissions` (`outcome !== 'invalid-response'`) and `inputGuidanceEvents` (`outcome === 'invalid-response'`).
  2. Partition support events into `preSolveSupport` (`timestamp <= solvingSubmission.timestamp`, types `'hint' | 'visual-step'`) and `postSolveExplanation` (`timestamp > solvingSubmission.timestamp`, type `'explanation-view'`).
  3. Compute per-instance status from `validMathematicalSubmissions` and `preSolveSupport` only:
     - First valid submission is `correct` and `preSolveSupport.length === 0` $\rightarrow$ `solved-independent` (*"Right on first try"*).
     - Later valid submission is `correct` and `preSolveSupport.length === 0` $\rightarrow$ `solved-after-feedback` (*"Right after feedback"*).
     - Any valid submission is `correct` and `preSolveSupport.length > 0` $\rightarrow$ `solved-with-help` (*"Right with visual help"*).
     - Highest outcome is `partially-correct` $\rightarrow$ `partially-correct` (*"Partly right — keep going"*).
     - Highest outcome is `review-needed` $\rightarrow$ `unverified` (*"Saved — automatic check unavailable"*).
     - Only `incorrect` valid submissions $\rightarrow$ `needs-more-practice` (*"Tried — needs more practice"*).
     - Only `invalid-response` or no submissions $\rightarrow$ `not-evaluated` (does not alter topic status).
  4. Compute topic status so that a learner who achieves threshold independent solves (`solved-independent` or `solved-after-feedback` on recent instances) advances from `"Practised with visual help"` to `"Practised"`.
- **Tradeoffs:** Adds ~25 lines of pure domain logic and unit tests in the observation reducer.
- **Acceptance criteria:**
  - Unit tests verify all 7 instance outcomes above.
  - Unit test verifies that submitting `""` or `"abc"` (`invalid-response`) followed by `"13"` (`correct`) yields `solved-independent` (*"Right on first try"*).
  - Unit test verifies that solving `"13"` (`correct`) at $t=10$ and opening the visual explanation at $t=20$ yields `solved-independent`, not `solved-with-help`.
  - Unit test verifies that a learner who uses visual help on instance 1 and then solves instances 2, 3, and 4 independently reaches topic status `"Practised"`, not `"Practised with visual help"`.

---

### `GEMINI-R02-003` — Enable post-answer worked visual explanations (`revealFinal={work.solved}`) in `ExerciseShell`
- **Evidence:**
  - [`Prototype/mathkx-designsystemet/src/pages/ExerciseShell.jsx`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/pages/ExerciseShell.jsx#L58-L64) passes `revealFinal={false}` to `<MakeTen>` and `<Balance>`, making step `3` (`8 + 5 = 10 + 3 = 13` in [`Counters.jsx:78-79`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/components/Counters.jsx#L78-L79) and `x = 4, because 4 + 3 = 7` in [`Balance.jsx:77-79`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/components/Balance.jsx#L77-L79)) unreachable in practice mode.
  - [`ExerciseShell.jsx:30`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/pages/ExerciseShell.jsx#L30) records `'visual'` in `helpUsed` even when `work.solved === true`.
- **Impact:** Fulfills [exercise-experience.md](file:///d:/repos/MathKX/docs/design/exercise-experience.md#L61-L88) (*"Explaining why the result follows"*).
- **Proposed correction:**
  - Pass `revealFinal={work.solved}` to `<MakeTen>` and `<Balance>` in `ExerciseShell.jsx` (and add the final summary equation to `<GroupsHelp>` when `revealFinal` is true).
  - When `work.solved` is `true`, offer a `"See why"` / `"Se hvorfor"` action in the green feedback banner that opens the visual model directly to the final step (`step = 3`) and logs a post-answer `explanation-view` event rather than pre-answer `helpUsed`.
- **Tradeoffs:** None; uses visual steps that are already written and translated in `Counters.jsx` and `Balance.jsx`.
- **Acceptance criteria:**
  - Before solving `8 + 5 = ?`, the `MakeTen` stepper allows steps `1..2` (up to `10 + 3 = ?` without giving away `13`).
  - After solving `8 + 5 = 13`, the learner can view step `3` (`8 + 5 = 10 + 3 = 13`) and step through `1..3` without altering the solved attempt's help classification.

---

### `GEMINI-R02-004` — Canonicalize lesson front-matter `id` and validate bilingual structural parity in `tools/validate-content.mjs`
- **Evidence:**
  - [`number-bonds-to-ten.nb.md`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/content/lessons/number-bonds-to-ten.nb.md#L2) and [`number-bonds-to-ten.en.md`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/content/lessons/number-bonds-to-ten.en.md#L2) use `id: arithmetic.number-bonds-to-ten`, whereas [`crossing-ten-addition.nb.md`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/content/lessons/crossing-ten-addition.nb.md#L2) uses `id: crossing-ten-addition` and [`catalog.js`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/content/catalog.js#L50) uses `number-bonds-to-ten`.
- **Impact:** Prevents broken route links, mismatched issue-report IDs, and diverged `nb`/`en` lesson metadata when moving lessons into `content/lessons/`.
- **Proposed correction:**
  1. Standardize lesson `id` values to match their canonical directory name (`number-bonds-to-ten`, `crossing-ten-addition`, `linear-equations-balance`) across both `.nb.md` and `.en.md`.
  2. When extending `tools/validate-content.mjs` for `content/lessons/<lesson-id>/{nb,en}.md`, validate that:
     - Both `nb.md` and `en.md` exist for every `<lesson-id>` directory.
     - `meta.id === <lesson-id>` in both files.
     - `meta.skills`, `meta.related`, `meta.practice`, and `meta.check` are identical between `nb.md` and `en.md`.
     - Every ID in `meta.skills` and `meta.related` resolves to a valid skill in `content/skills/`.
     - Every ID in `meta.practice` resolves to a valid exercise definition in `content/exercises/`.
     - Both `nb.md` and `en.md` declare the exact same ordered list of `## Heading {#anchor}` section IDs (`see`, `try`, `practice`, `check`) and identical `:::visual[kind]` blocks.
- **Tradeoffs:** Strict parity validation requires translators to preserve section anchors and visual directives, which is desirable and matches [localization-and-curriculum.md](file:///d:/repos/MathKX/docs/architecture/localization-and-curriculum.md).
- **Acceptance criteria:**
  - `npm run validate` fails if `nb.md` and `en.md` disagree on `id`, `skills`, `related`, `practice`, section `{#anchor}` IDs, or `:::visual[...]` directives.
  - Automated tests in `tools/validate-content.test.mjs` cover each failure mode.

---

### `GEMINI-R02-005` — Implement `SeededRandom` (`SplitMix64`) in C# with the proposal's exact test vectors before building generators
- **Evidence:**
  - [docs/architecture/proposals/seed-and-random-source.md](file:///d:/repos/MathKX/docs/architecture/proposals/seed-and-random-source.md#L73-L120) defines `SplitMix64` and `nextBelow(bound)` with exact test vectors for seeds `0` and `123456789` (which we independently verified in Phase 1).
  - [ADR 0003](file:///d:/repos/MathKX/docs/architecture/decisions/0003-technology-direction.md) and [ADR 0007](file:///d:/repos/MathKX/docs/architecture/decisions/0007-deterministic-exercise-generation.md) require deterministic, reproducible generation in domain code.
- **Impact:** Establishes the mathematical reproducibility foundation (`(exerciseId, version, seed) -> instance`) with zero platform-specific floating-point drift.
- **Proposed correction:**
  - Implement `SeededRandom` in the `.NET` domain project (`src/MathKX.Domain/Generation/SeededRandom.cs`) using unsigned 64-bit integer arithmetic (`ulong`) inside an `unchecked` block.
  - Lock the exact test vectors from `seed-and-random-source.md` (first five `NextUInt64()` values for seeds `0` and `123456789`, and first ten `NextInt(0, 10)` values for seed `123456789`: `6, 0, 4, 7, 1, 9, 4, 9, 3, 2`) into xUnit tests.
  - Promote `docs/architecture/proposals/seed-and-random-source.md` to an accepted ADR once the owner approves.
- **Tradeoffs:** Requires `.NET` SDK in the development and CI environment for backend tests.
- **Acceptance criteria:**
  - `dotnet test` passes the `SeededRandom` vector suite and determinism tests (`same (exerciseId, version, seed) -> byte-identical canonical JSON instance`).

---

### `GEMINI-R02-006` — Require meaningful lesson interaction or section progression before recording `lessonExplored`
- **Evidence:**
  - [`Prototype/mathkx-designsystemet/src/pages/Lesson.jsx`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/pages/Lesson.jsx#L55-L61) fires `lessonExplored` as soon as `readyRef` (the bottom CTA card) reaches 35% visibility in `IntersectionObserver`. On large screens or deep-linked URLs (`?s=try`), this triggers on initial mount.
- **Impact:** Prevents topics from falsely showing `"Explored"` when a learner merely opens a deep link or views the page on a tall screen.
- **Proposed correction:**
  - Record `lessonExplored` only when **both** (a) the learner has scrolled through or viewed the primary explanation sections (`#see` and `#try`) **or** interacted with the embedded visual explorer (`explorerMoved` / `visualStepAdvanced`), **and** (b) the learner reaches the `#practice` section or clicks `"Start practice"`.
- **Tradeoffs:** Slightly more state tracking in `Lesson.jsx` (~15 lines).
- **Acceptance criteria:**
  - Opening `#/lesson/number-bonds-to-ten?s=try` on a 1080p or iPad Pro viewport without interacting does not immediately mark the topic `"Explored"`.

---

### `GEMINI-R02-007` — Fix prototype localization leaks, iPad numeric keyboard mode, and `MathExpr` accessibility fallback
- **Evidence:**
  - [`TenFrame.jsx:19`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/components/TenFrame.jsx#L19): hardcoded `aria-label="Legend"` in Norwegian mode.
  - [`Counters.jsx:61`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/components/Counters.jsx#L61): hardcoded `'pluss'` in English mode.
  - [`ExerciseShell.jsx:91`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/pages/ExerciseShell.jsx#L91): `inputMode={kind === 'linear' ? 'text' : 'numeric'}` opens the alphabetical keyboard on iPad for integer answers (`x = 4`).
  - [`MathExpr.jsx:3`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/components/MathExpr.jsx#L3) and [`Markdown.jsx:15`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/components/Markdown.jsx#L15): `MathExpr` drops unmatched tokens silently and lacks an accessible `aria-label` when rendered inline from markdown.
- **Impact:** Directly improves Norwegian/English completeness, iPad ergonomics, and screen-reader fidelity (`ADR 0004`).
- **Proposed correction:**
  - Localize `TenFrame.jsx` legend label (`locale === 'nb' ? 'Tegnforklaring' : 'Legend'`) and `Counters.jsx` operator speech (`locale === 'nb' ? 'pluss' : 'plus'`).
  - Derive `inputMode` from the exercise's expected answer format (`numeric` for non-negative integer answers, `decimal` when decimals are expected, `text` only when algebraic/signed input is required on iOS).
  - In `MathExpr.jsx`, fall back to rendering any unrecognized substring verbatim rather than dropping it, and synthesize a localized spoken `aria-label` (`+` $\rightarrow$ `pluss`/`plus`, `-`/`−` $\rightarrow$ `minus`, `=` $\rightarrow$ `er lik`/`equals`, `?`/`□` $\rightarrow$ `ukjent`/`unknown`) whenever `spoken` is not explicitly passed.
- **Tradeoffs:** Minimal (~30 lines across 4 components).
- **Acceptance criteria:**
  - No English strings appear in `aria-label` attributes when `locale === 'nb'`, and no Norwegian strings appear when `locale === 'en'`.
  - Every `<MathExpr>` rendered inside lesson markdown has a localized `aria-label`.

---

### `GEMINI-R02-008` — Harden `tools/validate-content.mjs` path reporting and unknown-schema rejection
- **Evidence:**
  - [`tools/validate-content.mjs:124`](file:///d:/repos/MathKX/tools/validate-content.mjs#L124) outputs `skills.get(data.id).file` (raw absolute path) instead of `path.relative(repoRoot, ...)` on duplicate skill ID errors.
  - [`tools/validate-content.mjs:139`](file:///d:/repos/MathKX/tools/validate-content.mjs#L139) only runs `validateSkillSemantics` or `validateExerciseSemantics` if `path.basename(schemaPath)` matches `skill.schema.json` or `exercise.schema.json`, silently skipping semantic checks if another file in `schemas/` is referenced.
- **Impact:** Keeps contributor error messages clean and prevents silent semantic validation bypasses.
- **Proposed correction:**
  - Format `skills.get(data.id).file` and `exercises.get(data.id).file` with `relativePath(...)`.
  - Add an `else` branch in `validateContent` that adds an error when `path.basename(schemaPath)` is not in the known set of supported schemas (`skill.schema.json`, `exercise.schema.json`, and any newly added `lesson.schema.json`).
- **Tradeoffs:** None (~10 lines).
- **Acceptance criteria:**
  - `npm test` includes a test asserting that an unknown schema filename inside `schemas/` is rejected and that duplicate skill errors print repo-relative paths.

---

### `GEMINI-R02-009` — Fix profile creation Step 1/Step 2 commit ordering and Step 3 email escape hatch when implementing `ADR 0006`
- **Evidence:**
  - [`Prototype/mathkx-designsystemet/src/pages/Profile.jsx`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/pages/Profile.jsx#L57-L116): `submitStep1` calls `createProfile` before the learner views or confirms saving their recovery ID in Step 2; `EmailSetup` (`stage === 'verify'`) provides no way to edit a mistyped email or skip back to anonymous mode.
- **Impact:** Prevents learners from getting locked into an unrecoverable anonymous profile or stuck on an unverified email screen.
- **Proposed correction:**
  - In Milestone 1 (dev slice), hide or clearly badge the simulated profile UI so developers/testers do not mistake it for real cross-device sync.
  - When implementing `ADR 0006` in the profile milestone, generate the candidate profile/recovery ID in Step 1, hold it in pending state during Step 2, and only commit the active session once the learner checks *"I have saved my learner ID"* (or downloads the recovery card). Add `"Edit email"` and `"Continue without email"` actions to the email verification stage.
- **Tradeoffs:** None.
- **Acceptance criteria:**
  - Navigating away during Step 2 does not leave an active profile session with an unsaved recovery ID.
  - From the email verification code screen, the learner can always edit the email address or continue without email.

---

### `GEMINI-R02-010` — Defer self-check (`#/check/:id`) to a dedicated milestone with multi-skill evidence attribution
- **Evidence:**
  - [`Prototype/mathkx-designsystemet/src/pages/ExerciseShell.jsx`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/pages/ExerciseShell.jsx#L10-L11) reuses `topic.practice` in reverse order for `mode === 'check'`, and [`activity.js`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/domain/activity.js#L13) attributes check success only to the single topic rather than recording per-skill evidence across prerequisite and target skills.
- **Impact:** Prevents fake self-checks from distorting learner progress or expanding Milestone 1 scope.
- **Proposed correction:**
  - Disable the `"Take the short check"` route in Milestone 1 (showing a calm *"Self-check coming soon — keep practising with fresh questions"* note), and implement self-checks in a dedicated follow-up slice once mixed-skill item selection and per-skill check evidence are specified.
- **Tradeoffs:** Self-checks are not interactive in Milestone 1, keeping Milestone 1 focused on deterministic practice generation and validation.
- **Acceptance criteria:**
  - Milestone 1 does not reuse reversed practice arrays as a fake self-check.
