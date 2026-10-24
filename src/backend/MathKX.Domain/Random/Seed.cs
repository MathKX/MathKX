using System.Globalization;
using System.Text.RegularExpressions;

namespace MathKX.Domain.Random;

/// <summary>
/// A generation seed: an unsigned 64-bit integer, serialized as a plain decimal string
/// (docs/architecture/proposals/seed-and-random-source.md). Never a JSON number.
/// </summary>
public readonly partial record struct Seed(ulong Value)
{
    [GeneratedRegex("^(0|[1-9][0-9]*)$")]
    private static partial Regex Grammar();

    /// <summary>Parses the decimal form; throws <see cref="FormatException"/> outside the grammar or range.</summary>
    public static Seed Parse(string text)
    {
        if (!TryParse(text, out var seed))
        {
            throw new FormatException($"'{text}' is not a seed: expected a decimal string matching ^(0|[1-9][0-9]*)$ within the unsigned 64-bit range.");
        }

        return seed;
    }

    public static bool TryParse(string? text, out Seed seed)
    {
        seed = default;
        if (text is null || !Grammar().IsMatch(text))
        {
            return false;
        }

        if (!ulong.TryParse(text, NumberStyles.None, CultureInfo.InvariantCulture, out var value))
        {
            return false;
        }

        seed = new Seed(value);
        return true;
    }

    public string Format() => Value.ToString(CultureInfo.InvariantCulture);

    public override string ToString() => Format();
}
