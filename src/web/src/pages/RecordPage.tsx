// "My work" as the progress view (specs/004 contracts/progress-view.md): the guest record grouped by skill, with
// spec 002's counts and wording, repeats marked, each skill's questions newest first, the lessons viewed for the
// skill, and its self-checks apart from practice (specs/006 contracts/summary.md "Checks in 'My work'"); the storage
// notice and clearing stay as in spec 002.
import { useEffect, useState } from "react";
import { Button, Details, Heading, Paragraph } from "@digdir/designsystemet-react";
import { practiceApi } from "../api/client";
import type { LessonSummary, PracticeApi, SkillDto } from "../api/types";
import { CheckEntry } from "../components/CheckEntry";
import { PageHeading } from "../components/PageHeading";
import { formatDate, translate, translateCode, type Lang } from "../i18n";
import { formOf, writtenQuestion } from "../components/math/MathExpr";
import { Link } from "../router";
import { isUnfinished, summarizeRun, type CheckRun } from "../state/checks";
import { groupBySkill, inProgress, skillOrder } from "../state/progress";
import { useStore } from "../state/store";
import { summarySentence } from "./summarySentence";

/** A run that is over: its groups' counts, then the supported part and the questions not answered, when it has them. */
function runCounts(lang: Lang, run: CheckRun): string {
  const summary = summarizeRun(run);
  const parts = [translate(lang, "check.recordCounts", { correct: summary.correct.length, revisit: summary.revisit.length, skipped: summary.skipped.length })];
  if (run.switchAt !== null) parts.push(translate(lang, "check.recordSupported", { n: summary.supported.length, i: run.switchAt }));
  if (summary.notAnswered.length > 0) parts.push(translate(lang, "check.recordNotAnswered", { n: summary.notAnswered.length }));
  return parts.join(", ");
}

/**
 * One run in "My work". A run that is over links to its summary and states its counts. An unfinished one states only
 * where it stands, with "Continue the check": counts would state correctness before the summary.
 */
function RunLine({ run, lang }: { run: CheckRun; lang: Lang }) {
  const to = `/checks/${encodeURIComponent(run.checkId)}/${encodeURIComponent(run.id)}`;
  const date = formatDate(lang, run.startedAt);
  if (isUnfinished(run)) {
    return (
      <li data-testid="check-run" data-state="unfinished">
        {date} · <span data-testid="check-run-text">{translate(lang, "check.recordUnfinished", { n: run.position, total: run.questions.length })}</span>{" "}
        <Link to={to} className="mkx-inline-target" data-testid="check-run-continue">
          {translate(lang, "check.continue")}
        </Link>
      </li>
    );
  }
  return (
    <li data-testid="check-run" data-state={run.endedAt === undefined ? "finished" : "ended"}>
      <Link to={to} className="mkx-inline-target" data-testid="check-run-link" aria-label={translate(lang, "check.recordRunLink", { date })}>
        {date}
      </Link>{" "}
      · <span data-testid="check-run-text">{runCounts(lang, run)}</span>
    </li>
  );
}

export function RecordPage({ api = practiceApi }: { api?: PracticeApi }) {
  const store = useStore();
  const { state } = store;
  const lang = state.language;
  const [confirming, setConfirming] = useState(false);
  const [skills, setSkills] = useState<SkillDto[] | "failed" | null>(null);
  const [lessons, setLessons] = useState<LessonSummary[] | "failed" | null>(null);

  useEffect(() => {
    let live = true;
    api.getSkills().then(
      (list) => live && setSkills(list),
      () => live && setSkills("failed"),
    );
    api.getLessons().then(
      (list) => live && setLessons(list),
      () => live && setLessons("failed"),
    );
    return () => {
      live = false;
    };
  }, [api]);

  const resumableId = state.resumable?.deliveryId ?? state.currentDeliveryId;
  const known = Array.isArray(skills) ? skills : [];
  const knownLessons = Array.isArray(lessons) ? lessons : [];
  const groups = skillOrder(groupBySkill(state.deliveries, known, resumableId, state.lessonViews, knownLessons, state.checkRuns));
  const noteAfter = groups.find((g) => g.lessons.length > 0)?.skillId; // the honest note, once, after the first lesson lines
  const titleOf = (lessonId: string) => knownLessons.find((l) => l.id === lessonId)?.titles[lang] ?? lessonId;
  const nameOf = (skillId: string | null) => {
    const skill = known.find((s) => s.id === skillId);
    return skill ? skill.name[lang] : translate(lang, "progress.other");
  };
  const continueTo = `/practice/${state.skillId ?? ""}`;

  return (
    <section className="mkx-prose" data-testid="record-page">
      <PageHeading>{translate(lang, "record.title")}</PageHeading>
      <Paragraph data-size="sm" data-testid="storage-note">
        {translate(lang, state.kept ? "storage.kept" : "storage.notKept")}
      </Paragraph>
      {groups.length === 0 && state.lessonViews.length === 0 && state.checkRuns.length === 0 ? (
        <Paragraph data-testid="record-empty">
          {translate(lang, "record.empty")} <Link to="/lessons" className="mkx-inline-target">{translate(lang, "progress.toLessons")}</Link>
        </Paragraph>
      ) : skills === null || lessons === null ? null : (
        <>
          {skills === "failed" ? <Paragraph data-testid="progress-unavailable">{translate(lang, "progress.contentUnavailable")}</Paragraph> : null}
          {skills !== "failed" && lessons === "failed" && state.lessonViews.length > 0 ? (
            <Paragraph data-testid="history-unavailable">{translate(lang, "progress.historyUnavailable")}</Paragraph>
          ) : null}
          {groups.map((group) => (
            <section key={group.skillId ?? "other"} className="mkx-skill" data-testid="skill-group" data-skill={group.skillId ?? ""} aria-labelledby={`skill-${group.skillId ?? "other"}`}>
              <Heading level={2} data-size="sm" id={`skill-${group.skillId ?? "other"}`} data-testid="skill-name">
                {nameOf(group.skillId)}
              </Heading>
              {group.summary.questions > 0 ? (
                <Paragraph data-testid="record-summary">{summarySentence(lang, group.summary)}</Paragraph>
              ) : (
                <Paragraph data-testid="record-no-practice">{translate(lang, "progress.noPractice")}</Paragraph>
              )}
              {group.repeatCount > 0 ? <Paragraph data-testid="record-repeats">{translate(lang, "progress.repeats", { n: group.repeatCount })}</Paragraph> : null}
              {group.requestedCount > 0 ? (
                <Paragraph data-testid="record-repeats-requested">{translate(lang, "progress.repeatsRequested", { n: group.requestedCount })}</Paragraph>
              ) : null}
              {group.lessons.map((l) => (
                <Paragraph key={l.lessonId} data-testid="lesson-viewed">
                  {translate(lang, l.views === 1 ? "progress.lessonViewedOnce" : "progress.lessonViewed", { title: titleOf(l.lessonId), n: l.views, date: formatDate(lang, l.last) })}
                </Paragraph>
              ))}
              {group.lessons.length > 0 && group.skillId === noteAfter ? (
                <Paragraph data-size="sm" data-testid="lesson-view-note">
                  {translate(lang, "progress.viewNote")}
                </Paragraph>
              ) : null}
              {group.checkRuns.length > 0 ? (
                <section aria-labelledby={`checks-${group.skillId}`} data-testid="check-record">
                  <Heading level={3} data-size="xs" id={`checks-${group.skillId}`}>
                    {translate(lang, "check.recordTitle")}
                  </Heading>
                  <ul className="mkx-record">
                    {group.checkRuns.map((run) => (
                      <RunLine key={run.id} run={run} lang={lang} />
                    ))}
                  </ul>
                </section>
              ) : null}
              {group.skillId !== null ? <CheckEntry skills={[group.skillId]} lang={lang} api={api} /> : null}
              {group.questions.length > 0 ? (
                <Details className="mkx-questions">
                  <Details.Summary className="mkx-target" data-testid="progress-questions">
                    {translate(lang, "progress.showQuestions")}
                  </Details.Summary>
                  <Details.Content>
                    <ol className="mkx-record">
                      {group.questions.map((q) => (
                        <li key={q.delivery.id} data-testid="record-item" data-outcome={q.derived.outcome}>
                          <Link
                            to={`/record/${encodeURIComponent(q.delivery.id)}`}
                            className="mkx-record__question mkx-inline-target"
                            data-testid="record-question"
                            aria-label={translate(lang, "progress.questionLink", {
                              question: writtenQuestion(lang, formOf(q.delivery.instance), q.delivery.instance.a, q.delivery.instance.b),
                              date: formatDate(lang, q.delivery.startedAt),
                            })}
                          >
                            {writtenQuestion(lang, formOf(q.delivery.instance), q.delivery.instance.a, q.delivery.instance.b)}
                          </Link>{" "}
                          <strong>{translateCode(lang, "outcome", q.derived.outcome)}</strong>
                          <span className="mkx-record__meta">
                            {formatDate(lang, q.delivery.startedAt)}
                            {q.derived.submissions.length > 0 ? <> · {translate(lang, "record.answers", { answers: q.derived.submissions.map((s) => s.value).join(", ") })}</> : null}
                          </span>
                          {q.tags.length > 0 || q.repeat ? (
                            <ul className="mkx-tags">
                              {q.tags.map((tag) => (
                                <li key={tag} className="mkx-tag" data-testid="record-tag">
                                  {translateCode(lang, "tag", tag)}
                                </li>
                              ))}
                              {q.repeat ? (
                                <li className="mkx-tag" data-testid="record-tag">
                                  {translate(lang, q.repeat === "requested" ? "progress.repeatRequestedTag" : "progress.repeatTag")}
                                </li>
                              ) : null}
                            </ul>
                          ) : null}
                          {inProgress(q.delivery, resumableId) ? (
                            <>
                              {" "}
                              <Link to={continueTo} className="mkx-inline-target" data-testid="record-continue">
                                {translate(lang, "progress.continue")}
                              </Link>
                            </>
                          ) : null}
                        </li>
                      ))}
                    </ol>
                  </Details.Content>
                </Details>
              ) : null}
            </section>
          ))}
        </>
      )}
      {!confirming ? (
        <Button variant="secondary" data-size="md" className="mkx-target" onClick={() => setConfirming(true)} data-testid="clear">
          {translate(lang, "record.clear")}
        </Button>
      ) : (
        <div role="group" aria-label={translate(lang, "record.confirmClear")}>
          <Paragraph>{translate(lang, "record.confirmClear")}</Paragraph>
          <Button variant="primary" data-color="danger" data-size="md" className="mkx-target" onClick={() => { store.clearRecord(); setConfirming(false); }} data-testid="confirm-clear">
            {translate(lang, "record.confirm")}
          </Button>{" "}
          <Button variant="secondary" data-size="md" className="mkx-target" onClick={() => setConfirming(false)}>
            {translate(lang, "record.cancel")}
          </Button>
        </div>
      )}
    </section>
  );
}
