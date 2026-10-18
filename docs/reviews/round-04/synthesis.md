# Round-04 verification synthesis

**Status: recommendations for owner consideration; no approvals or decisions recorded.** Prepared by `codex`, 2026-10-18, using [review process §§2 and 5](../review-process.md) and the [round-04 verification prompt](verification-prompt.md). This document preserves the reports and proposes dispositions; it does not amend requirements, code, ADRs, or the decision log.

## Baseline, sources, and method

The synthesis baseline is **`4d4bddbe5a00ec8c1465fa3a36ccb1f1c748fd3f` on main**. All three reports verified **`60031f76ee80a0b1783e4d49b2cb3c0d48b8686e`**. `git diff --name-status 60031f7 4d4bddb` contains only additions under the three reviewer directories in `docs/reviews/round-04/`: reports and supporting evidence. No requirement, planning, content, schema, prototype, or test changes intervene. Their findings therefore concern the same source baseline. All three used the prompt's fallback because their supplied SHA remained a placeholder; the owner's explicit synthesis baseline now removes that ambiguity.

Reviewer identifiers and their original correction identifiers are retained:

- **`claude-fable`**: [verification](claude-fable/verification.md), checklist items 1–10 and numbered corrections 1–10. References below such as “`claude-fable` correction 7” refer to that numbered list, not a newly assigned ID.
- **`codex`**: [verification](codex/verification.md), checklist items 1–10 and corrections **C1–C9**.
- **`gemini-argon`**: [verification](gemini-argon/verification.md), its checklist headings and numbered corrections 1–5. Its numbering is mapped below rather than silently relabelled.

Source shorthand used below:

- **A**: [revised-build-brief-corrections.md](../round-01/claude-fable/revised-build-brief-corrections.md), especially §§D–H.
- **B**: [revised-build-brief.md](../round-01/claude-fable/revised-build-brief.md), read with A's explicit supersession, especially retained §§1, 7–11.
- **DL**: [decision-log.md](../round-01/decision-log.md).
- **P**: [Prototype/mathkx-designsystemet](../../../Prototype/mathkx-designsystemet/); paths beginning `P src/` or `P tests/` are relative to that directory.
- **Mastery**: [mastery.md](../../learning/mastery.md), “Progress tracking before a mastery algorithm”.
- **Exercise**: [exercise-experience.md](../../design/exercise-experience.md), particularly “Explaining why the result follows”.
- **Learning**: [learning-experience.md](../../design/learning-experience.md), “More practice and learner control”.

This synthesis checked repository statements against the files and inspected saved logs, probe scripts, and accessibility snapshots. It reran root `npm test` (18/18), `npm run validate` (8 files, 7 skills, 1 definition), prototype `npm test` (16/16), and `npm run build` (1205 modules; 935.77 kB, gzip 244.31 kB): all passed. It reran `codex/source-probes.mjs`: 610 dictionary keys per language without key/placeholder/empty-value mismatches, matching lesson anchors/math/visual-and-practice directives, all 15 raw RNG outputs, 32 bounded outputs, and four injected boundary rows passed; all three wrong→help→correct probes reproduced `correctAfterFeedback`. Separate calls to the actual `parseNumber` confirmed the parser corrections listed below. These commands used the existing dependencies in `D:/repos/MathKX`; a diff against the synthesis baseline excluding round-04 reports was empty. The synthesis file and branch use an isolated worktree at the requested baseline so the shared reviewer checkout is preserved.

Browser rerun status is recorded in checklist 5. Earlier reviewer commands remain attributed to their authors; neither their execution history nor their human/device work is claimed as this synthesis's own. No fresh dependency install, C# execution, physical-device, screen-reader, learner, educator, or translator session was performed for this synthesis.

Useful work to retain is the accepted architecture and privacy boundaries, the deterministic identity proposal and fixtures, the bounded validator and prototype suites, both lesson pairs and dictionaries, explicit help/reveal and check transitions, and the separation of release requirements from proposed additions. None establishes mastery, production authentication, or device support.

## Mapping answers to the fixed prompt

| Report location | Prompt item actually addressed | Treatment in this synthesis |
| --- | --- | --- |
| `gemini-argon` checklist 4, “Prototype domain logic and tests” | Parts of checklist 5 and 7; some evidence relevant to 4 | Its Yes is not a complete answer to the prompt's flow-by-flow/reference-versus-simulation question. |
| `gemini-argon` checklist 5, “Prototype user journeys and edge cases” | Checklist 4 | Map the flow evidence to 4; use its commands section for prompt checklist 5. |
| `gemini-argon` checklist 7, “Determinism and mathematical correctness” | Part of checklist 7, plus additional mathematics claims | It does not directly answer the planned versioned-definition identity/fixed-task/ladder contract. |
| `gemini-argon` checklist 8 | Part of checklist 8 | Parity is addressed; strings outside dictionaries and the specified CI check are omitted. |
| `gemini-argon` checklist 10, “Open-source and privacy posture” | Part of checklist 4's simulated profile flow, not checklist 10's release-plan gate audit | No direct answer to prompt checklist 10; do not count its Yes as a gate audit. |
| `gemini-argon` F1, “Content schemas and validator v0.2” | F1 pilot content contract and validator | Same broad feature; `v0.2` is not the proposed version. A §F says `0.1-pilot`, preserving exploratory `0.1`. |
| `gemini-argon` F2 and F3 (“Number input parser and answer evaluator”) | Both address parts of prompt F2, .NET domain | Its F3 verdict is not a verdict on prompt F3, Thin API. No direct Gemini Thin API verdict exists. |
| `gemini-argon` F5, practice session loop | Prompt F7 | Preserve its original F5 identifier when citing its verdict. |
| `gemini-argon` F7, lesson page/Markdown | Prompt F5 | Preserve its original F7 identifier when citing its verdict. |
| `gemini-argon` F9, profile design document | Preparation for prompt F9, profiles/recovery/PostgreSQL | Readiness to write a design proposal is distinct from readiness to specify the feature. |

Checklist dispositions use **accept, adapt, defer, reject, needs evidence** as recommendations under review-process §2. Feature verdicts use the owner's requested **specify now, specify with corrections, not yet**. “Not yet” means a current specification input or owner policy is missing, not that implementation must already exist. Missing schemas, API DTOs, or generator tests can be specification deliverables. Reviewer agreement is not the basis for a verdict; repository evidence and unresolved decisions are.

## Checklist synthesis

### 1. Consistency of the record

| Source | Answer / finding |
| --- | --- |
| `claude-fable` | **No**: Mastery's database sentence and root `AGENTS.md` persistence/hosting wording are stale; ADR 0006 is historical context superseded by ADR 0008. Corrections 1–2. |
| `codex` | **No**: Mastery's sentence and ADR 0006's storage-technology consequence need qualification. C1. |
| `gemini-argon` | **No**: Mastery's sentence conflicts with ADR 0008 and architecture. Correction 1. |
| Evidence, agreement, contradiction | The sentences exist. [ADR 0008](../../architecture/decisions/0008-store-profiles-and-progress-in-postgresql.md) decides PostgreSQL; [ADR 0009](../../architecture/decisions/0009-host-on-azure-app-service.md) decides hosting/region. A §G already supersedes B's stale release-table entries. The reports differ only on whether ADR 0006's historical consequence itself needs editing. |
| Recommended disposition | **Adapt**: retain the shared Mastery correction (DL-025); qualify [AGENTS.md](../../../AGENTS.md)'s broad unresolved list to distinguish chosen technology from still-open schemas, retention, authentication, and operations. Treat ADR 0006 with ADR 0008, not as an undecided storage choice; an explanatory cross-reference is sufficient if later authorized. Do not reopen accepted technology choices. |

### 2. Decisions resolved or deferred

| Source | Answer / finding |
| --- | --- |
| `claude-fable` | **No**: DL-004–008, 024–028 pending; says DL-009–023 are implementation guidance. Correction 3. |
| `codex` | **No**: also identifies DL-022 and distinguishes DL-019/020 completion status from decision status; explicit owners/triggers are incomplete. C2. |
| `gemini-argon` | **No**: identifies DL-004–008, 022, 024–028, with feature dependencies; calls them “Ten items”. Correction 2. |
| Evidence, agreement, contradiction | DL-001–003 are owner decisions. **Eleven** rows are pending: DL-004, 005, 006, 007, 008, 022, 024, 025, 026, 027, 028. DL-019 is implemented, DL-020 partly implemented/CI pending; neither is literally labelled implementation guidance. Deferral/adoption triggers exist for licenses, profile design, and C# fixtures, but do not supply a complete assigned-owner/trigger record. |
| Recommended disposition | **Defer** policy-dependent feature gates until owner dispositions are recorded. DL-004/006 block pilot IDs/topic and affected F1/F2/F7 integration; DL-005 blocks proposed F2/F3; DL-026(2–4) blocks F5/F6/F7 policy and reused F8 behavior; DL-028 blocks F8. DL-007/022/027 constrain F9's design. DL-008 is a contribution gate, DL-024 a later adoption gate, and DL-025 an already-authorized reconciliation, not three extra internal-specification blockers. Clarify DL-019/020 categories without converting completion into approval. |

### 3. Planning reference

| Source | Answer / finding |
| --- | --- |
| `claude-fable` | **Yes, with three wording reconciliations**: fixed-task seed wording, `feedback-shown`, and `practice[]` references. Corrections 4, 6, 7. This qualified Yes is outside the prompt's simple answer set. |
| `codex` | **No**: minimum observations occur after the first-deliverable marker; retained adult validation asks for deferred missing-part tasks; mixed reserved-status “Highest status” undefined. C3–C5. |
| `gemini-argon` | **No**: crossing-ten appears before and after the first-deliverable marker; feedback/help precedence differs from code. Corrections 3–4. |
| Evidence, agreement, contradiction | A §D says first deliverable = one lesson, within-ten practice, and browser observations; backlog row 2 also includes crossing-ten, row 7 adds it again, and row 8 contains observations. B §10 still asks the adult to try missing-part questions. A §E requires “no teaching support” for `correctAfterFeedback`, unlike `summarizeDelivery`; “Highest status” is not ordered. A explicitly replaces B §4, so fixed tasks without a seed are already the planning rule; capability model §6 permits, but does not require, accepting an ignored seed. |
| Recommended disposition | **Adapt**, synthesized answer **No**. Move crossing-ten out of row 2's first-deliverable work; separate minimum recording before the marker from later derived summaries; move the missing-part portion of the adult check to milestone two; define reserved-status derivation. Keep A's identity rule and cut order 9→7→6. **Reject** `claude-fable` correction 7 as unnecessary reversal of explicit supersession. Resolve feedback/help precedence through the owner question below, not by silently selecting a report. |

### 4. Prototype as reference

| Source | Answer / finding |
| --- | --- |
| `claude-fable` | **Yes for behaviour; marking is partial**; extensive bilingual walkthrough and screenshots, with pending-email setup attributed to the suite. |
| `codex` | **No**: wrong→help→correct conflicts with A §E (C6); grouped-counter accessible names expose the total before the marked reveal (C7). Otherwise the named flows have bounded suite/probe evidence. |
| `gemini-argon` | **Yes** in its renamed checklist 4 and 5; use checklist 5's journey evidence here. It does not enumerate the entire prompt checklist or audit reference/simulation marking. |
| Evidence, agreement, contradiction | Suite scenarios cover help, explanation before/after correct/incorrect, counting, Another/easier/harder/More like this, finish with draft, check switch/summary, Home/progress, detour/return, and profile/guest flows in both languages. `codex/browser-probes.log` covers supplemental pending email and keyboard/resize. `P src/domain/observations.js:summarizeDelivery` and the rerun source probes confirm feedback-first; `P src/components/math/Visuals.jsx:GroupsVisual` plus [English](codex/en-pre-reveal-accessibility.txt) and [Bokmål](codex/nb-pre-reveal-accessibility.txt) snapshots confirm “Counter 1 of 8” before the reveal. Thus blanket “matches” claims fail despite passing suites. `P HANDOFF.md`, `docs/iteration-2/ASSUMPTIONS.md`, and the UI banner label simulation; DL-026/028 remain policy inputs, not production decisions. |
| Recommended disposition | **Adapt**, synthesized answer **No**. Retain the bounded flow reference with explicit exceptions: resolve C6 through the owner question, and accept C7's targeted pre-reveal-label correction and rendered-state regression check. Preserve the simulation boundaries for finite pools, browser observations, profiles/email/recovery, and device checks. No broad rewrite is indicated. |

### 5. Tests and checks

| Source | Answer / finding |
| --- | --- |
| `claude-fable` | **Yes**: root 18/18, validation 8/7/1, prototype 16/16, build, browser 80/80; saved command logs. |
| `codex` | **Yes**: same totals; installation retries and earlier probe failures are separately documented, not hidden. |
| `gemini-argon` | No direct answer under prompt heading 5; its commands section reports the same totals and a browser-install retry. Its own checklist 5 is a journey audit. |
| Evidence, agreement, contradiction | Root/prototype checks and build were reproduced for this synthesis. Browser evidence describes 20 scenarios × four Chromium configurations: nb 820×1180 light, en 390×844 dark, en 1180×820 light, nb 390×844 dark. The synthesis's first browser launch failed because the sandbox could not see the installed headless shell; the retry outside the sandbox **passed all 80 checks, zero failures**, using the installed Chromium. Gemini's build module count differs from both saved logs and the reproduced build (see limitations). |
| Recommended disposition | **Accept** the bounded passing results. Root CI ([workflow](../../../.github/workflows/validate-content.yml)) runs installation, validation, and root tests only. No pilot lesson/ladder/translation validation, C# generator conformance, real database/authentication, complete reserved-result rendering, or real iPad/AT coverage follows. Browser assertions miss both checklist-4 issues; the domain test encodes feedback-first. Passing those tests does not resolve the specification gates. |

### 6. Content contract readiness

| Source | Answer / finding |
| --- | --- |
| `claude-fable` | **No**: schemas, practice references, canonical skills, directives/notation/front matter, GFM tables, ladder, and real content placement unresolved. Corrections 4, 8. |
| `codex` | **No**: C8 enumerates envelope/defaults/versioning, relation types, translations/assets/anchors, directive grammar, fixed/generated definitions, validator linkage, representation ranges, and ladder/search rules. |
| `gemini-argon` | **No**: exact schema fields, practice-reference mismatch, `:::example`, prototype `check`, GFM delimiters, and generator parameters unspecified. Correction 5. |
| Evidence, agreement, contradiction | A §F explicitly says responsibilities, not final field names; [lesson proposal](../../architecture/proposals/lesson-markdown-and-delivery.md) calls its syntax illustrative. Only exploratory skill/exercise schemas exist. Prototype `lesson.json` uses `practice: [{skill, variant}]` and a proposed nonexistent schema; A uses definition references. Prototype skill IDs do not resolve to the seed content graph. `Markdown.jsx` and `notation.js` demonstrate behavior without settling the contributor contract. See the consolidated unresolved-field inventory below. |
| Recommended disposition | **Adapt**: make the narrow pilot contract explicit as F1 work after DL-004/006; preserve exploratory `0.1`. Define or explicitly exclude prototype-only `check`, rather than automatically adding self-check scope. Move normative rules into contributor documentation/examples; require a second bilingual lesson/definition to validate without JSX edits. Schemas themselves need not pre-exist their specification. |

### 7. Identity and reproducibility

| Source | Answer / finding |
| --- | --- |
| `claude-fable` | **Yes for the rule and starting C#**, not for a finished addition generator. Correction 5 requests draw order, rejection policy, golden seeds. |
| `codex` | **Yes** for the planned identity and starting implementation; all tabulated raw/bounded/injected cases reproduced in a separate JS probe. DL-024's C# trigger remains unmet. |
| `gemini-argon` | **Yes** to its different “Determinism and mathematical correctness” question; claims RNG code and golden tests in the prototype that are absent. No direct audit of the full prompt identity rule. |
| Evidence, agreement, contradiction | A §D's configuration-as-versioned-definition, generated `(definition ID, version, seed)`, fixed `(definition ID, version)`, per-skill ladder, and selection history outside generation fit [ADR 0004](../../architecture/decisions/0004-deterministic-exercise-generation.md) and Learning. [Random-source proposal](../../architecture/proposals/seed-and-random-source.md) gives stream/bounded-draw fixtures and additional parsing/rejection cases. This synthesis reproduced its tabulated outputs using the separate probe; `practice.js` only selects finite authored pools. |
| Recommended disposition | **Accept** readiness to begin the RNG fixture experiment, without adopting ADR 0010 or declaring F2 ready. **Adapt** generator-contract follow-up: specify draw order, bounded termination/rejection, valid bounds, golden seeds, representation agreement, and replay across versions before shipping a generator. Keep fixed tasks seed-free under A; do not use invented prototype RNG evidence. |

### 8. Bilingual completeness

| Source | Answer / finding |
| --- | --- |
| `claude-fable` | **Yes for dictionaries/lesson structure**; CI specified but absent; lists literals and localized content outside dictionaries. Correction 9. |
| `codex` | **Cannot verify** full linguistic completeness; structural checks pass; C9 requests already-planned enforcement with deliberate exceptions. |
| `gemini-argon` | **Yes** for dictionary/lesson parity and browser checks; does not answer CI or outside-dictionary strings. |
| Evidence, agreement, contradiction | Rerun probe confirms 610 keys per language and matching anchors/math/visual-and-practice directives; example titles are localized, so byte-identical directive text is not a requirement (DL-017). Outside `DICT`: lesson Markdown, `math.js` feedback/spoken notation, `explanations.js` steps, `practice.js` and `catalog.js` titles; language/brand labels in `App.jsx`, report/language text in `Lesson.jsx`, reminder text including `(prototype)` in `Profile.jsx`, `404` and notation literals in page components. A §F/B §7/DL-020 specify CI checks; the workflow does not run them. |
| Recommended disposition | **Adapt**: structural completeness confirmed, linguistic quality **needs evidence** from a translator. Specify/implement parity, lesson pairing, placeholder and visible/accessibility-literal enforcement with explicit handling of localized content, proper names, notation, and language self-names. Do not turn all authored lesson prose into dictionary keys. |

### 9. Accessibility and device status

| Source | Answer / finding |
| --- | --- |
| `claude-fable` | Area-by-area answer rather than one Yes/No: axe and selected heights/layout verified; keyboard inferred; reduced motion not reproduced; no real screen reader/iPad. |
| `codex` | **Cannot verify** full support: bounded Tab/Enter help operation and reduced-motion `.mkx-fade` probe reported; accessible-name leak found; no complete keyboard/device/AT journey. |
| `gemini-argon` | **Cannot verify** physical iPad/AT; **Yes** for automated/source checks, with wider touch-target wording than the suite supports. |
| Evidence, agreement, contradiction | Saved suite logs show axe on 13 routes × four configurations. `P tests/browser/review-checks.mjs:C12` checks selected element **heights**, not minimum widths, spacing, or physical usability. `codex/browser-probes.log` records partial keyboard and emulated reduced-motion checks. No completed human/device record is in the baseline; schedules outside the repository cannot be inferred. |
| Recommended disposition | **Needs evidence** for actual iPad Safari, real keyboard/rotation/touch/zoom, full keyboard navigation, VoiceOver/other screen-reader speech, and human usability. Carry these as release validation, not reasons to forbid all specification writing. Accept only the bounded automated coverage and fix C7; axe success does not establish reveal parity or mathematical accessibility. |

### 10. Release gates visible

| Source | Answer / finding |
| --- | --- |
| `claude-fable` | **Yes**: B §9.1 versus §9.2, updated by A §G and ADR 0008/0009. |
| `codex` | **Yes**: same record, including B §10's actual-device/assistive-technology validation. |
| `gemini-argon` | Its **Yes** answers “Open-source and privacy posture”; no direct release-gate answer. Simulated no-email setup and issue-preview privacy do not establish the requested release plan. |
| Evidence, agreement, contradiction | B §9.1 retains no-personal-details profiles, optional verified recovery email, cross-device progress, both languages, and physical iPad/VoiceOver checks. A §G adds PostgreSQL/hosting to established gates. B §9.2/DL-007 keep proposed additions separate. No direct disagreement once Gemini's changed question is identified. |
| Recommended disposition | **Accept** gate visibility, not completion. Retain account-design, human/device, and translation validation as release obligations; do not promote recovery codes, export, device sessions, or other DL-007 additions into requirements. |

### Consolidated unresolved authoring contract (checklist 6 / F1)

This deduplicates the three inventories without selecting new fields. The following must be defined, or expressly excluded, in A §F, the lesson proposal, and the resulting contributor guide/schema:

1. **Envelope and revision:** exact `0.1-pilot` version field/placement; `$schema` location/requiredness for each new file (the existing requirement in `content/README.md` still applies); `id`, `version`, `status` types/enums; required versus optional/default fields; unknown fields; revision compatibility. Content placement is already proposed as `content/lessons/<id>/`; implementation and a usable template are missing, not the basic layout idea.
2. **Lesson relationships:** `skills`, `prerequisites`, `related` (skills versus lessons), canonical IDs, definition/version resolution, `practice` and `:::practice` definition reference versus prototype skill/variant, optional `check` inclusion or exclusion, `visuals` registry and configuration.
3. **Localization and links:** `translations` shape/path constraints/revision pairing, front-matter `title`/`objective` requiredness and ownership versus shared metadata, assets and accessible descriptions, link resolution, explicit/generated anchors and their uniqueness/normalization, cross-language referenced-anchor validation.
4. **Markdown/directives/notation:** supported dialect and GFM delimiter rows; exact `:::visual`, `:::example`, `:::practice` attributes, types/defaults/ranges, quoting/escaping, closing/body/nesting rules, unsupported names/attributes and diagnostics; example IDs/titles; the supported mathematical grammar and errors. Prototype comments and `supports()` are evidence, not the final authoring contract.
5. **Exercise definition:** generated/fixed conditional fields and fixed payload, generator name/version registry, parameter keys and constraints, validator identity/version, response/presentation/feedback/support references, misconception-code registry, exact `supportedRepresentations` range shape and coverage validation. Gemini's suggested `aMin`/`aMax` etc. are candidate names, not existing fields.
6. **Ladder/runtime boundary:** entry shape, versioned definition references, localized sentence shape, duplicate/order/same-skill validation and end behavior. A already bounds the recent window to at most eight deliveries; the finite search bound/algorithm and exhaustion acceptance test still need a contract. Keep selection outside generation; do not embed an algorithm in JSON.

## Candidate-feature synthesis (prompt F1–F9)

These are recommendations at this baseline, not conditional declarations of approval. Requirements and acceptance inputs below remain inputs to the eventual specification. The full pilot is **not yet** ready as a package; the reusable F4 practice shell has a bounded specification path with corrections. Preparing F9's design proposal and experimenting with RNG fixtures are useful work distinct from approving their feature specifications.

### F1 — Pilot content contract and validator

| Source / dimension | Verdict / synthesis |
| --- | --- |
| `claude-fable` F1 | **Not ready**: DL-004 and undefined contract. |
| `codex` F1 | **Not ready**: DL-004/006; C8 supplies the contract work. |
| `gemini-argon` F1 | **Ready with corrections**, renamed “Content schemas and validator v0.2”; requires DL-004/006 and concrete fields. Map to prompt F1; retain `0.1-pilot`. |
| Agreed corrections and inputs | A §F, `content/AGENTS.md`, lesson proposal, prototype metadata/Markdown; settle IDs/topic, definition references, fields/directives/notation/ladder, then schemas and validated examples. Acceptance: references, bounds, anchors, languages, diagnostics, and second-contributor authoring without guessing. `claude-fable` corrections 3/4/8/9; `codex` C2/C8/C9; `gemini-argon` corrections 2/5. |
| Contradictions | Gemini calls pending owner decisions corrections while Claude/Codex treat them as gates. Schema absence is not itself a reason to demand implementation before specification. |
| Recommended verdict | **not yet** for the concrete pilot until DL-004/006 are recorded. The contract inventory is bounded F1 specification work, not a request to design all Format v1. |

### F2 — .NET domain

| Source / dimension | Verdict / synthesis |
| --- | --- |
| `claude-fable` F2 | **Not ready**: DL-005; generator draw/rejection/golden cases unspecified. |
| `codex` F2 | **Not ready**: DL-004/005/006; mixed outcomes and reference mismatch. |
| `gemini-argon` F2 and original F3 | Both **Ready with corrections**; original F3's parser/evaluator belongs within prompt F2. Its claimed prototype RNG implementation is not evidence. |
| Agreed corrections and inputs | ADR 0003/0004, capability model §§6–9, seed proposal, A §§D–E; finite JS validator/explanations as reference, no production generator. Settle scope/runtime/IDs, crossing-ten timing, draw/termination/version contracts, misconception-code mapping and result/observation types. Acceptance: C# raw/bounded/rejection/parsing fixtures, golden/property/agreement/boundary/replay tests. `claude-fable` corrections 3/5/6; `codex` C2/C3/C5/C6; `gemini-argon` corrections 2/3/4. |
| Contradictions | “Ready with corrections” still depends on unmade runtime/topic decisions; matching JS vectors does not satisfy DL-024's C# adoption condition. Reserved-status derivation remains missing, and feedback/help precedence is the owner question below. |
| Recommended verdict | **not yet** for full F2. The RNG fixture experiment can begin under the proposal without accepting ADR 0010 or freezing the generator contract. |

### F3 — Thin API

| Source / dimension | Verdict / synthesis |
| --- | --- |
| `claude-fable` F3 | **Not ready**: DL-005; request/error/version/locale details incomplete. |
| `codex` F3 | **Not ready**: DL-005 and F2 contracts; explicitly no prototype API. |
| `gemini-argon` | **No verdict on prompt F3.** Original F3 “Number input parser and answer evaluator” is mapped to F2, not counted as API readiness. Checklist 2 still identifies DL-005 as blocking F3. |
| Agreed corrections and inputs | Architecture, ADR 0009, A §D; B's superseded task list supplies historical endpoint sketches, not a current finished contract. Private data must remain server-side. After DL-005/F2 settle, specify request/response/result/error and version/locale behavior with contract tests. `claude-fable` correction 3; `codex` C2; `gemini-argon` checklist 2/correction 2. |
| Contradictions | No actual API-design disagreement is recorded; Gemini answered a different feature. Lack of existing DTOs/tests is normal specification work, whereas unresolved runtime/identity inputs are blockers. |
| Recommended verdict | **not yet** until DL-005 and the required F2 identity/result boundary are settled. Hosting is already decided and must not be reopened. |

### F4 — Web practice flow

| Source / dimension | Verdict / synthesis |
| --- | --- |
| `claude-fable` F4 | **Ready with corrections**: record counting-reveal rule, feedback event meaning, literal treatment; human access checks owed. |
| `codex` F4 | **Ready with corrections** for the narrow reusable shell, excluding pending lesson/session/check policies; C6/C7/C9. |
| `gemini-argon` F4 | **Ready with corrections**, renamed workspace/explanation player; requires DL-006/026 and assumes disclosure boundaries verified. |
| Agreed corrections and inputs | Exercise, ADR 0007, A §§D–E; `ExerciseShell`, `Visuals`, `Counters`, `TenFrame`, dictionaries. Preserve help before answering, explicit reveal, feedback by code, Another question, work across resize/language; exhaustive status rendering and bilingual checks. Counting completion follows Exercise already. `claude-fable` corrections 3/6/9; `codex` C6/C7/C9; `gemini-argon` correction 2. |
| Contradictions | The prototype is not wholly conformant: C7 is source-confirmed and C6 is an unresolved policy mismatch. DL-006 blocks choosing the integrated pilot visual, not the reusable shell requirements. DL-026(2–4) belong to the wider lesson/session features. |
| Recommended verdict | **specify with corrections**, limited to the reusable prompt F4 flow. Specify C7 regression coverage and truthful supplied outcome rendering; cross-reference the unresolved precedence question rather than deciding it in the shell. Pilot-specific binding and outcome derivation depend on F1/F2/F6 and owner decisions. This does not clear those features or the integrated pilot. |

### F5 — Lesson rendering

| Source / dimension | Verdict / synthesis |
| --- | --- |
| `claude-fable` F5 | **Ready with corrections**: DL-026(2), directive/notation contract, definition references, GFM tables. |
| `codex` F5 | **Not ready**: contract choices and DL-026 instance-specific disclosure. |
| `gemini-argon` original F7 | **Ready with corrections**; map lesson/Markdown feature to prompt F5. Its original F5 is prompt F7. |
| Agreed corrections and inputs | Lesson proposal, A §F, Exercise; `Markdown.jsx`, lesson pairs, `Lesson.jsx`. Acceptance: standard Markdown/directives, supported notation, bilingual anchors/references, preserved detour/return state and honest disclosure. `claude-fable` corrections 3/4/8; `codex` C2/C8; `gemini-argon` corrections 2/5. |
| Contradictions | Ready labels assume pending DL-026(2) can be settled as cleanup. Gemini asks to include `check`; the pilot can instead expressly exclude it because checks are deferred. Do not adopt every prototype metadata field by copying it. |
| Recommended verdict | **not yet** for full F5 until disclosure policy and F1's author-facing directive/reference boundary are settled. Generic Markdown rendering is preparatory work, not a verdict for the entire detour feature. |

### F6 — Observations and progress

| Source / dimension | Verdict / synthesis |
| --- | --- |
| `claude-fable` F6 | **Ready with corrections**: DL-026(4), `feedback-shown`, DL-004 skill IDs. |
| `codex` F6 | **Not ready**: disclosure/resume policy, mixed reserved-status derivation, help/feedback mismatch (C5/C6). |
| `gemini-argon` F6 | **Ready with corrections**: confirm DL-026 and adopt the prototype's feedback-first ordering in A. |
| Agreed corrections and inputs | Mastery, A §E; `observations.js`, `Home.jsx`, store. Preserve per-delivery identity, ordered mathematical submissions versus input guidance, support timing, guest provenance, idempotency and counts. Clarify `feedback-shown` and “Highest status”; retain support tags after classification. `claude-fable` corrections 3/6; `codex` C2/C5/C6; `gemini-argon` corrections 2/4. |
| Contradictions | **Substantive owner disagreement:** Gemini would change the document to feedback-first; Codex would change code to help-first. Claude identifies event ambiguity without choosing this precedence. The current addendum already excludes teaching support from feedback-only; the code/test do not. |
| Recommended verdict | **not yet** until the owner question and DL-026's disclosure/resume policy are settled, plus explicit reserved-status derivation. These are labeling semantics, not a mastery algorithm. |

### F7 — Challenge ladder, repeat handling, and session controls

| Source / dimension | Verdict / synthesis |
| --- | --- |
| `claude-fable` F7 | **Ready with corrections**: DL-026(3–4), ladder schema, repeat window. |
| `codex` F7 | **Not ready**: DL-004/006/026, serialized ladder and bounded search. |
| `gemini-argon` original F5 | **Ready with corrections**; map practice loop/variation controls to prompt F7, with DL-004/006/026 and cut-order cleanup. |
| Agreed corrections and inputs | Learning, A §D; `practice.js`, store, `Practice.jsx`. Preserve current work, apply adjacent-definition changes to next question, visible pending replacement, honest endpoints/repetition, resumable finish. Acceptance: replay across challenge change, draft retention, bounded search/exhaustion and deliberate repeat. `claude-fable` correction 3 and F7 notes; `codex` C2/C3/C8; `gemini-argon` corrections 2/3. |
| Contradictions | A already specifies at most eight recent deliveries; no new eight-delivery decision is needed. Prototype's session-wide finite-index search is not production canonical-instance repeat search. Gemini cites an incorrect addition ladder (see limitations). |
| Recommended verdict | **not yet** until DL-004/006/026(3–4) and F1 ladder references are settled. Specify the bounded runtime search in F7; do not require RNG/generation behavior inside the content schema. |

### F8 — Self-checks

| Source / dimension | Verdict / synthesis |
| --- | --- |
| `claude-fable` F8 | **Not ready**: DL-028, despite available policy/switch/summary references. |
| `codex` F8 | **Not ready**: DL-028 and reused DL-026 behavior. |
| `gemini-argon` F8 | **Ready with corrections**: calls DL-028 the remaining confirmation. |
| Agreed corrections and inputs | Learning, Exercise “Help during checks of understanding”, `Practice.jsx:CheckPage`, catalog/store. Acceptance: stated scope/policy, independent/support boundary, explicit one-way switch, summary/history and honest provenance. `claude-fable` correction 3; `codex` C2; `gemini-argon` correction 2. |
| Contradictions | All identify the same unresolved default policy; they apply the readiness gate differently. Deferral from milestone one (DL-023) is not itself evidence of insufficient specification inputs. |
| Recommended verdict | **not yet** until DL-028 and relevant reused policies are decided. Keep checks outside the first milestone; no mixed-skill generator prerequisite is introduced. |

### F9 — Profiles, recovery, and progress persistence on PostgreSQL

| Source / dimension | Verdict / synthesis |
| --- | --- |
| `claude-fable` F9 | **Not ready**: production profile design missing; DL-007/027 pending. |
| `codex` F9 | **Not ready for feature specification; inputs exist to write the design proposal**; DL-007/022/027. |
| `gemini-argon` original F9 | **Ready with corrections** for a renamed **profile design document**, not a completed feature-specification input set. |
| Agreed corrections and inputs | ADR 0006/0008/0009, B §9.1, **CLAUDE-FABLE-R01-007**, and simulated profile/store flow provide the design brief. Established acceptance includes email-free credentials, optional verified recovery, unchanged identity after email changes, durable cross-device progress, guest provenance, and PostgreSQL integration tests. `claude-fable` correction 3; `codex` C2; `gemini-argon` correction 2. |
| Contradictions | This is mostly a different deliverable: sufficient inputs to author a proposal versus an existing production authentication/session/recovery/retention design. The latter does not exist under `docs/architecture/proposals/`; prototype toy hashing/local storage is explicitly simulation. Missing implementation is not the blocker. |
| Recommended verdict | **not yet** for the feature specification under review-process §5's release-feature gate; **design-proposal inputs exist** and that document can be prepared now, exposing DL-007/022/027 choices. Do not require built accounts, reopen storage/hosting, or silently approve optional release additions. |

## Owner question: feedback-first or help-first?

**When both mathematical feedback and non-revealing teaching help precede the first correct answer, which outcome should lead the summary?** This is the one open competing behavior recommendation between these reports, separate from pending decisions already recorded in DL. Scenario: answer `7` to `4 + 4`, see incorrect-answer feedback, open visual help without counting to the total, then answer `8`. Also consider help before the wrong answer and non-visual explanation/lesson help before the eventual correct answer.

| Option | Outcome and consequence | Source / changes needed if selected |
| --- | --- | --- |
| **Feedback-first** | `correctAfterFeedback`, plus `visualBefore` / other help tags. Preserves the fact of a successful retry as the primary label; outcome-only counts combine feedback-only retries with retries that needed teaching help, so help must remain visible through tags or separate counts. No independent-performance claim follows. | `gemini-argon` correction 4; current `observations.js` and domain test. Would require changing A §E's “no teaching support” condition, defining `feedback-shown`, and ensuring all summaries retain support context. |
| **Help-first** | `correctWithVisualHelp` or `correctWithHelp`, retaining the incorrect submission and feedback context. Makes teaching support visible in the headline and keeps `correctAfterFeedback` exclusive to feedback-only retries; retry history is no longer recoverable from outcome-only counts, so preserve it in observations/details. | `codex` C6; aligns with A §E as currently written. Would require reordering `summarizeDelivery` and changing its tests, then verifying summary counts/tags. |

Both options retain answer-reveal precedence (`correctAfterExplanation`), exclude invalid input from mathematical retries, and leave the outcome unchanged when help is opened after the first correct response. Neither penalizes help or defines mastery. `claude-fable` correction 6 adds a related contract question: is `feedback-shown` explicitly recorded or guaranteed/implied by a practice response? In an independent check, incorrect feedback must not be assumed to have been shown merely because a validator returned `incorrect`.

**Recommendation for consideration: help-first**, because it matches the current planning rule and makes teaching support explicit in the primary label. **Owner decision remains open**; this synthesis selects neither option as a requirement. The smallest resolving experiment is a two-option summary mockup for the same event sequence, shown to the learner and an educator: ask what happened, whether help was used, and whether the first answer was correct. Add a table-driven sequence test for feedback-only, both help/feedback orders, non-visual help, reveal, invalid→correct, and correct→help. The owner can choose with those consequences visible; another broad review is unnecessary.

## Deduplicated correction dispositions

| Existing source identifiers | Recommended disposition | Smallest destination / action after authorization |
| --- | --- | --- |
| `claude-fable` corrections 1–2; `codex` C1; `gemini-argon` correction 1; DL-025 | **Adapt** | Reconcile Mastery and qualify root guidance against ADR 0008/0009; read ADR 0006 historically or add a supersession cross-reference. |
| `claude-fable` correction 3; `codex` C2; `gemini-argon` correction 2 | **Defer** policy decisions to owner | Record decisions or assigned-owner/trigger deferrals in DL, with implementation status distinct. No such edit is made here. |
| `codex` C3/C4; `gemini-argon` correction 3 | **Accept** as proposed planning corrections | A §D: crossing-ten after first deliverable; minimum recording before marker. B §10: move missing-part validation to milestone two. |
| `claude-fable` correction 6; `codex` C5/C6; `gemini-argon` correction 4 | **Adapt** | A §E: explicit feedback event semantics and mixed reserved-status rule; owner resolves the competing precedence options before document/code/test alignment. C5 is an unanswered contract detail, not a competing algorithm endorsed by another report. |
| `codex` C7 | **Accept** as proposed defect correction | `Visuals.jsx:GroupsVisual` and rendered pre-reveal regression coverage, both languages. Do not remove operand information or reduce the accessible mathematics. |
| `claude-fable` corrections 4/8; `codex` C8; `gemini-argon` correction 5 | **Adapt** | A §F/lesson proposal and F1 schema/guide work: use the consolidated inventory; define or exclude prototype-only fields; retain `0.1-pilot`. |
| `claude-fable` correction 5 | **Accept** as generator specification work | F2 contract: draw order, bounded generation, golden seeds, compatibility and supported ranges; random-source vectors alone do not specify addition. |
| `claude-fable` correction 7 | **Reject** | A's fixed-task rule supersedes B; optional ignored seeds in capability model §6 do not mandate changing it. |
| `claude-fable` correction 9; `codex` C9 | **Accept**, with scoped literal exceptions | Implement the already-planned parity/lesson/literal checks in F1/F4 tooling and CI. |
| `claude-fable` correction 10 | **Needs evidence** for wording choice | The check explanation list does use `revisit={ds.outcome !== 'correctFirst'}` for skipped supported items. Ask whether “Worth revisiting” alongside “Skipped” confuses the learner; no authoritative rule prohibits suggesting a skipped item for revisit. Do not expand it into a specification gate. |

## Claims not confirmed, contradicted, or broader than their evidence

These limits are part of the synthesis evidence, not edits to the historical reports. “Contradicted” means the baseline source disagrees; “not independently confirmed” means the available repository evidence cannot establish the claim as stated.

| Reviewer and claim | Repository check and treatment |
| --- | --- |
| `claude-fable` checklist 2: DL-009–023 are implementation guidance | **Contradicted in part**: DL-022 is Pending, DL-019 implemented, DL-020 partly implemented/CI pending. Carry these separately. Its statement that no pending row has an owner and trigger must not be read as “no triggers exist”: DL-008/024/027 contain triggers/proposed deferrals. |
| `gemini-argon` checklist 2: “Ten items” pending | **Incorrect count**: its enumerated rows total eleven (DL-022 and DL-027 occupy one bullet). The eleven-row inventory above is authoritative for this synthesis. |
| `claude-fable` checklist 3/correction 7: fixed-task seed reconciliation is required | **Not supported**: A §§D/G explicitly supersede B; capability model §6 says a seed *may* be accepted, not that it must. |
| `claude-fable` F7: state the eight-delivery repeat window; checklist 6: `supports()` supplies directive ranges | The recent-window bound already exists in A §D. `supports()` governs exercise representations; it is not a complete schema for every lesson directive (including the explorer's `start`). A complete directive registry/range contract remains missing. |
| `claude-fable` checklist 4 and `gemini-argon` F4/overall: all relevant behavior/disclosure boundaries match | **Too broad**: C7's accessible total and C6's ordering conflict survive passing suites. The underlying flow evidence remains useful within its assertions. |
| `gemini-argon` checklist 4/7: `practice.js` contains `splitMix64`; `tests/domain.test.mjs` lines 13–21 verify golden RNG vectors | **Contradicted**: no SplitMix64 implementation exists in that file; it selects finite pools. Those test lines concern notation. Verified proposal outputs come from standalone reviewer probes, not the prototype suite. |
| `gemini-argon` checklist 4: addition ladder `within-10 ↔ across-10 ↔ within-20` | **Contradicted**: `practice.js:skills` has `within-5 → within-10 → across-10`; no `within-20` variation exists. The algebra ladder `to-10 → to-20` is correct. |
| `gemini-argon` checklist 4: `parseNumberInput`, `allowXPrefix`, nb `1.5 → decimalComma`, en `1,5 → grouping`, `1e9 → range` | **Contradicted**, source and execution: symbol is `parseNumber`, option is `variable`; nb `1.5` succeeds, en `1,5` returns `decimalComma`, `1e9` returns `unparseable`. Grouping and true numeric bounds are separately checked. Do not copy these claimed rules into F2. |
| `gemini-argon` checklist 4: `lessonDisclosesQuestion`, bare `generic` diagnosis | **Citation/name errors**: function is `lessonDisclosure`; addition fallback is `add.generic`. The lesson disclosure cases and other listed codes have source support, but the named symbols do not. |
| `gemini-argon` checklist 5: `checkSwitch`, `independent: true`, `fromGuest: true`, `endedReason: 'replaced'`, recovery state `pendingReplace` | **Literal symbol/field claims not confirmed**: `Practice.jsx` records `check-switch` and `switchedAt`; `summarizeSession` derives `segment: 'independent'`/`'supported'`. Guest creation retains event `prov: 'guest'`, import uses `prov: 'guest-import'`; `store.jsx:endInto` records a `session-end` event with `reason`, and summaries expose `endReason`. Recovery uses `pendingEmail`; `profile.pendingReplace` is a translation key. The underlying tested behaviors are retained, but these claimed serialized names must not become specification inputs. |
| `gemini-argon` commands/checklist 7: proposal anchors `#raw-uint64-vectors`, `#nextbelown-vectors`, `#boundary-cases` | **Nonexistent headings** at baseline. The real heading is “Test vectors”; its tables contain raw, bounded, and injected cases. The numbers are reproducible despite bad anchors. |
| `gemini-argon` commands: build transformed 594 modules; precise timings/install/probe execution history | **Not independently confirmed**: Gemini committed only its report, with no command logs or auxiliary scripts. Claude/Codex saved logs and this synthesis's build show 1205 modules and the same bundle sizes. Do not infer fabrication or a source difference from environment-dependent metadata; use reproducible source/results, not its unexplained module count. Exact historical command execution and model/environment identity are self-reports for all reviewers. |
| `gemini-argon` checklist 7: all worked examples, checks, misconception diagnoses and both-language explanations mathematically accurate | **Not established in that breadth**: finite-pool explanation/validator agreement is tested, and the lesson math chunks match, but this is not an exhaustive independent mathematical/educator review of every authored statement or diagnosis. Code equality is not teaching validation. |
| `gemini-argon` F1 “v0.2”; F3/F5/F7/F9 verdict labels | **Mismatched scope/version**, not extra specification approvals. Use the mapping table: A specifies `0.1-pilot`, prompt F3 lacks a Gemini verdict, F5/F7 are swapped, and its F9 is design-proposal readiness. |
| `gemini-argon` checklist 3: A §D “Realistic weekend cut order”, row 2 requires “10,000-seed” tests; raw directive parity claims | The cited heading does not exist: A §D is “Corrected first milestone”, with “First deliverable, then backlog”. The 10,000 number occurs in B's superseded task list, not A row 2, which says property tests per definition. A's scope duplication is nevertheless real. Directive **structure** can match while localized `:::example` titles differ; no byte-identical translation contract is established. |
| `codex` checklist 8: extracted English math chunks are accepted by `src/domain/math.js` | **Wrong cited module**: its saved probe imports `parseNotation` from `src/domain/notation.js`. The rerun confirms accepted notation, not mathematical truth derived from `math.js`. |
| `claude-fable` and `gemini-argon` touch-target claims; all broad accessibility/bilingual “Yes” readings | **Bounded only**: C12 measures selected heights; no width/spacing/device usability conclusion. Dictionary/anchor/math parity does not prove translation quality or all reachable labels. No actual screen-reader speech or iPad hardware result is supplied. Codex's keyboard/reduced-motion evidence is a small Chromium probe, not a full accessibility audit. |
| `claude-fable` checklist 9 “nobody has run” a screen reader; claims about human checks/scheduling | **Cannot establish outside-repository activity**. No completed iPad/AT/learner/educator/translator record was located in the baseline material. That supports “no result available here”, not knowledge of all human activity or appointments. |
| `claude-fable` npm advisories described as dev dependencies; all reports' production/security implications | Install logs confirm five high-severity advisories, but no dependency-path/advisory investigation was provided or repeated. The “dev dependencies” qualification is not independently established by those logs. No production account-security, PostgreSQL continuity, deployment, or C# conformance evidence exists to infer from prototype success. |

The remaining evidence work is bounded: owner dispositions on existing DL rows and the precedence question, the narrow contract corrections, a focused challenge of this synthesis, and the already-required human/device checks. No report is rewritten, no requirement or decision is approved, and no fifth general review is proposed.
