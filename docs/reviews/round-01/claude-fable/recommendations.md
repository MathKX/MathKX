# MathKX review — prioritized recommendations

**Reviewer:** Claude Fable 5.1, slug `claude-fable`. **Date:** 2026-10-18. **Baseline:** `b6c4548d890979c5327d729e13a27efee20814b8`.
**Status:** every item below is **proposed**. None changes a requirement or accepted ADR unless its "Requirement impact" row says so, and then only with owner agreement.

See [analysis.md](analysis.md) for evidence and walkthroughs and [proposed-build-brief.md](proposed-build-brief.md) for how these fit one starting design.

Timing labels: **before first implementation** (the weekend slice should not start without it), **before public release**, **later**.

## Shortlist

| ID | Title | Timing | Blocker? |
| --- | --- | --- | --- |
| R01-001 | One skill identity scheme, lessons under `content/` | Before first implementation | Yes |
| R01-002 | Promote the prototype's validation and attempt shapes into the first domain contracts | Before first implementation | Yes |
| R01-003 | Design learner practice controls as named family variants | Before first implementation (design), before release (complete) | Yes (design) |
| R01-004 | Build the first seeded generator and settle the random-source proposal with its tests | Before first implementation | Yes |
| R01-005 | Freeze a minimal, portable lesson dialect for the slice | Before first implementation | Yes |
| R01-006 | Translation completeness as a CI check; remove literals outside dictionaries | Fix now; check before release | No |
| R01-007 | Decide the production profile design before building accounts | Before public release | Release blocker |
| R01-008 | Explicit guest-to-profile continuity on sign-in | Before public release | No |
| R01-009 | iPad and assistive-technology acceptance checklist, run on a device | Before public release; first pass during the slice | Release blocker |
| R01-010 | Library honesty and a "start here" path | Before public release | No |
| R01-011 | Archive and label the older prototype | Before first implementation (housekeeping) | No |
| R01-012 | Licenses, contribution terms, and a real "suggest an improvement" target | Before accepting outside contributions | Release blocker |

Items 001 to 005 are the blockers for the slice; 007, 009, and 012 are the blockers for a public release; the rest are important but can follow.

Full IDs are `CLAUDE-FABLE-R01-001` and so on; the short form is used below.

---

## CLAUDE-FABLE-R01-001 — One skill identity scheme, lessons under `content/`

**Problem and who it affects.** The validated registry (`content/skills/`) uses `numbers.integer-operations`, `numbers.square-roots`, `geometry.pythagorean-theorem`, `algebra.linear-equations`. The prototype catalog (`Prototype/mathkx-designsystemet/src/content/catalog.js`) uses `arithmetic.add-within-10`, `arithmetic.number-bonds-10`, `algebra.solve-x-plus-a`, `algebra.equality-meaning`, and lesson front matter references them. Neither set knows about the other; lessons live in the prototype tree. Developers building the slice will copy whichever is nearest; content contributors will have two vocabularies.

**Evidence.** Repository: the two file sets above; `content/README.md` says `lessons/` "not yet created". Inference: the fork happened because the prototype and the hygiene PR were produced in parallel. External: none.

**Proposed change.** Before writing application code, choose one scheme and record it in `content/README.md` (not an ADR: `mathematics-domains.md` already says domain names do not fix identifier prefixes). Concretely: keep the existing registry prefixes (`numbers.`, `algebra.`, `geometry.`) because they are validated and merged, add the slice's skills to it (`numbers.addition-within-10`, `numbers.number-bonds-to-ten`, `numbers.addition-crossing-ten`, `algebra.equality-meaning`, `algebra.one-step-equations`, `algebra.check-solution`) with prerequisite edges, and move the four lesson files to `content/lessons/<lesson-id>/<lang>.md` with their `skills:` lines rewritten. Extend `tools/validate-content.mjs` to parse lesson front matter and fail on unknown skill IDs or a missing language pair.

**Retain.** The registry, the schema, the cycle check, the prototype's lesson content and front-matter shape.

**Alternative.** Adopt the prototype's `arithmetic.` prefix and rename the four registry skills. Equivalent cost; slightly worse because it touches validated files and the merged ADR-free decision. Either is fine; not deciding is not.

**Dependencies.** None. Enables R01-005 and the lesson validation in the brief.

**Requirement impact.** Preserves "stable language-neutral identifiers".

**Confidence.** High that a decision is needed; medium on which prefix. **Biggest uncertainty:** whether the owner has a taxonomy preference already. **Smallest validation:** write the six skill files and run `npm run validate`.

**Acceptance.** `npm run validate` resolves every lesson `skills:` entry and reports lesson count; `content/lessons/` exists; the prototype catalog is no longer the source of skill IDs.

**Files likely affected.** `content/skills/*.json`, `content/lessons/**`, `content/README.md`, `tools/validate-content.mjs`, `tools/validate-content.test.mjs`, `schemas/` (new lesson front-matter schema).

---

## CLAUDE-FABLE-R01-002 — Promote the prototype's validation and attempt shapes into the first domain contracts

**Problem.** `math.js` already returns `{status, code, values}` and records attempts as `{qid, set, mode, correct, help[], answer}`. These are close to the capability model's typed validation result (§7) and evidence event (§9) but lack: definition version, seed, validator version, active purpose, and the statuses `review-needed` and `partially-correct`. If the .NET domain starts from a Boolean or from the prototype's shape unchanged, the retrofit later touches every stored attempt.

**Evidence.** `src/domain/math.js` (`evaluate`, `FEEDBACK`), `src/store.jsx` (`attempt` action), `exercise-capability-model.md` §7 "Validation result contract" and §9 "Minimum provenance". Inference: the model's full result contract is more than the slice needs; the fields above are the minimum that cannot be added later without migration.

**Proposed change.** Define in the .NET domain, and mirror as TypeScript types for the client:

- `ValidationResult { Status: Correct | PartiallyCorrect | Incorrect | InvalidInput | ReviewNeeded; Code: string; Values: dictionary; ValidatorVersion: string }`
- `Attempt { InstanceRef { FamilyId, Version, Seed, Variant }, Purpose: Practice | Check, Artifact { Kind, CanonicalValue, OriginalText }, Result, Support: SupportEvent[], At }`
- `SupportEvent { Kind: HelpOpened | HelpStep | Counting | AnswerRevealed; At }`

Feedback prose stays out of the domain: the domain emits `Code` and `Values`; the client resolves text per language (the prototype already does this via `feedbackText`). `ReviewNeeded` and `PartiallyCorrect` have no UI in the slice; one test asserts they round-trip and display as "awaiting review" rather than wrong.

**Retain.** The misconception codes (`add.oneGroup`, `add.concat`, `add.offByOne`, `add.subtracted`, `lin.added`, `lin.copied`, `lin.substitute`) and their nb/en texts; they are good content.

**Alternative.** Implement the capability model's full result contract (criteria, misconception candidates with strength, normalized artifact). Tradeoff: more honest to the model, but several weekends of type design before any learner sees anything; the fields can be added additively later.

**Dependencies.** R01-004 (the generator supplies `Seed`, `Version`, `Variant`).

**Requirement impact.** Preserves "nontrivial mathematical logic in tested domain code" and the evidence boundary; makes W8's proof boundary concrete without a grader.

**Confidence.** High. **Uncertainty:** whether `Variant` belongs in instance identity or in `Purpose`-like context; I place it in identity so replay is exact. **Smallest validation:** write the C# records and one golden test per status.

**Acceptance.** Every attempt stored by the slice carries family ID, version, seed, variant, purpose, support events, and a typed result; a `ReviewNeeded` attempt displays as awaiting review.

**Files.** New `src/backend/...Domain` project; client types; `docs/architecture/exercise-format.md` (note that the instance/attempt shapes are being prototyped, not that 0.1 changed).

---

## CLAUDE-FABLE-R01-003 — Design learner practice controls as named family variants

**Problem.** The learning-experience document requires "Another question", "More like this", "Make it easier", "More challenge", and "Check my understanding" in both languages, with current work preserved, changes applied to the next question, and explicit transitions for checks. The prototype has none of them: fixed lists of four or five questions and "Start again". Learners (the stated audience includes people who need to repeat) get a dead end after five questions.

**Evidence.** `learning-experience.md#more-practice-and-learner-control` and `#adjusting-challenge`; `Practice.jsx` (`done` branch offers check, restart, back); `catalog.js` fixed question arrays. External: none.

**Proposed change.** Each exercise family declares named **variants** with parameter ranges and a one-sentence learner description in both languages. For addition: `within-10` ("Addition within ten"), `crossing-ten` ("Adding across ten, like 8 + 5"), `within-20` ("Any addition within twenty"). "Make it easier" and "More challenge" move to the adjacent variant for the next question and show the description; "Another question" draws a new seed in the same variant, avoiding the last few seeds; "More like this" is the same as "Another question" for a single-variant family and is omitted until a family needs the distinction. During a check, the two challenge buttons open a short dialog: "Finish this check as it is" or "Switch to practice with easier questions"; the check record is unchanged. The attempt stores the actual variant, not the request.

**Retain.** The honest copy ("Help is part of learning"), the stated check policy, the prototype's labels table.

**Alternative.** A numeric difficulty per question with a slider. Tradeoff: faster to build, but it contradicts "not a universal numbered ladder" and makes "what changes" impossible to explain.

**Dependencies.** R01-004 (variants are generator parameters).

**Requirement impact.** Implements an established requirement; proposes that "More like this" may be omitted when identical to "Another question" (clarification, not a change).

**Confidence.** High on the design, medium on the right variant ladder for equations (`x + a = b` has little range; the honest answer may be a single variant plus "Another question" until subtraction equations exist). **Smallest validation:** show the three buttons to one learner and ask what they expect to happen.

**Acceptance.** In practice, the three controls exist in nb and en, preserve the current answer, apply to the next question, and the summary shows the variant used; in a check, pressing them does not alter the recorded result.

**Files.** Family definitions, generator parameters, `ExerciseShell`/practice page, i18n.

---

## CLAUDE-FABLE-R01-004 — Build the first seeded generator and settle the random-source proposal with its tests

**Problem.** ADR 0004 is accepted; no generator exists; the random source is a proposal with test vectors but no implementation. The prototype's fixed question lists are fine as authored content but cannot deliver "another question".

**Evidence.** `decisions/0004-*.md`, `proposals/seed-and-random-source.md` (SplitMix64, bounded sampling, rejection and boundary fixtures), `catalog.js`. External: SplitMix64 reference values for seeds 0 and 1 match the proposal (verified in the earlier session by implementation, recorded in the proposal).

**Proposed change.** In the .NET domain: `ISeededRandom` with SplitMix64 and `NextBelow(n)` exactly as the proposal specifies, passing its raw, bounded, rejection, and boundary fixtures; an `AdditionWithin20` generator taking `(variant, seed)` and producing `{a, b}` under the variant's constraints with a deterministic draw order; golden-seed tests for each variant; a property test that every instance satisfies its variant's constraints across 10,000 seeds; a generator-validator agreement test. If the fixtures pass in C#, the proposal is ready to be accepted as an ADR by the owner; if they expose a problem, the proposal is amended. Either way the decision is made by tests, not prose. A TypeScript twin is not required for the slice.

**Retain.** The prototype's fixed lists as **authored** sets (the format must support fixed instances; keep one as the authored worked example).

**Alternative.** Hash-based generation (`hash(familyId, version, seed)` → parameters) without a stream. Tradeoff: simpler for one draw, awkward once a generator needs several dependent draws or rejection; the proposal already handles that.

**Dependencies.** R01-002 for the instance shape; R01-003 for variants.

**Requirement impact.** Preserves ADR 0004 and the "data configures, code computes" rule. Proposes accepting the random-source proposal as an ADR **only after** its tests pass; that acceptance is the owner's.

**Confidence.** High. **Uncertainty:** none material for addition; equations need a decision on whether `a` and `b` are independent draws or `x` is drawn first (draw `x` first so solutions are always within the variant). **Smallest validation:** the fixture table in the proposal, run as xUnit tests.

**Acceptance.** `dotnet test` passes the proposal's fixtures; `(family, version, seed, variant)` replays identically; the agreement test shows `Validate(Generate(seed).Solution)` is `Correct` for all golden seeds.

**Files.** `src/backend/...Domain`, `...Domain.Tests`; later `docs/architecture/decisions/0008-*.md` if the owner accepts.

---

## CLAUDE-FABLE-R01-005 — Freeze a minimal, portable lesson dialect for the slice

**Problem.** The prototype's `Markdown.jsx` is a 123-line hand-written parser for a dialect with front matter, `## Heading {#id}`, `:::example` containers, `{{component key=value}}` embeds, `$math$`, and tables **without** the delimiter row that standard Markdown requires. The lesson files therefore render only in the prototype; a contributor's editor preview, GitHub's renderer, and any future static view will show the tables as plain text. The documents correctly call the dialect a proposal, but the slice needs *some* dialect, and the one in the prototype has a portability bug baked in.

**Evidence.** `src/components/Markdown.jsx` (table branch skips rows that are all dashes but does not require one), the four lesson files (`| Pair | Sum |` followed directly by data rows), `learning-experience.md` ("The Markdown dialect ... need a small working lesson before they become stable contracts"). External: GitHub-flavoured Markdown requires a delimiter row for tables (specification knowledge; applicability direct).

**Proposed change.** For the slice, adopt the smallest dialect that standard renderers degrade gracefully on: CommonMark/GFM for text, headings, lists, and tables (with delimiter rows); YAML front matter with the prototype's fields (`id`, `lang`, `title`, `objective`, `skills`, `related`, `practice`, `check`); `:::example` and `:::component name key=value` fenced containers (a widely used directive convention; renders as a visible block elsewhere); `$...$` for inline mathematics limited to the current `MathExpr` token set, documented as such. Use an existing parser (for example a CommonMark library with a directive extension) rather than the hand-written one, so the parser is not a second place where the dialect is defined. The notation question (MathML subset versus TeX subset) is deferred: the slice needs only linear expressions, and `MathExpr` covers them.

**Retain.** The front-matter fields, section IDs for deep links from check summaries, the component-reference idea, the lesson content itself.

**Alternative.** MDX or JSX in lessons. Tradeoff: more power, but it violates "no executable code in lesson files" and excludes non-developer contributors.

**Dependencies.** R01-001 (lesson location and skill IDs).

**Requirement impact.** Preserves "Markdown lessons ... are a proposal to evaluate"; this is the evaluation vehicle, explicitly not a finalized dialect.

**Confidence.** Medium-high. **Uncertainty:** whether `:::component` or `{{component}}` reads better to teachers; test with one. **Smallest validation:** convert the two lessons, render them with the chosen library and with GitHub, compare.

**Acceptance.** The four lesson files render correctly in the slice and acceptably (tables visible, directives shown as blocks) on GitHub; the validator checks front matter, component names, and parameters; no lesson contains executable code.

**Files.** `content/lessons/**`, lesson renderer in the web app, validator, `docs/design/learning-experience.md` (mark which parts the slice adopted).

---

## CLAUDE-FABLE-R01-006 — Translation completeness as a CI check; remove literals outside dictionaries

**Problem.** The screen-reader text between the two counter groups is the Norwegian literal `pluss` in both languages. Several other learner-visible strings are inline `lang === 'nb' ? … : …` ternaries ("Finn x"/"Find x" in `ExerciseShell.jsx`, "Ett mindre"/"One less" in `TenFrame.jsx`, download messages in `Profile.jsx`). Nothing checks that the `nb` and `en` dictionaries have the same keys or that every lesson has both files. The first-release requirement is "Norwegian and English throughout"; today it is met by care, not by a check.

**Evidence.** `Counters.jsx` (`<span className="ds-sr-only">pluss</span>`), the ternaries above, `i18n.js` (`translate` falls back to `nb` silently), `content/AGENTS.md` ("localization storage and validation remain to be designed"). Observed in the browser: English mode, help open, accessibility tree contains "pluss".

**Proposed change.** Now: move the literals into the dictionaries. For the slice: a test that the `nb` and `en` dictionaries have identical key sets, and a lint that flags string literals containing letters inside JSX outside the dictionary files (an existing i18n lint rule or a 30-line script). For release: the content validator requires both `nb.md` and `en.md` for every lesson and reports lessons whose two files have different section ID sets; `translate()` fails loudly in development when a key is missing instead of falling back.

**Retain.** The dictionary structure, `pick()` for content objects, per-language lesson files.

**Alternative.** A translation-management service. Tradeoff: unnecessary at two languages and two lessons; revisit when a third language or a tenth lesson arrives.

**Dependencies.** R01-005 for the lesson pairing check.

**Requirement impact.** Preserves the bilingual requirement; adds the enforcement the documents say is missing.

**Confidence.** High. **Uncertainty:** none. **Smallest validation:** the key-parity test, which takes ten minutes to write.

**Acceptance.** CI fails on a dictionary key present in one language only, on a lesson with one language file, and on a learner-visible literal outside the dictionaries; the `pluss` literal is gone.

**Files.** `i18n.js`, the components named, `tools/`, CI workflow.

---

## CLAUDE-FABLE-R01-007 — Decide the production profile design before building accounts

**Problem.** ADR 0006 requires email-free sign-in with saved progress across devices and optional verified recovery email, and lists the mechanism as undecided. The prototype's `toyHash` (32-bit FNV-1a) in `localStorage` is correctly labelled "not security" but it is the only concrete shape anyone has seen. Without a written design, the first person to need "login" will build something plausible and insecure.

**Evidence.** ADR 0006; `store.jsx` (`toyHash`, `checkCredentials`, `generateLearnerId`, 8 characters from 31 symbols ≈ 39.6 bits); `Profile.jsx` (fixed code `246810`); `HANDOFF.md` item 1; no deletion in `Settings`. External (platform knowledge, not re-verified for this review): ASP.NET Core Identity's default `PasswordHasher` uses PBKDF2; Argon2id is the current OWASP preference. Applicability: direct.

**Proposed change (a design to write, not to build this weekend).**

- Server-side profile keyed by an internal ID; the learner-visible ID (`MKX-…`) is a username, never a secret, and never shown in URLs.
- Password hashed server-side with a memory-hard or iterated hash; per-ID and per-IP rate limiting with gentle lockout copy.
- Optional recovery email, verified by a time-limited code; optional **one-time recovery codes** generated at setup and shown once, so a learner who declines email still has a second key. This preserves the no-email requirement and removes the "no recovery at all" cliff.
- Sessions: explicit "keep me signed in on this device" choice at sign-in, default off on first sign-in from a new device; sign-out clears everything; a visible "sign out everywhere".
- Account deletion from settings with a cooling-off period; progress export as JSON for the learner.
- A plain-language privacy notice in both languages.

**Retain.** The four-step setup, the forced "I have saved my ID" step, the download/copy of the ID, the recovery page's three honest cases, the settings page structure.

**Alternative.** Passkeys (WebAuthn) as the primary credential. Tradeoff: excellent on iPad, no password to lose, but recovery still needs a second factor and cross-device sync depends on the platform account, which sits awkwardly with "no external identity provider". Worth offering later as an addition, not as the only path.

**Dependencies.** Hosting and persistence decisions (also open).

**Requirement impact.** Preserves ADR 0006. Recovery codes are an addition within the ADR's "recovery codes or other recovery mechanisms remain future decisions".

**Confidence.** High that the design is needed before release; medium on details. **Uncertainty:** whether the audience will actually store recovery codes; the smallest validation is to watch three people complete setup with codes offered.

**Acceptance.** A written profile design in `docs/architecture/proposals/`, reviewed before any account code; tests listed in ADR 0006's consequences exist when built.

**Files.** New proposal document; later `src/backend`, `Profile.jsx` successors.

---

## CLAUDE-FABLE-R01-008 — Explicit guest-to-profile continuity on sign-in

**Problem.** Creating a profile attaches the guest session's progress (good). Signing in to an existing profile replaces the guest progress with the profile's, silently (`store.jsx`, `signIn` case). A learner who practised for twenty minutes before remembering to sign in loses that work with no warning.

**Evidence.** `store.jsx` reducer: `createProfile` uses `state.progress`; `signIn` sets `progress: p.progress`. Inference: this is a prototype shortcut, not a decision.

**Proposed change.** When a guest with any attempts signs in, ask once: "Add what you did today to this profile, or discard it?" Default to adding; merge is an append of attempts and a union of explored lessons. On shared devices, the same prompt protects the previous learner's guest work from being attached to the wrong profile, so the question is worth asking even when the answer is usually "add".

**Retain.** Guest-first use without a profile; attaching on create.

**Alternative.** Always merge silently. Tradeoff: simpler, but wrong on a shared iPad.

**Dependencies.** R01-007.

**Requirement impact.** Preserves "guest-to-profile continuity if guest use is offered".

**Confidence.** High. **Smallest validation:** a unit test of the merge plus one user asked what they expected.

**Acceptance.** Sign-in with guest attempts shows the choice; chosen behaviour is applied; a test covers both paths.

---

## CLAUDE-FABLE-R01-009 — iPad and assistive-technology acceptance checklist, run on a device

**Problem.** iPad is a primary device and the requirement is explicit that desktop emulation does not complete validation. Nobody has run the prototype or will run the slice on an iPad with the on-screen keyboard and VoiceOver. Two concrete risks found by inspection: `inputMode="numeric"` for addition will be fine, but the same choice for later families (negatives, decimals) may hide the minus sign and comma on iPadOS keyboards; and when help opens in portrait the answer field may scroll off-screen under the keyboard.

**Evidence.** `design-principles.md#ipad-and-touch-use`; `HANDOFF.md` ("Not yet tested on a real iPad"); `ExerciseShell.jsx` `inputMode`; `exercise-experience.md#answering-on-ipad` already lists the checks. External: iPadOS numeric keypad layout varies by keyboard language (platform knowledge, flagged as hypothesis).

**Proposed change.** Turn the paragraph in `exercise-experience.md` into a checklist file the slice must pass on one physical iPad in Safari, both languages: focus the field with the keyboard open and see the field, the submit action, and the feedback; open and close help with the keyboard open; rotate mid-exercise and keep answer and help state; VoiceOver reads the MathML expression, the two counter groups, and the feedback live region; all primary targets measure at least 44 CSS pixels; an external keyboard can complete the whole exercise; zoom to 200 percent still works. Record device and OS version in the checklist when run.

**Retain.** The non-drag design, the live region, focus management.

**Alternative.** Automated Safari testing in a cloud device farm. Tradeoff: repeatable, but it does not replace a human with VoiceOver for the first pass.

**Dependencies.** The slice must exist to test; the first pass can use the prototype build this week.

**Requirement impact.** Implements an established requirement.

**Confidence.** High. **Smallest validation:** run the checklist on the prototype build once; it will find something.

**Acceptance.** A completed checklist for the prototype (this week) and for the slice (before release), with issues filed.

---

## CLAUDE-FABLE-R01-010 — Library honesty and a "start here" path

**Problem.** "Start learning" leads to a library of 44 topics where 42 say "Preview". The toggle "Show only topics that are ready" exists but is off by default. A learner unsure where to start gets no suggestion beyond prerequisite lists; an adult sees "Often met: primary school" on the first available topic.

**Evidence.** `Library.jsx` (`only` default `false`, 44 rows in the browser), `catalog.js` (two `available` topics), `TopicRow` stage label. Observed in the browser.

**Proposed change.** Default the library to ready topics with a visible "Show planned topics (42)" control; on the landing and library pages, one sentence: "Not sure where to start? Most people begin with [topic]. Each topic lists what helps to know first." Rephrase the stage label as context: "Usually first met in primary school · useful at any age". No placement test.

**Retain.** The preview tags, the domain cards, the search.

**Alternative.** Hide planned topics entirely until they exist. Tradeoff: cleaner, but it hides the vision's scope from contributors who browse to see what to help with; the About page can carry the coverage map instead.

**Dependencies.** None.

**Requirement impact.** Preserves "avoid a large onboarding test"; supports "credible for adults".

**Confidence.** Medium (copy and defaults are cheap to change after observation). **Smallest validation:** show the landing to two adults and ask where they would click.

**Acceptance.** Library opens on ready topics; a start suggestion exists in both languages; the stage label no longer reads as a level.

---

## CLAUDE-FABLE-R01-011 — Archive and label the older prototype

**Problem.** `Prototype/MathKX Learner Experience.dc.html` (1079 lines), `Prototype/support.js` (1911 lines of generated runtime whose source is not in the repository), and `Prototype/.thumbnail` sit beside the new prototype with no README. The old prototype shows mastery percentages and an automatic prerequisite detour that current documents disown. A newcomer cannot tell which prototype is current.

**Evidence.** `git ls-files Prototype`; `support.js` header "GENERATED ... do not edit"; the review prompt itself warns not to treat the older prototype as authoritative.

**Proposed change.** Move the three files to `Prototype/archive/2026-08-learner-experience/` with a short README: what it demonstrated (the detour-and-return loop, calm visual language), what it is not (mastery percentages, routing rules), and that the new prototype supersedes it. Or delete it and rely on git history; archiving is kinder to the story.

**Retain.** The detour-and-return storyboard idea, which W3 still needs.

**Alternative.** Leave as is. Cost: continuing confusion for every reviewer and contributor.

**Dependencies.** None. **Requirement impact.** None. **Confidence.** High. **Acceptance.** `Prototype/` has one current prototype and one labelled archive.

---

## CLAUDE-FABLE-R01-012 — Licenses, contribution terms, and a real "suggest an improvement" target

**Problem.** There is no license. `CONTRIBUTING.md` correctly says outside contributions cannot be incorporated until terms exist. The prototype's suggestion dialog produces issue text and sends nowhere; there is no issue template. The contribution story the About page tells cannot yet happen.

**Evidence.** No `LICENSE`; `CONTRIBUTING.md` licensing section; `Lesson.jsx` `ReportForm` ("Prototype: nothing was sent"); `.github/` contains only the workflow.

**Proposed change.** Owner chooses a code license (MIT or Apache-2.0) and a content license (CC BY 4.0 or CC BY-SA 4.0), records the choice as an ADR, adds `LICENSE` at the root and under `content/`, and updates `CONTRIBUTING.md` and the About page. Add `.github/ISSUE_TEMPLATE/lesson-improvement.yml` with fields matching the dialog (lesson, section, kind, description) and make the dialog's submit open `https://github.com/MathKX/MathKX/issues/new?template=lesson-improvement.yml&title=…&body=…` in a new tab; the privacy note stays. This is general engineering guidance, not legal advice.

**Retain.** The dialog's structure and privacy copy; the interim CONTRIBUTING wording until the decision.

**Alternative.** A hosted form that files issues server-side so learners need no GitHub account. Tradeoff: friendlier for learners, but it needs a backend and moderation; fine for later.

**Dependencies.** None for the license; the dialog target needs the template.

**Requirement impact.** Preserves "open-source contributions ... through review".

**Confidence.** High that it blocks contributions; the license choice is the owner's. **Acceptance.** `LICENSE` files exist; the dialog opens a prefilled issue; CONTRIBUTING describes the real path.

---

## Items considered and not listed

- **A full Exercise Format v1 design before the slice.** The capability model's own sequence says prototype first; the slice is that prototype.
- **Mastery algorithm.** Deliberately open; the activity labels are enough for release one.
- **Separate repositories for content or visualisations.** ADR 0001 is right for now.
- **Server-side rendering or offline mode.** No requirement asks for them; iPad Safari handles the client app.
- **Tailwind Preflight question (HANDOFF item 7).** Real but small; settle it with one visual regression screenshot in the slice rather than a recommendation.
