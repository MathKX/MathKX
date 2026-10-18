# MathKX Learner Prototype Review — Round 03 (Iteration 2)

- **Date:** 2026-10-18
- **Reviewer / Model identity:** Gemini 4 Argon (Medium) (`gemini-argon`)
- **Repository HEAD SHA:** `a6a3abae64d09250af47cf663392dda1838f227f`
- **Branch:** `main`
- **Working-tree status at start of review:** Clean (`git status --short` empty prior to `docs/reviews/round-03/` outputs)
- **Target under review:** [`Prototype/mathkx-designsystemet`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet) (Iteration 2)

---

## 1. Executive Judgement

Iteration 2 of `Prototype/mathkx-designsystemet` resolves the major structural objections from Round 02. It establishes a calm, readable Designsystemet visual baseline ([ADR 0007](file:///d:/repos/MathKX/docs/architecture/decisions/0007-use-designsystemet-and-tailwind.md)), separates teaching help from full solution explanations in the UI, implements an explicit self-check policy and one-way switch to supported practice, replaces percentages/mastery bars with descriptive outcome counts ([`docs/learning/mastery.md`](file:///d:/repos/MathKX/docs/learning/mastery.md)), and demonstrates non-elementary notation and graph interaction via the derivative preview.

**Is the design ready to guide production development?**
**Yes, with targeted fixes to state transitions and observation derivation.** Most of the prototype's visual and interaction architecture is sound and matches repository requirements, **except** for two high-severity state bugs and several medium-severity observation/representation mismatches that must not be copied into production domain code:

1. **Critical / Blocker (`P0`):** Starting or completing any self-check (`#/check/add-within-20` or `#/check/one-step-addition`) crashes `#/home` ("Min læring / My learning") and `#/progress/<skillId>` with an uncaught `TypeError: Cannot read properties of undefined (reading 'title')` because `sessionsFor()` in [`src/domain/observations.js`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/domain/observations.js#L61-L77) includes `mode: 'check'` sessions with `variant: 'check'`, which `SuggestionCard` in [`src/pages/Home.jsx`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/pages/Home.jsx#L45-L51) looks up in `variants['check']` (`undefined`).
2. **High (`P1`):** In [`src/components/ExerciseShell.jsx`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/components/ExerciseShell.jsx#L32-L50), `answered` is defined as `summary.responses.length > 0` (any non-invalid response, including an **incorrect** attempt) rather than `solved`. If a learner submits a wrong answer and then clicks **"Forklar løsningen / Explain the solution"**, the answer-reveal confirmation is skipped, `'explanation'` is logged instead of `'answer-reveal'`, and when the learner subsequently submits the revealed answer, [`summarizeDelivery()`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/domain/observations.js#L27-L56) produces both `outcome: 'correctAfterExplanation'` ("Svart etter forklaring") **and** `explanationAfter: true` ("Forklaring åpnet etter svar") simultaneously.

---

## 2. Verification Scope and Evidence Trail

### 2.1 Documents Read
- **Foundation & principles:** [`AGENTS.md`](file:///d:/repos/MathKX/AGENTS.md), [`content/AGENTS.md`](file:///d:/repos/MathKX/content/AGENTS.md), [`docs/vision.md`](file:///d:/repos/MathKX/docs/vision.md), [`docs/product-principles.md`](file:///d:/repos/MathKX/docs/product-principles.md)
- **Design & learning requirements:** [`docs/design/design-principles.md`](file:///d:/repos/MathKX/docs/design/design-principles.md), [`docs/design/learning-experience.md`](file:///d:/repos/MathKX/docs/design/learning-experience.md), [`docs/design/exercise-experience.md`](file:///d:/repos/MathKX/docs/design/exercise-experience.md), [`docs/learning/learning-model.md`](file:///d:/repos/MathKX/docs/learning/learning-model.md), [`docs/learning/mastery.md`](file:///d:/repos/MathKX/docs/learning/mastery.md)
- **Architecture & ADRs:** [`docs/architecture/architecture.md`](file:///d:/repos/MathKX/docs/architecture/architecture.md), [`docs/architecture/exercise-capability-model.md`](file:///d:/repos/MathKX/docs/architecture/exercise-capability-model.md), [`docs/architecture/exercise-format.md`](file:///d:/repos/MathKX/docs/architecture/exercise-format.md), [`docs/architecture/proposals/lesson-markdown-and-delivery.md`](file:///d:/repos/MathKX/docs/architecture/proposals/lesson-markdown-and-delivery.md), [`0006-support-profiles-without-personal-details.md`](file:///d:/repos/MathKX/docs/architecture/decisions/0006-support-profiles-without-personal-details.md), [`0007-use-designsystemet-and-tailwind.md`](file:///d:/repos/MathKX/docs/architecture/decisions/0007-use-designsystemet-and-tailwind.md), [`0008-store-profiles-and-progress-in-postgresql.md`](file:///d:/repos/MathKX/docs/architecture/decisions/0008-store-profiles-and-progress-in-postgresql.md)
- **Prior review context:** [`docs/reviews/round-02/synthesis.md`](file:///d:/repos/MathKX/docs/reviews/round-02/synthesis.md)
- **Prototype docs & source:** [`HANDOFF.md`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/HANDOFF.md), [`docs/iteration-2/CHANGELOG.md`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/docs/iteration-2/CHANGELOG.md), [`docs/iteration-2/REQUIREMENTS-CHECKLIST.md`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/docs/iteration-2/REQUIREMENTS-CHECKLIST.md), [`docs/iteration-2/ASSUMPTIONS.md`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/docs/iteration-2/ASSUMPTIONS.md), [`docs/iteration-2/USABILITY-TEST-SCRIPT.md`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/docs/iteration-2/USABILITY-TEST-SCRIPT.md), [`tests/domain.test.mjs`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/tests/domain.test.mjs), and all files under [`src/`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src).

### 2.2 Commands Executed and Outcomes
| Location | Command | Outcome |
|---|---|---|
| Repository root (`d:\repos\MathKX`) | `npm run validate` | **Passed** — Validated 8 content files, 7 skills, 1 exercise definition |
| Repository root (`d:\repos\MathKX`) | `npm test` | **Passed** — 18/18 tests passed |
| `Prototype/mathkx-designsystemet` | `npm ci` | **Passed** — Installed 213 packages cleanly |
| `Prototype/mathkx-designsystemet` | `npm test` | **Passed** — 7/7 tests in `tests/domain.test.mjs` passed |
| `Prototype/mathkx-designsystemet` | `npm run build` | **Passed** — Built single-file bundle `dist/index.html` (910.30 kB / 238.08 kB gzip in 359 ms) |

### 2.3 Browser Automation & Accessibility Checks Executed
Using Playwright with headless Chromium (`C:\Program Files\Google\Chrome\Application\chrome.exe`) and `axe-core` against `Prototype/mathkx-designsystemet/dist/index.html`:
- **Viewport, language, and theme matrix:** Tested `390×844` (mobile), `820×1180` (iPad portrait emulation), and `1180×820` (iPad landscape emulation) across both **Norwegian Bokmål (`nb`)** and **English (`en`)**, and both **light** (`prefers-color-scheme: light`) and **dark** (`prefers-color-scheme: dark`) modes.
- **Routes walked and audited with `axe-core`:** `#/`, `#/library`, `#/domain/numbers-arithmetic`, `#/topic/addition-within-20`, `#/lesson/number-bonds-to-ten`, `#/lesson/equations-as-a-balance`, `#/practice/arithmetic.add-within-20?variant=within-5`, `?variant=within-10`, `?variant=across-10`, `#/practice/algebra.one-step-addition`, `#/check/add-within-20`, `#/preview/derivative`, `#/home`, `#/progress/arithmetic.add-within-20?sample=1`, `#/profile/new`, `#/signin`, `#/recovery`, `#/settings`, and `#/about`.
- **Interactive state walkthroughs verified in Chromium:**
  - Opening visual help vs. explanation before answering, after an incorrect answer, and after a correct answer.
  - Stepping through `GroupsHelp` counter-by-counter counting (`"Hjelp meg å telle"` → `"Tell neste brikke"`), ten-frame help (`8 + 5`), doubles help (`4 + 4`), and balance-scale help/explanation (`x + 3 = 7`).
  - Self-check pre-start policy, independent check submission, switching mid-check to supported practice (`"Jeg trenger hjelp"`), check summary rendering, and post-check navigation to `#/home`.
  - Challenge controls (`"Gjør det enklere"`, `"Øk utfordringen"`, `"Flere slike oppgaver"`, `"En oppgave til"`), exhausting the 4-item `within-5` pool to trigger the repeat notice, and finishing a session (`"Avslutt økten og fortsett senere"`).
  - Lesson detour (`"Les i leksjonen"` → `"Tilbake til oppgaven"`) preserving draft input and open visual help panel.
  - Derivative preview (`#/preview/derivative`) keyboard stepper, table view, and decimal inputs (`1,5` vs. `1,2`).
  - Profile creation (Steps 1–4), email verification code entry (`246810`) and 3-try lockout, changing a verified email in `#/settings`, and simulated on-screen keyboard (`"Simuler skjermtastatur"`) geometry at `390×844`, `820×1180`, and `1180×820`.

### 2.4 What Could Not Be Run and Why
- **Physical iPad / iPadOS Safari & real virtual keyboard (`visualViewport`):** Desktop Chromium viewport emulation (`820×1180`, `1180×820`) does not trigger iPadOS Safari's native on-screen keyboard, safe-area insets, or touch callouts. The prototype's simulated keyboard (`state.kbdSim`) was tested instead.
- **Screen-reader speech output (VoiceOver / NVDA):** Verified via DOM inspection (`aria-live`, `aria-hidden`, `.ds-sr-only`, `aria-expanded`, `aria-controls`, `<math>` markup) and `axe-core`, which is not a substitute for listening to VoiceOver on iPadOS or macOS.
- **Human learner usability testing:** Not conducted; [`docs/iteration-2/USABILITY-TEST-SCRIPT.md`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/docs/iteration-2/USABILITY-TEST-SCRIPT.md) is a test protocol only.

---

## 3. Detailed Evaluation by Area

### Area 1: Help versus Explanation

#### What works
- **Clear separation of controls and titles:** In [`ExerciseShell.jsx`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/components/ExerciseShell.jsx#L148-L157), **"Vis visuell hjelp / Show visual help"** (`panel === 'help'`) and **"Forklar løsningen / Explain the solution"** (`panel === 'explain'`) are separate buttons with distinct panel headings (*"Visuell hjelp – mens du prøver / Visual help – while you try"* vs. *"Forklaring – hele løsningen / Explanation – the full solution"*).
- **Explicit answer-reveal confirmation before any attempt:** Clicking **"Forklar løsningen"** before submitting any response opens an inline confirmation group ([`ExerciseShell.jsx`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/components/ExerciseShell.jsx#L164-L174)) that explicitly warns that the explanation shows the answer and will record the exercise as solved after seeing the explanation, while offering **"Prøv visuell hjelp først / Try visual help first"** as the secondary action.
- **Picture, equation, and text agreement across steps (`8 + 5`, `4 + 4`, `x + 3 = 7`):**
  - Verified in [`src/domain/explanations.js`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/domain/explanations.js#L13-L143) and [`src/components/math/Visuals.jsx`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/components/math/Visuals.jsx#L14-L185):
    - **`8 + 5` (`make-ten`):** Help step 1 shows `8` in the ten-frame and `5` outside (`8 + 5`); step 2 splits `5` into `2` and `3` (`8 + 2 + 3`); step 3 moves `2` into the ten-frame (`10 + 3 = ?`, withholding `13`). Explanation step 3 completes `10 + 3 = 13` and step 4 states `8 + 5 = 13`.
    - **`4 + 4` (`doubles`):** Help step 1 shows two rows of `4` (`4 + 4 = ?`); step 2 shows `3 + 3 = 6`, `4 + 4 = ?`, `5 + 5 = 10` (`?` in the middle row). Explanation step 2 reveals `4 + 4 = 8`.
    - **`x + 3 = 7` (`balance`):** Help step 1 shows `x` and `3` ones on the left pan and `7` ones on the right (`x + 3 = 7`); step 2 crosses out `3` ones on both sides (`x + 3 − 3 = 7 − 3`); step 3 shows `x` alone on the left and `4` unnumbered ones on the right (`x = ?`). Explanation step 3 numbers the `4` remaining units (`x = 4`) and step 4 substitutes `4` for `x` on the left pan (`4 + 3 = 7`) so both pans visually show `7` units.
- **Opening explanation after a *correct* first answer preserves outcome:** Verified in browser and [`observations.js`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/domain/observations.js#L36-L56): answering `8 + 5 = 13` on the first try and then clicking **"Forklar løsningen"** keeps `outcome === 'correctFirst'` and adds `explanationAfter: true` (*"Forklaring åpnet etter svar / Explanation opened after answering"*).

#### What fails or misleads
1. **[HIGH] Opening "Forklar løsningen" after an *incorrect* attempt skips the answer-reveal warning, logs `'explanation'` instead of `'answer-reveal'`, and creates contradictory outcome labels:**
   - **Evidence (verified in Playwright & source):** In [`ExerciseShell.jsx`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/components/ExerciseShell.jsx#L32-L50):
     ```js
     const answered = summary.responses.length > 0;
     ...
     if (!answered && !revealed) { setWork({ confirmExplain: true }); return; }
     setWork({ panel: 'explain', confirmExplain: false, explainStep: work.explainStep ?? 0 });
     support(answered ? 'explanation' : 'answer-reveal', { step: work.explainStep ?? 0 });
     ```
     Because `answered` is `true` as soon as the learner submits a wrong answer (e.g., `12` for `8 + 5`), clicking **"Forklar løsningen"** while the problem is still unsolved:
     - **Skips the confirmation prompt** (`!answered && !revealed` is `false`), immediately revealing the solution `13` while the input field is still editable.
     - **Logs `support('explanation')` instead of `support('answer-reveal')`** and sets the live workspace tag to `"Forklaring åpnet etter svar / Explanation opened after answering"`.
     - When the learner then enters `13` and clicks **"Sjekk svaret"**, [`summarizeDelivery()`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/domain/observations.js#L27-L56) computes `outcome = 'correctAfterExplanation'` (*"Svart etter forklaring"*) **and** `explanationAfter = true` (*"Forklaring åpnet etter svar"*) because `firstMathSeq` was the earlier wrong attempt (`seq` before `'explanation'`).
     - In `SessionSummary`, `Home`, and `ProgressPage`, that single exercise displays **both** tags side by side: `[Svart etter forklaring]` and `[Forklaring åpnet etter svar]`, and increments both `{n} besvart etter forklaring` and `{n} der forklaringen ble åpnet etter svaret`!
   - **Fix for production:** Gate the pre-solution confirmation and `'answer-reveal'` support event on `!solved` (whether a correct response has been recorded), and define `explanationAfter` in `summarizeDelivery()` relative to `correctSeq` (`e.seq > correctSeq`), not `firstMathSeq`.

2. **[MEDIUM] Opening "Vis visuell hjelp" after an *incorrect* attempt shows the misleading badge `"Visuell hjelp etter svar"` and drops the visual-help observation once solved:**
   - **Evidence (verified in Playwright & source):**
     - In [`ExerciseShell.jsx`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/components/ExerciseShell.jsx#L76-L79), `firstResp` is the first non-invalid response (including an incorrect one). When a learner submits a wrong answer first and then opens **"Vis visuell hjelp"** to figure it out, `!before(e)` is true, so the live tag above the problem says **"Visuell hjelp etter svar / Visual help after answering"** while they are still trying to answer.
     - When the learner subsequently submits the correct answer, [`summarizeDelivery()`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/domain/observations.js#L38-L46) checks `else if (incorrectBefore > 0) outcome = 'correctAfterFeedback'` before `correctWithVisualHelp`. Although line 46 computes `visualBeforeCorrect: usedTeachingBeforeCorrect`, **nothing in the UI ever reads `visualBeforeCorrect`**, so the session summary and progress pages record only `"Riktig etter tilbakemelding"`, hiding that visual help was used to reach the answer.

3. **[MEDIUM] `GroupsHelp` ("Hjelp meg å telle") explicitly reveals the total without treating it as an answer reveal or surfacing `countedAll`:**
   - **Requirement conflict:** [`docs/design/exercise-experience.md`](file:///d:/repos/MathKX/docs/design/exercise-experience.md#L57-L58) states:
     > *"Further guided help may highlight counters one at a time or demonstrate combining the groups. If a later step explicitly reveals the total, treat it as an answer reveal rather than an independent answer."*
   - **Evidence (verified in Playwright & source):** In [`src/components/math/Counters.jsx`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/components/math/Counters.jsx#L57-L81), clicking **"Hjelp meg å telle / Help me count"** and then **"Tell neste brikke / Count the next counter"** through the last counter numbers every counter `1..total` and prints **"Du har talt 4 brikker. / You have counted 4 counters."** It logs `support('counting-complete')`, which [`observations.js`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/domain/observations.js#L15-L42) classifies in `TEACHING` (`outcome: 'correctWithVisualHelp'`, not an answer reveal) and sets `countedAll: true`, which is never rendered anywhere in the UI. Additionally, [`ExerciseShell.jsx`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/components/ExerciseShell.jsx#L78-L79) checks `['visual', 'counting', 'help-steps']` and omits `'counting-complete'`.

---

### Area 2: Self-Checks

#### What works
- **Clear pre-start policy:** Before any question is shown (`#/check/add-within-20` or `#/check/one-step-addition`), [`CheckPage`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/pages/Practice.jsx#L254-L273) presents a concise policy card (*"Før du begynner / Before you start"*) stating the scope, question count (`5 oppgaver`), that answers are independent without visual help or immediate feedback, that accessibility tools (keyboard, screen reader, zoom) are not counted as help, and that the learner can explicitly switch to supported practice if needed.
- **Explicit one-way switch to supported practice:** During an independent check, clicking **"Jeg trenger hjelp / I need help"** opens an inline confirmation ([`Practice.jsx`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/pages/Practice.jsx#L305-L315)) explaining that answers already saved before question `{i}` remain independent while question `{i}` and the rest become supported practice. Confirming logs `{ type: 'check-switch', fromIndex: run.index }` and switches `ExerciseShell` to `mode="check-supported"`.
- **Honest separation in the check summary:** On completion, [`CheckPage`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/pages/Practice.jsx#L326-L368) separates items before `switchedAt` into three independent columns (*"Riktig på egen hånd"*, *"Verdt å se på igjen"*, *"Hoppet over"*) and places all items from `switchedAt` onward into a separate card titled **"Øving med hjelp (fra oppgave {i}) / Supported practice (from question {i})"** with the note that they are not part of the independent result.

#### What fails or misleads
1. **[CRITICAL / P0] Starting or completing a self-check crashes `#/home` and `#/progress/<skillId>`:**
   - **Evidence (verified in Playwright & source):**
     - In [`Practice.jsx`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/pages/Practice.jsx#L242), starting a check logs `{ type: 'session-start', session, skill: chk.skill, variant: 'check', mode: 'check' }`.
     - In [`src/domain/observations.js`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/domain/observations.js#L61-L77), `sessionsFor(events, skill)` filters only by `e.skill === skill` and does **not** exclude `mode === 'check'`. `suggestNext(events, skill)` therefore selects the self-check session as `latest` and returns a suggestion with `variant: 'check'` (e.g., `{ kind: 'continue', variant: 'check', reason: 'unfinished' }` if unfinished, or `{ kind: 'same', variant: 'check', reason: 'keepGoing' }` / `'notYetCorrect'` when finished).
     - When the learner navigates to `#/home` ("Min læring") or `#/progress/arithmetic.add-within-20`, [`SuggestionCard`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/pages/Home.jsx#L45-L51) evaluates `const v = variants[sug.variant]` (`variants['check'] === undefined`) and `variants[target].title` / `L(v.title)`, throwing an uncaught `TypeError: Cannot read properties of undefined (reading 'title')` and rendering a blank white screen.
   - **Fix for production:** Filter `mode === 'practice'` in `suggestNext()` (or handle `mode === 'check'` explicitly in `SuggestionCard` and `SessionBlock`).

2. **[MEDIUM] Check summary "Forklaringer / Explanations" section disappears when all independent items are correct, and links only to general lesson sections rather than worked explanations of the check items:**
   - **Evidence (verified in source & browser):** [`Practice.jsx`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/pages/Practice.jsx#L331-L358) defines `const explain = rows.filter((r) => r.s.outcome !== 'correctFirst')` and renders the *"Forklaringer / Explanations"* card only when `explain.length > 0`. This contradicts the pre-check policy ([`i18n-iteration2.js`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/i18n-iteration2.js#L94): *"Du får vite hvordan det gikk når du er ferdig, med lenker til forklaringer"*), and even when shown, each row links only to a general lesson anchor (`#/lesson/number-bonds-to-ten?s=pairs`) rather than showing or opening the step-by-step explanation for `7 + 3`, `5 + 4`, or `9 + 4`.

3. **[MEDIUM] `ProgressPage` ("Se fremgang") does not distinguish post-switch supported practice items inside a check session:**
   - **Evidence (verified in source):** In [`src/pages/Home.jsx`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/pages/Home.jsx#L249-L279), `SessionBlock` renders a check session under the heading **"Sjekk forståelsen / Check understanding"** and lists every delivery with `<OutcomeTag outcome={i.outcome} />` without inspecting the `check-switch` event. Any question answered on the first try *after* switching to supported practice (when immediate feedback and help were unlocked) is listed inside the *"Sjekk forståelsen"* block as **"Riktig på første svar, uten hjelp"**, blurring the boundary that `CheckPage`'s own summary carefully maintained.

4. **[LOW] Unfinished self-checks cannot be resumed from `#/home` ("Fortsett der du slapp"):**
   - **Evidence:** `CheckPage` never calls `learner.setLast(...)`, so leaving a check mid-way provides no resume link on `#/home` (and because of the `P0` bug above, starting a check currently crashes `#/home` anyway).

---

### Area 3: Practice and Challenge

#### What works
- **Concrete, non-destructive challenge controls:** In [`Practice.jsx`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/pages/Practice.jsx#L96-L124), **"Gjør det enklere / Make it easier"** and **"Øk utfordringen / More challenge"** name the target variant directly on the button (e.g., *"Addisjon innenfor fem"*, *"Addisjon over ti"*, or *"Ingen variant i prototypen"* at boundaries) and apply the change to the **next** question (`session.pending`) with an **"Angre endringen / Undo change"** button so current work is never wiped out.
- **Honest repeat handling on finite prototype pools:** Verified in Playwright: advancing through all 4 questions of `within-5` (`2 + 1`, `1 + 3`, `2 + 2`, `3 + 2`) and clicking **"En oppgave til"** on the 5th delivery displays the `gjentakelse / repeat` tag and status message: *"Du har sett alle 4 oppgavene i «Addisjon innenfor fem» i denne økten. Denne er en gjentakelse – prototypen har ikke flere."*
- **Session summary separates answered, skipped, and unfinished:** Verified in Playwright and [`Practice.jsx`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/pages/Practice.jsx#L182): skipping 4 items and clicking **"Avslutt økten og fortsett senere"** on the 5th unanswered item reports: *"Du fikk 5 oppgaver: 0 besvart (0 riktige til slutt), 4 hoppet over og 1 ikke fullført."*

#### What fails or misleads
1. **[MEDIUM] Clicking "Gjør det enklere" and then "Øk utfordringen" (or vice versa) before advancing sets a no-op pending change to the *current* variant:**
   - **Evidence (verified in Playwright & source):** Both [`Practice.jsx`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/pages/Practice.jsx#L69-L71) and [`store.jsx`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/store.jsx#L222) compute `base = s.pending ?? cur.variant`. When practicing `within-10` (*"Addisjon innenfor ti"*):
     1. Clicking **"Gjør det enklere"** sets `pending = 'within-5'` (*"Neste: Addisjon innenfor fem"*).
     2. The button sublabels immediately shift relative to `within-5`, so **"Øk utfordringen"** now says *"Addisjon innenfor ti"* (the current variant!) instead of *"Addisjon over ti"*.
     3. Clicking **"Øk utfordringen"** sets `pending = 'within-10'` — displaying the badge **"Neste: Addisjon innenfor ti"** and status *"Neste oppgave blir «Addisjon innenfor ti». Du kan gjøre ferdig denne først."* even though the learner is **already** in *"Addisjon innenfor ti"*, and logs a redundant `challenge` event (`from: 'within-10', to: 'within-10', request: 'harder', outcome: 'applied'`).
   - **Fix for production:** Compute `easier` and `harder` relative to `cur.variant` (the active exercise's variant), and if `target === cur.variant`, clear `pending` instead of setting `pending = cur.variant`.

2. **[LOW] Clicking "Flere slike oppgaver / More like this" silently discards a pending challenge change while leaving the `challenge` event logged as `applied`:**
   - **Evidence (verified in Playwright & source):** In [`store.jsx`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/store.jsx#L225-L246), clicking **"Gjør det enklere"** logs `{ type: 'challenge', ..., outcome: 'applied' }` at the moment the button is clicked (before advancing). If the learner then clicks **"Flere slike oppgaver"** (`request === 'same'`), line 238 selects `target = cur.variant` and line 239 resets `pending: null`, discarding the pending easier variant while the event log still claims the challenge change was `applied`.

---

### Area 4: Progress

#### What works
- **Honest, non-mastery reporting:** `#/home` and `#/progress/arithmetic.add-within-20` contain no percentages, progress bars, streaks, or "mastered" badges, matching [`docs/learning/mastery.md`](file:///d:/repos/MathKX/docs/learning/mastery.md).
- **Clear sample-history labelling:** Both the demo profile (`MKX-DEMO-4K7P`) and the guest sample view (`#/progress/arithmetic.add-within-20?sample=1`) display prominent warning banners (*"Eksempelhistorikk — Dette er laget eksempeldata..."*) and tag sample rows accordingly.
- **Definition disclosure for outcome labels:** `ProgressPage` includes an expandable **"Hva betyr merkene? / What do the labels mean?"** section explaining all 8 outcome labels in plain language and explicitly stating that none of them is a grade or mastery score.

#### What fails or misleads
1. **[HIGH / MEDIUM] Outcome derivation flaws carried over from Area 1 and Area 2:**
   - As detailed under Area 1 and Area 2:
     - Check sessions crash `#/home` and `#/progress/<skillId>` (`P0`).
     - Opening an explanation after an incorrect first try produces both `correctAfterExplanation` and `explanationAfter` on the same delivery (`P1`).
     - Opening visual help after an incorrect first try and then solving the item records only `correctAfterFeedback` and ignores `visualBeforeCorrect` (`P2`).
     - Completing counter-by-counter counting (`counting-complete`) sets `countedAll = true` in [`observations.js`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/domain/observations.js#L42), which is never displayed in `Home.jsx` or `ProgressPage`.
2. **[LOW] Lesson view count on `ProgressPage` increments on repeated opens within a session:**
   - **Evidence:** [`Lesson.jsx`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/pages/Lesson.jsx#L14-L26) debounces `lesson-viewed` events for only `3000 ms` (` Date.now() - lastViewLog.at < 3000`). While `#/home` deduplicates viewed lessons by lesson ID ([`Home.jsx`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/pages/Home.jsx#L108)), `ProgressPage` ([`Home.jsx`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/pages/Home.jsx#L238)) counts every raw `lesson-viewed` event (*"Leksjonen «Tiervenner» er vist {n} ganger"*), so hopping back and forth between an exercise and its lesson (`"Les i leksjonen"` → `"Tilbake til oppgaven"`) after 3 seconds inflates the view counter.

---

### Area 5: Tablet Workspace and Accessibility

#### What works
- **Zero static `axe-core` violations and zero horizontal overflow across all 12 viewport/language/theme combinations:**
  - Verified with `axe-core` across `390×844`, `820×1180`, and `1180×820` in `nb` and `en`, `light` and `dark` modes across all 19 routes and interactive states: **0 violations** once the 250 ms `.mkx-fade` transition completes, and `documentElement.scrollWidth <= documentElement.clientWidth` on every screen.
- **Side-by-side tablet workspace (`820×1180` and `1180×820`):**
  - When visual help or explanation is opened on tablet viewports (`min-width: 720px` in [`src/styles/app.css`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/styles/app.css#L75-L83)), `.mkx-workspace[data-panel="open"]` switches cleanly to a two-column grid (`minmax(18rem, 1fr) minmax(20rem, 1.15fr)`), keeping the prompt, answer field, and visual representation simultaneously visible without scrolling.
- **Polite feedback announcements without stealing focus:** Feedback is rendered inside `<div role="status" aria-live="polite">` ([`ExerciseShell.jsx`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/components/ExerciseShell.jsx#L128)) while focus stays on the learner's control.
- **Screen-reader math pairing:** Visual expressions (`<MathExpr>` inside `aria-hidden="true"`) are paired with `.ds-sr-only` spoken strings in Norwegian and English (`kind.spoken(q)[lang]`).

#### What fails or misleads
1. **[MEDIUM] On mobile (`390×844`), toggling "Simuler skjermtastatur / Simulate on-screen keyboard" initially covers the answer input and submit button:**
   - **Evidence (measured in Playwright at `390×844`):** On `#/practice/arithmetic.add-within-20?variant=across-10`, toggling **"Simuler skjermtastatur"** opens `.mkx-kbd` fixed at `top: 574px` (`height: 270px`, `bottom: 844px`). Because toggling the switch in the top banner does not focus the answer input (`onFocus`'s `scrollIntoView` in [`ExerciseShell.jsx`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/components/ExerciseShell.jsx#L66) never fires), the answer input remains at `bottom: 591px` (`nb`) / `619px` (`en`) and the **"Sjekk svaret / Check answer"** button sits at `bottom: 658px` (`nb`) / `686px` (`en`) — hidden behind the simulated keyboard until the user manually scrolls.
   - **Fix:** Trigger `scrollIntoView` on `[data-answer-input]` (or its form container) when `state.kbdSim` transitions to `true` or when `visualViewport` shrinks.

2. **[LOW] Breadcrumb links (`24px` height) and inline undo buttons (`36px` height) are smaller than the 44×44 px touch target requirement:**
   - **Requirement reference:** [`docs/design/design-principles.md`](file:///d:/repos/MathKX/docs/design/design-principles.md#L45) specifies *"Keep interactive targets at least 44×44 CSS pixels, with enough spacing to avoid accidental taps."*
   - **Evidence (measured in Playwright across `390×844`, `820×1180`, `1180×820`):** Primary exercise buttons (`48–56px` height), counter buttons (`48×48px`), and simulated keyboard keys (`46px` height) all meet the `44×44px` requirement, but breadcrumb navigation links (`a` in `PageHead`, height `24px`) and `data-size="sm"` tertiary buttons (`"Angre endringen"`, height `36px`) fall below `44px`.

3. **[LOW] `.mkx-fade` (`250ms` opacity animation) causes transient low contrast during the first ~100 ms of panel opening:**
   - **Evidence (measured by `axe-core` at `60 ms` vs `350 ms`):** When `axe-core` runs `60 ms` after clicking **"Vis visuell hjelp"** (without `prefers-reduced-motion: reduce`), `axe-core` flags `color-contrast` on `.mkx-fade` elements because their computed opacity is `~0.42` mid-transition (`contrast ratio 2.49:1`). At `350 ms` (and with `prefers-reduced-motion: reduce`), contrast passes with 0 violations (`15.9:1`). Animating `opacity` from `0.01` over `250ms` on every feedback alert and help panel (`key={work.tries}`) is unnecessary; a shorter transition or no opacity fade on text containers avoids transient low contrast.

---

### Area 6: Beyond Elementary Arithmetic (Derivative Preview, Notation Grammar, Locale-Aware Numbers)

#### What works
- **Honest framing of the derivative preview (`#/preview/derivative`):** Clearly badged as **"Designforhåndsvisning / Design preview"** with a warning alert explaining that there is no lesson yet and nothing on the page is recorded as progress.
- **Accessible graph interaction:** [`Preview.jsx`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/pages/Preview.jsx#L83-L101) pairs the SVG parabola/tangent/slope-triangle (`Δx = 1`, `Δy = 2a`) with `←` / `→` stepper buttons, a polite `<output>`, a collapsible value table (`x`, `f(x) = x²`, `2x`), and direct numeric entry.
- **Tested notation parser and MathML renderer:** [`src/domain/notation.js`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/domain/notation.js) and [`MathExpr.jsx`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/components/math/MathExpr.jsx) support fractions (`\frac{a}{b}`), superscripts (`x^2`), subscripts (`a_n`), `\cdot`, `\Delta`, and prime (`f'(x)`), while rendering unsupported LaTeX commands (`\sqrt{2}`) as an explicit visible `<Tag data-color="warning">` (*"\sqrt: notasjonen støttes ikke ennå / notation not supported yet"*) rather than raw code or silent omission.
- **Locale-aware number parsing and formatting:** [`src/domain/numbers.js`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/domain/numbers.js) accepts `1,5` and `1.5` in `nb`, rejects `1,5` in `en` with a specific hint (`decimalComma` — *"Use a decimal point, for example 1.5"*), rejects ambiguous thousand separators (`1 000`, `1,234` in `en`, `1.234` in `nb`) with `grouping`, and formats decimals with `,` in `nb` (`1,5`) and `.` in `en` (`1.5`) and Unicode minus `−`.

#### What fails or misleads
1. **[MEDIUM] In `DerivativePreview`, entering a valid `x` that is not a multiple of `0.5` (e.g., `1,2`) updates the feedback text for `x = 1,2` while leaving the graph and slope readout stuck at the previous `x` (`x = 1`):**
   - **Evidence (verified in Playwright & source):** In [`src/pages/Preview.jsx`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/pages/Preview.jsx#L67-L69):
     ```js
     if (Math.abs(p.value) > 2) { setFb({ kind: 'range' }); return; }
     setA(Math.round(p.value * 2) / 2 === p.value ? p.value : a);
     setFb(p.value === 1.5 ? { kind: 'correct' } : { kind: 'wrong', x: p.value, m: 2 * p.value });
     ```
     Because the SVG curve and tangent line are computed continuously from `a` (`ya = a * a`, `m = 2 * a`), restricting `setA` to multiples of `0.5` is unnecessary and causes a direct contradiction between representations: when a learner enters `1,2` and clicks **"Sjekk svaret"**, the warning alert says *"I x = 1,2 er stigningstallet 2 · 1,2 = 2,4. Vi trenger 3."*, while the graph and the live slope card immediately to the left still display *"I punktet x = 1 er f(x) = 1... Stigningstallet er 2."*
   - **Fix:** Call `setA(p.value)` for any valid `p.value` in `[-2, 2]`, and let the `←` / `→` stepper snap to the nearest `0.5` grid point when clicked.

2. **[LOW] Clicking "Forklar løsningen / Explain the solution" in `DerivativePreview` reveals the answer `x = 1,5` immediately without the confirmation step used in `ExerciseShell`:**
   - **Evidence:** [`Preview.jsx`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/pages/Preview.jsx#L118-L124) toggles `explain` directly on click (`onClick={() => setExplain((v) => !v)}`) and immediately shows `x = 3/2 = 1,5` even before the learner has submitted an answer.

3. **[LOW] `MathExpr` renders decimal numbers inside expressions using a literal `.` unless pre-formatted, and `Preview.jsx:91` embeds localized strings into `MathExpr`:**
   - **Evidence:** In [`Preview.jsx`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/pages/Preview.jsx#L91), `expr={\`\\frac{\\Delta y}{\\Delta x} = \\frac{\${f(2 * a).replace('−', '-')}}{1} = \${f(2 * a).replace('−', '-')}\`}` works only because `2 * a` happens to be an integer for `0.5` steps (`2 * 1.5 = 3`). If `a = 1.2`, `f(2 * a)` in Norwegian is `"2,4"`, and [`notation.js`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/domain/notation.js#L26) tokenizes `"2,4"` as `<mn>2</mn><mo>,</mo><mn>4</mn>` instead of a single `<mn>2,4</mn>` number token. `notation.js` should accept `,` inside number literals (`/\d+(?:[.,]\d+)?/`) or format numbers at the MathML `<mn>` rendering boundary.

---

### Area 7: Lessons, Contribution, Profile, and Recovery

#### What works
- **Lesson round-trip preserves exercise state:** Verified in Playwright: clicking **"Les i leksjonen / Read in the lesson"** from an active exercise with a draft answer (`99`) and an open visual help panel navigates to the relevant lesson section (`#/lesson/number-bonds-to-ten?s=what`), displays a sticky **"Oppgave i gang / Exercise in progress"** banner, and clicking **"Tilbake til oppgaven / Back to the exercise"** restores both the `"99"` draft input and the open visual help panel at the exact step.
- **Concrete lesson source & privacy-preserving suggestion preview:**
  - **"Rediger kilden / Edit the source"** shows the proposed folder layout (`content/lessons/<id>/lesson.json`, `nb.md`, `en.md`) aligned with [`docs/architecture/proposals/lesson-markdown-and-delivery.md`](file:///d:/repos/MathKX/docs/architecture/proposals/lesson-markdown-and-delivery.md) and notes that the format is a proposal and the lesson folder is not in the repo yet.
  - **"Foreslå en forbedring / Suggest an improvement"** requires a preview step before submission that shows the exact public payload (`lesson`, `language`, `file`, `section`, `kind`, `description`) alongside an explicit **"Blir ikke tatt med / Not included"** list (Learner ID, password, learning history/answers, email address).
- **Privacy-preserving profile and guest-work provenance ([ADR 0006](file:///d:/repos/MathKX/docs/architecture/decisions/0006-support-profiles-without-personal-details.md)):**
  - No name, age, school, or mandatory email is collected.
  - Signing into an existing profile when guest activity exists in the browser prompts an explicit choice (**"Legg det til i profilen"** vs. **"Ikke legg det til"**) and marks imported events with `prov: 'guest-import'` (`gjestearbeid / guest work`).
  - Email verification supports code entry (`246810`), 3-try lockout (`MAX_CODE_TRIES = 3`), resending a code, correcting a mistyped email address, or choosing **"Bekreft senere / Confirm later"** (`emailState: 'pending'`), with a clear warning that an unconfirmed email cannot be used for recovery.

#### What fails or misleads
1. **[MEDIUM] In `#/settings`, clicking "Bytt e-post / Change email" on a *verified* recovery email overwrites the verified email with `emailState: 'pending'` as soon as a code is sent:**
   - **Evidence (verified in Playwright & source):** In [`src/pages/Profile.jsx`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/pages/Profile.jsx#L73,L391-L398), when a learner already has `email: 'first@example.com'` with `emailState: 'verified'` and clicks **"Bytt e-post"**, `EmailSetup` dispatches:
     ```js
     dispatch({ type: 'profilePatch', patch: { email: email.trim(), emailState: 'pending' } });
     ```
     at the moment **"Send bekreftelseskode"** is clicked — *before* the new address is verified. Furthermore, the verification screen has no **"Avbryt / Cancel"** button to revert to `'first@example.com'`, only **"Bekreft senere / Confirm later"**. If the user made a typo (`typo@example.com`) or abandons the change, their previously verified recovery email is destroyed and replaced by an unverified address that cannot recover the account.
   - **Fix for production:** Keep the existing verified recovery email active until the replacement email's verification code succeeds (store `pendingEmail` separately from `verifiedEmail`).

2. **[LOW] Profile creation commits the profile to storage at the end of Step 1 (before the learner sees Step 2 to copy/download their ID):**
   - **Evidence (verified in Playwright & source):** In [`Profile.jsx`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/pages/Profile.jsx#L162-L164), `submitStep1` dispatches `createProfile` and signs into the new profile before transitioning to `step: 2` (*"Ta vare på innloggingen din / Keep your sign-in details"*). While `SetupBanner` warns the user if they navigate away during Steps 2–3, if the learner closes the browser tab or signs out before completing Step 2, the profile is already created without the learner ever having confirmed saving their generated ID.

3. **[LOW] Maintainability debt in `src/i18n.js` vs `src/i18n-iteration2.js`:**
   - **Evidence:** [`src/i18n.js`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/i18n.js#L135-L160) still contains Iteration 1 strings that contradict Iteration 2 requirements (for example, `nb.check.policy2` on line 139 still says *"Du kan åpne visuell hjelp i alle oppgavene"* inside a check), which are only avoided at runtime because `nb2.check` in [`src/i18n-iteration2.js`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/i18n-iteration2.js#L91-L109) happens to use different keys (`policyIndependent`, `policyFeedback`, `policySwitch`). Production code should use a single authoritative translation dictionary per locale without dead Iteration 1 keys.

---

## 4. Prioritized Action List Before / During Production Implementation

| Priority | Area | Concrete Problem | Where in Prototype | What Production Must Do |
|---|---|---|---|---|
| **P0 (Blocker)** | Self-checks & Progress | Starting or finishing a self-check crashes `#/home` and `#/progress/<skillId>` (`variants['check']` is `undefined`). | [`observations.js:61-77`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/domain/observations.js#L61-L77), [`Home.jsx:45-51`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/pages/Home.jsx#L45-L51) | Filter `mode === 'practice'` in `suggestNext()` or handle `mode === 'check'` sessions explicitly in suggestion and progress components. |
| **P1 (High)** | Help vs. Explanation & Progress | Opening **"Forklar løsningen"** after an *incorrect* attempt skips the answer-reveal confirmation, logs `'explanation'` instead of `'answer-reveal'`, and produces contradictory tags (`[Svart etter forklaring]` + `[Forklaring åpnet etter svar]`). | [`ExerciseShell.jsx:32,47-50`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/components/ExerciseShell.jsx#L32-L50), [`observations.js:27-56`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/domain/observations.js#L27-L56) | Gate pre-solution reveal confirmation and `'answer-reveal'` logging on `!solved` (no correct response yet), and compute `explanationAfter` relative to `correctSeq` (`e.seq > correctSeq`). |
| **P2 (Medium)** | Help vs. Explanation & Progress | Opening **"Vis visuell hjelp"** after an *incorrect* attempt displays `"Visuell hjelp etter svar"` while still solving, and `visualBeforeCorrect` is never shown once solved (`correctAfterFeedback` hides help usage). | [`ExerciseShell.jsx:76-79`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/components/ExerciseShell.jsx#L76-L79), [`observations.js:38-46`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/domain/observations.js#L38-L46) | Compare support timestamps against `correctSeq` (not the first wrong attempt), and surface `visualBeforeCorrect` alongside `correctAfterFeedback` when both occur. |
| **P2 (Medium)** | Help vs. Explanation | `GroupsHelp` (`"Hjelp meg å telle"`) reveals the exact total when counting finishes (`"Du har talt {n} brikker"`) without treating it as an answer reveal ([`exercise-experience.md:57-58`](file:///d:/repos/MathKX/docs/design/exercise-experience.md#L57-L58)) or displaying `countedAll`. | [`Counters.jsx:57-81`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/components/math/Counters.jsx#L57-L81), [`observations.js:15,28,42`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/domain/observations.js#L15-L42) | Either withhold the final sum in `GroupsHelp` (stopping at the last counter without stating the total) or classify `counting-complete` as an answer reveal / explicitly surface `countedAll` in the UI. |
| **P2 (Medium)** | Self-checks | Check summary hides the *"Forklaringer"* section when all independent answers are right, links only to general lesson sections instead of worked item explanations, and `ProgressPage` does not separate items answered after `check-switch`. | [`Practice.jsx:331-358`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/pages/Practice.jsx#L331-L358), [`Home.jsx:249-279`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/pages/Home.jsx#L249-L279) | Provide expandable worked explanations for all check items on the summary screen, and split or badge post-`check-switch` items in `ProgressPage`. |
| **P2 (Medium)** | Practice & Challenge | Stepping `"Gjør det enklere"` then `"Øk utfordringen"` computes relative to `session.pending` rather than `cur.variant`, setting `pending = cur.variant`; clicking `"Flere slike oppgaver"` silently drops `pending` while leaving the `challenge` event logged as `applied`. | [`Practice.jsx:69-71`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/pages/Practice.jsx#L69-L71), [`store.jsx:222-246`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/store.jsx#L222-L246) | Compute `easier`/`harder` targets relative to `cur.variant` (or clear `pending` when `target === cur.variant`), and log `challenge` `outcome: 'applied'` when the next delivery actually transitions. |
| **P2 (Medium)** | Beyond Arithmetic | Entering a valid `x` not on the `0.5` grid (e.g., `1,2`) in `DerivativePreview` updates the feedback text (`2 · 1,2 = 2,4`) while leaving the graph and slope panel at `x = 1`. | [`Preview.jsx:68`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/pages/Preview.jsx#L68), [`notation.js:26`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/domain/notation.js#L26) | Call `setA(p.value)` for any valid `x` in `[-2, 2]`, and support comma decimals inside `notation.js` number tokens. |
| **P2 (Medium)** | Profile & Recovery | Clicking **"Bytt e-post / Change email"** in `#/settings` immediately overwrites a verified recovery email with `emailState: 'pending'` before the new email's code is verified. | [`Profile.jsx:73,391-398`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/pages/Profile.jsx#L73) | Keep the previously verified email active until the new address completes verification (`pendingEmail` vs. `verifiedEmail`). |
| **P2 (Medium)** | Mobile / Tablet Workspace | Enabling the simulated on-screen keyboard at `390×844` covers the answer field and **"Sjekk svaret"** button until the user scrolls or re-focuses; breadcrumb links (`24px` high) are below `44×44px`. | [`App.jsx:200,209`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/App.jsx#L200-L209), [`ExerciseShell.jsx:66`](file:///d:/repos/MathKX/Prototype/mathkx-designsystemet/src/components/ExerciseShell.jsx#L66) | Scroll the active answer block into the visible area whenever the keyboard opens, and increase vertical padding on breadcrumb links and small action buttons. |
