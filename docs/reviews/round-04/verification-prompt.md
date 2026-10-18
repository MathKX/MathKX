# Round-04 final verification prompt

Copy the prompt below into Claude, Codex, and Gemini with access to this repository, one reviewer at a time or in parallel, each in its own branch or checkout. Replace `<SHA>` with the frozen baseline commit and `<reviewer-slug>` with the reviewer's slug (`claude-fable`, `codex`, `gemini-argon`). The companion [review process](../review-process.md) §5 describes how the three reports are combined and how the result feeds the specifications.

Before sending the prompt, the owner records the pending decisions in the [decision log](../round-01/decision-log.md) (at minimum DL-004 to DL-006, DL-026, DL-028) and merges any open review pull requests, so that the baseline contains the planning record being verified.

---

You are one of three independent verifiers (Claude, Codex, Gemini) performing the final check of MathKX before implementation planning and feature specifications begin. This round is **verification, not review**: answer a fixed checklist with evidence, and give a readiness verdict per candidate feature. Do not propose new features or redesigns. Raise a new recommendation only when a check fails, and then only the smallest correction that makes it pass.

## Baseline and conduct

- Baseline commit: `<SHA>` on `main`. Record the full SHA, your branch, your model identity as reported to you (do not invent a version), the date, and `git status` before and after. If the SHA is not supplied, use the current `main` HEAD without changing branches or resetting files, and say so.
- Write only `docs/reviews/round-04/<reviewer-slug>/verification.md` and, if needed, evidence files in that folder (screenshots, JSON from checks). Do not edit application code, content, schemas, requirement documents, ADRs, the decision log, or other reviewers' files. Do not commit, push, or publish; the owner merges your branch.
- You may read every earlier round under `docs/reviews/` as history. Do **not** read other reviewers' `round-04` files until all three reports exist and a synthesis is explicitly requested.
- Every claim about the repository must cite a path, and where relevant a heading or symbol, that exists at the baseline. Every claim about behaviour must say whether you ran it (command or browser step) or inferred it from source. Do not restate another report's test results as your own. If you cannot verify something, write "cannot verify" and why; that is a valid answer.

## Read first

`AGENTS.md` and its required documents; `docs/vision.md`; `docs/product-principles.md`; `docs/design/learning-experience.md`, `exercise-experience.md`, `design-principles.md`; `docs/learning/learning-model.md`, `mastery.md`, `skill-graph.md`; all accepted ADRs in `docs/architecture/decisions/` and both proposals in `docs/architecture/proposals/`; `content/AGENTS.md`, `content/README.md`, the skills and example exercise, the schemas, `tools/validate-content.mjs` and its tests, `.github/workflows/`; `docs/reviews/round-01/decision-log.md`; `docs/reviews/round-01/claude-fable/revised-build-brief.md` and `revised-build-brief-corrections.md` (the planning reference); `docs/reviews/round-02/synthesis.md`; `Prototype/mathkx-designsystemet/HANDOFF.md`, `docs/iteration-2/*.md`, `src/`, and `tests/`.

## Run

From the repository root: `npm ci`, `npm test`, `npm run validate`. In `Prototype/mathkx-designsystemet`: `npm ci`, `npm test`, `npm run build`, and `npm run test:browser` if Playwright and Chromium are available to you (`npx playwright install chromium` once). Record exact outcomes, counts, and anything you could not run. Open the built prototype in a browser if you can and walk the flows named in the checklist; say which browser and which viewport sizes. Desktop emulation is not an iPad; do not claim device support.

## Checklist

Answer each item **Yes**, **No**, or **Cannot verify**, with evidence. For **No**, name the smallest correction and which file it belongs in.

1. **Consistency of the record.** Do `docs/vision.md`, `product-principles.md`, the design and learning documents, `architecture.md`, the ADRs, and the decision log agree with each other? List any statement that contradicts an accepted decision (for example a document still calling persistence undecided after ADR 0008).
2. **Decisions resolved or deferred.** Is every row in the decision log either an owner decision, implementation guidance, or an explicitly deferred item with an owner and a trigger? List rows that are still pending and whether each blocks a feature below.
3. **Planning reference.** Do the revised brief and its corrections addendum, read together, give one unambiguous first milestone, cut order, identity rule, result statuses, and observation rules, consistent with `mastery.md#progress-tracking-before-a-mastery-algorithm` and `exercise-experience.md#explaining-why-the-result-follows`? Name any remaining contradiction between those two files or between them and the documents.
4. **Prototype as reference.** For each flow below, does prototype iteration 2 behave as the documents describe, in Norwegian Bokmål and English, and is the behaviour marked as reference or as simulation? Flows: help before answering; explanation before and after a correct and an incorrect answer, with explicit reveal; counting to the total; "Another question", "Make it easier", "More challenge", "More like this" with a pending change; finishing a session with a draft; the self-check policy, the switch to supported practice, and the summary; "My learning" and the skill-progress page after a check; lesson detour and return; profile setup without email and with a pending email; sign-in with guest work present.
5. **Tests and checks.** Do the root and prototype test suites and the content validation pass at the baseline, and what do they not cover? State whether the browser suite ran and in which configurations.
6. **Content contract readiness.** Could a contributor write a second lesson and a second exercise definition today from the documents, the pilot content contract in the corrections addendum §F, and the prototype's `lesson.json` and Markdown, without guessing a field or a directive? List every field or rule that is still undefined.
7. **Identity and reproducibility.** Does the planned rule (configuration equals versioned definition; identity `(definition ID, version, seed)`; per-skill ladder; fixed tasks without a seed) satisfy ADR 0004 and `learning-experience.md#adjusting-challenge`, and is the random-source proposal's fixture set sufficient to begin the C# implementation?
8. **Bilingual completeness.** Are the prototype's dictionaries and lesson pairs complete and consistent in both languages, and is a translation-completeness check specified for CI? Name any learner-visible string outside the dictionaries.
9. **Accessibility and device status.** What has actually been verified (by whom, how) for keyboard operation, screen readers, touch targets, reduced motion, and iPad Safari, and what has not? Do not count claims you did not reproduce.
10. **Release gates visible.** Are profiles without personal details, optional verified recovery email, cross-device progress on PostgreSQL, both languages, and actual-device and assistive-technology validation each present in the release plan as gates, separate from proposed additions?

## Candidate features for specification

For each feature, give a verdict: **Ready** (inputs sufficient to write a specification now), **Ready with corrections** (name them), or **Not ready** (name the blocking decision or gap). Inputs means: requirement sources, a prototype reference or an explicit statement that none exists, acceptance criteria, and no blocking decision-log row.

| # | Candidate feature | Primary sources |
| --- | --- | --- |
| F1 | Pilot content contract and validator: lesson schema, exercise-definition pilot schema, per-skill ladder, extended `tools/validate-content.mjs` | Corrections addendum §F; `content/AGENTS.md`; `proposals/lesson-markdown-and-delivery.md`; prototype `lesson.json` |
| F2 | .NET domain: seeded random source, addition generator version 1, two definitions, validator with misconception codes, result and observation types | ADR 0003, 0004; `proposals/seed-and-random-source.md`; capability model §6–§9; addendum §D–§E |
| F3 | Thin API: instance and validate endpoints, private data server-side | `architecture.md`; ADR 0009; addendum §D |
| F4 | Web practice flow: shell, help before answering, explanation with explicit reveal, feedback by code, another question, both languages | `exercise-experience.md`; ADR 0007; prototype `ExerciseShell`, `Visuals`, `Counters`, `TenFrame` |
| F5 | Lesson rendering: Markdown with `:::visual`, `:::example`, `:::practice` directives, section anchors, lesson detour and return | `proposals/lesson-markdown-and-delivery.md`; prototype `Markdown.jsx`, lesson files |
| F6 | Observations and progress: per-delivery observations, outcomes, learner home and skill progress, honest labels | `mastery.md`; addendum §E; prototype `observations.js`, `Home.jsx` |
| F7 | Challenge ladder, repeat handling, and session controls: easier, harder, more like this, finish, resume | `learning-experience.md#more-practice-and-learner-control`; prototype `practice.js`, `store.jsx` |
| F8 | Self-checks: policy screen, independent default, switch to supported practice, summary, history (deferred from the first milestone; verify spec readiness only) | `learning-experience.md`; `exercise-experience.md#help-during-checks-of-understanding`; prototype `CheckPage`; DL-028 |
| F9 | Profiles, recovery, and progress persistence on PostgreSQL (release scope; verify that the design inputs exist, not that it is ready to build) | ADR 0006, 0008, 0009; CLAUDE-FABLE-R01-007; DL-007, DL-027 |

## Deliverable

`docs/reviews/round-04/<reviewer-slug>/verification.md` containing, in this order: baseline and identity; commands run with outcomes; the ten checklist answers with evidence; the feature verdict table; a list of corrections (each with the file it belongs in, no more than one sentence of rationale); what you could not verify; and a one-paragraph overall verdict: **ready to specify**, **ready to specify with the named corrections**, or **not ready**, with the blockers. Keep it under about 250 lines. Prefer tables and file references to prose.

## What this round is not

Not a redesign, not a new recommendation list, not a mastery or difficulty model, not a decision on behalf of the owner, not learner, educator, translator, or device validation. Those human checks are scheduled by the owner alongside this round; if their results exist at the baseline, cite them; if not, say they are missing.
