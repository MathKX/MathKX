// The ladder sentence for the current definition and the pending-change notice (anatomy item 1).
import { Paragraph } from "@digdir/designsystemet-react";
import { translate } from "../i18n";
import { useStore } from "../state/store";

export function LadderNotice() {
  const { state } = useStore();
  const lang = state.language;
  const current = state.ladder.entries.find((e) => e.definition === state.ladder.current?.definition && e.version === state.ladder.current?.version);
  const pending = state.ladder.pending
    ? state.ladder.entries.find((e) => e.definition === state.ladder.pending?.definition && e.version === state.ladder.pending?.version)
    : undefined;
  return (
    <div className="mkx-ladder" data-testid="ladder">
      {current ? (
        <Paragraph data-size="sm" data-testid="ladder-current">
          {translate(lang, "ladder.current", { description: current.description[lang] })}
        </Paragraph>
      ) : null}
      {pending ? (
        <Paragraph data-size="sm" role="status" data-testid="ladder-pending">
          {translate(lang, "ladder.pending", { description: pending.description[lang] })}
        </Paragraph>
      ) : null}
    </div>
  );
}
