# Collaborative design review

**Status:** Proposed review workflow; not an application architecture decision.

The purpose is to converge on a small, coherent MathKX design that can be built and tested. Multiple models provide independent critiques; the owner chooses the design. Model agreement is not proof of mathematical correctness, teaching quality, usability, accessibility, or security.

## Shared baseline and separate reports

Use the [concept and design review prompt](claude-review-prompt.md) for Claude and other repository-capable reviewers. Give every reviewer the same Git commit and requirements. Prefer separate checkouts or branches when tools may modify files. Never reset an active checkout to establish a baseline.

Each reviewer records the full commit SHA and any uncommitted inputs. If reviews use different baselines, reconcile the intervening changes before comparing their findings. Existing reports remain historical evidence; they are not automatically current requirements.

Use unique reviewer directories:

```text
docs/reviews/round-01/
  claude/analysis.md
  claude/recommendations.md
  claude/proposed-build-brief.md
  <other-reviewer>/...
  synthesis.md
  decision-log.md
  build-brief.md
```

Create these files only when the review happens; the layout is not evidence that reviews or decisions exist. Reviewers write only their own reports. Do not overwrite another report or edit product requirements as part of a review.

## 1. Independent analysis

Start with two reviewers using the same broad brief. Each covers concept, pedagogy, learner journeys, contribution, feasibility, and architecture. They should form their initial findings before reading previous reviews and avoid each other's current-round reports until both are complete. This reduces anchoring without withholding established requirements or ADRs.

Do not assign a model only the job of agreeing with or polishing another model's proposal. A third review is useful when it addresses a specific unresolved question, rather than producing another general wishlist.

## 2. Compare proposals against evidence

After reports are complete, ask one reviewer to synthesize them. Keep the reports intact. Create `synthesis.md` with:

- The reviewed baselines and any differences that affect conclusions.
- Useful existing work both proposals retain.
- A deduplicated recommendation table referencing original recommendation IDs.
- Agreements, contradictions, distinct alternatives, and missing evidence.
- Conflicts with requirements or accepted decisions.
- A recommended disposition for each item and the smallest experiment that could resolve a meaningful disagreement.

Recommended dispositions are **accept**, **adapt**, **defer**, **reject**, or **needs evidence**. They remain proposals until the owner decides. Do not use voting, model confidence, or the number of repetitions as evidence. Do not merge incompatible designs into a larger feature list just to retain every suggestion.

For each significant disagreement, show the concrete learner or contributor scenario, competing behavior, tradeoff, and proposed test. Use repository evidence first. Distinguish verified external evidence from assumptions.

## 3. Focused challenge and owner decisions

Give the synthesis and proposed build brief to another reviewer for one focused challenge pass: overlooked requirements, weak evidence, unrealistic scope, contradictory contracts, and failure cases. Request corrections tied to recommendation IDs, not a new full review.

Maintain `decision-log.md` with this structure:

| Decision ID | Question | Source recommendation IDs | Options and tradeoffs | Proposed disposition | Owner decision/status | Rationale/evidence | Affected docs |
| --- | --- | --- | --- | --- | --- | --- | --- |

Record owner approval explicitly, including a date or reference to the instruction. Leave undecided items pending. General authorization to review does not authorize a model to declare new requirements or architecture decisions accepted. Previously authorized decisions need no repeated approval.

Once decisions are approved, reconcile them into the existing product/design/learning documents. Use an ADR only for a durable architectural choice. Link decisions back to their originating recommendations, and record why rejected or deferred ideas did not enter the build scope.

## 4. Produce a build brief and stop expanding the review

Write one `build-brief.md` from the selected proposals, not a concatenation of reports. Distinguish the first internal implementation from the first public release. Include scope, learner journey, screens, content, responsibility boundaries, dependencies, risks, and observable acceptance criteria. Link to authoritative requirements rather than maintaining a competing specification.

The design is ready to start when:

- The owner has selected a first slice with a clear learner benefit and explicit exclusions.
- Every established requirement has a place in that slice, a public-release acceptance criterion, or an explicitly approved change; none has silently disappeared.
- Decisions that block the slice are resolved. Other uncertainties have a reversible assumption or bounded experiment, an owner, and a trigger for revisiting them.
- The learning flow distinguishes support, attempts, validation, and progress without claiming an unvalidated mastery algorithm.
- The slice has concrete mathematical, bilingual, accessibility, and device acceptance criteria and a way to test them.
- The first contributor workflow and the first implementation tasks can be explained without a universal content engine or a complete university syllabus.

Aim for one independent round and one focused challenge pass. If a critical issue remains, investigate that issue rather than restarting the entire review. A small prototype or learner observation should settle questions that prose cannot. Starting an internal slice does not waive validation required before public release.

## 5. Final verification before specifications

When the owner has recorded the decisions from steps 3 and 4 and intends to start implementation planning, run one bounded verification round rather than another review. Its purpose is to confirm that the record is consistent, that the prototype matches the documents where it is meant to be a reference, and that each candidate feature has the inputs a specification needs. Use the [round-04 verification prompt](round-04/verification-prompt.md); it carries a fixed ten-point checklist and a candidate-feature table.

Arrangement:

1. **Owner first.** Record pending decision-log rows, merge open review pull requests, choose one commit SHA, and put the SHA in the prompt. Schedule the human checks the models cannot do (physical iPad in Safari, VoiceOver, one learner, one educator, one translator) so their results can be cited.
2. **Three verifiers, same SHA, same prompt.** Claude, Codex, and Gemini each work in their own branch and write only `docs/reviews/round-04/<reviewer-slug>/verification.md` plus evidence files. They may read all earlier rounds; they do not read each other's round-04 files until all three exist. Each runs the same commands and says what it ran and what it inferred. A "cannot verify" answer is acceptable; an unsupported claim is not.
3. **Synthesis and challenge.** One verifier writes `round-04/synthesis.md`: a per-checklist-item and per-feature table of the three answers, agreements, contradictions, and a recommended disposition; another writes a short challenge pass. Assign the roles by track record of citation accuracy, because the synthesis becomes the evidence base for every specification; rotate when accuracy warrants it. Model agreement is still not proof.
4. **Owner decides.** Record the verdict per feature in the decision log: specify now, specify with corrections, or not yet. Apply the small corrections to the documents they belong in. Stop here; do not open a fifth general round.

Handing over to specifications:

- Write the project constitution once, from `AGENTS.md`, `docs/product-principles.md`, and the durable rules in the ADRs, and review it as a document before any feature specification is generated from it.
- Write one specification per feature that passed the gate, in the backlog order of the planning reference, each citing its requirement sources and the decision-log rows it depends on. The round-04 reports are the evidence section of each specification; do not rewrite them.
- A specification may not quietly change an established requirement or an accepted ADR. If writing it reveals a conflict, bring the conflict back to the decision log.
- Specifications for release-scope features (profiles, recovery, persistence) wait for their design proposals; verifying that the inputs exist is enough for this round.

## Reusable follow-up prompts

### Final verification

> Use `docs/reviews/round-04/verification-prompt.md` as written, with the baseline SHA filled in and your reviewer slug. Answer the checklist, give the feature verdicts, and write only your own `round-04/<reviewer-slug>/verification.md`. Do not read other round-04 reports until asked to synthesize.

### Synthesis

> Read the MathKX review process and the completed reports in `docs/reviews/round-01/`. Verify their baselines. Create `synthesis.md` and a proposed `decision-log.md` using the process above. Compare evidence and behavior, preserve recommendation IDs, and expose contradictions rather than averaging them away. Recommend one coherent first slice and identify the few owner decisions blocking it. Do not edit requirements, code, other reviewers' reports, or accepted ADRs. Do not mark your recommendations approved or commit/push changes.

### Focused challenge

> Review the synthesis, decision log, and proposed build brief against current MathKX requirements and the source reports. Write a new uniquely named challenge report in the same round directory. Identify remaining blockers, unsupported claims, contradictions, and omitted requirements with source references and recommendation IDs. Say when a finding is already resolved. Propose the smallest correction or experiment for each issue. Do not introduce a broader feature wishlist, edit authoritative documents, or commit/push changes.

### Consolidation after decisions

> Use the owner's recorded decisions to consolidate the MathKX design. Mark unresolved decisions pending and do not infer approval from model agreement. Update the round's build brief and decision log, reconcile approved changes into the existing documentation, and create ADRs only for approved durable architectural choices. Preserve historical reviews and link decisions to their sources. Check documentation links and consistency, then list the first implementation tasks and remaining uncertainties. Do not start application implementation or commit/push changes unless separately authorized.
