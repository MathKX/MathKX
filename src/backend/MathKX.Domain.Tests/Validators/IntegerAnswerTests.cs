using MathKX.Content;
using MathKX.Domain.Content;
using MathKX.Domain.Instances;
using MathKX.Domain.Results;
using MathKX.Domain.Tests.Content;
using MathKX.Domain.Validators;

namespace MathKX.Domain.Tests.Validators;

public sealed class IntegerAnswerTests
{
    private static readonly IntegerAnswerValidator Validator = new();

    private static Instance InstanceOf(int a, int b) => new(
        new InstanceIdentity("numbers.addition.within-10", 1, null),
        "numbers.addition-within-20",
        a,
        b,
        new RepresentationRoles(["groups"], ["groups"]),
        new NamedVersion("addition-pair", 1),
        new NamedVersion("integer-answer", 1));

    [Theory]
    [InlineData(" 8 ", 8)]
    [InlineData("08", 8)]
    [InlineData("-3", -3)]
    [InlineData("0", 0)]
    public void Reads_integers_with_whitespace_and_leading_zeros(string text, int expected)
    {
        Assert.Equal(expected, ResponseArtifact.ReadInteger(text).Value);
    }

    [Theory]
    [InlineData("", FeedbackCodes.InvalidEmpty)]
    [InlineData("   ", FeedbackCodes.InvalidEmpty)]
    [InlineData("abc", FeedbackCodes.InvalidNotAnInteger)]
    [InlineData("7,5", FeedbackCodes.InvalidNotAnInteger)]
    [InlineData("7.5", FeedbackCodes.InvalidNotAnInteger)]
    [InlineData("1 3", FeedbackCodes.InvalidNotAnInteger)]
    [InlineData("+8", FeedbackCodes.InvalidNotAnInteger)]
    public void Unreadable_input_is_input_guidance_not_a_retry(string text, string code)
    {
        var result = Validator.Validate(InstanceOf(4, 4), ResponseArtifact.ReadInteger(text));

        Assert.Equal(ValidationStatus.InvalidResponse, result.Status);
        Assert.Equal(code, result.Code);
        Assert.Equal(text, result.Values["text"]);
        Assert.False(result.Values.ContainsKey("sum"));
    }

    [Theory]
    [InlineData(4, 4, 8, ValidationStatus.Correct, FeedbackCodes.Correct)]
    [InlineData(3, 5, 3, ValidationStatus.Incorrect, FeedbackCodes.OneGroup)]
    [InlineData(3, 5, 5, ValidationStatus.Incorrect, FeedbackCodes.OneGroup)]
    [InlineData(3, 5, 35, ValidationStatus.Incorrect, FeedbackCodes.Concat)]
    [InlineData(3, 5, 9, ValidationStatus.Incorrect, FeedbackCodes.OffByOne)]
    [InlineData(3, 5, 7, ValidationStatus.Incorrect, FeedbackCodes.OffByOne)]
    [InlineData(3, 5, 2, ValidationStatus.Incorrect, FeedbackCodes.Subtracted)]
    [InlineData(8, 5, 3, ValidationStatus.Incorrect, FeedbackCodes.Subtracted)]
    [InlineData(3, 5, 20, ValidationStatus.Incorrect, FeedbackCodes.Generic)]
    [InlineData(3, 5, -2, ValidationStatus.Incorrect, FeedbackCodes.Generic)]
    [InlineData(1, 2, 1, ValidationStatus.Incorrect, FeedbackCodes.OneGroup)] // oneGroup before offByOne
    public void Chooses_exactly_one_code_in_precedence_order(int a, int b, int answer, ValidationStatus status, string code)
    {
        var result = Validator.Validate(InstanceOf(a, b), ResponseArtifact.ReadInteger(answer.ToString(System.Globalization.CultureInfo.InvariantCulture)));

        Assert.Equal(status, result.Status);
        Assert.Equal(code, result.Code);
        Assert.Equal(a, result.Values["a"]);
        Assert.Equal(b, result.Values["b"]);
        Assert.Equal(answer, result.Values["v"]);
        Assert.Equal(status == ValidationStatus.Correct, result.Values.ContainsKey("sum"));
        if (status == ValidationStatus.Correct)
        {
            Assert.Equal(a + b, result.Values["sum"]);
        }
    }

    [Fact]
    public void Is_deterministic()
    {
        var first = Validator.Validate(InstanceOf(8, 5), ResponseArtifact.ReadInteger("12"));
        var second = Validator.Validate(InstanceOf(8, 5), ResponseArtifact.ReadInteger("12"));
        Assert.Equal(first.Code, second.Code);
        Assert.Equal(first.Status, second.Status);
        Assert.Equal(first.Values, second.Values);
    }

    [Fact]
    public void Agrees_with_the_registry_entry()
    {
        var catalog = ContentLoader.Load(RepositoryContent.Root);
        var entry = catalog.Validators["integer-answer@1"];
        Assert.Equal(Validator.Name, entry.Name);
        Assert.Equal(Validator.Version, entry.Version);
        Assert.Equal("integer", entry.Artifact.Type);
        Assert.Equal(FeedbackCodes.Misconceptions.OrderBy(c => c, StringComparer.Ordinal), entry.Emits.OrderBy(c => c, StringComparer.Ordinal));
        foreach (var code in entry.Emits)
        {
            Assert.True(catalog.MisconceptionCodes.ContainsKey(code), $"{code} is emitted but not registered");
        }
    }
}
