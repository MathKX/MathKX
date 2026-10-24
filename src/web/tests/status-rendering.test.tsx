import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Feedback, statusHeading } from "../src/components/Feedback";
import type { ValidationResponse, ValidationStatus } from "../src/api/types";
import codes from "../src/i18n/codes.json";

const ALL: ValidationStatus[] = codes.status as ValidationStatus[];

describe("status rendering", () => {
  it("is exhaustive over the five statuses, including the reserved ones", () => {
    for (const status of ALL) {
      const result: ValidationResponse = { status, code: status === "correct" ? "correct" : status === "incorrect" ? "add.generic" : "invalid.empty", values: { a: 1, b: 2, sum: 3, v: 3, text: "" }, validator: { name: "integer-answer", version: 1 } };
      const { unmount } = render(<Feedback result={result} lang="en" />);
      expect(screen.getByTestId("result").getAttribute("data-status")).toBe(status);
      expect(statusHeading("en", status)).not.toBe("");
      unmount();
    }
  });

  it("renders the reserved statuses with the addendum wording and never as a score", () => {
    const reviewNeeded: ValidationResponse = { status: "review-needed", code: "none", values: {}, validator: { name: "integer-answer", version: 1 } };
    render(<Feedback result={reviewNeeded} lang="en" />);
    expect(screen.getByTestId("result").textContent).toContain("MathKX cannot check this answer automatically");
    expect(screen.getByTestId("result").textContent).not.toMatch(/%|score/i);
  });
});
