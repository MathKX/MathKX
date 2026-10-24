namespace MathKX.Domain.Explanations;

/// <summary>One state of the ten-frame explorer: how many places are filled and how many are missing to make ten.</summary>
public sealed record TenFrameExplorerState(int Filled, int Partner);

/// <summary>
/// The lesson's ten-frame explorer (specs/003 FR-007, research R5). The learner chooses the number; the domain
/// supplies the pairs, so the app computes no mathematics.
/// </summary>
public static class TenFrameExplorer
{
    public static IReadOnlyList<TenFrameExplorerState> States() =>
        Enumerable.Range(0, 11).Select(filled => new TenFrameExplorerState(filled, 10 - filled)).ToList();
}
