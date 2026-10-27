# Data Model: Repeat Avoidance, "Repeat This Question", and Session Controls

Phase 1 of [plan.md](plan.md). Entities this feature adds or changes, by layer. The data models of specs 002 to 004 stand for everything not listed here. Names are the planned type names; the contracts give the exact shapes.

## Domain (`MathKX.Domain.Generators`)

| Entity | Fields | Rules |
| --- | --- | --- |
| `QuestionPool` (new) | `Definition` (key), `Questions`: `(Seed? Seed, int A, int B)` in canonical order | Generated: each question's smallest seed within 65,536; fixed task: one question, no seed; built once at service startup; a pool that cannot be covered fails the start with the definition key ([contracts/pool.md](contracts/pool.md)) |

## Service shapes (`MathKX.Api.Dto`)

| Shape | Fields | Notes |
| --- | --- | --- |
| `PoolDto` (new) | `Definition`, `Version`, `Questions: { Seed (string or null), A, B }[]` | `GET /api/definitions/{id}/{version}/pool`; operands only, never a sum |

## Learner app record (`src/web/src/state`)

| Entity | Fields | Rules |
| --- | --- | --- |
| `Delivery` (changed) | gains optional `repeatOf` (a delivery ID) and `repeatReason` (`"requested"` or `"exhausted"`) | Set only by "Repeat this question" ([contracts/repeat.md](contracts/repeat.md)) or an exhausted pool ([contracts/selection.md](contracts/selection.md)); absent on records written before this feature |
| `PersistedState` (changed) | gains `session: { current: string[]; last: { finishedAt: string; questions: { id; outcome; repeat }[] } \| null }` | `current`: deliveries worked in this session; `last`: a snapshot at finish. Missing on hydrate gives `{ current: <every delivery ID>, last: null }`; schema version stays 1; "Clear my work" resets it ([contracts/session.md](contracts/session.md)) |
| Pool cache (in memory, new) | per `definition@version`: the pool | Fetched at most once per visit per variation; never persisted |

## Derived (never stored)

| Entity | Derivation |
| --- | --- |
| Window | The unordered pairs of the last eight deliveries of one definition and version, by `startedAt` then record order |
| Choice | `fresh`, `chosen` (a pool seed), or `exhausted`, from the first draw, the window, and the pool |
| Repeat kind | `requested` (`repeatReason`), `chance` (`repeatReason: "exhausted"` or spec 004's ordered match), or none |
| Session summary | The snapshot in `session.last`, grouped by skill through `skillOfDefinition`; counts of its outcomes and repeat kinds |

## State transitions

| From | Event | To |
| --- | --- | --- |
| A question in progress, or none | "Another question", "More like this", ladder change, or first question | The first draw, or a chosen question, or the first draw marked `exhausted`; the previous question closes as in spec 002 |
| A question with a submission | "Repeat this question" | A new delivery with the same identity, `repeatReason: "requested"` |
| Any recorded question except the one in progress, in a replay | "Repeat this question" | Practice on its skill and variation with the new delivery; the previous question in progress closes (`skipped` without a submission) |
| Practice, at any point | "Finish practice" | Spec 002's `end` (the unanswered question stays resumable); snapshot of `session.current` into `session.last` (repeats against the whole record); `instance` and `currentDeliveryId` cleared; `session.current = []`; `/session` |
| `/session` | "Practise again" | `/practice/{skillId}`: resumes the unfinished question, or loads a new one by the choosing rule; either joins the new session |
| Any | A question becomes current (delivered, resumed, repeated) | Its ID is appended to `session.current` if not already there |
