# Content

This area holds version-controlled MathKX learning content. The current JSON content is machine-validated; see [Validation](#validation). Lesson authoring and its validation workflow remain to be implemented.

## Layout

```text
content/
  skills/       curriculum-independent mathematical skills and their prerequisites
  lessons/      authored explanations and worked examples linked to skills (not yet created)
  exercises/    reusable exercise definitions
  curricula/    competency goals and mappings from curricula to skills (not yet created)
```

Directories are created when they contain real content. `lessons/` and `curricula/` do not exist yet because their formats have not been designed.

### Skills

Each file under `skills/` defines one skill: its stable, language-neutral ID and the IDs of the skills it depends on. Nothing else. Names, descriptions, and curriculum mappings are localized or jurisdiction-specific and will live elsewhere. The schema is [`schemas/skill.schema.json`](../schemas/skill.schema.json).

The current seven skills form a small seed graph around one learner story: the Pythagorean theorem and the square roots it depends on. The graph is illustrative content, not an approved taxonomy. Skill granularity and the meaning of a prerequisite edge are still open questions in the [learning model](../docs/learning/learning-model.md) and the [skill graph](../docs/learning/skill-graph.md) document; edges here should be reviewed and revised as real exercises are written against them.

### Exercises

`exercises/` holds exercise definitions in the exploratory `0.1` format described in the [exercise format](../docs/architecture/exercise-format.md). At present it contains one illustrative definition. Read the [exercise capability model](../docs/architecture/exercise-capability-model.md) before adding or extending definitions.

### Lessons and languages

The proposed [learning experience](../docs/design/learning-experience.md) uses Markdown lessons with controlled references to interactive components and exercise families. The lesson format and preview workflow remain to be designed; contributors should not infer a stable syntax from this proposed directory structure.

The first learner release requires Norwegian and English for all released lessons, exercises, hints, feedback, and accessibility text. Localized variants share mathematical identities and learner progress. The English-only `0.1` exercise is an exploratory fixture, not release-ready content. Translation storage and completeness checks will be introduced with the first content format that supports them.

## Validation

Every JSON file under `content/` must name its schema in `$schema` with a relative path into [`schemas/`](../schemas/). The validation script checks:

1. each file against the schema it declares;
2. that skill IDs and exercise `(id, version)` pairs are unique;
3. that every exercise `skill` and every skill prerequisite resolves to a defined skill; and
4. that the prerequisite graph has no cycles.

Different versions of an exercise may coexist, but two files must not define the same ID and version, even with identical contents. Non-object JSON is reported as a content error alongside errors in other files.

Run it locally with `npm ci` followed by `npm run validate`. Run `npm test` for the validator regression suite. Both checks run in CI on every pull request. Validation does not yet verify that generators exist, that generated values are safe, or that answers validate correctly; those checks belong to later semantic tooling.

Read the [content contributor guidance](AGENTS.md) before adding content.
