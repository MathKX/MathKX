using MathKX.Api.Dto;
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

    public static IResult Resolve(string definitionId, int version, string seed, InstanceResolver resolver)
    {
        if (!TryParseSeed(seed, out var parsed, out var problem))
        {
            return problem!;
        }

        try
        {
            var instance = resolver.Resolve(new InstanceIdentity(definitionId, version, parsed));
            return Results.Ok(InstanceDto.From(instance));
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
