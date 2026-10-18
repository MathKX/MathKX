# Contributing to MathKX

Thank you for your interest in MathKX. The project is in its foundation stage, so the most useful contributions right now are careful ones: content that follows the documented format, documentation fixes, and small, well-tested pieces of the first implementation slice.

Before contributing, read [AGENTS.md](AGENTS.md). It lists the documents that define the project's direction and the durable rules every change must respect. Content contributions must also follow [content/AGENTS.md](content/AGENTS.md).

## Two ways to contribute

### Content

Skills, exercise definitions, and (later) curriculum mappings live under [`content/`](content/) as JSON that is validated against the schemas in [`schemas/`](schemas/). You do not need to know the application code to contribute content.

1. Read [content/README.md](content/README.md), the [exercise format](docs/architecture/exercise-format.md), and the [exercise capability model](docs/architecture/exercise-capability-model.md).
2. Add or change JSON files under `content/`. Use stable, language-neutral IDs. Keep examples small.
3. Run the validation locally (see below). It checks schema validity, that every referenced skill exists, and that the skill prerequisite graph has no cycles.
4. Open a pull request. The same validation runs in CI and must pass before review.

The current `0.1` schema is exploratory. If a change you need does not fit it, open an issue describing the exercise rather than adding fields ad hoc; the capability model explains why.

### Code and documentation

Application code does not exist yet. When it is introduced, it will follow the boundaries in [docs/architecture/architecture.md](docs/architecture/architecture.md): mathematical logic in deterministic, tested domain code; presentation separate from domain rules. Durable architectural choices are recorded as short ADRs in [`docs/architecture/decisions/`](docs/architecture/decisions/).

Documentation fixes are welcome at any time. If a change alters terminology, a schema, or a contributor workflow, update the corresponding document in the same pull request.

## Running validation locally

Validation is a small Node script with no build step.

```bash
npm ci
```

```bash
npm run validate
```

The script validates every JSON file under `content/` against the schema it declares in `$schema`, then checks skill references and the prerequisite graph. It exits non-zero on the first category of failure it finds and prints the file and path responsible.

## Pull requests

- Keep each pull request to one coherent change.
- Describe what the change does and which document or decision it follows.
- Content changes should state which skill or scenario they serve.
- Expect review from a mathematical, pedagogical, localization, or accessibility perspective as appropriate.

## Conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md).

## Licensing

The project's license has not been chosen yet. Until it is, contributions are accepted on the understanding that they will be released under the open-source license the maintainers select; a decision record will announce it.
