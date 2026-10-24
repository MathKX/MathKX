// Versioned browser storage with an in-memory fallback. `kept` tells the UI whether the record survives a reload.

export const STORAGE_KEY = "mathkx.guest.v1";
export const SCHEMA_VERSION = 1;

export interface Stored<T> {
  schema: number;
  value: T;
}

export interface Storage<T> {
  load(): { value: T | null; kept: boolean; discarded: boolean };
  save(value: T): boolean;
  clear(): void;
}

export function createStorage<T>(key = STORAGE_KEY, schema = SCHEMA_VERSION): Storage<T> {
  let memory: T | null = null;
  const area = (): globalThis.Storage | null => {
    try {
      return typeof window !== "undefined" ? window.localStorage : null;
    } catch {
      return null;
    }
  };
  return {
    load() {
      const store = area();
      if (!store) return { value: memory, kept: false, discarded: false };
      try {
        const raw = store.getItem(key);
        if (!raw) return { value: null, kept: true, discarded: false };
        const parsed = JSON.parse(raw) as Partial<Stored<T>>;
        if (parsed.schema !== schema || parsed.value === undefined) {
          store.removeItem(key);
          return { value: null, kept: true, discarded: true };
        }
        return { value: parsed.value, kept: true, discarded: false };
      } catch {
        return { value: memory, kept: false, discarded: false };
      }
    },
    save(value) {
      memory = value;
      const store = area();
      if (!store) return false;
      try {
        store.setItem(key, JSON.stringify({ schema, value } satisfies Stored<T>));
        return true;
      } catch {
        return false;
      }
    },
    clear() {
      memory = null;
      try {
        area()?.removeItem(key);
      } catch {
        // storage unavailable: nothing to clear
      }
    },
  };
}
