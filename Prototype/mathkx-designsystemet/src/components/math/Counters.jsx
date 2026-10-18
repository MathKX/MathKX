import { useId } from 'react';
import { Button, Paragraph } from '@digdir/designsystemet-react';
import { useStore } from '../../store.jsx';

/** One rounded-square counter. kind: 'a' | 'b' | 'empty' | 'removed' */
export function Counter({ kind, label, current, children }) {
  return (
    <span className="mkx-counter" data-kind={kind} data-current={current ? 'true' : undefined} aria-label={label} role={label ? 'img' : undefined}>
      {children ?? (kind === 'b' ? <span className="mkx-pip" aria-hidden="true" /> : null)}
    </span>
  );
}

export function columnsFor(n) {
  if (n <= 2) return n;
  if (n <= 4) return 2;
  if (n <= 6) return 3;
  return 5;
}

/** A labelled group of counters, laid out compactly (4 -> 2x2). Each counter is a list item. */
export function CounterGroup({ n, kind, title, offset = 0, countedUpTo = 0, numbered = false }) {
  const { t } = useStore();
  const id = useId();
  const cols = columnsFor(n);
  return (
    <figure className="m-0 flex flex-col items-center gap-2" aria-labelledby={id}>
      <figcaption id={id} className="font-semibold text-center">{title}</figcaption>
      <ul className="m-0 p-2 list-none grid gap-2 rounded-xl" style={{ gridTemplateColumns: `repeat(${cols}, auto)`, border: '1px solid var(--ds-color-neutral-border-subtle)', background: 'var(--ds-color-neutral-background-default)' }} aria-label={title}>
        {Array.from({ length: n }, (_, i) => {
          const num = offset + i + 1;
          const shown = numbered || num <= countedUpTo;
          return (
            <li key={i} className="m-0">
              <Counter kind={kind} label={`${t('help.counter', { i: i + 1, n })}${shown ? ` – ${num}` : ''}`} current={!numbered && num === countedUpTo}>
                {shown ? <span aria-hidden="true">{num}</span> : undefined}
              </Counter>
            </li>
          );
        })}
      </ul>
    </figure>
  );
}

export function PlusSign() {
  const { t } = useStore();
  return <><span className="text-3xl font-bold" aria-hidden="true">+</span><span className="ds-sr-only">{t('help.plus')}</span></>;
}

/** Visual help for small additions: two separated groups, optional step-by-step counting. */
export function GroupsHelp({ a, b, work, onWork, onSupport }) {
  const { t } = useStore();
  const counting = work.counting;
  const counted = work.counted ?? 0;
  const total = a + b;
  const countTo = (n) => {
    onWork({ counted: n, counting: true });
    onSupport('counting');
    if (n >= total) onSupport('counting-complete');
  };
  return (
    <div className="flex flex-col gap-3">
      <Paragraph className="font-semibold m-0">{t('help.groupsQuestion')}</Paragraph>
      <div className="flex flex-wrap items-center justify-center gap-3 md:gap-6">
        <CounterGroup n={a} kind="a" title={t('help.group1', { n: a })} countedUpTo={counted} />
        <PlusSign />
        <CounterGroup n={b} kind="b" title={t('help.group2', { n: b })} offset={a} countedUpTo={counted} />
      </div>
      {!counting ? (
        <div><Button variant="tertiary" onClick={() => { onWork({ counting: true }); onSupport('counting'); }}>{t('help.countStep')}</Button></div>
      ) : (
        <div className="flex flex-col gap-2">
          <Paragraph data-size="sm" className="m-0">{t('help.countIntro', { a })}</Paragraph>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => countTo(Math.min(total, counted + 1))} disabled={counted >= total}>{t('help.countNext')}</Button>
            {counted < a && <Button variant="tertiary" onClick={() => countTo(a)}>{t('help.countOn', { a })}</Button>}
            {counted > 0 && <Button variant="tertiary" onClick={() => onWork({ counted: 0 })}>{t('help.countRestart')}</Button>}
          </div>
          <p className="m-0 text-sm" role="status">{counted > 0 ? t('help.counted', { i: counted }) : ''}</p>
          {counted >= total && <Paragraph data-size="sm" className="m-0">{t('help.countDoneNote')}</Paragraph>}
        </div>
      )}
    </div>
  );
}
