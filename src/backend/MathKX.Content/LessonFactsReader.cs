using System.Globalization;
using System.Text.RegularExpressions;
using Markdig;
using Markdig.Extensions.Mathematics;
using Markdig.Syntax;
using MathKX.Domain.Lessons;

namespace MathKX.Content;

/// <summary>
/// Reads the facts the disclosure rule needs from one lesson translation (specs/003 contracts/disclosure.md):
/// mathematics from Markdig's mathematics extension and <c>:::visual</c> opening lines from paragraph blocks,
/// both from the block tree, so nothing inside code is read. Held to the validator's remark parser by
/// specs/003-lesson-rendering/contracts/lesson-facts.fixture.json.
/// </summary>
public static class LessonFactsReader
{
    private static readonly MarkdownPipeline Pipeline = new MarkdownPipelineBuilder().UseYamlFrontMatter().UseMathematics().UsePipeTables().Build();
    private static readonly Regex VisualLine = new(@"^\s*:::visual\{(?<attributes>.*)\}\s*$", RegexOptions.CultureInvariant);
    private static readonly Regex Attribute = new("(?<name>[A-Za-z][A-Za-z0-9_-]*)=\"(?<value>[^\"]*)\"", RegexOptions.CultureInvariant);

    public static LessonFacts Read(string markdown)
    {
        var document = Markdown.Parse(markdown, Pipeline);
        var expressions = new List<LessonExpression>();
        var visuals = new List<LessonVisual>();

        foreach (var node in document.Descendants())
        {
            switch (node)
            {
                case MathInline inline:
                    expressions.Add(new LessonExpression(inline.Content.ToString()));
                    break;
                case MathBlock block:
                    expressions.Add(new LessonExpression(block.Lines.ToString()));
                    break;
                case ParagraphBlock paragraph:
                    // Markdig clears a paragraph's Lines once its inlines are parsed; its span still points at the source.
                    var source = paragraph.Span.IsEmpty ? string.Empty : markdown.Substring(paragraph.Span.Start, paragraph.Span.Length);
                    foreach (var line in source.Split('\n'))
                    {
                        var match = VisualLine.Match(line.TrimEnd('\r'));
                        if (match.Success)
                        {
                            visuals.Add(ReadVisual(match.Groups["attributes"].Value));
                        }
                    }

                    break;
            }
        }

        return new LessonFacts(expressions, visuals);
    }

    private static LessonVisual ReadVisual(string attributes)
    {
        string type = string.Empty;
        var values = new Dictionary<string, int>(StringComparer.Ordinal);
        foreach (Match match in Attribute.Matches(attributes))
        {
            var name = match.Groups["name"].Value;
            var value = match.Groups["value"].Value;
            if (name == "type")
            {
                type = value;
            }
            else if (int.TryParse(value, NumberStyles.None, CultureInfo.InvariantCulture, out var number))
            {
                values[name] = number;
            }
        }

        return new LessonVisual(type, values);
    }
}
