# Quickstart: proving the pilot content contract

Phase 1 output for [plan.md](plan.md). How to run the feature once implemented and what to expect. Implementation steps belong in `tasks.md`.

## Prerequisites

Node.js 22 (20 or later works) and npm. No other tools; no network during validation.

```bash
npm ci
```

## Run the checks

```bash
npm run validate
```

Expected on a clean tree after this feature lands:

```text
Content validation passed: 19 file(s), 9 skill(s), 1 lesson(s), 4 definition(s), 5 registries.
```

(Nine skills: the existing seven plus `numbers.number-bonds-to-ten` and `numbers.addition-within-20`. Four definitions: the `0.1` example plus `within-10`, `crossing-ten`, and the fixed `4 + 4`.)

```bash
npm test
```

Expected: every existing validator test still passes, plus one test per failure case in the spec (see [contracts/diagnostics.md](contracts/diagnostics.md) for the message each asserts).

## Scenario 1: add a lesson from the template (User Story 1)

1. Copy `content/_templates/lesson/` to `content/lessons/my-lesson/`.
2. Edit `lesson.json`: set `id` to `my-lesson`, list one skill from `content/skills/`, one practice entry such as `{ "definition": "numbers.addition.within-10", "version": 1 }`.
3. Write `nb.md` and `en.md` with the same `{#anchors}`, a table with a delimiter row, and `:::practice{definition="numbers.addition.within-10" version="1"}`.
4. `npm run validate` → passes and counts 2 lessons.
5. Break it on purpose: rename the folder to `my-lessons`, run again → `lesson.json id: my-lesson does not equal the folder name my-lessons`. Delete `{#pairs}` from `en.md` → `en.md:… anchor: {#pairs} is missing … (anchors must match across languages)`. Remove the delimiter row → `table without a delimiter row`.

## Scenario 2: a definition the help cannot show (User Story 2)

1. Copy `content/exercises/numbers/addition-crossing-ten.json` to `addition-within-20.json`, change `id`, set `sum.max` to 20 and `operand.max` to 19.
2. `npm run validate` → fails with two lines: `representations.help[0]: make-ten supports operand 1–9 but the definition allows operand 2–19` and `representations.help[0]: make-ten supports sum 11–18 but the definition allows sum 11–20`.
3. Change `validator.name` to `nonexistent` → `validator: nonexistent@1 is not registered (one of: integer-answer@1)`.
4. In the fixed example, set `instance.validation.answer` to `"eight"` → `instance.validation.answer: expected integer for validator integer-answer@1`.
5. Set `operand` to 1–2 while keeping `sum` at 11–18 → `generator.parameters: no operand pair within 1–2 has a sum within 11–18`.
6. In the fixed example, set `instance.prompt` to `{ "a": 9, "b": 9 }` → `representations.help[0]: groups supports sum 2–10 but the task has sum 18`.

## Scenario 3: a ladder (User Story 3)

Edit `content/skills/numbers.addition-within-20.json`, add a ladder entry naming `algebra.linear-equations.basic@1` → `ladder[2]: definition algebra.linear-equations.basic@1 belongs to skill algebra.linear-equations, not numbers.addition-within-20`. Remove the `en` sentence from an entry → `schema violation: /ladder/0/description must have required property 'en'`.

## Scenario 4: translate without breaking the pair (User Story 4)

1. Rewrite a paragraph in `en.md`, move two sentences within a section, change the `:::example` title → passes.
2. Change `start="3"` to `start="4"` in `en.md` only → `en.md:<line> directive visual{type="ten-frame-explorer"}: attribute start is "4" here and "3" in nb.md`.
3. Change `$3 + 7 = 10# Quickstart: proving the pilot content contract

Phase 1 output for [plan.md](plan.md). How to run the feature once implemented and what to expect. Implementation steps belong in `tasks.md`.

## Prerequisites

Node.js 22 (20 or later works) and npm. No other tools; no network during validation.

```bash
npm ci
```

## Run the checks

```bash
npm run validate
```

Expected on a clean tree after this feature lands:

```text
Content validation passed: 19 file(s), 9 skill(s), 1 lesson(s), 4 definition(s), 5 registries.
```

(Nine skills: the existing seven plus `numbers.number-bonds-to-ten` and `numbers.addition-within-20`. Four definitions: the `0.1` example plus `within-10`, `crossing-ten`, and the fixed `4 + 4`.)

```bash
npm test
```

Expected: every existing validator test still passes, plus one test per failure case in the spec (see [contracts/diagnostics.md](contracts/diagnostics.md) for the message each asserts).

## Scenario 1: add a lesson from the template (User Story 1)

1. Copy `content/_templates/lesson/` to `content/lessons/my-lesson/`.
2. Edit `lesson.json`: set `id` to `my-lesson`, list one skill from `content/skills/`, one practice entry such as `{ "definition": "numbers.addition.within-10", "version": 1 }`.
3. Write `nb.md` and `en.md` with the same `{#anchors}`, a table with a delimiter row, and `:::practice{definition="numbers.addition.within-10" version="1"}`.
4. `npm run validate` → passes and counts 2 lessons.
5. Break it on purpose: rename the folder to `my-lessons`, run again → `lesson.json id: my-lesson does not equal the folder name my-lessons`. Delete `{#pairs}` from `en.md` → `en.md:… anchor: {#pairs} is missing … (anchors must match across languages)`. Remove the delimiter row → `table without a delimiter row`.

## Scenario 2: a definition the help cannot show (User Story 2)

1. Copy `content/exercises/numbers/addition-crossing-ten.json` to `addition-within-20.json`, change `id`, set `sum.max` to 20 and `operand.max` to 19.
2. `npm run validate` → fails with two lines: `representations.help[0]: make-ten supports operand 1–9 but the definition allows operand 2–19` and `representations.help[0]: make-ten supports sum 11–18 but the definition allows sum 11–20`.
3. Change `validator.name` to `nonexistent` → `validator: nonexistent@1 is not registered (one of: integer-answer@1)`.
4. In the fixed example, set `instance.validation.answer` to `"eight"` → `instance.validation.answer: expected integer for validator integer-answer@1`.
5. Set `operand` to 1–2 while keeping `sum` at 11–18 → `generator.parameters: no operand pair within 1–2 has a sum within 11–18`.
6. In the fixed example, set `instance.prompt` to `{ "a": 9, "b": 9 }` → `representations.help[0]: groups supports sum 2–10 but the task has sum 18`.

## Scenario 3: a ladder (User Story 3)

Edit `content/skills/numbers.addition-within-20.json`, add a ladder entry naming `algebra.linear-equations.basic@1` → `ladder[2]: definition algebra.linear-equations.basic@1 belongs to skill algebra.linear-equations, not numbers.addition-within-20`. Remove the `en` sentence from an entry → `schema violation: /ladder/0/description must have required property 'en'`.

## Scenario 4: translate without breaking the pair (User Story 4)

1. Rewrite a paragraph in `en.md`, move two sentences within a section, change the `:::example` title → passes.
2. Change `start="3"` to `start="4"` in `en.md` only → `en.md:<line> directive visual{type="ten-frame-explorer"}: attribute start is "4" here and "3" in nb.md`.
 to `$3 + 6 = 9# Quickstart: proving the pilot content contract

Phase 1 output for [plan.md](plan.md). How to run the feature once implemented and what to expect. Implementation steps belong in `tasks.md`.

## Prerequisites

Node.js 22 (20 or later works) and npm. No other tools; no network during validation.

```bash
npm ci
```

## Run the checks

```bash
npm run validate
```

Expected on a clean tree after this feature lands:

```text
Content validation passed: 19 file(s), 9 skill(s), 1 lesson(s), 4 definition(s), 5 registries.
```

(Nine skills: the existing seven plus `numbers.number-bonds-to-ten` and `numbers.addition-within-20`. Four definitions: the `0.1` example plus `within-10`, `crossing-ten`, and the fixed `4 + 4`.)

```bash
npm test
```

Expected: every existing validator test still passes, plus one test per failure case in the spec (see [contracts/diagnostics.md](contracts/diagnostics.md) for the message each asserts).

## Scenario 1: add a lesson from the template (User Story 1)

1. Copy `content/_templates/lesson/` to `content/lessons/my-lesson/`.
2. Edit `lesson.json`: set `id` to `my-lesson`, list one skill from `content/skills/`, one practice entry such as `{ "definition": "numbers.addition.within-10", "version": 1 }`.
3. Write `nb.md` and `en.md` with the same `{#anchors}`, a table with a delimiter row, and `:::practice{definition="numbers.addition.within-10" version="1"}`.
4. `npm run validate` → passes and counts 2 lessons.
5. Break it on purpose: rename the folder to `my-lessons`, run again → `lesson.json id: my-lesson does not equal the folder name my-lessons`. Delete `{#pairs}` from `en.md` → `en.md:… anchor: {#pairs} is missing … (anchors must match across languages)`. Remove the delimiter row → `table without a delimiter row`.

## Scenario 2: a definition the help cannot show (User Story 2)

1. Copy `content/exercises/numbers/addition-crossing-ten.json` to `addition-within-20.json`, change `id`, set `sum.max` to 20 and `operand.max` to 19.
2. `npm run validate` → fails with two lines: `representations.help[0]: make-ten supports operand 1–9 but the definition allows operand 2–19` and `representations.help[0]: make-ten supports sum 11–18 but the definition allows sum 11–20`.
3. Change `validator.name` to `nonexistent` → `validator: nonexistent@1 is not registered (one of: integer-answer@1)`.
4. In the fixed example, set `instance.validation.answer` to `"eight"` → `instance.validation.answer: expected integer for validator integer-answer@1`.
5. Set `operand` to 1–2 while keeping `sum` at 11–18 → `generator.parameters: no operand pair within 1–2 has a sum within 11–18`.
6. In the fixed example, set `instance.prompt` to `{ "a": 9, "b": 9 }` → `representations.help[0]: groups supports sum 2–10 but the task has sum 18`.

## Scenario 3: a ladder (User Story 3)

Edit `content/skills/numbers.addition-within-20.json`, add a ladder entry naming `algebra.linear-equations.basic@1` → `ladder[2]: definition algebra.linear-equations.basic@1 belongs to skill algebra.linear-equations, not numbers.addition-within-20`. Remove the `en` sentence from an entry → `schema violation: /ladder/0/description must have required property 'en'`.

## Scenario 4: translate without breaking the pair (User Story 4)

1. Rewrite a paragraph in `en.md`, move two sentences within a section, change the `:::example` title → passes.
2. Change `start="3"` to `start="4"` in `en.md` only → `en.md:<line> directive visual{type="ten-frame-explorer"}: attribute start is "4" here and "3" in nb.md`.
 in `en.md` → `en.md:<line> section {#what}: expression 3+6=9 has no counterpart in nb.md (nb.md has 3+7=10)`, and the mirror line on `nb.md`.
4. Write `$2,5$` in `nb.md` and `$2.5$` in `en.md` → passes.

## Scenario 5: the migrated pilot content (User Story 5)

`git grep -l "arithmetic\." content/` returns nothing; `content/lessons/number-bonds-to-ten/` holds `lesson.json`, `nb.md`, `en.md`, `assets/ten-frame-3-7.svg`; `content/exercises/examples/linear-equation-basic.json` is byte-identical to its previous revision (`git diff <before> -- content/exercises/examples/` is empty); the prototype folder is unchanged (`git diff <before> -- Prototype/` is empty).

## CI

`.github/workflows/validate-content.yml` already runs `npm ci`, `npm run validate`, and `npm test` on pull requests and pushes to `main`. No change is required. Measured on 2026-10-23 on the implementing machine: `npm run validate` on the pilot content completes in 0.9 s wall time, well under the 30 s limit (spec SC-003); `npm test` (66 tests, each spawning the CLI) in about 25 s.

## Contributor session (spec SC-001)

Give one person who has not seen the repository `content/AUTHORING.md`, the template, and `npm run validate`. Record whether they reach a passing second lesson without asking what a field means. A question about a field is a defect in the guide, not in the person.
