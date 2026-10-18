# Focused response to Claude's round-01 review

**Reviewer:** Codex. **Date:** 2026-10-18. **Status:** Proposed findings and dispositions; no owner decisions recorded here.

**Baseline:** `ae2550a71c068935683f374712c9ed10e0db76ae`, on `main`, clean before this report. Claude reviewed `b6c4548d890979c5327d729e13a27efee20814b8`. The only intervening file changes are Claude's three review documents, so the application and requirement baselines are comparable.

**Method:** Read Claude's [analysis](../claude-fable/analysis.md), [recommendations](../claude-fable/recommendations.md), and [build brief](../claude-fable/proposed-build-brief.md); checked significant claims against requirements, decision records, content guidance, and prototype source. This is a response after reading Claude, **not a second independent review**. No new browser, learner, educator, device, accessibility, or test-suite runs were performed. Claude's reported test results remain attributed to Claude. No external authentication or licensing recommendations were re-verified or adopted here.

## Assessment

Claude identifies real implementation gaps and preserves the main product requirements. Retain the proposed small vertical slice, authored plus generated content, visual help before failure, bilingual delivery, clear practice controls, and the separation between an internal experiment and public release.

The brief needs revision before it becomes an implementation plan. It places too much work before the start, understates the work in its calendar estimate, treats some prototype contracts as more reusable than they are, and includes additional release features without distinguishing them from established requirements. These are reasons to refine the brief, not to restart the whole design review.

## Recommendation dispositions

These are suggested dispositions, not approvals. IDs below abbreviate `CLAUDE-FABLE-R01-`.

| Claude ID | Proposed disposition | What to retain or change |
| --- | --- | --- |
| 001 | Adapt | Use canonical skill references and reviewed lessons under `content/`; define objectives and prerequisite meaning before treating prefix alignment as reconciliation. Add only skills needed by the selected slice. |
| 002 | Adapt | Keep typed responses/results and feedback codes; correct status semantics, provenance, fixed-task identity, and unsupported-review messaging. See C02–C04. |
| 003 | Adapt | Named, explained challenge configurations are useful. Do not imply every family has one universal ladder. Preserve replay identity and distinguish new seeds from new mathematical questions. |
| 004 | Adapt | Implement and test a narrow deterministic generator during the slice. Passing RNG fixtures establishes conformance to the proposal, not the whole compatibility decision. |
| 005 | Adapt | Use a small documented authoring subset and safe named components. Treat syntax as a pilot; prove contributor preview and validation before calling it stable. |
| 006 | Accept direction | The untranslated `pluss` is present in `Counters.jsx`. Add translation-resource and released-content checks; dictionary parity alone cannot establish mathematical or translation quality. Avoid a blanket ban on all strings in JSX, which also contains technical identifiers. |
| 007 | Accept design task; details pending | Real profile design is required before account implementation. Recovery codes, export, deletion timing, and session choices remain proposed options. |
| 008 | Adapt | Preserve guest work with an explicit ownership choice on shared devices. Define duplicate/retry handling before importing attempts; do not default silently to adding another person's work. |
| 009 | Accept direction | Actual iPad and assistive-technology checks are established requirements. Test early and record limitations; inspection does not prove that a specific device fault exists. |
| 010 | Accept direction | Ready content should be easy to find. Offer a modest starting suggestion without the unverified claim that “most people” start with a particular topic. |
| 011 | Accept direction | Label which prototype is current; archiving is optional housekeeping, not a prerequisite to mathematical implementation. Preserve useful historical storyboards. |
| 012 | Accept decision task; details pending | License/contribution terms and a real improvement path need decisions. This report does not choose licenses or validate the proposed issue-form integration. |

## C01 — Make the first milestone achievable and include verification

**Sources:** Claude recommendations 001–005; build brief sections 2, 6, and 7.

The shortlist calls implementing the generator and freezing the lesson dialect blockers “before first implementation.” These are implementation tasks themselves. The schedule includes content reconciliation, a domain library, API, TypeScript port, renderer, practice controls, self-checks, persistence, CI, and hardware checks. Its listed half-day/day tasks already exceed the stated two-and-a-half-day total before the hourly tasks and fixes. It then moves CI and device checks into following evenings despite listing them as completion criteria.

**Correction:** Pick the topic and provisional contract boundaries, then implement a smaller milestone. Keep tests and bilingual checks alongside the work. A demonstrated core journey is a better weekend target than partially wiring every screen. If self-checks cannot be completed, defer them explicitly and do not label the milestone as a completed assessment loop. Public-release requirements remain intact.

**Acceptance:** The revised brief distinguishes prerequisites, implementation work, and release gates; it provides an ordered cut line and makes no completion claim for unperformed checks. It does not depend on a universal schema or all six proposed skills.

## C02 — Preserve distinct result meanings without promising a reviewer

**Sources:** Claude recommendation 002 and analysis W8; [capability model](../../../architecture/exercise-capability-model.md), sections 7–9; [prototype exercise shell](../../../../Prototype/mathkx-designsystemet/src/components/ExerciseShell.jsx).

Recommendation 002 introduces `PartiallyCorrect` and `ReviewNeeded`, then says a test should show they display as “awaiting review.” These statuses mean different things. It also says they have no UI in the slice while requiring display behavior. No human-review service or routing workflow has been adopted.

**Correction:** Keep invalid input, incorrect, partially correct, and not automatically assessed distinct. “Awaiting review” is appropriate only when an actual review workflow exists. A future proof activity can say that the app does not automatically assess it and offer an authored rubric or explanation where available. For the scalar slice, test that unsupported result kinds are not silently coerced to wrong; do not build an educator queue to satisfy this test.

**Acceptance:** Each exposed status has truthful wording. Partial correctness never becomes “awaiting review.” No unavailable service is implied. The scalar UI does not use its current correct-versus-everything-else branch for future result kinds.

## C03 — Resolve variants through the established replay contract

**Sources:** Claude recommendations 002–004 and build brief section 5; [ADR 0004](../../../architecture/decisions/0004-deterministic-exercise-generation.md); [capability model](../../../architecture/exercise-capability-model.md), “Reproducibility envelope”; [practice controls](../../../design/learning-experience.md).

The established conceptual identity is `(definition ID, definition version, seed)`. Claude proposes `(family, version, seed, variant)` while classifying it as preserving the existing decision. If `variant` independently changes the mathematics for the same first three values, the original tuple no longer reproduces the exercise. The proposed attempt shape also does not explain how generator compatibility and skill/evidence references resolve. Fixed authored tasks need explicit provenance rather than an arbitrary requirement to supply a random seed.

**Correction:** Prototype a resolution rule before persisting instances. One narrow option is for each named challenge configuration to resolve to a versioned definition with pinned generator parameters; another is an explicit proposal to change the identity contract. Keep the learner's challenge request separate from the resolved mathematical identity. Record or immutably resolve generator/validator compatibility. Give fixed tasks stable definition/instance references. Avoiding repeated seeds is insufficient for avoiding repeated questions in a finite family: different seeds may produce the same operands.

**Acceptance:** A replay fixture works after changing display language and challenge selection, and after adding a new generator revision. Historical references still resolve. An authored example needs no fabricated random generation. Repeat-avoidance tests compare the relevant mathematical instance, while intentional repetition remains available.

## C04 — Reuse presentation ideas, not the existing progress implementation unchanged

**Sources:** Claude build brief sections 2, 5, and 6; [activity.js](../../../../Prototype/mathkx-designsystemet/src/activity.js), [store.jsx](../../../../Prototype/mathkx-designsystemet/src/store.jsx), and [ExerciseShell.jsx](../../../../Prototype/mathkx-designsystemet/src/components/ExerciseShell.jsx).

The brief says `activity.js` should be ported “as is,” and that browser attempts should transfer unchanged to server storage. However, `practiceStatus` imports static question lists, matches `a.qid`, and reads Boolean `a.correct`; Claude's proposed attempts use instance references and typed results. The current shell also records correctness and support differently from that proposal. These implementations cannot be ported unchanged.

There is a related learning-evidence gap: a learner may receive corrective feedback, retry successfully without opening the visual-help button, and receive an independence label. The absence of that button event does not establish independent success. The capability model explicitly requires support context and revisions to remain distinguishable.

**Correction:** Preserve the calm activity wording but redesign its derivation around resolved instances and typed observations. Distinguish first response, retry, and revealed feedback/support. For future server persistence, define which client observations may be imported, prevent duplicate submissions, and keep server validation authoritative; compatible data shapes do not make browser-computed results trusted evidence.

**Acceptance:** Generated questions appear in progress; repeated delivery/submission does not duplicate an observation; unknown result kinds are preserved; a successful retry after feedback is not labelled as a first independent answer. No mastery algorithm is needed to achieve this.

## C05 — Reconcile skill meaning and test learner value, not just prefixes

**Sources:** Claude recommendation 001 and build brief sections 1, 2, and 8; [content guidance](../../../../content/README.md), [skill graph](../../../learning/skill-graph.md), and the prototype's [number-bonds lesson](../../../../Prototype/mathkx-designsystemet/src/content/lessons/number-bonds-to-ten.en.md).

The registry is explicitly illustrative, and skill granularity/prerequisite meaning remain open. Aligning `numbers.` versus `arithmetic.` does not decide whether recognizing a pair that totals ten, adding two numbers, and choosing a make-ten strategy are the same objective. Successfully answering `8 + 5` does not reveal which strategy was used.

Claude also assumes addition is below the initial learner's level and equations are at their level without learner evidence. Its validation plan requires the learner to use help at least once. A learner who already understands the task may appropriately choose not to use it.

**Correction:** Specify the small slice's objective and what the chosen questions actually demonstrate. Keep addition/tiervenner as a reasonable engineering pilot, while describing suitability for the intended learner as unverified. If the objective is number bonds, include a task such as finding the missing part of ten; do not infer a make-ten strategy from the final sum. Observe whether learners can discover and understand help, and whether it is useful when needed, rather than requiring a click.

**Acceptance:** Each task maps to an explicit observable objective. Prerequisite edges have a rationale. Learner validation records comprehension and useful next actions, including cases where help is unnecessary. No age alone determines assumed ability.

## C06 — Keep new release proposals separate from existing commitments

**Sources:** Claude recommendation 007 and build brief section 3; [ADR 0006](../../../architecture/decisions/0006-support-profiles-without-personal-details.md).

The brief's “Release requirement” table includes optional recovery codes, export, a particular device-session design, and at least two complete topics. These are Claude's additions, not all established requirements. ADR 0006 commits to persistent profiles without required personal details and optional verified recovery email; it deliberately leaves mechanisms and retention/deletion rules open.

**Correction:** Split the release table into established requirements, proposed additions, and unresolved implementation choices. Evaluate additions on learner benefit, shared-device privacy, effort, and alternatives. Do not silently turn accepting the overall concept into accepting every proposed account feature.

**Acceptance:** The decision log identifies which additions the owner has approved, deferred, or left pending. Required anonymous setup, optional recovery email, cross-device progress, bilingual content, and device/accessibility validation remain explicit release gates.

## Suggested starting milestone

This is a recommendation, not an approved replacement brief:

1. Choose one lesson and a precise learning objective. Number bonds/addition is suitable for proving the technical flow; one-step equations is an alternative if learner observation makes it more relevant.
2. Connect one bilingual authored lesson and worked example to canonical skill references, with a small authoring/validation pilot.
3. Implement one deterministic C# exercise family, its mathematical validator, and a narrow instance/result contract with replay tests. Include only reviewed challenge configurations that can be explained honestly.
4. Connect a thin API to the existing visual-help design and a minimal practice journey: answer, help, feedback, another question, and supported challenge changes without losing work. Add an explicit current limit where a requested variation is unavailable.
5. Verify that journey in both languages, record attempts without mastery claims, and perform an early physical-iPad pass. Record remaining issues rather than claiming device support from screenshots.

Self-checks, additional topics, account implementation, and broader response families follow in separate milestones. Their requirements remain on the release/design roadmap. Keep format and domain boundaries extensible, but do not claim Format v1 has been proven by a scalar-only exercise.

## Next review step

Ask Claude to respond to C01–C06, indicating agreement or disagreement with source evidence and a revised, smaller build proposal. Do not request another general review. Preserve the original reports and write the response as a new file. Then the owner can select the first learning objective and milestone scope and approve any changes to established decisions.

There are still not two independent current-round reviews. If a fresh perspective is wanted, another model can review the baseline independently before seeing these reports; otherwise proceed transparently with this review-and-challenge pair. Neither route replaces learner, educator, or device validation.
