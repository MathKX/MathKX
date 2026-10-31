using MathKX.Domain.Content;
using MathKX.Domain.Random;

namespace MathKX.Domain.Generators;

/// <summary>One question of a variation's pool: its operands and the smallest seed that generates it (null for a fixed task).</summary>
public sealed record PoolQuestion(Seed? Seed, int A, int B);

/// <summary>
/// A variation's pool (specs/005 contracts/pool.md): every question the definition admits, in the generator's
/// canonical order, each with the smallest seed whose draw is that question. The learner app chooses among them to
/// avoid recent questions; a listed seed resolves through the ordinary identity, so avoidance never changes what an
/// identity means (ADR 0004).
/// </summary>
public sealed record QuestionPool(string Definition, IReadOnlyList<PoolQuestion> Questions)
{
    /// <summary>The most seeds tried per definition; covering a pool of n questions takes about n · ln n on average.</summary>
    public const ulong DefaultLimit = 65_536;

    /// <summary>Builds the pool, trying seeds 0, 1, 2, … until every question has one; throws if the limit is reached first.</summary>
    public static QuestionPool For(ExerciseDefinition definition, GeneratorRegistry generators, ulong limit = DefaultLimit)
    {
        if (definition.IsFixed)
        {
            var prompt = definition.Instance!.Prompt;
            return new QuestionPool(definition.Key, [new PoolQuestion(null, prompt["a"], prompt["b"])]);
        }

        var spec = definition.Generator ?? throw new InvalidOperationException($"{definition.Key} has neither a generator nor a fixed instance.");
        if (!generators.TryGet(spec.Key, out var generator))
        {
            throw new InvalidOperationException($"{definition.Key} names generator {spec.Key}, which is not registered.");
        }

        var questions = generator.Enumerate(definition);
        var smallest = new Dictionary<(int A, int B), Seed>();
        for (ulong value = 0; value < limit && smallest.Count < questions.Count; value++)
        {
            var seed = new Seed(value);
            smallest.TryAdd(generator.Generate(definition, seed), seed);
        }

        if (smallest.Count < questions.Count)
        {
            throw new InvalidOperationException($"{definition.Key}: {questions.Count - smallest.Count} of {questions.Count} questions have no seed below {limit}.");
        }

        return new QuestionPool(definition.Key, questions.Select(q => new PoolQuestion(smallest[q], q.A, q.B)).ToList());
    }
}
