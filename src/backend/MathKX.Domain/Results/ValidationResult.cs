using System.Globalization;
using System.Text.RegularExpressions;
using MathKX.Domain.Content;

namespace MathKX.Domain.Results;

/// <summary>The capability model's status set. Only the first three are produced by the pilot validator.</summary>
public enum ValidationStatus
{
    Correct,
    Incorrect,
    InvalidResponse,
    PartiallyCorrect,
    ReviewNeeded,
}

public static class ValidationStatusNames
{
    public static string ToWire(this ValidationStatus status) => status switch
    {
        ValidationStatus.Correct => "correct",
        ValidationStatus.Incorrect => "incorrect",
        ValidationStatus.InvalidResponse => "invalid-response",
        ValidationStatus.PartiallyCorrect => "partially-correct",
        ValidationStatus.ReviewNeeded => "review-needed",
        _ => throw new ArgumentOutOfRangeException(nameof(status)),
    };
}

/// <summary>Feedback codes: the registered misconception codes plus the correct and input-guidance codes.</summary>
public static class FeedbackCodes
{
    public const string Correct = "correct";
    public const string OneGroup = "add.oneGroup";
    public const string Concat = "add.concat";
    public const string OffByOne = "add.offByOne";
    public const string Subtracted = "add.subtracted";
    public const string Generic = "add.generic";
    public const string EquationCorrect = "eq.correct";
    public const string EquationAdded = "eq.added";
    public const string EquationTotal = "eq.total";
    public const string EquationAddend = "eq.addend";
    public const string EquationOffByOne = "eq.offByOne";
    public const string EquationGeneric = "eq.generic";
    public const string FactorCorrect = "fac.correct";
    public const string FactorMultiplied = "fac.multiplied";
    public const string FactorTotal = "fac.total";
    public const string FactorSubtracted = "fac.subtracted";
    public const string FactorFactor = "fac.factor";
    public const string FactorOffByOne = "fac.offByOne";
    public const string FactorGeneric = "fac.generic";
    public const string InvalidEmpty = "invalid.empty";
    public const string InvalidNotAnInteger = "invalid.notAnInteger";

    /// <summary>The codes <c>integer-answer@1</c> emits for a wrong answer.</summary>
    public static readonly IReadOnlyList<string> Misconceptions = [OneGroup, Concat, OffByOne, Subtracted, Generic];

    /// <summary>The codes <c>equation-answer@1</c> emits for a wrong answer (specs/009).</summary>
    public static readonly IReadOnlyList<string> EquationMisconceptions = [EquationAdded, EquationTotal, EquationAddend, EquationOffByOne, EquationGeneric];

    /// <summary>The codes <c>factor-answer@1</c> emits for a wrong answer (specs/010).</summary>
    public static readonly IReadOnlyList<string> FactorMisconceptions = [FactorMultiplied, FactorTotal, FactorSubtracted, FactorFactor, FactorOffByOne, FactorGeneric];
}

/// <summary>What the learner submitted. Reading is input guidance, not a mathematical judgement.</summary>
public sealed partial record ResponseArtifact(string Kind, string OriginalText, int? Value)
{
    [GeneratedRegex("^-?[0-9]+$")]
    private static partial Regex Integer();

    public static ResponseArtifact ReadInteger(string? text)
    {
        var original = text ?? string.Empty;
        var trimmed = original.Trim();
        if (trimmed.Length > 0 && Integer().IsMatch(trimmed) && int.TryParse(trimmed, NumberStyles.AllowLeadingSign, CultureInfo.InvariantCulture, out var value))
        {
            return new ResponseArtifact("integer", original, value);
        }

        return new ResponseArtifact("integer", original, null);
    }

    public bool IsEmpty => OriginalText.Trim().Length == 0;
}

/// <summary>Typed result: status, code, the values the feedback text needs, and the validator identity. Never prose.</summary>
public sealed record ValidationResult(
    ValidationStatus Status,
    string Code,
    IReadOnlyDictionary<string, object> Values,
    NamedVersion Validator);
