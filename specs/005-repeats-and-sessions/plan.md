# Implementation Plan: Repeat Avoidance, "Repeat This Question", and Session Controls

**Branch**: `main` working tree, to be proposed from `claude/project-analysis-recommendations-5d72c1` as for specs 001 to 004 (the Spec Kit setup script reports `005-repeats-and-sessions` from the feature directory) | **Date**: 2026-10-26 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/005-repeats-and-sessions/spec.md`

## Summary

Three additions to practice, all over the guest record in the browser:

- **Avoiding recent questions**: the service publishes each variation's pool, every question with the smallest seed that produces it, as operands and seeds, never sums. The learner app keeps today's random draw. When the drawn question is among the last eight of that variation (in either order), the app picks, from that same draw, one of the pool's questions outside the window and requests that question's seed instead. So a question costs at most two instance requests; avoidance never changes what an identity resolves to; and the recent history never leaves the browser. When every question of the variation is recent, the drawn question is delivered, marked as a repeat, and a notice says so.
- **"Repeat this question"**: offered on the practice screen once a question has a result, and in a replay. It delivers the same identity as a new delivery that records which delivery it repeats and why ("on request"). "My work" and replay tag it apart from chance repeats.
- **"Finish practice"**: ends the session as leaving does, keeping an unanswered question resumable. It takes a snapshot of the session's questions (those worked since the last finish, including any resumed) and shows it as counts and repeats, with "Practise again".

No new project; no change to generation, validation, or outcome derivation.

## Technical Context

**Language/Version**: As specs 002 to 004: C# on .NET 10 for the service; TypeScript 5.9 with React 19 for the learner app

**Primary Dependencies**: None new

**Storage**: The guest record (`mathkx.guest.v1`, schema version 1) gains, all additively and without a version bump:
- on a delivery, `repeatOf` (a delivery ID) and `repeatReason` (`"requested"` or `"exhausted"`);
- on the record, `session`: the questions worked in the current session, and a snapshot of the last finished one.

The service stores nothing.

**Testing**:
- **`dotnet test`**: the pool's smallest seeds (coverage within a fixed limit, determinism, every seed resolving to its question, a fixture of the first entries); `GET /api/definitions/{id}/{version}/pool` contract tests (shape, no sum, fixed task, unknown definition).
- **`npm test` in `src/web`**:
  - choosing a question (pure functions over scripted records: the window, either order, per variation, exhaustion, at most two instance requests, the passed-over question never recorded);
  - repeat on request from practice and replay;
  - outcome independence and tags;
  - finishing, the summary, and "Practise again";
  - dictionaries, literals, and the wording scan.
- **Playwright**: `e2e/repeats.spec.ts` on the desktop and iPad projects.

**Target Platform**: As specs 003 and 004

**Project Type**: Web application (the existing service and learner app; one deployable)

**Performance Goals**: A question shows within one second of the request on a local network, as today, with at most one pool request per variation per visit and at most two instance requests per question. The service computes each pool's seeds once, at startup, within a fixed limit (spec FR-005, SC-006).

**Constraints**:
- **Identity**: avoidance only chooses which identity is delivered; it never changes generation or the identity rule (ADR 0004). Passed-over questions are neither shown nor recorded.
- **Privacy**: the recent history stays in the browser. The service receives only the identities it already receives for questions.
- **Outcomes**: derivation is unchanged; a repeat's outcome uses its own events only.
- **Wording**: no percentage, score, streak, time, or mastery word in the summary.

**Scale/Scope**: Two generated variations (45 and 36 ordered questions; 25 and 20 when order is ignored) and one fixed task; the record of one browser

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate (constitution section) | Evaluation before research | After design |
| --- | --- | --- |
| I Mastery over activity | Avoidance makes practice cover the variation instead of repeating by chance; deliberate repeats are visible and never inflate first attempts; the summary uses counts only | Pass; `contracts/session.md` lists what may appear, and the wording scan covers it |
| II Mathematics independent of curricula | Pools and windows are per variation (definition and version), not per grade or curriculum | Pass |
| III Content configures; tested code computes | The pool and each question's smallest seed come from the tested domain generator and its canonical enumeration; the app compares operands it already receives and computes no answers | Pass; `contracts/pool.md` |
| IV Reproducibility and honest results | Every delivery keeps (definition, version, seed); a chosen question's seed is one the generator maps to it; exhaustion is stated honestly; a repeat's outcome is its own | Pass; replay fixtures cover avoided-and-delivered and repeated questions |
| V Help before failure | Help is unchanged; help on an earlier attempt does not taint a repeat (DL-015) | Pass |
| VI Accessible, bilingual, private | Both languages for every new string; polite announcements; 44-pixel targets; the record and its recent questions stay in the browser | Pass |
| VII Calm and credible | No streaks or scores in the summary; the exhausted-pool notice explains instead of hiding the repeat | Pass |
| Additional constraints | Changes in `src/backend/` and `src/web/`; no new project, dependency, or storage; F8 and F9 untouched | Pass |
| Development workflow and specification rules | Every behaviour tested; the guest record changes additively with old records loading; no ADR changed | Pass |

No violation; the Complexity Tracking table is not needed.

## Project Structure

### Documentation (this feature)

```text
specs/005-repeats-and-sessions/
├── plan.md              # This file
├── research.md          # Phase 0: decisions R1–R8
├── data-model.md        # Phase 1: domain, service, and record entities
├── quickstart.md        # Phase 1: run, test, and prove the feature
├── contracts/
│   ├── pool.md          # GET /api/definitions/{id}/{version}/pool and the smallest-seed table
│   ├── selection.md     # choosing a question: the window, the bounded search, exhaustion
│   ├── repeat.md        # "Repeat this question" from practice and replay; record fields; tags
│   └── session.md       # "Finish practice", session membership, the snapshot summary, "Practise again"
├── checklists/requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
src/backend/
├── MathKX.Domain/Generators/QuestionPool.cs       # NEW: the pool with each question's smallest seed, within a fixed limit
├── MathKX.Domain.Tests/Generators/QuestionPoolTests.cs   # NEW
├── MathKX.Api/Endpoints/DefinitionsEndpoints.cs   # NEW: GET /api/definitions/{id}/{version}/pool
├── MathKX.Api/Dto/Dtos.cs                          # CHANGED: PoolDto
├── MathKX.Api/Program.cs                           # CHANGED: map the endpoint; pools computed at startup
└── MathKX.Api.Tests/ContractTests.cs              # CHANGED

src/web/
├── src/api/types.ts, client.ts                    # CHANGED: getPool()
├── src/state/selection.ts                         # NEW: recent window, choosing among the pool (pure)
├── src/state/observations.ts                      # CHANGED: Delivery.repeatOf, repeatReason
├── src/state/store.tsx                            # CHANGED: avoidance in load(), repeatQuestion(), finishPractice(), session
├── src/state/progress.ts                          # CHANGED: repeat kind (on request, by chance)
├── src/components/ExerciseShell.tsx               # CHANGED: "Repeat this question", "Finish practice", the exhausted notice
├── src/pages/ReplayPage.tsx                       # CHANGED: "Repeat this question"
├── src/pages/RecordPage.tsx                       # CHANGED: tag and sentence for repeats on request
├── src/pages/SessionPage.tsx                      # NEW: /session, the summary of the last finished session
├── src/router.tsx, App.tsx                        # CHANGED: the session route
├── src/i18n/nb.ts, en.ts                          # CHANGED: new strings
├── tests/selection.test.ts, repeat.test.tsx, session.test.tsx   # NEW
├── tests/progress.test.ts, record-page.test.tsx, replay.test.tsx, progress-wording.test.tsx   # CHANGED
└── e2e/repeats.spec.ts                            # NEW
```

**Structure Decision**: No new project. The pool is a domain computation exposed by one read-only endpoint beside the instance endpoint; choosing is a pure function in the app beside `progress.ts`, called from the store's single question-loading path. The session summary is a page, so it survives a reload.

## Phase 0: Research

Complete; see [research.md](research.md). No `NEEDS CLARIFICATION` remains.

## Phase 1: Design

Complete; see [data-model.md](data-model.md), [contracts/](contracts/), and [quickstart.md](quickstart.md).

## Post-design constitution re-check

Re-evaluated on 2026-10-26 against the data model and contracts: all gates pass (table above). Four points examined:
- **Gate IV**: a chosen question is requested by a seed the generator itself maps to it, found by trying seeds from 0 upwards within a fixed limit. The identity rule is untouched, and a replay of any delivery, avoided or repeated, resolves to the same question.
- **Gate VI**: the browser decides what is recent; the service sees only the identities it already sees for questions, never a list of recent questions or outcomes.
- **Gate I**: a repeat on request is counted as a question (it is practice), tagged, and counted again in the skill's repeat sentence, so "My work" never reads it as new work.
- **Spec 002 and 003 checks**: the first draw is unchanged, so their golden-seed end-to-end checks, which start from a cleared record, keep their questions.

## Complexity Tracking

No constitution violations to justify.
