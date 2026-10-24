using System.Text.Json;

namespace MathKX.Domain.Content;

// Record types mirroring the 0.1-pilot content schemas (schemas/*.schema.json). No I/O here;
// MathKX.Content loads them. Property names follow the JSON (camelCase) under web defaults.

public sealed record Bounds(int Min, int Max);

public sealed record NamedVersion(string Name, int Version)
{
    public string Key => $"{Name}@{Version}";
}

public sealed record GeneratorSpec(string Name, int Version, IReadOnlyDictionary<string, Bounds> Parameters, IReadOnlyList<string>? Constraints)
{
    public string Key => $"{Name}@{Version}";
}

public sealed record InstanceSpec(IReadOnlyDictionary<string, int> Prompt, IReadOnlyDictionary<string, JsonElement> Validation);

public sealed record RepresentationRoles(IReadOnlyList<string> Help, IReadOnlyList<string> Explanation);

public sealed record ExerciseDefinition(
    string Id,
    int Version,
    string Skill,
    string Source,
    NamedVersion Validator,
    GeneratorSpec? Generator,
    InstanceSpec? Instance,
    RepresentationRoles Representations,
    IReadOnlyList<string> MisconceptionCodes)
{
    public string Key => $"{Id}@{Version}";

    public bool IsFixed => string.Equals(Source, "fixed", StringComparison.Ordinal);
}

public sealed record ParameterDomain(string Quantity, int Min, int Max);

public sealed record GeneratorEntry(
    string Name,
    int Version,
    string? Relation,
    IReadOnlyList<string>? Constraints,
    IReadOnlyDictionary<string, ParameterDomain> Parameters,
    IReadOnlyList<string> Produces)
{
    public string Key => $"{Name}@{Version}";
}

public sealed record ArtifactSpec(string Type, int? Min, int? Max);

public sealed record ValidatorEntry(string Name, int Version, ArtifactSpec Artifact, IReadOnlyList<string> Emits)
{
    public string Key => $"{Name}@{Version}";
}

public sealed record RepresentationEntry(
    string Name,
    IReadOnlyList<string> Role,
    IReadOnlyList<string> Reads,
    IReadOnlyDictionary<string, Bounds> Supports);

public sealed record AttributeSpec(string Type, int? Min, int? Max, bool? Required);

public sealed record VisualComponentEntry(string Type, IReadOnlyDictionary<string, AttributeSpec> Attributes, string? Representation);

public sealed record MisconceptionCodeEntry(string Code, string Validator);

public sealed record Localized(string Nb, string En)
{
    public string For(string language) => language == "nb" ? Nb : En;
}

public sealed record LadderEntry(string Definition, int Version, Localized Description)
{
    public string Key => $"{Definition}@{Version}";
}

public sealed record Skill(string Id, IReadOnlyList<string> Prerequisites, IReadOnlyList<LadderEntry>? Ladder);

public sealed record PracticeRef(string Definition, int Version)
{
    public string Key => $"{Definition}@{Version}";
}

public sealed record Translations(string Nb, string En);

public sealed record LessonMetadata(
    string Id,
    int Version,
    string Status,
    IReadOnlyList<string> Skills,
    IReadOnlyList<string>? Prerequisites,
    IReadOnlyList<string>? RelatedSkills,
    IReadOnlyList<string>? RelatedLessons,
    IReadOnlyList<PracticeRef> Practice,
    IReadOnlyList<string>? Visuals,
    Translations Translations);

public sealed record LessonFrontMatter(string Title, string Objective);
