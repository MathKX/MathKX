using MathKX.Content;
using MathKX.Domain.Content;
using MathKX.Domain.Instances;
using MathKX.Domain.Results;
using MathKX.Domain.Tests.Content;
using MathKX.Domain.Validators;

namespace MathKX.Domain.Tests.Validators;

/// <summary><c>equation-answer@1</c> (specs/009 FR-002): x in x + a = b, with one code in the stated precedence.</summary>
public sealed class EquationAnswerTests
{
    private static readonly EquationAnswerValidator Validator = new();

    private static Instance Equation(int a, int b) => new(
        new InstanceIdentity("algebra.one-step.within-10", 1, null),
        "algebra.one-step-equations",
        a,
        b,
        new RepresentationRoles(["balance"], ["balance"]),
        new NamedVersion("unknown-addend", 1),
        new NamedVersion("equation-answer", 1),
        QuestionForms.UnknownAddend);

    private static ValidationResult Judge(int a, int b, string text) => Validator.Validate(Equation(a, b), ResponseArtifact.ReadInteger(text));

    [Theory]
    [InlineData(2, 9, "7", FeedbackCodes.EquationCorrect)]
    [InlineData(2, 9, "11", FeedbackCodes.EquationAdded)]
    [InlineData(2, 9, "9", FeedbackCodes.EquationTotal)]
    [InlineData(2, 9, "2", FeedbackCodes.EquationAddend)]
    [InlineData(2, 9, "6", FeedbackCodes.EquationOffByOne)]
    [InlineData(2, 9, "8", FeedbackCodes.EquationOffByOne)]
    [InlineData(2, 9, "4", FeedbackCodes.EquationGeneric)]
    [InlineData(4, 8, "4", FeedbackCodes.EquationCorrect)] // a = x: the correct answer wins over "the addend"
    [InlineData(1, 5, "5", FeedbackCodes.EquationTotal)] // b is also one away from x = 4: "the total" comes first
    [InlineData(2, 9, "2147483647", FeedbackCodes.EquationGeneric)] // no overflow
    [InlineData(2, 9, "-2147483648", FeedbackCodes.EquationGeneric)]
    public void Chooses_one_code_in_precedence_order(int a, int b, string text, string code)
    {
        Assert.Equal(code, Judge(a, b, text).Code);
    }

    [Fact]
    public void Only_a_correct_result_carries_x()
    {
        var correct = Judge(3, 7, "4");
        Assert.Equal(ValidationStatus.Correct, correct.Status);
        Assert.Equal(4, correct.Values["x"]);
        Assert.Equal(new NamedVersion("equation-answer", 1), correct.Validator);

        var wrong = Judge(3, 7, "10");
        Assert.Equal(ValidationStatus.Incorrect, wrong.Status);
        Assert.False(wrong.Values.ContainsKey("x"));
        Assert.Equal(10, wrong.Values["v"]);
    }

    [Theory]
    [InlineData("", FeedbackCodes.InvalidEmpty)]
    [InlineData("x", FeedbackCodes.InvalidNotAnInteger)]
    public void Input_guidance_is_the_same_as_for_addition(string text, string code)
    {
        var result = Judge(3, 7, text);
        Assert.Equal(ValidationStatus.InvalidResponse, result.Status);
        Assert.Equal(code, result.Code);
    }

    [Fact]
    public void Expects_b_minus_a_and_asks_the_unknown_addend()
    {
        Assert.Equal(4, Validator.ExpectedAnswer(Equation(3, 7)));
        Assert.Equal(QuestionForms.UnknownAddend, Validator.Form);
        Assert.Equal("x + 3 = 7", Equation(3, 7).Prompt);
    }

    [Fact]
    public void The_registry_implements_every_registered_validator_and_agrees_with_its_entry()
    {
        var catalog = ContentLoader.Load(RepositoryContent.Root);
        var registry = ValidatorRegistry.Default();
        Assert.Equal(catalog.Validators.Keys.Order(StringComparer.Ordinal), registry.Keys.Order(StringComparer.Ordinal));

        var entry = catalog.Validators["equation-answer@1"];
        Assert.Equal("integer", entry.Artifact.Type);
        Assert.Equal(FeedbackCodes.EquationMisconceptions.Order(StringComparer.Ordinal), entry.Emits.Order(StringComparer.Ordinal));
        Assert.All(entry.Emits, code => Assert.Equal("equation-answer", catalog.MisconceptionCodes[code].Validator));
        Assert.Throws<UnknownValidatorException>(() => registry.Get(new NamedVersion("equation-answer", 2)));
    }
}
