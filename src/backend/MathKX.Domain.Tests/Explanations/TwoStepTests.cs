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

/// <summary>ax + c = b (specs/011): the explorer, the generator and its pool, the validator, the steps, and disclosure.</summary>
public sealed class TwoStepTests
{
    private const string Definition = "algebra.two-step.within-20@1";
    private static readonly ContentCatalog Catalog = ContentLoader.Load(RepositoryContent.Root);
    private static readonly TwoStepAnswerValidator Validator = new();

    private static Instance Equation(int a, int c, int b) => new(
        new InstanceIdentity("algebra.two-step.within-20", 1, null),
        "algebra.two-step-equations",
        a,
        b,
        new RepresentationRoles(["balance-two-step"], ["balance-two-step"]),
        new NamedVersion("two-step", 1),
        new NamedVersion("two-step-answer", 1),
        QuestionForms.TwoStep,
        c);

    [Fact]
    public void The_explorer_takes_the_loose_weights_off_then_shares_then_keeps_one_part_of_each_side()
    {
        Assert.Equal(
            [
                new TwoStepState(3, 11, 0, 11, false, false),
                new TwoStepState(2, 10, 0, 10, false, false),
                new TwoStepState(1, 9, 0, 9, false, false),
                new TwoStepState(0, 8, 0, 8, false, false),
                new TwoStepState(0, 8, 1, 6, false, false),
                new TwoStepState(0, 8, 2, 4, false, false),
                new TwoStepState(0, 8, 3, 2, false, false),
                new TwoStepState(0, 8, 4, 0, false, false),
                new TwoStepState(0, 8, 4, 0, true, true),
            ],
            TwoStepExplorer.States(2, 3, 11));
    }

    [Theory]
    [InlineData(2, 3, 11, true)]
    [InlineData(3, 2, 14, true)]
    [InlineData(3, 6, 21, true)] // x = 5: the explorer draws it, though practice keeps b at most 20
    [InlineData(2, 3, 10, false)] // no whole-number solution
    [InlineData(4, 1, 9, false)] // four boxes and loose weights do not fit one pan
    [InlineData(2, 7, 9, false)] // more loose weights than the pan draws
    [InlineData(2, 3, 3, false)] // x = 0
    [InlineData(2, 1, 13, false)] // x = 6
    public void Supports_whole_solutions_from_1_to_5_that_fit_the_pans(int a, int c, int b, bool supported)
    {
        Assert.Equal(supported, TwoStepExplorer.Supports(a, c, b));
        if (!supported)
        {
            Assert.Throws<ArgumentOutOfRangeException>(() => TwoStepExplorer.States(a, c, b));
        }
    }

    [Fact]
    public void The_definition_has_59_questions_a_then_c_then_x_each_with_c()
    {
        var definition = Catalog.Definitions[Definition];
        var pool = new TwoStepGenerator().EnumerateOperands(definition);
        Assert.Equal(59, pool.Count); // 30 with a = 2; 29 with a = 3, as 3 · 5 + 6 = 21 is over 20
        Assert.Equal(new Operands(2, 3, 1), pool[0]);
        Assert.Equal(new Operands(2, 5, 1), pool[1]);
        Assert.Equal(new Operands(3, 18, 6), pool[^1]); // a = 3, c = 6, x = 4
        Assert.All(pool, q => Assert.True(TwoStepExplorer.Supports(q.A, q.C!.Value, q.B) && q.B <= 20));
        Assert.Equal(pool.Count, pool.Distinct().Count());

        // The pool's questions keep c, and each has its own smallest seed.
        var questions = QuestionPool.For(definition, GeneratorRegistry.Default()).Questions;
        Assert.Equal(pool, questions.Select(q => new Operands(q.A, q.B, q.C)));
        Assert.All(questions, q => Assert.NotNull(q.Seed));
        Assert.Equal(questions.Count, questions.Select(q => q.Seed).Distinct().Count());
    }

    [Fact]
    public void A_seed_resolves_to_the_same_question_with_c_and_its_prompt()
    {
        var resolver = new InstanceResolver(Catalog, GeneratorRegistry.Default(), ValidatorRegistry.Default());
        var identity = new InstanceIdentity("algebra.two-step.within-20", 1, new Seed(9));
        var first = resolver.Resolve(identity);
        var again = resolver.Resolve(identity);
        Assert.Equal((first.A, first.B, first.C), (again.A, again.B, again.C));
        Assert.NotNull(first.C);
        Assert.Equal(QuestionForms.TwoStep, first.Form);
        Assert.Equal($"{first.A}x + {first.C} = {first.B}", first.Prompt);
        Assert.Equal(new TwoStepGenerator().GenerateOperands(Catalog.Definitions[Definition], new Seed(9)), new Operands(first.A, first.B, first.C));
    }

    [Theory]
    [InlineData(2, 3, 11, "4", FeedbackCodes.TwoStepCorrect)]
    [InlineData(2, 3, 11, "8", FeedbackCodes.TwoStepNotShared)] // b − c
    [InlineData(2, 3, 11, "7", FeedbackCodes.TwoStepAddedFirst)] // (b + c) / a
    [InlineData(3, 3, 12, "1", FeedbackCodes.TwoStepDivideFirst)] // b / a − c
    [InlineData(2, 3, 11, "6", FeedbackCodes.TwoStepFactorAsAddend)] // b − c − a: 2x read as 2 + x
    [InlineData(2, 3, 11, "5", FeedbackCodes.TwoStepOffByOne)]
    [InlineData(2, 3, 11, "3", FeedbackCodes.TwoStepOffByOne)]
    [InlineData(2, 3, 11, "11", FeedbackCodes.TwoStepGeneric)]
    [InlineData(2, 3, 11, "2147483647", FeedbackCodes.TwoStepGeneric)]
    [InlineData(2, 3, 11, "-2147483648", FeedbackCodes.TwoStepGeneric)]
    public void The_validator_chooses_one_code_in_precedence_order(int a, int c, int b, string text, string code)
    {
        var result = Validator.Validate(Equation(a, c, b), ResponseArtifact.ReadInteger(text));
        Assert.Equal(code, result.Code);
        Assert.Equal(code == FeedbackCodes.TwoStepCorrect, result.Values.ContainsKey("x"));
        Assert.Equal(c, result.Values["c"]);
    }

    [Fact]
    public void The_validator_agrees_with_its_registry_entry_and_never_rounds()
    {
        var entry = Catalog.Validators["two-step-answer@1"];
        Assert.Equal(QuestionForms.TwoStep, entry.Form);
        Assert.Equal(FeedbackCodes.TwoStepMisconceptions.Order(StringComparer.Ordinal), entry.Emits.Order(StringComparer.Ordinal));
        Assert.Equal(4, Validator.ExpectedAnswer(Equation(2, 3, 11)));
        Assert.Throws<InvalidOperationException>(() => Validator.ExpectedAnswer(Equation(2, 3, 10)));
        Assert.Throws<InvalidOperationException>(() => Validator.ExpectedAnswer(Equation(2, 3, 3)));
        Assert.Throws<InvalidOperationException>(() => Validator.ExpectedAnswer(Equation(2, 3, 11) with { C = null }));
    }

    [Fact]
    public void The_balance_steps_take_away_then_share_one_round_then_show_x_last()
    {
        var steps = StepModels.ForValues(2, 11, "balance-two-step", StepKind.Help, 3);
        Assert.Equal(["explain.twoStep.show", "explain.twoStep.takeAway", "explain.twoStep.share", "explain.twoStep.solved"], steps.Select(s => s.Text.Code));
        Assert.Equal([false, false, false, true], steps.Select(s => s.Reveals));
        Assert.Equal(3, steps[0].Visual["left"]);
        Assert.Equal((0, 8), ((int)steps[1].Visual["left"], (int)steps[1].Visual["right"]));
        Assert.Equal((1, 6), ((int)steps[2].Visual["each"], (int)steps[2].Visual["loose"]));
        Assert.Equal(4, steps[3].Visual["x"]);
        Assert.All(steps.Take(3), s => Assert.False(s.Visual.ContainsKey("x") || s.Text.Values.ContainsKey("x")));
        Assert.All(steps, s => Assert.Contains(s.Text.Code, StepModels.TextCodes));

        // Without c, there is nothing to step through.
        Assert.Throws<UnsupportedStepsException>(() => StepModels.ForValues(2, 11, "balance-two-step", StepKind.Help));
        Assert.Equal(steps.Select(s => s.Text.Code), StepModels.For(Equation(2, 3, 11), "balance-two-step", StepKind.Explanation).Select(s => s.Text.Code));
    }

    [Theory]
    [InlineData(2, 3, 11, true)] // the explorer
    [InlineData(3, 2, 14, true)] // the worked example, through its halfway 3x = 12
    [InlineData(2, 1, 7, false)] // "Try it yourself", without its answer
    [InlineData(3, 4, 10, false)]
    [InlineData(2, 1, 11, false)] // the explorer's a and b with another c
    public void The_lesson_discloses_its_explorer_and_its_worked_example(int a, int c, int b, bool discloses)
    {
        var translations = Catalog.Translations.Where(t => t.Key.LessonId == "two-step-equations").Select(t => t.Value.Facts);
        Assert.Equal(discloses, LessonDisclosure.For(translations, Equation(a, c, b)).Discloses);
    }

    [Fact]
    public void A_solution_counts_for_the_two_step_equation_it_follows_through_its_own_halfway()
    {
        LessonFacts Facts(params string[] expressions) => new(expressions.Select(e => new LessonExpression(e)).ToList(), []);
        Assert.True(LessonDisclosure.For(Facts("2x + 3 = 11", "x = 4"), Equation(2, 3, 11)).Discloses);
        Assert.True(LessonDisclosure.For(Facts("2x + 3 = 11", "2x = 8", "x = 4"), Equation(2, 3, 11)).Discloses);
        Assert.False(LessonDisclosure.For(Facts("2x + 3 = 11", "2x = 10", "x = 4"), Equation(2, 3, 11)).Discloses); // another equation
        Assert.False(LessonDisclosure.For(Facts("2x + 3 = 11", "x + 3 = 7", "x = 4"), Equation(2, 3, 11)).Discloses);
        Assert.False(LessonDisclosure.For(Facts("2x + 3 = 11", "x = 5"), Equation(2, 3, 11)).Discloses);

        // A two-step equation ends the one-step equations before it.
        var oneStep = new Instance(new InstanceIdentity("algebra.one-step.times", 1, null), "algebra.one-step-equations", 2, 8, new RepresentationRoles([], []), null, new NamedVersion("factor-answer", 1), QuestionForms.UnknownFactor);
        Assert.False(LessonDisclosure.For(Facts("2x = 8", "2x + 1 = 9", "x = 4"), oneStep).Discloses);
        Assert.True(LessonDisclosure.For(Facts("2x + 3 = 11", "2x = 8", "x = 4"), oneStep).Discloses); // the halfway is 2x = 8 itself
    }

    [Theory]
    [InlineData("{ \"a\": 2, \"b\": 10, \"c\": 3 }")] // x = 7/2
    [InlineData("{ \"a\": 2, \"b\": 3, \"c\": 3 }")] // x = 0
    [InlineData("{ \"a\": 0, \"b\": 11, \"c\": 3 }")]
    [InlineData("{ \"a\": 2, \"b\": 11 }")] // no c
    public void A_fixed_two_step_equation_without_a_whole_number_solution_fails_the_load(string prompt)
    {
        using var temp = new TempContent();
        temp.CopyRepositoryContent();
        File.WriteAllText(Path.Combine(temp.Root, "exercises", "algebra", "fixed-two-step.json"), $$"""
            {
              "$schema": "../../../schemas/exercise-definition.pilot.schema.json",
              "schemaVersion": "0.1-pilot",
              "id": "algebra.two-step.fixed",
              "version": 1,
              "skill": "algebra.two-step-equations",
              "source": "fixed",
              "validator": { "name": "two-step-answer", "version": 1 },
              "instance": { "prompt": {{prompt}}, "validation": { "answer": 4 } },
              "representations": { "help": [], "explanation": [] },
              "misconceptionCodes": ["two.generic"]
            }
            """);

        var error = Assert.Throws<ContentLoadException>(() => ContentLoader.Load(temp.Root));

        Assert.Equal("exercises/algebra/fixed-two-step.json", error.Path);
        Assert.Contains("a fixed ax + c = b needs", error.Message, StringComparison.Ordinal);
    }
}
