// specs/003 contracts/lesson-renderer.md tests 1–5: the pilot lesson renders completely in both languages, the
// one-line display rule, placeholders instead of raw markup, safe links and images, and the section kept across
// a language switch.
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render } from "@testing-library/react";
import { visit } from "unist-util-visit";
import type { Nodes } from "mdast";
import { toString } from "mdast-util-to-string";
import LessonView from "../src/lesson/LessonView";
import { parseLesson } from "../src/lesson/parse";
import type { LessonComponents } from "../src/lesson/render";
import type { Lang } from "../src/i18n";
import { lessonMarkdown } from "./fakeApi";

const components: LessonComponents = {
  visual: (attributes, key) => <div key={key} data-testid="stub-visual" data-type={attributes.type} />,
  practice: (attributes, key) => <div key={key} data-testid="stub-practice" data-definition={attributes.definition} />,
};

function view(markdown: string, lang: Lang = "en") {
  return render(<LessonView lessonId="number-bonds-to-ten" lang={lang} markdown={markdown} components={components} />);
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe.each(["nb", "en"] as const)("the %s pilot lesson", (lang) => {
  const markdown = lessonMarkdown(lang);
  const tree = parseLesson(markdown);
  const count = (type: Nodes["type"]) => {
    let n = 0;
    visit(tree, type, () => void n++);
    return n;
  };

  it("renders every element of the source (SC-001)", () => {
    const { container } = view(markdown, lang);
    expect(container.querySelectorAll("h2[id]").length).toBe(count("heading"));
    expect([...container.querySelectorAll("h2[id]")].map((h) => h.id)).toEqual(["what", "pairs", "ten-frame", "why", "try", "practice"]);
    expect(container.querySelectorAll("li").length).toBe(count("listItem"));
    expect(container.querySelectorAll("th[scope=col]").length).toBe(2);
    expect(container.querySelectorAll("th, td").length).toBe(count("tableCell"));
    expect(container.querySelectorAll("math").length).toBe(count("inlineMath") + count("math"));
    expect(container.querySelectorAll("img").length).toBe(count("image"));
    expect(container.querySelectorAll("[data-testid=lesson-example]").length).toBe(1);
    expect(container.querySelectorAll("[data-testid=stub-visual]").length).toBe(2);
    expect([...container.querySelectorAll("[data-testid=stub-practice]")].map((p) => p.getAttribute("data-definition"))).toEqual([
      "numbers.addition.within-10",
      "numbers.addition.crossing-ten",
    ]);
    expect(container.querySelectorAll("[data-testid=lesson-unsupported], [data-testid=expression-failed]").length).toBe(0);

    // Every word of prose in the source appears on the page (mathematics is checked as MathML above).
    const text = container.textContent ?? "";
    visit(tree, "text", (node) => {
      const words = node.value.replace(/\{#[^}]+\}/, "").trim();
      if (words) expect(text).toContain(words);
    });
  });

  it("renders the worked example's one-line $$ as display mathematics and table mathematics inline", () => {
    const { container } = view(markdown, lang);
    const example = container.querySelector("[data-testid=lesson-example]");
    expect(example?.querySelector("h3")?.textContent).toMatch(/8 \+ 5/);
    const display = example?.querySelector("math[display=block]");
    expect(display?.textContent?.replace(/\s/g, "")).toBe("8+5=8+2+3=10+3=13");
    const cells = [...container.querySelectorAll("td math")];
    expect(cells.length).toBe(6);
    expect(cells.every((m) => m.getAttribute("display") === "inline")).toBe(true);
  });

  it("points images at the assets endpoint with the translated text alternative", () => {
    const { container } = view(markdown, lang);
    const img = container.querySelector("img");
    expect(img?.getAttribute("src")).toBe("/api/lessons/number-bonds-to-ten/assets/ten-frame-3-7.svg");
    let alt = "";
    visit(tree, "image", (node) => void (alt = node.alt ?? ""));
    expect(img?.getAttribute("alt")).toBe(alt);
    expect(alt.length).toBeGreaterThan(10);
  });
});

describe("what the renderer refuses to pass through", () => {
  it("shows a placeholder for raw HTML, unknown directives, and unparsable notation, never markup", () => {
    const { container } = view("---\ntitle: t\nobjective: o\n---\n\n<b onclick=\"x()\">bold</b>\n\n:::unknown{a=\"1\"}\nbody\n:::\n\nInline :abbr[x] and $\\sqrt{2}$.\n");
    expect(container.querySelector("b")).toBeNull();
    // Inline HTML is two nodes (the opening and the closing tag), each a placeholder; plus the two directives.
    expect(container.querySelectorAll("[data-testid=lesson-unsupported]").length).toBe(4);
    expect(container.textContent).toContain('<b onclick="x()">');
    expect(container.textContent).toContain("</b>");
    expect(container.querySelector("[data-testid=expression-failed]")?.textContent).toContain("\\sqrt{2}");
  });

  it("keeps in-page and http(s) links, opens external ones safely, and renders other schemes as text", () => {
    const { container } = view("---\ntitle: t\nobjective: o\n---\n\n[top](#what) [site](https://example.org) [bad](javascript:alert(1)) [mail](mailto:a@b.c)\n");
    const links = [...container.querySelectorAll("a")].filter((a) => !a.classList.contains("mkx-section-link"));
    expect(links.map((a) => a.getAttribute("href"))).toEqual(["#what", "https://example.org"]);
    expect(links[1]?.getAttribute("rel")).toBe("noopener noreferrer");
    expect(links[1]?.getAttribute("target")).toBe("_blank");
    expect(container.textContent).toContain("bad");
    expect(container.textContent).toContain("mail");
  });

  it("renders an image outside assets/ as a placeholder", () => {
    const { container } = view("---\ntitle: t\nobjective: o\n---\n\n![x](https://example.org/x.png)\n");
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("[data-testid=lesson-unsupported]")).not.toBeNull();
  });
});

describe("the section in view across a language switch", () => {
  it("shows the same section in the other language (User Story 1 scenario 6)", () => {
    let report: ((entries: IntersectionObserverEntry[]) => void) | null = null;
    const observed: Element[] = [];
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(callback: (entries: IntersectionObserverEntry[]) => void) {
          report = callback;
        }
        observe(element: Element) {
          observed.push(element);
        }
        disconnect() {
          observed.length = 0;
        }
      },
    );
    const scrolled: Element[] = [];
    Element.prototype.scrollIntoView = function (this: Element) {
      scrolled.push(this);
    };

    const { rerender } = view(lessonMarkdown("nb"), "nb");
    // The first four headings have passed the top of the viewport: "why" is the section in view.
    act(() => {
      report?.(
        observed.map((element, i) => ({ target: element, boundingClientRect: { top: i < 4 ? -10 : 500 }, rootBounds: { top: 0 } }) as unknown as IntersectionObserverEntry),
      );
    });
    rerender(<LessonView lessonId="number-bonds-to-ten" lang="en" markdown={lessonMarkdown("en")} components={components} />);

    const target = scrolled.at(-1);
    expect(target?.id).toBe("why");
    expect(toString({ type: "text", value: target?.textContent ?? "" })).toContain("Why is this useful?");
  });
});
