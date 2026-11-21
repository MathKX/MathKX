using MathKX.Content;
using MathKX.Domain.Content;
using MathKX.Domain.Generators;
using MathKX.Domain.Random;
using MathKX.Domain.Tests.Content;

namespace MathKX.Domain.Tests.Generators;

/// <summary><c>unknown-addend@1</c> (specs/009 FR-001, FR-005).</summary>
public sealed class UnknownAddendTests
{
    private static readonly ContentCatalog Catalog = ContentLoader.Load(RepositoryContent.Root);
    private static readonly UnknownAddendGenerator Generator = new();

    [Fact]
    public void Enumerates_a_ascending_then_x_ascending_within_the_total_bounds()
    {
        var spec = new GeneratorSpec("unknown-addend", 1, new Dictionary<string, Bounds> { ["addend"] = new(1, 3), ["unknown"] = new(1, 3), ["total"] = new(3, 4) }, null);
        // (a, b) with x = b − a: (1, 3) x 2, (1, 4) x 3, (2, 3) x 1, (2, 4) x 2, (3, 4) x 1.
        Assert.Equal([(1, 3), (1, 4), (2, 3), (2, 4), (3, 4)], UnknownAddendGenerator.Enumerate(spec));
    }

    [Theory]
    [InlineData("algebra.one-step.within-10@1", 45, 2, 10)]
    [InlineData("algebra.one-step.to-15@1", 30, 11, 15)]
    public void The_two_rungs_have_the_specified_pools(string key, int size, int lowest, int highest)
    {
        var definition = Catalog.Definitions[key];
        var pool = Generator.Enumerate(definition);
        Assert.Equal(size, pool.Count);
        Assert.Equal(size, pool.Distinct().Count());
        Assert.All(pool, q =>
        {
            Assert.InRange(q.A, 1, 9);
            Assert.InRange(q.B - q.A, 1, 9);
            Assert.InRange(q.B, lowest, highest);
        });
    }

    [Fact]
    public void Is_deterministic_and_draws_from_the_pool()
    {
        var definition = Catalog.Definitions["algebra.one-step.within-10@1"];
        var pool = Generator.Enumerate(definition);
        for (ulong value = 0; value < 200; value++)
        {
            var seed = new Seed(value);
            var drawn = Generator.Generate(definition, seed);
            Assert.Equal(drawn, Generator.Generate(definition, seed));
            Assert.Contains(drawn, pool);
        }
    }

    [Fact]
    public void Every_question_of_both_rungs_has_a_seed()
    {
        var registry = GeneratorRegistry.Default();
        foreach (var key in new[] { "algebra.one-step.within-10@1", "algebra.one-step.to-15@1" })
        {
            var pool = QuestionPool.For(Catalog.Definitions[key], registry);
            Assert.All(pool.Questions, q => Assert.NotNull(q.Seed));
        }
    }

    [Fact]
    public void Agrees_with_the_registry_entry()
    {
        var entry = Catalog.Generators["unknown-addend@1"];
        Assert.Equal("unknown-addend", entry.Relation);
        Assert.Equal(["addend", "total", "unknown"], entry.Parameters.Keys.Order(StringComparer.Ordinal));
        Assert.Contains("unknown-addend@1", GeneratorRegistry.Default().Keys);
    }

    [Fact]
    public void Refuses_a_definition_of_another_generator()
    {
        Assert.Throws<ArgumentException>(() => Generator.Generate(Catalog.Definitions["numbers.addition.within-10@1"], new Seed(1)));
    }
}
