# Feature Specification: Practice for One-Step Equations, with the Balance as Help

**Feature Branch**: `claude/equations-practice`
**Created**: 2026-11-21
**Status**: Draft
**Sources**: [spec 008](../008-one-step-equations/spec.md) (the lesson and the balance explorer, whose assumptions name this change as next), DL-006, DL-044 as extended by the owner on 2026-11-21 (the lesson and then this graded practice ship before the educator review that DL-041 placed before milestone two; the review is still owed and now covers both), the [exercise capability model](../../docs/architecture/exercise-capability-model.md), and the addition practice of specs/002 and specs/005.

A short specification by design: one topic, one change. It adds a second kind of question to practice, $x + a = b$, beside $a + b = ?$, and reuses everything else practice already has: seeds and pools, help and explanation steps, feedback codes, outcomes, the ladder, and "My work".

## User Scenarios & Testing

### User Story 1 – Practise solving x + a = b (Priority: P1)

A learner who has read "Equations and the balance" chooses to practise. A question reads $x + 3 = 7$ and asks for $x$. The learner types 4 and is told it is right, with the check $4 + 3 = 7$.

**Acceptance Scenarios**:

1. **Given** the lesson, **When** the learner starts practice, **Then** a question of the form $x + a = b$ is shown, read aloud as "x plus a equals b. What is x?".
2. **Given** $x + 3 = 7$, **When** the learner answers 4, **Then** the answer is correct and the feedback shows $x = 4$ and the check $4 + 3 = 7$.
3. **Given** $x + 2 = 9$, **When** the learner answers 11, 9, 2, or 6, **Then** the feedback names the likely mistake: added instead of taking away, gave the right side, gave the number next to $x$, or is one away. Any other wrong answer gets a general hint that offers the balance.

### User Story 2 – Get help from the balance (Priority: P1)

**Acceptance Scenarios**:

1. **Given** a question, **When** the learner asks for visual help, **Then** a balance scale shows $x$ and $a$ weights on the left pan and $b$ on the right, level, and steps through: take $a$ off both pans, then $x$ stands alone and balances $b - a$. Only the last step shows the answer, and it is marked as showing it.
2. **Given** a wrong answer, **When** the learner asks for the explanation, **Then** the same steps explain the solution.

### User Story 3 – Climb from small to larger equations (Priority: P2)

**Acceptance Scenarios**:

1. **Given** the skill "One-step equations", **Then** its ladder has two rungs: right sides up to 10, then right sides from 11 to 15.
2. **Given** a finished question, **Then** "My work" lists it as $x + a = b$ with its outcome, and its replay shows the same equation.

### Edge Cases

- A lesson shows a question's answer when a balance explorer has the same $a$ and $b$, or when the lesson writes the equation and then $x = $ its answer before another equation begins; the lesson gate then warns as it does for addition. A solution written for another equation does not count.
- Records from before this change carry no question form and are read as addition.
- Self-checks stay addition only in this change; the content check refuses an equation definition in a self-check.
- Moving from addition practice to equations drops a pending difficulty change and does not resume an unanswered addition question; that question still resumes in addition practice.

## Requirements

### Functional Requirements

- **FR-001**: The content contract MUST register a generator `unknown-addend@1` with the relation `unknown-addend` and parameters `addend` ($a$), `unknown` ($x$), and `total` ($b = a + x$), whose canonical order is $a$ ascending, then $x$ ascending.
- **FR-002**: The content contract MUST register a validator `equation-answer@1` that accepts $b - a$ and emits exactly one code, in this precedence: `eq.correct`, `eq.added` ($a + b$), `eq.total` ($b$), `eq.addend` ($a$), `eq.offByOne`, `eq.generic`; and the representation `balance` for help and explanation.
- **FR-003**: Every instance MUST carry its question form, `addition` or `unknown-addend`, decided by its validator, whose registry entry names the form; the content check MUST refuse a generated definition whose generator relation does not make that form; the learner app MUST draw the prompt, feedback, replay, and "My work" by that form and MUST NOT compute an answer.
- **FR-004**: The service MUST supply the balance steps for an instance; only the last step carries the answer.
- **FR-005**: Two definitions MUST exist for the skill `algebra.one-step-equations`: right sides 2–10 (45 questions) and right sides 11–15 (30 questions), each with $a$ and $x$ from 1 to 9; the skill's ladder lists them in that order, and the lesson lists them as practice.
- **FR-006**: The lesson disclosure rule MUST apply to equations as the edge case above says.
- **FR-007**: Every new learner-visible text MUST exist in both release languages.

## Success Criteria

- **SC-001**: A learner can open practice from the lesson, answer, get balance help, and see the question in "My work", in both languages, by pointer or keyboard alone.
- **SC-002**: Domain, contract, component, content, and end-to-end tests cover FR-001 to FR-007 on desktop and iPad.

## Assumptions

- Only $x + a = b$ with whole numbers and $x \ge 1$. Subtraction and multiplication equations are later slices.
- The balance in help is a picture stepped by the service; the interactive explorer stays in the lesson.
