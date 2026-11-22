namespace MathKX.Domain.Explanations;

/// <summary>
/// One state of the two-step explorer for <c>ax + c = b</c> (specs/011 FR-003): the loose weights still beside the
/// boxes on the left, the weights on the right, the weights in each of the <c>a</c> groups, the right's weights not
/// shared yet, and whether one box and one group are kept. Every move keeps the scale level.
/// </summary>
public sealed record TwoStepState(int Left, int Right, int Each, int Loose, bool Kept, bool Solved);

/// <summary>
/// The lesson's two-step explorer (specs/011 FR-002, FR-003). The learner takes one loose weight off both pans at a
/// time until the boxes stand alone, then shares the right pan into equal groups and keeps one box and one group.
/// The domain supplies every state, so the app computes no mathematics.
/// </summary>
public static class TwoStepExplorer
{
    public const int MinFactor = 2;
    public const int MaxFactor = 3;
    public const int MaxAddend = 6;
    public const int MaxUnknown = 5;

    /// <summary>True when <c>ax + c = b</c> has a whole-number solution from 1 to 5 that the explorer can draw.</summary>
    public static bool Supports(int a, int c, int b) =>
        a is >= MinFactor and <= MaxFactor && c is >= 1 and <= MaxAddend && b - c > 0 && (b - c) % a == 0 && (b - c) / a is >= 1 and <= MaxUnknown;

    /// <summary>The states: the loose weights taken off one at a time, then the sharing round by round, then the kept state.</summary>
    public static IReadOnlyList<TwoStepState> States(int a, int c, int b)
    {
        if (!Supports(a, c, b))
        {
            throw new ArgumentOutOfRangeException(nameof(b), $"The two-step explorer cannot show {a}x + {c} = {b}.");
        }

        var rest = b - c;
        var x = rest / a;
        var states = new List<TwoStepState>(c + x + 2);
        for (var removed = 0; removed < c; removed++)
        {
            states.Add(new TwoStepState(c - removed, b - removed, 0, b - removed, false, false));
        }

        for (var each = 0; each <= x; each++)
        {
            states.Add(new TwoStepState(0, rest, each, rest - (a * each), false, false));
        }

        states.Add(new TwoStepState(0, rest, x, 0, true, true));
        return states;
    }
}
