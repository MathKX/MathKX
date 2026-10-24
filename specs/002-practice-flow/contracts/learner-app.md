# Contract: learner app screens, controls, state, and accessibility

Part of [plan.md](../plan.md) Phase 1. What the React app must show and preserve; the wording is in the dictionaries, the mathematics comes from the service.

## Routes

| Route | Screen |
| --- | --- |
| `/` | Lesson list from `GET /api/lessons` (title in the active language, status) |
| `/lessons/:id` | Lesson page: title and objective from the front matter for the active language, the practice entries as buttons ("Practise: Addition within ten"), a note that the lesson text arrives with a later release. No Markdown body. |
| `/practice/:skillId` | The practice screen (below) |
| `/record` | The session record: deliveries with outcome labels and tags, the summary counts, the "kept in this browser only" or "not being kept" notice, and a "Clear my work" action with confirmation |

The language switch is in the header on every route and never changes the current route or state.

## Practice screen

Anatomy (exercise-experience "Possible anatomy" and "Addition example"):

1. The ladder sentence for the current definition (from the skill's ladder) and, when a change is pending, the notice "Next question: …".
2. The expression (`4 + 4 = ?`) rendered by `MathExpr` with an accessible spoken form ("4 plus 4. What is the sum?").
3. The answer field (numeric keyboard hint on touch devices), the submit action, and "Show visual help" (toggle; announces expanded state).
4. The help panel when open: `Counters` (groups) for `within-10`, `MakeTen` for `crossing-ten`. Opening it shows the operands only (recorded as `visual-help-opened`); each "Next step" fetches one help step from the service and records `help-step` with its `reveals` flag. The last step of every help sequence reveals the total: for groups it is `counting-complete`, for make-ten a `help-step` with `reveals: true`; both show "The answer has been shown" and classify a later correct answer as "Answered after the answer was shown".
5. The result area after a submission: the status wording and the feedback text for the code; for `incorrect`, the field stays editable with "Change your answer and check again"; for `correct`, the completed equation. After either result the "Show explanation" action is available (FR-013): it records `explanation-open`, then each step fetched from the service records `explanation-step` with its `reveals` flag; a revealing step before the next correct submission makes that submission "Answered after the answer was shown"; after a correct submission the explanation is a tag only.
6. The controls row: "Another question", "More like this", "Make it easier", "More challenge". At the ladder's ends the corresponding control stays enabled and pressing it shows the honest message without changing anything.
7. A link to the lesson, recorded as `lesson-opened`, which is non-revealing support in this feature: the lesson route shows only the title, objective, and practice entries, so nothing it presents can show this instance's answer. The disclosure rule of DL-026 (warn when the lesson shows this instance's result, record `lesson-reveal`) is implemented with the body renderer in spec 003, matched against the content actually rendered; this feature never records `lesson-reveal`.

## State preservation

The store holds: current delivery and instance, draft text, help open and step, explanation open and step, pending ladder change, language, deliveries. Language switch and resize re-render from the store; nothing is reset. Ending the session (navigating away, closing the tab) leaves the current delivery resumable with its draft, help state, and pending change (FR-017); returning to the practice route resumes it.

## Accessibility (FR-024, DL-035)

- Keyboard: every control focusable in reading order; the help toggle uses `aria-expanded`; focus moves to the result area after a submission and is never lost.
- Screen reader: group labels "First group, 4 counters" and "Second group, 4 counters"; counters are a navigable list; no name, description, or live region states the total before the counting step reveals it; the result area is a live region in the active language.
- Touch: interactive controls at least 44 by 44 CSS pixels at the iPad viewport (1024 by 768 and 768 by 1024).
- Motion: steps animate only when `prefers-reduced-motion` is not set; a static or stepped equivalent is always available.
- Zoom: the practice screen is usable at 200 percent without horizontal scrolling at 1024 pixels.

## End-to-end checks (`e2e/practice.spec.ts`)

1. Keyboard only: open the lesson, start practice, open help, answer, read feedback, next question.
7. After an incorrect answer, open the explanation, step to the revealing step, correct the answer: the record shows "Answered after the answer was shown"; after a correct answer, opening the explanation leaves the outcome unchanged with the "explanation opened after answering" tag (spec User Story 1, scenario 8).
2. Accessibility tree: with help open for `4 + 4`, no accessible name or text contains `8` until the counting step completes.
3. Language switch mid-question keeps the question, draft, and help state; every visible string changes.
4. Ladder: "More challenge" from `within-10` shows the crossing-ten sentence and a make-ten help on the next question; at the top, the honest message.
5. Private data: the instance, lesson, and skill responses, every step response with `reveals: false`, and every incorrect or invalid validation result contain no `"sum"`; the only responses that may contain it are a correct validation result and a step with `reveals: true`, and the test asserts such a step response occurs only after the learner pressed the step control that requests it (never on opening help) and that the app recorded the reveal.
6. Touch targets at the iPad viewport.
