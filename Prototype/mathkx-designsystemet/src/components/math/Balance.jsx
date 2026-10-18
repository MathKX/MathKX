import { useState } from 'react';
import { Button, Paragraph } from '@digdir/designsystemet-react';
import { useStore } from '../../store.jsx';
import { MathExpr } from './MathExpr.jsx';

/** Balance model for x + a = c, explored through explicit step buttons (no dragging). */
export function Balance({ a, c, revealFinal = true, step: controlledStep, onStep }) {
  const { t } = useStore();
  const [own, setOwn] = useState(0);
  const step = controlledStep ?? own;
  const setStep = onStep ?? setOwn;
  const x = c - a;
  const last = revealFinal ? 3 : 2;
  const removed = step >= 1;
  const hideRemoved = step >= 2;

  const captions = [
    t('help.balance0', { a, c }),
    t('help.balance1', { a }),
    t('help.balance2'),
    t('help.balance3', { x, a, c }),
  ];
  const equations = [`x + ${a} = ${c}`, `x + ${a} − ${a} = ${c} − ${a}`, `x = ?`, `x = ${x}`];

  const units = (count, removeCount, side) => {
    const shown = hideRemoved ? count - removeCount : count;
    return Array.from({ length: shown }, (_, i) => {
      const isRemoved = removed && !hideRemoved && i >= count - removeCount;
      return (
        <li key={side + i} className="m-0">
          <span className="mkx-unit" data-removed={isRemoved ? 'true' : undefined} role="img"
            aria-label={`${t('help.unit')}${isRemoved ? ` (${t('help.removed')})` : ''}`}>1</span>
        </li>
      );
    });
  };

  const leftCount = hideRemoved ? 0 : a;
  const rightCount = hideRemoved ? c - a : c;
  const sideDesc = (side) => side === 'left'
    ? `${t('help.leftSide')}: x${leftCount ? ` + ${leftCount} ${t('help.unit')}` : ''}${removed && !hideRemoved ? ` (${a} ${t('help.removed')})` : ''}`
    : `${t('help.rightSide')}: ${rightCount} ${t('help.unit')}${removed && !hideRemoved ? ` (${a} ${t('help.removed')})` : ''}`;

  return (
    <div className="mkx-panel flex flex-col gap-4">
      <figure className="m-0" aria-label={t('help.balanceLabel')}>
        <div className="grid grid-cols-2 gap-3 md:gap-8 items-end">
          {['left', 'right'].map((side) => (
            <div key={side} className="flex flex-col">
              <span className="text-sm font-semibold mb-1">{side === 'left' ? t('help.leftSide') : t('help.rightSide')}</span>
              <ul className="mkx-pan m-0 list-none" aria-label={sideDesc(side)}>
                {side === 'left' && <li className="m-0"><span className="mkx-xbox" role="img" aria-label={t('help.xBox')}>x</span></li>}
                {side === 'left' ? units(a, a, 'l') : units(c, a, 'r')}
              </ul>
            </div>
          ))}
        </div>
        {/* beam and fulcrum */}
        <div aria-hidden="true" className="relative mx-auto mt-1" style={{ height: 34 }}>
          <div style={{ height: 6, borderRadius: 3, background: 'var(--ds-color-neutral-border-strong)' }} />
          <div style={{ width: 0, height: 0, margin: '0 auto', borderLeft: '22px solid transparent', borderRight: '22px solid transparent', borderBottom: '28px solid var(--ds-color-neutral-border-strong)' }} />
        </div>
      </figure>
      <div aria-live="polite" className="min-h-[3rem]">
        <span className="text-sm" style={{ color: 'var(--ds-color-neutral-text-subtle)' }}>{t('help.step', { i: step + 1, n: last + 1 })}</span>
        <Paragraph data-size="lg" className="font-semibold">{captions[step]}</Paragraph>
        <MathExpr display expr={equations[step]} />
      </div>
      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>{t('help.prev')}</Button>
        <Button variant="primary" onClick={() => setStep(Math.min(last, step + 1))} disabled={step === last}>
          {step === 0 ? t('help.removeBoth', { a }) : t('help.nextStep')}
        </Button>
      </div>
    </div>
  );
}
