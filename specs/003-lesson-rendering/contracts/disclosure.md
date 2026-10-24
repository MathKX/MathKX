# Contract: does a lesson show a question's answer?

Part of [plan.md](../plan.md) Phase 1. Implements DL-026 (2) for addition as the prototype's `lessonDisclosure` (`Prototype/mathkx-designsystemet/src/domain/disclosure.js`) settled it, which DL-026 confirmed as a production rule. Owner: `MathKX.Domain.Lessons.LessonDisclosure`. Spec FR-011.

## Lesson facts

`MathKX.Content.LessonFactsReader` reads one translation into `LessonFacts`:

- **Expressions**: the source text of every inline (`$…$`) and display (`$$…$$`) mathematics node, in document order, wherever it occurs (paragraphs, list items, table cells, inside `:::example`), and never inside code spans, fenced code, or indented code. Each is normalized for comparison by removing all whitespace and reading `−` and `–` as `-`.
- **Visuals**: every `:::visual{…}` container directive outside code, with its `type` and its other attributes read as integers. Attribute order does not matter.

The reader must agree with the validator's parser (`tools/lib/markdown.mjs`) on [lesson-facts.fixture.json](lesson-facts.fixture.json): the same expression sources in the same order and the same visuals with the same attributes, for every case. The C# test (`LessonFactsReaderTests`) and a root tooling test (`tools/validate-content.test.mjs`) both read the fixture. Two parser behaviours the fixture records: a `$$…$$` written on one line is inline mathematics to remark, which matters only for rendering ([lesson-renderer.md](lesson-renderer.md)); and a dollar sign in prose is outside the pilot contract, because remark-math does not honour `\$` as an escape.

## The rule for an addition instance `a + b`

A translation **discloses** the instance when either holds:

1. **Expression**: some normalized expression, split at `=`, has at least two parts, its first part is `a+b` or `b+a`, and its last part is the decimal sum `a + b`. Examples: `3+7=10` discloses `3 + 7` and `7 + 3`; `8+5=8+2+3=10+3=13` discloses `8 + 5` and `5 + 8`; `9+4` (no result) and `9+1` (no `=`) do not.
2. **Visual**: some visual of type `make-ten` or `groups` has `a` and `b` equal to the instance's operands in either order, because stepping through it reaches the total.

`ten-frame-explorer` never discloses: the learner chooses its values, so it is not a worked visual for the question's values. Mentioning the question without its result never discloses.

A **lesson** discloses an instance when any of its translations does; `where` is `expression` when rule 1 holds in any translation, else `visual`. A domain test asserts that both translations of every lesson in `content/` give the same decision for every pilot instance; spec 001's per-section expression and directive pairing makes this true for valid content, and the test catches a regression in either check.

The decision is computed in the domain from the instance's operands and their sum; only the Boolean leaves the service (`InstanceDto.lessons[].discloses`).

## Fixture: the pilot lesson

`LessonDisclosureTests` resolves every instance a lesson can be opened from, all 45 `within-10` pairs (operands 1–9, sums 2–10) and all 36 `crossing-ten` pairs (operands 2–9, sums 11–18), against `content/lessons/number-bonds-to-ten/`. Exactly these 11 disclose, all by expression (computed on 2026-10-24 with the validator's parser and this rule; Norwegian and English agree on all 81):

| Definition | Instances that disclose | Where in the lesson |
| --- | --- | --- |
| `within-10` | `1 + 9`, `9 + 1`, `2 + 8`, `8 + 2`, `3 + 7`, `7 + 3`, `4 + 6`, `6 + 4`, `5 + 5` | the table of pairs (and `3 + 7 = 10` in the first section) |
| `crossing-ten` | `8 + 5`, `5 + 8` | the worked example's display line; the `make-ten` visual for 8 and 5 also discloses them |

Every other instance does not disclose, including `9 + 4`, `7 + 6`, and `6 + 5`, which the "Try it in your head" section names without their results. The fixed task `4 + 4` is not listed by any lesson and has no decision.

The expected table is a data file, `src/backend/MathKX.Domain.Tests/Fixtures/disclosure.number-bonds-to-ten.json`, and the test fails naming the instance, the expected and actual decision, and the translation. A prose edit never changes the table. An edit that adds or removes a worked result for a pilot question does, because it changes what learners are warned about; the failing test makes that visible in review, and updating the data file is part of that content change.
