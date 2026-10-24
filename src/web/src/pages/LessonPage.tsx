// The lesson page (specs/003): title and objective from the lesson metadata, then the translation's Markdown
// rendered by the lesson chunk, with the practice entries where the lesson places them. While the current
// question is unanswered and this lesson practises its definition, the visit is a detour: a lesson that shows the
// question's answer stays behind the notice (and is not even requested) until the learner chooses, the visit is
// recorded once the lesson is shown, and "Back to your question" is offered (contracts/detour.md).
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Heading, Paragraph } from "@digdir/designsystemet-react";
import type { LessonDetail, PracticeApi, SkillDto } from "../api/types";
import { practiceApi } from "../api/client";
import { translate, type Lang } from "../i18n";
import { useRouter } from "../router";
import { useStore } from "../state/store";
import { currentQuestion } from "../state/observations";
import { PracticeEntry } from "../lesson/PracticeEntry";
import { Placeholder } from "../lesson/Placeholder";
import type { LessonComponents } from "../lesson/render";
import { LessonGate } from "../components/LessonGate";
import { ReturnBanner } from "../components/ReturnBanner";

const LessonView = lazy(() => import("../lesson/LessonView"));

/** A visit to this lesson, decided once when the page has what it needs (contracts/detour.md "Terms"). */
interface Visit {
  deliveryId: string | null;
  detour: boolean;
  discloses: boolean;
  fromQuestion: boolean;
  gateOpen: boolean;
  question: { a: number; b: number; prompt: string; hasHelp: boolean } | null;
}

export function LessonPage({ id, api = practiceApi }: { id: string; api?: PracticeApi }) {
  const store = useStore();
  const { state } = store;
  const { path, search, navigate, replace } = useRouter();
  const lang = state.language;
  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [skills, setSkills] = useState<Record<string, SkillDto>>({});
  const [failed, setFailed] = useState(false);
  const [contents, setContents] = useState<Partial<Record<Lang, string>>>({});
  const [contentFailed, setContentFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [visit, setVisit] = useState<Visit | null>(null);
  const [lessonsCheck, setLessonsCheck] = useState<"none" | "pending" | "done" | "failed">("none");
  const [fromQuestion] = useState(() => new URLSearchParams(search).get("from") === "question");
  const recorded = useRef(false);

  // The origin is read once; dropping it means a reload or a later history visit is not a visit from the question.
  useEffect(() => {
    if (new URLSearchParams(search).has("from")) replace(path);
  }, [path, search, replace]);

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

  // Decide the visit once, from the store as it is now.
  useEffect(() => {
    if (!lesson || visit) return;
    const question = currentQuestion(state.deliveries, state.currentDeliveryId);
    const listed = Boolean(question && lesson.practice.some((p) => p.definition === question.instance.definitionId && p.version === question.instance.version));
    if (listed && !state.instance?.lessons && lessonsCheck !== "done" && lessonsCheck !== "failed") {
      if (lessonsCheck === "none") {
        setLessonsCheck("pending");
        void store.ensureInstanceLessons().then((ok) => setLessonsCheck(ok ? "done" : "failed"));
      }
      return;
    }
    const entry = state.instance?.lessons?.find((l) => l.id === lesson.id);
    // Without a decision from the service, keep the gate closed: an unrecorded reveal is worse than one more click.
    const discloses = listed && (entry ? entry.discloses : lessonsCheck === "failed");
    const instance = state.instance;
    setVisit({
      deliveryId: state.currentDeliveryId,
      detour: listed,
      discloses,
      fromQuestion,
      gateOpen: !discloses,
      question: listed && instance ? { a: instance.a, b: instance.b, prompt: instance.prompt, hasHelp: instance.representations.help.length > 0 } : null,
    });
  }, [lesson, visit, state, lessonsCheck, fromQuestion, store]);

  const gateOpen = visit?.gateOpen ?? false;
  const cached = contents[lang];
  useEffect(() => {
    if (!gateOpen || cached !== undefined) return;
    let cancelled = false;
    setContentFailed(false);
    api
      .getLessonContent(id, lang)
      .then((content) => {
        if (!cancelled) setContents((prev) => ({ ...prev, [lang]: content.markdown }));
      })
      .catch(() => {
        if (!cancelled) setContentFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [api, id, lang, cached, attempt, gateOpen]);

  // While the selected language loads, keep showing the other one, so the section can be restored after.
  const shown: { lang: Lang; markdown: string } | null = useMemo(() => {
    if (cached !== undefined) return { lang, markdown: cached };
    const other = (Object.entries(contents) as [Lang, string][])[0];
    return other ? { lang: other[0], markdown: other[1] } : null;
  }, [contents, lang, cached]);

  const onShown = useCallback(() => {
    if (!visit || recorded.current) return;
    recorded.current = true;
    store.lessonShown({ deliveryId: visit.deliveryId, detour: visit.detour, discloses: visit.discloses, fromQuestion: visit.fromQuestion });
  }, [visit, store]);

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
  if (!lesson || !visit) return <Paragraph>{translate(lang, "lesson.loading")}</Paragraph>;

  const practiceHref = `/practice/${encodeURIComponent(state.skillId ?? "")}`;
  const loading = <Paragraph>{translate(lang, "lesson.loading")}</Paragraph>;
  return (
    <article className="mkx-prose mkx-lesson" data-testid="lesson-page">
      {visit.detour && visit.question && state.skillId ? <ReturnBanner a={visit.question.a} b={visit.question.b} skillId={state.skillId} lang={lang} /> : null}
      <Heading level={1} data-size="lg">
        {lesson.titles[lang]}
      </Heading>
      <Paragraph data-size="lg">{lesson.objectives[lang]}</Paragraph>
      {!visit.gateOpen && visit.question ? (
        <LessonGate
          prompt={visit.question.prompt}
          hasHelp={visit.question.hasHelp}
          lang={lang}
          onOpen={() => setVisit({ ...visit, gateOpen: true })}
          onHelp={() => {
            store.showHelpInstead();
            navigate(practiceHref);
          }}
          onCancel={() => navigate(practiceHref)}
        />
      ) : contentFailed && !shown ? (
        <div role="alert" className="mkx-placeholder" data-testid="lesson-content-failed">
          <Paragraph>{translate(lang, "lesson.contentFailed")}</Paragraph>
          <Button variant="secondary" data-size="md" className="mkx-target" onClick={() => setAttempt((n) => n + 1)}>
            {translate(lang, "lesson.retry")}
          </Button>
        </div>
      ) : shown ? (
        <Suspense fallback={loading}>
          <LessonView lessonId={lesson.id} lang={shown.lang} markdown={shown.markdown} components={components} onShown={onShown} />
        </Suspense>
      ) : (
        loading
      )}
    </article>
  );
}
