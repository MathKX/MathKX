using MathKX.Domain.Random;

namespace MathKX.Domain.Tests.Random;

public sealed class SeedTests
{
    [Theory]
    [InlineData("0", 0UL)]
    [InlineData("1", 1UL)]
    [InlineData("42", 42UL)]
    [InlineData("1234567890123456789", 1234567890123456789UL)]
    [InlineData("18446744073709551615", ulong.MaxValue)]
    public void Parses_decimal_strings_within_range(string text, ulong expected)
    {
        Assert.Equal(expected, Seed.Parse(text).Value);
        Assert.True(Seed.TryParse(text, out var seed));
        Assert.Equal(expected, seed.Value);
    }

    [Theory]
    [InlineData("-1")]
    [InlineData("01")]
    [InlineData("abc")]
    [InlineData("18446744073709551616")]
    [InlineData("+5")]
    [InlineData(" 5")]
    [InlineData("5 ")]
    [InlineData("")]
    [InlineData("1_000")]
    [InlineData("1e3")]
    public void Rejects_anything_outside_the_grammar_or_range(string text)
    {
        Assert.False(Seed.TryParse(text, out _));
        Assert.Throws<FormatException>(() => Seed.Parse(text));
    }

    [Theory]
    [InlineData(0UL, "0")]
    [InlineData(7UL, "7")]
    [InlineData(ulong.MaxValue, "18446744073709551615")]
    public void Formats_as_a_plain_decimal_string(ulong value, string expected)
    {
        Assert.Equal(expected, new Seed(value).Format());
        Assert.Equal(expected, new Seed(value).ToString());
    }
}
