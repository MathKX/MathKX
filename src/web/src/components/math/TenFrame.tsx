// A ten-frame: two rows of five cells. Cell states come from the service ("a", "b", "empty").
import { translate, type Lang } from "../../i18n";

export type Cell = "a" | "b" | "empty";

export function TenFrame({ cells, lang, label }: { cells: Cell[]; lang: Lang; label?: string }) {
  return (
    <ul className="mkx-ten-frame" aria-label={label ?? translate(lang, "a11y.frame")} data-testid="ten-frame">
      {cells.map((cell, i) => (
        <li
          key={i}
          className={`mkx-cell mkx-cell--${cell}`}
          aria-label={`${i + 1}: ${translate(lang, cell === "empty" ? "a11y.cellEmpty" : "a11y.cellFilled")}`}
        />
      ))}
    </ul>
  );
}
