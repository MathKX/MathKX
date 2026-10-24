namespace MathKX.Domain.Tests.Content;

/// <summary>Locates the repository's content/ folder from the test assembly and offers temp copies.</summary>
internal static class RepositoryContent
{
    public static string Root { get; } = Find();

    private static string Find()
    {
        var dir = new DirectoryInfo(AppContext.BaseDirectory);
        while (dir is not null)
        {
            var candidate = Path.Combine(dir.FullName, "content", "registry");
            if (Directory.Exists(candidate))
            {
                return Path.Combine(dir.FullName, "content");
            }

            dir = dir.Parent;
        }

        throw new InvalidOperationException("The repository content/ folder was not found above the test assembly.");
    }
}

internal sealed class TempContent : IDisposable
{
    public string Root { get; } = Path.Combine(Path.GetTempPath(), "mathkx-content-" + Guid.NewGuid().ToString("N"));

    public void CopyRepositoryContent()
    {
        foreach (var file in Directory.EnumerateFiles(RepositoryContent.Root, "*", SearchOption.AllDirectories))
        {
            var relative = Path.GetRelativePath(RepositoryContent.Root, file);
            var target = Path.Combine(Root, relative);
            Directory.CreateDirectory(Path.GetDirectoryName(target)!);
            File.Copy(file, target);
        }
    }

    public void Rewrite(string relativePath, Func<string, string> change)
    {
        var path = Path.Combine(Root, relativePath);
        File.WriteAllText(path, change(File.ReadAllText(path)));
    }

    public void Dispose()
    {
        if (Directory.Exists(Root))
        {
            Directory.Delete(Root, recursive: true);
        }
    }
}
