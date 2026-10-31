// The summary of the last finished practice session (specs/005 contracts/session.md): the snapshot "Finish practice"
// took, grouped by skill with spec 002's count sentence and the repeat sentences. It reads only the snapshot, so a
// later answer to a resumed question changes "My work" and the next summary, never this one.
import { useEffect, useState } from "react";
import { Heading, Paragraph } from "@digdir/designsystemet-react";
import { practiceApi } from "../api/client";
import type { PracticeApi, SkillDto } from "../api/types";
import { PageHeading } from "../components/PageHeading";
import { translate } from "../i18n";
import { Link } from "../router";
import { tally } from "../state/outcomes";
import { skillOfDefinition } from "../state/progress";
import { useStore, type PracticeSession } from "../state/store";
import { summarySentence } from "./summarySentence";

type Snapshot = NonNullable<PracticeSession["last"]>["questions"];

export function SessionPage({ api = practiceApi }: { api?: PracticeApi }) {
  const { state } = useStore();
  const lang = state.language;
  const [skills, setSkills] = useState<SkillDto[] | "failed" | null>(null);

  useEffect(() => {
    let live = true;
    api.getSkills().then(
      (list) => live && setSkills(list),
      () => live && setSkills("failed"),
    );
    return () => {
      live = false;
    };
  }, [api]);

  const last = state.session.last;
  const known = Array.isArray(skills) ? skills : [];
  const skillOf = skillOfDefinition(known);
  // Skills in the order the session first practised them; definitions no skill lists are "Other practice".
  const groups = new Map<string | null, Snapshot>();
  for (const q of last?.questions ?? []) {
    const d = state.deliveries.find((x) => x.id === q.id);
    const skillId = d ? (skillOf.get(`${d.instance.definitionId}@${d.instance.version}`) ?? null) : null;
    groups.set(skillId, [...(groups.get(skillId) ?? []), q]);
  }
  const nameOf = (skillId: string | null) => known.find((s) => s.id === skillId)?.name[lang] ?? translate(lang, "progress.other");

  return (
    <section className="mkx-prose" data-testid="session-page">
      <PageHeading>{translate(lang, "session.title")}</PageHeading>
      {last === null ? (
        <Paragraph data-testid="session-none">{translate(lang, "session.none")}</Paragraph>
      ) : last.questions.length === 0 ? (
        <Paragraph data-testid="session-empty">{translate(lang, "session.empty")}</Paragraph>
      ) : skills === null ? null : (
        <>
          {skills === "failed" ? <Paragraph data-testid="progress-unavailable">{translate(lang, "progress.contentUnavailable")}</Paragraph> : null}
          {[...groups].map(([skillId, questions]) => {
            const repeated = questions.filter((q) => q.repeat).length;
            const requested = questions.filter((q) => q.repeat === "requested").length;
            const id = `session-skill-${skillId ?? "other"}`;
            return (
              <section key={skillId ?? "other"} className="mkx-skill" aria-labelledby={id}>
                <Heading level={2} data-size="sm" id={id} data-testid="session-skill">
                  {nameOf(skillId)}
                </Heading>
                <Paragraph data-testid="session-summary">{summarySentence(lang, tally(questions.map((q) => q.outcome)))}</Paragraph>
                {repeated > 0 ? <Paragraph data-testid="session-repeats">{translate(lang, "progress.repeats", { n: repeated })}</Paragraph> : null}
                {requested > 0 ? <Paragraph data-testid="session-repeats-requested">{translate(lang, "progress.repeatsRequested", { n: requested })}</Paragraph> : null}
              </section>
            );
          })}
        </>
      )}
      <Paragraph>
        <Link to={state.skillId ? `/practice/${encodeURIComponent(state.skillId)}` : "/"} className="mkx-inline-target" data-testid="session-again">
          {translate(lang, "session.again")}
        </Link>
      </Paragraph>
      <Paragraph>
        <Link to="/record" className="mkx-inline-target" data-testid="session-record">
          {translate(lang, "nav.record")}
        </Link>
      </Paragraph>
    </section>
  );
}
