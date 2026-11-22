using MathKX.Content;
using MathKX.Domain.Content;
using MathKX.Domain.Explanations;
using MathKX.Domain.Generators;
using MathKX.Domain.Instances;
using MathKX.Domain.Lessons;
using MathKX.Domain.Random;
using MathKX.Domain.Results;
using MathKX.Domain.Tests.Content;
using MathKX.Domain.Validators;

namespace MathKX.Domain.Tests.Explanations;

/// <summary>ax = b (specs/010): the sharing explorer, the generator, the validator, the balance steps, and disclosure.</summary>
public sealed class SharingTests
{
    private static readonly ContentCatalog Catalog = ContentLoader.Load(RepositoryContent.Root);
    private static readonly FactorAnswerValidator Validator = new();

    private static Instance Equation(int a, int b) => new(
        new InstanceIdentity("algebra.one-step.times", 1, null),
        "algebra.one-step-equations",
        a,
        b,
        new RepresentationRoles(["balance-sharing"], ["balance-sharing"]),
        new NamedVersion("unknown-factor", 1),
        new NamedVersion("factor-answer", 1),
        QuestionForms.UnknownFactor);

    [Fact]
    public void The_explorer_shares_one_round_at_a_time_then_keeps_one_part_of_each_side()
    {
        var states = SharingExplorer.States(3, 12);
        Assert.Equal(
            [new SharingState(0, 12, false, false), new SharingState(1, 9, false, false), new SharingState(2, 6, false, false), new SharingState(3, 3, false, false), new SharingState(4, 0, false, false), new SharingState(4, 0, true, true)],
            states);
    }

    [Theory]
    [InlineData(3, 12, true)]
    [InlineData(2, 2, true)]
    [InlineData(4, 20, true)]
    [InlineData(3, 10, false)] // no whole-number solution
    [InlineData(1, 5, false)] // one box: nothing to share
    [InlineData(5, 10, false)] // more boxes than the pan draws
    [InlineData(2, 12, false)] // x = 6
    [InlineData(3, 0, false)]
    public void Supports_whole_solutions_from_1_to_5_with_2_to_4_boxes(int a, int b, bool supported)
    {
        Assert.Equal(supported, SharingExplorer.Supports(a, b));
        if (!supported)
        {
            Assert.Throws<ArgumentOutOfRangeException>(() => SharingExplorer.States(a, b));
        }
    }

    [Fact]
    public void The_definition_has_15_questions_a_ascending_then_x()
    {
        var pool = new UnknownFactorGenerator().Enumerate(Catalog.Definitions["algebra.one-step.times@1"]);
        Assert.Equal(15, pool.Count);
        Assert.Equal((2, 2), pool[0]);
        Assert.Equal((2, 4), pool[1]);
        Assert.Equal((4, 20), pool[^1]);
        Assert.All(pool, q => Assert.True(SharingExplorer.Supports(q.A, q.B)));
        Assert.All(QuestionPool.For(Catalog.Definitions["algebra.one-step.times@1"], GeneratorRegistry.Default()).Questions, q => Assert.NotNull(q.Seed));
    }

    [Theory]
    [InlineData(3, 12, "4", FeedbackCodes.FactorCorrect)]
    [InlineData(3, 12, "36", FeedbackCodes.FactorMultiplied)]
    [InlineData(3, 12, "12", FeedbackCodes.FactorTotal)]
    [InlineData(3, 12, "9", FeedbackCodes.FactorSubtracted)]
    [InlineData(3, 12, "3", FeedbackCodes.FactorFactor)]
    [InlineData(3, 12, "5", FeedbackCodes.FactorOffByOne)]
    [InlineData(3, 12, "7", FeedbackCodes.FactorGeneric)]
    [InlineData(2, 4, "2", FeedbackCodes.FactorCorrect)] // a = x: correct wins over "the factor"
    [InlineData(2, 4, "8", FeedbackCodes.FactorMultiplied)]
    [InlineData(3, 12, "2147483647", FeedbackCodes.FactorGeneric)]
    [InlineData(3, 12, "-2147483648", FeedbackCodes.FactorGeneric)]
    public void The_validator_chooses_one_code_in_precedence_order(int a, int b, string text, string code)
    {
        var result = Validator.Validate(Equation(a, b), ResponseArtifact.ReadInteger(text));
        Assert.Equal(code, result.Code);
        Assert.Equal(code == FeedbackCodes.FactorCorrect, result.Values.ContainsKey("x"));
    }

    [Fact]
    public void The_validator_agrees_with_its_registry_entry_and_asks_ax_equals_b()
    {
        var entry = Catalog.Validators["factor-answer@1"];
        Assert.Equal(QuestionForms.UnknownFactor, entry.Form);
        Assert.Equal(FeedbackCodes.FactorMisconceptions.Order(StringComparer.Ordinal), entry.Emits.Order(StringComparer.Ordinal));
        Assert.Equal(4, Validator.ExpectedAnswer(Equation(3, 12)));

        // Never rounded down: 3x = 7 has no whole-number x, so the validator refuses it rather than accept 2 (PR 64 review).
        Assert.Throws<InvalidOperationException>(() => Validator.ExpectedAnswer(Equation(3, 7)));
        Assert.Throws<InvalidOperationException>(() => Validator.Validate(Equation(3, 7), ResponseArtifact.ReadInteger("2")));
        Assert.Throws<InvalidOperationException>(() => Validator.ExpectedAnswer(Equation(0, 6)));
        Assert.Equal("3x = 12", Equation(3, 12).Prompt);

        var instance = new InstanceResolver(Catalog, GeneratorRegistry.Default(), ValidatorRegistry.Default()).Resolve(new InstanceIdentity("algebra.one-step.times", 1, new Seed(9)));
        Assert.Equal(QuestionForms.UnknownFactor, instance.Form);
    }

    [Fact]
    public void The_balance_steps_show_the_boxes_one_round_of_sharing_then_one_box_against_one_group()
    {
        var steps = StepModels.ForValues(3, 12, "balance-sharing", StepKind.Help);
        Assert.Equal(["explain.sharing.show", "explain.sharing.share", "explain.sharing.solved"], steps.Select(s => s.Text.Code));
        Assert.Equal([false, false, true], steps.Select(s => s.Reveals));
        Assert.Equal(false, steps[0].Visual["groups"]);
        Assert.Equal(true, steps[1].Visual["groups"]);
        Assert.Equal(1, steps[1].Visual["each"]); // the first round shared, so the learner sees how (PR 64 review)
        Assert.Equal(9, steps[1].Visual["loose"]);
        Assert.Equal(4, steps[2].Visual["each"]);
        Assert.Equal(true, steps[2].Visual["kept"]);
        Assert.Equal(4, steps[2].Text.Values["x"]);
        Assert.All(steps.Take(2), s => Assert.False(s.Visual.ContainsKey("x") || s.Text.Values.ContainsKey("x")));
    }

    [Theory]
    [InlineData(3, 12, true)] // the explorer
    [InlineData(2, 10, false)] // "Then try these", without its answer
    [InlineData(2, 8, false)]
    public void The_lesson_discloses_only_the_explorers_equation(int a, int b, bool discloses)
    {
        var translations = Catalog.Translations.Where(t => t.Key.LessonId == "one-step-equations").Select(t => t.Value.Facts);
        Assert.Equal(discloses, LessonDisclosure.For(translations, Equation(a, b)).Discloses);
    }

    [Theory]
    [InlineData(3, 7)]
    [InlineData(0, 6)]
    public void A_fixed_product_equation_without_a_whole_number_solution_fails_the_load(int a, int b)
    {
        using var temp = new TempContent();
        temp.CopyRepositoryContent();
        File.WriteAllText(Path.Combine(temp.Root, "exercises", "algebra", "fixed-times.json"), $$"""
            {
              "$schema": "../../../schemas/exercise-definition.pilot.schema.json",
              "schemaVersion": "0.1-pilot",
              "id": "algebra.one-step.fixed-times",
              "version": 1,
              "skill": "algebra.one-step-equations",
              "source": "fixed",
              "validator": { "name": "factor-answer", "version": 1 },
              "instance": { "prompt": { "a": {{a}}, "b": {{b}} }, "validation": { "answer": 2 } },
              "representations": { "help": [], "explanation": [] },
              "misconceptionCodes": ["fac.generic"]
            }
            """);

        var error = Assert.Throws<ContentLoadException>(() => ContentLoader.Load(temp.Root));

        Assert.Equal("exercises/algebra/fixed-times.json", error.Path);
        Assert.Contains($"{a}x = {b} has no whole-number solution", error.Message, StringComparison.Ordinal);
    }

    [Fact]
    public void A_solution_counts_for_the_product_equation_it_follows()
    {
        LessonFacts Facts(params string[] expressions) => new(expressions.Select(e => new LessonExpression(e)).ToList(), []);
        Assert.True(LessonDisclosure.For(Facts("3x = 12", "x = 4"), Equation(3, 12)).Discloses);
        Assert.False(LessonDisclosure.For(Facts("3x = 12", "x + 3 = 7", "x = 4"), Equation(3, 12)).Discloses);
        Assert.False(LessonDisclosure.For(Facts("3x = 12", "x = 3"), Equation(3, 12)).Discloses);
    }
}
