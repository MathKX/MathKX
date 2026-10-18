# ADR 0007: Use Designsystemet and Tailwind for the web UI

**Status:** Accepted

## Context

MathKX needs consistent, accessible controls for lessons, practice, profiles, and navigation alongside specialized mathematical representations. The planned React/TypeScript frontend should reuse a maintained UI foundation while supporting the project's calm visual identity and responsive layouts.

Designsystemet supplies React components, CSS, and theme tokens. Its CSS package documents integration with Tailwind, including handling Tailwind's Preflight reset. These tools serve complementary roles when their responsibilities are explicit.

## Decision

- Use Designsystemet's React components and CSS as the foundation for standard UI controls. Prefer supported component variants and composition over rebuilding equivalent controls.
- Use Tailwind CSS for responsive layout, spacing, positioning, and application-specific composition. Avoid routinely overriding component internals or replacing their focus, error, and interaction states with utilities.
- Define MathKX's visual identity through a Designsystemet theme. Reuse its semantic design tokens in custom components and any Tailwind theme mappings rather than maintaining competing color and typography systems.
- Build mathematical representations such as counters, fraction bars, number lines, and coordinate systems as reusable MathKX components. Use the shared theme and standard controls where appropriate; keep mathematical generation and validation in domain code.
- Keep lessons and exercise definitions independent of Designsystemet components and Tailwind classes. Content names semantic interactions and representations that the frontend resolves.

## Consequences

- The first frontend implementation should use `@digdir/designsystemet-react`, `@digdir/designsystemet-css`, and Tailwind. Select and pin compatible package versions when the application is created; this decision does not scaffold it.
- Follow the installed versions' CSS import and cascade-layer guidance. Tailwind's Preflight reset and utilities must not unintentionally alter Designsystemet controls, rendered lesson headings/lists, or mathematical diagrams. Keep the integration in one documented stylesheet entry point.
- Verify a representative exercise with an answer field, feedback, and visual-help control at mobile and desktop sizes, in Norwegian and English, with keyboard navigation, screen-reader feedback, zoom, and reduced motion as applicable.
- Designsystemet supports accessibility work but does not establish accessibility for the complete application or its custom mathematical interactions. MathKX remains responsible for those behaviors and for localizing learner-facing labels and messages.
- Contributors can improve lessons without understanding the UI libraries. UI contributors have a shared component and styling convention.
- Exact package versions, Tailwind integration, token mappings, and final theme values will be resolved with the first working frontend.

## References

- [Designsystemet setup](https://designsystemet.no/en/fundamentals/code/setup)
- [Designsystemet CSS guidance](https://designsystemet.no/en/fundamentals/code/css)
- [Designsystemet CSS package Tailwind guidance](https://github.com/digdir/designsystemet/blob/main/packages/css/README.md)
- [Tailwind Preflight](https://tailwindcss.com/docs/preflight)
