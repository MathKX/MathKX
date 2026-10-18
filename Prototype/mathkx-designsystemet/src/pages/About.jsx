import { Button, Card, Heading, Paragraph, Alert, List } from '@digdir/designsystemet-react';
import { useStore } from '../store.jsx';
import { PageHead } from '../components/Page.jsx';
import { REPO_URL } from '../App.jsx';

export function About() {
  const { t } = useStore();
  const levels = [['orgDomain', 'orgDomainEx'], ['orgTopic', 'orgTopicEx'], ['orgSkill', 'orgSkillEx'], ['orgContent', 'orgContentEx']];
  return (
    <div className="mkx-container">
      <PageHead title={t('about.title')} lead={t('about.lead')} />
      <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        <div className="flex flex-col gap-10 max-w-[44rem]">
          <section aria-labelledby="a-what">
            <Heading level={2} data-size="sm" id="a-what">{t('about.whatT')}</Heading>
            <Paragraph data-size="lg" className="mt-3">{t('about.what')}</Paragraph>
          </section>

          <section aria-labelledby="a-org">
            <Heading level={2} data-size="sm" id="a-org">{t('about.orgT')}</Heading>
            <Paragraph data-size="lg" className="mt-3">{t('about.org')}</Paragraph>
            <ol className="list-none m-0 p-0 mt-4 flex flex-col gap-2">
              {levels.map(([k, ex], i) => (
                <li key={k} className="flex items-center gap-3 rounded-xl p-3" style={{ marginInlineStart: `${i * 1.25}rem`, background: 'var(--ds-color-accent-background-tinted)', border: '1px solid var(--ds-color-accent-border-subtle)' }}>
                  <span className="font-semibold min-w-[8.5rem]">{i > 0 && <span aria-hidden="true">↳ </span>}{t(`about.${k}`)}</span>
                  <span>{t(`about.${ex}`)}</span>
                </li>
              ))}
            </ol>
          </section>

          <section aria-labelledby="a-corr">
            <Heading level={2} data-size="sm" id="a-corr">{t('about.correctT')}</Heading>
            <Paragraph data-size="lg" className="mt-3">{t('about.correct')}</Paragraph>
            <div className="mt-3"><Button variant="secondary" asChild><a href="#/lesson/number-bonds-to-ten">{t('lesson.suggest')} →</a></Button></div>
          </section>

          <section aria-labelledby="a-contrib">
            <Heading level={2} data-size="sm" id="a-contrib">{t('about.contribT')}</Heading>
            <List.Unordered className="mt-3 text-lg list-disc pl-6">
              <List.Item>{t('about.contribLessons')}</List.Item>
              <List.Item>{t('about.contribTranslations')}</List.Item>
              <List.Item>{t('about.contribCode')}</List.Item>
            </List.Unordered>
          </section>

          <section aria-labelledby="a-rev">
            <Heading level={2} data-size="sm" id="a-rev">{t('about.reviewT')}</Heading>
            <Paragraph data-size="lg" className="mt-3">{t('about.review')}</Paragraph>
          </section>
        </div>
        <aside className="flex flex-col gap-4">
          <Card>
            <Heading level={2} data-size="xs">{t('about.repo')}</Heading>
            <Paragraph data-size="sm">{t('about.repoNote')}</Paragraph>
            <div><Button asChild><a href={REPO_URL} target="_blank" rel="noreferrer">github.com/MathKX/MathKX</a></Button></div>
          </Card>
          <Alert data-color="warning">
            <Heading level={2} data-size="2xs">{t('about.protoT')}</Heading>
            <Paragraph data-size="sm">{t('about.proto')}</Paragraph>
          </Alert>
        </aside>
      </div>
    </div>
  );
}
