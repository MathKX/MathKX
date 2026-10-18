# Learning, exploration, practice, and assessment

MathKX should help learners understand mathematics, experiment with ideas, practice skills, and check their understanding. Explanations and learning material are part of the product alongside exercises and assessment. Contributors must be able to suggest corrections, improve explanations, add examples, and extend content through reviewable source changes.

## Learner purposes

These purposes describe how content is used. They do not require separate applications or separate copies of a skill.

| Purpose | Learner experience | Feedback and evidence |
| --- | --- | --- |
| Learn | Read an explanation, follow a worked example, inspect a diagram, and answer guided questions | Support is available throughout. Opening or completing a lesson is not proof of mastery. |
| Explore | Change values, manipulate a model, make predictions, and observe relationships | Exploration can be ungraded. Actions are not automatically scored as correct or incorrect. |
| Practice | Solve varied tasks with optional hints, feedback, and links back to explanations | Record the response and support used so later evidence interpretation can distinguish supported and independent work. |
| Check understanding | Attempt a clearly scoped self-check or diagnostic set | Explain the allowed support and when feedback appears before starting. A check provides evidence, not a guaranteed diagnosis or mastery judgment. |

Formal examinations, invigilation, certificates, and institutional grading are not established requirements. Assessment here initially means checking understanding to guide learning. The precise assessment policy and mastery algorithm remain undecided.

Learners should be able to request [visual help](exercise-experience.md#visual-help-on-request) during practice and supported self-checks where a model clarifies the task. Independent checks must make any transition to supported work explicit. Teaching support and accessibility accommodations are separate concerns; help use is recorded without automatically treating it as failure.

## Authored and generated content

MathKX supports both reviewed authored material and generated exercise instances. Authors can choose a fixed example or task when its particular values, explanation, dataset, or reasoning matter. They can also define an exercise family whose variations are produced by a named, deterministic generator in tested domain code. Fixed tasks, including investigations and proofs, do not need artificial randomization to be valid content.

For example, a lesson can explain the authored example `4 + 4 = 8`, then offer generated addition questions within a reviewed range. Validation and any supplied hints, explanations, or visual models must match the generated question. Generation does not require AI, and the format must not force authored tasks through a generator.

## More practice and learner control

Learners can always request more practice for supported skills, including after completing a lesson, a practice session, or a self-check. Do not impose a lifetime exercise-count limit or lock practice because a skill is considered mastered. Session lengths can remain bounded; completing a session offers another session rather than making the learner continue indefinitely.

Use clear actions, available in both first-release languages:

| English | Norwegian Bokmål | Behavior |
| --- | --- | --- |
| Another question | En oppgave til | Continue with the selected skill and current challenge settings. |
| More like this | Flere slike oppgaver | Prefer the same task family and comparable challenge, with other values or reviewed examples where available. |
| Make it easier | Gjør det enklere | Request a less demanding supported variation; explain what changes. |
| More challenge | Øk utfordringen | Request a more demanding supported variation; explain what changes. |
| Check my understanding | Sjekk forståelsen min | Start a fresh, bounded self-check with an explicit scope and support policy. |

Unlimited opportunities to practice do not promise infinitely many unique questions. A finite exercise family or authored collection will eventually repeat. Avoid recent repeats where practical, permit deliberate repetition, and explain when the available variants are exhausted. Offer repetition or related practice without silently switching the target skill or inventing unsupported content. An unsupported topic must be identified honestly rather than presented as an available generator.

Recommendations may suggest moving on, revisiting a prerequisite, or taking a break, while leaving the learner in control. Further exercise count alone is not evidence of mastery.

### Adjusting challenge

Learners should be able to increase or decrease challenge during practice. Difficulty is relative to the task and learner, not a universal numbered ladder or a permanent label attached to a person. A change can involve number ranges and types, the number of reasoning steps, representation, unfamiliar context, or the amount of teaching support. Larger numbers alone do not define harder mathematics.

Describe the change concretely, such as “Try addition within ten,” “Try adding across ten,” or “Include negative numbers.” If the change introduces a different objective or prerequisite skill, make that transition visible. Where no appropriate variation exists, explain the limit and offer relevant alternatives rather than generating outside reviewed constraints.

Apply a requested challenge change to the next question by default, preserving the current answer and work. Keep visual help independently available according to the activity's support policy. Keyboard access, screen-reader support, zoom, and other accessibility accommodations must never be removed to increase difficulty.

For a bounded self-check, establish the challenge and support policy before starting. A request to change them should explicitly start a different check or move into practice; it must not silently change what an existing result claims to measure.

Record the actual task features and support used in the attempt context, separately from the learner's request for easier or harder work. That request does not itself establish ability or change mastery. Challenge selection must resolve to reproducible content: do not change generator parameters invisibly under the same definition ID, version, and seed. Exact variant encoding, difficulty calibration, and automatic adaptation remain open implementation decisions.

## Recommended lesson authoring approach

Use version-controlled Markdown for authored explanations and worked examples, with a small metadata contract and controlled references to interactive components and exercise definitions. Render lessons within the MathKX learner experience so the learner can move between explanation, exploration, and practice without losing context.

Markdown is an authoring format; it does not require a separate static site. Explanatory text can be rendered as ordinary pages, while selected parts of a page are interactive. A static reading view could later reuse the same sources if useful. Maintaining two independent versions of a lesson would make corrections and translations harder to keep aligned.

This is a proposed implementation direction. The Markdown dialect, mathematical notation, metadata syntax, component reference syntax, and rendering technology need a small working lesson before they become stable contracts.

The [lesson structure and Markdown proposal](../architecture/proposals/lesson-markdown-and-delivery.md) describes a folder per lesson, shared metadata, localized Markdown, visual references, and the contribution workflow. Show lessons inside MathKX for the first implementation and defer a separate Hugo learning site. Any later reading edition should reuse the same sources.

### Authored material

- Concept explanations, definitions, and reasoning.
- Reviewed worked examples and common mistakes.
- Accessible diagrams, descriptions, and equivalent textual representations.
- Explicit learning objectives, skill references, and prerequisite links.
- Links to related lessons and exercise families.

### Interactive behavior

- Tested visual components such as a number line, fraction model, or coordinate system.
- Generated exercise instances and deterministic answer validation.
- Progressive hints and feedback appropriate to the activity.
- Saved learner progress and, eventually, explainable recommendations about useful next work.

Dynamic behavior does not require generating explanatory prose at runtime. Reviewed authored content can be selected and combined with tested interactive elements. AI-generated teaching material is not adopted by this proposal.

## Boundaries between lessons and application code

Lessons should use stable identities, versions, skill references, and localization boundaries. Exact metadata fields remain open. Course and grade mappings should reference the existing skills and lessons rather than duplicate their content.

The first release requires Norwegian and English versions of every released lesson and its learner-facing dependencies, including exercises, hints, feedback, and accessibility text. Translations share content identities and skill references. Contributors should be able to edit one language without changing mathematical logic; review must identify when a source change requires updates to the other language. Separate localized Markdown files with shared lesson metadata are proposed; the layout and tooling must be proven with the first lesson before becoming stable contracts.

Lesson authors should be able to reference named interactions with validated configuration without writing JavaScript or React. New mathematical behavior belongs in tested domain code, while new presentation behavior belongs in reusable accessible components. Avoid arbitrary executable code in lesson files or a lesson syntax that becomes a programming language.

Generated worked examples must derive their question, solution steps, and explanation values from the same deterministic mathematical model. A fixed worked example can be fully authored and reviewed. Private assessment answers must remain separate from learner-visible content until the assessment policy permits disclosure; practice solutions may be deliberately revealed as support.

Lesson reading history, exploration, guided practice, and independent checks are different observations. They may reference the same skills, but must not be silently treated as equivalent mastery evidence. Session adaptation remains outside lesson content and exercise-definition JSON.

## Example learning journey

For a learner working on square roots:

1. A lesson explains a square root as the side length of a square with a known area.
2. A worked example connects an area of 81 to a side length of 9.
3. An interactive square lets the learner vary the side length and observe the area, with keyboard operation and an equivalent non-visual path.
4. Practice offers new perfect-square values, optional hints, and feedback.
5. A short check offers fresh questions with its support policy stated in advance.
6. The learner can return to the explanation or apply the skill in a Pythagorean theorem task.

This is an illustrative journey, not a required sequence or an adopted automatic routing rule.

## Open contribution workflow

The intended contributor workflow should make small improvements straightforward:

- Every lesson has an identifiable source file and a visible route to suggest a correction or edit that source.
- Educators and learners can submit explanations, examples, accessibility improvements, and translations without changing application code.
- Contributors can report an issue when they do not want to edit files. An issue or pull request is a proposal for review, not an automatic publication.
- A local preview and, when infrastructure supports it, a pull-request preview show the lesson and any referenced interactions.
- Automated checks validate metadata, links, skill and exercise references, mathematical markup, and component configuration. Tests cover generated mathematics and supported interactions.
- Human review checks mathematical correctness, clarity, learning objectives, and accessibility. Syntax validation alone does not establish teaching quality.
- Public issue reports must not automatically include profile identifiers, learning history, recovery email, or other private learner data. Reproducible exercise reports can use definition/version/seed details without identifying the learner.

Contribution templates, content licensing, translation workflow, review ownership, and preview tooling still need to be established. The repository should provide these as real lesson contributions begin; this document does not imply they are already available.

## First implementation

Prove the proposed approach with one short lesson for the initial skill, one reviewed worked example, and a reference to a working exercise family. Add a narrow interactive example as the relevant component becomes available. Verify that another contributor can find the source, edit the explanation, preview it, and submit a reviewable change without modifying application logic.

Deliver this first learning slice in both Norwegian and English. Check translation completeness, mathematical agreement, localized number display and answer parsing, accessible labels, and language switching without losing the current work or progress. Required translations must be checked before release rather than silently replaced by the other language.

See the [exercise experience](exercise-experience.md), [learning model](../learning/learning-model.md), [exercise capability model](../architecture/exercise-capability-model.md), and [content guidance](../../content/AGENTS.md) for the supporting boundaries.
