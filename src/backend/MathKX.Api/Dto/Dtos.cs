using MathKX.Domain.Content;
using MathKX.Domain.Instances;
using MathKX.Domain.Results;

namespace MathKX.Api.Dto;

// Presentation shapes (specs/002 contracts/api.md). By construction none of these types has a sum or
// validation member, so private data cannot be serialized by accident.

public sealed record NamedVersionDto(string Name, int Version)
{
    public static NamedVersionDto From(NamedVersion v) => new(v.Name, v.Version);
}

public sealed record IdentityDto(string DefinitionId, int Version, string? Seed)
{
    public static IdentityDto From(InstanceIdentity identity) => new(identity.DefinitionId, identity.Version, identity.Seed?.Format());
}

public sealed record RepresentationsDto(IReadOnlyList<string> Help, IReadOnlyList<string> Explanation);

public sealed record InstanceDto(
    IdentityDto Identity,
    string Skill,
    int A,
    int B,
    string Prompt,
    RepresentationsDto Representations,
    NamedVersionDto? Generator,
    NamedVersionDto Validator)
{
    public static InstanceDto From(Instance instance) => new(
        IdentityDto.From(instance.Identity),
        instance.Skill,
        instance.A,
        instance.B,
        instance.Prompt,
        new RepresentationsDto(instance.Representations.Help, instance.Representations.Explanation),
        instance.Generator is null ? null : NamedVersionDto.From(instance.Generator),
        NamedVersionDto.From(instance.Validator));
}

public sealed record ArtifactDto(string Kind, string OriginalText);

public sealed record IdentityRequestDto(string DefinitionId, int Version, string? Seed);

public sealed record ValidationRequestDto(IdentityRequestDto Identity, ArtifactDto Artifact, string? SubmissionId);

public sealed record ValidationResponseDto(
    string Status,
    string Code,
    IReadOnlyDictionary<string, object> Values,
    NamedVersionDto Validator,
    string? SubmissionId)
{
    public static ValidationResponseDto From(ValidationResult result, string? submissionId) =>
        new(result.Status.ToWire(), result.Code, result.Values, NamedVersionDto.From(result.Validator), submissionId);
}

public sealed record LocalizedDto(string Nb, string En);

public sealed record PracticeEntryDto(string Definition, int Version, string Skill);

public sealed record LessonSummaryDto(
    string Id,
    int Version,
    string Status,
    IReadOnlyList<string> Skills,
    LocalizedDto Titles,
    IReadOnlyList<PracticeEntryDto> Practice);

public sealed record LessonDto(
    string Id,
    int Version,
    string Status,
    IReadOnlyList<string> Skills,
    LocalizedDto Titles,
    LocalizedDto Objectives,
    IReadOnlyList<PracticeEntryDto> Practice,
    IReadOnlyList<string> Visuals,
    LocalizedDto Translations);

public sealed record LessonContentDto(string Id, int Version, string Language, string Markdown);

public sealed record LadderEntryDto(string Definition, int Version, LocalizedDto Description);

public sealed record SkillDto(string Id, IReadOnlyList<string> Prerequisites, IReadOnlyList<LadderEntryDto> Ladder);

public sealed record StepTextDto(string Code, IReadOnlyDictionary<string, object> Values);

public sealed record StepDto(
    string Kind,
    string Representation,
    int Index,
    int Count,
    bool Reveals,
    IReadOnlyDictionary<string, object> Visual,
    StepTextDto Text)
{
    public static StepDto From(MathKX.Domain.Explanations.StepModel step) =>
        new(step.Kind, step.Representation, step.Index, step.Count, step.Reveals, step.Visual, new StepTextDto(step.Text.Code, step.Text.Values));
}
