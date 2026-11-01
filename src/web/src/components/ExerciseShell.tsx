// The practice screen's exercise (specs/002 contracts/learner-app.md "Practice screen"): the question workspace,
// driven by the store's current question, with practice's learner controls.
import { useEffect } from "react";
import { Button } from "@digdir/designsystemet-react";
import { translate } from "../i18n";
import { hasSubmission } from "../state/observations";
import { useStore } from "../state/store";
import { QuestionWorkspace, type QuestionController } from "./QuestionWorkspace";

/**
 * The lesson to link to from this question (specs/003 contracts/detour.md): the one that started the practice run
 * when the instance lists it, else the first listed (lesson-ID order); none when no lesson practises the definition.
 */
function lessonFor(lessons: { id: string }[] | undefined, originLessonId: string | undefined): string | undefined {
  if (!lessons || lessons.length === 0) return undefined;
  return (lessons.find((l) => l.id === originLessonId) ?? lessons[0])?.id;
}

export function ExerciseShell() {
  const store = useStore();
  const { state } = store;
  const lang = state.language;
  const instance = state.instance;
  const current = state.deliveries.find((d) => d.id === state.currentDeliveryId);
  const originLessonId = current?.originLessonId;
  const lessonId = lessonFor(instance?.lessons, originLessonId);

  // A question stored before instances carried their lessons is re-resolved once, so its link can be derived.
  const needsLessons = Boolean(instance && !instance.lessons);
  useEffect(() => {
    if (needsLessons) void store.ensureInstanceLessons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsLessons]);

  if (!instance) return null;

  const controller: QuestionController = {
    lang,
    instance,
    questionKey: state.currentDeliveryId,
    draft: state.draft,
    checking: state.checking,
    helpOpen: state.helpOpen,
    helpSteps: state.helpSteps,
    helpStep: state.helpStep,
    explanationOpen: state.explanationOpen,
    explanationSteps: state.explanationSteps,
    explanationStep: state.explanationStep,
    result: state.result,
    notice: state.notice?.key === "practice.unreachable" ? state.notice.key : null,
    lessonHref: lessonId ? `/lessons/${encodeURIComponent(lessonId)}?from=question` : undefined,
    setDraft: (draft) => store.setDraft(draft),
    submit: () => void store.submit(),
    toggleHelp: () => void store.toggleHelp(),
    nextHelpStep: () => void store.nextHelpStep(),
    toggleExplanation: () => void store.toggleExplanation(),
    nextExplanationStep: () => void store.nextExplanationStep(),
  };

  const controls = (
    <div className="mkx-controls mkx-controls--next">
      <Button type="button" variant="primary" data-size="md" className="mkx-target" onClick={() => void store.nextQuestion("another")} data-testid="another">
        {translate(lang, "practice.another")}
      </Button>
      {current && hasSubmission(current) ? (
        <Button type="button" variant="secondary" data-size="md" className="mkx-target" onClick={() => void store.repeatQuestion(current.id)} data-testid="repeat-question">
          {translate(lang, "practice.repeat")}
        </Button>
      ) : null}
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
  );

  return <QuestionWorkspace controller={controller} controls={controls} testId="exercise-shell" />;
}
