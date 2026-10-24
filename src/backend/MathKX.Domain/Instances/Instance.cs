using System.Globalization;
using MathKX.Domain.Content;
using MathKX.Domain.Random;

namespace MathKX.Domain.Instances;

/// <summary>(definition ID, definition version, seed). Fixed tasks have no seed.</summary>
public sealed record InstanceIdentity(string DefinitionId, int Version, Seed? Seed)
{
    public string DefinitionKey => $"{DefinitionId}@{Version}";
}

/// <summary>A resolved question: presentation data only. There is deliberately no Sum member.</summary>
public sealed record Instance(
    InstanceIdentity Identity,
    string Skill,
    int A,
    int B,
    RepresentationRoles Representations,
    NamedVersion? Generator,
    NamedVersion Validator)
{
    public string Prompt => string.Create(CultureInfo.InvariantCulture, $"{A} + {B}");
}

public sealed class UnknownDefinitionException(string key) : Exception($"Definition {key} is not defined.")
{
    public string Key { get; } = key;
}

public sealed class MissingSeedException(string key) : Exception($"Definition {key} is generated and needs a seed.")
{
    public string Key { get; } = key;
}

public sealed class UnknownGeneratorException(string key) : Exception($"Generator {key} is registered in content but not implemented.")
{
    public string Key { get; } = key;
}
