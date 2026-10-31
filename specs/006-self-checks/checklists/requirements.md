# Specification Quality Checklist: Self-Checks ("Check My Understanding")

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-10-31
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Notes

- **Project terms, not implementation**: as in specs 001 to 005, the spec names the project's own contract terms: `content/`, the content check, the guest record, identity (definition, version, seed), and the domain tests. These are the boundaries the constitution defines. No language, framework, or interface is chosen. When validation happens is left to the plan.
- **Defaults taken without asking**, each recorded under Assumptions as reversible:
  - **Order**: a check goes forward only, and a saved answer is final.
  - **Size**: 1 to 10 questions per check, with four in the pilot (the prototype's `check-addition` list).
  - **Where a check is found**: a check names its skill, and lessons gain no check field.
  - **Unreached questions**: in a check ended by starting a new one, they are "not answered", never "skipped".
  - **Separation from practice**: check questions do not count in practice's numbers, repeats, avoidance window, or sessions.
- **Fixed by the documents, not defaults**:
  - the independent policy, the one-way switch, and feedback at the end (DL-028);
  - "Worth revisiting" only on independent items that were neither correct first nor skipped (DL-036);
  - authored lists of one skill (DL-023);
  - "Check my understanding" always starts a fresh check (learning experience).
- **Candidates for `/speckit-clarify`**, should the owner want to decide them rather than accept the defaults:
  - going back within a check;
  - showing check results inside practice's counts;
  - letting a lesson choose its check.
