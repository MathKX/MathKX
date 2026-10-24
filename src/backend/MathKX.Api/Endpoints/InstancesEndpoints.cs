using MathKX.Api.Dto;
using MathKX.Domain.Content;
using MathKX.Domain.Lessons;
using MathKX.Domain.Instances;
using MathKX.Domain.Random;

namespace MathKX.Api.Endpoints;

public static class InstancesEndpoints
{
    /// <summary>The seed path segment that addresses a fixed task.</summary>
    public const string NoSeed = "-";

    public static IEndpointRouteBuilder MapInstances(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/instances/{definitionId}/{version:int}/{seed}", Resolve);
        return app;
    }

    public static IResult Resolve(string definitionId, int version, string seed, InstanceResolver resolver, ContentCatalog catalog)
    {
        if (!TryParseSeed(seed, out var parsed, out var problem))
        {
            return problem!;
        }

        try
        {
            var instance = resolver.Resolve(new InstanceIdentity(definitionId, version, parsed));
            return Results.Ok(InstanceDto.From(instance, Lessons(catalog, instance)));
        }
        catch (UnknownDefinitionException error)
        {
            return Problems.NotFound("unknown-definition", error.Message);
        }
        catch (MissingSeedException error)
        {
            return Problems.BadRequest("invalid-seed", error.Message);
        }
    }

    /// <summary>
    /// The lessons whose practice lists the instance's definition, each with the disclosure decision over both
    /// translations (specs/003 contracts/disclosure.md). The decision is computed here, so the answer is never sent.
    /// </summary>
    private static List<LessonDisclosureDto> Lessons(ContentCatalog catalog, Instance instance) =>
        catalog.LessonsForDefinition(instance.Identity.DefinitionKey)
            .Select(lesson => new LessonDisclosureDto(
                lesson.Id,
                LessonDisclosure.For(catalog.Translations.Where(t => t.Key.LessonId == lesson.Id).Select(t => t.Value.Facts), instance).Discloses))
            .ToList();

    public static bool TryParseSeed(string? text, out Seed? seed, out IResult? problem)
    {
        problem = null;
        seed = null;
        if (text is null || text == NoSeed)
        {
            return true;
        }

        if (!Seed.TryParse(text, out var value))
        {
            problem = Problems.BadRequest("invalid-seed", $"'{text}' is not a seed: expected a decimal string matching ^(0|[1-9][0-9]*)$ within the unsigned 64-bit range, or '-' for a fixed task.");
            return false;
        }

        seed = value;
        return true;
    }
}
