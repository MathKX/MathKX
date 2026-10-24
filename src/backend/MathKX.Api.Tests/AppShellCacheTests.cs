using System.Net;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace MathKX.Api.Tests;

/// <summary>A built learner app in a temporary wwwroot, so the app-serving branch of the host is active.</summary>
public sealed class BuiltAppFactory : WebApplicationFactory<Program>
{
    private readonly string _webRoot = Directory.CreateTempSubdirectory("mathkx-wwwroot-").FullName;

    public BuiltAppFactory()
    {
        Directory.CreateDirectory(Path.Combine(_webRoot, "assets"));
        File.WriteAllText(Path.Combine(_webRoot, "index.html"), "<!doctype html><script src=\"/assets/x-abc123.js\"></script>");
        File.WriteAllText(Path.Combine(_webRoot, "assets", "x-abc123.js"), "console.log('x');");
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseWebRoot(_webRoot);
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        try
        {
            Directory.Delete(_webRoot, recursive: true);
        }
        catch (IOException)
        {
            // Windows may hold the folder briefly; a leftover temp folder is harmless.
        }
    }
}

/// <summary>After a deploy the shell must be revalidated, while content-hashed assets may be cached for good.</summary>
public sealed class AppShellCacheTests : IClassFixture<BuiltAppFactory>
{
    private readonly BuiltAppFactory _factory;

    public AppShellCacheTests(BuiltAppFactory factory)
    {
        _factory = factory;
    }

    [Theory]
    [InlineData("/")]
    [InlineData("/index.html")]
    [InlineData("/lessons/x")]
    public async Task The_shell_is_always_revalidated(string path)
    {
        using var client = _factory.CreateClient();
        var response = await client.GetAsync(path);

        response.EnsureSuccessStatusCode();
        Assert.Equal("text/html", response.Content.Headers.ContentType?.MediaType);
        Assert.Contains("/assets/x-abc123.js", await response.Content.ReadAsStringAsync(), StringComparison.Ordinal);
        Assert.True(response.Headers.CacheControl?.NoCache);
    }

    [Fact]
    public async Task Hashed_assets_are_cached_as_immutable()
    {
        using var client = _factory.CreateClient();
        var response = await client.GetAsync("/assets/x-abc123.js");

        response.EnsureSuccessStatusCode();
        var cacheControl = response.Headers.CacheControl;
        Assert.NotNull(cacheControl);
        Assert.True(cacheControl.Public);
        Assert.Equal(TimeSpan.FromSeconds(31536000), cacheControl.MaxAge);
        Assert.Contains(cacheControl.Extensions, e => e.Name == "immutable");
    }

    [Fact]
    public async Task The_api_is_not_served_the_shell()
    {
        using var client = _factory.CreateClient();
        var health = await client.GetAsync("/api/health");
        health.EnsureSuccessStatusCode();
        Assert.Equal("application/json", health.Content.Headers.ContentType?.MediaType);
        Assert.Null(health.Headers.CacheControl);

        var unknown = await client.GetAsync("/api/nothing-here");
        Assert.Equal(HttpStatusCode.NotFound, unknown.StatusCode);
        Assert.Null(unknown.Headers.CacheControl);
    }
}
