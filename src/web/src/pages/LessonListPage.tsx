import { useEffect, useState } from "react";
import { Heading, Paragraph } from "@digdir/designsystemet-react";
import type { LessonSummary, PracticeApi } from "../api/types";
import { practiceApi } from "../api/client";
import { translate } from "../i18n";
import { Link } from "../router";
import { useStore } from "../state/store";

export function LessonListPage({ api = practiceApi }: { api?: PracticeApi }) {
  const { state } = useStore();
  const lang = state.language;
  const [lessons, setLessons] = useState<LessonSummary[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    api.getLessons().then((list) => {
      if (!cancelled) setLessons(list);
    }).catch(() => {
      if (!cancelled) setLessons([]);
    });
    return () => {
      cancelled = true;
    };
  }, [api]);
  return (
    <section className="mkx-prose" data-testid="lesson-list">
      <Heading level={1} data-size="lg">
        {translate(lang, "lesson.listTitle")}
      </Heading>
      {lessons === null ? <Paragraph>{translate(lang, "lesson.loading")}</Paragraph> : null}
      <ul>
        {lessons?.map((lesson) => (
          <li key={lesson.id}>
            <Link to={`/lessons/${encodeURIComponent(lesson.id)}`}>{lesson.titles[lang]}</Link>{" "}
            <span className="mkx-status">{translate(lang, `lesson.status.${lesson.status}`)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
