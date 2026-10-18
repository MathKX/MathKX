# Exercise format

**Status:** exploratory `0.1`; not stable or production-ready

The [exercise capability model](exercise-capability-model.md) is the decision-ready input to the future Format v1 design. It documents the limitations of this exploratory shape and should be read before extending the schema.

MathKX exercise definitions should usually describe reusable exercise families rather than individual fixed questions. JSON makes definitions portable, reviewable, schema-validatable, and approachable to contributors outside the application code.

## Definition and instance

A definition supplies identity, skill association, generation or fixed-instance configuration, presentation intent, interaction, response, and validation contracts. The exploratory `0.1` shape demonstrates only the named-generator path:

```text
definition + definition version + seed
             |
             v
   deterministic generator
             |
             v
 question + validation data + presentation data
```

The concrete values and correct answer are instance data, not hand-authored copies of the definition.

## Illustrative definition

```json
{
  "$schema": "../../../schemas/exercise.schema.json",
  "schemaVersion": "0.1",
  "id": "algebra.linear-equations.basic",
  "version": 1,
  "skill": "algebra.linear-equations",
  "difficulty": "introductory",
  "generator": "linear-equation",
  "parameters": {
    "solutionMin": -10,
    "solutionMax": 10,
    "coefficientMin": 2,
    "coefficientMax": 8
  },
  "question": {
    "format": "math",
    "template": "Solve: {{equation}}"
  },
  "answer": {
    "type": "number"
  },
  "visualization": {
    "type": "equation-balance"
  }
}
```

This shape is a conversation aid. Field names, template syntax, difficulty, localization, and the boundary between generator output and definition data may change before Format v1.

## Preliminary fields

| Field | Current purpose |
| --- | --- |
| `$schema` | Optional editor/validator reference |
| `schemaVersion` | Version of the definition format |
| `id` | Stable language-neutral definition ID |
| `version` | Revision used when identifying generated instances |
| `skill` | Primary skill reference |
| `difficulty` | Provisional author-facing label; no scale is decided |
| `generator` | Name resolved to tested domain code |
| `parameters` | Generator-specific JSON configuration |
| `question` | Provisional presentation description |
| `answer` | Provisional hint at an answer family; it currently conflates interaction, response artifact, parsing, and validation concerns that Format v1 must separate |
| `visualization` | Optional request for a reusable visual component |

Future versions may add hints, explanations, localized content, metadata, misconception links, multiple skill references, and richer interaction contracts. They should be added from real exercise needs rather than all at once.

## Hybrid content and code

JSON is appropriate for identity, ranges, authored text, metadata, and component selection. It is not appropriate for arbitrary branching, symbolic manipulation, or a miniature expression language. A definition names a generator; .NET code implements the mathematical algorithm and deterministic validation behind that name.

The future generator interface must make random input explicit and must not depend on ambient randomness, time, locale, or mutable global state. No interface is defined yet because the first real generator should inform it.

## Deterministic identity

The intended conceptual identity is:

```text
(exerciseDefinitionId, exerciseDefinitionVersion, seed)
```

Replaying that identity should recreate the same learner-facing instance. This supports bug reports, history, tests, sharing, and compact persistence. Format v1 must clarify how generator implementation changes preserve or advance that contract.

## Presentation and answers

The definition should express semantic presentation intent rather than framework component names or layout details. A visualization such as `number-line` should resolve through a controlled registry to an accessible UI implementation.

Likewise, the current `answer.type` is only a placeholder. Format v1 should distinguish the learner interaction, its semantic response artifact, and the validator. A coordinate-placement component may return a coordinate artifact; a deterministic validator decides whether it satisfies the task. Each interaction also needs an objective-preserving accessible operation path.

## Localization

Identifiers and generator names are language-neutral. The example contains English inline text only to keep the draft concrete. Whether authored strings live inline as locale maps, in separate resources, or behind stable message keys is a future decision. Format v1 must not assume that English or Norwegian is the canonical display language.

## Validation today

[`schemas/exercise.schema.json`](../../schemas/exercise.schema.json) deliberately validates only the small illustrative shape. The validation script in [`tools/validate-content.mjs`](../../tools/validate-content.mjs), run locally with `npm run validate` and in CI on every pull request, additionally checks that the definition's `skill` resolves to a skill defined under [`content/skills/`](../../content/skills/) and that the skill prerequisite graph is acyclic. It does not verify that generators exist, that generated values are safe, or that answers validate correctly. Those checks belong to later semantic tooling.

The checked-in example is at [`content/exercises/examples/linear-equation-basic.json`](../../content/exercises/examples/linear-equation-basic.json).

The `0.1` schema remains unchanged because its limitations are structural, not repairable through one small field addition. The capability model recommends designing v1 from representative scenarios rather than incrementally stabilizing this shape.

## Open questions for Format v1

- Definition and generator compatibility/versioning rules
- Difficulty representation and calibration
- Localization and authored mathematical notation
- Generator parameter schemas and discovery
- Correct-answer data versus named validator responsibilities
- Symbolic equivalence and normalization
- Multiple skills, prerequisites, and misconception metadata
- Hints, explanations, and multi-step exercises
- A stable contract between definition semantics and React interactions
