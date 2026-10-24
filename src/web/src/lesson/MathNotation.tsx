// Lesson mathematics as MathML Core from the pilot grammar (specs/003 contracts/lesson-renderer.md "Notation").
// No aria-label: assistive technology reads the MathML itself, in the page language.
import { useMemo, type ReactNode } from "react";
import { translate, type Lang } from "../i18n";
import { parseNotation, type NotationNode } from "./notation";

function render(node: NotationNode, key?: number): ReactNode {
  switch (node.t) {
    case "row":
      return <mrow key={key}>{node.c.map((child, i) => render(child, i))}</mrow>;
    case "mn":
      return <mn key={key}>{node.v}</mn>;
    case "mi":
      return <mi key={key}>{node.v}</mi>;
    case "mo":
      return <mo key={key}>{node.v}</mo>;
    case "sup":
      return (
        <msup key={key}>
          {render(node.b)}
          {render(node.e)}
        </msup>
      );
    case "sub":
      return (
        <msub key={key}>
          {render(node.b)}
          {render(node.e)}
        </msub>
      );
    case "frac":
      return (
        <mfrac key={key}>
          {render(node.n)}
          {render(node.d)}
        </mfrac>
      );
    case "prime":
      return (
        <msup key={key}>
          {render(node.b)}
          <mo>′</mo>
        </msup>
      );
  }
}

export function Notation({ source, display, lang }: { source: string; display: boolean; lang: Lang }) {
  const parsed = useMemo(() => parseNotation(source), [source]);
  if (!parsed.ok) {
    return (
      <span className="mkx-placeholder" role="note" data-testid="expression-failed">
        {translate(lang, "lesson.expressionFailed")} <code>{source}</code>
      </span>
    );
  }
  return (
    <math display={display ? "block" : "inline"} data-testid={display ? "math-display" : "math-inline"}>
      {render(parsed.tree)}
    </math>
  );
}
