# Feature Specification: Pilot Content Contract and Validator

**Feature Branch**: `claude/project-analysis-recommendations-5d72c1` (spec directory `specs/001-pilot-content-contract/`; Spec Kit treats the two as independent)

**Created**: 2026-10-18

**Status**: Draft

**Input**: User description: "Start spec 001, the pilot content contract: the schemas, folder layout, directive and notation rules, and validator checks that let a contributor add a bilingual lesson, a generated or fixed exercise definition, and a skill's challenge ladder under content/ without guessing a field, with CI telling them exactly what is wrong. Covers decision-log feature F1."

## Sources this specification depends on

Per the constitution's specification rules, this feature restates existing decisions and creates no new requirement.

- **Requirement sources**: `AGENTS.md` and `content/AGENTS.md` (content configures, code computes; stable language-neutral IDs; schema and format documentation change together); `docs/vision.md#first-release-languages`; `docs/design/learning-experience.md` (lesson authoring approach, open contribution workflow); `docs/architecture/proposals/lesson-markdown-and-delivery.md` (folder layout, directive idea, authoring workflow acceptance criteria); `docs/architecture/exercise-format.md` and `docs/architecture/exercise-capability-model.md` §6, §11 and §17 (fixed and generated content, authoring implications, pilot before Format v1); ADR 0002, 0003, 0004, 0010.
- **Decision-log rows**: DL-004 (skills `numbers.number-bonds-to-ten` and `numbers.addition-within-20`), DL-006 (first topic), DL-009 (bound each generated definition to the mathematics its help can represent; declared supported ranges; boundary fixtures `4 + 4`, `9 + 9`, `19 + 1`), DL-012 (narrow experimental pilot contract; preserve the `0.1` fixture; not Format v1), DL-014 (milestone one scoped to `within-10` and `crossing-ten`), DL-017 (canonical lesson ID; cross-language metadata and anchors validated, prose not byte-identical), DL-021 (validator: unknown schema names, relative paths), DL-033 (lesson `practice` references a definition; directive, notation, front-matter and table rules as the pilot contract), DL-038 (lesson-pairing check in CI).
- **Evidence**: `docs/reviews/round-04/synthesis.md`, "Consolidated unresolved authoring contract", which lists the fields and rules this feature must define; `docs/reviews/round-01/claude-fable/revised-build-brief-corrections.md` §F; the prototype's `Prototype/mathkx-designsystemet/src/content/lessons/number-bonds-to-ten/` as the shape to formalize.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A contributor adds a bilingual lesson without guessing a field (Priority: P1)

An educator who has never edited the application wants to add or correct a lesson. They copy the lesson template folder, fill in the shared metadata, write the Norwegian Bokmål and English texts, reference one or two interactive visuals and one practice family by name, and run the content check. Every mistake they make is reported with the file, the field or line, and what was expected, in words that do not require reading application code.

**Why this priority**: Without this, no lesson can enter the repository and nothing downstream (practice, progress) has content to work on. It is also the contribution path the vision promises to educators.

**Independent Test**: A person who has not seen the repository before creates a second lesson from the template and the contributor guide alone, runs the check, and reaches a passing state without asking a maintainer which field means what.

**Acceptance Scenarios**:

1. **Given** the lesson template and guide, **When** a contributor creates `content/lessons/<id>/` with `lesson.json`, `nb.md`, and `en.md` and runs the check, **Then** the check passes and lists the lesson, its skills, and its practice families as resolved.
2. **Given** a lesson whose folder name differs from its `id`, **When** the check runs, **Then** it fails naming the folder, the `id` value, and the rule that they must be equal.
3. **Given** a lesson with `nb.md` but no `en.md`, **When** the check runs, **Then** it fails naming the missing language file.
4. **Given** a lesson whose `nb.md` has a section anchor that `en.md` lacks, **When** the check runs, **Then** it fails naming the anchor and both files.
5. **Given** a lesson that references a skill or practice family that does not exist, **When** the check runs, **Then** it fails naming the reference and where it was expected to be defined.
6. **Given** a lesson table written without the standard delimiter row, **When** the check runs, **Then** it fails naming the line and showing the expected row.

---

### User Story 2 - A maintainer defines an exercise family that tested code can generate (Priority: P1)

A maintainer describes a family of generated questions as data: which skill it serves, which registered generator produces it and at which version, the allowed value ranges, which visual help and explanation representations may be used and for which values, and which misconception feedback codes apply. The check confirms the family is consistent with the generator's declared domain and that every representation covers the family's whole value range. The same maintainer can also record a fixed, hand-authored task without inventing random generation for it.

**Why this priority**: The first milestone's practice loop generates questions from these definitions; a definition that lets through `19 + 1` with a model that cannot show it (round-04 finding) is exactly what this contract must prevent.

**Independent Test**: The two milestone definitions (`within-10` and `crossing-ten`) and one fixed worked example (`4 + 4`) validate; a definition with a range the make-ten model cannot show fails.

**Acceptance Scenarios**:

1. **Given** a definition for addition within ten naming generator `addition-pair` version 1 with operand and sum bounds, **When** the check runs, **Then** it passes and reports the resolved skill and generator.
2. **Given** a definition whose sum bound allows an operand above nine while its representation is the single-ten-frame make-ten model, **When** the check runs, **Then** it fails stating that the representation's supported range does not cover the definition's range.
3. **Given** a definition naming a generator or version that is not registered, **When** the check runs, **Then** it fails naming the unregistered generator.
4. **Given** a fixed task with authored prompt and answer and no generator, **When** the check runs, **Then** it passes, and the task is identified by its definition ID and version alone.
5. **Given** two definitions with the same ID and version, **When** the check runs, **Then** it fails naming both files (behaviour already present for the exploratory format, preserved).
6. **Given** a fixed task whose authored validation data does not fit the response shape of the validator it names (for example a non-integer answer for an integer validator), **When** the check runs, **Then** it fails naming the task, the validator, and the mismatch.

---

### User Story 3 - A maintainer declares how a skill's practice gets easier or harder (Priority: P2)

A maintainer lists, for a skill, the ordered sequence of definitions that "Make it easier" and "More challenge" move between, with a one-sentence learner-facing description of each step in both languages. The check confirms the sequence is ordered, has no duplicates, and refers only to definitions of that skill.

**Why this priority**: The practice controls the learning-experience document requires cannot be built without this data; it is small and depends on User Story 2.

**Independent Test**: The addition skill's ladder `within-10` then `crossing-ten` validates; a ladder that names a definition of another skill fails.

**Acceptance Scenarios**:

1. **Given** a skill with a ladder of two existing definitions of that skill, each with a Norwegian and an English sentence, **When** the check runs, **Then** it passes.
2. **Given** a ladder entry naming a definition that belongs to a different skill, **When** the check runs, **Then** it fails naming the entry and the two skills.
3. **Given** a ladder entry missing one language's sentence, **When** the check runs, **Then** it fails naming the entry and the missing language.

---

### User Story 4 - A translator improves one language without breaking the pair (Priority: P2)

A translator rewrites the English text of a lesson for clarity. They change wording, sentence order within a section, and the example's title, but keep the sections, anchors, mathematics, and interactive references. The check passes. If they accidentally delete a section anchor or change a visual's parameters, the check tells them which element diverged from the Norwegian file.

**Why this priority**: Both languages are a first-release requirement and the review process must catch divergence; identical prose is explicitly not required.

**Independent Test**: Rewriting prose in `en.md` passes; deleting one `{#anchor}` or changing a directive attribute fails naming it.

**Acceptance Scenarios**:

1. **Given** a lesson pair, **When** the translator changes only prose and the example title in one language, **Then** the check passes.
2. **Given** a lesson pair where one language's visual directive has a different parameter value, **When** the check runs, **Then** it fails naming the directive, the attribute, and both values.
3. **Given** a lesson pair where the mathematics inside the texts differs (a different expression), **When** the check runs, **Then** it fails naming the first differing expression and its section.
4. **Given** a lesson pair where one language places two equivalent directives in a different order within a section, **When** the check runs, **Then** it passes.
5. **Given** a lesson pair where the same quantity is written `2,5` in Norwegian and `2.5` in English, **When** the check runs, **Then** it passes.

---

### User Story 5 - The milestone's content lives in the repository and validates (Priority: P3)

The number-bonds lesson that today exists only inside the prototype, the two skills decided for the first milestone, the two generated definitions and one fixed example, and the addition skill's ladder are present under `content/`, written in the pilot contract, and pass the check in CI. The exploratory `0.1` example exercise remains valid and unchanged.

**Why this priority**: It proves the contract on real content and gives the next features something to build on, but it depends on all of the above.

**Independent Test**: `content/` contains the listed items; the check passes in CI; the `0.1` example still validates; the prototype's own copy is untouched.

**Acceptance Scenarios**:

1. **Given** the migrated lesson pair, **When** the check runs, **Then** it passes with both languages, resolved skills, and resolved practice families.
2. **Given** the skill registry after migration, **When** the check runs, **Then** `numbers.number-bonds-to-ten` and `numbers.addition-within-20` exist, the prerequisite edge from the latter to the former is present, the graph is acyclic, and `algebra.linear-equations` still resolves for the `0.1` example.
3. **Given** a content file under `content/` that names a schema the check does not know, **When** the check runs, **Then** it fails naming the schema rather than skipping the file.

### Edge Cases

- A lesson folder contains a third language file: reported as unsupported until that language is a release requirement.
- A directive is well-formed but names a visual component that exists in the prototype and not in the registered set: reported as unregistered, with the registered names listed.
- A directive attribute is outside the component's declared range (for example a ten-frame explorer starting at 11): reported with the declared range.
- Notation inside `$...$` uses a construct outside the documented grammar (a square root in the pilot): reported with the grammar's name and the offending text; never silently dropped.
- A definition declares a misconception code that no validator provides: reported.
- A definition's `source` is `fixed` but it also names a generator, or is `generated` without one: reported.
- A lesson's `practice` entry names a definition whose skill is not among the lesson's skills: reported as a warning, not a failure (a lesson may legitimately send learners to a related skill).
- A `:::practice` directive in the body has no matching entry in the metadata's `practice` list, or an entry has no directive: reported.
- The `check` field the prototype's `lesson.json` carries is present: reported as not part of the pilot (self-checks are a later feature), with the line to remove.
- Content references use a skill ID from the prototype's retired scheme (`arithmetic.*`): reported as unknown with a hint that the registry uses `numbers.*`.
- A file under `content/` is valid JSON but not an object, or omits `$schema`: reported (behaviour already present, preserved).

## Requirements *(mandatory)*

### Functional Requirements

**Lesson contract**

- **FR-001**: A lesson MUST be a folder `content/lessons/<lesson-id>/` containing shared metadata, one Markdown file per release language (`nb.md`, `en.md`), and an optional `assets/` folder. The folder name MUST equal the lesson's `id`.
- **FR-002**: Lesson metadata MUST hold the language-neutral `id`, an integer `version`, a `status` from a documented set, the target `skills`, optional `prerequisites` (skills), optional `relatedSkills` and `relatedLessons`, the `practice` entries (each naming an exercise definition and version), the `visuals` the lesson may embed, and the `translations` map from language to file. Every field MUST be documented as required or optional with its type and allowed values.
- **FR-003**: Each language file MUST carry `title` and `objective` as front matter and the lesson body as Markdown. Section headings MUST carry explicit anchors (`{#id}`), and the set of anchors MUST be identical across languages; their order may differ (DL-017).
- **FR-004**: Lesson bodies MUST use standard Markdown for text, headings, lists, links, images, and tables; tables MUST include the delimiter row so that generic renderers display them.
- **FR-005**: Interactive elements MUST be expressed as the three fenced directives `:::visual{...}`, `:::example{...}`, `:::practice{...}`. The permitted attributes, their types, defaults, and ranges for each directive and each registered visual component MUST be documented and checked. Unknown directive names or attributes MUST be reported. A `:::practice` directive MUST name a definition and version (not a skill and variant) and MUST correspond to an entry in the lesson metadata's `practice` list; an entry without a directive or a directive without an entry MUST be reported. Directive attributes are classified as non-localized (identity and mathematics, such as `id`, `type`, `definition`, `version`, `start`, `a`, `b`, `c`), which MUST be identical across languages, or localized (such as the `title` of `:::example`), which MUST be present and non-empty in each language and are exempt from cross-language equality.
- **FR-006**: Inline (`$...$`) and display (`$$...$$`) mathematics MUST conform to a documented notation grammar for the pilot; unsupported notation MUST be reported, never dropped or altered.
- **FR-007**: Across a lesson's languages, the set of directives (matched by identity: name plus `id`, name plus `definition`, or name plus `type` and non-localized parameters) and their non-localized attribute values MUST be identical, and the set of mathematical expressions within each section MUST be identical after normalization (locale decimal separators and whitespace normalized to canonical numbers and tokens). Directive order, sentence order within a section, prose, and localized attributes need not be identical (DL-017).
- **FR-008**: Images in `assets/` MUST have alternative text in each language file; a referenced asset or link that does not exist MUST be reported.

**Exercise definition contract (pilot)**

- **FR-009**: An exercise definition MUST declare a language-neutral `id`, an integer `version`, the `skill` it serves, a `source` of either `generated` or `fixed`, and the registered validator (name and version) that judges responses to it.
- **FR-010**: A `generated` definition MUST name a registered generator by name and version and supply the generator's parameters within the generator's declared domain; a `fixed` definition MUST supply its authored instance (prompt data and private validation data) and MUST NOT name a generator. The check MUST confirm that the named validator is registered and that the authored validation data conforms to that validator's declared response-artifact shape; a fixed task whose validation data does not fit its validator MUST be reported.
- **FR-011**: A definition MUST list its supported representations (visual help and explanation models) with the value range each supports; the check MUST fail when any representation's range does not cover the definition's value range.
- **FR-012**: A definition MUST list the misconception feedback codes its validator may emit, from a documented code list; unknown codes MUST be reported.
- **FR-013**: The pair (`id`, `version`) MUST be unique across all definitions; different versions of one ID may coexist (behaviour preserved from the exploratory format).
- **FR-014**: The exploratory `0.1` exercise example and its schema MUST remain valid and unchanged; the pilot contract is versioned separately (`0.1-pilot`) and is explicitly not Exercise Format v1.

**Skill ladder**

- **FR-015**: A skill MAY declare an ordered `ladder` of its exercise definitions, each entry naming a definition and version and carrying a learner-facing sentence in each release language. Entries MUST refer to definitions of that skill, MUST be unique, and MUST be ordered from least to most demanding as authored.

**Validation and diagnostics**

- **FR-016**: One content check MUST validate every file under `content/` against the schema it declares and MUST report any file whose schema is not among the known set rather than skipping it.
- **FR-017**: The check MUST resolve every reference: lesson skills, prerequisites, related skills and lessons, practice definitions, definition skills, ladder definitions, generators, representations, misconception codes, directive components, assets, and section anchors.
- **FR-018**: Every failure MUST name the file (as a repository-relative path), the field or line, the offending value, and the rule or expected value, in one sentence a contributor can act on; the check MUST continue past the first failure and report all failures.
- **FR-019**: The check MUST run locally with one command and in CI on every pull request and push to `main`; validator behaviour MUST be covered by regression tests for each failure case in this specification.

**Contributor guidance and pilot content**

- **FR-020**: A lesson template folder and a short contributor guide MUST exist and MUST document every field, directive, attribute, the notation grammar, and the table rule; `content/AGENTS.md` and `content/README.md` MUST point to them. Existing statements that a skill file carries only its ID and prerequisites (in `content/README.md` and the skill schema's description) MUST be updated when the ladder is added.
- **FR-021**: The repository MUST contain, under `content/`, the number-bonds lesson pair, the skills `numbers.number-bonds-to-ten` and `numbers.addition-within-20` with the prerequisite edge between them, the definitions `within-10` and `crossing-ten` of the addition skill, one fixed worked example, and the addition skill's ladder, all passing the check. The prototype's own copies are not modified by this feature.

### Key Entities

- **Skill**: A language-neutral unit of mathematical capability with prerequisite skills and, optionally, a ladder of its exercise definitions (existing entity, extended).
- **Lesson**: Shared metadata plus one text per release language; references skills, related lessons, practice definitions, and visuals; identified by `id` and `version`.
- **Lesson translation**: One language's title, objective, and body; must agree with its siblings on anchors, directives, and mathematics.
- **Directive**: A named, parameterized reference inside a lesson to a registered visual component, a worked example block, or a practice entry point.
- **Exercise definition**: Either a generated family (generator, version, parameters) or a fixed task (authored instance); declares skill, the validator (name and version) that judges responses, supported representations with ranges, and misconception codes; identified by `id` and `version`.
- **Generator registration**: A documented generator name, version, parameter names, and parameter domain against which definitions are checked.
- **Validator registration**: A documented validator name, version, and the response-artifact shape it accepts, against which fixed tasks' validation data and generated definitions' validator references are checked.
- **Representation support**: A named visual or explanation model with the value range it can show.
- **Misconception code**: A stable identifier for a feedback message pattern, with text supplied per language outside the definition.
- **Challenge ladder**: An ordered list of a skill's definitions with localized step descriptions.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A contributor new to the repository produces a second lesson folder that passes the check using only the template and guide, without asking a maintainer what a field means (verified in a recorded contributor session; target one session, zero clarifying questions about fields).
- **SC-002**: Every edge case and failing acceptance scenario in this specification produces a failure that names the file and the field or line and states the expected value; none passes silently. 100 percent of the listed cases are covered by regression tests.
- **SC-003**: The complete content check for the pilot content finishes in under 30 seconds locally and in CI.
- **SC-004**: The lesson template and guide document 100 percent of the fields and directive attributes used by the pilot content; a reviewer can find each field in the guide.
- **SC-005**: A translator's prose-only change to one language passes; each of the three divergence cases (anchor, directive attribute, mathematics) is reported within the same run.
- **SC-006**: The exploratory `0.1` example validates unchanged after the feature lands, and the existing validator regression tests still pass.

## Assumptions

- Decided scope: skills and topic per DL-004 and DL-006; the pilot contract is experimental (`0.1-pilot`) per DL-012 and is not Exercise Format v1; the `0.1` fixture stays.
- The folder layout and the three directive names follow `docs/architecture/proposals/lesson-markdown-and-delivery.md` and the prototype; the attribute syntax is `name="value"` inside the braces as the prototype renders today.
- `title` and `objective` live in each language file's front matter (as the prototype does), not in the shared metadata, because they are language-specific.
- The prototype's single `related` list is split into `relatedSkills` and `relatedLessons`, both optional, because the proposal speaks of related lessons while the prototype links skills; both uses exist and neither needs to be dropped.
- The prototype's `check` field is excluded from the pilot because self-checks are a later feature (DL-023, DL-028); it is reported if present.
- The notation grammar for the pilot is the prototype's documented TeX-like subset (powers, subscripts, fractions, primes, Δ, comparison operators, limits); square roots, matrices, and alignment are outside the pilot and must be reported, not rendered.
- The registered generator for the pilot is `addition-pair` version 1 with operand and sum bounds; the registered representations are the grouped counters, the make-ten frame, and the ten-frame explorer with the ranges the prototype's explanations declare. Registration is content-side documentation plus a check; the generator itself is specified by the next feature.
- Misconception code texts per language are supplied with the feature that renders them; this feature fixes the code identifiers only.
- Dictionary key-parity checks for application strings belong to the practice-flow feature, because no application dictionary exists under `src/` yet; this feature covers lesson pairing.
- Lesson files move into `content/lessons/`; the prototype keeps its own copy under `Prototype/` and continues to work from it.
- Repository-relative paths and continue-on-failure reporting extend the existing validator rather than replacing it.
- Dependencies: the decision log rows listed above; the constitution; the existing `tools/validate-content.mjs` and its tests; CI already running the check.
