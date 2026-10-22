# Research: Pilot Content Contract and Validator

Phase 0 output for [plan.md](plan.md). Each entry records a decision, why, and what else was considered. Decisions here are implementation choices within the spec and the constitution; none changes a requirement.

## R1. Markdown parsing for validation

**Decision**: Parse lesson bodies with the unified/remark stack: `remark-parse` (CommonMark), `remark-gfm` (tables, strikethrough, task lists), `remark-frontmatter` plus `yaml` (front matter), `remark-directive` (container directives `:::name{key="value"}`), and `remark-math` (`$…$`, `$$…$$`). The validator walks the resulting syntax tree.

**Rationale**: The spec requires standard Markdown that generic renderers display (FR-004) and three container directives (FR-005). remark-directive's container form is exactly `:::name{attr="value"}` with a closing `:::`, which is what the prototype and the lesson proposal already use, so no syntax change is forced on authors. Using a standard parser means the validator and the future lesson renderer (spec 003) share one grammar instead of two hand-written ones, which the round-04 synthesis flagged as the risk with the prototype's parser.

**Alternatives considered**: Reuse the prototype's `Markdown.jsx` parser (rejected: its leniency hides portability defects such as tables without delimiter rows; the synthesis said prototype parser quirks are not the contract). `markdown-it` with plugins (rejected: directive support is less standard and the tree is less convenient for cross-language comparison).

## R2. Detecting tables without delimiter rows

**Decision**: After parsing with GFM, any paragraph whose lines all start with `|` is reported as "table without a delimiter row" with the expected `| --- |` line shown.

**Rationale**: GFM only recognises a table when the second line is a delimiter row; without it the lines become a paragraph. Both prototype lesson pairs have this defect today (verified in round 04), so the check catches real content.

**Alternatives considered**: Accepting pipe-only paragraphs as tables, as the prototype does (rejected by FR-004 and DL-033).

## R3. Notation grammar and normalization

**Decision**: Implement `tools/lib/notation.mjs` as a dependency-free tokenizer and parser for the pilot grammar documented in `contracts/directives-and-notation.md`, which is the prototype's documented subset: numbers with `.` or `,` decimals, single-letter identifiers, `f(x)`, the operators `+ − - = × · * < > ≤ ≥ ≠ ? □ ( ) [ ] , →`, powers `x^2`, `x^{n-1}`, `²`, `³`, subscripts `a_1`, fractions `\frac{a}{b}` and `a/b`, primes, and the commands `\Delta \cdot \le \ge \neq \to \lim`. Normalization for comparison: strip whitespace, map `*` to `·` and `-` to `−`, map `²`/`³` to `^2`/`^3`, parse numbers and emit them with `.` as the decimal mark, and serialize the tree in a canonical form. Unsupported input is reported with the offending text (never dropped).

**Rationale**: FR-006 requires a documented grammar and visible rejection; FR-007 requires cross-language equality of mathematics after normalizing locale decimal separators (round-04 challenge). The grammar already exists and is tested in the prototype; porting it keeps content written for the prototype valid. Keeping the module dependency-free lets the web app adopt the same file later.

**Alternatives considered**: A TeX parser such as KaTeX's (rejected: far larger grammar than the pilot allows, and accepting more than the renderer can show contradicts FR-006). Comparing raw strings (rejected: fails on `2,5` versus `2.5`).

## R4. Cross-language comparison rules

**Decision**: For each lesson pair: (a) anchor sets must be equal, order free; (b) directives are matched by identity, where identity is the directive name plus `id` for `:::example`, name plus `definition` and `version` for `:::practice`, and name plus `type` and all non-localized attributes for `:::visual`; the multiset of identities must be equal, order free; (c) non-localized attributes of matched directives must be equal; localized attributes (`title` on `:::example`) must be present and non-empty in each language; (d) for each section (between consecutive anchored headings), the multiset of normalized mathematical expressions must be equal, order free. Prose and sentence order are never compared.

**Rationale**: DL-017 forbids requiring identical prose or directive order; the round-04 challenge asked for exactly this attribute classification and normalized comparison.

**Alternatives considered**: Ordered comparison (rejected by DL-017). Comparing mathematics for the whole lesson rather than per section (rejected: loses the ability to say which section diverged, which FR-018 needs).

## R5. Where capability registries live and what they contain

**Decision**: Reviewed JSON files under `content/registry/`, validated by `schemas/registry.schema.json`: `generators.json` (name, version, parameter names with min and max bounds of the domain), `validators.json` (name, version, response-artifact shape such as `integer` with range), `representations.json` (name, the operands it reads and the bounds it supports), `visual-components.json` (directive `type` values with attribute names, types, and ranges), `misconception-codes.json` (code identifiers with the validator that emits them). For the pilot: generator `addition-pair` version 1 with `operand` and `sum` bounds; validator `integer-answer` version 1; representations `groups` (operands at least 1, sum at most 10), `make-ten` (operands at most 9, sum 11 to 18), `ten-frame-explorer` (start 0 to 10); codes `add.oneGroup`, `add.concat`, `add.offByOne`, `add.subtracted`, `add.generic`.

**Rationale**: The spec requires definitions and directives to be checked against registered names, versions, domains, and ranges (FR-005, FR-010, FR-011, FR-012). A registry as reviewed data keeps the check implementable in content tooling before the C# domain exists and gives spec 002 a precise list to implement. The constitution's gate III holds because registries hold bounds and names, never logic. The domain tests in spec 002 will assert that the code agrees with the registry.

**Alternatives considered**: Hard-coding the registry inside the validator (rejected: contributors could not read it, and it would drift from code). Enumerations inside the schemas (rejected: mixes the contract shape with the capability list and forces a schema release per new generator).

## R6. Representation range coverage check

**Decision**: Represent both a definition's domain and a representation's support as closed integer boxes over named quantities (`operand`, `sum`, and for the balance later `addend`, `total`). A definition passes when every declared representation's box contains the definition's box. The make-ten model's extra condition `10 − a ≤ b` is implied by `sum ≥ 11` when operands are at most 9, so boxes suffice for the pilot; representations may later declare named constraints if a model needs more than bounds. Two refinements from PR review: a fixed task's point `{ a, b }` and a visual directive's `a`, `b` are mapped to `operand` and `sum` by the quantity model in `data-model.md` before containment is checked, so `4 + 4` with `groups` passes while `9 + 9` with `groups` and `2 + 2` with `make-ten` fail; and generated bounds must be feasible (operand 1–2 with sum 11–18 fits every box but produces no question), checked as `[2·operand.min, 2·operand.max]` intersecting `[sum.min, sum.max]`. The relation behind both is named `sum-of-two-operands` in the generator registry and implemented once in `tools/lib/quantities.mjs`, so the registry stays data and the tooling holds the one rule.

**Rationale**: FR-011 and DL-009 require the check. The range is stated once, on the representation entry in `content/registry/representations.json` (the spec's "Representation support" entity), and the definition lists representations by name; repeating the range inside every definition would create a second source of truth that could disagree with the component. Boxes are easy to author, easy to explain in a diagnostic ("definition allows sum up to 20, make-ten supports at most 18"), and match how the prototype's `supports()` is written.

**Alternatives considered**: Executable predicates in content (rejected by gate III). Sampling the generator (impossible before the generator exists, and probabilistic).

## R7. Fixed tasks and validator linkage

**Decision**: A fixed definition carries `instance.prompt` (the operands the representations need, for example `{ "a": 4, "b": 4 }`) and `instance.validation` (the validator's private data, for example `{ "answer": 8 }`). The check confirms the named validator exists at the named version and that `instance.validation` conforms to the validator's declared artifact shape (type and range). Generated definitions also name their validator; the generator's output is the domain's concern (spec 002).

**Rationale**: Round-04 review of the spec and the field inventory require validator identity and a conformance check for fixed tasks. Shape conformance is what content tooling can honestly verify; whether the answer is mathematically right is a domain test in spec 002.

**Alternatives considered**: Validating the fixed answer arithmetically in the Node tooling (rejected: duplicates mathematics outside the C# domain, against gate III). Deriving `sum` from `a` and `b` for the coverage box (R6) is not this: it computes a range bound for a data check and never decides whether a learner's response is right.

## R8. Lesson metadata fields

**Decision**: `lesson.json` fields: `$schema`, `schemaVersion: "0.1-pilot"`, `id` (equals folder), `version` (integer ≥ 1), `status` (`draft` | `pilot` | `released`), `skills[]`, `prerequisites[]`, `relatedSkills[]`, `relatedLessons[]`, `practice[] { definition, version }`, `visuals[]` (component types the lesson may embed), `translations { nb, en }` (file names). Per-language `title` and `objective` stay in front matter. The prototype's `check` field is not part of the pilot and is reported if present.

**Rationale**: Mirrors the prototype's working shape with the two changes the spec requires (`related` split; `practice` by definition) and the exclusion the spec records. `translations` as an explicit map keeps the pairing rule visible to authors.

**Alternatives considered**: Deriving translations from file names only (rejected: the explicit map makes a missing language a metadata error, not a silent omission).

## R9. Skill ladder placement and shape

**Decision**: Extend `skill.schema.json` with an optional `ladder[]` of entries `{ definition, version, description { nb, en } }`. Validation: entries unique, each definition exists at that version, each definition's `skill` equals the skill, order as authored from least to most demanding.

**Rationale**: The addendum §F and spec FR-015 place the ladder on the skill; the prototype's `practice.js` declares the ladder per skill as well. Keeping it in the skill file avoids a new file type for a one-line list.

**Alternatives considered**: A topic-level file (rejected: topics are not a content entity yet).

## R10. Diagnostics format and exit codes

**Decision**: Every failure is `{ file, line?, field?, message, expected? }`, printed as `path:line field: message (expected …)` with repository-relative forward-slash paths; the run continues past failures and prints a summary; exit codes stay 0, 1, 2. Warnings (for example a practice entry pointing at a related skill) print but do not fail.

**Rationale**: FR-018; the existing CLI already uses relative paths and exit codes, and its tests assert on message text, so the format is extended rather than replaced.

## R11. Migration of pilot content and ID scheme

**Decision**: Definition IDs are `numbers.addition.within-10`, `numbers.addition.crossing-ten`, and the fixed `numbers.addition.four-plus-four`, all at version 1, stored under `content/exercises/numbers/`. Copy (not move) the number-bonds lesson pair and asset from the prototype into `content/lessons/number-bonds-to-ten/`, rewrite its metadata to the pilot shape, add the delimiter rows to its tables, and rewrite skill references to `numbers.number-bonds-to-ten` and `numbers.addition-within-20`. Add those two skills with one edge. Author the two generated definitions and one fixed example. The prototype keeps its copy and its `arithmetic.*` IDs; nothing under `Prototype/` changes in this feature. The `0.1` example and `algebra.linear-equations` stay as they are.

**Rationale**: DL-004 and the spec's User Story 5; the prototype is a design artefact that other sessions maintain, and its content continues to serve the usability script.

## R12. Template location and validator skipping

**Decision**: The copyable lesson template lives at `content/_templates/lesson/`; the validator skips exactly that one directory and documents this. Every other file under `content/`, including underscore-prefixed paths elsewhere, is discovered and checked (FR-016).

**Rationale**: A template with placeholder values would otherwise fail validation on every run; keeping it next to the content it templates is where a contributor looks first.

**Alternatives considered**: Putting the template under `docs/` (rejected: farther from the content and from `content/AUTHORING.md`).
