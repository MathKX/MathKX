# Feature Specification: One-Step Equations and the Balance

**Feature Branch**: `claude/balance-scale-equations`
**Created**: 2026-11-21
**Status**: Implemented (first slice: the lesson and the balance explorer)
**Sources**: DL-006 (one-step equations as milestone two), the [learning model](../../docs/learning/learning-model.md), the [design principles](../../docs/design/design-principles.md), and the visual pattern of the ten-frame explorer (specs/003 FR-007).

A short specification by design: one topic, one change. Practice for this skill (a generator, a validator, and a ladder) is a later change with its own short specification.

## User Scenarios & Testing

### User Story 1 – See an equation as a balance (Priority: P1)

A learner opens "Equations and the balance" from the lesson list. A balance scale shows $x + 3 = 7$: a box marked $x$ and 3 unit weights on the left pan, 7 unit weights on the right pan, and the scale level. Below it the equation is written out.

**Acceptance Scenarios**:

1. **Given** the lesson is open, **When** the scale loads, **Then** it is level, shows the authored equation, and offers "Take 1 off both pans", "Take 1 off the left pan", "Take 1 off the right pan", "Undo", and "Start again".
2. **Given** the scale is level, **When** the learner takes a weight off only one pan, **Then** the scale tips toward the heavier pan, the equals sign becomes ≠, and a hint says to undo and take the same off both pans.
3. **Given** the scale tips, **When** the learner chooses "Undo", **Then** the previous state returns.

### User Story 2 – Solve by keeping the scale level (Priority: P1)

**Acceptance Scenarios**:

1. **Given** $x + 3 = 7$, **When** the learner takes 1 off both pans three times, **Then** the scale stays level after each step, $x$ stands alone, the equation reads $x = 4$, and the explorer says so with a check: $4 + 3 = 7$.
2. **Given** a solved or changed scale, **When** the learner chooses "Start again", **Then** the authored equation returns.

### User Story 3 – The same for everyone (Priority: P1)

**Acceptance Scenarios**:

1. **Given** keyboard only, **When** the learner tabs through the controls, **Then** each control is reachable, shows the focus ring, and works with Enter.
2. **Given** a screen reader, **When** the scale changes, **Then** the pans' contents, the tilt, and a solution are announced once, and the drawing carries the same description.
3. **Given** an iPad, **When** the lesson is shown, **Then** each control is at least 44 by 44 pixels and the page does not scroll sideways.
4. **Given** either release language, **Then** the lesson and the explorer are fully translated.

### Edge Cases

- The service is unreachable: the explorer says the illustration could not be loaded and offers a retry; the rest of the lesson stays usable.
- A pan is empty: the buttons that would take from it are disabled.
- Reduced motion: the scale changes without animation.

## Requirements

### Functional Requirements

- **FR-001**: The content contract MUST register the visual component `balance-explorer` with integer attributes `a` (1–9) and `b` (2–15), for the equation $x + a = b$.
- **FR-002**: The content validator MUST reject a balance explorer whose `b` is not greater than `a`, so that $x$ is at least 1.
- **FR-003**: The service MUST supply every state of the explorer for an equation: the unit weights left on each pan, the tilt (level, left down, right down), and whether $x$ stands alone on a level scale. It MUST refuse an equation outside FR-001 and FR-002.
- **FR-004**: The learner app MUST draw only the states the service supplies and MUST NOT compute a tilt or a solution itself.
- **FR-005**: Weights taken off MUST stay visible as outlines, so the learner can compare what was taken from each pan.
- **FR-006**: The lesson MUST exist in both release languages with the same sections, directives, and expressions, and MUST belong to a new skill, `algebra.one-step-equations`, which follows addition within 20 and precedes linear equations in the skill graph.
- **FR-007**: The explorer MUST meet the accessibility scenarios of User Story 3.

### Key Entities

- **Balance state**: the weights left on each pan, the tilt, and whether the equation is solved.
- **Skill `algebra.one-step-equations`**: prerequisite `numbers.addition-within-20`; a prerequisite of `algebra.linear-equations`.

## Success Criteria

- **SC-001**: A learner can solve both authored equations on the scale, by pointer or keyboard alone, in both languages.
- **SC-002**: Domain, contract, component, content, and end-to-end tests cover FR-001 to FR-007 on desktop and iPad.

## Assumptions

- The lesson is a draft and has no practice yet. Practice of one-step equations, with the balance as visual help, is the next change.
- Only addition equations, $x + a = b$, are in this slice. Subtraction ($x - a = b$) and multiplication ($ax = b$, split into equal groups) are later slices.
- The unknown is always on the left pan, as in the lesson's notation.
