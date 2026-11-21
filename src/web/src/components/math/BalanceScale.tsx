// The drawing of a balance scale for x + a = b: shared by the lesson's balance explorer (specs/008) and the balance
// help and explanation in practice (specs/009). It draws the state it is given; the tilt, the weights left on each
// pan, and the weights marked to take off all come from the service.
import type { BalanceTilt } from "../../api/types";
import { UNKNOWN } from "./MathExpr";

const PIVOT = { x: 200, y: 70 };
const ARM = 150;
const TILT_DEGREES = 9;
const UNIT = 14;
const GAP = 3;
const COLUMNS = 5;

export interface BalanceScaleProps {
  /** The authored a and b: every weight is drawn, the ones taken off as dashed outlines. */
  a: number;
  b: number;
  /** The weights still on each pan. */
  left: number;
  right: number;
  tilt: BalanceTilt;
  /** How many of the weights still on each pan are marked to take off next. */
  marked?: number;
  label: string;
}

export function BalanceScale({ a, b, left, right, tilt, marked = 0, label }: BalanceScaleProps) {
  const degrees = tilt === "left-down" ? -TILT_DEGREES : tilt === "right-down" ? TILT_DEGREES : 0;
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
      <Pan at={leftEnd} total={a} remaining={left} marked={marked} unknown testId="balance-pan-left" />
      <Pan at={rightEnd} total={b} remaining={right} marked={marked} testId="balance-pan-right" />
    </svg>
  );
}

/** A pan hanging from one end of the beam: its weights, the ones taken off drawn as dashed outlines. */
function Pan({ at, total, remaining, marked, unknown = false, testId }: { at: { x: number; y: number }; total: number; remaining: number; marked: number; unknown?: boolean; testId: string }) {
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
        const state = i >= remaining ? " mkx-balance__unit--taken" : i >= remaining - marked ? " mkx-balance__unit--marked" : "";
        return <rect key={i} className={`mkx-balance__unit${state}`} x={unitsX + column * (UNIT + GAP)} y={floor - UNIT - row * (UNIT + GAP)} width={UNIT} height={UNIT} rx={3} />;
      })}
    </g>
  );
}
