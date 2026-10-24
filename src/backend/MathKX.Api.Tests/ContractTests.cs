using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;

namespace MathKX.Api.Tests;

/// <summary>The numbered determinism and privacy tests of specs/002 contracts/api.md, plus the error codes.</summary>
public sealed class ContractTests : IClassFixture<WebApplicationFactory<Program>>
{
    private const string Crossing42 = "/api/instances/numbers.addition.crossing-ten/1/42";
    private readonly WebApplicationFactory<Program> _factory;

    public ContractTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Resolving_the_same_identity_twice_and_after_a_restart_is_byte_identical()
    {
        using var client = _factory.CreateClient();
        var first = await client.GetStringAsync(Crossing42);
        var second = await client.GetStringAsync(Crossing42);
        Assert.Equal(first, second);

        using var restarted = new WebApplicationFactory<Program>();
        using var other = restarted.CreateClient();
        Assert.Equal(first, await other.GetStringAsync(Crossing42));

        using var document = JsonDocument.Parse(first);
        Assert.Equal("42", document.RootElement.GetProperty("identity").GetProperty("seed").GetString());
        Assert.Equal(1, document.RootElement.GetProperty("generator").GetProperty("version").GetInt32());
    }

    [Theory]
    [InlineData(Crossing42)]
    [InlineData("/api/instances/numbers.addition.within-10/1/0")]
    [InlineData("/api/instances/numbers.addition.four-plus-four/1/-")]
    [InlineData("/api/lessons")]
    [InlineData("/api/lessons/number-bonds-to-ten")]
    [InlineData("/api/skills/numbers.addition-within-20")]
    public async Task Unsolicited_responses_never_contain_sum_or_validation(string path)
    {
        using var client = _factory.CreateClient();
        var response = await client.GetAsync(path);
        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadAsStringAsync();

        Assert.DoesNotContain(PropertyNames(body), name => name is "sum" or "validation");
    }

    [Fact]
    public async Task Incorrect_and_invalid_results_carry_no_sum_but_a_correct_one_does()
    {
        using var client = _factory.CreateClient();
        var incorrect = await Validate(client, "numbers.addition.four-plus-four", 1, null, "4");
        var invalid = await Validate(client, "numbers.addition.four-plus-four", 1, null, "abc");
        var correct = await Validate(client, "numbers.addition.four-plus-four", 1, null, " 8 ");

        Assert.Equal("incorrect", incorrect.RootElement.GetProperty("status").GetString());
        Assert.Equal("add.oneGroup", incorrect.RootElement.GetProperty("code").GetString());
        Assert.DoesNotContain(PropertyNames(incorrect.RootElement.GetRawText()), n => n == "sum");
        Assert.Equal("invalid-response", invalid.RootElement.GetProperty("status").GetString());
        Assert.DoesNotContain(PropertyNames(invalid.RootElement.GetRawText()), n => n == "sum");
        Assert.Equal("correct", correct.RootElement.GetProperty("status").GetString());
        Assert.Equal(8, correct.RootElement.GetProperty("values").GetProperty("sum").GetInt32());
    }

    [Fact]
    public async Task Validation_is_deterministic_and_echoes_the_submission_id()
    {
        using var client = _factory.CreateClient();
        var a = await Validate(client, "numbers.addition.crossing-ten", 1, "42", "13", "sub-1");
        var b = await Validate(client, "numbers.addition.crossing-ten", 1, "42", "13", "sub-1");
        Assert.Equal(a.RootElement.GetRawText(), b.RootElement.GetRawText());
        Assert.Equal("sub-1", a.RootElement.GetProperty("submissionId").GetString());
    }

    [Theory]
    [InlineData("-2147483640")] // v - sum would overflow Int32 for 4 + 4
    [InlineData("-2147483648")]
    [InlineData("2147483647")]
    public async Task Extreme_integers_get_typed_feedback_instead_of_a_server_error(string text)
    {
        using var client = _factory.CreateClient();
        using var result = await Validate(client, "numbers.addition.four-plus-four", 1, null, text);
        Assert.Equal("incorrect", result.RootElement.GetProperty("status").GetString());
        Assert.Equal("add.generic", result.RootElement.GetProperty("code").GetString());
        Assert.DoesNotContain(PropertyNames(result.RootElement.GetRawText()), n => n == "sum");
    }

    [Fact]
    public async Task Language_never_changes_the_mathematics()
    {
        using var client = _factory.CreateClient();
        var nb = await client.GetStringAsync(Crossing42 + "?lang=nb");
        var en = await client.GetStringAsync(Crossing42 + "?lang=en");
        Assert.Equal(nb, en);
    }

    [Theory]
    [InlineData("-1")]
    [InlineData("01")]
    [InlineData("abc")]
    [InlineData("18446744073709551616")]
    public async Task Invalid_seeds_are_rejected_with_the_contract_code(string seed)
    {
        using var client = _factory.CreateClient();
        var response = await client.GetAsync($"/api/instances/numbers.addition.within-10/1/{seed}");
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("invalid-seed", await Code(response));
    }

    [Fact]
    public async Task A_generated_definition_without_a_seed_is_an_invalid_seed()
    {
        using var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/instances/numbers.addition.within-10/1/-");
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("invalid-seed", await Code(response));
    }

    [Theory]
    [InlineData("/api/instances/numbers.addition.nope/1/1")]
    [InlineData("/api/instances/numbers.addition.within-10/9/1")]
    public async Task Unknown_definitions_and_versions_are_not_found(string path)
    {
        using var client = _factory.CreateClient();
        var response = await client.GetAsync(path);
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal("unknown-definition", await Code(response));
    }

    [Fact]
    public async Task Malformed_validation_requests_are_invalid_artifacts()
    {
        using var client = _factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/validations", new { identity = new { definitionId = "numbers.addition.within-10", version = 1, seed = "1" }, artifact = new { kind = "drawing", originalText = "x" } });
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("invalid-artifact", await Code(response));
    }

    [Fact]
    public async Task Lesson_metadata_carries_titles_objectives_and_practice_entries()
    {
        using var client = _factory.CreateClient();
        using var lesson = JsonDocument.Parse(await client.GetStringAsync("/api/lessons/number-bonds-to-ten"));
        Assert.Equal("Number bonds to ten", lesson.RootElement.GetProperty("titles").GetProperty("en").GetString());
        Assert.StartsWith("Du lærer", lesson.RootElement.GetProperty("objectives").GetProperty("nb").GetString(), StringComparison.Ordinal);
        var practice = lesson.RootElement.GetProperty("practice");
        Assert.Equal(2, practice.GetArrayLength());
        Assert.Equal("numbers.addition-within-20", practice[0].GetProperty("skill").GetString());

        using var skill = JsonDocument.Parse(await client.GetStringAsync("/api/skills/numbers.addition-within-20"));
        Assert.Equal(2, skill.RootElement.GetProperty("ladder").GetArrayLength());

        var missing = await client.GetAsync("/api/lessons/nope");
        Assert.Equal(HttpStatusCode.NotFound, missing.StatusCode);
        Assert.Equal("unknown-lesson", await Code(missing));
    }

    private static async Task<JsonDocument> Validate(HttpClient client, string definitionId, int version, string? seed, string text, string? submissionId = null)
    {
        var response = await client.PostAsJsonAsync("/api/validations", new
        {
            identity = new { definitionId, version, seed },
            artifact = new { kind = "integer", originalText = text },
            submissionId,
        });
        response.EnsureSuccessStatusCode();
        return JsonDocument.Parse(await response.Content.ReadAsStringAsync());
    }

    private static async Task<string?> Code(HttpResponseMessage response)
    {
        using var problem = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        return problem.RootElement.GetProperty("code").GetString();
    }

    private static IEnumerable<string> PropertyNames(string json)
    {
        using var document = JsonDocument.Parse(json);
        var names = new List<string>();
        Walk(document.RootElement, names);
        return names;
    }

    private static void Walk(JsonElement element, List<string> names)
    {
        switch (element.ValueKind)
        {
            case JsonValueKind.Object:
                foreach (var property in element.EnumerateObject())
                {
                    names.Add(property.Name);
                    Walk(property.Value, names);
                }

                break;
            case JsonValueKind.Array:
                foreach (var item in element.EnumerateArray())
                {
                    Walk(item, names);
                }

                break;
            default:
                break;
        }
    }
}

/// <summary>Step delivery: one step per request, exactly one revealing step per sequence, the last.</summary>
public sealed class StepContractTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public StepContractTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    [Theory]
    [InlineData("numbers.addition.within-10", "5", "help")]
    [InlineData("numbers.addition.within-10", "5", "explanation")]
    [InlineData("numbers.addition.crossing-ten", "42", "help")]
    [InlineData("numbers.addition.crossing-ten", "42", "explanation")]
    [InlineData("numbers.addition.four-plus-four", "-", "help")]
    [InlineData("numbers.addition.four-plus-four", "-", "explanation")]
    public async Task Only_the_last_step_reveals_and_only_it_carries_the_sum(string definition, string seed, string kind)
    {
        using var client = _factory.CreateClient();
        var first = JsonDocument.Parse(await client.GetStringAsync($"/api/instances/{definition}/1/{seed}/steps/{kind}/0"));
        var count = first.RootElement.GetProperty("count").GetInt32();
        Assert.True(count >= 3);

        for (var index = 0; index < count; index++)
        {
            var body = await client.GetStringAsync($"/api/instances/{definition}/1/{seed}/steps/{kind}/{index}");
            using var step = JsonDocument.Parse(body);
            var reveals = step.RootElement.GetProperty("reveals").GetBoolean();
            Assert.Equal(index == count - 1, reveals);
            var hasSum = body.Contains("\"sum\"", StringComparison.Ordinal) || body.Contains("\"total\"", StringComparison.Ordinal) || body.Contains("\"countedAll\"", StringComparison.Ordinal);
            Assert.Equal(reveals, hasSum);
        }

        var outOfRange = await client.GetAsync($"/api/instances/{definition}/1/{seed}/steps/{kind}/{count}");
        Assert.Equal(HttpStatusCode.NotFound, outOfRange.StatusCode);
    }

    [Fact]
    public async Task Unknown_kinds_and_bad_seeds_use_the_contract_codes()
    {
        using var client = _factory.CreateClient();
        var kind = await client.GetAsync("/api/instances/numbers.addition.within-10/1/5/steps/other/0");
        Assert.Equal(HttpStatusCode.NotFound, kind.StatusCode);
        using var kindProblem = JsonDocument.Parse(await kind.Content.ReadAsStringAsync());
        Assert.Equal("unknown-step", kindProblem.RootElement.GetProperty("code").GetString());

        var seed = await client.GetAsync("/api/instances/numbers.addition.within-10/1/01/steps/help/0");
        Assert.Equal(HttpStatusCode.BadRequest, seed.StatusCode);
    }

    // specs/003 contracts/api.md, contract tests 2 and 3: lesson content and assets.

    private const string Lesson = "/api/lessons/number-bonds-to-ten";

    [Theory]
    [InlineData("nb")]
    [InlineData("en")]
    public async Task Lesson_content_is_the_translation_as_authored(string language)
    {
        using var client = _factory.CreateClient();
        var body = await client.GetStringAsync($"{Lesson}/content/{language}");
        using var document = JsonDocument.Parse(body);
        var root = document.RootElement;

        Assert.Equal("number-bonds-to-ten", root.GetProperty("id").GetString());
        Assert.Equal(1, root.GetProperty("version").GetInt32());
        Assert.Equal(language, root.GetProperty("language").GetString());
        var file = Path.Combine(RepositoryContentRoot(), "lessons", "number-bonds-to-ten", $"{language}.md");
        Assert.Equal(File.ReadAllText(file), root.GetProperty("markdown").GetString());
        Assert.Equal(body, await client.GetStringAsync($"{Lesson}/content/{language}"));
    }

    [Theory]
    [InlineData("/api/lessons/no-such-lesson/content/en", "unknown-lesson")]
    [InlineData(Lesson + "/content/de", "unknown-language")]
    public async Task Unknown_lessons_and_languages_use_the_contract_codes(string path, string code)
    {
        using var client = _factory.CreateClient();
        var response = await client.GetAsync(path);
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        using var problem = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.Equal(code, problem.RootElement.GetProperty("code").GetString());
    }

    [Fact]
    public async Task An_asset_is_served_with_its_type_and_the_safety_headers()
    {
        using var client = _factory.CreateClient();
        var response = await client.GetAsync($"{Lesson}/assets/ten-frame-3-7.svg");

        response.EnsureSuccessStatusCode();
        Assert.Equal("image/svg+xml", response.Content.Headers.ContentType?.MediaType);
        Assert.Equal("nosniff", Assert.Single(response.Headers.GetValues("X-Content-Type-Options")));
        Assert.Equal("default-src 'none'; style-src 'unsafe-inline'; sandbox", Assert.Single(response.Headers.GetValues("Content-Security-Policy")));
        Assert.True(response.Headers.CacheControl?.NoCache);
        var file = Path.Combine(RepositoryContentRoot(), "lessons", "number-bonds-to-ten", "assets", "ten-frame-3-7.svg");
        Assert.Equal(File.ReadAllBytes(file), await response.Content.ReadAsByteArrayAsync());
    }

    [Theory]
    [InlineData(Lesson + "/assets/..%2Flesson.json")]
    [InlineData(Lesson + "/assets/lesson.json")]
    [InlineData(Lesson + "/assets/ten-frame-3-7.SVG")]
    [InlineData(Lesson + "/assets/missing.svg")]
    [InlineData("/api/lessons/no-such-lesson/assets/ten-frame-3-7.svg")]
    public async Task Anything_but_a_listed_asset_is_not_found(string path)
    {
        using var client = _factory.CreateClient();
        var response = await client.GetAsync(path);
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.DoesNotContain("\"practice\"", body, StringComparison.Ordinal);
        if (body.Length > 0)
        {
            using var problem = JsonDocument.Parse(body);
            Assert.Equal("unknown-asset", problem.RootElement.GetProperty("code").GetString());
        }
    }

    [Fact]
    public async Task A_traversal_path_never_reaches_a_file_outside_assets()
    {
        using var client = _factory.CreateClient();
        var response = await client.GetAsync($"{Lesson}/assets/../lesson.json");
        var body = await response.Content.ReadAsStringAsync();
        Assert.DoesNotContain("\"practice\"", body, StringComparison.Ordinal);
    }

    // specs/003 contracts/api.md, contract test 1: the instance's lessons and their disclosure flags.

    [Fact]
    public async Task Every_pilot_instance_lists_the_lesson_with_the_recorded_disclosure()
    {
        var fixture = Path.Combine(Directory.GetParent(RepositoryContentRoot())!.FullName, "src", "backend", "MathKX.Domain.Tests", "Fixtures", "disclosure.number-bonds-to-ten.json");
        using var table = JsonDocument.Parse(File.ReadAllText(fixture));
        var disclosing = table.RootElement.GetProperty("disclosing").EnumerateArray()
            .Select(e => (e.GetProperty("definition").GetString()!, e.GetProperty("a").GetInt32(), e.GetProperty("b").GetInt32()))
            .ToHashSet();

        using var client = _factory.CreateClient();
        foreach (var (definition, pool) in new[] { ("numbers.addition.within-10", 45), ("numbers.addition.crossing-ten", 36) })
        {
            var seen = new HashSet<(int, int)>();
            for (var seed = 0; seen.Count < pool && seed < 5000; seed++)
            {
                var body = await client.GetStringAsync($"/api/instances/{definition}/1/{seed}");
                using var document = JsonDocument.Parse(body);
                var root = document.RootElement;
                var (a, b) = (root.GetProperty("a").GetInt32(), root.GetProperty("b").GetInt32());
                seen.Add((a, b));

                var lesson = Assert.Single(root.GetProperty("lessons").EnumerateArray());
                Assert.Equal("number-bonds-to-ten", lesson.GetProperty("id").GetString());
                Assert.Equal(disclosing.Contains((definition, a, b)), lesson.GetProperty("discloses").GetBoolean());
                Assert.DoesNotContain("\"sum\"", body, StringComparison.Ordinal);
                Assert.DoesNotContain("10 + 3", body, StringComparison.Ordinal);
            }

            Assert.Equal(pool, seen.Count);
        }

        using var fixedTask = JsonDocument.Parse(await client.GetStringAsync("/api/instances/numbers.addition.four-plus-four/1/-"));
        Assert.Empty(fixedTask.RootElement.GetProperty("lessons").EnumerateArray());
    }

    private static string RepositoryContentRoot()
    {
        var dir = new DirectoryInfo(AppContext.BaseDirectory);
        while (dir is not null)
        {
            var candidate = Path.Combine(dir.FullName, "content");
            if (Directory.Exists(Path.Combine(candidate, "registry")))
            {
                return candidate;
            }

            dir = dir.Parent;
        }

        throw new InvalidOperationException("content/ not found above the test assembly");
    }
}
