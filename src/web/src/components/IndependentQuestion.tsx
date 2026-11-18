// A check question in the independent part (specs/006 contracts/check-run.md "Independent part"): the prompt, its
// position, the answer field, "Save answer", "Skip", and "I need help". It renders no help, explanation, lesson link,
// result, or practice control, and imports none of them: their absence is by construction (research R8).
// "I need help" opens the switch's inline confirmation (contracts/check-run.md "The switch").
import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Button, Heading, Paragraph, Textfield } from "@digdir/designsystemet-react";
import { translate, translateCode, type Lang } from "../i18n";
import type { CheckScreen } from "../state/store";
import { AdditionPrompt } from "./math/MathExpr";

export interface IndependentQuestionProps {
  lang: Lang;
  a: number;
  b: number;
  position: number;
  total: number;
  draft: string;
  checking: boolean;
  notice: CheckScreen["notice"];
  /** The question appeared after an action or an in-app navigation: the prompt takes focus. */
  takeFocus: boolean;
  onDraft(draft: string): void;
  onSave(): void;
  onSkip(): void;
  /** "Switch to supported practice", confirmed. */
  onSwitch(): void;
}

/** The switch's confirmation: inline, focused on its heading; "Continue without help" and Escape record nothing. */
function SwitchConfirmation({ lang, position, onYes, onNo }: { lang: Lang; position: number; onYes(): void; onNo(): void }) {
  const headingId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, []);
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    onNo();
  };
  return (
    <section role="dialog" aria-labelledby={headingId} className="mkx-panel-accent mkx-gate" onKeyDown={onKeyDown} data-testid="check-switch">
      <Heading level={2} data-size="sm" id={headingId} ref={headingRef} tabIndex={-1}>
        {translate(lang, "check.switchTitle")}
      </Heading>
      <Paragraph data-testid="check-switch-body">{translate(lang, "check.switchBody", { i: position })}</Paragraph>
      <div className="mkx-controls">
        <Button type="button" variant="primary" data-size="md" className="mkx-target" onClick={onYes} data-testid="check-switch-yes">
          {translate(lang, "check.switchYes")}
        </Button>
        <Button type="button" variant="secondary" data-size="md" className="mkx-target" onClick={onNo} data-testid="check-switch-no">
          {translate(lang, "check.switchNo")}
        </Button>
      </div>
    </section>
  );
}

export function IndependentQuestion(props: IndependentQuestionProps) {
  const { lang, notice } = props;
  const fieldId = useId();
  const promptRef = useRef<HTMLParagraphElement>(null);
  const needHelpRef = useRef<HTMLButtonElement>(null);
  const [confirming, setConfirming] = useState(false);
  const closeConfirmation = () => {
    setConfirming(false);
    needHelpRef.current?.focus();
  };
  useEffect(() => {
    if (props.takeFocus) promptRef.current?.focus();
    // Mounted once per question (the page keys it by position).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    props.onSave();
  };

  return (
    <div className="mkx-exercise" data-testid="independent-question">
      <Paragraph data-testid="check-mode">{translate(lang, "check.modeIndependent")}</Paragraph>
      <Paragraph data-testid="check-position">{translate(lang, "check.position", { n: props.position, total: props.total })}</Paragraph>
      <AdditionPrompt ref={promptRef} a={props.a} b={props.b} lang={lang} />

      <form onSubmit={onSubmit} className="mkx-answer-form" noValidate>
        <Textfield
          id={fieldId}
          label={translate(lang, "practice.answerLabel")}
          value={props.draft}
          onChange={(e) => props.onDraft(e.currentTarget.value)}
          inputMode="numeric"
          autoComplete="off"
          data-size="lg"
          data-testid="answer"
        />
        <div className="mkx-controls">
          <Button type="submit" variant="primary" data-size="md" className="mkx-target" disabled={props.checking} data-testid="check-save">
            {translate(lang, props.checking ? "check.saving" : "check.save")}
          </Button>
          <Button type="button" variant="secondary" data-size="md" className="mkx-target" disabled={props.checking} onClick={() => props.onSkip()} data-testid="check-skip">
            {translate(lang, "check.skip")}
          </Button>
          <Button
            type="button"
            variant="tertiary"
            data-size="md"
            className="mkx-target"
            ref={needHelpRef}
            aria-expanded={confirming}
            onClick={() => setConfirming(true)}
            data-testid="check-need-help"
          >
            {translate(lang, "check.needHelp")}
          </Button>
        </div>
      </form>

      {confirming ? <SwitchConfirmation lang={lang} position={props.position} onYes={() => props.onSwitch()} onNo={closeConfirmation} /> : null}

      {/* Input guidance says only that the input could not be read, never whether an answer would be right. */}
      {notice?.kind === "guidance" ? (
        <Paragraph role="status" data-testid="check-guidance">
          {translateCode(lang, "feedback", notice.code, { text: notice.text })}
        </Paragraph>
      ) : null}
      {notice?.kind === "unsaved" ? (
        <Paragraph role="alert" data-testid="check-unsaved">
          {translate(lang, "check.unsaved")}
        </Paragraph>
      ) : null}
    </div>
  );
}
