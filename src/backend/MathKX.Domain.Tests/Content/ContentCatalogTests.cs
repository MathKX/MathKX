using MathKX.Content;
using MathKX.Domain.Content;

namespace MathKX.Domain.Tests.Content;

/// <summary>Loads the repository's own content/ and checks the loader against spec 001's pilot files.</summary>
public sealed class ContentCatalogTests
{
    [Fact]
    public void Loads_the_pilot_content()
    {
        var catalog = ContentLoader.Load(RepositoryContent.Root);

        Assert.Equal(9, catalog.Skills.Count);
        Assert.True(catalog.Skills.ContainsKey("numbers.number-bonds-to-ten"));
        var addition = catalog.Skills["numbers.addition-within-20"];
        Assert.Equal(["numbers.number-bonds-to-ten"], addition.Prerequisites);
        Assert.NotNull(addition.Ladder);
        Assert.Equal(2, addition.Ladder!.Count);
        Assert.Equal("numbers.addition.within-10", addition.Ladder[0].Definition);

        Assert.Equal(3, catalog.Definitions.Count);
        Assert.True(catalog.Definitions.ContainsKey("numbers.addition.within-10@1"));
        Assert.True(catalog.Definitions.ContainsKey("numbers.addition.crossing-ten@1"));
        Assert.True(catalog.Definitions.ContainsKey("numbers.addition.four-plus-four@1"));
        Assert.False(catalog.Definitions.Keys.Any(k => k.StartsWith("algebra.", StringComparison.Ordinal)), "the 0.1 example is skipped by schema name");

        Assert.Single(catalog.Generators);
        Assert.Single(catalog.Validators);
        Assert.Equal(3, catalog.Representations.Count);
        Assert.Equal(3, catalog.VisualComponents.Count);
        Assert.Equal(5, catalog.MisconceptionCodes.Count);

        var lesson = Assert.Single(catalog.Lessons).Value;
        Assert.Equal("number-bonds-to-ten", lesson.Id);
        Assert.Equal(2, lesson.Practice.Count);
        Assert.Equal("Tiervenner – tall som blir 10", catalog.FrontMatter(lesson.Id, "nb").Title);
        Assert.Equal("Number bonds to ten", catalog.FrontMatter(lesson.Id, "en").Title);
        Assert.StartsWith("You will learn", catalog.FrontMatter(lesson.Id, "en").Objective, StringComparison.Ordinal);
    }

    [Fact]
    public void Definition_bounds_and_registry_entries_are_typed()
    {
        var catalog = ContentLoader.Load(RepositoryContent.Root);
        var within = catalog.Definitions["numbers.addition.within-10@1"];
        Assert.Equal("generated", within.Source);
        Assert.NotNull(within.Generator);
        Assert.Equal(new Bounds(1, 9), within.Generator!.Parameters["operand"]);
        Assert.Equal(new Bounds(2, 10), within.Generator.Parameters["sum"]);
        var generator = catalog.Generators["addition-pair@1"];
        Assert.Equal("sum-of-two-operands", generator.Relation);
        Assert.Equal("operand", generator.Parameters["operand"].Quantity);
        var fixedTask = catalog.Definitions["numbers.addition.four-plus-four@1"];
        Assert.Equal(4, fixedTask.Instance!.Prompt["a"]);
        Assert.Equal(8, fixedTask.Instance.Validation["answer"].GetInt32());
    }

    [Fact]
    public void Fails_fast_with_the_path_when_a_definition_names_an_unregistered_generator()
    {
        using var temp = new TempContent();
        temp.CopyRepositoryContent();
        temp.Rewrite("exercises/numbers/addition-within-10.json", text => text.Replace("\"name\": \"addition-pair\"", "\"name\": \"addition-pear\"", StringComparison.Ordinal));

        var error = Assert.Throws<ContentLoadException>(() => ContentLoader.Load(temp.Root));

        Assert.Contains("addition-within-10.json", error.Path, StringComparison.Ordinal);
        Assert.Contains("addition-pear@1", error.Message, StringComparison.Ordinal);
    }

    [Theory]
    [InlineData("---\ntitle: \"Quoted: title\"\nobjective: 'Single quoted'\n---\n# Body\n", "Quoted: title", "Single quoted")]
    [InlineData("---\ntitle: Folded\nobjective: >-\n  First line\n  second line\n---\n", "Folded", "First line second line")]
    [InlineData("---\ntitle: With comment # not part of the value\nobjective: Plain\n---\n", "With comment", "Plain")]
    public void Reads_front_matter_with_yaml_semantics(string markdown, string title, string objective)
    {
        var frontMatter = FrontMatterReader.Read(markdown, "nb.md");

        Assert.Equal(title, frontMatter.Title);
        Assert.Equal(objective, frontMatter.Objective);
    }

    [Fact]
    public void Front_matter_without_the_required_keys_fails_with_the_file()
    {
        var error = Assert.Throws<ContentLoadException>(() => FrontMatterReader.Read("---\ntitle: Only\n---\n", "en.md"));
        Assert.Equal("en.md", error.Path);
        Assert.Contains("objective", error.Message, StringComparison.Ordinal);
    }

    [Fact]
    public void Keeps_each_translation_and_the_lesson_assets()
    {
        var catalog = ContentLoader.Load(RepositoryContent.Root);
        const string id = "number-bonds-to-ten";
        var folder = Path.Combine(RepositoryContent.Root, "lessons", id);

        foreach (var language in new[] { "nb", "en" })
        {
            var translation = catalog.Translation(id, language);
            Assert.Equal(language, translation.Language);
            Assert.Equal($"{language}.md", translation.File);
            Assert.Equal(File.ReadAllText(Path.Combine(folder, $"{language}.md")), translation.Markdown);
            Assert.Equal(catalog.FrontMatter(id, language), translation.FrontMatter);
        }

        Assert.Equal(["ten-frame-3-7.svg"], catalog.Assets(id));
    }

    [Fact]
    public void Finds_the_lessons_that_list_a_definition()
    {
        var catalog = ContentLoader.Load(RepositoryContent.Root);

        Assert.Equal(["number-bonds-to-ten"], catalog.LessonsForDefinition("numbers.addition.within-10@1").Select(l => l.Id));
        Assert.Equal(["number-bonds-to-ten"], catalog.LessonsForDefinition("numbers.addition.crossing-ten@1").Select(l => l.Id));
        Assert.Empty(catalog.LessonsForDefinition("numbers.addition.four-plus-four@1"));
        Assert.Empty(catalog.LessonsForDefinition("numbers.addition.within-10@2"));
    }

    [Fact]
    public void Every_skill_has_a_name_in_both_languages()
    {
        var catalog = ContentLoader.Load(RepositoryContent.Root);

        Assert.All(catalog.Skills.Values, skill =>
        {
            Assert.False(string.IsNullOrWhiteSpace(skill.Name.Nb), skill.Id);
            Assert.False(string.IsNullOrWhiteSpace(skill.Name.En), skill.Id);
        });
        Assert.Equal("Addition within 20", catalog.Skills["numbers.addition-within-20"].Name.En);
    }

    [Fact]
    public void Lists_the_definitions_of_each_skill()
    {
        var catalog = ContentLoader.Load(RepositoryContent.Root);

        Assert.Equal(
            ["numbers.addition.crossing-ten@1", "numbers.addition.four-plus-four@1", "numbers.addition.within-10@1"],
            catalog.DefinitionsForSkill("numbers.addition-within-20"));
        Assert.Empty(catalog.DefinitionsForSkill("numbers.number-bonds-to-ten"));
        Assert.Empty(catalog.DefinitionsForSkill("numbers.unknown"));
    }

    [Fact]
    public void Fails_fast_with_the_path_when_a_skill_has_no_name()
    {
        using var temp = new TempContent();
        temp.CopyRepositoryContent();
        temp.Rewrite("skills/numbers.powers.json", text => System.Text.RegularExpressions.Regex.Replace(text, "\"name\":\\s*\\{[^}]*\\},?", ""));

        var error = Assert.Throws<ContentLoadException>(() => ContentLoader.Load(temp.Root));

        Assert.Contains("numbers.powers.json", error.Path, StringComparison.Ordinal);
        Assert.Contains("name", error.Message, StringComparison.Ordinal);
    }

    [Fact]
    public void Ignores_dotfiles_in_assets()
    {
        using var content = new TempContent();
        content.CopyRepositoryContent();
        File.WriteAllText(Path.Combine(content.Root, "lessons", "number-bonds-to-ten", "assets", ".gitkeep"), "");

        Assert.Equal(["ten-frame-3-7.svg"], ContentLoader.Load(content.Root).Assets("number-bonds-to-ten"));
    }

    [Theory]
    [InlineData("bad name.svg")]
    [InlineData("-dash.svg")]
    public void Fails_fast_on_an_asset_name_outside_the_rule(string name)
    {
        using var content = new TempContent();
        content.CopyRepositoryContent();
        File.WriteAllText(Path.Combine(content.Root, "lessons", "number-bonds-to-ten", "assets", name), "<svg/>");

        var error = Assert.Throws<ContentLoadException>(() => ContentLoader.Load(content.Root));
        Assert.Equal($"lessons/number-bonds-to-ten/assets/{name}", error.Path);
    }

    [Fact]
    public void Fails_fast_on_a_symlinked_asset()
    {
        using var content = new TempContent();
        content.CopyRepositoryContent();
        var outside = Path.Combine(content.Root, "outside-secret.txt");
        File.WriteAllText(outside, "not lesson content");
        var link = Path.Combine(content.Root, "lessons", "number-bonds-to-ten", "assets", "leak.svg");
        if (!TryCreateLink(() => File.CreateSymbolicLink(link, outside)))
        {
            return; // this machine cannot create symbolic links (Windows without the privilege); CI on Linux runs it
        }

        var error = Assert.Throws<ContentLoadException>(() => ContentLoader.Load(content.Root));
        Assert.Equal("lessons/number-bonds-to-ten/assets/leak.svg", error.Path);
        Assert.Contains("link", error.Message, StringComparison.Ordinal);
    }

    [Fact]
    public void Fails_fast_on_a_symlinked_assets_folder()
    {
        using var content = new TempContent();
        content.CopyRepositoryContent();
        var assets = Path.Combine(content.Root, "lessons", "number-bonds-to-ten", "assets");
        var elsewhere = Path.Combine(content.Root, "elsewhere");
        Directory.Move(assets, elsewhere);
        if (!TryCreateLink(() => Directory.CreateSymbolicLink(assets, elsewhere)))
        {
            return; // see above
        }

        var error = Assert.Throws<ContentLoadException>(() => ContentLoader.Load(content.Root));
        Assert.Equal("lessons/number-bonds-to-ten/assets", error.Path);
    }

    private static bool TryCreateLink(Action create)
    {
        try
        {
            create();
            return true;
        }
        catch (Exception error) when (error is UnauthorizedAccessException or IOException or PlatformNotSupportedException)
        {
            return false;
        }
    }

    [Fact]
    public void Fails_fast_on_a_folder_inside_assets()
    {
        using var content = new TempContent();
        content.CopyRepositoryContent();
        Directory.CreateDirectory(Path.Combine(content.Root, "lessons", "number-bonds-to-ten", "assets", "nested"));

        var error = Assert.Throws<ContentLoadException>(() => ContentLoader.Load(content.Root));
        Assert.Equal("lessons/number-bonds-to-ten/assets/nested", error.Path);
    }
}
