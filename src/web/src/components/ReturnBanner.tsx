// "Back to your question" during a detour (specs/003 FR-014): the question's prompt (never its result) and a link
// back to it: to practice, where the store still holds the question, draft, help, explanation, and pending change,
// or to the check run a supported check question belongs to (specs/006 research R10).
import { useState } from "react";
import { Button } from "@digdir/designsystemet-react";
import type { QuestionForm } from "../api/types";
import { translate, type Lang } from "../i18n";
import { QuestionRow, spokenQuestion } from "./math/MathExpr";
import { Link } from "../router";

export function ReturnBanner({ form = "addition", a, b, href, lang }: { form?: QuestionForm; a: number; b: number; href: string; lang: Lang }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  const spoken = spokenQuestion(lang, form, a, b);
  return (
    <section className="mkx-panel-accent mkx-return" aria-label={translate(lang, "detour.bannerRegion")} data-testid="return-banner">
      <Link to={href} className="mkx-return__link mkx-target" data-testid="return-to-question">
        <span aria-label={translate(lang, "detour.backLabel", { spoken })}>
          {translate(lang, "detour.back")}{" "}
          <QuestionRow form={form} a={a} b={b} />
        </span>
      </Link>
      <Button variant="tertiary" data-size="sm" className="mkx-target" onClick={() => setDismissed(true)} data-testid="return-dismiss">
        {translate(lang, "detour.dismiss")}
      </Button>
    </section>
  );
}
