# Independent review: MathKX learner prototype, iteration 2

**Date:** 2026-10-18, Europe/Oslo. **Reviewer:** Codex, independent reviewer in this chat; exact deployed model version is not exposed. No other reviewing agents were used.

**Repository:** `D:\repos\MathKX`. **Branch:** `main`. **Full HEAD:** `a6a3abae64d09250af47cf663392dda1838f227f`. Initial `git status --short` was empty. At completion, tracked files remained unchanged; only this review directory was added. No application code, requirements, schemas, ADRs or other reviews were edited. No commit, push, publication or external submission was performed. The requested install/build created ignored dependency/build files, and browser testing created local prototype guest history.

## Assessment

**A sound design direction, but iteration 2 is not yet a reliable specification to copy into production.** The visual style is calm, practice controls describe concrete variations, explanations are now reachable, and the ordinary practice summary distinguishes different outcomes without a mastery score. Those are good foundations for a narrow production slice.

Fix the broken return from self-checks and the misleading support/history paths before accepting these flows as reference behavior. These are observable failures in the existing journey, not requests for additional features. A broader curriculum, a mastery algorithm, production accounts and a universal mathematics engine are not prerequisites for fixing them.

This is an expert walkthrough and source review, **not learner usability research, educator validation or iPad testing**. I independently ran the tests and browser interactions below. The prototype's handoff/checklist claims are not counted as my results.

## Findings worth fixing

Severity: **P1** blocks a core journey or materially misstates learning evidence. **P2** is a concrete behavior, teaching or accessibility defect to correct in the relevant production slice. **P3** is a smaller implementation correction.

### R03-01 — P1: Starting a self-check can make My learning completely blank

**Verified in the browser, twice.** Start the addition check, save `10` for `7 + 3`, then open **My learning**. The entire application disappears, including navigation. The console reports `TypeError: Cannot read properties of undefined (reading 'title')` in `SuggestionCard`. Starting a fresh check and opening Home before answering also reproduces it. Reloading Home does not remove the stored condition; I recovered by navigating to the check and reloading there.

**Cause from source:** [observations.js](../../../../Prototype/mathkx-designsystemet/src/domain/observations.js#L66) selects the latest session, including checks. Check instances use variant `check`, while [Home.jsx](../../../../Prototype/mathkx-designsystemet/src/pages/Home.jsx#L41) dereferences `variants[target].title`. There is no practice variant called `check`. The real skill-progress page also renders this suggestion component; that failure is source-inferred, rather than separately reproduced at the moment the check was latest.

**Why it matters:** The learner cannot return to their learning record after a core activity. An unrelated later practice session for that skill happened to make Home work again during this review; that is not a usable recovery flow.

**Fix/acceptance:** Give check sessions an explicit suggestion path, or exclude them from practice-variant suggestions. Home and actual progress must render after starting, abandoning, completing, and switching a check to supported practice, including after reload. Preserve the check history rather than discarding it to avoid the crash.

Evidence: [captured errors](home-error.json), [blank Home](home-after-check.png). Requirement: [progress summaries](../../../learning/mastery.md#learner-facing-summaries) and [learning purposes](../../../design/learning-experience.md#learner-purposes).

### R03-02 — P1: Reading the exact worked solution still earns “without help”

**Verified in the browser.** On a fresh `8 + 5` delivery, choose **Les i leksjonen / Read in the lesson** before answering. It opens the relevant lesson section containing the complete `8 + 5 = 8 + 2 + 3 = 10 + 3 = 13` worked example. Return with **Tilbake til oppgaven**, enter `13`, and submit. Feedback says **“Du svarte riktig på første forsøk, uten hjelp.”** The session and progress history also show first response without help.

**Cause from source:** [ExerciseShell.jsx](../../../../Prototype/mathkx-designsystemet/src/components/ExerciseShell.jsx#L83) records a return route but no support for the delivery. [Lesson.jsx](../../../../Prototype/mathkx-designsystemet/src/pages/Lesson.jsx#L90) logs a separate lesson-viewed event. The exact worked solution is in [the lesson](../../../../Prototype/mathkx-designsystemet/src/content/lessons/number-bonds-to-ten/en.md#L38).

**Fix/acceptance:** Preserve the useful lesson detour, but associate the teaching material disclosed by that detour with the active delivery. When it exposes that delivery's answer, make the disclosure explicit and describe the later response accordingly. Do not treat all historical lesson reading as help on all future questions. Reproduce this exact detour in both languages and confirm it cannot result in “no help”; a detour after a submitted answer must leave the earlier response unchanged.

Evidence: [incorrect outcome after the detour](lesson-detour-outcome.png). Requirement: [support actually shown](../../../learning/mastery.md#progress-tracking-before-a-mastery-algorithm) and [explanation disclosure](../../../design/exercise-experience.md#explaining-why-the-result-follows).

### R03-03 — P2: The advertised help/reveal boundary does not match what is shown or recorded

**Verified in the browser and with a domain probe.** For `4 + 4`, open visual help, choose **Help me count**, count on from four, then press the next-counter button four times. The interface explicitly says eight counters have been counted and numbers the final counter `8`. Submitting `8` receives the same **Correct with visual help** outcome as merely opening the two uncounted groups. The reveal warning elsewhere promises that visual help does not give the answer.

[Counters.jsx](../../../../Prototype/mathkx-designsystemet/src/components/math/Counters.jsx#L56) emits `counting-complete`, but [observations.js](../../../../Prototype/mathkx-designsystemet/src/domain/observations.js#L15) treats it as ordinary teaching support. My probe returned `correctWithVisualHelp`, with `countedAll: true`; the learner summaries do not expose that distinction. This is **not** a claim that it becomes independent success: it remains labelled helped. The defect is the lost distinction between viewing a model and being shown the total, plus the contrary promise in the interface.

There is a second, source-verified ordering issue in the explanation player: [ExerciseShell.jsx](../../../../Prototype/mathkx-designsystemet/src/components/ExerciseShell.jsx#L49) records an answer reveal on opening step 0, although the initial `8 + 5` explanation step does not yet show `13`. Advancing explanation steps only updates work state ([line 97](../../../../Prototype/mathkx-designsystemet/src/components/ExerciseShell.jsx#L97)); it does not record which later steps actually appeared. Thus the current log cannot distinguish opening and immediately closing step 1 from seeing the final answer. I verified the displayed four-step progression, but did not read browser storage to independently verify its event payloads.

**Fix/acceptance:** Record explanation opening separately from the actual answer disclosure, and preserve which authored steps were shown in the required support context. Treat completed guided counting as a reveal of the total, with wording that makes the escalation clear. Keep counting available; do not make help punitive. Verify open/close before the final step, full counting, full explanation, and answer-before/after each disclosure. A reveal must not count as a solved task until a correct mathematical response is submitted.

Requirements: [addition example](../../../design/exercise-experience.md#addition-example), especially the explicit-total rule, and [ordered observations](../../../learning/mastery.md#progress-tracking-before-a-mastery-algorithm). Both languages contain the misleading promise in [i18n-iteration2.js](../../../../Prototype/mathkx-designsystemet/src/i18n-iteration2.js#L26).

### R03-04 — P2: More like this silently cancels the pending challenge choice

**Verified in Norwegian.** While practising across ten, choose **Gjør det enklere**. The UI says the next question will be addition within ten and shows an Undo action. Choose **Flere slike oppgaver**. The next question is `9 + 4`, still across ten, and the pending within-ten selection disappears. No message explains the cancellation.

[store.jsx](../../../../Prototype/mathkx-designsystemet/src/store.jsx#L238) deliberately uses the current variant for `same` and clears `pending` for either next-question action. Keeping the same family is a plausible meaning of “More like this”, but the displayed “Next: …” promise makes these two actions conflict.

**Fix/acceptance:** Define and display the interaction between a pending variation and More like this. Either honor the advertised next variation or explicitly say that choosing more of the current kind replaces that selection. Test both next-question buttons after easier/harder and after Undo. The current typed answer must remain intact until moving on.

Related verified confusion: entering through `?variant=within-10`, then successfully choosing More challenge → Another question, produces an alert offering to restart within ten. [Practice.jsx](../../../../Prototype/mathkx-designsystemet/src/pages/Practice.jsx#L68) continues treating the original URL variant as a new request. Consume the initial request so the learner's own challenge change does not produce a contradictory restart prompt.

Requirement: [apply challenge changes to the next question](../../../design/learning-experience.md#adjusting-challenge).

### R03-05 — P2: The supported-check boundary disappears from longer-term progress

**Verified in the browser.** I answered question 1 independently, switched to supported practice at question 2, then answered question 2 correctly without opening a help panel. The immediate check summary accurately separated question 1 from **Supported practice (from exercise 2)**. Later, the skill-progress session listed both answers under **Check understanding** with the identical **Correct on first response, no help** label and no indication of the mode switch. The Home recent list calls later work merely “in check”.

These two answers can both truthfully have no support panel opened; they did not occur under the same feedback/support policy. The history loses the distinction the learner was explicitly promised. [CheckPage](../../../../Prototype/mathkx-designsystemet/src/pages/Practice.jsx#L314) groups by `switchedAt`; [ProgressPage](../../../../Prototype/mathkx-designsystemet/src/pages/Home.jsx#L249) and Home do not expose that boundary. A `check-switch` event already exists, so this does not require inventing a mastery model.

**Fix/acceptance:** Carry the independent/supported segment into every representation of that run, including history after taking another check. Keep actual help usage separate from the activity's support policy. The same run should mean the same thing on its summary, Home and progress page.

Also verified within this flow: **Next exercise** on an unanswered supported question records it as **Unfinished**, while **Skip** records **Skipped**. The displayed definition of unfinished says the session was interrupted before answering; here I deliberately moved on and completed the session. Make the two next-question routes consistent or explicitly explain their different semantics. See [Practice.jsx](../../../../Prototype/mathkx-designsystemet/src/pages/Practice.jsx#L246).

Evidence: [immediate summary](check-summary.png); the later progress walkthrough is recorded in the check log below. Requirement: [distinct purposes and evidence](../../../design/learning-experience.md#boundaries-between-lessons-and-application-code).

### R03-06 — P2: The balance's final picture does not demonstrate the substitution check

**Verified visually and through accessible text.** For `x + 3 = 7`, the first three explanation steps show the original balance, removal of three from both sides, then `x = 4`. Those agree. On step 4, the equation and text change to **`4 + 3 = 7`**, but the picture and accessible lists still show **x alone versus four units**. It remains a true picture of the previous result, but not of the verification the learner is being asked to follow.

The last two steps reuse phase 3 in [explanations.js](../../../../Prototype/mathkx-designsystemet/src/domain/explanations.js#L63). [BalanceVisual](../../../../Prototype/mathkx-designsystemet/src/components/math/Visuals.jsx#L77) therefore never restores the original equation with four substituted for x.

**Fix/acceptance:** Show the substitution in the original balance, or clearly separate the previous result picture from a textual check. If the step claims picture/equation/text agreement, the final picture and accessible description must represent four plus three versus seven. Verify the complete sequence for the supported equation values, not only that some equation string contains the correct answer.

Evidence: [step 4 screenshot](balance-check-step.png). Requirement: [worked visual reasoning](../../../design/exercise-experience.md#explaining-why-the-result-follows).

### R03-07 — P2: “Finish … and continue later” preserves history but offers no way back to the unfinished answer

**Verified navigation, with source confirmation.** I typed `1` into `7 + 6`, chose **Finish this session and continue later**, and saw it correctly counted as unfinished. The summary offered a new session; the history displayed the unfinished question but neither the draft nor an action to resume it. Home's Continue card instead offered my older algebra session, which already had an answer.

[endSession](../../../../Prototype/mathkx-designsystemet/src/store.jsx#L247) removes the arithmetic session from `active`. [continueTarget](../../../../Prototype/mathkx-designsystemet/src/pages/Home.jsx#L19) walks the remaining active entries, and the session/progress rows are not resumable. The draft remains in the work object according to source; I am not claiming the stored string was deleted.

**Fix/acceptance:** Make the stop action's promise precise. If continuing this work later is intended, expose a route back to the unfinished delivery with its draft and support state. If ending is final and only new practice follows, say that before the learner ends. Do not advertise the checklist's Finish → Home continuation as implemented. Verify the explicit stop flow as well as simply navigating away from an active session.

Requirement: [preserving current work and learner control](../../../design/exercise-experience.md#continuing-practice-and-changing-challenge). The claim of a tested Finish → Continue flow is in the prototype's [checklist](../../../../Prototype/mathkx-designsystemet/docs/iteration-2/REQUIREMENTS-CHECKLIST.md), which does not override the observed behavior.

### R03-08 — P3: The step player references an accessible heading that does not exist

**Verified by a read-only DOM check in all six tested size/language combinations.** With the explanation open, one `aria-labelledby` target was missing. [StepPlayer](../../../../Prototype/mathkx-designsystemet/src/components/math/Visuals.jsx#L137) always sets `aria-labelledby={id}` but only renders that heading when `title` is supplied. The exercise shell does not supply it.

**Fix/acceptance:** Supply the heading, label the region from its actual panel title, or omit the invalid reference when no heading is rendered. Repeat the DOM check and verify the region and step controls with a screen reader. This finding alone is not evidence that the whole explanation is inaccessible, and no screen-reader test was performed.

Evidence: [responsive DOM checks](responsive-dom-checks.json). Requirement: [accessible-by-default design](../../../design/design-principles.md#accessible-by-default).

## What works, and practical limits by area

| Area | Independently observed strengths | Remaining qualification |
| --- | --- | --- |
| Help versus explanation | Distinct buttons; explicit pre-answer warning with a visual-help alternative; typed answer retained on help opening; all three example explanations reachable; hiding/switching panels does not clear the answer. | R03-02/03/06. “Shows the answer” currently describes the whole explanation rather than the initial step. Understanding of the distinction needs learners. |
| Answering and feedback | `4+0` receives an input-format error for the equation; correcting it to `x = 4` remains first mathematical success. `9 + 4`: `12` then `13` becomes correct after feedback. Opening the explanation after the correct equation answer adds an after-answer tag and leaves its original outcome intact. | This tests selected examples, not all parsable inputs or assistive technology. |
| Self-check | Intro states scope, four questions, one saved answer, feedback at end, no time limit, accessibility available, and explicit switch policy. Saving the first answer advances without inline correctness feedback. Switch confirmation names the exact boundary; immediate summary preserves it. | R03-01/05. I did not complete a wholly independent run or establish that every other navigation route respects delayed feedback. |
| Practice and challenge | All five controls exist. Harder → Another question changes the next task while retaining prior work. Variant names state actual number bounds. The within-five fifth delivery announces a repeat and explains the four-question pool. Unavailable easier practice explains its limit. | R03-04/07. Finite practice is a labelled simulation, not a tested production generator. |
| Session summary | A tested four-question run showed 2 answered (2 correct), 1 skipped, 1 unfinished. A later run separated first-response success, success after feedback and unfinished work. | Those counts can be correct while the support label on an answer is wrong. |
| Progress and sample | Empty Home gives useful starting points. Sample history is prominently marked as invented, separate from the learner's work; it shows 2 first-response successes, 1 with help, 1 after feedback, 1 after explanation, 1 skipped and 1 unfinished. Lesson viewed is explained honestly. No mastery percentage or score was observed. Suggestions explain their reasons and remain optional. | R03-01/02/05. The sample cannot exercise the failing latest-check suggestion path. “No help” should describe recorded in-app support, not establish absence of outside help. |
| Layout and interaction | Dark layouts reflow to one column at phone/portrait sizes and two exercise columns at landscape size. Measured balance state has no document horizontal overflow at all three widths in either language. Its enabled buttons met 44 × 44 in the DOM check. Answer and final explanation step survived language/viewport changes. | Only a selected state was measured across the complete matrix. This is not comprehensive responsive, touch or zoom certification. |
| Lessons and profiles, supporting inspection | The lesson detour gives a return banner and a relevant worked example. Profile entry requires no name, email, school or date of birth; ID and password roles are distinguished, and local-only simulation is visible. Source contains optional email, address correction, later verification and recovery states. | I did not create credentials, test profile recovery/import/download, submit a suggestion, or validate contributor preview tooling. Cross-device persistence is an established production requirement, not something this prototype implements. |

## Repository and handoff conflicts

These are recorded for the owner; I changed none of these documents.

1. [mastery.md, persistence](../../../learning/mastery.md#persistence-and-current-implementation-status) says the database remains undecided. [ADR 0008](../../../architecture/decisions/0008-store-profiles-and-progress-in-postgresql.md) is accepted and selects PostgreSQL; [architecture.md](../../../architecture/architecture.md#cross-cutting-constraints) reflects it. This status inconsistency does not justify another storage decision or affect the UI findings.
2. The prototype's [assumptions](../../../../Prototype/mathkx-designsystemet/docs/iteration-2/ASSUMPTIONS.md#assumptions-that-should-be-confirmed) calls pre-answer explanations and next-question challenge changes assumptions needing confirmation. Current [exercise experience](../../../design/exercise-experience.md#explaining-why-the-result-follows) and [learning experience](../../../design/learning-experience.md#adjusting-challenge) already establish them. The precise self-check default and recommendation heuristic remain different, genuinely open policy choices.
3. The handoff/checklist says visual, equation and text are tested together and that visual help never shows the result. The actual domain test checks answer strings and supported ranges; it does not render the counter/balance components, exercise the lesson detour, or verify the full event sequence. R03-02/03/06 demonstrate the limits of those claims. The reported clean axe runs were not reproduced here and are not used as evidence.

## Execution and inspection record

### Commands and environment

All npm commands ran in `D:\repos\MathKX\Prototype\mathkx-designsystemet`.

| Check | Outcome |
| --- | --- |
| `git rev-parse HEAD`, `git branch --show-current`, `git status --short` | HEAD/branch above; initially clean. |
| `npm ci` | First sandboxed attempt failed with EPERM creating `node_modules/@inquirer/confirm`. Approved retry outside the sandbox succeeded: 212 packages installed, 213 audited. npm reported 5 high-severity advisories; I did not investigate them or run audit fix. |
| `npm test` | Pass, 7 tests, 0 failures: notation, numeric parsing, 8 + 5 steps, supported-instance answer agreement, unsupported explanation ranges, finite pools, observation ordering. |
| `npm run build` | Pass, Vite 8.3.2; 1,203 modules transformed; single-file `dist/index.html`, 910.30 kB (gzip 238.08 kB). |
| `npm run dev -- --host 127.0.0.1` | Server reported ready on 5173; in-app browser timed out connecting. |
| `npm run dev -- --host 0.0.0.0 --port 5174` | Approved outside-sandbox retry reachable at `http://127.0.0.1:5174/`; all browser findings use this development server. The built file was not separately opened. Review servers stopped after testing. |
| Read-only Node probe | Imported `summarizeDelivery` and `explanationSteps`; compared a correct response after `counting-complete` versus after `answer-reveal`, and printed all balance step equation/visual pairs. Results described in R03-03/06. No source or tests were changed. |
| `node --version`, `npm --version` | Node v22.19.0; npm 11.2.0. Host shell: Windows PowerShell. |
| `npm ls axe-core --all` and `package.json` inspection | No installed axe-core dependency or project accessibility-check script. |
| Browser environment | Codex in-app browser through CUA, using DOM/AX snapshots, screenshots, clicks, field entry, Enter and viewport overrides. Exact engine/version not exposed by the available inventory. A read-only attempt to obtain `navigator.userAgent` failed because `navigator` is unavailable in that tool scope; no browser version is inferred. |
| Final `git diff --stat` / `git status --short` | No tracked diff; only review artifacts untracked. |

### Requested viewport / theme / language matrix

The browser inherited dark mode (`data-color-scheme="auto"`; measured body background `rgb(23, 24, 25)`). The exposed capabilities were viewport and visibility, with no media/color-scheme override; the app offers no theme switch. **Light mode could not be tested with the available controls.** I did not change the application or the user's OS preferences to force it.

| CSS viewport | Bokmål dark | English dark | Bokmål light | English light |
| --- | --- | --- | --- | --- |
| 390 × 844 | UI walkthrough + balance DOM measurement | translated practice + balance DOM measurement | Not run | Not run |
| 820 × 1180 | explanation screenshot + balance DOM measurement | explanation/keyboard flow + balance DOM measurement | Not run | Not run |
| 1180 × 820 | equation/challenge/progress flows + balance DOM measurement | check/summary flows + balance DOM measurement | Not run | Not run |

The six measurements were of the same solved equation with its final explanation open. Client/scroll widths were respectively 375/375, 805/805 and 1165/1165; the scrollbar accounts for the difference from viewport width. All retained `x = 4`. Enabled visible `button` elements in that state had no dimensions below 44 px. This measurement does not cover every link, radio control, lesson, keyboard simulation or preview graph. It cannot establish contrast or usability.

### Browser walkthrough log

| Scenario actually exercised | Result |
| --- | --- |
| Landing → phone menu → empty Home → within-ten practice | Works. Desktop Home selector initially had no match after narrowing because navigation is behind Menu; opening Menu resolved it. |
| `4 + 4`, type `8`, open visual help | Input retained; two labelled groups of four, plus sign, no initial total. |
| Guided counting to all eight, then submit | Works mechanically; disclose/classification mismatch R03-03. |
| Open explanation after that answer; advance all 3 steps; switch NB → EN | Outcome remains helped; after-answer tag added; groups combine, then final total appears; step and answer retained. |
| More challenge → Another question | New task `8 + 5`; old answer retained in session. Stale variant alert R03-04. |
| Type `1`; Explain before answering → confirm; advance all 4 steps of `8 + 5` | Explicit warning; draft retained; initial 8/5, split 2/3, full ten-frame plus 3, final 13 agree. NB/EN switching retains the final step. |
| Submit `13` after explanation | Correctly described as answered after explanation. |
| Easier pending → More like this | Pending within-ten choice silently lost; next `9 + 4`, R03-04. |
| Skip `9 + 4` with Another question; leave `7 + 6` typed but unsubmitted; finish | Summary correctly counts 2 answered, 1 skipped, 1 unfinished. |
| Addition check intro → start → independent `7 + 3 = 10` | Policy clear; advances to `5 + 4` without inline correctness feedback. |
| Open Home while check is active | Blank app, R03-01. Recovered via check URL and reload. |
| Help request at check question 2 → explicit switch → answer `9` without opening a support panel | Supported mode displayed; immediate correct feedback. |
| Next on unanswered question 3; Skip question 4 | Summary separates independent/supported segments but calls question 3 unfinished, R03-05. Summary inspected in both languages. |
| `x + 3 = 7`: submit `4+0`, correct input to `x = 4`, submit with Enter | Invalid input distinct from math response; first-success outcome retained. |
| Open equation explanation after answering; advance all 4 steps | Earlier success not relabelled; final substitution-picture mismatch R03-06. |
| Resize solved equation through all 3 sizes, switch both languages at each | Answer/step retained; DOM dimensions and broken ARIA target saved in JSON. |
| New `8 + 5` → Read in lesson → worked solution → return → answer `13` | Erroneous no-help result, R03-02. |
| `9 + 4`: `12` → feedback → `13` | Correct-after-feedback outcome shown in session and progress. |
| Type `1` for next `7 + 6`, finish; open actual progress and Home | Draft cannot be resumed through the displayed history; older algebra offered for Continue, R03-07. |
| Actual progress with mixed check and practice; sample progress NB/EN | Separate practice aggregates and clear sample labelling; check mode boundary absent in history, R03-05. |
| Within-five: unavailable easier action; More like this four times | Limit explained. Fifth delivery explicitly labelled repeat with four-question pool notice. |
| 820 × 1180 keyboard simulation: focus `2 + 2`, press simulated `4`, open help, submit with simulated Check | Input `4` retained and accepted. Measured field/button bottom about 435 px, simulated keyboard begins at 802 px. This is a simulation only. |
| Profile setup entry | Inspected displayed fields/copy; no credentials entered or profile created. |
| Start another addition check, open Home before answering | Independently reproduces blank Home; errors and screenshot saved. |

### Accessibility and checks not completed

- A small read-only DOM audit checked page horizontal overflow, enabled button dimensions and missing `aria-labelledby` targets. Its actual results are in [responsive-dom-checks.json](responsive-dom-checks.json). This is not axe, a WCAG audit or a screen-reader test.
- Axe-core was **not run**: it is not installed as a project dependency, and the exposed browser automation surface has read-only DOM evaluation and no documented script injection or axe capability. No alternative browser driver was used. The prototype's prior axe claims remain unverified.
- Actual iPad Safari, touch, real on-screen keyboard, rotation on hardware, VoiceOver, an external iPad keyboard, browser zoom and reduced-motion emulation were **not tested**. No physical iPad or those test surfaces were available. CSS has a reduced-motion guard; that is source evidence only.
- The full matrix was not repeated for every route or every intermediate state. Light mode is unverified as stated above. No learner or educator sessions were conducted, and no claim of comprehension or teaching effectiveness follows from this review.
- Profile creation, sign-in/recovery, guest import, credential download, contribution dialogs/submission and the derivative preview were not exercised end to end. Relevant source was inspected where listed below. No production persistence or security behavior was evaluated.

### Material inspected

Requirements/context read: root `AGENTS.md`; `docs/vision.md`; `docs/product-principles.md`; `docs/design/design-principles.md`, `learning-experience.md`, `exercise-experience.md`; `docs/learning/mastery.md`, `learning-model.md`; `docs/architecture/architecture.md`, `exercise-format.md`; the retrieved sections of `exercise-capability-model.md` (the large terminal output was truncated, so this is not a claim of a complete capability-model audit); `docs/architecture/proposals/lesson-markdown-and-delivery.md`; ADR 0006 and ADR 0008; `docs/reviews/round-02/synthesis.md` for historical context only.

Prototype notes read after forming the principal browser/source findings: `HANDOFF.md` and all four files under `docs/iteration-2/`: `CHANGELOG.md`, `REQUIREMENTS-CHECKLIST.md`, `ASSUMPTIONS.md`, `USABILITY-TEST-SCRIPT.md`.

Prototype source inspected directly: `src/App.jsx`, `store.jsx`, `styles.css`; `src/pages/Practice.jsx`, `Home.jsx`, `Lesson.jsx`, `Profile.jsx` (retrieved setup, email, sign-in, recovery/settings sections; some initial combined output was truncated), `Preview.jsx`; `src/components/ExerciseShell.jsx`, `Markdown.jsx`, `Page.jsx`; all four mathematical component files (`Counters.jsx`, `Visuals.jsx`, `TenFrame.jsx`, `MathExpr.jsx`); all six domain files (`math.js`, `numbers.js`, `notation.js`, `practice.js`, `explanations.js`, `observations.js`); the topic/lesson/check/skill-link portion of `src/content/catalog.js`; both English lesson Markdown files; targeted outcome, disclosure, challenge, profile and history strings in `src/i18n-iteration2.js`; and `tests/domain.test.mjs` in full. Norwegian lesson text was also inspected in the rendered lesson. `package.json` was inspected for scripts and dependencies. The complete source tree was inventoried with `rg --files`; generated theme tokens/types and the remaining marketing/library page implementations were not audited line by line.

**Readiness boundary:** Retain the visual direction and the working practice behaviors. Resolve R03-01/02 before presenting the end-to-end journey as trustworthy; settle the concrete interaction/evidence corrections in R03-03 through R03-07 when porting those flows. Validate accessibility and actual iPad use independently before release. Passing seven domain tests and a build does not establish those UI contracts.
