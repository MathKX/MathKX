using MathKX.Domain.Content;
using MathKX.Domain.Generators;
using MathKX.Domain.Validators;

namespace MathKX.Api;

/// <summary>
/// Every definition's pool, built once when the service starts (specs/005 research R2): the work has a fixed limit,
/// and a pool that cannot be covered stops the start with the definition named, like any other content error.
/// </summary>
public sealed class QuestionPools
{
    private readonly IReadOnlyDictionary<string, QuestionPool> _pools;

    public QuestionPools(ContentCatalog catalog, GeneratorRegistry generators, ValidatorRegistry validators) =>
        _pools = catalog.Definitions.Values.ToDictionary(d => d.Key, d => QuestionPool.For(d, generators, validators), StringComparer.Ordinal);

    public bool TryGet(string definitionKey, out QuestionPool pool) => _pools.TryGetValue(definitionKey, out pool!);
}
