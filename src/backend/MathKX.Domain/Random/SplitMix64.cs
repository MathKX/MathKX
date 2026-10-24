namespace MathKX.Domain.Random;

/// <summary>
/// SplitMix64 (Steele, Lea, Flood 2014; Vigna's reference implementation), exactly as the seed proposal
/// specifies: one 64-bit state initialised to the seed, wrapping arithmetic, logical shifts.
/// </summary>
public sealed class SplitMix64 : IRawSource
{
    private ulong _state;

    public SplitMix64(Seed seed)
    {
        _state = seed.Value;
    }

    public ulong Next64()
    {
        unchecked
        {
            _state += 0x9E3779B97F4A7C15UL;
            var z = _state;
            z = (z ^ (z >> 30)) * 0xBF58476D1CE4E5B9UL;
            z = (z ^ (z >> 27)) * 0x94D049BB133111EBUL;
            return z ^ (z >> 31);
        }
    }
}
