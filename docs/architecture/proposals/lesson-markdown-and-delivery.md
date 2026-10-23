# Lesson structure, Markdown, and delivery

Status: proposal, partly implemented. The folder layout, the three directives, and the bilingual pairing below were proven with the number-bonds lesson and implemented as the pilot content contract by [spec 001](../../../specs/001-pilot-content-contract/spec.md); the contract's open points are settled there: metadata fields (`status`, `skills`, `prerequisites`, `relatedSkills`, `relatedLessons`, `visuals`, `translations`), `practice` entries that name an exercise definition and version rather than a skill and variant, and the split of the earlier `related` list into `relatedSkills` and `relatedLessons`. The authoritative field list is [content/AUTHORING.md](../../../content/AUTHORING.md). The in-app renderer and delivery remain proposals. The initial product direction is to show lessons inside MathKX and defer a separate Hugo learning site.

## One learning experience and one source

Keep authored lessons in Git alongside skills and exercise definitions. Render them inside MathKX so learners can move between reading, visual exploration, practice, and checking their understanding while keeping their language, current work, and progress context.

Markdown supplies reviewed explanations and worked examples. Reusable application components supply interaction. A lesson can therefore have mostly static text and a few interactive visual models without generating its prose at runtime or requiring a separate website.

This proposal develops the [learning experience](../../design/learning-experience.md). It does not introduce runtime AI teaching content or change the [learning model](../../learning/learning-model.md).

## Proposed storage layout

Use one folder per lesson, with shared metadata and separate localized Markdown files:

```text
content/
  lessons/
    number-bonds-to-ten/
      lesson.json
      nb.md
      en.md
      assets/
        ten-frame-example.svg
```

This is an illustrative future layout, not content that already exists. Create directories and assets only when needed by a real lesson. `nb` is the current Norwegian Bokmål working assumption; see the [language scope](../../vision.md#first-release-languages).

| Location | Responsibility |
| --- | --- |
| `lesson.json` | Stable language-neutral lesson ID, version, skill references, prerequisite and related-lesson references where needed, and references to exercise definitions. Store shared metadata once. |
| `nb.md` and `en.md` | Localized title, learning objective, explanations, worked examples, and learner-facing descriptions. |
| `assets/` | Lesson-specific illustrations and diagrams, with localized accessible descriptions in the lesson. Reusable visual behavior belongs in application components. |

The lesson ID is canonical; a translated title or URL must not become its identity. Both languages refer to the same lesson, skills, and practice targets. Language switching must preserve progress and current mathematical state. Translation review must identify changes that affect the other language; the exact revision and compatibility rules remain to be designed.

Organize discovery by mathematical domains, topics, and prerequisite skills. Curriculum, grade, course, and difficulty views refer to the same identities instead of copying lessons into separate folders for each audience. A lesson folder is a storage unit, not a universal mathematics taxonomy.

The metadata fields are proposed responsibilities, not a JSON schema. Before introducing real `lesson.json` files, add the corresponding schema under `schemas/`, require `$schema` as specified by [content guidance](../../../content/AGENTS.md), and extend validation to resolve lesson references. Use actual registered skill and exercise identities rather than deriving them from display titles.

## A small authoring format

Most lesson content should be ordinary Markdown: paragraphs, headings, lists, links, and images. Start with a template containing a learning objective, explanation, worked example, optional visual exploration, and a route to practice. Authors should be able to improve an explanation without editing application code.

For example, a Norwegian lesson could contain:

```markdown
---
title: Tiervenner
objective: Finn tallet som mangler for å få ti.
---

## Hva er tiervenner?

Tiervenner er to tall som til sammen blir ti.
For eksempel er 3 og 7 tiervenner:

3 + 7 = 10

## Se sammenhengen

En tieramme har ti plasser. Når tre plasser er fylt,
er det sju ledige. Tre og sju fyller hele rammen.

:::visual{type="ten-frame-explorer" start="3"}
:::

## Prøv selv

Hvilket tall mangler i 6 + ? = 10?
```

The front matter and visual directive are illustrative proposed syntax. They are not supported by the current content validator or guaranteed to render in a generic Markdown viewer. The final question above is authored prose; collecting and validating a response requires an explicit reference to a supported exercise interaction. Do not infer response handling from arbitrary text.

Keep interactive references small: a known component name and validated parameters. Do not allow arbitrary JavaScript, JSX, executable MDX, or embedded application logic. New visual components require application changes and review; ordinary lesson contributions should use the existing component set.

Choose and document a limited mathematical notation grammar with the pilot. Unsupported notation or malformed directives must produce actionable validation errors, not silently lose mathematical symbols. Prototype lessons can inform the pilot, but their parser quirks and syntax are not a stable standard.

## Visual explanations and practice

Visual components should explain the relationship behind a result, such as three filled and seven empty places making ten. They should support touch on iPads, keyboard operation, and an equivalent textual or non-visual explanation. Meaning must not depend on color alone. Component controls, descriptions, and feedback need both first-release languages.

Reuse the same tested visual components where appropriate in lessons and optional exercise help. A fixed worked example can be authored and reviewed. For generated tasks, prompt values, visual state, solution steps, and answers must agree with the same deterministic mathematical model. Nontrivial mathematical generation and validation belong in C# domain code, not Markdown or UI components.

Lessons can link to authored examples and generated exercise families. After a lesson or practice session, learners can request more practice and adjust challenge within supported variations. Preserve the boundaries for support and independent checks in the [exercise experience](../../design/exercise-experience.md) and the [learning experience](../../design/learning-experience.md#more-practice-and-learner-control).

Reading a lesson is a learning activity, not evidence of mastery by itself. Store reading history, exploration, supported practice, and independent attempts as distinct observations according to the [learning model](../../learning/learning-model.md).

## Build and storage boundaries

The proposed delivery path is:

```text
Reviewed Markdown + metadata + assets
  -> content validation and build
  -> content packaged with the MathKX application
  -> lesson page with optional interactive components and practice links
```

Keep content and translations in Git. Keep mathematical behavior in tested domain code and presentation behavior in reusable application components. Store learner profiles and progress in PostgreSQL under [ADR 0008](../decisions/0008-store-profiles-and-progress-in-postgresql.md), separately from the authored lesson files.

Validated lesson content should ship with the same application deployment. This does not require a runtime Markdown editor, content database, or second service. The precise parser, build output, and rendering mechanism remain pilot decisions. Private assessment solutions must not be bundled into learner-visible lesson content before the assessment policy permits disclosure.

## Making contributions simple

The first implementation should provide:

1. One lesson template and a short guide explaining shared metadata, translations, visual references, and assets.
2. Visible “Suggest an improvement” and “Edit lesson source” links from each lesson. Issue reports must not automatically include private learner data.
3. A documented local preview using the actual MathKX renderer, and a pull-request preview when infrastructure supports it.
4. Automated checks for metadata, unique identities, references, links, required translations, supported mathematical notation, and visual configuration. Add lesson validation to the existing content checks before claiming those checks cover lessons.
5. Human review of mathematical correctness, teaching clarity, translation agreement, and accessibility before publication.

These are acceptance criteria, not existing tooling. Content licensing and review ownership still need to be established. A future browser-based editor could produce changes to these same Git files; it should not create a second authoritative content store.

## Defer Hugo

Do not introduce a separate Hugo learning site for the first implementation. Keeping lessons inside MathKX lets the initial slice prove navigation, visual explanations, practice transitions, language switching, and progress together, with one renderer and deployment to maintain.

Hugo supports [multilingual content](https://gohugo.io/content-management/multilingual/) and [shortcodes](https://gohugo.io/content-management/shortcodes/), so it remains an option for future project documentation or a public reading edition. Reconsider it when there is a concrete publishing need. Any reading edition should reuse the canonical lesson sources, with a build adapter if necessary; the proposed MathKX syntax is not promised to work unchanged in Hugo. Do not maintain duplicate lesson text in two sites.

## Prove the proposal before standardizing

Implement one short lesson in Norwegian and English, one reviewed worked example, one accessible visual model, and a link to a working exercise family. Verify that a contributor can edit, preview, validate, and submit it without changing application logic, and that a learner can switch languages and move into practice without losing work.

Use that slice to settle the metadata schema, Markdown extensions, mathematical notation, translation revision tracking, and rendering details. Record durable architectural choices separately when established; do not treat this proposal as an accepted format specification or create application scaffolding solely to mirror its directory examples.
