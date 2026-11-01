using System.Text.Json.Serialization;
using MathKX.Domain.Content;
using MathKX.Domain.Generators;
using MathKX.Domain.Instances;
using MathKX.Domain.Results;

namespace MathKX.Api.Dto;

// Presentation shapes (specs/002 contracts/api.md). By construction none of these types has a sum or
// validation member, so private data cannot be serialized by accident; the one exception is AnswerDto (specs/006).

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
    NamedVersionDto Validator,
    IReadOnlyList<LessonDisclosureDto> Lessons)
{
    public static InstanceDto From(Instance instance, IReadOnlyList<LessonDisclosureDto> lessons) => new(
        IdentityDto.From(instance.Identity),
        instance.Skill,
        instance.A,
        instance.B,
        instance.Prompt,
        new RepresentationsDto(instance.Representations.Help, instance.Representations.Explanation),
        instance.Generator is null ? null : NamedVersionDto.From(instance.Generator),
        NamedVersionDto.From(instance.Validator),
        lessons);
}

/// <summary>A lesson that lists the instance's definition and whether it shows this instance's answer (specs/003); never the sum.</summary>
public sealed record LessonDisclosureDto(string Id, bool Discloses);

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

public sealed record VisualStepsDto(string Type, int A, int B, IReadOnlyList<StepDto> Steps);

public sealed record TenFrameExplorerStateDto(int Filled, int Partner);

public sealed record TenFrameExplorerDto(string Type, IReadOnlyList<TenFrameExplorerStateDto> States);

public sealed record LadderEntryDto(string Definition, int Version, LocalizedDto Description);

/// <summary>A skill with its learner-facing name and the keys (<c>id@version</c>) of its definitions (specs/004 contracts/api.md).</summary>
public sealed record SkillDto(string Id, LocalizedDto Name, IReadOnlyList<string> Prerequisites, IReadOnlyList<LadderEntryDto> Ladder, IReadOnlyList<string> Definitions);

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

/// <summary>A self-check (specs/006 contracts/api.md): question identities only, never operands or sums.</summary>
public sealed record CheckDto(string Id, int Version, string Skill, LocalizedDto Title, LocalizedDto Scope, IReadOnlyList<CheckQuestionDto> Questions)
{
    public static CheckDto From(SelfCheck check) => new(
        check.Id,
        check.Version,
        check.Skill,
        new LocalizedDto(check.Title.Nb, check.Title.En),
        new LocalizedDto(check.Scope.Nb, check.Scope.En),
        check.Questions.Select(q => new CheckQuestionDto(q.Definition, q.Version, q.Seed)).ToList());
}

public sealed record CheckQuestionDto(string Definition, int Version, string? Seed);

/// <summary>The answer to one question and the operands it belongs to; requested only by the check summary (specs/006).</summary>
public sealed record AnswerDto(IdentityDto Identity, int A, int B, AnswerValueDto Answer);

public sealed record AnswerValueDto(string Kind, int Value);

/// <summary>A variation's pool (specs/005 contracts/pool.md): operands and seeds only, never a sum.</summary>
public sealed record PoolDto(string Definition, int Version, IReadOnlyList<PoolQuestionDto> Questions)
{
    public static PoolDto From(QuestionPool pool, int version) =>
        new(pool.Definition[..pool.Definition.LastIndexOf('@')], version, pool.Questions.Select(q => new PoolQuestionDto(q.Seed?.Format(), q.A, q.B)).ToList());
}

/// <summary>One question; <c>seed</c> is written even when null (a fixed task), unlike other optional fields.</summary>
public sealed record PoolQuestionDto(
    [property: JsonIgnore(Condition = JsonIgnoreCondition.Never)] string? Seed,
    int A,
    int B);
