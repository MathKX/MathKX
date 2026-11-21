using MathKX.Api.Dto;
using MathKX.Domain.Content;
using MathKX.Domain.Explanations;

namespace MathKX.Api.Endpoints;

/// <summary>
/// Models for the visuals a lesson places with authored values (specs/003 contracts/api.md): the step-through
/// make-ten and groups from the same step models as practice, the ten-frame explorer's pairs, and the balance
/// explorer's states (specs/008). Lesson content,
/// not tied to an instance; the learner app requests them only once the lesson is shown.
/// </summary>
public static class VisualsEndpoints
{
    public const string Explorer = "ten-frame-explorer";
    public const string Balance = "balance-explorer";

    public static IEndpointRouteBuilder MapVisuals(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/visuals/{type}", Visual);
        return app;
    }

    public static IResult Visual(string type, string? a, string? b, ContentCatalog catalog)
    {
        if (!catalog.VisualComponents.TryGetValue(type, out var component))
        {
            return Problems.NotFound("unknown-visual", $"{type} is not a registered visual component.");
        }

        if (type == Explorer)
        {
            return Results.Ok(new TenFrameExplorerDto(type, TenFrameExplorer.States().Select(s => new TenFrameExplorerStateDto(s.Filled, s.Partner)).ToList()));
        }

        if (type == Balance)
        {
            if (!int.TryParse(a, out var added) || !int.TryParse(b, out var total) || !InAttribute(component, "a", added) || !InAttribute(component, "b", total) || !BalanceExplorer.Supports(added, total))
            {
                return Problems.BadRequest("unsupported-values", $"{type} cannot show x + {a ?? "?"} = {b ?? "?"}: outside its attributes or without a whole-number solution of at least 1.");
            }

            var states = BalanceExplorer.States(added, total).Select(s => new BalanceStateDto(s.Left, s.Right, Tilt(s.Tilt), s.Solved)).ToList();
            return Results.Ok(new BalanceExplorerDto(type, added, total, states));
        }

        if (component.Representation is null || !catalog.Representations.TryGetValue(component.Representation, out var representation))
        {
            return Problems.NotFound("unknown-visual", $"{type} has no step model.");
        }

        if (!int.TryParse(a, out var va) || !int.TryParse(b, out var vb) || !Supported(component, representation, va, vb))
        {
            return Problems.BadRequest("unsupported-values", $"{type} cannot show {a ?? "?"} and {b ?? "?"}: outside its attributes or the {representation.Name} representation's supports.");
        }

        try
        {
            var steps = StepModels.ForValues(va, vb, representation.Name, StepKind.Explanation);
            return Results.Ok(new VisualStepsDto(type, va, vb, steps.Select(StepDto.From).ToList()));
        }
        catch (UnsupportedStepsException error)
        {
            return Problems.NotFound("unknown-visual", error.Message);
        }
    }

    private static string Tilt(BalanceTilt tilt) => tilt switch
    {
        BalanceTilt.LeftDown => "left-down",
        BalanceTilt.RightDown => "right-down",
        _ => "balanced",
    };

    private static bool InAttribute(VisualComponentEntry component, string name, int value) =>
        component.Attributes.TryGetValue(name, out var spec) && (spec.Min is null || value >= spec.Min) && (spec.Max is null || value <= spec.Max);

    /// <summary>The same check spec 001's validator makes for a <c>:::visual</c> with these values.</summary>
    private static bool Supported(VisualComponentEntry component, RepresentationEntry representation, int a, int b)
    {
        bool InSupport(string quantity, int value) =>
            !representation.Supports.TryGetValue(quantity, out var bounds) || (value >= bounds.Min && value <= bounds.Max);

        return InAttribute(component, "a", a) && InAttribute(component, "b", b) && InSupport("operand", a) && InSupport("operand", b) && InSupport("sum", a + b);
    }
}
