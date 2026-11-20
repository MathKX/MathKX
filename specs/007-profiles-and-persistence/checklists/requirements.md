# Specification Quality Checklist: Profiles, Recovery, and Persistence

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-11-20
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

- **Decided elsewhere, cited rather than chosen**: the sign-in framework, the password hash, the database, and the regions are owner decisions in ADRs 0008, 0009, 0012, and 0013. The spec cites them as sources and does not restate their technology. Where a requirement names a mechanism, it is a security property the ADRs fix: a server-held, revocable session; an opaque token; protection against cross-site forgery; codes, never links; hashed recovery codes. Those are testable outcomes, not design choices made here.
- **Project terms, not implementation**: as in specs 001 to 006, the spec uses the project's own contract terms: the guest record, the service, exercise identity (definition, version, seed), the submission ID, and the dictionary-parity and literal checks.
- **First pass, issues fixed**:
  - "MAY" was used in negative requirements, which made them read as permissions. FR-002, FR-014, FR-017, FR-035, and FR-036 now say "MUST NOT".
  - FR-036 named a storage row; it now says "the profile itself".
  - An edge case said an expired setup's learner ID is never reused, which the design does not say; it was removed.
  - SC-007 named the database; it now says "the same kind of data store as production (ADR 0008)".
- **Every owner decision is fixed by the documents**: setup sequencing (DL-027), email changes (DL-022), the DL-007 additions, the eight answers of DL-042, and the email region (DL-043). No clarification marker was needed.
- **Defaults taken without asking**, each recorded under Assumptions as reversible:
  - making new recovery codes asks for the password, as deletion and a password change do;
  - language and "Keep me signed in" stay per browser;
  - "Clear my work" stays a guest action;
  - profile emails use the language selected when requested, and the inactivity notice uses both;
  - an import that cannot place an event tells the learner how many were left out.
- **Targets this spec sets**, as measurable outcomes for testing, not as owner decisions: setup in under 3 minutes and a second-device sign-in in under 1 minute (SC-001), and a 100-try guessing loop (SC-006).
- **Owner actions, outside the build**: the legal check before release (DL-042 (8)), and the three-person observation (SC-009), which can run on the prototype before this spec leaves Draft.
- **Candidates for `/speckit-clarify`**, should the owner want to decide them rather than accept the defaults:
  - asking for the password before making new recovery codes;
  - the setup and sign-in time targets in SC-001.
