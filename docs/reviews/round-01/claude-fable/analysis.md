# MathKX concept and design review — analysis

**Reviewer:** Claude Fable 5.1 (model id `claude-fable-5-1`), running in Claude Code in the Claude desktop app. Reviewer slug: `claude-fable`.
**Date:** 2026-10-18.
**Status:** Independent review report. Everything here is analysis or **proposal**; nothing in this directory changes a requirement, schema, or accepted ADR.

Companion files: [recommendations.md](recommendations.md) (prioritized shortlist, IDs `CLAUDE-FABLE-R01-nnn`) and [proposed-build-brief.md](proposed-build-brief.md) (one coherent starting design).

---

## 1. Baseline and method

| Item | Value |
| --- | --- |
| Git HEAD | `b6c4548d890979c5327d729e13a27efee20814b8` ("Document independent model reviews and design convergence process") |
| Branch | `claude/project-analysis-recommendations-5d72c1`, fast-forwarded to `origin/main` at the same commit before the review started |
| Working tree | Clean at the start of the review. The only files added by the review are the three in this directory. |
| Uncommitted inputs | None. HEAD alone reproduces the inputs. |
| Baseline SHA supplied? | No. The current HEAD was used as the baseline without changing branches or resetting files. |

### What I inspected

Every tracked file in the repository, including the full exercise capability model, all seven ADRs, the one proposal, the new prototype's complete source (pages, components, store, i18n, lessons, catalog, theme config, build config) and `HANDOFF.md`. The older prototype (`Prototype/MathKX Learner Experience.dc.html`) was inspected only for comparison.

### What I ran

| Check | Command | Outcome |
| --- | --- | --- |
| Tooling install | `npm ci` (repo root) | 6 packages |
| Validator regression tests | `npm test` | 18 tests, 18 pass, 0 fail |
| Content validation | `npm run validate` | Pass: 8 content files, 7 skills, 1 exercise definition |
| Prototype install | `npm ci` in `Prototype/mathkx-designsystemet` | 212 packages, lockfile present |
| Prototype build | `npm run build` | Success, `dist/index.html` 791.6 kB (207.5 kB gzip), 1191 modules |
| Prototype in browser | `vite preview` served to the desktop app's built-in Chromium-based browser pane | Walked landing, library, topic, lesson (both), practice (both sets), check (one full run), profile creation (all four steps, with email), settings, sign-in, recovery, home (guest and signed in), about, both dialogs; no console messages |
| Viewports emulated | 820×1180 (iPad portrait), 1180×820 (iPad landscape), 390×844 (phone), light and dark colour schemes | Layout reflowed without horizontal scroll in all three |

### Limitations

- **Not an iPad test.** Desktop viewport emulation in a Chromium-based pane is not iPad Safari. The on-screen keyboard, rotation during an exercise, VoiceOver, and Safari-specific MathML rendering were not exercised. `docs/design/design-principles.md` requires actual-device checks before release; that requirement stands untested.
- **No assistive technology.** No screen reader or axe run was performed by me. `HANDOFF.md` reports an axe-core and Playwright pass; I did not reproduce it and do not restate it as my own.
- **No learner or educator.** Everything below about pedagogy is design judgement, not observed learning.
- **Independence caveat.** The same model (an earlier session of me) wrote the historical review `docs/reviews/2026-10-18-fable-project-review.md` and the Tier 1 hygiene pull request (MathKX/MathKX#1). The historical review's integration notes were also visible in the diff I used to establish the baseline. Section 7 keeps the reconciliation separate, and the independent findings in sections 2 to 6 were written from the current sources, but a reader should weigh this review knowing the anchoring risk.

---

## 2. The product in plain language

MathKX wants to be a place where someone who is stuck in mathematics can find the idea they are missing, see it explained visually, practise it with feedback that says what probably went wrong, and keep an honest record of what they have done, without handing over a name or email. The mathematics is organised around skills and their prerequisites rather than school years, so the same explanation of "number bonds to ten" serves a seven-year-old in Norway, a fourteen-year-old revising, and an adult who never got it. Everything learner-facing ships in Norwegian and English, works on an iPad, and can be corrected by a teacher through an ordinary pull request.

### Strongest ideas

1. **Help before failure.** The "Show visual help" action available before any wrong answer, with help use recorded but never penalised, is the most distinctive and most defensible pedagogical choice in the repository. The prototype implements it well: the same `ExerciseShell` serves addition and equations, and the help models are stepwise and keyboard-driven, never drag-based.
2. **Honest progress language.** "Lesson explored", "Practised with visual help", "Answered independently (0)" on a check summary. No percentages, no streaks. `src/activity.js` is 29 lines and says more about the product's values than any document.
3. **Misconception codes, not just wrong.** `src/domain/math.js` returns `{status, code, values}` and the UI resolves localized text. Entering `x = 10` for `x + 3 = 7` produces "It looks like you added 3. If x = 10, then x + 3 = 13, not 7." This is exactly the typed-validation direction the capability model asks for, already in running code.
4. **The documentation says what is decided and what is not.** The decision/recommendation/proposal/open-question discipline survives into the new documents.

### Largest risks

1. **Two unreconciled content models.** The validated registry under `content/skills/` uses `numbers.*` and `geometry.*`; the prototype catalog uses `arithmetic.*`, `algebra.solve-x-plus-a`, and lesson IDs that exist nowhere in `content/`. Neither lessons nor the prototype's exercise lists are validated by anything. Building on the prototype without choosing one identity scheme will bake the fork in.
2. **Required learner controls are missing from the only working artefact.** The learning-experience document requires "Another question / More like this / Make it easier / More challenge" in both languages. The prototype has none of them: finite sets of four or five fixed questions, then "Start again". The brief must design these, not inherit their absence.
3. **Profiles are a real requirement with no real design.** ADR 0006 requires saved progress across devices with email-free sign-in. The prototype's toy hash in `localStorage` is correctly labelled as simulation, but the production questions (credential storage, rate limiting, recovery without email, shared iPads, deletion) have no proposal yet. These are not weekend work and must not be improvised when the slice "just needs accounts".
4. **Scope gravity.** The vision now spans arithmetic to topology, the library shows 44 topics of which 42 are "Preview", and the capability model's recommended slice has four response families. The owner wants to start next weekend. The brief has to say no to most of this, explicitly.

---

## 3. Current state

Categories: **implemented tooling** (runs in CI), **prototype simulation** (works in the browser, not production), **documented requirement** (established intent), **proposal** (explicitly tentative), **missing decision** (nothing decided).

| Area | State | Evidence |
| --- | --- | --- |
| Skill registry and prerequisite graph | Implemented tooling | `content/skills/*.json` (7 skills), `schemas/skill.schema.json`, cycle and reference checks in `tools/validate-content.mjs`, 18 tests in `tools/validate-content.test.mjs`, `.github/workflows/validate-content.yml` |
| Exercise definition format | Proposal (exploratory 0.1) | `schemas/exercise.schema.json`, one example, `docs/architecture/exercise-format.md` says "not stable"; capability model §17 lists its limits |
| Deterministic generation | Documented requirement (ADR 0004) with a proposal for the primitives | `docs/architecture/decisions/0004-*.md`; `docs/architecture/proposals/seed-and-random-source.md` (SplitMix64, test vectors, not accepted) |
| Any generator or validator in .NET | Missing | No `src/` directory; `architecture.md` says "not yet created" |
| Exercise instances and validation | Prototype simulation | `Prototype/mathkx-designsystemet/src/domain/math.js` (`kinds.addition`, `kinds.linear`, `evaluateAnswer`, `FEEDBACK`); fixed question lists in `src/content/catalog.js` stand in for generated families |
| Visual help on request | Documented requirement + prototype simulation | `docs/design/exercise-experience.md#visual-help-on-request`; `ExerciseShell.jsx` help toggle with `aria-expanded`; `Counters.jsx`, `TenFrame.jsx`, `Balance.jsx` |
| Practice controls (another, more like this, easier, harder) | Documented requirement, **not in prototype** | `docs/design/learning-experience.md#more-practice-and-learner-control`; no such control in `Practice.jsx` or `ExerciseShell.jsx` |
| Checks of understanding with stated support policy | Documented requirement + prototype simulation | `learning-experience.md` purposes table; `Practice.jsx` `CheckPage` intro, deferred feedback, three-group summary |
| Lessons in Markdown | Proposal + prototype simulation | `learning-experience.md#recommended-lesson-authoring-approach` ("proposed implementation direction"); `src/components/Markdown.jsx` (hand-written parser), four lesson files under `Prototype/mathkx-designsystemet/src/content/lessons/`, not under `content/lessons/` |
| Profiles without personal details | Documented requirement (ADR 0006, accepted) + prototype simulation | `0006-support-profiles-without-personal-details.md`; `store.jsx` `toyHash`, `generateLearnerId`, `Profile.jsx` four-step flow, fixed code `246810` |
| Authentication mechanism, recovery codes, sessions, deletion | Missing decision | ADR 0006 consequences list them as future decisions; `HANDOFF.md` item 1 |
| Persistence and progress model | Missing decision | ADR 0006: "Durable progress storage ... implementation is undecided"; `HANDOFF.md` item 2 |
| Norwegian and English throughout | Documented requirement + prototype simulation | `vision.md#first-release-languages`; `src/i18n.js` (nb, en dictionaries), paired lesson files, `pick()` for content; no completeness check exists |
| Locale-aware number entry | Prototype simulation (partial) | `parseAnswer` accepts `8,0` and `8.0` regardless of locale; no thousands-separator handling |
| iPad as primary device | Documented requirement, untested on device | `design-principles.md#ipad-and-touch-use`; `HANDOFF.md`: "Not yet tested on a real iPad" |
| UI stack | Documented requirement (ADR 0007) + prototype simulation | Designsystemet 1.23 + Tailwind 4.3 in prototype; `src/styles.css` layer order differs from Designsystemet's README snippet (noted in HANDOFF) |
| Contributor suggestion flow | Prototype simulation | `Lesson.jsx` `ReportForm` builds issue text, sends nothing; no issue template in `.github/` |
| License | Missing decision | No `LICENSE`; `CONTRIBUTING.md` says maintainers must publish terms before incorporating outside contributions |
| Mastery model | Missing decision (deliberately) | `docs/learning/mastery.md`; prototype shows activity labels only |
| Review process | Proposal | `docs/reviews/review-process.md` ("Proposed review workflow") |

---

## 4. Walkthroughs

Each walkthrough gives the intended sequence, what I observed in the prototype where it exists, the important failure or ambiguity, and how the first implementation could demonstrate the behaviour.

### W1. `4 + 4`, visual help, continue without losing the answer

**Observed (prototype, 820×1180, Norwegian then English):** Opened practice set 1, pressed "Vis visuell hjelp" before typing. Two labelled groups of four counters appeared with "Hvor mange er det til sammen?" and a "Hjelp meg å telle" button. Typed `8`. Switched language to English with the answer in the field: the prompt, labels, and help re-rendered in English and the `8` stayed. Pressed Enter: "Correct. 4 + 4 = 8. You used visual help along the way, which is a good way to see how it fits together." A "Visual help used" tag appeared; "Next exercise" moved to `3 + 5` with an empty field and help closed.

**Failure or ambiguity found:** The screen-reader-only text between the groups is the literal string `pluss` in both languages (`Counters.jsx`, the `ds-sr-only` span in `GroupsHelp`). An English VoiceOver user hears "First group: 4, pluss, Second group: 4". Small, but it is exactly the class of defect a translation-completeness check should catch, and nothing would catch it today.

**Demonstration in the first implementation:** An automated test that renders the exercise in each language, opens help, enters an answer, switches language, and asserts the answer and help state survive; plus a string-parity check that fails on any learner-visible literal outside the dictionaries.

### W2. An older learner learns "tiervenner" without being patronised

**Observed:** The lesson "Tiervenner – tall som blir 10" / "Number bonds to ten" names the concept, says plainly that it "isn't a new kind of arithmetic", gives the six pairs in a table, offers a ten-frame explorer, a stepwise "make ten" worked example for `8 + 5`, and ends with "You don't always have to go via 10. If you see the answer another way, that is just as correct." Visual language is restrained (no cartoons, no praise inflation). Reading level and tone fit a teenager or adult.

**Failure or ambiguity:** The topic sits under "Addition within 20 · Often met: primary school". An adult arriving via the library sees "barneskolen" on the topic row. The label is honest, but for the stated audience it is the one place the design risks feeling patronising. Also, the lesson table is non-standard Markdown (no delimiter row); it renders only because the prototype's own parser is lenient.

**Demonstration:** Keep the "often met" stage label but phrase it as context, not level ("Usually first met in primary school; useful at any age"), and test the lesson with one adult who did not grow up with the term.

### W3. Prerequisite gap, practise it, return to the goal

**Observed:** The topic page lists "Helpful to know first" (prerequisites) with "Preview" tags where the prerequisite topic does not exist. The check summary links each missed question to a lesson section. There is no automatic detour; the older prototype simulated one (square roots inside a Pythagoras exercise) with mastery percentages that the current documents explicitly disown.

**Failure or ambiguity:** Nothing in the current prototype demonstrates "return to the original goal" because nothing leaves the goal. This is correct for the slice (adaptive routing is a learning-engine concern, not content), but the brief must say how a learner gets *back* once a prerequisite link has been followed: at minimum a persistent "Back to: One-step equations" affordance when a lesson was reached from another topic's prerequisite list.

**Demonstration:** A manual link from a topic's prerequisite list to the prerequisite topic, with a "return to" breadcrumb carried in the route, and the attempt record noting the originating goal skill. No inference, no routing algorithm.

### W4. "Make it easier" during practice and during a self-check

**Observed:** No such control exists in the prototype. `learning-experience.md` requires it with concrete labels and behaviour ("apply to the next question by default, preserve current work, state what changes, a check must start a different check or move into practice").

**Failure or ambiguity:** The requirement is well specified in prose and unimplemented in the only runnable artefact. The hardest part is semantic: "easier" for `a + b` within 20 has an obvious ladder (within 10 → crossing ten → within 20); for `x + a = b` it does not (smaller numbers is barely easier; the balance help is the real support). The brief should define "easier" and "harder" per family as named *variants* with declared parameter ranges, not as a global difficulty number.

**Demonstration:** The addition family exposes two or three variants; "Make it easier" switches variant for the next question and shows one sentence ("Next: addition within 10"); inside a check the same button opens a choice: "Finish this check as it is" or "Switch to practice with easier questions"; the recorded check result is unchanged.

### W5. Profile without email, return on another device; lost credentials

**Observed:** Created a profile in a second tab: a generated ID (`MKX-XXXX-XXXX`, 8 characters from a 31-symbol alphabet, about 39.6 bits), a password of at least 10 characters, a forced "I have saved my ID" confirmation with copy and download, an optional email verified by a fixed code, and a settings page that shows the verified email, lets me remove it, and signs out. The recovery page honestly describes three cases, including "no ID, password, or email: the profile cannot be recovered."

**Failure or ambiguity:** (a) Cross-device return is impossible in the prototype by design; the real requirement needs a server. (b) Without email there is no recovery path at all; ADR 0006 leaves "recovery codes" open. One-time recovery codes shown at setup would preserve the no-email requirement while giving a second key. (c) Signing in to an existing profile from a guest session silently replaces the guest's progress (`store.jsx`, `signIn` case) rather than offering to attach it; creating a new profile attaches it correctly. (d) There is no account deletion anywhere. (e) A brief flash of the "already signed in" view appeared between "Go to My page" and the home page (hash routing), cosmetic.

**Demonstration:** Not a slice item. For release: a server-side profile with a hashed password, verified optional email, optional recovery codes, a sign-in that merges or discards guest work explicitly, and deletion. See `CLAUDE-FABLE-R01-007`.

### W6. Switch Norwegian/English mid-exercise on an iPad, decimal comma, non-drag path

**Observed:** Language switched mid-exercise with state preserved (W1). Entered `4,0` for `x + 3 = 7`: accepted as 4 and marked correct. All help models are button-stepped; no drag anywhere. Addition uses `inputMode="numeric"`, equations `inputMode="text"`.

**Failure or ambiguity:** Parsing treats `,` and `.` identically regardless of locale, which is right for decimals within this slice but will mis-read `1,234` as soon as thousands appear. On iPadOS the numeric keypad does not offer a minus sign or a comma on all keyboard layouts (hypothesis from platform knowledge, not verified on device): fine for `4 + 4`, a blocker for negative numbers and decimals later. The learner-visible prompt label ("Finn x" / "Find x") and several accessible names are inline ternaries, not dictionary keys.

**Demonstration:** A locale-aware parser in domain code with explicit accepted forms per locale and a test table; a real-iPad check of entry and correction for `-3`, `2,5`, and `x = 4` before any family that needs them.

### W7. A contributor fixes a translation and submits a reviewable change

**Observed:** Every lesson has "Suggest an improvement" (builds a public-issue text with section, kind, and source path, and states that no profile data is attached) and "View or edit lesson source" (shows the Markdown and a proposed path `content/lessons/<domain>/<lesson>/<lang>.md`). Nothing is sent; the link goes to the repository root.

**Failure or ambiguity:** The lesson files actually live in `Prototype/mathkx-designsystemet/src/content/lessons/`, so the shown path does not exist. No lesson is validated: front matter fields, `skills:` references (which do not match `content/skills/`), `{{component}}` names and parameters, and nb/en pairing are all unchecked. A translator editing one file has no signal that the other language diverged.

**Demonstration:** Lessons move under `content/lessons/`, the validator checks front matter, skill references, component references, and language pairing, and "Suggest an improvement" opens a prefilled GitHub issue (template plus URL parameters) instead of a dead end.

### W8. A later university task needs reasoning or proof

**Observed:** Capability model §7 defines classes C/D (review-needed) and §17 says Format v1 must "preserve valuable ungraded mathematics". The prototype's validation result has statuses `correct`, `incorrect`, `input`; no `review-needed`.

**Failure or ambiguity:** The boundary is well drawn in the documents and invisible in code. The risk is not a missing grader; it is a type system that assumes every attempt resolves to correct/incorrect and later has to be retrofitted.

**Demonstration:** Reserve `review-needed` (and `partially-correct`) in the validation-result type and the attempt record from day one, with zero UI. A single test asserting that an attempt with status `review-needed` is stored and displayed as "awaiting review" rather than wrong is enough for the slice.

---

## 5. Observations by analysis area

### 5.1 Product value and focus

The initial learner is one specific fourteen-year-old. The current prototype content (addition within 20, one-step equations) is partly below and partly at their level. That is not a problem for a plumbing slice, but the brief should be honest that the *learner-value* test for that person comes with the equations family, not the addition family. Assumptions that need learner or educator validation: that help-before-failure is used rather than ignored; that the honest activity labels feel like progress rather than absence of reward; that the "often met: primary school" label does not deter adults.

### 5.2 Finding the right mathematics

Library and domain pages are clear and the "Show only topics that are ready" toggle is the right honesty device. Two gaps: the landing's "Start learning" leads to a library where 42 of 44 topics are previews, which can read as empty; and there is no "not sure where to start" path other than reading prerequisite lists. A single sentence with one suggested first topic, plus the prerequisite links already present, is enough for the first release. A placement test is not needed and would contradict the "no large onboarding" constraint.

### 5.3 Teaching and practice

The loop lesson → explore (ten-frame, balance) → practice with help → check with stated policy → summary with links back is complete and coherent in the prototype. What is missing: learner-controlled variation (W4), any generated variation (fixed lists), and a per-family statement of what "easier" means. Retries are unbounded and work is preserved; guessing is not discouraged beyond the misconception feedback, which is acceptable for practice and correctly absent from checks (feedback withheld until the summary).

### 5.4 Content and mathematical trust

The capability model's split between parse → artifact → validator → typed result is already visible in `math.js`. What the slice must add: seeded generation with golden-seed tests; a validator contract that is versioned alongside the definition; locale-aware parsing in domain code. What it must leave possible without building: symbolic equivalence, review-needed responses, multiple-skill evidence. The SplitMix64 proposal is a good fit for the first generator and should be adopted or rejected by that generator's tests rather than by discussion.

### 5.5 UX and visual help

Positive: calm visual language, 44-pixel-class targets in the prototype, consistent Designsystemet controls, dark mode from the theme, MathML for expressions. Specific issues: the sr-only `pluss` (W1); the "Next exercise" button doubles as "skip" before answering, with no record that a question was skipped in practice; the check's "Skip" is recorded as "worth revisiting" with the correct answer shown, which is right; the "Correct" alert animates in and briefly reads as faded in screenshots (reduced-motion handled). When visual models teach: the two-group counters for sums within 10, the make-ten frame for crossing ten, and the stepped balance each expose the structure of exactly one idea. Where they would add friction: a field of 17 counters for `9 + 8`, which `exercise-experience.md` already warns against, and any model that asks for precise finger placement.

### 5.6 Profiles and continuity

See W5. The decisions needed before production accounts: credential storage and hashing on the server, rate limiting and lockout policy for ID+password, whether to offer one-time recovery codes, session lifetime and sign-out behaviour on shared iPads, verified-email flow and token lifetimes, account deletion and retention, and a privacy notice. Browser storage and the toy hash are correctly excluded.

### 5.7 Accessibility and bilingual content

The prototype's accessibility choices are strong for a mockup: skip link, focus to heading on navigation only, polite live region for feedback, `aria-expanded` on help, labelled groups and individually described counters, non-drag everything, reduced-motion handling, colour never the sole signal. What requires human or device review: VoiceOver reading of MathML in Safari, the on-screen keyboard covering the answer field or feedback in landscape, focus behaviour when help opens in portrait and pushes the field off-screen, and whether "Help me count" is discoverable by a screen-reader user. Bilingual: the dictionaries are complete for the UI, lessons are paired, but there is no check, and a handful of literals bypass the dictionaries.

### 5.8 Open contribution

How a teacher corrects a lesson today: there is no path; the lesson is in the prototype's source tree. How a translator updates one language: edit one of two paired files with no parity check. How a developer adds an exercise family: add a `kind` in `math.js` and questions in `catalog.js`, with no schema. The documents describe the intended workflow accurately as "remain to be established". Licensing blocks accepting any of it; `CONTRIBUTING.md` says so plainly, which is the right interim stance.

### 5.9 Feasibility and architecture

The smallest set of contracts that connects the slice end to end:

1. **Skill** — exists (`skill.schema.json`).
2. **Lesson** — front matter `{id, lang, skills[], practice, check}` plus Markdown body with named component references (prototype shape).
3. **Exercise family definition** — `{id, version, skill, generator, parameters, variants}`; the 0.1 schema minus `answer`/`visualization`, plus variants.
4. **Instance** — `{familyId, version, seed, variant, presentation, privateValidationData}`.
5. **Response artifact** — typed scalar (`integer` or `x-value`) with original text.
6. **Validation result** — `{status: correct|incorrect|invalid-input|review-needed, code, values, validatorVersion}` (prototype shape plus two fields).
7. **Support event** — `{instance, kind: help-opened|step|counting, at}` (prototype's `helpUsed` list, made explicit).
8. **Attempt** — `{instance, mode: practice|check, artifact, result, support[], at}`.
9. **Progress** — per profile or guest: lessons explored, attempts, last location.

Overengineering to resist: a general content engine, a universal difficulty scale, a plug-in registry framework before there are two plug-ins, a mastery number. Gaps to close: no generator exists; no server exists although ADR 0006 makes one inevitable; the ADR 0007 Tailwind layer-order question is unresolved and cheap to settle with one visual regression test.

---

## 6. Requirement coverage

| Established requirement | Evidence | Gap | Recommendation IDs |
| --- | --- | --- | --- |
| Arithmetic through university scope; domains/topics/skills with curricula mapped on | `vision.md#mathematical-scope`, `mathematics-domains.md`, `skill-graph.md` | Two skill ID schemes (registry vs prototype); no lessons under `content/` | R01-001 |
| Learn / explore / practice / check have different purposes and evidence | `learning-experience.md` purposes table; prototype modes and `activity.js` | Attempt record lacks purpose, version, seed | R01-002 |
| Authored explanations and fixed tasks alongside generated families; maths in tested domain code | `learning-experience.md#authored-and-generated-content`; `math.js` | No generator, no .NET code, no tests of mathematics | R01-004 |
| Always more practice; easier/harder; finite families may repeat; policy changes explicit | `learning-experience.md#more-practice-and-learner-control` | Absent from prototype | R01-003 |
| Visual explanations central; help before a wrong answer; accommodations distinct from help | `exercise-experience.md#visual-help-on-request`; `ExerciseShell.jsx` | None in design; one untranslated sr-only literal | R01-006 |
| Profiles without real name or email; cross-device progress; optional recovery email | ADR 0006; `Profile.jsx` simulation | No production design; no deletion; guest merge on sign-in | R01-007, R01-008 |
| Norwegian and English throughout the first release | `vision.md#first-release-languages`; `i18n.js`; paired lessons | No completeness check; literals outside dictionaries | R01-006 |
| iPads primary; touch, keyboard, rotation, narrow windows, VoiceOver | `design-principles.md#ipad-and-touch-use`; prototype non-drag design | Untested on device; numeric keypad limits for later families | R01-009 |
| Calm, encouraging, credible for teenagers and adults | `design-principles.md`; prototype tone | "Often met: primary school" label may deter adults | R01-010 |
| Educators and translators improve content through review; Markdown lessons are a proposal | `learning-experience.md#open-contribution-workflow`; prototype dialogs | Lessons not in `content/`, no validation, no issue template, no license | R01-005, R01-012 |
| Stack: ASP.NET Core/C#, React/TypeScript, Designsystemet, Tailwind; prototype is a design artefact | ADR 0007; `architecture.md`; `HANDOFF.md` | Layer-order question open; no application yet | brief §6 |
| Auth, persistence, hosting, mastery, symbolic equivalence, AI undecided | `architecture.md` cross-cutting constraints | Decisions needed before accounts, not before the slice | R01-007, brief §8 |

No instruction in the review prompt contradicted the checked-out documentation. One soft tension: `AGENTS.md` says to avoid prematurely deciding persistence and authentication, while ADR 0006 makes durable storage a requirement. The documents resolve it correctly (requirement decided, mechanism open); it is noted here so no one reads the AGENTS rule as a reason to defer the profile design indefinitely.

---

## 7. Reconciliation with the historical review

The historical report is `docs/reviews/2026-10-18-fable-project-review.md` (baseline `bfaefe8`), including its integration notes. This section is kept separate from the independent findings above.

| Historical recommendation | Status now | Note |
| --- | --- | --- |
| R1 Choose licenses | **Remains useful, unaddressed** | No `LICENSE`; `CONTRIBUTING.md` now states the interim position clearly. Carried as R01-012. |
| R2 Hygiene files | Addressed | Merged in MathKX/MathKX#1. |
| R3 Validate content in CI | Addressed and extended | Identity checks and 18 regression tests added after the merge. |
| R4 Seed skill registry | Addressed, now **partially superseded** | The registry exists but the new prototype introduced a second ID scheme. R01-001. |
| R5 Seed and RNG decision | Downgraded to a proposal | Reasonable; adopt or reject with the first generator's tests. R01-004. |
| R6 Document and tidy the old prototype | **Remains useful** | The old prototype is still unlabelled next to the new one. R01-011. |
| R7 Documentation drift | Addressed | |
| R8 .NET domain library first | Still useful, **adjusted** | New requirements mean the slice must also prove lesson, bilingual, and touch behaviour; domain-first ordering within the slice still holds. Brief §7. |
| R9 Pythagoras story as first content | **Superseded** | The integration notes mark it illustrative; the owner's walkthroughs and prototype centre on addition and one-step equations. |
| R10 Four response families in the first slice | Still the capability model's recommendation | My brief narrows to one family for a weekend and names the deviation. |
| R11 Decide where generation runs | Still open, **reframed** | ADR 0006 makes a server necessary for release; the remaining question is whether the browser also runs generation for preview. Brief §8. |
| R12 Two locales from the first screen | Now a requirement | Addressed in documents and prototype; checking is not. R01-006. |
| R13 Time-box Format v1 | Still useful | Not repeated as a recommendation; the brief sequences it after the slice. |
| R14 Roadmap document | Still missing | The review process partly fills the role. Not carried; the build brief is the roadmap for now. |
| R15 Assistive-technology testing plan | Now a documented requirement | `design-principles.md`. Not yet performed. R01-009. |
| "Do not add auth or persistence beyond local storage" | **Superseded** | ADR 0006; the integration notes already say so. |
| "Do not pick a mastery algorithm" | Consistent | The new prototype's activity labels follow it. |
| Prototype mastery percentages (section 6) | Resolved | The new prototype shows no percentages. |

Net: five historical items remain useful (license, old-prototype tidy, domain-first ordering, where generation runs, AT testing), two are superseded by owner decisions since, and the rest are addressed.
