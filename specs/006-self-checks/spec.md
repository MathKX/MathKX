# Feature Specification: Self-Checks ("Check My Understanding")

**Feature Branch**: not created yet (spec directory `specs/006-self-checks/`; Spec Kit treats the two as independent)

**Created**: 2026-10-31

**Status**: Draft

**Input**: User description: "Spec 006 (decision-log feature F8): self-checks. From the lesson and from the addition skill's practice and "My work", a learner chooses "Check my understanding" ("Sjekk forståelsen min") and, before starting, sees what the check covers, how many questions it has, and its support policy. The check is short and bounded, and the learner answers independently (owner decision DL-028): no visual help, explanations, or lesson detours inside the check, and no feedback until the end. At any question the learner can explicitly switch, one way, to supported practice from that question onward; answers saved before the switch stay independent. The end summary shows the independent answers in three groups: correct on your own; worth revisiting, only for independent questions that were neither correct first nor skipped (DL-036); and skipped. The supported part is shown separately. Every question's step-by-step explanation is available in the summary without being recorded as help, with a way to practise more or take a new check; it has no scores, percentages, streaks, or mastery words, and says a check is a snapshot, not a final judgement. A check's questions are an authored list in content (DL-023: checks use their own authored lists, not a mixed-skill generator), each item replayable from its identity (definition, version, and seed for generated items), so checks become part of the content contract and its validator. Check results are kept in the guest record in the browser, shown in "My work" apart from practice with the independent and supported boundary intact; a check left part-way can be resumed, and "Check my understanding" always starts a fresh check. Both languages, keyboard and screen reader, iPad targets. Builds on specs 001 to 005, with one pilot check for the addition skill covering within ten and across ten. Profiles and persistence (F9), adaptive question selection, and mastery judgements stay out of scope."

**Words used here**: a **self-check** (or simply a check) is the learner-facing activity this feature adds. The **content check** is spec 001's validator for the files under `content/`, which this feature extends. A check's **independent part** comes before any switch; its **supported part** comes after one.

## Sources this specification depends on

Per the constitution's specification rules, this feature restates existing decisions and creates no new requirement. Milestone one is closed (DL-041), and the constitution's backlog order places F8 next.

- **Decision-log rows**:
  - **F8** ("Self-checks (later milestone)"; verdict "specify with corrections, after milestone one"; conditions: DL-036 fixed, policy per DL-028).
  - **DL-028** (owner decision, 2026-10-18): "independent by default; no help inside the check; explicit one-way switch to supported practice; earlier answers stay independent; feedback at the end."
  - **DL-036**: restrict "Worth revisiting" to independent items that were neither correct first nor skipped.
  - **DL-023**: checks use their own authored lists; a first check needs scope, policy, history, and honest outcomes, not a mixed-skill generator.
  - **DL-026**: the four behaviour rules, reused in the supported part. In particular, (2) is the lesson disclosure rule and (4) keeps an unanswered practice question resumable.
  - **DL-029**, **DL-032**, and **DL-015**: outcome precedence, and summaries as counts.
  - **DL-041**: milestone one closed, so F8 may begin.
- **Documents**:
  - [learning experience](../../docs/design/learning-experience.md):
    - **Learning activity table**, "Check understanding": "Explain the allowed support and when feedback appears before starting… A check provides evidence, not a guaranteed diagnosis or mastery judgment."
    - **Action table**: "Check my understanding / Sjekk forståelsen min: Start a fresh, bounded self-check with an explicit scope and support policy."
    - **Challenge for a bounded self-check**: established before starting; a change "must not silently change what an existing result claims to measure".
    - **After a self-check**: more practice is always available.
  - [exercise experience](../../docs/design/exercise-experience.md) "Help during checks of understanding":
    - **Policy before start**: a check intended to observe independent work states its policy before it starts.
    - **Help is never hidden**: a helped response is never silently treated as independent.
    - **Accommodations stay**: screen reader, keyboard, zoom, and reduced motion remain available and are never negative evidence.
  - [mastery](../../docs/learning/mastery.md): no mastery claims without a validated model; honest progress language.
  - ADR 0004 (reproducible identity); ADR 0003 and ADR 0005 (content configures, code computes).
- **Evidence**:
  - **Round-04 synthesis, F8 row**. Its acceptance: stated scope and policy, the independent and supported boundary, an explicit one-way switch, summary and history, and honest provenance.
  - **Round-04 challenge, F8 section**: the DL-036 correction.
  - **Prototype iteration 2** as the design reference: `Practice.jsx` `CheckPage`, the `check-addition` list in `src/content/catalog.js`, and the `check.*` texts in `src/i18n-iteration2.js`. Its review responses C11, G4, G5, X05, and DL-036 are already fixed there.
- **Earlier features**:
  - [spec 001](../001-pilot-content-contract/spec.md): the content contract and content check. It reported the prototype's `check` field as "a later feature"; this feature is that feature.
  - [spec 002](../002-practice-flow/spec.md): identity, validation, help, explanation, outcomes, and the guest record.
  - [spec 003](../003-lesson-rendering/spec.md): the lesson detour and its notice.
  - [spec 004](../004-progress-view/spec.md): "My work" and replay.
  - [spec 005](../005-repeats-and-sessions/spec.md): repeat avoidance, "Repeat this question", and practice sessions.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A learner checks their understanding on their own and sees an honest summary (Priority: P1)

A learner, as a guest in Norwegian Bokmål or English, has practised addition and wants to see what they can do without help. From the lesson, from practice, or from "My work", they choose "Check my understanding". Before anything starts, the learner sees:
- what the check covers ("Addition within ten and across ten");
- how many questions it has;
- what help is available: none inside the check, with feedback at the end;
- that they can switch to supported practice;
- that a check is a snapshot, not a final judgement.

They start. Each question shows its number ("Question 2 of 4"), an answer field, "Save answer", and "Skip". Saving moves on without saying whether the answer was right. After the last question, the learner sees a summary in three groups:
- **Correct on your own**;
- **Worth revisiting**: questions answered, but not correctly;
- **Skipped**.

The summary shows each question with the learner's answer and the correct one. It offers each question's step-by-step explanation, "Practise more", and "Take a new check". It has no score, percentage, or mastery word.

**Why this priority**: This is the feature. DL-028 settled the policy, and the documents name "Check my understanding" as one of the learner's actions. Without a check, the application has no way to observe independent work apart from practice, where help is always one tap away.

**Independent Test**: Take the pilot check, answer two questions correctly, one wrongly, and skip one. During the check, nothing on the screen or in the accessibility tree says whether an answer was right, and no help, explanation, or lesson can be opened. The summary shows 2 correct on your own, 1 worth revisiting, and 1 skipped, in both languages. "Worth revisiting" is on the wrong one only.

**Acceptance Scenarios**:

1. **Given** the lesson page, the practice page of the addition skill, or the skill in "My work", **When** the learner chooses "Check my understanding", **Then** a fresh check of that skill is offered. Before it starts, the screen states its title, its scope, its number of questions, its support policy, the switch and what it means, and the snapshot sentence, in the selected language.
2. **Given** a question in the independent part, **Then** visual help, the explanation, the lesson link, and any statement of correctness are absent: not shown, not announced, and not fetched. The answer field, "Save answer", "Skip", and "I need help" (story 2) are present.
3. **Given** an answer the app cannot read (as in spec 002, for example `4+4`), **When** the learner saves, **Then** the same input guidance as in practice appears, nothing is saved, and the learner stays on the question. The guidance says only that the input could not be read, never whether an answer would be right.
4. **Given** a saved answer or a skip, **Then** the next question appears, the saved answer cannot be changed, and no result is shown. After the last question, the summary appears.
5. **Given** the summary, **Then** every question of the independent part is in exactly one group:
   - **Correct on your own**: the saved answer was correct;
   - **Worth revisiting**: an answer was saved, and it was not correct;
   - **Skipped**: the learner chose "Skip".

   Each group shows its count and its questions. The tag "Worth revisiting" appears only on questions in that group (DL-036).
6. **Given** the summary, **Then** each question shows the learner's answer (or that it was skipped) and the correct answer, and offers its step-by-step explanation. Opening the explanation records nothing and changes no group.
7. **Given** the summary, **Then** it shows no score, percentage, streak, time, or mastery word. It says a check is a snapshot, not a final judgement. It offers "Practise more", which states that more practice does not change this check's result, and "Take a new check".

---

### User Story 2 - A learner who needs help switches to supported practice (Priority: P1)

During a check, a learner gets stuck and chooses "I need help". The app explains what switching means before anything changes:
- from this question on, they get visual help, explanations, and feedback;
- answers saved before this question still count as their own;
- this question and the rest become supported practice;
- the switch cannot be undone within this check.

They can switch or continue without help. If they switch, the remaining questions work as in practice. In the summary, the questions before the switch keep their groups, and the rest are shown separately as "Supported practice (from question 3)", with practice's outcome labels and a note that they are not part of the independent result.

**Why this priority**: DL-028 makes the one-way switch part of the policy. Without it, a learner who needs help must either give up or guess, and a helped answer could never be told apart from an independent one. The documents require that a helped response is never silently treated as independent evidence.

**Independent Test**: In a four-question check, save a wrong answer to question 1, skip question 2, and switch on question 3. Open help and answer correctly, then answer question 4 wrongly and then correctly. The summary shows the independent part as 0 correct on your own, 1 worth revisiting, and 1 skipped. It shows "Supported practice (from question 3)" with question 3 "Correct with visual help" and question 4 "Correct after feedback". Neither supported question carries "Worth revisiting".

**Acceptance Scenarios**:

1. **Given** a question in the independent part, **When** the learner chooses "I need help", **Then** a confirmation in the selected language says what changes and from which question, with "Switch to supported practice" and "Continue without help". Choosing "Continue without help" changes and records nothing.
2. **Given** a confirmed switch on question *k*, **Then** questions 1 to *k*−1 keep their independent results, and question *k* and the following questions offer visual help, the explanation, feedback after each answer, retries, and the lesson link, with spec 003's notice. A draft typed on question *k* before the switch is kept.
3. **Given** the supported part, **Then** each question's outcome is derived as in practice (spec 002, DL-029), and the learner moves on with "Next question" or "Skip". Before answering, only "Skip" is offered; after answering, only "Next question" (or "See summary" on the last question).
4. **Given** a switch, **Then** it cannot be undone within this check, and a new check starts independent again.
5. **Given** the summary of a check with a switch, **Then** the supported part is shown apart from the three groups, with a heading that names the question it started from, practice's outcome labels, and the note that it is not part of the independent result. "Worth revisiting" never appears on a supported question (DL-036).

---

### User Story 3 - A maintainer defines a self-check as content (Priority: P2)

A maintainer writes a check as a reviewable file under `content/`. The file gives:
- an ID and a version;
- the skill it checks;
- a title and a scope sentence in both languages;
- an ordered list of a few questions, each naming an exercise definition and its version, plus a seed for a generated definition.

The content check reports anything wrong with the file in terms the maintainer can act on, as spec 001 does for lessons and definitions. The pilot check for the addition skill is written this way.

**Why this priority**: DL-023 requires authored lists, and the constitution keeps content as data with code computing the mathematics. The learner stories need the pilot check, which ships with them in this format; this story is about the contract and its checks for any further check.

**Independent Test**: The pilot check passes the content check. Each malformed copy fails with a message naming the file, the field, and the problem: an unknown definition, a wrong version, a generated item without a seed, a fixed item with a seed, a duplicate question, a missing language, an empty list, or a list over the limit. The domain tests confirm that every generated item's seed produces a question of its definition, and that the pilot check's questions are the intended ones.

**Acceptance Scenarios**:

1. **Given** a check file in the contract, **When** the content check runs, **Then** it passes, and the check is identified by its ID and version.
2. **Given** a question that names a definition or version that does not exist, a generated definition without a seed, or a fixed definition with a seed, **Then** the content check fails, naming the file, the question's position, and the problem.
3. **Given** a check whose title or scope is missing in one language, whose list is empty or longer than the limit, or that lists the same question twice, **Then** the content check fails with the reason.
4. **Given** a question whose definition serves another skill than the check's, **Then** the content check fails. A check covers one skill, so it is never a mixed-skill set (DL-023).
5. **Given** the documentation, **Then** the authoring guide describes every field of a check file and every rule the content check enforces for it, in the same change as the schema (constitution: the format and its schema change together).

---

### User Story 4 - A learner finds their checks in "My work" and can continue an unfinished one (Priority: P2)

"My work" lists, under the skill, the learner's checks apart from their practice, newest first. Each entry shows its date and its counts in the summary's groups, plus the size of any supported part. Each opens its summary as it was. A learner who left a check part-way, by closing the tab, reloading, or following a link, finds it there and can continue where they left off, with any typed draft. Choosing "Check my understanding" again always offers a fresh check. If an unfinished one exists, the start screen says so and offers to continue it instead.

**Why this priority**: DL-023 names history as part of a first check, and the round-04 acceptance names "summary/history and honest provenance". It builds on story 1's record.

**Independent Test**: Take one check to the end and leave another after question 2 with a draft. "My work" shows the first with its counts and the second as unfinished. Continuing it returns to question 3 with the draft. Practice counts for the skill are the same as before either check.

**Acceptance Scenarios**:

1. **Given** finished checks, **Then** "My work" shows them under the skill in a part of their own, newest first. Each shows its date, the three counts, and the supported part's count and starting question. Practice's counts, repeats, and lesson lines are unchanged by check questions.
2. **Given** a check entry, **When** the learner opens it, **Then** its summary appears as it was at the end, with its explanations available and nothing recorded.
3. **Given** an unfinished check, **Then** "My work" shows it as unfinished, at "question *n* of *N*", with "Continue the check". Continuing restores the question, its typed draft, and the part it is in (independent or supported).
4. **Given** an unfinished check, **When** the learner chooses "Check my understanding", **Then** the start screen says an unfinished check exists and offers "Continue the check" beside "Start the check". Starting a new one ends the unfinished check, and its questions not yet reached are shown in its summary as not answered, apart from the three groups and never as skipped.
5. **Given** a reload during a check, **Then** the check continues where it was, and the summary at the end is the same as without the reload.

---

### User Story 5 - Self-checks work in both languages and with assistive technology (Priority: P3)

Every new screen, action, notice, policy sentence, group, and tag exists in Norwegian Bokmål and English. A check can be taken, switched, and reviewed by keyboard and screen reader alone, with 44 by 44 targets on touch screens.

**Why this priority**: Both languages and accessibility are first-release requirements (constitution VI). Accessibility accommodations stay available inside an independent check and are never help (constitution V).

**Independent Test**: The dictionary-parity, literal, and wording checks pass with the new texts. A keyboard-only tester takes the pilot check, switches on question 3, and opens an explanation in the summary without a pointer. A language switch in the middle of the check keeps the question, the draft, and the part it is in.

**Acceptance Scenarios**:

1. **Given** a language switch during a check, **Then** the check, its position, the draft, and the switch state are kept, and every text changes language.
2. **Given** keyboard-only use, **When** the learner saves, skips, or switches, **Then** focus lands on the next question, the summary heading, or the confirmation as each appears, and every control shows focus.
3. **Given** a screen reader, **Then** the question, the "question *n* of *N*" position, and the policy are announced in the selected language. Nothing announces correctness before the summary.

---

### Edge Cases

- **A practice question in progress when a check starts**: it stays resumable with its draft and help, as when the learner leaves the practice page (DL-026 (4)). "Practise more" after the check resumes it (spec 005).
- **The pilot check's questions and the lesson**: the lesson link is absent from the independent part, so spec 003's notice never applies there. In the supported part it applies to each question as in practice.
- **A question whose answer the learner has just seen in practice**: the check still asks it. A check's list is authored, not avoided (DL-023), and check questions do not count in practice's repeat avoidance or in its repeat marking.
- **The service unreachable while saving**: the answer is not saved, the learner is told it could not be saved, and the draft is kept to save again. When the check is finally scored, a missing result is never shown as wrong.
- **A check's content changes after it was taken**: a new version of the check, or of a definition, does not change a recorded check. Its summary is shown from the recorded questions and answers, and each question still replays by its identity (ADR 0004). A check version that can no longer be loaded still shows its recorded summary, with the explanations unavailable and a sentence saying so.
- **Switching on the last question**: allowed; the supported part is one question.
- **Switching before saving anything**: allowed; the independent part is empty, and the summary says no questions were answered on your own.
- **Skipping every question**: the summary shows all of them as skipped, with no "Worth revisiting".
- **"Make it easier" or "More challenge"**: not offered in a check, in either part. The check's questions are fixed before it starts; changing challenge means practice or a new check (learning experience, "Adjusting challenge").
- **"Clear my work"**: clears checks with the rest of the record.
- **Records from before this feature**: load unchanged, with no checks.
- **Opening explanations in the summary**: records nothing and never changes a group. The summary is after the check, so this is not help during the check.

## Requirements *(mandatory)*

### Functional Requirements

**Starting a check**

- **FR-001**: The lesson page, the practice page of a skill that has a check, and that skill in "My work" MUST offer "Check my understanding" ("Sjekk forståelsen min"). Choosing it MUST offer a fresh check of that skill (learning experience, action table).
- **FR-002**: Before a check starts, the app MUST state, in the selected language, its title, its scope, its number of questions, and its support policy. The policy states that the learner answers on their own, that visual help, explanations, and lessons are not available, and that feedback comes at the end. The app MUST also state the switch to supported practice and its consequence, and that a check is a snapshot, not a final judgement (DL-028; learning experience; exercise experience).
- **FR-003**: If an unfinished check of the skill exists, the start screen MUST say so and offer to continue it. Starting a new check MUST end the unfinished one, and its unreached questions MUST be recorded as not answered.

**The independent part**

- **FR-004**: In the independent part, the app MUST NOT show, announce, or fetch visual help, explanations, lesson content, or any statement of correctness. The learner MUST see the question, its position in the check, the answer field, "Save answer", "Skip", and "I need help" (DL-028).
- **FR-005**: Saving MUST record the answer as the question's only submission, move to the next question, and show no result. A saved answer MUST NOT be changeable. Unreadable input MUST get spec 002's input guidance, with nothing saved. Accessibility accommodations MUST stay available and MUST NOT be recorded as help (constitution V).
- **FR-006**: The questions MUST be the check's authored list, in its order, each delivered by its identity: definition and version, plus seed for a generated definition (ADR 0004). Each MUST be delivered as listed, never replaced by another question; practice's repeat avoidance MUST NOT apply.

**The switch**

- **FR-007**: "I need help" MUST explain the switch and its consequences before anything changes, and MUST offer to switch or to continue without help. Continuing MUST record nothing.
- **FR-008**: A confirmed switch on question *k* MUST be recorded with *k* and MUST be one way within the check. Questions before *k* MUST keep their independent results. Question *k* and the following questions MUST behave as practice: visual help, explanation, feedback, retries, and the lesson link with spec 003's notice. Their outcomes MUST be derived as in practice (spec 002, DL-029). A draft on question *k* MUST be kept.

**The summary**

- **FR-009**: At the end, the summary MUST place every independent question in exactly one group: "Correct on your own" (a correct saved answer), "Worth revisiting" (a saved answer that was not correct), or "Skipped". Each group MUST show its count and its questions. The tag "Worth revisiting" MUST appear only on questions in that group (DL-036).
- **FR-010**: Supported questions MUST appear apart from the groups, under a heading naming the question the switch started from, with practice's outcome labels and the note that they are not part of the independent result. Questions not reached in an ended check MUST appear apart as not answered.
- **FR-011**: Each question in the summary MUST show the learner's answer (or that it was skipped or not answered) and the correct answer, and MUST offer its step-by-step explanation. Opening an explanation MUST record nothing and MUST change no group.
- **FR-012**: The summary MUST show no score, percentage, streak, time, or mastery word. It MUST say that a check is a snapshot, not a final judgement. It MUST offer "Practise more", stating that more practice does not change this check's result, and "Take a new check" (mastery; product principles; constitution VII).

**The record and "My work"**

- **FR-013**: Each check question MUST be recorded in the guest record as a delivery that belongs to that check run. It records its identity and its part (independent or supported), with the same events as practice. The check run MUST be recorded with:
  - the check's ID and version;
  - when it started, and when it ended or was finished;
  - the switch position, if any.

  The record MUST stay in the browser (spec 002 FR-022; spec 004 FR-017).
- **FR-014**: Check questions MUST NOT change practice's counts, repeats, recent-question window, or practice sessions (specs 004 and 005). "My work" MUST show checks in a part of their own under the skill, newest first. Each entry MUST show its date, its group counts, any supported part, and whether it is unfinished. Each MUST open its summary as recorded.
- **FR-015**: An unfinished check MUST be resumable from "My work" and from the start screen. It MUST return to the same question, with its draft and its part, and MUST survive a reload and a language switch.
- **FR-016**: A recorded check's summary MUST be derived from its recorded questions and answers, so later content changes never change it. Each question MUST replay by its identity (spec 004).

**Content contract**

- **FR-017**: A check MUST be a file under `content/` with:
  - a language-neutral ID and an integer version;
  - the skill it checks, which must exist;
  - a title and a scope sentence in both languages;
  - an ordered list of 1 to 10 questions.

  Each question names an exercise definition and version that exist. It gives a seed when the definition is generated, and none when it is fixed (DL-023; spec 001 FR-009, FR-010).
- **FR-018**: The content check MUST fail, naming the file, the position, and the problem, for:
  - an unknown definition or version;
  - a seed on a fixed definition, or a missing seed on a generated one;
  - a duplicate question;
  - a definition serving another skill;
  - a missing language;
  - an empty list or one over the limit.

  The schema and the authoring guide MUST change together (constitution, development workflow).
- **FR-019**: The domain tests MUST confirm that every generated question of every check in `content/` resolves to a question of its definition, and that the pilot check's questions are the authored ones. The content check itself does not run generators (spec 001).
- **FR-020**: The repository MUST contain one pilot check for `numbers.addition-within-20`, covering within ten and across ten, passing the content check.

**Languages, accessibility, privacy, and quality**

- **FR-021**: Every new text MUST exist in both languages and pass the dictionary-parity, literal, and wording checks (DL-038). A language switch during a check MUST keep its state.
- **FR-022**: Every new control MUST be keyboard-operable with visible focus and 44 by 44 targets on touch screens. Focus MUST move to each new question, the confirmation, and the summary heading as they appear. Nothing MUST announce correctness before the summary.
- **FR-023**: Answers MUST be sent for validation only as in practice: the question's identity, the answer text, and a submission ID. The accumulated record MUST NOT be uploaded.
- **FR-024**: Every requirement above MUST be covered by automated tests in continuous integration:
  - the independent part's absences, including the accessibility tree and requests;
  - grouping over scripted runs, with a switch at every position;
  - DL-036;
  - resume, reload, and language switch;
  - the content check's cases, and the domain tests for check items;
  - "My work" separation;
  - dictionary and wording checks;
  - end-to-end checks on desktop and iPad viewports.

### Key Entities

- **Self-check (check definition)**: authored content identified by ID and version. It names one skill, a title and scope in both languages, and an ordered list of questions, each an exercise identity.
- **Check run**: one attempt at a check by the learner, in the guest record. It holds the check's ID and version, its start and its end or finish, the position of the switch if any, and its questions as deliveries.
- **Independent part / supported part**: the questions of a check run before the switch, and from the switch onward.
- **Check question (delivery)**: a delivery belonging to a check run. It holds its position, its part, its identity, and practice's events. In the independent part, a saved answer is its only submission.
- **Check summary**: three groups over the independent part, plus the supported part and any questions not reached. It is derived from the recorded run, never a score.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 100 percent of automated runs of the independent part, no help, explanation, or lesson content is requested, and no help, explanation, lesson content, or statement of correctness is shown or announced before the summary, in both languages.
- **SC-002**: For 100 percent of scripted check runs, every independent question is in exactly one of the three groups, and "Worth revisiting" appears only in its group. The runs cover every combination of correct, wrong, and skipped answers on the pilot check, and a switch at every position.
- **SC-003**: 100 percent of check questions replay to the same question by their identity in both languages, and a recorded summary is unchanged after its check or definitions gain a new version.
- **SC-004**: Every malformed-check case in FR-018 fails the content check with a message naming the file, the position, and the problem, and the pilot check passes.
- **SC-005**: A keyboard-only tester takes the pilot check, switches to supported practice, and opens an explanation in the summary, without a pointer.
- **SC-006**: A learner (the initial learner of the build brief's validation plan) can say, before starting, what help the check allows. After the summary, they can say which questions are worth revisiting and that the check is not a final judgement. Findings are recorded, not scored.
- **SC-007**: Continuous integration still finishes in under 10 minutes with this feature's tests added.

## Assumptions

- **Scope**: decision-log F8, for the guest record in the browser and the pilot addition skill. Profiles and persistence are F9. This feature leaves undecided, as the constitution requires:
  - **Mastery and recommendations**: how a check's evidence feeds mastery or recommendations (the mastery algorithm); adaptive selection; scores.
  - **Other checks**: diagnostic checks, mixed-skill checks, timed checks, and other support policies (only DL-028's default is specified).
- **Order and saved answers**: a check goes forward one question at a time, and a saved answer is final. This keeps "answers saved before the switch" well defined (DL-028). Going back to change answers is a reversible assumption for a later feature.
- **Question limit**: 1 to 10 questions per check keeps a check short and bounded (learning experience). The pilot check has four, as in the prototype's `check-addition`: two within ten (`7 + 3`, `5 + 4`) and two across ten (`8 + 5`, `9 + 4`), each written as definition, version, and the seed that produces it.
- **Where a check is found**: a check names its skill, and the lesson page offers the checks of the skills it teaches. Lessons gain no check field, so spec 001's report of the prototype's `check` field stays. This is reversible if a lesson needs to choose among several checks.
- **Questions not reached**: in a check that was ended by starting a new one, these are a fourth category, "not answered". They are not skipped, because the learner never chose to skip them.
- **Separation from practice**: check questions do not count in practice's numbers, repeats, avoidance window, or sessions. A check observes independent work and must not change what practice reports. A replayed check question can still be repeated as practice ("Repeat this question", spec 005).
- **When validation happens**: answers are validated by the service as in practice, and the results stay hidden until the summary. Whether each answer is validated on save or all at the end is a plan decision. The requirement is only that correctness is never shown or announced before the summary.
- **Dependencies**: specs 001 to 005 merged and deployed; spec 002's explanation steps for both pilot definitions; spec 004's "My work" and replay.
