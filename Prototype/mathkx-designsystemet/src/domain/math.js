// Deterministic mathematical domain logic: parsing, validation and feedback codes.
// UI components render these results; they never decide correctness themselves.

/** Parse a learner's typed answer into an integer. */
export function parseAnswer(raw, { variable } = {}) {
  const original = (raw ?? '').toString();
  let s = original.trim().replace(/−/g, '-').replace(/\s+/g, ' ');
  if (s === '') return { ok: false, reason: 'empty' };
  if (variable) {
    const re = new RegExp(`^${variable}\\s*=\\s*`, 'i');
    s = s.replace(re, '');
  }
  s = s.replace(/\s/g, '');
  // Integer, or a decimal that is a whole number ("8,0" / "8.0")
  if (/^-?\d+([.,]0+)?$/.test(s)) return { ok: true, value: parseInt(s, 10) };
  if (/^-?\d+[.,]\d+$/.test(s)) return { ok: true, value: Number(s.replace(',', '.')) };
  if (/^[-\d\s+*x×·/=().,]+$/i.test(s) && /\d/.test(s) && /[+\-*×·/]/.test(s.slice(1))) {
    return { ok: false, reason: 'expression' };
  }
  return { ok: false, reason: 'unparseable' };
}

// ---- Exercise kinds -------------------------------------------------------

export const kinds = {
  addition: {
    solve: (q) => q.a + q.b,
    expression: (q) => `${q.a} + ${q.b} = ?`,
    spoken: (q) => ({ nb: `${q.a} pluss ${q.b} er lik hva?`, en: `${q.a} plus ${q.b} equals what?` }),
    help: (q) => (q.a + q.b > 10 ? 'make-ten' : 'groups'),
    answerHint: 'ex.answerHintNumber',
    /** Return a structured feedback object; text is resolved per language later. */
    evaluate(q, value) {
      const sum = q.a + q.b;
      if (value === sum) return { status: 'correct', code: 'correct', values: { a: q.a, b: q.b, sum } };
      if (value === q.a || value === q.b) return { status: 'incorrect', code: 'add.oneGroup', values: { v: value, a: q.a, b: q.b } };
      if (String(value) === `${q.a}${q.b}`) return { status: 'incorrect', code: 'add.concat', values: { v: value } };
      if (Math.abs(value - sum) === 1) return { status: 'incorrect', code: 'add.offByOne', values: { v: value } };
      if (value === Math.abs(q.a - q.b)) return { status: 'incorrect', code: 'add.subtracted', values: { v: value, a: q.a, b: q.b } };
      return { status: 'incorrect', code: 'add.generic', values: { v: value, a: q.a, b: q.b } };
    },
  },
  linear: {
    // x + a = c
    solve: (q) => q.c - q.a,
    expression: (q) => `x + ${q.a} = ${q.c}`,
    spoken: (q) => ({ nb: `x pluss ${q.a} er lik ${q.c}. Hva er x?`, en: `x plus ${q.a} equals ${q.c}. What is x?` }),
    help: () => 'balance',
    variable: 'x',
    answerHint: 'ex.answerHintX',
    evaluate(q, value) {
      const x = q.c - q.a;
      if (value === x) return { status: 'correct', code: 'correct', values: { x, a: q.a, c: q.c } };
      const base = { v: value, a: q.a, c: q.c, sub: value + q.a };
      if (value === q.c + q.a) return { status: 'incorrect', code: 'lin.added', values: base };
      if (value === q.c) return { status: 'incorrect', code: 'lin.copied', values: base };
      return { status: 'incorrect', code: 'lin.substitute', values: base };
    },
  },
};

export function evaluateAnswer(q, raw) {
  const kind = kinds[q.kind];
  const parsed = parseAnswer(raw, { variable: kind.variable });
  if (!parsed.ok) return { status: 'input', code: parsed.reason, values: { raw: (raw ?? '').toString().trim() } };
  return kind.evaluate(q, parsed.value);
}

// Localized feedback for the domain codes. Kept next to the logic so that
// translations stay aligned with the misconceptions they describe.
const FEEDBACK = {
  'add.oneGroup': {
    nb: '{v} er antallet i én av gruppene. Hvor mange blir det når du tar med begge gruppene?',
    en: '{v} is the number in one of the groups. How many are there when you include both groups?',
  },
  'add.concat': {
    nb: 'Det ser ut som tallene ble skrevet etter hverandre. Her skal de legges sammen.',
    en: 'It looks like the numbers were written next to each other. Here they should be added together.',
  },
  'add.offByOne': {
    nb: 'Nesten. Svaret ligger rett ved {v}. Tell én gang til, gjerne med visuell hjelp.',
    en: 'Nearly. The answer is right next to {v}. Count once more, perhaps with visual help.',
  },
  'add.subtracted': {
    nb: '{v} er forskjellen mellom {a} og {b}. Her skal vi finne hvor mange det er til sammen.',
    en: '{v} is the difference between {a} and {b}. Here we want to find how many there are altogether.',
  },
  'add.generic': {
    nb: 'Ikke helt. Prøv å se på de to tallene som to grupper du slår sammen.',
    en: 'Not quite. Try thinking of the two numbers as two groups you put together.',
  },
  'lin.added': {
    nb: 'Det ser ut som du la til {a}. Hvis x = {v}, blir x + {a} = {sub}, ikke {c}. Prøv å trekke fra {a} på begge sider.',
    en: 'It looks like you added {a}. If x = {v}, then x + {a} = {sub}, not {c}. Try subtracting {a} from both sides.',
  },
  'lin.copied': {
    nb: '{c} er hele høyre side. Hvis x = {v}, blir x + {a} = {sub}. Hva må x være for at x + {a} skal bli {c}?',
    en: '{c} is the whole right-hand side. If x = {v}, then x + {a} = {sub}. What must x be so that x + {a} makes {c}?',
  },
  'lin.substitute': {
    nb: 'Sjekk ved å sette inn: Hvis x = {v}, blir x + {a} = {sub}, ikke {c}.',
    en: 'Check by substituting: if x = {v}, then x + {a} = {sub}, not {c}.',
  },
  'correct.addition': { nb: '{a} + {b} = {sum}.', en: '{a} + {b} = {sum}.' },
  'correct.linear': { nb: 'x = {x}, fordi {x} + {a} = {c}.', en: 'x = {x}, because {x} + {a} = {c}.' },
};

export function feedbackText(lang, code, values) {
  const entry = FEEDBACK[code];
  if (!entry) return '';
  const s = entry[lang] ?? entry.nb;
  return s.replace(/\{(\w+)\}/g, (_, k) => values?.[k] ?? '');
}
