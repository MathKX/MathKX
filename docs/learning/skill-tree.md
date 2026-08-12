# Skill graph

“Skill tree” is a convenient product metaphor, but the underlying structure is expected to be a directed graph. A skill may have several prerequisites, a prerequisite may support many skills, and not every relationship must form one universal linear path.

An illustrative fragment might be:

```text
numbers.fractions
       |
       v
numbers.powers
       |
       v
numbers.square-roots
       |
       v
geometry.pythagorean-theorem
```

This example communicates prerequisite reasoning; it is not an approved taxonomy or a claim that every learner must follow exactly that sequence.

## Modeling principles

- Use stable, language-neutral identifiers.
- Describe mathematics, not a grade-specific chapter structure.
- Keep localized names, descriptions, and curriculum mappings separate from skill identity.
- Make prerequisite relationships explicit and reviewable.
- Prefer a small, coherent graph that grows from real content over an exhaustive taxonomy designed in advance.
- Allow future tools to detect cycles and missing references automatically.

## Open questions

- What makes a concept small enough to be one skill?
- Are prerequisites strictly required, recommended, or weighted?
- How should alternative prerequisite paths be expressed?
- Where do conceptual understanding, procedural fluency, and application live?
- How are skill definitions versioned without breaking learner history or curriculum mappings?

