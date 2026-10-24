// Outcome derivation per specs/002 contracts/observations.md and DL-029. A pure function of a delivery's events.
import type { Delivery, Event } from "./observations";

export type Outcome =
  | "correctFirst"
  | "correctAfterFeedback"
  | "correctWithVisualHelp"
  | "correctWithHelp"
  | "correctAfterExplanation"
  | "partiallyCorrect"
  | "notAssessed"
  | "notYetCorrect"
  | "skipped"
  | "unfinished"
  | "none";

export type Tag =
  | "feedbackBefore"
  | "visualBefore"
  | "lessonBefore"
  | "explainPartBefore"
  | "revealExplanation"
  | "revealCounting"
  | "revealHelp"
  | "revealLesson"
  | "visualAfter"
  | "explainAfter";

const TAG_ORDER: Tag[] = [
  "feedbackBefore", "visualBefore", "lessonBefore", "explainPartBefore",
  "revealExplanation", "revealCounting", "revealHelp", "revealLesson", "visualAfter", "explainAfter",
];

type RevealSource = "explanation" | "counting" | "help" | "lesson";

function revealSource(e: Event): RevealSource | null {
  if (e.type !== "support") return null;
  if (e.kind === "counting-complete") return "counting";
  if (e.kind === "help-step" && e.reveals) return "help";
  if (e.kind === "explanation-step" && e.reveals) return "explanation";
  if (e.kind === "answer-reveal") return "explanation";
  if (e.kind === "lesson-reveal") return "lesson";
  return null;
}

const isVisual = (e: Event) => e.type === "support" && (e.kind === "visual-help-opened" || e.kind === "counting" || (e.kind === "help-step" && !e.reveals));
const isOtherHelp = (e: Event) => e.type === "support" && (e.kind === "explanation-open" || (e.kind === "explanation-step" && !e.reveals) || e.kind === "lesson-opened");
const isExplanation = (e: Event) => e.type === "support" && (e.kind === "explanation-open" || e.kind === "explanation-step" || e.kind === "answer-reveal");

export interface Derived {
  outcome: Outcome;
  tags: Tag[];
  /** Mathematical submissions in order, for the record view. */
  submissions: { value: number; status: string; code: string }[];
}

export function derive(delivery: Delivery, options: { resumable?: boolean } = {}): Derived {
  const tags = new Set<Tag>();
  const reveals = new Set<RevealSource>();
  let correctSeen = false;
  let incorrectBefore = 0;
  let visualBefore = false;
  let otherBefore = false;
  let lessonBefore = false;
  let explainPartBefore = false;
  let skipped = false;
  let ended = false;
  const statuses: string[] = [];
  const submissions: Derived["submissions"] = [];
  let outcome: Outcome | null = null;

  for (const e of delivery.events) {
    if (e.type === "support") {
      const source = revealSource(e);
      if (!correctSeen) {
        if (source) reveals.add(source);
        else if (isVisual(e)) visualBefore = true;
        else if (isOtherHelp(e)) {
          otherBefore = true;
          if (e.kind === "lesson-opened") lessonBefore = true;
          else explainPartBefore = true;
        }
      } else if (isExplanation(e)) tags.add("explainAfter");
      else if (isVisual(e) || source === "counting" || source === "help") tags.add("visualAfter");
      continue;
    }
    if (e.type === "skipped") skipped = true;
    if (e.type === "ended") ended = true;
    if (e.type !== "submission") continue; // input guidance never influences the outcome
    submissions.push({ value: e.value, status: e.status, code: e.code });
    statuses.push(e.status);
    if (e.status === "correct" && !correctSeen) {
      correctSeen = true;
      if (reveals.size > 0) outcome = "correctAfterExplanation";
      else if (otherBefore) outcome = "correctWithHelp";
      else if (visualBefore) outcome = "correctWithVisualHelp";
      else if (incorrectBefore > 0) outcome = "correctAfterFeedback";
      else outcome = "correctFirst";
      if (incorrectBefore > 0 && outcome !== "correctAfterFeedback") tags.add("feedbackBefore");
      if (visualBefore) tags.add("visualBefore");
      if (lessonBefore) tags.add("lessonBefore");
      if (explainPartBefore && !reveals.has("explanation")) tags.add("explainPartBefore");
      for (const source of reveals) {
        tags.add(source === "explanation" ? "revealExplanation" : source === "counting" ? "revealCounting" : source === "help" ? "revealHelp" : "revealLesson");
      }
    } else if (e.status === "incorrect" && !correctSeen) incorrectBefore++;
  }

  if (!outcome) {
    if (statuses.includes("review-needed")) outcome = "notAssessed";
    else if (statuses.includes("partially-correct")) outcome = "partiallyCorrect";
    else if (statuses.includes("incorrect")) outcome = "notYetCorrect";
    else if (skipped) outcome = "skipped";
    else if (ended || options.resumable) outcome = "unfinished";
    else outcome = "none";
  }

  return { outcome, tags: TAG_ORDER.filter((t) => tags.has(t)), submissions };
}

export interface Summary {
  questions: number;
  counts: Partial<Record<Exclude<Outcome, "none">, number>>;
}

export function summarize(deliveries: Delivery[], resumableId: string | null): Summary {
  const counts: Summary["counts"] = {};
  let questions = 0;
  for (const d of deliveries) {
    const { outcome } = derive(d, { resumable: d.id === resumableId });
    if (outcome === "none") continue;
    questions++;
    counts[outcome] = (counts[outcome] ?? 0) + 1;
  }
  return { questions, counts };
}
