// Does a lesson show the answer to this exact exercise? (prototype rule)
//
// Used when a learner opens the lesson from an exercise before answering
// (round-03 review R03-02). The lesson is treated as disclosing the answer when
// it contains, anywhere the learner can scroll to:
//  - a maths chunk ($…$ or $$…$$) that starts with the exercise and ends with
//    its answer, e.g. "8 + 5 = 8 + 2 + 3 = 10 + 3 = 13", or "3 + 7 = 10"; or
//  - for an equation, both the equation (or a step of it) and "x = <answer>"; or
//  - a worked-explanation visual for the same values, because its step player
//    reaches the answer.
// Mentioning the exercise without its result ("9 + 4: … that makes 10 + 3")
// is not a disclosure.

const norm = (s) => s.replace(/\s+/g, '').replace(/[−–]/g, '-');

function mathChunks(md) {
  const out = [];
  const re = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g;
  let m;
  while ((m = re.exec(md))) out.push(norm(m[1] ?? m[2]));
  return out;
}

function visuals(md) {
  const out = [];
  const re = /:::visual\{([^}]*)\}/g;
  let m;
  while ((m = re.exec(md))) {
    const attrs = Object.fromEntries([...m[1].matchAll(/(\w+)="([^"]*)"/g)].map((x) => [x[1], x[2]]));
    out.push(attrs);
  }
  return out;
}

/** @returns {{ discloses: boolean, where?: 'math' | 'visual' }} */
export function lessonDisclosure(markdown, q) {
  if (!markdown || !q) return { discloses: false };
  const chunks = mathChunks(markdown);
  if (q.kind === 'addition') {
    const sum = String(q.a + q.b);
    const starts = [`${q.a}+${q.b}`, `${q.b}+${q.a}`];
    if (chunks.some((c) => { const parts = c.split('='); return parts.length > 1 && starts.includes(parts[0]) && parts.at(-1) === sum; })) return { discloses: true, where: 'math' };
    if (visuals(markdown).some((v) => v.type === 'make-ten' && Number(v.a) === q.a && Number(v.b) === q.b)) return { discloses: true, where: 'visual' };
    return { discloses: false };
  }
  if (q.kind === 'linear') {
    const x = String(q.c - q.a);
    const eq = `x+${q.a}=${q.c}`;
    const hasEq = chunks.some((c) => c === eq || c.startsWith(`x+${q.a}-${q.a}=${q.c}-${q.a}`));
    if (hasEq && chunks.includes(`x=${x}`)) return { discloses: true, where: 'math' };
    if (visuals(markdown).some((v) => v.type === 'balance' && Number(v.a) === q.a && Number(v.c) === q.c)) return { discloses: true, where: 'visual' };
    return { discloses: false };
  }
  return { discloses: false };
}
