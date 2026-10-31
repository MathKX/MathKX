// Choosing a question the learner did not choose (specs/005 contracts/selection.md): avoid the variation's last
// eight questions, in either order, using the variation's pool. Pure functions; the store calls them from load().
import type { PoolDto } from "../api/types";
import type { Delivery } from "./observations";

/** How many recent deliveries of a variation a new question avoids (addendum §D). */
export const WINDOW = 8;

/** A question's two numbers regardless of order: `3 + 7` and `7 + 3` are the same question to a learner. */
export const pairKey = (a: number, b: number) => (a <= b ? `${a}+${b}` : `${b}+${a}`);

/** The last eight deliveries of one variation, oldest first, by start time and then record order, whatever their outcome. */
export function recentWindow(deliveries: Delivery[], definitionId: string, version: number): Delivery[] {
  return deliveries
    .map((d, index) => ({ d, index }))
    .filter(({ d }) => d.instance.definitionId === definitionId && d.instance.version === version)
    .sort((x, y) => (x.d.startedAt < y.d.startedAt ? -1 : x.d.startedAt > y.d.startedAt ? 1 : x.index - y.index))
    .slice(-WINDOW)
    .map(({ d }) => d);
}

export type Choice =
  | { kind: "fresh" }
  | { kind: "chosen"; seed: string | null; a: number; b: number }
  | { kind: "exhausted" };

/**
 * Keeps the first draw when it is not recent; otherwise picks, at `seed mod n`, one of the `n` pool questions outside
 * the window (in pool order); when there are none, the pool is exhausted for now and the first draw repeats.
 */
export function choose(firstDraw: { seed: string | null; a: number; b: number }, window: Set<string>, pool: PoolDto["questions"]): Choice {
  if (!window.has(pairKey(firstDraw.a, firstDraw.b))) return { kind: "fresh" };
  const outside = pool.filter((q) => !window.has(pairKey(q.a, q.b)));
  if (outside.length === 0) return { kind: "exhausted" };
  const index = Number(BigInt(firstDraw.seed ?? "0") % BigInt(outside.length));
  const chosen = outside[index]!;
  return { kind: "chosen", seed: chosen.seed, a: chosen.a, b: chosen.b };
}
