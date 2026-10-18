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
    <ul className="m-0 p-0 list-none flex flex-wrap gap-x-6 gap-y-2 text-sm" aria-label="Legend">
      <li className="flex items-center gap-2"><span className="mkx-counter" data-kind="a" style={{ '--c-size': '1.25rem' }} aria-hidden="true" />{t('help.legendA')}</li>
      <li className="flex items-center gap-2"><span className="mkx-counter" data-kind="b" style={{ '--c-size': '1.25rem' }} aria-hidden="true" />{t('help.legendB')}</li>
    </ul>
  );
}

const fill = (a, b = 0) => Array.from({ length: 10 }, (_, i) => (i < a ? 'a' : i < a + b ? 'b' : 'empty'));

/** Landing/lesson explorer: choose a number, see its partner to ten. */
export function TenFrameExplorer({ start = 4, compact = false }) {
  const { t, lang } = useStore();
  const [n, setN] = useState(Number(start));
  const partner = 10 - n;
  const txt = lang === 'nb'
    ? `${n} trenger ${partner} for å bli 10.`
    : `${n} needs ${partner} to make 10.`;
  return (
    <div className="mkx-panel flex flex-col gap-4 not-prose">
      <div className="flex flex-wrap items-center gap-3" role="group" aria-label={t('landing.tryNumber')}>
        <Button variant="secondary" icon aria-label={lang === 'nb' ? 'Ett mindre' : 'One less'} onClick={() => setN((v) => Math.max(0, v - 1))} disabled={n <= 0}>
          <span aria-hidden="true" className="text-2xl leading-none">−</span>
        </Button>
        <output className="text-4xl font-bold min-w-[2ch] text-center" aria-live="polite" aria-label={`${t('landing.tryNumber')}: ${n}`}>{n}</output>
        <Button variant="secondary" icon aria-label={lang === 'nb' ? 'Ett mer' : 'One more'} onClick={() => setN((v) => Math.min(10, v + 1))} disabled={n >= 10}>
          <span aria-hidden="true" className="text-2xl leading-none">+</span>
        </Button>
      </div>
      <TenFrame cells={fill(n)} label={t('help.frameDesc', { filled: n })} />
      <div aria-live="polite">
        <Paragraph data-size="lg" className="font-semibold">{txt}</Paragraph>
        <Paragraph className={compact ? 'text-2xl' : 'text-3xl'}>
          <MathExpr expr={`${n} + ${partner} = 10`} />
        </Paragraph>
      </div>
    </div>
  );
}

/** Step-by-step "make ten" model for a + b where a + b > 10. */
export function MakeTen({ a, b, revealFinal = true, step: controlledStep, onStep }) {
  const { t } = useStore();
  const need = 10 - a; const rest = b - need; const sum = a + b;
  const [own, setOwn] = useState(0);
  const step = controlledStep ?? own;
  const setStep = onStep ?? setOwn;
  const last = revealFinal ? 3 : 2;
  const caption = [
    t('help.makeTen0', { a, b }),
    t('help.makeTen1', { a, b, need, rest }),
    `${t('help.makeTen2', { need, rest })}${revealFinal ? '' : ' ' + t('help.makeTen2q', { rest })}`,
    t('help.makeTen3', { a, b, rest, sum }),
  ][step];

  // What is drawn at each step
  const frameCells = step >= 2 ? fill(a, need) : fill(a);
  const frameLabel = step >= 2
    ? `${t('help.tenFrame')}: ${t('help.frameDescMix', { a, b: need, empty: 0 })}`
    : `${t('help.tenFrame')}: ${t('help.frameDesc', { filled: a })}`;

  const loose = (count, from) => (
    <ul className="m-0 p-0 list-none flex flex-wrap gap-2" aria-label={t('help.looseDesc', { n: count })}>
      {Array.from({ length: count }, (_, i) => <li key={from + i}><Counter kind="b" /></li>)}
    </ul>
  );

  return (
    <div className="mkx-panel flex flex-col gap-4">
      <Legend />
      <div className="flex flex-wrap items-end gap-6">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold">{t('help.tenFrame')}</span>
          <TenFrame cells={frameCells} label={frameLabel} />
        </div>
        {step <= 1 && (
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold">{b}</span>
            {step === 0 ? loose(b, 0) : (
              <div className="flex gap-5 items-end">
                <div className="flex flex-col gap-1"><span className="text-sm">{need}</span>{loose(need, 0)}</div>
                <div className="flex flex-col gap-1"><span className="text-sm">{rest}</span>{loose(rest, need)}</div>
              </div>
            )}
          </div>
        )}
        {step >= 2 && (
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold">{rest}</span>
            {loose(rest, need)}
          </div>
        )}
      </div>
      <div aria-live="polite" className="min-h-[3rem]">
        <span className="text-sm" style={{ color: 'var(--ds-color-neutral-text-subtle)' }}>{t('help.step', { i: step + 1, n: last + 1 })}</span>
        <Paragraph data-size="lg" className="font-semibold">{caption}</Paragraph>
        {step === 3 && <MathExpr display expr={`${a} + ${b} = 10 + ${rest} = ${sum}`} />}
      </div>
      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>{t('help.prev')}</Button>
        <Button variant="primary" onClick={() => setStep(Math.min(last, step + 1))} disabled={step === last}>{t('help.nextStep')}</Button>
      </div>
    </div>
  );
}
