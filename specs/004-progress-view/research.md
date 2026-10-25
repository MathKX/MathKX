# Research: Progress View, Lesson History, and Replay

Phase 0 of [plan.md](plan.md). Each decision records what was chosen, why, and what was rejected. Decisions of specs 002 and 003 stand unless a decision here says otherwise.

## R1. Skill names in the content contract

**Decision**: Each skill file gains a required `name` object with non-empty `nb` and `en` strings (the same shape as a ladder entry's `description`). The schema keeps `schemaVersion` `"0.1"`: spec 001 added the optional `ladder` within 0.1, every skill file lives in this repository, and all nine are updated in the same change. The schema's description no longer says names "live elsewhere". The validator adds one check that the schema cannot express clearly: a name that is only whitespace in either language. It reports `skill name in {language} is missing or empty`, naming the file and the field `name.{language}`, in the diagnostics format of spec 001. `content/AUTHORING.md` documents the field. The implementation proposes names for all nine skills, and the pull request lists them for content review (`contracts/skill-name.md`).

**Rationale**: The owner chose names in the content (spec Clarifications). skill-graph.md asks for localized names kept separate from identity, which a separate field does. A required field means no learner ever sees a bare skill ID. The nine files must all pass validation, so all nine need names now, not only the two with practice.

**Alternatives considered**:
- **A separate names file per language** (`content/skills/names.nb.json`): it keeps names apart from the skill file, but adds a pairing rule and a second place to edit for every new skill.
- **Making `name` optional**: the progress view would then need a fallback, and the fallback would be the ID.
- **Bumping `schemaVersion`**: nothing outside the repository consumes these files yet.

## R2. Delivering skills to the app

**Decision**: Add `GET /api/skills`, which returns every skill in ID order. `GET /api/skills/{id}` gains the same fields. Each skill carries:
- `id`, `name` (`nb`, `en`), `prerequisites`, and `ladder` (unchanged);
- `definitions`: the keys (`id@version`) of every exercise definition whose `skill` is this skill, ladder or not (the fixed task `four-plus-four` belongs to addition within 20).

**Rationale**: The progress view needs, in one call, every skill's name and the map from definition to skill, including definitions outside the ladder. Deliveries store their definition, not their skill (spec Assumptions). Deriving the map in the service from the content keeps one source of truth.

**Alternatives considered**:
- **Storing the skill on each delivery**: records from before this feature lack it, and a definition that moves to another skill would leave stale groupings.
- **Asking for each skill separately**: the app does not know which skills exist.

## R3. Grouping and ordering

**Decision**: `src/web/src/state/progress.ts` exposes pure functions over the record and the skill list:
- **`groupBySkill`**: maps each delivery to its skill through the `definitions` keys; a definition no skill lists goes to "Other practice". It applies spec 002's `derive` and `summarize` per group, unchanged, and drops outcome "none".
- **Which skills appear**: a skill is listed when it has a counted delivery or a viewed lesson that teaches it.
- **Order**: skills by their most recent activity (the newest delivery or lesson view), newest first, with "Other practice" last; questions within a skill newest first.

**Rationale**: Pure functions make the counts testable against spec 002's derivation directly (spec SC-001). Most recent activity first puts the learner's current work at the top without inventing a curriculum order.

**Alternatives considered**:
- **Content order**: fixed and arbitrary to the learner.
- **Alphabetical order**: differs between languages.
- **Grouping by ladder entry**: finer than the spec asks, and the fixed task is not on the ladder.

## R4. Repeats

**Decision**: A delivery is a repeat when an earlier delivery (by `startedAt`, then record order) has the same definition ID, version, and operands in the same order. The skill summary adds "{n} of them repeated a question you had already had" when `n > 0`. The question list marks a repeat with a tag "Repeated question".

**Rationale**: mastery.md requires repeated exposure to stay distinguishable. Ordered operands match what the learner saw (`3 + 7` and `7 + 3` are different questions on the screen). Feature F7 may define a canonical instance for avoidance, but that does not change what "the same question again" looks like in a record.

**Alternatives considered**:
- **Same seed**: two seeds can give the same question, and the learner sees the question, not the seed.
- **Unordered operands**: a judgement F7 makes for avoidance, not for honest history.

## R5. Recording lesson views

**Decision**:
- **The field**: the persisted guest state gains `lessonViews: { lessonId, language, at }[]`, where `at` is an ISO timestamp.
- **When**: spec 003's `LessonPage` already calls `onShown` once per visit when the content first renders. It now also calls `store.lessonViewed(lessonId, shownLanguage)`, which appends a view unless the last view is of the same lesson less than one second earlier (a double activation).
- **Cap**: the list keeps at most the 500 most recent views.
- **Clearing**: "Clear my work" empties it.
- **Compatibility**: hydration defaults a missing field to `[]`, and the storage schema version stays 1.

**Rationale**:
- **Same moment as spec 003's events**: recording at the "shown" moment makes the view and the question's lesson events agree, and a lesson behind the notice is never a view.
- **One second, not three**: the window guards against a double mount or double activation without swallowing a real revisit (the prototype used three seconds).
- **The cap**: it bounds storage for a long-lived guest record, and 500 views is far beyond any summary's needs.
- **The version**: bumping it would make `storage.ts` discard every existing record.

**Alternatives considered**:
- **Recording on route entry**: this would count a lesson kept behind the notice.
- **Recording on scroll or time spent**: DL-019 forbids it.
- **A separate storage key**: "Clear my work" and the "kept" notice would then have to coordinate two keys.

## R6. Replay

**Decision**: A route `/record/:deliveryId` renders `ReplayPage` from the store's delivery. It resolves the question with `getInstance(definitionId, version, seed ?? null)` (the only request) and compares the resolved `a` and `b` with the recorded ones. It shows:
- **The question**: the expression, via the existing `AdditionPrompt`.
- **The date**.
- **Each mathematical submission in order**: value, status wording, and feedback text from its code with `{ a, b, v }`.
- **Input-guidance entries**: shown as "could not be read" with their code's text.
- **The outcome and its tags**.

It shows the completed equation (`a + b = sum`) only when the delivery has a `correct` submission, whose recorded value is the sum. A delivery whose answer was revealed but never submitted correctly shows its reveal tag and no sum: the record holds none, and the app computes none. The sum never comes from a request.

When resolution fails, the operands differ, or the service is unreachable, it shows the recorded expression from the record with the message `replay.unavailable`. It dispatches nothing to the store. An unfinished current question shows "Continue" to `/practice/{skillId}` instead of any answer control.

**Rationale**:
- **Re-resolving**: this proves the identity (ADR 0004) and shows the question as the service delivers it.
- **The sum from the record**: the record already holds it when the learner answered correctly, so no answer-bearing request is needed (spec FR-013). Spec FR-013 allows the equation after a reveal, but showing it would mean computing `a + b` in the app (constitution III) or requesting a step; the reveal tag already tells the learner what happened.
- **Recording nothing**: replay is reading the record, not learning activity.

**Alternatives considered**:
- **Rendering from the record alone, without the service**: this would not prove the identity, and spec FR-011 asks for resolution.
- **Requesting a validation to show the answer**: this would send a submission the learner never made, and could reveal an unrevealed result.

## R7. Dates

**Decision**: Dates use `Intl.DateTimeFormat` with `nb-NO` or `en-GB` and `{ dateStyle: "long" }` ("24. oktober 2026", "24 October 2026"), in the browser's time zone. No time of day appears in summaries, and nothing is derived from dates (no streaks, no "days in a row").

**Rationale**: These are the platform's localized formats, with no new dependency. Dates are context for the learner, not a measure.

**Alternatives considered**:
- **Relative dates ("2 days ago")**: they read as pressure and need more strings.
- **A date library**: unnecessary.

## R8. Page structure and wording

**Decision**: "My work" keeps its route `/record` and its storage notice and "Clear my work". For each skill it shows a level-2 heading with the skill's name, then:
- **The count sentence**: spec 002's `record.summary` ("{questions} questions: {details}").
- **The repeat sentence**, when there are repeats.
- **The lessons for the skill**: "{title}: viewed {n} times, last on {date}" (one form for a single view), followed once per page by the note "A view shows that you opened the lesson, not that you understood it."
- **"Show the questions"**: a disclosure (`details`) with the newest-first list, each item a link to its replay.

An empty record keeps spec 002's `record.empty` ("No questions yet.") and adds a link to the lessons. The exact wording is in `contracts/progress-view.md`; the Norwegian follows the prototype's "Leksjonen «…» er vist n ganger" and spec 002's outcome labels.

**Rationale**: It is spec 002's language, grouped. A native disclosure is keyboard- and screen-reader-operable without new components.

**Alternatives considered**:
- **A separate "Progress" page beside "My work"**: two places for the same record.
- **Tables of counts**: the spec asks for sentences a screen reader reads as text.

## R9. Tests, CI, and what stays out

**Decision**:
- **Tests**: as listed in the plan's Technical Context and each contract, plus a scan of the rendered "My work" and replay pages and the dictionaries for `%`, "score", "streak", "mastery", and their Norwegian equivalents ("poeng", "rekke", "mestring"). `e2e/progress.spec.ts` runs on both Playwright projects. No new CI job.
- **Out of scope** (as the spec states): "Repeat this question" and repeat avoidance (F7); profiles, persistence, and import (F9); recommendations and mastery; showing help or explanations in a replay; a progress view per lesson apart from the lesson history.

**Rationale**: The existing jobs already run each suite. The scan makes constitution I testable.

**Alternatives considered**: none worth recording.
