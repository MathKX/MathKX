// Sample content catalog: domains -> topics -> skills -> lessons and exercises.
// Stable, language-neutral IDs; display text is localized.
// Lessons follow the proposed folder layout: <lesson-id>/lesson.json, nb.md, en.md, assets/.
import bondsMeta from './lessons/number-bonds-to-ten/lesson.json';
import bondsMetaRaw from './lessons/number-bonds-to-ten/lesson.json?raw';
import bondsNb from './lessons/number-bonds-to-ten/nb.md?raw';
import bondsEn from './lessons/number-bonds-to-ten/en.md?raw';
import bondsAsset from './lessons/number-bonds-to-ten/assets/ten-frame-3-7.svg?url';
import bondsAssetRaw from './lessons/number-bonds-to-ten/assets/ten-frame-3-7.svg?raw';
import balanceMeta from './lessons/equations-as-a-balance/lesson.json';
import balanceMetaRaw from './lessons/equations-as-a-balance/lesson.json?raw';
import balanceNb from './lessons/equations-as-a-balance/nb.md?raw';
import balanceEn from './lessons/equations-as-a-balance/en.md?raw';

const S = {
  primary: { nb: 'barneskolen', en: 'primary school' },
  lower: { nb: 'ungdomsskolen', en: 'lower secondary' },
  upper: { nb: 'videregående', en: 'upper secondary' },
  uni: { nb: 'universitet', en: 'university' },
};

const t = (id, nb, en, stage, extra = {}) => ({ id, title: { nb, en }, stage, status: 'preview', ...extra });

export const domains = [
  {
    id: 'arithmetic',
    icon: '+',
    title: { nb: 'Tall og regning', en: 'Numbers and arithmetic' },
    summary: { nb: 'Tallforståelse, de fire regneartene, brøk, desimaltall og prosent.', en: 'Number sense, the four operations, fractions, decimals and percentages.' },
    range: { nb: 'Fra første skoleår', en: 'From the first school years' },
    topics: [
      t('arithmetic.counting', 'Telling og tallforståelse', 'Counting and number sense', S.primary),
      t('arithmetic.addition-within-20', 'Addisjon innenfor 20', 'Addition within 20', S.primary, { status: 'available' }),
      t('arithmetic.subtraction-within-20', 'Subtraksjon innenfor 20', 'Subtraction within 20', S.primary),
      t('arithmetic.place-value', 'Plassverdi og store tall', 'Place value and large numbers', S.primary),
      t('arithmetic.multiplication', 'Multiplikasjon og divisjon', 'Multiplication and division', S.primary),
      t('arithmetic.fractions', 'Brøk', 'Fractions', S.primary),
      t('arithmetic.decimals-percent', 'Desimaltall og prosent', 'Decimals and percentages', S.lower),
      t('arithmetic.negative-numbers', 'Negative tall', 'Negative numbers', S.lower),
    ],
  },
  {
    id: 'algebra',
    icon: 'x',
    title: { nb: 'Algebra', en: 'Algebra' },
    summary: { nb: 'Uttrykk, likninger, ulikheter og polynomer.', en: 'Expressions, equations, inequalities and polynomials.' },
    range: { nb: 'Fra mellomtrinnet til universitet', en: 'From middle school to university' },
    topics: [
      t('algebra.expressions', 'Uttrykk og variabler', 'Expressions and variables', S.lower),
      t('algebra.linear-equations-one-step', 'Likninger i ett steg', 'One-step equations', S.lower, { status: 'available' }),
      t('algebra.linear-equations', 'Lineære likninger', 'Linear equations', S.lower),
      t('algebra.inequalities', 'Ulikheter', 'Inequalities', S.lower),
      t('algebra.systems', 'Likningssett', 'Systems of equations', S.upper),
      t('algebra.polynomials', 'Polynomer og faktorisering', 'Polynomials and factorisation', S.upper),
      t('algebra.quadratics', 'Andregradslikninger', 'Quadratic equations', S.upper),
      t('algebra.abstract', 'Grupper, ringer og kropper', 'Groups, rings and fields', S.uni),
    ],
  },
  {
    id: 'geometry',
    icon: '△',
    title: { nb: 'Geometri', en: 'Geometry' },
    summary: { nb: 'Former, måling, areal, Pytagoras, formlikhet og trigonometri.', en: 'Shapes, measurement, area, Pythagoras, similarity and trigonometry.' },
    range: { nb: 'Fra første skoleår til universitet', en: 'From the first school years to university' },
    topics: [
      t('geometry.shapes', 'Former og egenskaper', 'Shapes and properties', S.primary),
      t('geometry.area-perimeter', 'Areal og omkrets', 'Area and perimeter', S.primary),
      t('geometry.pythagoras', 'Pytagoras’ setning', 'The Pythagorean theorem', S.lower),
      t('geometry.similarity', 'Formlikhet og skalering', 'Similarity and scaling', S.lower),
      t('geometry.trigonometry', 'Trigonometri', 'Trigonometry', S.upper),
      t('geometry.vectors-plane', 'Vektorer i planet', 'Vectors in the plane', S.upper),
    ],
  },
  {
    id: 'functions',
    icon: 'ƒ',
    title: { nb: 'Funksjoner og grafer', en: 'Functions and graphs' },
    summary: { nb: 'Koordinatsystemet, lineære funksjoner, eksponential- og logaritmefunksjoner.', en: 'The coordinate plane, linear functions, exponentials and logarithms.' },
    range: { nb: 'Fra ungdomsskolen til universitet', en: 'From lower secondary to university' },
    topics: [
      t('functions.coordinates', 'Koordinatsystemet', 'The coordinate plane', S.lower),
      t('functions.linear', 'Lineære funksjoner', 'Linear functions', S.lower),
      t('functions.quadratic', 'Andregradsfunksjoner', 'Quadratic functions', S.upper),
      t('functions.exponential', 'Eksponentialfunksjoner', 'Exponential functions', S.upper),
      t('functions.logarithms', 'Logaritmer', 'Logarithms', S.upper),
    ],
  },
  {
    id: 'statistics',
    icon: 'P',
    title: { nb: 'Sannsynlighet og statistikk', en: 'Probability and statistics' },
    summary: { nb: 'Data og diagrammer, sentralmål, sannsynlighet og statistisk slutning.', en: 'Data and charts, averages, probability and statistical inference.' },
    range: { nb: 'Fra barneskolen til universitet', en: 'From primary school to university' },
    topics: [
      t('statistics.data', 'Data og diagrammer', 'Data and charts', S.primary),
      t('statistics.averages', 'Sentralmål og spredning', 'Averages and spread', S.lower),
      t('statistics.probability', 'Sannsynlighet', 'Probability', S.lower),
      t('statistics.combinatorics', 'Kombinatorikk', 'Combinatorics', S.upper),
      t('statistics.distributions', 'Sannsynlighetsfordelinger', 'Probability distributions', S.upper),
      t('statistics.inference', 'Statistisk inferens', 'Statistical inference', S.uni),
    ],
  },
  {
    id: 'calculus',
    icon: '∫',
    title: { nb: 'Analyse', en: 'Calculus' },
    summary: { nb: 'Grenseverdier, derivasjon, integrasjon, rekker og differensiallikninger.', en: 'Limits, differentiation, integration, series and differential equations.' },
    range: { nb: 'Fra videregående til universitet', en: 'From upper secondary to university' },
    topics: [
      t('calculus.limits', 'Grenseverdier', 'Limits', S.upper),
      t('calculus.derivatives', 'Derivasjon', 'Differentiation', S.upper, { status: 'design-preview', href: '#/preview/derivative' }),
      t('calculus.integrals', 'Integrasjon', 'Integration', S.upper),
      t('calculus.series', 'Følger og rekker', 'Sequences and series', S.uni),
      t('calculus.odes', 'Differensiallikninger', 'Differential equations', S.uni),
      t('calculus.multivariable', 'Flervariabel analyse', 'Multivariable calculus', S.uni),
    ],
  },
  {
    id: 'linear-algebra',
    icon: '⊞',
    title: { nb: 'Lineær algebra', en: 'Linear algebra' },
    summary: { nb: 'Vektorer, matriser, lineære likningssystemer og egenverdier.', en: 'Vectors, matrices, linear systems and eigenvalues.' },
    range: { nb: 'Fra videregående til universitet', en: 'From upper secondary to university' },
    topics: [
      t('linear-algebra.vectors', 'Vektorer og matriser', 'Vectors and matrices', S.upper),
      t('linear-algebra.systems', 'Lineære likningssystemer', 'Linear systems', S.uni),
      t('linear-algebra.determinants', 'Determinanter', 'Determinants', S.uni),
      t('linear-algebra.vector-spaces', 'Vektorrom', 'Vector spaces', S.uni),
      t('linear-algebra.eigen', 'Egenverdier og egenvektorer', 'Eigenvalues and eigenvectors', S.uni),
    ],
  },
];

// Fully implemented topics
export const topicDetails = {
  'arithmetic.addition-within-20': {
    domain: 'arithmetic',
    understand: [
      { nb: 'Hvilke tallpar som sammen blir 10 (tiervenner).', en: 'Which pairs of numbers make 10 (number bonds to ten).' },
      { nb: 'Hvordan du kan legge sammen to grupper og finne hvor mange det er til sammen.', en: 'How to put two groups together and find how many there are altogether.' },
      { nb: 'Hvordan du kan regne for eksempel 8 + 5 ved å fylle opp til 10 først.', en: 'How to work out, for example, 8 + 5 by filling up to 10 first.' },
    ],
    prereq: [
      { title: { nb: 'Telle til 20', en: 'Counting to 20' }, topic: 'arithmetic.counting' },
      { title: { nb: 'Hva et plusstegn betyr', en: 'What a plus sign means' }, topic: 'arithmetic.counting' },
    ],
    skills: [
      { id: 'arithmetic.add-within-10', title: { nb: 'Addere innenfor 10', en: 'Add within 10' } },
      { id: 'arithmetic.number-bonds-10', title: { nb: 'Tiervenner', en: 'Number bonds to ten' } },
      { id: 'arithmetic.add-make-ten', title: { nb: 'Addere ved å fylle opp til 10', en: 'Add by making ten' } },
    ],
    lessons: ['number-bonds-to-ten'],
    practice: 'arithmetic.add-within-20',
    check: 'check-addition',
  },
  'algebra.linear-equations-one-step': {
    domain: 'algebra',
    understand: [
      { nb: 'At likhetstegnet betyr at begge sider har samme verdi.', en: 'That the equals sign means both sides have the same value.' },
      { nb: 'Hvordan du finner et ukjent tall ved å gjøre det samme på begge sider.', en: 'How to find an unknown number by doing the same to both sides.' },
      { nb: 'Hvordan du sjekker svaret ved å sette det inn igjen.', en: 'How to check an answer by substituting it back in.' },
    ],
    prereq: [
      { title: { nb: 'Addisjon innenfor 20', en: 'Addition within 20' }, topic: 'arithmetic.addition-within-20' },
      { title: { nb: 'Subtraksjon innenfor 20', en: 'Subtraction within 20' }, topic: 'arithmetic.subtraction-within-20' },
    ],
    skills: [
      { id: 'algebra.equality-meaning', title: { nb: 'Forstå likhetstegnet', en: 'Understand the equals sign' } },
      { id: 'algebra.solve-x-plus-a', title: { nb: 'Løse x + a = b', en: 'Solve x + a = b' } },
      { id: 'algebra.check-solution', title: { nb: 'Sjekke en løsning', en: 'Check a solution' } },
    ],
    lessons: ['equations-as-a-balance'],
    practice: 'algebra.solve-x-plus-a',
    check: 'check-linear',
  },
};

export const lessons = {
  'number-bonds-to-ten': {
    id: 'number-bonds-to-ten', meta: bondsMeta, topic: 'arithmetic.addition-within-20', minutes: 8,
    files: { 'lesson.json': bondsMetaRaw, 'nb.md': bondsNb, 'en.md': bondsEn, 'assets/ten-frame-3-7.svg': bondsAssetRaw },
    source: { nb: bondsNb, en: bondsEn },
    assets: { 'assets/ten-frame-3-7.svg': bondsAsset },
  },
  'equations-as-a-balance': {
    id: 'equations-as-a-balance', meta: balanceMeta, topic: 'algebra.linear-equations-one-step', minutes: 7,
    files: { 'lesson.json': balanceMetaRaw, 'nb.md': balanceNb, 'en.md': balanceEn },
    source: { nb: balanceNb, en: balanceEn },
    assets: {},
  },
};
export const lessonPath = (id, file = '') => `content/lessons/${id}/${file}`;

// Self-checks: a fixed, reviewed set with a stated scope and support policy.
const add = (id, a, b) => ({ id, kind: 'addition', a, b, variant: 'check', help: a + b > 10 ? 'make-ten' : 'groups', explanation: a + b > 10 ? 'make-ten' : 'groups' });
const lin = (id, a, c) => ({ id, kind: 'linear', a, c, variant: 'check', help: 'balance', explanation: 'balance' });
export const checks = {
  'check-addition': {
    id: 'check-addition', topic: 'arithmetic.addition-within-20', lesson: 'number-bonds-to-ten', skill: 'arithmetic.add-within-20',
    title: { nb: 'Tiervenner og addisjon', en: 'Number bonds and addition' },
    scope: { nb: 'Addisjon innenfor ti og over tieren', en: 'Addition within ten and across ten' },
    questions: [
      { ...add('chk-add-7-3', 7, 3), section: 'pairs' },
      { ...add('chk-add-5-4', 5, 4), section: 'ten-frame' },
      { ...add('chk-add-8-5', 8, 5), section: 'why' },
      { ...add('chk-add-9-4', 9, 4), section: 'try' },
    ],
  },
  'check-linear': {
    id: 'check-linear', topic: 'algebra.linear-equations-one-step', lesson: 'equations-as-a-balance', skill: 'algebra.solve-x-plus-a',
    title: { nb: 'Likninger i ett steg', en: 'One-step equations' },
    scope: { nb: 'Likninger av typen x + a = b', en: 'Equations of the form x + a = b' },
    questions: [
      { ...lin('chk-lin-4-9', 4, 9), section: 'both-sides' },
      { ...lin('chk-lin-2-7', 2, 7), section: 'check' },
      { ...lin('chk-lin-7-10', 7, 10), section: 'balance' },
    ],
  },
};

export function findTopic(id) {
  for (const d of domains) {
    const tp = d.topics.find((x) => x.id === id);
    if (tp) return { domain: d, topic: tp, details: topicDetails[id] };
  }
  return null;
}
export const findDomain = (id) => domains.find((d) => d.id === id);

// Skill registry used for "related skills" links. A skill links to where it is taught.
export const skillLinks = {
  'arithmetic.add-within-10': { title: { nb: 'Addisjon innenfor ti', en: 'Addition within ten' }, href: '#/practice/arithmetic.add-within-20?variant=within-10' },
  'arithmetic.add-within-20': { title: { nb: 'Addisjon innenfor 20', en: 'Addition within 20' }, href: '#/topic/arithmetic.addition-within-20' },
  'arithmetic.counting-to-20': { title: { nb: 'Telle til 20', en: 'Counting to 20' }, preview: true, href: '#/domain/arithmetic' },
  'arithmetic.meaning-of-plus': { title: { nb: 'Hva et plusstegn betyr', en: 'What a plus sign means' }, preview: true, href: '#/domain/arithmetic' },
  'arithmetic.number-bonds-10': { title: { nb: 'Tiervenner', en: 'Number bonds to ten' }, href: '#/lesson/number-bonds-to-ten' },
  'arithmetic.add-make-ten': { title: { nb: 'Addere ved å fylle opp til 10', en: 'Add by making ten' }, href: '#/lesson/number-bonds-to-ten' },
  'arithmetic.subtraction-within-20': { title: { nb: 'Subtraksjon innenfor 20', en: 'Subtraction within 20' }, preview: true, href: '#/domain/arithmetic' },
  'algebra.solve-x-plus-a': { title: { nb: 'Løse x + a = b', en: 'Solve x + a = b' }, href: '#/lesson/equations-as-a-balance' },
  'algebra.equality-meaning': { title: { nb: 'Forstå likhetstegnet', en: 'Understand the equals sign' }, href: '#/lesson/equations-as-a-balance' },
  'algebra.check-solution': { title: { nb: 'Sjekke en løsning', en: 'Check a solution' }, href: '#/lesson/equations-as-a-balance' },
  'algebra.linear-equations': { title: { nb: 'Lineære likninger', en: 'Linear equations' }, preview: true, href: '#/domain/algebra' },
};
