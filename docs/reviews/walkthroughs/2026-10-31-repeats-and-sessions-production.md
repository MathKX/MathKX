# Walkthrough: repeats and sessions (spec 005), production

**Date**: 2026-10-31. **Who**: the implementing session (Claude Opus 5.5), not a learner. **What**: spec 005 task T037: repeat avoidance and "Repeat this question" on the production URL in both languages, plus "Finish practice". T037 asked for a check after the first merge (PR 44) and another after PR 45. Both were made only now, once with every release deployed. **Where**: `https://matkxv2.azurewebsites.net` (Azure App Service `matkxv2`, Norway East). The build was merge commit `b1ee2f0` (PR 48), from deploy run 41221529985, which passed with its health check. The browser was the Chromium-based browser pane of the Claude desktop app on Windows 11 (Chrome 152), with a viewport of 746 by 726. Questions were moved on and answered through the page's own controls, by script, and the results were read from the DOM, the `localStorage` guest record, and the browser's resource timing. **Not done**: a physical iPad, VoiceOver, or a learner session (SC-005).

Before the run, `/api/health` reported ok with nine skills, three definitions, and one lesson. The page loaded the new build: its bundle contains "This variation has no other questions right now, so this one repeats." The guest record in this pane had no questions and one lesson view.

## Repeat avoidance: 20 × "Another question" within ten

| Check | nb | en | Notes |
| --- | --- | --- | --- |
| No question repeats one of the eight before it, in either order | pass | pass | 21 questions in each language, checked pair by pair against the previous eight |
| At most two instance requests per question | pass | pass | nb: 28 requests for 21 questions; en: 26 |
| At most one pool request | pass | pass | nb: one request to `/api/definitions/numbers.addition.within-10/1/pool`; en: none, because the pool was already loaded in the same page |
| No pool-exhausted notice | pass | see below | The 45-question pool is never exhausted by eight. In English, a different notice was still showing; see "Finding" |

The sequences were:
- **nb**: `9+1 8+2 2+4 1+2 5+4 7+1 4+1 2+6 4+6 3+7 3+4 2+7 5+1 1+9 5+3 5+4 5+2 1+3 7+3 8+1 1+7`;
- **en**, starting from the resumed `1+7`: `1+7 2+3 6+3 5+3 3+4 1+5 5+4 2+2 3+3 3+1 2+8 4+4 3+7 8+1 2+4 1+2 2+3 2+5 4+1 2+2 6+4`.

Repeats further apart than eight do happen. In Norwegian, `5+4` came back after eleven questions, and "My work" counts it as a repeat by chance, as spec 004 does.

## "Repeat this question", "My work", and replay

In each language, the question on screen was answered wrongly, then with visual help opened and correctly, then repeated and answered at once.

| Check | nb | en | Notes |
| --- | --- | --- | --- |
| The button after a response | pass | pass | "Gjenta denne oppgaven" / "Repeat this question"; its absence before a response was checked only in the local run |
| The same question again, with an empty field and help closed | pass | pass | nb `1 + 7`, en `6 + 4` |
| The repeat's outcome and tag | pass | pass | "Correct on first response, no help" with "Gjentatt etter ønske" / "Repeated on request"; the first question kept "Wrong answer first" and "Visual help" |
| The skill's sentences in "My work" | pass | pass | nb, after the first repeat: "22 oppgaver: 1 riktig på første svar, uten hjelp, 1 riktig med visuell hjelp, 20 hoppet over", "2 av dem var en oppgave du hadde hatt før.", "1 av disse gjentok du med vilje." en, later: "14 of them repeated a question you had already had.", "3 of these you repeated on purpose."; no score, streak, mastery word, or `%` |
| "Repeat this question" from the first question's replay | pass | pass | Back on the practice page with the same question and an empty field |

## "Finish practice"

| Check | nb | en | Notes |
| --- | --- | --- | --- |
| The summary, with focus on its heading | pass | pass | nb: "Øvingsøkten din", "23 oppgaver: 1 riktig på første svar, uten hjelp, 1 riktig med visuell hjelp, 20 hoppet over, 1 uferdig", with the replay's unanswered repeat as the unfinished question. en: "Your practice session", "23 questions: 2 correct on first response, no help, 1 correct with visual help, 20 skipped" |
| "Practise again" resumes an unfinished question | pass | — | nb: back on `1 + 7`, the unanswered repeat |
| "Practise again" after an answered question gives a new one | — | pass | A new question, with an empty field and no notice |

## Finding: the resumed notice outlived its question

After "Øv igjen" resumed `1 + 7`, the notice "Du fortsetter der du slapp." / "You continue where you left off." was still on screen 20 skipped questions later, after the switch to English. The notice dates from spec 002, where it was cleared only when an answer was checked. Spec 005 makes resuming common, because every "Practise again" on an unfinished question resumes it.

**Fixed in the spec 005 polish PR**: the next question now clears the notice, as it already cleared the pool notice. The rule is recorded in `specs/005-repeats-and-sessions/contracts/session.md`, with a new test 13 in `src/web/tests/session.test.tsx`; that test failed before the fix. Production keeps the old behaviour until that PR deploys.

## Findings to carry forward

- Repeat avoidance, "Repeat this question" (also from a replay), and "Finish practice" work in production in both languages.
- The run left the guest record in this browser pane, which is test data only, with 46 questions and one lesson view. "My work" → "Clear my work" clears it.
