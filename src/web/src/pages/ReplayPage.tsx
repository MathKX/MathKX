// A read-only replay of one recorded question (specs/004 contracts/replay.md). It re-resolves the stored identity
// with the one instance request practice makes, shows the recorded work, and records nothing. The only sum it can
// show is one the learner answered correctly; it never computes one. "Repeat this question" hands the identity to
// practice (specs/005 contracts/repeat.md), which records the new question; the page itself dispatches nothing.
import { useEffect, useRef, useState } from "react";
import { Button, Paragraph } from "@digdir/designsystemet-react";
import { practiceApi } from "../api/client";
import type { PracticeApi } from "../api/types";
import { AdditionPrompt } from "../components/math/MathExpr";
import { PageHeading } from "../components/PageHeading";
import { formatDate, translate, translateCode } from "../i18n";
import { Link, useRouter } from "../router";
import { derive } from "../state/outcomes";
import { inProgress, repeatKind, repeats, revealsWithoutCorrect } from "../state/progress";
import { useStore } from "../state/store";

type Shown = "loading" | "matched" | "unavailable";

export function ReplayPage({ deliveryId, api = practiceApi }: { deliveryId: string; api?: PracticeApi }) {
  const store = useStore();
  const { state } = store;
  const { navigate } = useRouter();
  const lang = state.language;
  const [repeating, setRepeating] = useState<"idle" | "busy" | "failed">("idle");
  // A repeat still on its way when the learner leaves the replay is abandoned: nothing recorded, no navigation.
  const pendingRepeat = useRef<AbortController | null>(null);
  useEffect(() => () => pendingRepeat.current?.abort(), []);
  const delivery = state.deliveries.find((d) => d.id === deliveryId);
  const [shown, setShown] = useState<Shown>("loading");
  const identity = delivery?.instance;
  const found = delivery !== undefined;

  // One request, for this question only; a resolved question with other operands is never shown as this one.
  useEffect(() => {
    if (!identity) return;
    let live = true;
    api.getInstance(identity.definitionId, identity.version, identity.seed ?? null).then(
      (instance) => live && setShown(instance.a === identity.a && instance.b === identity.b ? "matched" : "unavailable"),
      () => live && setShown("unavailable"),
    );
    return () => {
      live = false;
    };
    // A recorded delivery's identity never changes, so the request depends only on which question is shown.
  }, [api, deliveryId, found]);

  const back = (
    <Link to="/record" className="mkx-inline-target" data-testid="replay-back">
      {translate(lang, "replay.back")}
    </Link>
  );

  if (!delivery) {
    return (
      <section className="mkx-prose" data-testid="replay-page">
        <PageHeading data-testid="replay-not-found">{translate(lang, "replay.notFound")}</PageHeading>
        <Paragraph>{back}</Paragraph>
      </section>
    );
  }

  const { a, b } = delivery.instance;
  const resumableId = state.resumable?.deliveryId ?? state.currentDeliveryId;
  const derived = derive(delivery, { resumable: delivery.id === resumableId });
  const tags = [...derived.tags, ...revealsWithoutCorrect(delivery)];
  const repeat = repeatKind(delivery, repeats(state.deliveries));
  const onRepeat = async () => {
    const pending = new AbortController();
    pendingRepeat.current = pending;
    setRepeating("busy");
    const skillId = await store.repeatQuestion(delivery.id, pending.signal);
    if (pending.signal.aborted) return;
    if (skillId) navigate(`/practice/${skillId}`);
    else setRepeating("failed");
  };
  const answers = delivery.events.flatMap((e) => (e.type === "submission" || e.type === "input-guidance" ? [e] : []));

  return (
    <section className="mkx-prose" data-testid="replay-page">
      <PageHeading>{translate(lang, "replay.title", { date: formatDate(lang, delivery.startedAt) })}</PageHeading>
      {shown === "unavailable" ? <Paragraph data-testid="replay-unavailable">{translate(lang, "replay.unavailable")}</Paragraph> : null}
      {/* Matched or unavailable, the operands on screen are the recorded ones; the expression waits for the answer. */}
      {shown === "loading" ? null : <AdditionPrompt a={a} b={b} lang={lang} />}
      <Paragraph>
        <strong data-testid="replay-outcome">{translateCode(lang, "outcome", derived.outcome)}</strong>
      </Paragraph>
      {tags.length > 0 || repeat ? (
        <ul className="mkx-tags">
          {tags.map((tag) => (
            <li key={tag} className="mkx-tag" data-testid="record-tag">
              {translateCode(lang, "tag", tag)}
            </li>
          ))}
          {repeat ? (
            <li className="mkx-tag" data-testid="record-tag">
              {translate(lang, repeat === "requested" ? "progress.repeatRequestedTag" : "progress.repeatTag")}
            </li>
          ) : null}
        </ul>
      ) : null}
      {answers.length === 0 ? (
        <Paragraph data-testid="replay-no-answers">{translate(lang, "replay.noAnswers")}</Paragraph>
      ) : (
        <ol className="mkx-record" aria-label={translate(lang, "replay.answersLabel")}>
          {answers.map((e) => {
            const status = e.type === "submission" ? e.status : "invalid-response";
            const feedback =
              e.type === "submission"
                ? translateCode(lang, "feedback", e.code, { a, b, v: e.value, sum: e.value }) // sum is used only by "correct"
                : translateCode(lang, "feedback", e.code, { text: e.originalText });
            return (
              <li key={e.submissionId} data-testid="replay-submission" data-status={status}>
                <span className="mkx-record__question">{e.originalText}</span> <strong>{translateCode(lang, "status", status)}</strong>
                <span className="mkx-record__meta">{feedback}</span>
              </li>
            );
          })}
        </ol>
      )}
      {inProgress(delivery, resumableId) ? (
        <Paragraph>
          <Link to={`/practice/${state.skillId ?? ""}`} className="mkx-inline-target" data-testid="replay-continue">
            {translate(lang, "progress.continue")}
          </Link>
        </Paragraph>
      ) : (
        <>
          <Button type="button" variant="secondary" data-size="md" className="mkx-target" disabled={repeating === "busy"} onClick={() => void onRepeat()} data-testid="replay-repeat">
            {translate(lang, "practice.repeat")}
          </Button>
          {repeating === "failed" ? (
            <Paragraph role="alert" data-testid="replay-repeat-failed">
              {translate(lang, "practice.loadError")}
            </Paragraph>
          ) : null}
        </>
      )}
      <Paragraph>{back}</Paragraph>
    </section>
  );
}
