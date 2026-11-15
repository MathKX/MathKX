// A check's summary (specs/006 contracts/summary.md "The summary"): the independent part in three groups, each
// question with the learner's answer, the correct answer, and its explanation. It is derived from the recorded run,
// so later content changes never change it, and it records nothing: explanations are fetched here, never through
// the store. No score, fraction, percentage, streak, time, or mastery word.
import { useEffect, useRef, useState } from "react";
import { Button, Heading, Paragraph } from "@digdir/designsystemet-react";
import type { InstanceDto, PracticeApi, StepDto } from "../api/types";
import { StepPanel } from "../components/StepPanel";
import { formatDate, translate, type Lang } from "../i18n";
import { Link, hasNavigatedInApp } from "../router";
import { summarizeRun, type CheckRun } from "../state/checks";
import { identityOf, type Delivery } from "../state/observations";

type Group = "correct" | "revisit" | "skipped";
const GROUPS: { group: Group; key: string }[] = [
  { group: "correct", key: "check.groupCorrect" },
  { group: "revisit", key: "check.groupRevisit" },
  { group: "skipped", key: "check.groupSkipped" },
];

/** A fetched value: still loading, the confirmed value, or unavailable (failed, or for other operands). */
type Fetched<T> = { kind: "loading" } | { kind: "matched"; value: T } | { kind: "unavailable" };

/** The explanation of one reached question: offered only when its identity still resolves to the recorded operands. */
function Explanation({ delivery, lang, api }: { delivery: Delivery; lang: Lang; api: PracticeApi }) {
  const [instance, setInstance] = useState<Fetched<InstanceDto>>({ kind: "loading" });
  const [open, setOpen] = useState(false);
  const [steps, setSteps] = useState<StepDto[]>([]);
  const [failed, setFailed] = useState(false);
  const { a, b } = delivery.instance;

  useEffect(() => {
    let live = true;
    const identity = identityOf(delivery);
    api.getInstance(identity.definitionId, identity.version, identity.seed ?? null).then(
      (resolved) => live && setInstance(resolved.a === a && resolved.b === b ? { kind: "matched", value: resolved } : { kind: "unavailable" }),
      () => live && setInstance({ kind: "unavailable" }),
    );
    return () => {
      live = false;
    };
  }, [api, delivery, a, b]);

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

function SummaryQuestion({ delivery, position, group, lang, api }: { delivery: Delivery; position: number; group: Group; lang: Lang; api: PracticeApi }) {
  const submission = delivery.events.find((e) => e.type === "submission");
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
      <Paragraph data-testid="check-your-answer">
        {submission?.type === "submission" ? translate(lang, "check.yourAnswer", { a: submission.originalText.trim() }) : translate(lang, "check.skippedAnswer")}
      </Paragraph>
      <CorrectAnswer delivery={delivery} lang={lang} api={api} />
      <Explanation delivery={delivery} lang={lang} api={api} />
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
        {GROUPS.map(({ group, key }) => {
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
