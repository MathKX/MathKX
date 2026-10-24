using MathKX.Api.Dto;
using MathKX.Domain.Content;

namespace MathKX.Api.Endpoints;

/// <summary>Lesson metadata (titles and objectives from the front matter) and skills with their ladders.</summary>
public static class ContentEndpoints
{
    public static IEndpointRouteBuilder MapContent(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/lessons", (ContentCatalog catalog) => Results.Ok(catalog.Lessons.Values.OrderBy(l => l.Id, StringComparer.Ordinal).Select(l => Summary(catalog, l)).ToList()));
        app.MapGet("/api/lessons/{id}", (string id, ContentCatalog catalog) =>
            catalog.Lessons.TryGetValue(id, out var lesson)
                ? Results.Ok(Detail(catalog, lesson))
                : Problems.NotFound("unknown-lesson", $"Lesson {id} is not defined."));
        app.MapGet("/api/skills/{id}", (string id, ContentCatalog catalog) =>
            catalog.Skills.TryGetValue(id, out var skill)
                ? Results.Ok(new SkillDto(skill.Id, skill.Prerequisites, (skill.Ladder ?? []).Select(e => new LadderEntryDto(e.Definition, e.Version, new LocalizedDto(e.Description.Nb, e.Description.En))).ToList()))
                : Problems.NotFound("unknown-skill", $"Skill {id} is not defined."));
        return app;
    }

    private static LessonSummaryDto Summary(ContentCatalog catalog, LessonMetadata lesson) => new(
        lesson.Id,
        lesson.Version,
        lesson.Status,
        lesson.Skills,
        Titles(catalog, lesson),
        Practice(catalog, lesson));

    private static LessonDto Detail(ContentCatalog catalog, LessonMetadata lesson) => new(
        lesson.Id,
        lesson.Version,
        lesson.Status,
        lesson.Skills,
        Titles(catalog, lesson),
        new LocalizedDto(catalog.FrontMatter(lesson.Id, "nb").Objective, catalog.FrontMatter(lesson.Id, "en").Objective),
        Practice(catalog, lesson),
        lesson.Visuals ?? [],
        new LocalizedDto(lesson.Translations.Nb, lesson.Translations.En));

    private static LocalizedDto Titles(ContentCatalog catalog, LessonMetadata lesson) =>
        new(catalog.FrontMatter(lesson.Id, "nb").Title, catalog.FrontMatter(lesson.Id, "en").Title);

    private static List<PracticeEntryDto> Practice(ContentCatalog catalog, LessonMetadata lesson) =>
        lesson.Practice.Select(p => new PracticeEntryDto(p.Definition, p.Version, catalog.Definitions.TryGetValue(p.Key, out var d) ? d.Skill : string.Empty)).ToList();
}
