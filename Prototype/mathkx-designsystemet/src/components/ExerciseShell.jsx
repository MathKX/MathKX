import { useEffect, useId, useMemo, useRef } from 'react';
import { Button, Heading, Paragraph, Textfield, Alert, Tag } from '@digdir/designsystemet-react';
import { XMarkIcon, BookIcon } from '@navikt/aksel-icons';
import { useStore, useLearner, go } from '../store.jsx';
import { kinds, evaluateAnswer, feedbackText } from '../domain/math.js';
import { variants } from '../domain/practice.js';
import { helpSteps, explanationSteps, firstRevealStep } from '../domain/explanations.js';
import { summarizeDelivery } from '../domain/observations.js';
import { lessonDisclosure } from '../domain/disclosure.js';
import { lessons } from '../content/catalog.js';
import { MathExpr } from './math/MathExpr.jsx';
import { GroupsHelp } from './math/Counters.jsx';
import { StepPlayer } from './math/Visuals.jsx';

/**
 * The exercise workspace, independent of mathematical domain.
 *
 * mode 'practice'        visual help and explanation available, immediate feedback
 * mode 'check'           independent check: no teaching help, one answer, feedback at the end;
 *                        "I need help" offers an explicit switch to supported practice
 * mode 'check-supported' after that switch: help and feedback like practice
 */
export function ExerciseShell({ q, delivery, mode = 'practice', position, onSubmitted, onNeedHelp, lessonHref, footer }) {
  const { state, t, L, lang, dispatch } = useStore();
  const learner = useLearner();
  const work = state.learner.work[delivery] ?? {};
  const setWork = (p) => learner.work(delivery, p);
  const kind = kinds[q.kind];
  const v = variants[q.variant];
  const uid = useId();
  const panelId = `${uid}-panel`;
  const inputRef = useRef(null);
  const summary = useMemo(() => summarizeDelivery(state.learner.events, delivery), [state.learner.events, delivery]);
  const answered = summary.responses.length > 0;
  const independent = mode === 'check';
  const helpModel = independent ? null : (v?.help ?? q.help);
  const explainModel = independent ? null : (v?.explanation ?? q.explanation);
  const hSteps = helpModel && helpModel !== 'groups' ? helpSteps(helpModel, q) : null;
  const eSteps = explainModel ? explanationSteps(explainModel, q) : null;
  const solved = summary.outcome?.startsWith('correct');
  const revealStep = firstRevealStep(eSteps);
  // Once the learner has confirmed the explanation before answering, do not ask again.
  const explainConfirmed = summary.events.some((e) => e.type === 'support' && ['explanation-open', 'answer-reveal'].includes(e.support));

  const support = (s, extra = {}) => learner.log({ type: 'support', delivery, support: s, ...extra });
  // Opening the explanation is recorded separately from reaching a step that shows the answer.
  const logStep = (i, open = false) => {
    const evs = [];
    if (open) evs.push({ type: 'support', delivery, support: 'explanation-open', step: i });
    if (!open || eSteps?.[i]?.reveals) evs.push({ type: 'support', delivery, support: 'explanation-step', step: i, reveals: !!eSteps?.[i]?.reveals });
    learner.log(evs);
  };

  const openPanel = (panel) => {
    if (work.panel === panel) { setWork({ panel: null, confirmExplain: false }); return; }
    if (panel === 'help') { setWork({ panel: 'help', confirmExplain: false, confirmLesson: false }); support('visual'); return; }
    // The explanation leads to the answer: before any mathematical answer, ask first.
    // Also after an incorrect answer: until the answer is found, the explanation would show it (Gemini round-03).
    if (!solved && !explainConfirmed) { setWork({ confirmExplain: true, confirmLesson: false }); return; }
    const step = work.explainStep ?? 0;
    setWork({ panel: 'explain', confirmExplain: false, explainStep: step });
    logStep(step, true);
  };
  const confirmReveal = () => {
    setWork({ panel: 'explain', confirmExplain: false, explainStep: 0 });
    logStep(0, true);
  };

  // The lesson from an exercise: before answering, say so when it shows this exact answer.
  const lessonId = lessonHref?.match(/#\/lesson\/([^?]+)/)?.[1];
  const lessonSrc = lessonId && lessons[lessonId] ? L(lessons[lessonId].source) : '';
  const disclosure = useMemo(() => lessonDisclosure(lessonSrc, q), [lessonSrc, q]);
  const goLesson = (reveal) => {
    support(reveal ? 'lesson-reveal' : 'lesson', { lesson: lessonId });
    setWork({ confirmLesson: false });
    dispatch({ type: 'returnTo', returnTo: { href: window.location.hash, label: kind.plain(q) } });
    go(lessonHref);
  };
  const openLesson = () => {
    if (!solved && disclosure.discloses) { setWork({ confirmLesson: true, confirmExplain: false }); return; }
    goLesson(false);
  };

  const submit = (e) => {
    e.preventDefault();
    const res = evaluateAnswer(q, work.answer, lang);
    const result = res.status === 'input' ? 'invalid' : res.status;
    learner.log({ type: 'response', delivery, answer: (work.answer ?? '').trim(), result, code: res.code });
    setWork({ feedback: res, tries: (work.tries ?? 0) + 1 });
    if (result !== 'invalid') onSubmitted?.({ result, res });
  };

  // Keep the answer field and its button in view when the keyboard opens.
  const onFocus = () => setTimeout(() => inputRef.current?.scrollIntoView?.({ block: 'center', behavior: 'auto' }), 250);

  const fb = work.feedback;
  const inputError = fb?.status === 'input' ? t(`ex.input.${fb.code}`, { raw: fb.values?.raw }) : undefined;
  const showMathFeedback = fb && fb.status !== 'input' && mode !== 'check';
  const promptLabel = q.kind === 'linear' ? t('ex.findX') : t('ex.workOut');
  const lockAnswer = solved && mode !== 'check';

  const supportTags = summary.tags.map((k) => t(`support.${k}`));
  const outcomeMsg = summary.outcome === 'correctAfterExplanation'
    ? t(`ex.outcome.revealed_${summary.revealSources[0] ?? 'explanation'}`)
    : t(`ex.outcome.${summary.outcome}`);

  const panel = work.panel === 'help' ? (
    helpModel === 'groups' ? (
      <GroupsHelp a={q.a} b={q.b} work={work} onWork={setWork} onSupport={(s) => support(s)} answered={solved} />
    ) : hSteps ? (
      <StepPlayer steps={hSteps} step={Math.min(work.helpStep ?? 0, hSteps.length - 1)} label={t('ex.helpTitle')}
        onStep={(s) => { setWork({ helpStep: s }); support('help-steps', { step: s }); }} />
    ) : null
  ) : work.panel === 'explain' && eSteps ? (
    <StepPlayer steps={eSteps} step={Math.min(work.explainStep ?? 0, eSteps.length - 1)} label={t('ex.explainTitle')}
      revealNote={!solved && revealStep >= 0 ? { at: revealStep, before: t('ex.nextReveals'), on: t('ex.thisReveals') } : null}
      onStep={(s) => { setWork({ explainStep: s }); logStep(s); }} />
  ) : null;

  return (
    <section className="mkx-workspace" data-panel={work.panel ? 'open' : 'closed'} aria-labelledby={`${uid}-h`}>
      <div className="mkx-ws-task">
        <div className="flex flex-wrap items-center gap-2 min-h-7">
          {position && <span className="text-sm font-semibold" style={{ color: 'var(--ds-color-neutral-text-subtle)' }}>{position}</span>}
          {supportTags.map((s) => <Tag key={s} data-color="neutral" data-size="sm">{s}</Tag>)}
        </div>

        <form onSubmit={submit} noValidate className="mkx-ws-form">
          <div className="mkx-ws-prompt">
            <Heading level={2} data-size="2xs" id={`${uid}-h`} className="m-0">{promptLabel}</Heading>
            <p className="mkx-expr m-0" aria-hidden="true"><MathExpr expr={kind.expression(q)} /></p>
            <span className="ds-sr-only">{kind.spoken(q)[lang]}</span>
          </div>
          <div className="mkx-ws-answer">
            <div className="w-56 max-w-full">
              <Textfield ref={inputRef} label={t('ex.answer')} description={t(kind.answerHint)} value={work.answer ?? ''}
                onChange={(e) => setWork({ answer: e.target.value, feedback: null })} onFocus={onFocus}
                inputMode={q.kind === 'linear' ? 'text' : 'decimal'} enterKeyHint="done" autoComplete="off" autoCorrect="off" spellCheck={false}
                error={inputError} readOnly={lockAnswer || (independent && answered)} data-size="lg" data-answer-input="true" />
            </div>
            {!lockAnswer && !(independent && answered) && (
              <Button type="submit" data-size="lg">{mode === 'check' ? t('check.submit') : t('ex.check')}</Button>
            )}
          </div>
        </form>

        {/* Feedback is announced politely without moving focus. */}
        <div role="status" aria-live="polite" className="empty:hidden">
          {showMathFeedback && (
            <div key={work.tries} className="mkx-fade">
              {fb.status === 'correct' ? (
                <Alert data-color="success">
                  <Heading level={3} data-size="2xs">{t('ex.correct')} {feedbackText(lang, `correct.${q.kind}`, fb.values)}</Heading>
                  <Paragraph data-size="sm">{outcomeMsg}</Paragraph>
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

        {!independent ? (
          <div className="flex flex-wrap gap-2" role="group" aria-label={t('ex.supportGroup')}>
            {helpModel && (
              <Button type="button" variant="secondary" aria-expanded={work.panel === 'help'} aria-controls={panelId} onClick={() => openPanel('help')}>
                {work.panel === 'help' ? t('ex.hideHelp') : t('ex.showHelp')}
              </Button>
            )}
            {eSteps && (
              <Button type="button" variant="secondary" aria-expanded={work.panel === 'explain'} aria-controls={panelId} onClick={() => openPanel('explain')}>
                {work.panel === 'explain' ? t('ex.hideExplain') : t('ex.explain')}
              </Button>
            )}
            {lessonHref && <Button type="button" variant="tertiary" onClick={openLesson}><BookIcon aria-hidden="true" />{t('ex.openLesson')}</Button>}
          </div>
        ) : (
          !answered && onNeedHelp && <div><Button type="button" variant="tertiary" onClick={onNeedHelp}>{t('check.needHelp')}</Button></div>
        )}

        {work.confirmExplain && (
          <div className="mkx-panel-accent flex flex-col gap-3 mkx-fade" role="group" aria-label={t('ex.revealTitle')}>
            <Heading level={3} data-size="2xs" className="m-0">{t('ex.revealTitle')}</Heading>
            <Paragraph data-size="sm" className="m-0">{t('ex.revealBody', { n: revealStep + 1, total: eSteps?.length ?? 0 })}{helpModel ? ` ${t(helpModel === 'groups' ? 'ex.revealHelpNoteCount' : 'ex.revealHelpNote')}` : ''}</Paragraph>
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={confirmReveal}>{t('ex.revealYes')}</Button>
              {helpModel && <Button type="button" variant="secondary" onClick={() => { setWork({ confirmExplain: false }); openPanel('help'); }}>{t('ex.revealHelpInstead')}</Button>}
              <Button type="button" variant="tertiary" onClick={() => setWork({ confirmExplain: false })}>{t('common.cancel')}</Button>
            </div>
          </div>
        )}
        {work.confirmLesson && (
          <div className="mkx-panel-accent flex flex-col gap-3 mkx-fade" role="group" aria-label={t('ex.lessonRevealTitle', { q: kind.plain(q) })}>
            <Heading level={3} data-size="2xs" className="m-0">{t('ex.lessonRevealTitle', { q: kind.plain(q) })}</Heading>
            <Paragraph data-size="sm" className="m-0">{t('ex.lessonRevealBody')}</Paragraph>
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={() => goLesson(true)}>{t('ex.lessonRevealYes')}</Button>
              {helpModel && <Button type="button" variant="secondary" onClick={() => { setWork({ confirmLesson: false }); openPanel('help'); }}>{t('ex.revealHelpInstead')}</Button>}
              <Button type="button" variant="tertiary" onClick={() => setWork({ confirmLesson: false })}>{t('common.cancel')}</Button>
            </div>
          </div>
        )}
        {footer}
      </div>

      <div id={panelId} className="mkx-ws-panel" hidden={!panel}>
        {panel && (
          <div className="mkx-panel flex flex-col gap-3 mkx-fade">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold">{work.panel === 'help' ? t('ex.helpTitle') : t('ex.explainTitle')}</span>
              <Button type="button" variant="tertiary" icon aria-label={t('common.close')} onClick={() => setWork({ panel: null })}><XMarkIcon aria-hidden="true" /></Button>
            </div>
            {work.panel === 'explain' && !solved && <Paragraph data-size="sm" className="m-0">{t('ex.revealedNote')}</Paragraph>}
            {panel}
          </div>
        )}
      </div>
    </section>
  );
}
