// Cross-language consistency of the two prototype lesson pairs.
import { readFileSync, readdirSync } from 'node:fs';
const root = 'D:/repos/MathKX/.claude/worktrees/round-04-verification-fdb318/Prototype/mathkx-designsystemet/src/content/lessons/';
const out = {};
for (const id of readdirSync(root)) {
  const meta = JSON.parse(readFileSync(`${root}${id}/lesson.json`, 'utf8'));
  const L = {};
  for (const lang of ['nb', 'en']) {
    const md = readFileSync(`${root}${id}/${lang}.md`, 'utf8');
    const fm = md.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
    L[lang] = {
      frontMatterKeys: fm.split('\n').map((l) => l.split(':')[0].trim()).filter(Boolean),
      anchors: [...md.matchAll(/^##+ .*\{#([\w-]+)\}/gm)].map((m) => m[1]),
      headingsWithoutAnchor: [...md.matchAll(/^##+ (.*)$/gm)].filter((m) => !/\{#[\w-]+\}/.test(m[1])).map((m) => m[1]),
      directives: [...md.matchAll(/^:::(\w+)(\{[^}]*\})?/gm)].filter((m) => m[1] !== undefined).map((m) => `${m[1]}${m[2] ?? ''}`),
      math: [...md.matchAll(/\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g)].map((m) => (m[1] ?? m[2]).replace(/\s+/g, '')),
      tablesWithDelimiterRow: (md.match(/^\|.*\n\|\s*-+/gm) ?? []).length,
      tables: (md.match(/^\| .*\n(?=\| )/gm) ?? []).length,
      images: [...md.matchAll(/!\[(.*?)\]\((.+?)\)/g)].map((m) => m[2]),
    };
  }
  const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  out[id] = {
    metaId: meta.id, metaIdEqualsFolder: meta.id === id, schemaRef: meta.$schema, metaSkills: meta.skills, metaPrereqs: meta.prerequisites, practice: meta.practice,
    anchorsEqual: eq(L.nb.anchors, L.en.anchors), anchorsNb: L.nb.anchors, anchorsEn: L.en.anchors,
    headingsWithoutAnchor: { nb: L.nb.headingsWithoutAnchor, en: L.en.headingsWithoutAnchor },
    directivesEqual: eq(L.nb.directives, L.en.directives), directives: L.nb.directives,
    mathEqual: eq(L.nb.math, L.en.math), mathCount: { nb: L.nb.math.length, en: L.en.math.length },
    mathDiff: { onlyNb: L.nb.math.filter((x) => !L.en.math.includes(x)), onlyEn: L.en.math.filter((x) => !L.nb.math.includes(x)) },
    tablesWithGfmDelimiterRow: { nb: L.nb.tablesWithDelimiterRow, en: L.en.tablesWithDelimiterRow },
    frontMatterKeys: L.nb.frontMatterKeys, images: L.nb.images,
  };
}
console.log(JSON.stringify(out, null, 2));
