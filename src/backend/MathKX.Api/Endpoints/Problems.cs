namespace MathKX.Api.Endpoints;

/// <summary>Problem-details responses with the contract's error codes (specs/002 contracts/api.md).</summary>
public static class Problems
{
    public static IResult NotFound(string code, string detail) => Problem(StatusCodes.Status404NotFound, code, detail);

    public static IResult BadRequest(string code, string detail) => Problem(StatusCodes.Status400BadRequest, code, detail);

    private static IResult Problem(int status, string code, string detail) =>
        Results.Problem(statusCode: status, title: code, detail: detail, extensions: new Dictionary<string, object?> { ["code"] = code });
}
