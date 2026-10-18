// Prototype notation grammar (proposed, not a standard).
//
// Supported:  numbers (3, 2,5, 0.5)  single-letter variables  f(x)
//             + − - = × · * < > ≤ ≥ ≠ ? □ ( ) [ ] , →
//             powers x^2, x^{n-1}, x² x³   subscripts a_1
//             fractions \frac{Δy}{Δx} and atom/atom (3/4)
//             prime f'(x)   \Delta Δ  \cdot \le \ge \neq \to \lim
// Anything else is reported as unsupported. It is never dropped silently:
// the renderer shows the original text with a visible notice.

const OPS = {
  '+': '+', '-': '−', '−': '−', '=': '=', '×': '×', '*': '·', '·': '·', '<': '<', '>': '>',
  '≤': '≤', '≥': '≥', '≠': '≠', '?': '?', '□': '□', '(': '(', ')': ')', '[': '[', ']': ']', ',': ',', '→': '→',
};
const COMMANDS = { Delta: { t: 'mi', v: 'Δ' }, cdot: { t: 'mo', v: '·' }, le: { t: 'mo', v: '≤' }, ge: { t: 'mo', v: '≥' }, neq: { t: 'mo', v: '≠' }, to: { t: 'mo', v: '→' }, lim: { t: 'mi', v: 'lim', fn: true } };
const SUPERS = { '²': '2', '³': '3' };

export function tokenize(src) {
  const toks = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) { i++; continue; }
    const num = /^\d+(?:[.,]\d+)?/.exec(src.slice(i));
    // A comma directly followed by a digit is a decimal comma only inside a number token.
    if (num) { toks.push({ k: 'num', v: num[0] }); i += num[0].length; continue; }
    if (c === '\\') {
      const m = /^\\([A-Za-z]+)/.exec(src.slice(i));
      const name = m?.[1];
      if (name === 'frac') { toks.push({ k: 'frac' }); i += 5; continue; }
      if (name && COMMANDS[name]) { toks.push({ k: 'cmd', ...COMMANDS[name] }); i += name.length + 1; continue; }
      return { error: `\\${name ?? ''}`, at: i };
    }
    if (/[A-Za-zΔ]/.test(c)) { toks.push({ k: 'id', v: c }); i++; continue; }
    if (SUPERS[c]) { toks.push({ k: '^' }, { k: 'num', v: SUPERS[c] }); i++; continue; }
    if (c === "'" || c === '′') { toks.push({ k: 'prime' }); i++; continue; }
    if (c === '^' || c === '_' || c === '{' || c === '}' || c === '/') { toks.push({ k: c }); i++; continue; }
    if (OPS[c]) { toks.push({ k: 'op', v: OPS[c] }); i++; continue; }
    return { error: c, at: i };
  }
  return { toks };
}

/** Parse to a small tree: {t:'row',c:[…]} | {t:'mn'|'mi'|'mo',v} | {t:'sup'|'sub',b,e} | {t:'frac',n,d} | {t:'prime',b} */
export function parseNotation(src) {
  const tk = tokenize(src ?? '');
  if (tk.error) return { ok: false, error: tk.error, src };
  const toks = tk.toks;
  let p = 0;
  const fail = (msg) => { throw new Error(msg); };

  function atom() {
    const t = toks[p];
    if (!t) fail('end');
    if (t.k === 'num') { p++; return { t: 'mn', v: t.v }; }
    if (t.k === 'id') { p++; return { t: 'mi', v: t.v }; }
    if (t.k === 'cmd') { p++; return { t: t.t, v: t.v }; }
    if (t.k === 'op') { p++; return { t: 'mo', v: t.v }; }
    if (t.k === '{') { p++; const r = row('}'); if (toks[p]?.k !== '}') fail('}'); p++; return r; }
    if (t.k === 'frac') {
      p++;
      if (toks[p]?.k !== '{') fail('frac');
      const n = atom();
      if (toks[p]?.k !== '{') fail('frac');
      const d = atom();
      return { t: 'frac', n, d };
    }
    fail(t.k);
  }
  function item() {
    let b = atom();
    for (;;) {
      const t = toks[p];
      if (t?.k === '^') { p++; b = { t: 'sup', b, e: atom() }; continue; }
      if (t?.k === '_') { p++; b = { t: 'sub', b, e: atom() }; continue; }
      if (t?.k === 'prime') { p++; b = { t: 'prime', b }; continue; }
      break;
    }
    return b;
  }
  function row(stop) {
    const c = [];
    while (p < toks.length && toks[p].k !== stop) {
      if (toks[p].k === '/') {
        p++;
        const n = c.pop();
        if (!n || n.t === 'mo') fail('/');
        c.push({ t: 'frac', n, d: item() });
        continue;
      }
      c.push(item());
    }
    return { t: 'row', c };
  }
  try {
    const tree = row(null);
    if (p !== toks.length) return { ok: false, error: toks[p].k, src };
    return { ok: true, tree };
  } catch (e) {
    return { ok: false, error: e.message, src };
  }
}

/** Plain-text readout used in issue previews and tests: keeps every symbol. */
export function notationText(src) {
  const r = parseNotation(src);
  if (!r.ok) return src;
  const grp = (n) => (n.t === 'row' && n.c.length > 1 ? `(${txt(n)})` : txt(n));
  const txt = (n) => {
    switch (n.t) {
      case 'row': return n.c.map(txt).join(' ');
      case 'sup': return `${txt(n.b)}^${grp(n.e)}`;
      case 'sub': return `${txt(n.b)}_${grp(n.e)}`;
      case 'frac': return `(${txt(n.n)})/(${txt(n.d)})`;
      case 'prime': return `${txt(n.b)}′`;
      default: return n.v;
    }
  };
  return txt(r.tree);
}
