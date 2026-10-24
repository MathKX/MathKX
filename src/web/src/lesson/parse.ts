// Parses a lesson translation with the content validator's unified/remark configuration at the same versions
// (tools/lib/markdown.mjs; specs/003 research R1), so the renderer sees exactly the tree the checks accepted.
// tests/parse-agreement.test.ts compares the two on both pilot files.
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkFrontmatter from "remark-frontmatter";
import remarkDirective from "remark-directive";
import remarkMath from "remark-math";
import { toString } from "mdast-util-to-string";
import type { Heading, Nodes, Root, Text } from "mdast";

const processor = unified().use(remarkParse).use(remarkGfm).use(remarkFrontmatter, ["yaml"]).use(remarkDirective).use(remarkMath);

/** The validator's heading-anchor pattern. */
export const ANCHOR = /\s*\{#([A-Za-z0-9][A-Za-z0-9_-]*)\}\s*$/;

export function parseLesson(markdown: string): Root {
  return processor.parse(markdown);
}

/** The heading's anchor and its text without it, read as the validator reads them. */
export function headingAnchor(node: Heading): { anchor: string | null; text: string } {
  const raw = toString(node);
  return { anchor: ANCHOR.exec(raw)?.[1] ?? null, text: raw.replace(ANCHOR, "").trim() };
}

/** The heading's children with the trailing `{#anchor}` removed from its last text, for display. */
export function headingChildren(node: Heading): Heading["children"] {
  const children = [...node.children];
  const last = children[children.length - 1];
  if (last?.type === "text") {
    const value = last.value.replace(ANCHOR, "");
    if (value.length === 0) children.pop();
    else children[children.length - 1] = { ...last, value } satisfies Text;
  }
  return children;
}

/** A directive's attributes as authored (strings); the validator has already checked names and ranges. */
export function directiveAttributes(node: Nodes): Record<string, string> {
  if (node.type !== "containerDirective" && node.type !== "leafDirective" && node.type !== "textDirective") return {};
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(node.attributes ?? {})) if (typeof value === "string") out[key] = value;
  return out;
}
