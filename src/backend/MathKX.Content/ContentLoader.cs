using System.Text.Json;
using System.Text.RegularExpressions;
using MathKX.Domain.Content;

namespace MathKX.Content;

/// <summary>
/// Loads content/ into a <see cref="ContentCatalog"/>: registries, skills, pilot definitions, lessons, and
/// each translation's front matter. Schemas are not re-validated here (the content checks in CI do that);
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
        var lessons = new Dictionary<string, LessonMetadata>(StringComparer.Ordinal);
        var translations = new Dictionary<(string, string), LessonTranslation>();
        var assets = new Dictionary<string, IReadOnlyList<string>>(StringComparer.Ordinal);

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
                    Add(skills, Deserialize<Skill>(document, relative), s => s.Id, relative);
                    break;
                case "exercise-definition.pilot.schema.json":
                    Add(definitions, Deserialize<ExerciseDefinition>(document, relative), d => d.Key, relative);
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
                        translations[(lesson.Id, language)] = new LessonTranslation(language, name, markdown, FrontMatterReader.Read(markdown, translationRelative));
                    }

                    assets[lesson.Id] = ListAssets(Path.Combine(folder, "assets"), root);

                    break;
                case "exercise.schema.json":
                    break; // the exploratory 0.1 example is not resolvable content
                default:
                    throw new ContentLoadException(relative, $"unknown schema {schema}");
            }
        }

        CheckReferences(definitions, generators, validators, representations, codes, root);

        return new ContentCatalog(generators, validators, representations, components, codes, skills, definitions, lessons, translations, assets);
    }

    private static readonly Regex AssetName = new("^[A-Za-z0-9][A-Za-z0-9._-]*$", RegexOptions.CultureInvariant);

    /// <summary>
    /// The file names a lesson may serve from its assets/ folder (specs/003 data-model.md): regular files directly
    /// inside, sorted ordinally; dotfiles are ignored; any other entry fails the load with its path.
    /// </summary>
    private static IReadOnlyList<string> ListAssets(string folder, string root)
    {
        if (!Directory.Exists(folder))
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

    private static void CheckReferences(
        Dictionary<string, ExerciseDefinition> definitions,
        Dictionary<string, GeneratorEntry> generators,
        Dictionary<string, ValidatorEntry> validators,
        Dictionary<string, RepresentationEntry> representations,
        Dictionary<string, MisconceptionCodeEntry> codes,
        string root)
    {
        foreach (var definition in definitions.Values)
        {
            var path = DefinitionPath(root, definition);
            if (!validators.ContainsKey(definition.Validator.Key))
            {
                throw new ContentLoadException(path, $"validator {definition.Validator.Key} is not registered");
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

    private static readonly Dictionary<string, string> DefinitionPaths = new(StringComparer.Ordinal);

    private static string DefinitionPath(string root, ExerciseDefinition definition)
    {
        // Best effort: find the file that defines this id@version for the error message.
        if (DefinitionPaths.TryGetValue(definition.Key, out var cached))
        {
            return cached;
        }

        foreach (var file in Directory.EnumerateFiles(Path.Combine(root, "exercises"), "*.json", SearchOption.AllDirectories))
        {
            var text = File.ReadAllText(file);
            if (text.Contains($"\"id\": \"{definition.Id}\"", StringComparison.Ordinal) && text.Contains($"\"version\": {definition.Version}", StringComparison.Ordinal))
            {
                var relative = Path.GetRelativePath(root, file).Replace('\\', '/');
                DefinitionPaths[definition.Key] = relative;
                return relative;
            }
        }

        return definition.Key;
    }
}
