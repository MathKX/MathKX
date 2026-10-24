namespace MathKX.Domain.Lessons;

/// <summary>A mathematics expression as authored in a lesson translation, with its comparison form.</summary>
public sealed record LessonExpression(string Source)
{
    /// <summary>The prototype's normalization: whitespace removed, the minus and en-dash read as a hyphen.</summary>
    public string Normalized { get; } = LessonFacts.Normalize(Source);
}

/// <summary>A <c>:::visual</c> directive: its registered type and its attributes read as integers.</summary>
public sealed record LessonVisual(string Type, IReadOnlyDictionary<string, int> Attributes);

/// <summary>
/// What the disclosure rule needs from one lesson translation (specs/003 contracts/disclosure.md): every
/// mathematics expression in document order and every visual, never anything inside code.
/// </summary>
public sealed record LessonFacts(IReadOnlyList<LessonExpression> Expressions, IReadOnlyList<LessonVisual> Visuals)
{
    public static LessonFacts Empty { get; } = new([], []);

    public static string Normalize(string source) =>
        string.Concat(source.Where(c => !char.IsWhiteSpace(c))).Replace('−', '-').Replace('–', '-');
}
