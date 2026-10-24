# Data Model: Practice Flow

Phase 1 output for [plan.md](plan.md). Three layers: the content records the domain reads (from spec 001), the domain and service types, and the guest session record in the browser. Names here are the ones the contracts and code use.

## Content records (read from `content/`, shapes from spec 001)

| Record | Source | Fields used by this feature |
| --- | --- | --- |
| `Skill` | `content/skills/*.json` | `id`, `prerequisites`, `ladder[] { definition, version, description { nb, en } }` |
| `ExerciseDefinition` | `content/exercises/**/*.json` (pilot) | `id`, `version`, `skill`, `source`, `validator { name, version }`, `generator { name, version, parameters { operand, sum: { min, max } }, constraints? }`, `instance { prompt { a, b }, validation { answer } }`, `representations { help[], explanation[] }`, `misconceptionCodes[]` |
| `Generator` (registry) | `content/registry/generators.json` | `name`, `version`, `relation`, `parameters`, `produces` |
| `Validator` (registry) | `content/registry/validators.json` | `name`, `version`, `artifact { type, min, max }`, `emits[]` |
| `Representation` (registry) | `content/registry/representations.json` | `name`, `role[]`, `reads[]`, `supports` |
| `LessonMetadata` | `content/lessons/<id>/lesson.json` | `id`, `version`, `status`, `skills`, `practice[]`, `visuals`, `translations` |
| `LessonFrontMatter` | `content/lessons/<id>/nb.md`, `en.md` | `title`, `objective` per language, read with YAML semantics (quoted scalars, folded blocks, comments) |

The loader fails at startup, naming the file, when a definition names an unregistered generator, validator, or representation, or when the `0.1` example schema is encountered (it is skipped by name, never resolved).

## Domain types (`MathKX.Domain`)

| Type | Fields | Rules |
| --- | --- | --- |
| `Seed` | `ulong Value` | Parsed from `^(0\|[1-9][0-9]*)$` within range; formatted the same way; never a JSON number |
| `InstanceIdentity` | `DefinitionId`, `Version` (int ≥ 1), `Seed?` (absent for fixed tasks) | Equality is value equality |
| `Instance` | `Identity`, `A` (int), `B` (int), `HelpRepresentations[]`, `ExplanationRepresentations[]`, `GeneratorVersion?`, `ValidatorName`, `ValidatorVersion`, `PromptExpression` (`"4 + 4"`) | Presentation data only; the sum is never a field |
| `ResponseArtifact` | `Kind` (`integer`), `OriginalText`, `Value?` (int when readable) | Reading: trim; optional leading `-`; digits only; leading zeros allowed; anything else unreadable |
| `ValidationStatus` | `Correct`, `Incorrect`, `InvalidResponse`, `PartiallyCorrect`, `ReviewNeeded` | The last two are never produced by `integer-answer@1`; they exist for exhaustive rendering |
| `FeedbackCode` | `correct`, `add.oneGroup`, `add.concat`, `add.offByOne`, `add.subtracted`, `add.generic`, `invalid.notAnInteger`, `invalid.empty` | The `add.*` codes are exactly the registry's; the `invalid.*` codes are input guidance, not misconceptions |
| `ValidationResult` | `Status`, `Code`, `Values` (map: `a`, `b`, `sum` only when `Status == Correct`, `v` the submitted value), `ValidatorName`, `ValidatorVersion` | `sum` appears only in a correct result (the completed equation); never in incorrect or invalid results |
| `IGenerator` | `Name`, `Version`, `Generate(definition, seed) -> (a, b)`, `PoolSize(definition)` | Implemented by `AdditionPairGenerator` only |
| `StepModel` | `Kind` (`help` \| `explanation`), `Representation`, `Index`, `Count`, `Reveals` (bool), `Visual` (representation-specific state: counted counters, ten-frame cells, highlighted parts), `Text { Code, Values }` | Built deterministically from the instance by `StepModels.For(instance, representation, kind)`; `Values` contains `sum` only when `Reveals` is true; the last `groups` help step and the last `make-ten` explanation step reveal |
| `InstanceResolver` | `Resolve(identity) -> Instance` | Looks up the definition at the pinned version, the generator at the definition's pinned version, and the representations; fixed tasks read `instance.prompt` |

## Service shapes (`MathKX.Api`)

See [contracts/api.md](contracts/api.md). The DTOs are projections of the domain types above with the private fields removed by construction (the DTO types have no `sum` or `validation` members).

## Guest session record (`src/web/src/state`)

| Entity | Fields | Rules |
| --- | --- | --- |
| `SessionRecord` | `schema: 1`, `language`, `skillId`, `ladder { current: { definition, version }, pending?: { definition, version, request } }`, `deliveries: Delivery[]`, `resumable?: { deliveryId, draft, helpOpen, helpStep }` | Stored under `mathkx.guest.v1`; `kept: boolean` reflects whether storage works |
| `Delivery` | `id` (client UUID), `instance { definitionId, version, seed?, generatorVersion?, validatorName, validatorVersion, a, b }`, `purpose: "practice"`, `provenance: "guest"`, `startedAt`, `events: Event[]` | One per resolved instance; a deliberate later repeat is a new delivery |
| `Event` (discriminated by `type`) | `submission { submissionId, originalText, value?, status, code }` (mathematical statuses only) · `input-guidance { submissionId, originalText, code }` · `support { kind, step?, reveals? }` with `kind` from the addendum's named set · `challenge-request { request: easier \| harder \| another \| same, outcome: requested \| applied \| cleared \| unavailable }` · `skipped` · `ended` | Ordered by insertion; `submissionId` duplicates are dropped |
| `Outcome` | `correctFirst`, `correctAfterFeedback`, `correctWithVisualHelp`, `correctWithHelp`, `correctAfterExplanation`, `notYetCorrect`, `skipped`, `unfinished`, `partiallyCorrect`, `notAssessed`, or `none` (only input guidance) | Derived, never stored; see [contracts/observations.md](contracts/observations.md) |
| `Tag` | `feedbackBefore`, `visualBefore`, `lessonBefore`, `explainPartBefore`, `revealExplanation`, `revealCounting`, `revealLesson`, `visualAfter`, `explainAfter` | Derived with the outcome |
| `Summary` | `questions`, `counts: Record<Outcome, number>` | Counts only; no ratios |

## Relationships

```text
LessonMetadata *──practice──> ExerciseDefinition@version ──skill──> Skill ──ladder──> [ExerciseDefinition@version]
ExerciseDefinition ──generator──> Generator(registry) ; ──validator──> Validator(registry) ; ──representations──> Representation(registry)*
InstanceIdentity ──InstanceResolver──> Instance ──rendered by──> ExerciseShell(+ math components)
Instance + ResponseArtifact ──IntegerAnswerValidator──> ValidationResult
SessionRecord 1──> Delivery* 1──> Event* ──derive──> Outcome + Tag* ; SessionRecord ──summarize──> Summary
```

## State transitions (practice screen)

```text
idle ──request(definition, version, seed)──> question-shown
question-shown ──open help──> help-open (same question; draft kept)
question-shown | help-open ──submit readable──> judged(correct | incorrect)
question-shown | help-open ──submit unreadable──> question-shown (+ input-guidance event)
judged(incorrect) ──edit and submit──> judged(…)
judged(correct) ──open explanation──> judged(correct) (+ explanation-open, explanation-step events; tags only)
judged(incorrect) ──open explanation──> judged(incorrect) (+ explanation-open, explanation-step events with reveals from the service; the field stays editable; a reveal before the next correct submission yields correctAfterExplanation)
any ──Make it easier / More challenge──> same state, ladder.pending set (or "unavailable" notice at the ends)
any ──Another question──> question-shown with the pending definition if set, else the current; previous delivery gets `skipped` if it had no submission
any ──More like this──> question-shown in the current definition; pending cleared with notice
any ──end session──> previous delivery gets `ended`; resumable draft stored
```
