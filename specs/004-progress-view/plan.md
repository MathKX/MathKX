# Implementation Plan: Progress View, Lesson History, and Replay

**Branch**: `main` working tree, to be proposed from `claude/project-analysis-recommendations-5d72c1` as for specs 001 to 003 (the Spec Kit setup script reports `004-progress-view` from the feature directory) | **Date**: 2026-10-25 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/004-progress-view/spec.md`

## Summary

Turn "My work" into a progress view over the guest record. The content contract gains a localized skill name, required by the skill schema and checked by the validator, and all nine skill files get one. The service delivers skills with their names and their definitions through a new skill list. The learner app:
- **Groups deliveries by skill**, through the definition-to-skill map from that list, and shows spec 002's outcome counts per skill, with repeats marked.
- **Records a lesson view** when spec 003's lesson page reports the lesson shown, in the same browser record (an additive field, so existing records survive).
- **Lists lesson history** under the skills each lesson teaches.
- **Offers a read-only replay** of any recorded question at its own address. The replay re-resolves the identity from the service and shows the recorded work, but never a result the learner has not seen.

No new project, no server-side storage, no change to outcome derivation.

## Technical Context

**Language/Version**: As specs 002 and 003: C# on .NET 10 for the service and content loading; TypeScript 5.9 with React 19 for the learner app; Node.js for the content tooling

**Primary Dependencies**: None new. `Intl.DateTimeFormat` (built into the browser) formats dates; the existing remark, Designsystemet, and Tailwind stack is unchanged.

**Storage**: The guest record in `localStorage` (`mathkx.guest.v1`, schema version 1) gains an optional `lessonViews` list; the version is not bumped, because a mismatched version discards the whole record (`src/web/src/state/storage.ts`). No server-side storage (F9).

**Testing**:
- **`npm test` at the root**: the skill-name check, with a missing language, an empty name, a blank name, and a valid file.
- **`dotnet test`**: skill names loaded; `GET /api/skills` and `GET /api/skills/{id}` with names and definitions; contract tests.
- **`npm test` in `src/web`**: grouping and counting over scripted records, repeats, unknown definitions, old records, the lesson-view rules, replay (operands, no events, no unrevealed result, mismatch and unreachable), dictionaries and literals, and the no-percentage scan.
- **Playwright**: `e2e/progress.spec.ts` on the desktop and iPad projects.

**Target Platform**: As spec 003: browsers with MathML Core; the service on Azure App Service (Linux), deployed by `.github/workflows/deploy.yml` on every push to `main`

**Project Type**: Web application (the existing service and learner app; one deployable)

**Performance Goals**: "My work" renders a record of a few hundred deliveries without a noticeable delay (grouping and derivation are linear in the record); a replay shows within a second on a local network; CI stays under 10 minutes (spec SC-006)

**Constraints**:
- **Summaries**: counts only, with spec 002's wording and derivation unchanged.
- **Lesson views**: recorded only when spec 003 calls the lesson shown.
- **Replay**: records nothing, requests only the instance (never steps or validation), and shows a result only when the record holds a correct submission.
- **The guest record**: never leaves the browser; existing records load without loss.
- **Skill names**: content, reviewed like any lesson text.

**Scale/Scope**: Nine skill files (two with practice), one lesson, two practice definitions plus the fixed task, two languages; the record of one browser

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate (constitution section) | Evaluation before research | After design |
| --- | --- | --- |
| I Mastery over activity | Counts per outcome only; no percentage, score, streak, time, or mastery word; lesson views are labelled as "opened", never as understanding; repeats are visible rather than inflating new work | Pass; `contracts/progress-view.md` lists what may and may not appear, and a test scans the pages and dictionaries |
| II Mathematics independent of curricula | Grouping is by skill ID and its content name; no grade or curriculum appears; names are separate from identity as skill-graph.md requires | Pass |
| III Content configures; tested code computes | Skill names are content, checked by the schema and validator; outcome derivation is spec 002's; replay re-resolves the instance from the domain and computes nothing | Pass; the app reads the instance's operands and the recorded submissions, nothing mathematical |
| IV Reproducibility and honest results | Replay uses the stored `(definition, version, seed)` and refuses to show a different question when the operands disagree | Pass; `contracts/replay.md` |
| V Help before failure | Support stays visible as tags; a lesson view never changes an outcome | Pass |
| VI Accessible, bilingual, private | Both languages for every new string; counts read as sentences; 44-pixel targets; the record stays in the browser and replay sends only the identity | Pass |
| VII Calm and credible | No streaks, badges, or rankings; empty states point to lessons instead of scolding | Pass |
| Additional constraints | Changes in `content/`, `schemas/`, `tools/`, `src/backend/`, `src/web/`; no new project or dependency; F9 untouched | Pass |
| Development workflow and specification rules | Every behaviour tested; the content format and its schema change together with `AUTHORING.md`; no ADR changed | Pass |

No violation; the Complexity Tracking table is not needed.

## Project Structure

### Documentation (this feature)

```text
specs/004-progress-view/
├── plan.md              # This file
├── research.md          # Phase 0: decisions R1–R9
├── data-model.md        # Phase 1: content, service, and record entities
├── quickstart.md        # Phase 1: run, test, and prove the feature
├── contracts/
│   ├── skill-name.md        # the content-contract addition, validator diagnostics, the nine names to review
│   ├── api.md               # GET /api/skills and the skill shape with name and definitions
│   ├── progress-view.md     # "My work": grouping, counts, repeats, lesson history, wording, accessibility
│   ├── lesson-views.md      # when a view is recorded, the record field, clearing, compatibility
│   └── replay.md            # the replay page: what it shows, requests, and never shows
├── checklists/requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
schemas/skill.schema.json                 # CHANGED: required localized name
tools/lib/skills.mjs                      # CHANGED: blank-name check with field and language
tools/validate-content.test.mjs           # CHANGED: name cases
content/skills/*.json                     # CHANGED: a name for each of the nine skills
content/AUTHORING.md                      # CHANGED: the name field

src/backend/
├── MathKX.Domain/Content/Records.cs      # CHANGED: Skill.Name (Localized)
├── MathKX.Domain/Content/ContentCatalog.cs   # CHANGED: definitions per skill
├── MathKX.Api/Endpoints/ContentEndpoints.cs  # CHANGED: GET /api/skills; name and definitions on the skill
├── MathKX.Api/Dto/Dtos.cs                # CHANGED: SkillDto gains name and definitions
├── MathKX.Domain.Tests/Content/ContentCatalogTests.cs   # CHANGED
└── MathKX.Api.Tests/ContractTests.cs     # CHANGED

src/web/
├── src/api/types.ts, client.ts           # CHANGED: getSkills(); SkillDto.name and definitions
├── src/state/store.tsx                   # CHANGED: lessonViews in the persisted state, lessonViewed(), clear
├── src/state/progress.ts                 # NEW: grouping by skill, repeats, lesson history (pure functions)
├── src/pages/RecordPage.tsx              # CHANGED: the progress view
├── src/pages/ReplayPage.tsx              # NEW: /record/:deliveryId
├── src/pages/LessonPage.tsx              # CHANGED: records a lesson view when shown
├── src/router.tsx, App.tsx               # CHANGED: the replay route
├── src/i18n/nb.ts, en.ts                 # CHANGED: progress, history, replay strings; date formats
├── tests/progress.test.ts, lesson-views.test.tsx, replay.test.tsx, record-page.test.tsx   # NEW / CHANGED
└── e2e/progress.spec.ts                  # NEW
```

**Structure Decision**: No new project or root. Grouping and history are pure functions beside `outcomes.ts`, so they are tested without rendering; the record page and a new replay page consume them. The skill list is one new read-only endpoint in the existing content endpoints.

## Phase 0: Research

Complete; see [research.md](research.md). No `NEEDS CLARIFICATION` remains.

## Phase 1: Design

Complete; see [data-model.md](data-model.md), [contracts/](contracts/), and [quickstart.md](quickstart.md).

## Post-design constitution re-check

Re-evaluated on 2026-10-25 against the data model and contracts: all gates pass (table above). Four points examined:
- **Gate III**: replay shows a completed equation only from a recorded correct submission. After a reveal without one it shows the reveal tag and no sum, so the app never computes `a + b` (research R6; spec FR-013 allows the equation there but does not require it).
- **Gate IV**: replay shows the recorded work even when the service is unreachable, but never presents a resolved question with different operands as the recorded one; it says the question cannot be shown instead.
- **Gate I**: the repeat count and the lesson-view note keep the summary from overstating new work or understanding.
- **Gate VI**: adding `lessonViews` without bumping the storage version is the only way to keep learners' existing records. Readers default the field to an empty list, and a test loads a record written before this feature.

## Complexity Tracking

No constitution violations to justify.
