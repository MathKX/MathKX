# Data Model: Progress View, Lesson History, and Replay

Phase 1 of [plan.md](plan.md). Entities this feature adds or changes, by layer. The data models of [spec 002](../002-practice-flow/data-model.md) and [spec 003](../003-lesson-rendering/data-model.md) stand for everything not listed here. Names are the planned type names; the contracts give the exact shapes.

## Content (`content/skills/*.json`, `schemas/skill.schema.json`)

| Entity | Fields | Rules |
| --- | --- | --- |
| Skill file (changed) | gains `name`: `{ nb, en }` | Required; both languages non-empty and not only whitespace; no other keys; `schemaVersion` stays `"0.1"` ([contracts/skill-name.md](contracts/skill-name.md)) |

## Content snapshot (`MathKX.Domain.Content`, filled by `MathKX.Content`)

| Entity | Fields | Rules |
| --- | --- | --- |
| `Skill` (changed) | gains `Name` (`Localized`) | Read from the file; the loader fails with the path if it is missing (the validator runs first in CI, so this is a guard, not a diagnostic) |
| `ContentCatalog` (changed) | gains `DefinitionsForSkill(skillId)`: keys `id@version` of every definition whose `skill` is the skill, ordinally sorted | Includes definitions that are not on the ladder |

## Service shapes (`MathKX.Api.Dto`)

| Shape | Fields | Notes |
| --- | --- | --- |
| `SkillDto` (changed) | `Id`, `Name` (`{ nb, en }`), `Prerequisites`, `Ladder` (`[]` when absent), `Definitions` | Returned by `GET /api/skills` (list, ID order) and `GET /api/skills/{id}` ([contracts/api.md](contracts/api.md)) |

## Learner app record (`src/web/src/state`)

| Entity | Fields | Rules |
| --- | --- | --- |
| `PersistedState` (changed) | gains `lessonViews: LessonView[]` | Missing on hydrate → `[]`; storage schema version stays 1; cleared by "Clear my work" |
| `LessonView` (new) | `lessonId`, `language` (`nb`, `en`), `at` (ISO timestamp) | Appended once per visit that shows the lesson, through the guard that records spec 003's lesson event; no time window and no cap, like deliveries ([contracts/lesson-views.md](contracts/lesson-views.md)) |
| `Delivery` (unchanged) | as spec 002 | Replay and the progress view only read it |

## Derived view (`src/web/src/state/progress.ts`, never stored)

| Entity | Fields | Derivation |
| --- | --- | --- |
| `SkillGroup` | `skillId` (or `null` for "Other practice"), `deliveries` (newest first, outcome not "none"), `summary` (spec 002's `summarize`), `repeatCount`, `lessons: LessonHistory[]`, `lastActivity` | Delivery → skill through `SkillDto.definitions`; lessons through each lesson's `skills` ([contracts/progress-view.md](contracts/progress-view.md)) |
| `LessonHistory` | `lessonId`, `views`, `last` | Count and latest `at` of the views of one lesson |
| Repeat | a delivery ID | An earlier delivery has the same `definitionId`, `version`, `a`, and `b`, in that order |

## Replay (`src/web/src/pages/ReplayPage.tsx`, never stored)

| State | Meaning | Shown |
| --- | --- | --- |
| `loading` | the instance request is in flight | the recorded date and work; the expression area waits |
| `matched` | the resolved `a` and `b` equal the recorded ones | the resolved expression and the recorded work |
| `unavailable` | the request failed, or the operands differ | the recorded expression and work, and `replay.unavailable` |
| `notFound` | the delivery ID is not in the record | `replay.notFound` and the link back |

No state transition writes to the store ([contracts/replay.md](contracts/replay.md)).
