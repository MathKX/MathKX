# Implementation Plan: Practice Flow with Help-First Feedback

**Branch**: `claude/project-analysis-recommendations-5d72c1` (the Spec Kit setup script reports `002-practice-flow` from the feature directory) | **Date**: 2026-10-23 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/002-practice-flow/spec.md`

## Summary

Build the first learner-visible loop on the content delivered by spec 001: a C# mathematics domain that resolves a question from (definition, version, seed) with the seed proposal's random source and judges integer answers with the five registered misconception codes; a thin ASP.NET Core service that exposes instances, validation, and lesson metadata without ever sending the answer; and a React learner app that offers visual help before answering, feedback by code, the ladder transitions, and a guest session record whose outcomes follow DL-029, in Norwegian Bokmål and English, operable by keyboard and screen reader. This feature creates `src/backend/` and `src/web/` and a second CI workflow; it adds no persistence, no profiles, and no lesson body renderer.

## Technical Context

**Language/Version**: C# on .NET 10 (LTS; SDK 10.0.302 available locally; supported on Azure App Service Linux) for the domain and the service; TypeScript 5.9 with React 19 for the learner app

**Primary Dependencies**: Backend: none beyond the framework for the domain; YamlDotNet for front matter in the content loader; ASP.NET Core minimal APIs for the service; xUnit for tests, with `Microsoft.AspNetCore.Mvc.Testing` for contract tests. Web: `react` 19.3, `@digdir/designsystemet-react` and `-css` 1.23, `@navikt/aksel-icons` 8.20, `tailwindcss` 4.3 with `@tailwindcss/vite`, `vite` 8.3, `vitest` 5 with `@testing-library/react` 16, `playwright` 1.64 for the end-to-end checks. Exact versions pinned in research R6.

**Storage**: Guest session record in the browser (`localStorage`, versioned key, memory fallback). No server-side storage; no database (ADR 0008 applies to profiles, which are F9).

**Testing**: `dotnet test` (domain fixtures and property tests, service contract tests); `npm test` in `src/web` (vitest: dictionaries, outcome derivation, component state); Playwright end-to-end smoke in CI against the running service (keyboard operation, no total in the accessibility tree); the existing content checks unchanged

**Target Platform**: Browser on iPad Safari and desktop (Chromium, Firefox, Safari); service on Linux (Azure App Service later, not deployed by this feature)

**Project Type**: Web application: a service with a static learner app in front of it, one deployable

**Performance Goals**: A question resolves and renders in well under a second on a local network; validation returns in well under a second; CI under 10 minutes (spec SC-007)

**Constraints**: No platform random source in generation or validation (seed proposal prohibitions); private validation data never serialized to the client; every learner-visible string from a bilingual dictionary or bilingual content; no mastery percentages anywhere; accessibility rules of `exercise-experience.md` (no total before reveal, 44 by 44 targets, reduced motion)

**Scale/Scope**: One skill, two generated definitions, one fixed task, one lesson, two languages; the design must not block the next topic (equations) or profiles

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate (constitution section) | Evaluation before research | After design |
| --- | --- | --- |
| I Mastery over exercise count: no scores, percentages, streaks, or mastery words; help is never penalised | Outcomes are counts over deliveries per addendum §E; help leads the label (DL-029) | Pass; `contracts/observations.md` fixes the derivation and the summary wording |
| II Mathematics independent of curricula: skills and definitions by stable ID | The app reads skills, definitions, and the ladder from `content/`; no grade or curriculum anywhere | Pass |
| III Content configures, tested code computes: generators and validators in tested domain code; UI never decides mathematics | Generation, validation, misconception classification, and the help and explanation step models live in `MathKX.Domain` with fixtures; the React components render the instance and the steps the service returns | Pass; the client computes nothing mathematical except reading an integer from the input |
| IV Reproducibility and honest results: `(definition, version, seed)`; typed validation; reserved statuses never promise review | The random source and bounded sampler follow the proposal with its vectors; the generator uses one bounded draw over a canonical enumeration; fixed tasks ignore the seed; the result type carries all five statuses | Pass; `contracts/generator-addition-pair.md` and `contracts/validation-result.md` |
| V Calm, honest learner experience: help before failure; feedback explains; no gamification | The practice screen follows `exercise-experience.md`; feedback texts are the prototype's; the ladder's end messages are honest | Pass |
| VI Accessible, bilingual, private by design | Dictionaries with parity test; accessibility rules in `contracts/learner-app.md`; guest data stays in the browser; no analytics | Pass |
| Additional constraints: stack per ADR 0003, 0007, 0008, 0009 and DL-005; repository layout | .NET domain and service under `src/backend/`, React app under `src/web/`; `content/` is the runtime source | Pass |
| Additional constraints: undecided matters not decided here | No authentication, session handling, database schema, mastery algorithm, or AI; the random-source ADR stays pending until the fixtures pass (DL-024) | Pass; `research.md` R13 notes that passing fixtures are the trigger for ADR 0011, raised separately |
| Development workflow: every behaviour ships with tests; CI runs them | Three test suites plus the content checks in CI | Pass |
| Specification rules | Sources and decision-log rows cited in the spec; no ADR changed | Pass |

No violation; the Complexity Tracking table is not needed.

## Project Structure

### Documentation (this feature)

```text
specs/002-practice-flow/
├── plan.md              # This file
├── research.md          # Phase 0: decisions R1–R15
├── data-model.md        # Phase 1: domain, content, and session entities
├── quickstart.md        # Phase 1: run, test, and prove the feature
├── contracts/
│   ├── api.md                        # service endpoints and JSON shapes
│   ├── generator-addition-pair.md    # draw order, canonical enumeration, golden-seed fixture format
│   ├── validation-result.md          # statuses, code precedence, values
│   ├── observations.md               # guest record: events, outcome derivation, storage
│   ├── dictionaries.md               # key namespaces, parity rule, literal-scan exceptions
│   └── learner-app.md                # screens, controls, state preservation, accessibility
├── checklists/requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks): 51 tasks in eight phases
```

### Source Code (repository root)

```text
src/backend/
├── MathKX.slnx
├── Directory.Build.props                 # net10.0, nullable, warnings as errors, MIT
├── MathKX.Domain/                        # no framework dependencies
│   ├── Random/SplitMix64.cs              # the proposal's random source
│   ├── Random/BoundedSampler.cs          # nextBelow(n) by rejection, limit handling
│   ├── Random/Seed.cs                    # parse/format the decimal seed string
│   ├── Content/                          # record types mirroring the 0.1-pilot schemas (no I/O)
│   │   └── ExerciseDefinition.cs, Registries.cs, Skill.cs, LessonMetadata.cs, LessonFrontMatter.cs
│   ├── Explanations/StepModels.cs        # deterministic help and explanation steps per representation, with reveal flags
│   ├── Generators/AdditionPairGenerator.cs   # addition-pair@1
│   ├── Generators/IGenerator.cs
│   ├── Validators/IntegerAnswerValidator.cs  # integer-answer@1 with the five codes
│   ├── Instances/InstanceResolver.cs     # (definition, version, seed) -> Instance; fixed tasks
│   └── Results/ValidationResult.cs, FeedbackCode.cs, ResponseArtifact.cs
├── MathKX.Content/                       # System.Text.Json + YamlDotNet
│   ├── ContentCatalog.cs                 # loads content/ (registries, skills, definitions, lessons)
│   └── FrontMatterReader.cs              # title and objective from nb.md / en.md, the validator's YAML
├── MathKX.Api/
│   ├── Program.cs                        # minimal API, content path, static learner app in production
│   ├── Endpoints/LessonsEndpoints.cs, InstancesEndpoints.cs, StepsEndpoints.cs, ValidationsEndpoints.cs, SkillsEndpoints.cs
│   ├── Dto/                              # presentation shapes; never the answer
│   └── appsettings.json                  # MathKX:ContentRoot
├── MathKX.Domain.Tests/
│   ├── Random/SplitMix64Tests.cs         # proposal vectors
│   ├── Random/BoundedSamplerTests.cs     # bounded vectors, injected rejection streams, invalid bounds
│   ├── Generators/AdditionPairTests.cs   # golden seeds, property tests, boundary fixtures, registry agreement, replay
│   ├── Validators/IntegerAnswerTests.cs  # code precedence, invalid input, determinism
│   ├── Explanations/StepModelTests.cs    # step values, reveal flags, agreement with the instance
│   ├── Content/ContentCatalogTests.cs    # loads the repository content; registry agreement; YAML front-matter cases
│   └── Fixtures/addition-pair-v1.golden.json
└── MathKX.Api.Tests/
    └── ContractTests.cs                  # no private data, determinism, errors, lesson metadata

src/web/
├── package.json, package-lock.json, vite.config.ts, tsconfig.json, index.html
├── src/
│   ├── main.tsx, App.tsx, routes.tsx
│   ├── i18n/nb.ts, en.ts, index.ts       # dictionaries and translate()
│   ├── api/client.ts, types.ts           # typed calls to the service
│   ├── state/store.tsx                   # session state (question, draft, help, ladder, record)
│   ├── state/storage.ts                  # versioned localStorage with memory fallback
│   ├── state/observations.ts             # delivery observations and events
│   ├── state/outcomes.ts                 # derivation per contracts/observations.md
│   ├── pages/LessonPage.tsx, PracticePage.tsx, RecordPage.tsx
│   ├── components/ExerciseShell.tsx, Feedback.tsx, LadderControls.tsx, LanguageSwitch.tsx
│   ├── components/math/MathExpr.tsx, Counters.tsx, MakeTen.tsx, TenFrame.tsx
│   └── styles/index.css                  # Designsystemet + Tailwind entry point (ADR 0007)
├── tests/                                # vitest
│   ├── dictionaries.test.ts, literals.test.ts, outcomes.test.ts, storage.test.ts
│   └── exercise-shell.test.tsx
└── e2e/practice.spec.ts                  # Playwright: keyboard, accessibility tree, language switch

.github/workflows/build-and-test.yml      # backend and web jobs; validate-content.yml unchanged
```

**Structure Decision**: Two application roots under `src/` as the constitution's layout and DL-005 require: `src/backend/` holds one solution with a dependency-free domain library, a small content-loading library, a thin service, and their tests; `src/web/` holds one Vite application with its own `package.json` (the root `package.json` stays the content-tooling package). The service serves the built learner app in production so there is one deployable for ADR 0009; in development the Vite server proxies API calls. Mathematical representations are MathKX components built on the Designsystemet theme (ADR 0007), ported from the prototype where its tests already cover them.

## Phase 0: Research

Complete; see [research.md](research.md). All Technical Context entries are resolved; no `NEEDS CLARIFICATION` remains.

## Phase 1: Design

Complete; see [data-model.md](data-model.md), [contracts/](contracts/), and [quickstart.md](quickstart.md).

## Post-design constitution re-check

Re-evaluated on 2026-10-23 against the data model and contracts: all gates pass (table above). Two points examined: the client reads an integer from the input before sending it (an input-guidance step, not a mathematical judgement) and the service re-reads it, so correctness is decided only in the domain (gate III); and the outcome derivation runs in the browser for guest records, with the same rules written as a contract so a server-side re-validation (F9) can reproduce it (gate IV).

## Complexity Tracking

No constitution violations to justify.
