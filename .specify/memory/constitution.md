# MathKX Constitution

**Status:** Ratified by the owner on 2026-10-18 (decision log DL-040). Written in the consolidation step after design-review round 04 (decision log DL-001 to DL-039) from `AGENTS.md`, `docs/product-principles.md`, the accepted ADRs 0001 to 0010, and the learning and design documents. Specifications generated with GitHub Spec Kit must comply with this document.

## Core Principles

### I. Mastery over activity

Progress is measured by developing mastery, never by exercise count, time spent, completion, or streaks. Until a mastery model is validated, the product records observations and shows honest descriptive summaries ("Correct on first response, no help", "Correct with visual help", "Correct after feedback", "Answered after the answer was shown") and never a percentage, threshold, badge, or ranking of unaided over aided work. Asking for help, easier work, or repetition is never failure and never reduces a learner's record. Sources: `docs/product-principles.md`, `docs/learning/mastery.md`, DL-029.

### II. Mathematics is independent of curricula

Skills carry stable, language-neutral identifiers (`numbers.addition-within-20`, not a grade or a country) and form a prerequisite graph. Curricula, grades, and courses map onto skills; they never define them, and a skill is never duplicated per curriculum, language, or stage. Domains and topics organise discovery only. Sources: ADR 0002, `docs/learning/skill-graph.md`, `docs/learning/mathematics-domains.md`.

### III. Content configures; tested code computes

Exercise definitions, lessons, skills, and challenge ladders are reviewable data in Git. Nontrivial mathematical generation and validation live in deterministic, tested domain code (C#), never in UI components, Markdown, or JSON. JSON and Markdown never gain expressions, loops, branching, or executable code; they name registered generators, validators, and components with validated parameters. Sources: ADR 0003, ADR 0005, `docs/architecture/exercise-capability-model.md`, `content/AGENTS.md`.

### IV. Reproducibility and honest results

An exercise instance is identified by (definition ID, definition version, seed) and replays identically across languages, devices, and generator revisions under a declared compatibility contract. A challenge change selects another versioned definition; it never changes parameters under an existing identity. Fixed authored tasks are valid content and need no seed. Validation returns a typed result (`correct`, `incorrect`, `invalid-response`, `partially-correct`, `review-needed`), never a bare Boolean, and the product never promises a human review that does not exist. Sources: ADR 0004, `docs/architecture/proposals/seed-and-random-source.md`, DL-026, DL-029.

### V. Help before failure; accommodation is not help

Visual help can be requested before any wrong answer and is recorded as support, never as a penalty. A worked explanation is distinct from a hint and makes any answer reveal explicit; a correct answer typed after a reveal is recorded as such. Accessibility accommodations (screen reader, keyboard, zoom, reduced motion, locale-aware input) are never teaching help and never negative evidence. Sources: `docs/design/exercise-experience.md`, `docs/learning/mastery.md`, DL-026, DL-028.

### VI. Accessible, bilingual, and private by design

Every representation and interaction has an equivalent accessible operation that preserves the mathematical objective; no drag, hover, colour, or timing is the only path. Norwegian Bokmål and English ship together for every released interface string and content item, with locale-aware number entry and canonical mathematics unchanged by language. iPad Safari with touch, the on-screen keyboard, rotation, and VoiceOver is validated on real devices before release. Profiles need no real name or email; recovery email is optional; learner data stays in the chosen region. Sources: `docs/design/design-principles.md`, `docs/vision.md`, ADR 0006, ADR 0008, ADR 0009.

### VII. Calm and credible

The experience is calm, encouraging, modern, and age-appropriate for teenagers and adults: no shame, manipulative streaks, global leaderboards, or childish decoration. Stage labels are context, not levels. Sources: `docs/product-principles.md`, `docs/design/design-principles.md`.

## Additional Constraints

- **Stack.** ASP.NET Core and C# for the backend and all domain logic; React and TypeScript for the web client; Designsystemet components and theme with Tailwind for layout; PostgreSQL on Azure Database for PostgreSQL Flexible Server for profiles and progress; Azure App Service (Linux) in Norway East for hosting (ADR 0003, 0007, 0008, 0009; DL-005).
- **Licensing.** Code and documentation under MIT; learning content under `content/` under CC BY-SA 4.0 (ADR 0010).
- **Repository.** One monorepo (ADR 0001); directories are created when they hold real work; `content/` holds skills, exercise definitions, and lessons; `schemas/` holds their schemas; durable architectural choices are recorded as ADRs in `docs/architecture/decisions/`, tentative designs under `docs/architecture/proposals/`.
- **Decided for the first milestone** (decision log, 2026-10-18): skills `numbers.number-bonds-to-ten` and `numbers.addition-within-20` with objectives O1 and O3; one C# addition generator and two definitions (within ten, crossing ten); the prototype's four behaviour rules (counting to the total is a reveal; lesson disclosure rule; "More like this" replaces a pending change; finishing keeps an unanswered question resumable); independent self-checks by default; help-first outcome labels.
- **Still undecided, and not to be decided inside a specification:** the mastery algorithm, authentication mechanism and credential format, recovery mechanisms beyond email, session handling, retention and deletion rules, symbolic equivalence, AI use, the random-source ADR (pending C# fixtures), and Exercise Format v1.

## Development Workflow

- Make the smallest coherent change that advances the current milestone; do not scaffold layers without a concrete need.
- Every behaviour ships with tests: C# domain tests (fixtures, golden seeds, property tests, generator–validator agreement, replay across versions), client tests (state survives language switch and resize; exhaustive status rendering; dictionary parity), content validation in CI (schemas, references, cycles, lesson pairing), and browser checks in both languages at phone, iPad portrait, and iPad landscape sizes.
- Update documentation in the same change when terminology, a schema, or a contributor workflow changes; the content format and its schema change together.
- Human validation gates are not replaced by automated checks or by model reviews: a physical iPad with VoiceOver, one learner, one mathematics educator, one translator, and one new contributor, each recorded.
- Content contributions are pull requests validated by CI and reviewed for mathematics, teaching, translation, and accessibility; contributors never need to edit application code to improve a lesson.

## Specification Rules

- A specification cites its requirement sources (vision, principles, design and learning documents, ADRs) and the decision-log rows it depends on, and treats the round-04 verification reports as its evidence section rather than rewriting them.
- A specification may not change an established requirement or an accepted ADR. If writing one reveals a conflict, the conflict goes to the decision log, not into the specification.
- A specification states what it leaves undecided and why, and names the reversible assumption it proceeds under.
- Features are specified in backlog order (F1 content contract, F2 .NET domain, F3 thin API, F4 practice flow, F5 lesson rendering, F6 observations and progress, F7 challenge ladder and session controls; F8 self-checks after milestone one; F9 profiles and persistence after its design proposal), and each names its own acceptance criteria in both languages.

## Governance

This constitution supersedes conflicting practice documents. It restates existing decisions; it does not create new requirements. Amendments require an owner decision recorded in the decision log, and an ADR when the change is architectural. Versioning follows semantic versioning: a major version for a removed or redefined principle, a minor version for a new principle or section, a patch for wording.

**Version:** 1.0.0 | **Ratified:** 2026-10-18 | **Last amended:** 2026-10-18
