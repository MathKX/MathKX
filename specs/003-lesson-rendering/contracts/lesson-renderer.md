# Contract: lesson renderer

Part of [plan.md](../plan.md) Phase 1. How the learner app turns a lesson translation into the lesson page. It implements spec 001's [directives and notation contract](../../001-pilot-content-contract/contracts/directives-and-notation.md) (`0.1-pilot`) and nothing beyond it. Code: `src/web/src/lesson/`, loaded as its own chunk by the lesson page.

## Parsing

`parse.ts` runs `unified().use(remarkParse).use(remarkGfm).use(remarkFrontmatter, ["yaml"]).use(remarkDirective).use(remarkMath)`, the validator's configuration at the validator's versions, and returns the syntax tree. Heading anchors are taken with the validator's pattern (`\s*\{#([A-Za-z0-9][A-Za-z0-9_-]*)\}\s*$` on the heading's last text) and removed from the visible text. The title and objective shown at the top come from the service's lesson metadata (spec 002), not from the parsed front matter, and the `yaml` node is not rendered.

`parse-agreement.test.ts` parses both pilot files with `parse.ts` and with `tools/lib/markdown.mjs` and asserts equal anchors per heading, equal directive names and attributes in order, equal mathematics sources, and equal image URLs and alternative texts.

## Node mapping

Rendering walks the tree and returns React elements; there is no HTML string anywhere.

| Node | Rendered as |
| --- | --- |
| `heading` depth 2 or 3 | `<h2>` or `<h3>` with `id` = anchor and a visible "link to this section" control for keyboard and pointer (accessible name "Link to section: {heading}"); depth 1 is not allowed by the contract and renders as `<h2>` with a placeholder note |
| `paragraph`, `text`, `emphasis`, `strong`, `break`, `thematicBreak`, `blockquote` | `<p>`, text, `<em>`, `<strong>`, `<br>`, `<hr>`, `<blockquote>` |
| `list`, `listItem` | `<ol start>` or `<ul>`, `<li>`; task-list items render their checkbox as read-only text ("done", "not done") |
| `link` | `<a>`: `#anchor` within the lesson scrolls in page; `http:` and `https:` open in a new browsing context with `rel="noopener noreferrer"`; any other scheme renders as plain text |
| `image` | `<img>` with `src` rewritten from `assets/{name}` to `/api/lessons/{id}/assets/{name}` and `alt` from the selected translation; any other source renders the placeholder |
| `table`, `tableRow`, `tableCell` | `<table>`; the first row's cells are `<th scope="col">`, the rest `<td>`; GFM column alignment as a class; the table sits in a container that scrolls horizontally on narrow screens and has the accessible name of its first header cell row |
| `inlineMath` | `Notation` inline; **except** when it is the only child of its paragraph and its source at the node's start offset begins with `$$`, which renders as display mathematics (remark-math parses a one-line `$$…$$` as inline; the lesson's worked example uses that form) |
| `math` | `Notation` display |
| `inlineCode`, `code` | `<code>`, `<pre><code>` (not used by the pilot lesson; shown verbatim) |
| `containerDirective` `example` | `<section>` with `id` = the directive's `id`, an `<h3>`-level title from the localized `title`, and the body rendered recursively; a visible frame distinguishes it from the text (not colour alone) |
| `containerDirective` `visual` | the registered component for `type` (below) |
| `containerDirective` `practice` | a practice entry (below) |
| `definition`, `linkReference`, `imageReference` | references resolved through the definition table as the validator resolves them |
| `html`, any other directive, any other node type | the placeholder: a bordered note "This part of the lesson cannot be shown here." in the selected language, plus the node's source text for `html`, as text |

## Notation

`notation.ts` is a TypeScript port of `tools/lib/notation.mjs` returning the same tree; `Notation.tsx` renders it as MathML Core inside `<math display="inline">` or `<math display="block">`: `row` as `<mrow>`, `mn`, `mi`, `mo`, `sup` as `<msup>`, `sub` as `<msub>`, `frac` as `<mfrac>`, `prime` as `<msup>` with `′`. Authored decimal marks are kept; `-` shows as `−` and `*` as `·`. No `aria-label`: the MathML is read by assistive technology in the page language. An expression the port cannot parse renders the placeholder with the source text and "This expression could not be shown." `notation.test.ts` runs every expression in both pilot files and every example in the notation contract through both implementations and compares trees and normalized strings.

## Visual components

| Directive | Component | Data |
| --- | --- | --- |
| `ten-frame-explorer` `start` | `TenFrameExplorer`: the existing `TenFrame` with the chosen number filled; a labelled range of 0–10 as a radio group of eleven 44-pixel targets (arrow keys move, Home and End jump); a sentence "{filled} and {partner} make 10." in the selected language; a polite live region announces the sentence once after the choice settles (250 ms) | `GET /api/visuals/ten-frame-explorer` |
| `make-ten` `a` `b` | `StepVisual` with the existing `MakeTen` drawing: "Previous step" and "Next step" buttons, "Step {n} of {count}", the step's picture, its sentence from the dictionaries (`explain.makeTen.*`), and the expression for the step; motion only without `prefers-reduced-motion` | `GET /api/visuals/make-ten?a=&b=` |
| `groups` `a` `b` | `StepVisual` with the existing `Groups` drawing and `explain.groups.*` sentences | `GET /api/visuals/groups?a=&b=` |

A component whose data cannot be loaded shows "This illustration could not be loaded." with a retry button; the rest of the lesson stays usable. No component announces a result before its step shows it.

## Practice entries

Each `:::practice{definition version}` renders where the file places it as the stub page's practice button ("Practise: {ladder description}") using the skill ladder description for that definition and version in the selected language, with spec 002's explicit-choice behaviour on activation. The "Practise" heading stays authored content.

## Page frame

Top to bottom: the return banner when a detour is in progress ([detour.md](detour.md)); the title (`<h1>`) and objective from the lesson metadata; the rendered body; a footer with "Edit this lesson" (source file of the selected language on GitHub, `blob/main`) and "Suggest an improvement" (a new GitHub issue whose title and body contain only the lesson ID, version, language, and the section anchor in view). Both open in a new browsing context.

## Sections and the language switch

`sections.ts` keeps the anchor of the last level-2 or level-3 heading above the top of the viewport. On a language switch the page shows the other translation (requested once per visit and cached) and scrolls to that anchor (instantly with reduced motion), leaving focus on the language switch; a missing anchor falls back to the top. The same anchor goes into "Suggest an improvement".

## Accessibility

One `<h1>`, then the authored `<h2>`/`<h3>` order; the skip link of spec 002 targets the lesson's main content; tables with header cells; every image with its translated text alternative; both visuals operable by keyboard and touch with visible focus; controls at least 44 by 44 CSS pixels on touch screens; the page usable at 200 percent zoom without horizontal scrolling except inside a table's own scroll container; `lang` on `<html>` follows the selected language.

## Tests (`lesson-render.test.tsx`)

1. Both pilot files render every heading (with anchor), paragraph, list item, table cell, mathematics node, image, example, visual, and practice entry, compared against the parsed tree's node counts and texts (spec SC-001).
2. The worked example's one-line `$$…$$` renders as display mathematics; inline mathematics in the table renders inline.
3. An `html` node, an unknown directive, an unknown visual type, and an unparsable expression each render the placeholder and never their raw markup as HTML.
4. Image sources point at the assets endpoint; external links carry `rel="noopener noreferrer"`; a `javascript:` link renders as text.
5. Switching language with "Why is this useful?" in view shows "Hvorfor er det nyttig?" in view.
6. The contribution links contain the lesson ID, version, language, and section and nothing from the store.
