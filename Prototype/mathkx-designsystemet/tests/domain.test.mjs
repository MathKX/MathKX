// Prototype domain checks: run with `npm test` (node --test). Not a production test suite.
import test from 'node:test';
import assert from 'node:assert/strict';
import { parseNotation, notationText } from '../src/domain/notation.js';
import { parseNumber } from '../src/domain/numbers.js';
import { explanationSteps, helpSteps, supports } from '../src/domain/explanations.js';
import { variants, instance, nextInstance, stepVariant } from '../src/domain/practice.js';
import { summarizeDelivery } from '../src/domain/observations.js';
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
test('observations follow the order of events', () => {
  assert.equal(summarizeDelivery(run([{ type: 'response', result: 'correct' }]), 'd').outcome, 'correctFirst');
  assert.equal(summarizeDelivery(run([{ type: 'support', support: 'visual' }, { type: 'response', result: 'correct' }]), 'd').outcome, 'correctWithVisualHelp');
  assert.equal(summarizeDelivery(run([{ type: 'response', result: 'incorrect' }, { type: 'response', result: 'correct' }]), 'd').outcome, 'correctAfterFeedback');
  assert.equal(summarizeDelivery(run([{ type: 'support', support: 'answer-reveal' }, { type: 'response', result: 'correct' }]), 'd').outcome, 'correctAfterExplanation');
  // Invalid input is not a mathematical failure
  assert.equal(summarizeDelivery(run([{ type: 'response', result: 'invalid' }, { type: 'response', result: 'correct' }]), 'd').outcome, 'correctFirst');
  // Explanation after a correct answer does not relabel it
  const s = summarizeDelivery(run([{ type: 'response', result: 'correct' }, { type: 'support', support: 'explanation' }]), 'd');
  assert.equal(s.outcome, 'correctFirst'); assert.equal(s.explanationAfter, true);
  assert.equal(summarizeDelivery(run([{ type: 'skip' }]), 'd').outcome, 'skipped');
  assert.equal(summarizeDelivery(run([]), 'd').outcome, 'unfinished');
});
