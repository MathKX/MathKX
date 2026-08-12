# ADR 0004: Make exercise generation deterministic

**Status:** Accepted

## Context

Generated exercises must be testable and trustworthy. Without reproducibility, a reported problem may disappear and historical attempts may no longer refer to a stable question.

## Decision

Design generation so that an exercise definition ID, definition version, and seed can reproduce the same exercise instance under a defined compatibility contract. Mathematical answer validation must also be deterministic.

## Consequences

- Bugs, tests, shared exercises, and learner history can refer to reproducible instances.
- Generators cannot depend on ambient randomness, current time, locale, or mutable global state.
- Generator changes need an explicit compatibility and versioning strategy.
- Exact seed representation, random-number algorithm, and persistence format remain undecided.

