# Contract trace: capability model dimensions against the pilot contract

Companion to [stress-fixtures/README.md](stress-fixtures/README.md). One row per dimension of [exercise-capability-model.md](../../docs/architecture/exercise-capability-model.md) and per response kind of its section 7, mapped to the pilot field that carries it, or to the extension point that would, or to a gap. "Additive" means a new `oneOf` branch, enum value, or optional field with existing files unchanged.

Status words: **carried** (the pilot expresses it), **deferred** (not in the pilot; the extension point is named and additive), **gap** (no extension point until the named change), **out of scope** (not a content-contract matter).

## Design dimensions (section 2)

| Dimension | Pilot field | Status | Extension point and evolution |
| --- | --- | --- | --- |
| Pedagogical purpose (retrieve, explore, diagnose…) | none | out of scope | Session orchestration (spec 002+) chooses purpose; a definition does not encode it |
| Mathematical activity and content domain | `skill`; skill graph | carried | Skills stay language- and curriculum-neutral (principle II) |
| Representation | `representations.help`, `.explanation`; representation registry with `supports` boxes | carried for bounded models | `role` gains `response` (S3, S8, S15); `supports` gains optional named `constraints` for models that bounds cannot describe; both additive |
| Interaction | none; the pilot assumes typed integer entry | deferred | Optional `interaction` name on the definition (S8); interaction registry when more than one exists |
| Response artifact | validator registry `artifact.type` (`integer` only) | carried for integers | One `oneOf` branch per artifact kind (rational, decimal with scale and integer tolerance, point, ordered-partition, mapping, derivation-repair…); additive, proved by the projection |
| Validation | `validator { name, version }`; artifact shape; `misconceptionCodes` | carried | Validation behaviour lives in code; the content names it. See the response-kind table below |
| Generation | `generator { name, version, parameters }`; generator registry with parameter domains, `relation`, `produces` | carried for integer ranges with one relation | Parameter `kind` discriminator (`integer-range` today; `enumeration` next); `relation` optional; named `constraints`; `scale` for scaled integers; `pool` for authored option sets; all additive |
| Composition | none | deferred | Optional `composition { parts, task, arity }` (S7); Format v1 work |
| Support (hints, feedback, misconceptions) | `representations.help`; `misconceptionCodes`; code registry with the emitting validator | carried | Hint sequences and feedback texts arrive with F3; codes are candidates, never labels (section 8) |
| Accessibility | lesson images require alt text; nothing on components | out of scope for content | Component accessibility (semantic summaries, non-pointer paths) is the component contract; a registry flag could later declare which components have an accessible alternative |
| Internationalization | lesson `nb.md`/`en.md` pairing; ladder sentences `{ nb, en }`; skill and definition IDs language-neutral | carried for lessons and ladders | Prompt wording for generated tasks and misconception texts wait on the localization-storage decision (architecture.md "Future decisions"); the definition carries no prose by design |
| Session orchestration | none | out of scope | Spec 002 (practice flow) |
| Mastery evidence | none | out of scope | Runtime observations (mastery.md); content only supplies stable IDs and versions |

## Response kinds (section 7, "Required validation capabilities")

| Response | Class | Pilot | Extension point |
| --- | --- | --- | --- |
| Exact scalar (integer, finite decimal, Boolean, option ID) | A | integer carried | `artifact` branches `decimal` (with `scale`), `boolean`, `option` |
| Approximate numeric | A | — | `artifact` branch `decimal` with integer `tolerance` in scaled units (decimal fixture) |
| Rational and equivalent form | A | — | `artifact` branch `rational` with form rule (`simplified`, `any`) (S3) |
| Quantity with units | A/B | — | `artifact` branch `quantity` naming a curated unit family; general dimensional algebra is B and later |
| Expression | B | — | `artifact` branch `expression`; validation semantics depend on the symbolic-equivalence decision (undecided; do not pre-empt) |
| Equation, inequality, interval, set | B | — | `artifact` branch `solution-set`; same dependency |
| Coordinate or geometric object | A/B | — | `artifact` branch `point` with `components` and `partial` (S8); constructions are B and later |
| Ordered or unordered collection | A | — | `artifact` branches `ordered-partition` (ties) and `set` (S4) |
| Multiple valid answers | A/B | — | `pool` with accepted IDs, or a named constraint on the validator; never enumerate infinite forms in JSON |
| Multi-step work | A/B | — | `artifact` branch `derivation-repair` with `criteria` (S15); general derivations are B |
| Graph | B | — | representation with declared function family and viewport; validation in code |
| Construction | B | — | later; extension point is an artifact branch plus a representation constraint list |
| Written reasoning | C/D | — | out of scope for automatic validation; content could carry rubric IDs later |

## Generation (section 6)

| Rule | Pilot | Status |
| --- | --- | --- |
| Data holds IDs, versions, bounded parameters, enumerations, option sets, declared constraints | ranges and names | enumerations, pools, and constraint names are the additive extensions above |
| Code holds symbolic construction, constraint solving, geometry validity, graph equivalence, simulation | registries name code | carried: names and versions only |
| No arithmetic, loops, predicates, or templates in JSON | holds | the quantity relation and constraints are names implemented once in tooling |
| Reproducibility `(definition id, version, seed)` | definition `id`, `version`; seed outside content | carried; integer-only parameters keep instances replayable; `scale` keeps decimals integers |
| Generation hazards checked by tests | feasibility, range coverage, `min ≤ max` in the validator | partial: ambiguity, ugly values, distractor collisions are generator tests in spec 002 |

## Lesson layer

| Element | Pilot | Status |
| --- | --- | --- |
| Notation grammar | documented subset; unsupported reported, never dropped | additive by design: new constructs extend the grammar version; S7's `f="2x + 1"` already parses |
| Directive attributes | `integer`, `string` | `decimal`, `expression`, enumeration values are added enum values |
| Directive bodies | only `:::example` has a body | component registry `body` (`markdown` or `steps`) for S15 |
| Cross-language pairing | identity and normalized mathematics | unchanged by any scenario |

## Evolution rule proposed for the contract

1. `schemaVersion` stays `0.1-pilot` while every change is additive; existing files never need edits to stay valid.
2. Every closed set is a discriminator or an enum that may gain values: `artifact.type`, parameter `kind`, representation `role`, attribute `type`, `body`.
3. Every pilot-only assumption is an optional field or an optional branch, not a hard-coded shape: `relation`, `constraints`, `scale`, `pool`, `interaction`, `composition`, `representations.response`.
4. A change that removes or re-types a field bumps the version and is a specification of its own.
5. The stress fixtures are rerun whenever a contract file changes; the control set must pass and the recorded outcomes are updated in the same change.
