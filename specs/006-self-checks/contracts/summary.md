# Contract: The Summary and Checks in "My Work"

Part of [plan.md](../plan.md) Phase 1. Research R5, R7, and R11; spec User Stories 1, 2 and 4, FR-009 to FR-012, FR-014, FR-016.

## The grouping (`src/web/src/state/checks.ts`, pure)

`summarizeRun(run: CheckRun): RunSummary`. It reads only the run, never the content or the rest of the record:

| Part | Members | Shown with |
| --- | --- | --- |
| `correct` ("Correct on your own") | independent positions whose only submission is `correct` | the answer |
| `revisit` ("Worth revisiting") | independent positions whose only submission is anything else | the learner's answer and the correct answer |
| `skipped` ("Skipped") | independent positions with `skipped` | the correct answer |
| `supported` | positions from `switchAt` whose question is answered (data-model "Answered": a submission or `skipped`) | spec 002's `derive` outcome label, the learner's answers, and the correct answer |
| `notAnswered` | positions without an answered question, in either part; only an ended run has any | the correct answer |

**Invariants**, each a unit test over scripted runs:
- **Coverage**: every position of a run that is over is in exactly one part.
- **Membership never depends on moving on**: it reads only each delivery's events, never `position` or the existence of a later delivery. So the last question of a finished run is in its group or in `supported`, and a supported question answered before its run was ended keeps its outcome in `supported`, never in `notAnswered`.
- **The independent groups**: they hold only positions before `switchAt` (all positions when it is null), and every independent position of a finished run is in one of them.
- **DL-036**: `revisit` holds no supported, skipped, or unanswered position.
- **Stability**: a supported question with a wrong submission, or no correct one, is never `revisit`.
- **No new outcomes**: `derive` is spec 002's, unchanged. The pilot validator gives only `correct`, `incorrect`, or input guidance in a check; a later validator with other statuses needs its own decision before it is used in a check.

**The test matrix (SC-002)**: all 3⁴ = 81 combinations of correct, wrong, and skipped on four positions, each with no switch, and with a switch at positions 1 to 4 (with supported outcomes scripted), and ended runs stopped at each position, both before and after the question there was answered. Two named cases: a switch with the last question answered and "See summary" chosen, and a run ended after a supported question was answered but before "Next question".

## The summary (`CheckSummary`, on the run's page)

| Part | Content |
| --- | --- |
| Heading (`PageHeading`, focused on arrival) | `check.summaryTitle` |
| Check | the check's title for the run's version (`GET /api/checks/{id}/{version}`); omitted if it cannot be loaded |
| Date | `formatDate` of `startedAt` |
| Snapshot | `check.policySnapshot` |
| Independent result, under `check.independentTitle` | three groups in this order: `check.groupCorrect`, `check.groupRevisit`, `check.groupSkipped`. Each has a count (`check.groupCount`) and its questions. An empty group shows `check.groupNone`. With a switch at question 1, the three groups are replaced by `check.noIndependent`. |
| Supported part | only with a switch: heading `check.supportedTitle` naming `switchAt`, then `check.supportedNote`, then each question with its outcome label (spec 002's `outcome` texts) |
| Not answered | only for an ended run: heading `check.notAnsweredTitle`, then `check.notAnsweredNote`, then each question |
| Each question | the expression (`record.question`; for an unreached question, from its answer response, below), `check.yourAnswer`, `check.skippedAnswer`, or `check.noAnswer`; `check.correctAnswer`; a disclosure "Show the explanation" (`practice.showExplanation`) with a `StepPanel` |
| The tag "Worth revisiting" | `check.groupRevisit` as a tag, on questions in that group only |
| Note | `check.summaryNote` |
| Actions | "Practise more" (`check.practiseMore`) to `/practice/{skillId}`, with `check.practiseMoreNote`; "Take a new check" (`check.again`) to `/checks/{checkId}`; a link to "My work" |

**Reached and unreached questions**: a reached question has a delivery with recorded operands. An unreached question, one in `notAnswered` with no delivery, has only the identity in the run's copy of the list. The two take different paths (PR 51 review).

**The correct answer of a reached question**: with a correct submission, it is that submission's value. Otherwise it comes from `GET .../answer` (contracts/api.md), requested when the summary is shown, and is shown **only when the response's operands equal the recorded ones**. If the request fails, or the operands differ, `check.answerUnavailable` is shown, and the recorded expression and answers stay. So a recorded `7 + 3` can never be shown with the answer of whatever the identity resolves to now. While the request is loading, nothing is shown. A missing answer is never presented as a wrong one.

**An unreached question**: there are no recorded operands to compare, so its expression and its answer both come from the one `GET .../answer` response, which names the operands it answers. They therefore always agree. If the request fails, the question shows `check.unreachedUnavailable` with its position, with no expression, answer, or explanation. It is still listed and counted under "Not answered".

**Explanations** (research R11): each question's identity is re-resolved with one instance request before its explanation is offered:
- **A reached question**: the explanation is offered when the operands match the record.
- **An unreached question**: it is offered when they match its answer response's operands.

"Show the explanation" fetches steps with `api.getStep` in the component and shows them in `StepPanel`. Nothing is dispatched to the store, so nothing is recorded and no group changes. Otherwise, the disclosure is replaced by `check.explanationUnavailable`, and whatever the question already shows stays.

**Never shown**: a score, a fraction such as "2/4", a percentage, a streak, time taken, or a mastery word ("mastered", "level", "grade"). The wording scan (`progress-wording.test.tsx`) gains the check components and the `check` dictionary section.

**Keyboard and screen reader**: groups are `section`s with `h2` headings. Each disclosure is a button with `aria-expanded`. Every control is a 44 by 44 target on touch screens.

## Checks in "My work" (`RecordPage`)

In each skill group, after the practice lines and before the question list:
- **The part**: a sub-heading `check.recordTitle`, then the skill's runs, newest first (`data-testid="check-run"`). Any check entry for the skill follows ([check-run.md](check-run.md)).
- **A finished or ended run**: the date, then `check.recordCounts` ("{correct} correct on your own, {revisit} worth revisiting, {skipped} skipped"). It adds `check.recordSupported` ("{n} as supported practice from question {i}") when there was a switch, and `check.recordNotAnswered` when the run was ended. The run links to its summary at `/checks/{checkId}/{runId}`.
- **An unfinished run**: the date and `check.recordUnfinished` ("Unfinished, at question {n} of {total}"), with "Continue the check" to its run. It never shows counts, which would state correctness before the summary.
- **Skills with only checks**: a skill whose only activity is check runs is listed, like a skill with only lesson views (spec 004). Its practice sentence is `progress.noPractice`.
- **Separation**: practice's summary sentence, repeat sentences, lesson lines, and question list are computed from `deliveries` and `lessonViews` exactly as before, so check questions never appear in them (FR-014). Tests compare "My work" before and after a check.

## Texts (`check` section, continued)

| Key | en | nb |
| --- | --- | --- |
| `summaryTitle` | Your check | Sjekken din |
| `independentTitle` | On your own | På egen hånd |
| `groupCorrect` | Correct on your own | Riktig på egen hånd |
| `groupRevisit` | Worth revisiting | Verdt å se på igjen |
| `groupSkipped` | Skipped | Hoppet over |
| `groupCount` | {n} questions | {n} oppgaver |
| `groupNone` | No questions here. | Ingen oppgaver her. |
| `noIndependent` | You switched to supported practice before saving an answer, so no answers were given on your own. | Du byttet til øving med hjelp før du lagret et svar, så ingen svar ble gitt på egen hånd. |
| `supportedTitle` | Supported practice (from question {i}) | Øving med hjelp (fra oppgave {i}) |
| `supportedNote` | These questions were done after you switched to supported practice. They are not part of the result on your own. | Disse oppgavene ble gjort etter at du byttet til øving med hjelp. De er ikke en del av resultatet på egen hånd. |
| `notAnsweredTitle` | Not answered | Ikke besvart |
| `notAnsweredNote` | You started a new check before reaching these questions. | Du startet en ny sjekk før du kom til disse oppgavene. |
| `yourAnswer` | Your answer: {a} | Ditt svar: {a} |
| `skippedAnswer` | You skipped this question. | Du hoppet over denne oppgaven. |
| `noAnswer` | Not answered | Ikke besvart |
| `correctAnswer` | Correct answer: {a} | Riktig svar: {a} |
| `answerUnavailable` | The correct answer cannot be shown just now. | Det riktige svaret kan ikke vises akkurat nå. |
| `unreachedUnavailable` | Question {n} cannot be shown just now. | Oppgave {n} kan ikke vises akkurat nå. |
| `explanationUnavailable` | The explanation for this question is no longer available. Your answer is kept. | Forklaringen til denne oppgaven er ikke lenger tilgjengelig. Svaret ditt er tatt vare på. |
| `summaryNote` | Help is part of learning. Questions worth revisiting are good candidates for a little more practice, whenever you choose. | Hjelp er en del av læringen. Oppgaver som er verdt å se på igjen, er gode kandidater for litt mer øving – når du selv ønsker det. |
| `practiseMore` | Practise more | Øv mer |
| `practiseMoreNote` | More practice does not change the result of this check. | Mer øving endrer ikke resultatet av denne sjekken. |
| `again` | Take a new check | Ta en ny sjekk |
| `recordTitle` | Checks | Sjekker |
| `recordCounts` | {correct} correct on your own, {revisit} worth revisiting, {skipped} skipped | {correct} riktig på egen hånd, {revisit} verdt å se på igjen, {skipped} hoppet over |
| `recordSupported` | {n} as supported practice from question {i} | {n} som øving med hjelp fra oppgave {i} |
| `recordNotAnswered` | {n} not answered | {n} ikke besvart |
| `recordUnfinished` | Unfinished, at question {n} of {total} | Ikke ferdig, på oppgave {n} av {total} |

`groupCount`, `recordCounts`, and `recordSupported` need the singular for 1 ("1 question" / "1 oppgave"). As with spec 002's `record.summaryOne`, each gets a `…One` key or the sentence is built from per-count parts. The tasks choose which; the parity and wording tests cover both.
