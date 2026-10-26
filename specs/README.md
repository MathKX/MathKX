# Feature specifications

Specifications are written with GitHub Spec Kit and governed by the ratified [constitution](../.specify/memory/constitution.md). Each specification cites its requirement sources and the [decision-log](../docs/reviews/round-01/decision-log.md) rows it depends on, and treats the round-04 verification reports as evidence rather than restating them. A specification may not change an established requirement or an accepted ADR; a conflict goes back to the decision log.

## Order

Specifications follow the backlog order recorded in the decision log (feature verdicts of 2026-10-18):

| Spec | Decision-log feature | Scope |
| --- | --- | --- |
| [001-pilot-content-contract](001-pilot-content-contract/spec.md) | F1 | Schemas, folder layout, directive and notation rules, and validator checks for lessons, exercise definitions, and skill ladders (implemented, PR 20) |
| [002-practice-flow](002-practice-flow/spec.md) | F2, F3, F4 | The first learner-visible practice loop: domain generator and validator, thin service, web practice flow with help-first feedback, the ladder transitions between the two milestone definitions, and the minimum guest session record with derived outcomes; establishes the application layout |
| [003-lesson-rendering](003-lesson-rendering/spec.md) | F5 | Lesson rendering and the detour back to an exercise, with the honest answer-reveal notice and recording (implemented: first release PR 30, then US4, US5, and polish) |
| [004-progress-view](004-progress-view/spec.md) | F6 | The progress view across skills and lessons, "Lesson viewed" history, and replay of recorded deliveries; adds localized skill names to the content contract (implemented: PRs 36, 38, 40, and 41, then polish) |
| [005-repeats-and-sessions](005-repeats-and-sessions/spec.md) | F7 | Repeat avoidance, "Repeat this question", and further session controls (specified, planned, and broken into tasks) |
| 006 (later) | F8 | Self-checks, after milestone one |
| F9 | — | Profiles, recovery, and persistence: a design proposal first, then a specification |

## Working on a checked-in specification

Spec Kit remembers the active feature in `.specify/feature.json`, which is deliberately not committed (it is per-checkout state). On a fresh checkout the planning and task skills therefore cannot find a specification until you select it. Either recreate the pointer:

```bash
printf '{\n  "feature_directory": "specs/001-pilot-content-contract"\n}\n' > .specify/feature.json
```

or set the environment variable for the session:

```bash
export SPECIFY_FEATURE_DIRECTORY=specs/001-pilot-content-contract
```

Then run `/speckit-plan`, `/speckit-tasks`, and so on as usual. Creating a new specification with `/speckit-specify` writes the pointer for you.

The scripts under `.specify/scripts/bash/` are committed with the executable bit set; if your checkout loses it, invoke them through `bash` (for example `bash .specify/scripts/bash/setup-plan.sh --json`).

## Layout

```text
specs/
  NNN-short-name/
    spec.md                 what and why, user stories, requirements, success criteria
    checklists/             quality checklists (requirements.md is maintained by the specify and clarify skills)
    plan.md                 how: stack, structure, constitution check (written by /speckit-plan)
    research.md, data-model.md, contracts/, quickstart.md
    tasks.md                ordered implementation tasks (written by /speckit-tasks)
```
