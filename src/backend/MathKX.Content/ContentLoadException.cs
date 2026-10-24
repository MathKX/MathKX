namespace MathKX.Content;

/// <summary>A content file could not be loaded; <see cref="Path"/> names it.</summary>
public sealed class ContentLoadException : Exception
{
    public ContentLoadException(string path, string message)
        : base($"{path}: {message}")
    {
        Path = path;
    }

    public ContentLoadException(string path, string message, Exception inner)
        : base($"{path}: {message}", inner)
    {
        Path = path;
    }

    public string Path { get; }
}
