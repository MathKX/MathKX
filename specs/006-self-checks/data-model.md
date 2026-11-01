# Data Model: Self-Checks ("Check My Understanding")

Phase 1 of [plan.md](plan.md). The entities this feature adds or changes, by layer. The data models of specs 001 to 005 stand for everything not listed here. Names are the planned type names; the contracts give the exact shapes.

## Content (`content/checks/`, `schemas/self-check.pilot.schema.json`)

| Entity | Fields | Rules |
| --- | --- | --- |
| Check file (new) | `$schema`, `schemaVersion` (`"0.1-pilot"`), `id`, `version`, `skill`, `title { nb, en }`, `scope { nb, en }`, `questions: { definition, version, seed? }[]` | `(id, version)` unique among checks; `skill` exists; 1 to 10 questions; each names a pilot definition of that skill, with a seed when generated and none when fixed; no question listed twice ([contracts/check-content.md](contracts/check-content.md)) |

The pilot check is `numbers.addition.check-within-20`, version 1, for `numbers.addition-within-20`:

| Position | Definition | Version | Seed | Question (pinned by the domain fixture) |
| --- | --- | --- | --- | --- |
| 1 | `numbers.addition.within-10` | 1 | `22` | 7 + 3 |
| 2 | `numbers.addition.within-10` | 1 | `24` | 5 + 4 |
| 3 | `numbers.addition.crossing-ten` | 1 | `105` | 8 + 5 |
| 4 | `numbers.addition.crossing-ten` | 1 | `62` | 9 + 4 |

## Domain (`MathKX.Domain.Content`)

| Entity | Fields | Rules |
| --- | --- | --- |
| `SelfCheck` (new) | `Id`, `Version`, `Skill`, `Title: Localized`, `Scope: Localized`, `Questions: CheckQuestion[]`; `Key` = `id@version` | Loaded by `ContentLoader`; an unknown skill or definition fails the load, naming the file |
| `CheckQuestion` (new) | `Definition`, `Version`, `Seed?` (string); `Key` = `definition@version` | Resolved through `InstanceResolver` like any identity |
| `ContentCatalog` (changed) | gains `Checks` (by `id@version`), `LatestChecks()` (the newest version of each ID, by ID) | — |

## Service shapes (`MathKX.Api.Dto`)

| Shape | Fields | Notes |
| --- | --- | --- |
| `CheckDto` (new) | `Id`, `Version`, `Skill`, `Title`, `Scope` (`LocalizedDto`), `Questions: CheckQuestionDto[]` | `GET /api/checks`, `GET /api/checks/{id}/{version}`; identities only, never a sum |
| `CheckQuestionDto` (new) | `Definition`, `Version`, `Seed?` | — |
| `AnswerDto` (new) | `Identity`, `Answer: { Kind: "integer", Value }` | `GET /api/instances/{id}/{version}/{seed}/answer`; requested only by the check summary ([contracts/api.md](contracts/api.md)) |

## Learner app record (`src/web/src/state`)

| Entity | Fields | Rules |
| --- | --- | --- |
| `Delivery` (changed) | `purpose` widens to `"practice" \| "check"` | A check delivery lives only inside its run, never in `deliveries` |
| `CheckRun` (new) | `id`; `checkId`, `checkVersion`, `skillId`; `questions: { definitionId, version, seed? }[]` (a copy of the list at start); `deliveries: Delivery[]` (reached questions, in order: index *i* is position *i* + 1); `switchAt: number \| null` (1-based); `startedAt`; `finishedAt?`; `endedAt?`; `resume: CheckResume \| null` | One unfinished run per skill: starting another ends it with `endedAt`. A run is unfinished while it has neither `finishedAt` nor `endedAt`. A question's part is independent when its position is before `switchAt` (or `switchAt` is null), and supported otherwise ([contracts/check-run.md](contracts/check-run.md)) |
| `CheckResume` (new) | `draft`, `helpOpen`, `helpStep`, `explanationOpen`, `explanationStep`, `result: ValidationResponse \| null` | The current question's screen state, kept on the run so a reload, a language switch, or "Continue the check" restores it; `result` only in the supported part |
| `PersistedState` (changed) | gains `checkRuns: CheckRun[]` | Missing on hydrate gives `[]`; schema version stays 1; "Clear my work" empties it |
| Check screen state (in memory, new) | `check: { runId, instance, helpSteps, explanationSteps, checking, presenting, notice } \| null` | The fetched instance and step DTOs of the shown run; never persisted, fetched again on reload |

## Derived (never stored)

| Entity | Derivation |
| --- | --- |
| Position | The first position whose question is not closed; in the independent part, closed means it has a submission or `skipped`. In the supported part, closed means the learner moved on, shown by a delivery at the next position. |
| Check summary | From one run ([contracts/summary.md](contracts/summary.md)). **Independent groups**: *Correct on your own* (the only submission is `correct`); *Worth revisiting* (the only submission is anything else); *Skipped* (`skipped`). **Supported part**: from `switchAt` onward, each with spec 002's `derive` outcome. **Not answered**: positions of an ended run with no closed question, in either part. |
| Checks in "My work" | Per skill, the runs of its checks, newest first by `startedAt`; counts only for finished or ended runs |
