// A check question in the supported part (specs/006 contracts/check-run.md "Supported part"): practice's workspace
// with help, feedback and retries, the explanation, and the lesson link `?from=check`, driven by the store's check
// calls. Its controls are the check's own: "Skip" before any submission, then only "Next question" or "See summary".
// No practice control ("Another question", "Make it easier", ...) is offered, and nothing undoes the switch.
import { Button, Paragraph } from "@digdir/designsystemet-react";
import type { InstanceDto } from "../api/types";
import { translate, type Lang } from "../i18n";
import type { CheckRun } from "../state/checks";
import { hasSubmission } from "../state/observations";
import { useStore, type CheckScreen } from "../state/store";
import { lessonFor } from "./ExerciseShell";
import { QuestionWorkspace, type QuestionController } from "./QuestionWorkspace";

export interface SupportedQuestionProps {
  lang: Lang;
  run: CheckRun;
  screen: CheckScreen;
  instance: InstanceDto;
  /** The question appeared after an action or an in-app navigation: the prompt takes focus. */
  takeFocus: boolean;
  /** Marks the learner's own action, so the next question or the summary takes focus. */
  onAct(): void;
}

export function SupportedQuestion({ lang, run, screen, instance, takeFocus, onAct }: SupportedQuestionProps) {
  const store = useStore();
  const position = run.position;
  const delivery = run.deliveries[position - 1];
  const resume = run.resume;
  const lessonId = lessonFor(instance.lessons, undefined);

  const controller: QuestionController = {
    lang,
    instance,
    questionKey: delivery?.id ?? null,
    draft: resume?.draft ?? "",
    checking: screen.checking,
    helpOpen: resume?.helpOpen ?? false,
    helpSteps: screen.helpSteps,
    helpStep: resume?.helpStep ?? -1,
    explanationOpen: resume?.explanationOpen ?? false,
    explanationSteps: screen.explanationSteps,
    explanationStep: resume?.explanationStep ?? -1,
    result: resume?.result ?? null,
    notice: screen.notice?.kind === "unsaved" ? "practice.unreachable" : null,
    lessonHref: lessonId && delivery ? `/lessons/${encodeURIComponent(lessonId)}?from=check&checkQuestion=${encodeURIComponent(delivery.id)}` : undefined,
    setDraft: (draft) => store.setCheckDraft(draft),
    submit: () => void store.submitCheckAnswer(),
    toggleHelp: () => store.toggleCheckPanel("help"),
    nextHelpStep: () => void store.nextCheckStep("help"),
    toggleExplanation: () => store.toggleCheckPanel("explanation"),
    nextExplanationStep: () => void store.nextCheckStep("explanation"),
  };

  const answered = delivery !== undefined && hasSubmission(delivery);
  const last = position >= run.questions.length;
  const act = (action: () => Promise<void>) => {
    onAct();
    void action();
  };

  const controls = (
    <div className="mkx-controls mkx-controls--next">
      {!answered ? (
        <Button type="button" variant="secondary" data-size="md" className="mkx-target" disabled={screen.checking} onClick={() => act(() => store.skipCheckQuestion())} data-testid="check-skip">
          {translate(lang, "check.skip")}
        </Button>
      ) : last ? (
        <Button type="button" variant="primary" data-size="md" className="mkx-target" onClick={() => act(() => store.nextCheckQuestion())} data-testid="check-finish">
          {translate(lang, "check.finish")}
        </Button>
      ) : (
        <Button type="button" variant="primary" data-size="md" className="mkx-target" onClick={() => act(() => store.nextCheckQuestion())} data-testid="check-next">
          {translate(lang, "check.next")}
        </Button>
      )}
    </div>
  );

  return (
    <div data-testid="supported-question">
      <Paragraph data-testid="check-mode">{translate(lang, "check.modeSupported", { i: run.switchAt ?? position })}</Paragraph>
      <Paragraph data-testid="check-position">{translate(lang, "check.position", { n: position, total: run.questions.length })}</Paragraph>
      <QuestionWorkspace controller={controller} controls={controls} testId="check-workspace" takeFocus={takeFocus} />
    </div>
  );
}
