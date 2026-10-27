# Contract: choosing a question

Part of [plan.md](../plan.md) Phase 1. Research R3 and R4; spec User Story 1, FR-001 to FR-005.

## When it applies

Every question the learner did not choose:
- the first question of a practice run;
- "Another question" and "More like this";
- the next question after a pending "Make it easier" or "More challenge".

It does not apply to resuming an unfinished question (spec 002), to "Repeat this question" ([repeat.md](repeat.md)), or to replay (spec 004).

## The window (`selection.ts`, pure)

`recentWindow(record, definitionId, version)`:
- **Which deliveries**: the last eight of that definition and version, ordered by `startedAt` and then record order. Every shown delivery counts, whatever its outcome or repeat reason.
- **What it returns**: those deliveries, oldest first. The store compares their unordered pairs (`pairKey(a, b)`, so `3 + 7` equals `7 + 3`), and the exhausted case takes `repeatOf` from the most recent delivery with the same pair.

## Choosing

`choose(firstDraw, window, pool)` returns one of:

| Case | Result |
| --- | --- |
| The first draw's pair is not in the window | `{ kind: "fresh" }`: deliver the first draw |
| Some pool questions' pairs are not in the window | `{ kind: "chosen", seed }`: the question at index `BigInt(firstDraw.seed) mod n` among those `n` questions, in pool order |
| Every pool question's pair is in the window | `{ kind: "exhausted" }`: deliver the first draw as a repeat. Exhaustion is a state of the current window, not of the pool: once a pair has left the window, it is fresh again |

The fixed task's first draw has no seed, so its index is 0; its pool has one question, so the "chosen" case never arises for it.

## In the store's `load()`

1. **First draw**: request the instance with a new seed, as today. If the request was superseded or fails, stop as today.
2. **Window**: compute it from the record.
3. **Fresh**: dispatch the question as today.
4. **Pool**: otherwise, get the pool, cached per definition and version for the visit (a failed request is not cached). If that request fails, dispatch the first draw as today and stop.
5. **Chosen**: request the instance by the chosen seed and dispatch that question. The first draw is never dispatched, shown, or recorded. If this request fails, show spec 002's load error, as for any failed question.
6. **Exhausted**: dispatch the first draw with `repeatReason: "exhausted"` and `repeatOf` set to the most recent delivery in the window with the same pair. Show the notice `practice.poolExhausted`, announced politely. The next question that is not exhausted clears that notice, which is true only of the question it came with.

**At most two instance requests and one pool request per question.**

## Strings

| Key | en | nb |
| --- | --- | --- |
| `practice.poolExhausted` | This variation has no other questions right now, so this one repeats. | Denne varianten har ingen andre oppgaver akkurat nå, så denne kommer igjen. |

## Tests

**`tests/selection.test.ts`**:
1. The window: eight most recent, per variation, ordered by time, whatever the outcome.
2. Either order counts: `7 + 3` is recent after `3 + 7`.
3. `choose` returns `fresh`, `chosen` (at the stated index, never a recent pair), and `exhausted`.
4. Determinism: the same inputs give the same choice.

**Store tests with the fake API (pool from the fake)**:
1. 100 "Another question" requests on `within-10` and on `crossing-ten` never deliver a pair from the previous eight.
2. A scripted pool of five questions `A` to `E`: a request is a repeat with the notice exactly while all five pairs are among the last eight. When a pair leaves the window, the next request delivers it without the notice (PR 43 review). For example, after `A, B, C, D, E, E, E, E, E`, the window is `B, C, D, E, E, E, E, E`, so the next question is `A`.
3. The record never holds the passed-over question.
4. Each question makes at most two instance requests.
5. A failing pool request still delivers a question.
6. A reload keeps avoiding the recent questions.
7. A ladder change avoids the target variation's own window.
