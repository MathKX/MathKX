// Self-check runs (specs/006 data-model.md): a run of one authored check, kept in the guest record apart from
// practice. A run's deliveries are its reached questions in order; index i is position i + 1.
import type { ValidationResponse } from "../api/types";
import { hasSubmission, type Delivery } from "./observations";

/** One question of the check as it was when the run started: an identity, never operands. */
export interface CheckQuestionRef {
  definitionId: string;
  version: number;
  seed?: string;
}

/** The current question's screen state, kept on the run so a reload or "Continue the check" restores it. */
export interface CheckResume {
  draft: string;
  helpOpen: boolean;
  helpStep: number;
  explanationOpen: boolean;
  explanationStep: number;
  /** Only in the supported part; an independent save's result is never kept for the screen. */
  result: ValidationResponse | null;
}

export interface CheckRun {
  id: string;
  checkId: string;
  checkVersion: number;
  skillId: string;
  /** A copy of the check's questions at start, so a later content change cannot alter a run. */
  questions: CheckQuestionRef[];
  deliveries: Delivery[];
  /** 1-based: the question on screen. Advanced only by the learner's actions. */
  position: number;
  /** 1-based position of the one-way switch to supported practice, or null. */
  switchAt: number | null;
  startedAt: string;
  finishedAt?: string;
  /** Set when a new check of the same skill was started while this one was unfinished. */
  endedAt?: string;
  resume: CheckResume | null;
}

export type CheckPart = "independent" | "supported";

/** data-model "Answered": a submission or `skipped`, in either part. Whether the learner moved on never matters. */
export const isAnswered = (d: Delivery | undefined): boolean => d !== undefined && (hasSubmission(d) || d.events.some((e) => e.type === "skipped"));

/** A run is unfinished while it has neither `finishedAt` nor `endedAt`. */
export const isUnfinished = (run: CheckRun): boolean => run.finishedAt === undefined && run.endedAt === undefined;

/** A position (1-based) is independent before `switchAt`, or always when there was no switch. */
export const partOf = (run: CheckRun, position: number): CheckPart => (run.switchAt !== null && position >= run.switchAt ? "supported" : "independent");

/** The positions (1-based) in each part of the summary (specs/006 contracts/summary.md "The grouping"). */
export interface RunSummary {
  /** "Correct on your own": independent, and the only submission is `correct`. */
  correct: number[];
  /** "Worth revisiting" (DL-036): independent, and the only submission is anything else. */
  revisit: number[];
  /** "Skipped": independent, and the learner chose "Skip". */
  skipped: number[];
  /** From `switchAt` onward, answered. */
  supported: number[];
  /** A run that is over, without an answered question there; only an ended run has any. */
  notAnswered: number[];
}

/**
 * Groups a run's positions. Reads only the run, and of it only each delivery's events, the list's length, `switchAt`,
 * and whether the run is over: never `position`, and never whether a later question was reached.
 */
export function summarizeRun(run: CheckRun): RunSummary {
  const summary: RunSummary = { correct: [], revisit: [], skipped: [], supported: [], notAnswered: [] };
  const over = !isUnfinished(run);
  run.questions.forEach((_, i) => {
    const position = i + 1;
    const d = run.deliveries[i];
    if (!d || !isAnswered(d)) {
      if (over) summary.notAnswered.push(position);
      return;
    }
    if (partOf(run, position) === "supported") {
      summary.supported.push(position);
      return;
    }
    const submission = d.events.find((e) => e.type === "submission");
    if (submission) summary[submission.status === "correct" ? "correct" : "revisit"].push(position);
    else summary.skipped.push(position);
  });
  return summary;
}

/** The question on screen in a run's supported part, while the run is unfinished; null otherwise. */
export function supportedQuestionOf(run: CheckRun): Delivery | null {
  if (!isUnfinished(run) || partOf(run, run.position) !== "supported") return null;
  return run.deliveries[run.position - 1] ?? null;
}

/**
 * The supported check question a lesson visit `?from=check` is about (research R10): the run the check view last
 * presented, or else the most recently started run with a supported question on screen; null when there is none.
 */
export function checkDetourOf(runs: readonly CheckRun[], lastRunId: string | null): { run: CheckRun; delivery: Delivery } | null {
  const last = runs.find((r) => r.id === lastRunId);
  const candidates = last ? [last] : [...runs].sort((x, y) => y.startedAt.localeCompare(x.startedAt));
  for (const run of candidates) {
    const delivery = supportedQuestionOf(run);
    if (delivery) return { run, delivery };
  }
  return null;
}
