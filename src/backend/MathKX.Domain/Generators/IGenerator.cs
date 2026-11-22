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

    /// <summary>
    /// The operands with the third number, for forms that have one (specs/011 FR-001). Practice and pools use these;
    /// a two-number generator need not override them.
    /// </summary>
    Operands GenerateOperands(ExerciseDefinition definition, Seed seed)
    {
        var (a, b) = Generate(definition, seed);
        return new Operands(a, b);
    }

    /// <summary>Every instance with its third number, in the canonical order of <see cref="Enumerate"/>.</summary>
    IReadOnlyList<Operands> EnumerateOperands(ExerciseDefinition definition) => Enumerate(definition).Select(q => new Operands(q.A, q.B)).ToList();
}

/// <summary>Generators by <c>name@version</c>. A new version is a new registration; definitions pin the one they use.</summary>
public sealed class GeneratorRegistry
{
    private readonly Dictionary<string, IGenerator> _generators = new(StringComparer.Ordinal);

    public static GeneratorRegistry Default()
    {
        var registry = new GeneratorRegistry();
        registry.Register(new AdditionPairGenerator());
        registry.Register(new UnknownAddendGenerator());
        registry.Register(new UnknownFactorGenerator());
        registry.Register(new TwoStepGenerator());
        return registry;
    }

    public void Register(IGenerator generator)
    {
        _generators[generator.Key] = generator;
    }

    public bool TryGet(string key, out IGenerator generator) => _generators.TryGetValue(key, out generator!);

    public IReadOnlyCollection<string> Keys => _generators.Keys;
}
