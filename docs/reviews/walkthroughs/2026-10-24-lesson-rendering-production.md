# Walkthrough: lesson rendering and the detour (spec 003), production

**Date**: 2026-10-24. **Who**: the implementing session (Claude Opus 5.5), not a learner. **What**: spec 003 task T061, quickstart scenarios 1 and 3 run against production after the first release (PR 30, merge commit `a040bb1`) deployed. Scenario 1 and the first half of scenario 3 ran on `a040bb1`; after review of PR 32, scenario 3 was completed in the missing language for each route on `41de5f3` (PR 31, which only changes cache headers for the app shell and assets, deployed in between). **Where**: `https://mathkx-fncxfxehfrd0fsfw.norwayeast-01.azurewebsites.net` (Azure App Service, Norway East; deploy run 40106387911, all five jobs and the health check passed), in the Chromium-based browser pane of the Claude desktop app on Windows 11 (Chrome 152), viewport 1024 by 768, light colour scheme, no reduced motion. Checks were made by clicking as a learner would and reading the page's DOM, its `localStorage` guest record, and the browser's resource timing for requests. **Not done**: a physical iPad, VoiceOver, or a learner session; T057 (walkthrough line 1, run locally) will add its result to this file.

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

Questions were reached by drawing with "Another question" until `5 + 8` (crossing ten) or `3 + 7` / `7 + 3` (within ten) came up. Each route was run completely in each language: the reveal path as one journey per language, and the lesson-list route once per language.

### The reveal path, `5 + 8`, from the question's lesson link

| Step | nb (`a040bb1`) | en (`41de5f3`) | Notes |
| --- | --- | --- | --- |
| "To the lesson" | pass | pass | The notice instead of the lesson: "Leksjonen viser svaret på 5 + 8" / "This lesson shows the answer to 5 + 8" with "Åpne leksjonen likevel", "Vis visuell hjelp i stedet", "Avbryt" / "Open the lesson anyway", "Show visual help instead", "Cancel"; the banner "Tilbake til oppgaven 5 + 8 = ?" / "Back to your question 5 + 8 = ?"; `?from=question` dropped from the address. In the Norwegian run the detour was opened in English and the language switched on the notice, which requested nothing |
| Nothing requested or recorded behind the notice | pass | pass | No `/api/lessons/…/content/` request after the click; no lesson event on the delivery |
| "Show visual help instead" | pass | pass | Back on `5 + 8` with help open; exactly one `visual-help-opened` recorded; no lesson event; no content request |
| The lesson link again, then "Open the lesson anyway" | pass | pass | No content request before the choice; exactly one after it (`content/nb` / `content/en`); the lesson shown in that language; exactly one `lesson-reveal` recorded |
| Back by the banner, answer `13` | pass | pass | The question and open help were restored; "Riktig. 5 + 8 = 13." / "Correct. 5 + 8 = 13." |
| The record | pass | pass | "Besvart etter at svaret ble vist" with "Visuell hjelp" and "Svaret vist i leksjonen" / "Answered after the answer was shown" with "Visual help" and "Answer shown in the lesson" |

### The lesson-list route, within ten

| Step | nb (`41de5f3`, `3 + 7`) | en (`a040bb1`, `7 + 3`) | Notes |
| --- | --- | --- | --- |
| Header "Leksjoner" / "Lessons", then the lesson in the list | pass | pass | The notice: "Leksjonen viser svaret på 3 + 7" / "This lesson shows the answer to 7 + 3" (the table has `3 + 7 = 10`; the order of the addends does not matter); the banner shown |
| Nothing requested or recorded | pass | pass | No content request; no lesson event |
| "Avbryt" / "Cancel" | pass | pass | Back on the question; nothing recorded |

## Findings to carry forward

- Both scenarios pass in production in both languages; the behaviour matches the local end-to-end checks.
- **Bug, not from spec 003**: loading a practice address directly, such as `/practice/numbers.addition-within-20` (a reload, a bookmark, or a shared link), returns a `404` problem response instead of the app. `MapFallback` in `src/backend/MathKX.Api/Program.cs` uses ASP.NET's default `{*path:nonfile}` pattern, which treats a last path segment containing a dot as a file, and every skill ID contains one. `/`, `/lessons/number-bonds-to-ten`, and `/record` load; navigation inside the app is unaffected. The fallback has been the same since spec 002, and no end-to-end check loads a practice address directly.
- After PR 31 deployed, the app shell (`/`) is served with `Cache-Control: no-cache`.
- The runs left a guest record of 143 questions (140 skipped while drawing questions, the two answered `5 + 8`, and the unanswered `3 + 7`) in this browser pane's storage for the production site. It is only in that browser, never on the server; "Mitt arbeid" → "Slett arbeidet mitt" clears it.
