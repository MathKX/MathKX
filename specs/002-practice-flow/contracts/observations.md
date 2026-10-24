# Contract: guest observations and outcome derivation

Part of [plan.md](../plan.md) Phase 1. Restates addendum §E and DL-029 as the rules `src/web/src/state/outcomes.ts` implements. The derivation is a pure function of a delivery's ordered events; a later server-side re-validation (F9) must reproduce it.

## Storage

Key `mathkx.guest.v1` in `localStorage`, value the `SessionRecord` of [data-model.md](../data-model.md). Reads and writes are wrapped; on failure the record lives in memory for the page's lifetime and `kept` is `false`, which the UI shows as "Your work is not being kept in this browser". A schema bump migrates or discards with a notice; this feature ships schema 1.

## Events per delivery

| `type` | Fields | Notes |
| --- | --- | --- |
| `submission` | `submissionId`, `originalText`, `value`, `status` (`correct` \| `incorrect` \| `partially-correct` \| `review-needed`), `code` | Mathematical submissions only |
| `input-guidance` | `submissionId`, `originalText`, `code` | `invalid-response` results; never a retry |
| `support` | `kind` ∈ { `visual-help-opened`, `help-step`, `counting`, `counting-complete`, `explanation-open`, `explanation-step` (+ `reveals: boolean`), `lesson-opened`, `lesson-reveal`, `answer-reveal` }, `step?` | `reveals` on a step is the flag the service returned with that step; `feedback-shown` is implied by an `incorrect` submission in practice and is not recorded (DL-032); `lesson-reveal` and `answer-reveal` are in the set for later features and are never produced by this one |
| `challenge-request` | `request` ∈ { `easier`, `harder`, `another`, `same` }, `outcome` ∈ { `requested`, `applied`, `cleared`, `unavailable` } | Never evidence about the learner |
| `skipped` | — | Learner moved on with no mathematical submission |
| `ended` | — | Session ended; a draft makes the delivery resumable |

A `submission` or `input-guidance` whose `submissionId` already exists in the delivery is dropped (FR-019).

## Classes of support

- **Reveal**: `counting-complete`, `help-step` with `reveals: true` (the last help step of any representation, for example make-ten's), `explanation-step` with `reveals: true`, `lesson-reveal`, `answer-reveal`.
- **Visual help**: `visual-help-opened`, `help-step` with `reveals: false`, `counting`.
- **Other (non-visual, non-revealing) help**: `explanation-open`, `explanation-step` with `reveals: false`, `lesson-opened`.

## Outcome

Walk the events in order. "Before" means before the first `correct` submission.

1. If no `submission` has status `correct`:
   - any `review-needed` → `notAssessed`; else any `partially-correct` → `partiallyCorrect`; else any `incorrect` → `notYetCorrect`;
   - else `skipped` if a `skipped` event exists; `unfinished` if an `ended` event exists or the delivery is the resumable one; otherwise `none` (only input guidance or nothing; not shown as practised).
2. If a `correct` submission exists, with the support before it:
   - any reveal → `correctAfterExplanation`;
   - else any other help → `correctWithHelp`;
   - else any visual help → `correctWithVisualHelp`;
   - else any earlier `incorrect` submission → `correctAfterFeedback`;
   - else `correctFirst`.

Tags, all derived: `feedbackBefore` when an `incorrect` preceded the first `correct` and the outcome is not `correctAfterFeedback`; `visualBefore`, `lessonBefore`, `explainPartBefore` for the respective support before; `revealCounting` (groups' `counting-complete`), `revealHelp` (a revealing `help-step` of another representation), `revealExplanation`, `revealLesson` for the reveal source before; `visualAfter`, `explainAfter` for support after the first `correct`, and `lessonAfter` for a `lesson-opened` after it (added by spec 003). `explainPartBefore` is dropped when `revealExplanation` is present. Support after the first `correct` never changes the outcome. `input-guidance` never influences the outcome.

## Labels (dictionary keys)

| Outcome | en | nb |
| --- | --- | --- |
| `correctFirst` | Correct on first response, no help | Riktig på første svar, uten hjelp |
| `correctAfterFeedback` | Correct after feedback | Riktig etter tilbakemelding |
| `correctWithVisualHelp` | Correct with visual help | Riktig med visuell hjelp |
| `correctWithHelp` | Correct with help | Riktig med hjelp |
| `correctAfterExplanation` | Answered after the answer was shown | Besvart etter at svaret ble vist |
| `partiallyCorrect` | Partly right | Delvis riktig |
| `notAssessed` | Not checked automatically | Ikke sjekket automatisk |
| `notYetCorrect` | Not correct yet | Ikke riktig ennå |
| `skipped` | Skipped | Hoppet over |
| `unfinished` | Unfinished | Uferdig |

The Norwegian wordings are the prototype's where it has them and are content for review, not code.

## Summary

`Summary { questions, counts }` where `questions` counts deliveries whose outcome is not `none` and `counts` maps each outcome to its number. Rendered as "9 questions: 4 correct on first response, 3 after feedback, 2 with visual help" in the active language; never a percentage, score, streak, time, or mastery word.

## Tests (`src/web/tests/outcomes.test.ts`)

One case per outcome row and per tag, plus: help closed without counting → `correctWithVisualHelp`; counting the last counter → `correctAfterExplanation`; make-ten help stepped to its revealing last step, then correct → `correctAfterExplanation` with `revealHelp`; make-ten help stopped before the last step, then correct → `correctWithVisualHelp`; explanation after correct → unchanged outcome with `explainAfter`; lesson opened after correct → unchanged outcome with `lessonAfter` (added by spec 003); input guidance then correct → `correctFirst`; duplicate `submissionId` → one submission; resumable delivery → `unfinished`.
