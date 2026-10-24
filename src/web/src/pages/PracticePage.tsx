// The practice route: starts or resumes practice on the skill, shows the ladder sentence and notices, the
// exercise shell, and ends the session on leaving (FR-017).
import { useEffect } from "react";
import { Heading, Paragraph } from "@digdir/designsystemet-react";
import { translate } from "../i18n";
import { useStore } from "../state/store";
import { ExerciseShell } from "../components/ExerciseShell";
import { LadderNotice } from "../components/LadderControls";

export function PracticePage({ skillId }: { skillId: string }) {
  const store = useStore();
  const { state } = store;
  const lang = state.language;

  useEffect(() => {
    void store.startPractice(skillId);
    return () => store.endSession();
    // startPractice is idempotent for the same skill; endSession runs when the route unmounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skillId]);

  return (
    <section data-testid="practice-page">
      <Heading level={1} data-size="lg">
        {translate(lang, "practice.title")}
      </Heading>
      <LadderNotice />
      {state.notice && state.notice.key !== "practice.unreachable" ? (
        <Paragraph role="status" data-testid="notice">
          {translate(lang, state.notice.key, state.notice.params)}
        </Paragraph>
      ) : null}
      {state.loadError ? <Paragraph role="alert">{translate(lang, "practice.loadError")}</Paragraph> : null}
      {state.instance ? <ExerciseShell /> : !state.loadError ? <Paragraph>{translate(lang, "lesson.loading")}</Paragraph> : null}
      <Paragraph data-size="sm" className="mkx-storage-note" data-testid="storage-note">
        {translate(lang, state.kept ? "storage.kept" : "storage.notKept")}
      </Paragraph>
    </section>
  );
}
