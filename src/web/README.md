# MathKX learner app

React 19 and TypeScript with Designsystemet components and Tailwind for layout (ADR 0007), built by Vite. It renders what the practice service returns and computes nothing mathematical itself: questions, feedback, and the help and explanation steps all come from `src/backend`.

## Scripts

| Command | What it does |
| --- | --- |
| `npm ci` | Install the pinned dependencies |
| `npm run dev` | Vite dev server on port 5173, proxying `/api` to the service on port 5080 (`MATHKX_API_URL` overrides) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | vitest: dictionaries, translate, storage, outcome derivation, exercise shell, ladder, record page, status rendering |
| `npm run build` | Production build to `dist/`; the service copies it into `wwwroot/` at build time and serves it |
| `npm run e2e` | Playwright end-to-end checks against the built app served by the service |

Run the service first: `dotnet run --project ../backend/MathKX.Api`.

## Layout

```text
src/
  i18n/        nb.ts and en.ts (identical key sets, enforced by tests), translate(), codes.json shared with the backend tests
  api/         typed client for the service; newSeed() picks seeds (selection, not generation)
  state/       storage (versioned localStorage with memory fallback), observations (deliveries and events),
               outcomes (DL-029 derivation), store (the session reducer)
  components/  ExerciseShell, StepPanel, Feedback, LadderControls, LanguageSwitch, math/ (MathExpr, Counters, MakeTen, TenFrame)
  pages/       LessonListPage, LessonPage, PracticePage, RecordPage
  styles/      index.css: the one entry point for Designsystemet + Tailwind; theme.css: the MathKX theme tokens
tests/         vitest (jsdom) with a deterministic fake service in fakeApi.ts
e2e/           Playwright
```

## Rules the tests enforce

- Every learner-visible string comes from `src/i18n/nb.ts` and `en.ts`, which must have identical keys; `translate()` throws on a missing key in development and tests. Feedback texts, step texts, status wordings, and outcome labels are content: change them through review, not casually.
- No accessible name, text, or live region states a total before a revealing step; the math components render only the state the service delivered.
- The record is counts of outcomes per delivery; never a percentage, score, streak, or mastery word.

## Adding a math component

Put it under `src/components/math/`, give it the instance operands and the step `visual` state as props, label every group and counter through `translate()`, and keep any animation behind `prefers-reduced-motion` with a static or stepped equivalent. Register nothing: the representation's name comes from the content registries through the service, and `StepPanel` maps the name to the component.
