# Implementation Plan: Self-Checks ("Check My Understanding")

**Branch**: `main` working tree, proposed from `claude/project-analysis-recommendations-5d72c1` as for specs 001 to 005 (the Spec Kit setup script reports `006-self-checks` from the feature directory) | **Date**: 2026-11-01 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/006-self-checks/spec.md`

## Summary

A self-check is a short authored list of questions that the learner answers on their own, with an explicit one-way switch to supported practice and an honest summary at the end. Four parts:

- **Content**: a new file kind, `content/checks/**.json` with `schemas/self-check.pilot.schema.json`. A check names one skill, a title and scope in both languages, and 1 to 10 questions, each an exercise identity (definition, version, and a seed for a generated definition). The content check gains the cross-file rules (`tools/lib/checks.mjs`); the domain tests confirm each question resolves and pin the pilot's four questions. The pilot check `numbers.addition.check-within-20` asks `7 + 3`, `5 + 4`, `8 + 5`, and `9 + 4`.
- **Service**: the loader reads checks into the catalog and fails the start on a broken reference. Two read-only endpoints serve them (`GET /api/checks`, `GET /api/checks/{id}/{version}`), and one serves a question's answer for the summary (`GET /api/instances/{id}/{version}/{seed}/answer`). Validation, steps, and instances are unchanged and reused.
- **Learner app**: a start screen at `/checks/{checkId}` and a run at `/checks/{checkId}/{runId}`. The run shows independent questions in a component that has no help, explanation, or lesson code at all. After a switch, it shows supported questions in the practice workspace, extracted from `ExerciseShell` so both use it. At the end, the same route shows the summary, derived by a pure function from the recorded run. Answers are validated on save, as in practice, and the result is recorded but never rendered before the summary.
- **Record and "My work"**: the guest record gains `checkRuns`, kept apart from practice's `deliveries`. Practice's counts, repeats, avoidance window, and sessions therefore never see check questions, by construction. "My work" lists each skill's runs in a part of their own, with counts only for runs that are over.

No new project or dependency. No change to generation, validation, outcome derivation, or the identity rule.

## Technical Context

**Language/Version**: As specs 002 to 005: C# on .NET 10 for the service; TypeScript 5.9 with React 19 for the learner app; Node 20 for the content check

**Primary Dependencies**: None new

**Storage**:
- **Content**: one new schema and file kind under `content/checks/`.
- **Guest record**: `mathkx.guest.v1` gains `checkRuns` additively, without a schema version change. A record written before it loads with none.
- **Service**: stores nothing.

**Testing**:
- **`npm test` at the root** (content check): the pilot passes, and each FR-018 case fails with file, field, and problem. The cases are an unknown definition or version, a seed on a fixed definition, a missing seed on a generated one, a duplicate, another skill's definition, a missing language, an empty list, a list over ten, a duplicate check identity, and a lesson `check` field.
- **`dotnet test`**:
  - **Loader**: reads checks; broken references fail the start, naming the file.
  - **Check questions**: every check question in `content/` resolves; the questions of a check are distinct as questions; the pilot fixture pins `7 + 3`, `5 + 4`, `8 + 5`, and `9 + 4`.
  - **Contract tests**: the three endpoints (shapes, no sum in the check shapes, unknown check or version, a fixed task's answer).
- **`npm test` in `src/web`**:
  - **Grouping**: a pure function over scripted runs, covering every combination of correct, wrong, and skipped on four questions, a switch at every position, ended runs, and DL-036.
  - **The run**: absences in the independent part (DOM, accessibility tree, and requests); the switch; the supported part; save failures and input guidance.
  - **Resume**: after a reload and after a language switch.
  - **"My work"**: separation from practice.
  - **Dictionaries, literals, and the wording scan.**
- **Playwright**: `e2e/checks.spec.ts` on the desktop and iPad projects.

**Target Platform**: As specs 003 to 005

**Project Type**: Web application (the existing service and learner app; one deployable)

**Performance Goals**:
- **Questions**: each check question shows within one second of the request on a local network, as in practice: one instance request per question, no pool request.
- **Summary**: one answer request per question without a correct saved answer, and one instance request per question to confirm it still resolves.

**Constraints**:
- **Independence by construction**: the independent part's component imports nothing that can show or fetch help, an explanation, a lesson, or a result. Tests assert the absences in the DOM, the accessibility tree, and the requests (FR-004, SC-001).
- **Separation by construction**: check questions live in `checkRuns`, so every practice derivation, which reads `deliveries`, is unchanged (FR-014).
- **Identity**: each question is delivered exactly as listed, by its identity; avoidance never applies (FR-006, ADR 0004).
- **Privacy**: answers are sent only as in practice (identity, text, submission ID). The record stays in the browser (FR-023).
- **Wording**: no score, percentage, streak, time, or mastery word in the start screen, the summary, or "My work" (FR-012).

**Scale/Scope**: One pilot check of four questions over two definitions of one skill; the record of one browser

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate (constitution section) | Evaluation before research | After design |
| --- | --- | --- |
| I Mastery over activity | The summary groups independent answers and counts them; no score, percentage, or mastery word; "Practise more" never changes a check's result | Pass; `contracts/summary.md` lists everything that may appear, and the wording scan covers it |
| II Mathematics independent of curricula | A check names a skill by its stable ID, never a grade; lessons find checks through their skills | Pass |
| III Content configures; tested code computes | A check is data: identities and texts, no expressions. The domain resolves each question; the service supplies the answer for the summary; the app computes no sum | Pass; `contracts/check-content.md`, `contracts/api.md` |
| IV Reproducibility and honest results | Each question is delivered by its listed identity; the summary is derived from the recorded run, so later content versions never change it; a missing result is never shown as wrong | Pass; the summary is a pure function of the record, tested with fixtures |
| V Help before failure; accommodation is not help | DL-028: no help inside the independent part, an explicit one-way switch, and help as in practice afterwards; keyboard, screen reader, zoom, and the language switch stay available and are never recorded | Pass; `contracts/check-run.md` |
| VI Accessible, bilingual, private | Every new string in both languages; focus moves to each question, the confirmation, and the summary heading; 44-pixel targets; the record stays in the browser | Pass |
| VII Calm and credible | Policy before start; "a snapshot, not a final judgement"; "Worth revisiting" only on independent answers that were saved and not correct (DL-036) | Pass |
| Additional constraints | Changes in `content/`, `schemas/`, `tools/`, `src/backend/`, and `src/web/`; no new project, dependency, or storage; F9 untouched | Pass |
| Development workflow and specification rules | Every behaviour tested; schema and authoring guide change together; the guest record changes additively; no ADR changed | Pass |

No violation; the Complexity Tracking table is not needed.

## Project Structure

### Documentation (this feature)

```text
specs/006-self-checks/
├── plan.md              # This file
├── research.md          # Phase 0: decisions R1–R11
├── data-model.md        # Phase 1: content, domain, service, and record entities
├── quickstart.md        # Phase 1: run, test, and prove the feature
├── contracts/
│   ├── check-content.md # the check file, its schema, the content check's rules, the domain tests
│   ├── api.md           # GET /api/checks, GET /api/checks/{id}/{version}, GET .../answer
│   ├── check-run.md     # start screen, independent part, switch, supported part, record, resume
│   └── summary.md       # the summary's groups and texts, and checks in "My work"
├── checklists/requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
schemas/self-check.pilot.schema.json                      # NEW
content/checks/numbers/addition-within-20.json            # NEW: the pilot check
content/AUTHORING.md                                      # CHANGED: the check file, its fields and rules, finding a seed
tools/lib/files.mjs                                       # CHANGED: the check kind; the lesson `check` message
tools/lib/checks.mjs                                      # NEW: cross-file rules for checks
tools/lib/diagnostics.mjs, tools/validate-content.mjs     # CHANGED: run the rules; the summary line counts checks
tools/validate-content.test.mjs                           # CHANGED

src/backend/
├── MathKX.Domain/Content/Records.cs                     # CHANGED: SelfCheck, CheckQuestion
├── MathKX.Domain/Content/ContentCatalog.cs              # CHANGED: Checks, ChecksForSkill
├── MathKX.Content/ContentLoader.cs                      # CHANGED: load checks; references fail the start
├── MathKX.Api/Endpoints/ChecksEndpoints.cs              # NEW: GET /api/checks, GET /api/checks/{id}/{version}
├── MathKX.Api/Endpoints/InstancesEndpoints.cs           # CHANGED: GET .../answer
├── MathKX.Api/Dto/Dtos.cs                               # CHANGED: CheckDto, CheckQuestionDto, AnswerDto
├── MathKX.Api/Program.cs                                # CHANGED: map the endpoints; health counts checks
├── MathKX.Domain.Tests/Content/CheckQuestionsTests.cs   # NEW
├── MathKX.Domain.Tests/Fixtures/checks.pilot.json       # NEW: the pilot's operands
├── MathKX.Domain.Tests/Content/ContentCatalogTests.cs   # CHANGED: loader cases
└── MathKX.Api.Tests/ContractTests.cs                    # CHANGED

src/web/
├── src/api/types.ts, client.ts                          # CHANGED: getChecks(), getCheck(), getAnswer()
├── src/state/checks.ts                                  # NEW: CheckRun, position, the summary's grouping (pure)
├── src/state/observations.ts                            # CHANGED: Delivery.purpose gains "check"
├── src/state/store.tsx                                  # CHANGED: checkRuns, the check screen state, check actions; shared step recording
├── src/state/progress.ts                                # CHANGED: a skill with only check runs is listed
├── src/components/QuestionWorkspace.tsx                 # NEW: extracted from ExerciseShell (prompt, field, help, result, explanation, lesson link)
├── src/components/ExerciseShell.tsx                     # CHANGED: the workspace plus practice's controls
├── src/components/CheckEntry.tsx                        # NEW: "Check my understanding" for a skill's checks
├── src/pages/CheckStartPage.tsx                         # NEW: /checks/{checkId}
├── src/pages/CheckRunPage.tsx                           # NEW: /checks/{checkId}/{runId}: independent question, switch, supported question, summary
├── src/pages/CheckSummary.tsx                           # NEW: the summary (explanations through a local StepPanel, recording nothing)
├── src/pages/LessonPage.tsx, PracticePage.tsx, RecordPage.tsx   # CHANGED: the entry; checks in "My work"; the detour from a supported check question
├── src/router.tsx, App.tsx                              # CHANGED: the two routes
├── src/i18n/nb.ts, en.ts                                # CHANGED: the `check` section
├── tests/checks.test.ts                                 # NEW: grouping and position over scripted runs
├── tests/check-run.test.tsx, check-record.test.tsx      # NEW
├── tests/exercise-shell.test.tsx, record-page.test.tsx, progress-wording.test.tsx, dictionaries.test.ts   # CHANGED
└── e2e/checks.spec.ts                                   # NEW
```

**Structure Decision**: No new project. A check is a content kind beside definitions and lessons, loaded by the same loader and checked by the same tool. The app keeps one store and one persisted record. Check runs are a separate collection in that record, and the practice workspace becomes a shared component, so the supported part reuses practice's behaviour without sharing practice's current question.

## Phase 0: Research

Complete; see [research.md](research.md). No `NEEDS CLARIFICATION` remains.

## Phase 1: Design

Complete; see [data-model.md](data-model.md), [contracts/](contracts/), and [quickstart.md](quickstart.md).

## Post-design constitution re-check

Re-evaluated on 2026-11-01 against the data model and contracts: all gates pass (table above). Five points examined:
- **Gate V**: the independent part cannot open help by accident, because its component has no path to it. The switch is the only way to help, it is confirmed first, and it records the position. A visit to a lesson outside the check is a lesson view (spec 004), never help on a check question. The app cannot observe work outside itself, and the summary claims nothing about it.
- **Gate IV**: the summary reads only the recorded run, which holds its own copy of the question list. A new version of the check or of a definition changes nothing already recorded. A question whose identity no longer resolves keeps its recorded answer and loses only its explanation, with a sentence saying so.
- **Gate III**: the summary's correct answer comes from the service (`contracts/api.md`), never from adding the operands in the app. This adds a third place a sum may appear, after a correct validation and a revealing step, and only the summary requests it.
- **Gate I**: check questions never enter practice's counts, repeats, avoidance window, or sessions, because they are not in `deliveries`. "Practise more" starts ordinary practice and says it does not change the check.
- **Specs 002 to 005**: the workspace extraction keeps every practice test identifier and behaviour; their unit and end-to-end tests run unchanged as the regression check.

## Complexity Tracking

No constitution violations to justify.
