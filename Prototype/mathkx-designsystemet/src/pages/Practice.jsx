import { useEffect } from 'react';
import { Button, Card, Heading, Paragraph, Link, Tag, Alert, List } from '@digdir/designsystemet-react';
import { useStore } from '../store.jsx';
import { practiceSets, checks, findTopic, lessons } from '../content/catalog.js';
import { kinds } from '../domain/math.js';
import { ExerciseShell } from '../components/ExerciseShell.jsx';
import { MathExpr } from '../components/math/MathExpr.jsx';
import { PageHead } from '../components/Page.jsx';
import { parseLesson } from '../components/Markdown.jsx';

function crumbsFor(topicId, L, t, last) {
  const { domain, topic } = findTopic(topicId);
  return [{ href: '#/library', label: t('library.title') }, { href: `#/domain/${domain.id}`, label: L(domain.title) }, { href: `#/topic/${topic.id}`, label: L(topic.title) }, last];
}

export function PracticePage({ id }) {
  const { t, L, state, dispatch } = useStore();
  const set = practiceSets[id];
  useEffect(() => { if (set) dispatch({ type: 'last', last: { href: `#/practice/${id}`, kind: 'practice', id } }); }, [id]); // eslint-disable-line
  if (!set) return <div className="mkx-container py-10"><h1>404</h1></div>;
  const index = state.sets[id] ?? 0;
  const done = index >= set.questions.length;
  const q = set.questions[Math.min(index, set.questions.length - 1)];
  const setIndex = (i) => dispatch({ type: 'setIndex', set: id, index: i });
  const restart = () => { dispatch({ type: 'resetWork', qids: set.questions.map((x) => x.id) }); setIndex(0); };

  return (
    <div className="mkx-container">
      <PageHead title={L(set.title)} crumbs={crumbsFor(set.topic, L, t, { href: `#/practice/${id}`, label: L(set.title) })} />
      <ol className="list-none m-0 p-0 flex gap-2 mb-6" aria-label={t('ex.question', { i: Math.min(index + 1, set.questions.length), n: set.questions.length })}>
        {set.questions.map((x, i) => {
          const solved = state.work[x.id]?.solved;
          return (
            <li key={x.id} aria-current={i === index ? 'step' : undefined}
              className="h-2 flex-1 max-w-16 rounded-full"
              style={{ background: i === index ? 'var(--ds-color-accent-base-default)' : solved ? 'var(--ds-color-accent-border-default)' : 'var(--ds-color-neutral-border-subtle)' }}>
              <span className="ds-sr-only">{i + 1}{solved ? ' ✓' : ''}</span>
            </li>
          );
        })}
      </ol>
      {done ? (
        <Card variant="tinted" data-color="accent" className="max-w-[40rem]">
          <Heading level={2} data-size="sm">{t('ex.solvedHeading')}</Heading>
          <Paragraph>{t('ex.done')}</Paragraph>
          <div className="flex flex-wrap gap-3">
            <Button asChild><a href={`#/check/${findTopicCheck(set.topic)}`}>{t('ex.goCheck')}</a></Button>
            <Button variant="secondary" onClick={restart}>{t('ex.restart')}</Button>
            <Button variant="tertiary" asChild><a href={`#/topic/${set.topic}`}>{t('ex.backTopic')}</a></Button>
          </div>
        </Card>
      ) : (
        <ExerciseShell key={q.id} q={q} setId={id} mode="practice"
          position={t('ex.question', { i: index + 1, n: set.questions.length })}
          onNext={() => setIndex(index + 1)}
          onSkip={() => setIndex(index + 1)}
          lessonHref={`#/lesson/${set.lesson}`} />
      )}
    </div>
  );
}

function findTopicCheck(topicId) {
  return Object.values(checks).find((c) => c.topic === topicId)?.id;
}

export function CheckPage({ id }) {
  const { t, L, state, dispatch, lang } = useStore();
  const chk = checks[id];
  if (!chk) return <div className="mkx-container py-10"><h1>404</h1></div>;
  const run = state.checks[id] ?? { status: 'intro', index: 0, responses: {} };
  const patch = (p) => dispatch({ type: 'check', id, patch: p });
  const n = chk.questions.length;
  const title = `${t('check.titlePrefix')}: ${L(chk.title)}`;
  const crumbs = crumbsFor(chk.topic, L, t, { href: `#/check/${id}`, label: t('check.titlePrefix') });

  const record = (q, resp) => {
    const responses = { ...run.responses, [q.id]: resp };
    if (!resp.skipped) dispatch({ type: 'attempt', attempt: { qid: q.id, set: id, mode: 'check', correct: resp.correct, help: resp.help, answer: resp.answer } });
    const next = run.index + 1;
    patch({ responses, index: next, status: next >= n ? 'done' : 'running' });
  };

  if (run.status === 'intro') {
    return (
      <div className="mkx-container">
        <PageHead title={title} crumbs={crumbs} />
        <Card className="max-w-[42rem]">
          <Heading level={2} data-size="sm">{t('check.policyTitle')}</Heading>
          <List.Unordered className="text-lg list-disc pl-6">
            <List.Item>{t('check.policy1', { n })}</List.Item>
            <List.Item>{t('check.policy2')}</List.Item>
            <List.Item><strong>{t('check.policy3')}</strong></List.Item>
            <List.Item>{t('check.policy4')}</List.Item>
            <List.Item>{t('check.policy5')}</List.Item>
          </List.Unordered>
          <div><Button data-size="lg" onClick={() => { dispatch({ type: 'resetWork', qids: chk.questions.map((q) => q.id) }); patch({ status: 'running', index: 0, responses: {} }); }}>{t('check.start')}</Button></div>
        </Card>
      </div>
    );
  }

  if (run.status === 'running') {
    const q = chk.questions[run.index];
    return (
      <div className="mkx-container">
        <PageHead title={title} crumbs={crumbs} />
        <Paragraph data-size="sm" className="mb-4" style={{ color: 'var(--ds-color-neutral-text-subtle)' }}>{t('check.policy3')}</Paragraph>
        <ExerciseShell key={q.id} q={q} setId={id} mode="check" isLast={run.index === n - 1}
          position={t('ex.question', { i: run.index + 1, n })}
          onNext={(resp) => record(q, resp)}
          onSkip={() => record(q, { skipped: true, help: state.work[q.id]?.helpUsed ?? [] })} />
      </div>
    );
  }

  // Summary
  const groups = { independent: [], withHelp: [], revisit: [] };
  for (const q of chk.questions) {
    const r = run.responses[q.id] ?? { skipped: true };
    if (r.skipped || !r.correct) groups.revisit.push({ q, r });
    else if (r.help?.length) groups.withHelp.push({ q, r });
    else groups.independent.push({ q, r });
  }
  const lesson = lessons[chk.lesson];
  const sections = parseLesson(L(lesson.source)).sections;
  const sectionTitle = (sid) => sections.find((s) => s.id === sid)?.title;
  const explain = [...groups.withHelp, ...groups.revisit];

  const Group = ({ k, color, items }) => (
    <Card data-color={color} variant="tinted" className="h-full">
      <Heading level={3} data-size="xs">{t(`check.${k}`)} <span className="tabular-nums">({items.length})</span></Heading>
      {items.length === 0 ? <Paragraph data-size="sm">{t('check.none')}</Paragraph> : (
        <ul className="list-none m-0 p-0 flex flex-col gap-3">
          {items.map(({ q, r }) => (
            <li key={q.id} className="flex flex-col">
              <span className="text-xl font-semibold" aria-hidden="true"><MathExpr expr={kinds[q.kind].expression(q).replace(" = ?", "")} /></span>
              <span className="ds-sr-only">{kinds[q.kind].spoken(q)[lang]}</span>
              <span className="text-sm">{r.skipped ? t('check.skipped') : t('check.yourAnswer', { a: r.answer })}{k === 'revisit' && ` · ${t('check.correctAnswer', { a: kinds[q.kind].solve(q) })}`}</span>
              {r.help?.length > 0 && <Tag data-size="sm" data-color="neutral" className="w-fit mt-1">{t('ex.helpUsedNote')}</Tag>}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );

  return (
    <div className="mkx-container">
      <PageHead title={`${t('check.summaryTitle')}: ${L(chk.title)}`} crumbs={crumbs} lead={t('check.summaryNote')} />
      <div className="grid gap-4 md:grid-cols-3">
        <Group k="independent" color="success" items={groups.independent} />
        <Group k="withHelp" color="info" items={groups.withHelp} />
        <Group k="revisit" color="warning" items={groups.revisit} />
      </div>
      {explain.length > 0 && (
        <section className="mt-8 max-w-[42rem]" aria-labelledby="exp-h">
          <Heading level={2} data-size="sm" id="exp-h">{t('check.explanations')}</Heading>
          <ul className="list-none m-0 p-0 flex flex-col gap-2 mt-3">
            {explain.map(({ q }) => (
              <li key={q.id}>
                <Link href={`#/lesson/${chk.lesson}?s=${q.section}`}>
                  {kinds[q.kind].expression(q).replace(' = ?', '')} – {sectionTitle(q.section) ?? parseLesson(L(lesson.source)).meta.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      {!state.profileId && <Alert data-color="info" className="mt-8 max-w-[42rem]"><Paragraph>{t('check.saveProfile')}</Paragraph><Link href="#/profile/new">{t('nav.createProfile')}</Link></Alert>}
      <div className="flex flex-wrap gap-3 mt-8">
        <Button variant="secondary" onClick={() => patch({ status: 'intro', index: 0, responses: {} })}>{t('check.again')}</Button>
        <Button variant="tertiary" asChild><a href={`#/topic/${chk.topic}`}>{t('ex.backTopic')}</a></Button>
      </div>
    </div>
  );
}
