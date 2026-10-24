// The session record: deliveries with outcome labels and tags, counts, the storage notice, and clearing.
import { useState } from "react";
import { Button, Heading, Paragraph } from "@digdir/designsystemet-react";
import { translate, translateCode } from "../i18n";
import { derive, summarize, type Outcome } from "../state/outcomes";
import { useStore } from "../state/store";

export function RecordPage() {
  const store = useStore();
  const { state } = store;
  const lang = state.language;
  const [confirming, setConfirming] = useState(false);
  const resumableId = state.resumable?.deliveryId ?? state.currentDeliveryId;
  const summary = summarize(state.deliveries, resumableId);
  const details = (Object.entries(summary.counts) as [Exclude<Outcome, "none">, number][])
    .map(([outcome, count]) => `${count} ${translateCode(lang, "outcome", outcome).toLocaleLowerCase(lang)}`)
    .join(", ");

  return (
    <section className="mkx-prose" data-testid="record-page">
      <Heading level={1} data-size="lg">
        {translate(lang, "record.title")}
      </Heading>
      <Paragraph data-size="sm" data-testid="storage-note">
        {translate(lang, state.kept ? "storage.kept" : "storage.notKept")}
      </Paragraph>
      {summary.questions === 0 ? (
        <Paragraph data-testid="record-empty">{translate(lang, "record.empty")}</Paragraph>
      ) : (
        <Paragraph data-testid="record-summary">{translate(lang, "record.summary", { questions: summary.questions, details })}</Paragraph>
      )}
      <ol className="mkx-record">
        {state.deliveries.map((d) => {
          const derived = derive(d, { resumable: d.id === resumableId });
          if (derived.outcome === "none") return null;
          return (
            <li key={d.id} data-testid="record-item" data-outcome={derived.outcome}>
              <span className="mkx-record__question">{translate(lang, "record.question", { a: d.instance.a, b: d.instance.b })}</span>{" "}
              <strong>{translateCode(lang, "outcome", derived.outcome)}</strong>
              {derived.tags.length > 0 ? (
                <ul className="mkx-tags">
                  {derived.tags.map((tag) => (
                    <li key={tag} className="mkx-tag" data-testid="record-tag">
                      {translateCode(lang, "tag", tag)}
                    </li>
                  ))}
                </ul>
              ) : null}
              {derived.submissions.length > 0 ? (
                <span className="mkx-record__answers">{translate(lang, "record.answers", { answers: derived.submissions.map((s) => s.value).join(", ") })}</span>
              ) : null}
            </li>
          );
        })}
      </ol>
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
