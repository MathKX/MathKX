# Feature Specification: Practice Flow with Help-First Feedback

**Feature Branch**: `claude/project-analysis-recommendations-5d72c1` (spec directory `specs/002-practice-flow/`; Spec Kit treats the two as independent)

**Created**: 2026-10-23

**Status**: Draft

**Input**: User description: "Spec 002, the practice flow: features F2, F3, and F4 from the decision log. A learner opens the number-bonds lesson, starts practice on the addition skill, receives generated addition questions from the registered addition-pair generator at (definition id, version, seed), answers with an integer, gets help-first visual feedback (groups and make-ten representations) and misconception-coded feedback per DL-029, moves along the skill's challenge ladder with "Make it easier" and "More challenge", and sees honest progress without mastery percentages, as a guest in the browser. This feature establishes the ASP.NET Core thin API and C# mathematics domain under src/backend and the React + TypeScript app with Designsystemet and Tailwind under src/web, consuming the content from spec 001."

## Sources this specification depends on

Per the constitution's specification rules, this feature restates existing decisions and creates no new requirement. It is the first feature that creates application code, which the constitution's constraints and ADR 0007 and DL-005 already place: a mathematics domain with a thin service in front of it, and a web learner app. This specification names those homes only in the Assumptions; the requirements below are stated in terms of what the learner and the maintainer observe.

- **Decision-log rows**: DL-004 (skills `numbers.number-bonds-to-ten` and `numbers.addition-within-20`), DL-005 (mathematics runs in a tested domain behind a thin service; the learner app renders), DL-006 (addition first), DL-009 (definitions bound to what their help can show; boundary fixtures `4 + 4`, `9 + 9`, `19 + 1`), DL-010 and DL-015 (progress derived from ordered result and support events; summaries are counts), DL-014 (two definitions: within ten, crossing ten), DL-018 and DL-024 (SplitMix64 random source with the proposal's fixtures; the ADR follows once the fixtures pass), DL-026 (counting the last counter is a reveal; "More like this" keeps the variation; finishing keeps an unanswered question resumable), DL-029 (help-first outcome precedence), DL-032 (feedback implied by an incorrect result in practice), DL-034 (draw order, bounded generation, golden seeds, representation agreement, replay across generator versions specified before a generator ships), DL-035 (accessible names never reveal the total before it is shown), DL-038 (dictionary parity and learner-visible literal checks in CI).
- **Documents**: [exercise capability model](../../docs/architecture/exercise-capability-model.md) sections 6 (generation, reproducibility envelope, hazards) and 7 (validation classes and result contract); [learning experience](../../docs/design/learning-experience.md) "More practice and learner control" and "Adjusting challenge"; [exercise experience](../../docs/design/exercise-experience.md) "Visual help on request", "Addition example", "Explaining why the result follows", "Accessibility and implementation boundaries"; [mastery](../../docs/learning/mastery.md) "Progress tracking before a mastery algorithm" and "Learner-facing summaries"; the [revised build brief](../../docs/reviews/round-01/claude-fable/revised-build-brief.md) §4 and its [corrections addendum](../../docs/reviews/round-01/claude-fable/revised-build-brief-corrections.md) §D (first deliverable, identity and challenge changes) and §E (statuses, observation per delivery, outcome of a delivery); the [seed and random-source proposal](../../docs/architecture/proposals/seed-and-random-source.md) (test vectors, bounded sampling, prohibitions); ADR 0003, 0004, 0005, 0006, 0007.
- **Content**: the registries, definitions, skills, and lesson delivered by [spec 001](../001-pilot-content-contract/spec.md). The generator `addition-pair@1`, the validator `integer-answer@1`, the representations `groups` and `make-ten`, and the five `add.*` misconception codes registered there are what this feature implements in code; the domain tests assert the code matches the registry.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A learner practises addition with help before answering (Priority: P1)

A learner, working as a guest in the browser in Norwegian Bokmål or English, opens the number-bonds lesson, chooses its practice entry for addition within ten, and sees a generated question such as `4 + 4 = ?`. They can enter the answer at once, or first ask for visual help and see two labelled groups of counters they can count. They answer with a whole number. A correct answer is confirmed with the completed equation. An incorrect answer gets feedback that names the likely slip (one group counted, digits written next to each other, off by one, subtracted, or a general prompt) and invites them to change the answer and check again. Unreadable input gets input guidance and is never treated as a wrong answer. They ask for another question and continue.

**Why this priority**: This is the first learner-visible loop of the product: real generated mathematics, help offered before failure, and feedback that teaches. Everything else in the milestone builds on it.

**Independent Test**: A tester opens the lesson's practice entry, answers three questions (one correct at once, one incorrect then corrected, one after opening visual help), switches language mid-question, and sees the question, their typed answer, and the opened help preserved; every result wording matches the authored text in the active language.

**Acceptance Scenarios**:

1. **Given** the practice screen for `within-10`, **When** a question is shown, **Then** it presents the expression, an answer field, a submit action, and a "Show visual help" action, and no total is visible or announced anywhere.
2. **Given** a question `4 + 4`, **When** the learner enters `8` and submits, **Then** the result reads as correct with the completed equation `4 + 4 = 8`.
3. **Given** a question `3 + 5`, **When** the learner enters `3` and submits, **Then** the result is incorrect with the "one group" feedback text in the active language, the entered answer stays editable, and submitting `8` afterwards reads as correct.
4. **Given** a question, **When** the learner enters `abc`, nothing, or `7,5`, **Then** input guidance explains what was expected, nothing is recorded as a mathematical attempt, and the learner can submit again.
5. **Given** a question, **When** the learner opens visual help before answering, **Then** two labelled groups of counters matching the operands appear with the question "How many altogether?", the answer field keeps any typed value, and the total is not shown; **When** a guided step counts the last counter, **Then** the learner is told the answer has been shown.
6. **Given** a correct answer, **When** the learner asks for another question, **Then** a new question from the same definition appears with a fresh seed, and the previous question's result is kept in the session record.
7. **Given** a question in progress with help open and a typed draft, **When** the learner switches language or the window is resized, **Then** the same question, the draft, and the help state remain.
8. **Given** an incorrect answer to `8 + 5`, **When** the learner opens the worked explanation and steps to the one that shows `13`, then enters `13`, **Then** the result is correct and the delivery's outcome is "Answered after the answer was shown"; **When** instead the learner opens the explanation only after answering correctly, **Then** the outcome is unchanged and the later explanation is a tag.

---

### User Story 2 - A maintainer can reproduce any question exactly (Priority: P1)

A maintainer or tester takes the identity of any delivered question, the definition ID, its version, and the seed, and obtains the identical question again: in the other language, after the learner has changed challenge level and come back, after the service has been restarted, and after a newer generator version exists. The answer and the feedback for a given input are also identical. Nothing a learner receives unsolicited contains the answer: a question, a lesson, a skill, a non-revealing step, or an incorrect or invalid result never carries it, and only a correct submission or a revealing step the learner explicitly advanced to shows it.

**Why this priority**: Reproducibility is the trust contract of the whole platform (ADR 0004) and the precondition for honest progress records and for later re-validation of guest work; the capability model requires it to be proved with fixtures before a generator ships (DL-034).

**Independent Test**: An automated suite resolves `(numbers.addition.crossing-ten, 1, seed 42)` in four conditions (Norwegian, English, after two "Make it easier" moves and return, with a hypothetical generator version 2 registered) and asserts identical operands; a second fixture shows that a definition pinned to version 2 yields different operands for the same seed while version 1 definitions are unchanged; a contract test asserts the answer never appears in a question, lesson, or skill response, a non-revealing step, or an incorrect or invalid result, and that a revealing step is delivered only when explicitly requested.

**Acceptance Scenarios**:

1. **Given** a definition, version, and seed, **When** the question is requested twice, **Then** both deliveries carry the same operands, the same representation, and the same generator and validator versions.
2. **Given** the random-source proposal's published test vectors, **When** the implementation is run on them, **Then** every raw, bounded, and rejection-sampling vector matches, and invalid seeds and bounds are rejected as the proposal states.
3. **Given** a definition's parameter bounds, **When** many seeds are drawn, **Then** every instance lies within the bounds, every operand pair is representable by every representation the definition lists, and the boundary values `4 + 4` and `9 + 9` resolve while `19 + 1` cannot occur under any pilot definition.
4. **Given** a delivered question, **When** its data is inspected as the learner's browser receives it, **Then** it contains the operands, the identity, the available representations, and the versions, and never the sum or any validation data.
5. **Given** the same identity and the same submitted answer, **When** validation runs twice, **Then** the typed results are identical, including the misconception code.

---

### User Story 3 - A learner moves along the challenge ladder (Priority: P2)

While practising, the learner can ask for easier or harder work. "Make it easier" and "More challenge" move to the adjacent definition in the addition skill's ladder (within ten, crossing ten), apply to the next question, show that definition's one-sentence description, and keep the current question, draft, and help untouched. At either end, the app says honestly that no easier or harder variation exists yet. Crossing-ten questions offer the make-ten visual help instead of counters.

**Why this priority**: Learner control over challenge is an established release requirement; the second definition is where the make-ten help and the representation-coverage rule prove themselves.

**Independent Test**: From `within-10`, "More challenge" leads to a `crossing-ten` question with its sentence shown and make-ten help available; "More challenge" again shows the honest end message; "Make it easier" returns to `within-10`; a reproduction of the earlier `crossing-ten` identity gives the same question.

**Acceptance Scenarios**:

1. **Given** a `within-10` question in progress, **When** the learner presses "More challenge", **Then** the current question stays, the next question comes from `crossing-ten`, and the ladder sentence for `crossing-ten` is shown in the active language.
2. **Given** a `crossing-ten` question, **When** the learner opens visual help, **Then** the make-ten model appears for these operands and the ten-frame never has to show an operand above nine.
3. **Given** the top of the ladder, **When** the learner presses "More challenge", **Then** a translated message states that no harder variation is available yet and nothing else changes; the same at the bottom for "Make it easier".
4. **Given** a pending challenge change, **When** the learner asks for another question, **Then** the change applies to that question; **When** the learner instead asks for "More like this", **Then** the current variation is kept and the pending change is cancelled with a visible notice (DL-026).
5. **Given** a learner's challenge request, **When** the session record is inspected, **Then** the resolved definition is recorded as the question's identity and the request as a separate event, never as evidence about the learner.

---

### User Story 4 - A learner sees an honest record of their work (Priority: P2)

After practising, the learner sees what they worked on: how many questions, and for each one an outcome that follows what happened in order: "Correct on first response, no help", "Correct after feedback", "Correct with visual help", "Correct with help", "Answered after the answer was shown", "Not correct yet", "Skipped", or "Unfinished". Summaries are counts, never percentages, scores, or a mastery word. The record is kept in this browser only, and the app says so.

**Why this priority**: Honest progress is a product principle and the reason help can be offered freely; the derivation rules are settled (DL-029) and must be built once, correctly, before any profile exists.

**Independent Test**: A scripted session produces one delivery per outcome row in the addendum's table; the record view shows exactly those labels with the right counts, in both languages, and reloading the browser keeps them.

**Acceptance Scenarios**:

1. **Given** a question answered correctly at once with no help, **Then** its outcome is "Correct on first response, no help".
2. **Given** an incorrect answer followed by a correct one and no help, **Then** the outcome is "Correct after feedback", and the earlier wrong answer is visible as a tag.
3. **Given** visual help opened before the first correct answer, with or without an earlier wrong answer, **Then** the outcome is "Correct with visual help" and any earlier wrong answer stays a tag.
4. **Given** a guided step that showed the answer before the correct submission, **Then** the outcome is "Answered after the answer was shown" whatever else happened.
5. **Given** help opened only after the first correct answer, **Then** the outcome is unchanged and a tag records the later help.
6. **Given** only unreadable input on a question, **Then** the question is not shown as practised; **Given** a question left without any submission, **Then** it is "Skipped"; **Given** a session ended with a typed draft, **Then** it is "Unfinished" and can be resumed with its draft and help state.
7. **Given** a session of nine questions, **When** the summary is shown, **Then** it reads as counts per outcome ("9 questions: 4 correct on first response, …") with no percentage, score, streak, or mastery statement.
8. **Given** the record is kept in the browser, **When** the browser cannot store it (private mode or cleared data), **Then** practice still works and the learner is told the record is not being kept.

---

### User Story 5 - The flow works in both languages and with assistive technology (Priority: P3)

Every learner-visible text exists in Norwegian Bokmål and English and comes from the app's dictionaries or the content; a missing string is a development-time failure, not a blank. The practice screen is operable by keyboard alone and with a screen reader: the help control announces its state, counters are navigable groups that never announce the total before it is revealed, and controls meet the 44 by 44 touch-target rule on an iPad-sized screen.

**Why this priority**: Both languages and accessibility are first-release requirements; they are cheap to keep from the start and expensive to retrofit.

**Independent Test**: The bilingual walkthrough script from the revised build brief §7 is executed in both languages; keyboard-only completion of a question with help is possible; an accessibility-tree check confirms no total is exposed before reveal (DL-035).

**Acceptance Scenarios**:

1. **Given** the app in Norwegian, **When** the learner switches to English during a question, **Then** every label, feedback text, ladder sentence, and outcome label changes language and the question and work stay.
2. **Given** a developer adds a learner-visible string in one language only, **When** the checks run, **Then** the dictionary-parity check fails naming the key.
3. **Given** a screen reader on the help model for `4 + 4`, **When** the two groups are read, **Then** each group's four counters are navigable and labelled, and no announcement states eight before the counting step reveals it.
4. **Given** keyboard-only operation, **When** a learner opens help, answers, reads feedback, and asks for another question, **Then** focus is always visible and usable and no step needs a pointer.

---

### Edge Cases

- The learner submits a correct answer, then opens the explanation: the outcome stays unchanged and the later support is a tag.
- The learner opens visual help, closes it without counting, and answers: the outcome is "Correct with visual help" (help was shown), not "first response".
- A guided counting step reaches the last counter: this is an answer reveal, and the next correct answer is "Answered after the answer was shown" (DL-026).
- The learner types `7,5` or `7.5`: input guidance, not a mathematical attempt; `08` and ` 8 ` are read as 8; a negative number is a mathematical attempt and judged.
- Two submissions of the same answer are sent because of a retry: the second is ignored by its submission identity, and the record shows one submission.
- The service cannot be reached when the learner submits: the typed answer is kept, the learner is told the answer could not be checked, and submitting again works once the service is back.
- The random pool of a definition is small (`within-10` has 45 ordered pairs with both operands 1 to 9 and sums 2 to 10): questions may repeat; this feature does not avoid repeats and does not claim to (repeat avoidance and "Repeat this question" are feature F7).
- A definition lists a representation that cannot show one of its values: impossible for merged content, because spec 001's check refuses it; the domain tests assert the same for the registered generator so the two can never disagree silently.
- A newer generator version is registered: existing definitions keep resolving their pinned version; only a definition that bumps its own version uses the new one.
- Browser storage is unavailable: practice works, the record is not kept, and the learner is told.
- The learner ends the session with a typed draft: the question is "Unfinished" and resumes with the draft, the help state, and the pending challenge change (DL-026).

## Requirements *(mandatory)*

### Functional Requirements

**Generation and identity**

- **FR-001**: A question MUST be identified by (exercise definition ID, definition version, seed) and MUST resolve to the same operands, representations, generator version, and validator version every time, in every language, after any challenge change, after a restart, and after newer generator versions exist (ADR 0004; addendum §D).
- **FR-002**: The generator registered as `addition-pair` version 1 MUST produce an ordered pair of operands from the definition's parameter bounds for `operand` and `sum`, using the random source and the bounded sampling of the seed proposal, with a documented, fixed draw order; it MUST reject any seed or bound the proposal declares invalid, and MUST never fall back to another source of randomness (DL-018, DL-034).
- **FR-003**: Generation MUST be proved by fixtures before the generator ships: the proposal's raw, bounded, and rejection test vectors; golden seeds per definition; a property test per definition that every instance lies within bounds and within every listed representation's support; the replay fixture of User Story 2; and the boundary fixtures `4 + 4` and `9 + 9` (resolve) and `19 + 1` (cannot occur) (DL-009, DL-034).
- **FR-004**: Fixed definitions (`numbers.addition.four-plus-four`) MUST resolve from (definition ID, version) alone; a seed MAY be supplied and MUST be ignored.
- **FR-005**: The definitions, registries, skills, and ladder used at runtime MUST be the files under `content/` as validated by spec 001; the domain tests MUST assert that the generator, validator, representations, and codes the code implements match the registry entries by name, version, bounds, and emitted codes.

**Validation and feedback**

- **FR-006**: Validation MUST return a typed result with a status from the capability model's set (`correct`, `incorrect`, `invalid-response`, `partially-correct`, `review-needed`), a feedback code, the values needed to render the feedback, and the validator's identity and version. Only the first three statuses are produced in this feature; the reserved two MUST exist in the type, be rendered exhaustively by the learner app with the addendum's wording, and never be shown as a score or as a promise of human review (addendum §E).
- **FR-007**: An `incorrect` result MUST carry exactly one of the registered codes, chosen in this order: `add.oneGroup` when the answer equals either operand; `add.concat` when it equals the operands' digits written next to each other; `add.offByOne` when it differs from the sum by one; `add.subtracted` when it equals the operands' difference; otherwise `add.generic`. The feedback texts in both languages are authored content, resolved by the learner app from the code and values.
- **FR-008**: Input that cannot be read as an integer MUST produce `invalid-response` with input guidance, MUST NOT count as a mathematical attempt or retry, and MUST leave the learner free to submit again. Leading zeros and surrounding whitespace are read as the integer; decimals, text, and empty input are invalid.
- **FR-009**: Validation data and the correct answer MUST never be sent to the learner unsolicited: not with a question, a lesson, a skill, a non-revealing help or explanation step, or an incorrect or invalid result. The learner receives the answer only through their own correct submission or through a revealing step they explicitly advanced to, which is recorded as a reveal and classifies a later correct answer as "Answered after the answer was shown" (addendum §D and §E, DL-005, DL-026, exercise-experience "Explaining why the result follows").
- **FR-010**: Validation MUST be deterministic: the same identity and the same submitted artifact always give the same result.

**Practice screen**

- **FR-011**: The practice screen MUST show the expression, an answer field, a submit action, a "Show visual help" action, "Another question", "More like this", "Make it easier", and "More challenge", with the learner-facing names in `learning-experience.md` in both languages.
- **FR-012**: Visual help MUST be available before answering and MUST render the representation the definition lists for help (`groups` for within ten, `make-ten` for crossing ten) from the same instance as the question; opening or closing it MUST preserve the learner's input; a first reveal MUST NOT show the total; a guided step that reveals the total MUST be marked as a reveal (exercise-experience "Addition example"; DL-026).
- **FR-013**: After a submission the result MUST be shown with its authored wording; after an incorrect result the answer MUST stay editable and resubmittable. An available worked explanation MUST be reachable after either a correct or an incorrect result (exercise-experience "Explaining why the result follows"); it is distinct from visual help, its steps are recorded as support, a step that shows the result is recorded as a reveal, and an explanation opened after the first correct submission is recorded as later support that never changes the outcome.
- **FR-014**: "Another question" MUST deliver a new question with a new seed from the pending definition when a challenge change is pending, and otherwise from the current definition; "More like this" MUST keep the current variation and cancel a pending challenge change with a visible notice (DL-026).
- **FR-015**: "Make it easier" and "More challenge" MUST move to the adjacent entry of the skill's ladder for the next question, show that entry's description in the active language, preserve the current question, draft, and help state, and at either end state in the active language that no further variation is available yet.
- **FR-016**: Switching language and resizing the window MUST preserve the current question, draft, help state, pending challenge change, and session record.
- **FR-017**: Ending a session with a question in progress MUST keep it resumable with its draft, help state, and pending change (DL-026).

**Session record (guest)**

- **FR-018**: The app MUST record one observation per delivery with the resolved identity (definition, version, seed or none, generator version, validator version), the ordered mathematical submissions with client-generated submission identities, input-guidance events kept apart, and ordered support events from the named set in addendum §E (`visual-help-opened`, `help-step`, `counting`, `counting-complete`, `explanation-open`, `explanation-step` with a reveal flag, `lesson-opened`, `lesson-reveal`, `answer-reveal`), plus the learner's challenge requests as separate events. Provenance is `guest`.
- **FR-019**: Re-sending a submission with the same submission identity MUST NOT create a second submission.
- **FR-020**: Each delivery's outcome MUST be derived from its ordered events exactly as addendum §E defines, with the precedence of DL-029: any reveal, then non-visual help, then visual help, then a feedback-only retry, then first response; an earlier wrong answer stays a tag; support after the first correct submission never changes the outcome; invalid input never produces "after feedback".
- **FR-021**: Summaries MUST be counts of outcomes over deliveries in both languages and MUST NOT show percentages, scores, streaks, time, or any mastery word.
- **FR-022**: The record MUST be kept in the learner's browser only, presented as "kept in this browser only", MUST survive a reload, and when storage is unavailable practice MUST continue with a notice that nothing is being kept.

**Languages, accessibility, and quality**

- **FR-023**: Every learner-visible string MUST come from a dictionary with both languages or from bilingual content; a check MUST fail the build when a key is missing in one language or when a learner-visible literal appears outside the dictionaries, with the documented exceptions (DL-038).
- **FR-024**: The practice screen MUST be operable by keyboard and screen reader: the help control announces its expanded state and keeps focus usable; counters are labelled, navigable groups; no accessible name or announcement states the total before it is revealed (DL-035); animations have a static or stepped equivalent and respect reduced motion; interactive controls are at least 44 by 44 on touch screens.
- **FR-025**: Every requirement above MUST be covered by automated tests that run in the repository's continuous integration together with the existing content checks: domain fixtures and property tests, service contract tests, learner-app component tests for state preservation and exhaustive status rendering, dictionary parity, and a build of the learner app.

### Key Entities

- **Exercise instance**: the resolved question: identity (definition ID, version, seed or none), operands, the representations available for help and explanation, generator and validator versions. Presentation data only.
- **Response artifact**: what the learner submitted: the original text and, when readable, the integer; carries a submission identity.
- **Validation result**: status, feedback code, feedback values, validator identity and version; never prose.
- **Delivery observation**: one per delivered instance: identity, purpose (`practice`), ordered submissions, input-guidance events, ordered support events, challenge requests, provenance.
- **Outcome**: the label derived from a delivery's events per addendum §E; a session summary is counts of outcomes.
- **Ladder position**: the current entry of the skill's ladder (a definition and version) and any pending change.
- **Guest session record**: the deliveries kept in this browser, with the language and the resumable question.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: For 100 percent of delivered questions, the identity reproduces the same question in both languages, after challenge changes, after a restart, and with a newer generator version registered (replay fixtures pass in CI).
- **SC-002**: No unsolicited data delivered to the learner contains the answer or validation data: question, lesson, and skill responses, non-revealing steps, and incorrect or invalid results are answer-free in 100 percent of fixtures, and a revealing step is delivered only on the learner's explicit advance and recorded as a reveal (contract tests and an end-to-end check).
- **SC-003**: Every row of the addendum's outcome table and every edge case above is produced by an automated test, and the derived label matches in both languages.
- **SC-004**: The bilingual walkthrough script (revised brief §7) completes in both languages with every text translated and the question, draft, and help state preserved across the language switch.
- **SC-005**: A keyboard-only tester completes a question with visual help, feedback, and another question without a pointer; the accessibility tree exposes no total before reveal.
- **SC-006**: The initial learner, in a recorded 15-minute session with the addition practice, finds the help control unprompted and understands "Correct with visual help" and "Correct after feedback" (revised brief §10; findings recorded, not scored).
- **SC-007**: Continuous integration runs the domain tests, the service contract tests, the learner-app tests and build, and the content checks on every pull request, and finishes in under 10 minutes.

## Assumptions

- Scope: this feature is the first learner-visible loop (decision-log F2, F3, F4) plus the ladder transitions between the two milestone definitions and the minimum session record with derived outcomes (addendum §D rows 2, 3, 4, 5, 7, 8), as the owner described. Repeat avoidance, "Repeat this question", and further session controls stay in F7 (spec 005); the full progress view across skills and lessons and "Lesson viewed" history stay in F6 (spec 004); the lesson body renderer stays in F5 (spec 003). Until spec 003 lands, the lesson page shows the title and objective read from the active language's translation front matter (`nb.md` or `en.md`, where spec 001 places them) and the practice entries from `lesson.json`; the Markdown body is not rendered.
- Homes for the code, per the constitution's constraints, ADR 0007, and DL-005: the mathematics domain and the thin service under `src/backend/`, the learner app under `src/web/`. The planning phase decides project names and the test tooling; this specification does not.
- Seeds are chosen by the learner app for each new question from a non-secret source and recorded with the delivery; seeds are never secrets (seed proposal "Prohibitions").
- Guest only: no profile, sign-in, or server-side storage; the record lives in the browser as the prototype does. Profiles are F9, after its design proposal.
- The feedback texts, ladder sentences, status wordings, and outcome labels are the prototype's and the addendum's, carried into the app's dictionaries and the content; wording changes go through content review, not code.
- The explanation (worked steps after an answer) for the two definitions is delivered as the prototype shows it, as support that may reveal; its full authoring contract belongs to F5.
- The number-bonds skill has no practice of its own in this feature (missing-part is deferred, DL-014); practice is on `numbers.addition-within-20`.
- Dependencies: spec 001 merged (content, registries, validator); the seed proposal's fixtures; the prototype as the design reference; CI already running the content checks.
