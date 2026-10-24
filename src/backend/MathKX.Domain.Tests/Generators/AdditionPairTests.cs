using System.Text.Json;
using MathKX.Content;
using MathKX.Domain.Content;
using MathKX.Domain.Generators;
using MathKX.Domain.Random;
using MathKX.Domain.Tests.Content;

namespace MathKX.Domain.Tests.Generators;

public sealed class AdditionPairTests
{
    private static readonly ContentCatalog Catalog = ContentLoader.Load(RepositoryContent.Root);
    private static readonly AdditionPairGenerator Generator = new();
    private static readonly string[] PilotDefinitions = ["numbers.addition.within-10@1", "numbers.addition.crossing-ten@1"];

    private static JsonElement Golden()
    {
        var path = Path.Combine(AppContext.BaseDirectory, "Fixtures", "addition-pair-v1.golden.json");
        return JsonDocument.Parse(File.ReadAllText(path)).RootElement;
    }

    [Theory]
    [InlineData("numbers.addition.within-10@1", 45)]
    [InlineData("numbers.addition.crossing-ten@1", 36)]
    public void Pool_size_equals_the_canonical_enumeration_and_the_fixture(string key, int expected)
    {
        var definition = Catalog.Definitions[key];
        Assert.Equal(expected, Generator.PoolSize(definition));
        Assert.Equal(expected, AdditionPairGenerator.Enumerate(definition.Generator!).Count);
        Assert.Equal(expected, Golden().GetProperty("definitions").GetProperty(key).GetProperty("poolSize").GetInt32());
    }

    [Fact]
    public void Golden_seeds_yield_their_recorded_pairs()
    {
        var definitions = Golden().GetProperty("definitions");
        var checkedSeeds = 0;
        foreach (var key in PilotDefinitions)
        {
            var definition = Catalog.Definitions[key];
            foreach (var entry in definitions.GetProperty(key).GetProperty("seeds").EnumerateObject())
            {
                var expected = entry.Value.EnumerateArray().Select(e => e.GetInt32()).ToArray();
                var (a, b) = Generator.Generate(definition, Seed.Parse(entry.Name));
                Assert.Equal((expected[0], expected[1]), (a, b));
                checkedSeeds++;
            }
        }

        Assert.True(checkedSeeds >= 20, $"the golden fixture must hold ten seeds per pilot definition; found {checkedSeeds}");
    }

    [Fact]
    public void Seed_42_follows_from_the_raw_vector_by_hand()
    {
        // Raw output 1 for seed 42 is 13679457532755275413 (proposal vector). No rejection occurs for N = 45 or 36
        // because the raw value is far below the rejection limit, so index = raw mod N.
        const ulong raw = 13679457532755275413UL;
        foreach (var (key, n) in new[] { ("numbers.addition.within-10@1", 45UL), ("numbers.addition.crossing-ten@1", 36UL) })
        {
            var definition = Catalog.Definitions[key];
            var pool = AdditionPairGenerator.Enumerate(definition.Generator!);
            Assert.Equal(pool[(int)(raw % n)], Generator.Generate(definition, new Seed(42)));
        }
    }

    [Theory]
    [InlineData("numbers.addition.within-10@1")]
    [InlineData("numbers.addition.crossing-ten@1")]
    public void Every_seed_stays_within_bounds_and_within_every_listed_representation(string key)
    {
        var definition = Catalog.Definitions[key];
        var spec = definition.Generator!;
        var operand = spec.Parameters["operand"];
        var sum = spec.Parameters["sum"];
        var representations = definition.Representations.Help.Concat(definition.Representations.Explanation).Distinct().Select(n => Catalog.Representations[n]).ToList();
        var seen = new HashSet<(int, int)>();

        for (ulong seed = 0; seed < 10_000; seed++)
        {
            var (a, b) = Generator.Generate(definition, new Seed(seed));
            Assert.InRange(a, operand.Min, operand.Max);
            Assert.InRange(b, operand.Min, operand.Max);
            Assert.InRange(a + b, sum.Min, sum.Max);
            foreach (var representation in representations)
            {
                foreach (var (quantity, bounds) in representation.Supports)
                {
                    var value = quantity switch
                    {
                        "operand" => (Math.Min(a, b), Math.Max(a, b)),
                        "sum" => (a + b, a + b),
                        _ => throw new InvalidOperationException($"unexpected quantity {quantity}"),
                    };
                    Assert.True(value.Item1 >= bounds.Min && value.Item2 <= bounds.Max, $"{representation.Name} cannot show {a} + {b} ({quantity} {bounds.Min}–{bounds.Max})");
                }
            }

            seen.Add((a, b));
        }

        Assert.Equal(Generator.PoolSize(definition), seen.Count);
    }

    [Fact]
    public void Boundary_fixtures_of_DL_009()
    {
        var within = AdditionPairGenerator.Enumerate(Catalog.Definitions["numbers.addition.within-10@1"].Generator!);
        var crossing = AdditionPairGenerator.Enumerate(Catalog.Definitions["numbers.addition.crossing-ten@1"].Generator!);
        Assert.Contains((4, 4), within);
        Assert.Contains((9, 9), crossing);
        Assert.DoesNotContain((19, 1), within);
        Assert.DoesNotContain((19, 1), crossing);
        Assert.DoesNotContain((1, 19), crossing);
    }

    [Fact]
    public void Agrees_with_the_registry_entry()
    {
        var entry = Catalog.Generators["addition-pair@1"];
        Assert.Equal(Generator.Name, entry.Name);
        Assert.Equal(Generator.Version, entry.Version);
        Assert.Equal(new[] { "operand", "sum" }, entry.Parameters.Keys.OrderBy(k => k, StringComparer.Ordinal));
        Assert.Equal("sum-of-two-operands", entry.Relation);
        foreach (var key in PilotDefinitions)
        {
            var spec = Catalog.Definitions[key].Generator!;
            foreach (var (name, bounds) in spec.Parameters)
            {
                var domain = entry.Parameters[name];
                Assert.InRange(bounds.Min, domain.Min, domain.Max);
                Assert.InRange(bounds.Max, domain.Min, domain.Max);
            }
        }
    }
}
