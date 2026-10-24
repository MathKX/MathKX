// The notice before a lesson that shows this question's answer (specs/003 FR-012, contracts/detour.md "The gate").
// Plain information with a choice; the prompt is the question, never its result. Nothing of the lesson is loaded
// while it is shown.
import { useEffect, useId, useRef } from "react";
import { Button, Heading, Paragraph } from "@digdir/designsystemet-react";
import { translate, type Lang } from "../i18n";

export function LessonGate({
  prompt,
  hasHelp,
  lang,
  onOpen,
  onHelp,
  onCancel,
}: {
  prompt: string;
  hasHelp: boolean;
  lang: Lang;
  onOpen(): void;
  onHelp(): void;
  onCancel(): void;
}) {
  const headingId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, []);
  return (
    <section className="mkx-panel-accent mkx-gate" aria-labelledby={headingId} data-testid="lesson-gate">
      <Heading level={2} data-size="sm" id={headingId} ref={headingRef} tabIndex={-1}>
        {translate(lang, "detour.noticeTitle", { prompt })}
      </Heading>
      <Paragraph>{translate(lang, "detour.noticeBody")}</Paragraph>
      <div className="mkx-controls">
        <Button variant="primary" data-size="md" className="mkx-target" onClick={onOpen} data-testid="gate-open">
          {translate(lang, "detour.openAnyway")}
        </Button>
        {hasHelp ? (
          <Button variant="secondary" data-size="md" className="mkx-target" onClick={onHelp} data-testid="gate-help">
            {translate(lang, "detour.helpInstead")}
          </Button>
        ) : null}
        <Button variant="tertiary" data-size="md" className="mkx-target" onClick={onCancel} data-testid="gate-cancel">
          {translate(lang, "detour.cancel")}
        </Button>
      </div>
    </section>
  );
}
