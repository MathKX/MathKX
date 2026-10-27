// specs/005 contracts/selection.md store tests 1–7: questions the learner did not choose avoid the variation's
// last eight (in either order), with at most two instance requests; an exhausted pool repeats honestly.
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { App } from "../src/App";
import type { Delivery } from "../src/state/observations";
import { pairKey } from "../src/state/selection";
import { createFakeApi } from "./fakeApi";
import { CROSSING, WITHIN_TEN, beforeThisFeature, recentWindow } from "./records";

const practicePath = "/practice/numbers.addition-within-20";
const stored = () => JSON.parse(window.localStorage.getItem("mathkx.guest.v1") ?? "{}").value;
const deliveries = (): Delivery[] => stored()?.deliveries ?? [];
const instanceCalls = (api: ReturnType<typeof createFakeApi>) => api.calls.filter((c) => c.startsWith("getInstance")).length;

afterEach(() => window.localStorage.clear());

async function practise(api: ReturnType<typeof createFakeApi>, clear = true) {
  if (clear) window.localStorage.clear();
  const view = render(<App api={api} initialPath={practicePath} />);
  await screen.findByTestId("prompt");
  await waitFor(() => expect(deliveries().length).toBeGreaterThan(0));
  return view;
}

/** Asks for "Another question" `n` times, waiting for each new question to be recorded. */
async function another(n: number) {
  for (let i = 0; i < n; i++) {
    const before = deliveries().length;
    fireEvent.click(screen.getByTestId("another"));
    await waitFor(() => expect(deliveries().length).toBe(before + 1));
  }
}

/** For each delivery of the variation, the unordered pairs of the eight before it. */
function windows(definitionId: string): { delivery: Delivery; window: Set<string> }[] {
  const own = deliveries().filter((d) => d.instance.definitionId === definitionId);
  return own.map((delivery, i) => ({ delivery, window: new Set(own.slice(Math.max(0, i - 8), i).map((d) => pairKey(d.instance.a, d.instance.b))) }));
}

describe("avoiding recent questions (tests 1, 3, 4)", () => {
  it.each([
    ["within ten", WITHIN_TEN, false],
    ["across ten", CROSSING, true],
  ])("100 requests %s never give a question from the previous eight, with at most two instance requests each", async (_name, definitionId, harder) => {
    const api = createFakeApi({ pool: true });
    await practise(api);
    if (harder) {
      fireEvent.click(screen.getByTestId("harder"));
      await another(1);
    }
    const startCalls = instanceCalls(api);
    await another(100);

    const checked = windows(definitionId).slice(1);
    expect(checked.length).toBeGreaterThanOrEqual(100);
    for (const { delivery, window } of checked) {
      expect(window.has(pairKey(delivery.instance.a, delivery.instance.b)), `${delivery.instance.a} + ${delivery.instance.b}`).toBe(false);
      expect(delivery.repeatReason).toBeUndefined();
    }
    expect(instanceCalls(api) - startCalls).toBeLessThanOrEqual(200);
    expect(api.calls.filter((c) => c === `getPool ${definitionId}@1`)).toHaveLength(1);
  }, 120_000);

  it("never records the question it passed over", async () => {
    const api = createFakeApi({ pool: true, sequence: [[1, 1], [1, 1]] });
    await practise(api);
    await another(1);
    const pairs = deliveries().map((d) => [d.instance.a, d.instance.b]);
    expect(pairs).toHaveLength(2);
    expect(pairs[0]).toEqual([1, 1]);
    expect(pairs[1]).not.toEqual([1, 1]);
    expect(instanceCalls(api)).toBe(3); // the first question, then the passed-over draw and the chosen one
  });
});

describe("an exhausted pool (test 2)", () => {
  it("repeats with the notice exactly while every question is recent, and delivers a question again once it has left the window", async () => {
    const api = createFakeApi({ pool: true, poolSize: 5 });
    await practise(api);
    let noticed = false;
    for (let i = 0; i < 20; i++) {
      await another(1);
      const last = deliveries().at(-1)!;
      if (last.repeatReason === "exhausted") {
        noticed ||= screen.queryByTestId("notice")?.textContent === "Denne varianten har ingen andre oppgaver akkurat nå, så denne kommer igjen.";
      }
    }

    let exhausted = 0;
    let freshAfterExhaustion = 0;
    for (const { delivery, window } of windows(WITHIN_TEN).slice(1)) {
      if (window.size === 5) {
        exhausted++;
        expect(delivery.repeatReason).toBe("exhausted");
        const earlier = deliveries().find((d) => d.id === delivery.repeatOf);
        expect(earlier && pairKey(earlier.instance.a, earlier.instance.b)).toBe(pairKey(delivery.instance.a, delivery.instance.b));
      } else {
        if (exhausted > 0) freshAfterExhaustion++;
        expect(delivery.repeatReason).toBeUndefined();
        expect(window.has(pairKey(delivery.instance.a, delivery.instance.b))).toBe(false);
      }
    }
    expect(exhausted).toBeGreaterThan(0);
    expect(freshAfterExhaustion).toBeGreaterThan(0);
    expect(noticed).toBe(true);
  }, 60_000);

  it("leaves the exhausted state as the review's example shows: after A, B, C, D, E, E, E, E, E comes A", async () => {
    const pool = [[1, 1], [1, 2], [1, 3], [1, 4], [1, 5]] as [number, number][];
    const history = recentWindow(WITHIN_TEN, [...pool, [1, 5], [1, 5], [1, 5], [1, 5]]);
    window.localStorage.setItem("mathkx.guest.v1", JSON.stringify({ schema: 1, value: { ...beforeThisFeature(), deliveries: history } }));
    const api = createFakeApi({ pool: true, poolSize: 5, sequence: [[1, 5]] });
    await practise(api, false);
    const last = deliveries().at(-1)!;
    expect([last.instance.a, last.instance.b]).toEqual([1, 1]);
    expect(last.repeatReason).toBeUndefined();
    expect(screen.queryByTestId("notice")).toBeNull();
  });
});

describe("fallbacks and continuity (tests 5–7)", () => {
  it("delivers the first draw when the pool cannot be loaded", async () => {
    const api = createFakeApi({ pool: true, poolFails: true, sequence: [[1, 1], [1, 1]] });
    await practise(api);
    await another(1);
    expect(deliveries().map((d) => [d.instance.a, d.instance.b])).toEqual([[1, 1], [1, 1]]);
    expect(deliveries()[1]!.repeatReason).toBeUndefined();
    expect(screen.queryByTestId("notice")).toBeNull();
  });

  it("keeps avoiding the recent questions after a reload", async () => {
    const first = await practise(createFakeApi({ pool: true, sequence: [[2, 3]] }));
    const user = userEvent.setup();
    await user.type(screen.getByTestId("answer"), "5");
    await user.click(screen.getByTestId("check"));
    await screen.findByTestId("result");
    first.unmount();

    const api = createFakeApi({ pool: true, sequence: [[3, 2]] });
    await practise(api, false);
    await another(1);
    const last = deliveries().at(-1)!;
    expect(pairKey(last.instance.a, last.instance.b)).not.toBe(pairKey(2, 3));
  });

  it("avoids the target variation's own recent questions after a ladder change", async () => {
    const history = recentWindow(CROSSING, [[8, 5]]);
    window.localStorage.setItem("mathkx.guest.v1", JSON.stringify({ schema: 1, value: { ...beforeThisFeature(), deliveries: history } }));
    const api = createFakeApi({ pool: true, sequence: [[4, 4], [5, 8]] });
    await practise(api, false);
    fireEvent.click(screen.getByTestId("harder"));
    await another(1);
    const last = deliveries().at(-1)!;
    expect(last.instance.definitionId).toBe(CROSSING);
    expect(pairKey(last.instance.a, last.instance.b)).not.toBe(pairKey(8, 5));
  });
});
