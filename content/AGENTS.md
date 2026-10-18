# Content guidance

This file applies to everything under `content/` in addition to the root [AGENTS.md](../AGENTS.md).

- Use stable, language-neutral IDs such as `algebra.linear-equations`; do not put countries, curricula, grades, or display languages in skill identity.
- Keep skills independent from curricula. Curriculum records map competency goals to skills rather than redefining them.
- Prefer reusable exercise families over lists of fixed questions.
- Treat JSON as content and configuration. Request a named code extension when mathematical logic is needed; do not embed a programming language in data.
- Preserve deterministic generation. Parameters must not rely on current time, ambient randomness, or machine locale.
- Do not assume answers are text fields; describe the intended mathematical interaction.
- Write content so it can be localized and accessed with assistive technology. Do not use color or pointer input as the only carrier of meaning.
- Run `npm run validate` after changing JSON; it checks schemas, skill references, and the prerequisite graph. Keep examples intentionally small.
- Every exercise must reference a skill defined under `content/skills/`. Add the skill in the same change if it does not exist.
- Update the format documentation and schema together when their contract changes.

The current schema and example are exploratory `0.1` artifacts, not a stable authoring contract.

