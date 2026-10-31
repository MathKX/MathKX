# Contract: "Repeat this question"

Part of [plan.md](../plan.md) Phase 1. Research R5 and R6; spec User Story 2, FR-006 to FR-010.

## Where it is offered

| Place | Shown when | Action |
| --- | --- | --- |
| Practice screen (`ExerciseShell`) | the current delivery has a submission (any status; a reply that could not be read is input guidance, not a submission) | `store.repeatQuestion(currentDeliveryId)` |
| Replay (`ReplayPage`) | the delivery is not the unanswered question in progress (which keeps "Continue") | `store.repeatQuestion(id)`, then navigate to `/practice/{skillId}`; on failure, stay on the replay and show `practice.loadError` there |

The control is a button `practice.repeat` ("Repeat this question" / "Gjenta denne oppgaven"), `data-testid="repeat-question"` on the practice screen and `replay-repeat` in replay, at least 44 by 44 on touch screens.

## `store.repeatQuestion(deliveryId)`

1. **Identity**: take the delivery's identity (definition, version, seed or none).
2. **From a replay**: when the question's skill is not the practice skill, or practice is not running, set practice to that skill (from the resolved instance's `skill`) with its ladder. Set the ladder position to the question's variation when that variation is on the ladder.
3. **Load**: through `load()` with the seed fixed and no avoidance. On success, the new delivery has:
   - `repeatOf: deliveryId`;
   - `repeatReason: "requested"`;
   - the origin lesson of the run (spec 003);
   - a fresh answer field, with help and explanation closed.
4. **The previous question**: closed as any new question closes it: `skipped` when nothing was submitted, `ended` otherwise (spec 002).
5. **On failure**: spec 002's load error. Nothing is recorded, and the question in progress is unchanged.
6. **Result**: the skill practised after the repeat (the resolved instance's `skill`), or null on failure; replay navigates with it.

Avoidance never refuses or redirects a repeat on request.

## Outcome and display

- **Outcome**: spec 002's `derive` over the new delivery's own events only. Earlier deliveries keep their outcomes (DL-015, DL-029).
- **Repeat kind** (`progress.ts` `repeatKind`):
  - `"requested"` for `repeatReason: "requested"`;
  - `"chance"` for `repeatReason: "exhausted"` or spec 004's `repeats` mark;
  - none otherwise.
- **Tags**, in "My work" and replay, after `derive`'s tags and `revealsWithoutCorrect`:
  - `progress.repeatRequestedTag` for `"requested"`;
  - spec 004's `progress.repeatTag` for `"chance"`.
- **Sentences**: the skill keeps spec 004's `progress.repeats` (all repeats) and adds `progress.repeatsRequested` when there are repeats on request.

| Key | en | nb |
| --- | --- | --- |
| `practice.repeat` | Repeat this question | Gjenta denne oppgaven |
| `progress.repeatRequestedTag` | Repeated on request | Gjentatt etter ønske |
| `progress.repeatsRequested` | {n} of these you repeated on purpose. | {n} av disse gjentok du med vilje. |

## Tests

**`tests/repeat.test.tsx`**, with the fake API:
1. **After an answer**: the button appears only after a submission; a repeat delivers the same identity with a fresh state.
2. **Request count**: one instance request and no pool request.
3. **Independent outcomes**: a wrong answer with help, then a repeat answered correctly without help, gives "Correct on first response, no help" with "Repeated on request", and the first keeps its outcome.
4. **From a replay**: practice opens on the question's skill and variation; an unanswered question in progress becomes `skipped`; the replay recorded nothing; the in-progress question's replay offers "Continue" and no repeat.
5. **The notice**: a repeated question whose answer the lesson shows still gets spec 003's notice on a detour.
6. **"My work"**: tags and sentences in both languages; a repeat of a repeat.
7. **Failure**: a failed repeat records nothing.
8. **Replay**: every repeated delivery replays to the same question.
