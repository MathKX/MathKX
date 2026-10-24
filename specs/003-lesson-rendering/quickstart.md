# Quickstart: running and proving lesson rendering and the detour

Phase 1 output for [plan.md](plan.md). How to run the feature once implemented and what to expect. Implementation steps belong in `tasks.md`.

## Prerequisites

As [spec 002's quickstart](../002-practice-flow/quickstart.md): .NET SDK 10.0, Node.js 22 and npm, and the Playwright browsers for the end-to-end checks. The web tests now also need the root content tooling installed (`npm ci` at the repository root), because the agreement tests run the validator's parser and grammar.

## Run

```bash
npm ci
```

```bash
dotnet run --project src/backend/MathKX.Api
```

```bash
cd src/web && npm ci && npm run dev
```

Open the printed URL and choose "Number bonds to ten" ("Tiervenner – tall som blir 10"). The service reads `content/` once at startup: after editing a lesson file, stop and start the service and reload the page (this is also the contributor preview of FR-018).

## Test

```bash
dotnet test src/backend/MathKX.slnx
```

Expected, in addition to spec 002's tests: the 81-instance disclosure table ([contracts/disclosure.md](contracts/disclosure.md)) with Norwegian and English agreeing; the lesson-facts fixture; lesson visual steps equal to instance steps; the new contract tests in [contracts/api.md](contracts/api.md), including the asset-name refusals.

```bash
npm test
```

Expected (root): the validator tests, now including the lesson-facts fixture through `tools/lib/markdown.mjs`.

```bash
cd src/web && npm test
```

Expected: renderer, notation agreement, parse agreement, gate and recording, `lessonAfter`, dictionary parity, and literal checks all pass.

```bash
cd src/web && npm run build && npm run e2e
```

Expected: spec 002's checks plus the five of [contracts/detour.md](contracts/detour.md), on the desktop and iPad projects. The build output shows the lesson renderer in its own chunk.

## Scenario 1: read the lesson (User Story 1)

Open the lesson in English. Every section of `content/lessons/number-bonds-to-ten/en.md` appears in order: the six headings, the bold term, the illustration (its description is the image's text alternative), the table of six pairs with mathematics in the second column, the worked example "Worked example: 8 + 5" as a framed block whose last line `8 + 5 = 8 + 2 + 3 = 10 + 3 = 13` stands on its own line, the "Try it in your head" list, and two practice entries. Scroll to "Why is this useful?" and switch to Norsk: the page shows "Hvorfor er det nyttig?" in view. With a screen reader, the table is announced with its column headers and the expressions are read as mathematics.

## Scenario 2: the detour without a reveal (User Story 2)

Start practice on crossing ten until the question is `6 + 5` (or pin the seed as the end-to-end check does). Type `1`, open visual help and step once, then choose "To the lesson". The lesson opens with "Back to your question 6 + 5 = ?" at the top. Choose it: the question shows `1` in the field and help at the same step. Answer `11`. The record page shows "Correct with help" with the tag "Lesson opened".

## Scenario 3: the detour with a reveal (User Story 2)

With the question `5 + 8` or `8 + 5`, choose "To the lesson". Instead of the lesson, the page says the lesson shows the answer to this question and offers "Open the lesson anyway", "Show visual help instead", and "Cancel". In the browser's network panel, no request to `/api/lessons/number-bonds-to-ten/content/…` has been made. Choose "Show visual help instead": the practice screen returns with help open and nothing about the lesson in the record. Choose "To the lesson" again and "Open the lesson anyway": the lesson loads; return and answer `13`. The record shows "Answered after the answer was shown" with "Answer shown in the lesson". Repeat with `3 + 7` reached through the header's lesson list instead of the link: the same notice appears.

## Scenario 4: lesson visuals and practice entries (User Stories 3 and 4)

In "Explore with a ten-frame", move the explorer with the arrow keys from 3 to 6: the frame shows six filled places and the sentence "6 and 4 make 10." is announced once. In the worked example's make-ten visual, step forward to the last step (`10 + 3 = 13`) and back with the keyboard. Choose the practice entry for crossing ten in "Practise": practice starts on that definition.

## Scenario 5: contribution (User Story 5)

On the Norwegian lesson, "Edit this lesson" opens `content/lessons/number-bonds-to-ten/nb.md` on GitHub; "Suggest an improvement" opens a new-issue form whose text names the lesson, version 1, `nb`, and the section in view, and nothing else. Follow "Preview a lesson" in `CONTRIBUTING.md`: change a sentence in `en.md`, restart the service, reload, see the change; `npm run validate` passes.

## CI

`build-and-test.yml` runs everything above on each pull request; the web job additionally runs `npm ci` at the root. Record the measured wall time here when the feature is implemented (spec SC-008, limit 10 minutes).
