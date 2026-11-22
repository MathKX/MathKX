namespace MathKX.Domain.Explanations;

/// <summary>
/// One state of the sharing explorer for <c>ax = b</c> (specs/010): the weights in each of the <c>a</c> groups, the
/// weights not shared yet, and whether one box and one group are kept. The scale stays level throughout: sharing
/// only regroups the right pan, and keeping one part of each side divides both sides by <c>a</c>.
/// </summary>
public sealed record SharingState(int Each, int Loose, bool Kept, bool Solved);

/// <summary>
/// The lesson's sharing explorer (specs/010 FR-001, FR-002). The learner gives each group one weight at a time, then
/// keeps one box and one group; the domain supplies every state, so the app computes no mathematics.
/// </summary>
public static class SharingExplorer
{
    public const int MinFactor = 2;
    public const int MaxFactor = 4;
    public const int MaxUnknown = 5;

    /// <summary>True when <c>ax = b</c> has a whole-number solution from 1 to 5 that the explorer can draw.</summary>
    public static bool Supports(int a, int b) =>
        a is >= MinFactor and <= MaxFactor && b > 0 && b % a == 0 && b / a is >= 1 and <= MaxUnknown;

    /// <summary>The states from the start (nothing shared) to everything shared, then the kept state.</summary>
    public static IReadOnlyList<SharingState> States(int a, int b)
    {
        if (!Supports(a, b))
        {
            throw new ArgumentOutOfRangeException(nameof(b), $"The sharing explorer cannot show {a}x = {b}.");
        }

        var x = b / a;
        var states = new List<SharingState>(x + 2);
        for (var each = 0; each <= x; each++)
        {
            states.Add(new SharingState(each, b - (a * each), false, false));
        }

        states.Add(new SharingState(x, 0, true, true));
        return states;
    }
}
