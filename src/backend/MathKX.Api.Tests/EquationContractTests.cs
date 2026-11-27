using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;

namespace MathKX.Api.Tests;

/// <summary>Practice of x + a = b over the service (specs/009): the form, validation, balance steps, pool, and answer.</summary>
public sealed class EquationContractTests(WebApplicationFactory<Program> factory) : IClassFixture<WebApplicationFactory<Program>>
{
    private const string Definition = "algebra.one-step.within-10";

    [Fact]
    public async Task An_equation_instance_names_its_form_and_never_its_solution()
    {
        using var client = factory.CreateClient();
        using var document = JsonDocument.Parse(await client.GetStringAsync($"/api/instances/{Definition}/1/3"));
        var root = document.RootElement;
        var (a, b) = (root.GetProperty("a").GetInt32(), root.GetProperty("b").GetInt32());
        Assert.Equal("unknown-addend", root.GetProperty("form").GetString());
        Assert.Equal($"x + {a} = {b}", root.GetProperty("prompt").GetString());
        Assert.Equal(["balance"], root.GetProperty("representations").GetProperty("help").EnumerateArray().Select(e => e.GetString()));
        Assert.Equal("equation-answer", root.GetProperty("validator").GetProperty("name").GetString());
        Assert.Equal("one-step-equations", Assert.Single(root.GetProperty("lessons").EnumerateArray()).GetProperty("id").GetString());
        Assert.DoesNotContain(Names(root), name => name is "x" or "sum");

        using var addition = JsonDocument.Parse(await client.GetStringAsync("/api/instances/numbers.addition.within-10/1/3"));
        Assert.Equal("addition", addition.RootElement.GetProperty("form").GetString());
    }

    [Fact]
    public async Task Validation_judges_x_and_only_a_correct_result_carries_it()
    {
        using var client = factory.CreateClient();
        using var instance = JsonDocument.Parse(await client.GetStringAsync($"/api/instances/{Definition}/1/3"));
        var (a, b) = (instance.RootElement.GetProperty("a").GetInt32(), instance.RootElement.GetProperty("b").GetInt32());

        async Task<JsonElement> Submit(int value)
        {
            var response = await client.PostAsJsonAsync("/api/validations", new { identity = new { definitionId = Definition, version = 1, seed = "3" }, artifact = new { kind = "integer", originalText = value.ToString(System.Globalization.CultureInfo.InvariantCulture) } });
            response.EnsureSuccessStatusCode();
            return JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement.Clone();
        }

        var correct = await Submit(b - a);
        Assert.Equal("correct", correct.GetProperty("status").GetString());
        Assert.Equal("eq.correct", correct.GetProperty("code").GetString());
        Assert.Equal(b - a, correct.GetProperty("values").GetProperty("x").GetInt32());
        Assert.Equal("equation-answer", correct.GetProperty("validator").GetProperty("name").GetString());

        var added = await Submit(a + b);
        Assert.Equal("incorrect", added.GetProperty("status").GetString());
        Assert.Equal("eq.added", added.GetProperty("code").GetString());
        Assert.DoesNotContain(Names(added), name => name is "x" or "sum");
    }

    [Fact]
    public async Task The_balance_help_has_three_steps_and_only_the_last_shows_x()
    {
        using var client = factory.CreateClient();
        using var instance = JsonDocument.Parse(await client.GetStringAsync($"/api/instances/{Definition}/1/3"));
        var (a, b) = (instance.RootElement.GetProperty("a").GetInt32(), instance.RootElement.GetProperty("b").GetInt32());
        for (var index = 0; index < 3; index++)
        {
            using var step = JsonDocument.Parse(await client.GetStringAsync($"/api/instances/{Definition}/1/3/steps/help/{index}"));
            var root = step.RootElement;
            Assert.Equal("balance", root.GetProperty("representation").GetString());
            Assert.Equal(3, root.GetProperty("count").GetInt32());
            Assert.Equal(index == 2, root.GetProperty("reveals").GetBoolean());
            Assert.Equal(index == 2, Names(root).Contains("x"));
        }

        using var last = JsonDocument.Parse(await client.GetStringAsync($"/api/instances/{Definition}/1/3/steps/explanation/2"));
        Assert.Equal(b - a, last.RootElement.GetProperty("text").GetProperty("values").GetProperty("x").GetInt32());
    }

    [Theory]
    [InlineData("algebra.one-step.within-10", 45)]
    [InlineData("algebra.one-step.to-15", 30)]
    public async Task The_pools_list_every_equation_with_operands_only(string definition, int size)
    {
        using var client = factory.CreateClient();
        var body = await client.GetStringAsync($"/api/definitions/{definition}/1/pool");
        using var pool = JsonDocument.Parse(body);
        Assert.Equal(size, pool.RootElement.GetProperty("questions").GetArrayLength());
        Assert.DoesNotContain(Names(pool.RootElement), name => name is "x" or "sum");
    }

    [Fact]
    public async Task The_answer_endpoint_gives_x()
    {
        using var client = factory.CreateClient();
        using var answer = JsonDocument.Parse(await client.GetStringAsync($"/api/instances/{Definition}/1/3/answer"));
        var root = answer.RootElement;
        Assert.Equal(root.GetProperty("b").GetInt32() - root.GetProperty("a").GetInt32(), root.GetProperty("answer").GetProperty("value").GetInt32());
    }

    [Theory]
    [InlineData(3, 7, true)] // the worked example solves it
    [InlineData(6, 10, false)] // in "Try it yourself"; x = 4 belongs to the worked example (PR 63 review)
    [InlineData(2, 9, true)] // in "Try it yourself", but the explorer for x + 5 = 12 shows it level on the way (PR 65 review)
    [InlineData(1, 2, false)]
    public async Task The_lesson_flag_a_learner_receives_follows_the_disclosure_rule(int a, int b, bool discloses)
    {
        using var client = factory.CreateClient();
        for (var seed = 0; seed < 5000; seed++)
        {
            using var document = JsonDocument.Parse(await client.GetStringAsync($"/api/instances/{Definition}/1/{seed}"));
            var root = document.RootElement;
            if (root.GetProperty("a").GetInt32() == a && root.GetProperty("b").GetInt32() == b)
            {
                var lesson = Assert.Single(root.GetProperty("lessons").EnumerateArray());
                Assert.Equal("one-step-equations", lesson.GetProperty("id").GetString());
                Assert.Equal(discloses, lesson.GetProperty("discloses").GetBoolean());
                return;
            }
        }

        Assert.Fail($"no seed gives x + {a} = {b}");
    }

    [Fact]
    public async Task The_sharing_explorer_serves_its_states_and_refuses_other_values()
    {
        using var client = factory.CreateClient();
        using var explorer = JsonDocument.Parse(await client.GetStringAsync("/api/visuals/balance-sharing-explorer?a=3&b=12"));
        var states = explorer.RootElement.GetProperty("states").EnumerateArray().ToList();
        Assert.Equal(6, states.Count);
        Assert.Equal((0, 12), (states[0].GetProperty("each").GetInt32(), states[0].GetProperty("loose").GetInt32()));
        var solved = Assert.Single(states, s => s.GetProperty("solved").GetBoolean());
        Assert.True(solved.GetProperty("kept").GetBoolean());
        Assert.Equal(4, solved.GetProperty("each").GetInt32());

        foreach (var query in new[] { "a=3&b=10", "a=1&b=5", "a=5&b=10", "a=2&b=12", "a=x&b=4", "a=3" })
        {
            var refused = await client.GetAsync($"/api/visuals/balance-sharing-explorer?{query}");
            Assert.Equal(System.Net.HttpStatusCode.BadRequest, refused.StatusCode);
        }
    }

    [Fact]
    public async Task A_product_equation_names_its_form_judges_x_and_steps_the_sharing()
    {
        const string times = "algebra.one-step.times";
        using var client = factory.CreateClient();
        using var instance = JsonDocument.Parse(await client.GetStringAsync($"/api/instances/{times}/1/5"));
        var root = instance.RootElement;
        var (a, b) = (root.GetProperty("a").GetInt32(), root.GetProperty("b").GetInt32());
        Assert.Equal("unknown-factor", root.GetProperty("form").GetString());
        Assert.Equal($"{a}x = {b}", root.GetProperty("prompt").GetString());
        Assert.Equal(["balance-sharing"], root.GetProperty("representations").GetProperty("help").EnumerateArray().Select(e => e.GetString()));
        Assert.DoesNotContain(Names(root), name => name is "x" or "sum");

        var response = await client.PostAsJsonAsync("/api/validations", new { identity = new { definitionId = times, version = 1, seed = "5" }, artifact = new { kind = "integer", originalText = (b / a).ToString(System.Globalization.CultureInfo.InvariantCulture) } });
        using var result = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.Equal("fac.correct", result.RootElement.GetProperty("code").GetString());
        Assert.Equal(b / a, result.RootElement.GetProperty("values").GetProperty("x").GetInt32());

        using var last = JsonDocument.Parse(await client.GetStringAsync($"/api/instances/{times}/1/5/steps/help/2"));
        Assert.True(last.RootElement.GetProperty("reveals").GetBoolean());
        Assert.Equal(b / a, last.RootElement.GetProperty("visual").GetProperty("x").GetInt32());

        using var pool = JsonDocument.Parse(await client.GetStringAsync($"/api/definitions/{times}/1/pool"));
        Assert.Equal(15, pool.RootElement.GetProperty("questions").GetArrayLength());
    }

    [Fact]
    public async Task The_two_step_explorer_serves_its_states_and_refuses_other_values()
    {
        using var client = factory.CreateClient();
        using var explorer = JsonDocument.Parse(await client.GetStringAsync("/api/visuals/balance-two-step-explorer?a=2&c=3&b=11"));
        var root = explorer.RootElement;
        Assert.Equal((2, 3, 11), (root.GetProperty("a").GetInt32(), root.GetProperty("c").GetInt32(), root.GetProperty("b").GetInt32()));
        var states = root.GetProperty("states").EnumerateArray().ToList();
        Assert.Equal(9, states.Count);
        Assert.Equal((3, 11), (states[0].GetProperty("left").GetInt32(), states[0].GetProperty("right").GetInt32()));
        Assert.Equal((0, 8, 0), (states[3].GetProperty("left").GetInt32(), states[3].GetProperty("right").GetInt32(), states[3].GetProperty("each").GetInt32()));
        Assert.True(states[^1].GetProperty("solved").GetBoolean());
        Assert.Equal(4, states[^1].GetProperty("each").GetInt32());

        foreach (var query in new[] { "a=2&c=3&b=10", "a=4&c=1&b=9", "a=2&c=7&b=15", "a=2&b=11", "a=2&c=three&b=11" })
        {
            var refused = await client.GetAsync($"/api/visuals/balance-two-step-explorer?{query}");
            Assert.Equal(System.Net.HttpStatusCode.BadRequest, refused.StatusCode);
        }
    }

    [Fact]
    public async Task A_two_step_equation_carries_c_judges_x_steps_both_moves_and_lists_c_in_its_pool()
    {
        const string twoStep = "algebra.two-step.within-20";
        using var client = factory.CreateClient();
        using var instance = JsonDocument.Parse(await client.GetStringAsync($"/api/instances/{twoStep}/1/5"));
        var root = instance.RootElement;
        var (a, b, c) = (root.GetProperty("a").GetInt32(), root.GetProperty("b").GetInt32(), root.GetProperty("c").GetInt32());
        var x = (b - c) / a;
        Assert.Equal("two-step", root.GetProperty("form").GetString());
        Assert.Equal($"{a}x + {c} = {b}", root.GetProperty("prompt").GetString());
        Assert.Equal("algebra.two-step-equations", root.GetProperty("skill").GetString());
        Assert.Equal(["balance-two-step"], root.GetProperty("representations").GetProperty("help").EnumerateArray().Select(e => e.GetString()));
        Assert.Equal("two-step-equations", Assert.Single(root.GetProperty("lessons").EnumerateArray()).GetProperty("id").GetString());
        Assert.DoesNotContain(Names(root), name => name is "x" or "sum");

        var response = await client.PostAsJsonAsync("/api/validations", new { identity = new { definitionId = twoStep, version = 1, seed = "5" }, artifact = new { kind = "integer", originalText = x.ToString(System.Globalization.CultureInfo.InvariantCulture) } });
        using var result = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.Equal("two.correct", result.RootElement.GetProperty("code").GetString());
        Assert.Equal(x, result.RootElement.GetProperty("values").GetProperty("x").GetInt32());

        using var last = JsonDocument.Parse(await client.GetStringAsync($"/api/instances/{twoStep}/1/5/steps/help/3"));
        Assert.True(last.RootElement.GetProperty("reveals").GetBoolean());
        Assert.Equal(x, last.RootElement.GetProperty("visual").GetProperty("x").GetInt32());

        using var pool = JsonDocument.Parse(await client.GetStringAsync($"/api/definitions/{twoStep}/1/pool"));
        var questions = pool.RootElement.GetProperty("questions").EnumerateArray().ToList();
        Assert.Equal(59, questions.Count);
        Assert.All(questions, q => Assert.True(q.TryGetProperty("c", out _)));

        using var answer = JsonDocument.Parse(await client.GetStringAsync($"/api/instances/{twoStep}/1/5/answer"));
        Assert.Equal(c, answer.RootElement.GetProperty("c").GetInt32());
        Assert.Equal(x, answer.RootElement.GetProperty("answer").GetProperty("value").GetInt32());

        // Questions without a third number say nothing about it.
        using var oneStep = JsonDocument.Parse(await client.GetStringAsync($"/api/instances/{Definition}/1/3"));
        Assert.False(oneStep.RootElement.TryGetProperty("c", out _));
        using var onePool = JsonDocument.Parse(await client.GetStringAsync($"/api/definitions/{Definition}/1/pool"));
        Assert.All(onePool.RootElement.GetProperty("questions").EnumerateArray(), q => Assert.False(q.TryGetProperty("c", out _)));
    }

    private static HashSet<string> Names(JsonElement element)
    {
        var names = new HashSet<string>(StringComparer.Ordinal);
        void Walk(JsonElement e)
        {
            if (e.ValueKind == JsonValueKind.Object)
            {
                foreach (var property in e.EnumerateObject())
                {
                    names.Add(property.Name);
                    Walk(property.Value);
                }
            }
            else if (e.ValueKind == JsonValueKind.Array)
            {
                foreach (var item in e.EnumerateArray())
                {
                    Walk(item);
                }
            }
        }

        Walk(element);
        return names;
    }
}
