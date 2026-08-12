# Exercise experience

An exercise is a learning interaction, not merely a prompt plus a text box.

## Possible anatomy

A future exercise experience may include:

- a concise goal or prompt;
- mathematical notation, context, or a visual model;
- an answer interaction appropriate to the idea;
- optional hints that reveal support progressively;
- deterministic feedback;
- an explanation or alternate representation; and
- a clear next action.

Not every exercise needs every element. The definition format should express intent without prescribing pixel-level presentation.

## Answer interactions

The architecture must be able to grow beyond typed text. Candidate interactions include numbers, expressions, multiple choice, coordinates, graph points, drag and drop, ordering, interactive geometry, and selection within a visualization. For example, selecting `(3, 4)` in a coordinate system may assess understanding more directly than typing the characters.

Each interaction needs accessible input, review, correction, and feedback behavior. An equivalent accessible path should preserve the mathematical objective, not merely provide a nominal fallback.

The [exercise capability model](../architecture/exercise-capability-model.md) defines the interaction and representation families, semantic response artifacts, per-family accessibility requirements, and recommended phases. UI components should emit those response artifacts rather than own mathematical validation.

## Hints and explanations

Hints should help a learner resume reasoning rather than immediately reveal an answer. Explanations should connect steps to concepts and may use a visualization or a different representation. Their exact content model and adaptation behavior are future decisions.

## Open questions

- How are multi-step exercises and partial answers represented?
- When should an interaction accept mathematically equivalent forms?
- How do generated questions expose their reasoning for explanations?
- How are hints localized and connected to common misconceptions?
- What evidence should an interactive action contribute to mastery?
