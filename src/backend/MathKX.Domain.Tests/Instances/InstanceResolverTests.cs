using MathKX.Content;
using MathKX.Domain.Content;
using MathKX.Domain.Generators;
using MathKX.Domain.Instances;
using MathKX.Domain.Random;
using MathKX.Domain.Tests.Content;

namespace MathKX.Domain.Tests.Instances;

public sealed class InstanceResolverTests
{
    private static readonly ContentCatalog Catalog = ContentLoader.Load(RepositoryContent.Root);

    private static InstanceResolver Resolver(GeneratorRegistry? registry = null) => new(Catalog, registry ?? GeneratorRegistry.Default());

    [Fact]
    public void Replay_fixture_resolves_identically_under_four_conditions()
    {
        var identity = new InstanceIdentity("numbers.addition.crossing-ten", 1, new Seed(42));

        var inNorwegian = Resolver().Resolve(identity);          // language never reaches the resolver
        var inEnglish = Resolver().Resolve(identity);
        var afterLadderMoves = Resolver().Resolve(new InstanceIdentity("numbers.addition.within-10", 1, new Seed(7))) is not null
            ? Resolver().Resolve(identity)                       // other work in between changes nothing
            : null;
        var withVersionTwo = Resolver(WithStubVersionTwo()).Resolve(identity);

        Assert.Equal((inNorwegian.A, inNorwegian.B), (inEnglish.A, inEnglish.B));
        Assert.Equal((inNorwegian.A, inNorwegian.B), (afterLadderMoves!.A, afterLadderMoves.B));
        Assert.Equal((inNorwegian.A, inNorwegian.B), (withVersionTwo.A, withVersionTwo.B));
        Assert.Equal(new NamedVersion("addition-pair", 1), inNorwegian.Generator);
        Assert.Equal(new NamedVersion("integer-answer", 1), inNorwegian.Validator);
        Assert.InRange(inNorwegian.A + inNorwegian.B, 11, 18);
    }

    [Fact]
    public void A_definition_pinned_to_version_two_resolves_differently_while_version_one_is_unchanged()
    {
        var registry = WithStubVersionTwo();
        var catalogWithV2 = WithDefinitionPinnedTo("addition-pair", 2);
        var resolver = new InstanceResolver(catalogWithV2, registry);

        var v1 = resolver.Resolve(new InstanceIdentity("numbers.addition.crossing-ten", 1, new Seed(42)));
        var v2 = resolver.Resolve(new InstanceIdentity("numbers.addition.crossing-ten", 2, new Seed(42)));

        Assert.Equal(Resolver().Resolve(new InstanceIdentity("numbers.addition.crossing-ten", 1, new Seed(42))).A, v1.A);
        Assert.NotEqual((v1.A, v1.B), (v2.A, v2.B));
        Assert.Equal(new NamedVersion("addition-pair", 2), v2.Generator);
    }

    [Fact]
    public void Fixed_tasks_resolve_without_a_seed_and_ignore_a_supplied_one()
    {
        var withoutSeed = Resolver().Resolve(new InstanceIdentity("numbers.addition.four-plus-four", 1, null));
        var withSeed = Resolver().Resolve(new InstanceIdentity("numbers.addition.four-plus-four", 1, new Seed(99)));

        Assert.Equal((4, 4), (withoutSeed.A, withoutSeed.B));
        Assert.Equal(withoutSeed, withSeed);
        Assert.Null(withSeed.Identity.Seed);
        Assert.Null(withSeed.Generator);
    }

    [Fact]
    public void Unknown_definitions_versions_and_missing_seeds_are_typed_errors()
    {
        Assert.Throws<UnknownDefinitionException>(() => Resolver().Resolve(new InstanceIdentity("numbers.addition.nope", 1, new Seed(1))));
        Assert.Throws<UnknownDefinitionException>(() => Resolver().Resolve(new InstanceIdentity("numbers.addition.within-10", 9, new Seed(1))));
        Assert.Throws<MissingSeedException>(() => Resolver().Resolve(new InstanceIdentity("numbers.addition.within-10", 1, null)));
    }

    [Fact]
    public void The_instance_carries_no_sum()
    {
        var instance = Resolver().Resolve(new InstanceIdentity("numbers.addition.within-10", 1, new Seed(3)));
        Assert.DoesNotContain(typeof(Instance).GetProperties(), p => p.Name.Equals("Sum", StringComparison.OrdinalIgnoreCase));
        Assert.Equal($"{instance.A} + {instance.B}", instance.Prompt);
    }

    private static GeneratorRegistry WithStubVersionTwo()
    {
        var registry = GeneratorRegistry.Default();
        registry.Register(new StubVersionTwo());
        return registry;
    }

    private static ContentCatalog WithDefinitionPinnedTo(string generator, int version)
    {
        var original = Catalog.Definitions["numbers.addition.crossing-ten@1"];
        var pinned = original with { Version = 2, Generator = original.Generator! with { Name = generator, Version = version } };
        var definitions = new Dictionary<string, ExerciseDefinition>(Catalog.Definitions) { [pinned.Key] = pinned };
        var generators = new Dictionary<string, GeneratorEntry>(Catalog.Generators)
        {
            [$"{generator}@{version}"] = Catalog.Generators["addition-pair@1"] with { Version = version },
        };
        return new ContentCatalog(generators, Catalog.Validators, Catalog.Representations, Catalog.VisualComponents, Catalog.MisconceptionCodes, Catalog.Skills, definitions, Catalog.Lessons, Catalog.Translations, Catalog.Lessons.Keys.ToDictionary(id => id, Catalog.Assets));
    }

    /// <summary>A hypothetical addition-pair@2 that enumerates in the opposite order, so the same seed yields another pair.</summary>
    private sealed class StubVersionTwo : IGenerator
    {
        public string Name => "addition-pair";

        public int Version => 2;

        public (int A, int B) Generate(ExerciseDefinition definition, Seed seed)
        {
            var pool = AdditionPairGenerator.Enumerate(definition.Generator!).Reverse().ToList();
            var index = BoundedSampler.NextBelow(new SplitMix64(seed), (ulong)pool.Count);
            return pool[(int)index];
        }

        public int PoolSize(ExerciseDefinition definition) => AdditionPairGenerator.Enumerate(definition.Generator!).Count;
    }
}
