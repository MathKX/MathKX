using System.Text.Json;
using MathKX.Content;
using MathKX.Domain.Content;
using MathKX.Domain.Generators;
using MathKX.Domain.Instances;
using MathKX.Domain.Random;

namespace MathKX.Domain.Tests.Content;

/// <summary>
/// specs/006 contracts/check-content.md "The domain tests": every question of every check in content/ resolves, the
/// questions of a check are distinct, and the pilot resolves to the reviewed operands. The content check runs no
/// generator, so two seeds that give the same question are caught here.
/// </summary>
public sealed class CheckQuestionsTests
{
    private static readonly ContentCatalog Catalog = ContentLoader.Load(RepositoryContent.Root);

    private static InstanceIdentity IdentityOf(CheckQuestion question) =>
        new(question.Definition, question.Version, question.Seed is null ? null : Seed.Parse(question.Seed));

    private static List<(int A, int B)> Resolve(ContentCatalog catalog, SelfCheck check)
    {
        var resolver = new InstanceResolver(catalog, GeneratorRegistry.Default());
        return check.Questions.Select(q => resolver.Resolve(IdentityOf(q))).Select(i => (i.A, i.B)).ToList();
    }

    /// <summary>The questions of a check that repeat an earlier one: the same definition, version, and ordered operands.</summary>
    private static List<string> Repeats(ContentCatalog catalog, SelfCheck check)
    {
        var resolved = Resolve(catalog, check);
        var first = new Dictionary<(string, int, int), int>();
        var repeats = new List<string>();
        for (var i = 0; i < check.Questions.Count; i++)
        {
            var key = (check.Questions[i].Key, resolved[i].A, resolved[i].B);
            if (first.TryGetValue(key, out var j))
            {
                repeats.Add($"{check.Key} questions[{i}] is the same question as questions[{j}]: {resolved[i].A} + {resolved[i].B}");
            }
            else
            {
                first[key] = i;
            }
        }

        return repeats;
    }

    [Fact]
    public void Every_question_of_every_check_resolves()
    {
        Assert.NotEmpty(Catalog.Checks);
        foreach (var check in Catalog.Checks.Values)
        {
            Assert.Equal(check.Questions.Count, Resolve(Catalog, check).Count);
        }
    }

    [Fact]
    public void The_questions_of_each_check_are_distinct()
    {
        Assert.Empty(Catalog.Checks.Values.SelectMany(check => Repeats(Catalog, check)));
    }

    [Fact]
    public void The_pilot_resolves_to_the_reviewed_operands()
    {
        var path = Path.Combine(AppContext.BaseDirectory, "Fixtures", "checks.pilot.json");
        using var fixture = JsonDocument.Parse(File.ReadAllText(path));
        var key = "numbers.addition.check-within-20@1";
        var expected = fixture.RootElement.GetProperty(key).EnumerateArray()
            .Select(e => (e.GetProperty("a").GetInt32(), e.GetProperty("b").GetInt32()))
            .ToList();

        Assert.Equal([(7, 3), (5, 4), (8, 5), (9, 4)], expected);
        Assert.Equal(expected, Resolve(Catalog, Catalog.Checks[key]));
    }

    [Fact]
    public void Two_seeds_that_give_the_same_question_are_caught()
    {
        // Another seed of within-10 that gives 7 + 3, the pilot's first question (seed 22).
        var definition = Catalog.Definitions["numbers.addition.within-10@1"];
        var generator = GeneratorRegistry.Default();
        Assert.True(generator.TryGet(definition.Generator!.Key, out var pair));
        var twin = Enumerable.Range(0, 10_000).Select(s => (ulong)s)
            .First(s => s != 22 && pair.Generate(definition, new Seed(s)) == (7, 3));

        using var temp = new TempContent();
        temp.CopyRepositoryContent();
        temp.Rewrite("checks/numbers/addition-within-20.json", text =>
        {
            const string second = "\"seed\": \"24\"";
            Assert.Contains(second, text, StringComparison.Ordinal);
            return text.Replace(second, $"\"seed\": \"{twin}\"", StringComparison.Ordinal);
        });
        var catalog = ContentLoader.Load(temp.Root); // the loader accepts it: only resolution can tell

        var repeat = Assert.Single(Catalog.Checks.Keys.SelectMany(k => Repeats(catalog, catalog.Checks[k])));
        Assert.Equal("numbers.addition.check-within-20@1 questions[1] is the same question as questions[0]: 7 + 3", repeat);
    }
}
