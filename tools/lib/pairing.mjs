// Cross-language comparison of a lesson's translations (FR-007, DL-017): anchors as sets,
// directives by identity, non-localized attributes, and per-section normalized mathematics.
// Prose, sentence order, directive order, and localized attributes are never compared.
import path from "node:path";
import { BEFORE_FIRST_HEADING } from "./markdown.mjs";
import { normalize } from "./notation.mjs";

export const LOCALIZED_ATTRIBUTES = { example: ["title"] };

/** The identity under which a directive is matched across languages. */
export function directiveIdentity(d) {
  switch (d.name) {
    case "visual": return `visual{type="${d.attributes.type ?? ""}"}`;
    case "example": return `example{id="${d.attributes.id ?? ""}"}`;
    case "practice": return `practice{definition="${d.attributes.definition ?? ""}" version="${d.attributes.version ?? ""}"}`;
    default: return `${d.name}{}`;
  }
}

/**
 * Compares two parsed translations. `base` is the first translation listed (nb), `other` the
 * second (en). Each is { file, parsed }. Reports through the diagnostics collector.
 */
export function comparePair(base, other, diagnostics) {
  const baseName = path.basename(base.file);
  const otherName = path.basename(other.file);
  const expected = "anchors must match across languages";

  // Anchors as sets, both directions.
  const anchorsOf = (t) => new Map(t.parsed.headings.filter((h) => h.anchor).map((h) => [h.anchor, h.line]));
  const baseAnchors = anchorsOf(base), otherAnchors = anchorsOf(other);
  for (const [anchor, line] of baseAnchors) if (!otherAnchors.has(anchor)) diagnostics.error(base.file, `{#${anchor}} is missing in ${otherName}`, { line, field: "anchor", expected });
  for (const [anchor, line] of otherAnchors) if (!baseAnchors.has(anchor)) diagnostics.error(other.file, `{#${anchor}} is missing in ${baseName}`, { line, field: "anchor", expected });

  // Directives by identity: counts must agree; matched pairs must agree on non-localized attributes.
  const groups = (t) => {
    const map = new Map();
    for (const d of t.parsed.directives.filter((d) => d.form === "container")) {
      const key = directiveIdentity(d);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(d);
    }
    return map;
  };
  const baseGroups = groups(base), otherGroups = groups(other);
  const nonLocalized = (d) => {
    const localized = LOCALIZED_ATTRIBUTES[d.name] ?? [];
    return JSON.stringify(Object.entries(d.attributes).filter(([k]) => !localized.includes(k)).sort());
  };
  for (const [key, list] of baseGroups) {
    const others = otherGroups.get(key) ?? [];
    if (others.length !== list.length) {
      const d = list[Math.min(list.length, others.length)] ?? list[0];
      diagnostics.error(base.file, `directive ${key} appears ${list.length} time(s) here and ${others.length} time(s) in ${otherName}`, { line: d.line, field: "directive" });
      continue;
    }
    // Match complete identities (all non-localized attributes) as a multiset, order free; only the
    // leftovers are paired by position so that a changed attribute is reported with both values.
    const leftBase = [], leftOther = [...others];
    for (const d of list) {
      const i = leftOther.findIndex((o) => nonLocalized(o) === nonLocalized(d));
      if (i === -1) leftBase.push(d); else leftOther.splice(i, 1);
    }
    leftBase.forEach((d, i) => {
      const o = leftOther[i];
      const localized = LOCALIZED_ATTRIBUTES[d.name] ?? [];
      const keys = new Set([...Object.keys(d.attributes), ...Object.keys(o.attributes)]);
      for (const attribute of keys) {
        if (localized.includes(attribute)) continue;
        const a = d.attributes[attribute], b = o.attributes[attribute];
        if (a === b) continue;
        const show = (v) => (v === undefined ? "absent" : `"${v}"`);
        diagnostics.error(other.file, `attribute ${attribute} is ${show(b)} here and ${show(a)} in ${baseName}`, { line: o.line, field: `directive ${key}` });
      }
    });
  }
  for (const [key, list] of otherGroups) {
    if (!baseGroups.has(key)) {
      diagnostics.error(other.file, `directive ${key} appears ${list.length} time(s) here and 0 time(s) in ${baseName}`, { line: list[0].line, field: "directive" });
    }
  }

  // Mathematics per section as multisets of normalized expressions.
  const bySection = (t) => {
    const map = new Map();
    for (const m of t.parsed.math) {
      const n = normalize(m.value);
      if (!n.ok) continue; // reported by the per-translation check
      if (!map.has(m.section)) map.set(m.section, []);
      map.get(m.section).push({ value: n.value, line: m.line });
    }
    return map;
  };
  const baseMath = bySection(base), otherMath = bySection(other);
  const sections = new Set([...baseMath.keys(), ...otherMath.keys()]);
  for (const section of sections) {
    const introduction = section === BEFORE_FIRST_HEADING;
    if (!introduction && (!baseAnchors.has(section) || !otherAnchors.has(section))) continue; // anchor mismatch already reported
    const a = [...(baseMath.get(section) ?? [])], b = [...(otherMath.get(section) ?? [])];
    const unmatchedA = [], unmatchedB = [...b];
    for (const x of a) {
      const i = unmatchedB.findIndex((y) => y.value === x.value);
      if (i === -1) unmatchedA.push(x); else unmatchedB.splice(i, 1);
    }
    const field = `section ${introduction ? section : `{#${section}}`}`;
    const list = (items, name) => (items.length ? `${name} has ${items.map((i) => i.value).join(", ")}` : `${name} has no unmatched expression`);
    for (const x of unmatchedA) diagnostics.error(base.file, `expression ${x.value} has no counterpart in ${otherName}`, { line: x.line, field, expected: list(unmatchedB, otherName) });
    for (const y of unmatchedB) diagnostics.error(other.file, `expression ${y.value} has no counterpart in ${baseName}`, { line: y.line, field, expected: list(unmatchedA, baseName) });
  }
}
