using MathKX.Content;
using MathKX.Domain.Content;
using MathKX.Domain.Explanations;
using MathKX.Domain.Generators;
using MathKX.Domain.Instances;
using MathKX.Domain.Random;
using MathKX.Domain.Tests.Content;
using MathKX.Domain.Validators;

namespace MathKX.Domain.Tests.Explanations;

/// <summary>The balance help and explanation for x + a = b (specs/009 FR-003, FR-004).</summary>
public sealed class BalanceStepsTests
{
    private static readonly ContentCatalog Catalog = ContentLoader.Load(RepositoryContent.Root);
    private static readonly InstanceResolver Resolver = new(Catalog, GeneratorRegistry.Default(), ValidatorRegistry.Default());

    [Fact]
    public void An_equation_definition_resolves_to_the_unknown_addend_form()
    {
        var instance = Resolver.Resolve(new InstanceIdentity("algebra.one-step.within-10", 1, new Seed(7)));
        Assert.Equal(QuestionForms.UnknownAddend, instance.Form);
        Assert.Equal($"x + {instance.A} = {instance.B}", instance.Prompt);
        Assert.Equal(new NamedVersion("equation-answer", 1), instance.Validator);

        var addition = Resolver.Resolve(new InstanceIdentity("numbers.addition.within-10", 1, new Seed(7)));
        Assert.Equal(QuestionForms.Addition, addition.Form);
    }

    [Fact]
    public void Shows_the_level_scale_marks_a_on_both_pans_then_x_alone()
    {
        var steps = StepModels.ForValues(3, 7, "balance", StepKind.Help);
        Assert.Equal(3, steps.Count);
        Assert.Equal(["explain.balance.show", "explain.balance.takeAway", "explain.balance.solved"], steps.Select(s => s.Text.Code));
        Assert.Equal([false, false, true], steps.Select(s => s.Reveals));

        Assert.Equal(3, steps[0].Visual["left"]);
        Assert.Equal(7, steps[0].Visual["right"]);
        Assert.Equal(0, steps[0].Visual["marked"]);
        Assert.Equal(3, steps[1].Visual["marked"]);
        Assert.Equal(0, steps[2].Visual["left"]);
        Assert.Equal(4, steps[2].Visual["right"]);
        Assert.Equal(4, steps[2].Visual["x"]);
        Assert.Equal(4, steps[2].Text.Values["x"]);
        Assert.All(steps.Take(2), s => Assert.False(s.Text.Values.ContainsKey("x") || s.Visual.ContainsKey("x")));
    }

    [Fact]
    public void Help_and_explanation_are_the_same_steps_and_every_pool_question_has_them()
    {
        foreach (var key in new[] { "algebra.one-step.within-10@1", "algebra.one-step.to-15@1" })
        {
            var definition = Catalog.Definitions[key];
            foreach (var (a, b) in new UnknownAddendGenerator().Enumerate(definition))
            {
                var help = StepModels.ForValues(a, b, "balance", StepKind.Help);
                var explanation = StepModels.ForValues(a, b, "balance", StepKind.Explanation);
                Assert.Equal(help.Select(s => s.Text.Code), explanation.Select(s => s.Text.Code));
                Assert.Equal(b - a, help[^1].Text.Values["x"]);
            }
        }
    }
}
