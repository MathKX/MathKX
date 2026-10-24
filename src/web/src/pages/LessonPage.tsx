// The lesson page (specs/003): title and objective from the lesson metadata, then the translation's Markdown
// rendered by the lesson chunk, with the practice entries where the lesson places them.
import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { Button, Heading, Paragraph } from "@digdir/designsystemet-react";
import type { LessonDetail, PracticeApi, SkillDto } from "../api/types";
import { practiceApi } from "../api/client";
import { translate, type Lang } from "../i18n";
import { useStore } from "../state/store";
import { PracticeEntry } from "../lesson/PracticeEntry";
import { Placeholder } from "../lesson/Placeholder";
import type { LessonComponents } from "../lesson/render";

const LessonView = lazy(() => import("../lesson/LessonView"));

export function LessonPage({ id, api = practiceApi }: { id: string; api?: PracticeApi }) {
  const { state } = useStore();
  const lang = state.language;
  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [skills, setSkills] = useState<Record<string, SkillDto>>({});
  const [failed, setFailed] = useState(false);
  const [contents, setContents] = useState<{ id: string; byLang: Partial<Record<Lang, string>> }>({ id, byLang: {} });
  const [contentFailed, setContentFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

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

  // Each language's content is requested once per visit and kept, so switching back is immediate.
  const cached = contents.id === id ? contents.byLang[lang] : undefined;
  useEffect(() => {
    if (cached !== undefined) return;
    let cancelled = false;
    setContentFailed(false);
    api
      .getLessonContent(id, lang)
      .then((content) => {
        if (!cancelled) setContents((prev) => ({ id, byLang: { ...(prev.id === id ? prev.byLang : {}), [lang]: content.markdown } }));
      })
      .catch(() => {
        if (!cancelled) setContentFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [api, id, lang, cached, attempt]);

  // While the selected language loads, keep showing the other one, so the section can be restored after.
  const shown: { lang: Lang; markdown: string } | null = useMemo(() => {
    if (contents.id !== id) return null;
    if (cached !== undefined) return { lang, markdown: cached };
    const other = (Object.entries(contents.byLang) as [Lang, string][])[0];
    return other ? { lang: other[0], markdown: other[1] } : null;
  }, [contents, id, lang, cached]);

  const practiceEntry = useCallback(
    (attributes: Record<string, string>, key: string) => {
      const entry = lesson?.practice.find((p) => p.definition === attributes.definition && String(p.version) === attributes.version);
      if (!entry) return <Placeholder key={key} lang={lang} />;
      const ladder = skills[entry.skill]?.ladder.find((l) => l.definition === entry.definition && l.version === entry.version);
      return <PracticeEntry key={key} definition={entry.definition} version={entry.version} skill={entry.skill} description={ladder?.description[lang] ?? entry.definition} lang={lang} />;
    },
    [lesson, skills, lang],
  );
  const components: LessonComponents = useMemo(
    () => ({
      visual: (_attributes, key) => <Placeholder key={key} lang={lang} />,
      practice: practiceEntry,
    }),
    [practiceEntry, lang],
  );

  if (failed) return <Paragraph>{translate(lang, "lesson.notFound")}</Paragraph>;
  if (!lesson) return <Paragraph>{translate(lang, "lesson.loading")}</Paragraph>;

  const loading = <Paragraph>{translate(lang, "lesson.loading")}</Paragraph>;
  return (
    <article className="mkx-prose mkx-lesson" data-testid="lesson-page">
      <Heading level={1} data-size="lg">
        {lesson.titles[lang]}
      </Heading>
      <Paragraph data-size="lg">{lesson.objectives[lang]}</Paragraph>
      {contentFailed && !shown ? (
        <div role="alert" className="mkx-placeholder">
          <Paragraph>{translate(lang, "lesson.contentFailed")}</Paragraph>
          <Button variant="secondary" data-size="md" className="mkx-target" onClick={() => setAttempt((n) => n + 1)}>
            {translate(lang, "lesson.retry")}
          </Button>
        </div>
      ) : shown ? (
        <Suspense fallback={loading}>
          <LessonView lessonId={lesson.id} lang={shown.lang} markdown={shown.markdown} components={components} />
        </Suspense>
      ) : (
        loading
      )}
    </article>
  );
}
