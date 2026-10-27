using System.Text.Json;
using MathKX.Content;
using MathKX.Domain.Content;
using MathKX.Domain.Generators;
using MathKX.Domain.Random;
using MathKX.Domain.Tests.Content;

namespace MathKX.Domain.Tests.Generators;

/// <summary>specs/005 contracts/pool.md: every question of a variation with the smallest seed that generates it.</summary>
public sealed class QuestionPoolTests
{
    private static readonly ContentCatalog Catalog = ContentLoader.Load(RepositoryContent.Root);
    private static readonly GeneratorRegistry Generators = GeneratorRegistry.Default();
    private static readonly AdditionPairGenerator Generator = new();
    private static readonly string[] Generated = ["numbers.addition.within-10@1", "numbers.addition.crossing-ten@1"];

    [Theory]
    [InlineData("numbers.addition.within-10@1", 45)]
    [InlineData("numbers.addition.crossing-ten@1", 36)]
    [InlineData("numbers.addition.four-plus-four@1", 1)]
    public void Lists_every_question_of_the_variation_in_canonical_order(string key, int size)
    {
        var definition = Catalog.Definitions[key];
        var pool = QuestionPool.For(definition, Generators);

        Assert.Equal(key, pool.Definition);
        Assert.Equal(size, pool.Questions.Count);
        if (!definition.IsFixed)
        {
            Assert.Equal(AdditionPairGenerator.Enumerate(definition.Generator!), pool.Questions.Select(q => (q.A, q.B)));
        }
    }

    [Theory]
    [InlineData("numbers.addition.within-10@1")]
    [InlineData("numbers.addition.crossing-ten@1")]
    public void Each_seed_is_the_smallest_that_generates_its_question(string key)
    {
        var definition = Catalog.Definitions[key];
        var pool = QuestionPool.For(definition, Generators);

        foreach (var question in pool.Questions)
        {
            var seed = Assert.NotNull(question.Seed);
            Assert.Equal((question.A, question.B), Generator.Generate(definition, seed));
            Assert.True(seed.Value < QuestionPool.DefaultLimit, $"{key} {question.A} + {question.B}: seed {seed.Value} is not below the limit");
            for (ulong smaller = 0; smaller < seed.Value; smaller++)
            {
                Assert.NotEqual((question.A, question.B), Generator.Generate(definition, new Seed(smaller)));
            }
        }
    }

    [Fact]
    public void A_fixed_task_is_its_one_question_without_a_seed()
    {
        var definition = Catalog.Definitions["numbers.addition.four-plus-four@1"];
        var question = Assert.Single(QuestionPool.For(definition, Generators).Questions);

        Assert.Null(question.Seed);
        Assert.Equal((4, 4), (question.A, question.B));
    }

    [Fact]
    public void The_first_entries_match_the_reviewed_fixture()
    {
        var path = Path.Combine(AppContext.BaseDirectory, "Fixtures", "pools.json");
        using var fixture = JsonDocument.Parse(File.ReadAllText(path));

        foreach (var key in Generated)
        {
            var expected = fixture.RootElement.GetProperty(key).EnumerateArray()
                .Select(e => (Seed: e.GetProperty("seed").GetString(), A: e.GetProperty("a").GetInt32(), B: e.GetProperty("b").GetInt32()))
                .ToList();
            var actual = QuestionPool.For(Catalog.Definitions[key], Generators).Questions.Take(expected.Count)
                .Select(q => (Seed: q.Seed?.ToString(), q.A, q.B))
                .ToList();
            Assert.Equal(expected, actual);
        }
    }

    [Fact]
    public void A_pool_that_cannot_be_covered_within_the_limit_fails_with_the_definition()
    {
        var definition = Catalog.Definitions["numbers.addition.within-10@1"];

        var error = Assert.Throws<InvalidOperationException>(() => QuestionPool.For(definition, Generators, limit: 10));

        Assert.Contains("numbers.addition.within-10@1", error.Message, StringComparison.Ordinal);
    }
}
