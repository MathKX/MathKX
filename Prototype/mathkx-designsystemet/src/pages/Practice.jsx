import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Card, Heading, Paragraph, Link, Tag, Alert, List, Details } from '@digdir/designsystemet-react';
import { ArrowRightIcon } from '@navikt/aksel-icons';
import { useStore, useLearner, go } from '../store.jsx';
import { checks, findTopic, lessons } from '../content/catalog.js';
import { kinds } from '../domain/math.js';
import { skills, variants, stepVariant } from '../domain/practice.js';
import { summarizeDelivery, summarizeSession, OUTCOMES, SOLVED } from '../domain/observations.js';
import { ExerciseShell } from '../components/ExerciseShell.jsx';
import { MathExpr } from '../components/math/MathExpr.jsx';
import { StepPlayer } from '../components/math/Visuals.jsx';
import { explanationSteps } from '../domain/explanations.js';
import { PageHead } from '../components/Page.jsx';
import { parseLesson } from '../components/Markdown.jsx';

function crumbsFor(topicId, L, t, last) {
  const { domain, topic } = findTopic(topicId);
  return [{ href: '#/library', label: t('library.title') }, { href: `#/domain/${domain.id}`, label: L(domain.title) }, { href: `#/topic/${topic.id}`, label: L(topic.title) }, last];
}

export function OutcomeTag({ outcome }) {
  const { t } = useStore();
  const color = { correctFirst: 'success', correctWithVisualHelp: 'info', correctWithHelp: 'info', correctAfterFeedback: 'info', correctAfterExplanation: 'info', notYetCorrect: 'warning', skipped: 'neutral', unfinished: 'neutral' }[outcome];
  return <Tag data-size="sm" data-color={color} variant={outcome === 'unfinished' || outcome === 'skipped' ? 'outline' : 'default'}>{t(`outcome.${outcome}`)}</Tag>;
}

/** The support context of one delivery, in the order it happened, plus origin labels. */
export function DeliveryTags({ item, showGuest = false }) {
  const { t } = useStore();
  const extra = [];
  if (item.repeat) extra.push(t('practice.repeatTag'));
  if (item.resumedFrom) extra.push(t('practice.resumedTag'));
  if (item.segment === 'supported') extra.push(t('check.supportedTag'));
  const guest = showGuest && (item.prov === 'guest' || item.prov === 'guest-import');
  return (
    <>
      {item.tags.filter((k) => !k.startsWith('reveal_') || item.outcome !== 'correctAfterExplanation' || item.revealSources.length > 0).map((k) => <Tag key={k} data-size="sm" data-color="neutral">{t(`support.${k}`)}</Tag>)}
      {extra.map((x) => <Tag key={x} data-size="sm" data-color="neutral">{x}</Tag>)}
      {guest && <Tag data-size="sm" data-color="neutral" variant="outline">{t('home.fromGuest')}</Tag>}
    </>
  );
}

/** Practice entry point used by lessons (:::practice) and topic pages. */
export function PracticeEntry({ skill, variant }) {
  const { t, L, state } = useStore();
  const v = variants[variant];
  const active = state.learner.active[skill];
  const activeVariant = active ? state.learner.deliveries[state.learner.sessions[active]?.current]?.q.variant : null;
  return (
    <Card data-color="accent" variant="tinted">
      <Heading level={3} data-size="xs">{L(v.title)}</Heading>
      <Paragraph data-size="sm">{L(v.describe)} {t('practice.entryNote')}</Paragraph>
      <div className="flex flex-wrap gap-2">
        <Button asChild><a href={`#/practice/${skill}?variant=${variant}`}>{active && activeVariant === variant ? t('practice.resume') : t('topic.startPractice')}<ArrowRightIcon aria-hidden="true" /></a></Button>
      </div>
    </Card>
  );
}

export function PracticePage({ skillId, query }) {
  const { t, L, state, lang } = useStore();
  const learner = useLearner();
  const sk = skills[skillId];
  const sid = state.learner.active[skillId];
  const session = sid ? state.learner.sessions[sid] : null;
  const [notice, setNotice] = useState(null);
  // A variation requested by the link is handled once, when the page opens. Later
  // challenge changes in the session must not bring the question back (R03).
  const [choice, setChoice] = useState(null);
  const handled = useRef(false);

  useEffect(() => {
    if (!sk || handled.current) return;
    handled.current = true;
    const requested = query?.get('variant');
    const resume = query?.get('resume');
    if (resume && state.learner.deliveries[resume] && !session) {
      learner.startPractice(skillId, undefined, { resume });
      setNotice({ kind: 'resumed' });
    } else if (!session) learner.startPractice(skillId, requested ?? undefined);
    else {
      const curVariant = state.learner.deliveries[session.current]?.q.variant;
      if (requested && variants[requested] && requested !== curVariant) setChoice(requested);
    }
    learner.setLast({ href: `#/practice/${skillId}`, kind: 'practice', skill: skillId });
    // Drop the one-off request from the address so a reload does not repeat it.
    if (requested || resume) { try { window.history.replaceState(null, '', `#/practice/${skillId}`); } catch { /* ignore */ } }
  }, [skillId]); // eslint-disable-line

  if (!sk) return <div className="mkx-container py-10"><h1>404</h1></div>;
  if (!session?.current) return <div className="mkx-container py-10" aria-busy="true" />;

  const d = state.learner.deliveries[session.current];
  const q = d.q;
  const v = variants[q.variant];
  const sum = summarizeDelivery(state.learner.events, d.id);
  const answered = sum.responses.length > 0;
  const position = session.deliveries.length;
  const baseVariant = session.pending ?? q.variant;
  const easier = stepVariant(baseVariant, 'easier');
  const harder = stepVariant(baseVariant, 'harder');
  const ladder = sk.ladder;
  const pending = session.pending;
  const pendingDir = pending ? (ladder.indexOf(pending) < ladder.indexOf(q.variant) ? 'easier' : 'harder') : null;

  const move = (request) => {
    const prevLabel = kinds[q.kind].plain(q);
    if (!answered) learner.log({ type: 'skip', delivery: d.id });
    const out = learner.next(sid, request);
    setChoice(null);
    setNotice({ ...out, prev: prevLabel, prevAnswered: answered });
  };
  const challenge = (dir) => { setChoice(null); setNotice(learner.challenge(sid, dir)); };

  const finish = () => { learner.endSession(sid); go(`#/practice/${skillId}/summary/${sid}`); };

  const noticeText = (() => {
    if (!notice) return '';
    if (notice.kind === 'resumed') return t('practice.resumedNotice', { q: kinds[q.kind].plain(q) });
    if (notice.kind === 'unavailable') return L(sk.unavailable[notice.request]);
    if (notice.kind === 'pending') return t('practice.pending', { variant: L(variants[notice.variant].title) });
    if (notice.kind === 'cleared') return t('practice.cleared', { variant: L(variants[notice.variant].title) });
    const parts = [];
    if (notice.prev) parts.push(notice.prevAnswered ? t('practice.prevKept', { q: notice.prev }) : t('practice.prevSkipped', { q: notice.prev }));
    if (notice.dropped) parts.push(t('practice.droppedPending', { dropped: L(variants[notice.dropped].title), variant: L(variants[notice.variant].title) }));
    if (notice.changed) parts.push(t('practice.nowVariant', { variant: L(variants[notice.variant].title) }));
    if (notice.kind === 'repeat') parts.push(t('practice.repeat', { n: notice.poolSize, variant: L(variants[notice.variant].title) }));
    return parts.join(' ');
  })();

  const controls = (
    <section className="mkx-panel flex flex-col gap-3" aria-labelledby="next-h">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <Heading level={2} data-size="2xs" id="next-h" className="m-0">{t('practice.nextTitle')}</Heading>
        <span className="text-sm" style={{ color: 'var(--ds-color-neutral-text-subtle)' }}>{t('practice.appliesNext')}</span>
      </div>
      {pending && (
        <div className="flex flex-wrap items-center gap-2">
          <Tag data-color="accent" data-size="sm">{t('practice.nextWillBe', { variant: L(variants[pending].title) })}</Tag>
          <Button variant="tertiary" data-size="sm" onClick={() => { learner.clearPending(sid); setNotice(null); }}>{t('practice.undoChange')}</Button>
        </div>
      )}
      {!answered && <Paragraph data-size="sm" className="m-0">{t('practice.skipNote')}</Paragraph>}
      <div className="grid gap-2 sm:grid-cols-2">
        <Button variant={sum.outcome?.startsWith('correct') ? 'primary' : 'secondary'} className="w-full" onClick={() => move('another')}>{t('practice.another')}</Button>
        <Button variant="secondary" onClick={() => move('same')} className="w-full flex-col items-start h-auto py-2">
          <span>{t('practice.same')}</span>
          <span className="text-sm font-normal">{pending ? t('practice.sameReplaces', { variant: L(v.title) }) : L(v.title)}</span>
        </Button>
        <Button variant="secondary" aria-pressed={pendingDir === 'easier' ? true : undefined} onClick={() => challenge('easier')} className="w-full flex-col items-start h-auto py-2">
          <span>{t('practice.easier')}</span>
          <span className="text-sm font-normal">{easier ? (easier === q.variant ? t('practice.keepThis', { variant: L(variants[easier].title) }) : L(variants[easier].title)) : t('practice.noneInPrototype')}</span>
        </Button>
        <Button variant="secondary" aria-pressed={pendingDir === 'harder' ? true : undefined} onClick={() => challenge('harder')} className="w-full flex-col items-start h-auto py-2">
          <span>{t('practice.harder')}</span>
          <span className="text-sm font-normal">{harder ? (harder === q.variant ? t('practice.keepThis', { variant: L(variants[harder].title) }) : L(variants[harder].title)) : t('practice.noneInPrototype')}</span>
        </Button>
      </div>
      <p role="status" className="m-0 text-sm empty:hidden">{notice?.kind === 'replaced' ? '' : noticeText}</p>
      <div className="flex flex-col gap-1 pt-1 border-t" style={{ borderColor: 'var(--ds-color-neutral-border-subtle)' }}>
        <div><Button variant="tertiary" onClick={finish}>{t('practice.finish')}</Button></div>
        <Paragraph data-size="sm" className="m-0">{answered ? t('practice.finishNote') : t('practice.finishNoteOpen', { q: kinds[q.kind].plain(q) })}</Paragraph>
      </div>
    </section>
  );

  return (
    <div className="mkx-container pb-8">
      <PageHead compact title={L(sk.title)} crumbs={crumbsFor(sk.topic, L, t, { href: `#/practice/${skillId}`, label: t('topic.practice') })}
        eyebrow={<div className="flex flex-wrap items-center gap-2 mb-2"><Tag data-color="accent" data-size="sm">{L(v.title)}</Tag><span className="text-sm">{L(v.describe)}</span></div>} />
      {choice && (
        <Alert data-color="info" className="mb-4">
          <Paragraph>{t('practice.activeChoice', { current: L(v.title), requested: L(variants[choice].title) })}</Paragraph>
          <Paragraph data-size="sm">{t('practice.activeChoiceNote')}</Paragraph>
          <div className="flex flex-wrap gap-2 mt-2">
            <Button data-color="accent" data-size="sm" variant="secondary" onClick={() => setChoice(null)}>{t('practice.keepCurrent')}</Button>
            <Button data-color="accent" data-size="sm" onClick={() => { const r = learner.startPractice(skillId, choice, { force: true }); setChoice(null); setNotice(r.replaced ? { kind: 'replaced', session: r.replaced } : null); }}>{t('practice.startRequested', { requested: L(variants[choice].title) })}</Button>
          </div>
        </Alert>
      )}
      {notice?.kind === 'replaced' && (
        <Alert data-color="info" className="mb-4">
          <Paragraph>{t('practice.replacedNotice')} <Link href={`#/practice/${skillId}/summary/${notice.session}`}>{t('practice.replacedLink')}</Link></Paragraph>
        </Alert>
      )}
      <div className="grid gap-5">
        <ExerciseShell key={d.id} q={q} delivery={d.id} mode="practice"
          position={`${t('practice.position', { i: position })}${d.repeat ? ` · ${t('practice.repeatTag')}` : ''}${d.resumedFrom ? ` · ${t('practice.resumedTag')}` : ''}`}
          lessonHref={`#/lesson/${sk.lesson}?s=${q.kind === 'linear' ? 'both-sides' : q.a + q.b > 10 ? 'why' : 'what'}`} />
        {controls}
        {session.deliveries.length > 1 && (
          <Details>
            <Details.Summary>{t('practice.earlier', { n: session.deliveries.length - 1 })}</Details.Summary>
            <Details.Content>
              <ul className="list-none m-0 p-0 flex flex-col gap-2">
                {session.deliveries.slice(0, -1).reverse().map((id) => {
                  const dd = state.learner.deliveries[id]; const s = summarizeDelivery(state.learner.events, id);
                  return (
                    <li key={id} className="mkx-outcome-row">
                      <span aria-hidden="true" className="text-lg"><MathExpr expr={kinds[dd.q.kind].plain(dd.q)} /></span>
                      <span className="ds-sr-only">{kinds[dd.q.kind].spoken(dd.q)[lang]}</span>
                      <span className="flex flex-wrap gap-2"><OutcomeTag outcome={s.outcome} /><DeliveryTags item={{ ...s, repeat: dd.repeat, resumedFrom: dd.resumedFrom }} /></span>
                    </li>
                  );
                })}
              </ul>
            </Details.Content>
          </Details>
        )}
      </div>
    </div>
  );
}

export function SessionSummary({ skillId, sessionId }) {
  const { t, L, state, lang } = useStore();
  const learner = useLearner();
  const sk = skills[skillId];
  const s = useMemo(() => summarizeSession(state.learner.events, sessionId), [state.learner.events, sessionId]);
  if (!sk || !s.start) return <div className="mkx-container py-10"><h1>404</h1></div>;
  const answered = s.items.filter((i) => i.responses.length).length;
  // Correct before any answer was shown. Answers typed after a reveal are listed, not counted here.
  const solved = s.items.filter((i) => SOLVED.has(i.outcome)).length;
  const afterReveal = s.items.filter((i) => i.outcome === 'correctAfterExplanation').length;
  const lastVariant = s.items.at(-1)?.variant ?? s.start.variant;
  const again = (variant) => { learner.startPractice(skillId, variant, { force: true }); go(`#/practice/${skillId}`); };
  const resumable = state.learner.resumable?.[skillId];
  const resumeHere = resumable?.session === sessionId && !state.learner.active[skillId] ? state.learner.deliveries[resumable.delivery] : null;
  return (
    <div className="mkx-container pb-8">
      <PageHead title={t('session.title')} crumbs={crumbsFor(sk.topic, L, t, { href: `#/practice/${skillId}`, label: t('topic.practice') })}
        lead={`${t('session.lead', { shown: s.items.length, answered, skipped: s.counts.skipped, unfinished: s.counts.unfinished })} ${t(solved === 1 ? 'session.solved1' : 'session.solved', { n: solved })}${afterReveal ? ` ${t('session.afterReveal', { n: afterReveal })}` : ''}`} />
      {s.endReason === 'replaced' && <Alert data-color="info" className="mb-4 max-w-[44rem]"><Paragraph>{t('session.replacedNote')}</Paragraph></Alert>}
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section aria-labelledby="sum-h" className="flex flex-col gap-3">
          <Heading level={2} data-size="xs" id="sum-h">{t('session.questions')}</Heading>
          <ul className="list-none m-0 p-0 flex flex-col gap-2">
            {s.items.map((i) => {
              const dd = state.learner.deliveries[i.delivery];
              return (
                <li key={i.delivery} className="mkx-outcome-row">
                  <span className="flex items-center gap-3">
                    <span aria-hidden="true" className="text-xl"><MathExpr expr={kinds[dd.q.kind].plain(dd.q)} /></span>
                    <span className="ds-sr-only">{kinds[dd.q.kind].spoken(dd.q)[lang]}</span>
                    <span className="text-sm">{L(variants[i.variant]?.title ?? '')}{i.repeat ? ` · ${t('practice.repeatTag')}` : ''}</span>
                  </span>
                  <span className="flex flex-wrap gap-2 items-center">
                    <OutcomeTag outcome={i.outcome} />
                    <DeliveryTags item={i} />
                  </span>
                </li>
              );
            })}
          </ul>
          <Paragraph data-size="sm" style={{ color: 'var(--ds-color-neutral-text-subtle)' }}>{t('session.honest')}</Paragraph>
        </section>
        <aside className="flex flex-col gap-4">
          {resumeHere && (
            <Card data-color="accent" variant="tinted">
              <Heading level={2} data-size="xs">{t('session.resumeTitle')}</Heading>
              <Paragraph data-size="sm">{state.learner.work[resumeHere.id]?.answer ? t('session.resumeTyped', { q: kinds[resumeHere.q.kind].plain(resumeHere.q), a: state.learner.work[resumeHere.id].answer }) : t('session.resumeOpen', { q: kinds[resumeHere.q.kind].plain(resumeHere.q) })}</Paragraph>
              <div><Button asChild><a href={`#/practice/${skillId}?resume=${resumeHere.id}`}>{t('session.resumeBtn', { q: kinds[resumeHere.q.kind].plain(resumeHere.q) })}</a></Button></div>
            </Card>
          )}
          <Card data-color="accent" variant="tinted">
            <Heading level={2} data-size="xs">{t('session.continueTitle')}</Heading>
            <div className="flex flex-col gap-2">
              <Button onClick={() => again(lastVariant)}>{t('session.again', { variant: L(variants[lastVariant].title) })}</Button>
              {stepVariant(lastVariant, 'harder') && <Button variant="secondary" onClick={() => again(stepVariant(lastVariant, 'harder'))}>{t('practice.harder')}: {L(variants[stepVariant(lastVariant, 'harder')].title)}</Button>}
              {stepVariant(lastVariant, 'easier') && <Button variant="secondary" onClick={() => again(stepVariant(lastVariant, 'easier'))}>{t('practice.easier')}: {L(variants[stepVariant(lastVariant, 'easier')].title)}</Button>}
              <Button variant="tertiary" asChild><a href={`#/check/${findTopic(sk.topic).details.check}?new=1`}>{t('session.checkMine')}</a></Button>
            </div>
          </Card>
          <Card>
            <Paragraph data-size="sm">{t('session.later')}</Paragraph>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" asChild><a href={`#/progress/${skillId}`}>{t('progress.open')}</a></Button>
              <Button variant="tertiary" asChild><a href={`#/topic/${sk.topic}`}>{t('ex.backTopic')}</a></Button>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}

// ---- Self-check ---------------------------------------------------------------
export function CheckPage({ id, query }) {
  const { t, L, state, lang } = useStore();
  const learner = useLearner();
  const chk = checks[id];
  // "Check my understanding" (?new=1) always opens a fresh check; the last summary stays reachable.
  const [fresh, setFresh] = useState(() => query?.get('new') === '1' && state.learner.checks[id]?.status === 'done');
  if (!chk) return <div className="mkx-container py-10"><h1>404</h1></div>;
  const run = state.learner.checks[id] ?? { status: 'intro' };
  const n = chk.questions.length;
  const title = `${t('check.titlePrefix')}: ${L(chk.title)}`;
  const crumbs = crumbsFor(chk.topic, L, t, { href: `#/check/${id}`, label: t('check.titlePrefix') });

  const start = () => {
    const session = `chk-${id}-${Date.now().toString(36)}`;
    learner.log({ type: 'session-start', session, skill: chk.skill, variant: 'check', mode: 'check' });
    const d = learner.deliverFixed(session, { ...chk.questions[0], skill: chk.skill });
    learner.check(id, { status: 'running', session, index: 0, deliveries: [d], switchedAt: null, askingHelp: false });
  };
  const advance = () => {
    const next = run.index + 1;
    if (next >= n) {
      learner.log({ type: 'session-end', session: run.session });
      learner.check(id, { status: 'done', index: next, askingHelp: false });
      return;
    }
    const d = learner.deliverFixed(run.session, { ...chk.questions[next], skill: chk.skill });
    learner.check(id, (r) => ({ index: next, deliveries: [...r.deliveries, d], askingHelp: false }));
  };

  if (run.status === 'intro' || !run.status || fresh) {
    return (
      <div className="mkx-container pb-8">
        <PageHead title={title} crumbs={crumbs} />
        <Card className="max-w-[44rem]">
          <Heading level={2} data-size="sm">{t('check.policyTitle')}</Heading>
          <Paragraph><strong>{t('check.scope')}</strong> {L(chk.scope)} · {t('check.count', { n })}</Paragraph>
          <List.Unordered className="text-lg list-disc pl-6">
            <List.Item>{t('check.policyIndependent')}</List.Item>
            <List.Item>{t('check.policyFeedback')}</List.Item>
            <List.Item>{t('check.policySwitch')}</List.Item>
            <List.Item>{t('check.policyAccess')}</List.Item>
            <List.Item>{t('check.policySnapshot')}</List.Item>
          </List.Unordered>
          <div className="flex flex-wrap items-center gap-3">
            <Button data-size="lg" onClick={() => { setFresh(false); start(); }}>{t('check.start')}</Button>
            {run.status === 'done' && fresh && <Button variant="tertiary" onClick={() => setFresh(false)}>{t('check.lastSummary')}</Button>}
          </div>
        </Card>
      </div>
    );
  }

  if (run.status === 'running') {
    const q = chk.questions[run.index];
    const d = run.deliveries[run.index];
    const supported = run.switchedAt != null && run.index >= run.switchedAt;
    const sum = summarizeDelivery(state.learner.events, d);
    return (
      <div className="mkx-container pb-8">
        <PageHead compact title={title} crumbs={crumbs}
          eyebrow={<Tag data-size="sm" data-color={supported ? 'info' : 'neutral'} className="mb-2 w-fit">{supported ? t('check.modeSupported') : t('check.modeIndependent')}</Tag>} />
        {run.askingHelp && (
          <Alert data-color="info" className="mb-4 max-w-[44rem]">
            <Heading level={2} data-size="2xs">{t('check.switchTitle')}</Heading>
            <Paragraph>{t('check.switchBody', { i: run.index + 1 })}</Paragraph>
            <div className="flex flex-wrap gap-2 mt-2">
              <Button data-color="accent" onClick={() => { learner.log({ type: 'check-switch', session: run.session, delivery: d }); learner.check(id, { switchedAt: run.index, askingHelp: false }); }}>{t('check.switchYes')}</Button>
              <Button data-color="accent" variant="secondary" onClick={() => learner.check(id, { askingHelp: false })}>{t('check.switchNo')}</Button>
            </div>
          </Alert>
        )}
        <ExerciseShell key={`${d}-${supported}`} q={q} delivery={d} mode={supported ? 'check-supported' : 'check'}
          position={t('ex.question', { i: run.index + 1, n })}
          onNeedHelp={() => learner.check(id, { askingHelp: true })}
          onSubmitted={() => { if (!supported) advance(); }}
          footer={(
            <div className="flex flex-wrap gap-2">
              {/* One way on: Skip before answering (recorded as skipped), Next / See summary after. */}
              {supported && sum.responses.length > 0 && <Button variant={sum.outcome?.startsWith('correct') ? 'primary' : 'secondary'} onClick={advance}>{run.index === n - 1 ? t('check.finish') : t('check.nextQuestion')}</Button>}
              {!sum.responses.length && <Button variant="tertiary" onClick={() => { learner.log({ type: 'skip', delivery: d }); advance(); }}>{run.index === n - 1 ? t('check.skipLast') : t('check.skip')}</Button>}
            </div>
          )} />
      </div>
    );
  }

  // Summary
  const lesson = lessons[chk.lesson];
  const sections = parseLesson(L(lesson.source)).sections;
  const rows = chk.questions.map((q, i) => ({ q, i, d: run.deliveries[i], s: summarizeDelivery(state.learner.events, run.deliveries[i]) }));
  const indep = rows.filter((r) => run.switchedAt == null || r.i < run.switchedAt);
  const supp = rows.filter((r) => run.switchedAt != null && r.i >= run.switchedAt);
  const groups = {
    independentCorrect: indep.filter((r) => r.s.outcome === 'correctFirst'),
    independentNotYet: indep.filter((r) => r.s.outcome === 'notYetCorrect'),
    independentSkipped: indep.filter((r) => r.s.outcome === 'skipped' || r.s.outcome === 'unfinished'),
  };
  const Row = ({ r, showAnswer, tag = true }) => (
    <li className="mkx-outcome-row">
      <span className="flex items-center gap-3">
        <span aria-hidden="true" className="text-xl"><MathExpr expr={kinds[r.q.kind].plain(r.q)} /></span>
        <span className="ds-sr-only">{kinds[r.q.kind].spoken(r.q)[lang]}</span>
        <span className="text-sm">{r.s.responses.length ? t('check.yourAnswer', { a: r.s.responses.at(-1).answer }) : t('check.noAnswer')}{showAnswer ? ` · ${t('check.correctAnswer', { a: kinds[r.q.kind].solve(r.q) })}` : ''}</span>
      </span>
      {tag && <OutcomeTag outcome={r.s.outcome} />}
    </li>
  );
  return (
    <div className="mkx-container pb-8">
      <PageHead title={`${t('check.summaryTitle')}: ${L(chk.title)}`} crumbs={crumbs} lead={t('check.summaryNote')} />
      <div className="grid gap-4 lg:grid-cols-3">
        {[['independentCorrect', 'success'], ['independentNotYet', 'warning'], ['independentSkipped', 'neutral']].map(([k, c]) => (
          <Card key={k} data-color={c} variant="tinted">
            <Heading level={2} data-size="2xs">{t(`check.${k}`)} <span className="tabular-nums">({groups[k].length})</span></Heading>
            {groups[k].length ? <ul className="list-none m-0 p-0 flex flex-col gap-2">{groups[k].map((r) => <Row key={r.q.id} r={r} tag={false} showAnswer={k === 'independentNotYet'} />)}</ul> : <Paragraph data-size="sm">{t('check.none')}</Paragraph>}
          </Card>
        ))}
      </div>
      {supp.length > 0 && (
        <section className="mt-6 max-w-[44rem]" aria-labelledby="supp-h">
          <Heading level={2} data-size="xs" id="supp-h">{t('check.supportedTitle', { i: run.switchedAt + 1 })}</Heading>
          <Paragraph data-size="sm">{t('check.supportedNote')}</Paragraph>
          <ul className="list-none m-0 p-0 flex flex-col gap-2 mt-2">{supp.map((r) => <Row key={r.q.id} r={r} />)}</ul>
        </section>
      )}
      {/* The policy promises explanations at the end: every item gets its worked explanation (Gemini round-03). */}
      <section className="mt-8 max-w-[44rem]" aria-labelledby="exp-h">
        <Heading level={2} data-size="xs" id="exp-h">{t('check.explanations')}</Heading>
        <Paragraph data-size="sm">{t('check.explanationsLead')}</Paragraph>
        <div className="flex flex-col gap-2 mt-3">
          {rows.map(({ q, s: ds }) => (
            <CheckExplanation key={q.id} q={q} revisit={ds.outcome !== 'correctFirst'}
              lessonHref={`#/lesson/${chk.lesson}?s=${q.section}`} sectionTitle={sections.find((x) => x.id === q.section)?.title} />
          ))}
        </div>
      </section>
      <Card className="mt-8 max-w-[44rem]" data-color="accent" variant="tinted">
        <Heading level={2} data-size="xs">{t('check.morePractice')}</Heading>
        <Paragraph data-size="sm">{t('check.morePracticeNote')}</Paragraph>
        <div className="flex flex-wrap gap-2">
          <Button asChild><a href={`#/practice/${chk.skill}`}>{t('topic.startPractice')}</a></Button>
          <Button variant="secondary" onClick={() => learner.check(id, { status: 'intro' })}>{t('check.again')}</Button>
        </div>
      </Card>
    </div>
  );
}

/** One check item's worked explanation, shown after the check (nothing is recorded). */
function CheckExplanation({ q, revisit, lessonHref, sectionTitle }) {
  const { t } = useStore();
  const [step, setStep] = useState(0);
  const steps = q.explanation ? explanationSteps(q.explanation, q) : null;
  const label = kinds[q.kind].plain(q);
  return (
    <Details>
      <Details.Summary>
        <span className="flex flex-wrap items-center gap-2">{label}{revisit && <Tag data-size="sm" data-color="warning">{t('check.independentNotYet')}</Tag>}</span>
      </Details.Summary>
      <Details.Content>
        <div className="flex flex-col gap-3">
          {steps && <StepPlayer steps={steps} step={step} onStep={setStep} label={t('check.explanationOf', { q: label })} />}
          <Link href={lessonHref}>{t('check.inLesson', { section: sectionTitle ?? '' })}</Link>
        </div>
      </Details.Content>
    </Details>
  );
}
