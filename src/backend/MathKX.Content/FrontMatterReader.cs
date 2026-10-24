using YamlDotNet.Core;
using YamlDotNet.RepresentationModel;
using MathKX.Domain.Content;

namespace MathKX.Content;

/// <summary>
/// Reads <c>title</c> and <c>objective</c> from a lesson translation's YAML front matter with the same YAML
/// semantics the content validator accepts (quoted scalars, folded blocks, comments).
/// </summary>
public static class FrontMatterReader
{
    public static LessonFrontMatter Read(string markdown, string path)
    {
        var block = ExtractBlock(markdown, path);
        YamlMappingNode mapping;
        try
        {
            var stream = new YamlStream();
            stream.Load(new StringReader(block));
            if (stream.Documents.Count == 0 || stream.Documents[0].RootNode is not YamlMappingNode root)
            {
                throw new ContentLoadException(path, "front matter must be a YAML mapping with title and objective");
            }

            mapping = root;
        }
        catch (YamlException error)
        {
            throw new ContentLoadException(path, $"front matter is not valid YAML: {error.Message}", error);
        }

        return new LessonFrontMatter(Scalar(mapping, "title", path), Scalar(mapping, "objective", path));
    }

    private static string Scalar(YamlMappingNode mapping, string key, string path)
    {
        if (!mapping.Children.TryGetValue(new YamlScalarNode(key), out var node) || node is not YamlScalarNode scalar || string.IsNullOrWhiteSpace(scalar.Value))
        {
            throw new ContentLoadException(path, $"front matter is missing {key} (a non-empty string)");
        }

        return scalar.Value;
    }

    private static string ExtractBlock(string markdown, string path)
    {
        var lines = markdown.Split('\n');
        if (lines.Length == 0 || lines[0].TrimEnd('\r') != "---")
        {
            throw new ContentLoadException(path, "front matter must start with --- on the first line");
        }

        var block = new List<string>();
        for (var i = 1; i < lines.Length; i++)
        {
            if (lines[i].TrimEnd('\r') == "---")
            {
                return string.Join('\n', block);
            }

            block.Add(lines[i].TrimEnd('\r'));
        }

        throw new ContentLoadException(path, "front matter is not closed with ---");
    }
}
