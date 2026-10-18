# Assumptions, simulated behaviour and test status

## Simulated behaviour

- **Exercise generation.** Each variation is a short, reviewed list of questions (4–8) standing in for a versioned generator. “Another question” walks the list in a fixed order, avoiding questions already seen in the session. When the list is used up, questions repeat and are marked as repeats. Instance ids look like `across-10@v1#0`; there is no seed or C# generator yet. The prototype does not promise unlimited unique questions.
- **Variation ladder.** Addition within five → within ten → across ten; x + a = b up to 10 → up to 20. The ladder is an authoring choice for the prototype, not a calibrated difficulty model.
- **Observations.** Events are stored in order in the browser (`localStorage`). Summaries are derived from the event order. This is not the production observation schema and has no idempotency, server ordering or retention rules.
- **Suggestions.** A few readable rules over the learner's own latest practice session (continue unfinished, more of a variation after feedback or a reveal, optional challenge after three first-response successes). Checks and imported guest work are not used. Not a recommendation engine and not a mastery judgement.
- **Profiles and sign-in.** IDs are generated in the browser; passwords are hashed with a toy hash and stored in `localStorage`. Not security. Demo profile: `MKX-DEMO-4K7P` / `tiervenner10` (contains labelled example history).
- **Email verification.** No email is sent. The code is always `246810`; three wrong codes lock verification until a new code is requested.
- **Recovery.** Screens explain options; nothing is looked up or sent.
- **Guest work.** Kept in this browser only. When a profile is created it becomes part of the profile (still marked `guest`, and tagged “guest work” in the views); when signing in, the learner chooses to import it (marked `guest-import`, its open sessions ended as history) or discard it.
- **Lesson disclosure.** Whether a lesson shows an exercise's answer is decided by a simple text rule over the lesson's maths and visual directives (`src/domain/disclosure.js`). A real implementation would declare this in lesson metadata.
- **Contribution.** Suggestions build an issue preview; nothing is sent. “Edit lesson source” links to the repository home page because the lesson folders are not in the repository yet.
- **On-screen keyboard.** The switch shows a simulated keyboard. Real detection uses `visualViewport` and has not been tried on an iPad.
- **ID reminder download.** Uses the host’s download capability when published as an artifact; otherwise a normal browser download.

## Requirements the prototype follows (not assumptions)

- An explanation can be opened before answering, with the answer reveal made explicit (`exercise-experience.md`).
- An easier/harder change is chosen now and applied to the next question; the current question and work stay (`learning-experience.md`).
- Counting all the counters in visual help reveals the total and is recorded as an answer reveal (`exercise-experience.md`, addition example).

## Assumptions that should be confirmed

1. Independent self-checks without in-check help, plus an explicit switch to supported practice, is the right default policy for the first release.
2. Moving on from an unanswered question counts as “skipped”; finishing a session with an unanswered question counts as “unfinished”, and that question stays resumable from My learning with its draft and support context.
3. “Lesson viewed” (opened) is enough lesson history; no reading-progress tracking.
4. The suggested “more challenge” rule (three first-response successes in a row) is acceptable wording-wise as a suggestion, not a threshold.
5. Guest work should be imported only by explicit choice at sign-in and keep a visible origin label.
6. The notation grammar (TeX-like subset) is a sensible starting point for lesson authors; square roots, matrices and alignment are deliberately excluded for now.
7. The learner ID is a username, not a secret; the password is the only secret in the prototype.
8. **Explanation steps.** Opening the explanation is help; reaching a step marked `reveals` is an answer reveal. Opening and closing it before that step gives “Correct with help”.
9. **Lesson detours.** A lesson counts as showing the answer only when it contains this exercise with its result, or a worked visual for the same values (`src/domain/disclosure.js`). The whole lesson is checked, not only the linked section, because the learner can scroll. Other lesson reading before answering is recorded as help (“Correct with help”).
10. **More like this** keeps the current variation. If an easier/harder change is pending, it is replaced, and the button and the notice say so.
11. **“While solving” versus “after”.** Support is described relative to the first correct answer. Help used after an incorrect answer counts as help while solving.
12. **The profile is created when step 1 is submitted**, before the learner confirms they saved the ID, so an interrupted setup keeps the ID and guest work. The setup banner asks the learner to finish.
13. **Changing a confirmed recovery email** keeps the old address in use until the new one is confirmed.
14. **Lesson visits.** Opens of the same lesson less than 30 minutes apart count as one visit.
15. **New outcome “Correct with help”** for help that is neither visual help nor an answer reveal. Whether learners need this distinction from “Correct with visual help” is a question for the usability sessions.

## Open decisions (not settled by this prototype)

- Authentication technology, credential format, recovery codes versus email, session handling, deletion and retention (ADR 0006).
- Production observation schema, idempotency and event ordering on the server (PostgreSQL per ADR 0008).
- Generator definitions, seeds and versioning for each variation; deduplication policy.
- Lesson metadata schema (`lesson.json`), Markdown dialect, notation grammar and validation tooling.
- Assessment/disclosure policy for checks beyond this prototype default.
- Real routing (hash routes are used so the prototype is one file).
- Whether Tailwind Preflight stays alongside Designsystemet base styles.

## What was actually tested

The checks can be run again from the prototype folder:

```bash
npm test                 # domain checks (node --test): 16 tests
npm run build
npx playwright install chromium   # once
npm run test:browser     # 20 browser scenarios + axe, 4 configurations
```

- **Domain checks** (`tests/domain.test.mjs`): notation, locale number parsing, the 8 + 5 steps, explanation/validator agreement for every prototype instance, no answer before the revealing step, refusal outside supported values, finite pools and the ladder, observation ordering, and the round-03 cases (check sessions and suggestions, lesson disclosure in both languages, counting and explanation reveals, the balance check step, check segments, resumed questions, tags).
- **Browser checks** (`tests/browser/review-checks.mjs`): 20 scenarios that repeat the reviewers' steps (Claude, Codex and Gemini), in Chromium (Playwright) on the built file, in four configurations: Bokmål 820 × 1180 light, English 390 × 844 dark, English 1180 × 820 light, Bokmål 390 × 844 dark. Selectors come from the app's own strings, so each scenario runs in both languages. They fail on console errors.
- **Accessibility:** axe-core 4.10 (WCAG 2 A/AA, 2.1 AA, best practice) on 13 routes, with visual help open on the practice page, in all four configurations: no violations. Plus checks for missing `aria-labelledby` targets, sideways page scroll at 390 px, and 44 px targets on the lesson page.
- **Last run:** 18 October 2026 in the cloud workspace: 16/16 domain tests, 80/80 browser checks. The browser checks were also run against a deliberately broken build to confirm that they catch the crash and the lesson reveal.
- **Not covered by the scripts:** the three-wrong-codes lock, recovery, the ID-reminder download, and the artifact host wrapper. These were checked by hand in Chromium during iteration 2 only.

## What still needs people or devices

- **iPad Safari** with touch and the real on-screen keyboard: field visibility, Check reachable, rotation mid-exercise, zoom, external keyboard.
- **VoiceOver** (and another screen reader): MathML reading of expressions, live feedback, step players, graph alternatives.
- **Learners** (including the 14-year-old the project started from): whether the help/explanation distinction, challenge wording and progress labels are understood.
- **Educators:** mathematical and teaching review of the lesson, explanations, feedback messages and the variation ladder.
- **Translators:** natural Norwegian and English wording, especially progress labels and policy texts.
- Real network conditions, a real download prompt on iPad, and printing are untested.
