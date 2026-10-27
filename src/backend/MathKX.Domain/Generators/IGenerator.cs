using MathKX.Domain.Content;
using MathKX.Domain.Random;

namespace MathKX.Domain.Generators;

/// <summary>A registered, versioned generator. The implementation must match its registry entry.</summary>
public interface IGenerator
{
    string Name { get; }

    int Version { get; }

    string Key => $"{Name}@{Version}";

    /// <summary>The operands for this definition and seed. Deterministic; consumes a fresh stream seeded with the seed.</summary>
    (int A, int B) Generate(ExerciseDefinition definition, Seed seed);

    /// <summary>How many distinct instances the definition's bounds admit.</summary>
    int PoolSize(ExerciseDefinition definition);

    /// <summary>Every instance the definition's bounds admit, in the generator's canonical order (specs/005 pools).</summary>
    IReadOnlyList<(int A, int B)> Enumerate(ExerciseDefinition definition);
}

/// <summary>Generators by <c>name@version</c>. A new version is a new registration; definitions pin the one they use.</summary>
public sealed class GeneratorRegistry
{
    private readonly Dictionary<string, IGenerator> _generators = new(StringComparer.Ordinal);

    public static GeneratorRegistry Default()
    {
        var registry = new GeneratorRegistry();
        registry.Register(new AdditionPairGenerator());
        return registry;
    }

    public void Register(IGenerator generator)
    {
        _generators[generator.Key] = generator;
    }

    public bool TryGet(string key, out IGenerator generator) => _generators.TryGetValue(key, out generator!);

    public IReadOnlyCollection<string> Keys => _generators.Keys;
}
