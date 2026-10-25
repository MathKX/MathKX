# Feature Specification: Progress View, Lesson History, and Replay

**Feature Branch**: not created yet (spec directory `specs/004-progress-view/`; Spec Kit treats the two as independent)

**Created**: 2026-10-25

**Status**: Draft

**Input**: User description: "Spec 004 (decision-log feature F6): the progress view across skills and lessons, "Lesson viewed" history, and replay of recorded deliveries. A learner (guest, browser-only record) sees what they have worked on per skill and per lesson as honest counts of outcomes over deliveries (DL-010, DL-015, DL-029; no percentages, scores, streaks, or mastery words), sees a truthful "Lesson viewed" history without compulsory scrolling or clicking (DL-019), and can replay any recorded question from its stored identity (definition, version, seed) to see it again, in both languages. Builds on spec 002's observations and outcome derivation and spec 003's lesson events; F9 profiles and persistence stay out of scope."

## Sources this specification depends on

Per the constitution's specification rules, this feature restates existing decisions and creates no new requirement. It turns spec 002's session record page ("My work") into a progress view, adds the "Lesson viewed" history spec 003 deliberately left out, and lets a learner look at any recorded question again.

- **Decision-log rows**: DL-010 (progress labels derived from ordered result and support events; per-delivery observations), DL-015 (observation rules; summaries are counts; no historical help taint in summaries; no thresholds that promote a learner out of a "helped" state), DL-019 (a truthful "Lesson viewed" history, no compulsory scrolling or clicking; neither label establishes understanding), DL-026 (4) (an unanswered question stays resumable), DL-029 (help-first outcome precedence), DL-032 (feedback implied by an incorrect result in practice; the highest status when there is no correct submission). Feature verdict F6: "specify with corrections", condition DL-032, applied.
- **Documents**: [mastery](../../docs/learning/mastery.md) "Progress tracking before a mastery algorithm" (record, summarize honestly, never assess; the identity needed to replay; "Repeated exposure to the same question must remain distinguishable from work on new variations"; opening a lesson does not establish mastery), "Learner-facing summaries", and "Persistence and current implementation status" (a guest-only milestone may keep work in the browser with clear wording); [skill graph](../../docs/learning/skill-graph.md) ("Keep localized names, descriptions, and curriculum mappings separate from skill identity"); [learning experience](../../docs/design/learning-experience.md) "More practice and learner control"; the [corrections addendum](../../docs/reviews/round-01/claude-fable/revised-build-brief-corrections.md) §E (observation per delivery, outcome of a delivery, summaries as counts); ADR 0004 (reproducible identity), ADR 0006 and 0008 (profiles and persistence, not built here).
- **Earlier features**: [spec 002](../002-practice-flow/spec.md) (deliveries, events, outcome derivation, the guest record and its "kept in this browser only" notice, the identity `(definition, version, seed)`), [spec 003](../003-lesson-rendering/spec.md) (what "shown" means for a lesson; `lesson-opened` and `lesson-reveal` on deliveries; the lesson page).
- **Evidence**: the round-04 verification reports and synthesis (F6 row: preserve per-delivery identity, ordered submissions versus input guidance, support timing, guest provenance, counts); the prototype's progress page and lesson-view logging (`Prototype/mathkx-designsystemet/src/pages/Home.jsx`, `Lesson.jsx`) as the design reference.

## Clarifications

### Session 2026-10-25

- Q: Skills have no localized names in the content (`content/skills/*.json` holds an ID, prerequisites, and ladder descriptions; the schema allows nothing else), while skill-graph.md expects localized names kept apart from identity. Add names to the content contract, or show progress under the lessons that teach each skill? → A: Add a localized name (`nb` and `en`) to each skill file; the skill schema and the content validator check it; the progress view groups by skill (FR-006).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A learner sees what they have worked on, skill by skill (Priority: P1)

A learner, as a guest in Norwegian Bokmål or English, opens "My work" and sees their practice grouped by skill: for each skill they have practised, how many questions they worked on and how those went, in the words the record already uses ("Correct on first response, no help", "Correct with visual help", "Correct with help", "Correct after feedback", "Answered after the answer was shown", "Not correct yet", "Skipped", "Unfinished"). Nothing is a percentage, a score, a streak, or a statement that a skill is mastered. Under each skill the learner can see the questions themselves, newest first, each with its outcome, its tags, and the answers they gave.

**Why this priority**: This is the progress view the decision log names as F6, and the record is the only feedback a guest has about their work over time. Spec 002's record is one flat list for one skill; it does not scale past the pilot or say which skill work belongs to.

**Independent Test**: A scripted record with deliveries for two skills and every outcome shows each skill with the right counts per outcome in both languages, the per-question list under the right skill in newest-first order, and no percentage, score, streak, or mastery word anywhere on the page.

**Acceptance Scenarios**:

1. **Given** a record with nine questions on addition within 20 (four correct on first response, two correct with visual help, one correct after feedback, one answered after the answer was shown, one skipped), **When** the learner opens "My work", **Then** the addition skill shows "9 questions" with those five counts, in the selected language, and nothing else claims more than the counts say.
2. **Given** the same record, **When** the learner opens the skill's question list, **Then** each question shows its expression, its outcome, its tags, and the answers given, newest first.
3. **Given** a question answered correctly after help and later reopened for an explanation, **When** it is listed, **Then** its outcome is unchanged and the later support is a tag, exactly as spec 002 derives it.
4. **Given** a question that was delivered again with the same operands later (a repeat), **When** the skill is summarized, **Then** the summary says how many of its questions repeated one already seen, and the repeated question is marked as a repeat in the list (mastery.md: repeated exposure stays distinguishable).
5. **Given** only unreadable input on a question, **Then** it is not counted as practised; **Given** a session ended with a typed draft, **Then** the question counts as "Unfinished" and the list says it can be continued, with a way back to it.
6. **Given** a skill the learner has not practised, **Then** it is not listed with zero counts; **Given** no practice at all, **Then** the page says so and points to the lessons.
7. **Given** the addition skill, **Then** it is shown by its name in the selected language (for example "Addition within 20" or its Norwegian name), never by its ID; **Given** a skill file whose English name is missing or empty, **When** the content is validated, **Then** validation fails naming the file and the language.

---

### User Story 2 - A learner sees a truthful history of the lessons they have looked at (Priority: P1)

Each time a lesson is shown to the learner, the app notes that the lesson was viewed and when. "My work" lists the lessons the learner has looked at, with how many times and when last, and connects each lesson to the skills it teaches. The wording is honest: it says the lesson was shown, not that it was read or understood, and nothing requires the learner to scroll, click through, or stay for a time to "complete" a lesson.

**Why this priority**: DL-019 asks for exactly this, and spec 003 recorded lesson events only on questions. Without it, a learner who reads lessons before practising sees no trace of that work, and the record would make reading look like nothing happened.

**Independent Test**: Opening the pilot lesson three times (once from the lesson list, once from a question, once through a detour where the notice was cancelled) records two views; "My work" shows "Number bonds to ten: viewed 2 times, last on {date}" under both skills the lesson teaches, in both languages, with the note that a view is not a measure of understanding.

**Acceptance Scenarios**:

1. **Given** the learner opens a lesson and its content is shown, **Then** one lesson view is recorded with the lesson, the language shown, and the date and time.
2. **Given** a lesson behind the notice of spec 003 (it shows a question's answer) and the learner chooses "Cancel" or "Show visual help instead", **Then** no view is recorded, because the lesson was not shown.
3. **Given** a lesson view in progress, **When** the learner switches language, **Then** no second view is recorded; **When** the learner leaves and opens the lesson again, **Then** a new view is recorded.
4. **Given** lesson views, **When** the learner opens "My work", **Then** each viewed lesson appears with its title in the selected language, the number of views, and the date of the last view in the selected language's date format, together with the sentence that a view shows the lesson was opened, not that it was understood.
5. **Given** a lesson that teaches two skills, **Then** its views appear with each of those skills, and the skill appears in "My work" even when the learner has only viewed its lesson and not practised it.
6. **Given** a lesson view, **Then** it never changes the outcome of any question; a lesson opened from an unanswered question still affects that question exactly as spec 003 records it (help or reveal), and separately counts as a view.

---

### User Story 3 - A learner looks at a recorded question again (Priority: P2)

From the list in "My work", the learner opens any recorded question and sees it again exactly as it was asked, in the language they choose now, with the answers they gave, how each was judged, the outcome, and the tags. Looking at it again does not count as practice, does not change anything in the record, and does not show the answer to a question the learner never got right and never had shown to them.

**Why this priority**: Replay is how a learner (or someone helping them) can see what a recorded line actually means, and it is the visible proof of the identity rule (ADR 0004). It depends on the per-skill list of User Story 1.

**Independent Test**: For every delivery in a scripted record, replay shows the same expression as recorded, in Norwegian and in English; the record is byte-identical before and after replaying; a question never answered correctly and never revealed shows no result anywhere on the page.

**Acceptance Scenarios**:

1. **Given** a recorded question `8 + 5` answered `12` then `13`, **When** the learner opens it, **Then** the page shows `8 + 5`, the answers `12` (not correct, with its feedback wording) and `13` (correct), the outcome "Correct after feedback", the date, and its tags.
2. **Given** a recorded question `6 + 5` answered only `10`, **When** the learner opens it, **Then** the page shows `6 + 5 = ?`, the answer `10` as not correct, and the outcome "Not correct yet", and does not show `11` in any visible text or accessible name.
3. **Given** a recorded question where the answer was shown (a revealing step or a lesson that showed it), **When** it is opened, **Then** the completed equation may be shown, because the learner has already seen it.
4. **Given** a replayed question, **When** the learner switches language, **Then** the same question and work are shown in the other language; **When** the service is asked for the question again, **Then** it resolves to the recorded operands (definition, version, and seed).
5. **Given** replay, **Then** no event is recorded, no outcome or count changes, and the replayed question does not become the question in progress.
6. **Given** a recorded question whose definition can no longer be resolved, or that resolves to different operands than were recorded, **When** it is opened, **Then** the page shows the recorded expression and work from the record and says honestly that the question can no longer be shown as it was asked.
7. **Given** a replayed question that is the unfinished question in progress, **Then** the page offers to continue it in practice (spec 002's resume), not to answer it on the replay page.

---

### User Story 4 - The view works in both languages and with assistive technology (Priority: P3)

Every heading, count, label, date, and note in "My work" and in a replayed question exists in Norwegian Bokmål and English, and the pages are usable by keyboard and screen reader: counts are read as sentences, lists are lists, and controls meet the 44 by 44 target size on touch screens.

**Why this priority**: Both languages and accessibility are first-release requirements; this feature adds new strings and a new page, which the existing checks must cover.

**Independent Test**: The dictionary-parity and literal checks pass with the new strings; a keyboard-only tester opens "My work", expands a skill, opens a replay, and returns without a pointer; a screen reader reads each skill's counts as one sentence.

**Acceptance Scenarios**:

1. **Given** "My work" in Norwegian, **When** the learner switches to English, **Then** every label, count sentence, outcome, tag, lesson title, and date changes language, and the page stays where it was.
2. **Given** keyboard-only use, **When** the learner moves through "My work" and opens and leaves a replay, **Then** focus is always visible and lands on the page heading after each navigation.
3. **Given** a screen reader, **When** it reads a skill summary, **Then** it hears "9 questions: 4 correct on first response, no help, …" as text, not as a table of numbers without context.

---

### Edge Cases

- A record from before this feature (spec 002 and 003 deliveries, no lesson views): all deliveries are summarized under their skills; the lesson history is empty and says so; nothing fails.
- A delivery whose definition is not in the current content (removed or renamed): it is counted under "Other practice" with its recorded expression, and replay says it can no longer be shown.
- The same question delivered twice in a row (the small pool of within ten makes this possible until feature F7): both deliveries are counted, and the second is marked as a repeat.
- A question answered after "More like this" or after a ladder move: it counts under the skill of its own definition, not under where the learner started.
- A lesson opened twice within a second (for example a double activation): one visit, one view; a deliberate reload is a new visit and a new view.
- A lesson shown in English and later in Norwegian: both are views of the same lesson; the history records the language of each and shows one line per lesson.
- Dates around midnight and across time zones: the date shown is the learner's local date at the moment of the view or delivery; no streaks or "days in a row" are derived.
- "Clear my work" (spec 002): clears lesson views together with deliveries, after the same confirmation.
- Browser storage unavailable: views and progress work for the visit only, with spec 002's notice that nothing is being kept.
- Replay while offline or with the service unreachable: the recorded expression and work are shown from the record, with a note that the question could not be loaded from the service.
- A recorded question in progress (unanswered, resumable): it appears as "Unfinished" with "Continue" leading back to practice; replaying it shows no result.

## Requirements *(mandatory)*

### Functional Requirements

**Progress per skill**

- **FR-001**: "My work" MUST group recorded deliveries by the skill of each delivery's definition and show, for each skill with any practice or lesson view, the number of questions practised and the count of each outcome, using spec 002's derivation and wording unchanged (DL-010, DL-029, DL-032). Deliveries with outcome "none" (only unreadable input or nothing) MUST NOT be counted.
- **FR-002**: Summaries MUST be counts only. No percentage, ratio, score, grade, streak, time spent, ranking, badge, or mastery word may appear anywhere in "My work" or a replay (DL-015, constitution I).
- **FR-003**: Each skill MUST offer its list of questions, newest first, each with its expression, outcome, tags, the answers given in order, and its date; an unfinished question MUST be marked as such and offer to continue it in practice (DL-026 (4)).
- **FR-004**: A delivery whose definition and operands (in order) equal those of an earlier delivery MUST be marked as a repeat in the list, and the skill summary MUST state how many of its questions were repeats (mastery.md "Learner-facing summaries").
- **FR-005**: Deliveries whose definition is no longer in the content MUST still be counted and listed, under "Other practice", with their recorded expression.
- **FR-006**: Skills MUST be shown with a learner-facing name in the selected language, taken from the content: each skill file MUST carry a localized name with a non-empty Norwegian Bokmål and English text, kept apart from the skill's identity (skill-graph.md). The skill schema and the content validator MUST require and check it, with a diagnostic naming the file and the missing or empty language; the two pilot skills (`numbers.number-bonds-to-ten`, `numbers.addition-within-20`) MUST get names through content review; the service MUST deliver the name with the skill. The skill's ID never appears to the learner in place of its name.

**Lesson history**

- **FR-007**: The app MUST record a lesson view each time a lesson's content is shown, using spec 003's meaning of "shown" (the content has rendered in a visit): one view per visit, with the lesson ID, the language shown, and the date and time. A lesson held behind spec 003's notice and never opened MUST NOT be recorded as viewed. A language switch within a visit MUST NOT record another view (DL-019).
- **FR-008**: Lesson views MUST NOT depend on scrolling, time spent, clicks inside the lesson, or reaching the end (DL-019), and MUST NOT change any delivery's events or outcome; spec 003's `lesson-opened` and `lesson-reveal` on deliveries are unchanged.
- **FR-009**: "My work" MUST list each viewed lesson with its title in the selected language, the number of views, and the date of the last view, under every skill the lesson teaches (its `skills` list), with the sentence that a view records that the lesson was opened, not that it was understood.
- **FR-010**: "Clear my work" MUST clear lesson views with the deliveries, after spec 002's confirmation; the "kept in this browser only" and "not being kept" notices MUST cover lesson views too.

**Replay**

- **FR-011**: Every listed question MUST open a replay that shows the question as it was asked: its expression, resolved from the stored identity (definition, version, seed or none for a fixed task) through the same service that delivered it, and the recorded work: each answer with its status and feedback wording in the selected language, the outcome, the tags, and the date.
- **FR-012**: Replay MUST NOT record any event, MUST NOT change any outcome, count, or the question in progress, and MUST NOT offer to answer the question on the replay page; an unfinished question in progress MUST instead offer to continue it in practice.
- **FR-013**: Replay MUST NOT show the result of a question that was never answered correctly and never revealed to the learner, in visible text, accessible names, or any data it requests (spec 002 FR-009); the completed equation MAY be shown when the record contains a correct submission or a reveal.
- **FR-014**: When the identity cannot be resolved, resolves to operands different from the recorded ones, or the service is unreachable, replay MUST show the recorded expression and work from the record and say, in the selected language, that the question cannot be shown from the service; it MUST NOT show a different question as if it were the recorded one.

**Languages, accessibility, privacy, and quality**

- **FR-015**: Every new learner-visible string MUST exist in both languages and pass the dictionary-parity and literal checks (DL-038); dates MUST be formatted for the selected language; switching language MUST keep the page and its open sections.
- **FR-016**: "My work" and replay MUST be operable by keyboard and screen reader: headings in order, counts read as sentences, lists as lists, focus moved to the page heading after navigation, and interactive controls at least 44 by 44 on touch screens.
- **FR-017**: The record MUST stay in the learner's browser only (spec 002 FR-022); this feature MUST NOT send the record, lesson views, or any learner identifier to the service; replay MUST send only the question's identity, as practice already does.
- **FR-018**: Every requirement above MUST be covered by automated tests in continuous integration: the skill-name schema and validator check (a missing language, an empty name, a valid file), grouping and counting over scripted records (every outcome, repeats, unknown definitions, old records without views), lesson-view recording rules (shown, behind the notice, language switch, revisit, double activation), replay (same operands in both languages, no events recorded, no result for an unrevealed question, mismatch and unreachable cases), dictionary parity and literals, and end-to-end checks on desktop and iPad viewports.

### Key Entities

- **Skill name**: a localized name (`nb`, `en`) in each skill file, separate from the skill's ID; the content validator requires both languages.
- **Skill progress**: for one skill, the deliveries whose definition belongs to it, the counts per outcome, the number of repeats, and the lesson views of the lessons that teach it. Derived on demand from the record; never stored as a score.
- **Lesson view**: one record per visit in which a lesson's content was shown: lesson ID, language shown, date and time. Separate from deliveries; never evidence about a skill.
- **Lesson history**: per lesson, the number of views and the last view, derived from lesson views.
- **Replay**: a read-only presentation of one recorded delivery: its identity, the resolved question, and its recorded work; nothing about it is stored.
- **Repeat**: a delivery whose definition and ordered operands equal an earlier delivery's.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: For 100 percent of scripted records (every outcome, both skills, repeats, unknown definitions, records from before this feature), the per-skill counts in "My work" equal spec 002's derivation applied to the same deliveries, in both languages.
- **SC-002**: No percentage, score, streak, time spent, or mastery word appears in "My work" or replay in either language (an automated scan of the rendered pages and the dictionaries).
- **SC-003**: Lesson views are recorded exactly once per visit in which the content is shown and never for a lesson kept behind the notice, in 100 percent of the recording tests.
- **SC-004**: For 100 percent of recorded deliveries in the test records, replay shows the recorded question in both languages, the record is unchanged afterwards, and no unrevealed result appears in the page or its requests.
- **SC-005**: A learner (the initial learner of the build brief's validation plan) can say, after one minute on "My work", which skill they practised, how many questions went how, and which lesson they looked at; findings recorded, not scored.
- **SC-006**: Continuous integration still finishes in under 10 minutes with this feature's tests added.

## Assumptions

- Scope: decision-log F6 for the guest record in the browser. Profiles, cross-device persistence, import of guest work, and server-side storage stay in F9 (after its design proposal); repeat avoidance and "Repeat this question" (answering a recorded question again as a new delivery) stay in F7 (spec 005); recommendations, prerequisite diagnosis, and any mastery estimate stay out (mastery.md open questions).
- "My work" becomes the progress view: the overview by skill and the lesson history replace spec 002's flat list, and the per-question list moves under each skill.
- A repeat is the same definition and the same operands in the same order; feature F7 may later define a canonical instance for avoidance, which this view does not depend on.
- Replay is read-only and shows no help or explanation steps; looking at the explanation for a recorded question again would be support on new work, which belongs with F7's deliberate repeat.
- The skill of a delivery is the skill its definition belongs to in the current content; deliveries do not need to store it, and a definition missing from the content falls under "Other practice".
- Dates are local to the learner's browser and shown as dates (no time of day in the summary; the time is kept with each view and delivery for ordering).
- Skill names extend spec 001's content contract: the skill schema gains a required localized name and the validator checks it. All nine skill files in `content/skills/` need names for validation to pass, not only the two pilot skills; their wording goes through content review like any other content, and `content/AUTHORING.md` documents the field.
- Dependencies: specs 001 to 003 merged and deployed; spec 002's outcome derivation and dictionaries, spec 003's notion of "shown" and its lesson page.
