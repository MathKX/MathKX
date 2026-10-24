# Implementation Plan: Lesson Rendering and the Detour Back to an Exercise

**Branch**: `main` working tree, to be proposed from `claude/project-analysis-recommendations-5d72c1` as for specs 001 and 002 (the Spec Kit setup script reports `003-lesson-rendering` from the feature directory) | **Date**: 2026-10-24 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/003-lesson-rendering/spec.md`

## Summary

Render the pilot lesson inside the learner app and make the route between a question and its lesson honest. The service starts serving each lesson's Markdown and assets from the content snapshot it already loads, and gains two small read-only surfaces built on existing domain code: a disclosure flag per lesson on every resolved question (does this lesson show this question's answer, decided in `MathKX.Domain` from facts `MathKX.Content` extracts from both language files), and step models for the visuals a lesson places with authored values. The learner app parses the Markdown with the same unified/remark stack and versions the content validator uses, renders the tree to React with no raw HTML, draws notation as MathML from a TypeScript port of the pilot grammar, and gates the lesson page: while the current question is unanswered and the lesson lists its definition, a disclosing lesson is neither fetched nor shown until the learner confirms; once shown, the visit records `lesson-opened` or `lesson-reveal` and offers "Back to your question". Spec 002's outcome derivation stays as it is; the tag set gains `lessonAfter`. No new service state, no persistence, no new project.

## Technical Context

**Language/Version**: C# on .NET 10 for the domain, the content loader, and the service (as spec 002); TypeScript 5.9 with React 19 for the learner app

**Primary Dependencies**: Backend: Markdig 1.4.0 (MIT) in `MathKX.Content` only, for finding mathematics in lesson Markdown (the newest release older than two weeks at implementation; 1.5.0 was a day old); the domain stays dependency-free. Web: `unified` 11.0.5, `remark-parse` 11.0.0, `remark-gfm` 4.0.1, `remark-frontmatter` 5.0.0, `remark-directive` 4.0.0, `remark-math` 6.0.0, `unist-util-visit` 5.1.0, `mdast-util-to-string` 4.0.0 and `@types/mdast`, the exact versions the root content tooling pins (research R1). No Markdown-to-HTML library, no KaTeX or MathJax.

**Storage**: None new. Lesson content comes from `content/` through the service's startup snapshot; the detour and visit state live in the existing guest store (`localStorage`, `mathkx.guest.v1`), with the persisted shape extended compatibly.

**Testing**: `dotnet test` (disclosure fixtures for all 81 pilot instances, the lesson-facts agreement fixture, visual step models, contract tests for the new endpoints and the instance field); `npm test` in `src/web` (renderer against both pilot files, notation agreement with `tools/lib/notation.mjs`, parse agreement with `tools/lib/markdown.mjs`, gate and recording, `lessonAfter`, dictionaries and literals); `npm test` at the root (the lesson-facts agreement fixture through the validator's parser); Playwright `e2e/lesson.spec.ts` on the desktop and iPad projects

**Target Platform**: As spec 002: iPad Safari and desktop browsers with MathML Core support (Safari, Firefox, Chromium 109 and later); the service on Azure App Service (Linux), deployed by `.github/workflows/deploy.yml` on every push to `main` after the tests and content checks pass, so each merge of this feature goes to production (`tasks.md` "Deployment" sets the merge boundaries)

**Project Type**: Web application (the existing service and learner app; one deployable)

**Performance Goals**: The lesson page renders within a second on a local network; the Markdown parser and lesson components load as a separate chunk so the practice route does not pay for them; CI stays under 10 minutes (spec SC-008)

**Constraints**: The answer to a question is never sent to the learner's browser to decide disclosure; a disclosing lesson is not fetched for a detour before the learner confirms; lesson events are recorded only when the lesson is shown; no raw HTML from Markdown is ever rendered; every learner-visible string from the dictionaries or the content; the renderer implements exactly the `0.1-pilot` contract

**Scale/Scope**: One lesson, two languages, three directives, three visual components, two practice definitions (81 instances a lesson can be opened from)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate (constitution section) | Evaluation before research | After design |
| --- | --- | --- |
| I Mastery over activity: reading is not evidence; help never penalised | Only the detour events of spec 002's model are recorded; no "Lesson viewed" or reading metrics (F6); outcomes unchanged; `lessonAfter` is a tag | Pass; `contracts/detour.md` lists every event this feature can record |
| II Mathematics independent of curricula | Lessons, skills, and definitions by stable ID; nothing per grade | Pass |
| III Content configures; tested code computes | The disclosure decision, the lesson visuals' steps, and the ten-frame explorer's pairs come from `MathKX.Domain`; the app renders Markdown and MathML and decides nothing mathematical; Markdown stays declarative (three directives, validated attributes) | Pass; `contracts/disclosure.md`, `contracts/api.md` |
| IV Reproducibility and honest results | Instance identity unchanged; the disclosure flag is a pure function of (lesson snapshot, instance); a reveal is recorded only when the lesson was shown | Pass |
| V Help before failure | The notice offers visual help instead of the lesson; a lesson without this answer is help, not a reveal | Pass |
| VI Accessible, bilingual, private by design | Tables with header cells, MathML, text alternatives, keyboard and touch for both visuals, dictionary parity; "Suggest an improvement" carries no learner data; no analytics | Pass; `contracts/lesson-renderer.md` |
| VII Calm and credible | The notice is plain information with a choice, not a warning; no gamified reading | Pass |
| Additional constraints: stack and layout | Changes inside `src/backend/` and `src/web/`; one new package in `MathKX.Content` and the remark stack in the web app | Pass |
| Additional constraints: undecided matters | No profiles, sessions, retention, mastery algorithm, or AI; Exercise Format v1 untouched; the lesson contract stays `0.1-pilot` | Pass |
| Development workflow and specification rules | Every behaviour with tests; documentation updated where a contract changes (spec 002's observation contract gains `lessonAfter`, CONTRIBUTING gains the preview steps); no ADR changed | Pass |

No violation; the Complexity Tracking table is not needed.

## Project Structure

### Documentation (this feature)

```text
specs/003-lesson-rendering/
├── plan.md              # This file
├── research.md          # Phase 0: decisions R1–R11
├── data-model.md        # Phase 1: content, domain, service, and session entities
├── quickstart.md        # Phase 1: run, test, and prove the feature
├── contracts/
│   ├── api.md               # new endpoints and the instance's lessons field (additions to spec 002's api.md)
│   ├── disclosure.md        # the DL-026 (2) rule, lesson facts, the 81-instance fixture, the agreement fixture
│   ├── lesson-facts.fixture.json   # Markdown snippets with the facts remark extracts; C# and the validator test against it
│   ├── lesson-renderer.md   # Markdown and directive mapping, notation, sections, contribution links, accessibility
│   └── detour.md            # the gate, the notice, recording, the way back, lessonAfter, end-to-end checks
├── checklists/requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks): 61 tasks in eight phases
```

### Source Code (repository root)

```text
src/backend/
├── MathKX.Domain/
│   ├── Lessons/LessonFacts.cs            # NEW: expressions and visuals of one lesson translation (no I/O)
│   ├── Lessons/LessonDisclosure.cs       # NEW: DL-026 (2) for addition instances
│   ├── Explanations/StepModels.cs        # CHANGED: steps for authored values as well as instances
│   └── Explanations/TenFrameExplorer.cs  # NEW: the explorer's eleven (filled, partner) states
├── MathKX.Content/
│   ├── LessonFactsReader.cs              # NEW: Markdig (mathematics) + directive lines -> LessonFacts
│   └── ContentLoader.cs                  # CHANGED: keeps each translation's Markdown and facts, lists assets
├── MathKX.Domain/Content/ContentCatalog.cs, Records.cs   # CHANGED: lesson bodies, facts, assets in the snapshot
├── MathKX.Api/
│   ├── Endpoints/ContentEndpoints.cs     # CHANGED: lesson content and assets
│   ├── Endpoints/VisualsEndpoints.cs     # NEW: steps for lesson visuals with authored values
│   └── Dto/Dtos.cs                       # CHANGED: InstanceDto.lessons, LessonContentDto, VisualStepsDto
├── MathKX.Domain.Tests/
│   ├── Lessons/LessonDisclosureTests.cs  # all 81 pilot instances; language agreement
│   ├── Lessons/LessonFactsReaderTests.cs # the shared agreement fixture
│   └── Explanations/StepModelTests.cs    # CHANGED: authored values equal instance steps
└── MathKX.Api.Tests/ContractTests.cs     # CHANGED: new endpoints, instance lessons, asset safety

src/web/
├── src/lesson/                           # NEW, loaded as its own chunk
│   ├── parse.ts                          # the remark stack, anchors, directive attributes
│   ├── render.tsx                        # mdast -> React, placeholders for anything unsupported
│   ├── LessonView.tsx                    # the lazily loaded chunk entry
│   ├── Placeholder.tsx                   # the visible stand-in, outside the chunk
│   ├── notation.ts                       # TypeScript port of the pilot grammar -> MathML tree
│   ├── MathNotation.tsx                  # <math> rendering, inline and display
│   ├── sections.ts                       # section in view, restore after a language switch
│   └── contribute.ts                     # source and issue links (no learner data)
├── src/components/math/TenFrameExplorer.tsx, StepVisual.tsx   # NEW: lesson visuals on the existing TenFrame/Groups/MakeTen
├── src/components/LessonGate.tsx, ReturnBanner.tsx            # NEW: the notice and the way back
├── src/pages/LessonPage.tsx              # CHANGED: gate, body, practice entries in place, links
├── src/components/ExerciseShell.tsx      # CHANGED: lesson link from the instance's lessons, ?from=question in its target
├── src/router.tsx                        # CHANGED: routes match on the path; the query string is exposed
├── src/state/store.tsx, observations.ts, outcomes.ts   # CHANGED: visit state, recording when shown, lessonAfter
├── src/api/client.ts, types.ts           # CHANGED: new calls and fields
├── src/i18n/nb.ts, en.ts                 # CHANGED: lesson, notice, banner, explorer, contribution strings
├── tests/lesson-render.test.tsx, notation.test.ts, parse-agreement.test.ts, lesson-gate.test.tsx   # NEW
└── e2e/lesson.spec.ts                    # NEW

tools/validate-content.test.mjs           # CHANGED: the lesson-facts agreement fixture through the validator's parser
specs/002-practice-flow/contracts/observations.md   # CHANGED: the lessonAfter tag
CONTRIBUTING.md, src/web/README.md        # CHANGED: local lesson preview
.github/workflows/build-and-test.yml      # CHANGED: the web job also installs the root tooling for agreement tests
```

**Structure Decision**: No new project or directory root. The lesson renderer is a folder of the learner app that Vite splits into its own chunk; the disclosure rule and lesson facts are domain types beside the existing step models; Markdig enters only the content loader, which already holds the YAML dependency. The validator and the app keep their own copies of the parser configuration and grammar, held together by agreement tests rather than by importing across packages (research R1, R2).

## Phase 0: Research

Complete; see [research.md](research.md). No `NEEDS CLARIFICATION` remains.

## Phase 1: Design

Complete; see [data-model.md](data-model.md), [contracts/](contracts/), and [quickstart.md](quickstart.md).

## Post-design constitution re-check

Re-evaluated on 2026-10-24 against the data model and contracts: all gates pass (table above). Three points examined. First, gate III: the browser renders the lesson's own authored mathematics, including `8 + 5 = … = 13`, which is content, not an instance's answer; the instance's answer is never sent to decide disclosure, and a disclosing lesson is not requested while the gate is closed (`contracts/detour.md` check 3). Second, gate IV: the disclosure flag is computed from the same snapshot that serves the Markdown, so the notice and the shown lesson cannot disagree within one service run. Third, gate I: recording is tied to the lesson being shown, never to a confirmation or to time spent, so a failed load cannot downgrade a learner's outcome.

## Complexity Tracking

No constitution violations to justify.
