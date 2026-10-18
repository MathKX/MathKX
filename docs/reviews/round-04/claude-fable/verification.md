# Round-04 verification: claude-fable

## 1. Baseline and identity

| Item | Value |
| --- | --- |
| Baseline commit | `60031f76ee80a0b1783e4d49b2cb3c0d48b8686e` (`main` HEAD, equal to `origin/main` after `git fetch`). The prompt I received contained the literal placeholder `<SHA>`, so per the prompt I used the current `main` HEAD without changing branches or resetting files. |
| Branch | `review/round-04-claude-fable`, created from that commit |
| Model identity as reported to me | Claude Fable 5.1 (`claude-fable-5-1`), in Claude Code (desktop app) |
| Date | 2026-10-18 |
| `git status` before | clean (`git status --porcelain` empty) |
| `git status` after | only new files under `docs/reviews/round-04/claude-fable/` (this report and `evidence/`) |
| Environment | Windows 11 Home 10.0.26300, Node v22.19.0, npm 11.2.0, .NET SDK 10.0.302 (no .NET code exists at the baseline) |
| Other round-04 files | none existed at the baseline besides `verification-prompt.md`; no other reviewer's round-04 report was read |

## 2. Commands run and outcomes

Logs are in `evidence/`. "Ran" means executed by me at the baseline; everything else in this report is marked as inferred from source.

| Where | Command | Outcome | Evidence |
| --- | --- | --- | --- |
| root | `npm ci` | exit 0, 6 packages, 0 vulnerabilities | `evidence/root-commands.log` |
| root | `npm test` | exit 0, **18 of 18** validator tests pass | same |
| root | `npm run validate` | exit 0: "8 content file(s), 7 skill(s), 1 exercise definition(s)" | same |
| prototype | `npm ci` | exit 0, 215 packages, **5 high-severity advisories in dev dependencies** (not investigated; same as round 03) | `evidence/prototype-commands.log` |
| prototype | `npm test` | exit 0, **16 of 16** domain tests pass | same |
| prototype | `npm run build` | exit 0, `dist/index.html` 935.77 kB (gzip 244.31 kB) | same |
| prototype | `npx playwright install chromium` | exit 0, Chromium Headless Shell 141.0.7390.37 (Playwright 1.56.1) | `evidence/playwright-install.log` |
| prototype | `npm run test:browser` | exit 0, **80 of 80**: 20 scenarios × 4 configurations (nb 820×1180 light, en 390×844 dark, en 1180×820 light, nb 390×844 dark), axe-core clean on 13 routes | `evidence/browser-suite.log` |
| scratch | SplitMix64 and bounded-draw fixtures recomputed with BigInt | all 5 raw rows and 4 bounded rows of the proposal match | `evidence/checks/splitmix64.{mjs,json}` |
| scratch | dictionary key parity nb/en | 610 keys each, no missing keys, no placeholder mismatch | `evidence/checks/dict-parity.{mjs,json}` |
| scratch | lesson pair consistency | anchors, maths chunks and front-matter keys identical nb/en for both lessons; 0 GFM delimiter rows | `evidence/checks/lesson-pairs.{mjs,json}` |
| scratch | evidence screenshots (Playwright, Chromium) | 12 PNGs, 0 page errors, 0 px horizontal overflow at every size | `evidence/*.png`, `evidence/checks/screenshots.json` |

Browser walk: the built `dist/index.html` served with `vite preview`, opened in the Claude desktop app's built-in Chromium browser pane at 820×1180 (Norwegian Bokmål) and 390×844 (English); 1180×820 covered by screenshot 04 and the suite. Flows were driven by clicking the app's own buttons and typing into the answer field. This is desktop Chromium emulation; it is not an iPad, Safari, or a screen reader, and I make no device claim. Not run: anything in .NET (no code exists), real-device or assistive-technology checks, learner, educator or translator sessions.

## 3. Checklist

### 1. Consistency of the record: **No**

Agreement is good overall (learner actions and their nb/en labels in `learning-experience.md#more-practice-and-learner-control` match `exercise-experience.md#visual-help-on-request` and the prototype dictionaries; the ADR list in `architecture.md#decision-records` matches `docs/architecture/decisions/`). Two statements contradict accepted ADR 0008/0009 (found by reading and grep; inferred from the files, not run):

| Statement | Where | Contradicts | Smallest correction |
| --- | --- | --- | --- |
| "The database, authentication mechanism, retention rules, and exact record format remain undecided." | `docs/learning/mastery.md#persistence-and-current-implementation-status` (line 41) | ADR 0008 (PostgreSQL, accepted 2026-10-18); already logged as DL-025, still pending | Replace "The database" with a reference to ADR 0008; keep the rest. File: `docs/learning/mastery.md`. |
| "Avoid prematurely deciding unresolved matters such as persistence, authentication, mastery algorithms, symbolic equivalence, hosting, or AI use." | `AGENTS.md`, Durable rules (line 29) | ADR 0008 (persistence) and ADR 0009 (hosting) | Remove "persistence" and "hosting" from the list. File: `AGENTS.md`. |

Historical reports are not counted: `revised-build-brief.md` §1 still lists hosting and persistence as "not blocking release decisions", but `revised-build-brief-corrections.md` §G supersedes that sentence explicitly. ADR 0006's consequence "storage technology … remain future decisions" predates ADR 0008 and is resolved by it; no edit is needed because ADR 0008 names ADR 0006 as its context.

### 2. Decisions resolved or deferred: **No**

Read: `docs/reviews/round-01/decision-log.md`. The prompt says the owner records DL-004 to DL-006, DL-026 and DL-028 before sending; at the baseline all five are still "Pending". No pending row has an owner and a trigger.

| Row | Status at baseline | Blocks |
| --- | --- | --- |
| DL-004 first-milestone skill IDs | Pending | F1 (skills in `content/skills/`, lesson `skills[]`), F2 (definition skill refs), F6 (skill progress keys) |
| DL-005 where the mathematics runs | Pending | F2, F3 by definition; F4's API dependency |
| DL-006 first topic | Pending | F1, F2, F4 content choice (prototype has addition and one-step equations) |
| DL-007 proposed release additions | Pending | F9 inputs (guest-attach prompt, device sessions); not a blocker for verifying that inputs exist |
| DL-008 licences | Pending | none of F1–F9; blocks accepting outside contributions |
| DL-024 random-source ADR 0010 | Pending, conditional on C# fixtures | none; F2 can proceed on the proposal |
| DL-025 `mastery.md` sentence | Pending | none (checklist 1) |
| DL-026 four prototype behaviour rules | Pending | F4 (counting the last counter is a reveal), F5 (lesson-disclosure rule), F7 ("More like this" replaces a pending change; a finished session keeps the question resumable) |
| DL-027 profile created at step 1 | Pending, deferred to profile design | F9 input |
| DL-028 default self-check policy | Pending | F8 |

Rows DL-001 to DL-003 are owner decisions; DL-009 to DL-023 are implementation guidance. Correction: record the owner's verdict (or an owner and trigger) for each pending row in `docs/reviews/round-01/decision-log.md`.

### 3. Planning reference: **Yes, with three wording reconciliations**

Read together, `revised-build-brief.md` and `revised-build-brief-corrections.md` give one first deliverable and backlog order (§D), one cut order (§D: "9, then 7, then 6"), the identity rule (§D: configuration = versioned definition, identity `(definition ID, version, seed)`, fixed tasks without seed, per-skill ladder), result statuses (§E, five statuses matching capability model §7), and observation rules (§E) that match `mastery.md#progress-tracking-before-a-mastery-algorithm` (ordered submissions, invalid input kept apart, support ordered relative to the first correct response, no retroactive relabelling) and `exercise-experience.md#explaining-why-the-result-follows` (explicit reveal; an explanation after an answer becomes support context). Remaining differences:

| Difference | Files | Correction |
| --- | --- | --- |
| Revised brief §4: a fixed task "accepts and ignores" a seed; addendum §D: fixed tasks have "no seed". Capability model §6 allows "a seed may be accepted but has no effect". | `revised-build-brief.md` §4, `revised-build-brief-corrections.md` §D | One sentence in the addendum choosing "accepted and ignored" (matches §6). |
| Addendum §E derives `correctAfterFeedback` from "`correct` after an `incorrect` with `feedback-shown`"; the prototype (`src/domain/observations.js`, `summarizeDelivery`) derives it from any earlier `incorrect` and records no `feedback-shown` event. | `revised-build-brief-corrections.md` §E | State whether `feedback-shown` is a required event or implied by an `incorrect` result in practice mode. |
| Addendum §F lesson schema has `practice[] {definition}`; the prototype `lesson.json` and `:::practice` directive use `{skill, variant}`. | `revised-build-brief-corrections.md` §F; `Prototype/mathkx-designsystemet/src/content/lessons/*/lesson.json` | Pick one; the definition ID is the identity-bearing reference (§D). |

### 4. Prototype as reference: **Yes for behaviour; marking is partial**

All flows below behaved as the documents describe in both languages (ran, unless marked). Marking: `docs/iteration-2/ASSUMPTIONS.md` separates "Simulated behaviour" (finite question lists instead of a generator, browser-only storage, toy hashing, no email, no recovery lookup, nothing submitted), "Requirements the prototype follows", and "Assumptions that should be confirmed"; the banner on every page says profiles, progress and results are simulated. The four rules in DL-026 and the check policy in DL-028 are therefore marked as assumptions, not as reference, until the owner records them.

| Flow | What I saw (nb at 820×1180 unless noted) | Documents / evidence |
| --- | --- | --- |
| Help before answering | "Vis visuell hjelp" opens two labelled groups without the total; counting on shows "Neste brikke er den siste. Teller du den, ser du svaret." before the last counter | `exercise-experience.md#addition-example`; screenshot 01 |
| Counting to the total | after the 8th counter: "…blir det registrert som «svart etter at svaret ble vist»"; answer 8 → outcome "Svart etter at svaret ble vist", tags "Visuell hjelp underveis", "Svaret vist ved å telle alle" | DL-026(1); suite R03-03 |
| Explanation before answering | confirmation names the revealing step ("Svaret kommer i steg 3 av 3"); step 2 shows "Neste steg viser svaret."; closing before it and answering → "Riktig med hjelp", tag "Deler av forklaringen underveis". en 390: "The answer appears in step 4 of 4", last step `9 + 4 = 9 + 1 + 3 = 10 + 3 = 13`, "This step shows the answer." | `exercise-experience.md#explaining-why-the-result-follows`; screenshots 02, 03 |
| Explanation after incorrect / after correct | after `6` on 6 + 3 the confirmation is asked again; after `9` the explanation opens directly and adds the tag "Forklaring åpnet etter riktig svar"; the outcome stays "Riktig etter tilbakemelding" | same; suite G1 |
| Feedback by code and invalid input | `6` → "6 er antallet i én av gruppene…"; `fire` → field error "Vi klarte ikke å lese «fire» som et tall…", not counted as an attempt | `mastery.md#learner-facing-summaries`; `src/domain/math.js` `FEEDBACK` |
| Another question / Make it easier / More challenge / More like this | easier → tag "Neste: Addisjon innenfor fem" with undo; harder → "Endringen er fjernet."; harder again → pending across ten; "Flere slike oppgaver" reads "Beholder Addisjon innenfor ti – erstatter endringen" and the notice says the change was not used; "En oppgave til" then applies a pending change ("Nå: Addisjon over tieren."); at the top: "Neste steg, addisjon med tosifrede tall, er ikke laget ennå…" | `learning-experience.md#adjusting-challenge`; DL-026(3); screenshot 04 |
| Finishing with a draft | typed `1` on 9 + 4, "Avslutt økten" → summary "6 oppgaver: 4 besvart, 1 hoppet over og 1 ikke fullført… 2 av dem før svaret ble vist. 2 ble besvart etter at svaret ble vist." plus "Fortsett med 9 + 4"; Home shows "9 + 4 fra økten du avsluttet. Du hadde skrevet «1»…" | DL-026(4); screenshot 05; suite R03-07 |
| Self-check policy, switch, summary | the policy lists five rules; independent mode has no help buttons and one "Lagre svaret"; "Jeg trenger hjelp" → explicit switch "fra oppgave 2"; after the switch help and feedback appear; the summary separates "Riktig på egen hånd (1)" from "Øving med hjelp (fra oppgave 2)" | `exercise-experience.md#help-during-checks-of-understanding`; DL-028; screenshots 06, 07 |
| My learning and progress after a check | Home rows say "i sjekk" / "i sjekk, etter bytte til øving med hjelp"; the progress page shows the check session with "Uavhengig sjekk" and "Øving med hjelp (fra oppgave 2)" segments and the label-definitions card; no percentages | `mastery.md`; screenshot 08; suite R03-01 |
| Lesson detour and return | on 8 + 5 "Les i leksjonen" warns "Leksjonen viser svaret på 8 + 5"; opening lands on `#/lesson/number-bonds-to-ten?s=why` with focus on that section and the banner "Du har en oppgave i gang: 8 + 5…"; "Tilbake til oppgaven" restores the question with tag "Svaret vist i leksjonen"; 9 + 4 gives no warning (suite R03-02) | DL-026(2); screenshot 09 |
| Profile setup without email | four steps, ID separated from password, guest work named ("oppgaver vist: 10, leksjoner åpnet: 1"), confirm-saved checkbox required, "Fortsett uten e-post", done page states no email; Home then tags six items "gjestearbeid" | ADR 0006; screenshot 10 (en) |
| Pending email | added in Settings, "Bekreft senere" → "Venter på bekreftelse … brukes ikke til gjenoppretting" with finish/change/remove actions. The setup-flow variant was exercised only by suite G7, not by me. | ADR 0006 |
| Sign-in with guest work present | after sign-out and one guest answer, the sign-in page offers "Legg det til i profilen" / "Ikke legg det til"; demo import → progress shows "lagt til fra gjestearbeid" and "1 gjort som gjest før du logget inn" | `mastery.md#persistence-and-current-implementation-status`; screenshot 11; suite C7+C8 |
| Language switch mid-exercise | typed `13` with help open, switched en→nb→en: answer and open panel kept (ran at 390×844) | `vision.md#first-release-languages` |

One prototype observation, not a document conflict: in the check summary's "Forklaringer" list, items skipped after the switch carry the tag "Verdt å se på igjen" (`src/pages/Practice.jsx`, `revisit={ds.outcome !== 'correctFirst'}`) while the same items are labelled "Hoppet over" above (screenshot 07).

### 5. Tests and checks: **Yes, they pass; coverage is narrow**

Ran: see §2. The browser suite ran in all four configurations (80 of 80). Not covered: the root suite tests only the JSON validator (no lesson files, no pilot schemas, no translation checks, no generator existence); the prototype domain tests cover notation, locale parsing, explanation/validator agreement for the finite pools, ladder ends, observation ordering and the round-03 cases, but not the React components, keyboard operation, or dictionary parity; the browser suite is Chromium headless with touch emulation, not Safari, iPad or a screen reader; CI (`.github/workflows/validate-content.yml`) runs only the root `npm run validate` and `npm test`, so the prototype's 96 checks are not in CI; no .NET project or test exists, so the random-source fixtures have never run in C#.

### 6. Content contract readiness: **No**

A second lesson can be produced mechanically by copying the pair under `Prototype/mathkx-designsystemet/src/content/lessons/`, but the following are undefined or only implied (inferred from the files named):

- `lesson.json` has no schema: its `$schema` is the string "…lesson.schema.json (proposed, not yet written)". Types and required-ness of `version`, `status`, `check`, `visuals[]`, and the registry those names come from are undocumented; addendum §F lists responsibilities, not fields.
- `practice[]`: `{skill, variant}` in the prototype versus `{definition}` in addendum §F (checklist 3).
- Skill references: both lessons reference `arithmetic.*` and `algebra.solve-x-plus-a`; `content/skills/` contains only `numbers.*`, `algebra.linear-equations` and `geometry.*`. Resolution waits on DL-004.
- Directive contracts: the attribute sets for `:::visual{type="ten-frame-explorer" start}`, `{type="make-ten" a b}`, `{type="balance" a c}`, `:::example{title id}`, `:::practice{skill variant}` exist only in the header comment of `src/components/Markdown.jsx` and in `HANDOFF.md`; value ranges live in `src/domain/explanations.js` (`supports()`), not in content.
- Notation grammar: documented only in the header comment of `src/domain/notation.js`; the proposal (`proposals/lesson-markdown-and-delivery.md`, "A small authoring format") asks for it to be chosen and documented.
- Tables: both lesson pairs have 0 GFM delimiter rows (ran), so GitHub renders them as text; the revised brief (task 1) requires delimiter rows; the rule is not written anywhere a contributor would read.
- Front matter: only `title` and `objective` are used; required fields are not stated.
- Exercise definitions: the pilot schema (`id, version, skill, source, generator {name, version}, parameters, supportedRepresentations[], misconceptionCodes[]`) has no file under `schemas/`; the misconception codes exist only as keys in `src/domain/math.js`; no generator registry exists. A second definition cannot be written today.
- Per-skill ladder (`skill.schema.json` extension in §F): undefined; the only ladder is `skills[].ladder` in `src/domain/practice.js`.
- Where lessons live: `content/README.md` says `lessons/` does not exist; the prototype path is not the content path.

### 7. Identity and reproducibility: **Yes for the rule; the fixtures start C#, not the generator**

The rule in addendum §D satisfies ADR 0004 (identity `(definition ID, version, seed)` under a compatibility contract; `generatorVersion` and `validatorVersion` recorded) and `learning-experience.md#adjusting-challenge` (a challenge change selects another definition, so parameters never change under one identity; the request is a separate event). I recomputed the proposal's five raw SplitMix64 rows and four `nextBelow` rows independently and all match (ran; `evidence/checks/splitmix64.json`); the four injected-stream rejection cases are specified exactly. That is sufficient to begin `SeededRandom` in C#. It is not sufficient for `addition-pair@1`: the proposal ("Bounded integers") requires range draws, choice and shuffle to be specified with vectors "in the generator contract before the first generator ships", and addendum §D does not state the draw order for `a` and `b`, the rejection policy for `a + b` outside the definition's range, or any golden seeds. Side note: the seed-123456789 sequence that `round-02/synthesis.md` gives as correct (`7,6,5,7,3,4,0,6,1,7`) also reproduces.

### 8. Bilingual completeness: **Yes for the dictionaries and lessons; the CI check is specified, not implemented**

Ran: `DICT.nb` and `DICT.en` each flatten to 610 keys with no key missing on either side and identical placeholder sets; two strings are identical in both languages by design (`proto.tag` "Prototype", `about.orgDomainEx` "Algebra"). Both lesson pairs have identical section anchors, identical maths chunks (15 and 10) and identical front-matter keys; directive sequences match except the localized `:::example` titles. Content-carried strings (`FEEDBACK` in `math.js`, step texts in `explanations.js`, titles in `practice.js` and `catalog.js`) have nb and en by inspection (inferred, not scripted). Learner-visible or accessible strings outside the dictionaries (grep, ran): language names `aria-label="Norsk bokmål"` / `"English"` (`src/App.jsx` 34–35, acceptable in their own language); the language-name ternary in the issue preview text (`src/pages/Lesson.jsx` 232); `404` headings in `App.jsx`, `Home.jsx`, `Lesson.jsx`, `Library.jsx`, `Practice.jsx`; the placeholder URL `https://mathkx.example/signin (prototype)` in the reminder file (`src/pages/Profile.jsx` 27); `Δx = 1` / `Δy =` SVG labels and the `1,5`/`1.5` literal in `src/pages/Preview.jsx` 40–41, 142 (notation). CI: addendum §F and revised brief §7 specify a dictionary key-parity test and a learner-visible-literal lint for CI; neither exists in the repository or in `.github/workflows/validate-content.yml`.

### 9. Accessibility and device status

| Area | Verified | By whom / how | Not verified |
| --- | --- | --- | --- |
| Automated accessibility | axe-core WCAG 2 A/AA, 2.1 AA, best practice: 0 violations on 13 routes × 4 configurations; no missing `aria-labelledby` targets | me, `npm run test:browser` (ran) | anything axe cannot judge |
| Touch targets | ≥ 44 px for links and buttons outside running text on the lesson page and practice with a pending change | me, suite C12 (ran) | other pages; real touch |
| Layout | 0 px horizontal overflow at 390, 820 and 1180 (12 screenshots); the equation chain wraps at 390 | me (ran) | rotation on a device |
| Keyboard operation | native buttons and forms, Enter submits (the suite presses Enter); skip link; focus moves to `h1` on navigation | inferred from `src/App.jsx` and the suite | a full keyboard-only walk; I drove flows programmatically |
| Screen readers | `role="status"` live region, `aria-expanded`, `.ds-sr-only` spoken expressions and MathML output exist | inferred from source and page text | VoiceOver, NVDA or any speech output; nobody has run one (`HANDOFF.md`, `ASSUMPTIONS.md` "What still needs people or devices", all three round-03 reviews) |
| Reduced motion | `prefers-reduced-motion` disables the only animation (claim in `HANDOFF.md`) | not reproduced | emulation with the media query |
| On-screen keyboard | the simulated keyboard keeps the field and Check visible (suite G5; screenshot 12) | me (ran) | a real iPad keyboard; `visualViewport` detection untested on iPadOS (`ASSUMPTIONS.md`) |
| iPad Safari | nothing | — | everything in `design-principles.md#ipad-and-touch-use`; no results from the owner's scheduled checks exist at the baseline |

Learner, educator and translator checks: no results exist at the baseline (`USABILITY-TEST-SCRIPT.md` exists; no recorded session).

### 10. Release gates visible: **Yes**

`revised-build-brief.md` §9.1 lists profiles without personal details with credentials that work without email, optional verified recovery email with equal capabilities, cross-device progress, both languages, and iPad actual-device checks with VoiceOver, and separates them from §9.2 (proposed additions) and §9.3 (unresolved implementation choices). PostgreSQL and App Service are added to the gates by `revised-build-brief-corrections.md` §G rather than by editing the table; ADR 0008 and 0009 carry the decisions. The gates are not restated in `AGENTS.md` or `architecture.md`, which still describe the stage as foundation.

## 4. Candidate feature verdicts

| # | Feature | Verdict | Why |
| --- | --- | --- | --- |
| F1 | Pilot content contract and validator | **Not ready** | DL-004 pending (skill IDs); schema fields undefined (checklist 6); `practice[]` shape conflict; no directive or notation contract outside prototype comments |
| F2 | .NET domain | **Not ready** | DL-005 pending blocks it by definition; the random source is ready to implement (checklist 7); generator draw order, rejection policy and golden seeds unspecified; misconception codes live only in `math.js` |
| F3 | Thin API | **Not ready** | DL-005 pending; only two sentences of contract in addendum §D ("instance and validate", "private data stays server-side"); no error, versioning or locale behaviour stated |
| F4 | Web practice flow | **Ready with corrections** | sources and a working prototype reference exist and match (checklist 4); corrections: record DL-026(1); settle `feedback-shown` (checklist 3); move the literals of checklist 8 into dictionaries or declare them exempt; keyboard-only and screen-reader verification still owed |
| F5 | Lesson rendering | **Ready with corrections** | prototype `Markdown.jsx` and both lesson pairs are a usable reference; corrections: record DL-026(2); document directive attributes and notation grammar as content contract; require GFM delimiter rows; the `practice` directive should reference a definition |
| F6 | Observations and progress | **Ready with corrections** | `mastery.md` and addendum §E are authoritative and the prototype implements them (`observations.js`, `Home.jsx`); corrections: record DL-026(4); `feedback-shown` rule; skill IDs after DL-004 |
| F7 | Challenge ladder, repeats, session controls | **Ready with corrections** | behaviour verified (checklist 4); corrections: record DL-026(3) and (4); define the ladder schema (§F); state the repeat window (eight deliveries) in the content contract |
| F8 | Self-checks (spec readiness only) | **Not ready** | DL-028 pending is a blocking row; otherwise inputs exist (`learning-experience.md`, `exercise-experience.md#help-during-checks-of-understanding`, prototype `CheckPage`, screenshots 06–08) |
| F9 | Profiles, recovery, persistence (inputs only) | **Not ready** | ADR 0006, 0008, 0009 exist; the profile design proposal that CLAUDE-FABLE-R01-007 asks for does not exist as a document; DL-007 and DL-027 pending |

## 5. Corrections

1. `docs/learning/mastery.md` (persistence status): reference ADR 0008 instead of "the database … remain undecided" (DL-025).
2. `AGENTS.md` (durable rules): drop "persistence" and "hosting" from the unresolved list; ADR 0008/0009 decided them.
3. `docs/reviews/round-01/decision-log.md`: record owner verdicts for DL-004, DL-005, DL-006, DL-026, DL-028, and an owner plus trigger for every remaining pending row.
4. `docs/reviews/round-01/claude-fable/revised-build-brief-corrections.md` §F: make `practice[]` reference a definition ID and align the `:::practice` directive with it.
5. Same file §D: specify `addition-pair@1` draw order, rejection policy and golden seeds, as the random-source proposal requires before a generator ships.
6. Same file §E: say whether `feedback-shown` is a recorded event or implied by an `incorrect` result in practice.
7. Same file §D: use "a seed is accepted and ignored" for fixed tasks, matching the revised brief and capability model §6.
8. `docs/architecture/proposals/lesson-markdown-and-delivery.md` (or §F): document the directive attribute sets, the notation grammar, required front-matter fields and GFM delimiter rows as the pilot contract.
9. `.github/workflows/validate-content.yml`: the planned parity and literal checks are absent; add them when F1 lands, and say so in §F until then.
10. `Prototype/mathkx-designsystemet/src/pages/Practice.jsx`: a skipped supported item should not be tagged "Verdt å se på igjen" in the check summary's explanation list (prototype wording only).

## 6. What I could not verify

iPad Safari, the real on-screen keyboard, rotation on hardware, VoiceOver or any screen reader, reduced-motion behaviour, a keyboard-only walk (flows were driven programmatically), the setup-flow pending-email path (only the suite covers it), any .NET behaviour (no code exists), the five npm audit advisories, and learner, educator and translator outcomes. No human-check results exist at the baseline to cite.

## 7. Overall verdict

**Not ready to specify.** The record and prototype are consistent enough to write specifications for F4–F7 once the owner records DL-026, and the test suites pass at the baseline, but the gate set by the prompt is not met: DL-004, DL-005, DL-006 and DL-028 are still pending, so the skill identities, the runtime boundary, the first topic and the check policy that F1–F3 and F8 depend on are undecided; the pilot content contract has no schema or directive contract a contributor could follow; and two authoritative documents (`mastery.md`, `AGENTS.md`) still call persistence or hosting undecided. Blockers in order: record the pending decisions (correction 3), write the pilot schemas and directive contract (corrections 4, 5, 8), and make the two one-line document fixes (corrections 1, 2). Device and assistive-technology validation remain missing for release and are not a blocker for writing the specifications.
