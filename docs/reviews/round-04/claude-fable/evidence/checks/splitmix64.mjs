// Independent check of the SplitMix64 fixtures in docs/architecture/proposals/seed-and-random-source.md
const M = (1n << 64n) - 1n;
function make(seed) { let s = BigInt(seed); return () => { s = (s + 0x9E3779B97F4A7C15n) & M; let z = s; z = ((z ^ (z >> 30n)) * 0xBF58476D1CE4E5B9n) & M; z = ((z ^ (z >> 27n)) * 0x94D049BB133111EBn) & M; return z ^ (z >> 31n); }; }
function below(next, n) { n = BigInt(n); const limit = (1n << 64n) - ((1n << 64n) % n); for (;;) { const r = next(); if (r < limit) return r % n; } }
const raw = { '0': ['16294208416658607535','7960286522194355700','487617019471545679'], '1': ['10451216379200822465','13757245211066428519','17911839290282890590'], '42': ['13679457532755275413','2949826092126892291','5139283748462763858'], '1234567890123456789': ['11026200465730903474','8137580871910607288','8574954778522941295'], '18446744073709551615': ['16490336266968443936','16834447057089888969','4048727598324417001'] };
const bounded = [['42',10,'3,1,8,4,0,2,5,8'],['42',6,'1,1,0,0,4,0,1,2'],['0',1000,'535,700,679,444,747,90,913,940'],['1',7,'2,0,1,0,5,2,0,3']];
const res = { raw: {}, bounded: {} };
for (const [seed, exp] of Object.entries(raw)) { const n = make(seed); const got = [n(), n(), n()].map(String); res.raw[seed] = { match: JSON.stringify(got) === JSON.stringify(exp), got }; }
for (const [seed, n, exp] of bounded) { const nx = make(seed); const got = Array.from({ length: 8 }, () => below(nx, n)).join(','); res.bounded[`${seed}/${n}`] = { match: got === exp, got }; }
// Codex synthesis claim: seed 123456789 nextBelow(10) first ten
{ const nx = make('123456789'); res.codexClaimSeed123456789 = Array.from({ length: 10 }, () => below(nx, 10)).join(','); }
console.log(JSON.stringify(res, null, 2));
