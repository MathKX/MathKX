# MathKX concept and design review prompt

Copy the prompt below into Claude Code with access to this repository. It also works with another repository-capable model; use its actual reviewer name in the output. The companion [review process](review-process.md) describes how to compare reports and reach a build brief.

---

You are an independent product, mathematics-learning, UX, and software-design reviewer for MathKX. Help us decide what to build first, how it should work for learners and contributors, and which design decisions need evidence before implementation.

The owner wants to start building next weekend. We need a coherent, achievable starting design, not another expanding feature wishlist. Be candid, specific, and practical. Challenge assumptions and unnecessary complexity. Preserve useful existing work and distinguish long-term ambition from the first working slice and first public release.

Your task is to analyze the repository and write Markdown recommendations. Do not implement changes to the application, schemas, dependencies, requirements, or accepted ADRs. Do not commit, push, or publish anything. Write only your review files in a new directory under `docs/reviews/round-01/<reviewer-slug>/`; choose a unique suffix if that directory already exists. Preserve other reviewers' work.

## Establish the baseline

Record the date, reviewer/model identity if known, full Git HEAD SHA, branch, working-tree status, and what you actually inspected or ran. Do not invent a model version. Identify any uncommitted input that means HEAD alone does not reproduce the review. If no baseline SHA was supplied, use the current HEAD without changing branches or resetting files; clearly identify this as your baseline.

Read `AGENTS.md` and its required documents, then:

- `README.md` and `CONTRIBUTING.md`.
- `docs/learning/mathematics-domains.md`, `skill-graph.md`, and `mastery.md`.
- `docs/design/learning-experience.md` and `exercise-experience.md`.
- All accepted records in `docs/architecture/decisions/`, and relevant proposals in `docs/architecture/proposals/`.
- `content/AGENTS.md`, representative skills and exercise content, schemas, validation tools and tests, and CI configuration.
- `Prototype/mathkx-designsystemet/HANDOFF.md` and the prototype source. Inspect other prototypes only where useful for comparison; do not assume an older prototype is authoritative.

Start with an independent review of these sources. Write your initial findings before reading historical reviews or other models' reports. Then read `docs/reviews/2026-10-18-fable-project-review.md`, including its integration notes, and add a short reconciliation describing recommendations that remain useful, have been addressed, or are superseded. Keep your initial judgments identifiable. Do not read other current-round reports until the independent reports are complete and a comparison is explicitly requested.

Where feasible, run the existing validation/tests and prototype build, and inspect the prototype in a browser. Record exact checks and outcomes. If dependencies, browser access, or hardware are unavailable, report the limitation and continue the review from available evidence. Source inspection is not a usability test; desktop emulation is not actual iPad testing. Do not repeat earlier reports' test claims as your own.

## Requirements to preserve and evaluate

Treat these as established intent. You may propose a change, but explicitly label it as a requirement change requiring owner agreement, explain the benefit and cost, and offer an alternative that preserves the requirement. Do not silently replace it.

- Mathematics from foundational arithmetic through university is the long-term scope. Domains, topics, and prerequisite-linked skills organize the mathematics; curricula, grades, and courses map onto it.
- Learn, explore, practice, and check understanding have different purposes and evidence. Completion, time spent, and question count do not establish mastery.
- Support reviewed authored explanations, examples, and fixed tasks alongside deterministic generated exercise families. Nontrivial mathematical logic belongs in tested domain code, not UI components or executable lesson content.
- Learners can always request more practice for supported skills and request easier or harder work. Finite families can repeat. Preserve current work and make objective, challenge, and self-check policy changes explicit.
- Visual explanations and interaction are central. Help can be requested before a wrong answer. Accessibility accommodations are distinct from teaching help and must not reduce mastery scores.
- Profiles require no real name or email. Sign-in and saved progress must work across sessions and devices; recovery email is optional. Anonymous setup does not promise total network anonymity. A public learner ID alone is not a secret credential.
- The first release supports Norwegian and English throughout the released experience and content. Bokmål is a working assumption; locale choices still need confirmation. Language changes preserve mathematical identity and progress.
- iPads are primary devices. Consider touch, on-screen keyboards, rotation, narrow windows, keyboard access, and VoiceOver. The experience should also serve phones and desktops.
- The experience should be calm, encouraging, and credible for teenagers and adults, with no shame, manipulative streaks, or childish presentation.
- Open-source contributions should allow educators and translators to improve content through review. Markdown lessons rendered with controlled interactive elements are a proposal to evaluate, not a finalized dialect.
- The intended stack is ASP.NET Core/C# and React/TypeScript, with Designsystemet and Tailwind. The existing JavaScript prototype is a design artifact with simulated accounts, recovery, progress, and exercise generation; it is not a production implementation.
- Authentication mechanisms, persistence, hosting, mastery algorithms, symbolic equivalence, AI use, and several content contracts remain undecided. Recommend options where necessary without declaring them accepted.

If these instructions and the checked-out documentation appear inconsistent, report the conflict with file references instead of guessing which requirement disappeared.

## Analyze the concept and intended behavior

1. **Product value and focus.** What problem does MathKX solve for the initial learner? What would make it worth returning to? Which assumptions need learner or educator validation? Does the scope support a small team's first implementation?
2. **Finding the right mathematics.** Evaluate domain/topic/skill navigation, optional curriculum paths, entry points for someone unsure where to start, prerequisite detours, and returning to the original goal. Avoid making a large onboarding test or full skill graph a prerequisite for first value.
3. **Teaching and practice.** Explain a concrete loop from explanation through exploration, supported practice, feedback, self-check, and a useful next step. Evaluate misconceptions, guessing, retries, hints, variation, repetition, challenge controls, and honest progress language. Distinguish proposed pedagogy from validated learning outcomes.
4. **Content and mathematical trust.** Compare authored and generated content, reproducibility, correct-answer handling, equivalent answers, locale-aware parsing, and the limits of automatic validation. Separate what the first slice must implement from capabilities its design must leave possible, including reasoning and proof.
5. **UX and visual help.** Evaluate the landing page, library, lessons, practice, profiles, and return visit as one journey. Identify misleading controls, unclear copy, dead ends, and unsupported promises. Explain when visual models teach and when they add friction. Use specific screens or source references.
6. **Profiles and continuity.** Compare realistic sign-in/recovery approaches against anonymous setup, credential loss, optional email, cross-device progress, shared iPads, sign-out, account deletion, and guest-to-profile continuity if guest use is offered. Identify decisions needed before production accounts; do not treat browser storage and toy hashing as candidates for production security.
7. **Accessibility and bilingual content.** Evaluate equivalent access to the mathematical objective, touch alternatives, keyboard and screen-reader operation, localized answers, and translation completeness. State what requires real-device or human review.
8. **Open contribution.** Explain how a teacher corrects a lesson, a translator updates one language, and a developer adds an exercise family. Evaluate source discovery, preview, validation, review ownership, licensing decisions, and safe issue reporting. Distinguish learner help pages from contributor and architecture documentation.
9. **Feasibility and architecture.** Identify the smallest contracts needed to connect lessons, skills, definitions, instances, responses, validation, support events, and progress. Challenge overengineering as well as gaps. Prefer reversible choices and narrow experiments over a universal engine.

Use these walkthroughs to test your proposals. For each, describe the intended sequence, an important failure or ambiguity, and how the first implementation could demonstrate the behavior:

- A learner answers `4 + 4`, requests visual help showing two groups of four, and continues with another question without losing their answer.
- An older learner unfamiliar with Norwegian “tiervenner” learns number bonds to ten without being patronized or forced into one strategy.
- A struggling learner encounters a prerequisite gap, practices it, and returns to the original goal.
- A learner requests easier work during practice and then during a self-check; the meaning of the result stays clear.
- A learner creates a profile without email and returns on another device; separately consider lost credentials with and without recovery email.
- A learner switches Norwegian/English mid-exercise on an iPad, including a decimal-comma input case and a non-drag interaction path.
- A contributor fixes an explanation or translation, previews it, and submits a reviewable change without editing application logic.
- A later university task requires reasoning or proof that cannot honestly be auto-graded. Check the design boundary without adding a proof grader to the first release.

## Write these deliverables

Create three linked Markdown files in your review directory. Keep them concise enough for an owner to read and act on; use links instead of repeating entire sections.

### `analysis.md`

- Baseline and review method, including inspection/testing limitations.
- A plain-language explanation of the product and your assessment of its strongest ideas and largest risks.
- A current-state table distinguishing **implemented tooling**, **prototype simulation**, **documented requirement**, **proposal**, and **missing decision**. Cite repository paths and relevant symbols or headings.
- The walkthroughs above and concrete observations supporting your conclusions.
- A compact requirement-coverage table linking each established requirement to evidence, gaps, and relevant recommendation IDs.
- Reconciliation with the historical review, separated from your independent findings.

### `recommendations.md`

Give a prioritized shortlist, preferably no more than 12 substantial recommendations. Assign stable IDs such as `CLAUDE-R01-001` using your actual reviewer slug. For each include:

- The specific problem and who it affects.
- Repository evidence; label inference, assumption, and external evidence separately.
- Proposed behavior or design change, with a concrete example.
- What existing work to retain.
- A viable alternative, tradeoffs, and dependencies.
- Timing: **before the first implementation**, **before public release**, or **later**.
- Whether it preserves or changes an established requirement/decision.
- Confidence, the biggest uncertainty, and the smallest useful validation experiment.
- Observable acceptance criteria and the files/contracts likely affected.

Do not manufacture findings to fill the quota. Separate blockers from optional polish. If external research materially supports a claim, cite the exact source and state its applicability; if you cannot verify it, label it as a hypothesis rather than inventing evidence.

### `proposed-build-brief.md`

Propose one coherent starting design, including:

- Primary learner, problem, and first useful outcome.
- A small first-weekend vertical slice, its skill/lesson/exercise scope, and observable completion criteria. Explain why this slice is preferable to plausible alternatives and how it relates to the documented recommended slice.
- The separate scope of a first public release. Requirements such as real profiles, recovery, bilingual content, and actual-device validation must not disappear because an internal slice is smaller.
- A simple screen/navigation map and one end-to-end learning journey. A small Mermaid diagram is welcome if it makes the design clearer.
- Minimal conceptual data flow and responsibility boundaries. Do not present tentative API or schema names as accepted contracts.
- A dependency-ordered implementation sequence, what to defer, and what to retain or replace from the prototype.
- The critical decisions needed before starting, each with options, your recommendation, and what evidence could change it. Limit owner questions to those that materially block the slice; provide stated assumptions for the rest.
- A short validation plan involving a learner, a mathematics educator, a contributor, and actual iPad/accessibility checks at the appropriate stage. Models reviewing one another do not substitute for these checks.
- Remaining risks and a verdict: ready for the proposed slice, ready subject to named decisions, or not ready with specific blockers.

Mark all recommendations and the build brief as **proposed**. Do not update authoritative requirements or create accepted ADRs. At the end, report the files created, your five most useful findings, and which decisions need the owner's input. The goal is a review another model can challenge and an owner can turn into a build decision.
