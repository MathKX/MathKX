# Round-04 verification: codex

## Baseline and identity

- **Baseline:** `60031f76ee80a0b1783e4d49b2cb3c0d48b8686e`, the local `main` HEAD: the supplied `<SHA>` was an unreplaced placeholder, so I used the prompt's fallback; I did not reset or update main.
- **Reviewer:** codex; identity reported to me: Codex, based on GPT-6; **date:** 2026-10-18 (Europe/Oslo).
- **Report branch:** `review/round-04-codex`, created at that baseline; the user explicitly requested a commit and PR, overriding the prompt's default prohibition on publishing.
- **Before:** `git status --short --branch` returned `## main...origin/main`, with no changes. **After the checks:** `## review/round-04-gemini-argon` and `?? docs/reviews/round-04/codex/`; both tracked and staged diffs were empty. The shared checkout changed branches externally during verification; at that snapshot HEAD, main, and my branch still resolved to the baseline. Before publication it advanced to `d2e030725abae52f63a1e70c02688eae7189d45b` and status gained `...origin/review/round-04-gemini-argon`; `git diff 60031f76ee80a0b1783e4d49b2cb3c0d48b8686e --name-only -- . ':(exclude)docs/reviews/round-04'` remained empty. Publication uses an isolated Git index based on my branch, without switching the shared checkout or incorporating another reviewer's work.
- Only this report and its evidence are submitted; no other reviewer's round-04 files were read. Package installation/build outputs are ignored tooling artifacts. Evidence scripts are verification probes, not changes to the application or its suites.
- Citation shorthand throughout: **P** = `Prototype/mathkx-designsystemet/`; **A** = `docs/reviews/round-01/claude-fable/revised-build-brief-corrections.md`; **B** = the adjacent `revised-build-brief.md`; **DL** = `docs/reviews/round-01/decision-log.md`. All cited source paths/symbols refer to the baseline; linked evidence is from this verification.

## Commands actually run

Windows PowerShell; Node `v22.19.0`, npm `11.2.0`. Exit codes below are the native command outcomes, including failures, rather than the enclosing logging wrapper's status. npm output was captured with `Tee-Object`; initial installs used temporary npm cache directories. Authorized retries ran outside the restricted sandbox.

| Directory | Command | Exact outcome | Evidence |
| --- | --- | --- | --- |
| Root | `npm ci` | First attempt exit 1: registry `ENOTFOUND`; retry exit 0: added 6, audited 7, 0 vulnerabilities | [initial](root-npm-ci.log), [retry](root-npm-ci-retry.log) |
| Root | `npm test` | Exit 0; 18 tests passed, 0 failed/cancelled/skipped/todo | [log](root-test.log) |
| Root | `npm run validate` | Exit 0; validated 8 files, 7 skills, 1 exercise definition | [log](root-validate.log) |
| P | `npm ci` | First attempt native exit -4048: `EPERM` creating `node_modules/@nodelib/fs.stat`; retry exit 0: added 215, audited 216, **5 high severity vulnerabilities reported** | [initial](prototype-npm-ci.log), [retry](prototype-npm-ci-retry.log) |
| P | `npm test` | Exit 0; 16 tests passed, 0 failed/cancelled/skipped/todo | [log](prototype-test.log) |
| P | `npm run build` | Exit 0; Vite 8.3.2, 1205 modules, `dist/index.html` 935.77 kB / gzip 244.31 kB, 397 ms | [log](prototype-build.log) |
| P | `npx playwright install chromium` | Run once, exit 0; Chromium 141.0.7390.37, Playwright build 1194, headless shell and support downloads installed | [log](playwright-install.log) |
| P | `npm run test:browser` | Exit 0; **80 passed, 0 failed**, 20 scenarios in each of four configurations | [log](browser-suite.log) |
| Root | `node docs/reviews/round-04/codex/source-probes.mjs` | Exit 0; dictionary/lesson structure, observation sequences, proposal RNG fixtures checked; details below | [script](source-probes.mjs), [log](source-probes.log) |
| Root | `node docs/reviews/round-04/codex/browser-probes.mjs` | Final exit 0 in both languages; two earlier harness runs exited 1 (radio label intercept; wrong-language selector after switching languages), corrected only in the probe | [script](browser-probes.mjs), [final](browser-probes.log), [first](browser-probes-first-attempt.log), [second](browser-probes-second-attempt.log) |

I opened the built HTML through Playwright's Chromium browser on a local HTTP server, headless on Windows. Suite configurations: **nb 820×1180 light; en 390×844 dark; en 1180×820 light; nb 390×844 dark**, touch emulation enabled; supplemental probes used both languages at 820×1180, resizing to 1180×820, with reduced motion. Optional Google font requests were blocked. These are desktop emulations, not physical devices. I also inspected the saved explanation screenshot. No .NET tests, production API, PostgreSQL integration, or deployment were run; these are planned work (A §D; P `HANDOFF.md`). npm's vulnerability count was recorded, not investigated or remediated.

## Fixed checklist

### 1. Consistency of the record — **No**

Source inspection: `docs/learning/mastery.md#persistence-and-current-implementation-status` still says the database remains undecided; `docs/architecture/decisions/0006-support-profiles-without-personal-details.md#consequences` still includes storage technology among future decisions. Both conflict with accepted `docs/architecture/decisions/0008-store-profiles-and-progress-in-postgresql.md` and DL-001. Smallest correction: update those current-status sentences to reference ADR 0008 while preserving unresolved authentication, retention, and record design (C1). `docs/architecture/architecture.md` and ADR 0009 already record hosting; A §G explicitly supersedes B's old open storage/hosting entries. I found no additional direct accepted-decision contradiction in the required vision, product, design, and learning documents inspected; this is a document comparison, not proof of implementation.

### 2. Decisions resolved or deferred — **No**

Source inspection of **DL**: DL-001–003 are owner decisions; DL-009–018, DL-021, and DL-023 are implementation guidance. The following remain unresolved; agreement in earlier reports is not approval.

| Rows | Status and consequence |
| --- | --- |
| DL-004, DL-006 | Pending objectives/skill IDs and first topic; block binding F1/F2/F7 to the proposed addition pilot and downstream pilot integration, though generic components can be specified separately. |
| DL-005 | Pending runtime choice for milestone one; blocks F2 and F3 as proposed. |
| DL-007 | Pending individual release additions; blocks incorporating those additions in F9, not the established email-free profile requirement. |
| DL-008 | Pending licenses; trigger is before outside contributions, but no explicit assigned owner/deferred disposition; not a blocker to internal F1–F8 specification. |
| DL-019, DL-020 | Completion statuses (implemented / partly implemented with CI pending), not explicitly one of the requested decision categories; clarify implementation-guidance status separately from completion. Translation CI remains work for F1/F4. |
| DL-022, DL-027 | Pending profile sequencing/email design; design trigger exists but no assigned owner and no completed design; block F9 feature specification. |
| DL-024 | Pending random-source ADR adoption after C# fixtures pass; does **not** prevent starting the fixture implementation, but adoption must precede freezing dependent generator contracts. |
| DL-025 | Pending documentation reconciliation already authorized by ADR 0008; correction, not a new owner decision (C1). |
| DL-026 | Four pending prototype policies: counting completion already follows the exercise document; instance-specific lesson disclosure affects F5/F6; pending variation replacement and resumable finish affect F7 and reused F8 behavior. |
| DL-028 | Pending default self-check policy; blocks F8 specification even though checks are deferred from milestone one. |

Smallest correction: in `docs/reviews/round-01/decision-log.md`, record the owner's disposition or explicit deferral with an assigned owner and trigger, and distinguish implementation status from decision status (C2); I have not supplied decisions on the owner's behalf.

### 3. Planning reference — **No**

Source inspection: A's explicit supersession resolves B's old topic ladder, fixed-task seed handling, reserved result labels, and weekend promise. A §D clearly states cut order **9, then 7, then 6**, versioned-definition identity, and one lesson/one definition first; §E separates invalid input, partial correctness, unassessed work, and support before/after first correctness, consistent with `docs/learning/mastery.md#progress-tracking-before-a-mastery-algorithm` and `docs/design/exercise-experience.md#explaining-why-the-result-follows`.

Remaining ambiguities: (a) A §D requires observations in the first deliverable, but puts observations at item 8 after the “First deliverable complete” marker following item 6; distinguish minimum recording before the marker from later summaries (C3). (b) Retained B §10 asks the adult to try missing-part questions after milestone one, while A §D defers those to milestone two; move that portion of the human check (C4). (c) A §E uses “Highest status” for mixed partial/review-needed submissions without defining the ordering or relationship to later incorrect responses; define that derivation before F6 is specified (C5), without expanding the milestone generator's three emitted statuses.

### 4. Prototype as reference — **No**

The following were **run**, in both languages, using the unchanged suite `P tests/browser/review-checks.mjs` and the supplemental probe; scenario names identify the assertions and the logs above record every result. This is bounded flow verification, not exhaustive UI equivalence.

| Required flow | Reproduced evidence |
| --- | --- |
| Help before answering; explanation before answering, after incorrect, after correct; explicit reveal; counting total | Suite R03-03, C6 + R03-08, G1, R03-06; supplemental after-correct explanation. Counting completion and marked final steps record disclosure; see the two failures below. |
| Another question; easier/harder; More like this with pending change | R03-04, R03-04b, G2, C9 and supplemental Another. Current variation/draft transitions pass the suite's assertions. |
| Finish with draft | R03-07: draft retained and question resumable. |
| Check policy, one-way switch, summary | R03-05b, G3: independent policy then supported continuation and item explanations. |
| My learning and skill progress after check | R03-01 and G4: routes render and check boundary/history retained. |
| Lesson detour and return | R03-02: plain help versus same-answer reveal recorded and return works. |
| Profile without email; pending email; sign-in with guest work | C7 + C8, G7; supplemental creates a profile, enters an email, requests a simulated code, chooses Verify later, and observes pending state. |

**Failure A, run:** answer 7 to `4 + 4`, open visual help, answer 8: both languages show `correctAfterFeedback`; A §E requires that outcome to have **no teaching support**, so this sequence should be `correctWithVisualHelp`. Independent source probes also reproduce incorrect→explanation-open/lesson→correct as `correctAfterFeedback`. `P src/domain/observations.js:summarizeDelivery` prioritizes earlier incorrect responses over non-revealing help; `P tests/domain.test.mjs` preserves that ordering. Minimal correction: align the derivation and its tests with A §E (C6); preserve the separate support tags.

**Failure B, run and source-confirmed:** for `3 + 5`, explanation step 2 displays the next-step reveal warning, but accessible names already say “Counter 1 of 8” / “Brikke 1 av 8”. `P src/components/math/Visuals.jsx:GroupsVisual` supplies `n: a + b` before `P src/domain/explanations.js` marks the revealing step. This exposes the numerical total early through accessibility text, contrary to `docs/design/exercise-experience.md#explaining-why-the-result-follows`. Minimal correction: omit the total from pre-reveal labels and cover that rendered state in the browser test (C7). Evidence: [English accessibility snapshot](en-pre-reveal-accessibility.txt), [Bokmål snapshot](nb-pre-reveal-accessibility.txt), [English screenshot](en-pre-reveal.png), [Bokmål screenshot](nb-pre-reveal.png). I inspected DOM accessibility names, not actual screen-reader speech.

**Reference versus simulation, source inspection:** `P src/App.jsx`, `HANDOFF.md`, and `docs/iteration-2/ASSUMPTIONS.md` label the prototype and its browser-only persistence, finite authored tasks, simulated profile/email/recovery behavior, and unverified device support. `P src/store.jsx` is not a production authentication/persistence contract. DL-026–028 keep the named policy choices provisional despite passing browser assertions.

### 5. Tests and checks — **Yes**

The root suite, validation, prototype domain suite, build, and browser suite passed in this run with exact outcomes above. Root `tools/validate-content.mjs`, its tests, and `schemas/{skill,exercise}.schema.json` cover the exploratory JSON contract, references, graph and diagnostics; they do not validate pilot lessons, ladders, generators, or translations. Prototype `P tests/domain.test.mjs` and `P tests/browser/review-checks.mjs` exercise finite authored JavaScript and simulated browser state, not C# determinism, production auth, database persistence, full reserved-status rendering, or idempotent API submissions. The passing suite misses both checklist-4 discrepancies, and the observation unit test encodes one of them. `.github/workflows/validate-content.yml` runs root installation, validation, and tests; it does not yet run prototype or translation checks. These coverage statements are **source inferences**, not additional passing tests.

### 6. Content contract readiness — **No**

A contributor cannot author a conforming second pilot lesson/definition without choices: A §F expressly describes “responsibilities, not final field names”; `P src/content/lessons/number-bonds-to-ten/lesson.json` identifies its schema as “proposed, not yet written”. `content/README.md`, `content/AGENTS.md`, the two existing `schemas/` files, `docs/architecture/exercise-format.md`, and `docs/architecture/proposals/lesson-markdown-and-delivery.md` do not supply the missing pilot contract. Undefined or conflicting authoring rules found by **source inspection**:

| Area | Choices still needed for an author |
| --- | --- |
| Common envelope | Placement/requirement of `0.1-pilot` and `$schema`; required/optional/default fields, unknown-field policy, exact version/status types/enums and revision rules for the new pilot files. |
| Lesson relations | Which fields hold skill IDs versus lesson IDs (`related` is lesson-oriented in the proposal but skill-oriented in the prototype); allowed prerequisites; reference/version resolution; `practice[] {definition}` in A versus `{skill, variant}` in the prototype; whether prototype `check` is excluded from the pilot. |
| Lesson languages/assets/anchors | Metadata ownership between `lesson.json` and front matter, translation revision compatibility and path constraints; asset/link resolution and author-supplied alternatives; explicit/generated anchor syntax, uniqueness and normalization; exact validation of referenced anchors in both languages. |
| Directive grammar | Supported Markdown dialect and parser rules; `:::visual`, `:::example`, `:::practice` required/optional attributes, quoting/escaping, bodies/closing/nesting, unknown names/attributes and diagnostics; example IDs/titles; practice definition syntax; component registry, configuration types/defaults and permitted ranges; precise notation subset accepted by the pilot. Prototype `P src/components/Markdown.jsx` demonstrates one implementation, not a finalized contributor contract. |
| Exercise definitions | Generated/fixed conditional fields; fixed instance payload; generator-specific parameter names and constraints; validator identity/version linkage; response/presentation/feedback and help/explanation references; misconception-code registry; exact `supportedRepresentations[].range` shape and coverage checks. A §D gives mathematical bounds, not these serialized rules. |
| Ladder | Exact entry object for definition reference/version and nb/en sentence; duplicate/order/reference constraints, schema placement and end behavior encoding; repeat search bound/algorithm needed by its runtime acceptance test (A §D defines a window of at most eight, not the search bound). |

Smallest correction: finalize these narrow pilot choices in A §F and the lesson proposal, then implement the named schemas and corresponding `content/AGENTS.md` authoring examples as F1; preserve the existing exploratory exercise fixture (C8). This is not a request to finalize Format v1 or symbolic equivalence. Missing schemas are F1 deliverables; DL-004/006, rather than their mere absence, prevent specifying the proposed pilot's final references today.

### 7. Identity and reproducibility — **Yes**, for the planned rule and beginning implementation

Source comparison: A §D's generated `(definition ID, version, seed)`, pinned compatibility versions, selection outside generation, per-skill ladder, and fixed `(definition ID, version)` without seed satisfy `docs/architecture/decisions/0004-deterministic-exercise-generation.md`, `docs/architecture/exercise-capability-model.md` §6, and `docs/design/learning-experience.md#adjusting-challenge`. `docs/architecture/proposals/seed-and-random-source.md` specifies arithmetic, parsing, bounded draws, rejection, boundaries, and replay fixtures sufficiently to **begin** C# implementation. **Ran:** independent JS BigInt implementation reproduced all 15 tabulated raw outputs, 32 bounded outputs and 4 injected rejection/boundary rows ([probe](source-probes.mjs)). **Cannot verify** C# conformance, generator replay or all seed-input validation: no C# implementation was executed. DL-024 remains proposed, with C# tests as its acceptance trigger; the JS probe does not satisfy that trigger.

### 8. Bilingual completeness — **Cannot verify** full linguistic completeness; structural checks pass

**Ran:** `P src/i18n.js:DICT` has 610 leaf keys per language, no missing/empty values or placeholder mismatch. Both lesson folders under `P src/content/lessons/` have nb/en pairs, folder-matching IDs, title/objective, six matching explicit anchors each, matching visual/practice directives and math chunks; all extracted English math chunks are accepted by `P src/domain/math.js`, and the Bokmål math chunks match. Evidence: [source probe log](source-probes.log). The browser flows above ran in both languages. These checks cannot establish translation naturalness, educational equivalence, or every reachable accessible name; no translator assessment was reproduced.

Source inspection finds learner-visible text outside `DICT`: `P src/domain/math.js` spoken notation/feedback; `P src/domain/explanations.js` explanation steps; `P src/domain/practice.js` variation titles/descriptions; `P src/content/catalog.js` titles/descriptions; lesson Markdown prose; `P src/App.jsx` language names and brand/link labels; `P src/pages/Lesson.jsx` report template/language names; `P src/pages/Profile.jsx:IdBox` downloaded reminder text including literal “(prototype)”. Localized content and proper names need deliberate treatment, not blanket deletion. B §7, A §F, and DL-020 **specify** dictionary parity, lesson pairing and learner-visible-literal checks for CI; `.github/workflows/validate-content.yml` does not implement them yet. C9 records the already-planned enforcement, not a claim that current translations are missing.

### 9. Accessibility and device status — **Cannot verify** full accessibility or iPad support

| Area | What I actually verified; remaining limit |
| --- | --- |
| Keyboard | Supplemental Tab from answer→Check→help, Enter opens help, expansion state correct, draft survives language switch and resize in nb/en; no complete keyboard-only journey or physical keyboard/device test. |
| Screen readers | Suite axe scans 13 routes per configuration (52 scans) report no WCAG 2 A/AA, 2.1 AA or best-practice violations; supplemental accessibility snapshots expose C7. No VoiceOver, NVDA, or other screen-reader speech/navigation tested. |
| Touch targets | Suite C12 passes selected lesson/practice targets; inspection of `P tests/browser/review-checks.mjs` shows a height check below 44 px, not all target widths/spacing or actual touch usability. |
| Reduced motion | Supplemental emulated `prefers-reduced-motion: reduce` matched and `.mkx-fade` computed animation was `none`; source `P src/styles.css` supplies the rule. Not all motion or a device preference tested. |
| iPad Safari | **Cannot verify:** Windows Chromium emulation and the suite's simulated keyboard resizing are not iPad, Safari, an on-screen iPad keyboard, or VoiceOver. |

The above checks were performed by **codex in this verification**. `P docs/iteration-2/ASSUMPTIONS.md`, `USABILITY-TEST-SCRIPT.md`, and B §10 identify outstanding human/device work; no completed physical-iPad, learner, educator, or translator validation was located in the required baseline material. Earlier reviewers' reported checks are not counted as mine, and I cannot verify the owner's external scheduling or results.

### 10. Release gates visible — **Yes**

Source inspection: B §9.1 and §10 retain profiles without personal details, optional verified recovery email, cross-device progress, both languages, and actual-device/assistive-technology validation as release requirements; A §G adds accepted PostgreSQL and hosting ADRs to that table. B §9.2 separates proposed recovery codes, export, device-session controls and other additions; DL-007 records them as pending. `docs/architecture/decisions/0006-support-profiles-without-personal-details.md`, ADR 0008 and ADR 0009 support the established gates. Visibility is verified; completion is not.

## Candidate feature verdicts

“Ready” concerns specification inputs, not implementation completion; acceptance below is drawn from cited sources, not tests I claim already exist. Generic F4 is deliberately scoped to the listed practice shell, excluding the pending lesson-disclosure/session/check policies.

| Feature | Verdict | Requirement and prototype inputs; acceptance; blocker/correction |
| --- | --- | --- |
| **F1** Pilot content contract/validator | **Not ready** | A §F, `content/AGENTS.md`, lesson proposal; prototype `P src/content/lessons/*/lesson.json` and `Markdown.jsx`; acceptance: schemas, references/ranges/anchors/parity and validator diagnostics/tests. DL-004/006 must settle pilot objectives/IDs/topic; C8 identifies contract choices for the specification. |
| **F2** .NET domain | **Not ready** | ADR 0003/0004, capability model §§6–9, seed proposal, A §§D–E; `P src/domain/{math,observations,practice}.js` is a finite JS reference, **no production generator reference**. Acceptance: C# fixtures, golden/property/agreement/boundary/replay tests. DL-004/005/006 block the proposed runtime/scope; C5/C6 affect result/observation types; DL-024 is the later adoption gate. |
| **F3** Thin API | **Not ready** | `docs/architecture/architecture.md`, ADR 0009, A §D/B §3; **no prototype API** (`P HANDOFF.md`). Acceptance: instance/validate contract tests, presentation-only response and private data server-side. DL-005 and F2 identity/result contracts are unresolved inputs; hosting is already decided. |
| **F4** Web practice flow | **Ready with corrections** | `exercise-experience.md`, ADR 0007, A §§D–E; `P src/components/{ExerciseShell.jsx,math/Visuals.jsx,math/Counters.jsx,math/TenFrame.jsx}`. Acceptance: help/reveal/feedback flows, exhaustive status presentation, state retained across language/resize, bilingual parity. C6/C7 correct misleading reference behavior; C9 carries specified translation enforcement. No pending DL row blocks this narrow reusable shell; pilot integration still depends on F1–F3. |
| **F5** Lesson rendering | **Not ready** | Lesson proposal, `exercise-experience.md`, A §F; `P src/components/Markdown.jsx`, lesson pairs, `src/pages/Lesson.jsx`. Acceptance: both languages, directives/references/anchors, detour state and truthful disclosure. C8 must settle the directive/reference contract; DL-026 must settle the instance-specific lesson-disclosure rule. |
| **F6** Observations/progress | **Not ready** | `mastery.md`, A §E; `P src/domain/observations.js`, `src/pages/Home.jsx`, `src/store.jsx`. Acceptance: every §E outcome, ordered support, per-delivery counts, idempotent submissions and preserved provenance. DL-026 disclosure/resume policy, C5 mixed-status derivation and C6 reference mismatch remain. |
| **F7** Ladder/repeats/session controls | **Not ready** | `learning-experience.md#more-practice-and-learner-control`, A §D; `P src/domain/practice.js`, `src/store.jsx`, `src/pages/Practice.jsx`. Acceptance: adjacent-definition replay, pending-change draft retention, bounded repeat search/exhaustion and resumable finish. DL-004/006 define pilot ladder; DL-026 decides replacement/resume policy; C8 supplies serialized ladder/search rules. |
| **F8** Self-checks (later milestone) | **Not ready** | `learning-experience.md`, `exercise-experience.md#help-during-checks-of-understanding`; `P src/pages/Practice.jsx:CheckPage`, catalog and store. Acceptance: stated scope/policy, explicit switch, summary/history and honest support/provenance. DL-028 blocks default policy; DL-026 affects reused lesson/session behavior. Deferral alone is not the reason for this verdict. |
| **F9** Profiles/recovery/PostgreSQL | **Not ready** for feature specification; inputs exist to write the design proposal | ADR 0006/0008/0009, B §9.1 and `docs/reviews/round-01/claude-fable/recommendations.md#claude-fable-r01-007--decide-the-production-profile-design-before-building-accounts`; `P src/pages/Profile.jsx` and store are explicitly simulations. Acceptance inputs include no-email setup/sign-in, optional verified recovery, cross-device durable progress and guest provenance; production authentication/session/recovery/retention design and testable contract are absent. DL-007/022/027 remain open; storage/hosting need no new decision. |

## Smallest corrections identified

- **C1 — `docs/learning/mastery.md` persistence-status paragraph and `docs/architecture/decisions/0006-support-profiles-without-personal-details.md` Consequences:** qualify the stale storage status with ADR 0008 so current requirements agree.
- **C2 — `docs/reviews/round-01/decision-log.md`:** record owner dispositions or assigned-owner/trigger deferrals for checklist-2 rows, and separate implementation guidance from completion status, so specifications cannot silently decide policy.
- **C3 — A §D:** put minimum observation recording before the first-deliverable marker and identify any later summaries separately, so its definition and backlog agree.
- **C4 — B §10:** defer the adult test's missing-part questions to milestone two, matching A's scope.
- **C5 — A §E:** define precedence for mixed partial/review-needed/incorrect observations, so the reserved outcome rules are deterministic.
- **C6 — `Prototype/mathkx-designsystemet/src/domain/observations.js` and `tests/domain.test.mjs`:** make pre-correct teaching support take precedence over the feedback-only outcome, matching A §E.
- **C7 — `Prototype/mathkx-designsystemet/src/components/math/Visuals.jsx` and `tests/browser/review-checks.mjs`:** remove the pre-reveal total from counter accessible names and test that state, matching the explicit-reveal requirement.
- **C8 — A §F, `docs/architecture/proposals/lesson-markdown-and-delivery.md`, then the pilot schemas named there and `content/AGENTS.md`:** settle and document checklist-6 authoring choices with validated examples, so the next contributor does not infer a contract from JSX.
- **C9 — `.github/workflows/validate-content.yml` and the validator/test tooling it invokes:** implement A §F's already-specified dictionary/lesson/literal enforcement with explicit treatment of localized content and proper names, so bilingual completeness has an executable gate.

These are proposed corrections only; none was applied in this verification.

## Cannot verify

Cannot verify that the owner's intended frozen SHA differs from the fallback local main, that all open review PRs were merged, or that human checks were scheduled; no concrete SHA or human results were supplied. Cannot verify real device/Safari/VoiceOver support, complete keyboard or touch usability, educational suitability, linguistic quality, production account security, durable cross-device storage, C# compatibility or production deployment. The npm advisory count is not a security assessment. Baseline evidence is the required documents/source, actual commands, and browser observations above, not inferred completion of planned work.

## Overall verdict

**Not ready.** The proposed pilot cannot move wholesale into feature specifications while DL-004–006 leave its scope, IDs and runtime unresolved, DL-026/028 leave behavior policies pending, and F9 lacks its production design. F4's narrow shell can be specified with C6/C7/C9; the random-source fixture implementation can begin as an experiment without treating DL-024 as accepted. Reconcile C1–C5 and settle the narrow C8 contract in the appropriate feature work; then apply the per-feature gates above without another general review. Passing tests establish the bounded checks recorded here, not the missing decisions, human validation, or production readiness.
