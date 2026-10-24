using System.Text.Json;
using System.Text.RegularExpressions;
using MathKX.Content;
using MathKX.Domain.Content;
using MathKX.Domain.Explanations;
using MathKX.Domain.Generators;
using MathKX.Domain.Instances;
using MathKX.Domain.Random;
using MathKX.Domain.Tests.Content;

namespace MathKX.Domain.Tests.Explanations;

public sealed partial class StepModelTests
{
    private static readonly ContentCatalog Catalog = ContentLoader.Load(RepositoryContent.Root);
    private static readonly InstanceResolver Resolver = new(Catalog, GeneratorRegistry.Default());

    private static Instance Fixed(int a, int b) => new(
        new InstanceIdentity("numbers.addition.test", 1, null), "numbers.addition-within-20", a, b,
        new RepresentationRoles(["groups", "make-ten"], ["groups", "make-ten"]), null, new NamedVersion("integer-answer", 1));

    [Fact]
    public void Groups_help_for_four_plus_four_reveals_only_on_the_last_step()
    {
        var steps = StepModels.For(Fixed(4, 4), "groups", StepKind.Help);

        Assert.Equal(4, steps.Count);
        Assert.Equal([false, false, false, true], steps.Select(s => s.Reveals));
        AssertSumOnlyOnRevealingSteps(steps);
        Assert.Equal(8, steps[3].Text.Values["sum"]);
        Assert.Equal(4, steps[1].Visual["countedFirst"]);
    }

    [Fact]
    public void Groups_explanation_reveals_only_on_the_last_step()
    {
        var steps = StepModels.For(Fixed(4, 4), "groups", StepKind.Explanation);

        Assert.Equal(3, steps.Count);
        Assert.Equal([false, false, true], steps.Select(s => s.Reveals));
        AssertSumOnlyOnRevealingSteps(steps);
        Assert.Equal("explain.groups.total", steps[2].Text.Code);
    }

    [Fact]
    public void Make_ten_explanation_for_eight_plus_five_has_need_two_and_rest_three()
    {
        var steps = StepModels.For(Fixed(8, 5), "make-ten", StepKind.Explanation);

        Assert.Equal(4, steps.Count);
        Assert.Equal([false, false, false, true], steps.Select(s => s.Reveals));
        Assert.Equal(2, steps[1].Text.Values["need"]);
        Assert.Equal(2, steps[2].Text.Values["need"]);
        Assert.Equal(3, steps[2].Text.Values["rest"]);
        Assert.Equal(13, steps[3].Text.Values["sum"]);
        AssertSumOnlyOnRevealingSteps(steps);
        var frame = Assert.IsType<string[]>(steps[2].Visual["frame"]);
        Assert.Equal(8, frame.Count(c => c == "a"));
        Assert.Equal(2, frame.Count(c => c == "b"));
    }

    [Fact]
    public void Make_ten_help_ends_in_a_revealing_step()
    {
        var steps = StepModels.For(Fixed(9, 4), "make-ten", StepKind.Help);
        Assert.True(steps[^1].Reveals);
        Assert.All(steps.SkipLast(1), s => Assert.False(s.Reveals));
    }

    [Fact]
    public void Every_pilot_definition_has_a_sequence_for_each_representation_it_lists()
    {
        foreach (var definition in Catalog.Definitions.Values)
        {
            var identity = new InstanceIdentity(definition.Id, definition.Version, definition.IsFixed ? null : new Seed(5));
            var instance = Resolver.Resolve(identity);
            foreach (var (names, kind) in new[] { (definition.Representations.Help, StepKind.Help), (definition.Representations.Explanation, StepKind.Explanation) })
            {
                foreach (var name in names)
                {
                    var steps = StepModels.For(instance, name, kind);
                    Assert.NotEmpty(steps);
                    Assert.Equal(1, steps.Count(s => s.Reveals));
                    Assert.True(steps[^1].Reveals);
                    AssertSumOnlyOnRevealingSteps(steps);
                    Assert.All(steps, s => Assert.Contains(s.Text.Code, StepModels.TextCodes));
                }
            }
        }
    }

    [Fact]
    public void Step_values_agree_with_the_instance_for_every_golden_seed()
    {
        var golden = JsonDocument.Parse(File.ReadAllText(Path.Combine(AppContext.BaseDirectory, "Fixtures", "addition-pair-v1.golden.json")));
        foreach (var definition in golden.RootElement.GetProperty("definitions").EnumerateObject())
        {
            var (id, version) = Split(definition.Name);
            foreach (var seed in definition.Value.GetProperty("seeds").EnumerateObject())
            {
                var instance = Resolver.Resolve(new InstanceIdentity(id, version, Seed.Parse(seed.Name)));
                foreach (var kind in new[] { StepKind.Help, StepKind.Explanation })
                {
                    var representation = StepModels.RepresentationFor(instance, kind)!;
                    var last = StepModels.For(instance, representation, kind)[^1];
                    Assert.Equal(instance.A + instance.B, last.Text.Values["sum"]);
                }
            }
        }
    }

    [Fact]
    public void Unsupported_kind_or_representation_is_a_typed_error()
    {
        var instance = Resolver.Resolve(new InstanceIdentity("numbers.addition.within-10", 1, new Seed(1)));
        Assert.Throws<UnsupportedStepsException>(() => StepModels.For(instance, "make-ten", StepKind.Help));
        Assert.Throws<UnsupportedStepsException>(() => StepModels.For(instance, "ten-frame-explorer", StepKind.Explanation));
        Assert.False(StepModels.TryParseKind("other", out _));
    }

    [Fact]
    public void Text_codes_match_the_learner_apps_list()
    {
        var path = Path.Combine(RepositoryContent.Root, "..", "src", "web", "src", "i18n", "codes.json");
        using var codes = JsonDocument.Parse(File.ReadAllText(path));
        var web = codes.RootElement.GetProperty("stepText").EnumerateArray().Select(e => e.GetString()!).OrderBy(s => s, StringComparer.Ordinal).ToList();
        Assert.Equal(StepModels.TextCodes.OrderBy(s => s, StringComparer.Ordinal), web);
    }

    private static void AssertSumOnlyOnRevealingSteps(IReadOnlyList<StepModel> steps)
    {
        foreach (var step in steps)
        {
            var hasSum = step.Text.Values.ContainsKey("sum") || step.Visual.ContainsKey("total") || step.Visual.ContainsKey("countedAll");
            Assert.Equal(step.Reveals, hasSum);
        }
    }

    private static (string Id, int Version) Split(string key)
    {
        var match = KeyPattern().Match(key);
        return (match.Groups["id"].Value, int.Parse(match.Groups["v"].Value, System.Globalization.CultureInfo.InvariantCulture));
    }

    [GeneratedRegex("^(?<id>.+)@(?<v>[0-9]+)$")]
    private static partial Regex KeyPattern();
}
