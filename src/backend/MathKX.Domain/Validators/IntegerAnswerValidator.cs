using System.Globalization;
using MathKX.Domain.Content;
using MathKX.Domain.Instances;
using MathKX.Domain.Results;

namespace MathKX.Domain.Validators;

/// <summary>
/// <c>integer-answer@1</c> (specs/002 contracts/validation-result.md): judges an integer against <c>a + b</c>
/// with exactly one feedback code chosen in the contract's precedence order.
/// </summary>
public sealed class IntegerAnswerValidator
{
    public static readonly NamedVersion Identity = new("integer-answer", 1);

    public string Name => Identity.Name;

    public int Version => Identity.Version;

    public ValidationResult Validate(Instance instance, ResponseArtifact artifact)
    {
        if (artifact.Value is not int v)
        {
            var code = artifact.IsEmpty ? FeedbackCodes.InvalidEmpty : FeedbackCodes.InvalidNotAnInteger;
            return new ValidationResult(ValidationStatus.InvalidResponse, code, new Dictionary<string, object> { ["text"] = artifact.OriginalText }, Identity);
        }

        var a = instance.A;
        var b = instance.B;
        var sum = a + b;
        if (v == sum)
        {
            return Result(ValidationStatus.Correct, FeedbackCodes.Correct, a, b, v, sum);
        }

        if (v == a || v == b)
        {
            return Result(ValidationStatus.Incorrect, FeedbackCodes.OneGroup, a, b, v);
        }

        var concatenated = string.Create(CultureInfo.InvariantCulture, $"{a}{b}");
        if (v.ToString(CultureInfo.InvariantCulture) == concatenated)
        {
            return Result(ValidationStatus.Incorrect, FeedbackCodes.Concat, a, b, v);
        }

        if (Math.Abs((long)v - sum) == 1) // widened: v spans the whole Int32 range, so the Int32 difference can overflow
        {
            return Result(ValidationStatus.Incorrect, FeedbackCodes.OffByOne, a, b, v);
        }

        if (v == Math.Abs(a - b))
        {
            return Result(ValidationStatus.Incorrect, FeedbackCodes.Subtracted, a, b, v);
        }

        return Result(ValidationStatus.Incorrect, FeedbackCodes.Generic, a, b, v);
    }

    private static ValidationResult Result(ValidationStatus status, string code, int a, int b, int v, int? sum = null)
    {
        var values = new Dictionary<string, object> { ["a"] = a, ["b"] = b, ["v"] = v };
        if (sum is int s)
        {
            values["sum"] = s; // only a correct result carries the sum (the completed equation)
        }

        return new ValidationResult(status, code, values, Identity);
    }
}
