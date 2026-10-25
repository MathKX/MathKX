# Contract: localized skill names

Part of [plan.md](../plan.md) Phase 1. An addition to spec 001's content contract (spec FR-006, research R1). Owner decision of 2026-10-25 (spec Clarifications).

## The field

Each file in `content/skills/` carries a required `name`:

```json
{
  "$schema": "../../schemas/skill.schema.json",
  "schemaVersion": "0.1",
  "id": "numbers.addition-within-20",
  "name": { "nb": "Addisjon opp til 20", "en": "Addition within 20" },
  "prerequisites": ["numbers.number-bonds-to-ten"],
  "ladder": [ … ]
}
```

- `name` is required, with exactly the keys `nb` and `en`, each a string of at least one character (`schemas/skill.schema.json`).
- The name is what the learner sees for the skill. It is never used as an identity, never compared across languages, and may change through content review without changing anything a record refers to.
- `schemaVersion` stays `"0.1"` (research R1). The schema's description is updated to say the skill file carries its localized name.

## Validator

The schema rejects a missing `name`, a missing language, an extra key, and an empty string. In addition, `tools/lib/skills.mjs` reports a name that is only whitespace in either language, in spec 001's diagnostics format:

```text
content/skills/numbers.powers.json: skill name in en is missing or empty (field name.en)
```

Root tooling tests (`tools/validate-content.test.mjs`): a valid skill passes; a skill without `name` fails; a skill without `name.en` fails; a skill whose `name.nb` is `"  "` fails with the diagnostic above; an extra key `name.de` fails.

## The nine names, for content review

All nine skill files need a name for validation to pass. Proposed names, to be confirmed in the pull request by a reviewer reading both languages:

| Skill ID | nb | en |
| --- | --- | --- |
| `algebra.linear-equations` | Lineære likninger | Linear equations |
| `geometry.area-perimeter` | Areal og omkrets | Area and perimeter |
| `geometry.pythagorean-theorem` | Pytagoras' setning | The Pythagorean theorem |
| `geometry.right-triangle-trigonometry` | Trigonometri i rettvinklede trekanter | Trigonometry in right triangles |
| `numbers.addition-within-20` | Addisjon opp til 20 | Addition within 20 |
| `numbers.integer-operations` | Regning med hele tall | Operations with integers |
| `numbers.number-bonds-to-ten` | Tiervenner | Number bonds to ten |
| `numbers.powers` | Potenser | Powers |
| `numbers.square-roots` | Kvadratrøtter | Square roots |

`content/AUTHORING.md` documents the field in a short "Name a skill" section before "Add a ladder"; `content/README.md` no longer says names live elsewhere.
