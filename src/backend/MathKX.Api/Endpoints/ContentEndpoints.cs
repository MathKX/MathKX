using MathKX.Api.Dto;
using MathKX.Domain.Content;

namespace MathKX.Api.Endpoints;

/// <summary>Lesson metadata (titles and objectives from the front matter) and skills with their names, ladders, and definitions.</summary>
public static class ContentEndpoints
{
    public static IEndpointRouteBuilder MapContent(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/lessons", (ContentCatalog catalog) => Results.Ok(catalog.Lessons.Values.OrderBy(l => l.Id, StringComparer.Ordinal).Select(l => Summary(catalog, l)).ToList()));
        app.MapGet("/api/lessons/{id}", (string id, ContentCatalog catalog) =>
            catalog.Lessons.TryGetValue(id, out var lesson)
                ? Results.Ok(Detail(catalog, lesson))
                : Problems.NotFound("unknown-lesson", $"Lesson {id} is not defined."));
        app.MapGet("/api/skills", (ContentCatalog catalog) => Results.Ok(catalog.Skills.Values.OrderBy(s => s.Id, StringComparer.Ordinal).Select(s => Skill(catalog, s)).ToList()));
        app.MapGet("/api/skills/{id}", (string id, ContentCatalog catalog) =>
            catalog.Skills.TryGetValue(id, out var skill)
                ? Results.Ok(Skill(catalog, skill))
                : Problems.NotFound("unknown-skill", $"Skill {id} is not defined."));
        app.MapGet("/api/lessons/{id}/content/{lang}", LessonContent);
        app.MapGet("/api/lessons/{id}/assets/{name}", LessonAsset);
        return app;
    }

    private static SkillDto Skill(ContentCatalog catalog, Skill skill) => new(
        skill.Id,
        new LocalizedDto(skill.Name.Nb, skill.Name.En),
        skill.Prerequisites,
        (skill.Ladder ?? []).Select(e => new LadderEntryDto(e.Definition, e.Version, new LocalizedDto(e.Description.Nb, e.Description.En))).ToList(),
        catalog.DefinitionsForSkill(skill.Id));

    /// <summary>A translation's Markdown exactly as loaded (specs/003 contracts/api.md); the app requests it only with an open gate.</summary>
    public static IResult LessonContent(string id, string lang, ContentCatalog catalog)
    {
        if (!catalog.Lessons.TryGetValue(id, out var lesson))
        {
            return Problems.NotFound("unknown-lesson", $"Lesson {id} is not defined.");
        }

        return catalog.TryGetTranslation(id, lang, out var translation)
            ? Results.Ok(new LessonContentDto(lesson.Id, lesson.Version, translation.Language, translation.Markdown))
            : Problems.NotFound("unknown-language", $"Lesson {id} has no {lang} translation.");
    }

    private static readonly Dictionary<string, string> AssetTypes = new(StringComparer.Ordinal)
    {
        [".svg"] = "image/svg+xml",
        [".png"] = "image/png",
        [".jpg"] = "image/jpeg",
        [".jpeg"] = "image/jpeg",
        [".webp"] = "image/webp",
    };

    /// <summary>
    /// One file of a lesson's assets/ folder, by a name the snapshot listed at startup and an allowlisted extension;
    /// anything else is unknown-asset, so no path from the request ever reaches the file system unchecked.
    /// </summary>
    public static IResult LessonAsset(string id, string name, ContentCatalog catalog, ContentLocation location, HttpResponse response)
    {
        if (!catalog.Lessons.ContainsKey(id) || !catalog.Assets(id).Contains(name, StringComparer.Ordinal) || !AssetTypes.TryGetValue(Path.GetExtension(name), out var type))
        {
            return Problems.NotFound("unknown-asset", $"Lesson {id} has no asset {name}.");
        }

        // The loader refused links; check again at request time in case the files changed on disk since startup.
        var folder = Path.GetFullPath(Path.Combine(location.Root, "lessons", id, "assets"));
        var file = new FileInfo(Path.Combine(folder, name));
        if (!file.Exists
            || file.LinkTarget is not null
            || file.Attributes.HasFlag(FileAttributes.ReparsePoint)
            || new DirectoryInfo(folder).LinkTarget is not null
            || !string.Equals(Path.GetDirectoryName(file.FullName), folder, StringComparison.Ordinal))
        {
            return Problems.NotFound("unknown-asset", $"Lesson {id} has no asset {name}.");
        }

        response.Headers.XContentTypeOptions = "nosniff";
        response.Headers.ContentSecurityPolicy = "default-src 'none'; style-src 'unsafe-inline'; sandbox";
        response.Headers.CacheControl = "no-cache";
        return Results.File(file.FullName, type);
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
