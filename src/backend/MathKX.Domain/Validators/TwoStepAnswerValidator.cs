using MathKX.Domain.Content;
using MathKX.Domain.Instances;
using MathKX.Domain.Results;

namespace MathKX.Domain.Validators;

/// <summary>
/// <c>two-step-answer@1</c> (specs/011 FR-004): judges an integer as <c>x</c> in <c>ax + c = b</c>, where the instance's
/// A is <c>a</c>, its B is <c>b</c>, and its C is <c>c</c>, with exactly one feedback code in this precedence: correct,
/// not shared (b − c), added first ((b + c) / a), divided first (b / a − c), factor read as an addend (b − c − a), off
/// by one, generic.
/// </summary>
public sealed class TwoStepAnswerValidator : IAnswerValidator
{
    public NamedVersion Identity { get; } = new("two-step-answer", 1);

    public string Form => QuestionForms.TwoStep;

    /// <remarks>Never rounds: an instance without a whole-number x is refused, as for <c>factor-answer@1</c> (PR 64 review).</remarks>
    public int ExpectedAnswer(Instance instance)
    {
        var (a, b, c) = Numbers(instance);
        if (a <= 0 || b - c <= 0 || (b - c) % a != 0)
        {
            throw new InvalidOperationException($"{a}x + {c} = {b} has no whole-number solution of at least 1; the content check should have refused it.");
        }

        return (b - c) / a;
    }

    public ValidationResult Validate(Instance instance, ResponseArtifact artifact)
    {
        if (artifact.Value is not int v)
        {
            var code = artifact.IsEmpty ? FeedbackCodes.InvalidEmpty : FeedbackCodes.InvalidNotAnInteger;
            return new ValidationResult(ValidationStatus.InvalidResponse, code, new Dictionary<string, object> { ["text"] = artifact.OriginalText }, Identity);
        }

        var (a, b, c) = Numbers(instance);
        var x = ExpectedAnswer(instance);
        if (v == x)
        {
            return Result(ValidationStatus.Correct, FeedbackCodes.TwoStepCorrect, a, b, c, v, x);
        }

        // Widened: v spans the whole Int32 range, so products and sums with it can overflow.
        long lv = v;
        var wrong = lv == (long)b - c ? FeedbackCodes.TwoStepNotShared
            : lv * a == (long)b + c ? FeedbackCodes.TwoStepAddedFirst
            : (lv + c) * a == b ? FeedbackCodes.TwoStepDivideFirst
            : lv == (long)b - c - a ? FeedbackCodes.TwoStepFactorAsAddend
            : Math.Abs(lv - x) == 1 ? FeedbackCodes.TwoStepOffByOne
            : FeedbackCodes.TwoStepGeneric;
        return Result(ValidationStatus.Incorrect, wrong, a, b, c, v);
    }

    private static (int A, int B, int C) Numbers(Instance instance) =>
        (instance.A, instance.B, instance.C ?? throw new InvalidOperationException($"{instance.Identity.DefinitionKey} is a two-step question without c."));

    private ValidationResult Result(ValidationStatus status, string code, int a, int b, int c, int v, int? x = null)
    {
        var values = new Dictionary<string, object> { ["a"] = a, ["b"] = b, ["c"] = c, ["v"] = v };
        if (x is int solved)
        {
            values["x"] = solved; // only a correct result carries the solution
        }

        return new ValidationResult(status, code, values, Identity);
    }
}
