// The lesson page (specs/003): title and objective from the lesson metadata, then the translation's Markdown
// rendered by the lesson chunk, with the practice entries where the lesson places them. While the current
// question is unanswered and this lesson practises its definition, the visit is a detour: a lesson that shows the
// question's answer stays behind the notice (and is not even requested) until the learner chooses, the visit is
// recorded once the lesson is shown, and "Back to your question" is offered (contracts/detour.md). A visit whose
// address names a check question (`checkQuestion`) is about that supported check question instead, while it is on
// screen in its run, with the same rules and the way back to that run (specs/006 research R10).
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Heading, Paragraph } from "@digdir/designsystemet-react";
import type { InstanceDto, LessonDetail, PracticeApi, SkillDto } from "../api/types";
import { practiceApi } from "../api/client";
import { translate, type Lang } from "../i18n";
import type { QuestionForm } from "../api/types";
import { formOf } from "../components/math/MathExpr";
import { useRouter } from "../router";
import { useStore } from "../state/store";
import { currentQuestion, hasCorrect, identityOf } from "../state/observations";
import { checkDetourOf } from "../state/checks";
import { PracticeEntry } from "../lesson/PracticeEntry";
import { CheckEntry } from "../components/CheckEntry";
import { Placeholder } from "../lesson/Placeholder";
import { editUrl, issueUrl } from "../lesson/contribute";
import type { LessonComponents } from "../lesson/render";
import { LessonGate } from "../components/LessonGate";
import { ReturnBanner } from "../components/ReturnBanner";
import { BalanceExplorer } from "../components/math/BalanceExplorer";
import { SharingExplorer } from "../components/math/SharingExplorer";
import { StepVisual } from "../components/math/StepVisual";
import { TenFrameExplorer } from "../components/math/TenFrameExplorer";

const LessonView = lazy(() => import("../lesson/LessonView"));

/** The query naming the supported check question a lesson visit is about (specs/006 research R10). */
export const CHECK_QUESTION = "checkQuestion";

/** A visit to this lesson, decided once when the page has what it needs (contracts/detour.md "Terms"). */
interface Visit {
  deliveryId: string | null;
  detour: boolean;
  discloses: boolean;
  fromQuestion: boolean;
  gateOpen: boolean;
  question: { form: QuestionForm; a: number; b: number; prompt: string; hasHelp: boolean } | null;
  /** Where "Back to your question" and the notice's other choices lead; null without a question to return to. */
  back: string | null;
  /** The check run of a supported check question, for "Show visual help instead"; null for practice. */
  checkRunId: string | null;
}

/** A supported check question resolved again for the notice: its lessons, prompt, and help; "failed" keeps the gate shut. */
type CheckQuestion = { kind: "loading" } | { kind: "done"; instance: InstanceDto } | { kind: "failed" };

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
  const [from] = useState(() => new URLSearchParams(search).get("from"));
  const fromQuestion = from === "question";
  // `checkQuestion`: the supported check question this visit is about, found once; none makes it spec 003's visit.
  // It stays in the address, so a reload or a history visit is about the same question while it is on screen.
  const [checkQuestionId] = useState(() => new URLSearchParams(search).get(CHECK_QUESTION));
  const [checkDetour] = useState(() => (checkQuestionId ? checkDetourOf(state.checkRuns, checkQuestionId) : null));
  const [checkQuestion, setCheckQuestion] = useState<CheckQuestion>({ kind: "loading" });
  const recorded = useRef(false);

  useEffect(() => {
    if (!checkDetour) return;
    let live = true;
    const { definitionId, version, seed } = identityOf(checkDetour.delivery);
    const { a, b } = checkDetour.delivery.instance;
    // Only the recorded question: an identity that now resolves to other operands keeps the gate shut.
    api.getInstance(definitionId, version, seed ?? null).then(
      (instance) => live && setCheckQuestion(instance.a === a && instance.b === b ? { kind: "done", instance } : { kind: "failed" }),
      () => live && setCheckQuestion({ kind: "failed" }),
    );
    return () => {
      live = false;
    };
  }, [api, checkDetour]);

  // The origin is read once; dropping it means a reload or a later history visit is not a visit from the question.
  // The check question it names stays: the notice must survive a reload as practice's does (PR 53 review).
  useEffect(() => {
    if (!new URLSearchParams(search).has("from")) return;
    const kept = checkQuestionId ? `?${CHECK_QUESTION}=${encodeURIComponent(checkQuestionId)}` : "";
    // Keep a section fragment (#why) when dropping the query, so a direct section link still lands there.
    replace(`${path}${kept}${window.location.hash}`);
  }, [path, search, replace, checkQuestionId]);

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
    if (checkDetour) {
      const { run, delivery } = checkDetour;
      const { definitionId, version, a, b } = delivery.instance;
      const listed = lesson.practice.some((p) => p.definition === definitionId && p.version === version);
      const detour = listed && !hasCorrect(delivery) && !delivery.events.some((e) => e.type === "skipped");
      if (detour && checkQuestion.kind === "loading") return;
      const instance = checkQuestion.kind === "done" ? checkQuestion.instance : null;
      const entry = instance?.lessons?.find((l) => l.id === lesson.id);
      // As for practice: without a decision from the service, the gate stays shut.
      const discloses = detour && (entry ? entry.discloses : !instance?.lessons);
      setVisit({
        deliveryId: delivery.id,
        detour,
        discloses,
        fromQuestion: from === "check", // the link itself; a reload or a history visit is not
        gateOpen: !discloses,
        question: detour ? { form: "addition" as const, a, b, prompt: instance?.prompt ?? translate(lang, "record.question", { a, b }), hasHelp: (instance?.representations.help.length ?? 0) > 0 } : null,
        back: `/checks/${encodeURIComponent(run.checkId)}/${encodeURIComponent(run.id)}`,
        checkRunId: run.id,
      });
      return;
    }
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
      question: listed && instance ? { form: formOf(instance), a: instance.a, b: instance.b, prompt: instance.prompt, hasHelp: instance.representations.help.length > 0 } : null,
      back: state.skillId ? `/practice/${encodeURIComponent(state.skillId)}` : null,
      checkRunId: null,
    });
  }, [lesson, visit, state, lessonsCheck, fromQuestion, store, checkDetour, checkQuestion, lang]);

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

  // The language on screen when the content first renders is the language of the view (specs/004).
  const shownLanguage = useRef<Lang>(lang);
  shownLanguage.current = shown?.lang ?? lang;
  const onShown = useCallback(() => {
    if (!visit || recorded.current) return;
    recorded.current = true; // once per visit: the lesson event and the lesson view alike
    store.lessonShown({ deliveryId: visit.deliveryId, detour: visit.detour, discloses: visit.discloses, fromQuestion: visit.fromQuestion });
    store.lessonViewed(id, shownLanguage.current);
  }, [visit, store, id]);

  const practiceEntry = useCallback(
    (attributes: Record<string, string>, key: string) => {
      const entry = lesson?.practice.find((p) => p.definition === attributes.definition && String(p.version) === attributes.version);
      if (!entry) return <Placeholder key={key} lang={lang} />;
      const ladder = skills[entry.skill]?.ladder.find((l) => l.definition === entry.definition && l.version === entry.version);
      return <PracticeEntry key={key} lessonId={id} definition={entry.definition} version={entry.version} skill={entry.skill} description={ladder?.description[lang] ?? entry.definition} lang={lang} />;
    },
    [lesson, skills, lang],
  );
  // Visuals load their models only here, inside the rendered lesson, so nothing is requested behind the notice.
  const visual = useCallback(
    (attributes: Record<string, string>, key: string) => {
      const n = (name: string) => Number.parseInt(attributes[name] ?? "", 10);
      switch (attributes.type) {
        case "ten-frame-explorer":
          return <TenFrameExplorer key={key} start={Number.isNaN(n("start")) ? 0 : n("start")} lang={lang} api={api} />;
        case "balance-explorer":
          return Number.isNaN(n("a")) || Number.isNaN(n("b")) ? <Placeholder key={key} lang={lang} /> : <BalanceExplorer key={key} a={n("a")} b={n("b")} lang={lang} api={api} />;
        case "balance-sharing-explorer":
          return Number.isNaN(n("a")) || Number.isNaN(n("b")) ? <Placeholder key={key} lang={lang} /> : <SharingExplorer key={key} a={n("a")} b={n("b")} lang={lang} api={api} />;
        case "make-ten":
        case "groups":
          return Number.isNaN(n("a")) || Number.isNaN(n("b")) ? <Placeholder key={key} lang={lang} /> : <StepVisual key={key} type={attributes.type} a={n("a")} b={n("b")} lang={lang} api={api} />;
        default:
          return <Placeholder key={key} lang={lang} />;
      }
    },
    [api, lang],
  );
  const components: LessonComponents = useMemo(() => ({ visual, practice: practiceEntry }), [visual, practiceEntry]);

  if (failed) return <Paragraph>{translate(lang, "lesson.notFound")}</Paragraph>;
  if (!lesson || !visit) return <Paragraph>{translate(lang, "lesson.loading")}</Paragraph>;

  const practiceHref = `/practice/${encodeURIComponent(state.skillId ?? "")}`;
  const loading = <Paragraph>{translate(lang, "lesson.loading")}</Paragraph>;
  return (
    <article className="mkx-prose mkx-lesson" data-testid="lesson-page">
      {visit.detour && visit.question && visit.back ? <ReturnBanner form={visit.question.form} a={visit.question.a} b={visit.question.b} href={visit.back} lang={lang} /> : null}
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
            if (visit.checkRunId) store.showCheckHelpInstead(visit.checkRunId);
            else store.showHelpInstead();
            navigate(visit.back ?? practiceHref);
          }}
          onCancel={() => navigate(visit.back ?? practiceHref)}
        />
      ) : contentFailed && cached === undefined ? (
        // The selected language failed: say so, even when another language is cached, rather than keep showing it.
        <div role="alert" className="mkx-placeholder" data-testid="lesson-content-failed">
          <Paragraph>{translate(lang, "lesson.contentFailed")}</Paragraph>
          <Button variant="secondary" data-size="md" className="mkx-target" onClick={() => setAttempt((n) => n + 1)}>
            {translate(lang, "lesson.retry")}
          </Button>
        </div>
      ) : shown ? (
        <Suspense fallback={loading}>
          {/* The contribution links render inside the lesson, after it: never before the lesson is shown (the source on
              GitHub would otherwise get round the notice), and always for the translation on screen. */}
          <LessonView
            lessonId={lesson.id}
            lang={shown.lang}
            markdown={shown.markdown}
            components={components}
            onShown={onShown}
            footer={(displayed, section) => (
              <footer className="mkx-lesson-footer" data-testid="lesson-contribute">
                <a href={editUrl(lesson.id, lesson.translations[displayed])} target="_blank" rel="noopener noreferrer">
                  {translate(lang, "lesson.edit")}
                </a>
                <a
                  href={issueUrl(
                    translate(lang, "lesson.issueTitle", { id: lesson.id }),
                    translate(lang, "lesson.issueBody", { id: lesson.id, version: lesson.version, lang: displayed, section: section ?? translate(lang, "lesson.issueTop") }),
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {translate(lang, "lesson.suggest")}
                </a>
              </footer>
            )}
          />
        </Suspense>
      ) : (
        loading
      )}
      <CheckEntry skills={lesson.skills} lang={lang} api={api} />
    </article>
  );
}
