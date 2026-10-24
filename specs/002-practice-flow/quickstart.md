# Quickstart: running and proving the practice flow

Phase 1 output for [plan.md](plan.md). How to run the feature once implemented and what to expect. Implementation steps belong in `tasks.md`.

## Prerequisites

.NET SDK 10.0 (`dotnet --version` prints `10.0.x`), Node.js 22 and npm, and for the end-to-end checks the Playwright browsers (`npx playwright install --with-deps chromium` inside `src/web`).

## Run

```bash
dotnet run --project src/backend/MathKX.Api
```

```bash
cd src/web && npm ci && npm run dev
```

The service listens on its configured port and reads `content/` from the repository; the Vite server proxies `/api` to it. Open the printed URL, choose "Number bonds to ten", and press the practice entry for addition within ten.

## Test

```bash
dotnet test src/backend/MathKX.slnx
```

Expected: the random-source vectors, bounded-sampler vectors and injected rejection streams, golden seeds, property tests, boundary fixtures, replay fixture, validator precedence, registry agreement, and the service contract tests all pass.

```bash
cd src/web && npm test
```

Expected: dictionary parity, literal scan, outcome derivation (every row and tag), storage fallback, and exercise-shell state tests pass.

```bash
cd src/web && npm run e2e
```

Expected: the seven end-to-end checks of `contracts/learner-app.md` pass against the running service.

## Scenario 1: practise with help before answering (User Story 1)

1. On `4 + 4`, press "Show visual help": two labelled groups of four appear; the field is empty; nothing says 8.
2. Type `8`, submit: "Correct. 4 + 4 = 8."
3. Press "Another question"; on `3 + 5` type `3`: the one-group feedback appears, the field keeps `3`; press "Show explanation" and step to the end: the total is shown and the app says so; change to `8`: correct, and the record later shows "Answered after the answer was shown".
4. Type `abc` on the next question: input guidance; the record later shows no attempt for it.
5. Switch language with help open and a draft typed: everything stays, all labels change.

## Scenario 2: reproduce a question (User Story 2)

```bash
curl -s http://localhost:5000/api/instances/numbers.addition.crossing-ten/1/42
```

Run it twice, then restart the service and run it again: identical bodies, no `sum`. Submit `13` to `POST /api/validations` twice: identical results.

## Scenario 3: the ladder (User Story 3)

From a within-ten question press "More challenge": the current question stays, the notice names the crossing-ten variation; "Another question" delivers `a + b` with a sum of 11 to 18 and the make-ten help. Press "More challenge" again: "No harder variation is available yet". "Make it easier" returns to within ten on the next question.

## Scenario 4: the record (User Story 4)

Open `/record` after Scenario 1: the deliveries show "Correct on first response, no help", "Correct after feedback", and so on; the summary is counts only; the notice says the work is kept in this browser only. Reload: the record is still there. In a private window with storage blocked: practice works and the notice says the work is not being kept.

## Scenario 5: languages and assistive technology (User Story 5)

Run the bilingual walkthrough script (revised build brief §7) in both languages. With a screen reader, open help on `4 + 4`: each group announces four counters; no announcement says eight until the counting step reveals it. Complete a question with the keyboard only.

## CI

`.github/workflows/build-and-test.yml` runs `dotnet test` and the publish smoke, the web typecheck, tests, and build, and the Playwright checks on every pull request and push to `main`; `validate-content.yml` is unchanged. Measured locally on 2026-10-24: `dotnet test` 124 tests in under 2 s of test time (about 15 s including build), `npm test` 66 tests in about 25 s, `npm run e2e` 13 checks in 6 s plus the service start. In CI (PR 24, commit 19b87f9, 2026-10-24) the three jobs ran in parallel pairs and the whole workflow took 1 min 40 s wall time: web 27 s, backend 31 s, end to end 63 s (spec SC-007, limit 10 minutes).
