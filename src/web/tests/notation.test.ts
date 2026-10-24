// The renderer's notation grammar agrees with the content validator's (specs/003 research R2): same tree and
// normalized string for every expression of the pilot lesson and every example of the notation contract.
import { describe, expect, it } from "vitest";
import { normalize, parseNotation } from "../src/lesson/notation";
import * as validator from "../../../tools/lib/notation.mjs";
import { parseLessonMarkdown } from "../../../tools/lib/markdown.mjs";
import { lessonMarkdown } from "./fakeApi";

const CONTRACT_EXAMPLES = [
  "3", "2,5", "0.5", "x", "Δ", "f(x)", "a + b − c - d = e", "3 × 4 · 5 * 6", "a < b > c ≤ d ≥ e ≠ f", "? + □ = 7",
  "(1 + 2) [3]", "f(x, y)", "x → y", "x^2", "x^{n-1}", "x²", "x³", "a_1", "\\frac{a}{b}", "a/b", "f'(x)", "f′(x)",
  "\\Delta x", "a \\cdot b", "a \\le b", "a \\ge b", "a \\neq b", "x \\to 0", "\\lim f(x)",
];

const lessonExpressions = ["nb", "en"].flatMap((lang) => parseLessonMarkdown(lessonMarkdown(lang)).math.map((m) => m.value));

describe("notation agreement with tools/lib/notation.mjs", () => {
  it("covers the pilot lesson", () => {
    expect(lessonExpressions.length).toBeGreaterThan(20);
  });

  it.each([...new Set([...lessonExpressions, ...CONTRACT_EXAMPLES])])("%s", (source) => {
    const ours = parseNotation(source);
    const theirs = validator.parseNotation(source);
    expect(ours.ok).toBe(true);
    expect(ours).toEqual(theirs);
    expect(normalize(source)).toEqual(validator.normalize(source));
  });

  it.each(["\\sqrt{2}", "x & y", "\\frac{1}", "1 /"])("rejects %s as the validator does", (source) => {
    const ours = parseNotation(source);
    expect(ours.ok).toBe(false);
    expect(ours).toEqual(validator.parseNotation(source));
  });
});
