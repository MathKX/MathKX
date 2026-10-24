using MathKX.Api.Dto;
using MathKX.Domain.Instances;
using MathKX.Domain.Results;
using MathKX.Domain.Validators;

namespace MathKX.Api.Endpoints;

public static class ValidationsEndpoints
{
    public static IEndpointRouteBuilder MapValidations(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/validations", Validate);
        return app;
    }

    public static IResult Validate(ValidationRequestDto? request, InstanceResolver resolver, IntegerAnswerValidator validator)
    {
        if (request?.Identity is null || string.IsNullOrWhiteSpace(request.Identity.DefinitionId) || request.Artifact is null || string.IsNullOrWhiteSpace(request.Artifact.Kind) || request.Artifact.OriginalText is null)
        {
            return Problems.BadRequest("invalid-artifact", "The request needs identity { definitionId, version, seed } and artifact { kind, originalText }.");
        }

        if (request.Artifact.Kind != "integer")
        {
            return Problems.BadRequest("invalid-artifact", $"Artifact kind '{request.Artifact.Kind}' is not supported; the pilot accepts 'integer'.");
        }

        if (!InstancesEndpoints.TryParseSeed(request.Identity.Seed, out var seed, out var problem))
        {
            return problem!;
        }

        try
        {
            // The instance is always re-resolved from the identity; operands from the client are never trusted.
            var instance = resolver.Resolve(new InstanceIdentity(request.Identity.DefinitionId, request.Identity.Version, seed));
            var result = validator.Validate(instance, ResponseArtifact.ReadInteger(request.Artifact.OriginalText));
            return Results.Ok(ValidationResponseDto.From(result, request.SubmissionId));
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
}
