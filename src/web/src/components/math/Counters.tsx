// Grouped counters for early addition (exercise-experience "Addition example"). Renders the operands and
// the step state the service delivered; no name or text states the total before a revealing step.
import { translate, type Lang } from "../../i18n";

function CounterGroup({ n, counted, label, lang }: { n: number; counted: number; label: string; lang: Lang }) {
  const columns = n <= 4 ? 2 : n <= 9 ? 3 : 5;
  return (
    <ul className="mkx-counter-group" aria-label={label} style={{ gridTemplateColumns: `repeat(${columns}, 1.75rem)` }}>
      {Array.from({ length: n }, (_, i) => (
        <li
          key={i}
          className={`mkx-counter${i < counted ? " mkx-counter--counted" : ""}`}
          aria-label={`${translate(lang, "a11y.counter", { n: i + 1 })}${i < counted ? `, ${translate(lang, "a11y.counted")}` : ""}`}
        >
          {i < counted ? <span aria-hidden="true">{i + 1}</span> : null}
        </li>
      ))}
    </ul>
  );
}

export interface GroupsState {
  countedFirst?: number;
  countedSecond?: number;
  countedAll?: number;
  combined?: boolean;
}

export function Groups({ a, b, state, lang }: { a: number; b: number; state: GroupsState; lang: Lang }) {
  const countedAll = state.countedAll;
  const countedFirst = countedAll !== undefined ? a : (state.countedFirst ?? 0);
  const countedSecond = countedAll !== undefined ? b : (state.countedSecond ?? 0);
  return (
    <div className={`mkx-groups${state.combined ? " mkx-groups--combined" : ""}`} data-testid="groups">
      <CounterGroup n={a} counted={countedFirst} label={translate(lang, "a11y.firstGroup", { n: a })} lang={lang} />
      <span className="mkx-plus" aria-hidden="true">
        +
      </span>
      <CounterGroup n={b} counted={countedSecond} label={translate(lang, "a11y.secondGroup", { n: b })} lang={lang} />
    </div>
  );
}
