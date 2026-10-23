# Content guidance

This file applies to everything under `content/` in addition to the root [AGENTS.md](../AGENTS.md). The [authoring guide](AUTHORING.md) documents every field, directive, attribute, and notation rule the check enforces; read it before adding a lesson, an exercise definition, or a ladder.

- Use stable, language-neutral IDs such as `algebra.linear-equations`; do not put countries, curricula, grades, or display languages in skill identity.
- Keep skills independent from curricula. Curriculum records map competency goals to skills rather than redefining them.
- Prefer reusable exercise families over lists of fixed questions.
- Treat JSON as content and configuration. Request a named code extension when mathematical logic is needed; do not embed a programming language in data.
- Preserve deterministic generation. Parameters are integers; they must not rely on current time, ambient randomness, or machine locale.
- Do not assume answers are text fields; describe the intended mathematical interaction.
- Write content so it can be localized and accessed with assistive technology. Do not use color or pointer input as the only carrier of meaning.
- Run `npm run validate` after changing anything under `content/`; it checks schemas, registries, skill references, the prerequisite graph, ladders, exercise definitions, and lesson pairs. Keep examples intentionally small.
- Every exercise must reference a skill defined under `content/skills/`. Add the skill in the same change if it does not exist.
- Exercise `(id, version)` pairs must be unique. Localized content must share mathematical identity rather than duplicate definitions under the same ID and version.
- Lessons: one folder per lesson under `content/lessons/`, named after its `id`, with `lesson.json`, `nb.md`, and `en.md`. Both languages ship together. The two files share the same anchors, the same directives by identity, and the same mathematics per section; prose and order are free.
- Exercise definitions name generators, validators, representations, and misconception codes by registered name and version only. Every representation a definition lists must cover the definition's whole value range; the check refuses a family its help cannot show.
- Registries under `content/registry/` are reviewed data describing what tested code provides. Change a registry only together with the code it describes, in the same change.
- The first release requires Norwegian and English learning content, including help and accessible descriptions. The exploratory English-only `0.1` exercise is not release-ready content.
- Update the authoring guide and schema together when their contract changes; the pilot contract (`0.1-pilot`) grows additively.

The `0.1` exercise schema and its example are exploratory artifacts, not a stable authoring contract. The `0.1-pilot` lesson, definition, and registry schemas are the pilot contract: narrow by design and not Exercise Format v1.
