# ADR 0011: Seed representation and random source

**Status:** Accepted (owner decision, 2026-10-24; decision log DL-024)

## Context

ADR 0004 made exercise generation deterministic for `(definition id, definition version, seed)` but left the seed representation and the random-number algorithm undecided. The [seed and random-source proposal](../proposals/seed-and-random-source.md) filled that gap and was examined in review rounds one to four: its raw and bounded test vectors were reproduced independently by three reviewers, and the decision log fixed the adoption trigger as a C# implementation that passes the proposal's raw, bounded, rejection, and boundary fixtures (DL-018, DL-024, DL-034).

Spec 002 met the trigger. `MathKX.Domain.Random` implements the proposal, its tests reproduce every vector in the proposal's test-vectors section together with the injected rejection streams, invalid bounds, seed parsing at both limits, state wraparound, and the draw after a rejection, and they pass in CI on every push. The first generator, `addition-pair@1`, draws from this source and has frozen golden seeds.

## Decision

The proposal's **Proposed contract** and **Test vectors** sections are adopted as the project's contract for seeds and randomness, with these points made explicit:

- **Seed.** An unsigned 64-bit integer, serialized in JSON and URLs as a decimal string matching `^(0|[1-9][0-9]*)$`, never as a JSON number. Parsers reject anything outside the grammar or the range.
- **Stream.** SplitMix64 with the state initialized to the seed, exactly as the proposal's pseudocode states, with wrapping 64-bit arithmetic and logical shifts.
- **Bounded draws.** `nextBelow(n)` for `1 ≤ n ≤ 2^64 − 1` by the proposal's rejection loop. The rejection interval is part of the contract because it determines how many raw outputs a draw consumes; the `limit = 2^64` case accepts every raw value and must never wrap to zero.
- **Higher-level operations** (choice from a list, shuffles, inclusive ranges) are built only from `nextBelow(n)` and are specified, with test vectors, in the contract of the generator that uses them before that generator ships. `addition-pair@1` uses one `nextBelow(N)` draw over its canonical enumeration (spec 002, generator contract).
- **Prohibitions.** No platform random source in generation or validation; a generator receives its stream from the caller and never builds one from time, locale, process state, or a global; randomness is never consumed conditionally on the display locale, the client, or anything outside the instance identity.
- **Fixtures.** Only the vectors in the proposal's test-vectors section are fixtures. The `seed-123456789` sequence from the round-two review is not one (round-four challenge, checklist 7).

The implementation of record is `src/backend/MathKX.Domain/Random/` (`Seed`, `SplitMix64`, `BoundedSampler`) with its tests under `src/backend/MathKX.Domain.Tests/Random/`. Any second implementation, for example a TypeScript one for browser-side preview, must pass the same fixtures before it is used; none exists today and none is required.

Choosing a seed is not a draw. The learner app picks fresh seeds with a platform cryptographic source and sends them to the service; the seed is an input to generation, so this is outside the prohibitions, which govern what happens after the seed is fixed.

## Consequences

- Seeds are human-readable, URL-safe, and exact in C# and JavaScript alike. Every question a learner has seen can be replayed from its identity.
- The stream is fixed; the generators that read it are not. A generator that changes the number or order of its draws produces different instances for existing seeds and must be registered as a new generator version (ADR 0004's compatibility envelope, DL-034). Definitions keep the version they pin.
- Changing the algorithm or the sampler would change every instance for every seed. It requires a new ADR that supersedes this one and new versions for every generator; it is not a refactoring.
- SplitMix64 is not cryptographically secure and seeds are not secrets. Anything that must be unguessable uses a platform cryptographic source and is outside this decision.
- The proposal document stays in the repository as the record of the reasoning and the vectors; this ADR, not the proposal's status line, is the statement of acceptance.
