// MathKX practice service: a thin, stateless host in front of the mathematics domain.
using System.Text.Json.Serialization;
using MathKX.Api;
using MathKX.Api.Endpoints;
using MathKX.Content;
using MathKX.Domain.Content;
using MathKX.Domain.Generators;
using MathKX.Domain.Instances;
using MathKX.Domain.Validators;

var builder = WebApplication.CreateBuilder(args);

builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
});
builder.Services.AddProblemDetails();
builder.Services.AddSingleton(_ => new ContentLocation(ContentRoot.Resolve(builder.Configuration)));
builder.Services.AddSingleton<ContentCatalog>(services => ContentLoader.Load(services.GetRequiredService<ContentLocation>().Root));
builder.Services.AddSingleton(GeneratorRegistry.Default());
builder.Services.AddSingleton<InstanceResolver>();
builder.Services.AddSingleton<QuestionPools>();
builder.Services.AddSingleton<IntegerAnswerValidator>();

var app = builder.Build();

// Build every question pool now (specs/005): a pool that cannot be covered stops the start, naming its definition.
app.Services.GetRequiredService<QuestionPools>();

app.UseExceptionHandler();
app.UseStatusCodePages();

app.MapGet("/api/health", (ContentCatalog catalog) => Results.Ok(new
{
    status = "ok",
    skills = catalog.Skills.Count,
    definitions = catalog.Definitions.Count,
    lessons = catalog.Lessons.Count,
    checks = catalog.Checks.Count,
    registries = 5,
}));
app.MapContent();
app.MapInstances();
app.MapValidations();
app.MapSteps();
app.MapVisuals();
app.MapDefinitions();
app.MapChecks();

// The built learner app, when present in wwwroot: static files plus a history-API fallback that never
// shadows /api/* (an unknown API route stays a 404 problem, not the app shell). The shell is always
// revalidated so a deploy is picked up at once; the content-hashed files under /assets/ never change.
var servesApp = Directory.Exists(Path.Combine(app.Environment.WebRootPath ?? Path.Combine(app.Environment.ContentRootPath, "wwwroot"), "assets"));
if (servesApp)
{
    app.UseDefaultFiles();
    app.UseStaticFiles(new StaticFileOptions
    {
        OnPrepareResponse = context =>
        {
            if (context.Context.Request.Path.StartsWithSegments("/assets"))
            {
                context.Context.Response.Headers.CacheControl = "public, max-age=31536000, immutable";
            }
            else if (context.File.Name == "index.html")
            {
                context.Context.Response.Headers.CacheControl = "no-cache";
            }
        },
    });
}

// Routing runs after the static files: static files step aside for any request that matched an endpoint, so
// an existing file must be served before the fallback's catch-all can claim it.
app.UseRouting();

if (servesApp)
{
    // Every other path is a learner-app route, including ones whose last segment has a dot, such as
    // /practice/numbers.addition-within-20 (the default {*path:nonfile} pattern would take it for a file).
    // A missing /assets/ file stays a 404, so a stale shell fails visibly instead of loading HTML as script.
    app.MapFallback("{*path}", context =>
    {
        if (context.Request.Path.StartsWithSegments("/api") || context.Request.Path.StartsWithSegments("/assets"))
        {
            context.Response.StatusCode = StatusCodes.Status404NotFound;
            return Task.CompletedTask;
        }

        context.Response.ContentType = "text/html; charset=utf-8";
        context.Response.Headers.CacheControl = "no-cache";
        return context.Response.SendFileAsync(Path.Combine(app.Environment.WebRootPath!, "index.html"));
    });
}

app.Run();

/// <summary>Marker for integration tests (WebApplicationFactory).</summary>
public partial class Program
{
}
