// A stepped help or explanation panel: renders the representation with the delivered step state and offers
// "Next step". The step text is a code resolved by the dictionaries; a revealing step is announced.
import { Button, Paragraph } from "@digdir/designsystemet-react";
import type { InstanceDto, StepDto, StepKind } from "../api/types";
import { translate, translateCode, type Lang } from "../i18n";
import { Groups, type GroupsState } from "./math/Counters";
import { MakeTen, type MakeTenState } from "./math/MakeTen";
import { BalanceScale, SharingScale } from "./math/BalanceScale";
import { describeSharing } from "./math/SharingExplorer";
import { describeTwoStep } from "./math/TwoStepExplorer";

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
      {representation === "balance-two-step" ? (
        <TwoStepStep a={instance.a} b={instance.b} c={instance.c ?? 0} state={visual as TwoStepStepState} lang={lang} />
      ) : representation === "balance-sharing" ? (
        <SharingStep a={instance.a} b={instance.b} state={visual as SharingStepState} lang={lang} />
      ) : representation === "balance" ? (
        <BalanceStep a={instance.a} b={instance.b} state={visual as BalanceStepState} lang={lang} />
      ) : representation === "make-ten" ? (
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

/** A balance help or explanation step (specs/009 FR-004): the service's weights per pan and the weights marked to take off. */
interface BalanceStepState {
  left?: number;
  right?: number;
  marked?: number;
}

function BalanceStep({ a, b, state, lang }: { a: number; b: number; state: BalanceStepState; lang: Lang }) {
  const left = state.left ?? a;
  const right = state.right ?? b;
  const marked = state.marked ?? 0;
  const pans = translate(lang, left === 0 ? "lesson.balancePansAlone" : "lesson.balancePans", { left, right });
  const label = [pans, translate(lang, "lesson.balanceLevel"), marked > 0 ? translate(lang, "a11y.balanceMarked", { n: marked }) : ""].filter(Boolean).join(" ");
  return (
    <div className="mkx-balance" data-testid="balance-step" data-marked={marked}>
      <BalanceScale a={a} b={b} left={left} right={right} tilt="balanced" marked={marked} label={label} />
    </div>
  );
}

/** A sharing help or explanation step (specs/010): weights per group, weights not shared, the group places, and kept. */
/** A two-step help or explanation step (specs/011 FR-004): the service's loose weights, groups, and kept state. */
interface TwoStepStepState {
  left?: number;
  right?: number;
  each?: number;
  loose?: number;
  kept?: boolean;
  groups?: boolean;
}

function TwoStepStep({ a, b, c, state, lang }: { a: number; b: number; c: number; state: TwoStepStepState; lang: Lang }) {
  const shown = { left: state.left ?? c, right: state.right ?? b, each: state.each ?? 0, loose: state.loose ?? b, kept: state.kept ?? false };
  const { pans } = describeTwoStep(shown, { a, c, b }, lang);
  return (
    <div className="mkx-balance" data-testid="two-step-step" data-groups={state.groups ?? false}>
      <SharingScale a={a} b={b} each={shown.each} loose={shown.loose} kept={shown.kept} groups={state.groups ?? false} addend={{ total: c, remaining: shown.left }} label={`${pans} ${translate(lang, "lesson.balanceLevel")}`} />
    </div>
  );
}

interface SharingStepState {
  each?: number;
  loose?: number;
  kept?: boolean;
  groups?: boolean;
}

function SharingStep({ a, b, state, lang }: { a: number; b: number; state: SharingStepState; lang: Lang }) {
  const each = state.each ?? 0;
  const loose = state.loose ?? b;
  const kept = state.kept ?? false;
  const { pans } = describeSharing({ each, loose, kept }, a, b, lang);
  return (
    <div className="mkx-balance" data-testid="sharing-step" data-groups={state.groups ?? false}>
      <SharingScale a={a} b={b} each={each} loose={loose} kept={kept} groups={state.groups ?? false} label={`${pans} ${translate(lang, "lesson.balanceLevel")}`} />
    </div>
  );
}
