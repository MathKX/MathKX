// Visual states for explanation and help steps, plus a step player that keeps the
// picture, the equation and the text of each step together.
import { useId } from 'react';
import { Button, Paragraph } from '@digdir/designsystemet-react';
import { useStore } from '../../store.jsx';
import { Counter, CounterGroup, PlusSign, columnsFor } from './Counters.jsx';
import { TenFrame, Legend, fill } from './TenFrame.jsx';
import { MathExpr } from './MathExpr.jsx';

export function GroupsVisual({ a, b, mode }) {
  const { t } = useStore();
  if (mode === 'separate') {
    return (
      <div className="flex flex-wrap items-center justify-center gap-3 md:gap-6">
        <CounterGroup n={a} kind="a" title={t('help.group1', { n: a })} />
        <PlusSign />
        <CounterGroup n={b} kind="b" title={t('help.group2', { n: b })} />
      </div>
    );
  }
  // together / numbered: one combined group, the first group's counters first
  const n = a + b;
  const title = t('help.together', { n: mode === 'numbered' ? n : '?' });
  return (
    <figure className="m-0 flex flex-col items-center gap-2">
      <figcaption className="font-semibold">{mode === 'numbered' ? title : t('help.togetherUncounted')}</figcaption>
      <ul className="m-0 p-2 list-none grid gap-2 rounded-xl" aria-label={mode === 'numbered' ? title : t('help.togetherUncounted')}
        style={{ gridTemplateColumns: `repeat(${columnsFor(n)}, auto)`, border: '1px solid var(--ds-color-neutral-border-subtle)' }}>
        {Array.from({ length: n }, (_, i) => (
          <li key={i} className="m-0">
            {/* Before the revealing step, a counter's name gives its place in its own group,
                never the total (DL-035; exercise-experience.md: no answer in the accessible
                version before the visual one shows it). */}
            <Counter kind={i < a ? 'a' : 'b'} label={mode === 'numbered' ? `${i + 1}`
              : i < a ? t('help.counterInGroup1', { i: i + 1, n: a }) : t('help.counterInGroup2', { i: i - a + 1, n: b })}>
              {mode === 'numbered' ? <span aria-hidden="true">{i + 1}</span> : undefined}
            </Counter>
          </li>
        ))}
      </ul>
    </figure>
  );
}

function Loose({ count, label }) {
  return (
    <ul className="m-0 p-0 list-none flex flex-wrap gap-2" aria-label={label}>
      {Array.from({ length: count }, (_, i) => <li key={i}><Counter kind="b" /></li>)}
    </ul>
  );
}

/** phase 0: a in frame, b loose · 1: b split into need + rest · 2: need moved in, rest loose · 3: same picture, total stated */
export function MakeTenVisual({ a, b, phase }) {
  const { t } = useStore();
  const need = 10 - a; const rest = b - need;
  const frameLabel = phase >= 2
    ? `${t('help.tenFrame')}: ${t('help.frameDescMix', { a, b: need, empty: 0 })}`
    : `${t('help.tenFrame')}: ${t('help.frameDesc', { filled: a })}`;
  return (
    <div className="flex flex-col gap-3">
      <Legend />
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold">{t('help.tenFrame')}</span>
          <TenFrame cells={phase >= 2 ? fill(a, need) : fill(a)} label={frameLabel} />
        </div>
        {phase === 0 && <div className="flex flex-col gap-1"><span className="text-sm font-semibold">{b}</span><Loose count={b} label={t('help.looseDesc', { n: b })} /></div>}
        {phase === 1 && (
          <div className="flex gap-4 items-end">
            <div className="flex flex-col gap-1"><span className="text-sm font-semibold">{need}</span><Loose count={need} label={t('help.looseDesc', { n: need })} /></div>
            <div className="flex flex-col gap-1"><span className="text-sm font-semibold">{rest}</span><Loose count={rest} label={t('help.looseDesc', { n: rest })} /></div>
          </div>
        )}
        {phase >= 2 && <div className="flex flex-col gap-1"><span className="text-sm font-semibold">{rest}</span><Loose count={rest} label={t('help.looseDesc', { n: rest })} /></div>}
      </div>
    </div>
  );
}

/**
 * phase 0 level · 1 a removed (marked) on both sides · 2/3 removed blocks gone, x alone ·
 * 4 check: the original balance with x replaced by its value (x ones + a ones = c ones)
 */
export function BalanceVisual({ a, c, phase }) {
  const { t } = useStore();
  const x = c - a;
  const removed = phase === 1;
  const gone = phase === 2 || phase === 3;
  const check = phase === 4;
  const unit = (key, isRemoved, sub) => (
    <li key={key} className="m-0">
      <span className="mkx-unit" data-removed={isRemoved ? 'true' : undefined} data-sub={sub ? 'true' : undefined} role="img"
        aria-label={`${t('help.unit')}${isRemoved ? ` (${t('help.removed')})` : ''}${sub ? ` (${t('help.inPlaceOfX')})` : ''}`}>1</span>
    </li>
  );
  const units = (count, side) => {
    const shown = gone ? count - a : count;
    return Array.from({ length: shown }, (_, i) => unit(side + i, removed && i >= count - a, false));
  };
  const leftCount = gone ? 0 : a;
  const rightCount = gone ? c - a : c;
  const desc = (side) => {
    if (check) return side === 'left'
      ? `${t('help.leftSide')}: ${x} ${t('help.units')} ${t('help.inPlaceOfX')} + ${a} ${t('help.units')}`
      : `${t('help.rightSide')}: ${c} ${t('help.units')}`;
    return side === 'left'
      ? `${t('help.leftSide')}: x${leftCount ? ` + ${leftCount} ${t('help.units')}` : ''}${removed ? ` (${a} ${t('help.removed')})` : ''}`
      : `${t('help.rightSide')}: ${rightCount} ${t('help.units')}${removed ? ` (${a} ${t('help.removed')})` : ''}`;
  };
  return (
    <figure className="m-0" aria-label={t('help.balanceLabel')}>
      <div className="grid grid-cols-2 gap-3 md:gap-6 items-end">
        {['left', 'right'].map((side) => (
          <div key={side} className="flex flex-col min-w-0">
            <span className="text-sm font-semibold mb-1">{side === 'left' ? t('help.leftSide') : t('help.rightSide')}</span>
            <ul className="mkx-pan m-0 list-none" aria-label={desc(side)}>
              {side === 'left' && check && (
                <li className="m-0 flex flex-col items-center gap-1">
                  <span aria-hidden="true" className="text-sm font-semibold" style={{ color: 'var(--ds-color-accent-text-default)' }}>x = {x}</span>
                  <ul className="mkx-xsub m-0 list-none" aria-label={`${x} ${t('help.units')} ${t('help.inPlaceOfX')}`}>
                    {Array.from({ length: x }, (_, i) => unit(`s${i}`, false, true))}
                  </ul>
                </li>
              )}
              {side === 'left' && !check && <li className="m-0"><span className="mkx-xbox" role="img" aria-label={t('help.xBox')}>x</span></li>}
              {side === 'left' ? units(a, 'l') : units(c, 'r')}
            </ul>
          </div>
        ))}
      </div>
      <div aria-hidden="true" className="relative mx-auto mt-1" style={{ height: 30 }}>
        <div style={{ height: 6, borderRadius: 3, background: 'var(--ds-color-neutral-border-strong)' }} />
        <div style={{ width: 0, height: 0, margin: '0 auto', borderLeft: '20px solid transparent', borderRight: '20px solid transparent', borderBottom: '24px solid var(--ds-color-neutral-border-strong)' }} />
      </div>
    </figure>
  );
}

export function StepVisual({ visual }) {
  if (visual.kind === 'groups') return <GroupsVisual {...visual} />;
  if (visual.kind === 'make-ten') return <MakeTenVisual {...visual} />;
  if (visual.kind === 'balance') return <BalanceVisual {...visual} />;
  return null;
}

/**
 * Plays a list of steps ({visual, eq, text}). The visual, equation and text shown
 * always come from the same step object. Moving back and forward is by buttons.
 */
export function StepPlayer({ steps, step, onStep, title, label, revealNote }) {
  const { t, lang } = useStore();
  const id = useId();
  const cur = steps[Math.min(step, steps.length - 1)];
  const last = steps.length - 1;
  // A chain such as 8 + 5 = 8 + 2 + 3 = 10 + 3 = 13 is split at the equals signs so
  // it wraps on narrow screens instead of hiding the result off to the side.
  const parts = cur.eq.split(' = ');
  const note = revealNote ? (step === revealNote.at - 1 ? revealNote.before : step >= revealNote.at ? revealNote.on : null) : null;
  return (
    <section className="flex flex-col gap-3" {...(title ? { 'aria-labelledby': id } : { 'aria-label': label })}>
      {title && <h3 id={id} className="m-0 text-base font-semibold">{title}</h3>}
      <StepVisual visual={cur.visual} />
      <div aria-live="polite" className="flex flex-col gap-1">
        <span className="text-sm" style={{ color: 'var(--ds-color-neutral-text-subtle)' }}>{t('help.step', { i: step + 1, n: steps.length })}</span>
        <div className="mkx-eqchain text-xl" role="group" aria-label={cur.eq}>
          {parts.map((p, i) => <span key={i} className="mkx-eqpart"><MathExpr expr={i === 0 ? p : `= ${p}`} display /></span>)}
        </div>
        <Paragraph className="m-0 font-semibold">{cur.text[lang]}</Paragraph>
      </div>
      {note && <Paragraph data-size="sm" className="m-0 mkx-reveal-note">{note}</Paragraph>}
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => onStep(Math.max(0, step - 1))} disabled={step === 0}>{t('help.prev')}</Button>
        <Button variant="primary" onClick={() => onStep(Math.min(last, step + 1))} disabled={step === last}>{t('help.nextStep')}</Button>
      </div>
    </section>
  );
}
