# Content

This area holds version-controlled MathKX learning content: skills, exercise definitions, lessons, and the registries of what the code provides. Everything here is machine-validated; see [Validation](#validation). The [authoring guide](AUTHORING.md) explains every field and rule.

## Layout

```text
content/
  skills/       curriculum-independent mathematical skills, their prerequisites, and optional challenge ladders
  exercises/    exercise definitions: generated families and fixed tasks (examples/ holds the exploratory 0.1 fixture)
  lessons/      one folder per lesson: lesson.json, nb.md, en.md, assets/
  registry/     reviewed lists of generators, validators, representations, visual components, and misconception codes
  _templates/   copyable lesson template with placeholders (the only folder the check skips)
  curricula/    competency goals and mappings from curricula to skills (not yet created)
```

Directories are created when they contain real content. The curriculum format remains to be designed.

### Skills

Each file under `skills/` defines one skill: its stable, language-neutral ID, the IDs of the skills it depends on, and optionally a `ladder` of its exercise definitions from easiest to hardest with a learner-facing sentence per language. Names, descriptions, and curriculum mappings are localized or jurisdiction-specific and will live elsewhere. The schema is [`schemas/skill.schema.json`](../schemas/skill.schema.json).

The skills form a small seed graph: the Pythagorean theorem and the square roots it depends on, plus the first milestone's `numbers.number-bonds-to-ten` and `numbers.addition-within-20`. The graph is illustrative content, not an approved taxonomy. Skill granularity and the meaning of a prerequisite edge are still open questions in the [learning model](../docs/learning/learning-model.md) and the [skill graph](../docs/learning/skill-graph.md) document.

### Exercises

`exercises/numbers/` holds the pilot definitions in the `0.1-pilot` format: two generated addition families and one fixed worked example, validated against the registries. `exercises/examples/` keeps the exploratory `0.1` fixture described in the [exercise format](../docs/architecture/exercise-format.md), unchanged. Read the [exercise capability model](../docs/architecture/exercise-capability-model.md) before adding or extending definitions.

### Lessons and languages

Lessons follow the [learning experience](../docs/design/learning-experience.md): Markdown with controlled references to interactive components and exercise families. Shared metadata lives in `lesson.json`, translations in `nb.md` and `en.md`, assets in one folder per lesson. The pilot lesson is `lessons/number-bonds-to-ten/`. The format is the pilot contract from [spec 001](../specs/001-pilot-content-contract/spec.md); the in-app renderer arrives with a later feature.

The first learner release requires Norwegian and English for all released lessons, exercises, hints, feedback, and accessibility text. Localized variants share mathematical identities and learner progress. The check compares each lesson's two languages by anchors, directives, and mathematics, never by prose. The English-only `0.1` exercise is an exploratory fixture, not release-ready content.

### Registries

`registry/` lists what tested code provides, as reviewed data: names, versions, parameter domains, response shapes, and supported ranges. They carry no logic. A registry changes only together with the code it describes.

## Validation

Every JSON file under `content/` (except `_templates/`) must name its schema in `$schema` with a relative path into [`schemas/`](../schemas/). The validation script checks:

1. each file against the schema it declares, and that the schema is one it knows;
2. that the registries are internally consistent;
3. that skill IDs, lesson IDs, and exercise `(id, version)` pairs are unique;
4. that every reference resolves: skills, prerequisites, related skills and lessons, practice definitions, ladder definitions, generators, validators, representations, visual components, misconception codes, assets, and anchors;
5. that the prerequisite graph has no cycles and ladders refer to the skill's own definitions;
6. that generated families stay within their generator's domain, admit at least one task, and are covered by every representation they list; that fixed tasks fit their validator's artifact;
7. that each lesson's two languages share anchors, directives, and mathematics, with tables, images, directives, and notation well formed.

Run it locally with `npm ci` followed by `npm run validate`. Run `npm test` for the validator regression suite. Both checks run in CI on every pull request. Validation does not run generators or validators; whether generated values are safe and answers validate correctly is checked by the domain tests that arrive with the application.

Content under this directory is licensed under Creative Commons Attribution-ShareAlike 4.0 International; see [LICENSE](LICENSE) and [ADR 0010](../docs/architecture/decisions/0010-license-code-and-content.md).

Read the [content contributor guidance](AGENTS.md) and the [authoring guide](AUTHORING.md) before adding content.
