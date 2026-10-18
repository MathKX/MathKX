import { useState } from 'react';
import { Button, Paragraph } from '@digdir/designsystemet-react';
import { useStore } from '../../store.jsx';
import { Counter } from './Counters.jsx';
import { MathExpr } from './MathExpr.jsx';

/** A 2×5 ten-frame. cells: array of 10 kinds ('a' | 'b' | 'empty'). */
export function TenFrame({ cells, label }) {
  return (
    <div role="img" aria-label={label} className="mkx-tenframe">
      {cells.map((k, i) => <Counter key={i} kind={k} />)}
    </div>
  );
}

export function Legend() {
  const { t } = useStore();
  return (
    <ul className="m-0 p-0 list-none flex flex-wrap gap-x-6 gap-y-1 text-sm" aria-label={t('help.legend')}>
      <li className="flex items-center gap-2"><span className="mkx-counter" data-kind="a" style={{ '--c-size': '1.25rem' }} aria-hidden="true" />{t('help.legendA')}</li>
      <li className="flex items-center gap-2"><span className="mkx-counter" data-kind="b" style={{ '--c-size': '1.25rem' }} aria-hidden="true" />{t('help.legendB')}</li>
    </ul>
  );
}

export const fill = (a, b = 0) => Array.from({ length: 10 }, (_, i) => (i < a ? 'a' : i < a + b ? 'b' : 'empty'));

/** Landing/lesson explorer: choose a number, see its partner to ten. Exploration only, nothing is scored. */
export function TenFrameExplorer({ start = 4, compact = false }) {
  const { t } = useStore();
  const [n, setN] = useState(Number(start));
  const partner = 10 - n;
  return (
    <div className="mkx-panel flex flex-col gap-4 not-prose">
      <div className="flex flex-wrap items-center gap-3" role="group" aria-label={t('landing.tryNumber')}>
        <Button variant="secondary" icon aria-label={t('help.oneLess')} onClick={() => setN((v) => Math.max(0, v - 1))} disabled={n <= 0}>
          <span aria-hidden="true" className="text-2xl leading-none">−</span>
        </Button>
        <output className="text-4xl font-bold min-w-[2ch] text-center" aria-live="polite" aria-label={`${t('landing.tryNumber')}: ${n}`}>{n}</output>
        <Button variant="secondary" icon aria-label={t('help.oneMore')} onClick={() => setN((v) => Math.min(10, v + 1))} disabled={n >= 10}>
          <span aria-hidden="true" className="text-2xl leading-none">+</span>
        </Button>
      </div>
      <TenFrame cells={fill(n)} label={t('help.frameDesc', { filled: n })} />
      <div aria-live="polite">
        <Paragraph data-size="lg" className="font-semibold">{t('help.needs', { n, partner })}</Paragraph>
        <Paragraph className={compact ? 'text-2xl' : 'text-3xl'}><MathExpr expr={`${n} + ${partner} = 10`} /></Paragraph>
      </div>
    </div>
  );
}
