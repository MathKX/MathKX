using System.Globalization;
using System.Text.RegularExpressions;
using MathKX.Domain.Instances;
using MathKX.Domain.Validators;

namespace MathKX.Domain.Lessons;

public enum DisclosureSource
{
    None,
    Expression,
    Visual,
}

public sealed record DisclosureDecision(bool Discloses, DisclosureSource Where)
{
    public static DisclosureDecision No { get; } = new(false, DisclosureSource.None);
}

/// <summary>
/// Does a lesson show this question's answer? DL-026 (2) as the prototype's lessonDisclosure settled it for
/// addition (specs/003 contracts/disclosure.md). Only the decision leaves the service, never the sum.
/// </summary>
public static partial class LessonDisclosure
{
    /// <summary>Visual types that step to the total for their values; the ten-frame explorer is never one.</summary>
    private static readonly HashSet<string> WorkedVisuals = new(StringComparer.Ordinal) { "make-ten", "groups" };

    public static DisclosureDecision For(LessonFacts facts, Instance instance)
    {
        if (instance.Form == QuestionForms.UnknownAddend)
        {
            return ForEquation(facts, instance.A, instance.B);
        }

        var (a, b) = (instance.A, instance.B);
        var sum = (a + b).ToString(CultureInfo.InvariantCulture);
        string[] starts =
        [
            string.Create(CultureInfo.InvariantCulture, $"{a}+{b}"),
            string.Create(CultureInfo.InvariantCulture, $"{b}+{a}"),
        ];

        foreach (var expression in facts.Expressions)
        {
            var parts = expression.Normalized.Split('=');
            if (parts.Length > 1 && starts.Contains(parts[0], StringComparer.Ordinal) && parts[^1] == sum)
            {
                return new DisclosureDecision(true, DisclosureSource.Expression);
            }
        }

        foreach (var visual in facts.Visuals)
        {
            if (WorkedVisuals.Contains(visual.Type)
                && visual.Attributes.TryGetValue("a", out var va)
                && visual.Attributes.TryGetValue("b", out var vb)
                && ((va == a && vb == b) || (va == b && vb == a)))
            {
                return new DisclosureDecision(true, DisclosureSource.Visual);
            }
        }

        return DisclosureDecision.No;
    }

    /// <summary>
    /// <c>x + a = b</c> (specs/009 FR-006): a balance explorer with the same a and b steps to the solution; and a
    /// lesson shows it when <c>x = b − a</c> follows this equation before another equation <c>x + c = d</c> begins, in
    /// document order. A solution belongs to the equation it follows, so <c>x = 4</c> in the worked example for
    /// <c>x + 3 = 7</c> does not disclose <c>x + 6 = 10</c> from a later list (PR 63 review).
    /// </summary>
    private static DisclosureDecision ForEquation(LessonFacts facts, int a, int b)
    {
        (int A, int B)? solving = null;
        foreach (var expression in facts.Expressions)
        {
            var normalized = expression.Normalized;
            var equation = EquationPattern().Match(normalized);
            if (equation.Success)
            {
                solving = (Number(equation.Groups[1].Value), Number(equation.Groups[2].Value));
                continue;
            }

            var solution = SolutionPattern().Match(normalized);
            if (solution.Success && solving == (a, b) && Number(solution.Groups[1].Value) == b - a)
            {
                return new DisclosureDecision(true, DisclosureSource.Expression);
            }
        }

        foreach (var visual in facts.Visuals)
        {
            if (visual.Type == "balance-explorer"
                && visual.Attributes.TryGetValue("a", out var va) && va == a
                && visual.Attributes.TryGetValue("b", out var vb) && vb == b)
            {
                return new DisclosureDecision(true, DisclosureSource.Visual);
            }
        }

        return DisclosureDecision.No;
    }

    private static int Number(string digits) =>
        int.TryParse(digits, NumberStyles.None, CultureInfo.InvariantCulture, out var n) ? n : -1;

    [GeneratedRegex(@"^x\+([0-9]{1,9})=([0-9]{1,9})$", RegexOptions.CultureInvariant)]
    private static partial Regex EquationPattern();

    [GeneratedRegex(@"^x+=([0-9]{1,9})$", RegexOptions.CultureInvariant)]
    private static partial Regex SolutionPattern();

    /// <summary>A lesson discloses when any translation does; an expression anywhere wins over a visual.</summary>
    public static DisclosureDecision For(IEnumerable<LessonFacts> translations, Instance instance)
    {
        var decisions = translations.Select(t => For(t, instance)).Where(d => d.Discloses).ToList();
        if (decisions.Count == 0)
        {
            return DisclosureDecision.No;
        }

        return decisions.Any(d => d.Where == DisclosureSource.Expression) ? new(true, DisclosureSource.Expression) : new(true, DisclosureSource.Visual);
    }
}
