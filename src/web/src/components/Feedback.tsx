// Renders a validation result: the status wording and the feedback text for the code. The rendering is
// exhaustive over the five statuses; there is no default branch.
import { Alert, Paragraph } from "@digdir/designsystemet-react";
import type { ValidationResponse, ValidationStatus } from "../api/types";
import { translate, translateCode, type Lang } from "../i18n";

const colour: Record<ValidationStatus, "success" | "warning" | "info" | "neutral"> = {
  correct: "success",
  incorrect: "warning",
  "invalid-response": "info",
  "partially-correct": "info",
  "review-needed": "neutral",
};

export function statusHeading(lang: Lang, status: ValidationStatus): string {
  switch (status) {
    case "correct":
      return translate(lang, "status.correct");
    case "incorrect":
      return translate(lang, "status.incorrect");
    case "invalid-response":
      return translate(lang, "status.invalid-response");
    case "partially-correct":
      return translate(lang, "status.partially-correct");
    case "review-needed":
      return translate(lang, "status.review-needed");
  }
}

export function Feedback({ result, lang }: { result: ValidationResponse; lang: Lang }) {
  const text = result.status === "partially-correct" || result.status === "review-needed" ? null : translateCode(lang, "feedback", result.code, result.values);
  return (
    <Alert data-color={colour[result.status]} role="status" aria-label={translate(lang, "a11y.result")} data-testid="result" data-status={result.status}>
      <Paragraph data-size="md">
        <strong>{statusHeading(lang, result.status)}</strong>
        {text ? ` ${text}` : null}
      </Paragraph>
      {result.status === "incorrect" ? <Paragraph data-size="sm">{translate(lang, "practice.changeAnswer")}</Paragraph> : null}
    </Alert>
  );
}
