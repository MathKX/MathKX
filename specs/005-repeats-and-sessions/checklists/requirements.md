# Specification Quality Checklist: Repeat Avoidance, "Repeat This Question", and Session Controls

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-10-25
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs) — the identity (definition, version, seed) and "the guest record of this browser" are the terms the constitution and earlier specs fix; no algorithm, storage format, endpoint, or component is named
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain — the one marker (Q1: the scope of F7's "further session controls") was answered by the owner on 2026-10-26: "Finish practice" with a session summary (counts, repeats) and "Practise again", no fixed session length; recorded under Clarifications (User Story 3, FR-011 to FR-014)
- [x] Requirements are testable and unambiguous — FR-001 to FR-018 each name an observable condition; FR-005 has a time bound and a fixed upper limit
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined — 17 scenarios across four stories
- [x] Edge cases are identified — thirteen listed
- [x] Scope is clearly bounded — Assumptions name what stays with spec 002, F8, F9, and the future learning model
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Notes

- **Defaults taken without asking**:
  - **The window**: the addendum's eight deliveries per variation, compared by the unordered pair of numbers.
  - **Spec 004's marking is unchanged**: "Repeated question" still means same ordered numbers.
  - **Repeating from a replay** closes an unanswered question in progress as a practice entry does.
  - **Outcomes**: a repeat on request is never refused, and its outcome uses only its own events.
  - **The exhausted-pool case** is tested with the fixed task and a scripted small pool, since neither pilot pool runs out within eight.
- **Derived from Q1**: a session runs from the last "Finish practice" to the next one, so a lesson detour, "My work", or a replay does not split it (FR-014); leaving the practice page still keeps an unanswered question resumable (DL-026 (4)).
