namespace MathKX.Domain.Explanations;

/// <summary>Which pan of the balance is lower, or neither.</summary>
public enum BalanceTilt
{
    Balanced,
    LeftDown,
    RightDown,
}

/// <summary>
/// One state of the balance explorer for <c>x + a = b</c>: the unit weights still on each pan, which way the
/// scale tips, and whether the unknown stands alone on a balanced scale. The unknown always stays on the left.
/// </summary>
public sealed record BalanceState(int Left, int Right, BalanceTilt Tilt, bool Solved);

/// <summary>
/// The lesson's balance explorer (specs/008). The learner takes unit weights off either pan; the domain supplies
/// every reachable state, so the app computes no mathematics. The unknown weighs <c>b − a</c>, which the
/// app learns only from the solved state.
/// </summary>
public static class BalanceExplorer
{
    public const int MinAdded = 1;
    public const int MaxAdded = 9;
    public const int MaxTotal = 15;

    /// <summary>True when <c>x + a = b</c> has a whole-number solution of at least 1 that the explorer can draw.</summary>
    public static bool Supports(int a, int b) => a is >= MinAdded and <= MaxAdded && b <= MaxTotal && b - a >= 1;

    /// <summary>Every state from the start (a on the left, b on the right) down to empty pans, left-major.</summary>
    public static IReadOnlyList<BalanceState> States(int a, int b)
    {
        if (!Supports(a, b))
        {
            throw new ArgumentOutOfRangeException(nameof(b), $"The balance explorer cannot show x + {a} = {b}.");
        }

        var unknown = b - a;
        var states = new List<BalanceState>((a + 1) * (b + 1));
        for (var left = a; left >= 0; left--)
        {
            for (var right = b; right >= 0; right--)
            {
                var difference = unknown + left - right;
                var tilt = difference == 0 ? BalanceTilt.Balanced : difference > 0 ? BalanceTilt.LeftDown : BalanceTilt.RightDown;
                states.Add(new BalanceState(left, right, tilt, left == 0 && tilt == BalanceTilt.Balanced));
            }
        }

        return states;
    }
}
