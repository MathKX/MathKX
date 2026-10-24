namespace MathKX.Domain.Random;

/// <summary>
/// Unbiased bounded draws by rejection sampling on the raw 64-bit output, consuming the stream exactly as
/// the seed proposal's pseudocode does, including rejected draws.
/// </summary>
public static class BoundedSampler
{
    /// <summary>A uniform integer in 0 .. n − 1 for 1 ≤ n ≤ 2^64 − 1.</summary>
    public static ulong NextBelow(IRawSource source, ulong n)
    {
        if (n == 0)
        {
            throw new ArgumentOutOfRangeException(nameof(n), "The bound must be at least 1.");
        }

        // 2^64 mod n equals (0 − n) mod n in wrapping arithmetic. When it is 0, limit == 2^64 and every
        // raw value is accepted; the proposal forbids wrapping the limit to zero.
        var remainder = unchecked(0UL - n) % n;
        while (true)
        {
            var raw = source.Next64();
            if (remainder == 0 || raw < unchecked(0UL - remainder))
            {
                return raw % n;
            }
        }
    }
}
