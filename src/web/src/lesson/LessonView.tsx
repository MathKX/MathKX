// The lesson body, loaded as its own chunk (React.lazy in pages/LessonPage.tsx) so the practice route does not
// pay for the Markdown stack. Parses the translation, renders it, keeps the section in view across a language
// switch, and reports the first commit of rendered content ("shown", specs/003 contracts/detour.md).
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { Lang } from "../i18n";
import { parseLesson } from "./parse";
import { LessonBody, type LessonComponents } from "./render";
import { restoreSection, useSectionInView } from "./sections";

export interface LessonViewProps {
  lessonId: string;
  lang: Lang;
  markdown: string;
  components: LessonComponents;
  /** Called once, after the lesson content has been committed for the first time in this view. */
  onShown?: (() => void) | undefined;
  /** The anchor of the section in view, as it changes (for "Suggest an improvement"). */
  onSection?: ((anchor: string | null) => void) | undefined;
}

export default function LessonView({ lessonId, lang, markdown, components, onShown, onSection }: LessonViewProps) {
  const tree = useMemo(() => parseLesson(markdown), [markdown]);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [section] = useSectionInView(container, tree);
  const shown = useRef(false);
  const previous = useRef<{ lang: Lang; section: string | null } | null>(null);

  useEffect(() => {
    if (shown.current) return;
    shown.current = true;
    onShown?.();
  }, [onShown]);

  // A direct link to a section (/lessons/x#why): the browser's own fragment navigation ran before the lesson
  // arrived, so scroll to it once the headings exist. Only a fragment that names an element in this lesson.
  useLayoutEffect(() => {
    const hash = window.location.hash;
    if (hash.length <= 1) return;
    let anchor: string;
    try {
      anchor = decodeURIComponent(hash.slice(1));
    } catch {
      return;
    }
    if (document.getElementById(anchor)) restoreSection(anchor);
  }, []);

  // After a language switch, show the section that was in view in the other language.
  useLayoutEffect(() => {
    const before = previous.current;
    if (before && before.lang !== lang) restoreSection(before.section);
  }, [lang, tree]);

  useEffect(() => {
    previous.current = { lang, section };
    onSection?.(section);
  }, [lang, section, onSection]);

  return (
    <div ref={setContainer} data-testid="lesson-content" data-section={section ?? ""}>
      <LessonBody tree={tree} markdown={markdown} lessonId={lessonId} lang={lang} components={components} />
    </div>
  );
}
