# Content

This area holds version-controlled MathKX learning content. Everything here is machine-validated; see [Validation](#validation).

## Layout

```text
content/
  skills/       curriculum-independent mathematical skills and their prerequisites
  exercises/    reusable exercise definitions
  curricula/    competency goals and mappings from curricula to skills (not yet created)
```

Directories are created when they contain real content. `curricula/` does not exist yet because its format has not been designed.

### Skills

Each file under `skills/` defines one skill: its stable, language-neutral ID and the IDs of the skills it depends on. Nothing else. Names, descriptions, and curriculum mappings are localized or jurisdiction-specific and will live elsewhere. The schema is [`schemas/skill.schema.json`](../schemas/skill.schema.json).

The current seven skills form a small seed graph around one learner story: the Pythagorean theorem and the square roots it depends on. The graph is illustrative content, not an approved taxonomy. Skill granularity and the meaning of a prerequisite edge are still open questions in the [learning model](../docs/learning/learning-model.md) and the [skill graph](../docs/learning/skill-graph.md) document; edges here should be reviewed and revised as real exercises are written against them.

### Exercises

`exercises/` holds exercise definitions in the exploratory `0.1` format described in the [exercise format](../docs/architecture/exercise-format.md). At present it contains one illustrative definition. Read the [exercise capability model](../docs/architecture/exercise-capability-model.md) before adding or extending definitions.

## Validation

Every JSON file under `content/` must name its schema in `$schema` with a relative path into [`schemas/`](../schemas/). The validation script checks:

1. each file against the schema it declares;
2. that skill IDs are unique;
3. that every exercise `skill` and every skill prerequisite resolves to a defined skill; and
4. that the prerequisite graph has no cycles.

Run it locally with `npm ci` followed by `npm run validate`. The same script runs in CI on every pull request. It does not yet verify that generators exist, that generated values are safe, or that answers validate correctly; those checks belong to later semantic tooling.

Read the [content contributor guidance](AGENTS.md) before adding content.
