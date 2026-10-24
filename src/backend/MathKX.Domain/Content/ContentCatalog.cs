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
        IReadOnlyDictionary<(string LessonId, string Language), LessonTranslation> translations,
        IReadOnlyDictionary<string, IReadOnlyList<string>> assets)
    {
        Generators = generators;
        Validators = validators;
        Representations = representations;
        VisualComponents = visualComponents;
        MisconceptionCodes = misconceptionCodes;
        Skills = skills;
        Definitions = definitions;
        Lessons = lessons;
        Translations = translations;
        FrontMatters = translations.ToDictionary(t => t.Key, t => t.Value.FrontMatter);
        _assets = assets;
    }

    private readonly IReadOnlyDictionary<string, IReadOnlyList<string>> _assets;

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

    public IReadOnlyDictionary<(string LessonId, string Language), LessonTranslation> Translations { get; }

    public LessonFrontMatter FrontMatter(string lessonId, string language) => FrontMatters[(lessonId, language)];

    public LessonTranslation Translation(string lessonId, string language) => Translations[(lessonId, language)];

    public bool TryGetTranslation(string lessonId, string language, out LessonTranslation translation) =>
        Translations.TryGetValue((lessonId, language), out translation!);

    /// <summary>File names in the lesson's assets/ folder, sorted ordinally; the only names the service serves.</summary>
    public IReadOnlyList<string> Assets(string lessonId) => _assets.TryGetValue(lessonId, out var names) ? names : [];

    /// <summary>Lessons whose practice entries list the definition key (<c>id@version</c>), ordered by lesson ID.</summary>
    public IReadOnlyList<LessonMetadata> LessonsForDefinition(string definitionKey) =>
        Lessons.Values
            .Where(l => l.Practice.Any(p => p.Key == definitionKey))
            .OrderBy(l => l.Id, StringComparer.Ordinal)
            .ToList();

    public bool TryGetDefinition(string id, int version, out ExerciseDefinition definition) =>
        Definitions.TryGetValue($"{id}@{version}", out definition!);
}
