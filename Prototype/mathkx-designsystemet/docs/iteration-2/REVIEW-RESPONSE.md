# Response to the round-03 reviews

Three independent reviews of iteration 2 were made on 18 October 2026 against baseline `a6a3aba`:

- Claude (Fable): `docs/reviews/round-03/claude-fable/prototype-iteration-2-review.md` (branch `claude/mathkx-prototype-review-f88aad`)
- Codex: `docs/reviews/round-03/codex-independent/review.md`
- Gemini (Argon): `docs/reviews/round-03/gemini-argon/review.md` (handled in its own section below)

Both found the same crash and several of the same mismatches. Every finding was reproduced or confirmed in the source before changing anything. Each fix below has a check in `tests/domain.test.mjs` (`npm test`) or `tests/browser/review-checks.mjs` (`npm run test:browser`), or both. The reviews themselves and the requirement documents were not changed.

IDs: **C** = Claude finding number, **X** = Codex `R03-nn`, **G** = Gemini (numbered in the section below).

## Fixed

| Finding | What was wrong | What changed | Checked by |
| --- | --- | --- | --- |
| C1, X01 | After starting or finishing a self-check, My learning and the skill-progress page went blank (`variants['check']` was undefined). | `suggestNext` uses only the learner's own practice sessions (not checks, not imported guest work) and returns nothing for an unknown variation. Every page is wrapped in an error boundary, so a bad record can no longer blank the whole app. The progress page no longer shows the empty state when the only session is a check. | `npm test` R03-01; browser R03-01 (in, during and after a check, including the switch) |
| X02 | Going to the lesson before answering 8 + 5 showed the exact worked solution, yet the answer was recorded as “first response, no help”. | Opening the lesson from an exercise is now recorded on that delivery. If the lesson shows this exercise's answer (rule in `src/domain/disclosure.js`: a maths line that starts with the exercise and ends with its answer, or a worked visual for the same values), the learner is told first and can choose visual help instead. Outcome: “Answered after the answer was shown”, tag “Answer shown in the lesson”. A lesson that does not show the answer (9 + 4) is recorded as “Correct with help”. Lesson reading after answering changes nothing. | `npm test` R03-02 (both languages' lesson files); browser R03-02 |
| C5, X03 | Counting all the counters showed the total but was recorded as ordinary visual help; the reveal warning promised visual help never gives the answer. | Counting the last counter is an answer reveal, as `exercise-experience.md` says. The help warns before the last counter (“The next counter is the last one. Counting it shows the answer.”) and after. The reveal warning now says visual help for 4 + 4 shows the answer only if the learner counts to the end. Counting stays available; it is not penalised. | `npm test` R03-03; browser R03-03 |
| X03 | Opening the explanation was logged as an answer reveal at step 1, which does not show the answer, and later steps were not recorded. | Opening (`explanation-open`) and each step (`explanation-step`, with `reveals`) are recorded separately. Each step model marks the steps that show the answer, and a test checks that earlier steps never contain it. Opening and closing before the answer gives “Correct with help” with the tag “Part of the explanation before answering”. The step player says “The next step shows the answer” before that step. | `npm test` R03-03; browser R03-03 |
| C4, X06 | The last balance step said `4 + 3 = 7` but still pictured x alone against four ones. | New phase 4: the original balance with x replaced by four ones (outlined and labelled “x = 4”), three ones beside them, and seven on the right. The accessible description says “4 ones in place of x + 3 ones”. | `npm test` R03-04; browser R03-06 |
| C2, X04 | “More like this” silently dropped a pending easier/harder choice. | “More like this” keeps the current variation, as `learning-experience.md` defines it. When a change is pending, the button says “Keeps Addition across ten – replaces your change”, and afterwards the notice says the change was not used. The event log records `outcome: 'replaced'`. | browser R03-04 |
| C3, X04 | After the learner's own easier/harder change, a stale `?variant=` in the address raised “You have a session in progress… start a new one?”. | The link's requested variation is handled once when the page opens, then removed from the address. | browser R03-04b |
| C9 | “Start new: …” replaced the active session without ending it. | The old session is ended (`reason: 'replaced'`), gets a summary, and the learner is told with a link to it. Progress shows “finished when a new session started”. | browser C9 |
| X07 | “Finish this session and continue later” gave no way back to the unanswered question. | The action is now “Finish this session”, with a line saying what happens to an unanswered question. That question stays resumable: the summary and My learning offer “Continue with 7 + 6”, which opens it in a new session with the typed draft and the support already used (`resumedFrom`). The continue card picks the most recent work rather than any older open session. | `npm test` R03-07; browser R03-07 |
| C10 | “{n} correct in the end” counted answers typed after the explanation. | The summary counts answers found before any answer was shown, and lists answers after a reveal separately. | browser R03-02 |
| X05 | The independent/supported boundary of a check disappeared on the progress page and Home. | Progress shows a check run as “Independent check” and “Supported practice (from exercise n)”. Home's recent list says “in a check, after switching to supported practice”. Session summaries carry the segment. | `npm test` R03-05; browser R03-01 |
| C11, X05 | In supported check mode both Skip and Next were offered before answering, with different records. | Before answering: only “Skip” (or “Skip and see the summary” on the last question), recorded as skipped. After answering: “Next exercise” or “See summary”. | browser R03-05b |
| C7 | Guest work kept in a new profile had no visible label. | Guest work (created or imported) is tagged “guest work” on Home and progress when signed in, and progress counts it. The no-op mapping in `createProfile` was removed. | browser C7 + C8 |
| C8 | After importing guest work, the suggestion talked about the imported session and imported sessions showed “not finished”. | Imported open sessions get an explicit end event (`reason: 'imported'`, shown as “added from guest work”), and suggestions ignore imported work. | browser C7 + C8 |
| C6 | At 390 px the final `8 + 5 = 8 + 2 + 3 = 10 + 3 = 13` was cut off. | Equation chains wrap at the equals signs. | browser C6 (no overflow in the chain, panel or page) |
| X08 | The step player's `aria-labelledby` pointed at a heading that did not exist. | The region is labelled by the panel title when there is no heading. | browser C6 + R03-08 (no missing targets) |
| C12 | Breadcrumbs (23 px), prerequisite links (18 px) and small lesson buttons (42 px) were under 44 px. | 44 px minimum for breadcrumb links, small buttons and prerequisite links. | browser C12 (all links and buttons on the lesson outside running text) |
| C11 | Wording: “1 answers”; “recorded as solved after the explanation” versus “Answered after explanation”; check entry not called “Check my understanding”; that entry reopened the old summary; double tags after an explanation. | Singular form; one phrase, “Answered after the answer was shown”, with a tag for where; “Check my understanding / Sjekk forståelsen min” on topic, lesson and summary; it always opens a fresh check, with a button to the last summary; the “explanation opened after answering” tag is not added when the outcome already says the answer was shown. | browser C11, R03-05b |
| C11 | `aria-pressed` on easier/harder was wrong after two presses. | Pressed state follows the direction of the pending change. | source |
| Profile | The pending-email tag and sentence ran together. | Tag and sentence on separate lines. | source |

## Gemini review: what it added

Gemini confirmed the crash (G-P0), counting to the total, the check boundary on the progress page, “More like this” and the touch targets, which were already fixed. These findings were new:

| Finding | What was wrong | What changed | Checked by |
| --- | --- | --- | --- |
| G1 (P1) | After an incorrect answer, “Explain the solution” skipped the warning and showed the answer at once. | The warning is shown until the answer is found, not only before the first answer. | browser G1 |
| G2 (P2) | Help used after an incorrect answer was tagged “after answering”, and the summary hid it behind “Correct after feedback”. | “While solving” and “after” are now measured from the first correct answer. Help used to find the answer is tagged (“Visual help while solving”) next to “Correct after feedback”. “After” tags only appear after the correct answer, so a reveal is never tagged twice. | `npm test` Gemini cases |
| G3 (P2) | “Make it easier” then “More challenge” set the next question to the current variation. The challenge event was logged as `applied` when it was only chosen. | Stepping back to the current variation clears the change, and the button says “Back to …”. Events are `requested` when chosen and `applied` only when the next question uses them (also `cleared` and `replaced`). | browser G2 |
| G4 (P2) | The check summary showed explanations only for items not answered correctly, and only as lesson links, although the policy promised explanations. | Every check item has its step-by-step explanation in the summary, plus the lesson link. Viewing them records nothing. | browser G3 |
| G5 (low) | A check left part-way could not be resumed from My learning. | The continue card offers it (“You are on exercise 2 of 4 in the check”). | browser G3 |
| G6 (low) | The lesson view count went up with every trip between an exercise and its lesson. | Opens less than 30 minutes apart count as one visit, and the page says so. | `npm test` |
| G7 (P2) | At 390 px, turning on the simulated keyboard hid the answer field and Check button. | Turning it on scrolls the answer and Check above the keyboard. | browser G5 |
| G8 (low) | The panel fade animated opacity, so text briefly had low contrast. | The fade now uses movement only. | axe in the browser checks |
| G9 (P2) | In the derivative preview, typing x = 1,2 updated the feedback but left the graph at x = 1. | Any valid x moves the point. The arrows snap to the next 0.5 step. | browser G6 |
| G10 (low) | The derivative preview showed the answer without a warning. | Same warning pattern as the exercises. | browser G6 |
| G11 (P2) | Changing a confirmed recovery email replaced it before the new one was confirmed. There was no way to cancel. | The confirmed address stays in use until the new one is confirmed (`pendingEmail`). The verification step has “Cancel the change and keep …”. | browser G7 |
| G12 (low) | Old iteration-1 strings contradicted iteration 2 (for example a check policy offering visual help). | 59 unused keys removed from both languages (found by scanning the source for every key in use). Both languages have the same key set. | key scan |

Not changed:

- **The profile is created at the end of step 1, before the learner confirms they saved the ID.** This is deliberate. Guest work and the ID are kept even if setup is interrupted, and the setup banner asks the learner to finish. It is now listed in ASSUMPTIONS.md.
- **Number tokens with a decimal comma** in `notation.js`. The tokenizer already reads `2,4` as one number (`/^\d+(?:[.,]\d+)?/`), so this was not a defect.
- **Parts of the Gemini report do not match this code.** It describes a “doubles” help model, a file `src/styles/app.css`, routes such as `#/check/add-within-20`, and a balance step 4 that already substituted 4 for x at the baseline. None of these exist in the code. Each Gemini finding above was reproduced against the code before it was fixed.

## New outcome

“Correct with help” / “Riktig med hjelp” covers help that does not show the answer and is not visual help: the first steps of an explanation, or a lesson that does not contain this exercise. Tags say which help was used. “Correct with visual help” is unchanged.

## Decisions taken, for the owner to confirm

These are recorded in [ASSUMPTIONS.md](ASSUMPTIONS.md) as well.

1. Counting the last counter is an answer reveal (follows `exercise-experience.md`; C5 asked for an explicit decision).
2. A lesson counts as showing the answer only when it contains this exercise's result or a worked visual for the same values. Reading the lesson in general is help, not a reveal. The rule checks the whole lesson, because a learner can scroll anywhere.
3. “More like this” keeps the current variation and replaces a pending change, with a visible notice (Codex accepted either option; this follows the definition in `learning-experience.md`).
4. Finishing a session keeps an unanswered question resumable instead of making the end final.

## Corrected claims

- The iteration-2 documents said the Playwright runs were “tested”, but no script was in the repository. The checks are now in `tests/browser/review-checks.mjs` and can be run again. The axe runs are part of that script.
- `ASSUMPTIONS.md` listed two established requirements as open assumptions (explanations before answering; challenge changes applying to the next question). They are now listed as requirements the prototype follows.
- The handoff said visual help never shows the result. That was not true for counting all; it now says so.

## Not changed, and why

- **Lesson location (`src/content/lessons` versus `content/lessons`) and the missing schema** (Claude, area 7). The prototype labels both as proposed. Moving lesson files into the repository root belongs with the schema work the proposal describes, not with the prototype.
- **`mastery.md` says the database is undecided, but ADR 0008 is accepted** (Codex, conflict 1). This is a requirement document, so the prototype does not change it. It needs an owner decision.
- **npm audit reports 5 high-severity advisories** in development dependencies (both reviews). Not investigated here. They do not affect the single-file output.
- **Real iPad, VoiceOver, learners, educators and translators.** Still untested. See [ASSUMPTIONS.md](ASSUMPTIONS.md#what-still-needs-people-or-devices).
