// Renders a simple addition prompt as MathML with a spoken label. The operands come from the service.
import { translate, type Lang } from "../../i18n";

export function AdditionPrompt({ a, b, lang }: { a: number; b: number; lang: Lang }) {
  return (
    <p className="mkx-expr" aria-label={translate(lang, "practice.spoken", { a, b })} data-testid="prompt">
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
