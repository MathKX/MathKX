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
