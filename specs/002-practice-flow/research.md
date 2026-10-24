# Research: Practice Flow with Help-First Feedback

Phase 0 output for [plan.md](plan.md). Each entry records a decision, why, and what else was considered. These are implementation choices within the spec, the constitution, and the ADRs; none changes a requirement or decides a matter the constitution lists as undecided.

## R1. Backend layout and target framework

**Decision**: One solution `src/backend/MathKX.slnx` with five projects: `MathKX.Domain` (class library, no package references: random source, generator, validator, step models, and the content record types), `MathKX.Content` (loads `content/` from disk with `System.Text.Json` and YamlDotNet for front matter), `MathKX.Api` (ASP.NET Core minimal API), `MathKX.Domain.Tests` and `MathKX.Api.Tests` (xUnit; the content loader's tests live with the domain tests). Target `net10.0` (the current long-term-support release; SDK 10.0.302 is installed; Azure App Service Linux supports it). A `Directory.Build.props` sets nullable reference types, warnings as errors, and the MIT package metadata.

**Rationale**: DL-005 asks for a domain library with tests and a thin API; keeping the domain free of framework references is what lets the generator and validator be reused by a future re-validation job or a command-line fixture runner. .NET 10 avoids an upgrade before the first release.

**Alternatives considered**: `net9.0` (rejected: shorter support). A single project (rejected: the domain would acquire web references and gate III would erode).

## R2. Content at runtime

**Decision**: The service loads `content/` once at startup from `MathKX:ContentRoot` (default `../../../content` relative to the API project in development; the publish step copies `content/` next to the binaries). `MathKX.Content` parses registries, skills, definitions, and `lesson.json` with `System.Text.Json` into records that mirror the `0.1-pilot` schemas, and reads `title` and `objective` from each translation's front matter with YamlDotNet, the same YAML the content validator accepts (quoted scalars, folded `>-` blocks, inline comments). Tests cover those three cases. It does not re-validate schemas: the content checks in CI already guarantee them, and the loader fails fast with the file path on any missing field.

**Rationale**: Spec FR-005 makes `content/` the runtime source; copying it into the deployable keeps one artefact (ADR 0009). The front-matter reader covers exactly what the temporary lesson page needs (spec Assumptions); the Markdown and YAML stack for the body renderer is spec 003's decision.

**Alternatives considered**: A two-key line reader (rejected in review: it would mis-render quoted scalars, folded blocks, and comments that the validator accepts, silently narrowing the authoring contract). Embedding content into the assembly (rejected: contributors could not change content without rebuilding).

## R3. Random source and bounded sampling

**Decision**: `SplitMix64` and `BoundedSampler.NextBelow(ulong n)` exactly as the seed proposal specifies, in `MathKX.Domain.Random`, with `ulong` arithmetic and the explicit `limit == 2^64` case handled as "accept every raw value". `Seed.Parse` accepts only `^(0|[1-9][0-9]*)$` within the `ulong` range and `Seed.Format` emits the same. Tests reproduce every raw and bounded vector in the proposal, the injected rejection streams, invalid bounds, seed parsing at both limits, state wraparound, and the draw after a rejection.

**Rationale**: DL-018 and DL-034 require the fixtures before any generator ships; DL-024 makes passing them the trigger for ADR 0011. Writing the sampler once in the domain and nowhere else honours the proposal's prohibitions.

**Alternatives considered**: `System.Random` (prohibited). A wider `UInt128` implementation (rejected: slower and no clearer than the explicit limit case).

## R4. Draw order for `addition-pair@1`

**Decision**: The generator enumerates the feasible ordered pairs for the definition's bounds in a canonical order (first operand ascending, then second operand ascending, keeping only pairs whose sum lies within the sum bounds), then draws one index with `NextBelow(count)` and returns that pair. Exactly one bounded draw per instance, no rejection loop at the generator level, and the enumeration order is part of the contract. Pool sizes for the pilot definitions: 45 for `within-10`, 36 for `crossing-ten`. Golden seeds (ten seeds per definition with their expected pairs) are checked in as a fixture file and asserted by the domain tests; a property test runs 10 000 seeds per definition and asserts bounds, representation coverage, and that the empirical distribution hits every pair.

**Rationale**: DL-034 requires a documented draw order and golden seeds. One draw over a canonical list is uniform by construction, trivially reproducible across versions of the code, and makes "pool exhausted" (F7) a known number. Rejection sampling at the generator level would consume a variable number of draws and make the stream harder to reason about.

**Alternatives considered**: Draw `a` then `b` with rejection when the sum is outside bounds (rejected: variable consumption, a feasibility loop in the generator, and a biased marginal unless re-drawn together). Drawing from the quantity relation (rejected: the registry relation is for bounds and feasibility, not for sampling).

## R5. Service surface

**Decision**: A minimal API with five read-only or pure endpoints, JSON only, no authentication, no session: `GET /api/lessons`, `GET /api/lessons/{id}`, `GET /api/skills/{id}` (with the ladder), `GET /api/instances/{definitionId}/{version}/{seed}` (fixed tasks accept `-` as the seed), and `POST /api/validations`. Instances carry presentation data only; the validation request carries the identity and the learner's artifact; the response is the typed result. Errors use the standard problem-details shape with codes `unknown-definition`, `invalid-seed`, `invalid-artifact`. Shapes are in [contracts/api.md](contracts/api.md).

**Rationale**: F3 is "thin": resolve and validate, nothing else. Re-resolving the instance on the server during validation is what keeps the answer private (FR-009) and deterministic (FR-010); the client never learns the sum except through its own correct answer. Lesson metadata endpoints exist because the temporary lesson page needs titles and objectives per language.

**Alternatives considered**: Validating in the browser from a sent answer (rejected: leaks private data and contradicts DL-005). A session on the server (rejected: no profiles yet, and guest work belongs in the browser per the brief).

## R6. Learner app stack and pinned versions

**Decision**: Vite 8.3.5 with `@vitejs/plugin-react` 6.1.2, React 19.3.1, TypeScript 5.9.3 (not the 7.x line, which the Vite and testing toolchain has not adopted), `@digdir/designsystemet-react` and `-css` 1.23.0, `@digdir/designsystemet` 1.23.0 for the theme build, `@navikt/aksel-icons` 8.20.0, Tailwind 4.3.3 with `@tailwindcss/vite`, vitest 5.0.5 with `@testing-library/react` 16.3.3 and jsdom, Playwright 1.64.1. Versions are pinned exactly in `package.json`; the stylesheet entry point imports Designsystemet CSS first and Tailwind with Preflight scoped so it does not restyle Designsystemet controls, following the CSS package's Tailwind guidance (ADR 0007).

**Rationale**: These are the prototype's libraries at their current versions, so its components port with little change. One documented stylesheet entry point is what ADR 0007 asks for.

**Alternatives considered**: A meta-framework (rejected: no server rendering is needed and the service serves the static build). Keeping JavaScript instead of TypeScript (rejected by the constitution's stack).

## R7. State, storage, and seeds

**Decision**: A single store (React context plus a reducer) holds the session: current question, draft, help state, pending ladder change, deliveries, language. It persists to `localStorage` under the key `mathkx.guest.v1` through a small module with try/catch and an in-memory fallback that also sets a "not being kept" flag the UI shows (FR-022). New seeds are chosen in the browser with the platform's cryptographic random source, formatted as decimal strings; this is seed selection, not generation, so the proposal's prohibition does not apply, and seeds are never treated as secrets.

**Rationale**: The prototype's store works this way and survived four review rounds; a versioned key lets F9 migrate guest work. Client-chosen seeds keep the service stateless and make "Another question" a pure request.

**Alternatives considered**: Server-chosen seeds (rejected: needs state or an extra round trip). A state library (rejected: nothing here needs it yet).

## R8. Dictionaries and the parity and literal checks

**Decision**: `src/web/src/i18n/nb.ts` and `en.ts` export objects with the same nested key shape; `translate(lang, key, params)` throws in development and tests on a missing key and returns the key in production with a console error. Two vitest checks implement DL-038: `dictionaries.test.ts` asserts the two key sets are equal, and `literals.test.ts` scans `src/web/src/**/*.tsx` for JSX text and string props that look like learner-visible prose, with an allowlist for notation, numbers, proper names, language self-names, and test IDs. Feedback texts for the five misconception codes, status wordings, outcome labels, ladder end messages, and the "kept in this browser only" notice live in the dictionaries; ladder sentences come from the content.

**Rationale**: FR-023 and DL-038. The literal scan is deliberately simple (a regex over text nodes with an allowlist) so it stays maintainable.

**Alternatives considered**: An i18n framework (rejected: two languages, flat usage, and the parity test is the valuable part).

## R9. Observations and outcome derivation in the browser

**Decision**: `state/observations.ts` records one delivery per resolved instance with the event names of addendum §E (`visual-help-opened`, `help-step`, `counting`, `counting-complete`, `explanation-open`, `explanation-step` with `reveals`, `lesson-opened`, `lesson-reveal`, `answer-reveal`), ordered mathematical submissions with client submission IDs, input-guidance events apart, and challenge requests. `state/outcomes.ts` derives the outcome per delivery with the DL-029 precedence and the tag set. The derivation is a pure function with a table-driven test covering every row of §E and the spec's edge cases.

**Rationale**: FR-018 to FR-021. The prototype's `observations.js` is the proven model; its event names are replaced by the addendum's so content, prototype, and app stop drifting. A pure function is what F9's server re-validation will reuse.

**Alternatives considered**: Deriving outcomes in the service (rejected: there is no server-side record yet, and sending guest events to a server contradicts "kept in this browser only").

## R10. Mathematical components

**Decision**: Port `Counters` (groups help with counting and the "How many altogether?" step), `MakeTen` (the ten-frame make-ten model), `TenFrame`, and `MathExpr` from the prototype to TypeScript components under `src/web/src/components/math/`, keeping their accessible-name rules (no total before reveal, DL-035). The components render the instance's operands and, for guided help and worked explanations, the step state the service delivers one step at a time (R15); they compute nothing mathematical beyond layout counts.

**Rationale**: ADR 0007 asks for MathKX components on the shared theme; the prototype's are reviewed and tested (33 domain and 92 browser checks), including the DL-035 fix.

**Alternatives considered**: Rewriting from scratch (rejected: the review findings would have to be rediscovered).

## R15. Step models for help and explanations, delivered one step at a time

**Decision**: The domain owns deterministic step models per representation (`MathKX.Domain.Explanations`): for `groups`, help steps "show the two groups", "count the first group", "count the second group", "count all" (the last reveals the total) and explanation steps "two labelled groups", "combine them", "the total counts all objects in both groups" (the last reveals; `within-10` and `four-plus-four` list `groups` for explanation); for `make-ten`, help steps that end in a reveal and explanation steps "eight needs two to make ten" (`need = 10 − a`), "split five into two and three" (`rest = b − need`), "ten and three" (reveals `sum`), each with the visual state, a text code with values, and a `reveals` flag. The service exposes them one step at a time at `GET /api/instances/{definitionId}/{version}/{seed}/steps/{kind}/{index}` (`kind` is `help` or `explanation`); a step's values include the total only when its `reveals` flag is true. The learner app fetches a step only when the learner advances to it, records `help-step` or `explanation-step` with the returned `reveals` flag (and `counting-complete` for the groups' last help step), and renders the delivered state. The initial instance response stays answer-free.

**Rationale**: Visual help and worked explanations need derived quantities and reveal timing that gate III keeps out of the client; delivering steps individually is what lets FR-009 hold (nothing containing the answer reaches the browser before the learner's own explicit advance, and that advance is the reveal event the observation model records). The step texts are codes resolved by the dictionaries, like feedback.

**Alternatives considered**: Deriving `need` and `rest` in the components (rejected: mathematics in the UI). Returning all steps in one response (rejected: the total would reach the browser before any reveal, contradicting FR-009 and DL-035). Including the explanation in the validation result (rejected: an explanation must be reachable after an incorrect result too, FR-013, and a result is not a teaching sequence).

## R11. End-to-end checks

**Decision**: Playwright runs in CI against the real service and the built app: it completes a question with keyboard only, opens help, asserts the accessibility tree exposes no total before the reveal, switches language mid-question and asserts the state, and checks touch-target sizes at an iPad viewport. Component-level state tests run in vitest with jsdom.

**Rationale**: SC-004 and SC-005; the prototype's browser checks showed that accessibility regressions are only caught in a real browser.

**Alternatives considered**: Mocking the service in Playwright (rejected: the private-data assertion is most valuable against the real one).

## R12. Continuous integration

**Decision**: A new workflow `.github/workflows/build-and-test.yml` with two jobs: `backend` (set up .NET 10, `dotnet test src/backend/MathKX.slnx`) and `web` (Node 22, `npm ci` and `npm test` and `npm run build` in `src/web`, then start the service and run Playwright). The existing content workflow is unchanged. Both run on pull requests and pushes to `main`.

**Rationale**: FR-025 and SC-007; separate jobs keep the content checks fast and let each stack cache its own dependencies.

## R13. The random-source ADR

**Decision**: This feature does not write ADR 0011. When the fixtures of R3 pass in CI, the owner's trigger in DL-024 is met; raising the ADR is a separate, small pull request so the record of the decision is not buried in an implementation change.

## R14. What stays out

**Decision**: No repeat avoidance or "Repeat this question" (F7), no cross-skill progress view or "Lesson viewed" history (F6), no lesson body rendering (F5; the lesson page shows front-matter title and objective and the practice entries), no profiles or server storage (F9), no deployment pipeline (the service is runnable locally and in CI; Azure deployment is its own change), no self-checks (F8).
