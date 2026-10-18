# ADR 0010: License code under MIT and content under CC BY-SA 4.0

**Status:** Accepted (owner decision, 2026-10-18; decision log DL-008)

## Context

MathKX is intended as an open-source project to which developers, educators, translators, and learners contribute. Until now the repository had no licence, so nobody could legally reuse it or contribute to it, and `CONTRIBUTING.md` said outside contributions could not be incorporated. Code and learning content serve different purposes and are commonly licensed differently: code to allow reuse in other software with minimal friction, content to keep improved explanations and translations available to everyone.

Options considered: MIT or Apache-2.0 for code; Creative Commons Attribution 4.0 or Attribution-ShareAlike 4.0 for content. Apache-2.0 adds an explicit patent grant; MIT is shorter and more widely recognised. CC BY allows closed derivatives; CC BY-SA requires derivatives of the content to stay under the same terms.

## Decision

- **Code and documentation** are licensed under the **MIT License**. This covers application source, the content tooling under `tools/`, the schemas under `schemas/`, build and CI configuration, the prototype source under `Prototype/`, and the project documentation under `docs/`. The licence text is in [`LICENSE`](../../../LICENSE) at the repository root.
- **Learning content** is licensed under **Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)**. Learning content means everything under `content/`: skills, exercise definitions, lessons, translations, and their assets. The licence text is in [`content/LICENSE`](../../../content/LICENSE).
- Contributions are accepted under the licence of the area they change. `CONTRIBUTING.md` states this; no separate contributor licence agreement is introduced.
- Third-party material (fonts, images, datasets, quotations) may be included only under a licence compatible with the area it lands in, with attribution recorded alongside it.
- Learner-facing surfaces that mention licensing (the About page) state the two licences and link to the repository.

The copyright holder named in the MIT text is "Rune T. Larsen and the MathKX contributors".

## Consequences

- Outside contributions can now be accepted; the interim wording in `CONTRIBUTING.md`, `README.md`, and the prototype's About text is replaced.
- Derivatives of lessons and exercise content must remain under CC BY-SA 4.0, which keeps improved content open but prevents mixing it into content under incompatible terms. Code and documentation can be reused under MIT.
- Rendered learner-facing content should carry an attribution notice when the application is released; the exact wording is an implementation detail of the first web release.
- Package manifests declare `"license": "MIT"`; a `LICENSE` file sits under `content/` so that the content licence travels with the content when it is consumed separately.
- This record is the project's decision, not legal advice. If the maintainers later obtain legal review, changes are recorded as a new ADR rather than by editing this one.
