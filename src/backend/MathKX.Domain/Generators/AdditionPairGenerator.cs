using MathKX.Domain.Content;
using MathKX.Domain.Random;

namespace MathKX.Domain.Generators;

/// <summary>
/// <c>addition-pair@1</c> (specs/002 contracts/generator-addition-pair.md): enumerate the feasible ordered pairs
/// in canonical order (first operand ascending, then second, filtered by the sum bounds) and draw exactly one
/// index with <see cref="BoundedSampler.NextBelow"/> on a fresh stream seeded with the seed.
/// </summary>
public sealed class AdditionPairGenerator : IGenerator
{
    public string Name => "addition-pair";

    public int Version => 1;

    public (int A, int B) Generate(ExerciseDefinition definition, Seed seed)
    {
        var pool = Enumerate(Spec(definition));
        if (pool.Count == 0)
        {
            throw new InvalidOperationException($"{definition.Key} admits no operand pair; the content check should have refused it.");
        }

        var index = BoundedSampler.NextBelow(new SplitMix64(seed), (ulong)pool.Count);
        return pool[(int)index];
    }

    public int PoolSize(ExerciseDefinition definition) => Enumerate(Spec(definition)).Count;

    /// <summary>The canonical enumeration: part of the contract; changing it is a new generator version.</summary>
    public static IReadOnlyList<(int A, int B)> Enumerate(GeneratorSpec spec)
    {
        var operand = spec.Parameters["operand"];
        var sum = spec.Parameters["sum"];
        var pool = new List<(int, int)>();
        for (var a = operand.Min; a <= operand.Max; a++)
        {
            for (var b = operand.Min; b <= operand.Max; b++)
            {
                var total = a + b;
                if (total >= sum.Min && total <= sum.Max)
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

        if (!definition.Generator.Parameters.ContainsKey("operand") || !definition.Generator.Parameters.ContainsKey("sum"))
        {
            throw new ArgumentException($"{definition.Key} must give operand and sum bounds.", nameof(definition));
        }

        return definition.Generator;
    }
}
