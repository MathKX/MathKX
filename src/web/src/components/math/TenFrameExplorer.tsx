// The lesson's ten-frame explorer (specs/003 FR-007): choose a number from 0 to 10 and see it with its partner to
// ten. The pairs come from the service; the app computes nothing. A native radio group gives arrow-key movement,
// Home and End jump to the ends, and the settled pair is announced once.
import { useEffect, useId, useState, type KeyboardEvent } from "react";
import { Button, Paragraph } from "@digdir/designsystemet-react";
import type { PracticeApi, TenFrameExplorerDto } from "../../api/types";
import { translate, type Lang } from "../../i18n";
import { TenFrame, type Cell } from "./TenFrame";

export function TenFrameExplorer({ start, lang, api }: { start: number; lang: Lang; api: PracticeApi }) {
  const [model, setModel] = useState<TenFrameExplorerDto | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [value, setValue] = useState(start);
  const [announced, setAnnounced] = useState("");
  const name = useId();

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    api
      .getTenFrameExplorer()
      .then((m) => !cancelled && setModel(m))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [api, attempt]);

  const state = model?.states.find((s) => s.filled === value);
  const sentence = state ? translate(lang, "lesson.explorerPair", { filled: state.filled, partner: state.partner }) : "";

  // Announce the pair once the choice has settled, not every value passed on the way.
  useEffect(() => {
    if (!sentence) return;
    const timer = setTimeout(() => setAnnounced(sentence), 250);
    return () => clearTimeout(timer);
  }, [sentence]);

  if (failed) {
    return (
      <div className="mkx-placeholder" role="alert" data-testid="visual-failed">
        <Paragraph>{translate(lang, "lesson.visualFailed")}</Paragraph>
        <Button variant="secondary" data-size="sm" className="mkx-target" onClick={() => setAttempt((n) => n + 1)}>
          {translate(lang, "lesson.retry")}
        </Button>
      </div>
    );
  }
  if (!model || !state) return <Paragraph>{translate(lang, "lesson.loading")}</Paragraph>;

  const last = model.states.length - 1;
  const onKeyDown = (event: KeyboardEvent<HTMLFieldSetElement>) => {
    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      const next = event.key === "Home" ? 0 : last;
      setValue(next);
      document.getElementById(`${name}-${next}`)?.focus();
    }
  };
  const cells: Cell[] = Array.from({ length: 10 }, (_, i) => (i < state.filled ? "a" : "empty"));
  return (
    <figure className="mkx-explorer" data-testid="ten-frame-explorer">
      <TenFrame cells={cells} lang={lang} label={sentence} />
      <fieldset className="mkx-explorer__choices" onKeyDown={onKeyDown}>
        <legend>{translate(lang, "lesson.explorerLabel")}</legend>
        {model.states.map((s) => (
          <label key={s.filled} className="mkx-explorer__choice mkx-target">
            <input
              type="radio"
              id={`${name}-${s.filled}`}
              name={name}
              value={s.filled}
              checked={s.filled === value}
              onChange={() => setValue(s.filled)}
              data-testid={`explorer-${s.filled}`}
            />
            <span>{s.filled}</span>
          </label>
        ))}
      </fieldset>
      <figcaption>
        <Paragraph data-testid="explorer-sentence" aria-hidden="true">
          {sentence}
        </Paragraph>
      </figcaption>
      <p className="mkx-visually-hidden" aria-live="polite" data-testid="explorer-live">
        {announced}
      </p>
    </figure>
  );
}
