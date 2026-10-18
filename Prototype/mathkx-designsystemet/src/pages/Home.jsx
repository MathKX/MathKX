import { Button, Card, Heading, Paragraph, Link, Tag, Alert } from '@digdir/designsystemet-react';
import { ArrowRightIcon, CogIcon, PersonCircleIcon } from '@navikt/aksel-icons';
import { useStore } from '../store.jsx';
import { findTopic, lessons, practiceSets, checks, allQuestions, domains } from '../content/catalog.js';
import { kinds } from '../domain/math.js';
import { parseLesson } from '../components/Markdown.jsx';
import { MathExpr } from '../components/math/MathExpr.jsx';
import { PageHead } from '../components/Page.jsx';
import { lessonStatus, practiceStatus, checkStatus, statusColor } from '../activity.js';
import { LanguageSwitch } from '../App.jsx';
import { DomainGlyph } from './Landing.jsx';

export function Home() {
  const { t, L, state, profile, lang } = useStore();
  const p = state.progress;
  const qmap = allQuestions();
  const last = p.last;

  // Resolve the "continue" target and current topic
  let lastTitle = null; let topicId = 'arithmetic.addition-within-20';
  if (last?.kind === 'lesson' && lessons[last.id]) { lastTitle = parseLesson(L(lessons[last.id].source)).meta.title; topicId = lessons[last.id].topic; }
  if (last?.kind === 'practice' && practiceSets[last.id]) { lastTitle = L(practiceSets[last.id].title); topicId = practiceSets[last.id].topic; }
  const current = findTopic(topicId);
  const det = current.details;
  const recent = [...p.attempts].reverse().slice(0, 6);
  const fmt = new Intl.DateTimeFormat(lang === 'nb' ? 'nb-NO' : 'en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="mkx-container">
      <PageHead title={profile ? t('home.welcome') : t('home.title')} />
      {!profile && <Alert data-color="info" className="mb-6 max-w-[44rem]"><Paragraph>{t('home.guestNote')}</Paragraph><Link href="#/profile/new">{t('nav.createProfile')}</Link></Alert>}
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="flex flex-col gap-6">
          <Card data-color="accent" variant="tinted">
            <Heading level={2} data-size="xs">{t('home.continue')}</Heading>
            <Paragraph data-size="lg" className="font-semibold">{lastTitle ?? parseLesson(L(lessons['number-bonds-to-ten'].source)).meta.title}</Paragraph>
            <div><Button data-size="lg" asChild><a href={last?.href ?? '#/lesson/number-bonds-to-ten'}>{t('home.continueBtn')}<ArrowRightIcon aria-hidden="true" /></a></Button></div>
          </Card>

          <Card>
            <span className="text-sm font-semibold" style={{ color: 'var(--ds-color-neutral-text-subtle)' }}>{t('home.currentTopic')}</span>
            <Heading level={2} data-size="sm"><Link href={`#/topic/${current.topic.id}`}>{L(current.topic.title)}</Link></Heading>
            <ul className="list-none m-0 p-0 flex flex-col">
              {det.lessons.map((lid) => {
                const s = lessonStatus(p, lid);
                return <Row key={lid} href={`#/lesson/${lid}`} label={parseLesson(L(lessons[lid].source)).meta.title} status={s} />;
              })}
              <Row href={`#/practice/${det.practice}`} label={`${t('topic.practice')}: ${L(practiceSets[det.practice].title)}`} status={practiceStatus(p, det.practice)} />
              <Row href={`#/check/${det.check}`} label={t('topic.check')} status={checkStatus(p, det.check)} />
            </ul>
            <Paragraph data-size="sm" style={{ color: 'var(--ds-color-neutral-text-subtle)' }}>{t('home.honest')}</Paragraph>
          </Card>

          <section aria-labelledby="recent-h">
            <Heading level={2} data-size="xs" id="recent-h" className="mb-3">{t('home.recent')}</Heading>
            {recent.length === 0 ? <Paragraph>{t('home.noRecent')}</Paragraph> : (
              <ul className="list-none m-0 p-0 flex flex-col gap-2">
                {recent.map((a, i) => {
                  const q = qmap[a.qid];
                  if (!q) return null;
                  const label = a.correct ? (a.help?.length ? t('home.correctHelp') : t('home.correctIndependent')) : t('home.notYet');
                  return (
                    <li key={i} className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl" style={{ background: 'var(--ds-color-neutral-background-tinted)' }}>
                      <span className="flex items-center gap-3">
                        <span className="text-xl font-semibold" aria-hidden="true"><MathExpr expr={kinds[q.kind].expression(q).replace(' = ?', '')} /></span>
                        <span className="ds-sr-only">{kinds[q.kind].spoken(q)[lang]}</span>
                        <Tag data-size="sm" data-color={a.correct ? (a.help?.length ? 'info' : 'success') : 'neutral'}>{label}</Tag>
                        {a.mode === 'check' && <span className="text-sm">{t('home.fromCheck')}</span>}
                      </span>
                      <span className="text-sm" style={{ color: 'var(--ds-color-neutral-text-subtle)' }}>{fmt.format(a.at)}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        <aside className="flex flex-col gap-6">
          <Card>
            <Heading level={2} data-size="xs">{t('home.browse')}</Heading>
            <Paragraph data-size="sm">{t('home.browseLead')}</Paragraph>
            <ul className="list-none m-0 p-0 grid grid-cols-2 gap-2">
              {domains.map((d) => (
                <li key={d.id}><Link href={`#/domain/${d.id}`} className="flex items-center gap-2 min-h-11"><DomainGlyph icon={d.icon} size={28} />{L(d.title)}</Link></li>
              ))}
            </ul>
            <div><Button variant="secondary" asChild><a href="#/library">{t('landing.allDomains')}</a></Button></div>
          </Card>
          <Card variant="tinted">
            {profile ? (
              <>
                <span className="text-sm">{t('home.signedInAs')}</span>
                <span className="font-mono text-lg flex items-center gap-2"><PersonCircleIcon aria-hidden="true" />{profile.id}</span>
              </>
            ) : <Paragraph data-size="sm">{t('home.guestNote')}</Paragraph>}
            <div className="flex flex-col gap-2">
              <span className="ds-label">{t('settings.language')}</span>
              <LanguageSwitch size="md" />
            </div>
            {profile && <div><Button variant="secondary" asChild><a href="#/settings"><CogIcon aria-hidden="true" />{t('home.settings')}</a></Button></div>}
          </Card>
        </aside>
      </div>
    </div>
  );
}

function Row({ href, label, status }) {
  const { t } = useStore();
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 py-3 border-b last:border-b-0" style={{ borderColor: 'var(--ds-color-neutral-border-subtle)' }}>
      <Link href={href}>{label}</Link>
      <Tag data-size="sm" data-color={statusColor(status)} variant={status === 'notStarted' ? 'outline' : 'default'}>{t(`status.${status}`)}</Tag>
    </li>
  );
}
