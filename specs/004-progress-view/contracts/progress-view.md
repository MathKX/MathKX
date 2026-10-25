# Contract: the progress view ("My work")

Part of [plan.md](../plan.md) Phase 1. Spec FR-001 to FR-006, FR-009, FR-015 to FR-017; research R3, R4, R7, R8.

## Inputs

- The guest record: `deliveries` and `lessonViews` ([lesson-views.md](lesson-views.md)).
- The skill list from `GET /api/skills` ([api.md](api.md)), requested once per visit to the page.
- The lesson list from spec 003's `GET /api/lessons` (titles and `skills`), requested once per visit.

If either request fails, the page still shows every delivery from the record, under "Other practice", with the message `progress.contentUnavailable`. The lesson history is left out, because the record holds lesson IDs and not titles; the views stay in the record and appear on the next visit.

## Derivation (`src/web/src/state/progress.ts`, pure)

| Function | Input | Output |
| --- | --- | --- |
| `skillOfDefinition(skills)` | skill list | map `id@version` → skill ID |
| `groupBySkill(deliveries, skills, resumableId)` | record, skill list | per skill (and one "Other practice" group): the deliveries, newest first, and spec 002's `summarize` over them |
| `repeats(deliveries)` | record | the set of delivery IDs that repeat an earlier delivery (same definition ID, version, `a`, `b` in that order; earlier by `startedAt`, then record order) |
| `revealsWithoutCorrect(delivery)` | one delivery | for a delivery with no `correct` submission, the reveal tags (`revealExplanation`, `revealCounting`, `revealHelp`, `revealLesson`) of its revealing support events, in spec 002's tag order; `[]` when it has a `correct` submission (`derive` then carries them) |
| `lessonHistory(lessonViews)` | views | per lesson ID: `views` and `last` |
| `skillOrder(groups, history, lessons)` | the above | skill IDs by latest activity, newest first; "Other practice" last |

Rules:
- Outcomes come from spec 002's `derive` unchanged; a delivery with outcome "none" is neither counted nor listed.
- `derive` emits reveal tags only when it reaches the first correct submission, so a question whose answer was shown and never answered correctly gets no tags from it. `revealsWithoutCorrect` adds those tags for the question list and replay. It reads events through `revealSource`, which `outcomes.ts` exports for this without any change to its logic, and it never changes an outcome or a count.
- A skill appears when it has a counted delivery or a viewed lesson whose `skills` lists it. A skill with views and no practice shows its lesson history and the sentence `progress.noPractice` instead of a count sentence.
- A lesson teaching two skills appears under both; its views are counted once per lesson, not split.

## What the page shows

The page heading stays "My work" / "Mitt arbeid". Above the skills, the storage notice and "Clear my work" stay as in spec 002. For each skill, in order:

1. `h2`: the skill's name in the selected language ("Other practice" / "Annen øving" for the extra group).
2. The count sentence, spec 002's `record.summary`, for example "5 questions: 3 correct on first response, no help, 1 correct with visual help, 1 unfinished".
3. When there are repeats: `progress.repeats`.
4. For each viewed lesson of the skill: `progress.lessonViewed` (or its single-view form).
5. Once on the page, after the first lesson line: `progress.viewNote`.
6. A native `details` with the summary `progress.showQuestions`; inside, an ordered list, newest first. Each item: the expression as a link to `/record/{deliveryId}`, the date, the outcome label, the tags (`derive`'s, then `revealsWithoutCorrect`, then `progress.repeatTag` for a repeat), and spec 002's `record.answers`. An unfinished question in progress also has "Continue" to `/practice/{skillId}`.

An empty record (no counted delivery, no view) shows spec 002's `record.empty` with a link to the lessons.

## Strings (both dictionaries)

| Key | en | nb |
| --- | --- | --- |
| `progress.other` | Other practice | Annen øving |
| `progress.repeats` | {n} of them repeated a question you had already had. | {n} av dem var en oppgave du hadde hatt før. |
| `progress.repeatTag` | Repeated question | Gjentatt oppgave |
| `progress.lessonViewed` | {title}: viewed {n} times, last on {date} | {title}: vist {n} ganger, sist {date} |
| `progress.lessonViewedOnce` | {title}: viewed once, on {date} | {title}: vist én gang, {date} |
| `progress.viewNote` | A view shows that you opened the lesson, not that you understood it. | At en leksjon er vist, betyr at du åpnet den, ikke at du har forstått den. |
| `progress.noPractice` | No questions practised yet. | Ingen oppgaver øvd ennå. |
| `progress.showQuestions` | Show the questions | Vis oppgavene |
| `progress.continue` | Continue | Fortsett |
| `progress.contentUnavailable` | Skill names could not be loaded just now. Your work is all here. | Navnene på ferdighetene kunne ikke hentes akkurat nå. Alt arbeidet ditt er her. |

Dates: `Intl.DateTimeFormat(lang === "nb" ? "nb-NO" : "en-GB", { dateStyle: "long" })`. The final wording is settled in review; the keys and the rules are the contract.

## Never shown

No percentage, ratio, fraction of a total, score, grade, streak, time spent, ranking, badge, or the words "mastery", "mastered", "mestring", "mestret", "poeng", "rekke" in either language. A test renders the page over a scripted record in both languages and scans its text and accessible names, and scans both dictionaries' `progress` and `replay` sections.

## Accessibility

- Headings in order (`h1` page, `h2` skill); the count, repeat, and lesson lines are paragraphs a screen reader reads as sentences.
- The question list is a list; each link's accessible name is the expression and the date.
- Focus moves to the `h1` after an in-app navigation to the page (not on the first load of the app). No page does this yet; `PageHeading` adds it for "My work" and replay. Switching language keeps the open `details`.
- Links and the summary of `details` are at least 44 by 44 pixels on touch screens.

## Tests

- `tests/progress.test.ts`: every outcome counted as spec 002's `summarize` counts it; "none" dropped; repeats (ordered operands, version, seed differences); unknown definitions to "Other practice"; skill order; lesson history under each taught skill; a skill with views only.
- `tests/record-page.test.tsx`: names in both languages, never IDs; the count and repeat sentences; the lesson lines and the note; the empty state; content unavailable; "Continue" for the question in progress; language switch keeps `details` open; the no-percentage scan.
