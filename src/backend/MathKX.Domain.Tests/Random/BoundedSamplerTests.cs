using MathKX.Domain.Random;

namespace MathKX.Domain.Tests.Random;

/// <summary>Bounded-draw vectors and injected rejection streams from the seed proposal.</summary>
public sealed class BoundedSamplerTests
{
    public static TheoryData<ulong, ulong, ulong[]> BoundedVectors => new()
    {
        { 42UL, 10UL, new ulong[] { 3, 1, 8, 4, 0, 2, 5, 8 } },
        { 42UL, 6UL, new ulong[] { 1, 1, 0, 0, 4, 0, 1, 2 } },
        { 0UL, 1000UL, new ulong[] { 535, 700, 679, 444, 747, 90, 913, 940 } },
        { 1UL, 7UL, new ulong[] { 2, 0, 1, 0, 5, 2, 0, 3 } },
    };

    [Theory]
    [MemberData(nameof(BoundedVectors))]
    public void Produces_the_proposals_bounded_draws(ulong seed, ulong bound, ulong[] expected)
    {
        var source = new SplitMix64(new Seed(seed));
        var actual = new ulong[expected.Length];
        for (var i = 0; i < expected.Length; i++)
        {
            actual[i] = BoundedSampler.NextBelow(source, bound);
        }

        Assert.Equal(expected, actual);
    }

    public static TheoryData<ulong, ulong[], ulong, int> RejectionRows => new()
    {
        { 10UL, new ulong[] { 18446744073709551615, 18446744073709551610, 18446744073709551609 }, 9UL, 3 },
        { 1UL, new ulong[] { 18446744073709551615 }, 0UL, 1 },
        { 9223372036854775808UL, new ulong[] { 18446744073709551615 }, 9223372036854775807UL, 1 },
        { 18446744073709551615UL, new ulong[] { 18446744073709551615, 18446744073709551614 }, 18446744073709551614UL, 2 },
    };

    [Theory]
    [MemberData(nameof(RejectionRows))]
    public void Rejects_and_consumes_exactly_as_the_proposal_states(ulong bound, ulong[] injected, ulong expected, int consumed)
    {
        var source = new InjectedSource(injected);

        var value = BoundedSampler.NextBelow(source, bound);

        Assert.Equal(expected, value);
        Assert.Equal(consumed, source.Consumed);
    }

    [Fact]
    public void Rejects_a_zero_bound()
    {
        var source = new SplitMix64(new Seed(1));
        Assert.Throws<ArgumentOutOfRangeException>(() => BoundedSampler.NextBelow(source, 0));
    }

    [Fact]
    public void Accepts_every_raw_value_when_the_bound_is_a_power_of_two_dividing_the_range()
    {
        // n = 2^63: 2^64 mod n == 0, so limit == 2^64 and no raw value is ever rejected.
        var source = new InjectedSource(new ulong[] { ulong.MaxValue, 0, 1, 9223372036854775808UL });
        Assert.Equal(9223372036854775807UL, BoundedSampler.NextBelow(source, 9223372036854775808UL));
        Assert.Equal(0UL, BoundedSampler.NextBelow(source, 9223372036854775808UL));
        Assert.Equal(1UL, BoundedSampler.NextBelow(source, 9223372036854775808UL));
        Assert.Equal(0UL, BoundedSampler.NextBelow(source, 9223372036854775808UL));
        Assert.Equal(4, source.Consumed);
    }

    [Fact]
    public void The_draw_after_a_rejection_continues_the_same_stream()
    {
        // Two rejected values, one accepted, then the next draw reads the following raw output.
        var source = new InjectedSource(new ulong[] { 18446744073709551615, 18446744073709551610, 7, 23 });
        Assert.Equal(7UL, BoundedSampler.NextBelow(source, 10));
        Assert.Equal(3UL, BoundedSampler.NextBelow(source, 10));
        Assert.Equal(4, source.Consumed);
    }

    private sealed class InjectedSource(ulong[] values) : IRawSource
    {
        private int _index;

        public int Consumed => _index;

        public ulong Next64()
        {
            if (_index >= values.Length)
            {
                throw new InvalidOperationException("The injected stream is exhausted.");
            }

            return values[_index++];
        }
    }
}
