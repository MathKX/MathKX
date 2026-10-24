// MathKX practice service: a thin, stateless host in front of the mathematics domain.
using MathKX.Api;
using MathKX.Content;
using MathKX.Domain.Content;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddProblemDetails();
builder.Services.AddSingleton<ContentCatalog>(_ => ContentLoader.Load(ContentRoot.Resolve(builder.Configuration)));

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

app.Run();

/// <summary>Marker for integration tests (WebApplicationFactory).</summary>
public partial class Program
{
}
