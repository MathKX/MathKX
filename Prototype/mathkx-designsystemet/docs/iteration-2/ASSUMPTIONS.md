# Assumptions, simulated behaviour and test status

## Simulated behaviour

- **Exercise generation.** Each variation is a short, reviewed list of questions (4–8) standing in for a versioned generator. “Another question” walks the list in a fixed order, avoiding questions already seen in the session. When the list is used up, questions repeat and are marked as repeats. Instance ids look like `across-10@v1#0`; there is no seed or C# generator yet. The prototype does not promise unlimited unique questions.
- **Variation ladder.** Addition within five → within ten → across ten; x + a = b up to 10 → up to 20. The ladder is an authoring choice for the prototype, not a calibrated difficulty model.
- **Observations.** Events are stored in order in the browser (`localStorage`). Summaries are derived from the event order. This is not the production observation schema and has no idempotency, server ordering or retention rules.
- **Suggestions.** A few readable rules (continue unfinished, more of a variation after feedback or explanation, optional challenge after three first-response successes). Not a recommendation engine and not a mastery judgement.
- **Profiles and sign-in.** IDs are generated in the browser; passwords are hashed with a toy hash and stored in `localStorage`. Not security. Demo profile: `MKX-DEMO-4K7P` / `tiervenner10` (contains labelled example history).
- **Email verification.** No email is sent. The code is always `246810`; three wrong codes lock verification until a new code is requested.
- **Recovery.** Screens explain options; nothing is looked up or sent.
- **Guest work.** Kept in this browser only. When a profile is created it becomes part of the profile (still marked `guest`); when signing in, the learner chooses to import it (marked `guest-import`) or discard it.
- **Contribution.** Suggestions build an issue preview; nothing is sent. “Edit lesson source” links to the repository home page because the lesson folders are not in the repository yet.
- **On-screen keyboard.** The switch shows a simulated keyboard. Real detection uses `visualViewport` and has not been tried on an iPad.
- **ID reminder download.** Uses the host’s download capability when published as an artifact; otherwise a normal browser download.

## Assumptions that should be confirmed

1. Explanations before answering should be allowed in practice, with an explicit reveal, rather than only after a first attempt.
2. Independent self-checks without in-check help, plus an explicit switch to supported practice, is the right default policy for the first release.
3. A learner choosing easier/harder sets the next question’s variation; the current question stays (rather than replacing it immediately).
4. Moving on from an unanswered question counts as “skipped”; finishing a session with an unanswered question counts as “unfinished”.
5. “Lesson viewed” (opened) is enough lesson history; no reading-progress tracking.
6. The suggested “more challenge” rule (three first-response successes in a row) is acceptable wording-wise as a suggestion, not a threshold.
7. Guest work should be imported only by explicit choice at sign-in and keep a visible origin label.
8. The notation grammar (TeX-like subset) is a sensible starting point for lesson authors; square roots, matrices and alignment are deliberately excluded for now.
9. The learner ID is a username, not a secret; the password is the only secret in the prototype.

## Open decisions (not settled by this prototype)

- Authentication technology, credential format, recovery codes versus email, session handling, deletion and retention (ADR 0006).
- Production observation schema, idempotency and event ordering on the server (PostgreSQL per ADR 0008).
- Generator definitions, seeds and versioning for each variation; deduplication policy.
- Lesson metadata schema (`lesson.json`), Markdown dialect, notation grammar and validation tooling.
- Assessment/disclosure policy for checks beyond this prototype default.
- Real routing (hash routes are used so the prototype is one file).
- Whether Tailwind Preflight stays alongside Designsystemet base styles.

## What was actually tested

All in this session, in headless Chromium (Playwright), using the built single-file prototype:

- **Routes:** every main route renders without console errors (17 routes).
- **Flows:** practice across ten (explanation confirm → visual help → correct answer → explanation after answer → language switch keeps step 4 of 4 → make it easier → another question → skip → finish → summary); self-check with two independent answers, switch to supported practice, help, skip and summary; lesson return from an exercise (typed answer kept); simulated keyboard; lesson source and suggestion preview; profile creation with guest work, interruption and resume, invalid email, three wrong codes, address change, verification, settings, sign-out, sign-in with guest-work choice into the demo profile; derivative preview with arrow selection and direct entry.
- **Viewports:** 390 × 844, 820 × 1180, 1180 × 820 (Chromium emulation, touch enabled), light and dark.
- **Accessibility:** axe-core 4.10 (WCAG 2 A/AA + best practice) on 13 routes plus practice with help and explanation open: no violations at 820 px light (Norwegian) and 390 px dark (English).
- **Domain checks:** `npm test` – 7 tests: notation symbol preservation, locale number parsing, 8 + 5 explanation steps, explanation/validator agreement for every prototype instance, refusal outside supported values, finite pools and ladder ends, observation ordering.

## What still needs people or devices

- **iPad Safari** with touch and the real on-screen keyboard: field visibility, Check reachable, rotation mid-exercise, zoom, external keyboard.
- **VoiceOver** (and another screen reader): MathML reading of expressions, live feedback, step players, graph alternatives.
- **Learners** (including the 14-year-old the project started from): whether the help/explanation distinction, challenge wording and progress labels are understood.
- **Educators:** mathematical and teaching review of the lesson, explanations, feedback messages and the variation ladder.
- **Translators:** natural Norwegian and English wording, especially progress labels and policy texts.
- Real network conditions, a real download prompt on iPad, and printing are untested.
