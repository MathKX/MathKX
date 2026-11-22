// The lesson's sharing explorer (specs/010): ax = b on a balance scale. The learner gives each group one weight at a
// time, then keeps one box and one group. Every state, and whether x is found, comes from the service, so the app
// computes no mathematics; it only draws the state it is given.
import { useEffect, useState } from "react";
import { Button, Paragraph } from "@digdir/designsystemet-react";
import type { PracticeApi, SharingExplorerDto, SharingState } from "../../api/types";
import { translate, type Lang } from "../../i18n";
import { SharingScale } from "./BalanceScale";
import { UNKNOWN } from "./MathExpr";

export function SharingExplorer({ a, b, lang, api }: { a: number; b: number; lang: Lang; api: PracticeApi }) {
  const [model, setModel] = useState<SharingExplorerDto | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [history, setHistory] = useState<number[]>([]);
  const [index, setIndex] = useState(0);
  const [announced, setAnnounced] = useState("");

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    api
      .getSharingExplorer(a, b)
      .then((m) => !cancelled && setModel(m))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [api, a, b, attempt]);

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

  // The next states are found among the service's states, never computed: one more round shared, or the kept state.
  const dealt = model.states.findIndex((s) => !s.kept && s.each === state.each + 1);
  const keep = state.kept ? -1 : model.states.findIndex((s) => s.kept && s.each === state.each && s.loose === state.loose);
  const go = (next: number) => {
    const target = model.states[next];
    if (!target) return;
    setHistory((h) => [...h, index]);
    setIndex(next);
    setAnnounced(describe(target, model, lang).spoken);
  };
  const undo = () => {
    const previous = history.at(-1);
    if (previous === undefined) return;
    setHistory((h) => h.slice(0, -1));
    setIndex(previous);
    const target = model.states[previous];
    if (target) setAnnounced(describe(target, model, lang).spoken);
  };
  const reset = () => {
    setHistory([]);
    setIndex(0);
    const start = model.states[0];
    if (start) setAnnounced(describe(start, model, lang).spoken);
  };

  const described = describe(state, model, lang);
  return (
    <figure className="mkx-balance" data-testid="sharing-explorer" data-each={state.each} data-loose={state.loose} data-solved={state.solved}>
      <SharingScale a={model.a} b={model.b} each={state.each} loose={state.loose} kept={state.kept} groups label={described.spoken} />
      <p className="mkx-expr mkx-balance__equation" aria-hidden="true" data-testid="sharing-equation">
        <math display="inline">
          {state.kept ? (
            <mrow>
              <mi>{UNKNOWN}</mi>
              <mo>=</mo>
              <mn>{state.each}</mn>
            </mrow>
          ) : (
            <mrow>
              <mn>{model.a}</mn>
              <mi>{UNKNOWN}</mi>
              <mo>=</mo>
              <mn>{model.b}</mn>
            </mrow>
          )}
        </math>
      </p>
      <figcaption>
        <Paragraph data-testid="sharing-sentence" aria-hidden="true" className={state.solved ? "mkx-balance__solved" : undefined}>
          {described.sentence}
        </Paragraph>
      </figcaption>
      <div className="mkx-balance__controls" role="group" aria-label={translate(lang, "lesson.sharingControls")}>
        <Button data-size="sm" className="mkx-target" disabled={dealt < 0} onClick={() => go(dealt)} data-testid="sharing-deal">
          {translate(lang, "lesson.sharingDeal")}
        </Button>
        <Button variant="secondary" data-size="sm" className="mkx-target" disabled={keep < 0} onClick={() => go(keep)} data-testid="sharing-keep">
          {translate(lang, "lesson.sharingKeep")}
        </Button>
        <Button variant="tertiary" data-size="sm" className="mkx-target" disabled={history.length === 0} onClick={undo} data-testid="sharing-undo">
          {translate(lang, "lesson.balanceUndo")}
        </Button>
        <Button variant="tertiary" data-size="sm" className="mkx-target" disabled={index === 0} onClick={reset} data-testid="sharing-reset">
          {translate(lang, "lesson.balanceReset")}
        </Button>
      </div>
      <p className="mkx-visually-hidden" aria-live="polite" data-testid="sharing-live">
        {announced}
      </p>
    </figure>
  );
}

/** The pans in words, and the sentence under the drawing: how far the sharing has come, or x. */
export function describeSharing(state: { each: number; loose: number; kept: boolean; solved?: boolean }, a: number, b: number, lang: Lang) {
  const pans = state.kept
    ? translate(lang, "lesson.sharingKeptPans", { each: state.each })
    : translate(lang, "lesson.sharingPans", { a, each: state.each, loose: state.loose });
  const sentence = state.solved
    ? `${translate(lang, "lesson.sharingSolved", { x: state.each })} ${translate(lang, "lesson.sharingCheck", { a, x: state.each, b })}`
    : state.kept
      ? translate(lang, "lesson.sharingKeptPans", { each: state.each })
      : state.loose === 0
        ? translate(lang, "lesson.sharingAllShared", { each: state.each })
        : translate(lang, "lesson.sharingProgress", { each: state.each, loose: state.loose });
  return { pans, sentence };
}

/** What is announced: the pans and the level scale, then x once it is found, or the next action once every weight is shared (PR 64 review). */
function describe(state: SharingState, model: SharingExplorerDto, lang: Lang) {
  const { pans, sentence } = describeSharing(state, model.a, model.b, lang);
  const spoken = `${pans} ${translate(lang, "lesson.balanceLevel")}`;
  const next = state.kept ? sentence : state.loose === 0 ? translate(lang, "lesson.sharingNext") : "";
  return { sentence, spoken: next ? `${spoken} ${next}` : spoken };
}
