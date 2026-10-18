# Architecture

MathKX is currently an architecture direction, not an implemented system. This document sets boundaries that should survive early implementation while leaving technology details open.

## System shape

The repository will remain a monorepo. The intended application stack is:

- ASP.NET Core and C# for backend capabilities and mathematical domain logic
- React and TypeScript for the web learner experience and interactive visualizations

No application projects have been scaffolded yet. When implementation begins, a likely top-level organization is:

```text
content/       versioned skills, exercise definitions, and curriculum mappings
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

The first two checks exist: a validation script under `tools/` validates every content file against its schema, resolves skill references, and rejects prerequisite cycles. It runs locally with `npm run validate` and in GitHub Actions on every pull request. Generator, translation, and answer-agreement checks will be added as the things they check come into existence.

## Cross-cutting constraints

- Internationalization begins with stable identifiers and clean content boundaries; the localization storage mechanism is undecided.
- Accessibility requirements apply to every interaction, including mathematical visualizations.
- Learner privacy favors minimal collection, anonymous use where practical, and no advertising profiling.
- Authentication, persistence, hosting, AI usage, and production infrastructure remain outside the current architecture decision set.

## Decision records

Accepted decisions are documented in:

- [ADR 0001: Use a monorepo](decisions/0001-use-a-monorepo.md)
- [ADR 0002: Separate skills from curricula](decisions/0002-separate-skills-from-curricula.md)
- [ADR 0003: Use data-driven exercise definitions](decisions/0003-data-driven-exercise-definitions.md)
- [ADR 0004: Make exercise generation deterministic](decisions/0004-deterministic-exercise-generation.md)
- [ADR 0005: Separate exercise capability dimensions](decisions/0005-separate-exercise-capability-dimensions.md)
- [ADR 0006: Seed representation and random source](decisions/0006-seed-and-random-source.md) (proposed)

## Future decisions

- Backend project boundaries and domain interfaces
- Exercise Format v1 and its compatibility rules
- Generator and validator registration and versioning
- Persistence and database technology
- Localization storage and delivery
- Authentication and learner/parent/teacher relationships
- Deployment and hosting
- Whether content or visualizations ever warrant separate repositories
