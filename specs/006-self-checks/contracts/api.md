# Contract: Check Endpoints and the Answer Endpoint

Part of [plan.md](../plan.md) Phase 1. Research R4 and R5; spec FR-001, FR-002, FR-011, FR-023.

All three are read-only `GET` requests with JSON responses, problem details on errors as in spec 002, and no learner data in the request.

## `GET /api/checks`

The newest version of every check, ordered by ID.

```json
[
  {
    "id": "numbers.addition.check-within-20",
    "version": 1,
    "skill": "numbers.addition-within-20",
    "title": { "nb": "Tiervenner og addisjon", "en": "Number bonds and addition" },
    "scope": { "nb": "Addisjon innenfor ti og over tieren", "en": "Addition within ten and across ten" },
    "questions": [
      { "definition": "numbers.addition.within-10", "version": 1, "seed": "22" },
      { "definition": "numbers.addition.within-10", "version": 1, "seed": "24" },
      { "definition": "numbers.addition.crossing-ten", "version": 1, "seed": "105" },
      { "definition": "numbers.addition.crossing-ten", "version": 1, "seed": "62" }
    ]
  }
]
```

A fixed question has no `seed` (omitted, as null fields are). The shape carries no operands and no sums.

## `GET /api/checks/{id}/{version}`

One version, in the same shape. Unknown `id` or `version`: `404` with `code: "unknown-check"`.

## `GET /api/instances/{definitionId}/{version}/{seed}/answer`

The answer to one question, for the check summary only (research R5). `seed` is `-` for a fixed task, as on the other instance routes.

```json
{
  "identity": { "definitionId": "numbers.addition.within-10", "version": 1, "seed": "22" },
  "answer": { "kind": "integer", "value": 10 }
}
```

- **Errors**, as `GET /api/instances/...`: `404 unknown-definition`, `400 invalid-seed`.
- **The sum rule of spec 002's api contract** gains a third named exception: a sum appears in a correct validation result, in a revealing step, and in this response.
- **Who calls it**: only the check summary, and only for a question without a correct saved answer. Nothing in practice, a lesson, a replay, or a check in progress requests it. The end-to-end check asserts that no `/answer` request is made before the summary.

## Health

`GET /api/health` gains `checks`: the number of loaded check versions.

## Contract tests (`MathKX.Api.Tests/ContractTests.cs`)

- **`/api/checks`**: the shape of the pilot check; no field named `answer`, `sum`, `a`, or `b` anywhere in it.
- **`/api/checks/{id}/{version}`**: the pilot; `unknown-check` for an unknown ID and for an unknown version.
- **`/answer`**: the four pilot answers (10, 9, 13, 13); a fixed task (`numbers.addition.four-plus-four`, version 1, seed `-`) gives 8; `unknown-definition` and `invalid-seed` as for instances.
- **`/api/health`**: counts one check.
