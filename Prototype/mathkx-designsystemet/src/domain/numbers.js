// Locale-aware parsing of a single numeric answer. Prototype grammar:
//  nb: decimal comma (2,5). A point is accepted as decimal (2.5) unless it looks like
//      thousands grouping (1.000), which is rejected as ambiguous.
//  en: decimal point (2.5). A comma that looks like grouping (1,000) is rejected;
//      a decimal comma (2,5) gets a specific message.
//  Optional leading minus (− or -). Optional "x =" prefix when a variable is named.
//  Values outside ±1 000 000 or with more than 6 decimals are rejected, never rounded.
export const LIMIT = 1_000_000;

export function parseNumber(raw, { lang = 'nb', variable } = {}) {
  let s = (raw ?? '').toString().trim().replace(/−/g, '-').replace(/ /g, ' ');
  if (s === '') return { ok: false, reason: 'empty' };
  if (variable) s = s.replace(new RegExp(`^${variable}\\s*=\\s*`, 'i'), '');
  if (/^-?\d{1,3}( \d{3})+$/.test(s)) return { ok: false, reason: 'grouping' };
  s = s.replace(/\s+/g, '');
  if (lang === 'nb') {
    if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) return { ok: false, reason: 'grouping' };
    s = s.replace(',', '.');
  } else {
    if (/^-?\d{1,3}(,\d{3})+$/.test(s)) return { ok: false, reason: 'grouping' };
    if (/^-?\d+,\d+$/.test(s)) return { ok: false, reason: 'decimalComma' };
  }
  if (!/^-?\d+(\.\d+)?$/.test(s)) {
    if (/\d/.test(s) && /[+\-*×·/:=x]/i.test(s.slice(1))) return { ok: false, reason: 'expression' };
    return { ok: false, reason: 'unparseable' };
  }
  const [, dec = ''] = s.split('.');
  if (dec.length > 6) return { ok: false, reason: 'range' };
  const value = Number(s);
  if (!Number.isFinite(value) || Math.abs(value) > LIMIT) return { ok: false, reason: 'range' };
  return { ok: true, value };
}

export function formatNumber(v, lang) {
  return new Intl.NumberFormat(lang === 'nb' ? 'nb-NO' : 'en-GB', { maximumFractionDigits: 6, useGrouping: false }).format(v);
}
