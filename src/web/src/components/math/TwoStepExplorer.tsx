// The lesson's two-step explorer (specs/011): ax + c = b on a balance scale. The learner takes one loose weight off
// both pans at a time until the boxes stand alone, then gives each group one weight at a time, then keeps one box and
// one group. Every state, and whether x is found, comes from the service, so the app computes no mathematics; it only
// draws the state it is given, and offers sharing only once the service's state has no loose weights on the left.
import { useEffect, useState } from "react";
import { Button, Paragraph } from "@digdir/designsystemet-react";
import type { PracticeApi, TwoStepExplorerDto, TwoStepState } from "../../api/types";
import { translate, type Lang } from "../../i18n";
import { SharingScale } from "./BalanceScale";
import { UNKNOWN } from "./MathExpr";

export function TwoStepExplorer({ a, c, b, lang, api }: { a: number; c: number; b: number; lang: Lang; api: PracticeApi }) {
  const [model, setModel] = useState<TwoStepExplorerDto | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [history, setHistory] = useState<number[]>([]);
  const [index, setIndex] = useState(0);
  const [announced, setAnnounced] = useState("");

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    api
      .getTwoStepExplorer(a, c, b)
      .then((m) => !cancelled && setModel(m))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [api, a, c, b, attempt]);

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
  const state = model?.states[index];
  if (!model || !state) return <Paragraph>{translate(lang, "lesson.loading")}</Paragraph>;

  // The next states are found among the service's states, never computed: one loose weight fewer, one more round
  // shared once the boxes stand alone, or the kept state.
  const taken = state.left > 0 ? model.states.findIndex((s) => !s.kept && s.each === 0 && s.left === state.left - 1) : -1;
  const dealt = state.left === 0 && !state.kept ? model.states.findIndex((s) => !s.kept && s.left === 0 && s.each === state.each + 1) : -1;
  const keep = state.left === 0 && !state.kept ? model.states.findIndex((s) => s.kept && s.each === state.each && s.loose === state.loose) : -1;
  const go = (next: number) => {
    const target = model.states[next];
    if (!target) return;
    setHistory((h) => [...h, index]);
    setIndex(next);
    setAnnounced(describeTwoStep(target, model, lang).spoken);
  };
  const undo = () => {
    const previous = history.at(-1);
    if (previous === undefined) return;
    setHistory((h) => h.slice(0, -1));
    setIndex(previous);
    const target = model.states[previous];
    if (target) setAnnounced(describeTwoStep(target, model, lang).spoken);
  };
  const reset = () => {
    setHistory([]);
    setIndex(0);
    const start = model.states[0];
    if (start) setAnnounced(describeTwoStep(start, model, lang).spoken);
  };

  const described = describeTwoStep(state, model, lang);
  return (
    <figure className="mkx-balance" data-testid="two-step-explorer" data-left={state.left} data-each={state.each} data-loose={state.loose} data-solved={state.solved}>
      <SharingScale
        a={model.a}
        b={model.b}
        each={state.each}
        loose={state.loose}
        kept={state.kept}
        groups={state.left === 0}
        addend={{ total: model.c, remaining: state.left }}
        label={described.spoken}
      />
      <p className="mkx-expr mkx-balance__equation" aria-hidden="true" data-testid="two-step-equation">
        <math display="inline">
          {state.kept ? (
            <mrow>
              <mi>{UNKNOWN}</mi>
              <mo>=</mo>
              <mn>{state.each}</mn>
            </mrow>
          ) : state.left > 0 ? (
            <mrow>
              <mn>{model.a}</mn>
              <mi>{UNKNOWN}</mi>
              <mo>+</mo>
              <mn>{state.left}</mn>
              <mo>=</mo>
              <mn>{state.right}</mn>
            </mrow>
          ) : (
            <mrow>
              <mn>{model.a}</mn>
              <mi>{UNKNOWN}</mi>
              <mo>=</mo>
              <mn>{state.right}</mn>
            </mrow>
          )}
        </math>
      </p>
      <figcaption>
        <Paragraph data-testid="two-step-sentence" aria-hidden="true" className={state.solved ? "mkx-balance__solved" : undefined}>
          {described.sentence}
        </Paragraph>
      </figcaption>
      <div className="mkx-balance__controls" role="group" aria-label={translate(lang, "lesson.twoStepControls")}>
        <Button data-size="sm" className="mkx-target" disabled={taken < 0} onClick={() => go(taken)} data-testid="two-step-take">
          {translate(lang, "lesson.twoStepTake")}
        </Button>
        <Button data-size="sm" className="mkx-target" disabled={dealt < 0} onClick={() => go(dealt)} data-testid="two-step-deal">
          {translate(lang, "lesson.sharingDeal")}
        </Button>
        <Button variant="secondary" data-size="sm" className="mkx-target" disabled={keep < 0} onClick={() => go(keep)} data-testid="two-step-keep">
          {translate(lang, "lesson.sharingKeep")}
        </Button>
        <Button variant="tertiary" data-size="sm" className="mkx-target" disabled={history.length === 0} onClick={undo} data-testid="two-step-undo">
          {translate(lang, "lesson.balanceUndo")}
        </Button>
        <Button variant="tertiary" data-size="sm" className="mkx-target" disabled={index === 0} onClick={reset} data-testid="two-step-reset">
          {translate(lang, "lesson.balanceReset")}
        </Button>
      </div>
      <p className="mkx-visually-hidden" aria-live="polite" data-testid="two-step-live">
        {announced}
      </p>
    </figure>
  );
}

/**
 * The pans in words, the sentence under the drawing, and what is announced: the pans and the level scale, then the
 * next action (take the loose weights off, share, or keep one box and one group), or x once it is found. The caption
 * is hidden from screen readers, so the announcement carries every instruction it gives.
 */
export function describeTwoStep(state: Omit<TwoStepState, "solved"> & { solved?: boolean }, model: { a: number; c: number; b: number }, lang: Lang) {
  const { a, c, b } = model;
  const level = translate(lang, "lesson.balanceLevel");
  const pans = state.kept
    ? translate(lang, "lesson.sharingKeptPans", { each: state.each })
    : state.left > 0
      ? translate(lang, "lesson.twoStepPans", { a, left: state.left, right: state.right })
      : translate(lang, "lesson.sharingPans", { a, each: state.each, loose: state.loose });
  const sentence = state.solved
    ? `${translate(lang, "lesson.sharingSolved", { x: state.each })} ${translate(lang, "lesson.twoStepCheck", { a, x: state.each, c, b })}`
    : state.kept
      ? pans
      : state.left > 0
        ? translate(lang, "lesson.twoStepTakeFirst", { left: state.left })
        : state.each === 0
          ? translate(lang, "lesson.twoStepAlone", { a, right: state.right })
          : state.loose === 0
            ? translate(lang, "lesson.sharingAllShared", { each: state.each })
            : translate(lang, "lesson.sharingProgress", { each: state.each, loose: state.loose });
  const next = state.kept ? sentence : state.left > 0 || state.each === 0 ? sentence : state.loose === 0 ? translate(lang, "lesson.sharingNext") : "";
  return { pans, sentence, spoken: next ? `${pans} ${level} ${next}` : `${pans} ${level}` };
}
