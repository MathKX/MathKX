// The lesson's balance explorer (specs/008): x + a = b on a balance scale. The learner takes unit weights off
// either pan or both; the scale tips or stays level. Every state, its tilt, and the solved state come from the
// service, so the app computes no mathematics; it only draws the state it is given.
import { useEffect, useState } from "react";
import { Button, Paragraph } from "@digdir/designsystemet-react";
import type { BalanceExplorerDto, BalanceState, PracticeApi } from "../../api/types";
import { translate, type Lang } from "../../i18n";

const PIVOT = { x: 200, y: 70 };
const ARM = 150;
const TILT_DEGREES = 9;
const UNIT = 14;
const GAP = 3;
const COLUMNS = 5;
/** The unknown's symbol: notation, the same in every language, as in the lesson's $x + 3 = 7$. */
const UNKNOWN = "x";

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
      <Scale state={state} a={model.a} b={model.b} label={described.spoken} />
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
  const solved = state.solved ? ` ${translate(lang, "lesson.balanceSolved", { x: state.right })} ${translate(lang, "lesson.balanceCheck", { x: state.right, a: model.a, b: model.b })}` : "";
  return { tilt, spoken: `${pans} ${tilt}${solved}` };
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

function Scale({ state, a, b, label }: { state: BalanceState; a: number; b: number; label: string }) {
  const degrees = state.tilt === "left-down" ? -TILT_DEGREES : state.tilt === "right-down" ? TILT_DEGREES : 0;
  const radians = (degrees * Math.PI) / 180;
  const dx = ARM * Math.cos(radians);
  const dy = ARM * Math.sin(radians);
  const leftEnd = { x: PIVOT.x - dx, y: PIVOT.y - dy };
  const rightEnd = { x: PIVOT.x + dx, y: PIVOT.y + dy };
  return (
    <svg className="mkx-balance__scale" viewBox="-30 30 460 220" role="img" aria-label={label} data-testid="balance-scale">
      <path className="mkx-balance__stand" d={`M ${PIVOT.x - 50} 240 L ${PIVOT.x + 50} 240 L ${PIVOT.x + 8} 226 L ${PIVOT.x + 5} ${PIVOT.y} L ${PIVOT.x - 5} ${PIVOT.y} L ${PIVOT.x - 8} 226 Z`} />
      <g className="mkx-balance__beam" style={{ transform: `rotate(${degrees}deg)`, transformOrigin: `${PIVOT.x}px ${PIVOT.y}px` }}>
        <rect x={PIVOT.x - ARM - 6} y={PIVOT.y - 5} width={2 * ARM + 12} height={10} rx={5} />
      </g>
      <circle className="mkx-balance__pivot" cx={PIVOT.x} cy={PIVOT.y} r={9} />
      <Pan at={leftEnd} total={a} remaining={state.left} unknown testId="balance-pan-left" />
      <Pan at={rightEnd} total={b} remaining={state.right} testId="balance-pan-right" />
    </svg>
  );
}

/** A pan hanging from one end of the beam: its weights, with the ones taken off drawn as dashed outlines. */
function Pan({ at, total, remaining, unknown = false, testId }: { at: { x: number; y: number }; total: number; remaining: number; unknown?: boolean; testId: string }) {
  const columns = Math.min(total, COLUMNS);
  const unitsWidth = columns * UNIT + (columns - 1) * GAP;
  const boxWidth = 34;
  const contentWidth = unknown ? boxWidth + 8 + unitsWidth : unitsWidth;
  const startX = -contentWidth / 2;
  const unitsX = unknown ? startX + boxWidth + 8 : startX;
  const floor = 70;
  return (
    <g className="mkx-balance__pan" style={{ transform: `translate(${at.x}px, ${at.y}px)` }} data-testid={testId} data-remaining={remaining}>
      <path className="mkx-balance__string" d={`M 0 0 L -66 ${floor} M 0 0 L 66 ${floor}`} />
      <path className="mkx-balance__dish" d={`M -74 ${floor} Q 0 ${floor + 22} 74 ${floor} Z`} />
      {unknown ? (
        <g className="mkx-balance__unknown">
          <rect x={startX} y={floor - 40} width={boxWidth} height={40} rx={5} />
          <text x={startX + boxWidth / 2} y={floor - 14} textAnchor="middle">
            {UNKNOWN}
          </text>
        </g>
      ) : null}
      {Array.from({ length: total }, (_, i) => {
        const row = Math.floor(i / COLUMNS);
        const column = i % COLUMNS;
        const taken = i >= remaining;
        return (
          <rect
            key={i}
            className={taken ? "mkx-balance__unit mkx-balance__unit--taken" : "mkx-balance__unit"}
            x={unitsX + column * (UNIT + GAP)}
            y={floor - UNIT - row * (UNIT + GAP)}
            width={UNIT}
            height={UNIT}
            rx={3}
          />
        );
      })}
    </g>
  );
}
