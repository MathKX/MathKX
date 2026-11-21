// The lesson's balance explorer (specs/008): x + a = b on a balance scale. The learner takes unit weights off
// either pan or both; the scale tips or stays level. Every state, its tilt, and the solved state come from the
// service, so the app computes no mathematics; it only draws the state it is given.
import { useEffect, useState } from "react";
import { Button, Paragraph } from "@digdir/designsystemet-react";
import type { BalanceExplorerDto, BalanceState, PracticeApi } from "../../api/types";
import { translate, type Lang } from "../../i18n";
import { BalanceScale } from "./BalanceScale";
import { UNKNOWN } from "./MathExpr";


type Position = { left: number; right: number };

export function BalanceExplorer({ a, b, lang, api }: { a: number; b: number; lang: Lang; api: PracticeApi }) {
  const [model, setModel] = useState<BalanceExplorerDto | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [history, setHistory] = useState<Position[]>([]);
  const [position, setPosition] = useState<Position>({ left: a, right: b });
  const [announced, setAnnounced] = useState("");

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    api
      .getBalanceExplorer(a, b)
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
  const state = model?.states.find((s) => s.left === position.left && s.right === position.right);
  if (!model || !state) return <Paragraph>{translate(lang, "lesson.loading")}</Paragraph>;

  const described = describe(state, model, lang);
  const move = (next: Position) => {
    const target = model.states.find((s) => s.left === next.left && s.right === next.right);
    if (!target) return;
    setHistory((h) => [...h, position]);
    setPosition(next);
    setAnnounced(describe(target, model, lang).spoken);
  };
  const undo = () => {
    const previous = history.at(-1);
    if (!previous) return;
    const target = model.states.find((s) => s.left === previous.left && s.right === previous.right);
    setHistory((h) => h.slice(0, -1));
    setPosition(previous);
    if (target) setAnnounced(describe(target, model, lang).spoken);
  };
  const reset = () => {
    setHistory([]);
    setPosition({ left: model.a, right: model.b });
    const start = model.states[0];
    if (start) setAnnounced(describe(start, model, lang).spoken);
  };

  const atStart = position.left === model.a && position.right === model.b;
  return (
    <figure className="mkx-balance" data-testid="balance-explorer" data-tilt={state.tilt} data-solved={state.solved}>
      <BalanceScale a={model.a} b={model.b} left={state.left} right={state.right} tilt={state.tilt} label={described.spoken} />
      <Equation state={state} />
      <figcaption>
        <Paragraph data-testid="balance-sentence" aria-hidden="true">
          {described.tilt}
        </Paragraph>
        {state.tilt !== "balanced" ? (
          <Paragraph data-testid="balance-hint" aria-hidden="true">
            {translate(lang, "lesson.balanceHint")}
          </Paragraph>
        ) : null}
        {state.solved ? (
          <Paragraph data-testid="balance-solved" aria-hidden="true" className="mkx-balance__solved">
            {translate(lang, "lesson.balanceSolved", { x: state.right })} {translate(lang, "lesson.balanceCheck", { x: state.right, a: model.a, b: model.b })}
          </Paragraph>
        ) : null}
      </figcaption>
      <div className="mkx-balance__controls" role="group" aria-label={translate(lang, "lesson.balanceControls")}>
        <Button
          data-size="sm"
          className="mkx-target"
          disabled={state.left === 0 || state.right === 0}
          onClick={() => move({ left: state.left - 1, right: state.right - 1 })}
          data-testid="balance-both"
        >
          {translate(lang, "lesson.balanceBoth")}
        </Button>
        <Button variant="secondary" data-size="sm" className="mkx-target" disabled={state.left === 0} onClick={() => move({ left: state.left - 1, right: state.right })} data-testid="balance-left">
          {translate(lang, "lesson.balanceLeft")}
        </Button>
        <Button variant="secondary" data-size="sm" className="mkx-target" disabled={state.right === 0} onClick={() => move({ left: state.left, right: state.right - 1 })} data-testid="balance-right">
          {translate(lang, "lesson.balanceRight")}
        </Button>
        <Button variant="tertiary" data-size="sm" className="mkx-target" disabled={history.length === 0} onClick={undo} data-testid="balance-undo">
          {translate(lang, "lesson.balanceUndo")}
        </Button>
        <Button variant="tertiary" data-size="sm" className="mkx-target" disabled={atStart} onClick={reset} data-testid="balance-reset">
          {translate(lang, "lesson.balanceReset")}
        </Button>
      </div>
      <p className="mkx-visually-hidden" aria-live="polite" data-testid="balance-live">
        {announced}
      </p>
    </figure>
  );
}

function describe(state: BalanceState, model: BalanceExplorerDto, lang: Lang) {
  const pans = translate(lang, state.left === 0 ? "lesson.balancePansAlone" : "lesson.balancePans", { left: state.left, right: state.right });
  const tilt = translate(lang, state.tilt === "balanced" ? "lesson.balanceLevel" : state.tilt === "left-down" ? "lesson.balanceLeftDown" : "lesson.balanceRightDown");
  // A tilted scale carries the same hint the sighted learner sees, so a screen-reader user also learns how to recover.
  const hint = state.tilt !== "balanced" ? ` ${translate(lang, "lesson.balanceHint")}` : "";
  const solved = state.solved ? ` ${translate(lang, "lesson.balanceSolved", { x: state.right })} ${translate(lang, "lesson.balanceCheck", { x: state.right, a: model.a, b: model.b })}` : "";
  return { tilt, spoken: `${pans} ${tilt}${hint}${solved}` };
}

/** x, then + and the left pan's weights unless none are left, then = or ≠ as the service's tilt says, then the right pan. */
function Equation({ state }: { state: BalanceState }) {
  return (
    <p className="mkx-expr mkx-balance__equation" aria-hidden="true" data-testid="balance-equation">
      <math display="inline">
        <mrow>
          <mi>{UNKNOWN}</mi>
          {state.left > 0 ? (
            <>
              <mo>+</mo>
              <mn>{state.left}</mn>
            </>
          ) : null}
          <mo>{state.tilt === "balanced" ? "=" : "≠"}</mo>
          <mn>{state.right}</mn>
        </mrow>
      </math>
    </p>
  );
}
