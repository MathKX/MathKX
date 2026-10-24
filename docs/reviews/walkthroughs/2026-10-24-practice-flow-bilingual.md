# Bilingual walkthrough: practice flow (spec 002)

**Date**: 2026-10-24. **Who**: the implementing session (Claude Fable 5.1), not a learner. **Where**: the learner app served by the Vite dev server against the real service (`dotnet run`), in the Chromium-based browser pane of the Claude desktop app on Windows 11, dark colour scheme; plus the Playwright checks in headless Chromium on a desktop viewport and a 1024 by 768 iPad viewport. **Not done**: a physical iPad, VoiceOver, or a learner session (spec SC-006 and the brief's device pass remain open).

The script is the revised build brief §7, run in Norwegian Bokmål (`nb`) then English (`en`). Where the milestone's scope differs from the brief's wording, the difference is recorded rather than smoothed over.

| # | Script line | nb | en | Notes |
| --- | --- | --- | --- | --- |
| 1 | Open the lesson; headings, objective, table, and components read in the selected language | partial | partial | The lesson page shows the title and objective from the front matter and the two practice entries in the selected language. The Markdown body (headings, table, ten-frame explorer) is not rendered in this feature (spec 003). |
| 2 | Open practice; prompt, labels, help button, and the screen-reader text between the groups are in the selected language | pass | pass | Prompt `5 + 1 = ?` with the spoken form "5 pluss 1. Hva er summen?" / "5 plus 1. What is the sum?"; all controls translated; the ladder sentence "Nå: Pluss innenfor ti med grupper." / "Now: Addition within ten with groups." |
| 3 | Press help before answering; group labels and counting controls are translated | pass | pass | Groups labelled "Første gruppe, 5 brikker" / "First group, 5 counters"; "Neste steg" / "Next step"; no total shown or announced before the last step. |
| 4 | Type `8`, switch language, confirm the draft and open help survive; submit; feedback in the new language | pass | pass | Typed `6` for `5 + 1`, switched nb → en with help open at step 1: question, draft, help state kept; "Correct. 5 + 1 = 6." |
| 5 | Enter `8,0` and `8.0` (both accepted); enter `4+4` ("looks like a calculation") | differs | differs | Spec 002 FR-008 (decided after the brief) treats decimals and expressions as input guidance, never as attempts: `8,0`, `8.0`, and `4+4` all produce the "could not read … as a whole number" guidance in the selected language. There is no separate "looks like a calculation" message in this feature. |
| 6 | "Make it easier" and "More challenge"; the sentence is translated; the end message is translated | pass | pass | "More challenge" set the pending notice "Next question: Across ten: make ten first."; the next question was `6 + 5` with the make-ten help (frame of 6, five loose; split 5 into 4 and 1; "10 + 1 = 11" on the revealing last step, "The answer has been shown."); "More challenge" at the top: "No harder variation is available yet." / "Det finnes ingen vanskeligere variant ennå." |
| 7 | Review the activity labels in both languages | pass | pass | The record page: "2 questions: 1 correct with visual help, 1 answered after the answer was shown"; items `5 + 1` "Correct with visual help" (tag: Visual help) and `6 + 5` "Answered after the answer was shown" (tags: Visual help, Answer shown in the help); "Your work is kept in this browser only." Counts only, no percentage. The brief's "topic page" is this feature's record page. |

## Automated coverage of the same script

`src/web/e2e/practice.spec.ts` (13 passing on the desktop and iPad projects): keyboard-only completion; no total in the accessibility tree before the revealing step; language switch mid-question; the ladder with make-ten help and the honest end message; the privacy boundary on every service response (a revealing step only after the learner's advance); 44 by 44 touch targets at the iPad viewport; incorrect → explanation reveal → corrected classified as "Answered after the answer was shown".

## Findings to carry forward

- The lesson page is a stub until spec 003; line 1 of the script can only pass fully after it.
- The brief's line 5 predates FR-008; the spec is the decided behaviour. If a "looks like a calculation" guidance message is wanted, it is a dictionary and validator-code addition for F3 content review, not a code change in the practice flow.
- Dark colour scheme follows the host; the light scheme was exercised by the Playwright run (default). Contrast in both schemes should be part of the iPad device pass.
