import { Breadcrumbs, Heading, Paragraph } from '@digdir/designsystemet-react';
import { useStore } from '../store.jsx';

export function Crumbs({ items }) {
  const { t } = useStore();
  if (!items?.length) return null;
  return (
    <Breadcrumbs aria-label={t('nav.breadcrumbs')} className="mb-4">
      <Breadcrumbs.Link href={items.at(-2)?.href ?? '#/'}>{items.at(-2)?.label ?? 'MathKX'}</Breadcrumbs.Link>
      <Breadcrumbs.List>
        {items.map((it, i) => (
          <Breadcrumbs.Item key={i}>
            <Breadcrumbs.Link href={it.href} aria-current={i === items.length - 1 ? 'page' : undefined}>{it.label}</Breadcrumbs.Link>
          </Breadcrumbs.Item>
        ))}
      </Breadcrumbs.List>
    </Breadcrumbs>
  );
}

export function PageHead({ title, lead, crumbs, children, eyebrow }) {
  return (
    <div className="pt-6 pb-6 md:pt-10">
      <Crumbs items={crumbs} />
      {eyebrow}
      <Heading level={1} data-size="lg" tabIndex={-1}>{title}</Heading>
      {lead && <Paragraph data-size="lg" className="mt-3 max-w-[42rem]" style={{ color: 'var(--ds-color-neutral-text-subtle)' }}>{lead}</Paragraph>}
      {children}
    </div>
  );
}
