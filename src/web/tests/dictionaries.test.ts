import { describe, expect, it } from "vitest";
import { nb } from "../src/i18n/nb";
import { en } from "../src/i18n/en";
import { flattenKeys } from "../src/i18n";
import codes from "../src/i18n/codes.json";

const keysOf = (d: object) => flattenKeys(d).sort();

describe("dictionaries", () => {
  it("have identical key sets in both languages", () => {
    expect(keysOf(en)).toEqual(keysOf(nb));
  });

  it("have a non-empty string at every key", () => {
    for (const dictionary of [nb, en]) {
      const walk = (value: unknown, path: string) => {
        if (typeof value === "string") {
          expect(value.trim(), path).not.toBe("");
          return;
        }
        expect(value, path).toBeTypeOf("object");
        for (const [k, v] of Object.entries(value as Record<string, unknown>)) walk(v, `${path}.${k}`);
      };
      walk(dictionary, "root");
    }
  });

  it("cover every feedback code, status, outcome, tag, and step text code", () => {
    expect(Object.keys(nb.feedback).sort()).toEqual([...codes.feedback].sort());
    expect(Object.keys(nb.status).sort()).toEqual([...codes.status].sort());
    expect(Object.keys(nb.outcome).sort()).toEqual([...codes.outcome].sort());
    expect(Object.keys(nb.tag).sort()).toEqual([...codes.tag].sort());
    expect(Object.keys(nb.explain).sort()).toEqual([...codes.stepText].sort());
  });

  it("list exactly the registered misconception codes plus correct and the two input codes", () => {
    const registered = ["add.oneGroup", "add.concat", "add.offByOne", "add.subtracted", "add.generic"];
    expect([...codes.feedback].sort()).toEqual([...registered, "correct", "invalid.empty", "invalid.notAnInteger"].sort());
  });
});
