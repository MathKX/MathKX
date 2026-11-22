using MathKX.Domain.Content;
using MathKX.Domain.Generators;
using MathKX.Domain.Validators;

namespace MathKX.Domain.Instances;

/// <summary>
/// Resolves an identity to an instance: definition at its pinned version, generator at the version the definition
/// pins, or the fixed prompt; the definition's validator decides the question form.
/// </summary>
public sealed class InstanceResolver(ContentCatalog catalog, GeneratorRegistry generators, ValidatorRegistry validators)
{
    public InstanceResolver(ContentCatalog catalog, GeneratorRegistry generators)
        : this(catalog, generators, ValidatorRegistry.Default())
    {
    }

    public Instance Resolve(InstanceIdentity identity)
    {
        if (!catalog.TryGetDefinition(identity.DefinitionId, identity.Version, out var definition))
        {
            throw new UnknownDefinitionException(identity.DefinitionKey);
        }

        var form = validators.Get(definition.Validator).Form;
        if (definition.IsFixed)
        {
            var prompt = definition.Instance!.Prompt;
            // A supplied seed is accepted and ignored: the identity of a fixed task is (definition, version).
            int? c = prompt.TryGetValue("c", out var third) ? third : null;
            return new Instance(identity with { Seed = null }, definition.Skill, prompt["a"], prompt["b"], definition.Representations, null, definition.Validator, form, c);
        }

        if (identity.Seed is not { } seed)
        {
            throw new MissingSeedException(identity.DefinitionKey);
        }

        var spec = definition.Generator!;
        if (!generators.TryGet(spec.Key, out var generator))
        {
            throw new UnknownGeneratorException(spec.Key);
        }

        var drawn = generator.GenerateOperands(definition, seed);
        return new Instance(identity, definition.Skill, drawn.A, drawn.B, definition.Representations, new NamedVersion(spec.Name, spec.Version), definition.Validator, form, drawn.C);
    }
}
