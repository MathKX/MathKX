import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Card, Heading, Paragraph, Link, Tag, Details, Dialog, Textfield, Fieldset, Radio, Select, Alert, Tabs, useRadioGroup } from '@digdir/designsystemet-react';
import { ChatExclamationmarkIcon, PencilIcon, ArrowLeftIcon } from '@navikt/aksel-icons';
import { useStore, useLearner, go } from '../store.jsx';
import { lessons, findTopic, skillLinks, checks, lessonPath } from '../content/catalog.js';
import { explanationSteps } from '../domain/explanations.js';
import { parseLesson, Blocks } from '../components/Markdown.jsx';
import { Crumbs } from '../components/Page.jsx';
import { TenFrameExplorer } from '../components/math/TenFrame.jsx';
import { StepPlayer } from '../components/math/Visuals.jsx';
import { PracticeEntry } from './Practice.jsx';
import { REPO_URL } from '../App.jsx';

function StepEmbed({ model, q }) {
  const [step, setStep] = useState(0);
  const steps = explanationSteps(model, q);
  const { t } = useStore();
  if (!steps) return <Alert data-color="danger"><Paragraph data-size="sm">{t('lesson.unsupportedVisual')}</Paragraph></Alert>;
  return <div className="mkx-panel"><StepPlayer steps={steps} step={step} onStep={setStep} /></div>;
}

// Named interactive building blocks a lesson may reference with :::visual{type="…"}.
const COMPONENTS = {
  visual: {
    'ten-frame-explorer': ({ start }) => <TenFrameExplorer start={Number(start ?? 4)} />,
    'make-ten': ({ a, b }) => <StepEmbed model="make-ten" q={{ a: Number(a), b: Number(b) }} />,
    balance: ({ a, c }) => <StepEmbed model="balance" q={{ a: Number(a), c: Number(c) }} />,
  },
  practice: PracticeEntry,
};

const lastViewLog = { id: null, at: 0 };

function jumpTo(sid) {
  const el = document.getElementById(sid);
  if (!el) return;
  el.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  el.setAttribute('tabindex', '-1');
  el.focus({ preventScroll: true });
}

function SectionNav({ sections }) {
  return (
    <ol className="list-none m-0 p-0 flex flex-col gap-1">
      {sections.map((s, i) => (
        <li key={s.id}>
          <Button variant="tertiary" data-size="sm" className="w-full justify-start text-left" onClick={() => jumpTo(s.id)}>
            <span aria-hidden="true" className="tabular-nums" style={{ color: 'var(--ds-color-neutral-text-subtle)' }}>{i + 1}</span>{s.title}
          </Button>
        </li>
      ))}
    </ol>
  );
}

export function ReturnBanner() {
  const { state, t, dispatch } = useStore();
  const r = state.returnTo;
  if (!r) return null;
  return (
    <div className="mkx-panel-accent flex flex-wrap items-center justify-between gap-3 mb-4" role="region" aria-label={t('lesson.returnRegion')}>
      <span>{t('lesson.returnText', { q: r.label })}</span>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => { dispatch({ type: 'returnTo', returnTo: null }); go(r.href); }}><ArrowLeftIcon aria-hidden="true" />{t('lesson.returnBtn')}</Button>
        <Button variant="tertiary" onClick={() => dispatch({ type: 'returnTo', returnTo: null })}>{t('lesson.returnDismiss')}</Button>
      </div>
    </div>
  );
}

export function LessonPage({ id }) {
  const { t, L, lang } = useStore();
  const learner = useLearner();
  const lesson = lessons[id];
  const src = lesson ? L(lesson.source) : '';
  const parsed = useMemo(() => (lesson ? parseLesson(src) : null), [src, lesson]);
  const reportRef = useRef(null);
  const sourceRef = useRef(null);
  const [reportKey, setReportKey] = useState(0);

  useEffect(() => {
    if (!lesson) return;
    // A truthful record: the lesson was opened. It says nothing about understanding.
    if (!(lastViewLog.id === id && Date.now() - lastViewLog.at < 3000)) learner.log({ type: 'lesson-viewed', lesson: id, lang });
    lastViewLog.id = id; lastViewLog.at = Date.now();
    learner.setLast({ href: `#/lesson/${id}`, kind: 'lesson', id });
    const sid = new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('s');
    const jt = sid ? setTimeout(() => jumpTo(sid), 80) : null;
    return () => clearTimeout(jt);
  }, [id]); // eslint-disable-line

  if (!lesson) return <div className="mkx-container py-10"><h1>404</h1></div>;
  const { meta, blocks, sections } = parsed;
  const { domain, topic } = findTopic(lesson.topic);
  const chk = checks[lesson.meta.check];

  const contributeButtons = (
    <div className="flex flex-wrap gap-2">
      <Button variant="tertiary" data-size="sm" onClick={() => { setReportKey((k) => k + 1); reportRef.current?.showModal(); }}>
        <ChatExclamationmarkIcon aria-hidden="true" />{t('lesson.suggest')}
      </Button>
      <Button variant="tertiary" data-size="sm" onClick={() => sourceRef.current?.showModal()}>
        <PencilIcon aria-hidden="true" />{t('lesson.source')}
      </Button>
    </div>
  );

  return (
    <div className="mkx-container">
      <div className="pt-6">
        <Crumbs items={[{ href: '#/library', label: t('library.title') }, { href: `#/domain/${domain.id}`, label: L(domain.title) }, { href: `#/topic/${topic.id}`, label: L(topic.title) }, { href: `#/lesson/${id}`, label: meta.title }]} />
        <ReturnBanner />
      </div>
      <div className="grid gap-8 lg:grid-cols-[15rem_minmax(0,1fr)] xl:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <nav aria-label={t('lesson.sectionNav')} className="sticky top-24">
            <Heading level={2} data-size="2xs" className="mb-2">{t('lesson.inThisLesson')}</Heading>
            <SectionNav sections={sections} />
          </nav>
        </aside>
        <article className="min-w-0 max-w-[46rem] flex flex-col gap-4 pb-6" lang={lang}>
          <header className="flex flex-col gap-4">
            <Heading level={1} data-size="lg">{meta.title}</Heading>
            <div className="mkx-panel-accent">
              <Heading level={2} data-size="2xs">{t('lesson.objective')}</Heading>
              <Paragraph data-size="lg">{meta.objective}</Paragraph>
            </div>
            {lesson.meta.prerequisites?.length > 0 && (
              <div className="flex flex-wrap items-center gap-2" aria-label={t('lesson.prereq')}>
                <span className="text-sm font-semibold">{t('lesson.prereq')}</span>
                {lesson.meta.prerequisites.map((sid) => {
                  const s = skillLinks[sid];
                  return s ? <Tag key={sid} data-size="sm" data-color="neutral" variant="outline"><a href={s.href} className="underline">{L(s.title)}</a>{s.preview ? <span>&nbsp;· {t('lesson.previewSkill')}</span> : null}</Tag> : null;
                })}
              </div>
            )}
            <div className="lg:hidden">
              <Details>
                <Details.Summary>{t('lesson.inThisLesson')}</Details.Summary>
                <Details.Content><nav aria-label={t('lesson.sectionNav')}><SectionNav sections={sections} /></nav></Details.Content>
              </Details>
            </div>
            {contributeButtons}
          </header>

          <Blocks blocks={blocks} components={COMPONENTS} assets={lesson.assets} unknown={t('lesson.unknownDirective')} />

          <section aria-labelledby="related-h" className="pt-6">
            <Heading level={2} data-size="xs" id="related-h">{t('lesson.related')}</Heading>
            <ul className="list-none m-0 p-0 flex flex-wrap gap-2 mt-3">
              {lesson.meta.related?.map((sid) => {
                const s = skillLinks[sid];
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
          {chk && (
            <Card className="mt-2">
              <Heading level={2} data-size="xs">{t('topic.check')}</Heading>
              <Paragraph data-size="sm">{t('lesson.checkLead')}</Paragraph>
              <div><Button variant="secondary" asChild><a href={`#/check/${chk.id}`}>{t('topic.startCheck')}</a></Button></div>
            </Card>
          )}
          <div className="pt-4 border-t" style={{ borderColor: 'var(--ds-color-neutral-border-subtle)' }}>{contributeButtons}</div>
        </article>
      </div>

      <Dialog ref={reportRef} closeButton={t('report.close')} closedby="any" className="w-[min(40rem,calc(100vw-2rem))]">
        <ReportForm key={reportKey} lesson={lesson} meta={meta} sections={sections} onClose={() => reportRef.current?.close()} />
      </Dialog>

      <Dialog ref={sourceRef} closeButton={t('source.close')} closedby="any" className="w-[min(52rem,calc(100vw-2rem))]">
        <SourceView lesson={lesson} />
      </Dialog>
    </div>
  );
}

function SourceView({ lesson }) {
  const { t, lang } = useStore();
  const names = Object.keys(lesson.files);
  const [tab, setTab] = useState(`${lang}.md`);
  return (
    <>
      <Dialog.Block>
        <Heading level={2} data-size="xs">{t('source.title')}</Heading>
        <Paragraph className="mt-2">{t('source.lead')}</Paragraph>
      </Dialog.Block>
      <Dialog.Block className="flex flex-col gap-3">
        <Alert data-color="info"><Paragraph data-size="sm">{t('source.proposed')}</Paragraph></Alert>
        <div>
          <span className="text-sm font-semibold">{t('source.folder')}</span>
          <pre className="mkx-code m-0 mt-1 text-sm" tabIndex={0}>{`${lessonPath(lesson.id)}\n${names.map((n, i) => `  ${i === names.length - 1 ? '└─' : '├─'} ${n}`).join('\n')}`}</pre>
        </div>
        <Tabs value={tab} onChange={setTab}>
          <Tabs.List>{names.map((n) => <Tabs.Tab key={n} value={n}>{n.replace('assets/', 'assets/…')}</Tabs.Tab>)}</Tabs.List>
          {names.map((n) => (
            <Tabs.Panel key={n} value={n}>
              <code className="block text-sm break-all mb-2">{lessonPath(lesson.id, n)}</code>
              <pre className="mkx-code m-0" tabIndex={0} aria-label={n}>{lesson.files[n]}</pre>
            </Tabs.Panel>
          ))}
        </Tabs>
        <Paragraph data-size="sm">{t('source.editHow')}</Paragraph>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" asChild><a href={REPO_URL} target="_blank" rel="noreferrer">{t('source.edit')}</a></Button>
        </div>
        <Paragraph data-size="xs" className="m-0">{t('source.proto')}</Paragraph>
      </Dialog.Block>
    </>
  );
}

function ReportForm({ lesson, meta, sections, onClose }) {
  const { t, lang } = useStore();
  const [section, setSection] = useState('');
  const [desc, setDesc] = useState('');
  const [error, setError] = useState(null);
  const [stage, setStage] = useState('form');
  const { getRadioProps, value: kind } = useRadioGroup({ name: 'report-kind', value: 'unclear' });
  const kinds = [['math', 'kMath'], ['unclear', 'kUnclear'], ['language', 'kLanguage'], ['a11y', 'kA11y'], ['other', 'kOther']];
  const kindLabel = t(`report.${kinds.find((k) => k[0] === kind)?.[1] ?? 'kOther'}`);
  const sectionTitle = sections.find((s) => s.id === section)?.title ?? t('report.whole');
  const L2 = (k) => t(k).replace(/\?$/, '');
  const issue = `### ${kindLabel}: ${meta.title}\n\n- ${L2('report.lesson')}: ${lesson.id} (v${lesson.meta.version})\n- ${L2('report.language')}: ${lang === 'nb' ? 'nb (norsk bokmål)' : 'en (English)'}\n- ${L2('report.section')}: ${sectionTitle}${section ? ` (#${section})` : ''}\n- ${L2('report.file')}: ${lessonPath(lesson.id, `${lang}.md`)}\n\n${desc.trim()}`;

  if (stage === 'sent') {
    return (
      <>
        <Dialog.Block><Heading level={2} data-size="xs">{t('report.sentTitle')}</Heading></Dialog.Block>
        <Dialog.Block className="flex flex-col gap-3">
          <Alert data-color="info"><Paragraph>{t('report.sentProto')}</Paragraph></Alert>
          <div><Button onClick={onClose}>{t('report.close')}</Button></div>
        </Dialog.Block>
      </>
    );
  }
  if (stage === 'preview') {
    return (
      <>
        <Dialog.Block>
          <Heading level={2} data-size="xs">{t('report.previewTitle')}</Heading>
          <Paragraph className="mt-2">{t('report.previewLead')}</Paragraph>
        </Dialog.Block>
        <Dialog.Block className="flex flex-col gap-3">
          <pre className="mkx-code m-0" tabIndex={0} aria-label={t('report.previewTitle')}>{issue}</pre>
          <div>
            <span className="text-sm font-semibold">{t('report.notIncluded')}</span>
            <ul className="list-disc pl-6 m-0 text-sm">
              <li>{t('report.ni1')}</li><li>{t('report.ni2')}</li><li>{t('report.ni3')}</li>
            </ul>
          </div>
          <Paragraph data-size="sm" className="m-0">{t('report.destination')}</Paragraph>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setStage('sent')}>{t('report.submit')}</Button>
            <Button variant="secondary" onClick={() => setStage('form')}>{t('report.edit')}</Button>
          </div>
        </Dialog.Block>
      </>
    );
  }
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (!desc.trim()) { setError(t('report.descRequired')); return; } setStage('preview'); }} noValidate>
      <Dialog.Block>
        <Heading level={2} data-size="xs">{t('report.title')}</Heading>
        <Paragraph className="mt-2">{t('report.lead')}</Paragraph>
      </Dialog.Block>
      <Dialog.Block className="flex flex-col gap-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <Textfield label={t('report.lesson')} value={meta.title} readOnly />
          <Textfield label={t('report.language')} value={lang === 'nb' ? 'Norsk bokmål' : 'English'} readOnly />
        </div>
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
          <Button type="submit">{t('report.toPreview')}</Button>
          <Button type="button" variant="secondary" onClick={onClose}>{t('report.cancel')}</Button>
        </div>
      </Dialog.Block>
    </form>
  );
}
