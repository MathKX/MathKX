# Contract: the detour from a question to its lesson

Part of [plan.md](../plan.md) Phase 1. Spec FR-010 to FR-015 and User Story 2; research R6, R7, R9. The events are spec 002's ([observations contract](../../002-practice-flow/contracts/observations.md)); this contract says when they are recorded.

## Terms

- **Current question**: the store's current delivery when it has no `correct` submission and no `skipped` event. (Spec 002's `resumable` is narrower: only deliveries without any submission. The detour also covers a question answered wrongly and not yet corrected.)
- **Detour**: a visit to `/lessons/:id`, by any route (the question's lesson link, the lesson list, a typed address, history), while there is a current question whose definition and version are among the lesson's `practice` entries.
- **Discloses**: the `discloses` flag of this lesson in the current question's `instance.lessons` ([api.md](api.md), [disclosure.md](disclosure.md)). When the stored instance has no `lessons` field (stored before this feature), the page re-resolves the identity first; until that returns, the page shows the loading text and requests no lesson content.
- **Shown**: the lesson content has rendered for the first time in this visit (the renderer's commit after the content request resolved).

## The practice screen's lesson link

The link targets the first lesson in `instance.lessons` whose ID equals the lesson practice was started from, else the first lesson in the list; with an empty list there is no link (spec FR-010; replaces the hard-coded `/lessons/number-bonds-to-ten`). Activating it sets the one-shot origin `question-link` and navigates. It records nothing itself; recording happens on the lesson page.

## The gate (lesson page)

| Situation on entering the page | Gate | Content request |
| --- | --- | --- |
| Not a detour | open | at once |
| Detour, `discloses` false | open | at once |
| Detour, `discloses` true | closed: the notice is shown instead of the lesson | none until the learner opens the gate |

The notice (`LessonGate`), in the selected language, as a region with a heading:

- Heading: "This lesson shows the answer to {prompt}" with the question's prompt (`8 + 5`), never its result.
- Text: "If you open it now, your answer will be recorded as given after the answer was shown. You can also get visual help with the question instead."
- Actions: "Open the lesson anyway" (primary), "Show visual help instead" (only when the instance lists a help representation), "Cancel".

Outcomes: "Open the lesson anyway" opens the gate for this visit and requests the content; "Show visual help instead" sets the current question's help open and navigates to `/practice/{skillId}` (help then records `visual-help-opened` when presented, as in spec 002); "Cancel" navigates to `/practice/{skillId}`. A gate opened in a visit stays open for a language switch in that visit; a new visit starts closed again.

## Recording

Exactly one event per visit at most, appended to the current delivery when the lesson is **shown**:

| Visit | Event | Effect on the outcome (spec 002, unchanged) |
| --- | --- | --- |
| Detour, `discloses` true, gate opened | `support` `lesson-reveal` | a later first `correct` is "Answered after the answer was shown", tag "Answer shown in the lesson" |
| Detour, `discloses` false | `support` `lesson-opened` | a later first `correct` is "Correct with help" (unless a reveal also happened), tag "Lesson opened" |
| Not a detour, origin `question-link`, the current delivery already has a `correct` submission | `support` `lesson-opened` | none; tag `lessonAfter` "Lesson opened after answering" |
| Anything else (no question, a lesson that does not list the definition, an answered question reached by another route) | nothing | — |

Nothing is recorded when the content request fails, when the learner leaves before the content renders, on a language switch within the visit, or on any interaction inside the lesson. The visit state is not persisted; a reload on the lesson page is a new visit.

## The way back

During a detour the page shows `ReturnBanner` above the title: the text "Back to your question" with the question's prompt rendered by `AdditionPrompt` (its spoken form, no result), as a link to `/practice/{skillId}`, and "Dismiss" (hides the banner for this visit only). Returning by the banner or by the browser's back action shows the practice screen with the store's current question, draft, help open and step, explanation open and step, and pending change as they were (spec 002's store already keeps them across routes; FR-014). Leaving for elsewhere keeps the question current; the next visit to a lesson listing it is a detour again (FR-015).

## The `lessonAfter` tag

`outcomes.ts`: a `support` `lesson-opened` after the first `correct` adds `lessonAfter`; tag order `…, visualAfter, explainAfter, lessonAfter`. Dictionaries: `en` "Lesson opened after answering", `nb` "Leksjon åpnet etter svaret". Spec 002's `contracts/observations.md` tag paragraph and test list gain the tag ("added by spec 003"). Outcome precedence is unchanged.

## Tests

Unit (`lesson-gate.test.tsx`, `outcomes.test.ts`, with the fake API):

1. A detour to a non-disclosing lesson requests the content at once and records one `lesson-opened` after the content renders, none before.
2. A detour to a disclosing lesson shows the notice and makes no content request; "Cancel" and "Show visual help instead" record nothing and make no request; "Open the lesson anyway" requests the content and records one `lesson-reveal` after it renders.
3. "Open the lesson anyway" followed by a failing content request records nothing and offers the way back; leaving before the request resolves records nothing.
4. A visit from the lesson list with a current question behaves exactly like a visit from the link (the clarification).
5. With no current question, or a lesson that does not list the definition, nothing is recorded; with an answered question, a visit with origin `question-link` records `lesson-opened` and the derivation gives `lessonAfter` without changing the outcome; the same visit from the lesson list records nothing.
6. A language switch during the visit records nothing new and keeps the gate state.
7. A stored instance without `lessons` is re-resolved before the gate decides.
8. Return by the banner restores draft, help open and step, explanation state, and pending change.

End to end (`e2e/lesson.spec.ts`, desktop and iPad projects). Questions are pinned to golden seeds of `addition-pair-v1.golden.json` with a Playwright init script that makes `crypto.getRandomValues` yield the seed's eight big-endian bytes for the next question, so `newSeed()` in the app is unchanged:

1. `6 + 5` (`crossing-ten`, seed `1234567890123456789`) with draft `1` and help at step 2 → lesson link → lesson shown, banner shown → back → same state → answer `11` → record "Correct with help" with tag "Lesson opened".
2. `5 + 8` (`crossing-ten`, seed `100`) → lesson link → notice in English and Norwegian → the network log shows no `/api/lessons/number-bonds-to-ten/content/` request → "Open the lesson anyway" → request made, lesson shown → back → `13` → "Answered after the answer was shown" with "Answer shown in the lesson".
3. `9 + 1` (`within-10`, seed `100`) reached through the header's lesson list → notice shown, no content request before the choice.
4. Browser back from the lesson restores the question as the banner does.
5. Keyboard only: open the lesson from the question, use the notice, return; no pointer.
