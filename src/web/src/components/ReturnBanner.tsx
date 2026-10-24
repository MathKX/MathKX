// "Back to your question" during a detour (specs/003 FR-014): the question's prompt (never its result) and a link
// to practice, where the store still holds the question, draft, help, explanation, and pending change.
import { useState } from "react";
import { Button } from "@digdir/designsystemet-react";
import { translate, type Lang } from "../i18n";
import { Link } from "../router";

export function ReturnBanner({ a, b, skillId, lang }: { a: number; b: number; skillId: string; lang: Lang }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  const spoken = translate(lang, "practice.spoken", { a, b });
  return (
    <section className="mkx-panel-accent mkx-return" aria-label={translate(lang, "detour.bannerRegion")} data-testid="return-banner">
      <Link to={`/practice/${encodeURIComponent(skillId)}`} className="mkx-return__link mkx-target" data-testid="return-to-question">
        <span aria-label={translate(lang, "detour.backLabel", { spoken })}>
          {translate(lang, "detour.back")}{" "}
          <math display="inline" aria-hidden="true">
            <mrow>
              <mn>{a}</mn>
              <mo>+</mo>
              <mn>{b}</mn>
              <mo>=</mo>
              <mi>?</mi>
            </mrow>
          </math>
        </span>
      </Link>
      <Button variant="tertiary" data-size="sm" className="mkx-target" onClick={() => setDismissed(true)} data-testid="return-dismiss">
        {translate(lang, "detour.dismiss")}
      </Button>
    </section>
  );
}
