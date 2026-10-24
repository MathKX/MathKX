using System.Text.Json;
using MathKX.Content;
using MathKX.Domain.Content;
using MathKX.Domain.Explanations;
using MathKX.Domain.Generators;
using MathKX.Domain.Instances;
using MathKX.Domain.Random;
using MathKX.Domain.Tests.Content;

namespace MathKX.Domain.Tests.Explanations;

/// <summary>
/// specs/003 FR-008 and research R5: a lesson visual with authored values steps through the very same model as
/// the explanation for a question with those operands; the ten-frame explorer's pairs come from the domain.
/// </summary>
public sealed class LessonVisualModelTests
{
    private static readonly ContentCatalog Catalog = ContentLoader.Load(RepositoryContent.Root);
    private static readonly InstanceResolver Resolver = new(Catalog, GeneratorRegistry.Default());

    [Fact]
    public void Steps_for_authored_values_equal_the_explanation_of_every_pilot_question_with_those_operands()
    {
        var checkedPairs = 0;
        foreach (var definition in new[] { "numbers.addition.within-10", "numbers.addition.crossing-ten" })
        {
            var seen = new HashSet<(int, int)>();
            for (ulong seed = 0; seed < 2000; seed++)
            {
                var instance = Resolver.Resolve(new InstanceIdentity(definition, 1, new Seed(seed)));
                if (!seen.Add((instance.A, instance.B)))
                {
                    continue;
                }

                foreach (var representation in instance.Representations.Explanation)
                {
                    var forQuestion = StepModels.For(instance, representation, StepKind.Explanation);
                    var forValues = StepModels.ForValues(instance.A, instance.B, representation, StepKind.Explanation);
                    Assert.Equal(Serialize(forQuestion), Serialize(forValues));
                    checkedPairs++;
                }
            }
        }

        Assert.Equal(45 + 36, checkedPairs);
    }

    [Fact]
    public void The_lesson_visual_for_eight_plus_five_reaches_ten_plus_three_on_its_last_step()
    {
        var steps = StepModels.ForValues(8, 5, "make-ten", StepKind.Explanation);
        Assert.Equal(4, steps.Count);
        Assert.Equal([false, false, false, true], steps.Select(s => s.Reveals));
        Assert.Equal(13, steps[3].Text.Values["sum"]);
        Assert.Equal(3, steps[3].Text.Values["rest"]);
    }

    [Fact]
    public void Unknown_representations_have_no_steps()
    {
        Assert.Throws<UnsupportedStepsException>(() => StepModels.ForValues(3, 7, "ten-frame-explorer", StepKind.Explanation));
    }

    [Fact]
    public void The_explorer_has_eleven_states_that_each_make_ten()
    {
        var states = TenFrameExplorer.States();
        Assert.Equal(Enumerable.Range(0, 11), states.Select(s => s.Filled));
        Assert.All(states, s => Assert.Equal(10, s.Filled + s.Partner));
    }

    private static string Serialize(IReadOnlyList<StepModel> steps) => JsonSerializer.Serialize(steps);
}
