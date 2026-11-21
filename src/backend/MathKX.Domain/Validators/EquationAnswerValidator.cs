using MathKX.Domain.Content;
using MathKX.Domain.Instances;
using MathKX.Domain.Results;

namespace MathKX.Domain.Validators;

/// <summary>
/// <c>equation-answer@1</c> (specs/009 FR-002): judges an integer as <c>x</c> in <c>x + a = b</c>, where the
/// instance's A is <c>a</c> and its B is <c>b</c>, with exactly one feedback code in this precedence: correct,
/// added (a + b), total (b), addend (a), off by one, generic.
/// </summary>
public sealed class EquationAnswerValidator : IAnswerValidator
{
    public NamedVersion Identity { get; } = new("equation-answer", 1);

    public string Form => QuestionForms.UnknownAddend;

    public int ExpectedAnswer(Instance instance) => instance.B - instance.A;

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
            return Result(ValidationStatus.Correct, FeedbackCodes.EquationCorrect, a, b, v, x);
        }

        // Widened: v spans the whole Int32 range, so sums and differences with it can overflow.
        var code2 = (long)v == (long)a + b ? FeedbackCodes.EquationAdded
            : v == b ? FeedbackCodes.EquationTotal
            : v == a ? FeedbackCodes.EquationAddend
            : Math.Abs((long)v - x) == 1 ? FeedbackCodes.EquationOffByOne
            : FeedbackCodes.EquationGeneric;
        return Result(ValidationStatus.Incorrect, code2, a, b, v);
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
