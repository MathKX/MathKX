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
builder.Services.AddSingleton<IntegerAnswerValidator>();

var app = builder.Build();

app.UseExceptionHandler();
app.UseStatusCodePages();

app.MapGet("/api/health", (ContentCatalog catalog) => Results.Ok(new
{
    status = "ok",
    skills = catalog.Skills.Count,
    definitions = catalog.Definitions.Count,
    lessons = catalog.Lessons.Count,
    registries = 5,
}));
app.MapContent();
app.MapInstances();
app.MapValidations();
app.MapSteps();

// The built learner app, when present in wwwroot: static files plus a history-API fallback that never
// shadows /api/* (an unknown API route stays a 404 problem, not the app shell).
if (Directory.Exists(Path.Combine(app.Environment.WebRootPath ?? Path.Combine(app.Environment.ContentRootPath, "wwwroot"), "assets")))
{
    app.UseDefaultFiles();
    app.UseStaticFiles();
    app.MapFallback(context =>
    {
        if (context.Request.Path.StartsWithSegments("/api"))
        {
            context.Response.StatusCode = StatusCodes.Status404NotFound;
            return Task.CompletedTask;
        }

        context.Response.ContentType = "text/html; charset=utf-8";
        return context.Response.SendFileAsync(Path.Combine(app.Environment.WebRootPath!, "index.html"));
    });
}

app.Run();

/// <summary>Marker for integration tests (WebApplicationFactory).</summary>
public partial class Program
{
}
