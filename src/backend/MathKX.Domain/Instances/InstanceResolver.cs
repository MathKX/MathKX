using MathKX.Domain.Content;
using MathKX.Domain.Generators;

namespace MathKX.Domain.Instances;

/// <summary>Resolves an identity to an instance: definition at its pinned version, generator at the version the definition pins, or the fixed prompt.</summary>
public sealed class InstanceResolver(ContentCatalog catalog, GeneratorRegistry generators)
{
    public Instance Resolve(InstanceIdentity identity)
    {
        if (!catalog.TryGetDefinition(identity.DefinitionId, identity.Version, out var definition))
        {
            throw new UnknownDefinitionException(identity.DefinitionKey);
        }

        if (definition.IsFixed)
        {
            var prompt = definition.Instance!.Prompt;
            // A supplied seed is accepted and ignored: the identity of a fixed task is (definition, version).
            return new Instance(identity with { Seed = null }, definition.Skill, prompt["a"], prompt["b"], definition.Representations, null, definition.Validator);
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

        var (a, b) = generator.Generate(definition, seed);
        return new Instance(identity, definition.Skill, a, b, definition.Representations, new NamedVersion(spec.Name, spec.Version), definition.Validator);
    }
}
