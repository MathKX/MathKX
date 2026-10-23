# Contract: dictionaries, parity, and learner-visible literals

Part of [plan.md](../plan.md) Phase 1. Implements FR-023 and DL-038.

## Shape

`src/web/src/i18n/nb.ts` and `en.ts` export one object each with identical nested keys. Namespaces:

| Namespace | Holds |
| --- | --- |
| `nav`, `lesson`, `practice`, `record` | Screen labels and controls, including "Show visual help" / "Vis visuell hjelp", "Another question" / "En oppgave til", "More like this" / "Flere slike oppgaver", "Make it easier" / "Gjør det enklere", "More challenge" / "Øk utfordringen" |
| `feedback` | One entry per feedback code: `correct`, `add.oneGroup`, `add.concat`, `add.offByOne`, `add.subtracted`, `add.generic`, `invalid.empty`, `invalid.notAnInteger`; texts are the prototype's, with `{v}`, `{a}`, `{b}`, `{sum}` placeholders |
| `status` | Wording for every validation status, including the reserved `partially-correct` and `review-needed` |
| `outcome`, `tag` | Labels of `contracts/observations.md` |
| `ladder` | "No easier variation is available yet" / "No harder variation is available yet" and the pending-change notice; the per-entry sentences come from the content |
| `storage` | "Kept in this browser only" and "Your work is not being kept in this browser" |
| `a11y` | Accessible names and announcements for the math components (group labels, counter names without a total, help expanded/collapsed) |

`translate(lang, key, params)` substitutes `{name}` placeholders; a missing key throws in development and tests and logs an error in production while returning the key.

## Parity check (`tests/dictionaries.test.ts`)

The flattened key sets of `nb` and `en` are equal; every value is a non-empty string; every `feedback` key matches a registered code from `content/registry/misconception-codes.json` plus `correct` and the two `invalid.*` codes; every `outcome` key matches the outcome list.

## Literal scan (`tests/literals.test.ts`)

Scans `src/web/src/**/*.tsx` for JSX text nodes and the props `aria-label`, `title`, `placeholder`, `alt` whose value is a string literal containing a letter. Each hit must be a `translate(...)` call or be covered by the allowlist: mathematical notation and numbers, proper names (`MathKX`, `Designsystemet`), language self-names (`Norsk bokmål`, `English`), `data-testid` values, and CSS class names. The test prints file and line for every violation.
