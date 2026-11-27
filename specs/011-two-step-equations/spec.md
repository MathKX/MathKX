# Feature Specification: Two-Step Equations Like 2x + 3 = 11 on the Balance

**Feature Branch**: `claude/equations-two-step`
**Created**: 2026-11-22
**Status**: Draft
**Sources**: [spec 008](../008-one-step-equations/spec.md) (the balance and its rule), [spec 009](../009-equations-practice/spec.md) (question forms, practice, balance help), [spec 010](../010-equations-sharing/spec.md) (sharing into equal groups), DL-006, and DL-044 as extended on 2026-11-22 (this lesson and its practice ship before the educator review, which stays owed and covers them too).

A short specification by design: one topic, one change. It joins the two moves the learner already knows, taking the same off both pans and sharing into equal groups, into a new skill and lesson for equations $ax + c = b$.

## User Scenarios & Testing

### User Story 1 – Two steps on the balance (Priority: P1)

A new lesson, "Two steps on the balance", shows $2x + 3 = 11$: two boxes marked $x$ and 3 unit weights on the left pan, 11 unit weights on the right, the scale level.

**Acceptance Scenarios**:

1. **Given** the explorer, **When** the learner chooses "Take one weight off both pans", **Then** one loose weight leaves each pan, the scale stays level, and the equation reads $2x + 2 = 10$.
2. **Given** loose weights are still beside the boxes, **Then** "Give each group one weight" is disabled, and the explorer says to take the loose weights off both pans first, so the boxes stand alone.
3. **Given** the boxes stand alone ($2x = 8$), **When** the learner shares the weights one round at a time and then chooses "Keep one box and one group", **Then** one box balances 4 weights and the explorer says $x = 4$ with the check $2 × 4 + 3 = 11$.
4. **Given** any state, **When** the learner chooses "Undo" or "Start again", **Then** the previous or the authored state returns.

### User Story 2 – Practise ax + c = b (Priority: P1)

**Acceptance Scenarios**:

1. **Given** the skill "Two-step equations", whose prerequisite is "One-step equations", **Then** its ladder has one rung, equations such as $2x + 3 = 11$, and the lesson lists it as practice.
2. **Given** $2x + 3 = 11$, **When** the learner answers 4, **Then** the answer is correct with the check $2 × 4 + 3 = 11$. **When** the learner answers 8, **Then** the feedback says the weights still need sharing. **When** the answer comes from adding 3 instead of taking it away, from sharing before taking away, or from reading $2x$ as $2 + x$, **Then** the feedback names that mistake. One away gets "nearly"; any other wrong answer gets a general hint that offers the balance.
3. **Given** a question, **When** the learner asks for visual help, **Then** the balance shows the boxes and the weights, then $c$ weights taken off both pans, then the first round of sharing, then one box against one group with $x$; only the last step shows the answer. When one round would share every weight ($x = 1$), the third step marks the empty groups instead and asks to share the weights until every one is shared (PR 65 review); the same holds for the sharing help of spec 010.

### User Story 3 – The same for everyone (Priority: P1)

As spec 008 User Story 3: every control reachable by keyboard with a visible focus ring and a 44-pixel target, each change announced once, including what to do next, and the drawing described in both release languages.

### Edge Cases

- Questions with the same $a$ and $b$ but a different $c$ are different questions, for repeat avoidance, progress, and replay.
- A lesson shows the answer to $ax + c = b$ when a two-step explorer shows that equation on its way to $x$ (the same $a$ and $b − c$, with $c$ no greater than the explorer's), or when the lesson writes $ax + c = b$ and then $x = (b − c) / a$ before another equation begins; the intermediate $ax = b − c$ of the same working does not end it. The explorer also shows $ax = b − c$, so it discloses that one-step question too. By the same rule, the balance explorer of spec 008 discloses every $x + a = b$ it shows level on the way (PR 65 review).
- The service is unreachable: the explorer offers a retry, as the other explorers do.

## Requirements

### Functional Requirements

- **FR-001**: A question MAY carry a third number $c$, and only a two-step question does: the service MUST ignore a $c$ in the prompt of a fixed task of another form (PR 65 review). The service MUST include it in the question, its pool, and the check answer when present, and the learner app MUST record it with the question and use it to tell questions apart. Questions without it are unchanged.
- **FR-002**: The content contract MUST register the visual component `balance-two-step-explorer` with integer attributes `a` (2–3), `c` (1–6), and `b` (3–20); the content check MUST reject values whose $b − c$ is not $a$ times a whole number from 1 to 5.
- **FR-003**: The service MUST supply every state of the two-step explorer (loose weights on the left, weights on the right, weights in each group, weights not yet shared, whether one box and one group are kept, and whether $x$ is found) and MUST refuse other values. The learner app MUST draw only those states and MUST NOT offer sharing before the loose weights are off.
- **FR-004**: The content contract MUST register the question form `two-step` ($ax + c = b$), a generator `two-step@1` (parameters `factor`, `addend`, `unknown`, `total`; $a$ ascending, then $c$, then $x$), a validator `two-step-answer@1` that accepts $(b − c) / a$ and emits one code in the precedence `two.correct`, `two.notShared` ($b − c$), `two.addedFirst` ($(b + c) / a$), `two.divideFirst` ($b / a − c$), `two.factorAsAddend` ($b − c − a$), `two.offByOne`, `two.generic`, and the representation `balance-two-step` for help and explanation. Every representation MUST name the question forms it draws, and the content check and the service MUST refuse a definition whose help or explanation draws another form than its validator judges (PR 65 review). The content check MUST refuse generator bounds that admit no equation, and a fixed $ax + c = b$ without all three numbers or without a whole-number solution of at least 1, whatever its representations; the service refuses such a fixed task on load.
- **FR-005**: The skill `algebra.two-step-equations` MUST have `algebra.one-step-equations` as its prerequisite and the one-rung ladder `algebra.two-step.within-20` ($a$ from 2 to 3, $c$ from 1 to 6, $x$ from 1 to 5, $b$ at most 20); `algebra.linear-equations` gains it as a prerequisite.
- **FR-006**: Every new learner-visible text MUST exist in both release languages, and the lesson's two translations MUST keep the same sections and directives.

## Success Criteria

- **SC-001**: A learner can solve $2x + 3 = 11$ on the explorer and practise $ax + c = b$ with balance help, by pointer or keyboard alone, in both languages.
- **SC-002**: Domain, contract, component, content, and end-to-end tests cover FR-001 to FR-006 on desktop and iPad.

## Assumptions

- Whole-number solutions from 1 to 5 only; $a$ from 2 to 3 and $c$ up to 6 keep the boxes and the loose weights on one pan.
- The explorer offers only moves that keep the scale level; tipping the scale is spec 008's lesson.
- Self-checks stay addition only.
- The lesson is a draft and, with its practice, falls under the educator review that DL-044 leaves owed (extended to this change on 2026-11-22).
