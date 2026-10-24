// Types for the content validator's modules that the agreement tests import (tools/lib, plain JavaScript).

declare module "*/tools/lib/notation.mjs" {
  export function parseNotation(src: string): { ok: true; tree: unknown } | { ok: false; error: string };
  export function normalize(src: string): { ok: true; value: string } | { ok: false; error: string };
}

declare module "*/tools/lib/markdown.mjs" {
  export function parseLessonMarkdown(text: string): {
    headings: { level: number; text: string; anchor: string | null }[];
    directives: { name: string; form: string; attributes: Record<string, string> }[];
    math: { value: string; display: boolean }[];
    images: { url: string | null; alt: string }[];
    links: { url: string | null }[];
  };
}
