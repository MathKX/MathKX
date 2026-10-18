import { useState, useMemo } from 'react';
import { Button, Card, Heading, Paragraph, Link, Tag, Search, Switch, Alert, List } from '@digdir/designsystemet-react';
import { BookIcon, PencilWritingIcon, CheckmarkCircleIcon } from '@navikt/aksel-icons';
import { useStore } from '../store.jsx';
import { domains, findDomain, findTopic, lessons, practiceSets, checks } from '../content/catalog.js';
import { parseLesson } from '../components/Markdown.jsx';
import { PageHead } from '../components/Page.jsx';
import { DomainGlyph } from './Landing.jsx';
import { lessonStatus, practiceStatus, checkStatus, statusColor } from '../activity.js';

function TopicRow({ topic }) {
  const { t, L } = useStore();
  const ready = topic.status === 'available';
  return (
    <li className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3 border-b last:border-b-0" style={{ borderColor: 'var(--ds-color-neutral-border-subtle)' }}>
      <div className="flex flex-col">
        {ready ? <Link href={`#/topic/${topic.id}`} className="text-lg font-semibold">{L(topic.title)}</Link>
          : <span className="text-lg" style={{ color: 'var(--ds-color-neutral-text-default)' }}>{L(topic.title)}</span>}
        <span className="text-sm" style={{ color: 'var(--ds-color-neutral-text-subtle)' }}>{t('library.typical', { stage: L(topic.stage) })}</span>
      </div>
      {ready ? <Tag data-color="success" data-size="sm">{t('library.available')}</Tag>
        : <Tag data-color="neutral" data-size="sm" title={t('library.previewExplain')}>{t('library.preview')}<span className="ds-sr-only">: {t('library.previewExplain')}</span></Tag>}
    </li>
  );
}

export function Library() {
  const { t, L } = useStore();
  const [q, setQ] = useState('');
  const [only, setOnly] = useState(false);
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return domains.map((d) => ({
      ...d,
      topics: d.topics.filter((tp) => (!only || tp.status === 'available')
        && (!needle || [tp.title.nb, tp.title.en, d.title.nb, d.title.en].some((s) => s.toLowerCase().includes(needle)))),
    })).filter((d) => d.topics.length);
  }, [q, only]);
  const count = filtered.reduce((n, d) => n + d.topics.length, 0);

  return (
    <div className="mkx-container">
      <PageHead title={t('library.title')} lead={t('library.lead')} />
      <div className="flex flex-col md:flex-row md:items-end gap-4 mb-2">
        <div className="md:w-[28rem]">
          <label htmlFor="lib-search" className="ds-label block mb-2">{t('library.search')}</label>
          <Search>
            <Search.Input id="lib-search" aria-label={t('library.search')} placeholder={t('library.searchPlaceholder')} value={q} onChange={(e) => setQ(e.target.value)} />
            <Search.Clear onClick={() => setQ('')} />
          </Search>
        </div>
        <Switch label={t('library.onlyAvailable')} checked={only} onChange={(e) => setOnly(e.target.checked)} />
      </div>
      <p className="text-sm my-4" role="status" style={{ color: 'var(--ds-color-neutral-text-subtle)' }}>{t('library.results', { n: count })}</p>
      {filtered.length === 0 && <Alert data-color="info"><Paragraph>{t('library.noResults')}</Paragraph></Alert>}
      <div className="grid gap-4 lg:grid-cols-2">
        {filtered.map((d) => (
          <Card key={d.id} aria-labelledby={`d-${d.id}`}>
            <div className="flex items-start gap-3">
              <DomainGlyph icon={d.icon} />
              <div>
                <Heading level={2} data-size="xs" id={`d-${d.id}`}><Link href={`#/domain/${d.id}`}>{L(d.title)}</Link></Heading>
                <Paragraph data-size="sm">{L(d.summary)} <span style={{ color: 'var(--ds-color-neutral-text-subtle)' }}>{L(d.range)}.</span></Paragraph>
              </div>
            </div>
            <ul className="list-none m-0 p-0">{d.topics.map((tp) => <TopicRow key={tp.id} topic={tp} />)}</ul>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function DomainPage({ id }) {
  const { t, L } = useStore();
  const d = findDomain(id);
  if (!d) return <div className="mkx-container py-10"><h1>404</h1></div>;
  const ready = d.topics.filter((x) => x.status === 'available');
  const planned = d.topics.filter((x) => x.status !== 'available');
  return (
    <div className="mkx-container">
      <PageHead title={L(d.title)} lead={`${L(d.summary)} ${L(d.range)}.`} crumbs={[{ href: '#/library', label: t('library.title') }, { href: `#/domain/${d.id}`, label: L(d.title) }]} />
      {!ready.length && <Alert data-color="info" className="mb-6"><Paragraph>{t('domain.previewDomain')}</Paragraph><Link href="#/about">{t('domain.contribute')}</Link></Alert>}
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <section aria-labelledby="topics-h">
          <Heading level={2} data-size="sm" id="topics-h" className="mb-3">{t('domain.topicsTitle')}</Heading>
          {ready.length > 0 && (
            <ul className="list-none m-0 p-0 grid gap-3 mb-6">
              {ready.map((tp) => (
                <li key={tp.id}>
                  <Card asChild data-color="accent" variant="tinted">
                    <a href={`#/topic/${tp.id}`}>
                      <Tag data-color="success" data-size="sm" className="w-fit">{t('domain.availableNow')}</Tag>
                      <Heading level={3} data-size="xs">{L(tp.title)}</Heading>
                      <Paragraph data-size="sm">{t('library.typical', { stage: L(tp.stage) })}</Paragraph>
                    </a>
                  </Card>
                </li>
              ))}
            </ul>
          )}
          <Heading level={3} data-size="2xs" className="mb-1">{t('domain.planned')}</Heading>
          <ul className="list-none m-0 p-0">{planned.map((tp) => <TopicRow key={tp.id} topic={tp} />)}</ul>
        </section>
        <aside>
          <Card variant="tinted">
            <Paragraph data-size="sm">{t('landing.domainsLead')}</Paragraph>
            <Link href="#/about">{t('domain.contribute')}</Link>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function StatusTag({ s }) {
  const { t } = useStore();
  return <Tag data-color={statusColor(s)} data-size="sm" variant={s === 'notStarted' ? 'outline' : 'default'}>{t(`status.${s}`)}</Tag>;
}

export function TopicPage({ id }) {
  const { t, L, state } = useStore();
  const found = findTopic(id);
  if (!found || !found.details) return <div className="mkx-container py-10"><h1>404</h1></div>;
  const { domain, topic, details } = found;
  const set = practiceSets[details.practice];
  const chk = checks[details.check];
  return (
    <div className="mkx-container">
      <PageHead title={L(topic.title)} crumbs={[{ href: '#/library', label: t('library.title') }, { href: `#/domain/${domain.id}`, label: L(domain.title) }, { href: `#/topic/${id}`, label: L(topic.title) }]}
        eyebrow={<Tag data-color="neutral" data-size="sm" className="mb-2 w-fit">{t('library.typical', { stage: L(topic.stage) })}</Tag>} />
      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-8">
          <section aria-labelledby="und-h">
            <Heading level={2} data-size="sm" id="und-h">{t('topic.understand')}</Heading>
            <List.Unordered className="mt-3 text-lg list-disc pl-6">{details.understand.map((u, i) => <List.Item key={i}>{L(u)}</List.Item>)}</List.Unordered>
          </section>
          <section aria-labelledby="les-h" className="flex flex-col gap-3">
            <Heading level={2} data-size="sm" id="les-h">{t('topic.lessons')}</Heading>
            {details.lessons.map((lid) => {
              const lesson = lessons[lid];
              const meta = parseLesson(L(lesson.source)).meta;
              return (
                <Card key={lid}>
                  <div className="flex flex-wrap items-center gap-2"><BookIcon aria-hidden="true" fontSize="1.5rem" /><StatusTag s={lessonStatus(state.progress, lid)} /><span className="text-sm">{t('topic.minutes', { n: lesson.minutes })}</span></div>
                  <Heading level={3} data-size="xs">{meta.title}</Heading>
                  <Paragraph>{meta.objective}</Paragraph>
                  <div><Button asChild><a href={`#/lesson/${lid}`}>{t('topic.startLesson')}</a></Button></div>
                </Card>
              );
            })}
          </section>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <div className="flex flex-wrap items-center gap-2"><PencilWritingIcon aria-hidden="true" fontSize="1.5rem" /><StatusTag s={practiceStatus(state.progress, set.id)} /></div>
              <Heading level={2} data-size="xs">{t('topic.practice')}: {L(set.title)}</Heading>
              <Paragraph data-size="sm">{t('topic.questions', { n: set.questions.length })}. {t('lesson.readyLead')}</Paragraph>
              <div><Button variant="secondary" asChild><a href={`#/practice/${set.id}`}>{t('topic.startPractice')}</a></Button></div>
            </Card>
            <Card>
              <div className="flex flex-wrap items-center gap-2"><CheckmarkCircleIcon aria-hidden="true" fontSize="1.5rem" /><StatusTag s={checkStatus(state.progress, chk.id)} /></div>
              <Heading level={2} data-size="xs">{t('topic.check')}</Heading>
              <Paragraph data-size="sm">{t('topic.questions', { n: chk.questions.length })}. {t('check.policy3')}</Paragraph>
              <div><Button variant="secondary" asChild><a href={`#/check/${chk.id}`}>{t('topic.startCheck')}</a></Button></div>
            </Card>
          </div>
        </div>
        <aside className="flex flex-col gap-4">
          <Card variant="tinted">
            <Heading level={2} data-size="2xs">{t('topic.prereq')}</Heading>
            <ul className="list-none m-0 p-0 flex flex-col gap-2">
              {details.prereq.map((p, i) => {
                const target = findTopic(p.topic);
                const ready = target?.topic.status === 'available';
                return (
                  <li key={i} className="flex flex-wrap items-center gap-2">
                    {ready ? <Link href={`#/topic/${p.topic}`}>{L(p.title)}</Link> : <span>{L(p.title)}</span>}
                    {!ready && <Tag data-color="neutral" data-size="sm">{t('library.preview')}</Tag>}
                  </li>
                );
              })}
            </ul>
          </Card>
          <Card variant="tinted">
            <Heading level={2} data-size="2xs">{t('topic.skills')}</Heading>
            <ul className="list-none m-0 p-0 flex flex-col gap-1">
              {details.skills.map((s) => <li key={s.id}>{L(s.title)}</li>)}
            </ul>
          </Card>
        </aside>
      </div>
    </div>
  );
}
