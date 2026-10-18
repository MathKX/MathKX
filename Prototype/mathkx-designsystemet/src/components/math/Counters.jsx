import { useStore } from '../../store.jsx';
import { Button, Paragraph } from '@digdir/designsystemet-react';

/** One rounded-square counter. kind: 'a' | 'b' | 'empty' | 'removed' */
export function Counter({ kind, label, current, children }) {
  return (
    <span className="mkx-counter" data-kind={kind} data-current={current ? 'true' : undefined} aria-label={label} role={label ? 'img' : undefined}>
      {children ?? (kind === 'b' ? <span className="mkx-pip" aria-hidden="true" /> : null)}
    </span>
  );
}

function columnsFor(n) {
  if (n <= 2) return n;
  if (n <= 4) return 2;
  if (n <= 6) return 3;
  return 5;
}

/** A labelled group of counters, laid out compactly (4 -> 2x2). Each counter is a list item. */
export function CounterGroup({ n, kind, title, offset = 0, countedUpTo = 0, groupIndex }) {
  const { t } = useStore();
  const cols = columnsFor(n);
  return (
    <figure className="m-0 flex flex-col items-center gap-2" aria-labelledby={`grp-${groupIndex}-cap`}>
      <figcaption id={`grp-${groupIndex}-cap`} className="font-semibold text-center">{title}</figcaption>
      <ul className="m-0 p-2 list-none grid gap-2 rounded-xl" style={{ gridTemplateColumns: `repeat(${cols}, auto)`, border: '1px solid var(--ds-color-neutral-border-subtle)', background: 'var(--ds-color-neutral-background-default)' }} aria-label={title}>
        {Array.from({ length: n }, (_, i) => {
          const num = offset + i + 1;
          const isCounted = num <= countedUpTo;
          return (
            <li key={i} className="m-0">
              <Counter kind={kind} label={`${t('help.counter', { i: i + 1, n })}${isCounted ? ` – ${num}` : ''}`} current={num === countedUpTo}>
                {isCounted ? <span aria-hidden="true">{num}</span> : undefined}
              </Counter>
            </li>
          );
        })}
      </ul>
    </figure>
  );
}

/** Visual help for small additions: two separated groups with a plus sign between them. */
export function GroupsHelp({ a, b, work, update }) {
  const { t } = useStore();
  const counting = work.helpUsed?.includes('counting');
  const counted = work.counted ?? 0;
  const total = a + b;
  const countNext = () => update((w) => {
    const next = Math.min(total, (w.counted ?? 0) + 1);
    const used = addOnce(w.helpUsed, 'counting');
    return { counted: next, helpUsed: next >= total ? addOnce(used, 'counted-all') : used };
  });
  return (
    <div className="flex flex-col gap-4">
      <Paragraph data-size="lg" className="font-semibold" id="groups-q">{t('help.groupsQuestion')}</Paragraph>
      <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8">
        <CounterGroup n={a} kind="a" title={t('help.group1', { n: a })} countedUpTo={counted} groupIndex={1} />
        <span className="text-4xl font-bold" aria-hidden="true">+</span>
        <span className="ds-sr-only">pluss</span>
        <CounterGroup n={b} kind="b" title={t('help.group2', { n: b })} offset={a} countedUpTo={counted} groupIndex={2} />
      </div>
      {!counting ? (
        <div>
          <Button variant="secondary" onClick={() => update((w) => ({ helpUsed: addOnce(w.helpUsed, 'counting') }))}>{t('help.countStep')}</Button>
        </div>
      ) : (
        <div className="mkx-panel flex flex-col gap-3">
          <Paragraph>{t('help.countIntro', { a })}</Paragraph>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={countNext} disabled={counted >= total}>{t('help.countNext')}</Button>
            {counted < a && <Button variant="tertiary" onClick={() => update((w) => ({ counted: a, helpUsed: addOnce(w.helpUsed, 'counting') }))}>{t('help.countOn', { a })}</Button>}
            {counted > 0 && <Button variant="tertiary" onClick={() => update({ counted: 0 })}>{t('help.countRestart')}</Button>}
          </div>
          <p className="m-0" role="status" aria-live="polite">{counted > 0 ? t('help.counted', { i: counted }) : ''}</p>
          {counted >= total && <Paragraph data-size="sm">{t('help.countDoneNote')}</Paragraph>}
        </div>
      )}
    </div>
  );
}

export function addOnce(list = [], item) { return list.includes(item) ? list : [...list, item]; }
