using MathKX.Domain.Content;
using MathKX.Domain.Instances;
using MathKX.Domain.Results;

namespace MathKX.Domain.Validators;

/// <summary>
/// <c>factor-answer@1</c> (specs/010 FR-003): judges an integer as <c>x</c> in <c>ax = b</c>, where the instance's A
/// is <c>a</c> and its B is <c>b</c>, with exactly one feedback code in this precedence: correct, multiplied
/// (a · b), total (b), subtracted (b − a), factor (a), off by one, generic.
/// </summary>
public sealed class FactorAnswerValidator : IAnswerValidator
{
    public NamedVersion Identity { get; } = new("factor-answer", 1);

    public string Form => QuestionForms.UnknownFactor;

    public int ExpectedAnswer(Instance instance) => instance.B / instance.A;

    public ValidationResult Validate(Instance instance, ResponseArtifact artifact)
    {
        if (artifact.Value is not int v)
        {
            var code = artifact.IsEmpty ? FeedbackCodes.InvalidEmpty : FeedbackCodes.InvalidNotAnInteger;
            return new ValidationResult(ValidationStatus.InvalidResponse, code, new Dictionary<string, object> { ["text"] = artifact.OriginalText }, Identity);
        }

        var (a, b) = (instance.A, instance.B);
        var x = ExpectedAnswer(instance);
        if (v == x)
        {
            return Result(ValidationStatus.Correct, FeedbackCodes.FactorCorrect, a, b, v, x);
        }

        // Widened: v spans the whole Int32 range, so products and differences with it can overflow.
        var wrong = (long)v == (long)a * b ? FeedbackCodes.FactorMultiplied
            : v == b ? FeedbackCodes.FactorTotal
            : (long)v == (long)b - a ? FeedbackCodes.FactorSubtracted
            : v == a ? FeedbackCodes.FactorFactor
            : Math.Abs((long)v - x) == 1 ? FeedbackCodes.FactorOffByOne
            : FeedbackCodes.FactorGeneric;
        return Result(ValidationStatus.Incorrect, wrong, a, b, v);
    }

    private ValidationResult Result(ValidationStatus status, string code, int a, int b, int v, int? x = null)
    {
        var values = new Dictionary<string, object> { ["a"] = a, ["b"] = b, ["v"] = v };
        if (x is int solved)
        {
            values["x"] = solved; // only a correct result carries the solution
        }

        return new ValidationResult(status, code, values, Identity);
    }
}
