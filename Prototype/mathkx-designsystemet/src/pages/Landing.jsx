import { Button, Card, Heading, Paragraph, Link, Tag } from '@digdir/designsystemet-react';
import { BookIcon, LightBulbIcon, PencilWritingIcon, PadlockLockedIcon, PersonGroupIcon, ArrowRightIcon } from '@navikt/aksel-icons';
import { useStore } from '../store.jsx';
import { domains } from '../content/catalog.js';
import { TenFrameExplorer } from '../components/math/TenFrame.jsx';

export function DomainGlyph({ icon, size = 44 }) {
  return (
    <span aria-hidden="true" className="grid place-items-center rounded-xl font-bold shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.5, background: 'var(--ds-color-accent-surface-tinted)', color: 'var(--ds-color-accent-text-default)', fontFamily: icon === 'x' || icon === 'ƒ' ? 'Georgia, serif' : undefined, fontStyle: icon === 'x' ? 'italic' : undefined }}>
      {icon}
    </span>
  );
}

export function Landing() {
  const { t, L, state } = useStore();
  const explored = state.learner.events.length;
  return (
    <>
      <section className="mkx-container pt-10 pb-12 md:pt-16 grid gap-10 lg:grid-cols-[1.1fr_1fr] items-center">
        <div className="flex flex-col gap-5">
          <Heading level={1} data-size="xl" className="max-w-[18ch]">{t('landing.title')}</Heading>
          <Paragraph data-size="lg" className="max-w-[40rem]" style={{ color: 'var(--ds-color-neutral-text-subtle)' }}>{t('landing.lead')}</Paragraph>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button data-size="lg" asChild><a href="#/library">{t('landing.start')}<ArrowRightIcon aria-hidden="true" /></a></Button>
            <Button data-size="lg" variant="secondary" asChild><a href="#/profile/new">{t('landing.create')}</a></Button>
          </div>
          <Paragraph data-size="sm" style={{ color: 'var(--ds-color-neutral-text-subtle)' }}>{t('landing.noProfileNeeded')}</Paragraph>
          {explored > 0 && !state.profileId && (
            <Paragraph data-size="sm"><Link href="#/home">{t('home.guestNote')}</Link></Paragraph>
          )}
        </div>
        <section aria-labelledby="try-h" className="flex flex-col gap-3">
          <Heading level={2} data-size="xs" id="try-h">{t('landing.tryTitle')}</Heading>
          <Paragraph>{t('landing.tryLead')}</Paragraph>
          <TenFrameExplorer start={7} compact />
          <Link href="#/lesson/number-bonds-to-ten">{t('landing.tryLesson')}</Link>
        </section>
      </section>

      <section aria-labelledby="ben-h" className="py-12" style={{ background: 'var(--ds-color-neutral-background-tinted)' }}>
        <div className="mkx-container">
          <Heading level={2} data-size="md" id="ben-h" className="mb-6">{t('landing.benefitsTitle')}</Heading>
          <ul className="list-none m-0 p-0 grid gap-4 lg:grid-cols-3">
            {[[BookIcon, 'b1'], [LightBulbIcon, 'b2'], [PencilWritingIcon, 'b3']].map(([Icon, k]) => (
              <li key={k}>
                <Card className="h-full">
                  <Icon aria-hidden="true" fontSize="2rem" style={{ color: 'var(--ds-color-accent-text-default)' }} />
                  <Heading level={3} data-size="xs">{t(`landing.${k}t`)}</Heading>
                  <Paragraph>{t(`landing.${k}`)}</Paragraph>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="dom-h" className="mkx-container py-12">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <Heading level={2} data-size="md" id="dom-h">{t('landing.domainsTitle')}</Heading>
            <Paragraph className="mt-2 max-w-[42rem]">{t('landing.domainsLead')}</Paragraph>
          </div>
          <Link href="#/library">{t('landing.allDomains')}</Link>
        </div>
        <ul className="list-none m-0 p-0 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {domains.map((d) => {
            const ready = d.topics.filter((x) => x.status === 'available').length;
            const preview = d.topics.filter((x) => x.status === 'design-preview').length;
            return (
              <li key={d.id}>
                <Card asChild className="h-full" data-color="neutral">
                  <a href={`#/domain/${d.id}`} className="no-underline">
                    <div className="flex items-center gap-3"><DomainGlyph icon={d.icon} size={40} /><Heading level={3} data-size="2xs">{L(d.title)}</Heading></div>
                    <Paragraph data-size="sm">{L(d.range)}</Paragraph>
                    <span className="flex flex-wrap gap-2">
                      {ready > 0 && <Tag data-color="success" data-size="sm">{t('landing.readyTopics', { n: ready })}</Tag>}
                      {preview > 0 && <Tag data-color="warning" data-size="sm">{t('library.designPreview')}</Tag>}
                      {!ready && !preview && <Tag data-color="neutral" data-size="sm" variant="outline">{t('landing.plannedOnly')}</Tag>}
                    </span>
                  </a>
                </Card>
              </li>
            );
          })}
        </ul>
        <Card className="mt-6" aria-labelledby="adv-h">
          <Heading level={3} data-size="xs" id="adv-h">{t('landing.advancedTitle')}</Heading>
          <Paragraph className="m-0">{t('landing.advancedBody')}</Paragraph>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" asChild><a href="#/preview/derivative">{t('landing.advancedPreview')}</a></Button>
            <Button variant="tertiary" asChild><a href="#/domain/calculus">{t('landing.advancedPlanned')}</a></Button>
          </div>
        </Card>
      </section>

      <section className="mkx-container grid gap-6 lg:grid-cols-2 pb-6">
        <Card variant="tinted" data-color="accent" aria-labelledby="priv-h">
          <PadlockLockedIcon aria-hidden="true" fontSize="2rem" />
          <Heading level={2} data-size="sm" id="priv-h">{t('landing.privacyTitle')}</Heading>
          <Paragraph>{t('landing.privacy')}</Paragraph>
          <Paragraph data-size="sm">{t('landing.privacyNote')}</Paragraph>
          <div><Button variant="secondary" asChild><a href="#/profile/new">{t('nav.createProfile')}</a></Button></div>
        </Card>
        <Card aria-labelledby="os-h">
          <PersonGroupIcon aria-hidden="true" fontSize="2rem" />
          <Heading level={2} data-size="sm" id="os-h">{t('landing.osTitle')}</Heading>
          <Paragraph>{t('landing.os')}</Paragraph>
          <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 m-0">
            {['Learners', 'Educators', 'Translators', 'Developers'].map((k) => (
              <div key={k}><dt className="font-semibold">{t(`landing.os${k}`)}</dt><dd className="m-0">{t(`landing.os${k}D`)}</dd></div>
            ))}
          </dl>
          <Link href="#/about">{t('landing.osCta')}</Link>
        </Card>
      </section>
    </>
  );
}
