# Vision

## The problem

Many digital mathematics products reproduce the structure of a textbook or worksheet: explain a topic, present a set of questions, and count completed work. That approach can miss why a learner is stuck. Difficulty with a new topic often comes from an earlier concept that was never securely understood.

MathKX aims to become a learning system that represents mathematical skills and their prerequisites, estimates what a learner has mastered, and chooses useful next experiences. Its original motivation is a 14-year-old who finds parts of mathematics difficult, but the underlying system should be useful across ages, curricula, countries, and languages.

## Mathematical scope

The long-term goal is to cover mathematics from foundational arithmetic through university-level study. School mathematics is the starting point, not the upper limit. University-level content may include calculus, linear algebra, discrete mathematics, probability and statistics, differential equations, and proof-based subjects such as analysis and abstract algebra. These examples describe intended breadth, not a complete syllabus or a delivery commitment for the first release.

Organize content around mathematical domains, topics, and specific skills with explicit prerequisites. Grades, curricula, and university courses provide learning paths and mappings over the same skills rather than separate copies of the mathematics. Progress should carry forward as learners move between educational stages.

Coverage includes conceptual understanding, computation, reasoning, modeling, and proof. More advanced content must declare what can be validated reliably and what requires review; university coverage does not imply automatic grading of arbitrary proofs.

Build this scope incrementally from small, coherent skill groups and tested exercise families. The initial learner and implementation slice remain focused; exact university course coverage and delivery order will be chosen as real content is developed.

See [mathematics domain coverage](learning/mathematics-domains.md) for the intended domains, topic boundaries, and connections across educational stages.

## The intended experience

### First release languages

The first release must be available in Norwegian and English. This includes the learner interface, profile setup and recovery flows, lessons, exercise prompts, hints, explanations, feedback, and accessibility text for the content released in that iteration. A smaller set of fully supported content is preferable to broader content available in only one of the two languages.

Norwegian Bokmål is the initial working assumption for Norwegian; the written standard has not yet been explicitly selected. Nynorsk can be added without changing the underlying skills or learner progress. English regional conventions remain to be selected.

Learners should be able to switch language without losing progress or changing the mathematical identity of their current exercise. Display language must not determine curriculum, grade, or mathematical ability. Number display and input parsing must respect the selected locale while preserving canonical mathematical values.

### Learning environment

iPads are a primary learner device for the first release. The web experience must support touch-first use, portrait and landscape orientations, and answering with an on-screen keyboard, while also supporting phones, desktop computers, and external keyboards. Validate the core learning journey on actual iPad hardware in Safari; exact supported device and operating-system versions will be selected before release.

Learning with MathKX should feel calm, focused, and satisfying. The product should make progress visible without pressuring or patronizing the learner. It should reward consistency, effort, improvement, and mastery rather than raw activity.

When a learner struggles, MathKX should eventually help answer *why*. If square roots are the obstacle in a Pythagorean theorem problem, the system should be able to strengthen that prerequisite and return to the original goal. Adaptation should support the learner rather than silently lowering expectations.

## Understanding through interaction

MathKX should support learning through explanations and worked examples, exploring mathematical ideas, practicing skills, and checking understanding. The [learning experience](design/learning-experience.md) describes these purposes and a proposed approach to combining contributor-authored lessons with interactive content.

Visual mathematics is central to the vision. Number lines, fraction bars, equation balances, coordinate systems, geometry canvases, and simulations can make relationships tangible. These should become reusable, accessible interactions that can present a concept, form part of a question, and accept an answer—not merely illustrations beside text.

## A reusable learning model

Mathematics does not belong to a particular curriculum. MathKX will represent skills with stable, language-neutral identities and map curricula and competency goals to those skills separately. This makes content reusable and allows different educational systems to describe their own expectations without fragmenting the mathematical model.

Exercises should usually be reusable definitions capable of generating many deterministic instances. Content authors should be able to contribute useful material without needing deep application-code knowledge, while tested code handles mathematical logic that does not belong in data.

Support reviewed authored examples and fixed tasks alongside generated practice. Learners can always ask for more practice in supported skills and request easier or more challenging variations. Finite question families may repeat; the goal is useful, learner-controlled practice rather than an endless count of supposedly unique questions. See [practice and challenge controls](design/learning-experience.md#more-practice-and-learner-control).

## Open collaboration

MathKX is intended as an open-source project that developers, teachers, mathematics educators, translators, curriculum experts, students, and other contributors can improve together. Content should become discoverable, documented, schema-validated, testable, and reviewable through ordinary version-control workflows.

## Profiles and continuity

Learners should be able to create a profile, sign in again, and retain their learning progress across sessions and devices without providing a real name, email address, or other identifying profile details. Email is optional and may be supplied for account recovery. Learners who choose no recovery email must keep their sign-in credentials safe; losing all means of access can make their profile unrecoverable.

This is a commitment to anonymous profile setup, not a promise of complete anonymity across hosting, network traffic, or operational logs. See [ADR 0006](architecture/decisions/0006-support-profiles-without-personal-details.md) for the account and recovery boundaries.

## Long-term direction

The long-term ambition is a trustworthy adaptive learning engine with multiple learner experiences built around it. Reaching that point requires evidence and iteration. Profiles without required personal details and optional email recovery are established requirements. Exact mastery models, curriculum mappings, authentication mechanisms, account relationships, localization mechanisms, and technology choices beyond the initial stack remain open until the project has enough understanding to decide them well.

