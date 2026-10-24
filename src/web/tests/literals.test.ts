// DL-038: learner-visible text lives in the dictionaries. Scans the component sources for JSX text nodes and
// string-literal aria-label / title / placeholder / alt props that look like prose, with a small allowlist.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(__dirname, "..", "src");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : full.endsWith(".tsx") ? [full] : [];
  });
}

const ALLOWED = [
  /^[\s\d+\-−=×·?□()\[\],.:…%]*$/u, // mathematical notation and numbers
  /^(MathKX|Designsystemet)$/u,
  /^(Norsk bokmål|English)$/u,
];

const PROSE = /\p{L}/u;

function violations(file: string): string[] {
  const text = readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  const found: string[] = [];
  const lineOf = (index: number) => text.slice(0, index).split("\n").length;
  // JSX text nodes: text between a tag's closing '>' and the next tag '<' (a letter or '/'). Code between
  // comparison operators also contains '>' and '<', so anything with code punctuation is skipped; that keeps
  // the scan honest for prose ("Check answer") without parsing TypeScript.
  for (const match of text.matchAll(/(?<![=)\]\w])>([^<>{}]+)<(?=[A-Za-z/])/g)) {
    const value = (match[1] ?? "").trim();
    if (!value || !PROSE.test(value) || /[;(){}=&|!]|^[?:]|\w\.\w/.test(value) || ALLOWED.some((a) => a.test(value))) continue;
    found.push(`${relative(root, file)}:${lineOf(match.index ?? 0)} text "${value}"`);
  }
  for (const match of text.matchAll(/\b(aria-label|title|placeholder|alt)="([^"]*)"/g)) {
    const value = (match[2] ?? "").trim();
    if (!value || !PROSE.test(value) || ALLOWED.some((a) => a.test(value))) continue;
    found.push(`${relative(root, file)}:${lineOf(match.index ?? 0)} ${match[1]}="${value}"`);
  }
  return found;
}

describe("learner-visible literals", () => {
  it("do not appear outside the dictionaries", () => {
    const all = walk(root).flatMap(violations);
    expect(all, all.join("\n")).toEqual([]);
  });
});
