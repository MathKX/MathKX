import { useMemo } from 'react';
import { Button, Card, Heading, Paragraph, Link, Tag, Alert } from '@digdir/designsystemet-react';
import { ArrowRightIcon, CogIcon, PersonCircleIcon } from '@navikt/aksel-icons';
import { useStore, sampleLearner } from '../store.jsx';
import { lessons, domains, findTopic } from '../content/catalog.js';
import { kinds } from '../domain/math.js';
import { skills, variants } from '../domain/practice.js';
import { summarizeDelivery, summarizeSession, sessionsFor, suggestNext, OUTCOMES } from '../domain/observations.js';
import { parseLesson } from '../components/Markdown.jsx';
import { MathExpr } from '../components/math/MathExpr.jsx';
import { PageHead } from '../components/Page.jsx';
import { LanguageSwitch } from '../App.jsx';
import { DomainGlyph } from './Landing.jsx';
import { OutcomeTag } from './Practice.jsx';

const fmtDate = (lang, at) => new Intl.DateTimeFormat(lang === 'nb' ? 'nb-NO' : 'en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(at);

/** Where the learner left off, described concretely. */
export function continueTarget(learner, L, t) {
  for (const [skillId, sid] of Object.entries(learner.active)) {
    const s = learner.sessions[sid];
    if (!s || s.endedAt || !s.current) continue;
    const d = learner.deliveries[s.current];
    const sum = summarizeDelivery(learner.events, d.id);
    const typed = learner.work[d.id]?.answer;
    return {
      href: `#/practice/${skillId}`,
      title: `${L(skills[skillId].title)} · ${L(variants[d.q.variant].title)}`,
      detail: sum.responses.length
        ? t('home.cont.answered', { q: kinds[d.q.kind].plain(d.q), n: s.deliveries.length })
        : typed ? t('home.cont.typed', { q: kinds[d.q.kind].plain(d.q), a: typed, n: s.deliveries.length }) : t('home.cont.open', { q: kinds[d.q.kind].plain(d.q), n: s.deliveries.length }),
      at: learner.last?.at,
    };
  }
  if (learner.last?.kind === 'lesson' && lessons[learner.last.id]) {
    return { href: learner.last.href, title: parseLesson(L(lessons[learner.last.id].source)).meta.title, detail: t('home.cont.lesson'), at: learner.last.at };
  }
  return null;
}

export function SuggestionCard({ learner, skillId }) {
  const { t, L } = useStore();
  const sug = suggestNext(learner.events, skillId);
  if (!sug) return null;
  const v = variants[sug.variant];
  const target = sug.kind === 'harder' ? (skills[skillId].ladder[skills[skillId].ladder.indexOf(sug.variant) + 1] ?? sug.variant) : sug.variant;
  return (
    <Card>
      <span className="text-sm font-semibold" style={{ color: 'var(--ds-color-neutral-text-subtle)' }}>{t('suggest.label')}</span>
      <Heading level={3} data-size="xs">{t(`suggest.${sug.kind}`, { variant: L(variants[target].title) })}</Heading>
      <Paragraph data-size="sm"><strong>{t('suggest.why')}</strong> {t(`suggest.reason.${sug.reason}`, { variant: L(v.title), q: sug.qid ? sug.qid : '' })}</Paragraph>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" asChild><a href={sug.kind === 'continue' ? `#/practice/${skillId}` : `#/practice/${skillId}?variant=${target}`}>{t(`suggest.go.${sug.kind}`)}</a></Button>
      </div>
      <Paragraph data-size="xs" className="m-0" style={{ color: 'var(--ds-color-neutral-text-subtle)' }}>{t('suggest.yourChoice')}</Paragraph>
    </Card>
  );
}

export function Home() {
  const { t, L, state, profile, lang } = useStore();
  const learner = state.learner;
  const empty = learner.events.length === 0;
  const cont = continueTarget(learner, L, t);
  const skillIds = [...new Set(learner.events.filter((e) => e.type === 'session-start' && skills[e.skill]).map((e) => e.skill))];
  const viewed = learner.events.filter((e) => e.type === 'lesson-viewed');
  const isSample = learner.events.some((e) => e.prov === 'sample');
  const recent = useMemo(() => learner.events.filter((e) => e.type === 'delivery').slice(-6).reverse(), [learner.events]);

  return (
    <div className="mkx-container pb-8">
      <PageHead title={profile ? t('home.welcome') : t('home.title')} />
      {!profile && <Alert data-color="info" className="mb-6 max-w-[48rem]"><Paragraph>{t('home.guestNote')}</Paragraph><Link href="#/profile/new">{t('nav.createProfile')}</Link></Alert>}
      {isSample && <Alert data-color="warning" className="mb-6 max-w-[48rem]"><Paragraph>{t('progress.sampleProfile')}</Paragraph></Alert>}

      {empty ? (
        <Card className="max-w-[48rem]" data-color="accent" variant="tinted">
          <Heading level={2} data-size="sm">{t('home.empty.title')}</Heading>
          <Paragraph>{t('home.empty.body')}</Paragraph>
          <div className="flex flex-wrap gap-2">
            <Button asChild><a href="#/lesson/number-bonds-to-ten">{t('home.empty.lesson')}</a></Button>
            <Button variant="secondary" asChild><a href="#/practice/arithmetic.add-within-20?variant=within-10">{t('home.empty.practice')}</a></Button>
            <Button variant="tertiary" asChild><a href="#/library">{t('home.browse')}</a></Button>
          </div>
          <Paragraph data-size="sm" className="m-0"><Link href="#/progress/arithmetic.add-within-20?sample=1">{t('home.empty.sample')}</Link></Paragraph>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="flex flex-col gap-6 min-w-0">
            {cont && (
              <Card data-color="accent" variant="tinted">
                <Heading level={2} data-size="xs">{t('home.continue')}</Heading>
                <Paragraph data-size="lg" className="font-semibold m-0">{cont.title}</Paragraph>
                <Paragraph className="m-0">{cont.detail}</Paragraph>
                <div><Button data-size="lg" asChild><a href={cont.href}>{t('home.continueBtn')}<ArrowRightIcon aria-hidden="true" /></a></Button></div>
              </Card>
            )}
            {skillIds.map((sk) => <SuggestionCard key={sk} learner={learner} skillId={sk} />)}

            <section aria-labelledby="skills-h" className="flex flex-col gap-3">
              <Heading level={2} data-size="xs" id="skills-h">{t('home.skillsTitle')}</Heading>
              {skillIds.length === 0 && <Paragraph data-size="sm">{t('home.noPractice')}</Paragraph>}
              {skillIds.map((sk) => <SkillCard key={sk} learner={learner} skillId={sk} />)}
              {viewed.length > 0 && (
                <Card>
                  <Heading level={3} data-size="2xs">{t('home.lessonsViewed')}</Heading>
                  <ul className="list-none m-0 p-0 flex flex-col gap-1">
                    {[...new Map(viewed.map((e) => [e.lesson, e])).values()].map((e) => (
                      <li key={e.lesson}><Link href={`#/lesson/${e.lesson}`}>{parseLesson(L(lessons[e.lesson]?.source ?? { nb: '', en: '' })).meta.title}</Link> <span className="text-sm">· {t('progress.viewedOn', { date: fmtDate(lang, e.at) })}</span></li>
                    ))}
                  </ul>
                  <Paragraph data-size="xs" className="m-0" style={{ color: 'var(--ds-color-neutral-text-subtle)' }}>{t('progress.viewedNote')}</Paragraph>
                </Card>
              )}
            </section>

            <section aria-labelledby="recent-h">
              <Heading level={2} data-size="xs" id="recent-h" className="mb-3">{t('home.recent')}</Heading>
              <ul className="list-none m-0 p-0 flex flex-col gap-2">
                {recent.map((e) => {
                  const d = learner.deliveries[e.delivery]; if (!d) return null;
                  const s = summarizeDelivery(learner.events, e.delivery);
                  return (
                    <li key={e.delivery} className="mkx-outcome-row">
                      <span className="flex items-center gap-3">
                        <span className="text-xl" aria-hidden="true"><MathExpr expr={kinds[d.q.kind].plain(d.q)} /></span>
                        <span className="ds-sr-only">{kinds[d.q.kind].spoken(d.q)[lang]}</span>
                        <OutcomeTag outcome={s.outcome} />
                        {s.explanationAfter && <Tag data-size="sm" data-color="neutral">{t('support.explainAfter')}</Tag>}
                        {learner.sessions[d.session]?.mode === 'check' && <span className="text-sm">{t('home.fromCheck')}</span>}
                        {e.prov === 'guest-import' && <Tag data-size="sm" data-color="neutral" variant="outline">{t('home.fromGuest')}</Tag>}
                      </span>
                      <span className="text-sm" style={{ color: 'var(--ds-color-neutral-text-subtle)' }}>{fmtDate(lang, e.at)}</span>
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>
          <aside className="flex flex-col gap-6">
            <BrowseCard />
            <ProfileCard />
          </aside>
        </div>
      )}
      {empty && <div className="grid gap-6 lg:grid-cols-2 mt-6 max-w-[64rem]"><BrowseCard /><ProfileCard /></div>}
    </div>
  );
}

function SkillCard({ learner, skillId }) {
  const { t, L } = useStore();
  const sessions = sessionsFor(learner.events, skillId).filter((x) => x.mode !== 'check');
  const items = sessions.flatMap((s) => summarizeSession(learner.events, s.session).items);
  const counts = Object.fromEntries(OUTCOMES.map((o) => [o, items.filter((i) => i.outcome === o).length]));
  return (
    <Card>
      <Heading level={3} data-size="xs"><Link href={`#/progress/${skillId}`}>{L(skills[skillId].title)}</Link></Heading>
      <ul className="list-none m-0 p-0 flex flex-col gap-1">
        {OUTCOMES.filter((o) => counts[o]).map((o) => <li key={o} className="flex items-center gap-2"><span className="tabular-nums font-semibold min-w-[1.5ch] text-right">{counts[o]}</span><OutcomeTag outcome={o} /></li>)}
      </ul>
      <Paragraph data-size="xs" className="m-0" style={{ color: 'var(--ds-color-neutral-text-subtle)' }}>{t('home.honest')}</Paragraph>
      <div><Button variant="secondary" data-size="sm" asChild><a href={`#/progress/${skillId}`}>{t('progress.open')}</a></Button></div>
    </Card>
  );
}

function BrowseCard() {
  const { t, L } = useStore();
  return (
    <Card>
      <Heading level={2} data-size="xs">{t('home.browse')}</Heading>
      <Paragraph data-size="sm">{t('home.browseLead')}</Paragraph>
      <ul className="list-none m-0 p-0 grid grid-cols-2 gap-2">
        {domains.map((d) => (
          <li key={d.id}><Link href={`#/domain/${d.id}`} className="flex items-center gap-2 min-h-11"><DomainGlyph icon={d.icon} size={28} />{L(d.title)}</Link></li>
        ))}
      </ul>
    </Card>
  );
}

function ProfileCard() {
  const { t, profile } = useStore();
  return (
    <Card variant="tinted">
      {profile ? (
        <>
          <span className="text-sm">{t('home.signedInAs')}</span>
          <span className="font-mono text-lg flex items-center gap-2"><PersonCircleIcon aria-hidden="true" />{profile.id}</span>
        </>
      ) : <Paragraph data-size="sm">{t('home.guestShort')}</Paragraph>}
      <div className="flex flex-col gap-2">
        <span className="ds-label">{t('settings.language')}</span>
        <LanguageSwitch size="md" />
      </div>
      {profile ? <div><Button variant="secondary" asChild><a href="#/settings"><CogIcon aria-hidden="true" />{t('home.settings')}</a></Button></div>
        : <div className="flex flex-wrap gap-2"><Button variant="secondary" asChild><a href="#/profile/new">{t('nav.createProfile')}</a></Button><Button variant="tertiary" asChild><a href="#/signin">{t('nav.signIn')}</a></Button></div>}
    </Card>
  );
}

// ---- Focused skill progress -----------------------------------------------------
export function ProgressPage({ skillId, query }) {
  const { t, L, state, lang } = useStore();
  const sample = query?.get('sample') === '1';
  const learner = useMemo(() => (sample ? sampleLearner(Date.UTC(2026, 9, 18, 10)) : state.learner), [sample, state.learner]);
  const sk = skills[skillId];
  if (!sk) return <div className="mkx-container py-10"><h1>404</h1></div>;
  const isSample = sample || learner.events.some((e) => e.prov === 'sample');
  const sessions = sessionsFor(learner.events, skillId);
  const lessonViews = learner.events.filter((e) => e.type === 'lesson-viewed' && e.lesson === sk.lesson);
  const all = sessions.filter((s) => s.mode !== 'check').flatMap((s) => summarizeSession(learner.events, s.session).items);
  const { topic } = findTopic(sk.topic);

  return (
    <div className="mkx-container pb-8">
      <PageHead title={L(sk.title)} lead={t('progress.lead')}
        crumbs={[{ href: '#/home', label: t('home.title') }, { href: `#/progress/${skillId}${sample ? '?sample=1' : ''}`, label: L(sk.title) }]} />
      {isSample && <Alert data-color="warning" className="mb-6 max-w-[48rem]"><Heading level={2} data-size="2xs">{t('progress.sampleTitle')}</Heading><Paragraph>{t('progress.sampleBody')}</Paragraph></Alert>}

      {all.length === 0 && lessonViews.length === 0 ? (
        <Card className="max-w-[44rem]">
          <Heading level={2} data-size="xs">{t('progress.emptyTitle')}</Heading>
          <Paragraph>{t('progress.emptyBody')}</Paragraph>
          <div className="flex flex-wrap gap-2">
            <Button asChild><a href={`#/practice/${skillId}`}>{t('topic.startPractice')}</a></Button>
            <Button variant="tertiary" asChild><a href={`#/progress/${skillId}?sample=1`}>{t('home.empty.sample')}</a></Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="flex flex-col gap-6 min-w-0">
            <section aria-labelledby="obs-h" className="flex flex-col gap-3">
              <Heading level={2} data-size="xs" id="obs-h">{t('progress.observed')}</Heading>
              <Paragraph data-size="sm" className="m-0">{t('progress.observedNote')}</Paragraph>
              <ul className="list-none m-0 p-0 flex flex-col gap-2">
                {lessonViews.length > 0 && <li className="mkx-outcome-row"><span>{t(lessonViews.length === 1 ? 'progress.lessonViewed1' : 'progress.lessonViewed', { title: parseLesson(L(lessons[sk.lesson].source)).meta.title, n: lessonViews.length })}</span><Tag data-size="sm" data-color="neutral" variant="outline">{t('outcome.viewed')}</Tag></li>}
                {OUTCOMES.map((o) => {
                  const n = all.filter((i) => i.outcome === o).length;
                  return n ? <li key={o} className="mkx-outcome-row"><span>{t(`progress.count.${o}`, { n })}</span><OutcomeTag outcome={o} /></li> : null;
                })}
                {all.filter((i) => i.explanationAfter).length > 0 && <li className="mkx-outcome-row"><span>{t('progress.count.explainAfter', { n: all.filter((i) => i.explanationAfter).length })}</span><Tag data-size="sm" data-color="neutral">{t('support.explainAfter')}</Tag></li>}
              </ul>
            </section>

            <section aria-labelledby="sess-h" className="flex flex-col gap-3">
              <Heading level={2} data-size="xs" id="sess-h">{t('progress.sessions')}</Heading>
              {sessions.map((s) => {
                const sum = summarizeSession(learner.events, s.session);
                const vs = [...new Set(sum.items.map((i) => i.variant))];
                return (
                  <Card key={s.session}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Heading level={3} data-size="2xs" className="m-0">{s.mode === 'check' ? t('check.titlePrefix') : vs.map((v) => L(variants[v]?.title ?? v)).join(' → ')}</Heading>
                      <span className="text-sm">{fmtDate(lang, s.at)} · {sum.ended ? t('progress.ended') : t('progress.notEnded')}</span>
                    </div>
                    <ul className="list-none m-0 p-0 flex flex-col gap-2">
                      {sum.items.map((i) => {
                        const d = learner.deliveries[i.delivery];
                        return (
                          <li key={i.delivery} className="mkx-outcome-row">
                            <span className="flex items-center gap-3">
                              <span className="text-lg" aria-hidden="true"><MathExpr expr={kinds[d.q.kind].plain(d.q)} /></span>
                              <span className="ds-sr-only">{kinds[d.q.kind].spoken(d.q)[lang]}</span>
                              <span className="text-sm">{i.responses.length ? t('progress.answers', { list: i.responses.map((r) => r.answer).join(', ') }) : ''}{i.invalid ? ` · ${t('progress.invalid', { n: i.invalid })}` : ''}</span>
                            </span>
                            <span className="flex flex-wrap gap-2">
                              <OutcomeTag outcome={i.outcome} />
                              {i.explanationAfter && <Tag data-size="sm" data-color="neutral">{t('support.explainAfter')}</Tag>}
                              {i.repeat && <Tag data-size="sm" data-color="neutral">{t('practice.repeatTag')}</Tag>}
                              {i.events[0]?.prov === 'guest-import' && <Tag data-size="sm" data-color="neutral" variant="outline">{t('home.fromGuest')}</Tag>}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </Card>
                );
              })}
            </section>
          </div>
          <aside className="flex flex-col gap-4">
            {!sample && <SuggestionCard learner={learner} skillId={skillId} />}
            {sample && (
              <Card>
                <span className="text-sm font-semibold">{t('suggest.label')}</span>
                <Paragraph data-size="sm">{t('progress.sampleSuggest')}</Paragraph>
              </Card>
            )}
            <Card variant="tinted">
              <Heading level={2} data-size="2xs">{t('progress.meaningTitle')}</Heading>
              <dl className="m-0 flex flex-col gap-2">
                {['correctFirst', 'correctWithVisualHelp', 'correctAfterFeedback', 'correctAfterExplanation', 'notYetCorrect', 'skipped', 'unfinished', 'viewed'].map((o) => (
                  <div key={o}><dt className="font-semibold text-sm">{t(`outcome.${o}`)}</dt><dd className="m-0 text-sm">{t(`outcomeDef.${o}`)}</dd></div>
                ))}
              </dl>
              <Paragraph data-size="sm" className="m-0">{t('progress.notMastery')}</Paragraph>
            </Card>
            <Link href={`#/topic/${topic.id}`}>{L(topic.title)}</Link>
          </aside>
        </div>
      )}
    </div>
  );
}
