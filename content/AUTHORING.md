# Authoring guide: lessons, exercise definitions, skill names, and ladders

This guide documents every field, directive, and attribute the content check enforces. It is the pilot contract (`schemaVersion` `0.1-pilot`), defined by [spec 001](../specs/001-pilot-content-contract/spec.md); it is not Exercise Format v1. When the check reports something this guide does not explain, the guide has a defect: please open an issue.

Run the check with:

```bash
npm run validate
```

It never stops at the first problem. Each line reads `path[:line] field: message (expected)`; fix what it names, run again.

## 1. Add a lesson

1. Copy `content/_templates/lesson/` to `content/lessons/<lesson-id>/`. The folder name is the lesson's `id`.
2. Fill in `lesson.json`, then write `nb.md` and `en.md`. Delete the `_comment` line and every `<placeholder>`.
3. Put images under `assets/` and give each one alternative text in both languages.
4. Run `npm run validate`.

### `lesson.json`

| Field | Required | Type and rule |
| --- | --- | --- |
| `$schema` | yes | `../../../schemas/lesson.schema.json` |
| `schemaVersion` | yes | `"0.1-pilot"` |
| `id` | yes | Lowercase letters, digits, `.` and `-`; equals the folder name; unique across lessons |
| `version` | yes | Integer ≥ 1; raise it when the lesson changes meaningfully |
| `status` | yes | `draft`, `pilot`, or `released`; `released` requires both translations |
| `skills` | yes | One or more skill IDs from `content/skills/`; the skills this lesson teaches |
| `prerequisites` | no | Skill IDs a learner should know first |
| `relatedSkills` | no | Skill IDs this lesson connects to |
| `relatedLessons` | no | Lesson IDs (folder names) |
| `practice` | yes (may be empty) | List of `{ "definition": "<id>", "version": <int> }`; each must exist under `content/exercises/`, and each must have a `:::practice` directive in every language file |
| `visuals` | no | Registered visual component types the body may embed (see section 5); every `:::visual` must use a listed type |
| `translations` | yes | Exactly `{ "nb": "nb.md", "en": "en.md" }` |

The prototype's `check` field is not part of the pilot; the check tells you to remove it. A `practice` entry whose definition serves a skill not listed in `skills` is a warning, not an error: a lesson may send learners to a related skill.

### `nb.md` and `en.md`

Front matter between `---` fences with exactly two keys:

```yaml
---
title: Tiervenner – tall som blir 10
objective: Du lærer hvilke tallpar som sammen blir 10.
---
```

The body is CommonMark with GitHub tables. Rules the check enforces:

- **Headings.** Level 2 and 3 headings carry an anchor: `## Alle tiervennene {#pairs}`. Anchors are unique in a file, and the two languages have the same set of anchors; their order may differ.
- **Tables** need the delimiter row under the header, or generic renderers show them as text:

  ```markdown
  | Par | Regnestykke |
  | --- | --- |
  | 3 og 7 | $3 + 7 = 10$ |
  ```

- **Images** are `![alternative text](assets/file.svg)`; the file must exist and the alternative text must not be empty.
- **Links** to files or `#anchors` must resolve; external links are not checked.
- **Mathematics** goes in `$…$` (inline) or `$$…$$` (display) and must use the pilot grammar (section 6).
- **Prose is free.** Wording, sentence order, and paragraph structure may differ between languages. What must agree is listed in section 4.
- Only `nb.md` and `en.md` may exist; another `*.md` in the folder is reported as unsupported until that language is a release requirement.

## 2. Directives

Interactive elements are container directives: an opening line `:::name{attr="value" …}`, an optional body, and a closing `:::` line. Attribute values are always double-quoted.

| Directive | Attributes | Body | Translated? |
| --- | --- | --- | --- |
| `:::visual{type="…" …}` | `type`: a registered component; then the component's own attributes (section 5) | empty | no attribute is translated; all must be identical in both languages |
| `:::example{title="…" id="…"}` | `title`: non-empty, written in that language; `id`: unique in the file, shared by both languages | Markdown, may contain mathematics and lists | `title` only |
| `:::practice{definition="…" version="…"}` | `definition` and `version` of an exercise definition that is listed in `lesson.json` `practice` | empty | no |

Unknown directive names and unknown or out-of-range attributes are reported with the registered set.

## 3. The pilot lesson

`content/lessons/number-bonds-to-ten/` is the reference: a ten-frame explorer, a worked example with display mathematics, a make-ten visual, a table, an image with alternative text, and two practice entry points.

## 4. What the two languages must share

The check compares `nb.md` and `en.md` by structure and mathematics, never by prose:

| Compared | Rule |
| --- | --- |
| Anchors | Same set (order free) |
| Directives | Same multiset by identity: `visual` by `type`, `example` by `id`, `practice` by `definition` and `version`; matched visuals must have identical attributes |
| Mathematics | Per section (between anchored headings), the same multiset of expressions after normalization: `2,5` equals `2.5`, whitespace is ignored, `*` equals `·`, `-` equals `−`, `x²` equals `x^2`; `3 + 7` and `7 + 3` are different expressions because the author chose the order |
| `example` titles | Present and non-empty in each language; otherwise free |

A divergence names the file, the line, the element, and the value in the other language, for example `en.md:32 directive visual{type="ten-frame-explorer"}: attribute start is "4" here and "3" in nb.md`.

## 5. Registries: what the code provides

`content/registry/` holds reviewed lists of what tested code implements. They carry names, versions, bounds, and shapes, never logic. Change a registry only together with the code it describes.

| File | Entries | Used by |
| --- | --- | --- |
| `generators.json` | `name`, `version`, optional `relation` (a named quantity relation the tooling implements; the pilot has `sum-of-two-operands`), optional `constraints` (names), `parameters` (parameter → `{ quantity, min, max }` domain), `produces` | generated definitions |
| `validators.json` | `name`, `version`, `artifact` (the response shape; pilot: `{ "type": "integer", "min", "max" }`), `emits` (misconception codes) | every definition |
| `representations.json` | `name`, `role` (`help`, `explanation`), `reads` (quantities it needs), `supports` (quantity → `{ min, max }` it can show) | definitions, visual components |
| `visual-components.json` | `type`, `attributes` (name → `{ type: integer or string, min, max, required }`), optional `representation` link | `:::visual` directives and `lesson.json` `visuals` |
| `misconception-codes.json` | `code`, `validator` | definitions |

Pilot components: `ten-frame-explorer` (`start` 0–10), `groups` (`a`, `b` 1–9, sum 2–10), `make-ten` (`a`, `b` 1–9, sum 11–18). For `groups` and `make-ten`, `a` and `b` are checked together against the linked representation's bounds, so `groups` with `a="9" b="9"` is rejected.

## 6. Notation grammar

Inside `$…$` and `$$…$$` the pilot accepts:

| Category | Accepted |
| --- | --- |
| Numbers | Digits with an optional decimal part using `.` or `,` |
| Identifiers | Single Latin letters and `Δ`; function application such as `f(x)` |
| Operators | `+ − - = × · * < > ≤ ≥ ≠ ? □ ( ) [ ] , →` |
| Powers and indices | `x^2`, `x^{n-1}`, `x²`, `x³`, `a_1` |
| Fractions | `\frac{a}{b}` and `a/b` |
| Primes and commands | `f'(x)`, `\Delta`, `\cdot`, `\le`, `\ge`, `\neq`, `\to`, `\lim` |

Anything else, for example `\sqrt`, matrices, or alignment, is reported as unsupported with the offending text and the section. It is never rendered or dropped silently. The grammar grows with the contract; the renderer and the check share it.

## 7. Add an exercise definition

Definitions live under `content/exercises/` and describe either a generated family or one fixed task. They name code by registry name and version; they never contain formulas.

```json
{
  "$schema": "../../../schemas/exercise-definition.pilot.schema.json",
  "schemaVersion": "0.1-pilot",
  "id": "numbers.addition.within-10",
  "version": 1,
  "skill": "numbers.addition-within-20",
  "source": "generated",
  "validator": { "name": "integer-answer", "version": 1 },
  "generator": { "name": "addition-pair", "version": 1, "parameters": { "operand": { "min": 1, "max": 9 }, "sum": { "min": 2, "max": 10 } } },
  "representations": { "help": ["groups"], "explanation": ["groups"] },
  "misconceptionCodes": ["add.oneGroup", "add.concat", "add.offByOne", "add.subtracted", "add.generic"]
}
```

| Field | Rule |
| --- | --- |
| `id`, `version` | The pair is unique across all definitions, including the exploratory `0.1` example; both are part of every generated instance's identity together with a seed |
| `skill` | A skill from `content/skills/` |
| `source` | `generated` (needs `generator`, no `instance`) or `fixed` (needs `instance`, no `generator`) |
| `validator` | Registered name and version |
| `generator.parameters` | Every key is a parameter the generator declares; each `{ min, max }` lies within the generator's domain with `min ≤ max`; the bounds must admit at least one task (for `addition-pair`, some pair of operands in the operand range has a sum in the sum range) |
| `generator.constraints` | Optional names from the generator's declared list (the pilot generator declares none) |
| `instance.prompt` | For fixed tasks: the values the representations read, as integers (`{ "a": 4, "b": 4 }`) |
| `instance.validation` | For fixed tasks: the validator's private data in its artifact shape (`{ "answer": 8 }` for `integer-answer`) |
| `representations.help`, `.explanation` | Registered representations offering that role whose supported ranges cover the definition's whole range (a generated family's bounds, or a fixed task's values); the check names the quantity and both ranges when they do not |
| `misconceptionCodes` | Registered codes that the named validator emits |

The retired `arithmetic.*` skill IDs from the prototype are reported with a hint: the registry uses `numbers.*`.

## 8. Name a skill

Every file in `content/skills/` carries the skill's learner-facing name in both release languages, next to its ID ([spec 004](../specs/004-progress-view/contracts/skill-name.md)):

```json
"id": "numbers.addition-within-20",
"name": { "nb": "Addisjon opp til 20", "en": "Addition within 20" },
```

Both languages are required and must contain text; the check reports a missing or blank one as `name.nb` or `name.en`. Learners see the name, for example as a heading in "My work", so review it like lesson text. It is never an identity: records refer to the skill's `id`, and a name can change without changing anything they mean.

## 9. Add a ladder

A skill may list its definitions from easiest to hardest in `content/skills/<id>.json`; "Make it easier" and "More challenge" move along it:

```json
"ladder": [
  { "definition": "numbers.addition.within-10", "version": 1, "description": { "nb": "Summen er høyst 10.", "en": "The sum is at most 10." } },
  { "definition": "numbers.addition.crossing-ten", "version": 1, "description": { "nb": "To ensifrede tall der summen går over 10.", "en": "Two single-digit numbers whose sum goes past 10." } }
]
```

Entries are unique, each definition exists at that version and belongs to this skill, and both sentences are present.

## 10. Reading a diagnostic

```text
content/lessons/number-bonds-to-ten/en.md:24 anchor: {#pairs} is missing in nb.md (anchors must match across languages)
content/exercises/numbers/addition-within-20.json representations.help[0]: make-ten supports sum 11–18 but the definition allows sum 11–20
content/skills/numbers.addition-within-20.json ladder[1]: definition algebra.one-step@1 belongs to skill algebra.one-step-equations, not numbers.addition-within-20
warning: content/lessons/x/lesson.json practice[0]: definition numbers.addition.within-10@1 serves skill numbers.addition-within-20, which is not among this lesson's skills
```

Path, then line when there is one, then the field or element, then what is wrong, then in parentheses what was expected. Warnings do not fail the check. The last line summarizes: `Content validation passed: 19 file(s), 9 skill(s), 1 lesson(s), 4 definition(s), 5 registries.`
