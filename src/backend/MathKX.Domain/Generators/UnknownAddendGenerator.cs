using MathKX.Domain.Content;
using MathKX.Domain.Random;

namespace MathKX.Domain.Generators;

/// <summary>
/// <c>unknown-addend@1</c> (specs/009 FR-001): the equation <c>x + a = b</c>. Enumerates the feasible pairs in
/// canonical order (addend <c>a</c> ascending, then unknown <c>x</c> ascending, kept when <c>b = a + x</c> lies in
/// the total bounds) and draws one index with <see cref="BoundedSampler.NextBelow"/> on a fresh stream seeded with
/// the seed. Returns <c>(a, b)</c>: the instance carries the addend and the total, never <c>x</c>.
/// </summary>
public sealed class UnknownAddendGenerator : IGenerator
{
    public string Name => "unknown-addend";

    public int Version => 1;

    public (int A, int B) Generate(ExerciseDefinition definition, Seed seed)
    {
        var pool = Enumerate(Spec(definition));
        if (pool.Count == 0)
        {
            throw new InvalidOperationException($"{definition.Key} admits no equation; the content check should have refused it.");
        }

        var index = BoundedSampler.NextBelow(new SplitMix64(seed), (ulong)pool.Count);
        return pool[(int)index];
    }

    public int PoolSize(ExerciseDefinition definition) => Enumerate(Spec(definition)).Count;

    public IReadOnlyList<(int A, int B)> Enumerate(ExerciseDefinition definition) => Enumerate(Spec(definition));

    /// <summary>The canonical enumeration: part of the contract; changing it is a new generator version.</summary>
    public static IReadOnlyList<(int A, int B)> Enumerate(GeneratorSpec spec)
    {
        var addend = spec.Parameters["addend"];
        var unknown = spec.Parameters["unknown"];
        var total = spec.Parameters["total"];
        var pool = new List<(int, int)>();
        for (var a = addend.Min; a <= addend.Max; a++)
        {
            for (var x = unknown.Min; x <= unknown.Max; x++)
            {
                var b = a + x;
                if (b >= total.Min && b <= total.Max)
                {
                    pool.Add((a, b));
                }
            }
        }

        return pool;
    }

    private GeneratorSpec Spec(ExerciseDefinition definition)
    {
        if (definition.Generator is null || definition.Generator.Key != ((IGenerator)this).Key)
        {
            throw new ArgumentException($"{definition.Key} does not use {((IGenerator)this).Key}.", nameof(definition));
        }

        foreach (var name in new[] { "addend", "unknown", "total" })
        {
            if (!definition.Generator.Parameters.ContainsKey(name))
            {
                throw new ArgumentException($"{definition.Key} must give addend, unknown, and total bounds.", nameof(definition));
            }
        }

        return definition.Generator;
    }
}
