using MathKX.Domain.Content;
using MathKX.Domain.Instances;
using MathKX.Domain.Results;

namespace MathKX.Domain.Validators;

/// <summary>The question forms practice knows (specs/009 FR-003). A validator decides its instance's form.</summary>
public static class QuestionForms
{
    /// <summary><c>a + b = ?</c>: the answer is the sum.</summary>
    public const string Addition = "addition";

    /// <summary><c>x + a = b</c>: the answer is the unknown addend, <c>b − a</c>.</summary>
    public const string UnknownAddend = "unknown-addend";

    /// <summary><c>ax = b</c>: the answer is the unknown factor, <c>b / a</c> (specs/010).</summary>
    public const string UnknownFactor = "unknown-factor";

    /// <summary><c>ax + c = b</c>: the answer is <c>(b − c) / a</c>, the one form with a third number (specs/011).</summary>
    public const string TwoStep = "two-step";
}

/// <summary>A registered, versioned answer validator. The implementation must match its registry entry.</summary>
public interface IAnswerValidator
{
    NamedVersion Identity { get; }

    /// <summary>The question form this validator judges; the learner app draws the prompt by it.</summary>
    string Form { get; }

    /// <summary>The answer this validator accepts for the instance; served only to the check summary (specs/006 research R5).</summary>
    int ExpectedAnswer(Instance instance);

    ValidationResult Validate(Instance instance, ResponseArtifact artifact);
}

/// <summary>Validators by <c>name@version</c>; definitions pin the one they use.</summary>
public sealed class ValidatorRegistry
{
    private readonly Dictionary<string, IAnswerValidator> _validators = new(StringComparer.Ordinal);

    public static ValidatorRegistry Default()
    {
        var registry = new ValidatorRegistry();
        registry.Register(new IntegerAnswerValidator());
        registry.Register(new EquationAnswerValidator());
        registry.Register(new FactorAnswerValidator());
        registry.Register(new TwoStepAnswerValidator());
        return registry;
    }

    public void Register(IAnswerValidator validator)
    {
        _validators[validator.Identity.Key] = validator;
    }

    public bool TryGet(NamedVersion identity, out IAnswerValidator validator) => _validators.TryGetValue(identity.Key, out validator!);

    /// <summary>The validator a definition pins; throws when content names one that is not implemented.</summary>
    public IAnswerValidator Get(NamedVersion identity) =>
        TryGet(identity, out var validator) ? validator : throw new UnknownValidatorException(identity.Key);

    public IReadOnlyCollection<string> Keys => _validators.Keys;
}

public sealed class UnknownValidatorException(string key) : Exception($"Validator {key} is registered in content but not implemented.")
{
    public string Key { get; } = key;
}
