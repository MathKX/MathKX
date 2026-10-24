// The exercise workspace (specs/002 contracts/learner-app.md "Practice screen"): expression, answer field,
// help before answering, feedback by code, explanation after either result, and the learner controls.
import { useEffect, useId, useRef, type FormEvent } from "react";
import { Button, Textfield } from "@digdir/designsystemet-react";
import { translate } from "../i18n";
import { useStore } from "../state/store";
import { Link } from "../router";
import { AdditionPrompt } from "./math/MathExpr";
import { Feedback } from "./Feedback";
import { StepPanel } from "./StepPanel";

export function ExerciseShell({ lessonHref }: { lessonHref?: string | undefined }) {
  const store = useStore();
  const { state } = store;
  const lang = state.language;
  const instance = state.instance;
  const fieldId = useId();
  const resultRef = useRef<HTMLDivElement>(null);
  const lastResult = useRef<unknown>(null);

  useEffect(() => {
    if (state.result && state.result !== lastResult.current) {
      lastResult.current = state.result;
      resultRef.current?.focus();
    }
  }, [state.result]);

  if (!instance) return null;

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void store.submit();
  };

  // Opening help shows the operands only; the first step is fetched when the learner asks for it.
  const onToggleHelp = () => void store.toggleHelp();

  return (
    <div className="mkx-exercise" data-testid="exercise-shell">
      <AdditionPrompt a={instance.a} b={instance.b} lang={lang} />

      <form onSubmit={onSubmit} className="mkx-answer-form" noValidate>
        <Textfield
          id={fieldId}
          label={translate(lang, "practice.answerLabel")}
          value={state.draft}
          onChange={(e) => store.setDraft(e.currentTarget.value)}
          inputMode="numeric"
          autoComplete="off"
          data-size="lg"
          data-testid="answer"
        />
        <div className="mkx-controls">
          <Button type="submit" variant="primary" data-size="md" className="mkx-target" disabled={state.checking} data-testid="check">
            {translate(lang, state.checking ? "practice.checking" : "practice.check")}
          </Button>
          <Button
            type="button"
            variant="secondary"
            data-size="md"
            className="mkx-target"
            aria-expanded={state.helpOpen}
            aria-controls={`${fieldId}-help`}
            onClick={onToggleHelp}
            data-testid="toggle-help"
          >
            {translate(lang, state.helpOpen ? "practice.hideHelp" : "practice.showHelp")}
          </Button>
        </div>
      </form>

      <div id={`${fieldId}-help`} hidden={!state.helpOpen}>
        {state.helpOpen ? (
          <StepPanel kind="help" instance={instance} steps={state.helpSteps} currentIndex={state.helpStep} lang={lang} onNext={() => void store.nextHelpStep()} />
        ) : null}
      </div>

      <div ref={resultRef} tabIndex={-1} className="mkx-result" data-testid="result-region">
        {state.result ? <Feedback result={state.result} lang={lang} /> : null}
        {state.notice && state.notice.key === "practice.unreachable" ? (
          <p role="alert" data-testid="notice">
            {translate(lang, state.notice.key)}
          </p>
        ) : null}
      </div>

      {state.result && state.result.status !== "invalid-response" ? (
        <div className="mkx-explanation">
          <Button
            type="button"
            variant="tertiary"
            data-size="md"
            className="mkx-target"
            aria-expanded={state.explanationOpen}
            onClick={() => void store.toggleExplanation()}
            data-testid="toggle-explanation"
          >
            {translate(lang, state.explanationOpen ? "practice.hideExplanation" : "practice.showExplanation")}
          </Button>
          {state.explanationOpen ? (
            <StepPanel kind="explanation" instance={instance} steps={state.explanationSteps} currentIndex={state.explanationStep} lang={lang} onNext={() => void store.nextExplanationStep()} />
          ) : null}
        </div>
      ) : null}

      <div className="mkx-controls mkx-controls--next">
        <Button type="button" variant="primary" data-size="md" className="mkx-target" onClick={() => void store.nextQuestion("another")} data-testid="another">
          {translate(lang, "practice.another")}
        </Button>
        <Button type="button" variant="secondary" data-size="md" className="mkx-target" onClick={() => void store.nextQuestion("same")} data-testid="more-like-this">
          {translate(lang, "practice.moreLikeThis")}
        </Button>
        <Button type="button" variant="secondary" data-size="md" className="mkx-target" onClick={() => store.requestChallenge("easier")} data-testid="easier">
          {translate(lang, "practice.easier")}
        </Button>
        <Button type="button" variant="secondary" data-size="md" className="mkx-target" onClick={() => store.requestChallenge("harder")} data-testid="harder">
          {translate(lang, "practice.harder")}
        </Button>
      </div>

      {lessonHref ? (
        <p>
          <Link to={lessonHref} className="mkx-lesson-link" onActivate={() => store.openLesson()} data-testid="to-lesson">
            {translate(lang, "practice.toLesson")}
          </Link>
        </p>
      ) : null}
    </div>
  );
}
