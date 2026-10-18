import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Card, Heading, Paragraph, Link, Tag, Details, Dialog, Textfield, Fieldset, Radio, Select, Alert, useRadioGroup } from '@digdir/designsystemet-react';
import { ChatExclamationmarkIcon, CodeIcon, ArrowRightIcon } from '@navikt/aksel-icons';
import { useStore } from '../store.jsx';
import { lessons, findTopic, skills, practiceSets, checks } from '../content/catalog.js';
import { parseLesson, Blocks } from '../components/Markdown.jsx';
import { Crumbs } from '../components/Page.jsx';
import { TenFrameExplorer, MakeTen } from '../components/math/TenFrame.jsx';
import { Balance } from '../components/math/Balance.jsx';
import { REPO_URL } from '../App.jsx';

// Named interactive building blocks a lesson may reference.
const COMPONENTS = {
  'ten-frame-explorer': ({ start }) => <TenFrameExplorer start={Number(start ?? 4)} />,
  'make-ten': ({ a, b }) => <MakeTen a={Number(a)} b={Number(b)} />,
  balance: ({ a, c }) => <Balance a={Number(a)} c={Number(c)} />,
};

function jumpTo(sid) {
  const el = document.getElementById(sid);
  if (!el) return;
  el.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  el.setAttribute('tabindex', '-1');
  el.focus({ preventScroll: true });
}

function SectionNav({ sections, onJump }) {
  const { t } = useStore();
  return (
    <ol className="list-none m-0 p-0 flex flex-col gap-1">
      {sections.map((s, i) => (
        <li key={s.id}>
          <Button variant="tertiary" data-size="sm" className="w-full justify-start text-left" onClick={() => onJump(s.id)}>
            <span aria-hidden="true" className="tabular-nums" style={{ color: 'var(--ds-color-neutral-text-subtle)' }}>{i + 1}</span>{s.title}
          </Button>
        </li>
      ))}
    </ol>
  );
}

export function LessonPage({ id }) {
  const { t, L, lang, dispatch } = useStore();
  const lesson = lessons[id];
  const src = lesson ? L(lesson.source) : '';
  const parsed = useMemo(() => (lesson ? parseLesson(src) : null), [src, lesson]);
  const readyRef = useRef(null);
  const reportRef = useRef(null);
  const sourceRef = useRef(null);
  const [reportKey, setReportKey] = useState(0);

  useEffect(() => {
    if (!lesson) return;
    dispatch({ type: 'last', last: { href: `#/lesson/${id}`, kind: 'lesson', id } });
    const el = readyRef.current;
    const mark = () => dispatch({ type: 'lessonExplored', id });
    const timer = setTimeout(mark, 20000);
    let io;
    if (el && 'IntersectionObserver' in window) {
      io = new IntersectionObserver((entries) => { if (entries.some((e) => e.isIntersecting)) mark(); });
      io.observe(el);
    }
    const sid = new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('s');
    const jt = sid ? setTimeout(() => jumpTo(sid), 80) : null;
    return () => { clearTimeout(timer); clearTimeout(jt); io?.disconnect(); };
  }, [id]); // eslint-disable-line

  if (!lesson) return <div className="mkx-container py-10"><h1>404</h1></div>;
  const { meta, blocks, sections } = parsed;
  const { domain, topic } = findTopic(lesson.topic);
  const set = practiceSets[meta.practice];
  const chk = checks[meta.check];

  const jump = jumpTo;

  const contributeButtons = (
    <div className="flex flex-wrap gap-2">
      <Button variant="tertiary" data-size="sm" onClick={() => { setReportKey((k) => k + 1); reportRef.current?.showModal(); }}>
        <ChatExclamationmarkIcon aria-hidden="true" />{t('lesson.suggest')}
      </Button>
      <Button variant="tertiary" data-size="sm" onClick={() => sourceRef.current?.showModal()}>
        <CodeIcon aria-hidden="true" />{t('lesson.source')}
      </Button>
    </div>
  );

  return (
    <div className="mkx-container">
      <div className="pt-6">
        <Crumbs items={[{ href: '#/library', label: t('library.title') }, { href: `#/domain/${domain.id}`, label: L(domain.title) }, { href: `#/topic/${topic.id}`, label: L(topic.title) }, { href: `#/lesson/${id}`, label: meta.title }]} />
      </div>
      <div className="grid gap-8 lg:grid-cols-[15rem_minmax(0,1fr)] xl:grid-cols-[16rem_minmax(0,1fr)]">
        {/* Section navigation: a sidebar on wide screens, collapsible on iPad portrait and phones. */}
        <aside className="hidden lg:block">
          <nav aria-label={t('lesson.sectionNav')} className="sticky top-24">
            <Heading level={2} data-size="2xs" className="mb-2">{t('lesson.inThisLesson')}</Heading>
            <SectionNav sections={sections} onJump={jump} />
          </nav>
        </aside>
        <article className="min-w-0 max-w-[46rem] flex flex-col gap-4 pb-6" lang={lang}>
          <header className="flex flex-col gap-4">
            <Heading level={1} data-size="lg">{meta.title}</Heading>
            <div className="mkx-panel-accent">
              <Heading level={2} data-size="2xs">{t('lesson.objective')}</Heading>
              <Paragraph data-size="lg">{meta.objective}</Paragraph>
            </div>
            <div className="lg:hidden">
              <Details>
                <Details.Summary>{t('lesson.inThisLesson')}</Details.Summary>
                <Details.Content>
                  <nav aria-label={t('lesson.sectionNav')}><SectionNav sections={sections} onJump={jump} /></nav>
                </Details.Content>
              </Details>
            </div>
            {contributeButtons}
          </header>

          <Blocks blocks={blocks} components={COMPONENTS} />

          <section aria-labelledby="related-h" className="pt-6">
            <Heading level={2} data-size="xs" id="related-h">{t('lesson.related')}</Heading>
            <ul className="list-none m-0 p-0 flex flex-wrap gap-2 mt-3">
              {meta.related?.map((sid) => {
                const s = skills[sid];
                if (!s) return null;
                return (
                  <li key={sid}>
                    <Button variant="secondary" data-size="sm" asChild>
                      <a href={s.href}>{L(s.title)}{s.preview && <Tag data-size="sm" data-color="neutral">{t('lesson.previewSkill')}</Tag>}</a>
                    </Button>
                  </li>
                );
              })}
            </ul>
          </section>

          <div ref={readyRef}>
            <Card data-color="accent" variant="tinted" className="mt-6">
              <Heading level={2} data-size="sm">{t('lesson.readyTitle')}</Heading>
              <Paragraph>{t('lesson.readyLead')}</Paragraph>
              <div className="flex flex-wrap gap-3">
                <Button data-size="lg" asChild><a href={`#/practice/${set.id}`}>{t('topic.startPractice')}: {L(set.title)}<ArrowRightIcon aria-hidden="true" /></a></Button>
                <Button data-size="lg" variant="secondary" asChild><a href={`#/check/${chk.id}`}>{t('topic.startCheck')}</a></Button>
              </div>
            </Card>
          </div>
          <div className="pt-4 border-t" style={{ borderColor: 'var(--ds-color-neutral-border-subtle)' }}>{contributeButtons}</div>
        </article>
      </div>

      <Dialog ref={reportRef} closeButton={t('report.close')} closedby="any" className="w-[min(40rem,calc(100vw-2rem))]">
        <ReportForm key={reportKey} lesson={lesson} meta={meta} sections={sections} onClose={() => reportRef.current?.close()} />
      </Dialog>

      <Dialog ref={sourceRef} closeButton={t('source.close')} closedby="any" className="w-[min(48rem,calc(100vw-2rem))]">
        <Dialog.Block>
          <Heading level={2} data-size="xs">{t('source.title')}</Heading>
          <Paragraph className="mt-2">{t('source.lead')}</Paragraph>
        </Dialog.Block>
        <Dialog.Block className="flex flex-col gap-3">
          <div>
            <span className="text-sm font-semibold">{t('source.path')}</span>
            <code className="block text-sm break-all">{lesson.path.replace('{lang}', lang)}</code>
          </div>
          <pre className="mkx-code m-0" tabIndex={0} aria-label={t('source.title')}>{src}</pre>
          <Alert data-color="info"><Paragraph data-size="sm">{t('source.proto')}</Paragraph></Alert>
          <div><Button variant="secondary" asChild><a href={REPO_URL} target="_blank" rel="noreferrer">{t('source.edit')}</a></Button></div>
        </Dialog.Block>
      </Dialog>
    </div>
  );
}

function ReportForm({ lesson, meta, sections, onClose }) {
  const { t, lang } = useStore();
  const [section, setSection] = useState('');
  const [desc, setDesc] = useState('');
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);
  const { getRadioProps, value: kind } = useRadioGroup({ name: 'report-kind', value: 'unclear' });
  const kinds = [['math', 'kMath'], ['unclear', 'kUnclear'], ['language', 'kLanguage'], ['a11y', 'kA11y'], ['other', 'kOther']];
  const kindLabel = t(`report.${kinds.find((k) => k[0] === kind)?.[1] ?? 'kOther'}`);
  const sectionTitle = sections.find((s) => s.id === section)?.title ?? t('report.whole');

  const issue = `### ${kindLabel}: ${meta.title}\n\n- ${t('report.lesson')}: ${meta.id} (${lang})\n- ${t('report.section').replace(/\?$/, '')}: ${sectionTitle}${section ? ` (#${section})` : ''}\n- ${lang === 'nb' ? 'Kilde' : 'Source'}: ${lesson.path.replace('{lang}', lang)}\n\n${desc.trim()}`;

  if (sent) {
    return (
      <>
        <Dialog.Block><Heading level={2} data-size="xs">{t('report.sentTitle')}</Heading></Dialog.Block>
        <Dialog.Block className="flex flex-col gap-3">
          <Alert data-color="info"><Paragraph>{t('report.sentProto')}</Paragraph></Alert>
          <Heading level={3} data-size="2xs">{t('report.preview')}</Heading>
          <pre className="mkx-code m-0" tabIndex={0}>{issue}</pre>
          <div><Button onClick={onClose}>{t('report.close')}</Button></div>
        </Dialog.Block>
      </>
    );
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); if (!desc.trim()) { setError(t('report.descRequired')); return; } setSent(true); }} noValidate>
      <Dialog.Block>
        <Heading level={2} data-size="xs">{t('report.title')}</Heading>
        <Paragraph className="mt-2">{t('report.lead')}</Paragraph>
      </Dialog.Block>
      <Dialog.Block className="flex flex-col gap-5">
        <Textfield label={t('report.lesson')} value={meta.title} readOnly />
        <div className="flex flex-col gap-2">
          <label htmlFor="report-section" className="ds-label">{t('report.section')}</label>
          <Select id="report-section" value={section} onChange={(e) => setSection(e.target.value)}>
            <Select.Option value="">{t('report.whole')}</Select.Option>
            {sections.map((s) => <Select.Option key={s.id} value={s.id}>{s.title}</Select.Option>)}
          </Select>
        </div>
        <Fieldset>
          <Fieldset.Legend>{t('report.kind')}</Fieldset.Legend>
          {kinds.map(([v, k]) => <Radio key={v} label={t(`report.${k}`)} {...getRadioProps(v)} />)}
        </Fieldset>
        <Textfield multiline rows={4} label={t('report.desc')} description={t('report.descDesc')} value={desc}
          onChange={(e) => { setDesc(e.target.value); if (error) setError(null); }} error={error ?? undefined} />
        <Alert data-color="info"><Paragraph data-size="sm">{t('report.privacy')}</Paragraph></Alert>
        <div className="flex flex-wrap gap-3">
          <Button type="submit">{t('report.submit')}</Button>
          <Button type="button" variant="secondary" onClick={onClose}>{t('report.cancel')}</Button>
        </div>
      </Dialog.Block>
    </form>
  );
}
