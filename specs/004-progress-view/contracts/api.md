# Contract: skills with names and definitions

Part of [plan.md](../plan.md) Phase 1. An addition to spec 002's [service contract](../../002-practice-flow/contracts/api.md) and spec 003's [additions](../../003-lesson-rendering/contracts/api.md); their conventions apply unchanged (research R2).

## `GET /api/skills` (new)

Every skill in the content, ordered by ID:

```json
[
  {
    "id": "numbers.addition-within-20",
    "name": { "nb": "Addisjon opp til 20", "en": "Addition within 20" },
    "prerequisites": ["numbers.number-bonds-to-ten"],
    "ladder": [
      { "definition": "numbers.addition.within-10", "version": 1, "description": { "nb": "…", "en": "…" } },
      { "definition": "numbers.addition.crossing-ten", "version": 1, "description": { "nb": "…", "en": "…" } }
    ],
    "definitions": ["numbers.addition.crossing-ten@1", "numbers.addition.four-plus-four@1", "numbers.addition.within-10@1"]
  },
  {
    "id": "numbers.number-bonds-to-ten",
    "name": { "nb": "Tiervenner", "en": "Number bonds to ten" },
    "prerequisites": [],
    "ladder": [],
    "definitions": []
  }
]
```

- `definitions` lists, ordinally sorted, the key `id@version` of every exercise definition whose `skill` is this skill, including definitions that are not on the ladder (the fixed task).
- `ladder` is `[]` for a skill without one.
- The response contains no learner data, no instance, and no answer.

## `GET /api/skills/{id}` (changed)

The same object as one element above (it gains `name` and `definitions`). `404 unknown-skill` as before.

## Contract tests (additions)

1. `GET /api/skills` returns all nine skills in ID order, each with a non-empty `name.nb` and `name.en`.
2. `numbers.addition-within-20` lists exactly the three pilot definitions in `definitions`; `numbers.number-bonds-to-ten` lists none.
3. `GET /api/skills/{id}` equals the matching element of the list; an unknown ID is `404 unknown-skill`.
4. No skill response contains `sum` or `validation` (spec 002's privacy test, extended to the new route).
5. Two calls return byte-identical bodies.
