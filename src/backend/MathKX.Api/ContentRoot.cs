namespace MathKX.Api;

/// <summary>
/// Where the service reads content/ from, in this order: explicit configuration (<c>MathKX:ContentRoot</c>),
/// a <c>content/</c> folder beside the binaries (the published layout), then the repository checkout found
/// by walking up from the binaries (development).
/// </summary>
public static class ContentRoot
{
    public static string Resolve(IConfiguration configuration)
    {
        var configured = configuration["MathKX:ContentRoot"];
        if (!string.IsNullOrWhiteSpace(configured))
        {
            return Path.GetFullPath(configured);
        }

        var beside = Path.Combine(AppContext.BaseDirectory, "content");
        if (Directory.Exists(Path.Combine(beside, "registry")))
        {
            return beside;
        }

        var dir = new DirectoryInfo(AppContext.BaseDirectory);
        while (dir is not null)
        {
            var candidate = Path.Combine(dir.FullName, "content");
            if (Directory.Exists(Path.Combine(candidate, "registry")))
            {
                return candidate;
            }

            dir = dir.Parent;
        }

        throw new InvalidOperationException("No content/ folder was found. Set MathKX:ContentRoot or run from the repository.");
    }
}
