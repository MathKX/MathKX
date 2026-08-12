# ADR 0002: Separate skills from curricula

**Status:** Accepted

## Context

Mathematical concepts are reused across countries, languages, grades, and curricula. Making a Norwegian or any other curriculum the domain model would duplicate knowledge and constrain international use.

## Decision

Represent mathematical skills with stable, language-neutral IDs and their own prerequisite graph. Represent curricula and competency goals separately, with mappings to those skills.

## Consequences

- A skill and its exercises can serve several curricula.
- Grade and jurisdiction metadata do not belong in canonical skill identity.
- Curriculum mapping requires its own model, validation, and governance, which remain future decisions.
- Skill granularity must be coherent enough for mappings and adaptive reasoning.

