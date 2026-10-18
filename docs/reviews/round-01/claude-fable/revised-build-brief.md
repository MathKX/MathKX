# MathKX — revised build brief (after Codex challenge)

**Reviewer:** Claude Fable 5.1, slug `claude-fable`. **Date:** 2026-10-18.
**Baseline:** `d08ebba2d4b6f701a8c5fffbf926891019610b78` on `main`, working tree clean.
**Status: proposed.** This revision supersedes section 2 and sections 5 to 9 of my [original brief](proposed-build-brief.md) in response to [Codex's challenge](../codex/challenge.md); see [response-to-codex.md](response-to-codex.md) for what changed and why. The original is preserved. Nothing here changes a requirement, schema, or accepted ADR; working names such as "challenge sequence" and "observation" are labels for this milestone, not contracts.

Sections 1, 3 (screen map), and the learner description of the original brief still apply.

---

## 1. Decisions needed before starting

Only these block the first milestone. Everything else is an implementation choice recorded as reversible, or a release decision that can wait.

| ID | Decision | Options | Recommendation | Evidence that would change it |
| --- | --- | --- | --- | --- |
| **D1** | The milestone's learning objectives and skill IDs | (a) the three objectives and two skills in §2 below, added to `content/skills/`; (b) the owner's own wording of them | **(a)** as a starting point; wording is the owner's | A mathematics educator's view that number bonds and addition within 20 should be one skill or three |
| **D2** | Where the mathematics runs in this milestone | (a) .NET domain library + thin ASP.NET Core API, as the intended stack says; (b) TypeScript domain in the browser for this milestone only, with the same fixtures, ported to .NET afterwards | **(a)** | If the owner's weekend cannot include backend setup, (b) is the honest fallback **and is a temporary deviation from the stated stack that needs the owner's agreement**, because two implementations of the same mathematics is a risk the documents warn against |
| **D3** | First topic | (a) number bonds and addition within 20 (prototype content exists; smallest mathematics; engineering pilot); (b) one-step equations (balance component exists; closer to the motivating learner's goals as `vision.md` describes them) | **(a)** for the first milestone, **(b)** for the second | The owner's knowledge of the initial learner. Suitability of (a) for that learner is unverified; (a) is proposed as the pilot that proves the loop, not as the learner's first real win |

Not owner decisions (implementer choices, logged as reversible): the lesson Markdown subset, the configuration-to-definition rule in §4, status wording in §5, the progress derivation in §6, the repository layout under `src/`, package versions.

Not blocking (release decisions, §9): license, profile design, hosting, persistence, recovery mechanisms, deletion rules.

---

## 2. Learning objectives and skills for the milestone

Objectives are observable statements about what a correct response demonstrates. None refers to age or school stage; the lesson content happens to be first met in early school and is useful at any age, and the UI should say so rather than label a level.

| Objective | Observable response | Task family | What it does **not** show |
| --- | --- | --- | --- |
| **O1** State the sum of two numbers whose total is at most 20 | Correct integer for `a + b` | `numbers.addition.within-10`, `numbers.addition.within-20` | Which strategy was used |
| **O2** State the missing part that makes ten | Correct integer for `a + ? = 10` with `a` in 0 to 10 | `numbers.number-bonds.missing-part` | Fluency or speed; recall versus counting |
| **O3** State the sum of two single-digit numbers whose total exceeds ten | Correct integer for `a + b` with `a, b ≤ 9` and `11 ≤ a + b ≤ 18` | `numbers.addition.crossing-ten` | Whether a make-ten strategy was used. The make-ten visual help is offered and its use is recorded as **support**, never as evidence of strategy |

**Skills (D1):**

- `numbers.number-bonds-to-ten` — O2.
- `numbers.addition-within-20` — O1 and O3. Prerequisite: `numbers.number-bonds-to-ten`. Rationale for the edge: knowing the pairs that make ten is the authored support the lesson uses for crossing ten; the edge means "recommended support", not "required before". The meaning of edges in general stays an open question in `skill-graph.md`; this one is documented locally in the skill file's companion note.

Both are added to `content/skills/` in the existing `numbers.` prefix (the validated registry). The prototype's `arithmetic.*` IDs are retired for these two skills; other prototype IDs are left alone until their topics are built. This is the whole of "reconciliation" for the milestone.

---

## 3. First milestone: one bilingual lesson with real generated practice

### What it is

A learner opens the "Number bonds to ten" lesson in Norwegian or English, explores the ten-frame, goes to practice, can ask for the visual model before answering, answers, gets feedback that names the likely slip, asks for another question or an easier or harder one without losing work, switches language mid-exercise without losing work, and sees an honest record of what they did. The mathematics is generated by tested domain code from a replayable identity.

### What it is not

Not a self-check (deferred, §8). Not a profile (release). Not iPad support (one early device pass records findings). Not Format v1.

### Implementation tasks in dependency order

Sizes are rough and given per task so that the total is visible: roughly four to five focused days for everything above the cut line, which is more than one weekend. The weekend target is the demonstrable core, tasks 1 to 7; the rest follows on evenings. No completion claim is made for anything below the line that is not done.

| # | Task | Depends on | Size | Verification inside the task |
| --- | --- | --- | --- | --- |
| 1 | Add the two skills to `content/skills/`; move the number-bonds lesson pair to `content/lessons/number-bonds-to-ten/{nb,en}.md` with GFM delimiter rows; rewrite `skills:`; extend `tools/validate-content.mjs` to parse lesson front matter, resolve skills, and require both languages | D1 | ½ day | `npm run validate` and new validator tests |
| 2 | .NET domain: `SeededRandom` (SplitMix64 per the proposal) with its raw, bounded, rejection, and boundary fixtures | D2 | ½ day | `dotnet test`; fixtures from `docs/architecture/proposals/seed-and-random-source.md` |
| 3 | .NET domain: generator `addition-pair@1` (ordered `{a,b}` under pinned ranges) and `missing-part-to-ten@1`; definitions for the four families in §2 as content files; validator returning the typed result of §5 with the prototype's misconception codes | 2 | 1 day | Golden seeds per definition; 10,000-seed property test per definition; generator–validator agreement; the replay fixture of §4 |
| 4 | Thin API: `GET instance(definitionId, version, seed)` returning presentation data only, `POST validate(definitionId, version, seed, artifact)` returning the typed result | 3 | ¼ day | Contract tests; private data never serialized |
| 5 | Web app skeleton (Vite, React, TypeScript, Designsystemet, Tailwind with the prototype's layer order); port `ExerciseShell`, `Counters`, `TenFrame`, `MathExpr`, `Page`, dictionaries with the `pluss` and ternary literals moved into them | 4 | ½ day | Dictionary key-parity test; one visual regression screenshot of a Designsystemet button to settle the Preflight question |
| 6 | Practice journey: answer, help before answering, feedback by code, "Another question", "Make it easier", "More challenge" via the challenge sequence of §4, "Repeat this question", work and help state preserved across language switch and resize | 5 | ½ day | Component tests for state preservation and exhaustive status rendering (§5) |
| 7 | Lesson rendering with a standard Markdown parser plus a `:::` directive for the two named components; section IDs | 5 | ½ day | Both lesson files render; GitHub shows tables |
| — | **Cut line for the weekend demo** | | | |
| 8 | Progress observations and derived labels (§6) in browser storage, guest only; "Lesson explored" | 6 | ¼ day | Unit tests for derivation and idempotent submission |
| 9 | Repeat avoidance by canonical instance (§4) with "Repeat this question" | 6 | ⅛ day | Test: no `{a,b}` repeat within the window; deliberate repeat still works |
| 10 | Bilingual verification script run in both languages (§7) and recorded | 6, 7 | ¼ day | Recorded checklist |
| 11 | CI: `dotnet test`, `npm test`, `npm run validate`, web build | 1–7 | ⅛ day | Green on a pull request |
| 12 | One physical-iPad pass of the checklist from `exercise-experience.md#answering-on-ipad` in Safari, both languages, with VoiceOver on the exercise screen; findings filed, no support claim | 6 | ¼ day + fixes | Checklist file with device and OS version |

### Explicit cut order if time runs out

Cut from the bottom of this list first; never cut what is below it.

1. `numbers.addition.within-20` definition (keep within-10 and crossing-ten; "More challenge" from crossing-ten then says "No harder variation is available yet", which is the honest message `learning-experience.md` asks for).
2. Repeat avoidance (task 9): fall back to a fresh seed and document that operands may repeat.
3. `numbers.number-bonds.missing-part` (task 3 part): then O2 is **not demonstrated** and the milestone summary must say so.
4. Lesson-embedded components (task 7 part): render the lesson text and link to the explorer on the practice page instead.

Never cut: both languages, the domain tests and replay fixture, help before answering, the typed result, work preservation on language switch, the identity rule of §4.

---

## 4. Reproducibility when challenge settings change

Established contract (ADR 0004, capability model "Reproducibility envelope"): an instance is identified by **(exercise definition ID, definition version, seed)**. `learning-experience.md#adjusting-challenge` adds: challenge selection must resolve to reproducible content and must not change generator parameters invisibly under the same identity.

**Rule for this milestone.** A challenge configuration is a definition. Each definition pins its generator name and compatibility version and its parameter ranges:

```text
numbers.addition.within-10          v1  generator addition-pair@1      a,b ≥ 1, a+b ≤ 10
numbers.addition.crossing-ten       v1  generator addition-pair@1      a,b ≤ 9, 11 ≤ a+b ≤ 18
numbers.addition.within-20          v1  generator addition-pair@1      a,b ≥ 1, a+b ≤ 20
numbers.number-bonds.missing-part   v1  generator missing-part-to-ten@1  a in 0..10
```

A **challenge sequence** is a small content file per topic listing definitions in order with a learner-facing sentence for each in both languages ("Addition within ten" / "Addisjon innenfor ti"; "Adding across ten, like 8 + 5" / "Over tieren, som 8 + 5"). "Make it easier" and "More challenge" move to the adjacent definition for the next question and show its sentence; at either end the app says no further variation is available yet. "Another question" draws a new seed in the current definition. The attempt records the **resolved** definition and seed; the learner's request may be logged as a UI event but is not part of identity.

**Fixed authored tasks** (the lesson's worked examples `4 + 4` and `8 + 5`) are definitions with `source: fixed`, identified by `(definitionId, version)`; a seed is accepted and ignored, as capability model §6 allows.

**Compatibility.** The instance carries `generatorVersion` and `validatorVersion`. A generator change that alters draw order or ranges ships as `addition-pair@2`, and any definition that wants it bumps its version; v1 definitions continue to resolve `@1`.

**Repeat avoidance** compares the canonical instance (`{a, b}` as an ordered pair for presentation; the unordered pair is also checked within the recent window because `4 + 5` after `5 + 4` is a repeat to most learners) over the last eight instances in the current definition. "Repeat this question" is always available.

**Replay fixture (task 3).** Given `(numbers.addition.crossing-ten, 1, seed 42)`: resolve in `nb`, resolve in `en`, resolve after the learner has pressed "Make it easier" twice and come back, and resolve after `addition-pair@2` exists; all four produce the same `{a, b}`. A second fixture shows `@2` producing different operands for the same seed under a v2 definition, and v1 still resolving `@1`.

---

## 5. Validation outcomes

Type vocabulary follows capability model §7. Each exposed status has a truthful wording; none implies a service that does not exist.

| Status (type) | Emitted in this milestone? | Learner-facing wording (en / nb) | Never |
| --- | --- | --- | --- |
| `correct` | Yes | "Correct. 4 + 4 = 8." / "Riktig. 4 + 4 = 8." | — |
| `incorrect` | Yes | The misconception-code text, then "You can change your answer and check again." | Shown as a score |
| `invalid-response` | Yes | "We couldn't read “x” as a number…" (prototype wording) | Counted as a mathematical attempt |
| `partially-correct` | Reserved | "Partly right: …" with the satisfied criteria named | Rendered as "awaiting review" or as wrong |
| `review-needed` | Reserved | "MathKX cannot check this answer automatically." plus the authored explanation if one exists | Any promise that a person will review it |

Result shape: `{ status, code, values, validatorVersion }`; `code` and `values` are resolved to text by the client in the active language, as the prototype's `feedbackText` already does. Two tests cover the reserved statuses: the client's status rendering is exhaustive with no default branch, and a stored observation with a reserved status is preserved and displayed with the wording above. No educator queue, rubric workflow, or routing is built or implied.

---

## 6. Progress tracking for generated exercises, retries, and support

**Observations, not Booleans.** Each delivered instance has one observation record:

```text
Observation {
  instance: { definitionId, version, seed | null, generatorVersion, validatorVersion }
  skill refs (from the definition)
  purpose: practice            (check is deferred; the field exists)
  submissions: [ { submissionId, artifact { kind, canonical, originalText }, result, at } ]
  support:     [ { kind: help-opened | help-step | counting | feedback-shown | answer-revealed, at } ]
  challengeRequest: easier | harder | null   (UI event, not identity)
}
```

`submissionId` is generated by the client so that re-sending the same submission is idempotent. `feedback-shown` is recorded whenever an `incorrect` result's text is displayed. `answer-revealed` is reserved and unused.

**Derived labels** (the calm wording from `activity.js` is kept; its derivation is replaced):

| Condition on the observation | Label (en / nb) |
| --- | --- |
| First submission `correct`, no `help-*` support | "Right first time" / "Riktig på første forsøk" |
| A later submission `correct`, no `help-*` support | "Right after feedback" / "Riktig etter tilbakemelding" |
| Any `correct` and any `help-*` support | "Right with visual help" / "Riktig med visuell hjelp" |
| No `correct`; only `invalid-response` | not shown as practised |
| No `correct` | "Not solved yet" / "Ikke løst ennå" |
| A reserved status | "Could not be checked automatically" / "Kunne ikke sjekkes automatisk" |

Topic and practice summaries count labels ("9 questions: 4 right first time, 3 after feedback, 2 with visual help") and never a percentage or a mastery word. Help use and retries are never negative. A correct retry after corrective feedback is never labelled "first time" or "independent".

**Guest storage in this milestone.** Observations live in browser storage, as the prototype does, and are presented as "kept in this browser only".

**Release design (not built now).** The server validates and creates observations; the client never submits results. When guest work is attached to a profile (R01-008), the client sends each submission's `(instance, artifact)` and the server **re-validates** deterministically against the replayable instance; browser-computed results are discarded. Duplicate `submissionId`s are ignored. This is possible precisely because of §4.

---

## 7. Testing and bilingual verification inside the milestone

**Automated.** `dotnet test` (random-source fixtures, golden seeds, property tests, agreement, replay fixtures); `npm test` (validator regressions including lesson front matter and pairing; dictionary key parity; `translate()` throws in development on a missing key; exhaustive status rendering; state preservation across language switch and resize; idempotent submission); `npm run validate`; web build. All in CI (task 11).

**Learner-visible string check.** A lint scoped to JSX text nodes and the `aria-label`, `aria-description`, `label`, `description`, `placeholder`, and `title` attributes flags letters outside the dictionaries; technical identifiers in other attributes are not flagged. The known `pluss` literal and the inline `lang === 'nb'` ternaries are moved into the dictionaries in task 5.

**Manual bilingual script (task 10), run in `nb` then `en`, recorded with pass or fail per line:**

1. Open the lesson; every heading, the objective, the table, and both components read in the selected language.
2. Open practice; prompt, labels, help button, and the screen-reader text between the counter groups are in the selected language.
3. Press help before answering; group labels and the counting controls are translated.
4. Type `8`, switch language, confirm `8` and the open help survive; submit; the feedback is in the new language.
5. Enter `8,0` in Norwegian and `8.0` in English; both accepted. Enter `4+4`; the "looks like a calculation" message appears in the selected language.
6. Press "Make it easier" and "More challenge"; the one-sentence description is translated; at the end of the sequence the "no further variation" message is translated.
7. Review the activity labels on the topic page in both languages.

**Early device pass (task 12).** One physical iPad in Safari: field, submit, and feedback visible with the keyboard open; help open and close with the keyboard open; rotation with help open; VoiceOver reads the expression, the two groups, and the live feedback; external keyboard completes the exercise. Record device and OS; file findings. The milestone does not claim iPad support.

---

## 8. Deferred from this milestone, with where it lands

| Deferred | Lands in | Why deferred |
| --- | --- | --- |
| Self-check with stated support policy and three-group summary | Milestone 2 | Needs the observation model first; adding it to the first weekend made the plan unachievable (C01) |
| One-step equations family and balance help | Milestone 2 | Second family is the real test that the shell and contracts are domain-independent; closer to the motivating learner's goals |
| "Return to goal" affordance after following a prerequisite link | Milestone 3 | Needs two topics |
| Choice and ordering response families | After milestone 2 | Capability model's recommended slice; not needed for O1–O3 |
| Profiles, server storage, recovery | Release plan (§9) | Design first (R01-007); no account code until then |
| Format v1 schema | After milestone 2 | Write it from what two families actually needed |
| TypeScript twin of the random source | Only if browser-side preview is wanted | Not required by the proposal |

---

## 9. Release plan

Three tables, kept apart as Codex asked. Nothing in the second table is approved by this document.

### 9.1 Established requirements (release gates)

| Requirement | Source |
| --- | --- |
| Persistent profiles with saved progress across sessions and devices; no required real name, email, or external identity provider; credentials that work without email | ADR 0006 |
| Optional recovery email, verified before use, equal capabilities without it, help saving credentials, clear loss-of-access explanation | ADR 0006 |
| Anonymous profile setup described honestly, not as network anonymity | ADR 0006, `vision.md#profiles-and-continuity` |
| Norwegian and English for the released interface, lessons, exercises, hints, feedback, and accessibility text; language switch preserves progress and mathematical identity | `vision.md#first-release-languages`, `content/AGENTS.md` |
| iPad as a primary device: touch, on-screen keyboard, rotation, narrow windows, keyboard access, VoiceOver, checked on actual devices before release | `design-principles.md#ipad-and-touch-use` |
| Accessibility accommodations distinct from teaching help and never negative evidence | `exercise-experience.md`, capability model §9 |
| Learners can always request more practice, easier or harder work; finite families may repeat; changes explicit; work preserved | `learning-experience.md#more-practice-and-learner-control` |
| Authored content alongside generated families; maths in tested domain code | `learning-experience.md`, ADR 0003 |
| Deterministic, replayable instances | ADR 0004 |
| No mastery claims without a validated model; honest progress language | `mastery.md`, `product-principles.md` |
| Contribution through review for educators and translators | `learning-experience.md#open-contribution-workflow` |
| Designsystemet and Tailwind for the web UI | ADR 0007 |

### 9.2 Proposed additions (owner to approve, defer, or reject individually)

| Addition | Learner benefit | Shared-device privacy effect | Effort | Alternative |
| --- | --- | --- | --- | --- |
| One-time recovery codes shown at setup | A second key for learners who decline email, removing the "no recovery at all" cliff | Codes must be stored by the learner; none on the device | Small once auth exists | Email only (status quo); passkeys later |
| Progress export (JSON) | Learner owns their record; eases leaving | None | Small | None needed for release |
| Explicit "keep me signed in on this device" choice, default off on a new device; "sign out everywhere" | Protects the next learner on a shared iPad | Positive | Small | Always-remembered sessions (worse on shared devices) |
| Guest-to-profile attach prompt with server re-validation (R01-008) | No silent loss of a guest's work; no silent attach of someone else's | Positive | Small, depends on §4 | Silent replace (status quo in prototype) |
| Two complete topics at release (addition, one-step equations) | A learner at the motivating learner's level has something relevant | None | Milestone 2 | One topic; the owner's call |
| Library opens on ready topics; "a good place to start" sentence (no popularity claim) | Avoids an empty-feeling library | None | Trivial | Keep current default |
| Plain-language privacy notice in both languages | Trust; follows "Respect learners" | None | Small | Required by law in many places regardless; the owner should check |

### 9.3 Unresolved implementation choices (left open by the ADRs)

Authentication technology and credential format; password hashing and rate limiting; recovery mechanisms beyond email; session handling; persistence technology; hosting; retention and deletion rules; learner–parent–teacher relationships; the review workflow for `review-needed` responses, if any. These need a written design (R01-007 for the account cluster) before implementation and are not decided here.

---

## 10. Validation plan (revised)

| When | Who | What | Record |
| --- | --- | --- | --- |
| During the milestone | Owner, physical iPad | Task 12 checklist | Findings; no support claim |
| After the milestone | The initial learner, if willing, 15 minutes with the addition practice; otherwise after milestone 2 with equations | Can they find the help button unprompted? Do they understand "Right with visual help" and "Right after feedback"? When they wanted help, was it useful? Did they ever want help and not find it? | Observations, including "help not needed" as a valid outcome |
| After the milestone | One adult who did not grow up with "tiervenner" | The lesson in English, five questions, then the missing-part questions | Whether the framing sentence lands; whether any wording reads as childish |
| Before milestone 2 | A mathematics educator | Objectives O1–O3, the two skills and their edge, the misconception codes and texts, the challenge sequence sentences | Written review in an issue |
| Before release | A contributor new to the repository | Fix a wording in one language of the lesson, run validation, open a pull request | Done without touching application code |
| Before release | Owner plus a screen-reader user if available | Full journey on iPad with VoiceOver and an external keyboard, both languages | Checklist with device and OS |

---

## 11. Risks and verdict

**Risks.** The weekend demo (tasks 1–7) depends on D2 being a quick backend setup; the fallback is defined and labelled. The configuration-as-definition rule multiplies definitions as families grow; acceptable at four, worth revisiting when a family needs more than five. The observation model is richer than the prototype's and must not grow into a mastery model by accident; the "never a percentage" rule and the label table are the guard. Anchoring: this revision was written by the author of the original; the challenge pass has been applied, but an independent reviewer remains worthwhile.

**Verdict.** The revised first milestone is **ready for owner approval subject to D1, D2, and D3**. It is smaller than the original slice, carries its tests and bilingual verification inside, preserves the replay identity, keeps result meanings distinct without promising a reviewer, tracks progress as observations rather than Booleans, states its objectives without age assumptions, and keeps every established release requirement visible and separate from my proposals. **Public release remains not ready**, with the same blockers as before: profile design, license and contribution terms, device and assistive-technology validation, and translation enforcement.
