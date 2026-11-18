// A check's start screen (specs/006 contracts/check-run.md "The start screen"): its title, scope, size, and support
// policy before anything starts. Leaving it records nothing. "Start the check" ends an unfinished run of the skill,
// creates a run, and replaces the address with the run's.
import { useEffect, useRef, useState } from "react";
import { Button, Heading, Paragraph } from "@digdir/designsystemet-react";
import { practiceApi } from "../api/client";
import type { CheckDto, PracticeApi } from "../api/types";
import { PageHeading } from "../components/PageHeading";
import { translate } from "../i18n";
import { Link, useRouter } from "../router";
import { isUnfinished } from "../state/checks";
import { useStore } from "../state/store";

type Loaded = { kind: "loading" } | { kind: "found"; check: CheckDto } | { kind: "unavailable" };

const POLICY = ["check.policyIndependent", "check.policyFeedback", "check.policySwitch", "check.policyAccess", "check.policySnapshot"] as const;

export function CheckStartPage({ checkId, api = practiceApi }: { checkId: string; api?: PracticeApi }) {
  const store = useStore();
  const { state } = store;
  const { replace } = useRouter();
  const lang = state.language;
  const [loaded, setLoaded] = useState<Loaded>({ kind: "loading" });
  const [starting, setStarting] = useState(false);
  // A start still under way when the page is left creates nothing and navigates nowhere (PR 53 review).
  const start = useRef<AbortController | null>(null);
  useEffect(() => () => start.current?.abort(), [checkId]);

  useEffect(() => {
    let live = true;
    api.getChecks().then(
      (list) => {
        if (!live) return;
        const check = list.find((c) => c.id === checkId);
        setLoaded(check ? { kind: "found", check } : { kind: "unavailable" });
      },
      () => live && setLoaded({ kind: "unavailable" }),
    );
    return () => {
      live = false;
    };
  }, [api, checkId]);

  if (loaded.kind === "loading") return <Paragraph>{translate(lang, "lesson.loading")}</Paragraph>;
  if (loaded.kind === "unavailable") {
    return (
      <section className="mkx-prose" data-testid="check-start-page">
        <PageHeading data-testid="check-unavailable">{translate(lang, "check.unavailable")}</PageHeading>
        <Paragraph>
          <Link to="/" className="mkx-inline-target">
            {translate(lang, "progress.toLessons")}
          </Link>
        </Paragraph>
      </section>
    );
  }

  const { check } = loaded;
  const total = check.questions.length;
  const unfinished = [...state.checkRuns].reverse().find((r) => r.skillId === check.skill && isUnfinished(r));
  const onStart = async () => {
    const controller = new AbortController();
    start.current = controller;
    setStarting(true);
    const runId = await store.startCheck(check.id, controller.signal);
    if (controller.signal.aborted) return;
    if (runId) replace(`/checks/${encodeURIComponent(check.id)}/${encodeURIComponent(runId)}`, true);
    else {
      setStarting(false);
      setLoaded({ kind: "unavailable" });
    }
  };

  return (
    <section className="mkx-prose" data-testid="check-start-page">
      <PageHeading>{translate(lang, "check.titlePrefix", { title: check.title[lang] })}</PageHeading>
      <Paragraph data-testid="check-scope">{translate(lang, "check.scope", { scope: check.scope[lang] })}</Paragraph>
      <Paragraph data-testid="check-count">{translate(lang, total === 1 ? "check.countOne" : "check.count", { n: total })}</Paragraph>
      <Heading level={2} data-size="sm">
        {translate(lang, "check.policyTitle")}
      </Heading>
      {POLICY.map((key) => (
        <Paragraph key={key} data-testid="check-policy">
          {translate(lang, key)}
        </Paragraph>
      ))}
      {unfinished ? (
        <Paragraph data-testid="check-unfinished">
          {translate(lang, "check.unfinished", { n: unfinished.position, total: unfinished.questions.length })}{" "}
          <Link to={`/checks/${encodeURIComponent(unfinished.checkId)}/${encodeURIComponent(unfinished.id)}`} className="mkx-inline-target" data-testid="check-continue">
            {translate(lang, "check.continue")}
          </Link>
        </Paragraph>
      ) : null}
      <div className="mkx-controls">
        <Button type="button" variant="primary" data-size="md" className="mkx-target" disabled={starting} onClick={() => void onStart()} data-testid="check-start">
          {translate(lang, "check.start")}
        </Button>
      </div>
    </section>
  );
}
