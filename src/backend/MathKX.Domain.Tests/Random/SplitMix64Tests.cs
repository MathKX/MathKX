using MathKX.Domain.Random;

namespace MathKX.Domain.Tests.Random;

/// <summary>Raw-output vectors from docs/architecture/proposals/seed-and-random-source.md.</summary>
public sealed class SplitMix64Tests
{
    public static TheoryData<ulong, ulong, ulong, ulong> RawVectors => new()
    {
        { 0UL, 16294208416658607535UL, 7960286522194355700UL, 487617019471545679UL },
        { 1UL, 10451216379200822465UL, 13757245211066428519UL, 17911839290282890590UL },
        { 42UL, 13679457532755275413UL, 2949826092126892291UL, 5139283748462763858UL },
        { 1234567890123456789UL, 11026200465730903474UL, 8137580871910607288UL, 8574954778522941295UL },
        { 18446744073709551615UL, 16490336266968443936UL, 16834447057089888969UL, 4048727598324417001UL },
    };

    [Theory]
    [MemberData(nameof(RawVectors))]
    public void Produces_the_proposals_raw_outputs(ulong seed, ulong first, ulong second, ulong third)
    {
        var source = new SplitMix64(new Seed(seed));

        Assert.Equal(first, source.Next64());
        Assert.Equal(second, source.Next64());
        Assert.Equal(third, source.Next64());
    }

    [Fact]
    public void Hex_forms_of_the_first_outputs_match_the_proposal()
    {
        Assert.Equal(0xE220A8397B1DCDAFUL, new SplitMix64(new Seed(0)).Next64());
        Assert.Equal(0x910A2DEC89025CC1UL, new SplitMix64(new Seed(1)).Next64());
        Assert.Equal(0xBDD732262FEB6E95UL, new SplitMix64(new Seed(42)).Next64());
    }

    [Fact]
    public void A_fresh_stream_per_seed_repeats_exactly()
    {
        var a = new SplitMix64(new Seed(42));
        var b = new SplitMix64(new Seed(42));
        for (var i = 0; i < 1000; i++)
        {
            Assert.Equal(a.Next64(), b.Next64());
        }
    }

    [Fact]
    public void State_wraps_modulo_two_to_the_sixty_four()
    {
        // From the maximum seed the first state addition wraps; the published vector covers it.
        var source = new SplitMix64(new Seed(ulong.MaxValue));
        Assert.Equal(16490336266968443936UL, source.Next64());
        // Continuing past the wrap keeps producing values without throwing (checked arithmetic would).
        for (var i = 0; i < 10_000; i++)
        {
            _ = source.Next64();
        }
    }
}
