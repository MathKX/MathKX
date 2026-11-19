// A check run (specs/006 contracts/check-run.md "The run"): the question at the run's position while it is
// unfinished, and its summary once it is finished or ended. Mounting presents the run; unmounting keeps its `resume`.
// From `switchAt` on, the question is supported practice; before it, independent.
import { useEffect, useRef } from "react";
import { Button, Paragraph } from "@digdir/designsystemet-react";
import { practiceApi } from "../api/client";
import type { PracticeApi } from "../api/types";
import { IndependentQuestion } from "../components/IndependentQuestion";
import { SupportedQuestion } from "../components/SupportedQuestion";
import { PageHeading } from "../components/PageHeading";
import { translate } from "../i18n";
import { Link, hasNavigatedInApp } from "../router";
import { isUnfinished, partOf } from "../state/checks";
import { useStore } from "../state/store";
import { CheckSummary } from "./CheckSummary";

export function CheckRunPage({ runId, api = practiceApi }: { checkId: string; runId: string; api?: PracticeApi }) {
  const store = useStore();
  const { state } = store;
  const lang = state.language;
  // Set by the learner's save or skip: the next question, or the summary, takes focus even on a page loaded directly.
  const acted = useRef(false);

  useEffect(() => {
    void store.openRun(runId);
    return () => store.leaveCheck();
    // The page is keyed by run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId]);

  const run = state.checkRuns.find((r) => r.id === runId);
  if (!run) {
    return (
      <section className="mkx-prose" data-testid="check-run-page">
        <PageHeading data-testid="check-run-not-found">{translate(lang, "check.runNotFound")}</PageHeading>
        <Paragraph>
          <Link to="/record" className="mkx-inline-target">
            {translate(lang, "check.toRecord")}
          </Link>
        </Paragraph>
      </section>
    );
  }

  if (!isUnfinished(run)) return <CheckSummary run={run} lang={lang} api={api} takeFocus={acted.current} />;

  const screen = state.check?.runId === run.id ? state.check : null;
  const act = (action: () => Promise<void>) => {
    acted.current = true;
    void action();
  };

  return (
    <section data-testid="check-run-page">
      <PageHeading>{translate(lang, "check.entry")}</PageHeading>
      {screen?.loadError ? (
        <div role="alert">
          <Paragraph data-testid="check-load-error">
            {screen.loadError === "changed" ? translate(lang, "check.unreachedUnavailable", { n: run.position }) : translate(lang, "practice.loadError")}
          </Paragraph>
          <Button type="button" variant="secondary" data-size="md" className="mkx-target" onClick={() => act(() => store.retryCheckQuestion())} data-testid="check-retry">
            {translate(lang, "lesson.retry")}
          </Button>
        </div>
      ) : screen?.instance && partOf(run, run.position) === "supported" ? (
        <SupportedQuestion
          key={run.position}
          lang={lang}
          run={run}
          screen={screen}
          instance={screen.instance}
          takeFocus={acted.current || hasNavigatedInApp()}
          onAct={() => {
            acted.current = true;
          }}
        />
      ) : screen?.instance ? (
        <IndependentQuestion
          key={run.position}
          lang={lang}
          a={screen.instance.a}
          b={screen.instance.b}
          position={run.position}
          total={run.questions.length}
          draft={run.resume?.draft ?? ""}
          checking={screen.checking}
          notice={screen.notice}
          takeFocus={acted.current || hasNavigatedInApp()}
          onDraft={(draft) => store.setCheckDraft(draft)}
          onSave={() => act(() => store.saveCheckAnswer())}
          onSkip={() => act(() => store.skipCheckQuestion())}
          onSwitch={() => {
            acted.current = true; // the supported question takes focus
            store.switchToSupported();
          }}
        />
      ) : (
        <Paragraph>{translate(lang, "lesson.loading")}</Paragraph>
      )}
    </section>
  );
}
