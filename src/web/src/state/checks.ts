// Self-check runs (specs/006 data-model.md): a run of one authored check, kept in the guest record apart from
// practice. A run's deliveries are its reached questions in order; index i is position i + 1.
import type { ValidationResponse } from "../api/types";
import type { Delivery } from "./observations";

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
