// Progress observations (prototype). The log records what happened, in order.
// Summaries describe observed sequences; they are not mastery estimates.
//
// Event shapes (all carry seq, at, prov: 'guest' | 'profile' | 'guest-import' | 'sample'):
//  lesson-viewed   {lesson, lang}
//  session-start   {session, skill, variant, mode: 'practice' | 'check'}
//  delivery        {delivery, session, qid, variant, repeat}
//  support         {delivery, support: 'visual' | 'counting' | 'counting-complete' | 'help-steps' | 'explanation' | 'answer-reveal', step?}
//  response        {delivery, answer, result: 'correct' | 'incorrect' | 'invalid', code}
//  skip            {delivery}
//  challenge       {session, from, to, request: 'easier' | 'harder' | 'same' | 'another', outcome: 'applied' | 'unavailable' | 'repeat'}
//  check-switch    {session, delivery}
//  session-end     {session}

const TEACHING = new Set(['visual', 'counting', 'counting-complete', 'help-steps']);
const EXPLAIN = new Set(['explanation', 'answer-reveal']);

/** Summarize one delivery (one question shown once in one session). */
export function summarizeDelivery(events, deliveryId) {
  const evs = events.filter((e) => e.delivery === deliveryId).sort((x, y) => x.seq - y.seq);
  const before = new Set();
  let incorrectBefore = 0; let invalid = 0; let firstMathSeq = null;
  let outcome = null; let skipped = false; let explanationAfter = false; let countedAll = false;
  const responses = [];
  for (const e of evs) {
    if (e.type === 'support') {
      if (firstMathSeq != null && EXPLAIN.has(e.support)) explanationAfter = true;
      if (e.support === 'counting-complete') countedAll = true;
      before.add(e.support);
    }
    if (e.type === 'skip') skipped = true;
    if (e.type !== 'response') continue;
    if (e.result === 'invalid') { invalid++; continue; }
    if (firstMathSeq == null) firstMathSeq = e.seq;
    responses.push({ result: e.result, answer: e.answer, support: [...before] });
    if (e.result === 'correct' && !outcome) {
      const sup = [...before];
      if (sup.some((x) => EXPLAIN.has(x))) outcome = 'correctAfterExplanation';
      else if (incorrectBefore > 0) outcome = 'correctAfterFeedback';
      else if (sup.some((x) => TEACHING.has(x))) outcome = 'correctWithVisualHelp';
      else outcome = 'correctFirst';
    }
    if (e.result === 'incorrect') incorrectBefore++;
  }
  if (!outcome) outcome = responses.length ? 'notYetCorrect' : skipped ? 'skipped' : 'unfinished';
  const visualBeforeCorrect = outcome === 'correctAfterFeedback' && responses.find((r) => r.result === 'correct')?.support.some((x) => TEACHING.has(x));
  return { delivery: deliveryId, outcome, responses, invalid, explanationAfter, countedAll, visualBeforeCorrect, events: evs };
}

export const OUTCOMES = ['correctFirst', 'correctWithVisualHelp', 'correctAfterFeedback', 'correctAfterExplanation', 'notYetCorrect', 'skipped', 'unfinished'];

export function summarizeSession(events, sessionId) {
  const deliveries = events.filter((e) => e.type === 'delivery' && e.session === sessionId).sort((a, b) => a.seq - b.seq);
  const items = deliveries.map((d) => ({ ...summarizeDelivery(events, d.delivery), qid: d.qid, variant: d.variant, repeat: d.repeat, at: d.at }));
  const counts = Object.fromEntries(OUTCOMES.map((o) => [o, items.filter((i) => i.outcome === o).length]));
  const ended = events.some((e) => e.type === 'session-end' && e.session === sessionId);
  const start = events.find((e) => e.type === 'session-start' && e.session === sessionId);
  return { session: sessionId, start, ended, items, counts };
}

export function sessionsFor(events, skill) {
  return events.filter((e) => e.type === 'session-start' && (!skill || e.skill === skill)).sort((a, b) => b.seq - a.seq);
}

/** A suggestion with a reason the learner can read. Never a judgement. */
export function suggestNext(events, skill, variantsById) {
  const sessions = sessionsFor(events, skill);
  if (!sessions.length) return null;
  const latest = summarizeSession(events, sessions[0].session);
  const v = latest.items.at(-1)?.variant ?? sessions[0].variant;
  if (!latest.ended && latest.items.some((i) => i.outcome === 'unfinished')) return { kind: 'continue', variant: v, reason: 'unfinished' };
  const recent = latest.items.slice(-3);
  const supported = latest.items.filter((i) => ['correctAfterExplanation', 'notYetCorrect', 'correctAfterFeedback'].includes(i.outcome));
  if (supported.length) return { kind: 'same', variant: supported.at(-1).variant, reason: supported.at(-1).outcome, qid: supported.at(-1).qid };
  if (recent.length === 3 && recent.every((i) => i.outcome === 'correctFirst' && i.variant === v)) return { kind: 'harder', variant: v, reason: 'threeFirst' };
  return { kind: 'same', variant: v, reason: 'keepGoing' };
}
