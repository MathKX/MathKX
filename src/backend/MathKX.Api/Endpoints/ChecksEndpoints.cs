using MathKX.Api.Dto;
using MathKX.Domain.Content;

namespace MathKX.Api.Endpoints;

/// <summary>Self-checks (specs/006 contracts/api.md): question identities only, never operands or sums.</summary>
public static class ChecksEndpoints
{
    public static IEndpointRouteBuilder MapChecks(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/checks", (ContentCatalog catalog) => Results.Ok(catalog.LatestChecks().Select(CheckDto.From).ToList()));
        app.MapGet("/api/checks/{id}/{version:int}", (string id, int version, ContentCatalog catalog) =>
            catalog.TryGetCheck(id, version, out var check)
                ? Results.Ok(CheckDto.From(check))
                : Problems.NotFound("unknown-check", $"Check {id}@{version} is not defined."));
        return app;
    }
}
