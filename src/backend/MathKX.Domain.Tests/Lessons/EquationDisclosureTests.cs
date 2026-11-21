using MathKX.Content;
using MathKX.Domain.Content;
using MathKX.Domain.Instances;
using MathKX.Domain.Lessons;
using MathKX.Domain.Tests.Content;
using MathKX.Domain.Validators;

namespace MathKX.Domain.Tests.Lessons;

/// <summary>Does "Equations and the balance" show an equation's answer? (specs/009 FR-006)</summary>
public sealed class EquationDisclosureTests
{
    private static readonly ContentCatalog Catalog = ContentLoader.Load(RepositoryContent.Root);

    private static IEnumerable<LessonFacts> Translations => Catalog.Translations.Where(t => t.Key.LessonId == "one-step-equations").Select(t => t.Value.Facts);

    private static Instance Question(int a, int b, string form) => new(
        new InstanceIdentity("algebra.one-step.within-10", 1, null), "algebra.one-step-equations", a, b, new RepresentationRoles([], []), null,
        new NamedVersion(form == QuestionForms.UnknownAddend ? "equation-answer" : "integer-answer", 1), form);

    [Fact]
    public void The_worked_example_discloses_by_expression()
    {
        // The lesson writes x + 3 = 7 and x = 4, and also has a balance explorer for 3 and 7: the expression wins.
        Assert.Equal(new DisclosureDecision(true, DisclosureSource.Expression), LessonDisclosure.For(Translations, Question(3, 7, QuestionForms.UnknownAddend)));
    }

    [Fact]
    public void The_second_explorer_discloses_by_visual()
    {
        Assert.Equal(new DisclosureDecision(true, DisclosureSource.Visual), LessonDisclosure.For(Translations, Question(5, 12, QuestionForms.UnknownAddend)));
    }

    [Theory]
    [InlineData(2, 9)] // in "Try it yourself" without its answer
    [InlineData(4, 13)]
    [InlineData(1, 2)]
    public void Equations_the_lesson_does_not_solve_are_not_disclosed(int a, int b)
    {
        Assert.False(LessonDisclosure.For(Translations, Question(a, b, QuestionForms.UnknownAddend)).Discloses);
    }

    [Fact]
    public void Over_reports_when_another_equation_has_the_same_solution()
    {
        // x + 6 = 10 is in "Try it yourself"; x = 4 belongs to the worked example. The rule errs towards a notice.
        Assert.True(LessonDisclosure.For(Translations, Question(6, 10, QuestionForms.UnknownAddend)).Discloses);
    }

    [Fact]
    public void A_balance_explorer_never_discloses_an_addition()
    {
        Assert.False(LessonDisclosure.For(Translations, Question(3, 7, QuestionForms.Addition)).Discloses);
    }
}
