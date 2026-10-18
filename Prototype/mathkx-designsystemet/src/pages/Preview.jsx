import { useState } from 'react';
import { Button, Heading, Paragraph, Alert, Tag, Textfield, Details, Card } from '@digdir/designsystemet-react';
import { useStore } from '../store.jsx';
import { parseNumber, formatNumber } from '../domain/numbers.js';
import { MathExpr } from '../components/math/MathExpr.jsx';
import { PageHead } from '../components/Page.jsx';

// Design preview: derivative of f(x) = x². Tests graph interaction, direct entry and
// notation (powers, fractions, primes). Nothing here is recorded as progress.
const XS = [-2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2];
const W = 520; const H = 360; const PAD = 28;
const X0 = -2.5; const X1 = 2.5; const Y0 = -1.5; const Y1 = 6.5;
const sx = (x) => PAD + ((x - X0) / (X1 - X0)) * (W - 2 * PAD);
const sy = (y) => H - PAD - ((y - Y0) / (Y1 - Y0)) * (H - 2 * PAD);

function Graph({ a, onPick, t, lang }) {
  const curve = Array.from({ length: 101 }, (_, i) => { const x = X0 + (i / 100) * (X1 - X0); return `${i ? 'L' : 'M'}${sx(x).toFixed(1)},${sy(x * x).toFixed(1)}`; }).join(' ');
  const m = 2 * a; const ya = a * a;
  const tx0 = X0; const tx1 = X1;
  const band = (W - 2 * PAD) / (X1 - X0) * 0.5;
  const f = (v) => formatNumber(v, lang);
  return (
    <figure className="m-0">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto max-w-[40rem] block" role="img"
        aria-label={t('deriv.graphDesc', { a: f(a), fa: f(ya), m: f(m) })}>
        <defs><clipPath id="plot"><rect x={PAD} y={PAD} width={W - 2 * PAD} height={H - 2 * PAD} /></clipPath></defs>
        <rect x="0" y="0" width={W} height={H} fill="var(--ds-color-neutral-background-default)" />
        {[-2, -1, 1, 2].map((x) => <line key={`gx${x}`} x1={sx(x)} x2={sx(x)} y1={PAD} y2={H - PAD} stroke="var(--ds-color-neutral-border-subtle)" strokeWidth="1" />)}
        {[1, 2, 3, 4, 5, 6].map((y) => <line key={`gy${y}`} x1={PAD} x2={W - PAD} y1={sy(y)} y2={sy(y)} stroke="var(--ds-color-neutral-border-subtle)" strokeWidth="1" />)}
        <line x1={PAD} x2={W - PAD} y1={sy(0)} y2={sy(0)} stroke="var(--ds-color-neutral-border-strong)" strokeWidth="1.5" />
        <line x1={sx(0)} x2={sx(0)} y1={PAD} y2={H - PAD} stroke="var(--ds-color-neutral-border-strong)" strokeWidth="1.5" />
        {[-2, -1, 1, 2].map((x) => <text key={`tx${x}`} x={sx(x)} y={sy(0) + 18} textAnchor="middle" fontSize="13" fill="var(--ds-color-neutral-text-subtle)">{x < 0 ? `−${-x}` : x}</text>)}
        {[2, 4, 6].map((y) => <text key={`ty${y}`} x={sx(0) - 8} y={sy(y) + 4} textAnchor="end" fontSize="13" fill="var(--ds-color-neutral-text-subtle)">{y}</text>)}
        <g clipPath="url(#plot)">
          <path d={curve} fill="none" stroke="var(--ds-color-accent-base-default)" strokeWidth="3" />
          <line x1={sx(tx0)} y1={sy(ya + m * (tx0 - a))} x2={sx(tx1)} y2={sy(ya + m * (tx1 - a))} stroke="var(--ds-color-ochre-border-strong)" strokeWidth="2.5" strokeDasharray="8 5" />
          {/* slope triangle: run 1, rise m */}
          <path d={`M${sx(a)},${sy(ya)} L${sx(a + 1)},${sy(ya)} L${sx(a + 1)},${sy(ya + m)}`} fill="none" stroke="var(--ds-color-neutral-text-default)" strokeWidth="2" />
        </g>
        <text x={(sx(a) + sx(a + 1)) / 2} y={sy(ya) + (m >= 0 ? 18 : -8)} textAnchor="middle" fontSize="13" fill="var(--ds-color-neutral-text-default)">Δx = 1</text>
        <text x={sx(a + 1) + 6} y={(sy(ya) + sy(ya + m)) / 2 + 4} fontSize="13" fill="var(--ds-color-neutral-text-default)">Δy = {f(m)}</text>
        <circle cx={sx(a)} cy={sy(ya)} r="7" fill="var(--ds-color-ochre-base-default)" stroke="var(--ds-color-neutral-background-default)" strokeWidth="2" />
        {/* tap targets: full-height bands at each selectable x (decorative to AT; the stepper and field are the accessible path) */}
        {XS.map((x) => (
          <rect key={`b${x}`} x={sx(x) - band / 2} y={PAD} width={band} height={H - 2 * PAD} fill="transparent" style={{ cursor: 'pointer' }}
            onClick={() => onPick(x)} aria-hidden="true" />
        ))}
      </svg>
      <figcaption className="text-sm mt-1" style={{ color: 'var(--ds-color-neutral-text-subtle)' }}>{t('deriv.caption')}</figcaption>
    </figure>
  );
}

export function DerivativePreview() {
  const { t, lang } = useStore();
  const [a, setA] = useState(1);
  const [answer, setAnswer] = useState('');
  const [fb, setFb] = useState(null);
  const [explain, setExplain] = useState(false);
  const f = (v) => formatNumber(v, lang);
  const pick = (x) => { setA(x); setAnswer(f(x)); setFb(null); };
  const stepA = (d) => pick(Math.max(-2, Math.min(2, a + d)));
  const check = (e) => {
    e.preventDefault();
    const p = parseNumber(answer, { lang, variable: 'x' });
    if (!p.ok) { setFb({ kind: 'input', code: p.reason }); return; }
    if (Math.abs(p.value) > 2) { setFb({ kind: 'range' }); return; }
    setA(Math.round(p.value * 2) / 2 === p.value ? p.value : a);
    setFb(p.value === 1.5 ? { kind: 'correct' } : { kind: 'wrong', x: p.value, m: 2 * p.value });
  };

  return (
    <div className="mkx-container pb-8">
      <PageHead title={t('deriv.title')} lead={t('deriv.lead')}
        crumbs={[{ href: '#/library', label: t('library.title') }, { href: '#/domain/calculus', label: t('deriv.domain') }, { href: '#/preview/derivative', label: t('deriv.title') }]}
        eyebrow={<Tag data-color="warning" data-size="sm" className="mb-2 w-fit">{t('deriv.badge')}</Tag>} />
      <Alert data-color="warning" className="mb-6 max-w-[48rem]"><Paragraph>{t('deriv.notice')}</Paragraph></Alert>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] items-start">
        <section className="flex flex-col gap-3 min-w-0" aria-labelledby="g-h">
          <Heading level={2} data-size="xs" id="g-h">{t('deriv.exploreTitle')}</Heading>
          <p className="m-0 text-xl"><MathExpr expr="f(x) = x^2" /></p>
          <Graph a={a} onPick={pick} t={t} lang={lang} />
          <div className="flex flex-wrap items-center gap-3" role="group" aria-label={t('deriv.pointGroup')}>
            <Button variant="secondary" icon aria-label={t('deriv.left')} onClick={() => stepA(-0.5)} disabled={a <= -2}><span aria-hidden="true" className="text-xl">←</span></Button>
            <output aria-live="polite" className="text-lg font-semibold min-w-[9rem] text-center">x = {f(a)}</output>
            <Button variant="secondary" icon aria-label={t('deriv.right')} onClick={() => stepA(0.5)} disabled={a >= 2}><span aria-hidden="true" className="text-xl">→</span></Button>
          </div>
          <div className="mkx-panel flex flex-col gap-2" aria-live="polite">
            <Paragraph className="m-0">{t('deriv.slopeText', { a: f(a), fa: f(a * a), m: f(2 * a) })}</Paragraph>
            <div className="overflow-x-auto text-lg"><MathExpr display expr={`\\frac{\\Delta y}{\\Delta x} = \\frac{${f(2 * a).replace('−', '-')}}{1} = ${f(2 * a).replace('−', '-')}`} /></div>
          </div>
          <Details>
            <Details.Summary>{t('deriv.table')}</Details.Summary>
            <Details.Content>
              <table className="mkx-table text-base">
                <thead><tr><th scope="col">x</th><th scope="col"><MathExpr expr="f(x) = x^2" /></th><th scope="col">{t('deriv.slopeCol')}</th></tr></thead>
                <tbody>{XS.map((x) => <tr key={x}><td>{f(x)}</td><td>{f(x * x)}</td><td>{f(2 * x)}</td></tr>)}</tbody>
              </table>
            </Details.Content>
          </Details>
        </section>

        <section className="flex flex-col gap-4 min-w-0" aria-labelledby="task-h">
          <Card>
            <Heading level={2} data-size="xs" id="task-h">{t('deriv.taskTitle')}</Heading>
            <Paragraph>{t('deriv.task')}</Paragraph>
            <form onSubmit={check} noValidate className="flex flex-wrap items-end gap-3">
              <div className="w-64 max-w-full"><Textfield label={t('deriv.answerLabel')} description={t('deriv.answerHint')} value={answer} inputMode="decimal" autoComplete="off"
                onChange={(e) => { setAnswer(e.target.value); setFb(null); }} data-size="lg"
                error={fb?.kind === 'input' ? t(`ex.input.${fb.code}`, { raw: answer }) : fb?.kind === 'range' ? t('deriv.range') : undefined} /></div>
              <Button type="submit" data-size="lg">{t('ex.check')}</Button>
            </form>
            <div role="status" aria-live="polite">
              {fb?.kind === 'correct' && <Alert data-color="success"><Paragraph>{t('deriv.correct')}</Paragraph></Alert>}
              {fb?.kind === 'wrong' && <Alert data-color="warning"><Paragraph>{t('deriv.wrong', { x: f(fb.x), m: f(fb.m) })}</Paragraph></Alert>}
            </div>
            <div><Button variant="secondary" aria-expanded={explain} onClick={() => setExplain((v) => !v)}>{explain ? t('ex.hideExplain') : t('ex.explain')}</Button></div>
            {explain && (
              <div className="mkx-panel flex flex-col gap-2">
                <Paragraph className="m-0">{t('deriv.ex1')}</Paragraph>
                <MathExpr display expr="f'(x) = 2x" />
                <Paragraph className="m-0">{t('deriv.ex2')}</Paragraph>
                <MathExpr display expr={lang === 'nb' ? 'x = \\frac{3}{2} = 1,5' : 'x = \\frac{3}{2} = 1.5'} />
              </div>
            )}
          </Card>
          <Card variant="tinted">
            <Heading level={2} data-size="2xs">{t('deriv.notationTitle')}</Heading>
            <Paragraph data-size="sm">{t('deriv.notationLead')}</Paragraph>
            <ul className="list-none m-0 p-0 flex flex-col gap-2 text-lg">
              {['x^2 + 2x + 1', "f'(x) = 2x", '\\frac{\\Delta y}{\\Delta x}', '3/4 + 1/4 = 1', 'x^{n-1}', 'a_1 \\le a_2', '\\lim_{h \\to 0}'].map((e) => (
                <li key={e} className="flex flex-wrap items-center gap-3"><MathExpr expr={e} /> <code className="text-xs">{e}</code></li>
              ))}
              <li className="flex flex-wrap items-center gap-3"><MathExpr expr="\sqrt{2}" /></li>
            </ul>
            <Paragraph data-size="xs" className="m-0">{t('deriv.notationNote')}</Paragraph>
          </Card>
        </section>
      </div>
    </div>
  );
}
