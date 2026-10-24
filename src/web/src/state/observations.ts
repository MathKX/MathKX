// Guest observations (specs/002 contracts/observations.md): one delivery per resolved instance, ordered events.
import type { Identity, ValidationStatus } from "../api/types";

export type SupportKind =
  | "visual-help-opened"
  | "help-step"
  | "counting"
  | "counting-complete"
  | "explanation-open"
  | "explanation-step"
  | "lesson-opened"
  | "lesson-reveal"
  | "answer-reveal";

export type ChallengeRequest = "easier" | "harder" | "another" | "same";
export type ChallengeOutcome = "requested" | "applied" | "cleared" | "unavailable";

export type Event =
  | { type: "submission"; submissionId: string; originalText: string; value: number; status: Exclude<ValidationStatus, "invalid-response">; code: string }
  | { type: "input-guidance"; submissionId: string; originalText: string; code: string }
  | { type: "support"; kind: SupportKind; step?: number; reveals?: boolean }
  | { type: "challenge-request"; request: ChallengeRequest; outcome: ChallengeOutcome }
  | { type: "skipped" }
  | { type: "ended" };

export interface DeliveryInstance {
  definitionId: string;
  version: number;
  seed?: string;
  generatorVersion?: number;
  validatorName: string;
  validatorVersion: number;
  a: number;
  b: number;
}

export interface Delivery {
  id: string;
  instance: DeliveryInstance;
  purpose: "practice";
  provenance: "guest";
  startedAt: string;
  events: Event[];
}

export const identityOf = (d: Delivery): Identity => {
  const identity: Identity = { definitionId: d.instance.definitionId, version: d.instance.version };
  if (d.instance.seed !== undefined) identity.seed = d.instance.seed;
  return identity;
};

export function newId(): string {
  return typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/** Appends an event; a submission or input-guidance event whose submissionId already exists is dropped. */
export function recordEvent(delivery: Delivery, event: Event): Delivery {
  if (event.type === "submission" || event.type === "input-guidance") {
    const duplicate = delivery.events.some((e) => (e.type === "submission" || e.type === "input-guidance") && e.submissionId === event.submissionId);
    if (duplicate) return delivery;
  }
  return { ...delivery, events: [...delivery.events, event] };
}

export const hasSubmission = (d: Delivery) => d.events.some((e) => e.type === "submission");

export const hasCorrect = (d: Delivery) => d.events.some((e) => e.type === "submission" && e.status === "correct");

/**
 * The question a lesson visit can be a detour from (specs/003 contracts/detour.md "Terms"): the current delivery
 * while it has no correct submission and was not skipped. Wider than `resumable`, which needs no submission at all.
 */
export function currentQuestion(deliveries: readonly Delivery[], currentDeliveryId: string | null): Delivery | null {
  const d = currentDeliveryId ? deliveries.find((x) => x.id === currentDeliveryId) : undefined;
  if (!d || hasCorrect(d) || d.events.some((e) => e.type === "skipped")) return null;
  return d;
}
