# Contract: validator command and diagnostics

Part of [plan.md](../plan.md) Phase 1.

## Command

```bash
npm run validate            # node tools/validate-content.mjs
node tools/validate-content.mjs --root <repo root>   # used by tests against fixtures
```

Exit codes: `0` all checks pass (warnings allowed); `1` one or more content errors; `2` tooling error (unreadable schema, internal fault). The run never stops at the first error.

## Discovery

Every `*.json` under `content/`, except the single directory `content/_templates/`, must name a known schema in `$schema` (a relative path into `schemas/`). Known schemas: `skill.schema.json`, `exercise.schema.json` (exploratory 0.1), `lesson.schema.json`, `exercise-definition.pilot.schema.json`, `registry.schema.json`. A file naming any other schema is an error (`unknown schema`), not a skip. Lesson folders are discovered through their `lesson.json`; their Markdown files and assets are checked as part of the lesson.

## Checks (in order)

1. Registries load and are internally consistent (unique names per kind; misconception codes name existing validators; visual components' linked representations exist).
2. Every JSON file is a JSON object, names a known schema, and validates against it.
3. Skills: unique IDs; prerequisites resolve; no self-reference; no cycles; ladder entries unique, resolve to definitions of the same skill at the stated version, and carry both sentences.
4. Definitions: unique (`id`, `version`) across pilot definitions and the 0.1 example; `skill` resolves; `validator` registered; for `generated`: generator registered, every parameter declared, bounds within the generator's domain and `min ≤ max`, and the bounds feasible under the generator's relation; for `fixed`: `instance.validation` conforms to the validator's artifact shape and `instance.prompt` carries the quantities the representations read; each representation registered and its support box contains the definition's domain box (a fixed task's box is derived from `a`, `b` by the quantity model); unknown skill IDs starting with `arithmetic.` carry the hint `the registry uses numbers.*`; each misconception code registered and emitted by the validator.
5. Lessons: folder equals `id`; unique IDs; `nb.md` and `en.md` exist and no other `*.md` does; front matter valid; anchors unique and equal across languages; tables have delimiter rows; images and relative links resolve with non-empty alt text; directives known, attributes valid and in range, `a` and `b` of a visual together inside its linked representation's bounds, `visual` types listed in `visuals`, `practice` directives and metadata entries correspond; notation parses; directive identities and per-section normalized mathematics equal across languages; references (`skills`, `prerequisites`, `relatedSkills`, `relatedLessons`, `practice`) resolve; `check` field absent.
6. Warnings: a `practice` entry whose definition serves a skill not among the lesson's `skills`.

## Message format

One diagnostic per line, grouped by file:

```text
content/lessons/number-bonds-to-ten/en.md:24 anchor: {#pairs} is missing in nb.md (anchors must match across languages)
content/exercises/numbers/addition-within-20.json representations.help[1]: make-ten supports sum ≤ 18 but the definition allows sum ≤ 20
content/lessons/number-bonds-to-ten/lesson.json practice[0]: definition numbers.addition.within-10@1 is not defined (expected a file under content/exercises/)
content/skills/numbers.addition-within-20.json ladder[1]: definition algebra.one-step@1 belongs to skill algebra.one-step-equations, not numbers.addition-within-20
```

Shape: `<repo-relative path>[:<line>][ <field or element>:] <message>[ (<expected>)]`; the field segment is omitted for file-level failures (`invalid JSON`, `content must be a JSON object`, `missing "$schema"`, `unknown schema`). Paths use forward slashes on every platform. Warnings are prefixed `warning:`. The final line summarizes: `Content validation passed|failed: N file(s), S skill(s), L lesson(s), D definition(s), R registr(y|ies)[, E error(s), W warning(s)]`.

## Stability

Message texts are part of the test contract: the regression tests match on them. Changing a message means changing its test in the same change.
