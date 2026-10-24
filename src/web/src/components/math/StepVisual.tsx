// A lesson's step-through make-ten or groups visual for authored values (specs/003 FR-008). The steps come from the
// service's step models, the same as a question's explanation; picture, step count, and sentence change together,
// backwards and forwards. The total appears only on the step that shows it.
import { useEffect, useState } from "react";
import { Button, Paragraph } from "@digdir/designsystemet-react";
import type { PracticeApi, VisualStepsDto } from "../../api/types";
import { translate, translateCode, type Lang } from "../../i18n";
import { Groups, type GroupsState } from "./Counters";
import { MakeTen, type MakeTenState } from "./MakeTen";

export function StepVisual({ type, a, b, lang, api }: { type: "make-ten" | "groups"; a: number; b: number; lang: Lang; api: PracticeApi }) {
  const [model, setModel] = useState<VisualStepsDto | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    api
      .getVisualSteps(type, a, b)
      .then((m) => !cancelled && setModel(m))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [api, type, a, b, attempt]);

  if (failed) {
    return (
      <div className="mkx-placeholder" role="alert" data-testid="visual-failed">
        <Paragraph>{translate(lang, "lesson.visualFailed")}</Paragraph>
        <Button variant="secondary" data-size="sm" className="mkx-target" onClick={() => setAttempt((n) => n + 1)}>
          {translate(lang, "lesson.retry")}
        </Button>
      </div>
    );
  }
  const step = model?.steps[index];
  if (!model || !step) return <Paragraph>{translate(lang, "lesson.loading")}</Paragraph>;

  const visual = step.visual as Record<string, unknown>;
  return (
    <section className="mkx-step-panel" aria-label={translate(lang, "a11y.explanationRegion")} data-testid={`step-visual-${type}`}>
      {type === "make-ten" ? <MakeTen a={a} b={b} state={visual as MakeTenState} lang={lang} /> : <Groups a={a} b={b} state={visual as GroupsState} lang={lang} />}
      <Paragraph aria-live="polite" data-testid="step-visual-text">
        <span className="mkx-step-count">{translate(lang, "practice.stepOf", { n: step.index + 1, count: step.count })}</span>{" "}
        {translateCode(lang, "explain", step.text.code, step.text.values)}
      </Paragraph>
      <div className="mkx-controls">
        <Button variant="secondary" data-size="md" className="mkx-target" disabled={index === 0} onClick={() => setIndex((i) => Math.max(0, i - 1))} data-testid="step-visual-previous">
          {translate(lang, "lesson.previousStep")}
        </Button>
        <Button variant="secondary" data-size="md" className="mkx-target" disabled={index >= model.steps.length - 1} onClick={() => setIndex((i) => Math.min(model.steps.length - 1, i + 1))} data-testid="step-visual-next">
          {translate(lang, "practice.nextStep")}
        </Button>
      </div>
    </section>
  );
}
