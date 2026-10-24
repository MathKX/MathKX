using System.Text.Json;
using MathKX.Content;
using MathKX.Domain.Content;
using MathKX.Domain.Instances;
using MathKX.Domain.Lessons;
using MathKX.Domain.Tests.Content;

namespace MathKX.Domain.Tests.Lessons;

/// <summary>DL-026 (2) for every pilot instance a lesson can be opened from (specs/003 contracts/disclosure.md, SC-002).</summary>
public sealed class LessonDisclosureTests
{
    private static readonly ContentCatalog Catalog = ContentLoader.Load(RepositoryContent.Root);
    private const string Lesson = "number-bonds-to-ten";

    private static Instance Question(string definition, int a, int b) =>
        new(new InstanceIdentity(definition, 1, null), "numbers.addition-within-20", a, b, new RepresentationRoles([], []), null, new NamedVersion("integer-answer", 1));

    private static IEnumerable<(string Definition, int A, int B)> PilotInstances()
    {
        foreach (var (definition, key) in new[] { ("numbers.addition.within-10", "numbers.addition.within-10@1"), ("numbers.addition.crossing-ten", "numbers.addition.crossing-ten@1") })
        {
            var parameters = Catalog.Definitions[key].Generator!.Parameters;
            var (operand, sum) = (parameters["operand"], parameters["sum"]);
            for (var a = operand.Min; a <= operand.Max; a++)
            {
                for (var b = operand.Min; b <= operand.Max; b++)
                {
                    if (a + b >= sum.Min && a + b <= sum.Max)
                    {
                        yield return (definition, a, b);
                    }
                }
            }
        }
    }

    [Fact]
    public void The_pilot_lesson_discloses_exactly_the_recorded_instances_in_both_languages()
    {
        var expected = ExpectedTable();
        var instances = PilotInstances().ToList();
        Assert.Equal(45 + 36, instances.Count);

        var mismatches = new List<string>();
        foreach (var (definition, a, b) in instances)
        {
            var question = Question(definition, a, b);
            var nb = LessonDisclosure.For(Catalog.Translation(Lesson, "nb").Facts, question);
            var en = LessonDisclosure.For(Catalog.Translation(Lesson, "en").Facts, question);
            var lesson = LessonDisclosure.For(new[] { "nb", "en" }.Select(l => Catalog.Translation(Lesson, l).Facts), question);
            expected.TryGetValue((definition, a, b), out var where);
            var want = where is null ? DisclosureDecision.No : new DisclosureDecision(true, where.Value);

            if (nb != en)
            {
                mismatches.Add($"{definition} {a} + {b}: nb {nb} but en {en}");
            }

            if (lesson != want)
            {
                mismatches.Add($"{definition} {a} + {b}: expected {want}, got {lesson}");
            }
        }

        Assert.True(mismatches.Count == 0, string.Join("\n", mismatches));
    }

    [Theory]
    [InlineData("9 + 4", 9, 4, false)]
    [InlineData("9 + 1", 9, 4, false)]
    [InlineData("10 + 3", 9, 4, false)]
    [InlineData("3 + 7 = 10", 3, 7, true)]
    [InlineData("3 + 7 = 10", 7, 3, true)]
    [InlineData("8 + 5 = 8 + 2 + 3 = 10 + 3 = 13", 5, 8, true)]
    [InlineData("8 + 5 = 12", 8, 5, false)]
    [InlineData("8 − 5 = 3", 8, 5, false)]
    [InlineData("8+5=13", 8, 5, true)]
    public void Expressions_disclose_only_with_the_addends_first_and_the_result_last(string expression, int a, int b, bool discloses)
    {
        var facts = new LessonFacts([new LessonExpression(expression)], []);
        var decision = LessonDisclosure.For(facts, Question("numbers.addition.within-10", a, b));
        Assert.Equal(discloses, decision.Discloses);
        Assert.Equal(discloses ? DisclosureSource.Expression : DisclosureSource.None, decision.Where);
    }

    [Theory]
    [InlineData("make-ten", 8, 5, 8, 5, true)]
    [InlineData("make-ten", 8, 5, 5, 8, true)]
    [InlineData("groups", 4, 4, 4, 4, true)]
    [InlineData("groups", 4, 3, 4, 4, false)]
    [InlineData("ten-frame-explorer", 3, 7, 3, 7, false)]
    public void Worked_visuals_for_the_same_values_disclose_and_the_explorer_never_does(string type, int va, int vb, int a, int b, bool discloses)
    {
        var attributes = type == "ten-frame-explorer"
            ? new Dictionary<string, int> { ["start"] = va }
            : new Dictionary<string, int> { ["a"] = va, ["b"] = vb };
        var facts = new LessonFacts([], [new LessonVisual(type, attributes)]);
        var decision = LessonDisclosure.For(facts, Question("numbers.addition.crossing-ten", a, b));
        Assert.Equal(discloses, decision.Discloses);
    }

    [Fact]
    public void An_expression_anywhere_wins_over_a_visual()
    {
        var visualOnly = new LessonFacts([], [new LessonVisual("make-ten", new Dictionary<string, int> { ["a"] = 8, ["b"] = 5 })]);
        var expressionOnly = new LessonFacts([new LessonExpression("8 + 5 = 13")], []);
        var question = Question("numbers.addition.crossing-ten", 8, 5);
        Assert.Equal(DisclosureSource.Visual, LessonDisclosure.For([visualOnly], question).Where);
        Assert.Equal(DisclosureSource.Expression, LessonDisclosure.For([visualOnly, expressionOnly], question).Where);
    }

    private static Dictionary<(string, int, int), DisclosureSource?> ExpectedTable()
    {
        var path = Path.Combine(AppContext.BaseDirectory, "Fixtures", "disclosure.number-bonds-to-ten.json");
        using var document = JsonDocument.Parse(File.ReadAllText(path));
        return document.RootElement.GetProperty("disclosing").EnumerateArray().ToDictionary(
            e => (e.GetProperty("definition").GetString()!, e.GetProperty("a").GetInt32(), e.GetProperty("b").GetInt32()),
            e => (DisclosureSource?)(e.GetProperty("where").GetString() == "visual" ? DisclosureSource.Visual : DisclosureSource.Expression));
    }
}
