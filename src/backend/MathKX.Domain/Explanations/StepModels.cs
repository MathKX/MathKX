using MathKX.Domain.Instances;

namespace MathKX.Domain.Explanations;

public enum StepKind
{
    Help,
    Explanation,
}

public sealed record StepText(string Code, IReadOnlyDictionary<string, object> Values);

/// <summary>
/// One step of guided visual help or of a worked explanation. <see cref="Reveals"/> marks the step that shows
/// the total; only such a step may carry <c>sum</c> in its values or visual state.
/// </summary>
public sealed record StepModel(
    string Kind,
    string Representation,
    int Index,
    int Count,
    bool Reveals,
    IReadOnlyDictionary<string, object> Visual,
    StepText Text);

public sealed class UnsupportedStepsException(string representation, StepKind kind)
    : Exception($"{representation} has no {kind.ToString().ToLowerInvariant()} steps.")
{
    public string Representation { get; } = representation;

    public StepKind Kind { get; } = kind;
}

/// <summary>
/// Deterministic step models per representation (specs/002 research R15, contracts/api.md). The learner app
/// renders the delivered state and computes nothing mathematical; the service delivers one step at a time.
/// </summary>
public static class StepModels
{
    /// <summary>Every text code a step can carry; the learner app's dictionaries must have each one.</summary>
    public static readonly IReadOnlyList<string> TextCodes =
    [
        "explain.groups.show",
        "explain.groups.countFirst",
        "explain.groups.countSecond",
        "explain.groups.countAll",
        "explain.groups.twoGroups",
        "explain.groups.combine",
        "explain.groups.total",
        "explain.makeTen.frame",
        "explain.makeTen.need",
        "explain.makeTen.split",
        "explain.makeTen.total",
    ];

    public static bool TryParseKind(string? text, out StepKind kind)
    {
        switch (text)
        {
            case "help":
                kind = StepKind.Help;
                return true;
            case "explanation":
                kind = StepKind.Explanation;
                return true;
            default:
                kind = default;
                return false;
        }
    }

    /// <summary>The representation the instance lists first for the kind, or null when it lists none.</summary>
    public static string? RepresentationFor(Instance instance, StepKind kind)
    {
        var list = kind == StepKind.Help ? instance.Representations.Help : instance.Representations.Explanation;
        return list.Count > 0 ? list[0] : null;
    }

    public static IReadOnlyList<StepModel> For(Instance instance, string representation, StepKind kind)
    {
        var offered = kind == StepKind.Help ? instance.Representations.Help : instance.Representations.Explanation;
        if (!offered.Contains(representation, StringComparer.Ordinal))
        {
            throw new UnsupportedStepsException(representation, kind);
        }

        var steps = (representation, kind) switch
        {
            ("groups", StepKind.Help) => GroupsHelp(instance),
            ("groups", StepKind.Explanation) => GroupsExplanation(instance),
            ("make-ten", _) => MakeTen(instance),
            _ => throw new UnsupportedStepsException(representation, kind),
        };

        var kindName = kind == StepKind.Help ? "help" : "explanation";
        return steps.Select((s, i) => new StepModel(kindName, representation, i, steps.Count, s.Reveals, s.Visual, s.Text)).ToList();
    }

    private sealed record Raw(bool Reveals, IReadOnlyDictionary<string, object> Visual, StepText Text);

    private static Dictionary<string, object> V(params (string Key, object Value)[] pairs) => pairs.ToDictionary(p => p.Key, p => p.Value, StringComparer.Ordinal);

    private static List<Raw> GroupsHelp(Instance x)
    {
        var (a, b) = (x.A, x.B);
        return
        [
            new(false, V(("countedFirst", 0), ("countedSecond", 0)), new StepText("explain.groups.show", V(("a", a), ("b", b)))),
            new(false, V(("countedFirst", a), ("countedSecond", 0)), new StepText("explain.groups.countFirst", V(("a", a)))),
            new(false, V(("countedFirst", a), ("countedSecond", b)), new StepText("explain.groups.countSecond", V(("b", b)))),
            new(true, V(("countedFirst", a), ("countedSecond", b), ("countedAll", a + b)), new StepText("explain.groups.countAll", V(("a", a), ("b", b), ("sum", a + b)))),
        ];
    }

    private static List<Raw> GroupsExplanation(Instance x)
    {
        var (a, b) = (x.A, x.B);
        return
        [
            new(false, V(("combined", false)), new StepText("explain.groups.twoGroups", V(("a", a), ("b", b)))),
            new(false, V(("combined", true)), new StepText("explain.groups.combine", V(("a", a), ("b", b)))),
            new(true, V(("combined", true), ("countedAll", a + b)), new StepText("explain.groups.total", V(("a", a), ("b", b), ("sum", a + b)))),
        ];
    }

    private static List<Raw> MakeTen(Instance x)
    {
        var (a, b) = (x.A, x.B);
        var need = 10 - a;
        var rest = b - need;
        string[] Frame(int filled, int marked) => Enumerable.Range(0, 10).Select(i => i < filled ? "a" : i < filled + marked ? "b" : "empty").ToArray();
        return
        [
            new(false, V(("frame", Frame(a, 0)), ("loose", b)), new StepText("explain.makeTen.frame", V(("a", a), ("b", b)))),
            new(false, V(("frame", Frame(a, 0)), ("loose", b), ("need", need)), new StepText("explain.makeTen.need", V(("a", a), ("need", need)))),
            new(false, V(("frame", Frame(a, need)), ("loose", rest), ("split", V(("need", need), ("rest", rest)))), new StepText("explain.makeTen.split", V(("a", a), ("b", b), ("need", need), ("rest", rest)))),
            new(true, V(("frame", Frame(a, need)), ("loose", rest), ("split", V(("need", need), ("rest", rest))), ("total", a + b)), new StepText("explain.makeTen.total", V(("ten", 10), ("rest", rest), ("sum", a + b)))),
        ];
    }
}
