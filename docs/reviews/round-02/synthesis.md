# Comparison of Gemini, Claude, and Codex reviews

**Reviewer:** Codex. **Date:** 2026-10-18. **Status:** Proposed dispositions and implementation priorities; not approval of new requirements.

**Current baseline:** `4b993134be418d5fb4e3ab0bd752717edf281922`, clean before this report. Gemini reviewed `7fe5b26c92e7eb4e47bfc89c8bfa02f95d5f72d5`. Since that baseline, Gemini's reports and the accepted PostgreSQL/Azure decisions were added; the prototype and validator source have not changed.

Sources: Gemini's [independent analysis](gemini-argon/independent-analysis.md), [comparison](gemini-argon/comparison-and-recommendations.md), and [readiness report](gemini-argon/build-readiness.md); Claude's [revised brief](../round-01/claude-fable/revised-build-brief.md) and [response](../round-01/claude-fable/response-to-codex.md); Codex's [challenge](../round-01/codex/challenge.md) and [readiness report](../round-01/codex/readiness.md).

## Recommendation

**Start a narrow internal implementation after consolidating the scope and acceptance criteria below. Another full review round is unnecessary.** Gemini adds useful source-level findings, particularly final explanation reachability, historical-help summary behavior, lesson identity inconsistencies, and unsupported mathematical notation. Its report also contains incorrect citations, invented details, and an incorrect RNG test sequence. Adopt verified findings and revise the proposed fixes rather than copying its implementation specification.

The shared direction remains sound: a bilingual authored lesson connected to reproducible generated practice, visual help and worked explanations, and honest observations before mastery estimates. Agreement among reviewers does not establish teaching effectiveness; learner, educator, and actual-device checks remain necessary.

## Baseline changes that supersede the reviews

- [ADR 0008](../../architecture/decisions/0008-store-profiles-and-progress-in-postgresql.md) now selects PostgreSQL, EF Core/Npgsql, and Azure Database for PostgreSQL Flexible Server for production storage.
- [ADR 0009](../../architecture/decisions/0009-host-on-azure-app-service.md) now selects Azure App Service on Linux, serving the API and built frontend together in Norway East.
- The [decision log](../round-01/decision-log.md) records these as owner decisions. Authentication details, licenses, retention/deletion rules, and first-milestone choices still have open entries.
- The RNG remains a [proposal](../../architecture/proposals/seed-and-random-source.md). Gemini's suggestion to allocate ADR 0008 to it is stale; do not overwrite the storage ADR or promote a proposal merely because models agree.
- The current [progress documentation](../../learning/mastery.md) and [visual-explanation requirements](../../design/exercise-experience.md) take precedence over contradictory tables in older review briefs. Some older documents still describe storage/hosting as undecided; reconcile those status statements when consolidating the build plan, without reopening the accepted choices.

The storage and hosting decisions do not require deploying infrastructure or building accounts before an internal guest-practice slice.

## Disposition of Gemini's recommendations

IDs abbreviate `GEMINI-R02-`. “Accept direction” means this report recommends the direction, not that the owner has approved a new decision.

| ID | Disposition | Comparison and action |
| --- | --- | --- |
| 001 Scope and repeat avoidance | **Adapt** | Agrees with Codex readiness R1/R3 on bounded addition and smaller scope. Start with one addition generator and within-ten/crossing-ten definitions. Missing-part exercises are valid mathematics; deferring them is a scope choice, not proof that the task family is flawed. Do not adopt the invented retry specification or arbitrary half-pool rule. |
| 002 Progress observations | **Adapt** | Confirms Claude/Codex's retry/result concerns and adds the real historical-help summary issue. Use explicit event order and per-delivery summaries. Reject thresholds that group success after feedback as independent or promote learners out of a supposedly inferior “helped” state. |
| 003 Full visual explanations | **Accept direction; expand correction** | The final step is indeed hidden in the practice shell. `revealFinal={work.solved}` alone is insufficient: established requirements also allow explicitly requested explanations after an incorrect response. Disclosure policy and support recording must govern reveal timing. |
| 004 Lesson identity and language validation | **Adapt** | Concrete metadata/catalog discrepancies strengthen Claude R01-001/005/006 and Codex R4. Validate one canonical identity and explicit route mapping. Do not require translations to have identical prose/directive order or introduce nonexistent lessons and syntax. |
| 005 RNG implementation | **Accept direction; reject supplied replacement fixtures** | Implement C# tests from the checked-in proposal, including boundaries and rejection behavior. Gemini's added seed-123456789 sequence is incorrect for that algorithm. Promotion to an ADR remains a separate decision. |
| 006 Lesson exploration | **Adapt** | The timer/intersection heuristic is confirmed. Prefer truthful “Viewed” history or an optional learner confirmation over new compulsory scrolling/clicking rules. Do not infer understanding from page exposure or interaction counts. |
| 007 Notation, input, localization, accessibility | **Accept defects; adapt remedies** | Silent symbol loss and locale-blind parsing are confirmed; untranslated `Legend` adds to the known `pluss` issue. Define a narrow supported grammar and reject/preserve unsupported input visibly. Do not claim every MathML expression requires a flattened spoken label without assistive-technology testing. |
| 008 Validator extensibility | **Accept direction during content work** | Duplicate-skill diagnostics use an absolute path; semantic checks dispatch only on known schema basenames. Make supported schema/semantic handlers explicit as pilot content types are added. Existing exercise-duplicate paths are already relative. |
| 009 Profile setup | **Defer to profile design; adapt** | Early simulated profile creation and missing email editing deserve UX review. Verification is not a complete dead end: “verify later” exists. Preserve the distinction between a learner ID and a secret recovery credential; do not adopt a particular account activation sequence by implication. |
| 010 Self-checks | **Accept deferral; reject stated evidence and extra prerequisite** | Claude already deferred checks. The prototype has separately authored check arrays, not reversed practice arrays. A useful first self-check need not require a mixed-skill generator or multi-skill inference; it needs a stated scope, support policy, run history, and honest outcomes. |

## Verified findings worth adding to implementation tasks

### 1. Make the complete worked explanation reachable

[ExerciseShell.jsx](../../../Prototype/mathkx-designsystemet/src/components/ExerciseShell.jsx) passes `revealFinal={false}` to both `MakeTen` and `Balance`. Their final reasoning step is therefore unavailable in the practice shell, even after a correct answer. The lesson embeds can show it, so this is not dead code throughout the application.

**Acceptance:** Practice offers a clear explanation action after correct or incorrect responses, with stepwise reasoning and accessible text in both languages. Any requested pre-answer reveal is explicit support. Check policies continue to control disclosure. Inspecting an explanation after a response does not retroactively change that response's support context.

### 2. Summarize supported and unsupported work without ranking them

[activity.js](../../../Prototype/mathkx-designsystemet/src/activity.js) selects `practicedHelp` whenever any historical correct answer in the set used help. That single label hides subsequent work without visual help. This is a summary limitation, not proof that the application currently deducts mastery scores.

Use descriptive counts or a scoped recent-session summary showing both kinds of activity. Preserve what happened rather than replacing history or making learners earn a better badge by avoiding help. Correct after feedback is a distinct observation, not independent success. Input-format corrections, partial correctness, and unassessed work remain separate.

**Acceptance:** A history containing helped success, later first-response success, and a successful retry displays all three accurately. Event ordering distinguishes support before/after each response even when timestamps coincide. Repeated network submission is idempotent; deliberate later practice of the same instance is a separate delivery.

### 3. Do not silently change mathematical notation or numeric input

The current [MathExpr tokenizer](../../../Prototype/mathkx-designsystemet/src/components/math/MathExpr.jsx) drops unsupported symbols. Direct probes produced `['3','4']` for `3/4`, `['2','3']` for `2 < 3`, and `['6']` for `6²`. The [answer parser](../../../Prototype/mathkx-designsystemet/src/domain/math.js) accepts `1,000` as `1` and rounds `9007199254740993` to `9007199254740992` through JavaScript number conversion.

These do not require a universal notation engine in milestone one. Declare the supported notation, numeric bounds, and per-locale accepted forms; validate lesson content and generated presentation against those capabilities. Show an explicit unsupported-input message rather than silently evaluating altered mathematics. Do not port the prototype parser unchanged into the domain layer. Acceptance of `+8` or reversed `4 = x` is a grammar choice, not automatically a defect if the advertised answer form excludes it.

**Acceptance:** Known supported examples render and parse correctly; unsupported operators and out-of-range values do not silently disappear or round into accepted values. All displayed quantities and explanations agree with canonical mathematics. Keyboard choices support the declared input forms and are checked on iPad.

### 4. Reconcile lesson identity when moving content

Both existing lesson pairs use prefixed metadata IDs (`arithmetic.number-bonds-to-ten`, `algebra.equations-as-a-balance`) while catalog/route keys are unprefixed. [Lesson.jsx](../../../Prototype/mathkx-designsystemet/src/pages/Lesson.jsx) uses metadata IDs in issue text but catalog keys in navigation. Runtime reading currently works because these are separate paths; this is an identity ambiguity to resolve, not evidence that all current lesson routes are broken.

Choose one canonical content identity, with an explicit route alias if needed. Validate cross-language identity, skill/exercise references, shared referenced section anchors, and component configuration. Mathematical meaning must match across languages; translated wording, ordering where appropriate, and accessible descriptions need not be byte-identical. Use the existing one-lesson pair for the first slice rather than adding Gemini's nonexistent second arithmetic lesson.

## Claims not to carry into the build specification

1. **RNG replacement vectors.** Gemini R02-005 says seed `123456789` should yield `6,0,4,7,1,9,4,9,3,2` for ten bounded draws. The proposal's algorithm produces **`7,6,5,7,3,4,0,6,1,7`** for `nextBelow(10)` from that seed. Gemini's recommendation also misstates which seeds and sequence lengths are in the proposal. The five raw-output rows and four bounded-output rows actually checked in were reproduced successfully in this review. Use those source fixtures, not a review's transcription.
2. **Retroactive mutation of stored help.** A probe of the actual store reducer confirmed that changing `work.helpUsed` after solving leaves the stored attempt's `help` unchanged. Gemini correctly spots that the current exercise display can gain a help tag after solving, but its claim of retroactively changing the persisted practice result is not supported. Keep the timing requirement; fix the relevant display/observation behavior.
3. **Missing-part combinatorics.** For `a + ? = 10` with `a` in `0..10`, there are **11 distinct prompts**. Treating `3 + ? = 10` and `7 + ? = 10` as the same unordered pair is a duplicate-policy choice, not an intrinsic limit of the task family. Claude's brief does not contain the exact eight-retry pseudocode Gemini quotes. Define deduplication per mathematical task, bound any search, and allow an explicit repeat when the finite pool is exhausted. Keep recent-history selection outside pure instance generation, so the resolved identity always replays.
4. **Self-check source.** [catalog.js](../../../Prototype/mathkx-designsystemet/src/content/catalog.js) declares separate `practiceSets` and `checks`. [Practice.jsx](../../../Prototype/mathkx-designsystemet/src/pages/Practice.jsx) uses the check-specific list; it does not reverse practice questions. Skipped responses do live only in the check-run/session state, which is a valid later persistence concern.
5. **Profile dead end and credential meaning.** [EmailSetup](../../../Prototype/mathkx-designsystemet/src/pages/Profile.jsx) has a “verify later” action. Editing/removing a mistyped email still needs attention. [ADR 0006](../../architecture/decisions/0006-support-profiles-without-personal-details.md) does not establish the public learner ID as a secret recovery code, contrary to wording in Gemini's readiness report.
6. **Source accuracy.** Several paths and references in the comparison do not exist: `crossing-ten-addition` and `linear-equations-balance` lesson files, `localization-and-curriculum.md`, a Codex finding `C09`, and ADRs titled `0003-technology-direction` / `0007-deterministic-exercise-generation`. Claude R01-009 concerns iPad validation, not an accepted local-storage schema. The lesson observer also has no explicit `threshold: 0.35`; its early-view heuristic is real, but that quoted setting is not. Preserve these reports as historical review evidence, not authoritative specifications.

## What to settle before implementation

Use one short build-start plan that references current requirements and the following choices. Do not silently amend accepted requirements or mark pending decisions approved.

1. **Scope:** One existing bilingual lesson/worked example; one C# addition generator; within-ten first, then the single-digit crossing-ten definition using the same generator. Distinguish learning about number bonds from evidence of answering a missing-part task. Missing-part tasks and broader within-20 operands can follow with their own supported interactions.
2. **Runtime/content boundary:** Follow the existing ASP.NET Core/C#, React/TypeScript, Designsystemet/Tailwind direction and documented `src/backend/` / `src/web/` layout. Define a small experimental content contract with explicit generator/validator compatibility, canonical IDs, language resources, and validated parameter domains. Preserve the exploratory `0.1` fixture; do not call the pilot Format v1.
3. **Replay and finite practice:** Difficulty selects a versioned definition. The recorded `(definition ID, version, seed)` reproduces the instance. Another-question selection may avoid recent mathematical repeats where practical, but must terminate and permit honest repetition. Automatic repeat avoidance can be deferred without losing unlimited opportunities to practise.
4. **Acceptance criteria:** Include help before answering, complete explanation disclosure, no silent notation loss, correct/incorrect/invalid distinctions, accurate support ordering, and language switching without lost work. Add progress-summary acceptance cases when that feature is built. Integrate tests/CI with each implemented behavior instead of leaving them after a calendar cut line.
5. **Status:** Keep unfinished profile and check features out of the working learner flow or clearly identified as previews. Leave the old prototype available as a labelled design reference. Use the accepted PostgreSQL/Azure targets when server persistence/deployment is introduced; no speculative infrastructure work is required first.

This is a dependency-ordered recommendation, not another promise that the entire milestone fits a weekend. The [existing decision log](../round-01/decision-log.md) still marks the exact first objectives/topic as pending; the recommendation above supplies a concrete default for the owner. Hosting and database choices do not need to be asked again.

## Work that can follow during development

- Localize all learner-visible and accessible text, including `Legend` and `pluss`, while porting the components.
- Make unsupported schema/semantic handling explicit when adding lessons, topic sequences, and pilot definitions. Improve duplicate-skill diagnostics at that time.
- Use a truthful lesson-viewed history label instead of requiring arbitrary time, scrolling, or manipulative interaction to “earn” exploration. Neither label establishes understanding.
- Implement self-check run/skip history in its own milestone. Do not require mixed-skill inference for an honest single-skill check.
- Design profile setup, optional email editing/verification, guest-work attachment, and retention before account implementation. Preserve provenance on imported observations; mathematical revalidation cannot establish independent performance.
- Keep licensing/contribution terms, production account and recovery behavior, real-device testing, bilingual release coverage, and operational validation as release gates. Do not add Apple Pencil/Scribble support or a new age-based entry policy as a prerequisite merely because Gemini suggested testing them.

## Verification and limits

I inspected the cited source and current decision records and ran focused, read-only Node probes of the proposal's RNG, the existing tokenizer/answer parser, and the actual store reducer. All five checked-in raw RNG rows and all four checked-in bounded-draw rows matched. The conflicting Gemini vector, token loss, numeric parsing examples, and unchanged stored attempt after a post-solve help toggle were reproduced as described above.

This does not rerun or replace the full generator conformance suite, which has not been implemented in C#. I did not rerun the unchanged validator regression suite or prototype build in this review, nor perform browser, iPad, screen-reader, learner, or educator testing. The report does not verify Gemini's claimed review execution history; it verifies the findings listed here against the available repository.

**Conclusion:** Gemini strengthens the implementation checklist, but does not reveal a need to redesign MathKX before starting. Consolidate these supported corrections into the first tasks, then learn from running software and real users.
