// MathKX practice service: a thin, stateless host in front of the mathematics domain.
// Endpoints, content loading, and the static learner app arrive with tasks T013, T021, T027, T035.
var builder = WebApplication.CreateBuilder(args);

var app = builder.Build();

app.MapGet("/api/health", () => Results.Ok(new { status = "ok" }));

app.Run();

/// <summary>Marker for integration tests (WebApplicationFactory).</summary>
public partial class Program
{
}
