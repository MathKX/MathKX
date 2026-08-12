# ADR 0001: Use a monorepo

**Status:** Accepted

## Context

MathKX will initially include application code, mathematical domain logic, schemas, exercise content, curriculum mappings, tests, and documentation. These parts will evolve together and benefit from atomic changes and shared validation.

## Decision

Keep backend, web, content, schemas, tests, and documentation in one repository. Create project directories only as real implementation is introduced.

## Consequences

- Cross-cutting changes can be reviewed and tested together.
- Contributors have one place to discover the system and its content.
- Tooling must avoid unnecessary coupling between otherwise clear boundaries.
- Content or visualizations may move to separate repositories later if scale, governance, or release needs provide a concrete reason.

