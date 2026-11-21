using MathKX.Domain.Explanations;

namespace MathKX.Domain.Tests.Explanations;

/// <summary>specs/008: the balance explorer's states for x + a = b come from the domain.</summary>
public sealed class BalanceExplorerTests
{
    [Fact]
    public void The_start_is_balanced_and_unsolved()
    {
        var start = BalanceExplorer.States(3, 7)[0];
        Assert.Equal(new BalanceState(3, 7, BalanceTilt.Balanced, false), start);
    }

    [Fact]
    public void Every_pair_of_remaining_weights_has_exactly_one_state()
    {
        var states = BalanceExplorer.States(3, 7);
        Assert.Equal(4 * 8, states.Count);
        Assert.Equal(states.Count, states.Select(s => (s.Left, s.Right)).Distinct().Count());
    }

    [Theory]
    [InlineData(3, 7, 2, 6, BalanceTilt.Balanced)]
    [InlineData(3, 7, 2, 7, BalanceTilt.RightDown)]
    [InlineData(3, 7, 3, 6, BalanceTilt.LeftDown)]
    [InlineData(3, 7, 0, 0, BalanceTilt.LeftDown)]
    [InlineData(1, 2, 0, 2, BalanceTilt.RightDown)]
    public void The_scale_tips_toward_the_heavier_pan(int a, int b, int left, int right, BalanceTilt tilt)
    {
        var state = BalanceExplorer.States(a, b).Single(s => s.Left == left && s.Right == right);
        Assert.Equal(tilt, state.Tilt);
    }

    [Fact]
    public void Only_the_unknown_alone_on_a_balanced_scale_is_solved_and_its_right_pan_is_the_solution()
    {
        for (var a = 1; a <= 9; a++)
        {
            for (var b = a + 1; b <= 15; b++)
            {
                var solved = Assert.Single(BalanceExplorer.States(a, b), s => s.Solved);
                Assert.Equal((0, b - a, BalanceTilt.Balanced), (solved.Left, solved.Right, solved.Tilt));
            }
        }
    }

    [Theory]
    [InlineData(0, 5)]
    [InlineData(10, 15)]
    [InlineData(4, 4)]
    [InlineData(5, 3)]
    [InlineData(3, 16)]
    public void Values_outside_the_explorer_are_refused(int a, int b)
    {
        Assert.False(BalanceExplorer.Supports(a, b));
        Assert.Throws<ArgumentOutOfRangeException>(() => BalanceExplorer.States(a, b));
    }
}
