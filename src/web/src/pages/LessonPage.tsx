// The lesson page in this feature: title and objective from the front matter for the active language and
// the practice entries from lesson.json. The Markdown body arrives with spec 003.
import { useEffect, useState } from "react";
import { Button, Heading, Paragraph } from "@digdir/designsystemet-react";
import type { LessonDetail, PracticeApi, SkillDto } from "../api/types";
import { practiceApi } from "../api/client";
import { translate } from "../i18n";
import { useRouter } from "../router";
import { useStore } from "../state/store";

export function LessonPage({ id, api = practiceApi }: { id: string; api?: PracticeApi }) {
  const { state, startPractice } = useStore();
  const { navigate } = useRouter();
  const lang = state.language;
  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [skills, setSkills] = useState<Record<string, SkillDto>>({});
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    api
      .getLesson(id)
      .then(async (detail) => {
        if (cancelled) return;
        setLesson(detail);
        const ids = [...new Set(detail.practice.map((p) => p.skill).filter(Boolean))];
        const loaded = await Promise.all(ids.map((s) => api.getSkill(s)));
        if (!cancelled) setSkills(Object.fromEntries(loaded.map((s) => [s.id, s])));
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [api, id]);

  if (failed) return <Paragraph>{translate(lang, "lesson.notFound")}</Paragraph>;
  if (!lesson) return <Paragraph>{translate(lang, "lesson.loading")}</Paragraph>;

  return (
    <article className="mkx-prose" data-testid="lesson-page">
      <Heading level={1} data-size="lg">
        {lesson.titles[lang]}
      </Heading>
      <Paragraph data-size="lg">{lesson.objectives[lang]}</Paragraph>
      <Paragraph data-size="sm">{translate(lang, "lesson.bodyLater")}</Paragraph>
      <Heading level={2} data-size="md">
        {translate(lang, "lesson.practiceHeading")}
      </Heading>
      <ul className="mkx-practice-entries">
        {lesson.practice.map((entry) => {
          const ladder = skills[entry.skill]?.ladder.find((l) => l.definition === entry.definition && l.version === entry.version);
          const description = ladder?.description[lang] ?? entry.definition;
          return (
            <li key={`${entry.definition}@${entry.version}`}>
              <Button
                variant="primary"
                data-size="md"
                className="mkx-target"
                data-testid={`practice-${entry.definition}`}
                onClick={() => {
                  void startPractice(entry.skill, { definition: entry.definition, version: entry.version }).then(() => navigate(`/practice/${encodeURIComponent(entry.skill)}`));
                }}
              >
                {translate(lang, "lesson.practise", { description })}
              </Button>
            </li>
          );
        })}
      </ul>
    </article>
  );
}
