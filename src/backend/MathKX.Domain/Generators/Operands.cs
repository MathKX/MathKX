namespace MathKX.Domain.Generators;

/// <summary>
/// The numbers of one question: <c>A</c> and <c>B</c> for every form, and <c>C</c> only for forms with a third number,
/// such as <c>ax + c = b</c> (specs/011 FR-001). Questions without <c>C</c> are unchanged.
/// </summary>
public readonly record struct Operands(int A, int B, int? C = null);
