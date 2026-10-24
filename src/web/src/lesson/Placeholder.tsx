// The visible stand-in for anything the 0.1-pilot renderer cannot show (specs/003 contracts/lesson-renderer.md).
// Kept apart from render.tsx so the lesson page can use it without pulling the Markdown stack out of its chunk.
import { translate, type Lang } from "../i18n";

export function Placeholder({ lang, source }: { lang: Lang; source?: string | undefined }) {
  return (
    <p className="mkx-placeholder" role="note" data-testid="lesson-unsupported">
      {translate(lang, "lesson.unsupported")}
      {source ? (
        <>
          {" "}
          <code>{source}</code>
        </>
      ) : null}
    </p>
  );
}
