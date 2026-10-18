# Architecture

MathKX is currently an architecture direction, not an implemented system. This document sets boundaries that should survive early implementation while leaving technology details open.

## System shape

The repository will remain a monorepo. The intended application stack is:

- ASP.NET Core and C# for backend capabilities and mathematical domain logic
- React and TypeScript for the web learner experience and interactive visualizations
- Designsystemet for standard UI components and theming, with Tailwind CSS for responsive layout and composition (ADR 0007)

No application projects have been scaffolded yet. When implementation begins, a likely top-level organization is:

```text
content/       versioned skills, exercises, and future lessons and curriculum mappings
schemas/       machine-readable validation for contributed content
tools/         repository tooling such as the content validation script
src/backend/   .NET application and domain code (not yet created)
src/web/       React application and reusable visual components (not yet created)
tests/         cross-cutting validation where it does not belong beside a project (not yet created)
docs/          product, learning, design, and architecture documentation
```

Directories should be created when they contain real work, not maintained as empty placeholders. [content/README.md](../../content/README.md) describes the layout inside `content/`.

## Domain boundaries

### Mathematical skills are curriculum-independent

The canonical skill graph represents mathematical knowledge and prerequisites. Curriculum data maps jurisdiction-specific competency goals to that graph. Grade levels, countries, and curriculum wording must not leak into skill identity.

### Definitions differ from generated instances

An exercise definition is versioned content describing a family of exercises. An exercise instance contains concrete generated values and can receive attempts. Keeping these concepts distinct enables reuse, compact history, and reproducibility.

### Content configures; code computes

JSON should describe content and configuration. Named generators and validators implemented in .NET should handle nontrivial mathematics. This hybrid avoids both hardcoded content and a custom programming language hidden inside JSON.

```text
JSON definition -> named generator -> deterministic domain implementation
```

Framework code and UI components should not become alternate homes for mathematical business rules. The exact .NET project boundaries and generator interfaces will be decided alongside the first implementation.

### Presentation supports varied interactions

Exercise presentation should eventually resolve declarative requests such as `number-line` or `equation-balance` to reusable React components. The same extension mechanism must accommodate answer interactions such as coordinate selection, graph manipulation, ordering, and geometry—not only text entry.

Potential visualization families include `NumberLine`, `FractionBar`, `EquationBalance`, `CoordinateSystem`, `FunctionExplorer`, `GeometryCanvas`, `ProbabilitySimulator`, and `StatisticsExplorer`. These are a capability map, not committed component APIs.

The authoritative [exercise capability model](exercise-capability-model.md) separates pedagogical purpose, mathematical activity, representation, interaction, response artifact, validation, generation, composition, support, accessibility, and session orchestration. Exercise Format v1 and future component contracts must preserve those boundaries rather than letting an answer type or UI component define the whole exercise.

## Determinism and trust

Given an exercise definition ID, definition version, and seed, generation should produce the same instance under the relevant compatibility contract. Answer validation must also be deterministic. Generated instances need enough version context to remain reproducible when code evolves; the exact generator-versioning strategy is an open question.

## Content and validation

Content should be reviewable through normal pull requests and accessible to contributors who are not application developers. Over time, automated checks should cover:

- JSON and schema validity;
- references to existing skills and generators;
- translation completeness and validity;
- safe, valid generator output; and
- agreement between generated answers and validators.

The current validation script under `tools/` checks JSON schemas, unique skill IDs and exercise `(id, version)` pairs, skill references, and prerequisite cycles. Run it with `npm run validate`; run its regression tests with `npm test`. Both run in GitHub Actions on every pull request. Generator references, translation completeness, generated-value safety, and answer agreement are not yet checked.

The [lesson structure and Markdown proposal](proposals/lesson-markdown-and-delivery.md) describes shared lesson metadata, localized Markdown, controlled visual references, and content packaged with the application. The initial direction is to render lessons inside MathKX and defer Hugo. The concrete lesson format and validation remain to be proven with a bilingual pilot.

## Cross-cutting constraints

- Internationalization begins with stable identifiers and clean content boundaries; the localization storage mechanism is undecided.
- Norwegian and English are first-release requirements for the learner interface and released learning content. Localized variants share skill, lesson, and exercise identities; switching language preserves progress and canonical mathematical state. See the [language scope](../vision.md#first-release-languages) for the working locale assumptions.
- Accessibility requirements apply to every interaction, including mathematical visualizations.
- Learner profiles must support sign-in and saved progress across sessions and devices without required personal details. Email recovery is optional; see ADR 0006 below.
- Learner privacy favors minimal collection and no advertising profiling. Anonymous profile setup does not establish complete anonymity for network traffic or operational data.
- Profiles and progress are stored in PostgreSQL (ADR 0008), and the application is hosted on Azure App Service in Norway East (ADR 0009), so learner data stays in that region. Authentication mechanisms, session handling, retention and deletion rules, and AI usage remain outside the current architecture decision set.

## Decision records

Accepted decisions are documented in:

- [ADR 0001: Use a monorepo](decisions/0001-use-a-monorepo.md)
- [ADR 0002: Separate skills from curricula](decisions/0002-separate-skills-from-curricula.md)
- [ADR 0003: Use data-driven exercise definitions](decisions/0003-data-driven-exercise-definitions.md)
- [ADR 0004: Make exercise generation deterministic](decisions/0004-deterministic-exercise-generation.md)
- [ADR 0005: Separate exercise capability dimensions](decisions/0005-separate-exercise-capability-dimensions.md)
- [ADR 0006: Support profiles without personal details](decisions/0006-support-profiles-without-personal-details.md)
- [ADR 0007: Use Designsystemet and Tailwind for the web UI](decisions/0007-use-designsystemet-and-tailwind.md)
- [ADR 0008: Store profiles and progress in PostgreSQL](decisions/0008-store-profiles-and-progress-in-postgresql.md)
- [ADR 0009: Host on Azure App Service in Norway East](decisions/0009-host-on-azure-app-service.md)
- [ADR 0010: License code under MIT and content under CC BY-SA 4.0](decisions/0010-license-code-and-content.md)

The [seed and random-source proposal](proposals/seed-and-random-source.md) is retained for evaluation with the first generator. It is not an accepted ADR or a finalized compatibility contract.

## Future decisions

- Backend project boundaries and domain interfaces
- Exercise Format v1 and its compatibility rules
- Generator and validator registration and versioning
- Database schema, retention, and deletion rules within PostgreSQL (ADR 0008)
- Localization storage and delivery
- Authentication and recovery mechanisms, and learner/parent/teacher relationships
- Operational monitoring, infrastructure as code, and service tiers on Azure (ADR 0009)
- Whether content or visualizations ever warrant separate repositories
