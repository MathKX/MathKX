# Data Model: Pilot Content Contract

Phase 1 output for [plan.md](plan.md). Field names here are the pilot contract (`schemaVersion: "0.1-pilot"`); the draft schemas in [contracts/](contracts/) are their machine-readable form. "Required" means the validator fails without it.

## Skill (existing, extended)

| Field | Type | Required | Rule |
| --- | --- | --- | --- |
| `$schema` | string | yes | Relative path into `schemas/` (existing rule) |
| `schemaVersion` | `"0.1"` | yes | Unchanged |
| `id` | string, pattern `^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$` | yes | Unique across skills |
| `prerequisites` | string[] | yes (may be empty) | Each resolves to a skill; no self-reference; graph acyclic (existing) |
| `ladder` | Ladder entry[] | no | Unique entries; each `definition`@`version` exists and its `skill` equals this skill; order as authored |

**Ladder entry**: `{ definition: string, version: integer ≥ 1, description: { nb: string, en: string } }`; both sentences non-empty.

## Lesson

A folder `content/lessons/<id>/` holding `lesson.json`, one Markdown file per release language, and optional `assets/`.

### Lesson metadata (`lesson.json`)

| Field | Type | Required | Rule |
| --- | --- | --- | --- |
| `$schema` | string | yes | Points at `schemas/lesson.schema.json` |
| `schemaVersion` | `"0.1-pilot"` | yes | |
| `id` | string, same pattern as skills | yes | Equals the folder name; unique across lessons |
| `version` | integer ≥ 1 | yes | |
| `status` | `"draft"` \| `"pilot"` \| `"released"` | yes | Informational; `released` requires both translations present (all pilot lessons are `pilot`) |
| `skills` | string[] (≥ 1) | yes | Each resolves to a skill |
| `prerequisites` | string[] | no | Each resolves to a skill |
| `relatedSkills` | string[] | no | Each resolves to a skill |
| `relatedLessons` | string[] | no | Each resolves to a lesson |
| `practice` | Practice entry[] | yes (may be empty) | Each `definition`@`version` exists; warning if the definition's skill is not among `skills` |
| `visuals` | string[] | no | Each is a registered visual-component type; every `:::visual` in the body must use a listed type |
| `translations` | object `{ nb: "nb.md", en: "en.md" }` | yes | Both keys required with exactly these file names (FR-001), so the two languages can never resolve to one file; each file must exist. Any other `*.md` in the folder is reported as an unsupported language file |
| `check` | — | forbidden | Reported as "not part of the pilot" |

**Practice entry**: `{ definition: string, version: integer ≥ 1 }`.

### Lesson translation (`nb.md`, `en.md`)

| Element | Rule |
| --- | --- |
| Front matter | YAML with required `title` and `objective` (non-empty strings); no other keys in the pilot |
| Headings | Level 2 and 3 headings carry `{#anchor}`; anchors unique within the file; the set of anchors equals the other language's set |
| Body | CommonMark + GFM; tables must have a delimiter row |
| Images | `![alt](assets/<file>)`; the file exists; alt text non-empty |
| Links | Relative links resolve; external links are not checked in the pilot |
| Mathematics | `$…$` and `$$…$$` conform to the pilot grammar; per section, the multiset of normalized expressions equals the other language's |
| Directives | See below; the multiset of directive identities equals the other language's |

### Directive

Container directive `:::name{attr="value" …}` … `:::` (closing fence required).

| Directive | Attributes | Localized? | Identity for pairing |
| --- | --- | --- | --- |
| `:::visual` | `type` (registered component), plus the component's attributes (for `ten-frame-explorer`: `start` integer 0–10; for `groups` and `make-ten`: `a`, `b` integers 1–9). When the component links a representation, `a` and `b` are also checked together: the point box from the quantity model must lie inside the representation's `supports` (so `groups` 9 + 9 and `make-ten` 2 + 2 fail) | none localized | name + `type` + all attributes |
| `:::example` | `title` (string, non-empty), `id` (anchor-like, unique in the file) | `title` localized | name + `id` |
| `:::practice` | `definition` (string), `version` (integer ≥ 1) | none localized | name + `definition` + `version` |

Each `:::practice` directive must match an entry in `lesson.json.practice` and each entry must have at least one directive. Unknown directive names and unknown or out-of-range attributes are reported.

## Exercise definition (pilot)

| Field | Type | Required | Rule |
| --- | --- | --- | --- |
| `$schema` | string | yes | Points at `schemas/exercise-definition.pilot.schema.json` |
| `schemaVersion` | `"0.1-pilot"` | yes | |
| `id` | string, skill ID pattern | yes | (`id`, `version`) unique across all definitions, including the `0.1` example |
| `version` | integer ≥ 1 | yes | |
| `skill` | string | yes | Resolves to a skill |
| `source` | `"generated"` \| `"fixed"` | yes | Selects which of `generator` or `instance` is required |
| `validator` | `{ name: string, version: integer }` | yes | Registered at that version |
| `generator` | `{ name: string, version: integer, parameters: object }` | when `source: generated`; forbidden when `fixed` | Registered at that version; every parameter key declared by the generator; every bound within the generator's domain; `min ≤ max` |
| `instance` | `{ prompt: object, validation: object }` | when `source: fixed`; forbidden when `generated` | `validation` conforms to the validator's artifact shape; `prompt` carries the quantities the declared representations read |
| `representations` | `{ help: string[], explanation: string[] }` | yes | Each name registered; each representation's support box contains the definition's domain box |
| `misconceptionCodes` | string[] | yes (may be empty) | Each registered and emitted by the named validator |

**Definition domain box**: for `generated`, the bounds in `generator.parameters` (for `addition-pair`: `operand.min/max`, `sum.min/max`); for `fixed`, the point box derived from `instance.prompt` by the quantity model below. A generated definition must also be feasible: at least one operand pair in the operand range has a sum in the sum range.

## Quantity model (pilot)

Registries and definitions speak about quantities by name. The pilot has one relation, named `sum-of-two-operands`, which generators declare in `relation` and which `tools/lib/quantities.mjs` implements. Representations' `supports` and generators' `parameters` are keyed by `operand` and `sum`; prompts and visual directives carry the concrete values `a` and `b`.

| Quantity | Meaning | Derived from a point `{ a, b }` |
| --- | --- | --- |
| `a`, `b` | The two operands as shown to the learner | given |
| `operand` | The range that covers both operands | `[min(a, b), max(a, b)]` |
| `sum` | `a + b` | `[a + b, a + b]` |

Rules: a box is contained in another when every quantity's `[min, max]` lies inside the other's; generated bounds are feasible when `[2·operand.min, 2·operand.max]` intersects `[sum.min, sum.max]`. Deriving `sum` from `a` and `b` here is range bookkeeping for coverage checks, not answer validation, which stays in the domain code (research R7).

## Registries (`content/registry/*.json`)

All share `$schema` → `schemas/registry.schema.json`, `schemaVersion: "0.1-pilot"`, and a `kind`.

| File | `kind` | Entry fields |
| --- | --- | --- |
| `generators.json` | `generators` | `name`, `version`, `relation` (named quantity relation the tooling implements; pilot: `sum-of-two-operands`), `parameters` (map of parameter name → `{ quantity, min, max }` domain), `produces` (quantities emitted, e.g. `a`, `b`, `sum`) |
| `validators.json` | `validators` | `name`, `version`, `artifact` (`{ type: "integer", min?, max? }` in the pilot), `emits` (misconception codes) |
| `representations.json` | `representations` | `name`, `role` (`help`, `explanation`, or both), `reads` (quantities), `supports` (box: quantity → `{ min, max }`) |
| `visual-components.json` | `visual-components` | `type`, `attributes` (map of attribute → `{ type: "integer" \| "string", min?, max? }`), `representation` (optional link to a representation name) |
| `misconception-codes.json` | `misconception-codes` | `code`, `validator` (name) |

Names and versions in registries are unique per kind. Registries are reviewed data; spec 002's domain tests assert the code matches them.

## Diagnostic (validator output)

`{ file: string (repo-relative, forward slashes), line?: integer, field?: string, message: string, expected?: string, severity: "error" | "warning" }`. Printed one per line; errors set exit code 1; warnings do not. The summary line counts files, skills, lessons, definitions, and registries.

## Relationships

```text
Skill 1..* ──prerequisite──> Skill
Skill 0..1 ──ladder──> [Definition@version]* (same skill)
Lesson *──skills──> Skill ;  Lesson *──practice──> Definition@version ;  Lesson *──relatedLessons──> Lesson
Lesson 1──translations──> Translation{nb,en}
Translation *──directives──> VisualComponent | Definition@version | Example(id)
Definition ──skill──> Skill ;  Definition ──validator──> Validator@version
Definition(generated) ──generator──> Generator@version
Definition ──representations──> Representation* ;  Definition ──misconceptionCodes──> Code* (emitted by its Validator)
```

## State

No runtime state. `status` on lessons is a label (`draft` → `pilot` → `released`) with one rule: `released` requires both translations.
