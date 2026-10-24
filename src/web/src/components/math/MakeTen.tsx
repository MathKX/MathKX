// The make-ten model: a ten-frame holding the first operand, loose counters for the second, and the split
// the service delivers step by step. Nothing here computes the total.
import { translate, type Lang } from "../../i18n";
import { TenFrame, type Cell } from "./TenFrame";

export interface MakeTenState {
  frame?: Cell[];
  loose?: number;
  need?: number;
  split?: { need: number; rest: number };
  total?: number;
}

export function MakeTen({ a, b, state, lang }: { a: number; b: number; state: MakeTenState; lang: Lang }) {
  const frame: Cell[] = state.frame ?? Array.from({ length: 10 }, (_, i) => (i < a ? "a" : "empty"));
  const loose = state.loose ?? b;
  return (
    <div className="mkx-make-ten" data-testid="make-ten">
      <TenFrame cells={frame} lang={lang} />
      <ul className="mkx-loose" aria-label={translate(lang, "a11y.loose", { n: loose })}>
        {Array.from({ length: loose }, (_, i) => (
          <li key={i} className="mkx-counter mkx-counter--b" aria-label={translate(lang, "a11y.counter", { n: i + 1 })} />
        ))}
      </ul>
    </div>
  );
}
