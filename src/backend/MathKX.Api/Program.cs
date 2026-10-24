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
builder.Services.AddSingleton<ContentCatalog>(_ => ContentLoader.Load(ContentRoot.Resolve(builder.Configuration)));
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

app.Run();

/// <summary>Marker for integration tests (WebApplicationFactory).</summary>
public partial class Program
{
}
