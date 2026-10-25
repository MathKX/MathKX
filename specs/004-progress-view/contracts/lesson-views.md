# Contract: lesson views

Part of [plan.md](../plan.md) Phase 1. Spec FR-007 to FR-010, research R5.

## When a view is recorded

`LessonPage` (spec 003) calls `onShown` once per visit, after the lesson content has rendered for the first time. In this feature `onShown` also calls `store.lessonViewed(lessonId, displayedLanguage)`. The store appends `{ lessonId, language, at: new Date().toISOString() }` to `lessonViews`, unless the last entry is the same lesson less than one second earlier.

| Situation | View recorded |
| --- | --- |
| A lesson opened from the lesson list, a link, an address, or history, and its content renders | yes, once |
| A detour from a question to a lesson that does not show its answer | yes, once (and spec 003's `lesson-opened` on the question, unchanged) |
| A lesson behind spec 003's notice, then "Open the lesson anyway", and the content renders | yes, once (and `lesson-reveal`) |
| A lesson behind the notice, then "Cancel" or "Show visual help instead" | no |
| The content fails to load, or the learner leaves before it renders | no |
| A language switch during the visit | no further view |
| Leaving and opening the lesson again; a reload | yes, a new view |
| A double activation (the same lesson again within one second) | no further view |

A view never touches a delivery's events or outcome.

## The record

- `PersistedState.lessonViews: { lessonId: string; language: "nb" | "en"; at: string }[]`, in recording order, at most 500 entries (the oldest dropped first).
- `mathkx.guest.v1` keeps schema version 1. Hydration reads a missing field as `[]`, so a record written before this feature loads with every delivery intact.
- "Clear my work" empties `lessonViews` with the deliveries. The "kept in this browser only" and "not being kept" notices apply unchanged.
- Nothing about views is sent to the service.

## Lesson history (derived)

`progress.ts` `lessonHistory(lessonViews)` gives, per lesson ID, `{ views, last }` (count and latest `at`). The progress view shows it under each skill in the lesson's `skills` list ([progress-view.md](progress-view.md)).

## Tests (`tests/lesson-views.test.tsx`, with the fake API)

1. Opening the lesson from the lesson list records one view after the content renders, none before.
2. A detour to a non-disclosing lesson records one view and one `lesson-opened`; a disclosing lesson cancelled at the notice records neither; opened anyway, it records one view and one `lesson-reveal`.
3. A failing content request records no view; leaving before the content resolves records none.
4. A language switch records nothing new; leaving and returning records a second view; two openings of the same lesson within one second record one.
5. A stored record without `lessonViews` hydrates with `[]` and keeps its deliveries.
6. "Clear my work" empties the views; the 501st view drops the oldest.
