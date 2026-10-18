# Corrections to the revised build brief

**Reviewer:** Claude Fable 5.1, slug `claude-fable`. **Date:** 2026-10-18.
**Baseline:** `91626407b3bf01f3ae6d027df3edabf5a3d510e0` on `main` ("Merge branch 'main'"), working tree clean. Checks run at this commit: repository `npm test` 18 of 18, `npm run validate` pass; prototype `npm test` 16 of 16, `npm run build` 935.8 kB single file. The prototype's browser suite (`npm run test:browser`, Playwright) was not run here; its results below are the prototype's own claims.
**Status: proposed.** This addendum corrects my [revised build brief](revised-build-brief.md) in response to Codex's [readiness note](../codex/readiness.md) (R1–R5), Codex's [round-02 synthesis](../../round-02/synthesis.md), and Gemini's round-02 [comparison](../../round-02/gemini-argon/comparison-and-recommendations.md) and [readiness](../../round-02/gemini-argon/build-readiness.md). The revised brief and all earlier reports are preserved unchanged; where this addendum and the revised brief differ, this addendum is the planning reference. Nothing here changes a requirement, schema, or accepted ADR; owner decisions are listed in the [decision log](../decision-log.md).

## What has changed since the revised brief

Four things happened between the revised brief (baseline `d08ebba`) and this addendum, and each one narrows what still needs correcting:

1. **Owner decisions.** ADR 0008 (PostgreSQL) and ADR 0009 (Azure App Service, Norway East) are accepted. Gemini's proposal to assign ADR 0008 to the random-source proposal is stale; if that proposal is accepted it becomes ADR 0010.
2. **Authoritative documents updated** (commit `7fe5b26`). `docs/learning/mastery.md#progress-tracking-before-a-mastery-algorithm` and `docs/design/exercise-experience.md#explaining-why-the-result-follows` now settle the result and support semantics that Codex R2 and Gemini R02-002/003 argued about. The revised brief's §5 and §6 tables are superseded by those documents wherever they differ.
3. **Codex's round-02 synthesis** already assigns dispositions to Gemini R02-001 to 010 and lists Gemini's incorrect citations. I agree with every disposition there; §B below records my position per item rather than repeating the synthesis.
4. **Prototype iteration 2 and its round-03 fixes** (commits `a6a3aba`, `b8ec545`). Most of the prototype defects Gemini found in round 02, and the round-03 findings from Claude, Codex, and Gemini, are reported fixed in the prototype's [review response](../../../../Prototype/mathkx-designsystemet/docs/iteration-2/REVIEW-RESPONSE.md), with domain tests I ran and browser tests I did not. The build brief therefore no longer needs to carry prototype bug fixes; it needs to carry the *rules* those fixes embody into the production contracts.

---

## A. Codex readiness corrections R1–R5

| Finding | Position | Correction carried into §D–§G |
| --- | --- | --- |
| **R1** Bound generated tasks to the mathematics the help can represent | **Agree.** My `numbers.addition.within-20` range allowed `19 + 1`, which the single-ten-frame make-ten model cannot show. My cut order also listed within-20 first while saying "cut from the bottom". | Two definitions only (§D). Every definition declares its supported representation and value range; boundary fixtures include `4 + 4`, `9 + 9`, and `19 + 1` as supported or explicitly rejected. The cut order is rewritten as one list. |
| **R2** Derive progress labels from actual result and support events | **Agree.** My §6 grouped `partially-correct` and `review-needed` under one label and let an `invalid-response` followed by `correct` read as "after feedback". | Rules in §E follow `mastery.md`: mathematical submissions only; support ordered relative to the first correct response; separate paths for partial and unassessed; per-delivery observations. |
| **R3** Treat the brief as a multi-day milestone; choose a smaller first deliverable | **Agree.** Tasks 1–7 summed to 3.75 days against a two-day cut. | §D defines a first deliverable (lesson plus one generated practice flow) and a backlog, with no weekend promise. |
| **R4** Define a narrow pilot content contract alongside the first generator | **Agree.** I introduced pinned generator versions, fixed definitions, and challenge sequences without saying how they are validated. | §F lists the experimental pilot schemas and the checks the validator must perform; `addition-pair@1` becomes a structured `{name, version}` field, not a literal. |
| **R5** Make the revised brief the unambiguous planning reference | **Agree.** I pointed at the wrong section of the original brief and wrote "no server" where I meant no profile service. | §G states the supersession precisely and corrects both phrases. |

---

## B. Gemini round-02 recommendations

Codex's synthesis dispositions are adopted as written. My own position per item, with the evidence I checked at baseline `d08ebba` and what has since changed:

| ID | Position | Note |
| --- | --- | --- |
| R02-001 scope to two definitions | **Agree** (adapt per synthesis) | Deferring the missing-part task is a scope choice; the task family is valid mathematics and returns in milestone two with its own visual model. The "8 retries" and "half the pool" rules Gemini attributes to my brief are not in it and are not adopted. Repeat avoidance is by canonical instance, bounded, with honest repetition when exhausted. |
| R02-002 observation rules | **Agree** | Already normative in `mastery.md`; §E restates them for the build. The "permanent with-help taint" in the old `activity.js` was a real defect I missed and my §6 table repeated; the prototype has since replaced that file. |
| R02-003 reachable explanations | **Agree, expanded** | `revealFinal={work.solved}` alone is insufficient: explanations may be requested after an incorrect response, with an explicit reveal. Iteration 2 implements the help/explanation split with per-step reveal recording. |
| R02-004 lesson identity and parity | **Agree, adapt** | One canonical lesson ID equal to the folder name; cross-language metadata and referenced section anchors validated; byte-identical prose or directive order not required. The two lesson files Gemini names (`crossing-ten-addition`, `linear-equations-balance`) do not exist. |
| R02-005 SplitMix64 in C# | **Agree, reject supplied vectors** | Use the proposal's checked-in fixtures (seeds 0, 1, 42, 1234567890123456789, 2^64−1 and the four bounded rows). Gemini's seed-123456789 sequence is not from the proposal. |
| R02-006 lesson exploration | **Agree, adapt** | Truthful "Lesson viewed", no required scrolling or clicking. Iteration 2 already did this. |
| R02-007 localization and input | **Agree** | `pluss` and `Legend` are fixed in iteration 2; `inputMode` is now `decimal` for numeric answers; a notation grammar rejects unsupported symbols visibly. Carry the string-parity and lesson-pairing checks into CI (§F). |
| R02-008 validator hardening | **Agree** | Small; do it when the lesson and pilot schemas are added. |
| R02-009 profile setup | **Defer to the profile design** | Iteration 2 added email correction, cancel-change, and a pending state; the profile-created-at-step-1 behaviour is now a recorded prototype assumption for the owner (decision log). |
| R02-010 defer self-checks | **Agree on deferral; reject the stated evidence** | Checks use their own authored lists, not reversed practice arrays. A first self-check needs stated scope, policy, run history, and honest outcomes, not a mixed-skill generator. |

Gemini's round-02 report cites eight paths that do not exist, a Codex finding "C09", a quotation from `product-principles.md` that is not in the file, and misattributes my R01-009. The code-level findings survived re-verification; the report should not be cited without that check. The synthesis lists the same errata.

---

## C. What prototype iteration 2 resolved, and what it did not

The prototype's review response reports fixes for: the home-page crash after a self-check (round-03 C1/X01/G-P0), the lesson detour that hid an answer reveal (X02), counting to the total recorded as a reveal (C5/X03), per-step explanation recording (X03), the balance substitution picture (C4/X06), "More like this" with a pending change (C2/X04), the stale `?variant` prompt (C3/X04), resuming an unfinished question (X07), check boundaries in history (X05), guest-work labels (C7/C8), the clipped equation at 390 px (C6), touch targets (C12), and Gemini's G1–G12. I verified that its 16 domain tests pass and the build succeeds; I did not run its browser suite or test on a device. These are the prototype's claims, now reproducible by `npm run test:browser`.

Still open after iteration 2 and relevant to the build: no generator or seed (finite reviewed lists stand in); lessons live under `Prototype/…/src/content/lessons`, not `content/lessons`, and `lesson.json` points at a schema that does not exist; the prototype's skill IDs (`arithmetic.add-within-20`, `algebra.solve-x-plus-a`) still differ from `content/skills/`; iPad, VoiceOver, learner, educator, and translator checks remain undone. Several prototype decisions await owner confirmation (see decision log DL-026 and DL-027).

---

## D. Corrected first milestone (replaces revised brief §2–§4 and §6)

### Objectives

| Objective | Observable response | Definition | Not shown |
| --- | --- | --- | --- |
| **O1** State the sum of two numbers whose total is at most ten | Correct integer for `a + b`, `1 ≤ a, b ≤ 9`, `a + b ≤ 10` | `within-10` | Strategy |
| **O3** State the sum of two single-digit numbers whose total is 11 to 18 | Correct integer for `a + b`, `2 ≤ a, b ≤ 9`, `11 ≤ a + b ≤ 18` | `crossing-ten` | Whether a make-ten strategy was used; make-ten help is support, never strategy evidence |

**O2** (missing part to ten) is **deferred to milestone two** with a dedicated visual model. The milestone therefore does not claim to assess number bonds, only to teach them in the lesson and to practise addition. Objectives are stated without reference to age or school stage.

The two skills from the revised brief (`numbers.number-bonds-to-ten` as advisory prerequisite, `numbers.addition-within-20` as target) stand as the proposal for D1; the number-bonds skill has no task in this milestone and is not a gate. Final IDs are the owner's (decision log DL-004).

### First deliverable, then backlog

**First deliverable** (the thing to demonstrate first, with its tests): one bilingual lesson (the existing number-bonds pair) rendered by the real app, one C# generator for `within-10`, visual help before answering, answer, typed feedback by code, "Another question", observations recorded in the browser. Then **add the second definition** `crossing-ten` with "Make it easier" and "More challenge" transitions that preserve the current question. Everything else is backlog in the order below. No calendar promise: the sizes in the revised brief sum to about four days before fixes.

| Order | Backlog item | Verification carried with it |
| --- | --- | --- |
| 1 | Skills added to `content/skills/`; lesson moved under `content/lessons/<id>/` with `lesson.json`, `nb.md`, `en.md`; pilot schemas (§F); validator extended | `npm run validate`, validator tests |
| 2 | C# `SeededRandom` with the proposal's fixtures; `addition-pair` generator version 1; definitions `within-10` and `crossing-ten`; validator with the prototype's misconception codes; result type (§E) | `dotnet test`: fixtures, golden seeds, property test per definition, agreement, replay fixture, boundary fixtures `4 + 4`, `9 + 9`, `19 + 1` |
| 3 | Thin API: instance and validate | Contract tests; private data stays server-side |
| 4 | Web app: shell, counters, ten-frame, notation renderer, dictionaries; strings outside dictionaries removed | Dictionary parity test; status rendering exhaustive |
| 5 | Practice flow for `within-10`: help before answering, answer, feedback, another question | Component tests: state survives language switch and resize |
| 6 | Lesson rendering with a standard parser plus the `:::visual`, `:::example`, `:::practice` directives | Both lesson files render; GitHub shows the tables |
| — | **First deliverable complete** | |
| 7 | `crossing-ten` definition, make-ten help, challenge transitions, honest "no further variation" at the ends | Replay fixture across a challenge change |
| 8 | Observations and derived labels (§E), per delivery, idempotent submissions | Unit tests for every outcome in §E |
| 9 | Repeat avoidance by canonical instance, bounded, with "Repeat this question" | Test: no repeat within the window; deliberate repeat works; exhausted pool repeats honestly |
| 10 | CI: `dotnet test`, `npm test`, `npm run validate`, web build | Green on a pull request |
| 11 | Bilingual walkthrough script (revised brief §7) recorded | Checklist |
| 12 | One physical-iPad pass in Safari with VoiceOver on the exercise screen; findings filed, no support claim | Checklist with device and OS |

Cut order if time is short: 9, then 7 (ship one definition and say so), then 6 (plain lesson text with a link to the explorer). Never cut both languages, the tests, help before answering, the identity rule, or the typed result.

### Identity and challenge changes (replaces revised brief §4)

Unchanged in principle, corrected in detail. Each challenge configuration is a versioned exercise definition; the instance identity is **(definition ID, definition version, seed)** per ADR 0004 and `learning-experience.md#adjusting-challenge`. A per-skill ladder in content lists definitions in order with a learner-facing sentence in both languages; "Make it easier" and "More challenge" select the adjacent definition for the next question, show its sentence, and at either end state honestly that no further variation exists yet. The attempt records the resolved definition; the learner's request is a separate event. Fixed authored tasks have `(definition ID, version)` and no seed. The replay fixture must pass across a language change, a challenge change, and the addition of a generator version 2 with a different draw order.

Repeat avoidance compares the canonical instance (`{a, b}`, ordered for presentation, unordered within the recent window) over at most the last eight deliveries in the current definition; the search is bounded, and when the pool is exhausted the next question is delivered and marked as a repeat, as the prototype already does. Selection history stays outside generation so the resolved identity always replays.

---

## E. Results and observations (replaces revised brief §5 and §6)

The authoritative rules are `mastery.md#progress-tracking-before-a-mastery-algorithm` and `exercise-experience.md#explaining-why-the-result-follows`. This section restates them as build rules and aligns names with the prototype where it already follows them.

### Validation result statuses

| Status (capability model §7) | Emitted in milestone one | Learner-facing meaning | Never |
| --- | --- | --- | --- |
| `correct` | Yes | "Correct. 4 + 4 = 8." | — |
| `incorrect` | Yes | Misconception-code text; "You can change your answer and check again." | A score |
| `invalid-response` | Yes | Input guidance ("We couldn't read … as a number") | A mathematical attempt or retry |
| `partially-correct` | Reserved | "Partly right: …" with satisfied criteria | Shown as unassessed or as wrong |
| `review-needed` | Reserved | "MathKX cannot check this answer automatically" plus any authored explanation | A promise that a person will review |

Rendering is exhaustive (no default branch); storage preserves reserved statuses. No review workflow is built or implied.

### Observation per delivery

One observation per **delivery** of an instance (a deliberate later repeat of the same instance is a new delivery). It holds: instance reference `(definition, version, seed | none, generatorVersion, validatorVersion)`, purpose (`practice`; `check` deferred), ordered **mathematical submissions** (`correct`, `incorrect`, `partially-correct`, `review-needed`) with client submission IDs for idempotency, **input-guidance events** (`invalid-response`) kept apart, and ordered **support events** from this named set: `visual-help-opened`, `help-step`, `counting`, `counting-complete` (an answer reveal, per `exercise-experience.md#addition-example`), `explanation-open`, `explanation-step` with a `reveals` flag, `feedback-shown`, `lesson-opened`, `lesson-reveal` (the lesson shows this instance's answer), `answer-reveal`. Provenance: `profile`, `guest`, `guest-import`, `sample`.

### Outcome of a delivery

Derived from the sequence, with "while solving" meaning before the first `correct` submission:

| Sequence | Outcome (prototype name) | Wording |
| --- | --- | --- |
| First mathematical submission `correct`, no teaching support before it | `correctFirst` | "Correct on first response, no help" |
| `correct` after an `incorrect` with `feedback-shown`, no teaching support | `correctAfterFeedback` | "Correct after feedback" |
| `correct` after visual help, counting (not complete), or help steps | `correctWithVisualHelp` | "Correct with visual help" |
| `correct` after non-visual help that did not reveal (explanation steps before the revealing one; a lesson without this answer) | `correctWithHelp` | "Correct with help" |
| `correct` after any reveal (`counting-complete`, revealing `explanation-step`, `lesson-reveal`, `answer-reveal`) | `correctAfterExplanation` | "Answered after the answer was shown" |
| Highest status `partially-correct` | `partiallyCorrect` (new) | "Partly right" |
| Highest status `review-needed` | `notAssessed` (new) | "Not checked automatically" |
| Only `incorrect` | `notYetCorrect` | "Not correct yet" |
| Learner moved on without a mathematical submission | `skipped` | "Skipped" |
| Session ended with a draft | `unfinished` | "Unfinished", resumable |
| Only `invalid-response` or nothing | not shown as practised | — |

Support after the first correct submission adds a tag ("Explanation opened after answering") and never changes the outcome. An `invalid-response` before a `correct` never produces "after feedback". Skill and topic summaries are **counts of outcomes over deliveries**, never a single state that one helped delivery can fix; "Practised" is not a badge to earn by avoiding help. Imported guest observations keep their provenance; a server may re-validate the mathematics of an imported artifact but never upgrades it to observed independent performance (`mastery.md#persistence-and-current-implementation-status`).

---

## F. Pilot content contract (new, per Codex R4)

Explicitly experimental, versioned `0.1-pilot`, not Format v1. The exploratory `exercise.schema.json` fixture stays as it is. Added under `schemas/` before any file under `content/` uses them:

| Schema | Shape (responsibilities, not final field names) | Validator checks |
| --- | --- | --- |
| `lesson.schema.json` | `id` (equals folder name), `version`, `status`, `skills[]`, `prerequisites[]`, `related[]`, `practice[] {definition}`, `visuals[]`, `translations {nb, en}` — the prototype's `lesson.json` shape | Both language files exist; `id` equals folder; all skill and definition references resolve; the `:::visual` and `:::practice` directives name registered components and existing definitions with parameters inside declared ranges; referenced section anchors exist in both languages; notation grammar accepted |
| `exercise-definition.pilot.schema.json` | `id`, `version`, `skill`, `source: generated | fixed`, `generator {name, version}`, `parameters` validated per generator, `supportedRepresentations [{name, range}]`, `misconceptionCodes[]`, fixed instances when `source: fixed` | Generator name and version are registered; parameter bounds within the generator's declared domain; every representation's range covers the definition's value range; fixed instances validate against their own validator |
| `skill.schema.json` (extend) | Optional per-skill `ladder[]` of definition IDs with localized sentences | Definitions exist and share the skill; ladder is acyclic and ordered |

CI also runs the dictionary key-parity test and flags learner-visible literals outside the dictionaries, scoped to text nodes and accessible-name attributes.

---

## G. Supersession and wording (per Codex R5)

- The revised brief **supersedes** the original brief's §2 (slice), §3 (release-requirement table), §5–§9. It **retains** the original's §1 (learner, problem, outcome) and the Mermaid screen map in the original's **§4**. My earlier sentence naming "section 3 (screen map)" was wrong.
- This addendum supersedes the revised brief's §2, §3, §4, §5, §6, and the task list in §6; the revised brief's §1 (decisions), §7 (bilingual script), §8 (deferrals), §9 (release tables), and §10–§11 stand, with the release table caveat below.
- "No server" in the response to Codex should read "**no profile service and no durable server-side progress** in the first milestone"; the recommended thin API is part of the milestone under D2.
- Release table (revised brief §9.1) addition: ADR 0008 and 0009 are now established and belong in the first table; §9.3 should no longer list persistence technology and hosting as open.

---

## H. Decisions and conflicts

- **D1, D2, D3** stand as stated in the revised brief §1. Codex (readiness) and Gemini (build-readiness) both recommend the same answers: the two scoped skills with explicit objectives, .NET domain plus thin API, number bonds and addition as the engineering pilot with equations next. The owner has not yet recorded them (decision log DL-004 to DL-006).
- **Random-source proposal.** If accepted after the C# fixtures pass, it is **ADR 0010**; ADR 0008 is taken.
- **`mastery.md` status sentence** ("the database … remain undecided") conflicts with accepted ADR 0008; a one-line reconciliation is needed (decision log DL-025).
- **Prototype decisions awaiting confirmation** (from its `ASSUMPTIONS.md`): counting the last counter is a reveal; the lesson-disclosure rule; "More like this" replaces a pending change; a finished session keeps an unanswered question resumable; the profile is created at step 1 (decision log DL-026, DL-027).

## Verdict

Unchanged in direction, smaller in scope: **ready for the first deliverable subject to D1–D3**, with the corrections above carried into the implementation tasks. Public release remains not ready for the reasons already recorded.
