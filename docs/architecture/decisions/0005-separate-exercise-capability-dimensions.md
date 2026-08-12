# ADR 0005: Separate exercise capability dimensions

**Status:** Accepted

## Context

A mathematical activity, its pedagogical purpose, representation, learner interaction, response artifact, generation, and validation can vary independently. For example, solving a linear equation may use symbolic entry, graph selection, or an equation balance, while coordinate placement can support several different mathematical activities. Treating an interaction name or answer type as the whole exercise would couple content to UI controls and obscure the evidence an attempt provides.

## Decision

Model pedagogical purpose, mathematical activity, representation, interaction, response artifact, validation, generation, composition, support, accessibility, and session orchestration as separate dimensions with explicit compatibility contracts.

Exercise definitions may compose these dimensions through bounded data and named extensions. They do not encode general workflow logic. Renderers produce semantic response artifacts; deterministic validators interpret those artifacts; a future learning engine interprets structured evidence and controls session adaptation.

## Consequences

- Exercise Format v1 needs more than a prompt template and `answer.type`, but can introduce the dimensions incrementally through typed contracts.
- The same mathematical task can use different interactions without duplicating its skill identity, and an interaction component can serve several task families.
- Generators, renderers, validators, and evidence consumers have clearer boundaries and can be tested independently.
- Accessibility is specified per representation and interaction without changing the underlying mathematical objective.
- Content validation must check compatibility across dimensions as well as JSON syntax.
- Authoring is more explicit, so catalogs, previews, defaults, and concise validation messages are important.

See the [exercise capability model](../exercise-capability-model.md) for the taxonomy, scenarios, phase plan, and Format v1 recommendations.
