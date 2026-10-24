# Proposal: Seed representation and random source

**Status:** Accepted as [ADR 0011](../decisions/0011-seed-and-random-source.md) on 2026-10-24 (decision log DL-024). This document is retained as the record of the reasoning and the test vectors; the ADR is the accepted contract.

This proposal originated as a proposed ADR in Claude's foundation contribution and was held outside the accepted decision set until the first generator validated it; spec 002 did so, and ADR 0011 adopts its contract and test vectors. The sections below are kept as written, so their "proposed" wording records the proposal as reviewed; where they and ADR 0011 differ, ADR 0011 governs.

## Context

[ADR 0004](../decisions/0004-deterministic-exercise-generation.md) requires that an exercise definition ID, definition version, and seed reproduce the same exercise instance, and leaves the seed representation and random-number algorithm undecided. Changes to these choices need an explicit compatibility strategy to preserve recorded instances.

Two hazards shape the choice:

- Platform random sources are not stable contracts. Microsoft documents that `System.Random` is not guaranteed to produce the same sequence across .NET versions, and its default algorithm changed in .NET 6. `Math.random` in JavaScript cannot be seeded at all.
- Generation or preview may one day run in the browser as well as on the server. The algorithm must therefore be small enough to implement identically in C# and TypeScript and to verify with shared test vectors. JavaScript numbers cannot hold a 64-bit integer exactly, so the JSON representation of a seed must not be a JSON number.

## Proposed contract

### Seed

A seed is an unsigned 64-bit integer in the range 0 to 18446744073709551615 inclusive.

In JSON and in URLs, a seed is serialized as a decimal string with no sign, no leading zeros (except the single digit `0`), and no separators: it matches `^(0|[1-9][0-9]*)$`. Parsers must reject values outside the range. A seed is never serialized as a JSON number.

### Random source

The generator random source is **SplitMix64**, as published by Steele, Lea, and Flood ("Fast Splittable Pseudorandom Number Generators", OOPSLA 2014) and in Sebastiano Vigna's reference C implementation. The state is one 64-bit unsigned integer initialized to the seed. Each call advances the state and returns 64 bits:

```text
state = state + 0x9E3779B97F4A7C15                (mod 2^64)
z = state
z = (z XOR (z >> 30)) * 0xBF58476D1CE4E5B9       (mod 2^64)
z = (z XOR (z >> 27)) * 0x94D049BB133111EB       (mod 2^64)
return z XOR (z >> 31)
```

All shifts are logical (unsigned) right shifts. All arithmetic wraps modulo 2^64.

### Bounded integers

A uniform integer in the range 0 to n − 1 for 1 ≤ n ≤ 2^64 − 1 is drawn by unbiased rejection sampling on the raw 64-bit output:

```text
limit = 2^64 - (2^64 mod n)
repeat
  r = next64()
until r < limit
return r mod n
```

In 64-bit unsigned arithmetic, `2^64 mod n` equals `(0 - n) mod n` with wrapping subtraction. Rejection is extremely rare for small n, but the loop is part of the contract: implementations must consume the stream identically, including rejected draws.

The pseudocode uses mathematical integers: `limit` can equal `2^64`, which does not fit in an unsigned 64-bit variable. A fixed-width implementation must handle that case explicitly (all raw values are accepted), or use wider arithmetic. It must not wrap the limit to zero. Switching to a different rejection interval would change stream consumption and is not an equivalent replay implementation.

Higher-level operations such as choosing from a list, shuffling, or drawing a value from an inclusive range are built only from `nextBelow(n)` and must be specified, with test vectors, in the generator contract before the first generator ships. A Fisher–Yates shuffle, for example, must state its iteration direction. Floating-point draws are not part of this decision; exact rational arithmetic is the expected default in domain code.

### Prohibitions

- `System.Random`, `Math.random`, `crypto.getRandomValues`, and any other platform random source are never used in exercise generation or validation.
- A generator receives its random source from the caller; it never constructs one from time, locale, process state, or a global.
- A generator must not consume randomness conditionally on the display locale, the client, or any input that is not part of the instance identity.

### Test vectors

Raw 64-bit outputs, the first three for each seed, as decimal and hexadecimal:

| Seed | Output 1 | Output 2 | Output 3 |
| --- | --- | --- | --- |
| `0` | 16294208416658607535 (`0xE220A8397B1DCDAF`) | 7960286522194355700 (`0x6E789E6AA1B965F4`) | 487617019471545679 (`0x06C45D188009454F`) |
| `1` | 10451216379200822465 (`0x910A2DEC89025CC1`) | 13757245211066428519 (`0xBEEB8DA1658EEC67`) | 17911839290282890590 (`0xF893A2EEFB32555E`) |
| `42` | 13679457532755275413 (`0xBDD732262FEB6E95`) | 2949826092126892291 (`0x28EFE333B266F103`) | 5139283748462763858 (`0x47526757130F9F52`) |
| `1234567890123456789` | 11026200465730903474 (`0x9904EEE77E231DB2`) | 8137580871910607288 (`0x70EE7EB0313EC9B8`) | 8574954778522941295 (`0x77005BF062E5F76F`) |
| `18446744073709551615` | 16490336266968443936 (`0xE4D971771B652C20`) | 16834447057089888969 (`0xE99FF867DBF682C9`) | 4048727598324417001 (`0x382FF84CB27281E9`) |

The outputs for seeds `0` and `1` agree with the values published alongside Vigna's reference implementation.

Bounded draws, the first eight values of `nextBelow(n)` from a fresh stream:

| Seed | n | Values |
| --- | --- | --- |
| `42` | 10 | 3, 1, 8, 4, 0, 2, 5, 8 |
| `42` | 6 | 1, 1, 0, 0, 4, 0, 1, 2 |
| `0` | 1000 | 535, 700, 679, 444, 747, 90, 913, 940 |
| `1` | 7 | 2, 0, 1, 0, 5, 2, 0, 3 |

No draw in these sequences was rejected. These vectors are necessary examples, not sufficient evidence of conformance. Before adopting this proposal, the implementation tests must also cover rejection and boundary behavior:

| Bound `n` | Injected raw outputs consumed by one draw | Expected result | Outputs consumed |
| --- | --- | --- | --- |
| `10` | `18446744073709551615`, `18446744073709551610`, `18446744073709551609` | `9` | 3 |
| `1` | `18446744073709551615` | `0` | 1 |
| `9223372036854775808` | `18446744073709551615` | `9223372036854775807` | 1 |
| `18446744073709551615` | `18446744073709551615`, `18446744073709551614` | `18446744073709551614` | 2 |

These injected streams test the bounded sampler independently of SplitMix64. Also test invalid bounds (`0`, negative, and greater than `2^64 - 1`), seed parsing at both limits, invalid seed syntax and range, state wraparound, and the next draw after a rejection. If a browser implementation is introduced, run the same fixtures there and in C#; browser-side generation is not required by this proposal.

## Consequences

- Seeds are human-readable, URL-safe, and exact in every language the project uses.
- The random source is about ten lines of code with no dependencies, so a second implementation for browser-side preview is cheap and verifiable.
- SplitMix64 is not cryptographically secure. Seeds are not secrets and must never be used as one; anything that must be unguessable (session tokens, identifiers) uses a platform cryptographic source and is outside this decision.
- The compatibility envelope from ADR 0004 still applies: a generator that changes how many draws it consumes, or in what order, changes the instances it produces for existing seeds and must advance its compatibility version. This decision fixes the stream, not the generators that read it.
- The repository's first generator implementation should include these vectors as tests before any content depends on it.
