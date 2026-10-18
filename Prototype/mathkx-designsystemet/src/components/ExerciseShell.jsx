import { useId, useRef } from 'react';
import { Button, Heading, Paragraph, Textfield, Alert, Tag } from '@digdir/designsystemet-react';
import { useStore } from '../store.jsx';
import { kinds, evaluateAnswer, feedbackText } from '../domain/math.js';
import { MathExpr } from './math/MathExpr.jsx';
import { GroupsHelp, addOnce } from './math/Counters.jsx';
import { MakeTen } from './math/TenFrame.jsx';
import { Balance } from './math/Balance.jsx';

const EMPTY = { answer: '', helpOpen: false, helpStep: 0, helpUsed: [], counted: 0, feedback: null, solved: false, tries: 0 };

/**
 * One exercise, independent of domain. The exercise kind supplies the expression,
 * validation and the named visual-help representation; the shell supplies the
 * answer flow, help toggle, feedback and state preservation.
 *
 * mode = 'practice': immediate feedback. mode = 'check': answers are saved and
 * feedback is given in the summary.
 */
export function ExerciseShell({ q, setId, mode = 'practice', position, onNext, nextLabel, onSkip, lessonHref, isLast }) {
  const { state, dispatch, t, lang } = useStore();
  const work = { ...EMPTY, ...(state.work[q.id] ?? {}) };
  const update = (patch) => dispatch({ type: 'work', qid: q.id, patch });
  const kind = kinds[q.kind];
  const uid = useId();
  const helpId = `${uid}-help`;
  const inputRef = useRef(null);
  const helpName = kind.help(q);

  const toggleHelp = () => update((w) => ({ helpOpen: !w.helpOpen, helpUsed: w.helpOpen ? w.helpUsed : addOnce(w.helpUsed, 'visual') }));

  const submit = (e) => {
    e.preventDefault();
    const res = evaluateAnswer(q, work.answer);
    if (res.status === 'input') {
      update((w) => ({ feedback: res, tries: (w.tries ?? 0) + 1 }));
      return;
    }
    if (mode === 'check') {
      onNext?.({ answer: work.answer.trim(), correct: res.status === 'correct', help: work.helpUsed });
      return;
    }
    dispatch({ type: 'attempt', attempt: { qid: q.id, set: setId, mode, correct: res.status === 'correct', help: work.helpUsed, answer: work.answer.trim() } });
    update((w) => ({ feedback: res, solved: res.status === 'correct', tries: (w.tries ?? 0) + 1 }));
  };

  const fb = work.feedback;
  const inputError = fb?.status === 'input'
    ? t(fb.code === 'empty' ? 'ex.empty' : fb.code === 'expression' ? 'ex.expression' : 'ex.unparseable', { raw: fb.values?.raw })
    : undefined;

  const spoken = kind.spoken(q)[lang];
  const promptLabel = q.kind === 'linear' ? (lang === 'nb' ? 'Finn x' : 'Find x') : (lang === 'nb' ? 'Regn ut' : 'Work out');

  const help = (() => {
    if (helpName === 'groups') return <GroupsHelp a={q.a} b={q.b} work={work} update={update} />;
    if (helpName === 'make-ten') return (
      <MakeTen a={q.a} b={q.b} revealFinal={false} step={work.helpStep}
        onStep={(s) => update((w) => ({ helpStep: s, helpUsed: addOnce(w.helpUsed, 'make-ten-steps') }))} />
    );
    if (helpName === 'balance') return (
      <Balance a={q.a} c={q.c} revealFinal={false} step={work.helpStep}
        onStep={(s) => update((w) => ({ helpStep: s, helpUsed: addOnce(w.helpUsed, 'balance-steps') }))} />
    );
    return null;
  })();

  return (
    <section className="flex flex-col gap-5" aria-labelledby={`${uid}-h`}>
      <div className={`grid gap-6 ${work.helpOpen ? 'lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]' : ''} items-start`}>
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-3">
            {position && <span className="text-sm font-semibold" style={{ color: 'var(--ds-color-neutral-text-subtle)' }}>{position}</span>}
            {work.helpUsed.length > 0 && <Tag data-color="neutral" data-size="sm">{t('ex.helpUsedNote')}</Tag>}
          </div>
          <div>
            <Heading level={2} data-size="xs" id={`${uid}-h`}>{promptLabel}</Heading>
            <p className="mkx-expr m-0 mt-2" aria-hidden="true"><MathExpr expr={kind.expression(q)} /></p>
            <span className="ds-sr-only">{spoken}</span>
          </div>

          <form onSubmit={submit} noValidate className="flex flex-col gap-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="w-44 sm:w-52">
                <Textfield
                  ref={inputRef}
                  label={t('ex.answer')}
                  description={t(kind.answerHint)}
                  value={work.answer}
                  onChange={(e) => update({ answer: e.target.value, feedback: null })}
                  inputMode={q.kind === 'linear' ? 'text' : 'numeric'}
                  enterKeyHint="done"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  error={inputError}
                  readOnly={work.solved && mode === 'practice'}
                  data-size="lg"
                />
              </div>
              {!(work.solved && mode === 'practice') && (
                <Button type="submit" data-size="lg">
                  {mode === 'check' ? (isLast ? t('check.finish') : t('check.submit')) : t('ex.check')}
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              {helpName && (
                <Button type="button" variant="secondary" aria-expanded={work.helpOpen} aria-controls={helpId} onClick={toggleHelp}>
                  {work.helpOpen ? t('ex.hideHelp') : t('ex.showHelp')}
                </Button>
              )}
              {onSkip && !work.solved && <Button type="button" variant="tertiary" onClick={onSkip}>{mode === 'check' ? t('check.skip') : t('ex.next')}</Button>}
            </div>
          </form>

          {/* Feedback is announced politely without moving focus. */}
          <div role="status" aria-live="polite" aria-label={t('ex.feedbackRegion')}>
            {fb && fb.status !== 'input' && mode === 'practice' && (
              <div key={work.tries} className="mkx-fade flex flex-col gap-3">
                {fb.status === 'correct' ? (
                  <Alert data-color="success">
                    <Heading level={3} data-size="2xs">{t('ex.correct')} {feedbackText(lang, `correct.${q.kind}`, fb.values)}</Heading>
                    <Paragraph>{work.helpUsed.length ? t('ex.withHelpPraise') : t('ex.altMethod')}</Paragraph>
                  </Alert>
                ) : (
                  <Alert data-color="warning">
                    <Paragraph>{feedbackText(lang, fb.code, fb.values)}</Paragraph>
                    <Paragraph data-size="sm">{t('ex.tryAgain')}</Paragraph>
                  </Alert>
                )}
              </div>
            )}
          </div>
          {work.solved && mode === 'practice' && onNext && (
            <div className="flex flex-wrap gap-3">
              <Button data-size="lg" onClick={onNext}>{nextLabel ?? t('ex.next')}</Button>
              {lessonHref && <Button variant="tertiary" asChild><a href={lessonHref}>{t('ex.lessonLink')}</a></Button>}
            </div>
          )}
        </div>

        <div id={helpId} hidden={!work.helpOpen} className="mkx-fade">
          {work.helpOpen && help}
        </div>
      </div>
    </section>
  );
}
