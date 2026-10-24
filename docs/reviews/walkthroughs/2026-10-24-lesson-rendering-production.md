# Walkthrough: lesson rendering and the detour (spec 003), production

**Date**: 2026-10-24. **Who**: the implementing session (Claude Opus 5.5), not a learner. **What**: spec 003 task T061, quickstart scenarios 1 and 3 run against production after the first release (PR 30, merge commit `a040bb1`) deployed. **Where**: `https://mathkx-fncxfxehfrd0fsfw.norwayeast-01.azurewebsites.net` (Azure App Service, Norway East; deploy run 40106387911, all five jobs and the health check passed), in the Chromium-based browser pane of the Claude desktop app on Windows 11 (Chrome 152), viewport 1024 by 768, light colour scheme, no reduced motion. Checks were made by clicking as a learner would and reading the page's DOM, its `localStorage` guest record, and the browser's resource timing for requests. **Not done**: a physical iPad, VoiceOver, or a learner session; T057 (walkthrough line 1, run locally) will add its result to this file.

Before the run, the service answered `/api/health` with one lesson, `/api/lessons/number-bonds-to-ten/content/nb` with JSON, the asset `ten-frame-3-7.svg` as `image/svg+xml`, and the instance `crossing-ten` seed 100 as `5 + 8` with `"lessons":[{"id":"number-bonds-to-ten","discloses":true}]`.

## Scenario 1: read the lesson

| Check | nb | en | Notes |
| --- | --- | --- | --- |
| Title and objective from the lesson metadata | pass | pass | "Tiervenner – tall som blir 10" / "Number bonds to ten" |
| Six sections with their anchors, in source order | pass | pass | `what`, `pairs`, `ten-frame`, `why`, `try`, `practice` |
| Table with header cells | pass | pass | 2 `th scope=col`, 12 `td` |
| Mathematics as MathML | pass | pass | 15 expressions in each language; the worked example's one-line `$$…$$` as display mathematics, `8+5=8+2+3=10+3=13` |
| Illustration with the translated description | pass | pass | Served from the assets endpoint and loaded (`naturalWidth > 0`) |
| Worked example as a framed block | pass | pass | "Gjennomgått eksempel: 8 + 5" / "Worked example: 8 + 5" |
| Ten-frame explorer and the make-ten step visual | pass | pass | Both rendered from the service's models |
| Practice entries where the lesson places them | pass | pass | "Øv: Pluss innenfor ti med grupper." and "Øv: Over ti: lag ti først." / "Practise: …" |
| No placeholders for unsupported content | pass | pass | 0 in each language |
| Language switch keeps the section | pass | — | With "Hvorfor er det nyttig?" the section in view, switching to English showed "Why is this useful?" on screen, 96 pixels below the top (the shorter English page cannot scroll as far); `<html lang>` changed to `en` |

## Scenario 3: the detour with a reveal

The question `5 + 8` (crossing ten) was reached by drawing questions with "Another question"; the detour was started in English, the notice was read in both languages, and the rest was done in Norwegian.

| Step | Result | Notes |
| --- | --- | --- |
| "To the lesson" from `5 + 8` | pass | The notice instead of the lesson: "This lesson shows the answer to 5 + 8" with "Open the lesson anyway", "Show visual help instead", "Cancel"; the banner "Back to your question 5 + 8 = ?"; `?from=question` dropped from the address |
| Nothing requested or recorded behind the notice | pass | No `/api/lessons/…/content/` request after the click; no lesson event on the delivery |
| The notice in Norwegian | pass | "Leksjonen viser svaret på 5 + 8", "Åpne leksjonen likevel", "Vis visuell hjelp i stedet", "Avbryt"; the banner "Tilbake til oppgaven 5 + 8 = ?"; switching language requested nothing |
| "Vis visuell hjelp i stedet" | pass | Back on `5 + 8` with help open; exactly one `visual-help-opened` recorded; no lesson event; no content request |
| "Til leksjonen" again, then "Åpne leksjonen likevel" | pass | No content request before the choice; exactly one after it (`content/nb`); the lesson shown; exactly one `lesson-reveal` recorded |
| Back by the banner, answer `13` | pass | The question and open help were restored; "Riktig. 5 + 8 = 13." |
| The record | pass | "Besvart etter at svaret ble vist" with the tags "Visuell hjelp" and "Svaret vist i leksjonen" |
| `7 + 3` (within ten) reached through the header's lesson list | pass | In English: "This lesson shows the answer to 7 + 3" (the table has `3 + 7 = 10`; order of addends does not matter), the banner shown, no content request, no lesson event; "Cancel" returned to `7 + 3` and recorded nothing |

## Findings to carry forward

- Both scenarios pass in production in both languages; the behaviour matches the local end-to-end checks.
- The run left a guest record of 93 questions (91 skipped while drawing questions until `5 + 8` and `7 + 3` came up, the answered `5 + 8`, and the unanswered `7 + 3`) in this browser pane's storage for the production site. It is only in that browser, never on the server; "Mitt arbeid" → "Slett arbeidet mitt" clears it.
- PR 31 (the app shell served with `Cache-Control: no-cache`) was not yet merged during this run; no stale-shell problem was seen here, because the pane had not loaded the site before this deploy.
