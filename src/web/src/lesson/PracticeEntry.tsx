// A `:::practice` entry where the lesson places it (specs/003 FR-016): the definition's ladder description in the
// selected language; choosing it starts practice with spec 002's explicit-choice behaviour, recording this lesson
// as the one that started the practice run (the practice screen links back to it).
import { Button } from "@digdir/designsystemet-react";
import { translate, type Lang } from "../i18n";
import { useRouter } from "../router";
import { useStore } from "../state/store";

export function PracticeEntry({ lessonId, definition, version, skill, description, lang }: { lessonId: string; definition: string; version: number; skill: string; description: string; lang: Lang }) {
  const { startPractice } = useStore();
  const { navigate } = useRouter();
  return (
    <p className="mkx-practice-entry">
      <Button
        variant="primary"
        data-size="md"
        className="mkx-target"
        data-testid={`practice-${definition}`}
        onClick={() => {
          void startPractice(skill, { definition, version }, lessonId).then(() => navigate(`/practice/${encodeURIComponent(skill)}`));
        }}
      >
        {translate(lang, "lesson.practise", { description })}
      </Button>
    </p>
  );
}
