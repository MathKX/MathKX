# Architecture diagrams

Two draw.io diagrams of the decided direction. Each exists twice: a `.drawio` source and a `.drawio.svg` export that renders anywhere and still opens in draw.io for editing (the diagram XML is embedded in the SVG).

| Diagram | Shows | Sources |
| --- | --- | --- |
| [mathkx-architecture.drawio.svg](mathkx-architecture.drawio.svg) | Contribution and CI, repository layout, the Azure App Service deployable (React app, thin API, C# domain, packaged content), PostgreSQL, learners, and what is deliberately undecided | [architecture.md](../architecture.md), ADR 0001–0010, decision log DL-001–DL-040 |
| [mathkx-data-model.drawio.svg](mathkx-data-model.drawio.svg) | The content contract (skill, lesson, translation, directive, exercise definition, the five registries) and the runtime concepts whose storage shape is not yet designed | [spec 001 data model](../../../specs/001-pilot-content-contract/data-model.md), ADR 0004, 0006, 0008 |

Solid shapes are decided or existing; dashed shapes are planned or undecided. When a decision changes, update the `.drawio` file in draw.io (or open the `.drawio.svg` directly), re-export the SVG with "Include a copy of my diagram", and keep both files in the same change.
