// The question workspace (specs/002 contracts/learner-app.md "Practice screen"; specs/006 research R8): expression,
// answer field, help before answering, feedback by code, explanation after either result, and the lesson link.
// Practice and a check's supported part each drive it with their own controller and put their controls in the slot.
import { useEffect, useId, useRef, type FormEvent, type ReactNode } from "react";
import { Button, Textfield } from "@digdir/designsystemet-react";
import type { InstanceDto, StepDto, ValidationResponse } from "../api/types";
import { translate, type Lang } from "../i18n";
import { Link, hasNavigatedInApp } from "../router";
import { AdditionPrompt } from "./math/MathExpr";
import { Feedback } from "./Feedback";
import { StepPanel } from "./StepPanel";

/** What the workspace shows, and the calls it makes; it holds no question state of its own. */
export interface QuestionController {
  lang: Lang;
  instance: InstanceDto;
  /** The shown question's delivery: a new value is a new question, which may take focus. */
  questionKey: string | null;
  draft: string;
  checking: boolean;
  helpOpen: boolean;
  helpSteps: StepDto[];
  helpStep: number;
  explanationOpen: boolean;
  explanationSteps: StepDto[];
  explanationStep: number;
  result: ValidationResponse | null;
  /** A dictionary key shown as an alert in the result region (an unreachable service), or null. */
  notice: string | null;
  /** The lesson link's target, its query included; none when no lesson practises the question. */
  lessonHref: string | undefined;
  setDraft(draft: string): void;
  submit(): void;
  toggleHelp(): void;
  nextHelpStep(): void;
  toggleExplanation(): void;
  nextExplanationStep(): void;
}

export interface QuestionWorkspaceProps {
  controller: QuestionController;
  /** The caller's controls, rendered after the explanation. */
  controls?: ReactNode;
  testId: string;
}

export function QuestionWorkspace({ controller: c, controls, testId }: QuestionWorkspaceProps) {
  const { lang, instance } = c;
  const fieldId = useId();
  const resultRef = useRef<HTMLDivElement>(null);
  const lastResult = useRef<unknown>(null);

  // A new question takes focus when focus would otherwise fall to the page: "Repeat this question" goes away once its
  // question is replaced, and a replay's repeat or "Practise again" arrive by navigation (specs/005 FR-016). A control
  // that stays, such as "Another question", keeps it; a page loaded directly keeps the browser's own start.
  const promptRef = useRef<HTMLParagraphElement>(null);
  const firstQuestion = useRef(true);
  useEffect(() => {
    if (!c.questionKey) return;
    const first = firstQuestion.current;
    firstQuestion.current = false;
    if (first && !hasNavigatedInApp()) return;
    const active = document.activeElement;
    if (!active || active === document.body) promptRef.current?.focus();
  }, [c.questionKey]);

  useEffect(() => {
    if (c.result && c.result !== lastResult.current) {
      lastResult.current = c.result;
      resultRef.current?.focus();
    }
  }, [c.result]);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    c.submit();
  };

  return (
    <div className="mkx-exercise" data-testid={testId}>
      <AdditionPrompt ref={promptRef} a={instance.a} b={instance.b} lang={lang} />

      <form onSubmit={onSubmit} className="mkx-answer-form" noValidate>
        <Textfield
          id={fieldId}
          label={translate(lang, "practice.answerLabel")}
          value={c.draft}
          onChange={(e) => c.setDraft(e.currentTarget.value)}
          inputMode="numeric"
          autoComplete="off"
          data-size="lg"
          data-testid="answer"
        />
        <div className="mkx-controls">
          <Button type="submit" variant="primary" data-size="md" className="mkx-target" disabled={c.checking} data-testid="check">
            {translate(lang, c.checking ? "practice.checking" : "practice.check")}
          </Button>
          {/* Opening help shows the operands only; the first step is fetched when the learner asks for it. */}
          <Button
            type="button"
            variant="secondary"
            data-size="md"
            className="mkx-target"
            aria-expanded={c.helpOpen}
            aria-controls={`${fieldId}-help`}
            onClick={() => c.toggleHelp()}
            data-testid="toggle-help"
          >
            {translate(lang, c.helpOpen ? "practice.hideHelp" : "practice.showHelp")}
          </Button>
        </div>
      </form>

      <div id={`${fieldId}-help`} hidden={!c.helpOpen}>
        {c.helpOpen ? <StepPanel kind="help" instance={instance} steps={c.helpSteps} currentIndex={c.helpStep} lang={lang} onNext={() => c.nextHelpStep()} /> : null}
      </div>

      <div ref={resultRef} tabIndex={-1} className="mkx-result" data-testid="result-region">
        {c.result ? <Feedback result={c.result} lang={lang} /> : null}
        {c.notice ? (
          <p role="alert" data-testid="notice">
            {translate(lang, c.notice)}
          </p>
        ) : null}
      </div>

      {c.result && c.result.status !== "invalid-response" ? (
        <div className="mkx-explanation">
          <Button
            type="button"
            variant="tertiary"
            data-size="md"
            className="mkx-target"
            aria-expanded={c.explanationOpen}
            onClick={() => c.toggleExplanation()}
            data-testid="toggle-explanation"
          >
            {translate(lang, c.explanationOpen ? "practice.hideExplanation" : "practice.showExplanation")}
          </Button>
          {c.explanationOpen ? (
            <StepPanel kind="explanation" instance={instance} steps={c.explanationSteps} currentIndex={c.explanationStep} lang={lang} onNext={() => c.nextExplanationStep()} />
          ) : null}
        </div>
      ) : null}

      {controls}

      {c.lessonHref ? (
        <p>
          {/* The origin travels in the address, so a modified click (new tab) carries it and the source tab is
              unchanged; the lesson page records the opening once the lesson is shown (specs/003 contracts/detour.md). */}
          <Link to={c.lessonHref} className="mkx-lesson-link" data-testid="to-lesson">
            {translate(lang, "practice.toLesson")}
          </Link>
        </p>
      ) : null}
    </div>
  );
}
