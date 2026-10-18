# Design principles

MathKX should feel like a polished learning environment rather than a digitized worksheet. These principles apply to future interfaces and content experiences.

The web UI will use Designsystemet for standard components and theming, Tailwind for layout and composition, and custom accessible components for mathematical representations. [ADR 0007](../architecture/decisions/0007-use-designsystemet-and-tailwind.md) defines these responsibilities. Shared theme tokens should give all three a consistent visual identity.

## Calm and focused

Give the mathematical idea visual priority. Use clear hierarchy, deliberate spacing, restrained color, and motion with a purpose. Avoid noisy reward systems and unnecessary urgency.

## Modern, not childish

Design for a 14-year-old without talking down to them. The visual language should remain credible for older learners too. Encouragement should be specific and sincere rather than built from cartoons, exaggerated praise, or constant prizes.

## Visual where it teaches

Use number lines, fraction bars, balance models, graphs, geometry, and simulations when they expose structure. A visualization may explain, demonstrate, form the question, or receive the answer. Decorative diagrams should not compete with learning.

Allow learners to answer directly or reveal a relevant visual explanation when they need one, without requiring an incorrect attempt first. Preserve their work and distinguish teaching help from the accessible representation of the original task. See [visual help on request](exercise-experience.md#visual-help-on-request).

## Clear feedback

Feedback should help the learner decide what to do next. Distinguish input errors from mathematical misconceptions, preserve the learner's work where helpful, and explain validation in language appropriate to the context.

## Encouraging progress

Reward effort, improvement, consistency, and demonstrated mastery. Do not use global leaderboards or activity targets that make a struggling learner feel further behind. A prerequisite detour should feel like useful progress, not punishment.

## Accessible by default

Future components should support keyboard navigation, screen readers, semantic mathematical representations, sufficient contrast, color-independent meaning, reduced motion, zoom, responsive layouts, and touch. Interactive visual answers need an equivalent accessible path without reducing the mathematical task.

## Trustworthy interaction

The UI presents domain decisions; it does not invent them. Mathematical generation and validation belong in deterministic, tested logic. Clearly communicate assumptions and accepted answer forms.

## Responsive to context

The experience should work on mobile devices and larger screens without turning either into a secondary mode. Language length, reading direction, input method, and curriculum context must not be hardcoded into layouts.

### iPad and touch use

iPad use is a first-release design and validation requirement. Build the core experience for fingers and an on-screen keyboard as well as mouse and keyboard input.

- Provide comfortably sized, separated touch targets; use at least 44 by 44 CSS pixels as the MathKX target for primary actions and interactive handles, with a larger hit area when a visible mathematical object is small.
- Keep essential actions available without hover, precise dragging, multi-finger gestures, or an Apple Pencil. Offer tap-based or direct-entry alternatives to dragging.
- Support portrait, landscape, and narrower windows without losing the current exercise or work. Reflow the layout according to available space rather than assuming a fixed tablet width.
- Keep the active answer field, validation feedback, and submit/help actions reachable when the on-screen keyboard is open. Do not depend on fixed-height panels or sticky controls that cover the work.
- Preserve normal page scrolling and browser zoom. Limit gesture handling to the interaction that needs it and provide a clear way to leave that interaction.
- Keep visuals responsive and avoid unnecessary continuous animation. Reduced-motion and non-visual alternatives remain part of the same learning task.

Actual-device checks must include iPad Safari with touch and the on-screen keyboard, rotation during an exercise, a narrow window, VoiceOver, and an external keyboard where available. Test both Norwegian and English. Desktop viewport emulation alone does not complete iPad validation. Record the tested device/browser versions and choose the supported iPadOS range before release; this requirement does not establish a native app, offline mode, or handwriting recognition.

See [exercise experience](exercise-experience.md) for how these principles apply to a learning interaction.

