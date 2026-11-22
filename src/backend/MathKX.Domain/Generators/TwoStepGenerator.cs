using MathKX.Domain.Content;
using MathKX.Domain.Random;

namespace MathKX.Domain.Generators;

/// <summary>
/// <c>two-step@1</c> (specs/011 FR-004): the equation <c>ax + c = b</c>. Enumerates the feasible questions in canonical
/// order (factor <c>a</c> ascending, then addend <c>c</c>, then unknown <c>x</c>, kept when <c>b = a · x + c</c> lies in
/// the total bounds) and draws one index with <see cref="BoundedSampler.NextBelow"/> on a fresh stream seeded with the
/// seed. The question carries <c>a</c>, <c>b</c>, and <c>c</c>, never <c>x</c>.
/// </summary>
public sealed class TwoStepGenerator : IGenerator
{
    public string Name => "two-step";

    public int Version => 1;

    /// <summary>The first two numbers only; practice uses <see cref="GenerateOperands"/>, which carries <c>c</c>.</summary>
    public (int A, int B) Generate(ExerciseDefinition definition, Seed seed)
    {
        var drawn = GenerateOperands(definition, seed);
        return (drawn.A, drawn.B);
    }

    public Operands GenerateOperands(ExerciseDefinition definition, Seed seed)
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

    /// <summary>The first two numbers only; pools use <see cref="EnumerateOperands"/>, which carries <c>c</c>.</summary>
    public IReadOnlyList<(int A, int B)> Enumerate(ExerciseDefinition definition) => Enumerate(Spec(definition)).Select(q => (q.A, q.B)).ToList();

    public IReadOnlyList<Operands> EnumerateOperands(ExerciseDefinition definition) => Enumerate(Spec(definition));

    /// <summary>The canonical enumeration: part of the contract; changing it is a new generator version.</summary>
    public static IReadOnlyList<Operands> Enumerate(GeneratorSpec spec)
    {
        var factor = spec.Parameters["factor"];
        var addend = spec.Parameters["addend"];
        var unknown = spec.Parameters["unknown"];
        var total = spec.Parameters["total"];
        var pool = new List<Operands>();
        for (var a = factor.Min; a <= factor.Max; a++)
        {
            for (var c = addend.Min; c <= addend.Max; c++)
            {
                for (var x = unknown.Min; x <= unknown.Max; x++)
                {
                    var b = (a * x) + c;
                    if (b >= total.Min && b <= total.Max)
                    {
                        pool.Add(new Operands(a, b, c));
                    }
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

        foreach (var name in new[] { "factor", "addend", "unknown", "total" })
        {
            if (!definition.Generator.Parameters.ContainsKey(name))
            {
                throw new ArgumentException($"{definition.Key} must give factor, addend, unknown, and total bounds.", nameof(definition));
            }
        }

        return definition.Generator;
    }
}
