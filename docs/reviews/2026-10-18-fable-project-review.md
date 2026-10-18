# MathKX project review — a report from Fable

**Author:** Claude Fable 5.1 (Anthropic), working as an AI reviewer in a Claude Code session.
**Requested by:** Rune T. Larsen.
**Date:** 2026-10-18.
**Scope:** everything tracked in the repository at commit `bfaefe8` (24 files: documentation, one JSON schema, one example exercise, one interactive prototype), plus the public GitHub repository metadata.

This report is an outside analysis, not a decision record. Where it recommends something, the project's own ADR process in `docs/architecture/decisions/` remains the place to decide it.

## Integration notes

The report below is preserved as a historical review of `bfaefe8`, not as the current implementation plan. Foundation integration retains the repository hygiene files, contributor guidance, illustrative seven-skill registry, schema/reference/cycle validation, and CI. Validator regression tests now also cover conflicting exercise identities and invalid document shapes.

The following current requirements take precedence over recommendations in this report:

- [Profiles and optional email recovery](../architecture/decisions/0006-support-profiles-without-personal-details.md) require saved progress across sessions and devices. Section 7's local-storage-only recommendation is superseded; local state is sufficient only for a prototype, not the released profile feature.
- The [vision](../vision.md) establishes coverage through university mathematics, Norwegian and English in the first release, and iPads as a primary learner device.
- The [learning experience](../design/learning-experience.md) includes lessons, exploration, practice, and checks of understanding, with a proposed Markdown authoring workflow. [Visual help](../design/exercise-experience.md#visual-help-on-request) is available on request where appropriate.
- [ADR 0007](../architecture/decisions/0007-use-designsystemet-and-tailwind.md) selects Designsystemet and Tailwind. Custom mathematics components retain their accessibility and domain boundaries.
- The randomness work remains a [proposal](../architecture/proposals/seed-and-random-source.md), with rejection and boundary tests required before adoption. ADR numbers suggested in this historical report are not reserved.
- The prototype's Pythagoras story and seed graph remain illustrative. They do not mandate the first lesson, a complete taxonomy, mastery percentages, or automatic prerequisite diagnosis. The first lesson/exercise slice should validate the bilingual, visual, touch-accessible learner journey alongside tested domain code.

Licenses and a private conduct-reporting contact remain explicit maintainer decisions. No license or contact is inferred by this integration.

---

## 1. Summary

MathKX is a foundation-stage project with an unusually strong conceptual base and no executable code. The documentation is coherent, the five ADRs are consistent with each other, and the exercise capability model is one of the more careful pieces of pre-implementation design I have seen in an open-source learning project. The interactive prototype shows that the team already knows what the learner experience should feel like.

The main risk is not design quality. It is that the project has been standing still since its only commit on 2026-08-12, and that the next steps the documents call for (a vertical slice, a license, validation tooling) are all cheap compared with the design work already done. The project has thought past the point where thinking alone produces returns.

My recommendations fall in three tiers:

1. **Unblock contribution this month** with a license, repository hygiene, continuous validation of content, a seed skill registry, and a decided random-number contract. All of these are small and none conflicts with the "do not scaffold prematurely" rule.
2. **Build the vertical slice the capability model already prescribes**, as a tested .NET domain library first, using the prototype's Pythagoras and square-roots story as the first real content.
3. **Time-box Exercise Format v1** against the acceptance scenarios the model already names, and let the slice shape it.

Section 7 lists what I would deliberately not do yet.

---

## 2. What is in the repository

| Area | Files | State |
| --- | --- | --- |
| Root guidance | `README.md`, `AGENTS.md` | Clear, consistent, points to the right documents in the right order |
| Product and learning docs | `docs/vision.md`, `docs/product-principles.md`, `docs/learning/*` | Complete for the stage; vocabulary is shared across all files |
| Architecture | `docs/architecture/architecture.md`, `exercise-format.md`, `exercise-capability-model.md`, five ADRs | The capability model (991 lines) is the center of gravity |
| Design | `docs/design/design-principles.md`, `exercise-experience.md` | Good; short |
| Content | `content/AGENTS.md`, `content/README.md`, one example exercise | Schema and example explicitly marked exploratory 0.1 |
| Schema | `schemas/exercise.schema.json` | Syntax-only, as documented |
| Prototype | `Prototype/MathKX Learner Experience.dc.html`, `support.js`, `.thumbnail` | Working click-through of dashboard, skill map, exercise, prerequisite detour, summary |
| Code, tests, CI, license | none | Absent |

GitHub: public repository, no description, no license detected, issues enabled but empty, no pull requests, last push 2026-08-12.

---

## 3. Strengths worth protecting

**The ADRs and the capability model agree with each other.** ADR 0005 and section 15 of the capability model record the same decisions in the same words. The learning model, the format document, and the content guidance all defer to the capability model instead of restating it. That is rare and it makes the project easy to onboard into.

**The "decision / recommendation / proposed direction / open question" discipline.** Section 1 of the capability model defines these four words and the rest of the document uses them consistently. Future contributors can tell at a glance what is settled.

**Honest about what is not known.** Mastery, persistence, authentication, symbolic equivalence, AI grading, and hosting are all explicitly open. The documents resist the temptation to pick a mastery formula or a database before there is any evidence to choose with.

**The prototype demonstrates the core pedagogical loop.** Goal (Pythagorean theorem), blocked prerequisite (square roots), short detour with an area model, return to the original triangle with the learner's work intact, and a summary. That loop is the product thesis in `docs/vision.md`, and seeing it work is far more persuasive than any paragraph. The prototype also takes accessibility seriously for a mockup: skip link, focus management on view change, reduced-motion handling, a list view as an equal alternative to the skill diagram, live regions for feedback, and value text on the side-length control.

**Wrong-answer feedback is specific.** The prototype's diagnosis of 14 (added the legs), 100 (forgot the square root), and 48 (multiplied the legs) is exactly the kind of misconception-candidate feedback the capability model calls for in section 8. This should become the first authored misconception pattern in real content.

**The recommended initial slice is already written down.** Section 13 of the capability model says what the first implementation should prove: choice, scalar/quantity, simple ordering/classification, one discrete spatial interaction, structured content, deterministic generation, authored hints, typed validation results, and evidence provenance. Nobody needs to re-derive the plan.

---

## 4. Findings

Findings are ordered by how much they block progress, not by how hard they are to fix. Most of the high-impact ones are easy.

### F1. The project calls itself open source but has no license

`README.md` says "Contribution workflows and licensing are not established yet." Without a license file, the default under copyright law is all rights reserved. Nobody can legally fork, reuse, or contribute, and any contributor who does so creates an ownership ambiguity that gets harder to clean up with every additional author. GitHub also shows no license on the repository page, which is the first thing many potential contributors look at.

This is the single most important fix in the report, and it is a one-hour decision plus two files.

### F2. Nothing is executed anywhere

There is no build, no test, no script, and no CI. The schema exists but nothing validates the example against it. `docs/architecture/architecture.md` says "No CI has been added before there is a stable validation workflow to run." I think that gets the order backwards: a CI job that validates `content/exercises/examples/linear-equation-basic.json` against `schemas/exercise.schema.json` is the stable validation workflow in its smallest form. It establishes the habit that content is checked by machine before review, which `docs/product-principles.md` promises under "Grow through open contribution."

### F3. Skill identifiers exist only in prose

Skill IDs such as `numbers.square-roots`, `algebra.linear-equations`, and `geometry.pythagorean-theorem` appear in the docs, the example exercise, and the prototype, but there is no canonical skill file. The example exercise references a skill that does not exist anywhere as data. The architecture document lists "references to existing skills and generators" as a future automated check, but there is nothing to check against. A six-to-eight node skill file taken from the prototype's graph would make the first semantic validation possible and would anchor the first real content.

### F4. Determinism is decided but its primitives are not

ADR 0004 commits to reproducible generation from (definition ID, version, seed), but the seed representation and the random-number algorithm are both listed as open. Every generator, every golden-seed test, and every bug report depends on these two choices. They are cheap to make and expensive to change later. Two specific hazards:

- Microsoft documents that `System.Random` is not guaranteed to produce the same sequence across .NET versions, and its default algorithm already changed once in .NET 6. It must not be the generator behind a reproducibility promise.
- If any generation or preview ever runs in the browser, the algorithm must be specified tightly enough to implement identically in C# and TypeScript.

### F5. The prototype is undocumented and partly unreproducible

- `Prototype/` is not mentioned in `README.md` or any document, so a reader has no idea what it is for or what it does and does not decide.
- `Prototype/support.js` (71 KB) is generated code whose header says to rebuild from `dc-runtime/src/*.ts`, which is not in the repository.
- `Prototype/.thumbnail` is a binary WebP image with no clear purpose in version control.
- The directory name is capitalized while every other directory is lowercase.
- The prototype hardcodes several things the documents say are undecided: a mastery threshold of 80 percent, intervention after the second wrong answer, mastery jumping from 38 to 61 percent after one exercise. These are fine as illustration, but without a label they will become de facto decisions by repetition. `docs/learning/mastery.md` says one attempt does not establish mastery; the prototype's summary screen shows exactly that happening.

### F6. The capability model is far ahead of everything else

At 991 lines, the capability model is roughly five times the size of all other documentation combined and infinitely larger than the codebase. It is excellent, and it says in several places that the first real generator should inform the interfaces. The risk is cultural rather than technical: a project that produces one more design document before it produces one passing test is signalling to contributors that writing is the work. The model's own section 17 ends with "Implement only the recommended initial slice." That sentence should now become the plan.

### F7. The stack decision creates a question the slice must answer

The architecture places all mathematical logic in .NET and the learner experience in React. That is a sound separation, but it means every generated instance, every validation, and every authoring preview needs a server round trip, or a second implementation in TypeScript, or .NET compiled to WebAssembly. The documents do not raise this. It does not need to be decided now, but the vertical slice should be designed to surface it: build the domain library first, then decide how the web layer reaches it.

### F8. Small documentation inconsistencies

- `docs/learning/skill-tree.md` is titled "Skill graph" and argues against the tree metaphor; the filename contradicts the content. No other document links to it, so a reader following the README's reading order never finds it.
- `content/README.md` promises `skills/` and `curricula/` directories; `docs/architecture/architecture.md` promises `tests/`; none exist yet, which is intentional, but the two documents describe the layout slightly differently.
- `README.md` and `AGENTS.md` list the same seven documents to read, but in different orders (the README puts the capability model before the exercise format, `AGENTS.md` the reverse). Trivial, but the two lists should be one, and the format document itself says the capability model should be read first.
- There is no roadmap or milestone document. A contributor who finishes reading has no idea what to pick up.

### F9. Repository hygiene files are missing

No `.gitignore`, `.editorconfig`, `.gitattributes`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, or `SECURITY.md`. For a project that explicitly wants educators and translators as contributors, `CONTRIBUTING.md` matters more than usual: it is where a non-developer learns that a content change is a pull request and what checks it has to pass. Line-ending normalization via `.gitattributes` matters because the project is developed on Windows and will attract contributors on macOS and Linux.

---

## 5. Recommendations

### Tier 1 — unblock contribution (small, this month)

**R1. Choose and commit licenses.** Code and content usually want different licenses. A common pairing for educational projects is a permissive code license (MIT or Apache-2.0; Apache-2.0 adds an explicit patent grant) with a Creative Commons license for authored content (CC BY 4.0, or CC BY-SA 4.0 if you want derivative content to stay open). Record the choice as ADR 0006, add `LICENSE` at the root and a `LICENSE` or `LICENSE.md` under `content/`, and update the README's contributing section. Also set the GitHub repository description.

**R2. Add the hygiene files.** `.gitignore` covering .NET, Node, and editor artifacts; `.editorconfig` with UTF-8, LF, and final newline; `.gitattributes` with `* text=auto eol=lf`; a short `CONTRIBUTING.md` that explains the two contribution paths (code, content) and points to the AGENTS files; a `CODE_OF_CONDUCT.md`. None of this is scaffolding in the sense `AGENTS.md` warns against.

**R3. Validate content in CI.** One GitHub Actions workflow on pull requests and pushes to `main` that validates every `content/**/*.json` against its declared schema. A single Node script using `ajv` or a .NET script using `JsonSchema.Net` is enough. This turns the schema from documentation into a gate, and gives every later check (skill references, generator names, golden seeds) a place to live.

**R4. Create the seed skill registry.** Add `content/skills/` with one JSON file per skill (or one file for all), a `schemas/skill.schema.json`, and the six skills the prototype already names: integer operations, powers, square roots, area and perimeter, Pythagorean theorem, right-triangle trigonometry. Each skill carries only an ID, prerequisites, and a note that names and descriptions are localized elsewhere. Extend the CI check to verify that every exercise's `skill` resolves and that the prerequisite graph is acyclic. Add `algebra.linear-equations` so the existing example validates, or change the example to use one of the six.

**R5. Decide the seed and random-number contract.** ADR 0007: seed is an unsigned 64-bit integer, serialized as a decimal string in JSON to avoid JavaScript precision loss; the generator random source is a named, specified algorithm with a published reference implementation and test vectors (SplitMix64 is the simplest to implement identically in C# and TypeScript; PCG32 and xoshiro256** are also reasonable). State explicitly that `System.Random` and `Math.random` are never used in generation. Commit the test vectors with the ADR so the first implementation has something to pass.

**R6. Document and tidy the prototype.** Rename `Prototype/` to `prototype/` (or move it to `docs/design/prototype/`). Add a `README.md` beside it that says what it demonstrates (the detour-and-return loop, calm visual language, accessible alternatives to the diagram), how it was built, and a short list of things in it that are illustrative and not decided: the 80 percent threshold, the second-wrong-answer trigger, the mastery deltas, the English-only text, the specific colors. Either commit the `dc-runtime` source or state where it lives. Remove `.thumbnail` or explain it.

**R7. Fix the small documentation drift (F8).** Rename `skill-tree.md` to `skill-graph.md` and link it from `learning-model.md`, where the skill graph is introduced. Reconcile the directory layouts between `content/README.md` and `architecture.md`. Make `README.md` and `AGENTS.md` share one reading list.

### Tier 2 — build the slice (the next real milestone)

**R8. Start with a .NET domain library and its tests, not with the web application.** Create `src/backend/MathKX.Domain/` (or whatever boundary the first task makes obvious) with:

- the `Rational` value type the capability model's validation table assumes (exact rationals, no floating point in the core);
- the seeded random source from R5;
- a generator interface that receives a seed and typed parameters and returns a typed instance with public presentation data and private validation data;
- a validator interface that receives a response artifact and returns the typed result from capability model section 7 (status, criteria, feedback codes, misconception candidates), never a Boolean;
- an evidence event type with the minimum provenance from section 9.

Prove all of it with one generator before writing a second. Golden-seed tests, replay tests, and generator-validator agreement tests go in from the first commit.

**R9. Make the prototype's story the first real content.** The first generator should produce right triangles with integer sides (Pythagorean triples, scaled) with the hypotenuse unknown, and the second should produce perfect-square areas for the square-roots detour. This gives the slice a scalar response, authored hints, three authored misconception patterns (14, 100, 48 from the prototype), two skills with a real prerequisite edge, and a pedagogical reason for the whole thing to exist. The linear-equation example can stay as the second generator.

**R10. Cover the four response families the model names.** Scalar/quantity (R9), choice (the prototype's square-root multiple choice), simple ordering (order square roots or areas by size), and one discrete spatial interaction (place a value on a number line). Each needs a response artifact type, a validator, and a test. Do not build geometry canvases, equation balances, or simulations in this slice; the model explicitly phases them later.

**R11. Decide where generation runs, using the slice as evidence.** Once the domain library exists, prototype the web layer twice if needed: once calling an ASP.NET Core endpoint, once with the library compiled to WebAssembly. Record the outcome as an ADR. The privacy principle in `docs/product-principles.md` (prefer anonymous use) and the learner story (one 14-year-old, today) both push toward something that works without an account or a server session, which is a point in favor of client-side generation if the WebAssembly path is viable.

**R12. Carry two locales from the first screen.** The documents mention Norwegian and English. The first web slice should ship both, with all learner-visible strings behind stable message keys and locale-aware number parsing, so that "English is canonical" never silently becomes true. This is much cheaper at the start than as a retrofit.

### Tier 3 — shape Format v1 and the project around the slice

**R13. Time-box Exercise Format v1 design.** Use the acceptance scenarios section 17 already names (S1, S2, S3, S4, S8, S11, S12, S14, S15, S16) as fixtures, and follow its six-step design sequence, but run it alongside the slice rather than before it. The format should be the serialization of types the slice has already made work, not a specification the slice then has to satisfy.

**R14. Write a one-page roadmap.** `docs/roadmap.md` with three milestones: foundation hygiene (Tier 1), domain slice (Tier 2), first learner-usable web slice. Each milestone lists the concrete deliverables and what it deliberately excludes. Open GitHub issues for the Tier 1 items so there is visible work for a newcomer to pick up.

**R15. Plan assistive-technology testing before the first interactive component.** The capability model is emphatic that an accessible alternative must preserve the mathematical objective, and that this must be tested with real assistive technology and real learners. Decide now which screen readers and platforms are in scope (at minimum NVDA on Windows and VoiceOver on iOS and macOS, given the audience), and make a manual accessibility check part of the definition of done for every interaction family.

---

## 6. A note on the mastery numbers in the prototype

The prototype shows square roots moving from 41 to 68 percent and the Pythagorean theorem from 38 to 61 percent in one session, with mastery reached at 80 percent. These are good storytelling numbers and they make the summary screen satisfying. They also quietly assert that mastery is a percentage, that a threshold exists, and that one short detour moves a skill by a quarter of the scale. `docs/learning/mastery.md` lists all three as open questions. I am not suggesting the prototype change. I am suggesting the project write down, next to the prototype, that these are placeholders, before someone implements a progress bar that matches the mockup and the question is settled by accident.

---

## 7. What I would not do yet

- **Do not pick a mastery algorithm.** The slice should emit evidence events and display raw outcomes. A real learner using the system for a few weeks will say more about what mastery should mean than any model chosen now.
- **Superseded recommendation — do not add authentication or persistence beyond local storage.** This was based on the old one-person, one-device assumption. See the integration notes and ADR 0006 for the current saved-profile requirement.
- **Do not add a symbolic algebra engine.** Exact rationals and scalar validation carry the whole first slice. The model phases symbolic equivalence as "later" for good reasons.
- **Do not write another large design document.** The capability model is sufficient input for v1. The next design artifact should be a schema or a type, produced because code needed it.
- **Do not build an authoring tool.** Pull requests against JSON validated in CI are the authoring tool until there is content enough to need more.

---

## 8. How this report was produced

I read every tracked file in the repository, including the full exercise capability model and the prototype's template and logic, checked the public GitHub repository for license, description, issues, and pull requests, and compared the documents against each other and against the prototype for consistency. I did not run any code, because there is none to run. Recommendations about licenses and random-number algorithms are general engineering guidance, not legal advice; the license choice in particular is the maintainer's decision.

*— Fable*
