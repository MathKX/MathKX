# Quickstart: Self-Checks ("Check My Understanding")

Phase 1 of [plan.md](plan.md). How to run, test, and prove this feature. Prerequisites and the run commands are those of [spec 005's quickstart](../005-repeats-and-sessions/quickstart.md): .NET 10 SDK, Node 20, and `npm ci` at the root and in `src/web`.

## Run

```bash
npm run validate
```

```bash
cd src/web && npm run build && cd ../backend && dotnet build MathKX.Api
```

```bash
cd src/web && dotnet run --project ../backend/MathKX.Api --no-build --urls http://localhost:5080
```

Open http://localhost:5080/lessons/number-bonds-to-ten and choose "Check my understanding".

## Automated checks

| Command | Proves |
| --- | --- |
| `npm test` (root) | The pilot check passes; each case in [contracts/check-content.md](contracts/check-content.md) fails with file, field, and problem (SC-004) |
| `dotnet test src/backend/MathKX.slnx` | Checks load; broken references stop the load; every check question resolves and is distinct; the pilot is `7 + 3`, `5 + 4`, `8 + 5`, `9 + 4`; the three endpoints ([contracts/api.md](contracts/api.md)) |
| `npm test` (`src/web`) | The grouping matrix (SC-002); the run's absences, switch, supported part, saving, guidance, and failures; resume after a reload and a language switch; "My work" separation; dictionary parity, literals, and wording |
| `npx playwright test e2e/checks.spec.ts` (`src/web`, after the build) | The scenarios below on the desktop and iPad projects |

CI runs all of them on every pull request. The run must stay under 10 minutes (SC-007); record the time of the first PR with the end-to-end checks in this file.

## Scenarios

Each starts from a cleared record (`localStorage.clear()`), in English unless stated. `e2e/checks.spec.ts` automates scenarios 1 to 5; scenario 6 is for a person.

### 1. An independent check with an honest summary (User Story 1, SC-001)

1. From the lesson, choose "Check my understanding". The start screen names "Number bonds and addition" and its scope, says "4 questions", and shows the five policy sentences, including the switch and the snapshot sentence.
2. Choose "Start the check". The address becomes `/checks/numbers.addition.check-within-20/{runId}`. It shows "Question 1 of 4" and `7 + 3`, with "Save answer", "Skip", and "I need help" and nothing else.
3. Type `4+4` and save: the input guidance appears, the question stays, and nothing is saved.
4. Answer `10` (correct), `9` (correct), `12` (wrong), and skip question 4. After each save, the next question appears with no result.
5. Throughout steps 2 to 4, check the requests: none to `/steps/`, `/answer`, `/api/lessons/*/content`, or `/api/visuals`. The page and its accessibility tree contain no "Correct", "Not correct yet", or feedback text.
6. The summary appears with focus on its heading:
   - 2 correct on your own: `7 + 3` and `5 + 4`.
   - 1 worth revisiting: `8 + 5`, "Your answer: 12", "Correct answer: 13".
   - 1 skipped: `9 + 4`, "Correct answer: 13".
   - The tag "Worth revisiting" appears once.
   - No score, fraction, or percentage. The snapshot sentence, "Practise more" with its note, and "Take a new check" are present.
7. Open the explanation of `8 + 5`: its steps show. Reload: the summary is the same, and the run's record has no `explanation-open` or step event.
8. Repeat in Norwegian: the same counts, with the Norwegian texts.

### 2. The switch (User Story 2)

1. Start a check. Save `11` for question 1 (wrong) and skip question 2.
2. On question 3, choose "I need help". The confirmation says "From question 3 on…". Choose "Continue without help": nothing changes and nothing is recorded.
3. Choose "I need help" again, then "Switch to supported practice". Question 3 shows help, "Check answer", and "Skip", with "Supported practice (from question 3)".
4. Open visual help and answer `13`: feedback appears, and only "Next question" is offered.
5. Question 4: answer `12`, then `13`. Choose "See summary".
6. The summary shows:
   - the independent part: 0 correct on your own, 1 worth revisiting (`7 + 3`), and 1 skipped (`5 + 4`);
   - "Supported practice (from question 3)" with `8 + 5` "Correct with visual help" and `9 + 4` "Correct after feedback";
   - neither supported question tagged "Worth revisiting".

### 3. Resume, reload, and a new check (User Story 4)

1. Start a check, save question 1 and question 2, and type `5` into question 3 without saving.
2. Reload: question 3 is shown with `5` in the field, in the independent part.
3. Switch the language: the question, the draft, and the position stay, in Norwegian.
4. Go to "My work". Under "Addition within 20", "Checks" shows the run as unfinished at question 3 of 4, with no counts. Practice's sentence is "No questions practised yet."
5. Choose "Continue the check": question 3 with its draft.
6. Go to "Check my understanding" again. The start screen says a check is unfinished at question 3 of 4 and offers "Continue the check" beside "Start the check". Choose "Start the check".
7. The new run starts at question 1. In "My work", the old run shows its counts for questions 1 and 2 and "2 not answered", and its summary lists questions 3 and 4 under "Not answered", not under "Skipped".

### 4. Separation from practice (FR-014)

1. Practise three questions, leave the fourth unanswered with a draft, and note "My work"'s sentence for the skill.
2. Take and finish a check.
3. "My work"'s practice sentence, repeat sentences, and question list are unchanged. "Practise more" resumes the fourth practice question with its draft. "Finish practice" then summarizes only practice questions.

### 5. Keyboard and targets (User Story 5, SC-005)

With the keyboard only, on both projects:
1. Start the check.
2. Save question 1.
3. Open "I need help" (focus on the confirmation heading) and switch.
4. Answer question 2 with help.
5. Finish (focus on the summary heading).
6. Open one explanation.

Every control shows focus. On the iPad project, every new control is at least 44 by 44.

### 6. With a person (SC-006; recorded as findings, not scores)

With the initial learner, in the same session as the carried-forward learner checks (close-out review, DL-041):
- before starting, they say what help the check allows;
- after the summary, they say which questions are worth revisiting and that the check is not a final judgement.

Record the findings in a walkthrough under `docs/reviews/walkthroughs/`.
