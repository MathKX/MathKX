# MathKX

MathKX is an open-source adaptive mathematics learning platform aiming to cover mathematics from foundational arithmetic through university-level study, focused on mastery, visual understanding, and reusable data-driven exercises.

The project starts from a simple premise: a useful learning system should do more than present worksheets online. It should build a picture of what a learner understands, notice when a missing prerequisite is blocking progress, and respond with appropriate exercises, explanations, and visual interactions.

## What makes MathKX different

- Progress is measured by developing mastery, not by exercise count.
- Mathematical skills form a reusable prerequisite graph; curricula map onto that graph rather than defining it.
- Exercise definitions are data wherever practical, while mathematical logic stays in tested code.
- Generated exercise instances are intended to be reproducible from a definition, version, and seed.
- Visual and interactive mathematics is part of the learning model, not decoration.
- Accessibility, internationalization, and learner privacy are architectural concerns from the beginning.
- The first release will support Norwegian and English across the learner interface and released learning content.
- iPads are a primary first-release device, with touch, on-screen keyboard, and actual-device accessibility checks.
- Planned learner profiles retain progress without requiring personal details, with optional email recovery.
- The experience should feel calm, modern, and age-appropriate—never patronizing.

## Conceptual model

```text
Curriculum -> Competency goals -> Skills -> Exercise definitions
                                              |
                                              v
                                   Generated exercise instances
                                              |
                                              v
                                      Attempts -> Mastery
```

Skills remain independent of curricula and may depend on other skills. This allows a curriculum to reference the same mathematical knowledge in different countries, languages, or grade systems, and eventually allows the learning engine to respond to prerequisite gaps.

Content will grow around mathematical domains, topics, and prerequisite-linked skills. School grades and university courses provide contextual learning paths over those skills. University-level coverage is a long-term goal; the first implementation will prove a small, coherent set of skills and exercises.

The [mathematics domain coverage](docs/learning/mathematics-domains.md) lists the intended domains, topics, and connections from foundational arithmetic through university study.

The [learning experience](docs/design/learning-experience.md) covers explanations, exploration, practice, and checks of understanding, with a proposed Markdown lesson workflow for open contribution.

## Current status

MathKX is in its **first implementation stage**. This repository contains the product, learning, design, and architecture documentation; the pilot content contract with its schemas, registries, the first lesson, and the content validator (spec 001); and the first learner-visible practice loop (spec 002): a C# mathematics domain and thin service under `src/backend/`, and a React/TypeScript learner app with Designsystemet and Tailwind under `src/web/`; lesson rendering with the detour from a question to its lesson (spec 003): the bilingual lesson with its visual models, a notice before a lesson that shows the question's answer, and honest recording of what was shown; and the progress view (spec 004): "My work" grouped by skill under each skill's localized name, with counts of outcomes, repeats, a truthful history of the lessons viewed, and a read-only replay of any recorded question; and repeats and sessions (spec 005): "Another question" avoids the eight questions before it, the learner can choose "Repeat this question" (also from a replay), and "Finish practice" ends a session with an honest summary of its questions and "Practise again". Everything has its tests in CI, and every merge to `main` deploys to Azure App Service in Norway East after they pass. Work is kept as a guest record in the learner's browser only; there are no profiles, server-side persistence, or a stable content format yet; see [specs/README.md](specs/README.md) for the feature order. With spec 005, every implementation item of milestone one is built; the [close-out review](docs/reviews/2026-10-31-milestone-one-close-out.md) lists the device and learner checks still open and the owner decision on closing it.

The stack is a monorepo with an ASP.NET Core/C# backend and a React/TypeScript frontend using Designsystemet components and Tailwind CSS (ADR 0007, DL-005). Each application root has its own README with how to run and test it.

## Start reading

1. [Vision](docs/vision.md)
2. [Product principles](docs/product-principles.md)
3. [Learning model](docs/learning/learning-model.md)
4. [Architecture](docs/architecture/architecture.md)
5. [Exercise capability model](docs/architecture/exercise-capability-model.md)
6. [Exercise format](docs/architecture/exercise-format.md)
7. [Design principles](docs/design/design-principles.md)

Repository-wide contributor and coding guidance lives in [AGENTS.md](AGENTS.md). Content-specific guidance lives in [content/AGENTS.md](content/AGENTS.md).

## Contributing

MathKX is intended to welcome contributions from developers, educators, translators, curriculum experts, and learners. See [CONTRIBUTING.md](CONTRIBUTING.md) for the two contribution paths and how to run content validation locally. Code is licensed under MIT and learning content under CC BY-SA 4.0; see [ADR 0010](docs/architecture/decisions/0010-license-code-and-content.md). The documents above are the source of truth for the project's direction, and architectural changes are recorded as short decision records under [`docs/architecture/decisions`](docs/architecture/decisions/).

Run `npm ci`, `npm test`, and `npm run validate` to install the tooling, test the validator, and check the current content. These checks do not establish mathematical correctness of generated exercises or translation completeness; those capabilities remain to be implemented.
