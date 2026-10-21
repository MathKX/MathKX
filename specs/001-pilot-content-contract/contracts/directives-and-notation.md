# Contract: lesson directives and notation grammar (pilot)

Part of [plan.md](../plan.md) Phase 1. This is the author-facing contract the validator enforces and the lesson renderer (spec 003) will implement. It is versioned with the pilot (`0.1-pilot`) and is not a stable standard.

## Markdown

Lesson bodies are CommonMark with GitHub-flavoured extensions as parsed by `remark-parse` plus `remark-gfm`. Tables require a delimiter row:

```markdown
| Pair     | Sum           |
| -------- | ------------- |
| 3 and 7  | $3 + 7 = 10$  |
```

A block whose lines all begin with `|` but has no delimiter row is reported: `table without a delimiter row (expected a line like "| --- | --- |" after the header)`.

Headings at level 2 and 3 carry an explicit anchor: `## What are number bonds? {#what}`. Anchors are unique within a file and the set of anchors is identical across the lesson's languages; order may differ.

Images are `![alternative text](assets/file.svg)`; the file must exist and the alternative text must be non-empty in each language.

## Front matter

YAML between `---` fences at the top of each language file:

```yaml
---
title: Tiervenner – tall som blir 10
objective: Du lærer hvilke tallpar som sammen blir 10 …
---
```

Both keys are required and non-empty; no other keys in the pilot.

## Directives

Container directives in the `remark-directive` form: a line `:::name{attr="value" attr2="value2"}`, body lines, and a closing `:::` line. Attribute values are always double-quoted strings; the validator converts and range-checks them.

| Directive | Attributes | Localized | Body | Pairing identity |
| --- | --- | --- | --- | --- |
| `:::visual{type="…" …}` | `type`: registered visual component. Then the component's attributes from `content/registry/visual-components.json`. Pilot components: `ten-frame-explorer` (`start` integer 0–10), `groups` (`a`, `b` integers 1–9 with `a + b ≤ 10`), `make-ten` (`a`, `b` integers 1–9 with `11 ≤ a + b ≤ 18`) | none | empty | name + `type` + every attribute |
| `:::example{title="…" id="…"}` | `title` non-empty; `id` anchor-like, unique in the file | `title` | Markdown, may contain mathematics and lists | name + `id` |
| `:::practice{definition="…" version="…"}` | `definition`: an exercise definition ID; `version`: integer ≥ 1 | none | empty | name + `definition` + `version` |

Rules: unknown directive names and unknown or out-of-range attributes are reported; for `groups` and `make-ten`, `a` and `b` are also checked together against the linked representation's `operand` and `sum` bounds (`groups` 9 + 9 and `make-ten` 2 + 2 are rejected, matching the prototype's `supports()`); every `:::practice` directive corresponds to an entry in `lesson.json` `practice` and every entry has at least one directive; every `:::visual` `type` is listed in `lesson.json` `visuals`. The multiset of directive identities is identical across languages; order within the file may differ. Non-localized attributes of matched directives are identical; localized attributes are present and non-empty in each language and otherwise free.

## Notation grammar

Inline `$…$` and display `$$…$$`. The pilot grammar is the prototype's documented subset:

| Category | Accepted |
| --- | --- |
| Numbers | Digits with an optional decimal part using `.` or `,` (`3`, `2,5`, `0.5`) |
| Identifiers | Single Latin letters and `Δ`; function application `f(x)` |
| Operators | `+ − - = × · * < > ≤ ≥ ≠ ? □ ( ) [ ] , →` |
| Powers and indices | `x^2`, `x^{n-1}`, `x²`, `x³`, `a_1` |
| Fractions | `\frac{a}{b}`, and `a/b` between atoms |
| Primes and commands | `f'(x)`, `\Delta`, `\cdot`, `\le`, `\ge`, `\neq`, `\to`, `\lim` |

Anything else (for example `\sqrt`, matrices, alignment) is reported as `unsupported notation "\sqrt" in section {#why}` and never rendered or dropped silently.

### Normalization for cross-language comparison

Expressions are compared per section as a multiset of normalized strings. Normalization: parse with the grammar; emit numbers with `.` as the decimal mark and no grouping; map `*` to `·` and `-` to `−`; map `²` and `³` to `^2` and `^3`; drop whitespace; serialize the parse tree in a fixed order of operands. `2,5 + 1` in Norwegian and `2.5 + 1` in English normalize to the same string; `3 + 7` and `7 + 3` do not, because operand order is mathematics the author chose.

## Diagnostics for this contract

Each failure names the file, the line, the element (directive, attribute, anchor, expression), the offending value, and the expected value or the registered set. See [diagnostics.md](diagnostics.md).
