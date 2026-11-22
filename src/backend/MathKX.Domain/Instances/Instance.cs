using System.Globalization;
using MathKX.Domain.Content;
using MathKX.Domain.Random;
using MathKX.Domain.Validators;

namespace MathKX.Domain.Instances;

/// <summary>(definition ID, definition version, seed). Fixed tasks have no seed.</summary>
public sealed record InstanceIdentity(string DefinitionId, int Version, Seed? Seed)
{
    public string DefinitionKey => $"{DefinitionId}@{Version}";
}

/// <summary>
/// A resolved question: presentation data only. There is deliberately no Sum member. <see cref="Form"/> says how A
/// and B are asked (specs/009 FR-003): <c>A + B = ?</c> for addition, <c>x + A = B</c> for an unknown addend,
/// <c>Ax = B</c> for an unknown factor (specs/010), and <c>Ax + C = B</c> for a two-step equation (specs/011), the one
/// form with a third number <see cref="C"/>.
/// </summary>
public sealed record Instance(
    InstanceIdentity Identity,
    string Skill,
    int A,
    int B,
    RepresentationRoles Representations,
    NamedVersion? Generator,
    NamedVersion Validator,
    string Form = QuestionForms.Addition,
    int? C = null)
{
    public string Prompt => Form switch
    {
        QuestionForms.UnknownAddend => string.Create(CultureInfo.InvariantCulture, $"x + {A} = {B}"),
        QuestionForms.UnknownFactor => string.Create(CultureInfo.InvariantCulture, $"{A}x = {B}"),
        QuestionForms.TwoStep => string.Create(CultureInfo.InvariantCulture, $"{A}x + {C} = {B}"),
        _ => string.Create(CultureInfo.InvariantCulture, $"{A} + {B}"),
    };
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
