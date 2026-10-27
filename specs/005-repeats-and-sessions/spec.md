# Feature Specification: Repeat Avoidance, "Repeat This Question", and Session Controls

**Feature Branch**: not created yet (spec directory `specs/005-repeats-and-sessions/`; Spec Kit treats the two as independent)

**Created**: 2026-10-25

**Status**: Draft

**Input**: User description: "Spec 005 (decision-log feature F7): repeat avoidance, "Repeat this question", and further session controls. A learner practising a skill should rarely get the same question again by chance (repeat avoidance over the generated pool, per the delivery identity), while still being able to deliberately repeat a recorded question as new practice ("Repeat this question", a new delivery with the same identity, kept distinguishable from first attempts in the record and the progress view), plus the further session controls the decision log assigns to F7. Builds on spec 002's generator, identity (definition, version, seed), ladder and session record, spec 003's lesson detour, and spec 004's progress view, repeats, and replay; both languages; F9 profiles and persistence stay out of scope."

## Sources this specification depends on

Per the constitution's specification rules, this feature restates existing decisions and creates no new requirement. Spec 002 delivered the challenge ladder, "Another question", "More like this", and a resumable end of session, and left repeat avoidance, "Repeat this question", and further session controls to this feature (spec 002 Assumptions).

- **Decision-log rows**:
  - **F7** ("Challenge ladder, repeats, session controls"; verdict "specify with corrections": the ladder schema from DL-033, and the bounded repeat search specified).
  - **DL-026 (3)** ("More like this" keeps the current variation and replaces a pending change with a visible notice) and **DL-026 (4)** (finishing a session keeps an unanswered question resumable with its draft and support context).
  - **DL-015**: summaries are counts; no historical help taint.
  - **DL-029** and **DL-032**: outcome precedence, unchanged.
- **Documents**:
  - [learning experience](../../docs/design/learning-experience.md) "More practice and learner control": avoid recent repeats where practical, permit deliberate repetition, and explain when the available variants are exhausted; bounded sessions offer another session.
  - [mastery](../../docs/learning/mastery.md) "Learner-facing summaries": repeated exposure to the same question must remain distinguishable from work on new variations.
  - The [corrections addendum](../../docs/reviews/round-01/claude-fable/revised-build-brief-corrections.md) §D ("Repeat avoidance compares the canonical instance (`{a, b}`, ordered for presentation, unordered within the recent window) over at most the last eight deliveries in the current definition; the search is bounded, and when the pool is exhausted the next question is delivered and marked as a repeat… Selection history stays outside generation so the resolved identity always replays") and its backlog row 9.
  - ADR 0004 (reproducible identity).
- **Evidence**: the round-04 synthesis F7 row (acceptance: replay across a challenge change, draft retention, bounded search and exhaustion, deliberate repeat); the prototype's repeat handling as the design reference.
- **Earlier features**:
  - [spec 002](../002-practice-flow/spec.md): identity, generator pools, ladder, controls, the session record, and outcomes.
  - [spec 003](../003-lesson-rendering/spec.md): the lesson detour and its disclosure rule, which applies per question.
  - [spec 004](../004-progress-view/spec.md): "My work" and its repeat count; replay, which records nothing.

## Clarifications

### Session 2026-10-26

- Q: What do F7's "further session controls" add beyond spec 002's controls ("Another question", "More like this", the ladder, and the resumable end of session on leaving the practice page)? → A: A "Finish practice" action with a summary of this session (counts per outcome and repeats, by chance and on request) and "Practise again"; no fixed session length (User Story 3, FR-011 to FR-014).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A learner does not get the same question again by chance (Priority: P1)

A learner, as a guest in Norwegian Bokmål or English, practises addition and asks for "Another question" or "More like this" again and again. The questions they get differ from the ones they had just before: a question they had among their recent questions in this variation, in either order (`3 + 7` or `7 + 3`), does not come back by chance while other questions of the variation are still available. When a variation has so few questions that every one of them was recent, the learner still gets a question, and the screen says honestly that this variation has no other questions right now and that this one repeats.

**Why this priority**: The pools are small (25 different pairs within ten, 20 across ten, counting `3 + 7` and `7 + 3` as one), and spec 002 draws each question at random, so repeats are common. The progress view (spec 004) already shows how often that happens. Repeating by chance wastes the learner's practice and makes the record read as repeated work the learner did not ask for.

**Independent Test**: A scripted series of 100 "Another question" requests on each pilot variation never gives a question that was among the last eight of that variation (in either order); a variation with fewer questions than the window repeats, says so, and the repeat is marked in the record.

**Acceptance Scenarios**:

1. **Given** a learner practising within ten, **When** they ask for "Another question" repeatedly, **Then** no question equals (in either order) any of the previous eight questions delivered in that variation.
2. **Given** "More like this" or the next question after a pending "Make it easier" or "More challenge", **Then** the same rule applies within the variation the question comes from; a question from another variation does not count against it.
3. **Given** a variation whose every question is among the recent ones (today only the fixed task, with one question; in general any pool of eight questions or fewer), **When** the learner asks for another question, **Then** they get one, it is marked as a repeat, and a notice in the selected language says this variation has no other questions right now.
4. **Given** a question delivered after avoiding recent ones, **When** it is replayed (spec 004) or reproduced from its identity, **Then** it is the same question: avoidance chooses which question is delivered, it never changes what an identity resolves to, and questions passed over are neither shown nor recorded.
5. **Given** a reload or a later visit in the same browser, **Then** the recent questions are still taken from the guest record, so a reload does not reset avoidance.

---

### User Story 2 - A learner deliberately repeats a question (Priority: P1)

A learner wants to try a question again: one they just answered, or one they see in "My work". They choose "Repeat this question" and get exactly that question again as new practice. The new attempt starts fresh, with no answer, no help open, and no explanation, and it is recorded as a new question that repeats an earlier one at the learner's request. "My work" keeps it apart from questions repeated by chance and from first attempts, and its outcome depends only on what happens in the new attempt.

**Why this priority**: Deliberate repetition is how a learner practises a question they found hard, and the documents require it ("permit deliberate repetition"; "Repeat this question" is always available, addendum backlog row 9). Without it, avoidance would make it impossible to get a question back.

**Independent Test**: Answer a question wrongly with help, choose "Repeat this question", and answer it correctly with no help: the record shows two questions; the second is "Correct on first response, no help" with the tag "Repeated on request"; "My work" counts both and says one was repeated at the learner's request; both replay to the same question.

**Acceptance Scenarios**:

1. **Given** a question with a result (any submission), **When** the learner chooses "Repeat this question" on the practice screen, **Then** the same question (same definition, version, and seed or none) is delivered as a new question, with an empty answer field and help and explanation closed.
2. **Given** a recorded question in a replay (spec 004), **When** the learner chooses "Repeat this question", **Then** practice opens on that question's skill with that question as a new question, the ladder position follows that question's variation, and the replay itself still records nothing.
3. **Given** an unanswered question in progress, **When** the learner repeats another question from a replay, **Then** the question in progress is closed exactly as when a practice entry replaces it (spec 002 and 003: skipped when nothing was submitted), and the repeated question becomes current.
4. **Given** a repeated question, **When** its outcome is derived, **Then** only its own events count: help used on the earlier attempt does not make the new one "with help", and the earlier attempt's outcome does not change (DL-015, DL-029).
5. **Given** a repeated question whose answer the lesson shows, **Then** spec 003's notice applies to it as to any other question.
6. **Given** "My work", **Then** a question repeated on request carries the tag "Repeated on request" instead of "Repeated question", and the skill's repeat sentence says how many repeats were at the learner's request.
7. **Given** the question in progress (unanswered), **Then** the practice screen does not offer "Repeat this question" for it, and a replay of it offers "Continue" as before (spec 004).

---

### User Story 3 - A learner finishes a practice session and sees what they did (Priority: P2)

A learner who is done practising chooses "Finish practice". The session ends where they are: an unanswered question stays resumable with its draft and the help used (DL-026 (4)). The learner sees a short summary of this session, in counts and in the same words as "My work" (how many questions, how they went, and how many repeated an earlier one), with "Practise again" to start a new session on the same skill and a link to "My work".

**Why this priority**: Today a session ends only when the learner leaves the practice page, without a summary; learning-experience.md describes sessions that end and offer another session. The owner chose an explicit finish with a summary and no fixed session length (Clarifications). It builds on stories 1 and 2 only for the repeat counts.

**Independent Test**: Practise three questions, leave the fourth with a draft, and choose "Finish practice": the summary counts three answered and one unfinished in both languages, with no percentage or score; "Practise again" resumes the unfinished question with its draft; "My work" shows the same counts within the skill.

**Acceptance Scenarios**:

1. **Given** a session with answered questions and one unanswered with a draft, **When** the learner chooses "Finish practice", **Then** the summary lists this session's questions as counts per outcome, the unanswered one is "Unfinished", and nothing is lost.
2. **Given** the summary, **When** the learner chooses "Practise again", **Then** the unfinished question resumes with its draft and help state (DL-026 (4)), or, when the session ended on a question with a result, a new question is delivered, never the finished one.
3. **Given** the summary, **Then** it shows no percentage, score, streak, or mastery word, and its counts equal spec 002's derivation over this session's questions as they were when the session finished.
4. **Given** a question left unfinished in one session and answered after "Practise again", **When** the learner finishes again, **Then** the new summary counts it with its new outcome; until then, the earlier summary still shows the outcome it had when that session finished.

---

### User Story 4 - The controls work in both languages and with assistive technology (Priority: P3)

Every new action, notice, tag, and sentence exists in Norwegian Bokmål and English, and the new controls are operable by keyboard and screen reader, with 44 by 44 targets on touch screens.

**Why this priority**: Both languages and accessibility are first-release requirements; this feature adds actions and notices that the existing checks must cover.

**Independent Test**: Dictionary parity and literal checks pass with the new strings; a keyboard-only tester repeats a question, sees the exhausted-pool notice announced, and (with story 3) finishes a session, all without a pointer.

**Acceptance Scenarios**:

1. **Given** the exhausted-pool notice, **When** it appears, **Then** a screen reader announces it once, politely, and focus stays where the learner is working.
2. **Given** keyboard-only use, **When** the learner chooses "Repeat this question" on the practice screen or in a replay, **Then** focus lands on the question as it does for any new question.

---

### Edge Cases

- **Records from before this feature**: avoidance reads the questions already in the guest record, so the first new question avoids them. Deliveries without a repeat reason are treated as not repeated on request; spec 004's "Repeated question" marking still applies to them.
- **A challenge change**: the window is per variation, so moving from within ten to across ten and back avoids the last eight questions within ten, however long ago they were in time.
- **"More like this" after a pending change**: it keeps the current variation (DL-026 (3)) and avoids its recent questions.
- **The fixed task** (`4 + 4`, one question): every request after the first repeats and says so; repeating it on request is a repeat on request, not a chance repeat.
- **Repeating a repeat**: it repeats the same question again; each attempt is its own question in the record.
- **Repeating while a lesson detour is open**: the detour's question is the one in progress; repeating another question from a replay closes it as in acceptance scenario 2.3, and the lesson's return banner then refers to the new question.
- **The service unreachable**: "Repeat this question" behaves like any question request that fails (spec 002's load error); nothing is recorded until the question is shown.
- **The variation's pool cannot be loaded**: the question is still delivered, as before this feature, without avoidance; avoidance never stops a learner from getting a question.
- **The same question recently delivered by chance and then repeated on request**: the repeat on request is never refused because of avoidance; avoidance only governs questions the learner did not choose.
- **A session that spans a detour or several days**: a lesson detour, a look at "My work", a replay, or a later visit does not end the session; its summary counts every question worked since the learner last finished. A record from before this feature has never been finished, so its first summary counts all its questions.
- **A question resumed after a finish**: it belongs to both sessions. Each summary shows its outcome as it was when that session finished.
- **"Finish practice" when no question was shown** (for example after a load failure): the summary says there are no questions in this session and still offers "Practise again".
- **Questions passed over during avoidance**: never shown, never recorded, and never visible in replay or "My work".
- **Avoidance and a pool larger than the window**: a question from beyond the last eight may come back; that is a repeat by chance and is marked as in spec 004.

## Requirements *(mandatory)*

### Functional Requirements

**Repeat avoidance**

- **FR-001**: When delivering a question the learner did not choose (after "Another question", "More like this", a ladder change, or the first question of a session), the app MUST deliver a question that does not equal any of the last eight questions delivered in the same variation, comparing the two numbers without regard to order, whenever the variation has such a question (addendum §D).
- **FR-002**: When every question of the variation is among those eight, the app MUST still deliver a question, mark it as a repeat in the record, and show a notice in the selected language that this variation has no other questions right now (learning-experience: "explain when the available variants are exhausted").
- **FR-003**: Avoidance MUST only choose which identity is delivered: the delivered question MUST be fully identified by (definition, version, seed), and MUST replay to the same question by spec 002's rule. Questions passed over MUST NOT be shown, recorded, or sent anywhere beyond what choosing requires (addendum §D, ADR 0004).
- **FR-004**: The recent questions MUST come from the guest record of this browser, so avoidance continues across reloads and sessions; "Clear my work" clears them with the rest of the record.
- **FR-005**: Avoidance MUST be bounded: for any pool, including one smaller than the window, a question MUST be shown within one second of the request on a local network, as it is today, and the work to choose it MUST have a fixed upper limit that does not depend on luck.

**Repeat this question**

- **FR-006**: The practice screen MUST offer "Repeat this question" for the current question once it has a result, and a replay (spec 004) MUST offer it for any recorded question except the unanswered question in progress, which keeps "Continue".
- **FR-007**: "Repeat this question" MUST deliver the same identity as a new question in the record, with a fresh answer field and help and explanation closed, and MUST record that the question repeats an earlier one at the learner's request. It MUST never be refused because of avoidance.
- **FR-008**: From a replay, "Repeat this question" MUST open practice on the question's skill with the question's variation as the ladder position, close an unanswered question in progress as a practice entry does (spec 002 and 003), and leave the replay itself without any recorded event (spec 004 FR-012).
- **FR-009**: The outcome of a repeated question MUST be derived from its own events only (DL-015, DL-029); earlier attempts MUST keep their outcomes.
- **FR-010**: "My work" and replay MUST show a question repeated on request with the tag "Repeated on request" instead of "Repeated question", and the skill's repeat sentence MUST also state how many repeats were at the learner's request; counts remain counts (spec 004 FR-002).

**Session controls** (Clarifications, Q1)

- **FR-011**: The practice screen MUST offer "Finish practice", which ends the session as leaving the practice page does today: an unanswered question stays resumable with its draft and support context (DL-026 (4)).
- **FR-012**: Finishing MUST show a summary of this session's questions as counts per outcome, with the number repeated by chance and on request, in spec 002's and spec 004's wording, with "Practise again" (resuming the unfinished question or starting a new one) and a link to "My work".
- **FR-013**: The session summary MUST show no percentage, score, streak, time, or mastery word. Sessions MUST NOT have a fixed length.
- **FR-014**: A practice session MUST contain every question worked in it, meaning delivered, resumed, or repeated, from the previous "Finish practice" (or the start of the record) until the learner chooses "Finish practice". A question resumed in a later session belongs to that session too. Leaving the practice page for a lesson detour, "My work", or a replay MUST NOT split the session; it still keeps an unanswered question resumable, as today (DL-026 (4)). A summary MUST show each question's outcome and repeat kind as they were when the session finished, with repeats classified against the learner's whole record, and "Practise again" MUST NOT reopen a question that already has a result.

**Languages, accessibility, privacy, and quality**

- **FR-015**: Every new action, notice, tag, and sentence MUST exist in both languages and pass the dictionary-parity, literal, and wording checks (DL-038; spec 004 SC-002).
- **FR-016**: The new notices MUST be announced once, politely, without moving focus; the new actions MUST be keyboard-operable with visible focus and 44 by 44 targets on touch screens; a repeated question MUST receive focus like any new question.
- **FR-017**: The guest record MUST stay in the browser (spec 002 FR-022; spec 004 FR-017); this feature MUST NOT upload the record or the list of recent questions as a history. Records written before this feature MUST load without loss.
- **FR-018**: Every requirement above MUST be covered by automated tests in continuous integration:
  - avoidance over scripted series of requests on each pilot variation and on a pool smaller than the window;
  - identity and replay of avoided-and-delivered questions;
  - repeat on request from practice and from replay, with outcome independence and tags;
  - avoidance across reloads and challenge changes;
  - the session summary, finishing, and "Practise again";
  - dictionary and wording checks;
  - end-to-end checks on desktop and iPad viewports.

### Key Entities

- **Recent questions of a variation**: the last eight questions delivered in one variation (definition and version), taken from the guest record; compared by their two numbers regardless of order.
- **Repeat on request**: a delivery that repeats an earlier delivery's identity because the learner chose "Repeat this question"; it records which delivery it repeats.
- **Chance repeat**: a delivery whose question equals an earlier one without the learner asking (after exhaustion, or beyond the window); marked as in spec 004.
- **Practice session**: the questions worked (delivered, resumed, or repeated) since the previous "Finish practice", or since the record began, up to the next "Finish practice"; detours away from the practice page do not split it.
- **Session summary**: counts per outcome and repeat counts over the questions of one practice session, from a snapshot of their outcomes and repeat kinds taken at finish. These are outcome labels and counts, never a score.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 100 percent of scripted series of 100 requests per pilot variation, no delivered question repeats (in either order) one of the previous eight in that variation.
- **SC-002**: In 100 percent of scripted cases with a pool of eight questions or fewer, a question is still delivered, marked as a repeat, and the notice is shown in the selected language.
- **SC-003**: 100 percent of delivered questions, including those chosen by avoidance and those repeated on request, replay to the same question in both languages.
- **SC-004**: For 100 percent of repeated-on-request questions in the test records, the outcome equals spec 002's derivation over that question's own events, and "My work" distinguishes them from chance repeats and first attempts.
- **SC-005**: A learner (the initial learner of the build brief's validation plan) can repeat a question they found hard and, after one minute on "My work", say which questions they repeated on purpose; findings recorded, not scored.
- **SC-006**: Continuous integration still finishes in under 10 minutes with this feature's tests added.

## Assumptions

- **Scope**: decision-log F7 for the guest record in the browser. The ladder, "Another question", "More like this", and the resumable end of session exist from spec 002 and are unchanged except where they now avoid recent questions. Self-checks ("Check my understanding") are F8 and stay out. Sessions have no fixed length (owner decision, Clarifications). Profiles and persistence are F9. Automatic adaptation and recommendations stay out (learning-experience: "automatic adaptation remain[s] open").
- **The window** is the addendum's: the last eight deliveries in the current variation, compared by the unordered pair of numbers. Spec 004's "Repeated question" marking stays as it is: same definition, version, and ordered numbers. So `7 + 3` after `3 + 7` is avoided by this feature but, if it happens beyond the window, is not marked by spec 004 as a repeat.
- **Pool sizes**: within ten has 25 different questions and across ten 20, counting `3 + 7` and `7 + 3` as one. Neither runs out within a window of eight; only a pool of eight or fewer (today, the fixed task) does. The exhausted-pool behaviour is therefore tested with the fixed task and with a scripted small pool.
- **Repeating from a replay** closes an unanswered question in progress as choosing a practice entry does (skipped when nothing was submitted), because the learner has chosen other work. Finishing a session (story 3) keeps it resumable instead (DL-026 (4)), because the learner has chosen to stop.
- **The record** gains a reference to the repeated delivery and the reason "on request". Records written before this feature have neither and load unchanged.
- **Dependencies**: specs 001 to 004 merged and deployed; spec 002's generator with its canonical enumeration of each pool; spec 004's "My work", repeats, and replay.
