# Contract: the detour from a question to its lesson

Part of [plan.md](../plan.md) Phase 1. Spec FR-010 to FR-015 and User Story 2; research R6, R7, R9. The events are spec 002's ([observations contract](../../002-practice-flow/contracts/observations.md)); this contract says when they are recorded.

## Terms

- **Current question**: the store's current delivery when it has no `correct` submission and no `skipped` event. (Spec 002's `resumable` is narrower: only deliveries without any submission. The detour also covers a question answered wrongly and not yet corrected.)
- **Detour**: a visit to `/lessons/:id`, by any route (the question's lesson link, the lesson list, a typed address, history), while there is a current question whose definition and version are among the lesson's `practice` entries.
- **Discloses**: the `discloses` flag of this lesson in the current question's `instance.lessons` ([api.md](api.md), [disclosure.md](disclosure.md)). When the stored instance has no `lessons` field (stored before this feature), the page re-resolves the identity first; until that returns, the page shows the loading text and requests no lesson content.
- **Shown**: the lesson content has rendered for the first time in this visit (the renderer's commit after the content request resolved).

## The practice screen's lesson link

The link targets the lesson in `instance.lessons` whose ID equals the current delivery's `originLessonId`, else the first lesson in the list (lesson-ID order); with an empty list there is no link (spec FR-010; replaces the hard-coded `/lessons/number-bonds-to-ten`).

`originLessonId` is persisted on each delivery ([data-model.md](../data-model.md)): a lesson's practice entry passes its lesson ID to `startPractice`, the first delivery records it, and every later delivery of that practice run ("Another question", "More like this", ladder moves, resume after a reload) copies it from the delivery before. Practice started without a lesson (the practice route itself) leaves it unset. It is context for navigation, never an observation event and never evidence.

The link carries its origin in its address: `/lessons/{id}?from=question`. Activating it records nothing and sets no in-memory state; recording happens on the lesson page. A modified click (Ctrl, Meta, Shift, or Alt, or a middle click) opens the same address in a new tab or window, which therefore sees the origin, while the source tab stays unchanged; the router's `Link` keeps calling `onActivate` before it filters modified clicks, so this link passes no `onActivate`. The router matches routes on the path only and exposes the query; the lesson page reads `from=question` when a visit starts and then removes it from the address with `history.replaceState`, so a reload or a later visit through history is not taken for a visit from the question.

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

Outcomes: "Open the lesson anyway" opens the gate for this visit and requests the content; "Show visual help instead" queues an open-help request for the current delivery and navigates to `/practice/{skillId}`; when the practice view mounts and presents that delivery, the store consumes the request by calling `toggleHelp()`, the same path as pressing "Show visual help", so `visual-help-opened` is recorded exactly as in spec 002 (that event is recorded only there, not by setting `helpOpen`), and the lesson records nothing; a request for a delivery that is no longer current is dropped; "Cancel" navigates to `/practice/{skillId}`. A gate opened in a visit stays open for a language switch in that visit; a new visit starts closed again.

## Recording

Exactly one event per visit at most, appended to the current delivery when the lesson is **shown**:

| Visit | Event | Effect on the outcome (spec 002, unchanged) |
| --- | --- | --- |
| Detour, `discloses` true, gate opened | `support` `lesson-reveal` | a later first `correct` is "Answered after the answer was shown", tag "Answer shown in the lesson" |
| Detour, `discloses` false | `support` `lesson-opened` | a later first `correct` is "Correct with help" (unless a reveal also happened), tag "Lesson opened" |
| Not a detour, reached with `from=question`, the current delivery already has a `correct` submission | `support` `lesson-opened` | none; tag `lessonAfter` "Lesson opened after answering" |
| Anything else (no question, a lesson that does not list the definition, an answered question reached by another route) | nothing | — |

Nothing is recorded when the content request fails, when the learner leaves before the content renders, on a language switch within the visit, or on any interaction inside the lesson. The visit state is not persisted; a reload on the lesson page is a new visit.

## The way back

During a detour the page shows `ReturnBanner` above the title: the text "Back to your question" with the question's prompt rendered by `AdditionPrompt` (its spoken form, no result), as a link to `/practice/{skillId}`, and "Dismiss" (hides the banner for this visit only). Returning by the banner or by the browser's back action shows the practice screen with the store's current question, draft, help open and step, explanation open and step, and pending change as they were (spec 002's store already keeps them across routes; FR-014). Leaving for elsewhere keeps the question current; the next visit to a lesson listing it is a detour again (FR-015).

## The `lessonAfter` tag

`outcomes.ts`: a `support` `lesson-opened` after the first `correct` adds `lessonAfter`; tag order `…, visualAfter, explainAfter, lessonAfter`. Dictionaries: `en` "Lesson opened after answering", `nb` "Leksjon åpnet etter svaret". Spec 002's `contracts/observations.md` tag paragraph and test list gain the tag ("added by spec 003"). Outcome precedence is unchanged.

## Tests

Unit (`lesson-gate.test.tsx`, `outcomes.test.ts`, with the fake API):

1. A detour to a non-disclosing lesson requests the content at once and records one `lesson-opened` after the content renders, none before.
2. A detour to a disclosing lesson shows the notice and makes no content request; "Cancel" records nothing; "Show visual help instead" records no lesson event and makes no content request, and once the practice view has mounted exactly one `visual-help-opened` is recorded, so answering correctly then derives `correctWithVisualHelp` (not `correctFirst`); "Open the lesson anyway" requests the content and records one `lesson-reveal` after it renders.
3. "Open the lesson anyway" followed by a failing content request records nothing and offers the way back; leaving before the request resolves records nothing.
4. A visit from the lesson list with a current question behaves exactly like a visit from the link (the clarification).
5. With no current question, or a lesson that does not list the definition, nothing is recorded; with an answered question, a visit reached with `from=question` records `lesson-opened`, the derivation gives `lessonAfter` without changing the outcome, and the parameter is gone from the address afterwards; the same visit from the lesson list records nothing.
6. A language switch during the visit records nothing new and keeps the gate state.
7. A stored instance without `lessons` is re-resolved before the gate decides.
8. Return by the banner restores draft, help open and step, explanation state, and pending change.
9. With a fake catalogue in which two lessons (`a-lesson` and `b-lesson`) list the same definition, practice started from `b-lesson`'s entry links to `b-lesson` on the first question, after "Another question", after a ladder move and back, and after a reload; practice started from the practice route links to `a-lesson`, the first by ID.
10. Modified activation: the lesson link's `href` is `/lessons/{id}?from=question`; a Ctrl-, Meta-, Shift-, or Alt-click does not navigate the source tab and changes nothing in its store; a lesson page opened at that address (as the new tab would be) with an answered current question records one `lesson-opened` and removes the parameter; a later visit to the lesson in the source tab without the parameter records nothing; `matchRoute` resolves `/lessons/number-bonds-to-ten?from=question` to the lesson `number-bonds-to-ten`.

End to end (`e2e/lesson.spec.ts`, desktop and iPad projects). Questions are pinned to golden seeds of `addition-pair-v1.golden.json` with a Playwright init script that makes `crypto.getRandomValues` yield the seed's eight big-endian bytes for the next question, so `newSeed()` in the app is unchanged:

1. `6 + 5` (`crossing-ten`, seed `1234567890123456789`) with draft `1` and help at step 2 → lesson link → lesson shown, banner shown → back → same state → answer `11` → record "Correct with help" with tag "Lesson opened".
2. `5 + 8` (`crossing-ten`, seed `100`) → lesson link → notice in English and Norwegian → the network log shows no `/api/lessons/number-bonds-to-ten/content/` request → "Open the lesson anyway" → request made, lesson shown → back → `13` → "Answered after the answer was shown" with "Answer shown in the lesson".
3. `9 + 1` (`within-10`, seed `100`) reached through the header's lesson list → notice shown, no content request before the choice.
4. Browser back from the lesson restores the question as the banner does.
5. Keyboard only: open the lesson from the question, use the notice, return; no pointer.
