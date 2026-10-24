# Contract: validator `integer-answer` version 1 and the result type

Part of [plan.md](../plan.md) Phase 1. Implements the registry entry in `content/registry/validators.json` (artifact `integer` 0–40, emits the five `add.*` codes). Follows the capability model's validation result contract and addendum §E.

## Reading the artifact

Input is the learner's original text. Trim surrounding whitespace. Accept an optional leading `-`, then one or more ASCII digits (leading zeros allowed). Anything else (empty, letters, decimals with `.` or `,`, spaces inside, `+`) is unreadable.

| Text | Reading |
| --- | --- |
| ` 8 `, `08` | 8 |
| `-3` | −3 (a mathematical attempt, judged incorrect) |
| ``, `abc`, `7,5`, `7.5`, `1 3` | unreadable → `invalid-response` |

Unreadable input yields `status: invalid-response` with code `invalid.empty` or `invalid.notAnInteger` and `values.text`. It is input guidance, never a retry (FR-008).

## Judging a readable value `v` against the instance `(a, b)` with `sum = a + b`

Exactly one code, chosen in this order:

| Order | Condition | Status | Code |
| --- | --- | --- | --- |
| 1 | `v == sum` | `correct` | `correct` |
| 2 | `v == a` or `v == b` | `incorrect` | `add.oneGroup` |
| 3 | decimal digits of `v` equal the digits of `a` followed by the digits of `b` | `incorrect` | `add.concat` |
| 4 | `|v − sum| == 1` | `incorrect` | `add.offByOne` |
| 5 | `v == |a − b|` | `incorrect` | `add.subtracted` |
| 6 | otherwise | `incorrect` | `add.generic` |

The order is the prototype's and is part of the contract (a `4 + 4` answered `8`… is correct before any other rule; `3 + 5` answered `35` is `add.concat` even though it is also not off by one).

## Result

```text
ValidationResult { status, code, values, validator { name: "integer-answer", version: 1 } }
```

`values` carries `a`, `b`, `v` for incorrect results and `a`, `b`, `sum`, `v` for a correct one. The sum appears in a result only when it is correct, where it is the completed equation the learner has just produced; the only other place the service ever sends it is a revealing step of the worked explanation or guided help (`contracts/api.md`). The feedback text is resolved by the learner app from `code` and `values` in the active language (`contracts/dictionaries.md`).

## Statuses

`correct`, `incorrect`, `invalid-response` are produced. `partially-correct` and `review-needed` are members of the type, serialized with the same names, never produced by this validator, and rendered by the learner app with the addendum's wording ("Partly right: …", "MathKX cannot check this answer automatically") without any default branch. A test asserts the rendering is exhaustive.

## Tests

| Test | Asserts |
| --- | --- |
| Reading | The table above, plus whitespace and leading zeros |
| Precedence | One case per row; cases where several conditions hold (`3 + 5` → `35`; `1 + 2` → `1` is `oneGroup` before `offByOne` would apply) |
| Determinism | Same instance and text twice → identical results |
| Registry agreement | Name, version, artifact bounds, and emitted codes equal the registry entry |
| Privacy | Incorrect and invalid results never contain `sum` |
