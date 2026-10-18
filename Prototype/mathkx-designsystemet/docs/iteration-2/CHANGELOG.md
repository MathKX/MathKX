# Prototype iteration 2 – change log

Purpose: increase confidence that the design matches current product requirements before production development. The visual identity, Designsystemet components, theme tokens and Tailwind layout are unchanged. No production infrastructure was added.

Requirement sources: [exercise experience](../../../../docs/design/exercise-experience.md) (EX), [learning experience](../../../../docs/design/learning-experience.md) (LX), [mastery and progress](../../../../docs/learning/mastery.md) (MA), [design principles](../../../../docs/design/design-principles.md) (DP), [lesson proposal](../../../../docs/architecture/proposals/lesson-markdown-and-delivery.md) (LP), [vision](../../../../docs/vision.md) (VI), [round-02 synthesis](../../../../docs/reviews/round-02/synthesis.md) (R2), [ADR 0006](../../../../docs/architecture/decisions/0006-support-profiles-without-personal-details.md).

## 1. Exercise explanation flow

| Change | Requirement |
| --- | --- |
| Separate actions: **Vis visuell hjelp / Show visual help** (support while trying, never shows the result) and **Forklar løsningen / Explain the solution** (full reasoning including the answer). | EX “Explaining why the result follows” |
| Explanation is available before answering and after correct or incorrect answers. Before answering, an explicit confirmation says the answer will be shown and offers visual help instead. | EX; R2 finding 1 |
| 8 + 5 explanation shows all four steps ending in `8 + 5 = 8 + 2 + 3 = 10 + 3 = 13`. Picture, equation and text come from one step object (`src/domain/explanations.js`) and are tested together. Previous/Next step buttons. | EX table; R2 finding 1 |
| x + 3 = 7 explanation now reaches `x = 4` and the substitution check. Groups explanation for 4 + 4 combines and counts the groups. | EX table |
| Support is recorded as ordered events. Opening an explanation after answering is shown as “Explanation opened after answering” and never relabels the earlier answer. | EX; MA “Progress tracking”; R2 finding 2 |
| The learner’s typed answer, open panel and explanation step survive language switching, rotation and visits to the lesson. | EX “Answering on iPad”; VI |
| Self-checks are independent by default. The policy (scope, support, feedback timing, accessibility, snapshot) is stated before starting. “I need help” opens an explicit transition to supported practice; answers already saved stay independent. | LX “Check understanding”; EX “Help during checks” |
| Explanations refuse values outside their supported range (for example 19 + 1) instead of drawing a plausible picture. | EX “Coverage” |

## 2. Continuing practice and adjustable challenge

| Change | Requirement |
| --- | --- |
| Practice is now an open session with **Another question / En oppgave til**, **More like this / Flere slike oppgaver**, **Make it easier / Gjør det enklere**, **More challenge / Øk utfordringen**, **Finish this session and continue later**. | LX “More practice and learner control” |
| Variations are named concretely: Addition within five → within ten → across ten; x + a = b up to 10 → up to 20. No level numbers. | LX “Adjusting challenge” |
| Easier/harder is chosen now and applied to the next question; the current question and work stay. The pending change is shown and can be undone. Visual help stays available in every variation. | LX |
| Honest limits: “no easier variation in the prototype”, “two-digit addition has not been made yet”, and a marked repeat once a finite pool is used up. | LX; VI |
| Session summary distinguishes answered, skipped and unfinished questions and never claims everything was solved. Offers a new session, easier/harder, or a check. | LX; MA |

## 3. Progress

| Change | Requirement |
| --- | --- |
| Descriptive observations per delivery: correct on first response without help, correct with visual help, correct after feedback, answered after explanation, not correct yet, skipped, unfinished, explanation opened after answering. Unreadable input is not a mathematical failure. | MA “Learner-facing summaries”; R2 finding 2 |
| Learner home: empty state for a new learner, “Continue where you left off” with the actual question and typed answer, a suggestion with a stated reason, skills practised, lessons opened, recent work. | MA; VI |
| Focused skill-progress page with label definitions and an explicitly labelled example history covering all required cases. | MA |
| “Lesson explored” (timer/scroll heuristic) replaced by a truthful “Lesson viewed”, explained as saying nothing about understanding. | R2 finding 6 |
| Checks are summarised separately from practice. No percentages, thresholds, badges or ranking of unaided over aided work. | MA |

## 4. Tablet workspace

| Change | Requirement |
| --- | --- |
| Exercise workspace: question, answer field, Check, feedback and support buttons in one compact block; help/explanation panel directly below at 390/820 px and beside it at ≥ 992 px. | DP “iPad and touch use” |
| Real on-screen keyboard detection (visualViewport) compacts the layout; a clearly labelled **simulated keyboard** can be switched on from the banner on exercise pages. Focusing the answer scrolls it into view; no sticky controls cover work. | DP; EX “Answering on iPad” |
| 44 px minimum targets for actions; no hover or dragging needed; derivative graph has arrow buttons and direct entry as alternatives to tapping. | DP |
| axe-core clean on all main routes and practice states (light 820 px, dark 390 px, both languages). | DP “Accessible by default” |

## 5. Beyond elementary arithmetic

| Change | Requirement |
| --- | --- |
| Design preview: derivative of f(x) = x² with tangent, slope triangle, value table, tap/arrow/direct-entry selection, a task and an explanation. Marked “Design preview”; nothing is saved as progress. | VI “Mathematical scope” |
| New notation grammar (`src/domain/notation.js`): powers, sub/superscripts, fractions (`\frac`, `a/b`), primes, Δ, ≤ ≥ ≠ →, `\lim`. Unsupported notation renders verbatim with a visible notice. | LP; R2 finding 3 |
| Locale-aware numeric input: decimal comma (nb) / point (en), grouping and out-of-range values rejected with specific messages, never silently changed. | VI; R2 finding 3 |
| Landing page shows what is ready, what is a design preview and what is planned, with a route for advanced learners. | VI |

## 6. Lessons and contribution

| Change | Requirement |
| --- | --- |
| Lessons follow the proposed layout `content/lessons/<id>/lesson.json`, `nb.md`, `en.md`, `assets/`. One canonical id for routes, metadata and issue text. Labelled as proposed. | LP; R2 finding 4 |
| Directives aligned with the proposal: `:::visual{type="…"}`, `:::example{…}`, `:::practice{…}`. Markdown images from `assets/`. Unknown directives show an error block. | LP |
| Complete bilingual lesson “Tiervenner / Number bonds to ten” with objective, optional prerequisites, explanation, asset image, worked example, interactive visuals and practice entry points. | LX; LP |
| From an exercise, **Read in the lesson** opens the relevant section with a “Back to the exercise” banner; the work is preserved. | LX |
| Separate **Suggest an improvement** and **Edit lesson source**. Suggestions go through a preview showing exactly what would be sent (lesson, language, section, file) and what is not included. | LX “Open contribution workflow”; LP |

## 7. Profile and recovery

| Change | Requirement |
| --- | --- |
| Learner ID shown as a non-secret username, separate from the secret password; the reminder file never contains the password. | ADR 0006; R2 #009 |
| States: copy/save ID, continue without email, correct an address during verification, pending (verify later), failed (three wrong codes), completed, resend. | ADR 0006 |
| Interrupted setup shows a banner to resume; “Keep learning now” is available on every step. | ADR 0006 |
| Guest work is added to a new profile (marked as guest work). When signing in, the learner chooses to add or not add guest work; imported work keeps a “guest work” label and does not replace the profile’s own place. | MA “Persistence”; ADR 0006 |
| Authentication, recovery mechanism and hashing are labelled as simulated and undecided. | AGENTS.md |

## Also fixed

- Untranslated `Legend` and `pluss` (R2 finding 7).
- Lesson view counted once per open (React development double effects).
- `npm test` runs domain checks (notation, number parsing, explanation/validator agreement, finite pools, observation ordering).
