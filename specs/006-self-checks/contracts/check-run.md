# Contract: Taking a Check

Part of [plan.md](../plan.md) Phase 1. Research R6 to R10; spec User Stories 1, 2, 4 and 5, FR-001 to FR-008, FR-013, FR-015, FR-021 to FR-023.

## Entry: "Check my understanding"

`CheckEntry` takes a skill ID and the list from `GET /api/checks`. For each check of that skill, it shows a link `check.entry` ("Check my understanding" / "Sjekk forståelsen min") to `/checks/{checkId}`, `data-testid="check-entry-{checkId}"`. With several checks for a skill, each link also names the check's title. Where it appears:
- **Lesson page**: once, below the lesson's practice entries, for each check of a skill in the lesson's `skills`.
- **Practice page**: below "Finish practice", for the checks of the page's skill.
- **"My work"**: in each skill group, in the checks part ([summary.md](summary.md)).

If the list cannot be loaded, no entry is shown and nothing else changes.

## `/checks/{checkId}`: the start screen (`CheckStartPage`)

| Part | Content |
| --- | --- |
| Heading (`PageHeading`) | `check.titlePrefix`: the check's title in the selected language |
| Scope | `check.scope` with the scope sentence |
| Size | `check.count` with the number of questions |
| Policy, under `check.policyTitle` | `check.policyIndependent`, `check.policyFeedback`, `check.policySwitch`, `check.policyAccess`, `check.policySnapshot` |
| Unfinished run of this skill | `check.unfinished` ("You have a check you have not finished, at question {n} of {total}."), with "Continue the check" (`check.continue`) to its run |
| Action | "Start the check" (`check.start`), `data-testid="check-start"` |
| Unknown check, or the list cannot be loaded | `check.unavailable`, with a link to the lessons |

"Start the check" calls `store.startCheck(checkId)`:
1. **The check**: its newest version comes from `GET /api/checks`.
2. **Ends the old run**: an unfinished run of the same skill gets `endedAt`. Its remaining questions are then "not answered" ([summary.md](summary.md)).
3. **Creates the run**: a new run with a copy of the question list, `switchAt: null`, and `resume` empty.
4. **Shows the first question**: the address is replaced with `/checks/{checkId}/{runId}`, and the run page loads question 1.

Leaving the start screen records nothing. A practice question in progress stays resumable, because the check never touches practice's current question (research R8).

## `/checks/{checkId}/{runId}`: the run (`CheckRunPage`)

The page shows the run's summary when the run is finished or ended. Otherwise, it shows the question at the run's `position` in its part. Mounting it marks the check view as presenting; unmounting ends presenting and keeps `resume`. An unknown run ID shows `check.runNotFound` with a link to "My work".

### Independent part (`IndependentQuestion`)

| Element | Text or behaviour | `data-testid` |
| --- | --- | --- |
| Mode | `check.modeIndependent` | `check-mode` |
| Position | `check.position`: "Question {n} of {total}" | `check-position` |
| Prompt | `AdditionPrompt`, the same accessible expression as practice | `prompt` |
| Answer field | label `practice.answerLabel`, numeric input mode | `answer` |
| Save | `check.save`: saves and moves on (below) | `check-save` |
| Skip | `check.skip`: records `skipped` and moves on | `check-skip` |
| I need help | `check.needHelp`: opens the confirmation | `check-need-help` |
| Input guidance | after an `invalid-response`: spec 002's feedback text for its code, `role="status"` | `check-guidance` |
| Not saved | after a failed request: `check.unsaved`, `role="alert"`, draft kept | `check-unsaved` |

**Never present in the independent part**, whether in the DOM, the accessibility tree, or a request:
- visual help, the explanation, the lesson link, or any step;
- any result or status text ("Correct", "Not correct yet", the misconception feedback), and the summary's counts;
- "Another question", "Repeat this question", "Make it easier", "More challenge", and "More like this".

**Requests allowed**: `GET /api/checks`, `GET /api/instances/...` (the question itself), and `POST /api/validations`. Nothing under `/steps/`, `/answer`, `/api/lessons/{id}/content`, or `/api/visuals`.

**Saving** (research R6):
1. **Request**: `POST /api/validations` with the identity, the draft, and a new submission ID; the "Save" button is disabled while it is under way.
2. **Input guidance**: on `invalid-response`, the `input-guidance` event is recorded, the guidance is shown, and the learner stays on the question with the draft.
3. **A result**: on `correct` or `incorrect`, the `submission` event is recorded as the question's only submission, and `position` advances. The response is never put in rendered state.
4. **Failure**: on a failed request, nothing is recorded, `check.unsaved` is shown, and the draft stays.

**Skipping** records `skipped` on the delivery and moves on.

**Moving on** advances `position`, clears `resume` for the new question, and requests its instance. A save or skip on the last question sets `finishedAt` instead, and the summary appears with focus on its heading. A question whose instance cannot be loaded shows `practice.loadError` with "Try again" (`check-retry`); the run stays at that position.

### The switch (FR-007, FR-008)

"I need help" opens an inline confirmation (`role="dialog"`, `aria-labelledby` its heading, `data-testid="check-switch"`), with focus on its heading:
- **Heading**: `check.switchTitle`.
- **Body**: `check.switchBody`, with `{i}` set to the current position.
- **Actions**: "Switch to supported practice" (`check.switchYes`, `check-switch-yes`) and "Continue without help" (`check.switchNo`, `check-switch-no`).

"Continue without help" closes the confirmation, records nothing, and returns focus to "I need help". "Switch" sets `switchAt` to the current position. That cannot be undone in this run. The current question's draft is kept, and the question is shown at once in the supported part. Escape closes the confirmation as "Continue without help" does.

### Supported part (`QuestionWorkspace` with the check's controls)

From `switchAt` onward, each question is practice (spec 002, spec 003):
- **The workspace**: help before answering, "Check answer" with feedback and retries, the explanation after a result, and the lesson link (below). Every event is recorded on the run's delivery with practice's rules, including "a step is recorded only when it is shown".
- **Mode**: `check.modeSupported`, "Supported practice (from question {i})", and the position, as in the independent part.
- **Before any submission**: only "Skip" (`check.skip`), which records `skipped` and moves on.
- **After a submission**: only "Next question" (`check.next`, `check-next`), which advances `position`, or "See summary" (`check.finish`, `check-finish`) on the last question, which sets `finishedAt`.
- **What counts as answered**: the summary reads only the delivery's events (data-model "Answered"). A supported question with a submission is answered whether or not the learner pressed "Next question" or "See summary", so a run ended by a new check keeps its outcome.
- **Never offered**: "Another question", "Repeat this question", "Make it easier", "More challenge", and "More like this".

**The lesson link** goes to `/lessons/{id}?from=check`. The lesson page then takes the run's current supported question as the detour question, as spec 003 does for practice:
- the gate when the lesson shows the answer;
- `lesson-opened` or `lesson-reveal` recorded on that delivery once the lesson is shown;
- "Back to your question" to `/checks/{checkId}/{runId}`.

Every other lesson visit follows spec 003 unchanged, about practice's current question (research R10).

## Resuming (FR-015)

`resume` on the run holds the current question's draft, open panels, step indices, and, in the supported part, its result. It is updated with every change, so it survives:
- **A reload**: the run page restores the question from the run, fetches its instance and the steps reached again without recording them, and shows the draft.
- **A language switch**: the store keeps the run and its screen state; every text changes language.
- **Leaving and coming back**: from "My work" or the start screen, "Continue the check" goes to the run's address, with the same restoration.

Focus lands on the prompt when a question appears after an action or a navigation. A page loaded directly keeps the browser's own start, as in practice.

## Clearing

"Clear my work" empties `checkRuns` and the check screen state with the rest of the record.

## Texts (`check` section of the dictionaries)

| Key | en | nb |
| --- | --- | --- |
| `entry` | Check my understanding | Sjekk forståelsen min |
| `titlePrefix` | Check your understanding: {title} | Sjekk forståelsen: {title} |
| `scope` | What this checks: {scope} | Dette sjekkes: {scope} |
| `count` | {n} questions | {n} oppgaver |
| `policyTitle` | Before you start | Før du begynner |
| `policyIndependent` | You answer on your own. Visual help, explanations and lessons are not available during the check. | Du svarer på egen hånd. Visuell hjelp, forklaringer og leksjoner er ikke tilgjengelige under sjekken. |
| `policyFeedback` | You see how it went when you finish, with explanations. You save one answer per question. | Du får vite hvordan det gikk når du er ferdig, med forklaringer. Du lagrer ett svar per oppgave. |
| `policySwitch` | If you need help along the way, you can switch to supported practice. Answers you have already saved still count as your own. The rest become supported practice. | Trenger du hjelp underveis, kan du bytte til øving med hjelp. Svarene du allerede har lagret, telles fortsatt som dine egne. Resten blir øving med hjelp. |
| `policyAccess` | Keyboard, screen readers and zoom work as usual and do not count as help. There is no time limit. | Tastatur, skjermleser og zoom fungerer som vanlig og regnes ikke som hjelp. Det er ingen tidsbegrensning. |
| `policySnapshot` | A check is a snapshot, not a final judgement of what you know. | En sjekk er et øyeblikksbilde, ikke en endelig vurdering av hva du kan. |
| `start` | Start the check | Start sjekken |
| `continue` | Continue the check | Fortsett sjekken |
| `unfinished` | You have a check you have not finished, at question {n} of {total}. | Du har en sjekk du ikke er ferdig med, på oppgave {n} av {total}. |
| `unavailable` | This check cannot be shown just now. | Denne sjekken kan ikke vises akkurat nå. |
| `runNotFound` | This check is not in your work in this browser. | Denne sjekken finnes ikke i arbeidet ditt i denne nettleseren. |
| `modeIndependent` | On your own | På egen hånd |
| `modeSupported` | Supported practice (from question {i}) | Øving med hjelp (fra oppgave {i}) |
| `position` | Question {n} of {total} | Oppgave {n} av {total} |
| `save` | Save answer | Lagre svaret |
| `skip` | Skip | Hopp over |
| `next` | Next question | Neste oppgave |
| `finish` | See summary | Se oppsummeringen |
| `needHelp` | I need help | Jeg trenger hjelp |
| `switchTitle` | Switch to supported practice? | Bytte til øving med hjelp? |
| `switchBody` | From question {i} on, you get visual help, explanations and feedback. Answers you saved before this still count as your own. Question {i} and the rest become supported practice. You cannot switch back in this check. | Fra oppgave {i} får du visuell hjelp, forklaringer og tilbakemelding. Svarene du lagret før dette, telles fortsatt som dine egne. Oppgave {i} og resten blir øving med hjelp. Du kan ikke bytte tilbake i denne sjekken. |
| `switchYes` | Switch to supported practice | Bytt til øving med hjelp |
| `switchNo` | Continue without help | Fortsett uten hjelp |
| `unsaved` | Your answer could not be saved just now. It is kept; try again. | Svaret ditt kunne ikke lagres akkurat nå. Det er tatt vare på; prøv igjen. |

The summary's keys are in [summary.md](summary.md). Both dictionaries gain every key, enforced by the dictionary-parity test. The literal and wording checks cover the new components.
