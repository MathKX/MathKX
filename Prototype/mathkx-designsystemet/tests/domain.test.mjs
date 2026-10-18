// Prototype domain checks: run with `npm test` (node --test). Not a production test suite.
import test from 'node:test';
import assert from 'node:assert/strict';
import { parseNotation, notationText } from '../src/domain/notation.js';
import { parseNumber } from '../src/domain/numbers.js';
import { explanationSteps, helpSteps, supports, firstRevealStep } from '../src/domain/explanations.js';
import { variants, instance, nextInstance, stepVariant } from '../src/domain/practice.js';
import { summarizeDelivery, summarizeSession, suggestNext, lessonVisits } from '../src/domain/observations.js';
import { lessonDisclosure } from '../src/domain/disclosure.js';
import { readFileSync } from 'node:fs';
import { evaluateAnswer } from '../src/domain/math.js';

test('notation keeps every symbol or reports it as unsupported', () => {
  assert.equal(notationText('3/4'), '(3)/(4)');
  assert.equal(notationText('2 < 3'), '2 < 3');
  assert.equal(notationText('6²'), '6^2');
  assert.equal(notationText('x^{n-1}'), 'x^(n − 1)');
  assert.equal(notationText("f'(x) = 2x"), 'f′ ( x ) = 2 x');
  for (const bad of ['2 & 3', '\\sqrt{2}', '5 %']) assert.equal(parseNotation(bad).ok, false, bad);
});

test('numeric answers are parsed per locale and never silently altered', () => {
  assert.deepEqual(parseNumber('1,5', { lang: 'nb' }), { ok: true, value: 1.5 });
  assert.equal(parseNumber('1,5', { lang: 'en' }).reason, 'decimalComma');
  assert.equal(parseNumber('1,000', { lang: 'en' }).reason, 'grouping');
  assert.equal(parseNumber('1.000', { lang: 'nb' }).reason, 'grouping');
  assert.equal(parseNumber('9007199254740993', { lang: 'en' }).reason, 'range');
  assert.equal(parseNumber('4+4', { lang: 'nb' }).reason, 'expression');
  assert.deepEqual(parseNumber('x = 4', { lang: 'en', variable: 'x' }), { ok: true, value: 4 });
  assert.deepEqual(parseNumber('−3', { lang: 'nb' }), { ok: true, value: -3 });
});

test('8 + 5 explanation shows every step and ends with the answer', () => {
  const steps = explanationSteps('make-ten', { a: 8, b: 5 });
  assert.deepEqual(steps.map((s) => s.eq), ['8 + 5', '8 + 5 = 8 + 2 + 3', '8 + 2 + 3 = 10 + 3', '8 + 5 = 8 + 2 + 3 = 10 + 3 = 13']);
  assert.ok(steps.every((s, i) => s.visual.phase === i));
});

test('every variant instance has explanation and help that agree with the validator', () => {
  for (const [id, v] of Object.entries(variants)) {
    v.pool.forEach((_, i) => {
      const q = instance(id, i);
      assert.ok(supports(v.explanation, q), `${q.id} explanation supported`);
      const steps = explanationSteps(v.explanation, q);
      const answer = q.kind === 'addition' ? q.a + q.b : q.c - q.a;
      assert.ok(steps.some((s) => s.eq.endsWith(`= ${answer}`) || s.eq === `x = ${answer}`), `${q.id} explanation reaches ${answer}`);
      assert.equal(evaluateAnswer(q, String(answer), 'nb').status, 'correct');
      const h = helpSteps(v.help, q);
      if (h) assert.ok(h.every((s) => !s.eq.endsWith(`= ${answer}`)), `${q.id} help does not reveal the answer`);
    });
  }
});

test('explanations refuse values outside their contract', () => {
  assert.equal(explanationSteps('make-ten', { a: 19, b: 1 }), null);
  assert.equal(explanationSteps('groups', { a: 8, b: 5 }), null);
});

test('finite pools repeat honestly and challenge stops at the ends of the ladder', () => {
  const seen = [];
  for (let i = 0; i < 4; i++) { const r = nextInstance('within-5', seen); assert.equal(r.repeat, false); seen.push(r.q.index); }
  assert.equal(nextInstance('within-5', seen).repeat, true);
  assert.equal(stepVariant('within-5', 'easier'), null);
  assert.equal(stepVariant('across-10', 'harder'), null);
  assert.equal(stepVariant('within-10', 'harder'), 'across-10');
});

const run = (evs) => evs.map((e, i) => ({ seq: i + 1, delivery: 'd', ...e }));
// One row per event sequence: [description, events, outcome, tags]. DL-029 (help-first):
// any reveal leads; then non-revealing help; then feedback-only retries.
const R = (result) => ({ type: 'response', result });
const S = (support, extra = {}) => ({ type: 'support', support, ...extra });
const SEQUENCES = [
  ['correct first', [R('correct')], 'correctFirst', []],
  ['visual help, correct', [S('visual'), R('correct')], 'correctWithVisualHelp', ['visualBefore']],
  ['feedback-only retry', [R('incorrect'), R('correct')], 'correctAfterFeedback', []],
  ['wrong, visual help, correct (DL-029 scenario)', [R('incorrect'), S('visual'), R('correct')], 'correctWithVisualHelp', ['feedbackBefore', 'visualBefore']],
  ['visual help, wrong, correct', [S('visual'), R('incorrect'), R('correct')], 'correctWithVisualHelp', ['feedbackBefore', 'visualBefore']],
  ['wrong, counting without the last counter, correct', [R('incorrect'), S('visual'), S('counting'), R('correct')], 'correctWithVisualHelp', ['feedbackBefore', 'visualBefore']],
  ['wrong, part of the explanation, correct', [R('incorrect'), S('explanation-open', { step: 0 }), R('correct')], 'correctWithHelp', ['feedbackBefore', 'explainPartBefore']],
  ['wrong, lesson without this answer, correct', [R('incorrect'), S('lesson'), R('correct')], 'correctWithHelp', ['feedbackBefore', 'lessonBefore']],
  ['visual and other help, correct', [S('visual'), S('lesson'), R('correct')], 'correctWithHelp', ['visualBefore', 'lessonBefore']],
  ['reveal, correct', [S('answer-reveal'), R('correct')], 'correctAfterExplanation', ['reveal_explanation']],
  ['wrong, visual help, counting all, correct', [R('incorrect'), S('visual'), S('counting-complete'), R('correct')], 'correctAfterExplanation', ['feedbackBefore', 'visualBefore', 'reveal_counting']],
  ['invalid, correct', [R('invalid'), R('correct')], 'correctFirst', []],
  ['invalid, visual help, correct', [R('invalid'), S('visual'), R('correct')], 'correctWithVisualHelp', ['visualBefore']],
  ['wrong, correct, then visual help', [R('incorrect'), R('correct'), S('visual')], 'correctAfterFeedback', ['visualAfter']],
  ['correct, then explanation', [R('correct'), S('explanation')], 'correctFirst', ['explainAfter']],
  ['wrong only', [R('incorrect')], 'notYetCorrect', []],
  ['skipped', [{ type: 'skip' }], 'skipped', []],
  ['nothing', [], 'unfinished', []],
];
for (const [name, evs, outcome, tags] of SEQUENCES) {
  test(`observations: ${name}`, () => {
    const s = summarizeDelivery(run(evs), 'd');
    assert.equal(s.outcome, outcome);
    assert.deepEqual(s.tags, tags);
  });
}

// ---- Round-03 review fixes ------------------------------------------------------

test('R03-01: a check session never produces a practice suggestion (no crash on Home)', () => {
  const evs = [
    { seq: 1, type: 'session-start', session: 'p', skill: 'arithmetic.add-within-20', variant: 'within-10', mode: 'practice', prov: 'guest' },
    { seq: 2, type: 'delivery', delivery: 'd1', session: 'p', qid: 'q1', variant: 'within-10', prov: 'guest' },
    { seq: 3, type: 'response', delivery: 'd1', result: 'correct', prov: 'guest' },
    { seq: 4, type: 'session-start', session: 'c', skill: 'arithmetic.add-within-20', variant: 'check', mode: 'check', prov: 'guest' },
    { seq: 5, type: 'delivery', delivery: 'd2', session: 'c', qid: 'c1', variant: 'check', prov: 'guest' },
  ];
  const s = suggestNext(evs, 'arithmetic.add-within-20', variants);
  assert.equal(s.variant, 'within-10');
  // Only a check: no suggestion rather than an unknown variant
  assert.equal(suggestNext(evs.slice(3), 'arithmetic.add-within-20', variants), null);
});

test('R03-02: the lesson shows the answer to 8 + 5 and x + 3 = 7, but not to 9 + 4', () => {
  const bonds = readFileSync(new URL('../src/content/lessons/number-bonds-to-ten/en.md', import.meta.url), 'utf8');
  const bondsNb = readFileSync(new URL('../src/content/lessons/number-bonds-to-ten/nb.md', import.meta.url), 'utf8');
  const balance = readFileSync(new URL('../src/content/lessons/equations-as-a-balance/en.md', import.meta.url), 'utf8');
  for (const md of [bonds, bondsNb]) {
    assert.equal(lessonDisclosure(md, { kind: 'addition', a: 8, b: 5 }).discloses, true);
    assert.equal(lessonDisclosure(md, { kind: 'addition', a: 9, b: 4 }).discloses, false);
    assert.equal(lessonDisclosure(md, { kind: 'addition', a: 3, b: 7 }).discloses, true); // the table of pairs
    assert.equal(lessonDisclosure(md, { kind: 'addition', a: 4, b: 4 }).discloses, false);
  }
  assert.equal(lessonDisclosure(balance, { kind: 'linear', a: 3, c: 7 }).discloses, true);
  assert.equal(lessonDisclosure(balance, { kind: 'linear', a: 9, c: 13 }).discloses, false);
  // Recorded outcomes: a revealing detour is not "no help"; a plain one is "with help"
  assert.equal(summarizeDelivery(run([{ type: 'support', support: 'lesson-reveal' }, { type: 'response', result: 'correct' }]), 'd').outcome, 'correctAfterExplanation');
  assert.equal(summarizeDelivery(run([{ type: 'support', support: 'lesson' }, { type: 'response', result: 'correct' }]), 'd').outcome, 'correctWithHelp');
  // A detour after answering leaves the earlier answer as it was
  assert.equal(summarizeDelivery(run([{ type: 'response', result: 'correct' }, { type: 'support', support: 'lesson-reveal' }]), 'd').outcome, 'correctFirst');
});

test('R03-03: counting all is an answer reveal; opening the explanation is not until the revealing step', () => {
  const counted = summarizeDelivery(run([{ type: 'support', support: 'visual' }, { type: 'support', support: 'counting' }, { type: 'support', support: 'counting-complete' }, { type: 'response', result: 'correct' }]), 'd');
  assert.equal(counted.outcome, 'correctAfterExplanation');
  assert.deepEqual(counted.revealSources, ['counting']);
  const viewed = summarizeDelivery(run([{ type: 'support', support: 'visual' }, { type: 'response', result: 'correct' }]), 'd');
  assert.equal(viewed.outcome, 'correctWithVisualHelp');
  // Opened at step 1 and closed: help, not a reveal
  const part = summarizeDelivery(run([{ type: 'support', support: 'explanation-open', step: 0 }, { type: 'support', support: 'explanation-step', step: 1, reveals: false }, { type: 'response', result: 'correct' }]), 'd');
  assert.equal(part.outcome, 'correctWithHelp');
  assert.ok(part.tags.includes('explainPartBefore'));
  const full = summarizeDelivery(run([{ type: 'support', support: 'explanation-open', step: 0 }, { type: 'support', support: 'explanation-step', step: 3, reveals: true }, { type: 'response', result: 'correct' }]), 'd');
  assert.equal(full.outcome, 'correctAfterExplanation');
  assert.deepEqual(full.tags, ['reveal_explanation']);
  // Steps before the revealing step never contain the answer
  for (const [id, v] of Object.entries(variants)) {
    v.pool.forEach((_, i) => {
      const q = instance(id, i);
      const steps = explanationSteps(v.explanation, q);
      const ans = q.kind === 'addition' ? q.a + q.b : q.c - q.a;
      const r = firstRevealStep(steps);
      assert.ok(r > 0, `${q.id} has a revealing step after the first`);
      steps.slice(0, r).forEach((st) => assert.ok(!st.eq.split(' = ').slice(1).includes(String(ans)) && st.eq !== `x = ${ans}`, `${q.id} step before reveal hides ${ans}: ${st.eq}`));
    });
  }
});

test('R03-04 (balance): the check step pictures x replaced by its value, not x alone', () => {
  const steps = explanationSteps('balance', { a: 3, c: 7 });
  assert.equal(steps.at(-1).eq, '4 + 3 = 7');
  assert.equal(steps.at(-1).visual.phase, 4);
  assert.notEqual(steps.at(-2).visual.phase, steps.at(-1).visual.phase);
});

test('R03-05: a check keeps its independent / supported boundary in the session summary', () => {
  const evs = [
    { seq: 1, type: 'session-start', session: 'c', skill: 's', variant: 'check', mode: 'check' },
    { seq: 2, type: 'delivery', delivery: 'a', session: 'c' }, { seq: 3, type: 'response', delivery: 'a', result: 'correct' },
    { seq: 4, type: 'delivery', delivery: 'b', session: 'c' }, { seq: 5, type: 'check-switch', session: 'c', delivery: 'b' },
    { seq: 6, type: 'response', delivery: 'b', result: 'correct' },
  ];
  const s = summarizeSession(evs, 'c');
  assert.deepEqual(s.items.map((i) => [i.outcome, i.segment]), [['correctFirst', 'independent'], ['correctFirst', 'supported']]);
});

test('R03-07: a resumed question keeps the support context of the first delivery', () => {
  const evs = [
    { seq: 1, type: 'delivery', delivery: 'old', session: 's1' },
    { seq: 2, type: 'support', delivery: 'old', support: 'visual' },
    { seq: 3, type: 'session-end', session: 's1' },
    { seq: 4, type: 'delivery', delivery: 'new', session: 's2', resumedFrom: 'old' },
    { seq: 5, type: 'response', delivery: 'new', result: 'correct' },
  ];
  assert.equal(summarizeDelivery(evs, 'new').outcome, 'correctWithVisualHelp');
  assert.equal(summarizeDelivery(evs, 'old').outcome, 'unfinished');
});

test('R03 summaries: tags do not repeat what the outcome already says', () => {
  const s = summarizeDelivery(run([{ type: 'response', result: 'incorrect' }, { type: 'support', support: 'explanation-open' }, { type: 'support', support: 'explanation-step', step: 3, reveals: true }, { type: 'response', result: 'correct' }]), 'd');
  // The answer was shown after an incorrect response but before the correct one
  assert.equal(s.outcome, 'correctAfterExplanation');
  assert.deepEqual(s.tags, ['feedbackBefore', 'reveal_explanation']);
  // After a correct answer, the explanation is only a tag
  const after = summarizeDelivery(run([{ type: 'response', result: 'correct' }, { type: 'support', support: 'explanation-open' }, { type: 'support', support: 'explanation-step', step: 3, reveals: true }]), 'd');
  assert.equal(after.outcome, 'correctFirst'); assert.deepEqual(after.tags, ['explainAfter']); assert.ok(after.revealedAfter);
});

// ---- Gemini round-03 ----------------------------------------------------------------

test('Gemini: help after an incorrect answer is help while solving, not "after answering"', () => {
  // Outcomes follow DL-029 (help-first); the wrong answer stays as a tag.
  const v = summarizeDelivery(run([{ type: 'response', result: 'incorrect' }, { type: 'support', support: 'visual' }, { type: 'response', result: 'correct' }]), 'd');
  assert.equal(v.outcome, 'correctWithVisualHelp');
  assert.deepEqual(v.tags, ['feedbackBefore', 'visualBefore']);
  const e = summarizeDelivery(run([{ type: 'response', result: 'incorrect' }, { type: 'support', support: 'explanation-open' }, { type: 'response', result: 'correct' }]), 'd');
  assert.equal(e.outcome, 'correctWithHelp');
  assert.deepEqual(e.tags, ['feedbackBefore', 'explainPartBefore']);
  assert.equal(e.explanationAfter, false);
  // Never both "answer shown" and "explanation opened after answering" for the same reveal
  const r = summarizeDelivery(run([{ type: 'response', result: 'incorrect' }, { type: 'support', support: 'explanation-open' }, { type: 'support', support: 'explanation-step', step: 3, reveals: true }, { type: 'response', result: 'correct' }]), 'd');
  assert.equal(r.outcome, 'correctAfterExplanation');
  assert.equal(r.explanationAfter, false);
});

test('Gemini: going back and forth to a lesson counts as one visit', () => {
  const m = 60 * 1000;
  const evs = [0, 2, 5, 40, 41, 200].map((min, i) => ({ seq: i + 1, at: min * m, type: 'lesson-viewed', lesson: 'L' }));
  assert.equal(lessonVisits(evs, 'L'), 3);
});
