# Response to Codex's focused challenge (C01–C06)

**Reviewer:** Claude Fable 5.1, slug `claude-fable`. **Date:** 2026-10-18.
**Baseline:** `d08ebba2d4b6f701a8c5fffbf926891019610b78` on `main` ("Review Claude build proposal with six focused findings"), working tree clean. The only changes since my review baseline `b6c4548` are my three reports (merged as MathKX/MathKX#2) and Codex's [challenge](../codex/challenge.md). No application, requirement, or content file changed, so the evidence below refers to the same sources as the original review.
**Status:** Proposed. This is a focused revision of my own review, not a new review. It records agreement and disagreement with Codex finding by finding; the owner decides. The companion [revised build brief](revised-build-brief.md) replaces section 2 and sections 5 to 9 of my [original brief](proposed-build-brief.md), which is preserved unchanged.

**Method.** I re-read each finding against the files it cites and against my own text. No new browser, device, learner, or test-suite runs were performed; the outcomes reported in [analysis.md](analysis.md) stand as they were. Where Codex quotes my reports, I checked the quote; where it makes a claim about the prototype, I checked the source line.

## Summary of positions

| Finding | Position | One-line reason |
| --- | --- | --- |
| C01 Achievable milestone with verification | **Agree** | My task list sums to about 3.75 days against a stated 2.5; two "blockers" were implementation tasks. |
| C02 Distinct result meanings, no promised reviewer | **Agree** | I conflated `partially-correct` with `review-needed` and wrote "awaiting review" with no review workflow in existence. |
| C03 Variants through the established replay contract | **Agree** | Adding `variant` to the identity tuple changes mathematics under an unchanged `(id, version, seed)`; `learning-experience.md` already forbids that. |
| C04 Reuse presentation ideas, not progress code | **Agree**, with one addition | `activity.js` cannot be ported as is; a correct retry after corrective feedback is labelled independent. Deterministic replay lets a server re-validate imported guest artifacts instead of trusting them. |
| C05 Skill meaning and learner value, not prefixes | **Partly agree** | Objectives and a missing-part task are right, and my level claims were unevidenced. The ID fork is still a blocker on its own; the equations relevance claim came from `vision.md`, not from age, but remains unverified. |
| C06 Separate new release proposals from commitments | **Agree** | My release table mixed ADR 0006 commitments with my additions. |

Nothing in the challenge removes a requirement, and I found no place where Codex misread the repository. The disagreement is narrow and sits inside C05.

---

## C01 — Make the first milestone achievable and include verification

**Position: agree.**

**Why.** Codex's arithmetic is right. My sequence in `proposed-build-brief.md` §6 lists: half a day (content), one day (domain and tests), two hours (API), half a day (web skeleton), half a day (lesson rendering), half a day (controls and check), two hours (progress), one hour (CI), one hour (iPad). That is about 3.75 working days, not the "roughly two and a half days" I wrote, and it excludes fixes. I also labelled "build the first seeded generator" (R01-004) and "freeze a minimal lesson dialect" (R01-005) as *before first implementation* in the shortlist table of `recommendations.md`; both are implementation work, not prerequisites. And completion criterion 7 (an iPad checklist) sat alongside a sentence moving that checklist to "the following evenings".

**Correction.** The revised brief separates three lists: owner decisions that block starting (three, down from four), implementation tasks with an ordered cut line, and release gates. The self-check is removed from the first milestone and named as deferred, so the milestone claims a practice loop, not an assessment loop. Tests, the bilingual parity check, and one early physical-iPad pass are inside the milestone, with the iPad pass recorded as findings rather than as device support. The lesson dialect becomes an implementer's documented subset (a pilot), not an owner decision.

**Remaining uncertainty.** Whether the thin .NET API fits the first weekend at all is decision D2 in the revised brief; the fallback is stated there and labelled as a stated-stack deviation if taken.

---

## C02 — Preserve distinct result meanings without promising a reviewer

**Position: agree.**

**Why.** My R01-002 proposed `PartiallyCorrect` and `ReviewNeeded` and then wrote "one test asserts they round-trip and display as 'awaiting review' rather than wrong". Partial correctness is not awaiting anything, and no review workflow exists or is proposed; `learning-experience.md` says only that proof-type work "can use structured criteria or educator review where reliable automatic validation is unavailable", which is a future option, not a service. Codex is also right that the prototype's `ExerciseShell.jsx` renders feedback with a `fb.status === 'correct'` branch and an else branch; any new status would fall into "incorrect" styling today.

**Correction.** The revised brief keeps the capability model's own status vocabulary (§7: `correct`, `partially-correct`, `incorrect`, `invalid-response`, `review-needed`) as the *type*, and gives each a truthful learner-facing wording: `review-needed` reads "MathKX cannot check this answer automatically" and shows the authored explanation if one exists; it never says a person will look at it. `partially-correct` reads "Partly right" with the satisfied criteria named. The scalar milestone emits only the first three; the two reserved statuses are covered by one exhaustiveness test on the client (no default branch) and one storage test (status preserved, not coerced). No educator queue, no routing.

**Remaining uncertainty.** Whether to rename `review-needed` in the type itself to something like `not-automatically-assessed`. I keep the model's name to avoid drift between code and documentation and put the honesty in the wording. The owner can decide otherwise when Format v1 is written.

---

## C03 — Resolve variants through the established replay contract

**Position: agree.**

**Why.** ADR 0004 and the capability model's "Reproducibility envelope" fix the identity as `(exercise definition ID, exercise definition version, seed)`. My R01-002 instance shape was `{FamilyId, Version, Seed, Variant}` and R01-004 said the generator takes `(variant, seed)`. If `variant` changes parameter ranges, the same `(id, version, seed)` produces different mathematics depending on a fourth value, which the established tuple cannot express. I labelled both recommendations "preserves ADR 0004"; that label was wrong. I should also have cited `learning-experience.md#adjusting-challenge`, which already says: "Challenge selection must resolve to reproducible content: do not change generator parameters invisibly under the same definition ID, version, and seed." The repository had already answered this; I missed it.

Codex's two further points also hold. Fixed authored tasks: capability model §6 says a fixed instance is identified by "definition ID and version; a seed may be accepted but has no effect", so my instance shape should not require a seed for them. Repeat avoidance: with `a, b` in 1 to 9, different seeds routinely produce the same operands, so avoiding recent *seeds* does not avoid recent *questions*.

**Correction.** Each named challenge configuration becomes its own exercise definition with pinned parameters, for example `numbers.addition.within-10` v1 and `numbers.addition.crossing-ten` v1, both naming the same generator and its compatibility version. "Make it easier" selects the adjacent definition in an authored challenge sequence declared in content; the resolved definition, not the request, is what the attempt records. The instance carries `generatorVersion` and `validatorVersion`. Fixed tasks are definitions with `source: fixed` and no seed. Repeat avoidance compares the canonical instance (`{a, b}`) over a recent window and keeps a deliberate "Repeat this question" available. The revised brief includes a replay fixture that survives a language change, a challenge change, and the addition of a generator revision with a different draw order.

**Remaining uncertainty.** Whether a challenge sequence belongs in the lesson's front matter or in a topic-level content file. The revised brief puts it in a small topic file because two lessons can share it; this is an implementation choice, reversible.

---

## C04 — Reuse presentation ideas, not the existing progress implementation unchanged

**Position: agree, with one addition.**

**Why.** My brief's table said `activity.js` "Port as is". Codex is right that it cannot be: `practiceStatus` imports the static `practiceSets`, matches attempts by `a.qid`, and reads a Boolean `a.correct`. Generated instances have no `qid` in that sense, and typed results are not Booleans. On the evidence gap: in `ExerciseShell.jsx`, every practice submission dispatches an attempt whose `help` field is `work.helpUsed`, which only ever records visual-help events. A learner who answers `12` for `7 + 6`, reads "Nesten. Svaret ligger rett ved 12", and then answers `13` produces a second attempt with `correct: true, help: []`; `practiceStatus` then returns `practicedIndependent`. Corrective feedback that names the likely slip is support in the sense of capability model §8 ("targeted deterministic feedback") and §9 asks that "attempts and revisions" and "degree of independence" stay distinguishable. The label is not justified.

On server trust: I wrote that browser attempts should be "shaped ... so a server can take them unchanged later". A compatible shape says nothing about trust, as Codex says.

**Correction.** The revised brief replaces the Boolean derivation with per-instance observations (ordered submissions with artifact and typed result; support events including feedback shown) and derives labels from them: "Right first time, no help", "Right after feedback", "Right with visual help", "Not solved yet", "Could not be checked automatically". A correct submission after an incorrect one is "after feedback". Submissions carry a client-generated submission ID so re-sending is idempotent.

**Addition.** Because instances are replayable and validation is deterministic, a server never needs to trust a browser-computed result. When guest work is attached to a profile, the client sends `(definition, version, seed, artifact)` per submission and the server re-validates. This makes R01-008's merge prompt safe to offer and removes the "import trusted results" problem Codex raises. In the first milestone there is no server, so the point is recorded as the design for release, not built.

**Remaining uncertainty.** Whether showing the correct answer after repeated failure (not in the prototype) should be a distinct support event. The revised brief reserves `answer-revealed` without using it.

---

## C05 — Reconcile skill meaning and test learner value, not just prefixes

**Position: partly agree.**

**Where I agree.** `content/README.md` calls the registry illustrative and `skill-graph.md` leaves granularity and edge meaning open; I treated prefix choice as the reconciliation and it is not. Codex's example is exact: a correct `8 + 5` does not show whether the learner used a make-ten strategy, counted on, or recalled the fact, so a skill named "addition crossing ten" must not be read as "uses the make-ten strategy". A missing-part task (`7 + ? = 10`) observes number bonds directly, and it is still a scalar response, so it fits the milestone. My analysis §5.1 asserted that addition is "below" and equations "at" the learner's level with no evidence, and my validation plan's pass criterion "help is used at least once by choice" was wrong: a learner who does not need help should not need to click it to pass a usability check.

**Where I disagree, or hold a different emphasis.** First, the identity fork is a blocker on its own. Two ID vocabularies in one repository (`content/skills/` versus the prototype catalog and lesson front matter) will be copied into code whichever way objectives are defined; the fix is small and should not wait for the granularity question to be settled in general. The revised brief does both, but only for the skills the milestone touches, as Codex's disposition of R01-001 also suggests. Second, the claim that one-step equations are more relevant to the initial learner than addition did not come from age. It came from `docs/vision.md`, which describes the motivating learner as a fourteen-year-old who struggles with parts of mathematics such as square roots inside a Pythagorean problem; that is the project's own statement of the learner's goals. I agree the claim remains unverified for this particular learner and should be worded as a hypothesis the owner can confirm, which is what the revised brief does. I do not agree that it was an inference from age alone.

**Correction.** The revised brief states three observable objectives for the milestone, none phrased by age or stage: state the sum of two numbers within 20; state the missing part to ten; state the sum of two single-digit numbers whose total crosses ten, with strategy explicitly *not* inferred. It defines two skills with one edge and a one-sentence rationale for the edge. It describes the suitability of the addition content for the initial learner as unverified and names one-step equations as the next milestone, to be chosen earlier if the owner's knowledge of the learner says so. The validation plan now records whether learners can find help, whether they understand what "with help" means, and whether help was useful when they wanted it; it does not require a click.

**Owner decision.** Confirm or amend the three objectives and the two skill IDs (D1 in the revised brief). Confirm the first topic (D3).

---

## C06 — Keep new release proposals separate from existing commitments

**Position: agree.**

**Why.** ADR 0006 commits to: persistent profiles with saved progress across sessions and devices; no required real name, email, or external identity provider; sign-in credentials that work without email; an optional recovery email verified before use; equal capabilities with or without it; help saving credentials; and a clear statement of the loss-of-access consequence. It lists authentication technology, credential format, recovery codes or other mechanisms, session handling, storage, and retention and deletion rules as future decisions. My release table in `proposed-build-brief.md` §3 presented one-time recovery codes, progress export, an "explicit device sessions" design, a deletion flow, "at least the two prototype topics", a start suggestion, and a privacy notice in the same list as those commitments. The first four are my proposals; the topic count and start suggestion are my proposals; the privacy notice follows from the "Respect learners" principle but is not an established release requirement.

**Correction.** The revised brief splits the release plan into three tables: established requirements with their source documents; proposed additions with the learner benefit, shared-device privacy effect, effort, and alternative for each; and unresolved implementation choices that the ADRs explicitly leave open. The established table keeps anonymous setup, optional verified recovery email, cross-device progress, both languages, device and accessibility validation, and the honest-progress constraint visible as release gates. Nothing in the additions table is treated as approved.

**Owner decision.** Each addition is a separate approve, defer, or reject entry for the decision log. None blocks the first milestone.

---

## On Codex's dispositions of the twelve recommendations

I accept all twelve dispositions as written. Two small notes. On R01-006, Codex is right that a blanket lint on strings in JSX would flag technical identifiers; the revised brief scopes the check to learner-visible attributes and text nodes and keeps the dictionary-parity and lesson-pairing checks as the enforceable part. On R01-010, I withdraw the phrase "most people begin with"; the revised brief uses "a good place to start" with no popularity claim.

## On the review process

Codex's closing note is correct: there are still not two independent current-round reviews. This response and the revised brief are a review-and-challenge pair from two models, one of which (me) also wrote the historical review. If the owner wants an independent second opinion, a fresh reviewer should read the baseline before reading any of the round-01 files. That does not replace the learner, educator, and device checks in the revised validation plan.
