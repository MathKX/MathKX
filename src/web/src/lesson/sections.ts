// Which section of the lesson is in view, so a language switch shows the same section (specs/003 research R8).
// Anchors are the language-neutral identity of a section; spec 001 requires the same set in every language.
import { useCallback, useEffect, useRef, useState } from "react";

const reducedMotion = () => typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Scrolls to the section's heading without moving focus; the top of the page when it is missing. */
export function restoreSection(anchor: string | null) {
  const target = anchor ? document.getElementById(anchor) : null;
  const behavior: ScrollBehavior = reducedMotion() ? "auto" : "smooth";
  if (target && typeof target.scrollIntoView === "function") target.scrollIntoView({ block: "start", behavior });
  else if (typeof window.scrollTo === "function") window.scrollTo({ top: 0, behavior });
}

/**
 * Tracks the anchor of the last level-2 or level-3 heading above the viewport's top edge inside `container`.
 * `key` changes when the rendered lesson changes, so the headings are observed again.
 */
export function useSectionInView(container: HTMLElement | null, key: unknown): [string | null, (anchor: string | null) => void] {
  const [anchor, setAnchor] = useState<string | null>(null);
  const above = useRef(new Set<string>());

  useEffect(() => {
    if (!container || typeof IntersectionObserver === "undefined") return;
    const headings = Array.from(container.querySelectorAll<HTMLElement>("h2[data-anchor], h3[data-anchor]"));
    above.current = new Set();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const id = (entry.target as HTMLElement).dataset.anchor;
        if (!id) continue;
        if (entry.boundingClientRect.top < (entry.rootBounds?.top ?? 0) + 1) above.current.add(id);
        else above.current.delete(id);
      }
      const last = headings.filter((h) => above.current.has(h.dataset.anchor ?? "")).pop();
      setAnchor(last?.dataset.anchor ?? null);
    });
    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [container, key]);

  const set = useCallback((value: string | null) => setAnchor(value), []);
  return [anchor, set];
}
