# Feature Specification: Equations Like 3x = 12, Shared on the Balance

**Feature Branch**: `claude/equations-sharing`
**Created**: 2026-11-21
**Status**: Draft
**Sources**: [spec 008](../008-one-step-equations/spec.md) (whose assumptions name multiplication equations, split into equal groups, as a later slice), [spec 009](../009-equations-practice/spec.md) (question forms, practice, and balance help), DL-006, and DL-044 as extended on 2026-11-21 (the equations lesson and its graded practice ship before the educator review, which stays owed and covers this change too).

A short specification by design: one topic, one change. It adds equations $ax = b$ to the equations lesson, as a new explorer and a third rung of practice.

## User Scenarios & Testing

### User Story 1 – Share the weights into equal groups (Priority: P1)

In "Equations and the balance", a new section shows $3x = 12$: three boxes marked $x$ on the left pan and 12 unit weights on the right, the scale level.

**Acceptance Scenarios**:

1. **Given** the section is open, **When** the learner chooses "Give each group one weight", **Then** one weight moves from the pile into each of three groups, one group for each $x$, and the scale stays level.
2. **Given** all 12 weights are shared, **When** the learner chooses "Keep one box and one group", **Then** the other boxes and groups are drawn as outlines, one $x$ balances 4 weights, and the explorer says $x = 4$ with the check $3 × 4 = 12$.
3. **Given** weights are still in the pile, **Then** "Keep one box and one group" is disabled, and the explorer says how many weights each group has and how many are not shared yet.
4. **Given** any state, **When** the learner chooses "Undo" or "Start again", **Then** the previous or the authored state returns.

### User Story 2 – Practise ax = b (Priority: P1)

**Acceptance Scenarios**:

1. **Given** the skill "One-step equations", **Then** its ladder has a third rung, equations such as $3x = 12$, and the lesson lists it as practice.
2. **Given** $3x = 12$, **When** the learner answers 4, **Then** the answer is correct with the check $3 × 4 = 12$; **When** the learner answers 36, 12, 9, or 3, **Then** the feedback names the likely mistake: multiplied instead of shared, gave the right side, took away instead of shared, or gave the number in front of $x$. One away gets "nearly"; any other wrong answer gets a general hint that offers the balance.
3. **Given** a question, **When** the learner asks for visual help, **Then** the balance shows the boxes and the weights, then the first round of sharing (one weight to each group), then one box against one group with $x$; only the last step shows the answer.

### User Story 3 – The same for everyone (Priority: P1)

As spec 008 User Story 3: every control reachable by keyboard with a visible focus ring and a 44-pixel target, each change announced once, and the drawing described in both release languages. When the last weight is shared, the announcement also says what to do next: keep one box and one group.

### Edge Cases

- A lesson shows the answer to $ax = b$ when a sharing explorer has the same $a$ and $b$, or when the lesson writes $ax = b$ and then $x = b/a$ before another equation begins.
- The service is unreachable: the explorer offers a retry, as the other explorers do.

## Requirements

### Functional Requirements

- **FR-001**: The content contract MUST register the visual component `balance-sharing-explorer` with integer attributes `a` (2–4) and `b` (2–20); the content check MUST reject values whose $b$ is not $a$ times a whole number from 1 to 5.
- **FR-002**: The service MUST supply every state of the sharing explorer (weights in each group, weights not yet shared, whether one box and one group are kept, and whether $x$ is found) and MUST refuse other values. The learner app MUST draw only those states.
- **FR-003**: The content contract MUST register the question form `unknown-factor` ($ax = b$), a generator `unknown-factor@1` (parameters `factor`, `unknown`, `product`; $a$ ascending, then $x$), a validator `factor-answer@1` that accepts $b / a$ and emits one code in the precedence `fac.correct`, `fac.multiplied`, `fac.total`, `fac.subtracted`, `fac.factor`, `fac.offByOne`, `fac.generic`, and the representation `balance-sharing` for help and explanation. The content check MUST refuse generator bounds where no whole-number factor and unknown give a product in range, and a fixed $ax = b$ whose $a$ is not positive or whose $b$ is not a positive multiple of $a$, whatever its representations; the service refuses such a fixed task on load.
- **FR-004**: The definition `algebra.one-step.times` MUST have $a$ from 2 to 4 and $x$ from 1 to 5 (15 questions), be the third rung of the skill's ladder, and be listed as practice in the lesson.
- **FR-005**: Every new learner-visible text MUST exist in both release languages, and the lesson's two translations MUST keep the same sections and directives.

## Success Criteria

- **SC-001**: A learner can solve $3x = 12$ on the explorer and practise $ax = b$ with balance help, by pointer or keyboard alone, in both languages.
- **SC-002**: Domain, contract, component, content, and end-to-end tests cover FR-001 to FR-005 on desktop and iPad.

## Assumptions

- Whole-number solutions only; $a$ from 2 to 4 keeps the groups readable on one pan.
- Self-checks stay addition only.
