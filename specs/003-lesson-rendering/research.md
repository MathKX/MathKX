# Research: Lesson Rendering and the Detour Back to an Exercise

Phase 0 of [plan.md](plan.md). Each decision records what was chosen, why, and what was rejected. Spec 002's decisions ([research.md](../002-practice-flow/research.md) R1–R15) stand unless a decision here says otherwise.

## R1. Where lesson Markdown is parsed and rendered

**Decision**: The learner app parses each lesson file with the unified/remark stack the content validator uses (`remark-parse`, `remark-gfm`, `remark-frontmatter` for YAML, `remark-directive`, `remark-math`), pinned to the same exact versions as the root `package.json`, and renders the resulting syntax tree directly to React elements by node type (`contracts/lesson-renderer.md`). Heading anchors (`{#id}`) and directive attributes are read exactly as `tools/lib/markdown.mjs` reads them. Raw HTML nodes are never rendered; any node or directive the pilot contract does not define renders as a visible placeholder in the selected language. The parser, renderer, and lesson components sit in `src/web/src/lesson/` and load as a separate chunk through a dynamic import from the lesson page. The service serves the Markdown text unchanged.

The app keeps its own parser module rather than importing from `tools/`, and an agreement test in `src/web/tests/parse-agreement.test.ts` parses both pilot lesson files with the app's module and with `tools/lib/markdown.mjs` and asserts identical anchors, directive identities and attributes, mathematics, and images. The web CI job therefore also runs `npm ci` at the repository root.

**Rationale**: The validator is the authority on what a lesson means (spec 001); parsing with the same stack at the same versions means the renderer sees exactly the tree the validator accepted, and the addendum §D row 6 asks for "a standard parser plus the three directives". Rendering from the tree to React avoids an HTML string and any `dangerouslySetInnerHTML`, which removes the injection surface of a Markdown-to-HTML step. Keeping two packages independent (the root is content tooling, not an application dependency) while proving agreement in a test follows the pattern the seed proposal used for C# and its vectors.

**Alternatives considered**: Parse on the service with a C# Markdown library and send a JSON tree (two parsers that must agree on the whole document, not only on mathematics, and a custom tree format to maintain). Render to HTML with `remark-rehype` and `rehype-react` (works, but adds a second tree, a sanitizer to configure, and more bundle for no gain at three directives). Import `tools/lib/*.mjs` into the app bundle (one source, but couples the application build to the content-tooling package and needs Vite file-system exceptions; rejected for now, revisit if the copies drift). Pre-build lessons to JSON at app build time (stale content until a rebuild; breaks the contributor preview of FR-006 and FR-018).

## R2. Notation to MathML

**Decision**: Port the pilot grammar of `tools/lib/notation.mjs` (itself ported from the prototype) to `src/web/src/lesson/notation.ts`, producing the same tree (`row`, `mn`, `mi`, `mo`, `sup`, `sub`, `frac`, `prime`), and render it with `Notation.tsx` as MathML Core: `<math display="inline">` for `$…$` and `<math display="block">` for `$$…$$`, with `<mrow>`, `<mn>`, `<mi>`, `<mo>`, `<msup>`, `<msub>`, `<mfrac>`. Numbers keep the authored decimal mark; `-` displays as `−` and `*` as `·`, as the grammar maps them. The `<math>` element carries no `aria-label`, so assistive technology reads the MathML itself in the page language (`lang` on `<html>` follows the selected language). An agreement test runs every expression of both pilot files through both modules and asserts equal normalized strings and equal trees. An expression the port cannot parse (impossible for validated content) renders as a placeholder that shows the source text and the dictionary message "This expression could not be shown", never as dropped text.

**Rationale**: MathML Core is supported by Safari (the primary iPad browser), Firefox, and Chromium since version 109, and screen readers read it as mathematics; the spec 002 prompt already uses it. The pilot grammar is small and declared, so a direct port is under two hundred lines and needs no TeX engine. A label would replace the structure with a flat string in one language and duplicate the work of the reader; leaving MathML unlabelled keeps one source of truth.

**Alternatives considered**: KaTeX or MathJax (large, TeX-oriented, render the whole TeX language rather than the declared grammar, so unsupported notation could render instead of failing). Plain text with Unicode (loses structure for fractions and powers and reads poorly). A spoken-form label per expression (needs a second, per-language grammar for speech; not justified while MathML is read natively).

## R3. Delivering lesson content and assets

**Decision**: The content snapshot the service loads at startup also keeps, for every lesson, each translation's Markdown text and the list of files in its `assets/` folder. Two endpoints serve them (`contracts/api.md`): `GET /api/lessons/{id}/content/{lang}` returns the Markdown with the lesson's identity and version, and `GET /api/lessons/{id}/assets/{name}` streams an asset whose name is in the snapshot's list, with a content type from an allowlist (`.svg`, `.png`, `.jpg`, `.jpeg`, `.webp`), `X-Content-Type-Options: nosniff`, and `Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'; sandbox`. The renderer rewrites `assets/…` image paths to that endpoint. Publishing already copies `content/` beside the binaries (spec 002 R2), so lessons ship with the application. A contributor previews a change by restarting the service; the Vite dev server reloads the app.

**Rationale**: One snapshot serves the Markdown and computes the disclosure flags (R4), so the notice and the lesson the learner then sees always come from the same files. A name allowlist from the snapshot rules out path traversal by construction, and the headers stop an SVG opened directly from running anything. Restart-to-preview keeps the service simple; content loads in about a second.

**Alternatives considered**: Serving `content/` as static files (exposes every file, including definitions with validation parameters, and bypasses the snapshot). Reading Markdown from disk per request (the disclosure flag and the body could disagree after an edit). Reloading the snapshot on file change in Development (useful but more moving parts; revisit if the contributor check, spec SC-007, finds restarting a hurdle).

## R4. The disclosure decision

**Decision**: `MathKX.Domain.Lessons.LessonDisclosure.For(LessonFacts facts, Instance instance)` returns `{ discloses, where }` with `where` one of `expression` or `visual`, implementing DL-026 (2) as the prototype's `lessonDisclosure` settled it for addition (`contracts/disclosure.md`). `LessonFacts` holds, for one translation, the normalized mathematics expressions and the `:::visual` directives with integer attributes. `MathKX.Content.LessonFactsReader` builds it at load time: Markdig with its mathematics extension finds inline and display mathematics (skipping code spans and fenced code, as remark-math does), and the `:::visual{…}` opening lines, which the pilot contract fixes to one form, give the visuals; both are taken from Markdig's block tree, so text inside fenced or indented code is never read as mathematics or as a directive. A lesson discloses when either translation's facts disclose; a domain test asserts that both translations of every lesson give the same decision for every pilot instance, which the validator's per-section expression check already makes true for valid content.

The result reaches the app on the resolved question: `InstanceDto.lessons` lists every lesson whose practice entries include the instance's definition, with `{ id, discloses }` (`contracts/api.md`). The flag says nothing the learner is not told in the notice, and the answer is never sent.

A shared fixture `specs/003-lesson-rendering/contracts/lesson-facts.fixture.json` holds a set of synthetic Markdown snippets (code spans containing `$`, escaped dollars, multi-line display mathematics, attributes in different orders, a directive inside an example) with the expected facts; the C# reader and the validator's `parseLessonMarkdown` are both tested against it.

**Rationale**: The rule needs the result, and only the domain may compute it (constitution III; spec FR-011). Computing facts once at load keeps resolution fast and deterministic. Markdig is a maintained, permissively licensed CommonMark parser; using it for mathematics avoids a hand-written scanner, and the shared fixture catches any difference from remark on the cases that matter. Putting the flag on the instance response avoids a second call and covers every route (FR-015), because the app holds the current instance wherever the learner is.

**Alternatives considered**: Deciding in the browser from the operands (needs the sum, which FR-011 forbids). A separate endpoint per (instance, lesson) (an extra request on every lesson visit for the same information). A hand-written dollar scanner in C# (more code to get right than one dependency). Generating a facts file with the Node validator and committing it (every lesson edit would need a regenerated file, a burden on contributors).

## R5. Lesson visuals with authored values

**Decision**: `StepModels` gains an entry point for values: `StepModels.ForValues(int a, int b, string representation, StepKind kind)`, which the existing instance entry point calls, so a lesson's `make-ten` for `8 + 5` and the explanation for the question `8 + 5` are the same list by construction. `GET /api/visuals/{type}?a=&b=` returns all explanation steps at once for `make-ten` and `groups`, after checking `a` and `b` against the visual component's registered attributes and the linked representation's supports (`400 unsupported-values` otherwise). `TenFrameExplorer.States()` returns the eleven `(filled, partner)` pairs for 0 to 10, served at `GET /api/visuals/ten-frame-explorer`; the component highlights the chosen state and states the pair in text. These endpoints are not tied to an instance and return the total in the final step, as the lesson itself shows it.

**Rationale**: FR-008 requires the lesson visuals to use the same tested model as practice; one function makes divergence impossible. Serving the explorer's pairs keeps the app free of arithmetic, the boundary spec 002 drew ("the client computes nothing mathematical"). Returning all steps at once is fine for lesson visuals because the lesson is public content and is only fetched after the gate (R6).

**Alternatives considered**: Computing `10 − n` and the make-ten split in React (crosses the constitution's line for no benefit). Reusing the instance step endpoint with a synthetic identity (lesson visuals have no definition or seed).

## R6. The gate, the notice, and recording

**Decision**: The gate lives on the lesson page, so it applies whatever route reached it (spec clarification; FR-015). On entering `/lessons/:id`, the page asks the store for the **current question**: the current delivery, if it has no `correct` submission and no `skipped` event (spec 002's events). If there is one and the lesson's practice entries include its definition, the visit is a **detour**. If the instance's `lessons` entry for this lesson says `discloses`, the page renders the notice (`LessonGate`) instead of the lesson and does not request the lesson content; "Open the lesson anyway" opens the gate for this visit, "Show visual help instead" opens help on the current question and navigates to practice, "Cancel" navigates back to practice. When a stored instance predates this feature and lacks `lessons`, the page re-resolves the instance (deterministic) before deciding.

The lesson is **shown** when its content has rendered for the first time in the visit. At that moment, and once per visit, the store records on the current delivery: `lesson-reveal` for a disclosing detour, `lesson-opened` for a non-disclosing detour, and `lesson-opened` after the first correct answer only when the visit started from the question's lesson link (its address carries `from=question`, so a modified click that opens a new tab carries the origin there and leaves the source tab unchanged; the lesson page removes the parameter after reading it). Nothing is recorded when the content never renders, when there is no detour, or when the lesson does not list the question's definition. A language switch within the visit records nothing new. Leaving the page and coming back is a new visit.

**Rationale**: Placing the gate on the route makes "any route" one code path rather than a check on every link. Recording at first render is the precise meaning of "shown" and mirrors spec 002's rule that a step is recorded only when presented (its review 3), so a failed load or an abandoned confirmation cannot downgrade an outcome. "Current question" uses events spec 002 already records; it is wider than the store's `resumable`, which only covers questions without any submission, because a learner can detour after a wrong answer too.

**Alternatives considered**: A check only on the practice screen's link (misses the lesson list and history, contrary to the clarification). Recording on confirmation (rejected in review: confirmation shows nothing). Measuring reading time or scroll (DL-019 forbids).

## R7. The way back and state preservation

**Decision**: During a detour the lesson page shows `ReturnBanner` at the top of the main content: "Back to your question" with the question's prompt (`8 + 5 = ?`, the existing `AdditionPrompt` with its spoken form), a link to `/practice/{skillId}`, and "Dismiss" for this visit. Returning needs no new mechanism: spec 002's store keeps the current question, draft, help and explanation state and steps, and pending change while the learner is on another route, and the practice page resumes them on mount; the browser's back action reaches the same route. "Show visual help instead" queues a request that the practice view consumes on mount by calling `toggleHelp()`, because spec 002 records `visual-help-opened` only on that path; setting `helpOpen` directly would show help without recording it, and a later correct answer would wrongly read "Correct on first response, no help" (review of PR 29).

**Rationale**: The store already preserves exactly what FR-014 lists (spec 002 FR-016, FR-017); the banner only needs a route. Using the existing prompt component keeps the accessible name free of the result (DL-035).

**Alternatives considered**: Opening the lesson in a dialog over the question (keeps context visible but makes a long lesson cramped on a phone and nests focus traps; the route keeps links and anchors working). Storing a separate detour snapshot (duplicates state the store already holds).

## R8. Language switch at the same section

**Decision**: `sections.ts` observes the level-2 and level-3 headings with an `IntersectionObserver` and keeps the anchor of the last heading that has passed the top of the viewport. When the language changes, the page fetches the other file (cached per language for the visit), renders it, and scrolls to the same anchor without animation when `prefers-reduced-motion` is set; focus stays on the language switch. The anchor sets are identical across languages by spec 001's check; an anchor missing at runtime falls back to the top.

**Rationale**: Anchors are the language-neutral identity of a section, which is why spec 001 requires them to match. Scroll position in pixels would not carry across texts of different length.

**Alternatives considered**: Keeping both languages rendered and toggling visibility (doubles the work and the accessibility tree). Ignoring position (fails spec User Story 1 scenario 6).

## R9. The `lessonAfter` tag

**Decision**: `outcomes.ts` adds `lessonAfter` for a `lesson-opened` event after the first correct submission, placed after `explainAfter` in the tag order; the dictionaries add "Lesson opened after answering" and "Leksjon åpnet etter svaret"; spec 002's `contracts/observations.md` tag paragraph and its test list gain the tag with a note that spec 003 added it. Outcome precedence is untouched.

**Rationale**: The addendum §E says support after the first correct answer adds a tag; spec 002 implemented the tags for the support that existed then. The review on PR 27 found the gap.

**Alternatives considered**: Folding it into `explainAfter` (a lesson is not an explanation, and the record would misname what happened).

## R10. Contribution links and the local preview

**Decision**: `contribute.ts` builds two links from the lesson identity only: "Edit this lesson" to `https://github.com/MathKX/MathKX/blob/main/content/lessons/{id}/{file}` for the selected language, and "Suggest an improvement" to `https://github.com/MathKX/MathKX/issues/new` with a `title` ("Lesson {id}: suggestion") and a `body` naming the lesson ID, version, language, and the section anchor in view, nothing else. Both open in a new browsing context with `rel="noopener noreferrer"`. `CONTRIBUTING.md` and `src/web/README.md` gain a "Preview a lesson" section: start the service, start the Vite dev server, open `/lessons/{id}`, restart the service after editing, run `npm run validate`.

**Rationale**: The lesson proposal's contribution items 1 to 4 and the learning-experience workflow ask for a visible route to the source and a report path without private data. A URL-built issue needs no service and no token.

**Alternatives considered**: An in-app report form (the prototype has one; it needs a backend or a third-party service and raises privacy review; later). The `edit/` URL (requires a signed-in GitHub user before showing the file; `blob/` shows it to everyone and offers editing).

## R11. Tests, CI, and what stays out

**Decision**: Tests as listed in the plan's Technical Context and in each contract. CI: the web job adds `npm ci` at the root before its tests (agreement tests import the validator's modules); the e2e job gains `e2e/lesson.spec.ts` on both projects; no new workflow. Out of scope, as the spec states: "Lesson viewed" history and the progress view (F6), section-specific links from a question to a lesson (needs a content field), a pull-request preview, new directives or notation, reloading content without a restart, and lessons for other kinds of question.

**Rationale**: The existing jobs already build and test both roots; the additions keep CI well inside 10 minutes (spec 002 recorded 1 min 40 s of wall time for the whole workflow on PR 24, the end-to-end job being the slowest at 63 s).

**Alternatives considered**: A separate workflow for lesson checks (splits one feature's checks across workflows for no benefit).
