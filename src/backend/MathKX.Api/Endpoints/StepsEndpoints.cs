using MathKX.Api.Dto;
using MathKX.Domain.Explanations;
using MathKX.Domain.Instances;

namespace MathKX.Api.Endpoints;

/// <summary>One step of guided help or of the worked explanation per request; only a revealing step may carry the total.</summary>
public static class StepsEndpoints
{
    public static IEndpointRouteBuilder MapSteps(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/instances/{definitionId}/{version:int}/{seed}/steps/{kind}/{index:int}", Step);
        return app;
    }

    public static IResult Step(string definitionId, int version, string seed, string kind, int index, InstanceResolver resolver)
    {
        if (!InstancesEndpoints.TryParseSeed(seed, out var parsed, out var problem))
        {
            return problem!;
        }

        if (!StepModels.TryParseKind(kind, out var stepKind))
        {
            return Problems.NotFound("unknown-step", $"'{kind}' is not a step kind; use help or explanation.");
        }

        try
        {
            var instance = resolver.Resolve(new InstanceIdentity(definitionId, version, parsed));
            var representation = StepModels.RepresentationFor(instance, stepKind);
            if (representation is null)
            {
                return Problems.NotFound("unknown-step", $"{instance.Identity.DefinitionKey} offers no {kind} representation.");
            }

            var steps = StepModels.For(instance, representation, stepKind);
            if (index < 0 || index >= steps.Count)
            {
                return Problems.NotFound("unknown-step", $"{kind} has {steps.Count} step(s); index {index} is out of range.");
            }

            return Results.Ok(StepDto.From(steps[index]));
        }
        catch (UnknownDefinitionException error)
        {
            return Problems.NotFound("unknown-definition", error.Message);
        }
        catch (MissingSeedException error)
        {
            return Problems.BadRequest("invalid-seed", error.Message);
        }
        catch (UnsupportedStepsException error)
        {
            return Problems.NotFound("unknown-step", error.Message);
        }
    }
}
