// Simulated exercise families. Each variant is a finite, reviewed list of instances
// standing in for a versioned generator definition. "Another question" walks the
// list in a fixed order, avoiding the questions already seen in this session;
// when the list is used up the learner is told, and questions repeat (marked).
// The prototype does not generate new mathematics.

export const skills = {
  'arithmetic.add-within-20': {
    id: 'arithmetic.add-within-20',
    topic: 'arithmetic.addition-within-20',
    lesson: 'number-bonds-to-ten',
    title: { nb: 'Addisjon innenfor 20', en: 'Addition within 20' },
    kind: 'addition',
    ladder: ['within-5', 'within-10', 'across-10'],
    defaultVariant: 'within-10',
    unavailable: {
      easier: { nb: 'Addisjon innenfor fem er den enkleste varianten i prototypen. Du kan utforske tierrammen i leksjonen, eller fortsette med «Flere slike oppgaver».', en: 'Addition within five is the easiest variation in the prototype. You can explore the ten-frame in the lesson, or continue with “More like this”.' },
      harder: { nb: 'Neste steg, addisjon med tosifrede tall, er ikke laget ennå. Du kan fortsette med addisjon over tieren, eller ta en kort sjekk.', en: 'The next step, adding two-digit numbers, has not been made yet. You can keep practising addition across ten, or take a short check.' },
    },
  },
  'algebra.solve-x-plus-a': {
    id: 'algebra.solve-x-plus-a',
    topic: 'algebra.linear-equations-one-step',
    lesson: 'equations-as-a-balance',
    title: { nb: 'Likninger i ett steg', en: 'One-step equations' },
    kind: 'linear',
    ladder: ['to-10', 'to-20'],
    defaultVariant: 'to-10',
    unavailable: {
      easier: { nb: 'Dette er de enkleste likningene i prototypen. Les leksjonen om vekten, eller fortsett med «Flere slike oppgaver».', en: 'These are the simplest equations in the prototype. Read the lesson about the balance, or continue with “More like this”.' },
      harder: { nb: 'Likninger med minus eller x på begge sider er ikke laget ennå.', en: 'Equations with subtraction or x on both sides have not been made yet.' },
    },
  },
};

export const variants = {
  'within-5': {
    skill: 'arithmetic.add-within-20', version: 1, help: 'groups', explanation: 'groups',
    title: { nb: 'Addisjon innenfor fem', en: 'Addition within five' },
    describe: { nb: 'Summen er høyst 5.', en: 'The sum is at most 5.' },
    pool: [[2, 2], [1, 3], [3, 2], [1, 4]],
  },
  'within-10': {
    skill: 'arithmetic.add-within-20', version: 1, help: 'groups', explanation: 'groups',
    title: { nb: 'Addisjon innenfor ti', en: 'Addition within ten' },
    describe: { nb: 'Summen er høyst 10.', en: 'The sum is at most 10.' },
    pool: [[4, 4], [3, 5], [6, 3], [2, 7], [5, 4], [1, 8], [6, 4], [7, 3]],
  },
  'across-10': {
    skill: 'arithmetic.add-within-20', version: 1, help: 'make-ten', explanation: 'make-ten',
    title: { nb: 'Addisjon over tieren', en: 'Addition across ten' },
    describe: { nb: 'To ensifrede tall der summen går over 10, for eksempel 8 + 5.', en: 'Two single-digit numbers whose sum goes past 10, for example 8 + 5.' },
    pool: [[8, 5], [9, 4], [7, 6], [6, 5], [8, 6], [9, 3], [7, 5], [8, 4]],
  },
  'to-10': {
    skill: 'algebra.solve-x-plus-a', version: 1, help: 'balance', explanation: 'balance',
    title: { nb: 'x + a = b, med tall opp til 10', en: 'x + a = b, with numbers up to 10' },
    describe: { nb: 'Høyre side er høyst 10.', en: 'The right-hand side is at most 10.' },
    pool: [[3, 7], [5, 9], [2, 8], [6, 10], [4, 6]],
  },
  'to-20': {
    skill: 'algebra.solve-x-plus-a', version: 1, help: 'balance', explanation: 'balance',
    title: { nb: 'x + a = b, med tall opp til 20', en: 'x + a = b, with numbers up to 20' },
    describe: { nb: 'Høyre side er mellom 11 og 20. Vekten viser fortsatt hver ener.', en: 'The right-hand side is between 11 and 20. The balance still shows every one.' },
    pool: [[7, 15], [9, 13], [6, 18], [8, 11]],
  },
};

/** The canonical instance for (variant, index). Same input → same question. */
export function instance(variantId, index) {
  const v = variants[variantId];
  const [p, q] = v.pool[index % v.pool.length];
  const kind = skills[v.skill].kind;
  const base = { variant: variantId, version: v.version, index, kind };
  return kind === 'addition'
    ? { ...base, id: `${variantId}@v${v.version}#${index}`, a: p, b: q }
    : { ...base, id: `${variantId}@v${v.version}#${index}`, a: p, c: q };
}

/** Next instance for a session, avoiding what this session has already seen. */
export function nextInstance(variantId, seenIndexes = [], { same } = {}) {
  const pool = variants[variantId].pool;
  if (same != null) {
    // "More like this": another question from the same variant, nearest unseen.
    for (let k = 1; k <= pool.length; k++) {
      const i = (same + k) % pool.length;
      if (!seenIndexes.includes(i)) return { q: instance(variantId, i), repeat: false };
    }
  }
  for (let i = 0; i < pool.length; i++) if (!seenIndexes.includes(i)) return { q: instance(variantId, i), repeat: false };
  // Exhausted: repeat honestly, oldest first.
  const i = seenIndexes.length % pool.length;
  return { q: instance(variantId, i), repeat: true, exhausted: true, poolSize: pool.length };
}

export function stepVariant(variantId, dir) {
  const skill = skills[variants[variantId].skill];
  const i = skill.ladder.indexOf(variantId) + (dir === 'easier' ? -1 : 1);
  return skill.ladder[i] ?? null;
}

export const variantOf = (q) => variants[q.variant];
