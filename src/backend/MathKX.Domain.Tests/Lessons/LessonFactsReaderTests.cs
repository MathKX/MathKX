using System.Globalization;
using System.Text.Json;
using MathKX.Content;
using MathKX.Domain.Tests.Content;

namespace MathKX.Domain.Tests.Lessons;

/// <summary>
/// The C# reader against the shared agreement fixture (specs/003-lesson-rendering/contracts/lesson-facts.fixture.json),
/// whose expected values were produced by the validator's remark parser; tools/validate-content.test.mjs runs the same file.
/// </summary>
public sealed class LessonFactsReaderTests
{
    private const string FrontMatter = "---\ntitle: t\nobjective: o\n---\n\n";

    public static TheoryData<string> Cases()
    {
        var data = new TheoryData<string>();
        foreach (var c in Fixture().RootElement.GetProperty("cases").EnumerateArray())
        {
            data.Add(c.GetProperty("name").GetString()!);
        }

        return data;
    }

    [Theory]
    [MemberData(nameof(Cases))]
    public void Reads_what_the_validator_reads(string name)
    {
        var c = Fixture().RootElement.GetProperty("cases").EnumerateArray().Single(x => x.GetProperty("name").GetString() == name);
        var expected = c.GetProperty("expected");

        var facts = LessonFactsReader.Read(FrontMatter + c.GetProperty("markdown").GetString());

        Assert.Equal(expected.GetProperty("expressions").EnumerateArray().Select(e => e.GetString()), facts.Expressions.Select(e => e.Source));
        var visuals = expected.GetProperty("visuals").EnumerateArray().ToList();
        Assert.Equal(visuals.Count, facts.Visuals.Count);
        for (var i = 0; i < visuals.Count; i++)
        {
            Assert.Equal(visuals[i].GetProperty("type").GetString(), facts.Visuals[i].Type);
            var attributes = visuals[i].GetProperty("attributes").EnumerateObject().ToDictionary(p => p.Name, p => int.Parse(p.Value.GetString()!, CultureInfo.InvariantCulture));
            Assert.Equal(attributes.OrderBy(p => p.Key), facts.Visuals[i].Attributes.OrderBy(p => p.Key));
        }
    }

    [Fact]
    public void The_fixture_has_the_cases_the_contract_names()
    {
        Assert.True(Cases().Count >= 9);
    }

    private static JsonDocument Fixture()
    {
        var repository = Directory.GetParent(RepositoryContent.Root)!.FullName;
        return JsonDocument.Parse(File.ReadAllText(Path.Combine(repository, "specs", "003-lesson-rendering", "contracts", "lesson-facts.fixture.json")));
    }
}
