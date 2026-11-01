# Research: Self-Checks ("Check My Understanding")

Phase 0 of [plan.md](plan.md). Each decision records what was chosen, why, and what was rejected. Decisions of specs 001 to 005 stand unless a decision here says otherwise.

## R1. The check file

**Decision**: a new content kind, one JSON file per check version under `content/checks/`, grouped by domain as definitions are (`content/checks/numbers/addition-within-20.json`). It names `schemas/self-check.pilot.schema.json` with `schemaVersion: "0.1-pilot"`. Its fields:
- `id` (the definitions' pattern) and `version`;
- `skill`;
- `title` and `scope`, each `{ nb, en }`;
- `questions`: 1 to 10 items of `{ definition, version, seed? }`, with `seed` a decimal string as in an instance identity.

The pilot is `numbers.addition.check-within-20`, version 1 ([contracts/check-content.md](contracts/check-content.md)).

**Rationale**:
- **DL-023**: an authored list of identities is what the decision asks for. It is data with no expressions (constitution III), reviewable in a pull request, and versioned like a definition: a changed list is a new version, and a recorded run keeps its own copy (R7).
- **Same tools**: the loader and the content check already dispatch on `$schema`, so a new kind is one entry in each, not a new mechanism.
- **The check names its skill**: lessons, practice, and "My work" all find checks through a skill. Lessons gain no field, and spec 001's report of a lesson's `check` field stays, with a message that now says where checks live.

**Alternatives considered**:
- **A `check` field on the lesson**, as in the prototype: it ties a check to one lesson, though practice and "My work" offer it too, and it would reverse spec 001's report for no gain. The spec records this as reversible if a lesson needs to choose among several checks.
- **Checks inside the skill file**: skills are curriculum-independent graph nodes (ADR 0002). Checks are content about a skill, with their own versions and texts.
- **A generated check** (draw *n* questions from the ladder): DL-023 rules out a mixed-skill generator for the first check, and a fixed list keeps a run comparable with the next one.

## R2. Seeds in the file, and how a maintainer finds one

**Decision**: a generated question is written as definition, version, and seed only. The file carries no operands. A maintainer finds the seed of a wanted question in the variation's pool: `GET /api/definitions/{id}/{version}/pool` (spec 005) lists every question with its smallest seed. The authoring guide shows how. The domain tests pin the pilot's questions in a fixture (`checks.pilot.json`: `7 + 3`, `5 + 4`, `8 + 5`, `9 + 4`), so a changed seed or generator fails CI with the operands named. The pilot seeds come from the pool: 22 and 24 within ten, and 105 and 62 across ten.

**Rationale**:
- **One source of truth**: operands in the file would repeat what the generator decides, and could disagree with it. Spec 005 R2 rejected a checked-in seed table for the same reason. The identity alone is what replays (ADR 0004).
- **The smallest seed** is the canonical, stable choice, and the pool already computes it.

**Alternatives considered**:
- **An `expect: { a, b }` field checked by the domain tests**: readable in review, but it makes content state a computed result, and the content check could not verify it (it runs no generators).
- **Fixed-task definitions for each question** (four new `source: "fixed"` files): no seeds at all, but four definitions that exist only for a check, outside every ladder, would each appear as an "Other" variation of the skill in spec 004's terms. Checks should reuse the practised variations.

## R3. What the content check enforces, and what the domain tests enforce

**Decision**:
- **The schema**: shape, both languages, `minItems: 1`, `maxItems: 10`, and the seed pattern.
- **`tools/lib/checks.mjs`**: the cross-file rules of FR-018:
  - the check's identity is unique, and its skill exists;
  - each question's definition and version is a pilot definition;
  - a seed on a generated definition and none on a fixed one, with the seed within 0 to 2^64 − 1;
  - each question's definition serves the check's skill;
  - no question is listed twice: the same definition, version, and seed, or the same fixed definition twice.

  Each diagnostic names the file, the field (`questions[2].seed`), and the problem, in spec 001's format.
- **`dotnet test`** (FR-019): every check in `content/` has questions that resolve through `InstanceResolver`, and those questions are distinct as questions. Two different seeds that give the same operands are a duplicate the content check cannot see. The pilot's questions match the fixture.
- **The loader** refuses to start on an unknown definition, as it does for lessons today, so a broken check can never reach a learner even without CI.

**Rationale**: spec 001's split, unchanged. The content check reads files and registries and runs no domain code; the mathematics is checked where it is computed.

**Alternatives considered**: running the generator from Node to check seeds. That would duplicate the C# generator in JavaScript, which constitution III rules out.

## R4. Serving checks

**Decision**:
- **The catalog**: `ContentCatalog.Checks`, keyed `id@version`.
- **`GET /api/checks`**: the newest version of every check, ordered by ID.
- **`GET /api/checks/{id}/{version}`**: one version, used for a recorded run's title.

Each check is returned with its skill, title, scope, and questions as identities ([contracts/api.md](contracts/api.md)). The app filters by skill: the lesson page by the lesson's skills, the practice page by its skill, and "My work" by each skill group.

**Rationale**: two small read-only endpoints in the style of `/api/lessons` and `/api/skills`. The identities carry no sums. With a handful of checks, one list request per page is simpler than a per-skill query.

**Alternatives considered**:
- **Adding `checks` to `SkillDto`**: practice and "My work" already fetch skills, but the lesson page would then need every skill's check details. Checks have their own texts and versions, so they get their own shape.
- **Serving only the newest version**: a run of an older version would lose its title. Its summary would still work (R7), but the extra endpoint costs little.

## R5. The correct answer in the summary

**Decision**: a new read-only endpoint, `GET /api/instances/{definitionId}/{version}/{seed}/answer`, returns `{ identity, answer: { kind: "integer", value } }` from the domain's resolved instance. A fixed task uses `-` as its seed segment, as the other instance routes do. The summary requests it only for questions without a correct saved answer. For a correct one, the learner's validated answer is the correct answer. Nothing else requests it, and the end-to-end check asserts that no answer request is made before the summary.

**Rationale**:
- **Constitution III and spec 004**: the app never computes a sum, and the replay already follows this rule.
- **The validator's data**: the answer is what the validator holds for the instance, so the service is its source.
- **The sum rule widens explicitly**: the api contract of spec 002 ("no sum anywhere except a correct validation result and a revealing step") gains a third, named exception, used only after a check.

**Alternatives considered**:
- **Adding the operands in the app**: a sum computed in the UI (constitution III).
- **The explanation's revealing step**: it is shaped for presentation, not as data. It takes two requests (the count, then the last step), and it would make showing an answer depend on a representation.
- **Returning the expected answer with an incorrect validation**: practice would then receive the answer after every wrong attempt.

## R6. When answers are validated

**Decision**: on "Save answer", through the existing `POST /api/validations`, with a new submission ID. The store records the event as practice does. An `invalid-response` is input guidance: the guidance text is shown, nothing is saved, and the learner stays on the question. A `correct` or `incorrect` result is recorded as the question's only submission, the run moves on, and **no part of the response reaches rendered state**. If the request fails, the answer is not saved: a notice says it could not be saved, and the draft stays.

**Rationale**:
- **Input guidance at save time**: acceptance scenario 3 needs the service's input guidance when the learner saves, so validation at the end could not serve it.
- **No other path**: the result is recorded once, by the same code, with the same idempotency (`recordEvent` drops a repeated submission ID).
- **The spec's failure rule**: "not saved" on failure is exactly the edge case the spec describes, and a missing result can never be shown as wrong, because there is none.

**Alternatives considered**:
- **Validating every answer at the end**: input guidance would come too late, a failure at the end would leave several answers unscored at once, and the summary would need a batch endpoint.
- **Parsing in the app and validating at the end**: it would duplicate spec 002's input rules in the app.

## R7. The record: check runs apart from practice

**Decision**: `PersistedState.checkRuns: CheckRun[]`, separate from `deliveries`. A run holds:
- its ID, the check's ID, version, and skill;
- a copy of the question list as identities;
- its deliveries in order (`purpose: "check"`), only for questions reached;
- the switch position `switchAt` (1-based, or `null`);
- `startedAt`, and `finishedAt` or `endedAt` (ended by a new run of a check of the same skill);
- `resume`: the draft and panel state of its current question.

A question's part is derived from `switchAt`, never stored twice. A record written before this feature hydrates with `checkRuns: []`; the schema version stays 1. "Clear my work" empties it ([data-model.md](data-model.md)).

**Rationale**:
- **Separation by construction (FR-014)**: practice's derivations all read `deliveries` (`groupBySkill`, `repeats`, `recentWindow`, the session). Keeping check questions out of that list means none of them changes, and no filter can be forgotten.
- **A self-contained run (FR-016)**: the run's copy of the list and its own deliveries let the summary be derived without the content, so a new check version never changes a recorded one.
- **The same events**: a check delivery records practice's events (FR-013), so outcome derivation for the supported part is spec 002's `derive`, unchanged.

**Alternatives considered**:
- **Check deliveries in `deliveries` with a `purpose` filter**: every practice function would need the filter, and one missed filter would leak check questions into practice's counts, window, or sessions.
- **Storing only answers, not deliveries**: the supported part needs practice's events, and FR-013 asks for deliveries.

## R8. The two parts on screen

**Decision**:
- **Independent part**: `CheckRunPage` renders its own `IndependentQuestion`. It holds the prompt, "Question *n* of *N*", the answer field, "Save answer", "Skip", and "I need help". It imports no step panel, feedback, explanation, or lesson-link code.
- **Supported part**: renders `QuestionWorkspace`, extracted from `ExerciseShell`. It holds the prompt, the field, "Check answer", help, the result, the explanation, and the lesson link. A check-bound controller drives it, with "Skip" or "Next question" (or "See summary") as the check's controls. Practice's `ExerciseShell` becomes `QuestionWorkspace` plus practice's controls, with every test identifier kept.
- **Store**: the check screen state (instance, draft, help and explanation steps, result, checking) lives beside practice's in the same store, under `check`. Its help and explanation steps are recorded with the same rule as practice: a step is recorded only when it is shown, while the view is presenting and the panel is open. This rule is factored into one helper used by both.

**Rationale**:
- **Absence by construction (FR-004, SC-001)**: no flag can be set wrongly. The tests still assert the absences.
- **One workspace**: the supported part is practice for each question (FR-008). Reusing the workspace keeps help, feedback, explanation, and retries identical, and the recording rule shared.
- **Separate current questions**: practice's question is untouched by a check. A practice question in progress stays resumable with its draft and help (DL-026 (4)), because the check never becomes practice's current question.

**Alternatives considered**:
- **A mode flag on `ExerciseShell`** that hides help and explanation: one wrong condition would show help in an independent check.
- **Making the supported question practice's current question**: practice's `question` action closes the previous question, which would skip the learner's resumable practice question. It would also join practice's session.

## R9. Routes, resuming, and focus

**Decision**:
- **`/checks/{checkId}`** is the start screen: title, scope, number of questions, policy, switch, and snapshot sentences. It offers "Start the check", and, when the skill has an unfinished run, "Continue the check".
- **Starting**: ends any unfinished run of a check of the same skill (`endedAt`), creates a run from the newest version, and replaces the address with `/checks/{checkId}/{runId}`.
- **The run route** shows the run's current question while it is unfinished, and its summary once it is finished or ended. A reload, a language switch, or a return from "My work" restores the question, its draft, its part, and, in the supported part, the help and explanation steps reached. Steps are fetched again and not recorded again, as in spec 005's resume.
- **Focus**: on the prompt of each new question; on the confirmation's heading when it opens; on the summary heading at the end.
- **Unfinished runs in "My work"** show only "question *n* of *N*" and "Continue the check", never counts.

**Rationale**:
- **Reloads (FR-015)**: one address per run makes a reload land on the run, not on a fresh start screen. The summary at the same address means "My work" and the end of the run share one page.
- **No result before the end**: counts of an unfinished run would state correctness before the summary.

**Alternatives considered**:
- **One address for both screens** (`/checks/{checkId}` showing the start screen or the run): a reload could not tell them apart.
- **Several unfinished runs per skill**: the start screen could not say which one "Continue" means. FR-003 ends the old one.

## R10. Lessons and checks

**Decision**:
- **Independent part**: no lesson link, and spec 003's notice never applies there.
- **Supported part**: the workspace's lesson link carries `?from=check`. The lesson page then treats the check's current supported question as the detour question: the disclosure gate, the recording of `lesson-opened` or `lesson-reveal` on that delivery, and "Back to your question" to the run's address.
- **Any other lesson visit**: unchanged from spec 003, about practice's current question. A lesson visited while an independent check is unfinished is a lesson view (spec 004), not help on the check question.
- **"Check my understanding"**: offered on the lesson page for each check of a skill the lesson teaches, on the practice page for the skill's checks, and in "My work" under the skill.

**Rationale**:
- **Spec 003 rules, reused**: the supported part is practice, so the detour rules apply there unchanged, with the check's question as the subject.
- **The independent part's limit**: the app cannot see what a learner does outside it, and it does not pretend to. The spec forbids help inside the check; it does not ask the app to police the rest of the application. The summary never claims more than what was recorded.

**Alternatives considered**:
- **Recording lesson views during an unfinished independent check as help on the current question**: it would treat a lesson opened for any reason as help on that question. Only an answer saved afterwards could be affected, and the recorded run already shows where each answer came from.
- **Blocking navigation during a check**: it would trap the learner, against the calm principle and DL-026's resumable intent.

## R11. Explanations in the summary

**Decision**: each question in the summary offers its explanation through `StepPanel`, fed by `api.getStep` in the summary component itself, not through the store. Nothing is dispatched, so nothing is recorded (FR-011). The panel opens only once the question's identity is confirmed: the summary re-resolves it with one instance request and compares the operands with the recorded ones, as spec 004's replay does. Otherwise the panel is replaced by a sentence saying the explanation is unavailable.

**Rationale**: the summary comes after the check, so an explanation there is review, not help on an answer that could still change. Keeping it out of the store makes "records nothing" structural.

**Alternatives considered**: opening explanations through the store's explanation actions. They record `explanation-open` and steps on the delivery, which FR-011 forbids.
