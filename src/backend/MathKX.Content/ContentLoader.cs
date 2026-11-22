using System.Text.Json;
using System.Text.RegularExpressions;
using MathKX.Domain.Content;
using MathKX.Domain.Validators;

namespace MathKX.Content;

/// <summary>
/// Loads content/ into a <see cref="ContentCatalog"/>: registries, skills, pilot definitions, lessons,
/// each translation's front matter, and self-checks. Schemas are not re-validated here (the content checks in CI do that);
/// the loader fails fast with the file path on anything it cannot use.
/// </summary>
public static class ContentLoader
{
    private const string TemplatesDirectory = "_templates";
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    public static ContentCatalog Load(string contentRoot)
    {
        var root = Path.GetFullPath(contentRoot);
        if (!Directory.Exists(root))
        {
            throw new ContentLoadException(root, "content root does not exist");
        }

        var generators = new Dictionary<string, GeneratorEntry>(StringComparer.Ordinal);
        var validators = new Dictionary<string, ValidatorEntry>(StringComparer.Ordinal);
        var representations = new Dictionary<string, RepresentationEntry>(StringComparer.Ordinal);
        var components = new Dictionary<string, VisualComponentEntry>(StringComparer.Ordinal);
        var codes = new Dictionary<string, MisconceptionCodeEntry>(StringComparer.Ordinal);
        var skills = new Dictionary<string, Skill>(StringComparer.Ordinal);
        var definitions = new Dictionary<string, ExerciseDefinition>(StringComparer.Ordinal);
        var definitionFiles = new Dictionary<string, string>(StringComparer.Ordinal); // id@version -> the file it was read from
        var lessons = new Dictionary<string, LessonMetadata>(StringComparer.Ordinal);
        var translations = new Dictionary<(string, string), LessonTranslation>();
        var assets = new Dictionary<string, IReadOnlyList<string>>(StringComparer.Ordinal);
        var checks = new Dictionary<string, SelfCheck>(StringComparer.Ordinal);
        var checkFiles = new Dictionary<string, string>(StringComparer.Ordinal); // id@version -> the file it was read from

        foreach (var file in EnumerateJson(root))
        {
            var relative = Path.GetRelativePath(root, file).Replace('\\', '/');
            using var document = ParseDocument(file, relative);
            var schema = SchemaName(document, relative);
            switch (schema)
            {
                case "registry.schema.json":
                    LoadRegistry(document, relative, generators, validators, representations, components, codes);
                    break;
                case "skill.schema.json":
                    var skill = Deserialize<Skill>(document, relative);
                    if (string.IsNullOrWhiteSpace(skill.Name?.Nb) || string.IsNullOrWhiteSpace(skill.Name?.En))
                    {
                        // The validator reports this first in CI; the loader refuses rather than show an ID to a learner.
                        throw new ContentLoadException(relative, "skill name in nb and en is required");
                    }

                    Add(skills, skill, s => s.Id, relative);
                    break;
                case "exercise-definition.pilot.schema.json":
                    var definition = Deserialize<ExerciseDefinition>(document, relative);
                    Add(definitions, definition, d => d.Key, relative);
                    definitionFiles[definition.Key] = relative;
                    break;
                case "lesson.schema.json":
                    var lesson = Deserialize<LessonMetadata>(document, relative);
                    Add(lessons, lesson, l => l.Id, relative);
                    var folder = Path.GetDirectoryName(file)!;
                    foreach (var (language, name) in new[] { ("nb", lesson.Translations.Nb), ("en", lesson.Translations.En) })
                    {
                        var translation = Path.Combine(folder, name);
                        var translationRelative = Path.GetRelativePath(root, translation).Replace('\\', '/');
                        if (!File.Exists(translation))
                        {
                            throw new ContentLoadException(translationRelative, "translation file does not exist");
                        }

                        var markdown = File.ReadAllText(translation);
                        translations[(lesson.Id, language)] = new LessonTranslation(language, name, markdown, FrontMatterReader.Read(markdown, translationRelative), LessonFactsReader.Read(markdown));
                    }

                    assets[lesson.Id] = ListAssets(Path.Combine(folder, "assets"), root);

                    break;
                case "self-check.pilot.schema.json":
                    var check = Deserialize<SelfCheck>(document, relative);
                    Add(checks, check, c => c.Key, relative);
                    checkFiles[check.Key] = relative;
                    break;
                case "exercise.schema.json":
                    break; // the exploratory 0.1 example is not resolvable content
                default:
                    throw new ContentLoadException(relative, $"unknown schema {schema}");
            }
        }

        CheckReferences(definitions, definitionFiles, generators, validators, representations, codes);
        CheckCheckReferences(checks, checkFiles, skills, definitions);

        return new ContentCatalog(generators, validators, representations, components, codes, skills, definitions, lessons, translations, assets, checks);
    }

    private static readonly Regex AssetName = new("^[A-Za-z0-9][A-Za-z0-9._-]*$", RegexOptions.CultureInvariant);

    /// <summary>
    /// The file names a lesson may serve from its assets/ folder (specs/003 data-model.md): regular files directly
    /// inside, sorted ordinally; dotfiles are ignored; any other entry fails the load with its path. Links are refused,
    /// the folder itself included: the asset endpoint streams these files, and a link would let a lesson expose a file
    /// from anywhere on the server under a harmless name.
    /// </summary>
    private static IReadOnlyList<string> ListAssets(string folder, string root)
    {
        var folderInfo = new DirectoryInfo(folder);
        if (folderInfo.LinkTarget is not null || (folderInfo.Exists && folderInfo.Attributes.HasFlag(FileAttributes.ReparsePoint)))
        {
            throw new ContentLoadException(Path.GetRelativePath(root, folder).Replace('\\', '/'), "assets/ may not be a link");
        }

        if (!folderInfo.Exists)
        {
            return [];
        }

        var names = new List<string>();
        foreach (var entry in Directory.EnumerateFileSystemEntries(folder))
        {
            var name = Path.GetFileName(entry);
            if (name.StartsWith('.'))
            {
                continue;
            }

            var relative = Path.GetRelativePath(root, entry).Replace('\\', '/');
            var info = new FileInfo(entry);
            if (info.LinkTarget is not null || info.Attributes.HasFlag(FileAttributes.ReparsePoint))
            {
                throw new ContentLoadException(relative, "assets/ may not hold links");
            }

            if (Directory.Exists(entry))
            {
                throw new ContentLoadException(relative, "assets/ may only hold files, not folders");
            }

            if (!AssetName.IsMatch(name))
            {
                throw new ContentLoadException(relative, "asset names must match ^[A-Za-z0-9][A-Za-z0-9._-]*$");
            }

            names.Add(name);
        }

        names.Sort(StringComparer.Ordinal);
        return names;
    }

    private static IEnumerable<string> EnumerateJson(string root)
    {
        foreach (var entry in Directory.EnumerateFileSystemEntries(root).OrderBy(e => e, StringComparer.Ordinal))
        {
            if (Directory.Exists(entry))
            {
                if (Path.GetFileName(entry) == TemplatesDirectory)
                {
                    continue;
                }

                foreach (var file in Directory.EnumerateFiles(entry, "*.json", SearchOption.AllDirectories).OrderBy(f => f, StringComparer.Ordinal))
                {
                    yield return file;
                }
            }
            else if (entry.EndsWith(".json", StringComparison.OrdinalIgnoreCase))
            {
                yield return entry;
            }
        }
    }

    private static JsonDocument ParseDocument(string file, string relative)
    {
        try
        {
            return JsonDocument.Parse(File.ReadAllText(file));
        }
        catch (JsonException error)
        {
            throw new ContentLoadException(relative, $"invalid JSON: {error.Message}", error);
        }
    }

    private static string SchemaName(JsonDocument document, string relative)
    {
        if (document.RootElement.ValueKind != JsonValueKind.Object || !document.RootElement.TryGetProperty("$schema", out var schema) || schema.ValueKind != JsonValueKind.String)
        {
            throw new ContentLoadException(relative, "missing \"$schema\"");
        }

        return Path.GetFileName(schema.GetString()!);
    }

    private static T Deserialize<T>(JsonDocument document, string relative)
    {
        try
        {
            return document.RootElement.Deserialize<T>(Json) ?? throw new ContentLoadException(relative, "empty document");
        }
        catch (JsonException error)
        {
            throw new ContentLoadException(relative, $"cannot read {typeof(T).Name}: {error.Message}", error);
        }
    }

    private static T[] DeserializeEntries<T>(JsonDocument document, string relative)
    {
        if (!document.RootElement.TryGetProperty("entries", out var entries))
        {
            throw new ContentLoadException(relative, "registry has no entries");
        }

        try
        {
            return entries.Deserialize<T[]>(Json) ?? [];
        }
        catch (JsonException error)
        {
            throw new ContentLoadException(relative, $"cannot read registry entries: {error.Message}", error);
        }
    }

    private static void LoadRegistry(
        JsonDocument document,
        string relative,
        Dictionary<string, GeneratorEntry> generators,
        Dictionary<string, ValidatorEntry> validators,
        Dictionary<string, RepresentationEntry> representations,
        Dictionary<string, VisualComponentEntry> components,
        Dictionary<string, MisconceptionCodeEntry> codes)
    {
        var kind = document.RootElement.TryGetProperty("kind", out var k) ? k.GetString() : null;
        switch (kind)
        {
            case "generators":
                foreach (var e in DeserializeEntries<GeneratorEntry>(document, relative)) Add(generators, e, x => x.Key, relative);
                break;
            case "validators":
                foreach (var e in DeserializeEntries<ValidatorEntry>(document, relative)) Add(validators, e, x => x.Key, relative);
                break;
            case "representations":
                foreach (var e in DeserializeEntries<RepresentationEntry>(document, relative)) Add(representations, e, x => x.Name, relative);
                break;
            case "visual-components":
                foreach (var e in DeserializeEntries<VisualComponentEntry>(document, relative)) Add(components, e, x => x.Type, relative);
                break;
            case "misconception-codes":
                foreach (var e in DeserializeEntries<MisconceptionCodeEntry>(document, relative)) Add(codes, e, x => x.Code, relative);
                break;
            default:
                throw new ContentLoadException(relative, $"unknown registry kind {kind}");
        }
    }

    private static void Add<T>(Dictionary<string, T> map, T item, Func<T, string> key, string relative)
    {
        var k = key(item);
        if (!map.TryAdd(k, item))
        {
            throw new ContentLoadException(relative, $"duplicate {k}");
        }
    }

    /// <summary>
    /// A self-check's references (specs/006 contracts/check-content.md "The loader"): its skill exists, each question's
    /// definition exists, and a seed is given exactly when that definition is generated. The service does not start otherwise.
    /// </summary>
    private static void CheckCheckReferences(
        Dictionary<string, SelfCheck> checks,
        Dictionary<string, string> checkFiles,
        Dictionary<string, Skill> skills,
        Dictionary<string, ExerciseDefinition> definitions)
    {
        foreach (var check in checks.Values)
        {
            var path = checkFiles[check.Key];
            if (!skills.ContainsKey(check.Skill))
            {
                throw new ContentLoadException(path, $"skill {check.Skill} is not a defined skill");
            }

            for (var i = 0; i < check.Questions.Count; i++)
            {
                var question = check.Questions[i];
                if (!definitions.TryGetValue(question.Key, out var definition))
                {
                    throw new ContentLoadException(path, $"questions[{i}]: {question.Key} is not a pilot exercise definition");
                }

                if (definition.IsFixed && question.Seed is not null)
                {
                    throw new ContentLoadException(path, $"questions[{i}]: {question.Key} is a fixed task; remove the seed");
                }

                if (!definition.IsFixed && question.Seed is null)
                {
                    throw new ContentLoadException(path, $"questions[{i}]: {question.Key} is generated; give the seed of the question");
                }
            }
        }
    }

    private static void CheckReferences(
        Dictionary<string, ExerciseDefinition> definitions,
        Dictionary<string, string> definitionFiles,
        Dictionary<string, GeneratorEntry> generators,
        Dictionary<string, ValidatorEntry> validators,
        Dictionary<string, RepresentationEntry> representations,
        Dictionary<string, MisconceptionCodeEntry> codes)
    {
        foreach (var definition in definitions.Values)
        {
            var path = definitionFiles[definition.Key];
            if (!validators.TryGetValue(definition.Validator.Key, out var validator))
            {
                throw new ContentLoadException(path, $"validator {definition.Validator.Key} is not registered");
            }

            // A fixed ax = b must have a whole-number x, or the validator could not judge it (PR 64 review).
            if (definition.IsFixed
                && validator.Form == QuestionForms.UnknownFactor
                && definition.Instance?.Prompt is { } prompt
                && prompt.TryGetValue("a", out var a)
                && prompt.TryGetValue("b", out var b)
                && (a <= 0 || b <= 0 || b % a != 0))
            {
                throw new ContentLoadException(path, $"{a}x = {b} has no whole-number solution; a must be greater than 0 and b a multiple of a");
            }

            if (definition.Generator is not null && !generators.ContainsKey(definition.Generator.Key))
            {
                throw new ContentLoadException(path, $"generator {definition.Generator.Key} is not registered");
            }

            foreach (var name in definition.Representations.Help.Concat(definition.Representations.Explanation))
            {
                if (!representations.ContainsKey(name))
                {
                    throw new ContentLoadException(path, $"representation {name} is not registered");
                }
            }

            foreach (var code in definition.MisconceptionCodes)
            {
                if (!codes.ContainsKey(code))
                {
                    throw new ContentLoadException(path, $"misconception code {code} is not registered");
                }
            }
        }
    }
}
