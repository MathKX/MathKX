// "Check my understanding" (specs/006 contracts/check-run.md "Entry"): one link per check of the given skills, to the
// check's start screen. It loads the check list once; when the list cannot be loaded, nothing is shown.
import { useEffect, useState } from "react";
import { Paragraph } from "@digdir/designsystemet-react";
import { practiceApi } from "../api/client";
import type { CheckDto, PracticeApi } from "../api/types";
import { translate, type Lang } from "../i18n";
import { Link } from "../router";

export function CheckEntry({ skills, lang, api = practiceApi }: { skills: readonly string[]; lang: Lang; api?: PracticeApi }) {
  const [checks, setChecks] = useState<CheckDto[]>([]);
  useEffect(() => {
    let live = true;
    api.getChecks().then(
      (list) => live && setChecks(list),
      () => live && setChecks([]),
    );
    return () => {
      live = false;
    };
  }, [api]);

  const shown = checks.filter((c) => skills.includes(c.skill));
  if (shown.length === 0) return null;
  // With several checks for a skill, each link also names its check.
  const named = (skill: string) => shown.filter((c) => c.skill === skill).length > 1;
  return (
    <div className="mkx-check-entries">
      {shown.map((c) => (
        <Paragraph key={c.id}>
          <Link to={`/checks/${encodeURIComponent(c.id)}`} className="mkx-inline-target" data-testid={`check-entry-${c.id}`}>
            {named(c.skill) ? `${translate(lang, "check.entry")}: ${c.title[lang]}` : translate(lang, "check.entry")}
          </Link>
        </Paragraph>
      ))}
    </div>
  );
}
