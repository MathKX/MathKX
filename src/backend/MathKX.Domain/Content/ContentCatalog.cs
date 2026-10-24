namespace MathKX.Domain.Content;

/// <summary>Everything the domain and the service read from content/, indexed by stable keys.</summary>
public sealed class ContentCatalog
{
    public ContentCatalog(
        IReadOnlyDictionary<string, GeneratorEntry> generators,
        IReadOnlyDictionary<string, ValidatorEntry> validators,
        IReadOnlyDictionary<string, RepresentationEntry> representations,
        IReadOnlyDictionary<string, VisualComponentEntry> visualComponents,
        IReadOnlyDictionary<string, MisconceptionCodeEntry> misconceptionCodes,
        IReadOnlyDictionary<string, Skill> skills,
        IReadOnlyDictionary<string, ExerciseDefinition> definitions,
        IReadOnlyDictionary<string, LessonMetadata> lessons,
        IReadOnlyDictionary<(string LessonId, string Language), LessonFrontMatter> frontMatter)
    {
        Generators = generators;
        Validators = validators;
        Representations = representations;
        VisualComponents = visualComponents;
        MisconceptionCodes = misconceptionCodes;
        Skills = skills;
        Definitions = definitions;
        Lessons = lessons;
        FrontMatters = frontMatter;
    }

    /// <summary>Keyed by <c>name@version</c>.</summary>
    public IReadOnlyDictionary<string, GeneratorEntry> Generators { get; }

    /// <summary>Keyed by <c>name@version</c>.</summary>
    public IReadOnlyDictionary<string, ValidatorEntry> Validators { get; }

    public IReadOnlyDictionary<string, RepresentationEntry> Representations { get; }

    public IReadOnlyDictionary<string, VisualComponentEntry> VisualComponents { get; }

    public IReadOnlyDictionary<string, MisconceptionCodeEntry> MisconceptionCodes { get; }

    public IReadOnlyDictionary<string, Skill> Skills { get; }

    /// <summary>Pilot definitions keyed by <c>id@version</c>; the exploratory 0.1 example is not loaded.</summary>
    public IReadOnlyDictionary<string, ExerciseDefinition> Definitions { get; }

    public IReadOnlyDictionary<string, LessonMetadata> Lessons { get; }

    public IReadOnlyDictionary<(string LessonId, string Language), LessonFrontMatter> FrontMatters { get; }

    public LessonFrontMatter FrontMatter(string lessonId, string language) => FrontMatters[(lessonId, language)];

    public bool TryGetDefinition(string id, int version, out ExerciseDefinition definition) =>
        Definitions.TryGetValue($"{id}@{version}", out definition!);
}
