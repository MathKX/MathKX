// Parses a lesson translation (nb.md / en.md) with the unified/remark stack and extracts what
// the lesson checks need: front matter, anchored headings, sections, directives, mathematics,
// images, links, and tables written without a delimiter row.
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkFrontmatter from "remark-frontmatter";
import remarkDirective from "remark-directive";
import remarkMath from "remark-math";
import { visit } from "unist-util-visit";
import { toString } from "mdast-util-to-string";
import YAML from "yaml";

const processor = unified().use(remarkParse).use(remarkGfm).use(remarkFrontmatter, ["yaml"]).use(remarkDirective).use(remarkMath);

const ANCHOR = /\s*\{#([A-Za-z0-9][A-Za-z0-9_-]*)\}\s*$/;
export const BEFORE_FIRST_HEADING = "(before the first heading)";

export function parseLessonMarkdown(text) {
  const tree = processor.parse(text);
  const lines = text.split(/\r?\n/);
  const line = (node) => node.position?.start.line ?? null;

  let frontMatter = { ok: false, error: "missing front matter" };
  const headings = [];
  const directives = [];
  const math = [];
  const images = [];
  const links = [];
  const pipeParagraphs = [];

  // Reference-style images and links resolve through the definition table.
  const definitions = new Map();
  visit(tree, "definition", (node) => definitions.set(node.identifier, node.url));

  let section = BEFORE_FIRST_HEADING;
  for (const node of tree.children) {
    if (node.type === "yaml") {
      try {
        const data = YAML.parse(node.value);
        frontMatter = data && typeof data === "object" && !Array.isArray(data) ? { ok: true, data } : { ok: false, error: "front matter must be a mapping" };
      } catch (error) {
        frontMatter = { ok: false, error: error.message };
      }
      continue;
    }
    if (node.type === "heading") {
      const raw = toString(node);
      const match = ANCHOR.exec(raw);
      const heading = { level: node.depth, text: raw.replace(ANCHOR, "").trim(), anchor: match?.[1] ?? null, line: line(node) };
      headings.push(heading);
      if (heading.anchor && (heading.level === 2 || heading.level === 3)) section = heading.anchor;
      // Fall through: a heading's inline children (mathematics, links) are checked like any other.
    }
    if (node.type === "paragraph") {
      const start = node.position.start.line, end = node.position.end.line;
      const own = lines.slice(start - 1, end);
      if (own.length > 0 && own.every((l) => l.trim().startsWith("|"))) pipeParagraphs.push({ line: start });
    }
    visit(node, (child) => {
      switch (child.type) {
        case "containerDirective":
        case "leafDirective":
        case "textDirective": {
          const container = child.type === "containerDirective";
          // remark closes a container at end of file as well; the contract requires a closing ::: line.
          const closed = container && (lines[child.position.end.line - 1] ?? "").trim() === ":::";
          directives.push({
            name: child.name,
            form: container ? "container" : child.type === "leafDirective" ? "leaf" : "text",
            attributes: { ...(child.attributes ?? {}) },
            line: line(child),
            section,
            closed,
            body: container ? toString(child).trim() : "",
          });
          break;
        }
        case "inlineMath":
        case "math":
          math.push({ value: child.value, display: child.type === "math", line: line(child), section });
          break;
        case "image":
          images.push({ url: child.url, alt: child.alt ?? "", line: line(child), section });
          break;
        case "imageReference":
          images.push({ url: definitions.get(child.identifier) ?? null, reference: child.identifier, alt: child.alt ?? "", line: line(child), section });
          break;
        case "link":
          links.push({ url: child.url, line: line(child), section });
          break;
        case "linkReference":
          links.push({ url: definitions.get(child.identifier) ?? null, reference: child.identifier, line: line(child), section });
          break;
        default:
      }
    });
  }
  return { frontMatter, headings, directives, math, images, links, pipeParagraphs };
}
