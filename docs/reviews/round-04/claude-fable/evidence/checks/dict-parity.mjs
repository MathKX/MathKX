// Dictionary key parity between nb and en in the prototype (deep-merged DICT).
import { DICT } from 'file:///D:/repos/MathKX/.claude/worktrees/round-04-verification-fdb318/Prototype/mathkx-designsystemet/src/i18n.js';
const flat = (o, p = '') => Object.entries(o).flatMap(([k, v]) => typeof v === 'object' && v ? flat(v, `${p}${k}.`) : [[`${p}${k}`, v]]);
const nb = new Map(flat(DICT.nb)), en = new Map(flat(DICT.en));
const onlyNb = [...nb.keys()].filter((k) => !en.has(k));
const onlyEn = [...en.keys()].filter((k) => !nb.has(k));
const identical = [...nb.keys()].filter((k) => en.has(k) && nb.get(k) === en.get(k) && /[a-zA-Z]{3,}/.test(nb.get(k)));
// Placeholder parity
const ph = (s) => [...String(s).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');
const phMismatch = [...nb.keys()].filter((k) => en.has(k) && ph(nb.get(k)) !== ph(en.get(k)));
console.log(JSON.stringify({ nbKeys: nb.size, enKeys: en.size, onlyNb, onlyEn, placeholderMismatch: phMismatch, identicalStrings: identical }, null, 2));
