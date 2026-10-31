// Spec 002's count sentence, shared by "My work" and the session summary (specs/005 contracts/session.md).
import { translate, translateCode, type Lang } from "../i18n";
import type { Outcome, Summary } from "../state/outcomes";

/** Outcomes in the order the count sentence lists them, from the most independent to unfinished. */
const OUTCOME_ORDER: Exclude<Outcome, "none">[] = [
  "correctFirst", "correctAfterFeedback", "correctWithVisualHelp", "correctWithHelp", "correctAfterExplanation",
  "partiallyCorrect", "notAssessed", "notYetCorrect", "skipped", "unfinished",
];

/** "{questions} questions: 3 correct on first response, no help, …". */
export function summarySentence(lang: Lang, summary: Summary): string {
  const details = OUTCOME_ORDER.filter((outcome) => summary.counts[outcome])
    .map((outcome) => `${summary.counts[outcome]} ${translateCode(lang, "outcome", outcome).toLocaleLowerCase(lang)}`)
    .join(", ");
  return translate(lang, summary.questions === 1 ? "record.summaryOne" : "record.summary", { questions: summary.questions, details });
}
