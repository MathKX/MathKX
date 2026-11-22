// The drawing of a balance scale: shared by the lesson's balance explorer (specs/008), the sharing explorer
// (specs/010), and the balance help and explanation in practice (specs/009, specs/010). It draws the state it is
// given; the tilt, the weights on each pan, and the weights marked or set aside all come from the service.
import type { ReactNode } from "react";
import type { BalanceTilt } from "../../api/types";
import { UNKNOWN } from "./MathExpr";

const PIVOT = { x: 200, y: 70 };
const ARM = 150;
const TILT_DEGREES = 9;
const UNIT = 14;
const GAP = 3;
const STEP = UNIT + GAP;
const COLUMNS = 5;

/** The stand, the beam, and two hanging pans; each pan's contents are drawn from the pan's own origin. */
type PanData = Record<`data-${string}`, string | number | boolean>;

function ScaleFrame({ tilt, label, floor, halfWidth, viewBox, left, right, leftData = {}, rightData = {} }: { tilt: BalanceTilt; label: string; floor: number; halfWidth: number; viewBox: string; left: ReactNode; right: ReactNode; leftData?: PanData; rightData?: PanData }) {
  const degrees = tilt === "left-down" ? -TILT_DEGREES : tilt === "right-down" ? TILT_DEGREES : 0;
  const radians = (degrees * Math.PI) / 180;
  const dx = ARM * Math.cos(radians);
  const dy = ARM * Math.sin(radians);
  const base = PIVOT.y + floor + 50;
  const pan = (at: { x: number; y: number }, contents: ReactNode, testId: string, data: PanData) => (
    <g className="mkx-balance__pan" style={{ transform: `translate(${at.x}px, ${at.y}px)` }} data-testid={testId} {...data}>
      <path className="mkx-balance__string" d={`M 0 0 L ${-(halfWidth - 8)} ${floor} M 0 0 L ${halfWidth - 8} ${floor}`} />
      <path className="mkx-balance__dish" d={`M ${-halfWidth} ${floor} Q 0 ${floor + 22} ${halfWidth} ${floor} Z`} />
      {contents}
    </g>
  );
  return (
    <svg className="mkx-balance__scale" viewBox={viewBox} role="img" aria-label={label} data-testid="balance-scale">
      <path className="mkx-balance__stand" d={`M ${PIVOT.x - 50} ${base} L ${PIVOT.x + 50} ${base} L ${PIVOT.x + 8} ${base - 14} L ${PIVOT.x + 5} ${PIVOT.y} L ${PIVOT.x - 5} ${PIVOT.y} L ${PIVOT.x - 8} ${base - 14} Z`} />
      <g className="mkx-balance__beam" style={{ transform: `rotate(${degrees}deg)`, transformOrigin: `${PIVOT.x}px ${PIVOT.y}px` }}>
        <rect x={PIVOT.x - ARM - 6} y={PIVOT.y - 5} width={2 * ARM + 12} height={10} rx={5} />
      </g>
      <circle className="mkx-balance__pivot" cx={PIVOT.x} cy={PIVOT.y} r={9} />
      {pan({ x: PIVOT.x - dx, y: PIVOT.y - dy }, left, "balance-pan-left", leftData)}
      {pan({ x: PIVOT.x + dx, y: PIVOT.y + dy }, right, "balance-pan-right", rightData)}
    </svg>
  );
}

/** A box marked x standing on a pan floor; set aside, it is drawn as a dashed outline. */
function UnknownBox({ x, floor, width, setAside = false }: { x: number; floor: number; width: number; setAside?: boolean }) {
  return (
    <g className={setAside ? "mkx-balance__unknown mkx-balance__unknown--aside" : "mkx-balance__unknown"}>
      <rect x={x} y={floor - 40} width={width} height={40} rx={5} />
      <text x={x + width / 2} y={floor - 14} textAnchor="middle">
        {UNKNOWN}
      </text>
    </g>
  );
}

const unitClass = (taken: boolean, marked = false) => `mkx-balance__unit${taken ? " mkx-balance__unit--taken" : marked ? " mkx-balance__unit--marked" : ""}`;

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

/** x + a = b (specs/008, specs/009): the box and a weights on the left, b weights on the right. */
export function BalanceScale({ a, b, left, right, tilt, marked = 0, label }: BalanceScaleProps) {
  const floor = 70;
  const units = (total: number, remaining: number, startX: number) =>
    Array.from({ length: total }, (_, i) => (
      <rect key={i} className={unitClass(i >= remaining, i >= remaining - marked)} x={startX + (i % COLUMNS) * STEP} y={floor - UNIT - Math.floor(i / COLUMNS) * STEP} width={UNIT} height={UNIT} rx={3} />
    ));
  const width = (total: number) => Math.min(total, COLUMNS) * STEP - GAP;
  const boxWidth = 34;
  const leftStart = -(boxWidth + 8 + width(a)) / 2;
  return (
    <ScaleFrame
      tilt={tilt}
      label={label}
      floor={floor}
      halfWidth={74}
      viewBox="-30 30 460 220"
      leftData={{ "data-remaining": left }}
      rightData={{ "data-remaining": right }}
      left={
        <>
          <UnknownBox x={leftStart} floor={floor} width={boxWidth} />
          {units(a, left, leftStart + boxWidth + 8)}
        </>
      }
      right={units(b, right, -width(b) / 2)}
    />
  );
}

export interface SharingScaleProps {
  /** The authored a and b: a boxes of x on the left, b weights on the right. */
  a: number;
  b: number;
  /** Weights in each group, and weights not shared yet. */
  each: number;
  loose: number;
  /** One box and one group are kept; the others are set aside as outlines. */
  kept: boolean;
  /** Draw the a groups' places even before any weight is shared. */
  groups: boolean;
  /**
   * ax + c = b (specs/011): the c loose weights beside the boxes, of which `remaining` are still on the pan; the
   * others are drawn as outlines, and as many outlines follow the weights on the right.
   */
  addend?: { total: number; remaining: number };
  label: string;
}

const GROUP_COLUMNS = 2;
const GROUP_ROWS = 3;
const LOOSE_COLUMNS = 8;
const ADDEND_COLUMNS = 2;

/**
 * ax = b (specs/010): a boxes on the left; on the right, a groups along the pan and the weights not yet shared above
 * them. With an addend (specs/011), ax + c = b: the c loose weights stand beside the boxes until they are taken off.
 */
export function SharingScale({ a, b, each, loose, kept, groups, addend, label }: SharingScaleProps) {
  const floor = 120;
  const boxWidth = 30;
  const boxGap = 6;
  const boxesWidth = a * boxWidth + (a - 1) * boxGap;
  const addendWidth = addend ? ADDEND_COLUMNS * STEP - GAP : 0;
  const boxesStart = -(boxesWidth + (addend ? 8 + addendWidth : 0)) / 2;
  const addendStart = boxesStart + boxesWidth + 8;
  const taken = addend ? addend.total - addend.remaining : 0;
  const groupWidth = GROUP_COLUMNS * STEP - GAP;
  const groupGap = 8;
  const groupsStart = -(a * groupWidth + (a - 1) * groupGap) / 2;
  const groupHeight = GROUP_ROWS * STEP;
  const looseBase = floor - groupHeight - 12;
  const looseStart = -(Math.min(b, LOOSE_COLUMNS) * STEP - GAP) / 2;
  const unit = (key: number, x: number, y: number, className: string) => <rect key={key} className={className} x={x} y={y} width={UNIT} height={UNIT} rx={3} />;
  return (
    <ScaleFrame
      tilt="balanced"
      label={label}
      floor={floor}
      halfWidth={84}
      viewBox="-40 40 480 210"
      leftData={addend ? { "data-boxes": a, "data-left": addend.remaining } : { "data-boxes": a }}
      rightData={{ "data-each": each, "data-loose": loose, "data-kept": kept }}
      left={
        <>
          {Array.from({ length: a }, (_, i) => (
            <UnknownBox key={i} x={boxesStart + i * (boxWidth + boxGap)} floor={floor} width={boxWidth} setAside={kept && i > 0} />
          ))}
          {addend
            ? Array.from({ length: addend.total }, (_, k) =>
                unit(k, addendStart + (k % ADDEND_COLUMNS) * STEP, floor - UNIT - Math.floor(k / ADDEND_COLUMNS) * STEP, unitClass(k >= addend.remaining)),
              )
            : null}
        </>
      }
      right={
        <g>
          {Array.from({ length: a }, (_, g) => {
            const x0 = groupsStart + g * (groupWidth + groupGap);
            const aside = kept && g > 0;
            return (
              <g key={g} className={aside ? "mkx-sharing__group mkx-sharing__group--aside" : "mkx-sharing__group"} data-testid="sharing-group">
                {groups || each > 0 ? <rect className="mkx-sharing__band" x={x0 - 3} y={floor - groupHeight - 3} width={groupWidth + 6} height={groupHeight + 3} rx={4} /> : null}
                {Array.from({ length: each }, (_, k) => (
                  <rect key={k} className={unitClass(aside)} x={x0 + (k % GROUP_COLUMNS) * STEP} y={floor - UNIT - Math.floor(k / GROUP_COLUMNS) * STEP} width={UNIT} height={UNIT} rx={3} />
                ))}
              </g>
            );
          })}
          {Array.from({ length: loose + taken }, (_, k) =>
            unit(k, looseStart + (k % LOOSE_COLUMNS) * STEP, looseBase - UNIT - Math.floor(k / LOOSE_COLUMNS) * STEP, k < loose ? "mkx-balance__unit mkx-sharing__loose" : unitClass(true)),
          )}
        </g>
      }
    />
  );
}
