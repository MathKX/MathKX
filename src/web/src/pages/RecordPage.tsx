// "My work" as the progress view (specs/004 contracts/progress-view.md): the guest record grouped by skill, with
// spec 002's counts and wording, repeats marked, each skill's questions newest first, and the lessons viewed for
// the skill; the storage notice and clearing stay as in spec 002.
import { useEffect, useState } from "react";
import { Button, Details, Heading, Paragraph } from "@digdir/designsystemet-react";
import { practiceApi } from "../api/client";
import type { LessonSummary, PracticeApi, SkillDto } from "../api/types";
import { PageHeading } from "../components/PageHeading";
import { formatDate, translate, translateCode } from "../i18n";
import { Link } from "../router";
import { groupBySkill, inProgress, skillOrder } from "../state/progress";
import { useStore } from "../state/store";
import { summarySentence } from "./summarySentence";

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
  const groups = skillOrder(groupBySkill(state.deliveries, known, resumableId, state.lessonViews, knownLessons));
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
      {groups.length === 0 && state.lessonViews.length === 0 ? (
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
                              question: translate(lang, "record.question", { a: q.delivery.instance.a, b: q.delivery.instance.b }),
                              date: formatDate(lang, q.delivery.startedAt),
                            })}
                          >
                            {translate(lang, "record.question", { a: q.delivery.instance.a, b: q.delivery.instance.b })}
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
