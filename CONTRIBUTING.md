# Contributing to MathKX

Thank you for your interest in MathKX. The project is in its foundation stage, so the most useful contributions right now are careful ones: content that follows the documented format, documentation fixes, and small, well-tested pieces of the first implementation slice.

Before contributing, read [AGENTS.md](AGENTS.md). It lists the documents that define the project's direction and the durable rules every change must respect. Content contributions must also follow [content/AGENTS.md](content/AGENTS.md).

## Two ways to contribute

### Content

Skills and exercise definitions live under [`content/`](content/) as JSON validated against the schemas in [`schemas/`](schemas/). Curriculum mappings and a Markdown-based lesson workflow are planned; see the [learning experience](docs/design/learning-experience.md). You do not need to know the application code to improve explanations or propose content.

1. Read [content/README.md](content/README.md), the [exercise capability model](docs/architecture/exercise-capability-model.md), and the [exercise format](docs/architecture/exercise-format.md).
2. Add or change JSON files under `content/`. Use stable, language-neutral IDs. Keep examples small.
3. Run the validation locally (see below). It checks schema validity, unique skill IDs and exercise ID/version pairs, that every referenced skill exists, and that the skill prerequisite graph has no cycles.
4. Open a pull request. The same validation runs in CI and must pass before review.

The current `0.1` schema is exploratory. If a change you need does not fit it, open an issue describing the exercise rather than adding fields ad hoc; the capability model explains why.

Released learning content must support Norwegian and English, including hints and accessible descriptions. Flag translations affected by a content change. Lesson formatting and translation tooling remain open; until those formats exist, suggest wording, examples, translations, or diagrams in an issue or documentation pull request. Shared mathematical skills must not be duplicated by language, grade, or curriculum.

### Code and documentation

Production application code has not been introduced. Repository tooling and design prototypes serve different purposes. Application work will follow the boundaries in [docs/architecture/architecture.md](docs/architecture/architecture.md): mathematical logic in deterministic, tested domain code; presentation separate from domain rules. Durable architectural choices are recorded as short ADRs in [`docs/architecture/decisions/`](docs/architecture/decisions/); tentative designs belong in [`docs/architecture/proposals/`](docs/architecture/proposals/).

Documentation fixes are welcome at any time. If a change alters terminology, a schema, or a contributor workflow, update the corresponding document in the same pull request.

## Running validation locally

Validation is a small Node script with no build step.

```bash
npm ci
```

```bash
npm run validate
```

The script validates every JSON file under `content/` against the schema it declares in `$schema`, then checks identities, skill references, and the prerequisite graph. It reports collected content errors with file paths and exits with code 1. Unexpected tooling errors exit with code 2.

When changing the validator, also run:

```bash
npm test
```

The tests invoke the CLI against isolated fixtures, including conflicting exercise identities, invalid document shapes, and prerequisite errors. Both tests and content validation run in CI.

## Pull requests

- Keep each pull request to one coherent change.
- Describe what the change does and which document or decision it follows.
- Content changes should state which skill or scenario they serve.
- Expect review from a mathematical, pedagogical, localization, or accessibility perspective as appropriate.

## Specifications

Features are specified before they are built, with GitHub Spec Kit, under [`specs/`](specs/). The [constitution](.specify/memory/constitution.md) governs every specification, and [specs/README.md](specs/README.md) lists the order of features and how to resume a checked-in specification on a fresh checkout.

## Conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md).

## Licensing

Code and documentation (including `tools/`, `schemas/`, prototype source, and `docs/`) are licensed under the MIT License, see [LICENSE](LICENSE). Learning content under `content/` is licensed under Creative Commons Attribution-ShareAlike 4.0 International, see [content/LICENSE](content/LICENSE). The decision is recorded in [ADR 0010](docs/architecture/decisions/0010-license-code-and-content.md). By contributing, you agree that your code and documentation contributions are licensed under MIT and your content contributions under CC BY-SA 4.0, and that you have the right to contribute them. Third-party material needs a compatible licence and attribution.
