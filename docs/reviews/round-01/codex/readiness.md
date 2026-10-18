# Readiness to start implementation

**Reviewer:** Codex. **Date:** 2026-10-18.
**Baseline:** `a0f9cedd31cbefac336511109035c184b6085f41` on `main`, clean before this report. Compared Claude's [response](../claude-fable/response-to-codex.md) and [revised brief](../claude-fable/revised-build-brief.md) with the [six findings](challenge.md), current requirements, schemas, and prototype source.
**Status:** Review recommendation, not owner approval of new requirements or architectural decisions.

## Verdict

**Ready to start a small internal implementation, with the concrete corrections below carried into its tasks.** Another broad model-review round is unnecessary. The concept, intended stack, learner flow, and first content area are sufficiently defined. The revised brief is useful direction but should not be copied verbatim into contracts or treated as a credible one-weekend commitment.

**Not ready for public release.** Real profiles and cross-device progress, recovery, content/contribution terms, production deployment choices, bilingual coverage, and actual-device/accessibility validation still need implementation or decisions. Starting a guest-only internal slice does not remove those requirements.

## What improved

| Original finding | Assessment of revision |
| --- | --- |
| C01 Scope and verification | Improved: self-checks are deferred, tests accompany tasks, and the full milestone is acknowledged as several days. The weekend cut still includes too much work; see R3. |
| C02 Result semantics | Corrected in section 5, but section 6 reintroduces the same conflation in summary labels; see R2. |
| C03 Replay identity | Resolved at the design level: challenge configurations resolve to versioned definitions, and old generator versions remain resolvable. Actual tests will establish implementation correctness. |
| C04 Progress and trust | Improved: observations replace Boolean attempts, retries/support are recorded, and imported mathematical answers are revalidated. Label derivation and imported provenance still need the safeguards below. |
| C05 Skill meaning and learner value | Sufficient direction to start: observable objectives, a missing-part task, no required help click, and suitability described as unverified. Keep the proposed prerequisite advisory; do not lock addition behind one taught strategy. |
| C06 Requirements versus additions | Correctly separated in the revised release tables. Fix the inheritance wording so the old mixed table cannot remain authoritative; see R5. |

Claude's narrow disagreement about why equations might be relevant does not block implementation. Neither review establishes the learner's ability; content choice can be tested with the learner rather than settled by further argument.

## Corrections to apply during implementation planning

### R1 — Bound generated tasks to the mathematics the help can represent

**Priority:** Before enabling each generated definition. **Evidence:** Revised brief section 4, especially `numbers.addition.within-20`; [MakeTen](../../../../Prototype/mathkx-designsystemet/src/components/math/TenFrame.jsx) and the help selection in [domain/math.js](../../../../Prototype/mathkx-designsystemet/src/domain/math.js).

The proposed within-20 range permits `19 + 1`. The current addition help selects `MakeTen` whenever the sum exceeds ten. That component computes `need = 10 - a`, which becomes `-9`, and draws the first operand in a ten-cell frame. Porting it unchanged would produce invalid teaching steps and a diagram that cannot represent the operand.

The proposed challenge order also puts the broad within-20 definition after crossing-ten, but within-20 includes `1 + 1`. A larger allowed range is not a guarantee of a more demanding task.

**Correction:** Start with the reviewed within-10 and single-digit crossing-ten definitions, which fit the existing help models. Add the broader range only with an appropriate representation and validated parameters. Treat mixed within-20 practice as broader variety, or define a genuinely different challenge with a clear description; do not promise that every randomly selected task is harder.

**Acceptance:** Boundary fixtures verify agreement among prompt, answer, explanation, counters, and accessible text. Include `4 + 4`, `9 + 9`, and `19 + 1` as either supported cases or explicit rejections for the relevant representation. Every enabled generator/visual combination has a declared supported range. Existing [capability requirements](../../../architecture/exercise-capability-model.md) already require generated support to match the instance.

### R2 — Derive progress labels from actual result and support events

**Priority:** Before task 8's progress summaries. **Evidence:** Revised brief sections 5 and 6, especially the “A reserved status” row and “A later submission correct” row.

Section 5 correctly distinguishes partial correctness from inability to assess. Section 6 groups both reserved statuses as “Could not be checked automatically,” so partial correctness is misrepresented again. Its “later submission” rule would also label an invalid entry followed by a correct answer as “Right after feedback,” even without mathematical corrective feedback. The `help-*` shorthand is ambiguous for separately named `counting` and `answer-revealed` events.

**Correction:** Give partial and unassessed outcomes separate summary paths. Decide first/later mathematical response independently of input-format errors, and use the presence and ordering of actual feedback/support events rather than submission count alone. Name the support-event set explicitly. Keep observations per delivery/session so deliberately repeating the same mathematical instance does not merge all future work into the original attempt; submission IDs handle retry deduplication separately.

**Acceptance examples:**

- Invalid input, then correct: no claim of success after mathematical feedback.
- Incorrect, feedback shown, then correct: success after feedback.
- Correct after visual help/counting: supported success.
- Partially correct: partial result, without a claim that it was unassessable.
- Review needed: not automatically assessed, without a promised reviewer.
- Replayed network submission: no duplicate; deliberate later practice of the same instance: a distinct delivery, without pretending it was unseen content.

### R3 — Treat the brief as a multi-day milestone and choose a smaller first deliverable

**Priority:** Before committing to a weekend scope. **Evidence:** Revised brief section 3, task sizes and cut line.

Tasks 1–7 still total **3.75 focused days** using Claude's own estimates, before progress, CI, bilingual walkthroughs, device checks, and fixes. Moving the cut line after task 7 therefore does not produce a two-day plan. The cut-order instruction also says both “cut from the bottom” and lists the broad within-20 definition first, making its intended order unclear.

**Correction:** Keep the full milestone as a backlog. The first deliverable should prove one short bilingual lesson/worked example leading to one tested generated practice flow: visual help, answer, feedback, and another question. Add the second reviewed challenge definition next, preserving work on transition. Do not promise to finish the whole backlog in a weekend. Integrate relevant CI and bilingual checks with each delivered behavior; record an early iPad pass when available and keep untested device behavior explicit.

Domain tests and one end-to-end exercise are preferable to scaffolding every screen. Persistence summaries, a second generator, special directive syntax, automatic repeat avoidance, and the broad within-20 family can follow without losing their place in the milestone. Do not claim to assess number bonds until the missing-part objective is actually exercised.

### R4 — Define a narrow pilot content contract alongside the first generator

**Priority:** Before adding runtime definition files. **Evidence:** Revised brief tasks 1 and 3, sections 4 and 8; [exercise schema](../../../../schemas/exercise.schema.json), [exercise format](../../../architecture/exercise-format.md), and [content guidance](../../../../content/README.md).

The plan introduces pinned generator/validator versions, fixed definitions, topic challenge sequences, and lesson metadata while deferring Format v1. That is reasonable only if the implementation says how those pilot records are validated. The existing exploratory schema does not express all these contracts; placing new files under `content/` alone will not validate their meaning.

**Correction:** Introduce a deliberately limited, explicitly experimental schema/contract for the pilot with checks for supported generator versions, parameter bounds, skill references, and translated content. Preserve the existing `0.1` fixture rather than quietly reinterpreting it as stable. This is implementation work, not a reason to design the entire future format first. Prototype notation such as `addition-pair@1` need not become a literal field value without a defined parser/shape.

**Acceptance:** Valid pilot examples pass; unsupported versions, invalid ranges, and unknown references fail clearly. Include a fixed example and a generated instance. Do not claim a stable Format v1 after two scalar families alone: the [capability model](../../../architecture/exercise-capability-model.md) includes broader acceptance scenarios for that decision.

### R5 — Make the revised brief the unambiguous planning reference

**Priority:** Before consolidating an implementation plan. **Evidence:** Revised brief opening paragraphs and section 9; response-to-Codex C04.

The revision says original section 3 is the screen map and still applies. In the original, section 3 is the old release-requirement table; the screen map is section 4. This accidentally retains the table C06 was meant to replace. The response also says the first milestone has “no server,” contradicting its recommended .NET API.

**Correction:** State that the revised brief supersedes the old plan and release table, retaining only specifically named illustrations where useful. Say “no profile service or durable server-side progress yet” when describing the internal slice. Keep the original reports as historical proposals.

The later guest-import design needs one additional distinction: deterministic revalidation proves that an answer is mathematically correct for an instance. It does not verify who answered, whether help was used, or whether the browser's history is authentic. Preserve imported/self-reported provenance; do not upgrade it to observed independent performance. This does not block guest practice or require an account system in the first slice.

## Recommended starting choices

- **D1:** Use the two scoped skill identities as provisional content choices, with explicit objectives. Do not turn the advisory number-bonds connection into an access restriction or assume it proves use of a strategy.
- **D2:** Use the documented C#/.NET domain plus a thin API. The SDK is already installed; no evidence from this review justifies a second TypeScript implementation of the mathematics.
- **D3:** Use the existing number-bonds/addition material as the engineering pilot. Verify relevance with the learner before treating it as their prescribed starting level. Equations remain a subsequent content test, not a reason to broaden the first build.

These are recommendations, not recorded owner approvals. Routine identifier, file-layout, and parser choices can be settled during implementation within the existing requirements; they do not require another broad design round. No application implementation was requested or started by this review.

## Verification performed

| Check | Result |
| --- | --- |
| `npm test` at repository root | 18 tests passed |
| `npm run validate` | Passed: 8 content files, 7 skills, 1 exercise definition |
| `npm run build` in the Designsystemet prototype | Passed |
| Local tool availability | .NET SDKs 9.0.319, 10.0.113, 10.0.302; Node 22.19.0; npm 11.2.0 |

These checks establish the current repository baseline, not the correctness of an unimplemented application. No new browser, physical-iPad, VoiceOver, learner, or educator test was performed. Package restoration for future .NET projects and production deployment were not tested.
