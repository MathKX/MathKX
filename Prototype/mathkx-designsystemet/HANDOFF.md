# MathKX prototype – handoff

An interactive prototype of the MathKX learner journey in Norsk bokmål and English. Iteration 2 (October 2026) focuses on explanations, learner-controlled practice, honest progress, the tablet workspace, one advanced design preview, the proposed lesson format and profile states.

It is a prototype. It is not the start of the production frontend, and it does not settle the open questions in `AGENTS.md` (authentication, mastery, symbolic equivalence, generator design).

- [Change log for iteration 2](docs/iteration-2/CHANGELOG.md)
- [Requirement → screen/state checklist](docs/iteration-2/REQUIREMENTS-CHECKLIST.md)
- [Assumptions, simulated behaviour and test status](docs/iteration-2/ASSUMPTIONS.md)
- [Usability test script](docs/iteration-2/USABILITY-TEST-SCRIPT.md)
- [Response to the round-03 reviews](docs/iteration-2/REVIEW-RESPONSE.md) (Claude, Codex and Gemini, 18 October 2026)

## Run it

```bash
npm ci
npm run dev           # local dev server
npm test              # domain checks (node --test)
npm run build         # dist/index.html, one self-contained file
npx playwright install chromium   # once, for the browser checks
npm run test:browser  # browser checks + axe on dist/index.html (4 configurations)
npm run test:browser -- en-390-dark   # one configuration
```

`npm run build` generates `dist/index.html`, which is excluded from Git. Open it directly in a browser. Fonts load from Google Fonts; without a network connection the system font is used.

Regenerate the theme after changing `designsystemet.config.json`:

```bash
npx designsystemet tokens create -y
npx designsystemet tokens build -o ./src/theme --clean
```

## Stack and Designsystemet usage

- **Real Designsystemet, no approximation.** `@digdir/designsystemet-react` and `@digdir/designsystemet-css` 1.23.0 (Button, Textfield, ToggleGroup, Card, Alert, Tag, Dialog, Details, Tabs, Breadcrumbs, Search, Switch, Checkbox, Radio, Select, Fieldset, ErrorSummary, List, Link, SkipLink, Heading, Paragraph).
- **MathKX theme** generated with the Designsystemet CLI: accent `#1F6B78`, neutral `#5C636B`, extra `ochre` scale `#B7772E` for the second operand, radius 8, Atkinson Hyperlegible Next.
- **Tailwind 4.3** for layout only. `src/styles.css` is the single entry point with layer order `theme, base, ds, mathkx, components, utilities` so Preflight never overrides Designsystemet controls.
- React 19, Vite 8, `vite-plugin-singlefile`, `@navikt/aksel-icons`.

## Structure

| Area | Files |
| --- | --- |
| Domain logic (no UI) | `src/domain/math.js` (validation, feedback codes), `numbers.js` (locale parsing), `notation.js` (notation grammar), `practice.js` (variations, finite pools, ladder), `explanations.js` (help and explanation step models, which steps show the answer), `observations.js` (event summaries, outcomes, tags, suggestions), `disclosure.js` (does a lesson show this exercise's answer) |
| Exercise workspace | `src/components/ExerciseShell.jsx` – answer flow, visual help vs explanation, support recording, feedback; used for arithmetic, algebra, practice and checks |
| Visual components | `src/components/math/` – `Counters.jsx` (counters, groups, counting help), `TenFrame.jsx` (ten-frame, explorer), `Visuals.jsx` (groups / make-ten / balance states, `StepPlayer`), `MathExpr.jsx` (MathML renderer) |
| Lessons | `src/content/lessons/<id>/lesson.json`, `nb.md`, `en.md`, `assets/` (proposed layout); renderer `src/components/Markdown.jsx` |
| State | `src/store.jsx` – simulated profiles, guest work, ordered event log, sessions; labelled sample history |
| Pages | `src/pages/` – Landing, Library/Domain/Topic, Lesson, Practice/Session summary/Check, Home/Progress, Preview (derivative), Profile/Sign-in/Recovery/Settings, About |
| Strings | `src/i18n.js` + `src/i18n-iteration2.js` + `src/i18n-review.js` (deep-merged in that order; unused keys removed, both languages have the same keys) |
| Tests | `tests/domain.test.mjs` (`npm test`), `tests/browser/review-checks.mjs` (`npm run test:browser`) |

### Lesson format (proposed)

```text
src/content/lessons/number-bonds-to-ten/
  lesson.json   id, version, skills, prerequisites, related, practice, check, visuals
  nb.md         front matter (title, objective) + body
  en.md
  assets/ten-frame-3-7.svg
```

Directives: `:::visual{type="ten-frame-explorer" start="3"}`, `:::visual{type="make-ten" a="8" b="5"}`, `:::visual{type="balance" a="3" c="7"}`, `:::example{title="…" id="…"}`, `:::practice{skill="…" variant="…"}`. Maths: `$…$` inline, `$$…$$` display, grammar documented at the top of `src/domain/notation.js`. The format is a proposal, not a contract.

## Accessibility and device notes

- Semantic headings and landmarks, skip link, visible focus; focus moves to the page heading only on navigation.
- Feedback is announced in a polite live region without moving focus; help and explanation toggles expose `aria-expanded`.
- Every visual has a text equivalent (labelled lists, `role="img"` descriptions, step captions and MathML equations). The derivative graph has arrow buttons, a value table and direct entry.
- Colour is never the only signal; `prefers-reduced-motion` disables the only animation.
- Answer, open panel and step survive language switches, rotation and lesson visits.
- Support is recorded per delivery in order: visual help, other help (part of the explanation, a lesson detour), and answer reveals (an explanation step that shows the answer, counting every counter, or a lesson that shows this exercise). Outcomes: correct on first response, correct with visual help, correct with help, correct after feedback, answered after the answer was shown, not correct yet, skipped, unfinished.
- A page error shows a message inside the page; the header and navigation stay.
- Not yet tested on a real iPad, with VoiceOver, or with learners. See [ASSUMPTIONS.md](docs/iteration-2/ASSUMPTIONS.md#what-still-needs-people-or-devices).
