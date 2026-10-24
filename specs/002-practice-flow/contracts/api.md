# Contract: practice service

Part of [plan.md](../plan.md) Phase 1. A thin, stateless JSON service. No authentication, no cookies, no session. All responses are `application/json`; errors are RFC 9457 problem details with a `code`.

## Conventions

- Seeds are decimal strings matching `^(0|[1-9][0-9]*)$` within the unsigned 64-bit range, never numbers. A fixed task is addressed with `-` as the seed.
- Versions are positive integers.
- Language is a query parameter `lang=nb|en` where a response contains localized content; it never affects mathematics.
- Private data (the sum, `instance.validation`) is never present in any response except the completed equation inside a `correct` validation result and a step whose `reveals` flag is true, which the learner app fetches only when the learner advances to it and records as a reveal.

## `GET /api/lessons`

Lists lessons with the metadata the learner app needs to show entry points.

```json
[
  {
    "id": "number-bonds-to-ten",
    "version": 1,
    "status": "pilot",
    "skills": ["numbers.number-bonds-to-ten", "numbers.addition-within-20"],
    "titles": { "nb": "Tiervenner – tall som blir 10", "en": "Number bonds to ten" },
    "practice": [
      { "definition": "numbers.addition.within-10", "version": 1, "skill": "numbers.addition-within-20" },
      { "definition": "numbers.addition.crossing-ten", "version": 1, "skill": "numbers.addition-within-20" }
    ]
  }
]
```

## `GET /api/lessons/{id}`

The same object plus `objectives: { nb, en }` and `translations: { nb: "nb.md", en: "en.md" }`. `404 unknown-lesson` otherwise. The Markdown body is not served by this feature.

## `GET /api/skills/{id}`

```json
{
  "id": "numbers.addition-within-20",
  "prerequisites": ["numbers.number-bonds-to-ten"],
  "ladder": [
    { "definition": "numbers.addition.within-10", "version": 1, "description": { "nb": "…", "en": "…" } },
    { "definition": "numbers.addition.crossing-ten", "version": 1, "description": { "nb": "…", "en": "…" } }
  ]
}
```

`404 unknown-skill` otherwise.

## `GET /api/instances/{definitionId}/{version}/{seed}`

Resolves a question. Deterministic: the same path always returns the same body.

```json
{
  "identity": { "definitionId": "numbers.addition.crossing-ten", "version": 1, "seed": "42" },
  "skill": "numbers.addition-within-20",
  "a": 8,
  "b": 5,
  "prompt": "8 + 5",
  "representations": { "help": ["make-ten"], "explanation": ["make-ten"] },
  "generator": { "name": "addition-pair", "version": 1 },
  "validator": { "name": "integer-answer", "version": 1 }
}
```

For a fixed task (`/api/instances/numbers.addition.four-plus-four/1/-`) `identity.seed` is absent and `generator` is absent. Errors: `404 unknown-definition` (ID or version), `400 invalid-seed` (syntax or range). The response never contains `sum`.

## `GET /api/instances/{definitionId}/{version}/{seed}/steps/{kind}/{index}`

Delivers one step of guided visual help (`kind=help`) or of the worked explanation (`kind=explanation`) for the instance, built by the domain's step models for the representation the definition lists for that role. Steps are fetched one at a time as the learner advances; the app records `help-step` or `explanation-step` with the returned `reveals` flag, and `counting-complete` when the last help step of `groups` is reached.

```json
{
  "kind": "explanation",
  "representation": "make-ten",
  "index": 1,
  "count": 3,
  "reveals": false,
  "visual": { "frame": ["a","a","a","a","a","a","a","a","b","b"], "split": { "need": 2, "rest": 3 } },
  "text": { "code": "explain.makeTen.split", "values": { "a": 8, "b": 5, "need": 2, "rest": 3 } }
}
```

The final step carries `"reveals": true` and may include `sum` in `values` (`"text": { "code": "explain.makeTen.total", "values": { "ten": 10, "rest": 3, "sum": 13 } }`). No step with `"reveals": false` contains `sum`. Errors: `404 unknown-definition`, `400 invalid-seed`, `404 unknown-step` (index out of range or a kind the definition's representations do not offer).

## `POST /api/validations`

```json
{
  "identity": { "definitionId": "numbers.addition.crossing-ten", "version": 1, "seed": "42" },
  "artifact": { "kind": "integer", "originalText": " 13 " },
  "submissionId": "1b6c6f0e-5c2a-4d7a-9c53-9b2e1a1f0f77"
}
```

The service re-resolves the instance from the identity (never trusting operands from the client), reads the artifact, and validates. Response, one of:

```json
{ "status": "correct", "code": "correct", "values": { "a": 8, "b": 5, "sum": 13, "v": 13 }, "validator": { "name": "integer-answer", "version": 1 } }
{ "status": "incorrect", "code": "add.oneGroup", "values": { "a": 8, "b": 5, "v": 8 }, "validator": { "name": "integer-answer", "version": 1 } }
{ "status": "invalid-response", "code": "invalid.notAnInteger", "values": { "text": "abc" }, "validator": { "name": "integer-answer", "version": 1 } }
```

`submissionId` is echoed back so the client can drop duplicates; the service itself is stateless and treats every call independently. Errors: `404 unknown-definition`, `400 invalid-seed`, `400 invalid-artifact` (missing kind or text). `partially-correct` and `review-needed` are valid values of `status` in the response type and are never produced by this feature.

## Determinism and privacy tests (contract tests)

1. Two calls to the same instance path return byte-identical bodies; the same after restarting the service.
2. No instance body, lesson body, or skill body contains the key `sum` or `validation`; incorrect and invalid validation results contain no `sum`; no step with `reveals: false` contains `sum`, and every representation's step sequence has exactly one revealing step, the last.
3. Validation with the same identity and artifact twice returns identical bodies.
4. Resolving with `lang=nb` and `lang=en` returns identical mathematics.
5. Invalid seeds (`-1`, `01`, `abc`, `18446744073709551616`) return `400 invalid-seed`; unknown versions return `404 unknown-definition`.

## Static learner app

In production the service serves `src/web/dist` at `/` with history-API fallback for the app's routes; `/api/*` is never shadowed, and a missing file under `/assets/` is a 404 rather than the shell. App routes may contain dots (skill IDs such as `numbers.addition-within-20`). In development the Vite server proxies `/api` to the service.
