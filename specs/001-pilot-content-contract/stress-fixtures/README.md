# Stress fixtures: can the pilot content contract grow?

These fixtures try to author seven of the capability model's representative scenarios, plus a decimal task, under the spec 001 pilot contract exactly as a maintainer would, before any validator code exists. Where the contract has no field, the fixture uses the most natural shape so that the schema's rejection names the gap. A `pilot-control` set holds the real pilot content (addition within 20) and must always pass.

Sources: [exercise-capability-model.md](../../../docs/architecture/exercise-capability-model.md) sections 6, 7, and 12; [data-model.md](../data-model.md); [contracts/](../contracts/). Decision-log rows: DL-009 (declared supported ranges), DL-012 (narrow pilot, not Format v1), DL-024 (seed proposal pending; integer parameters). Constitution principles II and III.

## Run

```bash
node specs/001-pilot-content-contract/stress-fixtures/check.mjs
```

The script validates every JSON file twice with Ajv 2020 in strict mode: against the pilot contracts in `../contracts/`, and against `contracts-next/`, a projection that adds only `oneOf` branches, enum values, and optional fields. The projection is a proof of additivity, not a proposal to widen the pilot; its added shapes are illustrative and undecided.

## Outcomes

Recorded on 2026-10-23 from `check.mjs`. "Pilot" is the contract as merged in PR 17; "adjusted" is after the additive changes this stress test proposes to `../contracts/` (relation optional, parameter-kind discriminator, named constraints, free-form fixed prompt data, artifact kinds as branches); "projection" is `contracts-next/`.

| Scenario | Source | Exercises | Pilot | Adjusted | Projection | Depends on an undecided matter |
| --- | --- | --- | --- | --- | --- | --- |
| `pilot-control` | spec 001 | The real pilot: two generated definitions, one fixed, two skills with a ladder, five registries | passes (11/11) | passes | passes | no |
| `s1-multiplication-facts` | S1 | Enumeration parameters (which tables, which fact form), generator without a quantity relation | rejected: parameter domains allow only `min`/`max`; `relation` required | rejected: enumeration kind | passes | no |
| `s3-fraction-bar-number-line` | S3 | Fixed task; rational artifact with two linked parts; representations that are also the response surface | rejected: artifact type only `integer`; representation role only `help`/`explanation`; `representations.response` unknown | same | passes | linked shared state between two visuals is a component contract (Format v1), not a content field |
| `s4-order-mixed-forms` | S4 | Authored option pool with stable IDs, display forms, canonical values; ordered-partition artifact with ties | rejected: no `pool`; enumeration kind; artifact kind | same | passes | tie semantics belong to the validator result contract (capability model section 7) |
| `s6-linear-equation-balance` | S6, the existing `0.1` example re-expressed | Named constraints (`integer-solution`, `coefficient-nonzero`), generator without a quantity relation, prompt produced by the generator | rejected: `relation` required; `constraints` unknown on generator and definition | **passes** | passes | direct-manipulation artifact (operation sequence) is Later; scalar entry is Foundation |
| `s8-plot-point` | S8 | Point artifact with partial criteria; named exclusion constraint; interaction that is not typed entry | rejected: artifact kind; `interaction` unknown; `representations.response`; constraints | rejected: artifact kind, `interaction`, `response` (constraints and the generator registry now accepted) | passes | no |
| `decimal-tolerance` | section 7 "approximate numeric" | Scaled-integer parameters (`scale: 10`), decimal artifact with integer tolerance, decimal visual attributes | rejected: `scale` unknown; artifact kind; attribute type `decimal` | rejected: same (`scale`, artifact kind, attribute type) | passes | tolerance policy per task is a Format v1 rule; the fixture keeps every number an integer |
| `s7-match-representations` | S7 | Composition of derived parts; mapping artifact; expression-typed visual attributes | rejected: `composition` unknown; artifact kind; attribute type `expression`; constraints | rejected: `composition`, artifact, `expression` (constraints and the generator registry now accepted) | passes | accessible graph summaries are a component contract; expression attributes need the notation grammar to grow |
| `s15-diagnose-repair` | S15 | Fixed task with structured prompt (ordered steps with IDs); mixed-class validation; directive with an authored body | rejected: prompt values must be numbers; artifact kind; role `response`; component `body` | rejected: artifact, `response`, `body` (prompt now accepted) | passes | the `corrected` step needs expression equivalence, class B; symbolic equivalence is undecided, so the content can carry it but no validator can judge it yet |

Totals: pilot rejects 25 of 56 files; adjusted pilot rejects 21 of 56 (S6 passes entirely; S7's and S8's generator registries and S15's prompt are accepted); projection rejects 0 of 56. The control set passes under all three.

## What each scenario taught

- **S1.** Enumerations are the first non-range parameter kind a real generator needs ("tables 2, 5, 10"; "product or missing factor"). A `kind` discriminator on parameter domains makes this an added branch, not a changed one. Generators that pick from reviewed tables have no quantity relation, so `relation` must be optional; the feasibility check runs only when a relation is declared.
- **S3.** A representation can be the answer surface, not only help or explanation. `role` needs a third value, `response`, and the definition needs `representations.response`. Linking two visuals to one semantic state is not a content-contract matter; it is the component contract the capability model assigns to Format v1. The content side only needs a shared identifier, which the directive attribute `linked` already carries as a string.
- **S4.** Authored pools (options with stable IDs, display text, and canonical values) have no home. The capability model says data is appropriate for "authored content, assets, option sets"; a `pool` field is the extension point, and the generator selects from it by ID. Ties in an ordering need an ordered-partition artifact; the content only names it.
- **S6.** The existing `0.1` example fits the pilot shape once named constraints exist and `relation` is optional. Its `question.template` has no counterpart: generated prompts are produced by the generator from parameters, and the wording per language belongs with the localization decision (open), not in the definition. Its `visualization: equation-balance` becomes a representation with declared support bounds, which is exactly the round-04 fix. Its lesson visual, however, needs a quantity derivation the pilot lacks (see "Lesson excerpts").
- **S8.** Interaction is its own dimension. The pilot assumes typed integer entry; a definition needs an optional `interaction` name when that assumption does not hold. Partial credit for a correct `x` is a validator result matter, declared on the validator, not on the content.
- **Decimals.** Keeping every parameter an integer is the determinism rule from ADR 0004; a `scale` on the generator carries the denominator, and the artifact's tolerance is an integer in scaled units. Decimal visual attributes need an attribute type.
- **S7.** Composition (one model, several derived parts, a matching task) is a top-level shape the pilot lacks. It is Format v1 work; the extension point is an optional `composition` object. Expression-typed attributes (`f="2x + 1"`) also require the notation grammar to accept what the component renders.
- **S15.** Structured prompt data for fixed tasks (ordered steps with IDs) must be allowed as any JSON whose shape the representation declares it reads; restricting prompt values to numbers was a pilot artefact. The repair step's equivalence is class B and waits on the symbolic-equivalence decision; the misconception code is a candidate, never a label, which the code registry already expresses.

## Lesson excerpts

Each folder's `lesson-excerpt.md` shows the directives the lesson would use. The JSON checker does not parse them; this is a manual reading against the directive contract and task T026. S1 and the control need nothing new. S6 and S8 expose a deferred gap: T026's visual coverage check derives a quantity box from attributes `a` and `b` with the pilot relation, but `equation-balance` carries `equation="3x + 2 = 14"` while its representation supports `solution` and `coefficient`, and `coordinate-plane` carries `xMin`…`yMax` while its representation reads `x` and `y`. The pilot defines no way to derive those quantities from those attributes. Until a per-component quantity derivation exists (a named rule on the visual-component registry entry, additive), the validator reports a linked component without a pilot mapping as unsupported rather than silently skipping coverage (T026). S3 needs a string attribute to link two visuals (allowed). Decimals and S7 need attribute types `decimal` and `expression`, and S7's `f` needs the grammar to accept the expression. S15 needs a directive whose body carries authored steps, which the component registry's `body` field sketches; today only `:::example` has a body.

## What this proves and what it does not

Proved: every gap found is closable by adding a branch, an enum value, or an optional field, with the pilot content unchanged; the control set passes before and after. Not proved: that the added shapes are the right ones. They are sketches to show the extension points exist, and each needs its own specification when a feature needs it. Nothing here decides symbolic equivalence, Exercise Format v1, localization storage, or the validator result contract.
