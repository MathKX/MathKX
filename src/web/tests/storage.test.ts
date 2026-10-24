import { afterEach, describe, expect, it, vi } from "vitest";
import { STORAGE_KEY, createStorage } from "../src/state/storage";

describe("storage", () => {
  afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("round-trips a value under the versioned key", () => {
    const storage = createStorage<{ n: number }>();
    expect(storage.save({ n: 1 })).toBe(true);
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}")).toEqual({ schema: 1, value: { n: 1 } });
    expect(storage.load()).toEqual({ value: { n: 1 }, kept: true, discarded: false });
  });

  it("falls back to memory and reports kept: false when localStorage throws", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    const storage = createStorage<{ n: number }>();
    expect(storage.save({ n: 2 })).toBe(false);
    expect(storage.load()).toEqual({ value: { n: 2 }, kept: false, discarded: false });
  });

  it("discards an unknown schema version with a flag", () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ schema: 99, value: { n: 3 } }));
    const storage = createStorage<{ n: number }>();
    expect(storage.load()).toEqual({ value: null, kept: true, discarded: true });
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
