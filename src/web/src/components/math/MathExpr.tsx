// Renders a question's prompt as MathML with a spoken label, by the question form the service names (specs/009
// FR-003): "a + b = ?" for addition, "x + a = b" for an unknown addend, "ax = b" for an unknown factor (specs/010), and
// "ax + c = b" for a two-step equation (specs/011). The numbers come from the service. It can
// take focus from code, so a new question can receive it (specs/005 FR-016), but is not a Tab stop.
import type { Ref } from "react";
import type { QuestionForm } from "../../api/types";
import { translate, type Lang } from "../../i18n";

/** The unknown's symbol: notation, the same in every language, as in the lesson's $x + 3 = 7$. */
export const UNKNOWN = "x";

/** Instances stored before spec 009 carry no form; they are all addition. */
export const formOf = (instance: { form?: QuestionForm }): QuestionForm => instance.form ?? "addition";

const spokenKeys = { addition: "practice.spoken", "unknown-addend": "practice.spokenEquation", "unknown-factor": "practice.spokenTimes", "two-step": "practice.spokenTwoStep" } as const;
const writtenKeys = { addition: "record.question", "unknown-addend": "record.equation", "unknown-factor": "record.equationTimes", "two-step": "record.equationTwoStep" } as const;

/** c is the third number of ax + c = b (specs/011); the other forms have none. */
export const spokenQuestion = (lang: Lang, form: QuestionForm, a: number, b: number, c?: number) => translate(lang, spokenKeys[form], { a, b, c: c ?? "" });

export const writtenQuestion = (lang: Lang, form: QuestionForm, a: number, b: number, c?: number) => translate(lang, writtenKeys[form], { a, b, c: c ?? "" });

/** The prompt's MathML row, without a label: for the prompt itself and for the "Back to your question" link. */
export function QuestionRow({ form, a, b, c }: { form: QuestionForm; a: number; b: number; c?: number | undefined }) {
  return (
    <math display="inline" aria-hidden="true">
      {form === "two-step" ? (
        <mrow>
          <mn>{a}</mn>
          <mi>{UNKNOWN}</mi>
          <mo>+</mo>
          <mn>{c}</mn>
          <mo>=</mo>
          <mn>{b}</mn>
        </mrow>
      ) : form === "unknown-factor" ? (
        <mrow>
          <mn>{a}</mn>
          <mi>{UNKNOWN}</mi>
          <mo>=</mo>
          <mn>{b}</mn>
        </mrow>
      ) : form === "unknown-addend" ? (
        <mrow>
          <mi>{UNKNOWN}</mi>
          <mo>+</mo>
          <mn>{a}</mn>
          <mo>=</mo>
          <mn>{b}</mn>
        </mrow>
      ) : (
        <mrow>
          <mn>{a}</mn>
          <mo>+</mo>
          <mn>{b}</mn>
          <mo>=</mo>
          <mi>?</mi>
        </mrow>
      )}
    </math>
  );
}

export function QuestionPrompt({ form, a, b, c, lang, ref }: { form: QuestionForm; a: number; b: number; c?: number | undefined; lang: Lang; ref?: Ref<HTMLParagraphElement> }) {
  return (
    <p ref={ref} tabIndex={-1} className="mkx-expr" aria-label={spokenQuestion(lang, form, a, b, c)} data-testid="prompt" data-form={form}>
      <QuestionRow form={form} a={a} b={b} c={c} />
    </p>
  );
}

/** An addition prompt: self-check questions are addition only (specs/009 edge cases). */
export function AdditionPrompt(props: { a: number; b: number; lang: Lang; ref?: Ref<HTMLParagraphElement> }) {
  return <QuestionPrompt form="addition" {...props} />;
}
