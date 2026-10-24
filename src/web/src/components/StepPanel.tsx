// A stepped help or explanation panel: renders the representation with the delivered step state and offers
// "Next step". The step text is a code resolved by the dictionaries; a revealing step is announced.
import { Button, Paragraph } from "@digdir/designsystemet-react";
import type { InstanceDto, StepDto, StepKind } from "../api/types";
import { translate, translateCode, type Lang } from "../i18n";
import { Groups, type GroupsState } from "./math/Counters";
import { MakeTen, type MakeTenState } from "./math/MakeTen";

export interface StepPanelProps {
  kind: StepKind;
  instance: InstanceDto;
  steps: StepDto[];
  currentIndex: number;
  lang: Lang;
  onNext(): void;
}

export function StepPanel({ kind, instance, steps, currentIndex, lang, onNext }: StepPanelProps) {
  const representation = kind === "help" ? instance.representations.help[0] : instance.representations.explanation[0];
  const step = currentIndex >= 0 ? steps[currentIndex] : undefined;
  const count = steps[0]?.count;
  const atEnd = step !== undefined && count !== undefined && step.index >= count - 1;
  const visual = (step?.visual ?? {}) as Record<string, unknown>;
  const revealed = steps.some((s) => s.reveals);
  return (
    <section
      className="mkx-step-panel"
      aria-label={translate(lang, kind === "help" ? "a11y.helpRegion" : "a11y.explanationRegion")}
      data-testid={`${kind}-panel`}
    >
      {representation === "make-ten" ? (
        <MakeTen a={instance.a} b={instance.b} state={visual as MakeTenState} lang={lang} />
      ) : (
        <Groups a={instance.a} b={instance.b} state={visual as GroupsState} lang={lang} />
      )}
      {step ? (
        <Paragraph data-testid={`${kind}-step-text`}>
          <span className="mkx-step-count">{translate(lang, "practice.stepOf", { n: step.index + 1, count: step.count })}</span>{" "}
          {translateCode(lang, "explain", step.text.code, step.text.values)}
        </Paragraph>
      ) : null}
      {revealed ? (
        <Paragraph role="status" data-testid={`${kind}-revealed`}>
          {translate(lang, "practice.answerShown")}
        </Paragraph>
      ) : null}
      {!atEnd ? (
        <Button variant="secondary" data-size="md" className="mkx-target" onClick={onNext} data-testid={`${kind}-next`}>
          {translate(lang, "practice.nextStep")}
        </Button>
      ) : null}
    </section>
  );
}
