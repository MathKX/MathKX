# MathKX prototype – handoff

An interactive prototype of the MathKX learner journey in Norsk bokmål and English:

Landing → Mathematics library → domain → topic → lesson → visual example → practice → self-check → create profile → learner home.

It is a prototype. It is not the start of the production frontend, and it does not settle the open questions in `AGENTS.md` (persistence, authentication, mastery, symbolic equivalence, hosting).

## Run it

```bash
npm ci
npm run dev      # local dev server
npm run build    # dist/index.html, one self-contained file
```

`npm run build` generates `dist/index.html`, which is excluded from Git. Open it directly in a browser. The fonts load from Google Fonts; without a network connection the system font is used.

Regenerate the theme after changing `designsystemet.config.json`:

```bash
npx designsystemet tokens create -y
npx designsystemet tokens build -o ./src/theme --clean
```

## Stack and Designsystemet usage

- **Real Designsystemet, no approximation.** `@digdir/designsystemet-react` and `@digdir/designsystemet-css` 1.23.0: Button, Textfield, ToggleGroup, Card, Alert, Tag, Dialog, Details, Breadcrumbs, Search, Switch, Checkbox, Radio, Select, Fieldset, ErrorSummary, List, Link, SkipLink, Heading, Paragraph.
- **MathKX theme** generated with the Designsystemet CLI 1.23.0 (`designsystemet.config.json`): accent `#1F6B78`, neutral `#5C636B`, an extra `ochre` scale `#B7772E` for the second operand, radius 8, font Atkinson Hyperlegible Next. Light and dark mode both come from the theme.
- **Tailwind 4.3** for layout only. `src/styles.css` is the single entry point, with the layer order `theme, base, ds, mathkx, components, utilities`. Tailwind Preflight sits below Designsystemet, so Preflight never overrides a control, and layout utilities sit above both. This differs slightly from the Designsystemet README's v4 snippet (which only orders the imports); it was chosen so Preflight cannot reset Designsystemet buttons. Verify the choice when the real app is created.
- React 19, Vite 8, `vite-plugin-singlefile`. Icons: `@navikt/aksel-icons`. Packages were resolved to versions published before 3 October 2026.

## Reusable components

| Component | File | Purpose |
| --- | --- | --- |
| `ExerciseShell` | `src/components/ExerciseShell.jsx` | Domain-independent answer flow: prompt, answer, check, visual-help toggle, feedback, next. Used unchanged for arithmetic and algebra, in practice and in self-checks. |
| `MathExpr` | `src/components/math/MathExpr.jsx` | Simple expression string → MathML. |
| `Counter`, `CounterGroup`, `GroupsHelp` | `src/components/math/Counters.jsx` | Rounded-square counters, labelled groups (4 → 2×2), step-by-step counting. |
| `TenFrame`, `TenFrameExplorer`, `MakeTen` | `src/components/math/TenFrame.jsx` | Ten-frame, number-bond explorer, "make ten" model with explicit steps. |
| `Balance` | `src/components/math/Balance.jsx` | Pan balance for x + a = b with button-driven steps (no dragging). |
| Lesson renderer | `src/components/Markdown.jsx` | Small Markdown subset: front matter, `## Heading {#id}`, lists, tables, `$math$`, `$$math$$`, `:::example` blocks and `{{component key=value}}` embeds. |
| Domain logic | `src/domain/math.js` | Answer parsing, validation and misconception codes with localized feedback. UI never decides correctness. |

Lessons are Markdown files in `src/content/lessons/` (`*.nb.md`, `*.en.md`). "View or edit lesson source" shows the real source and a proposed repository path (`content/lessons/<domain>/<lesson>/<lang>.md`).

## Simulated behaviour

- **Profiles and sign-in.** Learner IDs are generated in the browser. Passwords are hashed with a toy hash and stored in `localStorage`. This is not security. Demo profile: `MKX-DEMO-4K7P` / `tiervenner10`.
- **Recovery email.** No email is sent. The confirmation code is always `246810`. The recovery screen never reveals whether an address exists.
- **Progress, attempts, check results** live in `localStorage` (per profile) and `sessionStorage` (the current session's typed answers, open help, position in a set). Guest progress is attached to a new profile when it is created.
- **"Lesson explored"** is recorded when the learner reaches the end of the lesson or has spent 20 seconds on it.
- **Suggest an improvement** builds the text of a public issue and shows it. Nothing is sent, and no profile data is included.
- **Exercises** are small reviewed question lists standing in for generated exercise families (definition + version + seed).
- **ID reminder download** uses the host's download capability when published as an artifact; otherwise a normal browser download.

## Accessibility and device notes

- Semantic headings, landmarks, skip link, visible focus, focus moved to the page heading on navigation only (not on language switch or feedback).
- Feedback is announced in a polite live region without moving focus. Help toggle exposes `aria-expanded`.
- Visual models have text equivalents: labelled lists of counters, `role="img"` descriptions, step captions and the equation in MathML.
- Colour is never the only signal: second-operand counters have a heavy outline and a pip; every group has a label.
- `prefers-reduced-motion` disables the only animation (a short fade).
- Language switch, rotation and opening help keep the answer, help state and position.
- Checked with axe-core (WCAG 2 A/AA + best practice) on all main routes, no violations, and with Playwright at 390, 820 and 1180/1366 px widths in light and dark mode. **Not yet tested** on a real iPad with Safari, the on-screen keyboard, VoiceOver or an external keyboard; `docs/design/design-principles.md` requires that before release.

## Remaining implementation decisions

1. Authentication technology, credential format, recovery codes vs. email, session handling, deletion.
2. Persistence and the server-side progress model; how support events (help opened, counting, steps) become mastery evidence.
3. Lesson Markdown dialect: notation (MathML subset vs. TeX), metadata contract, component reference syntax, validation and preview tooling.
4. Exercise generation from definitions and seeds; answer forms (negative numbers, decimals with comma, `x = 4`, equivalent expressions) and a maths keyboard on iPad.
5. Real routing (the prototype uses hash routes so it works as a single file).
6. Contribution flow: issue templates, licensing, review ownership, where the "suggest" dialog posts.
7. Whether Tailwind's Preflight should be kept at all alongside Designsystemet's base styles.
8. Logo and a self-hosted copy of the fonts.
9. Whether self-checks should support an "independent" mode where help is switched off or moves the learner to supported practice.
