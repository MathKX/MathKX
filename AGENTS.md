# AGENTS.md

MathKX is an open-source adaptive mathematics learning platform. It aims to help learners build genuine mastery through appropriate practice, clear explanations, and visual interaction.

## Read before changing the project

- [Vision](docs/vision.md)
- [Product principles](docs/product-principles.md)
- [Learning model](docs/learning/learning-model.md)
- [Architecture](docs/architecture/architecture.md)
- [Exercise capability model](docs/architecture/exercise-capability-model.md)
- [Exercise format](docs/architecture/exercise-format.md)
- [Design principles](docs/design/design-principles.md)

Content changes must also follow [content/AGENTS.md](content/AGENTS.md).

## Durable rules

- Mastery matters more than exercise count.
- Model mathematical skills independently from curricula and grade levels.
- Treat skill prerequisites as a graph; do not duplicate skills for each curriculum.
- Keep exercise content data-driven where practical, but do not turn JSON into a programming language.
- Put nontrivial mathematical generation and validation in deterministic, tested domain code—not arbitrary UI components.
- Preserve reproducibility: an exercise definition ID, definition version, and seed should eventually identify a generated instance.
- Do not assume that every answer is typed text or that every learning interaction is static.
- Use stable language-neutral identifiers; keep localization and curriculum mappings at their proper boundaries.
- Treat accessibility and learner privacy as first-class requirements.
- Keep the learner experience calm, encouraging, modern, and age-appropriate rather than childish.
- Avoid prematurely deciding unresolved matters such as persistence, authentication, mastery algorithms, symbolic equivalence, hosting, or AI use.

## How to approach changes

1. Read the relevant documentation and existing decision records.
2. Make the smallest coherent change that advances the current goal.
3. Keep mathematical domain logic independent of framework and presentation concerns.
4. Add or update validation and tests when behavior is introduced.
5. Update documentation when terminology, architecture, schemas, or contributor workflows change.
6. Record durable architectural choices as concise ADRs in `docs/architecture/decisions/`; do not use ADRs for tentative ideas.

The repository is currently in the foundation stage. Do not scaffold infrastructure or application layers without a concrete need.
