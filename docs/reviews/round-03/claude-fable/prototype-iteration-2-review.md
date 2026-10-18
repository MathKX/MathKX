# Independent review of the learner prototype, iteration 2

**Reviewer:** Claude (Fable 5.1, as reported by the session running this review).
**Date:** 2026-10-18.
**Baseline:** commit `a6a3abae64d09250af47cf663392dda1838f227f` ("Updates", 2026-10-18 12:37 +0200), branch `claude/mathkx-prototype-review-f88aad`, working tree clean before and after the review (`npm ci` and `npm run build` changed nothing tracked; `dist/` is ignored).
**Scope:** `Prototype/mathkx-designsystemet` judged against the current repository requirements. No application code, requirements, schemas, ADRs or other reviewers' files were changed. Nothing was committed, pushed or published.

## Verdict

The prototype matches the written requirements far more closely than iteration 1 did. The help-versus-explanation split, the explicit answer reveal, the ordered support tags, the practice controls, the honest session summary and the self-check policy all behave as the design documents describe, in both languages and at all three requested sizes. It is a credible design reference for production.

It is not free of problems. One of them is a hard crash: once a learner has taken a self-check, the learner home and the skill-progress page render a blank application. Several others are places where the summary or the next-question controls say something slightly different from what the code did. None of them changes the overall direction, but the crash and the "More like this" behaviour should be fixed before anyone runs the usability script.

## What I inspected and ran

Read first: `AGENTS.md`, `docs/vision.md`, `docs/product-principles.md`, `docs/design/design-principles.md`, `docs/design/learning-experience.md`, `docs/design/exercise-experience.md`, `docs/learning/mastery.md`, `docs/architecture/proposals/lesson-markdown-and-delivery.md`, ADR 0006, `docs/reviews/round-02/synthesis.md` (context only), then the prototype's `HANDOFF.md`, `docs/iteration-2/*.md`, every file under `src/` and `tests/`.

Commands run in `Prototype/mathkx-designsystemet` (Node 22.19.0, npm 11.2.0):

| Command | Outcome |
| --- | --- |
| `npm ci` | 212 packages installed; npm reports 5 high-severity audit findings in dependencies (not investigated, not relevant to the design). |
| `npm test` | 7 of 7 node tests pass. |
| `npm run build` | `dist/index.html` built (910 kB, one file). |
| `npx vite preview --port 4173` | Served the built file to the desktop app's built-in browser (Chromium engine). |
| Node probe of `suggestNext` with a check session | Reproduces the crash cause (finding 1). |

Browser checks on the built file, all performed by me (clicked, read page text, measured with JavaScript, screenshots): 390×844, 820×1180 and 1180×820 emulation; dark and light colour scheme; Norwegian Bokmål and English; axe-core 4.10.2 injected from cdnjs and run with the WCAG 2 A/AA, 2.1 AA and best-practice rule sets on eight routes at 820 px, light. The complete list of flows is in the verification log at the end.

What I could not run, and why: no real iPad or Safari (desktop emulation is not device testing); no VoiceOver or other screen reader; no learners or educators; the Playwright run the prototype's checklist refers to (there is no Playwright script or configuration in the repository, so its "✓ tested" entries cannot be reproduced); the ID-reminder file download (no download prompt in the automated browser).

A note on what "verified" means below: "verified" means I did it in the running prototype or in Node; "inferred" means I read it in the source and did not exercise it.

## Findings

Severity: **High** blocks a usability session or misleads the learner about their record; **Medium** is a concrete requirement mismatch or a visible defect; **Low** is wording, polish or a minor inconsistency.

### 1. Learner home and progress page crash after a self-check (High, verified)

After I finished the addition check, opening `#/home` rendered an empty page; the console shows `TypeError: Cannot read properties of undefined (reading 'title')`. Because React unmounts the whole tree on an uncaught render error, every later hash navigation also stays blank until the page is reloaded. The same happens on `#/progress/arithmetic.add-within-20` while the check is the most recent session for the skill.

Cause (confirmed in Node): [observations.js `suggestNext`](../../../../Prototype/mathkx-designsystemet/src/domain/observations.js) takes the latest session for the skill regardless of mode. For a check session it returns `{ kind: 'same', variant: 'check' }`, and [Home.jsx `SuggestionCard`](../../../../Prototype/mathkx-designsystemet/src/pages/Home.jsx) then reads `variants['check'].title`. The labelled sample history has no check session, so the demo profile never shows this.

Smallest fix: exclude `mode === 'check'` sessions in `suggestNext` (the progress page already excludes them for counts), add a domain test with a check session, and wrap pages in an error boundary so a bad record never blanks the whole application. The usability script's task 8 (check) followed by task 7/10 (home) hits this path.

### 2. "More like this" silently discards a pending easier/harder choice (Medium, verified)

On 8 + 5 I pressed **Make it easier**; the panel showed "Next: Addition within ten" with an undo button. I then pressed **More like this**. The next question was 9 + 4 (still across ten), the pending tag disappeared, and the only notice was "Your work on 8 + 5 is saved." The learner's stated choice was dropped without a word.

Cause: [store.jsx `next()`](../../../../Prototype/mathkx-designsystemet/src/store.jsx) sets `pending: null` for both `'another'` and `'same'`, but only `'another'` uses the pending variant. The learning-experience policy says to "explain what changes" and to apply the change to the next question. Either keep the pending change until it is applied, or state in the notice that "More like this" kept the current variation and the change is still pending.

### 3. A misleading "session in progress" prompt appears after a challenge change (Medium, verified)

After the easier change was applied (question 3 became 4 + 4, "Addition within ten"), the page showed an alert: "You have a session in progress with 'Addition within ten'. Continue it, or start a new one with 'Addition across ten'?" The learner did not ask for across ten; the URL still carried `?variant=across-10` from the original link, and [Practice.jsx](../../../../Prototype/mathkx-designsystemet/src/pages/Practice.jsx) compares that against the current question's variant. The prompt invites the learner to abandon the session they are in. Compare the requested variant against the session's starting variant, or clear the query once the session has started.

### 4. Balance explanation: picture and equation disagree on the last step (Medium, verified)

For x + 3 = 7, step 3 shows x alone on the left and four ones on the right with "x = 4" (correct). Step 4 shows the same picture (accessible text: "Left side: x", "Right side: 4 ones") while the equation and text are "4 + 3 = 7 — Check: put 4 in place of x." The requirement is that picture, equation and text agree at every step. [explanations.js](../../../../Prototype/mathkx-designsystemet/src/domain/explanations.js) gives both last steps `phase: 3`. Either add a substitution picture (the box replaced by four ones, three ones beside it, seven on the right) or make step 4 text-only and say so. The 8 + 5 and 4 + 4 explanations agree at every step (verified for all four and three steps respectively, including the accessible ten-frame description "8 places from the first number and 2 from the second, 0 empty").

### 5. Counting help reveals the total but is recorded as visual help (Medium, verified; needs an owner decision)

In the 4 + 4 help, "Help me count" then "Count on from 4" and four more taps number every counter 1 to 8 and the panel says "You have counted 8 counters." The total is on screen. The event is logged as `counting-complete`, which [observations.js](../../../../Prototype/mathkx-designsystemet/src/domain/observations.js) classes as teaching help, so the outcome is "Correct with visual help", and the session summary and progress page show it that way.

[exercise-experience.md](../../../../docs/design/exercise-experience.md#addition-example) says: "If a later step explicitly reveals the total, treat it as an answer reveal rather than an independent answer." The same document also says help may let the learner count, so there are two defensible readings; the prototype's `ASSUMPTIONS.md` does not list this one. Record the decision explicitly. If the current labelling stays, the "What do the labels mean?" definition of "Correct with visual help" should say that the help may have shown the total.

### 6. The final 8 + 5 equation is cut off at phone width (Medium, verified)

At 390 px the step-4 equation `8 + 5 = 8 + 2 + 3 = 10 + 3 = 13` overflows its container (measured scroll width 426 px against a 317 px box). The visible part ends at "10 ·"; the conclusion "= 13" is only reachable by horizontal scrolling, with no visible scrollbar in the dark theme and no hint that there is more. This is the one step the whole explanation builds towards. Allow the MathML row to wrap, split the final step into two lines, or reduce the font at narrow widths. 820 px and 1180 px are fine.

### 7. Guest work absorbed into a new profile is not labelled (Medium, verified)

The change log and checklist say guest work "becomes part of the profile (still marked `guest`)" and the UI shows "guest work" tags. Creating a profile with 62 guest events kept `prov: 'guest'` on every event (checked in `localStorage`), but neither the home page nor the progress page shows a tag for them; both only tag `prov === 'guest-import'`. The [store.jsx `createProfile`](../../../../Prototype/mathkx-designsystemet/src/store.jsx) mapping is also a no-op (`e.prov === 'guest' ? 'guest' : e.prov`). After creation, new work is `profile` and old work is `guest`, but the learner cannot see the difference. Tag `guest` the same way as `guest-import`, or drop the claim from the docs. The sign-in import path does label imported work correctly (verified: "gjestearbeid" tag on the imported 4 + 4).

### 8. After importing guest work, the suggestion and the continue card disagree (Low, verified)

Signed in to the demo profile with a guest session imported: the continue card correctly resumes the profile's own 9 + 4, but the suggestion card says "Continue the unfinished session — your session with Addition within ten stopped before you answered", which is the imported guest session, and its button leads to the profile's active 9 + 4 session. The imported session also shows "not finished" on the progress page although the store marked it `endedAt`, because no `session-end` event was logged. Log a session-end event on import (with provenance) or exclude imported sessions from `suggestNext`.

### 9. "Start new: …" abandons the current session without ending it (Low, verified)

Choosing "Start new: Addition within five" on the session-in-progress prompt replaced the active session. The abandoned one got no summary, no session-end event, stays "not finished" in history, and cannot be resumed from the home page because the active pointer now names the new session. Either end it (and show the summary) or keep it resumable.

### 10. "Correct in the end" in the session summary includes revealed answers (Low, inferred)

[Practice.jsx `SessionSummary`](../../../../Prototype/mathkx-designsystemet/src/pages/Practice.jsx) counts every outcome starting with `correct`, so "Answered after explanation" is counted among "{n} correct in the end" in the lead sentence. The per-question rows are honest, but the headline number presents an answer typed after the solution was shown as a correct answer. [mastery.md](../../../../docs/learning/mastery.md#learner-facing-summaries) asks that reveals never read like independent success. Exclude `correctAfterExplanation` from that count or word it as "answered".

### 11. Wording and labels (Low)

- Verified: English progress page reads "1 answers could not be read" (`progress.invalid`). Norwegian is fine.
- Verified: The reveal confirmation says the exercise "is recorded as solved after the explanation" while the label everywhere else is "Answered after explanation". Use one phrase.
- Verified: On the last check question in supported mode, both **See summary** and **Skip** are offered before answering; they produce different records ("Unfinished" versus "Skipped") for the same action. Offer one.
- Verified: The learning-experience table prescribes the action label "Check my understanding / Sjekk forståelsen min". The topic and lesson pages use "Take a short check / Ta en kort sjekk" and the page title is "Check understanding"; only the session summary uses the prescribed label.
- Verified: While a check run is in the `done` state, "Take a short check" from the topic page opens the previous run's summary, not the policy screen; the learner must find "Take a new check".
- Inferred: when the explanation is opened after an incorrect answer and the next answer is correct, both tags "Answered after explanation" and "Explanation opened after answering" are shown (`explanationAfter` is set whenever an explain event follows the first mathematical response). Not wrong, but noisy.
- Inferred: `aria-pressed` on the easier/harder buttons compares the pending variant with one step from the *current* variant, so after two presses in the same direction the pressed state is not reflected.

### 12. Touch targets below the stated 44 px (Low, verified at 390 px)

Breadcrumb links are 23 px high, prerequisite tag links 18 px, and the `data-size="sm"` buttons on the lesson page ("Suggest an improvement", "Edit lesson source", related-skill buttons, section navigation) are 42 px. The design principle sets 44 px for primary actions; the contribution buttons are the lesson's main route to contributing. All exercise, check, practice and profile controls measured 44 px or more (the easier/harder buttons are 69 px).

## Area-by-area assessment

### 1. Help versus explanation

Works. The two buttons are visibly and textually distinct ("Visual help – while you try" versus "Explanation – the full solution"). Opening the explanation before answering shows a confirmation that names the consequence and offers visual help instead (verified in both languages). Help steps for 8 + 5 end at "10 + 3 = ?" and never state 13 (the node test also checks this for every instance). Explanation after a correct answer adds "Explanation opened after answering" and leaves the outcome "Correct with visual help" unchanged (verified on the summary, home and progress pages). Switching to English mid-explanation kept step 4 of 4, the typed answer and the open panel. Problems: findings 4, 5, 6 and the wording items in 11.

### 2. Self-checks

Works. The policy screen lists scope, count, no help, feedback at the end, one saved answer, the switch rule, accessibility and the snapshot caveat before "Start the check". Wrong answers advance with no feedback. "I need help" opens an explicit switch block naming the exercise from which work becomes supported; after switching, the mode tag changes and help, explanation and feedback appear. The summary separates "Correct on your own (1)", "Worth revisiting (1)", "Skipped (0)" and "Supported practice (from exercise 3)", with the supported rows carrying normal practice outcome tags and a note that they are not part of the independent result. Links to lesson sections are given for every non-independent-correct item. Problems: finding 1 (crash afterwards) and the small items in 11.

### 3. Practice and challenge

Mostly works. All five actions are present with the prescribed labels in both languages. Easier/harder is applied to the next question, the current question and typed answer stay, a pending tag and undo are shown, and the new variation is named concretely ("Now: Addition within ten"). Unavailable directions are stated honestly ("Addition within five is the easiest variation in the prototype…", "two-digit addition has not been made yet"). After the four questions in "Addition within five" the fifth is tagged "repeat" with the notice "You have seen all 4 exercises… This one is a repeat – the prototype has no more." Invalid input ("fire") gets a readable-input message and is not a mathematical response; a wrong answer (12 for 9 + 4) gets a specific off-by-one message; the correct retry is "Correct after feedback". The summary separates answered, skipped and unfinished. Problems: findings 2, 3, 9, 10.

### 4. Progress

Works as a record, not an assessment. Outcome labels are defined on the progress page, the definitions follow the event order, and the sample history exercises every label ("Correct on first response, no help", "with visual help", "after feedback", "Answered after explanation", "Explanation opened after answering", "Skipped", "Unfinished", "Lesson viewed"). Lesson history is "viewed" only. No percentages, thresholds or badges. The home page's continue card names the actual question and the typed-but-unchecked answer. Suggestions carry a reason and the "a suggestion, not a requirement" note. Problems: findings 1, 7, 8 and the plural in 11.

### 5. Tablet workspace

Verified by emulation only. At 390 px the panel stacks under the task; at 820 px likewise; at 1180 px the panel sits beside the task. With the simulated keyboard on at 820×1180, the answer field (y 412–467) stays above the keyboard (top at 802 px). The real `visualViewport` detection could not be exercised. axe-core reported no violations on the practice page with the explanation open, the lesson, home, check summary, profile setup, library, topic and derivative preview (820 px, light); the only "needs review" item was colour contrast on the derivative page, which axe could not decide automatically. Dark and light themes both render correctly; the lesson's ten-frame image keeps a white box in dark mode by design. Problems: finding 6 and the small targets in 12. Real iPad, VoiceOver and rotation remain untested, as the prototype's own notes say.

### 6. Beyond elementary arithmetic

The derivative page is clearly marked "Design preview", states that nothing is saved, and offers tap bands, arrow buttons and direct entry. Powers, fractions, primes, subscripts and limits render as MathML; `\sqrt{2}` shows verbatim with "notation not supported yet". The landing page tags domains "1 topic ready in the prototype", "Design preview" or "Planned". No issues found beyond what the prototype already labels as preview.

### 7. Lessons and contribution

The lesson renders the proposed directives (`ten-frame-explorer`, `make-ten`, `balance`, `example`, `practice`), the asset image with its alt text as caption, the six-pair table and inline maths. "Read in the lesson" from 4 + 4 opened the "What are number bonds" section with a return banner; returning restored the typed "7" and the open help panel (verified). "Suggest an improvement" produces a preview showing lesson id, version, language, section and file, lists what is not included, and says nothing is sent. "Edit lesson source" shows the proposed folder and the files, states the folder is not in the repository yet, and links to the repository home. The prototype keeps lessons under `src/content/lessons`, not the proposal's `content/lessons`, and its `lesson.json` points at a schema that is "proposed, not yet written"; both are labelled honestly. Not a conflict, but the proposal's precondition (schema under `schemas/` before real lesson files) still applies when this content moves.

### Profile and recovery

Verified in Norwegian: step 1 explains that no personal details are required, shows the ID as a username and the password as the only secret; step 2 blocks "Continue" until the learner confirms they saved the ID; step 3 explains the no-email consequence; an invalid address is rejected; three wrong codes lock the code field and the verify button with an explanatory message; "Send new code" unlocks; "Change the email address" and "Verify later" exist; step 4 shows the pending state; Settings shows pending email with finish/change/remove; sign-out and sign-in with the demo profile work; the sign-in guest-work choice imports with a visible label. Problems: findings 7 and 8; the pending-email line runs the tag and the sentence together ("Venter på bekreftelse test@example.com er ikke bekreftet ennå").

## Conflicts and claims to be aware of

- Counting help versus the "treat a revealed total as an answer reveal" sentence in `docs/design/exercise-experience.md` (finding 5). The prototype's `ASSUMPTIONS.md` does not record this as a decision.
- `REQUIREMENTS-CHECKLIST.md` marks "Guest work on create / sign in … 'guest work' tags ✓". On create there is no visible tag (finding 7).
- `CHANGELOG.md` and the checklist describe Playwright runs; no Playwright code is in the repository, so those entries are the prototype's own claims, not reproducible evidence. The seven node tests are the only automated checks, and they pass.
- `CHANGELOG.md` says "axe-core clean on all main routes". I reproduced zero violations on eight routes in one configuration (820 px, light). I did not run axe in dark mode or at 390 px.
- The learning-experience action label for checks differs from the topic and lesson pages (finding 11).
- The lesson proposal's layout (`content/lessons/<id>/`) and schema precondition are not yet met by the prototype, which the prototype states itself.

## What is in good shape

Support is recorded in the right order and never relabels an earlier answer. The reveal is explicit. Variations are named, not numbered. Repeats are honest. Summaries describe rather than grade. Language switching keeps the work. Profiles separate ID from password and explain the no-email consequence. These match `vision.md`, `product-principles.md`, `learning-experience.md`, `exercise-experience.md`, `mastery.md` and ADR 0006 as written.

## Suggested order of fixes before a usability session

1. Finding 1 (crash) with a test and an error boundary.
2. Findings 2 and 3 (practice controls saying one thing and doing another).
3. Finding 6 (clipped final equation at phone width).
4. Findings 4, 7, 10 and the wording items, then decide finding 5 and record it in `ASSUMPTIONS.md`.

## Verification log

Every browser step was performed on `dist/index.html` served at `http://localhost:4173`, dark scheme unless noted.

| Check | Size / lang | Outcome |
| --- | --- | --- |
| Landing page renders, no console errors | 390, nb | OK |
| Practice across ten: Explain before answering → confirmation shown; "Try visual help first" → help opens, tag "Visual help before answering" | 390, nb | OK |
| Help steps 1–3 for 8 + 5; step 3 is "10 + 3 = ?" | 390, nb | OK, total not shown |
| Answer 13 → "Correct. 8 + 5 = 13." outcome "Correct with visual help" | 390, nb | OK |
| Explain after answering → tag "Explanation opened after answering"; steps 1–4; step 4 picture 8 + 2 in frame, 3 loose; accessible frame description | 390, nb | OK; equation overflow measured (finding 6) |
| Switch to English mid-explanation; step 4 kept, answer kept | 390, en | OK |
| Make it easier → pending tag + undo; then More like this | 390, en | Pending dropped silently (finding 2) |
| "fire" → input message; 12 → off-by-one message; 13 → "Correct after feedback" | 390, en | OK |
| Make it easier → Another question → 4 + 4, "Now: Addition within ten" | 390, en | OK, but session-in-progress alert appears (finding 3) |
| Another question without answering → "4 + 4 was recorded as skipped" | 390, en | OK |
| Finish → summary "4 exercises: 2 answered (2 correct in the end), 1 skipped and 1 unfinished", rows with tags | 390, en | OK |
| Home: suggestion with reason, skill counts, recent list | 390, en | OK |
| Progress page: counts, session rows with answers, label definitions | 390, en | OK; "1 answers" plural |
| Sample history `?sample=1`: all labels present, suggestion text | 390, en | OK |
| Check: policy screen; Q1 10 → advance; Q2 8 → advance silently; Q3 "I need help" → switch block → supported mode; help + 13 → "Correct with visual help"; Q4 Skip → summary groups | 390, en | OK |
| Home after check | 390, en | Blank page, TypeError (finding 1); reproduced on progress page; Node probe confirms cause |
| Practice within ten: type 7, open help, "Read in the lesson" → section + return banner → back: value 7 and panel restored | 390, en | OK |
| Counting help: count on from 4, count to 8, "You have counted 8 counters"; answer 8 → "Correct with visual help" | 390 and 820, en | Total shown (finding 5) |
| Layout with help open | 820×1180 | Stacked, OK |
| Layout with help open | 1180×820, dark and light | Side by side, OK |
| Algebra x + 3 = 7: 10 → "added 3" message; "x = 4" accepted → "Correct after feedback"; explanation steps 1–4 with accessible side descriptions | 390, en | Step 4 picture mismatch (finding 4) |
| Simulated keyboard on; answer field and keyboard positions measured | 820×1180, en | Field visible above keyboard |
| Derivative preview: text, graph, notation list, `\sqrt{2}` notice | 820, en, light | OK |
| axe-core on derivative, practice (explanation open), lesson, home, check summary, profile/new, library, topic | 820, en, light | 0 violations each; contrast "needs review" on derivative only |
| Lesson in dark mode at phone width | 390, en, dark | OK |
| Within five: 4 questions then repeat tag and notice | 390, en then nb | OK |
| Check summary, home, balance lesson in Norwegian | 390, nb | OK, no untranslated strings seen |
| Profile: create (guest work absorbed), confirm-saved gate, email invalid, code wrong ×3 → locked, resend, verify later, step 4, Settings | 390, nb | OK; no guest tag on absorbed work (finding 7) |
| Sign out; one guest practice; sign in to demo profile with import | 390, nb | Import tagged; suggestion/continue mismatch (finding 8) |
| Suggest an improvement: form, preview content, "not included" list; Edit lesson source dialog and link | 390, nb | OK |
| Touch-target measurement of interactive elements | 390 | Lesson page: 15 under 44 px (finding 12); practice: breadcrumb only; profile: none |
| Working tree after `npm ci`, `npm test`, `npm run build` | — | Clean |

Not run: real iPad Safari, VoiceOver, rotation on a device, learners, educators, translators, Playwright, axe in dark mode or at 390 px, the ID-reminder download.
