import { describe, expect, it } from "vitest";
import { translate, translateCode } from "../src/i18n";

describe("translate", () => {
  it("substitutes placeholders", () => {
    expect(translate("en", "feedback.correct", { a: 4, b: 4, sum: 8 })).toBe("Correct. 4 + 4 = 8.");
    expect(translate("nb", "practice.question", { a: 3, b: 5 })).toBe("Hva er 3 + 5?");
  });

  it("leaves unknown placeholders visible rather than dropping them", () => {
    expect(translate("en", "feedback.correct", { a: 1 })).toContain("{sum}");
  });

  it("throws on a missing key in development and tests", () => {
    expect(() => translate("en", "practice.doesNotExist")).toThrow(/Missing dictionary key/);
  });

  it("resolves codes through a namespace", () => {
    expect(translateCode("en", "outcome", "correctWithVisualHelp")).toBe("Correct with visual help");
    expect(translateCode("nb", "explain", "explain.makeTen.need", { a: 8, need: 2 })).toBe("8 trenger 2 for å bli 10.");
  });
});
