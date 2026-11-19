# Walkthrough: self-checks (spec 006), local and production

**Date**: 2026-11-19. **Who**: the implementing session (Claude Opus 5.5), not a learner. **What**: two spec 006 tasks:
- **T056**: quickstart scenarios 1 to 5 by hand on the built app and service.
- **T058**: the pilot check on the production URL in both languages, with a switch on question 3, and "My work" and "Continue the check" there.

**Builds**:
- **Local**: `http://localhost:5080`, merge commit `1e9bbb5` (PR 56).
- **Production**: `https://matkxv2.azurewebsites.net` (Azure App Service `matkxv2`, Norway East), the same commit from deploy run 44473848395, which passed with its health check.

**Browser**: the Chromium-based browser pane of the Claude desktop app on Windows 11 (Chrome 156), 1024 by 768, in dark mode.

**Method**:
- **Scenarios 1 to 4** were driven through the page's own controls, by script.
- **Scenario 5** used real keystrokes in the pane (Tab, Shift+Tab, Enter, Escape, typing).
- **Results** were read from the DOM, the focused element and its computed focus style, the `localStorage` guest record, and the browser's resource timing.

**Not done**: a physical iPad, VoiceOver, or a learner session (SC-006). The 44-by-44 targets were measured by end-to-end check 5 on the iPad project in CI, not here.

## Local: quickstart scenarios 1 to 5

| Scenario | Result | Notes |
| --- | --- | --- |
| 1. An independent check, English | pass | See "Scenario 1 in detail" below |
| 1. The same check, Norwegian | pass | The same groups with the Norwegian texts ("Sjekk forståelsen: Tiervenner og addisjon", "Riktig på egen hånd", "Verdt å se på igjen", "Hoppet over"); «4+4» gives "Vi kunne ikke lese «4+4» som et helt tall. Skriv et tall, for eksempel 8." |
| 2. The switch | pass | See "Scenario 2 in detail" below |
| 3. Resume, reload, and a new check | pass | See "Scenario 3 in detail" below |
| 4. Separation from practice | pass | See "Scenario 4 in detail" below |
| 5. Keyboard | pass | See "Scenario 5 in detail" below |

### Scenario 1 in detail

**The start screen**: "Check your understanding: Number bonds and addition", "What this checks: Addition within ten and across ten", "4 questions", and the five policy sentences.

**The independent part**:
- **Controls**: "Question 1 of 4" with `7 + 3` and only "Save answer", "Skip", and "I need help", with focus on the question.
- **Unreadable input**: `4+4` gives the guidance and keeps question 1. The record holds it as an `input-guidance` event, not an answer.
- **Moving on**: after 10, 9, and 12, each next question took focus, with no result and no feedback text.
- **Requests**: four validations, and none to `/steps/`, `/answer`, lesson content, or visuals.

**The summary**: focus on "Your check".
- **Groups**: 2 correct on your own (`7 + 3`, `5 + 4`); 1 worth revisiting (`8 + 5`, "Your answer: 12", "Correct answer: 13"); 1 skipped (`9 + 4`, "You skipped this question.", "Correct answer: 13").
- **Tags and wording**: one "Worth revisiting" tag, and no fraction or percentage.
- **The closing lines**: the snapshot sentence, "Practise more" with "More practice does not change the result of this check.", and "Take a new check".
- **The explanation**: opening `8 + 5`'s explanation showed "Step 1 of 4" and left the record unchanged.
- **After a reload**: the summary text was identical, and the run held no support or explanation event.

### Scenario 2 in detail

**Before the switch**: 11 was saved for question 1 and question 2 was skipped.

**The confirmation**, as a dialog with focus on its heading:
- **Heading**: "Switch to supported practice?"
- **Body**: "From question 3 on, you get visual help, explanations and feedback. …".
- **Continue without help**: left the record unchanged and returned focus to "I need help". This reading was taken in scenario 3's run, because a script timeout lost the first one; both runs reach question 3 the same way.

**The supported part**:
- **The mode**: "Supported practice (from question 3)".
- **Question 3**: visual help, then 13. Only "Next question" was offered.
- **Question 4**: 12, then 13.

**The summary**:
- **Independent part**: 0 correct on your own, 1 worth revisiting (`7 + 3`, "Your answer: 11"), and 1 skipped (`5 + 4`).
- **"Supported practice (from question 3)"**: `8 + 5` "Correct with visual help", and `9 + 4` "Correct after feedback" with "Your answer: 12, 13". Neither carries the "Worth revisiting" tag.

### Scenario 3 in detail

**Leaving question 3**:
- **Before**: 10 and 9 were saved, and 5 was typed into question 3.
- **A reload**: kept "Question 3 of 4", "On your own", and the draft 5.
- **Norwegian**: kept "Oppgave 3 av 4", "På egen hånd", and 5.

**"My work"** listed it under "Addition within 20" → "Checks" as "Unfinished, at question 3 of 4". It had no counts and no link, and "No questions practised yet." stood beside it.

**Continuing**:
- **From "My work"**: "Continue the check" returned to the same address, at question 3, with the draft 5.
- **From the start screen**: it said "You have a check you have not finished, at question 3 of 4.", with "Continue the check" and "Start the check".

**A new check**:
- **The new run**: "Start the check" began it at question 1 with an empty field.
- **"My work"**: listed "Unfinished, at question 1 of 4" and the old run as "2 correct on your own, 0 worth revisiting, 0 skipped, 2 not answered".
- **The old run's summary**: listed `8 + 5` and `9 + 4` under "Not answered", with "You started a new check before answering these questions.", each with "Not answered" and "Correct answer: 13". It showed 0 skipped.

### Scenario 4 in detail

**Practice first**: three practice questions were answered and a fourth left with the draft 1. "My work" read "4 questions: 3 correct on first response, no help, 1 unfinished", with one lesson line and four question lines.

**After a check**: a check with four correct answers was finished. Practice's summary, repeat, lesson, and question lines were identical, and the check was listed apart as "4 correct on your own, 0 worth revisiting, 0 skipped".

**Back to practice**:
- **"Practise more"**: from that run's summary, it resumed the fourth practice question with its draft.
- **"Finish practice"**: summarized "4 questions: 3 correct on first response, no help, 1 unfinished".

### Scenario 5 in detail

| Step | Focus |
| --- | --- |
| Start the check | the question |
| Save question 1 | the next question |
| Save question 2 with Enter | the next question |
| "I need help" | the confirmation's heading |
| Escape | back on "I need help", with nothing recorded |
| Enter, Tab, Enter ("Switch to supported practice") | the question, now in the supported part |
| "Show visual help" | help opens and focus stays on the toggle |
| Shift+Tab twice, 13, Enter | the result region |
| "Next question" | question 4 |
| "See summary" | "Your check" |
| The first "Show explanation" | its first step shows, with `aria-expanded="true"` |

Every control reached by Tab showed a 2.4-pixel outline with a 3-pixel ring. The prompt and the summary heading showed their own outlines.

## Production: the pilot check and "My work"

**Before the run**:
- **Health**: `/api/health` reported ok with nine skills, three definitions, one lesson, and one check.
- **The build**: the page loaded the new bundle (`index-C4OlkFXA.js`). It contains "before answering these questions", the wording fixed in PR 55's review.
- **The record**: the guest record in this pane had no questions, no checks, and one lesson view.

| Check | nb | en | Notes |
| --- | --- | --- | --- |
| The start screen | pass | pass | "Sjekk forståelsen: Tiervenner og addisjon" / "Check your understanding: Number bonds and addition", "4 oppgaver" / "4 questions", five policy sentences |
| The independent part | pass | pass | Only "Lagre svaret", "Hopp over", "Jeg trenger hjelp" / "Save answer", "Skip", "I need help"; focus on the question; no result text; no request to steps, answers, lesson content, or visuals |
| The switch on question 3 | pass | pass | The confirmation "Bytte til øving med hjelp?" / "Switch to supported practice?" with focus on its heading; then "Øving med hjelp (fra oppgave 3)" / "Supported practice (from question 3)", visual help, and feedback on "Check answer" |
| The summary | pass | pass | See below; focus on "Sjekken din" / "Your check"; the snapshot sentence; no fraction or percentage |
| "My work" | — | pass | See below |
| "Continue the check" | — | pass | From "My work" and from the start screen, to the same address, at question 2 with the draft 8 |

**The summaries**:

| Part | nb | en |
| --- | --- | --- |
| The answers given | `10`, skip, then visual help and 13 on question 3, and 12 then 13 on question 4 | `11`, `9`, then visual help and 13 on question 3, and 13 on question 4 |
| Correct on your own | 1 (`7 + 3`) | 1 (`5 + 4`) |
| Worth revisiting | 0 | 1 (`7 + 3`) |
| Skipped | 1 (`5 + 4`) | 0 |
| Supported practice (from question 3) | `8 + 5` "Riktig med visuell hjelp", `9 + 4` "Riktig etter tilbakemelding" | `8 + 5` "Correct with visual help", `9 + 4` "Correct on first response, no help" |

**"My work"**: after a third check was started (question 1 saved, 8 typed into question 2), "Addition within 20" → "Checks" listed, newest first:
- "Unfinished, at question 2 of 4", with "Continue the check" and no link;
- "1 correct on your own, 1 worth revisiting, 0 skipped, 2 as supported practice from question 3";
- "1 correct on your own, 0 worth revisiting, 1 skipped, 2 as supported practice from question 3".

Each finished run's date links to its summary. "Check my understanding" follows the runs, and practice's line reads "No questions practised yet."

## Findings to carry forward

- **Self-checks work locally and in production in both languages.** That covers the independent part, the switch, the summary, "My work", and "Continue the check", and the quickstart's quoted wording matches the dictionaries. One phrase in `contracts/summary.md`, "Show the explanation", was corrected to the app's "Show explanation".
- **Run links can share a name.** Two runs finished on the same day have the same link name, "Your check from 19 November 2026". The counts beside each link tell them apart in context, but a screen reader's list of links reads them alike. Adding the time to the name would separate them. This is left for a later change, because the contract names the link by date only.
- **Moving on during "Check answer" is ignored.** In the supported part, "See summary" or "Next question" pressed while a "Check answer" request is in flight does nothing, as in practice's "Another question". The button stays enabled. The window is the request's duration; only a script hit it here.
- **Test data stays in the pane.** On production, the guest record in this pane now holds three check runs and one lesson view. "My work" → "Clear my work" clears it.
- **Still open**: the learner check of SC-006 (quickstart scenario 6), alongside the learner checks carried forward by DL-041, and a physical iPad with VoiceOver.
