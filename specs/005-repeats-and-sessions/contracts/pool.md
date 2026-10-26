# Contract: a variation's question pool

Part of [plan.md](../plan.md) Phase 1. Research R1 and R2; spec FR-001, FR-003, FR-005.

## `QuestionPool` (domain)

For a definition (one variation), the pool lists every question the definition admits, in the generator's canonical order, each with the smallest seed whose draw is that question:

- **Generated definition** (`addition-pair@1`): the questions are `AdditionPairGenerator.Enumerate(spec)`. For each, the seed is the smallest `s` in 0, 1, 2, … such that `Generate(definition, s)` returns it. Finding them tries seeds in order and stops when every question has a seed.
- **The limit**: at most 65,536 seeds per definition. If a question has no seed within the limit, building the pool fails with the definition key. The service then fails to start, as for any content error.
- **Fixed task**: one question, the definition's prompt operands, with no seed.

Every seed in a pool MUST resolve, through the instance endpoint, to the question it is listed with, in every language and after a restart (ADR 0004).

## `GET /api/definitions/{id}/{version}/pool`

```json
{
  "definition": "numbers.addition.within-10",
  "version": 1,
  "questions": [
    { "seed": "3", "a": 1, "b": 1 },
    { "seed": "12", "a": 1, "b": 2 }
  ]
}
```

(The seeds shown are illustrative; the domain tests' fixture records the real ones.)

- **Order**: canonical, the generator's enumeration order. `seed` is the decimal string the instance endpoint accepts, or `null` for a fixed task.
- **No answers**: the response carries operands only, never `sum` or validation data (spec 002 FR-009).
- **Caching**: the body is computed once per process and is byte-identical across calls; like the other API responses, it sets no cache header.
- **Errors**: an unknown definition or version is `404 unknown-definition`, as for the instance endpoint.

## Tests

**`QuestionPoolTests`**:
1. Each pilot pool lists all questions: 45 for `within-10`, 36 for `crossing-ten`, 1 for `four-plus-four`.
2. Each listed seed generates its question.
3. Each seed is the smallest that does: no smaller seed generates that question.
4. The highest seed is below the limit.
5. A fixture of the first ten entries of each generated pool matches.
6. A definition that cannot be covered within a lowered limit fails with its key.

**Contract tests**:
1. The shape and canonical order.
2. Every seed resolves through `GET /api/instances/{id}/{version}/{seed}` to the listed operands.
3. The fixed task has one question with `seed: null`.
4. No `sum` or `validation` appears.
5. An unknown definition is a 404.
6. Two calls give identical bodies.
