# Contract: The Check File and Its Checks

Part of [plan.md](../plan.md) Phase 1. Research R1 to R3; spec User Story 3, FR-017 to FR-020.

## The file

`content/checks/<domain>/<name>.json`, one file per check version:

```json
{
  "$schema": "../../../schemas/self-check.pilot.schema.json",
  "schemaVersion": "0.1-pilot",
  "id": "numbers.addition.check-within-20",
  "version": 1,
  "skill": "numbers.addition-within-20",
  "title": { "nb": "Tiervenner og addisjon", "en": "Number bonds and addition" },
  "scope": { "nb": "Addisjon innenfor ti og over tieren", "en": "Addition within ten and across ten" },
  "questions": [
    { "definition": "numbers.addition.within-10", "version": 1, "seed": "22" },
    { "definition": "numbers.addition.within-10", "version": 1, "seed": "24" },
    { "definition": "numbers.addition.crossing-ten", "version": 1, "seed": "105" },
    { "definition": "numbers.addition.crossing-ten", "version": 1, "seed": "62" }
  ]
}
```

The title and scope are the prototype's `check-addition` texts (iteration 2). Review them for content as for any learner-facing text.

## The schema (`schemas/self-check.pilot.schema.json`)

| Field | Rule |
| --- | --- |
| `schemaVersion` | `const "0.1-pilot"` |
| `id`, `skill`, `questions[].definition` | the definitions' ID pattern `^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$` |
| `version`, `questions[].version` | integer ≥ 1 |
| `title`, `scope` | `{ nb, en }`, both required, non-empty strings, no other keys |
| `questions` | array, `minItems: 1`, `maxItems: 10` |
| `questions[].seed` | optional string `^(0\|[1-9][0-9]*)$` |
| any object | `additionalProperties: false` |

## The content check (`tools/lib/checks.mjs`)

Run after definitions are indexed. Each failure is one diagnostic in spec 001's format (`<file> <field>: <message> (<expected>)`):

| Case | Field | Message |
| --- | --- | --- |
| Same `id` and `version` as another check | — | `duplicate check identity <id> version <v>; also defined in <file>` |
| Unknown skill | `skill` | `skill <id> is not a defined skill` (with the nearest IDs, as for definitions) |
| Unknown definition or version | `questions[i].definition` | `<id>@<v> is not a pilot exercise definition` |
| Definition of another skill | `questions[i].definition` | `<id>@<v> serves <other skill>, not <skill>; a check covers one skill` |
| Generated without a seed | `questions[i]` | `<id>@<v> is generated; give the seed of the question` |
| Fixed with a seed | `questions[i].seed` | `<id>@<v> is a fixed task; remove the seed` |
| Seed above 2^64 − 1 | `questions[i].seed` | `seed is outside the unsigned 64-bit range` |
| Listed twice | `questions[i]` | `the same question as questions[j]` |
| Missing language, empty list, more than ten, bad pattern | (schema) | the schema violation, naming the path, as for every content file |

**Unchanged**: the content check runs no generator, so it cannot tell that two seeds give the same operands. The domain tests below catch that.

**Spec 001's lesson rule** stays, with a new hint. A lesson's `check` field is still rejected, and the message now reads: `check is not a lesson field; a check names its skill in content/checks/, remove this line`.

**Summary line**: `Content validation passed: … , <n> check(s), …`. The tool's tests that read the line change with it.

## The domain tests (`MathKX.Domain.Tests/Content/CheckQuestionsTests.cs`)

Over the repository's `content/`, loaded with `ContentLoader`:
1. **Resolution**: every question of every check resolves through `InstanceResolver` without an exception.
2. **Distinct questions**: within a check, no two questions resolve to the same definition, version, and ordered operands.
3. **The pilot fixture** (`Fixtures/checks.pilot.json`): the questions of `numbers.addition.check-within-20@1` resolve, in order, to `7 + 3`, `5 + 4`, `8 + 5`, and `9 + 4`.

## The loader (`ContentLoader`)

- **Loads checks**: the `self-check.pilot.schema.json` case reads the file into `SelfCheck`. A duplicate `id@version` fails the load.
- **References**: after the definitions are loaded, an unknown skill or an unknown definition fails the load with `ContentLoadException(<file>, …)`. So does a seed that is present or missing contrary to the definition's source. The service then does not start, as for any other content error.
- **Tests** (`ContentCatalogTests`): temp copies with each broken reference, as for lessons today.

## The authoring guide (`content/AUTHORING.md`)

The guide gains a "Self-checks" section, in the same change as the schema:
- every field;
- every rule above;
- how to find a question's seed in `GET /api/definitions/{id}/{version}/pool`;
- the pilot as the example.
