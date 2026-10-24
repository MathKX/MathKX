// The renderer's parser reads the pilot lesson exactly as the content validator does (specs/003 research R1):
// headings with anchors, directives with attributes, mathematics, and images, in order, in both languages.
import { describe, expect, it } from "vitest";
import { visit } from "unist-util-visit";
import type { Nodes } from "mdast";
import { directiveAttributes, headingAnchor, parseLesson } from "../src/lesson/parse";
import { parseLessonMarkdown } from "../../../tools/lib/markdown.mjs";
import { lessonMarkdown } from "./fakeApi";

function ours(markdown: string) {
  const tree = parseLesson(markdown);
  const headings: { level: number; text: string; anchor: string | null }[] = [];
  const directives: { name: string; attributes: Record<string, string> }[] = [];
  const math: string[] = [];
  const images: { url: string; alt: string }[] = [];
  visit(tree, (node: Nodes) => {
    if (node.type === "heading") headings.push({ level: node.depth, ...headingAnchor(node) });
    if (node.type === "containerDirective" || node.type === "leafDirective" || node.type === "textDirective") directives.push({ name: node.name, attributes: directiveAttributes(node) });
    if (node.type === "inlineMath" || node.type === "math") math.push(node.value);
    if (node.type === "image") images.push({ url: node.url, alt: node.alt ?? "" });
  });
  return { headings, directives, math, images };
}

describe.each(["nb", "en"])("the %s lesson", (lang) => {
  const markdown = lessonMarkdown(lang);
  const app = ours(markdown);
  const validator = parseLessonMarkdown(markdown);

  it("has the same headings and anchors", () => {
    expect(app.headings).toEqual(validator.headings.map(({ level, text, anchor }) => ({ level, text, anchor })));
    expect(app.headings.map((h) => h.anchor)).toEqual(["what", "pairs", "ten-frame", "why", "try", "practice"]);
  });

  it("has the same directives in order", () => {
    expect(app.directives).toEqual(validator.directives.map(({ name, attributes }) => ({ name, attributes })));
    expect(app.directives.map((d) => d.name)).toEqual(["visual", "example", "visual", "practice", "practice"]);
  });

  it("has the same mathematics in order", () => {
    expect(app.math).toEqual(validator.math.map((m) => m.value));
  });

  it("has the same images", () => {
    expect(app.images).toEqual(validator.images.map(({ url, alt }) => ({ url, alt })));
  });
});
