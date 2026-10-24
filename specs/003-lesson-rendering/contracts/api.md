# Contract: service additions for lessons

Part of [plan.md](../plan.md) Phase 1. Additions to spec 002's [service contract](../../002-practice-flow/contracts/api.md), whose conventions (seeds as strings, `lang` never affecting mathematics, RFC 9457 problems with a `code`, no authentication or session) apply unchanged. Everything here is read-only and deterministic for a given content snapshot.

## `GET /api/instances/{definitionId}/{version}/{seed}` (changed)

The response gains `lessons`: every lesson whose `practice` entries include this instance's definition and version, ordered by lesson ID, each with the disclosure decision of [disclosure.md](disclosure.md).

```json
{
  "identity": { "definitionId": "numbers.addition.crossing-ten", "version": 1, "seed": "42" },
  "a": 8,
  "b": 5,
  "prompt": "8 + 5",
  "lessons": [{ "id": "number-bonds-to-ten", "discloses": true }],
  "…": "the other fields as in spec 002"
}
```

`lessons` is `[]` when no lesson lists the definition (the fixed task `numbers.addition.four-plus-four`). It carries no `where`, no expression, and never `sum`.

## `GET /api/lessons/{id}/content/{lang}`

The translation's Markdown exactly as authored, front matter included.

```json
{ "id": "number-bonds-to-ten", "version": 1, "language": "en", "markdown": "---\ntitle: Number bonds to ten\n…" }
```

Errors: `404 unknown-lesson`; `404 unknown-language` for a language the lesson does not list. The learner app requests it only when the lesson page's gate is open ([detour.md](detour.md)).

## `GET /api/lessons/{id}/assets/{name}`

Streams one file of the lesson's `assets/` folder as loaded in the snapshot.

- `name` must equal a name in the snapshot's asset list; anything else (including `..`, `/`, `\`, encoded separators, or a file added after startup) is `404 unknown-asset`.
- Content type by extension from the allowlist `.svg` (`image/svg+xml`), `.png`, `.jpg` and `.jpeg` (`image/jpeg`), `.webp`; any other extension is `404 unknown-asset` even if the file exists.
- Headers: `X-Content-Type-Options: nosniff`, `Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'; sandbox`, `Cache-Control: no-cache`.

## `GET /api/visuals/{type}?a={a}&b={b}`

Steps for a lesson visual with authored values, for `type` `make-ten` or `groups`: the explanation steps of [spec 002's step models](../../002-practice-flow/contracts/api.md) for these values, all at once.

```json
{
  "type": "make-ten",
  "a": 8,
  "b": 5,
  "steps": [
    { "kind": "explanation", "representation": "make-ten", "index": 0, "count": 4, "reveals": false, "visual": { "frame": ["a","a","a","a","a","a","a","a","empty","empty"], "loose": 5 }, "text": { "code": "explain.makeTen.frame", "values": { "a": 8, "b": 5 } } },
    { "…": "steps 1 and 2" },
    { "kind": "explanation", "representation": "make-ten", "index": 3, "count": 4, "reveals": true, "visual": { "…": "…", "total": 13 }, "text": { "code": "explain.makeTen.total", "values": { "ten": 10, "rest": 3, "sum": 13 } } }
  ]
}
```

`a` and `b` are checked against the visual component's registered attributes and the linked representation's `supports` (the same check spec 001's validator makes). Errors: `404 unknown-visual` (a type that is not registered or has no steps), `400 unsupported-values` (missing, non-integer, or outside the bounds, for example `groups` with `9` and `9` or `make-ten` with `2` and `2`).

These steps contain the total; they belong to the lesson, which the app fetches only with an open gate. They are never tied to an instance identity.

## `GET /api/visuals/ten-frame-explorer`

```json
{ "type": "ten-frame-explorer", "states": [{ "filled": 0, "partner": 10 }, { "filled": 1, "partner": 9 }, "…", { "filled": 10, "partner": 0 }] }
```

Eleven states in order. The component's `start` attribute selects the initial state on the client.

## Contract tests (additions to spec 002's list)

1. Every instance response has `lessons`; for each of the 81 pilot instances, `discloses` matches the table in [disclosure.md](disclosure.md); the fixed task has `[]`; no instance response contains `sum` or a lesson expression.
2. `GET /api/lessons/number-bonds-to-ten/content/{nb,en}` returns the files byte for byte; an unknown lesson and an unknown language give the stated problems.
3. The asset endpoint serves `ten-frame-3-7.svg` with `image/svg+xml` and the three headers; `..%2Flesson.json`, `../lesson.json`, `lesson.json`, and a name with a disallowed extension all give `404 unknown-asset`.
4. `GET /api/visuals/make-ten?a=8&b=5` equals, step for step, the explanation steps of any instance with operands 8 and 5; `groups` likewise for 4 and 4; out-of-bounds values give `400 unsupported-values`.
5. `GET /api/visuals/ten-frame-explorer` returns eleven states with `filled + partner = 10`.
6. Determinism: every endpoint above returns byte-identical bodies across two calls and across a restart.
