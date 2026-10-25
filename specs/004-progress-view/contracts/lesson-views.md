# Contract: lesson views

Part of [plan.md](../plan.md) Phase 1. Spec FR-007 to FR-010, research R5.

## When a view is recorded

`LessonPage` (spec 003) calls `onShown` after the lesson content has rendered for the first time, and records spec 003's lesson event only once per visit, behind its `recorded` ref (a visit is one mount of the page for one lesson). In this feature the same guarded branch also calls `store.lessonViewed(lessonId, displayedLanguage)`, so a view is recorded exactly when, and as often as, a visit shows the lesson. The store appends `{ lessonId, language, at: new Date().toISOString() }` to `lessonViews` unconditionally. There is no time window: a reload or a return is a new visit and a new view however quickly it follows, and a repeated `onShown` within one visit is idempotent through the guard.

| Situation | View recorded |
| --- | --- |
| A lesson opened from the lesson list, a link, an address, or history, and its content renders | yes, once |
| A detour from a question to a lesson that does not show its answer | yes, once (and spec 003's `lesson-opened` on the question, unchanged) |
| A lesson behind spec 003's notice, then "Open the lesson anyway", and the content renders | yes, once (and `lesson-reveal`) |
| A lesson behind the notice, then "Cancel" or "Show visual help instead" | no |
| The content fails to load, or the learner leaves before it renders | no |
| A language switch during the visit | no further view |
| Leaving and opening the lesson again; a reload | yes, a new view |
| A second activation of a link to the lesson already on screen (the router does not remount the page) | no further view |
| `onShown` called again within the same visit (a re-render, or a development double effect) | no further view |
| A reload or a return that renders within a second of the previous view | yes, a new view |

A view never touches a delivery's events or outcome.

## The record

- `PersistedState.lessonViews: { lessonId: string; language: "nb" | "en"; at: string }[]`, in recording order, with no cap, like `deliveries`. A count of views is therefore always every view recorded since the last "Clear my work". A view is about 90 bytes as JSON, so years of daily lesson use stay far below the browser's storage limit; if a save ever fails, spec 002's storage reports it and the page says the work is not being kept.
- `mathkx.guest.v1` keeps schema version 1. Hydration reads a missing field as `[]`, so a record written before this feature loads with every delivery intact.
- "Clear my work" empties `lessonViews` with the deliveries. The "kept in this browser only" and "not being kept" notices apply unchanged.
- Nothing about views is sent to the service.

## Lesson history (derived)

`progress.ts` `lessonHistory(lessonViews)` gives, per lesson ID, `{ views, last }` (count and latest `at`). The progress view shows it under each skill in the lesson's `skills` list ([progress-view.md](progress-view.md)).

## Tests (`tests/lesson-views.test.tsx`, with the fake API)

1. Opening the lesson from the lesson list records one view after the content renders, none before.
2. A detour to a non-disclosing lesson records one view and one `lesson-opened`; a disclosing lesson cancelled at the notice records neither; opened anyway, it records one view and one `lesson-reveal`.
3. A failing content request records no view; leaving before the content resolves records none.
4. A language switch records nothing new; leaving and returning records a second view; a remount that renders within a second of the first view (fake timers) still records a second view; calling `onShown` twice in one visit records one.
5. A stored record without `lessonViews` hydrates with `[]` and keeps its deliveries.
6. "Clear my work" empties the views; 600 recorded views of one lesson give "viewed 600 times" (no cap).
