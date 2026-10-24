namespace MathKX.Domain.Random;

/// <summary>A deterministic stream of raw 64-bit values. Generators receive one from the caller and never construct their own.</summary>
public interface IRawSource
{
    ulong Next64();
}
