using MathKX.Api.Dto;

namespace MathKX.Api.Endpoints;

/// <summary>A variation's pool (specs/005 contracts/pool.md): the questions it admits and the smallest seed for each.</summary>
public static class DefinitionsEndpoints
{
    public static IEndpointRouteBuilder MapDefinitions(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/definitions/{definitionId}/{version:int}/pool", (string definitionId, int version, QuestionPools pools) =>
            pools.TryGet($"{definitionId}@{version}", out var pool)
                ? Results.Ok(PoolDto.From(pool, version))
                : Problems.NotFound("unknown-definition", $"Definition {definitionId}@{version} is not defined."));
        return app;
    }
}
