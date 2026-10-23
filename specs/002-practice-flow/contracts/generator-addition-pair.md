# Contract: generator `addition-pair` version 1

Part of [plan.md](../plan.md) Phase 1. Implements the registry entry in `content/registry/generators.json` (relation `sum-of-two-operands`, parameters `operand` and `sum`, produces `a`, `b`, `sum`). Required by DL-034 before the generator ships.

## Inputs

- Definition parameters: `operand { min, max }`, `sum { min, max }` (integers, already checked by the content validator to lie within the generator's domain and to be feasible).
- A `Seed` (unsigned 64-bit).
- The random source: `SplitMix64(seed)` and `BoundedSampler.NextBelow(n)` from the seed proposal. The generator receives the source from the caller and never constructs one.

## Draw order

1. Enumerate the feasible ordered pairs `(a, b)` in canonical order: `a` from `operand.min` to `operand.max` ascending; for each `a`, `b` from `operand.min` to `operand.max` ascending; keep the pair when `sum.min ≤ a + b ≤ sum.max`. Call the count `N`.
2. Draw exactly one value `i = NextBelow(N)` from a fresh stream seeded with the seed.
3. Return the `i`-th pair (zero-based).

Nothing else consumes the stream. `N` is the pool size: 45 for `numbers.addition.within-10` (operands 1–9, sums 2–10) and 36 for `numbers.addition.crossing-ten` (operands 2–9, sums 11–18).

## Determinism and compatibility

- The same (definition parameters, seed) always yields the same pair, in every language, after any ladder change, after restart, and whatever other generator versions exist.
- Any change to the enumeration order, the number of draws, or the sampler is a new generator version (`addition-pair@2`), registered separately; definitions keep resolving the version they pin.
- Fixed tasks never call the generator.

## Fixtures (`MathKX.Domain.Tests/Fixtures/addition-pair-v1.golden.json`)

```json
{
  "generator": "addition-pair@1",
  "definitions": {
    "numbers.addition.within-10@1": { "poolSize": 45, "seeds": { "0": [1, 1], "1": [3, 5], "42": [4, 6] } },
    "numbers.addition.crossing-ten@1": { "poolSize": 36, "seeds": { "0": [2, 9], "42": [8, 5] } }
  }
}
```

The values above are placeholders: the implementation computes them once, a reviewer checks two by hand against the vectors (seed 42 with `NextBelow(10)` yields 3 as the first draw, so with `N = 45` or `36` the index follows from the raw output `13679457532755275413`), and the file is then frozen. Ten seeds per definition, including `0`, `1`, `42`, `1234567890123456789`, and `18446744073709551615`.

## Tests

| Test | Asserts |
| --- | --- |
| Golden seeds | Every fixture seed yields its recorded pair |
| Pool size | `PoolSize(definition)` equals the fixture's `poolSize` and the canonical enumeration's length |
| Property, 10 000 seeds per definition | Every pair within operand and sum bounds; every pair inside every listed representation's `supports` box (registry agreement); every feasible pair observed at least once |
| Boundary fixtures (DL-009) | `4 + 4` is in the `within-10` pool; `9 + 9` is in the `crossing-ten` pool; no pilot definition can produce `19 + 1` |
| Replay (spec User Story 2) | `(numbers.addition.crossing-ten, 1, 42)` resolves identically under four conditions, including with a stub `addition-pair@2` registered; a v2 definition resolves differently for the same seed |
| Registry agreement | The generator's name, version, parameter names, and domains equal the registry entry read from `content/registry/generators.json` |
