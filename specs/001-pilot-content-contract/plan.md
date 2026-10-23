# Implementation Plan: Pilot Content Contract and Validator

**Branch**: `claude/project-analysis-recommendations-5d72c1` (the Spec Kit setup script reports `001-pilot-content-contract` from the feature directory; the git branch is the one named here) | **Date**: 2026-10-19 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-pilot-content-contract/spec.md`

## Summary

Give contributors a content contract they can author against without guessing: a lesson folder with shared metadata and one Markdown file per language, a pilot exercise-definition format that names a registered generator or holds a fixed task, a per-skill challenge ladder, and reviewed registries of what the code provides (generators, validators, representations, visual components, misconception codes). Extend the existing Node validator so one command resolves every reference, compares language pairs by identity and normalized mathematics rather than byte equality, confirms representation ranges cover definition ranges, and reports every failure with a repository-relative path, the field or line, and the expected value. Move the first milestone's lesson, skills, definitions, and ladder under `content/` and keep the exploratory `0.1` fixture valid.

## Technical Context

**Language/Version**: JavaScript (ES modules) on Node.js 22 (CI: `actions/setup-node@v4` with Node 22; `package.json` engines `>=20`)

**Primary Dependencies**: `ajv` 8.20.0 and `ajv-formats` 3.0.1 (existing); add the unified/remark stack for Markdown parsing: `unified`, `remark-parse`, `remark-gfm`, `remark-frontmatter`, `remark-directive`, `remark-math`, plus `yaml` for front matter (see [research.md](research.md) R1). A small notation tokenizer is written in `tools/lib/` with no dependency (R3).

**Storage**: Files in Git under `content/`, `schemas/`, and `tools/`; no database

**Testing**: `node --test` (existing `tools/validate-content.test.mjs`, which runs the CLI against isolated fixtures); fixtures under `tools/fixtures/`

**Target Platform**: Developer machines on Windows, macOS, and Linux; GitHub Actions `ubuntu-latest`

**Project Type**: Command-line tooling plus reviewed content data

**Performance Goals**: Full check of the pilot content under 30 seconds locally and in CI (spec SC-003); expected well under 5 seconds

**Constraints**: No network access during validation; deterministic output; diagnostics as repository-relative paths; continue past the first failure; exit codes 0 (pass), 1 (content failures), 2 (tooling error) preserved from the existing validator; the `0.1` exercise example and schema unchanged

**Scale/Scope**: Pilot content is one lesson pair, two skills, three definitions (two generated, one fixed), one ladder, and five registry files; the design must stay usable at tens of lessons and hundreds of definitions

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate (constitution section) | Evaluation before research | After design |
| --- | --- | --- |
| II Mathematics independent of curricula: stable language-neutral IDs; no per-curriculum duplication | Skills use the `numbers.*` registry IDs decided in DL-004; lessons and definitions carry no grade or language in their identity | Pass; data model keys every entity by language-neutral ID |
| III Content configures, tested code computes: JSON and Markdown never gain expressions, loops, or code | Definitions carry parameter bounds and names, never formulas; directives name registered components with validated attributes; registries list what code provides, they do not implement it | Pass; the ladder is an ordered list, not a rule; representation support is expressed as bounds |
| IV Reproducibility and honest results: identity (definition ID, version, seed); fixed tasks without seed; typed validation; no promised review | Definitions declare `id`, `version`, and a validator name and version; fixed tasks have no seed; the validator registry declares artifact shapes | Pass; see data-model.md "Exercise definition" |
| VI Accessible, bilingual, private by design: both languages ship together; accessible alternatives | Lesson translations required for `nb` and `en`; images need alternative text per language | Pass; FR-001, FR-008 enforced by the validator |
| Additional constraints: repository layout; `content/`, `schemas/`, `tools/` as homes for content, schemas, tooling | All new files land in those three directories; no `src/` is created | Pass |
| Additional constraints: still-undecided matters are not decided inside a specification | The pilot contract is versioned `0.1-pilot`; Exercise Format v1, the mastery model, and symbolic equivalence are untouched | Pass |
| Development workflow: every behaviour ships with tests; schema and documentation change together | Each failure case in the spec gets a fixture-based regression test; `content/AGENTS.md`, `content/README.md`, the authoring guide, and the lesson proposal are updated with the schemas | Pass |
| Specification rules: cites sources and decision-log rows; does not change an ADR | Spec section "Sources this specification depends on" | Pass; no ADR touched |

No violation; the Complexity Tracking table is not needed.

## Project Structure

### Documentation (this feature)

```text
specs/001-pilot-content-contract/
├── plan.md              # This file
├── research.md          # Phase 0: decisions R1–R12
├── data-model.md        # Phase 1: entities, fields, validation rules
├── quickstart.md        # Phase 1: how to run and prove the feature
├── contracts/           # Phase 1: draft schemas and textual contracts
│   ├── lesson.schema.json
│   ├── exercise-definition.pilot.schema.json
│   ├── skill.schema.json                 # extended with the optional ladder
│   ├── registry.schema.json              # generators, validators, representations, components, codes
│   ├── directives-and-notation.md
│   └── diagnostics.md
├── contract-trace.md    # capability-model dimensions mapped to pilot fields and extension points
├── stress-fixtures/     # scenario fixtures, check.mjs, contracts-next projection, recorded outcomes
├── checklists/requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks): 48 tasks in eight phases
```

### Source Code (repository root)

```text
content/
├── AGENTS.md                      # updated: new rules, pointer to the guide
├── README.md                      # updated: layout, validation list, skill wording
├── AUTHORING.md                   # new: contributor guide for lessons, definitions, ladders
├── LICENSE
├── _templates/                    # the one directory the validator skips
│   └── lesson/                    # lesson.json, nb.md, en.md, assets/.gitkeep with placeholders
├── registry/                      # new: reviewed lists of what code provides
│   ├── generators.json
│   ├── validators.json
│   ├── representations.json
│   ├── visual-components.json
│   └── misconception-codes.json
├── skills/
│   ├── numbers.number-bonds-to-ten.json          # new
│   ├── numbers.addition-within-20.json           # new, with ladder
│   └── ... (existing seven skills unchanged)
├── lessons/
│   └── number-bonds-to-ten/
│       ├── lesson.json
│       ├── nb.md
│       ├── en.md
│       └── assets/ten-frame-3-7.svg
└── exercises/
    ├── examples/linear-equation-basic.json       # existing 0.1 fixture, unchanged
    └── numbers/
        ├── addition-within-10.json               # generated
        ├── addition-crossing-ten.json            # generated
        └── addition-4-plus-4.json                # fixed worked example

schemas/
├── skill.schema.json                 # extended (optional ladder)
├── exercise.schema.json              # existing 0.1, unchanged
├── lesson.schema.json                # new
├── exercise-definition.pilot.schema.json   # new
└── registry.schema.json              # new

tools/
├── validate-content.mjs              # CLI entry: orchestration and reporting only
├── lib/
│   ├── files.mjs                     # discovery, $schema resolution, known-schema dispatch
│   ├── diagnostics.mjs               # failure collection and formatting
│   ├── skills.mjs                    # registry of skills, prerequisite cycles, ladders
│   ├── definitions.mjs               # pilot definitions, generator/validator/representation checks
│   ├── quantities.mjs                # pilot quantity model: a, b -> operand, sum; feasibility
│   ├── lessons.mjs                   # lesson folders, metadata, translations, pairing
│   ├── markdown.mjs                  # unified pipeline, directive and table extraction
│   ├── notation.mjs                  # pilot grammar tokenizer and normalizer
│   └── registry.mjs                  # loads and indexes content/registry/*.json
├── validate-content.test.mjs         # extended with the spec's failure cases
└── fixtures/                         # minimal valid and invalid content trees for tests

.github/workflows/validate-content.yml   # unchanged: npm ci, npm run validate, npm test
```

**Structure Decision**: Keep the single Node tooling package at the repository root and split the validator into small modules under `tools/lib/`, because the checks grow from four to roughly twenty and the test fixtures need to exercise them in isolation. Content stays under `content/` in the layout `architecture.md` and the lesson proposal already describe; `content/_templates/` holds the copyable lesson template and is skipped by discovery; `content/registry/` holds the reviewed capability lists that definitions and directives are checked against. No application project is created by this feature.

## Phase 0: Research

Complete; see [research.md](research.md). All Technical Context entries are resolved; no `NEEDS CLARIFICATION` remains.

## Phase 1: Design

Complete; see [data-model.md](data-model.md), [contracts/](contracts/), and [quickstart.md](quickstart.md).

## Post-design constitution re-check

Re-evaluated against the data model and contracts on 2026-10-19: all gates still pass (table above, right-hand column). Two points were examined specifically. The registries describe capabilities as data (names, versions, bounds) and never carry logic, so gate III holds. The validator's notation normalizer compares expressions; it does not evaluate mathematics or judge answers, which remain the domain code's job, so gate III holds for tooling as well.

## Complexity Tracking

No constitution violations to justify.
