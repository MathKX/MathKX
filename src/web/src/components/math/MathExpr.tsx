// Renders a simple addition prompt as MathML with a spoken label. The operands come from the service. It can take
// focus from code, so a new question can receive it (specs/005 FR-016), but is not a Tab stop.
import type { Ref } from "react";
import { translate, type Lang } from "../../i18n";

export function AdditionPrompt({ a, b, lang, ref }: { a: number; b: number; lang: Lang; ref?: Ref<HTMLParagraphElement> }) {
  return (
    <p ref={ref} tabIndex={-1} className="mkx-expr" aria-label={translate(lang, "practice.spoken", { a, b })} data-testid="prompt">
      <math display="inline" aria-hidden="true">
        <mrow>
          <mn>{a}</mn>
          <mo>+</mo>
          <mn>{b}</mn>
          <mo>=</mo>
          <mi>?</mi>
        </mrow>
      </math>
    </p>
  );
}
