// Renders a parsed lesson to React elements by node type (specs/003 contracts/lesson-renderer.md "Node mapping").
// There is no HTML string anywhere: raw HTML, unknown directives, and anything outside the 0.1-pilot contract
// render as a visible placeholder, never silently dropped and never as markup.
import type { ReactNode } from "react";
import type { Nodes, Root, RootContent, Table, TableRow } from "mdast";
import { toString } from "mdast-util-to-string";
import { translate, type Lang } from "../i18n";
import { Notation } from "./MathNotation";
import { Placeholder } from "./Placeholder";
import { directiveAttributes, headingAnchor, headingChildren } from "./parse";

/** Directive renderers supplied by the page, so later stories plug in visuals and practice entries. */
export interface LessonComponents {
  visual(attributes: Record<string, string>, key: string): ReactNode;
  practice(attributes: Record<string, string>, key: string): ReactNode;
}

interface Context {
  lessonId: string;
  lang: Lang;
  markdown: string;
  components: LessonComponents;
  definitions: Map<string, string>;
}

/** Only in-page anchors and http(s) addresses become links; anything else renders as its text. */
function safeHref(url: string): { href: string; external: boolean } | null {
  if (url.startsWith("#")) return { href: url, external: false };
  if (/^https?:\/\//i.test(url)) return { href: url, external: true };
  return null;
}

function assetSource(url: string, lessonId: string): string | null {
  const match = /^assets\/([A-Za-z0-9][A-Za-z0-9._-]*)$/.exec(url);
  return match ? `/api/lessons/${encodeURIComponent(lessonId)}/assets/${encodeURIComponent(match[1] as string)}` : null;
}

function children(nodes: readonly Nodes[], ctx: Context, prefix: string): ReactNode[] {
  return nodes.map((node, i) => renderNode(node, ctx, `${prefix}.${i}`));
}

/** remark-math parses a one-line `$$…$$` as inline mathematics; alone in its paragraph it is a display line. */
function isDisplayLine(node: Nodes, ctx: Context): boolean {
  if (node.type !== "paragraph" || node.children.length !== 1) return false;
  const only = node.children[0];
  const offset = only?.position?.start.offset;
  return only?.type === "inlineMath" && offset !== undefined && ctx.markdown.startsWith("$$", offset);
}

function renderTable(node: Table, ctx: Context, key: string): ReactNode {
  const [head, ...body] = node.children;
  const align = (i: number) => {
    const a = node.align?.[i];
    return a ? `mkx-align-${a}` : undefined;
  };
  const cells = (row: TableRow, header: boolean, rowKey: string) =>
    row.children.map((cell, i) =>
      header ? (
        <th key={`${rowKey}.${i}`} scope="col" className={align(i)}>
          {children(cell.children, ctx, `${rowKey}.${i}`)}
        </th>
      ) : (
        <td key={`${rowKey}.${i}`} className={align(i)}>
          {children(cell.children, ctx, `${rowKey}.${i}`)}
        </td>
      ),
    );
  const label = head ? head.children.map((cell) => toString(cell)).join(", ") : "";
  return (
    <div key={key} className="mkx-table-scroll" role="region" aria-label={translate(ctx.lang, "lesson.tableScroll", { columns: label })} tabIndex={0}>
      <table>
        {head ? (
          <thead>
            <tr>{cells(head, true, `${key}.h`)}</tr>
          </thead>
        ) : null}
        <tbody>
          {body.map((row, r) => (
            <tr key={`${key}.b${r}`}>{cells(row, false, `${key}.b${r}`)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderNode(node: Nodes, ctx: Context, key: string): ReactNode {
  const { lang } = ctx;
  switch (node.type) {
    case "root":
      return <>{children(node.children, ctx, key)}</>;
    case "yaml":
    case "definition":
      return null;
    case "heading": {
      const { anchor, text } = headingAnchor(node);
      const content = children(headingChildren(node), ctx, key);
      const link = anchor ? (
        <a className="mkx-section-link" href={`#${anchor}`} aria-label={translate(lang, "lesson.sectionLink", { heading: text })}>
          #
        </a>
      ) : null;
      if (node.depth === 3) {
        return (
          <h3 key={key} id={anchor ?? undefined} data-anchor={anchor ?? undefined}>
            {content} {link}
          </h3>
        );
      }
      return (
        <h2 key={key} id={anchor ?? undefined} data-anchor={anchor ?? undefined}>
          {content} {link}
        </h2>
      );
    }
    case "paragraph":
      if (isDisplayLine(node, ctx)) {
        const only = node.children[0];
        return (
          <div key={key} className="mkx-math-display">
            <Notation source={only?.type === "inlineMath" ? only.value : ""} display lang={lang} />
          </div>
        );
      }
      if (node.data && "directiveLabel" in node.data) return null;
      return <p key={key}>{children(node.children, ctx, key)}</p>;
    case "text":
      return node.value;
    case "emphasis":
      return <em key={key}>{children(node.children, ctx, key)}</em>;
    case "strong":
      return <strong key={key}>{children(node.children, ctx, key)}</strong>;
    case "delete":
      return <del key={key}>{children(node.children, ctx, key)}</del>;
    case "break":
      return <br key={key} />;
    case "thematicBreak":
      return <hr key={key} />;
    case "blockquote":
      return <blockquote key={key}>{children(node.children, ctx, key)}</blockquote>;
    case "list":
      return node.ordered ? (
        <ol key={key} start={node.start ?? undefined}>
          {children(node.children, ctx, key)}
        </ol>
      ) : (
        <ul key={key}>{children(node.children, ctx, key)}</ul>
      );
    case "listItem":
      return (
        <li key={key}>
          {typeof node.checked === "boolean" ? <span className="mkx-task">{translate(lang, node.checked ? "lesson.taskDone" : "lesson.taskNotDone")} </span> : null}
          {children(node.children, ctx, key)}
        </li>
      );
    case "inlineCode":
      return <code key={key}>{node.value}</code>;
    case "code":
      return (
        <pre key={key}>
          <code>{node.value}</code>
        </pre>
      );
    case "inlineMath":
      return <Notation key={key} source={node.value} display={false} lang={lang} />;
    case "math":
      return (
        <div key={key} className="mkx-math-display">
          <Notation source={node.value} display lang={lang} />
        </div>
      );
    case "link":
    case "linkReference": {
      const url = node.type === "link" ? node.url : ctx.definitions.get(node.identifier);
      const target = url ? safeHref(url) : null;
      const content = children(node.children, ctx, key);
      if (!target) return <span key={key}>{content}</span>;
      return target.external ? (
        <a key={key} href={target.href} target="_blank" rel="noopener noreferrer">
          {content}
        </a>
      ) : (
        <a key={key} href={target.href}>
          {content}
        </a>
      );
    }
    case "image":
    case "imageReference": {
      const url = node.type === "image" ? node.url : ctx.definitions.get(node.identifier);
      const src = url ? assetSource(url, ctx.lessonId) : null;
      if (!src) return <Placeholder key={key} lang={lang} />;
      return <img key={key} className="mkx-lesson-image" src={src} alt={node.alt ?? ""} />;
    }
    case "table":
      return renderTable(node, ctx, key);
    case "containerDirective": {
      const attributes = directiveAttributes(node);
      if (node.name === "example") {
        const id = attributes.id;
        const titleId = id ? `${id}-title` : undefined;
        return (
          <section key={key} id={id} className="mkx-example" aria-labelledby={titleId} data-testid="lesson-example">
            <h3 id={titleId}>{attributes.title}</h3>
            {children(node.children, ctx, key)}
          </section>
        );
      }
      if (node.name === "visual") return ctx.components.visual(attributes, key);
      if (node.name === "practice") return ctx.components.practice(attributes, key);
      return <Placeholder key={key} lang={lang} />;
    }
    case "html":
      return <Placeholder key={key} lang={lang} source={node.value} />;
    default:
      return <Placeholder key={key} lang={lang} />;
  }
}

export function LessonBody({
  tree,
  markdown,
  lessonId,
  lang,
  components,
}: {
  tree: Root;
  markdown: string;
  lessonId: string;
  lang: Lang;
  components: LessonComponents;
}) {
  const definitions = new Map<string, string>();
  const collect = (nodes: readonly RootContent[]) => {
    for (const node of nodes) {
      if (node.type === "definition" && !definitions.has(node.identifier)) definitions.set(node.identifier, node.url);
      if ("children" in node) collect(node.children as RootContent[]);
    }
  };
  collect(tree.children);
  return <div className="mkx-lesson-body">{renderNode(tree, { lessonId, lang, markdown, components, definitions }, "n")}</div>;
}
