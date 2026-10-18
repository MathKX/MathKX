// Verification-only probes. Run from repository root; no application files are changed.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { DICT } from '../../../../Prototype/mathkx-designsystemet/src/i18n.js';
import { summarizeDelivery } from '../../../../Prototype/mathkx-designsystemet/src/domain/observations.js';
import { parseNotation } from '../../../../Prototype/mathkx-designsystemet/src/domain/notation.js';
const root = new URL('../../../../', import.meta.url);
const read = p => readFileSync(new URL(p, root), 'utf8');
const flatten = (o, prefix = '') => Object.fromEntries(Object.entries(o).flatMap(([k,v]) => typeof v === 'object' ? Object.entries(flatten(v, `${prefix}${k}.`)) : [[`${prefix}${k}`,v]]));
const nb = flatten(DICT.nb), en = flatten(DICT.en);
const placeholders = s => [...s.matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort().join(',');
console.log(JSON.stringify({dictionaryKeys: {nb:Object.keys(nb).length,en:Object.keys(en).length}, missingEn:Object.keys(nb).filter(k=>!(k in en)), missingNb:Object.keys(en).filter(k=>!(k in nb)), placeholderMismatch:Object.keys(nb).filter(k=>en[k] && placeholders(nb[k])!==placeholders(en[k])), empty:Object.keys(nb).filter(k=>!nb[k] || !en[k])},null,2));
for (const id of ['number-bonds-to-ten','equations-as-a-balance']) {
  const p = `Prototype/mathkx-designsystemet/src/content/lessons/${id}/`;
  const meta = JSON.parse(read(`${p}lesson.json`));
  const langs = Object.fromEntries(['nb','en'].map(lang=> {
    const md = read(`${p}${lang}.md`);
    return [lang,{title:/^title: (.+)$/m.exec(md)?.[1], objective:!!/^objective: .+$/m.test(md), anchors:[...md.matchAll(/\{#([^}]+)\}/g)].map(m=>m[1]), directives:[...md.matchAll(/^:::(visual|practice)\{(.+)\}/gm)].map(m=>m[0]), math:[...md.matchAll(/\$\$([^$]+)\$\$|\$([^$\n]+)\$/g)].map(m=>m[1]??m[2])}];
  }));
  console.log(JSON.stringify({lesson:id, idMatches:meta.id===id, languages:langs, anchorsMatch:JSON.stringify(langs.nb.anchors)===JSON.stringify(langs.en.anchors), directivesMatch:JSON.stringify(langs.nb.directives)===JSON.stringify(langs.en.directives), mathMatch:JSON.stringify(langs.nb.math)===JSON.stringify(langs.en.math), unsupported:langs.en.math.filter(m=>!parseNotation(m).ok)},null,2));
}
for (const support of ['visual','explanation-open','lesson']) {
 const events=[{type:'response',result:'incorrect'},{type:'support',support},{type:'response',result:'correct'}].map((e,i)=>({delivery:'d',seq:i+1,...e}));
 const s=summarizeDelivery(events,'d');
 console.log(JSON.stringify({probe:'incorrect -> help -> correct',support,outcome:s.outcome,tags:s.tags}));
}
const M = (1n<<64n)-1n, W=1n<<64n;
function stream(seed) {let s=seed;return ()=> {s=(s+0x9E3779B97F4A7C15n)&M;let z=s;z=((z^(z>>30n))*0xBF58476D1CE4E5B9n)&M;z=((z^(z>>27n))*0x94D049BB133111EBn)&M;return z^(z>>31n);};}
function below(next,n) {const limit=W-(W%n);let r;do{r=next();}while(r>=limit);return r%n;}
const proposal=read('docs/architecture/proposals/seed-and-random-source.md');
let raw=0,bounded=0,injected=0;
for(const line of proposal.split('\n')) {
 const cols=line.split('|').slice(1,-1).map(s=>s.trim());
 if(cols.length===4 && /^`\d+`$/.test(cols[0]) && cols[1].includes('0x')) {
   const next=stream(BigInt(cols[0].replaceAll('`','')));
   for(const c of cols.slice(1)){assert.equal(next(),BigInt(/^\d+/.exec(c)[0]));raw++;}
 } else if(cols.length===3 && /^`\d+`$/.test(cols[0]) && /^\d+$/.test(cols[1])) {
   const next=stream(BigInt(cols[0].replaceAll('`',''))), n=BigInt(cols[1]);
   for(const c of cols[2].split(',')){assert.equal(below(next,n),BigInt(c.trim()));bounded++;}
 } else if(cols.length===4 && /^`\d+`$/.test(cols[0]) && /^`\d+`/.test(cols[1])) {
   const values=[...cols[1].matchAll(/`(\d+)`/g)].map(m=>BigInt(m[1]));let i=0;
   assert.equal(below(()=>values[i++],BigInt(cols[0].replaceAll('`',''))),BigInt(cols[2].replaceAll('`','')));
   assert.equal(i,Number(cols[3]));injected++;
 }
}
console.log(JSON.stringify({rng:'proposal algorithm independently implemented in JS BigInt, not C# conformance',rawOutputsPassed:raw,boundedOutputsPassed:bounded,injectedBoundaryRowsPassed:injected}));
