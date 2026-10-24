# Feature Specification: Lesson Rendering and the Detour Back to an Exercise

**Feature Branch**: not created yet (spec directory `specs/003-lesson-rendering/`; Spec Kit treats the two as independent)

**Created**: 2026-10-24

**Status**: Draft

**Input**: User description: "Spec 003 (decision-log feature F5): lesson rendering and the detour back to an exercise. Render the pilot lesson's Markdown body (headings, objective, GFM tables, notation, directives such as :::practice and visual components like the ten-frame explorer) in the learner app in nb and en, and let a learner leave a practice question for the related lesson and return to the same question with its draft and help state intact. Follow DL-026 (2): a lesson "shows the answer" only when it contains this instance's result or a worked visual for the same values. Builds on spec 001's content contract (DL-033 directive and reference contract) and spec 002's practice flow."

## Sources this specification depends on

Per the constitution's specification rules, this feature restates existing decisions and creates no new requirement. It replaces the lesson-page stub that spec 002 left in place (its Assumptions: title, objective, and practice entries only) with the real lesson, and it makes the lesson link in practice honest about answer reveals.

- **Decision-log rows**: DL-017 (canonical lesson ID equal to the folder name; anchors identical across languages; prose and directive order may differ), DL-019 ("Lesson viewed" is truthful and needs no compulsory scrolling or clicking; its history view is F6), DL-020 (every learner-visible and accessible text localized; supported notation declared and unsupported notation rejected visibly), DL-026 (2) (a lesson shows the answer only when it contains this instance's result or a worked visual for the same values; the learner is told first and may choose visual help instead) and (4) (an unanswered question stays resumable with its draft and support context), DL-029 (help-first outcome precedence; a lesson reveal is a reveal), DL-032 (feedback implied by an incorrect result in practice), DL-033 (the `:::visual`, `:::example`, `:::practice` directive contract, notation grammar, front matter, and GFM delimiter rule), DL-035 (accessible names never reveal a total before it is shown), DL-038 (dictionary parity and learner-visible literal checks in CI). Feature verdict F5: "specify with corrections", condition DL-033, which spec 001 implemented.
- **Documents**: the [lesson structure and delivery proposal](../../docs/architecture/proposals/lesson-markdown-and-delivery.md) (one source, rendered inside MathKX; "Visual explanations and practice"; "Making contributions simple" items 1 to 4); [learning experience](../../docs/design/learning-experience.md) "Recommended lesson authoring approach", "Boundaries between lessons and application code", "Open contribution workflow", "First implementation"; [exercise experience](../../docs/design/exercise-experience.md) "Explaining why the result follows" (the lesson-from-exercise rule) and "Accessibility and implementation boundaries"; [mastery](../../docs/learning/mastery.md) "Progress tracking before a mastery algorithm" (reading a lesson is not mastery evidence); the [corrections addendum](../../docs/reviews/round-01/claude-fable/revised-build-brief-corrections.md) §D row 6 (lesson rendering with a standard parser plus the three directives) and §E (`lesson-opened`, `lesson-reveal`, and the outcome table); the revised build brief §7 line 1 (bilingual walkthrough); ADR 0003, 0005, 0007.
- **Content contract**: [spec 001](../001-pilot-content-contract/spec.md) and its [directives and notation contract](../001-pilot-content-contract/contracts/directives-and-notation.md), which this feature's renderer implements as written; the registered visual components `ten-frame-explorer`, `groups`, and `make-ten`; the lesson `content/lessons/number-bonds-to-ten/`.
- **Practice flow**: [spec 002](../002-practice-flow/spec.md), whose question identity, privacy rule (FR-009), step models for `groups` and `make-ten`, session record, and outcome derivation this feature reuses unchanged.
- **Evidence**: the round-04 verification reports (Claude evidence `09-lesson-detour-banner-en-820.png`; the codex and gemini-argon reports) and the [spec 002 bilingual walkthrough](../../docs/reviews/walkthroughs/2026-10-24-practice-flow-bilingual.md), whose line 1 is "partial" until this feature lands.

## Clarifications

### Session 2026-10-24

- Q: When a learner reaches the related lesson by another route (the lesson list) while a question is unanswered, is that a detour from the exercise, or ordinary reading not recorded against the question? → A: Any route counts: it is a detour with the same notice and recording (FR-015). This keeps the record honest when the learner does not use the question's own lesson link.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A learner reads the lesson in their language (Priority: P1)

A learner, as a guest in Norwegian Bokmål or English, opens the number-bonds lesson and reads all of it in the app: the title and objective, the section headings, the explanation with its emphasis, the illustration with its description, the table of all six pairs, the mathematics written in the lesson, the worked example for `8 + 5`, and the "Try it in your head" list. Every part reads in the selected language; switching language keeps them in the same section of the lesson.

**Why this priority**: The first deliverable in the addendum is "one bilingual lesson rendered by the real app". Without the body, the lesson page is a stub and the walkthrough's first line cannot pass.

**Independent Test**: A tester opens the lesson in each language and compares the screen with the source file section by section; every heading, paragraph, list, table row, expression, image description, and example appears, with nothing dropped; switching language with the "Why is this useful?" section in view keeps that section in view.

**Acceptance Scenarios**:

1. **Given** the lesson in English, **When** it opens, **Then** the title "Number bonds to ten", the objective, and the six sections appear in the source order with their headings, and each section can be linked to directly by its anchor (`#what`, `#pairs`, `#ten-frame`, `#why`, `#try`, `#practice`).
2. **Given** the table of pairs, **When** it is shown, **Then** it is a table with a header row and six rows, each sum written as mathematics, and a screen reader announces it as a table with its column headers.
3. **Given** the expressions `$3 + 7 = 10$` and `$$8 + 5 = 8 + 2 + 3 = 10 + 3 = 13$$`, **When** they are shown, **Then** they read as mathematics, inline and as a display line respectively, with the minus and multiplication signs and the decimal mark as authored, and a screen reader reads them as mathematics in the selected language.
4. **Given** the illustration of a ten-frame with 3 and 7, **When** it is shown, **Then** it carries the selected language's description from the source as its text alternative.
5. **Given** the worked example "Worked example: 8 + 5", **When** it is shown, **Then** it appears as a distinct, titled block with its numbered steps and its display line, linkable by its id.
6. **Given** the lesson in Norwegian scrolled to "Hvorfor er det nyttig?", **When** the learner switches to English, **Then** the English lesson is shown at "Why is this useful?" and nothing the learner was doing elsewhere in the app is lost.

---

### User Story 2 - A learner leaves a question for the lesson and comes back to it (Priority: P1)

While practising, a learner is unsure and opens the lesson from the question. If the lesson shows the answer to this very question, the learner is told so before it opens and can choose to open it anyway, to see visual help instead, or to stay. In the lesson, a clear "Back to your question" control is always at hand. Returning brings back the same question with the typed draft, the open help and its step, and any pending challenge change, exactly as they were. The record says honestly what happened: reading a lesson that does not show the answer is help; reading one that does is an answer reveal.

**Why this priority**: This is the second half of F5 and the reason the lesson lives inside the app: moving between practice and explanation without losing work, while keeping the record truthful (DL-026). Today the lesson link always records plain "lesson opened", even for a question the lesson answers.

**Independent Test**: A scripted session answers three questions after a lesson detour: `6 + 5` (lesson does not show the answer), `8 + 5` (lesson shows it in the worked example and the make-ten visual), and `3 + 7` (lesson shows it in the table); each detour returns to the same question with its draft and help state, and the record shows "Correct with help", "Answered after the answer was shown", and "Answered after the answer was shown" respectively, each with the matching tag.

**Acceptance Scenarios**:

1. **Given** an unanswered question `6 + 5` with draft `1` and help open at its second step, **When** the learner opens the lesson, **Then** the lesson opens without a warning (it mentions `6 + 5` but not its result), a lesson opening is recorded for this question, and "Back to your question" is shown on the lesson.
2. **Given** that detour, **When** the learner chooses "Back to your question", **Then** the practice screen shows `6 + 5` with draft `1` and help open at the same step; **When** the learner then answers `11`, **Then** the outcome is "Correct with help" with the tag "Lesson opened".
3. **Given** an unanswered question `8 + 5`, **When** the learner asks for the lesson, **Then** before anything of the lesson is shown the learner is told, in the selected language, that the lesson shows the answer to `8 + 5`, and is offered "Open the lesson anyway", "Show visual help instead", and "Cancel".
4. **Given** that notice, **When** the learner chooses "Show visual help instead", **Then** the lesson does not open, visual help for `8 + 5` opens on the practice screen, and no lesson event is recorded; **When** the learner chooses "Cancel", **Then** nothing changes and nothing is recorded.
5. **Given** that notice, **When** the learner chooses "Open the lesson anyway", **Then** the lesson opens, a lesson reveal is recorded for this question once the lesson is shown, and after returning a correct `13` gives "Answered after the answer was shown" with the tag "Answer shown in the lesson".
6. **Given** an unanswered question `3 + 7` or `7 + 3`, **When** the learner asks for the lesson, **Then** the notice is shown, because the lesson's table contains `3 + 7 = 10` (order of the addends does not matter, as the prototype rule settled and DL-026 confirmed).
7. **Given** a question already answered correctly, **When** the learner opens the lesson from the question, **Then** no notice is shown, the opening is recorded as later support, the outcome does not change, and the record shows the tag "Lesson opened after answering".
8. **Given** a detour in progress, **When** the learner uses the browser's back action instead of "Back to your question", **Then** the result is the same: the question, draft, and help state are as they were.
9. **Given** a detour, **When** the learner instead leaves the lesson for somewhere else in the app, **Then** the question stays resumable with its draft and support context (DL-026 (4)) and "Back to your question" is offered again the next time the learner opens that lesson while the question is unanswered.
10. **Given** an unanswered question `8 + 5`, **When** the learner leaves practice and opens the number-bonds lesson from the lesson list instead of the question's link, **Then** the same notice is shown before the lesson opens, the same choices are offered and recorded, and "Back to your question" is shown if the lesson opens.
11. **Given** no question in progress, or a question already answered correctly, **When** the learner opens the lesson from the lesson list, **Then** the lesson opens without a notice and nothing is recorded against a question.

---

### User Story 3 - A learner explores the lesson's visual models (Priority: P2)

In the lesson, the learner uses the ten-frame explorer to choose a number and see its partner to ten, and steps through the make-ten model for `8 + 5` one step at a time, with the picture, the expression, and the sentence showing the same step. Both work by touch, keyboard, and screen reader, and both are in the selected language.

**Why this priority**: Visual explanation is part of the learning model, not decoration, and the lesson names these two components; but the text, tables, and practice entries already teach the concept without them, so they follow the reading and the detour.

**Independent Test**: A tester sets the explorer to every value from 0 to 10 by keyboard and by touch and hears the filled count and the partner; steps the make-ten model forward and back by keyboard; and confirms that the model's steps and values match the practice flow's explanation for the question `8 + 5`.

**Acceptance Scenarios**:

1. **Given** the ten-frame explorer with `start="3"`, **When** the lesson opens, **Then** the frame shows 3 filled and 7 empty places with a text that states both numbers in the selected language.
2. **Given** the explorer, **When** the learner chooses another number by keyboard or touch, **Then** the frame and the text change together, and a screen reader announces the new pair once, without announcing every intermediate value.
3. **Given** the make-ten model for `8 + 5`, **When** the learner steps through it, **Then** each step shows the picture, the expression, and a sentence for that step, the last step reaching `10 + 3 = 13`; stepping back and forward works by keyboard and touch; motion has a stepped equivalent and respects reduced motion.
4. **Given** the make-ten model in the lesson and the worked explanation for the question `8 + 5` in practice, **When** their steps are compared, **Then** they show the same quantities in the same order, because both come from the same tested mathematical model.

---

### User Story 4 - A learner starts practice from the place in the lesson that names it (Priority: P2)

The "Practise" section of the lesson shows each practice entry where the author placed it, with the entry's one-sentence description in the selected language. Choosing one starts practice on that variation, as the stub page does today. The practice screen's lesson link leads back to this lesson.

**Why this priority**: The route from reading to practice is the lesson's purpose; the stub already provides it, so this story moves it into the authored body and removes the stub's hard-coded link back.

**Independent Test**: Both practice entries in the lesson body start practice on their definitions in both languages; from practice, the lesson link opens this lesson; a definition that no lesson lists offers no lesson link.

**Acceptance Scenarios**:

1. **Given** the lesson's `:::practice` directives for `within-10` and `crossing-ten`, **When** the "Practise" section is shown, **Then** each appears as a practice entry with that definition's ladder description in the selected language, in the order the language file places them.
2. **Given** a practice entry, **When** the learner chooses it, **Then** practice starts on that definition and version, with the behaviour spec 002 defines for an explicit choice: a question in progress on the same variation is kept; one on another variation is replaced, and closed as "Skipped" if it had no mathematical submission.
3. **Given** a question from a definition that this lesson lists among its practice entries, **When** the practice screen shows its lesson link, **Then** the link leads to this lesson; **Given** a definition that no lesson lists, **Then** no lesson link is shown.

---

### User Story 5 - A contributor can find, preview, and propose a change to the lesson (Priority: P3)

A teacher or translator reading the lesson sees "Edit this lesson" and "Suggest an improvement". The first opens the source file for the language they are reading in the project's public repository; the second starts a public issue that names the lesson, its version, the language, and the section, and nothing about the learner. A contributor who changes the source can preview it locally with the real renderer, and the content checks tell them about any mistake before review.

**Why this priority**: Open contribution is a product principle and an acceptance criterion of the lesson proposal, but it does not block a learner using the lesson; it is cheap once the renderer exists.

**Independent Test**: From the English lesson, "Edit this lesson" opens `content/lessons/number-bonds-to-ten/en.md` in the repository; "Suggest an improvement" prepares an issue whose text contains the lesson ID, version, `en`, and the current section anchor and no record, draft, question, or browser identifier; a contributor follows the documented preview steps, edits a sentence, and sees it in the app.

**Acceptance Scenarios**:

1. **Given** the lesson in Norwegian, **When** the learner chooses "Edit this lesson", **Then** the Norwegian source file opens in the public repository in a new browsing context.
2. **Given** a question in progress and a session record, **When** the learner chooses "Suggest an improvement", **Then** the prepared issue contains only the lesson identity, version, language, and section, and no learner data (learning-experience "Open contribution workflow").
3. **Given** the documented local preview, **When** a contributor changes a sentence in `en.md` and reloads, **Then** the change appears in the app without any change to application code.

---

### Edge Cases

- The lesson mentions the question without its result (`$9 + 4$: 9 needs 1 … That makes $10 + 3$`): not an answer reveal; the opening is recorded as help.
- The lesson contains the commuted form of the question with its result (`$3 + 7 = 10$` for the question `7 + 3`): an answer reveal (prototype rule, confirmed by DL-026).
- The ten-frame explorer can show any pair to ten the learner chooses: it is an exploration, not a worked visual for the question's values, and opening a lesson that contains it is help, not a reveal.
- A `make-ten` or `groups` visual in the lesson has the same values as the question: an answer reveal, because stepping through it reaches the total.
- The question is the fixed task (`4 + 4`): no lesson lists it among its practice entries, so no lesson link is offered (FR-010); if a lesson listed it, the same rule would apply to its values.
- The learner opens the lesson, does not read it, and returns at once: the opening is still recorded (reading is not measured, DL-019); the notice and the record do not depend on time spent or scrolling.
- The learner chooses "Open the lesson anyway", but the lesson cannot be loaded or the learner leaves before it appears: nothing of the lesson was shown, so no reveal and no opening is recorded (a record follows what was presented, as spec 002 records steps); the learner is told the lesson could not be loaded and returns to the question.
- The lesson cannot be loaded at all: the learner sees a message in the selected language and a way back to the question; the question and its draft are untouched and nothing is recorded against it.
- The learner switches language during a detour: the lesson changes language at the same section, "Back to your question" stays, and the question, draft, and help state are unchanged.
- The learner opens the lesson twice for the same unanswered question: two openings are recorded; whether the notice appears again follows the same rule each time.
- A lesson section is reached by an anchor that does not exist in the language just selected: impossible for merged content (spec 001 requires identical anchor sets); the renderer falls back to the top of the lesson rather than failing.
- The renderer meets an element it cannot show (a directive or component it does not know, notation outside the grammar): impossible for merged content because the content checks refuse it; at runtime it shows a visible placeholder in the selected language and never drops mathematics silently.
- Browser storage is unavailable: the detour still works within the visit; on reload the question is not resumable, as spec 002 already states for the record.

## Requirements *(mandatory)*

### Functional Requirements

**Rendering the lesson**

- **FR-001**: The lesson page MUST render the selected language's lesson file in full: front-matter title and objective, headings at levels 2 and 3 with their authored anchors as linkable targets, paragraphs, emphasis, lists (ordered and unordered), links, images with their alternative text, and GFM tables with header rows, in source order. Nothing in the source may be omitted without a visible placeholder.
- **FR-002**: Inline `$…$` and display `$$…$$` mathematics MUST be rendered as mathematics, inline and on its own line respectively, for every form the pilot notation grammar accepts (spec 001 contract), preserving the authored decimal mark, signs, and operand order, and MUST be readable by a screen reader in the selected language.
- **FR-003**: The three pilot directives MUST render as the contract defines: `:::example` as a distinct block with its localized title, its Markdown body, and its `id` as a linkable anchor; `:::visual` as the registered component of that `type` with the authored attributes; `:::practice` as a practice entry for that definition and version (FR-016). Directive attributes MUST be used as validated by spec 001 and never interpreted as code.
- **FR-004**: Lesson images MUST be served from the lesson's `assets/` folder and show the selected language's alternative text.
- **FR-005**: Switching language on a lesson MUST show the other language's file at the same section (by anchor), and MUST preserve everything spec 002 preserves (question, draft, help state, pending change, record).
- **FR-006**: The lesson content the app renders MUST be the files under `content/lessons/` as validated by spec 001, delivered with the application; a contributor's change to a lesson file MUST appear in the app without a change to application code.

**Visual components in lessons**

- **FR-007**: The `ten-frame-explorer` MUST show a ten-frame with the chosen number filled and the rest empty, starting at the authored `start`, let the learner choose any value from 0 to 10 by touch and by keyboard, and state the chosen number and its partner to ten in text in the selected language; a screen reader MUST hear the settled pair once per change.
- **FR-008**: The `make-ten` and `groups` lesson visuals MUST step through the same tested step models that spec 002 uses for help and explanation, for the authored values, with picture, expression, and sentence in agreement at every step; stepping MUST work forward and back by keyboard and touch, with a stepped equivalent to any motion and reduced motion respected.
- **FR-009**: Every component control, description, and announcement MUST exist in both languages, and no accessible name or announcement may state a result before the visual shows it (DL-035).

**The lesson from an exercise**

- **FR-010**: The practice screen MUST offer the lesson that lists the question's definition among its practice entries (when several do, the one the learner started practice from); when no lesson lists it, no lesson link is shown.
- **FR-011**: Whether a lesson shows the answer to a question MUST be decided by DL-026 (2) as the prototype rule settled it: the lesson discloses when, in any language file, (a) a mathematics expression begins with the question's addends in either order and ends with its result, or (b) a `make-ten` or `groups` visual has the question's values (either order); otherwise it does not. The decision MUST be identical in both languages, MUST be made by tested mathematics code covered by fixtures for every pilot instance, and MUST NOT require giving the learner's browser the answer to make it.
- **FR-012**: When a learner opens a disclosing lesson while its question is unanswered (by any route, FR-015), the app MUST first tell them, in the selected language, that the lesson shows the answer to this question, and offer "Open the lesson anyway", "Show visual help instead" (when the question has visual help), and "Cancel". Nothing of the lesson's content may be shown or announced before the learner chooses to open it, and the app MUST NOT fetch the lesson for the detour before then. "Open the lesson anyway" records `lesson-reveal` once the lesson is shown to the learner, and nothing if it is never shown (the load fails or the learner leaves first); "Show visual help instead" opens visual help and records only what visual help records; "Cancel" records nothing.
- **FR-013**: Opening a non-disclosing lesson from an unanswered question MUST record `lesson-opened` for that delivery once the lesson is shown; opening the question's lesson from the question after its first correct submission MUST record `lesson-opened` as later support that never changes the outcome. The outcome derivation MUST follow spec 002 unchanged: `lesson-opened` before the first correct answer gives "Correct with help" unless a reveal also happened, and `lesson-reveal` gives "Answered after the answer was shown" (DL-029). The tag set MUST gain one tag, `lessonAfter` ("Lesson opened after answering" / "Leksjon åpnet etter svaret"), derived from `lesson-opened` after the first correct submission, as addendum §E requires a tag for support after answering; spec 002's observation contract, the dictionaries, and the derivation tests are updated with it.
- **FR-014**: While a detour is in progress, the lesson MUST show "Back to your question" with the question's expression (never its result), and returning by that control or by the browser's back action MUST restore the question, draft, help state and step, explanation state and step, and pending challenge change exactly. The learner MAY dismiss the control; the question then stays resumable as spec 002 FR-017 defines.
- **FR-015**: Reaching a lesson by any route (the question's lesson link, the lesson list, a direct address, or the browser's history) while the question in progress is unanswered and its definition is among that lesson's practice entries MUST be treated as a detour from that question: the same notice (FR-012), the same recording (FR-012, FR-013), and the same way back (FR-014). A question left through a lesson and not returned to MUST remain resumable with its draft and support context (DL-026 (4)). Reaching a lesson that does not list the question's definition, or reaching any lesson with no unanswered question in progress, is ordinary reading and records nothing against a question.

**Practice entries and contribution**

- **FR-016**: Each `:::practice` directive MUST render where the language file places it as a practice entry showing the ladder description of that definition and version in the selected language, and choosing it MUST start practice on that definition with spec 002's behaviour for an explicit choice unchanged: a question in progress on another variation is replaced (closed as skipped when it has no mathematical submission); this feature adds no second resumable question.
- **FR-017**: The lesson MUST show "Edit this lesson", opening the selected language's source file in the project's public repository, and "Suggest an improvement", preparing a public issue that contains the lesson ID, version, language, and current section and no learner data (no record, question, draft, or identifier).
- **FR-018**: The repository MUST document how a contributor previews a lesson locally with the app's own renderer.

**Recording, languages, accessibility, and quality**

- **FR-019**: Reading a lesson MUST NOT be recorded as mastery evidence; apart from the detour events in FR-012 and FR-013, this feature records no lesson reading, scrolling, or exploration (the "Lesson viewed" history is F6).
- **FR-020**: Every learner-visible string this feature adds MUST come from the app's dictionaries in both languages or from the bilingual content, and MUST pass the dictionary-parity and literal checks of DL-038.
- **FR-021**: The lesson page MUST be operable and readable by keyboard and screen reader: a correct heading order, a skip route to the main content, visible focus, tables with header cells, images with text alternatives, components with equivalent non-visual operation, and interactive controls of at least 44 by 44 on touch screens.
- **FR-022**: Every requirement above MUST be covered by automated tests in continuous integration: rendering tests that compare the rendered lesson with its source in both languages, disclosure fixtures for every pilot instance a lesson can be opened from (within ten and crossing ten), component tests for the explorer and the step visuals, state-preservation tests for the detour (by the question's lesson link and by the lesson list) and the language switch, privacy tests that a disclosing lesson is neither shown nor fetched for a detour before the learner confirms, derivation tests for the new `lessonAfter` tag and for a confirmed lesson that is never shown, and end-to-end checks of the detour on desktop and iPad viewports.

### Key Entities

- **Lesson**: the canonical lesson (ID, version, skills, practice entries, visuals) and its two language files (title, objective, body with sections and directives), as defined by spec 001.
- **Lesson section**: a heading with its anchor; the unit by which language switching and "Suggest an improvement" locate the learner.
- **Lesson visual**: a registered component placed by a directive with validated attributes; for `make-ten` and `groups`, a sequence of steps from the shared mathematical model.
- **Disclosure decision**: for a (lesson, question identity) pair, whether the lesson shows the answer, and where (an expression or a visual); language-independent.
- **Detour**: the link from a lesson visit back to an unanswered delivery: the delivery, the question's expression, and the support context to restore.
- **Lesson support event**: `lesson-opened` or `lesson-reveal` on a delivery, as spec 002's session record defines.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In both languages, 100 percent of the pilot lesson's headings, paragraphs, list items, table cells, expressions, images, examples, visuals, and practice entries appear on the lesson page, checked by an automated comparison with the source files.
- **SC-002**: For 100 percent of the pilot instances a lesson can be opened from (all 45 within-ten pairs and all 36 crossing-ten pairs), the disclosure decision matches the DL-026 rule in fixtures, and is the same in both languages.
- **SC-003**: In 100 percent of detour tests, returning restores the question, draft, help and explanation state, and pending change exactly, by the return control and by the browser's back action, in both languages and after a language switch during the detour.
- **SC-004**: No disclosing lesson is shown, announced, or fetched for a detour before the learner confirms, in 100 percent of privacy tests; every disclosing lesson that is shown produces "Answered after the answer was shown", a confirmation whose lesson is never shown records nothing, and every non-disclosing detour followed by a correct answer produces "Correct with help".
- **SC-005**: Line 1 of the bilingual walkthrough (revised brief §7: headings, objective, table, and components read in the selected language) passes in both languages, closing the "partial" result recorded for spec 002.
- **SC-006**: A keyboard-only tester reads the lesson, uses both visuals, opens the lesson from a question, and returns without a pointer; a screen-reader check finds every table, image, expression, and control named in the selected language.
- **SC-007**: A contributor who has not seen the code changes a sentence in one language file, previews it locally, and has the content checks pass, in under 15 minutes following the documentation (first recorded contributor check; findings recorded, not scored).
- **SC-008**: Continuous integration still finishes in under 10 minutes with this feature's tests added.

## Assumptions

- Scope: decision-log F5 for the pilot lesson only, as the owner described. The "Lesson viewed" history, the progress view across lessons and skills, and replay of recorded deliveries stay in F6 (spec 004); repeat avoidance and further session controls in F7 (spec 005); lesson-based self-checks in F8. The renderer supports exactly the pilot contract (`0.1-pilot`); new directives, components, or notation are content-contract changes in a later feature.
- The disclosure rule is the prototype's `lessonDisclosure` for addition, which DL-026 confirmed as a production rule: commuted addends count; an expression that names the question without its result does not; the ten-frame explorer never discloses. Lessons for other kinds of question (equations in milestone two) extend the rule then.
- The lesson opens at its top on a detour; linking a question to a particular section is not part of the pilot contract and would need a content field.
- The detour state is kept in the same browser session record as spec 002's practice state; no server-side storage is introduced, and the service stays stateless.
- "Edit this lesson" and "Suggest an improvement" link to the public GitHub repository of the project; a pull-request preview is deferred until infrastructure supports it (lesson proposal item 3).
- The pilot lesson's authored worked example and its `make-ten` visual already agree with the domain's step model for `8 + 5`; if a test shows otherwise, the content is corrected through content review, not the model.
- Dependencies: spec 001 (content contract and validator) and spec 002 (practice flow, step models, session record) merged; ADR 0011 accepted; CI running the content, domain, service, and learner-app checks.
