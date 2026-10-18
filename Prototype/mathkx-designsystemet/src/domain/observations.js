// Progress observations (prototype). The log records what happened, in order.
// Summaries describe observed sequences; they are not mastery estimates.
//
// Event shapes (all carry seq, at, prov: 'guest' | 'profile' | 'guest-import' | 'sample'):
//  lesson-viewed   {lesson, lang}
//  session-start   {session, skill, variant, mode: 'practice' | 'check'}
//  delivery        {delivery, session, qid, variant, repeat, resumedFrom?}
//  support         {delivery, support, step?, lesson?}
//                    visual help:      'visual' | 'counting' | 'help-steps'
//                    other help:       'explanation-open' (explanation opened, answer not yet shown)
//                                      'lesson' (lesson opened from the exercise; it does not show this answer)
//                    answer shown:     'explanation-step' with reveals: true, 'counting-complete',
//                                      'lesson-reveal', 'answer-reveal' (older records)
//                    'explanation-step' with reveals: false is recorded for order only
//                    'explanation' (older records: opened after answering)
//  response        {delivery, answer, result: 'correct' | 'incorrect' | 'invalid', code}
//  skip            {delivery}
//  challenge       {session, from, to, request: 'easier' | 'harder' | 'same' | 'another' | 'undo',
//                   outcome: 'requested' (chosen) | 'applied' (next question uses it) | 'cleared' | 'unavailable' | 'repeat' | 'replaced'}
//  check-switch    {session, delivery}
//  session-end     {session, reason?: 'finished' | 'replaced' | 'imported'}

const VISUAL = new Set(['visual', 'counting', 'help-steps']);
const OTHER_HELP = new Set(['explanation-open', 'lesson', 'explanation']);
const EXPLAIN_ANY = new Set(['explanation', 'explanation-open', 'explanation-step', 'answer-reveal']);

/** Which source showed the answer, or null if this support event did not show it. */
export function revealSource(e) {
  if (e.type !== 'support') return null;
  if (e.support === 'answer-reveal') return 'explanation';
  if (e.support === 'explanation-step' && e.reveals) return 'explanation';
  if (e.support === 'counting-complete') return 'counting';
  if (e.support === 'lesson-reveal') return 'lesson';
  return null;
}

/** Ids of a delivery and the deliveries it continues (a resumed question keeps its support context). */
function chain(events, deliveryId) {
  const ids = [deliveryId];
  let cur = deliveryId;
  for (let guard = 0; guard < 20; guard++) {
    const d = events.find((e) => e.type === 'delivery' && e.delivery === cur);
    if (!d?.resumedFrom) break;
    ids.push(d.resumedFrom); cur = d.resumedFrom;
  }
  return ids;
}

/**
 * Summarize one delivery (one question shown once in one session).
 * Outcome order: an answer shown before the correct response wins; then an
 * earlier incorrect response; then help that did not show the answer.
 */
export function summarizeDelivery(events, deliveryId) {
  const ids = new Set(chain(events, deliveryId));
  const evs = events.filter((e) => ids.has(e.delivery) && e.type !== 'delivery').sort((x, y) => x.seq - y.seq);
  const before = new Set(); const reveals = new Set();
  let incorrectBefore = 0; let invalid = 0; let firstMathSeq = null;
  let outcome = null; let skipped = false; let explainAfterSeen = false;
  let revealedAfter = false;
  const tags = new Set();
  const responses = [];
  for (const e of evs) {
    if (e.type === 'support') {
      // "While solving" means before the first correct response, even after an
      // incorrect one (Gemini round-03): help used to find the answer is shown as
      // such, and only support after the correct answer counts as "after".
      const src = revealSource(e);
      const after = outcome != null;
      if (after && EXPLAIN_ANY.has(e.support)) explainAfterSeen = true;
      if (src) {
        if (!after) { reveals.add(src); tags.add(`reveal_${src}`); } else revealedAfter = true;
      } else if (VISUAL.has(e.support)) tags.add(after ? 'visualAfter' : 'visualBefore');
      else if (!after && e.support === 'lesson') tags.add('lessonBefore');
      else if (!after && (e.support === 'explanation-open' || e.support === 'explanation')) tags.add('explainPartBefore');
      before.add(e.support);
    }
    if (e.type === 'skip' && e.delivery === deliveryId) skipped = true;
    if (e.type !== 'response') continue;
    if (e.result === 'invalid') { invalid++; continue; }
    if (firstMathSeq == null) firstMathSeq = e.seq;
    responses.push({ result: e.result, answer: e.answer, support: [...before] });
    if (e.result === 'correct' && !outcome) {
      const sup = [...before];
      if (reveals.size) outcome = 'correctAfterExplanation';
      else if (incorrectBefore > 0) outcome = 'correctAfterFeedback';
      else if (sup.some((x) => OTHER_HELP.has(x))) outcome = 'correctWithHelp';
      else if (sup.some((x) => VISUAL.has(x))) outcome = 'correctWithVisualHelp';
      else outcome = 'correctFirst';
    }
    if (e.result === 'incorrect') incorrectBefore++;
  }
  if (!outcome) outcome = responses.length ? 'notYetCorrect' : skipped ? 'skipped' : 'unfinished';
  // "Explanation opened after answering" is shown when it adds information:
  // not when the outcome already says the answer was shown.
  const explanationAfter = explainAfterSeen;
  if (explanationAfter) tags.add('explainAfter');
  if (tags.has('explainPartBefore') && reveals.has('explanation')) tags.delete('explainPartBefore');
  const visualBeforeCorrect = outcome === 'correctAfterFeedback' && responses.find((r) => r.result === 'correct')?.support.some((x) => VISUAL.has(x));
  return {
    delivery: deliveryId, outcome, responses, invalid, explanationAfter, revealedAfter,
    revealSources: [...reveals], countedAll: before.has('counting-complete'), visualBeforeCorrect,
    tags: TAG_ORDER.filter((t) => tags.has(t)), events: evs,
  };
}

const TAG_ORDER = ['visualBefore', 'lessonBefore', 'explainPartBefore', 'reveal_explanation', 'reveal_counting', 'reveal_lesson', 'visualAfter', 'explainAfter'];

export const OUTCOMES = ['correctFirst', 'correctWithVisualHelp', 'correctWithHelp', 'correctAfterFeedback', 'correctAfterExplanation', 'notYetCorrect', 'skipped', 'unfinished'];
/** Outcomes where the learner's own correct answer came before any answer was shown. */
export const SOLVED = new Set(['correctFirst', 'correctWithVisualHelp', 'correctWithHelp', 'correctAfterFeedback']);

export function summarizeSession(events, sessionId) {
  const deliveries = events.filter((e) => e.type === 'delivery' && e.session === sessionId).sort((a, b) => a.seq - b.seq);
  const switchEv = events.find((e) => e.type === 'check-switch' && e.session === sessionId);
  const switchIndex = switchEv ? deliveries.findIndex((d) => d.delivery === switchEv.delivery) : -1;
  const items = deliveries.map((d, i) => ({
    ...summarizeDelivery(events, d.delivery), qid: d.qid, variant: d.variant, repeat: d.repeat, resumedFrom: d.resumedFrom, at: d.at, prov: d.prov,
    segment: switchIndex >= 0 && i >= switchIndex ? 'supported' : 'independent',
  }));
  const counts = Object.fromEntries(OUTCOMES.map((o) => [o, items.filter((i) => i.outcome === o).length]));
  const endEv = events.find((e) => e.type === 'session-end' && e.session === sessionId);
  const start = events.find((e) => e.type === 'session-start' && e.session === sessionId);
  return { session: sessionId, start, ended: !!endEv, endReason: endEv?.reason ?? (endEv ? 'finished' : null), items, counts, switchIndex };
}

export function sessionsFor(events, skill) {
  return events.filter((e) => e.type === 'session-start' && (!skill || e.skill === skill)).sort((a, b) => b.seq - a.seq);
}

/**
 * A suggestion with a reason the learner can read. Never a judgement.
 * Only the learner's own practice sessions are used: checks have their own
 * summary, and imported guest work is history, not the learner's current place.
 */
export function suggestNext(events, skill, variantsById) {
  const sessions = sessionsFor(events, skill).filter((s) => s.mode !== 'check' && s.prov !== 'guest-import');
  if (!sessions.length) return null;
  const latest = summarizeSession(events, sessions[0].session);
  const v = latest.items.at(-1)?.variant ?? sessions[0].variant;
  if (variantsById && !variantsById[v]) return null;
  if (!latest.ended && latest.items.some((i) => i.outcome === 'unfinished')) return { kind: 'continue', variant: v, reason: 'unfinished' };
  const recent = latest.items.slice(-3);
  const supported = latest.items.filter((i) => ['correctAfterExplanation', 'notYetCorrect', 'correctAfterFeedback'].includes(i.outcome));
  if (supported.length) return { kind: 'same', variant: supported.at(-1).variant, reason: supported.at(-1).outcome, qid: supported.at(-1).qid };
  if (recent.length === 3 && recent.every((i) => i.outcome === 'correctFirst' && i.variant === v)) return { kind: 'harder', variant: v, reason: 'threeFirst' };
  return { kind: 'same', variant: v, reason: 'keepGoing' };
}

/**
 * Lesson visits: opens of the same lesson less than 30 minutes apart count as one
 * visit, so going back and forth between an exercise and its lesson does not
 * inflate the count (Gemini round-03).
 */
export function lessonVisits(events, lesson, gapMs = 30 * 60 * 1000) {
  const views = events.filter((e) => e.type === 'lesson-viewed' && e.lesson === lesson).sort((a, b) => a.seq - b.seq);
  let n = 0; let last = -Infinity;
  for (const v of views) { if ((v.at ?? 0) - last >= gapMs) n++; last = v.at ?? 0; }
  return n;
}
