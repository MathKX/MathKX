# Learning model

This document defines the project's current shared vocabulary. It describes a direction, not an implemented algorithm or finalized persistence model.

## Concepts

### Skill

A language-neutral unit of mathematical knowledge or capability, identified independently of school system and grade. Examples include `numbers.square-roots`, `algebra.linear-equations`, and `geometry.pythagorean-theorem`.

A skill may have prerequisite skills. Prerequisites form a directed graph, not a fixed course sequence: the same skill can support several later skills, and a learner may reach a skill through different curricula. See [skill graph](skill-graph.md) for the modeling principles and open questions, and [`content/skills/`](../../content/skills/) for the current seed graph.

### Curriculum and competency goal

A curriculum describes expectations in an educational context. Its competency goals map to one or more reusable skills. Curricula may organize, label, and schedule mathematics differently without changing the identity of the underlying skills.

This separation is fundamental:

```text
Norwegian competency goal -----\
                                >---- mathematical skill
Swedish competency goal -------/
```

A future mapping may carry context such as grade, expected depth, or jurisdiction-specific wording. Its exact data model is not decided.

### Exercise definition

A versioned content record describing a family of learning interactions. It can reference skills and evidence intent, fixed authored content or a named generator, semantic representations, interactions, validation, hints, explanations, or bounded composition. Definitions are generally data rather than individual hardcoded questions, but fixed authored tasks remain valid when variation would not improve learning.

### Exercise instance

A concrete question produced from a definition. Long term, the tuple below should be sufficient to reproduce one:

```text
exercise definition ID + definition version + seed
```

An instance includes the generated presentation and the information needed for deterministic validation. It is distinct from the reusable definition.

### Attempt

A learner's interaction with an exercise instance, including the submitted answer or action and the validation result. Attempts are observations that a future learning model may use; one successful attempt does not necessarily prove mastery.

### Mastery

An estimate of a learner's current command of a skill. Mastery may be informed by attempts over time, task difficulty, help used, recency, or other evidence. The exact model is deliberately undecided; see [mastery.md](mastery.md).

## Conceptual relationships

```text
Curriculum
  -> competency goals
       -> map to skills <-> prerequisite skills
                            -> exercise definitions
                                 -> generated instances
                                      -> attempts
                                           -> mastery evidence
```

Curriculum mappings express *what an educational system expects*. The skill graph expresses *how mathematical knowledge relates*. Exercise definitions provide experiences and evidence for skills. Attempts provide observations; a mastery model interprets them.

## Intended adaptive loop

A future learning engine may:

1. select a target skill from a learner's goals or curriculum context;
2. choose an exercise definition and an appropriate level of challenge;
3. generate a reproducible exercise instance;
4. validate the learner's interaction deterministically;
5. update evidence about relevant skills; and
6. continue, explain, vary the representation, or revisit a prerequisite.

For example, repeated difficulty with `geometry.pythagorean-theorem` might reveal weak evidence for `numbers.square-roots`. The system could temporarily practice square roots, then return to the original goal. This is an intended capability, not current behavior.

## Established direction

- Skills and curricula are separate concepts.
- Skills have stable, language-neutral identifiers.
- Skill prerequisites are modeled as a graph.
- Definitions, instances, attempts, and mastery are distinct concepts.
- Exercise generation and validation must be reproducible and trustworthy.
- The answer interaction can itself be part of the learning experience.

The [exercise capability model](../architecture/exercise-capability-model.md) defines the separate dimensions an exercise definition, instance, interaction, validator, and attempt-evidence contract must eventually support.

## Future decisions

- Skill granularity and ownership of the canonical skill graph
- How prerequisites express strength, alternatives, or contextual dependence
- The mastery model, evidence weighting, decay, and confidence
- Difficulty representation and calibration
- How several skills contribute to or receive evidence from one attempt
- Curriculum mapping shape, versioning, and governance
- How recommendations remain explainable to learners and educators
