// A check's summary (specs/006 contracts/summary.md "The summary"): the independent part in three groups, each
// question with the learner's answer, the correct answer, and its explanation; then, after a switch, the supported
// part, each question with its practice outcome and never the tag "Worth revisiting"; then, for a run ended by a new
// check, the questions not answered. It is derived from the recorded run, so later content changes never change it,
// and it records nothing: answers and explanations are fetched here, never through the store. No score, fraction,
// percentage, streak, time, or mastery word.
import { useEffect, useRef, useState } from "react";
import { Button, Heading, Paragraph } from "@digdir/designsystemet-react";
import type { Identity, InstanceDto, PracticeApi, StepDto } from "../api/types";
import { StepPanel } from "../components/StepPanel";
import { formatDate, translate, translateCode, type Lang } from "../i18n";
import { Link, hasNavigatedInApp } from "../router";
import { summarizeRun, type CheckQuestionRef, type CheckRun } from "../state/checks";
import { identityOf, type Delivery } from "../state/observations";
import { derive } from "../state/outcomes";

type Group = "correct" | "revisit" | "skipped";
const GROUPS: { group: Group; key: string }[] = [
  { group: "correct", key: "check.groupCorrect" },
  { group: "revisit", key: "check.groupRevisit" },
  { group: "skipped", key: "check.groupSkipped" },
];

/** A fetched value: still loading, the confirmed value, or unavailable (failed, or for other operands). */
type Fetched<T> = { kind: "loading" } | { kind: "matched"; value: T } | { kind: "unavailable" };

/**
 * The explanation of one question: offered only when its identity still resolves to the operands it is shown with,
 * the recorded ones for a reached question, or its answer response's for an unreached one (research R11).
 */
function Explanation({ identity, a, b, lang, api }: { identity: Identity; a: number; b: number; lang: Lang; api: PracticeApi }) {
  const [instance, setInstance] = useState<Fetched<InstanceDto>>({ kind: "loading" });
  const [open, setOpen] = useState(false);
  const [steps, setSteps] = useState<StepDto[]>([]);
  const [failed, setFailed] = useState(false);
  const { definitionId, version, seed } = identity;

  useEffect(() => {
    let live = true;
    api.getInstance(definitionId, version, seed ?? null).then(
      (resolved) => live && setInstance(resolved.a === a && resolved.b === b ? { kind: "matched", value: resolved } : { kind: "unavailable" }),
      () => live && setInstance({ kind: "unavailable" }),
    );
    return () => {
      live = false;
    };
  }, [api, definitionId, version, seed, a, b]);

  const fetchStep = async (resolved: InstanceDto, index: number) => {
    try {
      const step = await api.getStep(resolved.identity, "explanation", index);
      setSteps((shown) => [...shown.slice(0, index), step]);
    } catch {
      setFailed(true);
    }
  };

  if (instance.kind === "loading") return null;
  if (instance.kind === "unavailable" || failed) {
    return <Paragraph data-testid="check-explanation-unavailable">{translate(lang, "check.explanationUnavailable")}</Paragraph>;
  }
  const resolved = instance.value;
  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && steps.length === 0) void fetchStep(resolved, 0);
  };
  return (
    <div className="mkx-explanation">
      <Button type="button" variant="tertiary" data-size="md" className="mkx-target" aria-expanded={open} onClick={toggle} data-testid="check-explanation-toggle">
        {translate(lang, open ? "practice.hideExplanation" : "practice.showExplanation")}
      </Button>
      {open ? <StepPanel kind="explanation" instance={resolved} steps={steps} currentIndex={steps.length - 1} lang={lang} onNext={() => void fetchStep(resolved, steps.length)} /> : null}
    </div>
  );
}

/**
 * The correct answer of a reached question: a correct submission's value, or else the service's answer, shown only
 * when it names the recorded operands. While it loads nothing is shown; a missing answer never reads as a wrong one.
 */
function CorrectAnswer({ delivery, lang, api }: { delivery: Delivery; lang: Lang; api: PracticeApi }) {
  const correct = delivery.events.find((e) => e.type === "submission" && e.status === "correct");
  const known = correct?.type === "submission" ? correct.value : null;
  const [answer, setAnswer] = useState<Fetched<number>>(known === null ? { kind: "loading" } : { kind: "matched", value: known });
  const { a, b } = delivery.instance;

  useEffect(() => {
    if (known !== null) return;
    let live = true;
    api.getAnswer(identityOf(delivery)).then(
      (response) => live && setAnswer(response.a === a && response.b === b ? { kind: "matched", value: response.answer.value } : { kind: "unavailable" }),
      () => live && setAnswer({ kind: "unavailable" }),
    );
    return () => {
      live = false;
    };
  }, [api, delivery, known, a, b]);

  if (answer.kind === "loading") return null;
  if (answer.kind === "unavailable") return <Paragraph data-testid="check-answer-unavailable">{translate(lang, "check.answerUnavailable")}</Paragraph>;
  return <Paragraph data-testid="check-correct-answer">{translate(lang, "check.correctAnswer", { a: answer.value })}</Paragraph>;
}

/** The learner's answers: every submission in order (a supported question can have several), the skip, or none. */
function yourAnswer(delivery: Delivery, lang: Lang): string {
  const answers = delivery.events.flatMap((e) => (e.type === "submission" ? [e.originalText.trim()] : []));
  if (answers.length > 0) return translate(lang, "check.yourAnswer", { a: answers.join(", ") });
  return translate(lang, delivery.events.some((e) => e.type === "skipped") ? "check.skippedAnswer" : "check.noAnswer");
}

function SummaryQuestion({ delivery, position, group, lang, api }: { delivery: Delivery; position: number; group: Group | "supported" | "notAnswered"; lang: Lang; api: PracticeApi }) {
  const { a, b } = delivery.instance;
  return (
    <li className="mkx-check-question" data-testid="check-question" data-position={position}>
      <Paragraph>
        <strong data-testid="check-expression">{translate(lang, "record.question", { a, b })}</strong>
        {group === "revisit" ? (
          <>
            {" "}
            <span className="mkx-tag" data-testid="check-revisit-tag">
              {translate(lang, "check.groupRevisit")}
            </span>
          </>
        ) : null}
      </Paragraph>
      {/* A supported question is practice: spec 002's outcome, derived from its events. */}
      {group === "supported" ? <Paragraph data-testid="check-outcome">{translateCode(lang, "outcome", derive(delivery).outcome)}</Paragraph> : null}
      <Paragraph data-testid="check-your-answer">{yourAnswer(delivery, lang)}</Paragraph>
      <CorrectAnswer delivery={delivery} lang={lang} api={api} />
      <Explanation identity={identityOf(delivery)} a={a} b={b} lang={lang} api={api} />
    </li>
  );
}

/**
 * A question the run never reached: it has an identity and no recorded operands, so its expression and answer both
 * come from one answer response, which names the operands it answers. If that fails, the question is still listed,
 * by its position only. While it loads nothing is shown.
 */
function UnreachedQuestion({ question, position, lang, api }: { question: CheckQuestionRef; position: number; lang: Lang; api: PracticeApi }) {
  const [answer, setAnswer] = useState<Fetched<{ a: number; b: number; value: number }>>({ kind: "loading" });
  const { definitionId, version, seed } = question;

  useEffect(() => {
    let live = true;
    const identity: Identity = { definitionId, version };
    if (seed !== undefined) identity.seed = seed;
    api.getAnswer(identity).then(
      (response) => live && setAnswer({ kind: "matched", value: { a: response.a, b: response.b, value: response.answer.value } }),
      () => live && setAnswer({ kind: "unavailable" }),
    );
    return () => {
      live = false;
    };
  }, [api, definitionId, version, seed]);

  if (answer.kind === "loading") return <li className="mkx-check-question" data-testid="check-question" data-position={position} />;
  if (answer.kind === "unavailable") {
    return (
      <li className="mkx-check-question" data-testid="check-question" data-position={position}>
        <Paragraph data-testid="check-unreached-unavailable">{translate(lang, "check.unreachedUnavailable", { n: position })}</Paragraph>
      </li>
    );
  }
  const { a, b, value } = answer.value;
  return (
    <li className="mkx-check-question" data-testid="check-question" data-position={position}>
      <Paragraph>
        <strong data-testid="check-expression">{translate(lang, "record.question", { a, b })}</strong>
      </Paragraph>
      <Paragraph data-testid="check-your-answer">{translate(lang, "check.noAnswer")}</Paragraph>
      <Paragraph data-testid="check-correct-answer">{translate(lang, "check.correctAnswer", { a: value })}</Paragraph>
      <Explanation identity={question} a={a} b={b} lang={lang} api={api} />
    </li>
  );
}

export interface CheckSummaryProps {
  run: CheckRun;
  lang: Lang;
  api: PracticeApi;
  /** The run ended by an action on this page: the heading takes focus, as it does after an in-app navigation. */
  takeFocus: boolean;
}

export function CheckSummary({ run, lang, api, takeFocus }: CheckSummaryProps) {
  const summary = summarizeRun(run);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [title, setTitle] = useState<{ nb: string; en: string } | null>(null);

  useEffect(() => {
    if (takeFocus || hasNavigatedInApp()) headingRef.current?.focus();
    // On arrival only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let live = true;
    api.getCheck(run.checkId, run.checkVersion).then(
      (check) => live && setTitle(check.title),
      () => undefined, // omitted when it cannot be loaded
    );
    return () => {
      live = false;
    };
  }, [api, run.checkId, run.checkVersion]);

  return (
    <section className="mkx-prose" data-testid="check-summary">
      <Heading level={1} data-size="lg" ref={headingRef} tabIndex={-1} className="mkx-page-heading" data-testid="check-summary-heading">
        {translate(lang, "check.summaryTitle")}
      </Heading>
      {title ? <Paragraph data-testid="check-title">{title[lang]}</Paragraph> : null}
      <Paragraph data-testid="check-date">{formatDate(lang, run.startedAt)}</Paragraph>
      <Paragraph data-testid="check-snapshot">{translate(lang, "check.policySnapshot")}</Paragraph>

      <section aria-labelledby={`${run.id}-independent`}>
        <Heading level={2} data-size="md" id={`${run.id}-independent`}>
          {translate(lang, "check.independentTitle")}
        </Heading>
        {run.switchAt === 1 ? <Paragraph data-testid="check-no-independent">{translate(lang, "check.noIndependent")}</Paragraph> : null}
        {run.switchAt === 1 ? null : GROUPS.map(({ group, key }) => {
          const positions = summary[group];
          const id = `${run.id}-${group}`;
          return (
            <section key={group} aria-labelledby={id} data-testid={`check-group-${group}`}>
              <Heading level={3} data-size="sm" id={id}>
                {translate(lang, key)}
              </Heading>
              <Paragraph data-testid="check-group-count">{translate(lang, positions.length === 1 ? "check.groupCountOne" : "check.groupCount", { n: positions.length })}</Paragraph>
              {positions.length === 0 ? (
                <Paragraph>{translate(lang, "check.groupNone")}</Paragraph>
              ) : (
                <ol className="mkx-check-questions">
                  {positions.map((position) => {
                    const delivery = run.deliveries[position - 1];
                    return delivery ? <SummaryQuestion key={position} delivery={delivery} position={position} group={group} lang={lang} api={api} /> : null;
                  })}
                </ol>
              )}
            </section>
          );
        })}
      </section>

      {run.switchAt !== null ? (
        <section aria-labelledby={`${run.id}-supported`} data-testid="check-supported">
          <Heading level={2} data-size="md" id={`${run.id}-supported`}>
            {translate(lang, "check.supportedTitle", { i: run.switchAt })}
          </Heading>
          <Paragraph data-testid="check-supported-note">{translate(lang, "check.supportedNote")}</Paragraph>
          {summary.supported.length > 0 ? (
            <ol className="mkx-check-questions">
              {summary.supported.map((position) => {
                const delivery = run.deliveries[position - 1];
                return delivery ? <SummaryQuestion key={position} delivery={delivery} position={position} group="supported" lang={lang} api={api} /> : null;
              })}
            </ol>
          ) : (
            <Paragraph>{translate(lang, "check.groupNone")}</Paragraph>
          )}
        </section>
      ) : null}

      {summary.notAnswered.length > 0 ? (
        <section aria-labelledby={`${run.id}-not-answered`} data-testid="check-not-answered">
          <Heading level={2} data-size="md" id={`${run.id}-not-answered`}>
            {translate(lang, "check.notAnsweredTitle")}
          </Heading>
          <Paragraph data-testid="check-not-answered-note">{translate(lang, "check.notAnsweredNote")}</Paragraph>
          <ol className="mkx-check-questions">
            {summary.notAnswered.map((position) => {
              const delivery = run.deliveries[position - 1];
              const question = run.questions[position - 1]!;
              return delivery ? (
                <SummaryQuestion key={position} delivery={delivery} position={position} group="notAnswered" lang={lang} api={api} />
              ) : (
                <UnreachedQuestion key={position} question={question} position={position} lang={lang} api={api} />
              );
            })}
          </ol>
        </section>
      ) : null}

      <Paragraph data-testid="check-summary-note">{translate(lang, "check.summaryNote")}</Paragraph>
      <Paragraph>
        <Link to={`/practice/${encodeURIComponent(run.skillId)}`} className="mkx-inline-target" data-testid="check-practise-more">
          {translate(lang, "check.practiseMore")}
        </Link>{" "}
        <span data-testid="check-practise-more-note">{translate(lang, "check.practiseMoreNote")}</span>
      </Paragraph>
      <Paragraph>
        <Link to={`/checks/${encodeURIComponent(run.checkId)}`} className="mkx-inline-target" data-testid="check-again">
          {translate(lang, "check.again")}
        </Link>
      </Paragraph>
      <Paragraph>
        <Link to="/record" className="mkx-inline-target" data-testid="check-to-record">
          {translate(lang, "check.toRecord")}
        </Link>
      </Paragraph>
    </section>
  );
}
