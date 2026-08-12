# MathKX

MathKX is an open-source adaptive mathematics learning platform focused on mastery, visual understanding, and reusable data-driven exercises.

The project starts from a simple premise: a useful learning system should do more than present worksheets online. It should build a picture of what a learner understands, notice when a missing prerequisite is blocking progress, and respond with appropriate exercises, explanations, and visual interactions.

## What makes MathKX different

- Progress is measured by developing mastery, not by exercise count.
- Mathematical skills form a reusable prerequisite graph; curricula map onto that graph rather than defining it.
- Exercise definitions are data wherever practical, while mathematical logic stays in tested code.
- Generated exercise instances are intended to be reproducible from a definition, version, and seed.
- Visual and interactive mathematics is part of the learning model, not decoration.
- Accessibility, internationalization, and learner privacy are architectural concerns from the beginning.
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

## Current status

MathKX is in its **foundation and design stage**. This repository currently contains architectural and product documentation, a preliminary exercise-definition schema, and one illustrative content example. It does not yet contain a backend, frontend, learning engine, or production-ready content format.

The intended direction is a monorepo with an ASP.NET Core/C# backend and a React/TypeScript frontend. Application projects will be introduced only when an implementation task makes their shape clear.

## Start reading

1. [Vision](docs/vision.md)
2. [Product principles](docs/product-principles.md)
3. [Learning model](docs/learning/learning-model.md)
4. [Architecture](docs/architecture/architecture.md)
5. [Exercise capability model](docs/architecture/exercise-capability-model.md)
6. [Preliminary exercise format](docs/architecture/exercise-format.md)
7. [Design principles](docs/design/design-principles.md)

Repository-wide contributor and coding guidance lives in [AGENTS.md](AGENTS.md). Content-specific guidance lives in [content/AGENTS.md](content/AGENTS.md).

## Contributing

MathKX is intended to welcome contributions from developers, educators, translators, curriculum experts, and learners. Contribution workflows and licensing are not established yet. Until they are, the documents above are the source of truth for the project's direction, and architectural changes should be recorded as short decision records under [`docs/architecture/decisions`](docs/architecture/decisions/).
