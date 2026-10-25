# Walkthrough: the progress view (spec 004), production

**Date**: 2026-10-25. **Who**: the implementing session (Claude Opus 5.5), not a learner. **What**: spec 004 task T042, in two parts:
- **First release**: "My work" on the production URL in both languages after PR 36 (merge commit `f987903`) deployed, checking that the skill names render from the deployed content.
- **Second release**: the lesson history, after PR 38 (merge commit `21605ea`) deployed; see "Lesson history" below. **Where**: `https://mathkx-fncxfxehfrd0fsfw.norwayeast-01.azurewebsites.net` (Azure App Service, Norway East; deploy run 40178202816, all five jobs and the health check passed), in the Chromium-based browser pane of the Claude desktop app on Windows 11 (Chrome 152), viewport 1024 by 768. Checks were made by clicking as a learner would and reading the page's DOM, its `localStorage` guest record, and the browser's resource timing. **Not done**: a physical iPad, VoiceOver, or a learner session (SC-005).

Before the run, the service answered `/api/health` with nine skills, and `/api/skills` with all nine skills in ID order, each with the reviewed name in both languages (for example `numbers.addition-within-20`: "Addisjon opp til 20" / "Addition within 20"). The page loaded the new build (its bundle contains "Vis oppgavene" and the singular "{questions} oppgave:"), and the app shell was served with `Cache-Control: no-cache`.

**The record used**: the guest record this browser pane kept from the spec 003 production walkthrough (2026-10-24). It has 143 questions and no `lessonViews` field, so the run also showed that a record written before this feature loads without loss (the first half of quickstart scenario 4):
- 140 skipped while drawing questions;
- the two `5 + 8` answered after the lesson showed the answer;
- the unanswered `3 + 7`, still the question in progress.

## "My work"

| Check | nb | en | Notes |
| --- | --- | --- | --- |
| Reached from the header link; focus on the page heading | pass | — | Focus on the `h1` "Mitt arbeid" after the click (`PageHeading`) |
| Skill shown by its name from the deployed content | pass | pass | "Addisjon opp til 20" / "Addition within 20"; one request to `/api/skills`; no skill ID anywhere on the page |
| The old record loads complete | pass | pass | All 143 questions listed; storage schema 1 kept; nothing discarded |
| Spec 002's count sentence, fixed outcome order | pass | pass | "143 oppgaver: 2 besvart etter at svaret ble vist, 140 hoppet over, 1 uferdig" / "143 questions: 2 answered after the answer was shown, 140 skipped, 1 unfinished"; no `%` |
| Repeats counted and tagged | pass | pass | "85 av dem var en oppgave du hadde hatt før." / "85 of them repeated a question you had already had."; 85 questions tagged "Repeated question" (140 draws from the 81 pilot questions) |
| "Show the questions", newest first | pass | pass | First item "3 + 7 Unfinished", date "24 October 2026", with "Continue"; a `5 + 8` shows "Answers: 13" with "Visual help", "Answer shown in the lesson", and "Repeated question" |
| A language switch keeps the list open | — | pass | Opened in Norwegian, switched to English: still open, every label in English, `<html lang="en">` |
| "Continue" resumes the question in progress | — | pass | Back on `/practice/numbers.addition-within-20` with "3 plus 7. What is the sum?"; the same current delivery, no event added, still 143 questions |

## Findings to carry forward

- The first release works in production in both languages, and the skill names come from the deployed content.
- The draws that produced this record skipped 140 questions. "My work" now makes that visible: 140 "skipped" and 85 repeats. This is spec 002's derivation reported honestly, not a fault in the view.
- The first-release run left the guest record in this browser pane unchanged: still 143 questions, no lesson views.

## Lesson history (second release)

**Where**: the same production URL after PR 38 (merge commit `21605ea`) deployed (deploy run 40187813331, all five jobs and the health check passed), in the same browser pane and viewport. The page loaded the new build: its bundle contains "viewed once, on" and "vist én gang".

**The record**: the same guest record, still without a `lessonViews` field, and with `3 + 7` as the unanswered question in progress. The lesson shows `3 + 7 = 10`, so a visit to it was first a detour behind spec 003's notice.

| Step | Result | Notes |
| --- | --- | --- |
| The lesson from the list, with `3 + 7` unanswered | pass | The notice "This lesson shows the answer to 3 + 7"; no content request |
| "Cancel" | pass | Back on `3 + 7`; no view recorded (`lessonViews` now present and empty, so the old record took the new field without losing anything), no lesson event on the question |
| Answer `10` | pass | "Correct. 3 + 7 = 10."; the question no longer sends a lesson visit behind the notice |
| The lesson from the list, in English | pass | The lesson shown; one view `{ lessonId: "number-bonds-to-ten", language: "en" }`; no lesson event on the answered question |
| Switch to Norsk on the lesson | pass | "Tiervenner – tall som blir 10" and its sections in Norwegian; still one view |
| "Mitt arbeid" | pass | Focus on the heading. Under "Addisjon opp til 20" and under "Tiervenner": "Tiervenner – tall som blir 10: vist én gang, 25. oktober 2026"; the note "At en leksjon er vist, betyr at du åpnet den, ikke at du har forstått den." once, after the first line; "Tiervenner" shows "Ingen oppgaver øvd ennå." and no question list |
| The lesson again from the list, in Norwegian | pass | A second view, language `nb` |
| "My work" in English | pass | Under "Addition within 20" and under "Number bonds to ten": "Number bonds to ten: viewed 2 times, last on 25 October 2026"; the note "A view shows that you opened the lesson, not that you understood it." once; "No questions practised yet." for number bonds; no score, streak, mastery word, or `%` |

## Findings from the lesson-history run

- The second release works in production in both languages. A view is recorded only when the lesson is shown: not behind the notice, and not on a language switch.
- A lesson teaching two skills appears under both. Number bonds, never practised, is listed with its lesson and an honest "no questions practised yet".
- The run changed the guest record in this browser pane, which is test data only: `3 + 7` is now answered correctly, and there are two lesson views. "Mitt arbeid" → "Slett arbeidet mitt" clears it all.
