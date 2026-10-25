# Contract: replay

Part of [plan.md](../plan.md) Phase 1. Spec FR-011 to FR-014, FR-016, FR-017; research R6.

## Route

`/record/{deliveryId}` renders `ReplayPage`. The router matches `parts[0] === "record"` with a second part. A delivery ID not in the record shows `replay.notFound` with a link back to "My work". "Back to my work" is always offered.

## Requests

Exactly one: `getInstance(definitionId, version, seed ?? null)`, spec 002's instance request, which carries only the identity. Replay never requests help steps, explanation steps, a lesson, or a validation, and sends nothing from the record.

## What is shown

| Element | Source |
| --- | --- |
| The expression `a + b` (`AdditionPrompt`) | the resolved instance, when its `a` and `b` equal the recorded ones |
| The date of the question | the delivery's `startedAt`, long date format |
| Each submission, in order: the text the learner entered, the status label, the feedback text | the `submission` events; `translateCode(feedback, code, { a, b, v: value, sum: value })` (`sum` is used only by `correct`) |
| Each unreadable entry: the text and "Could not be read", with its guidance text | the `input-guidance` events |
| The outcome and its tags | spec 002's `derive`, unchanged |
| "Repeated question" | [progress-view.md](progress-view.md) `repeats` |
| The completed equation `a + b = sum` | only when the delivery has a `correct` submission; the sum is that submission's recorded value, through spec 002's `feedback.correct` (`{ a, b, sum: value }`) |

## Never shown

- The sum, or anything from which it could be read, for a delivery with no correct submission: not in text, accessible names, `title` attributes, or data the page requests. The instance response contains no sum (spec 002), so the request itself discloses nothing.
- The sum for a delivery whose answer was revealed (help, counting, explanation, lesson) but never submitted correctly: the record holds no sum, and the app computes none. Its reveal tag ("Answer shown in the help", and so on) says what happened.
- An answer field, "Check", help, explanation, or lesson controls. Replay is for reading.

## Records nothing

Replay dispatches no store action: no event on any delivery, no change of the current question, the draft, or the ladder, and no lesson view. A test compares the persisted record before and after a replay byte for byte.

## The question in progress

If the delivery is the unfinished current question (`resumable.deliveryId` or `currentDeliveryId` with no correct submission), replay shows the recorded work so far and `progress.continue` linking to `/practice/{skillId}`, where spec 002 resumes it. It shows no answer control of its own.

## When the question cannot be shown

| Case | Shown |
| --- | --- |
| The instance request fails (404, 400, network error) | the recorded expression from the delivery's `a` and `b`, the recorded work, and `replay.unavailable` |
| The resolved operands differ from the recorded ones | the same; the resolved question is not shown |
| The definition is no longer in the content | the same |

| Key | en | nb |
| --- | --- | --- |
| `replay.title` | Question from {date} | Oppgave fra {date} |
| `replay.unavailable` | This question can no longer be shown as it was asked. Here is what was recorded. | Denne oppgaven kan ikke lenger vises slik den ble gitt. Her er det som ble registrert. |
| `replay.notFound` | This question is not in your work in this browser. | Denne oppgaven finnes ikke i arbeidet ditt i denne nettleseren. |
| `replay.back` | Back to my work | Tilbake til mitt arbeid |
| `replay.noAnswers` | No answer was given. | Det ble ikke gitt noe svar. |

## Accessibility

`h1` is `replay.title`; focus moves to it on arrival. Submissions are an ordered list. The expression uses the existing `AdditionPrompt` with its accessible name. The links are at least 44 by 44 pixels on touch screens.

## Tests (`tests/replay.test.tsx`, with the fake API)

1. A correct delivery replays with the same operands in both languages, its submissions, feedback, outcome, tags, and the completed equation.
2. An unrevealed incorrect delivery shows no sum anywhere in the DOM, including attributes; the only request is the instance request.
3. A delivery with an answer reveal and no correct submission shows its reveal tag and no sum.
4. The persisted record is unchanged after replay; no lesson view is recorded.
5. Mismatched operands, a 404, and a network error each show the recorded expression and `replay.unavailable`.
6. The question in progress shows "Continue" and no answer field; an unknown delivery ID shows `replay.notFound`.
7. A fixed task (no seed) resolves with `seed` null.
