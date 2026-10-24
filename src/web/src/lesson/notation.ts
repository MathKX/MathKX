// The pilot notation grammar (specs/001 contracts/directives-and-notation.md), ported from the validator's
// tools/lib/notation.mjs so the renderer reads exactly what the content checks accepted. tests/notation.test.ts
// compares both on every expression of the pilot lesson and the contract's examples. Anything outside the
// grammar is an error, never dropped.

export type NotationNode =
  | { t: "row"; c: NotationNode[] }
  | { t: "mn" | "mi" | "mo"; v: string }
  | { t: "sup" | "sub"; b: NotationNode; e: NotationNode }
  | { t: "frac"; n: NotationNode; d: NotationNode }
  | { t: "prime"; b: NotationNode };

export type ParseResult = { ok: true; tree: NotationNode } | { ok: false; error: string };

type Token =
  | { k: "num" | "id" | "op"; v: string }
  | { k: "cmd"; t: "mi" | "mo"; v: string }
  | { k: "frac" | "prime" | "^" | "_" | "{" | "}" | "/" };

const OPS: Record<string, string> = {
  "+": "+", "-": "−", "−": "−", "=": "=", "×": "×", "*": "·", "·": "·", "<": "<", ">": ">",
  "≤": "≤", "≥": "≥", "≠": "≠", "?": "?", "□": "□", "(": "(", ")": ")", "[": "[", "]": "]", ",": ",", "→": "→",
};
const COMMANDS: Record<string, { t: "mi" | "mo"; v: string }> = {
  Delta: { t: "mi", v: "Δ" }, cdot: { t: "mo", v: "·" }, le: { t: "mo", v: "≤" }, ge: { t: "mo", v: "≥" },
  neq: { t: "mo", v: "≠" }, to: { t: "mo", v: "→" }, lim: { t: "mi", v: "lim" },
};
const SUPERS: Record<string, string> = { "²": "2", "³": "3" };

export function tokenize(src: string): { toks: Token[] } | { error: string } {
  const toks: Token[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i] as string;
    if (/\s/.test(c)) { i++; continue; }
    const num = /^\d+(?:[.,]\d+)?/.exec(src.slice(i));
    if (num) { toks.push({ k: "num", v: num[0] }); i += num[0].length; continue; }
    if (c === "\\") {
      const name = /^\\([A-Za-z]+)/.exec(src.slice(i))?.[1];
      if (name === "frac") { toks.push({ k: "frac" }); i += 5; continue; }
      const command = name ? COMMANDS[name] : undefined;
      if (name && command) { toks.push({ k: "cmd", ...command }); i += name.length + 1; continue; }
      return { error: `\\${name ?? ""}` };
    }
    if (/[A-Za-zΔ]/.test(c)) { toks.push({ k: "id", v: c }); i++; continue; }
    const sup = SUPERS[c];
    if (sup) { toks.push({ k: "^" }, { k: "num", v: sup }); i++; continue; }
    if (c === "'" || c === "′") { toks.push({ k: "prime" }); i++; continue; }
    if (c === "^" || c === "_" || c === "{" || c === "}" || c === "/") { toks.push({ k: c }); i++; continue; }
    const op = OPS[c];
    if (op) { toks.push({ k: "op", v: op }); i++; continue; }
    return { error: c };
  }
  return { toks };
}

/** Parses to a small tree, or names the unsupported text. */
export function parseNotation(src: string | null | undefined): ParseResult {
  const tk = tokenize(src ?? "");
  if ("error" in tk) return { ok: false, error: tk.error };
  const toks = tk.toks;
  let p = 0;
  const fail = (message: string): never => {
    throw new Error(message);
  };

  function atom(): NotationNode {
    const t = toks[p];
    if (!t) return fail("unexpected end of expression");
    if (t.k === "num" || t.k === "id") { p++; return { t: t.k === "num" ? "mn" : "mi", v: t.v }; }
    if (t.k === "cmd") { p++; return { t: t.t, v: t.v }; }
    if (t.k === "op") { p++; return { t: "mo", v: t.v }; }
    if (t.k === "{") { p++; const r = row("}"); if (toks[p]?.k !== "}") fail("}"); p++; return r; }
    if (t.k === "frac") {
      p++;
      if (toks[p]?.k !== "{") fail("\\frac");
      const n = atom();
      if (toks[p]?.k !== "{") fail("\\frac");
      const d = atom();
      return { t: "frac", n, d };
    }
    return fail(t.k);
  }
  function item(): NotationNode {
    let b = atom();
    for (;;) {
      const t = toks[p];
      if (t?.k === "^") { p++; b = { t: "sup", b, e: atom() }; continue; }
      if (t?.k === "_") { p++; b = { t: "sub", b, e: atom() }; continue; }
      if (t?.k === "prime") { p++; b = { t: "prime", b }; continue; }
      break;
    }
    return b;
  }
  function row(stop: Token["k"] | null): NotationNode {
    const c: NotationNode[] = [];
    while (p < toks.length && toks[p]?.k !== stop) {
      if (toks[p]?.k === "/") {
        p++;
        const n = c.pop();
        if (!n || n.t === "mo") fail("/");
        c.push({ t: "frac", n: n as NotationNode, d: item() });
        continue;
      }
      c.push(item());
    }
    return { t: "row", c };
  }
  try {
    const tree = row(null);
    if (p !== toks.length) return { ok: false, error: toks[p]?.k ?? "" };
    return { ok: true, tree };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/** Canonical string for comparison: decimal point, canonical operators, no whitespace (as the validator's). */
export function normalize(src: string): { ok: true; value: string } | { ok: false; error: string } {
  const r = parseNotation(src);
  if (!r.ok) return r;
  const grp = (n: NotationNode): string => (n.t === "row" && n.c.length !== 1 ? `{${txt(n)}}` : txt(n));
  const txt = (n: NotationNode): string => {
    switch (n.t) {
      case "row": return n.c.map(txt).join("");
      case "mn": return n.v.replace(",", ".");
      case "sup": return `${txt(n.b)}^${grp(n.e)}`;
      case "sub": return `${txt(n.b)}_${grp(n.e)}`;
      case "frac": return `\\frac{${txt(n.n)}}{${txt(n.d)}}`;
      case "prime": return `${txt(n.b)}′`;
      default: return n.v;
    }
  };
  return { ok: true, value: txt(r.tree) };
}
