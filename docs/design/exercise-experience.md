# Exercise experience

An exercise is a learning interaction, not merely a prompt plus a text box.

The broader [learning experience](learning-experience.md) connects authored lessons, exploration, practice, and checks of understanding. Exercises can serve these different purposes with explicit support and evidence context.

## Possible anatomy

A future exercise experience may include:

- a concise goal or prompt;
- mathematical notation, context, or a visual model;
- an answer interaction appropriate to the idea;
- optional hints that reveal support progressively;
- deterministic feedback;
- an explanation or alternate representation; and
- a clear next action.

Not every exercise needs every element. The definition format should express intent without prescribing pixel-level presentation.

## Answer interactions

The architecture must be able to grow beyond typed text. Candidate interactions include numbers, expressions, multiple choice, coordinates, graph points, drag and drop, ordering, interactive geometry, and selection within a visualization. For example, selecting `(3, 4)` in a coordinate system may assess understanding more directly than typing the characters.

Each interaction needs accessible input, review, correction, and feedback behavior. An equivalent accessible path should preserve the mathematical objective, not merely provide a nominal fallback.

The [exercise capability model](../architecture/exercise-capability-model.md) defines the interaction and representation families, semantic response artifacts, per-family accessibility requirements, and recommended phases. UI components should emit those response artifacts rather than own mathematical validation.

## Answering on iPad

The complete answer flow must work with touch and an on-screen keyboard. Choose input behavior for the expected mathematical response, but do not assume a numeric keypad exposes every required character. Verify entry and correction of negative values, locale-appropriate decimals, and fractions when those forms are supported. Additional symbol controls may be needed for richer expressions; a dedicated mathematics keyboard remains a future component decision.

Opening visual help, rotating the device, and changing window size must preserve the answer and revealed support. Keep the prompt, visual model, and answer control easy to move between when the keyboard reduces visible space. Visual exploration must not require precise finger placement: provide appropriate snapping, larger hit areas, or an equivalent direct-value control when the mathematical task permits them.

For the `4 + 4` example below, verify that a learner can focus the answer field, enter `8`, reveal and hide the two groups of counters, and submit with the keyboard open. Repeat in portrait and landscape and with VoiceOver; any interactive counters must also have equivalent accessible operation.

## Hints and explanations

Hints should help a learner resume reasoning rather than immediately reveal an answer. Explanations should connect steps to concepts and may use a visualization or a different representation. Their exact content model and adaptation behavior are future decisions.

## Continuing practice and changing challenge

Provide a clear next-question action and learner controls for more similar practice, easier work, or more challenge. Follow the [practice and challenge policy](learning-experience.md#more-practice-and-learner-control): preserve current work, apply changes to the next question by default, identify changes of skill, and keep authored and generated tasks equally valid. A completed self-check should also offer further practice without altering the recorded check result.

## Visual help on request

Visual explanations are a core teaching capability. Where a visual model clarifies the mathematics, an exercise should offer an explicit **Show visual help** action (**Vis visuell hjelp** in Norwegian Bokmål). Learners can answer directly or request the model before submitting; they do not need to make a mistake to receive help. Preserve their input and working when showing or hiding it.

Visual help must explain a mathematical relationship. Choose a representation suitable for the skill: grouped objects for early addition, a number line for signed arithmetic, fraction bars for fractions, area models for multiplication, or graphs for functions. Not every exercise needs every representation, and the author should specify the learning purpose of the selected model.

### Addition example

For `4 + 4 = ?`, initially show the expression, an answer field, a submit action, and the visual-help action. A learner can enter `8` immediately.

Revealing help shows two clearly separated groups of four rounded square counters, a plus sign between them, and the question “How many altogether?” Each group can use a compact two-by-two layout. The groups have visible labels identifying the first and second group; spacing and labels convey their relationship without relying on color.

The two groups represent the operands of the existing instance. A first reveal does not replace the answer field with `8` or mark the exercise complete. It lets the learner count or recognize the quantities. Further guided help may highlight counters one at a time or demonstrate combining the groups. If a later step explicitly reveals the total, treat it as an answer reveal rather than an independent answer.

This is a proposed presentation for the first addition example, not a universal layout. Larger quantities need an appropriate grouped or place-value representation rather than an unreadable field of counters.

### Explaining why the result follows

Support both visual help while solving and a worked explanation of why a result is correct. In practice, a learner should be able to request an available explanation after either a correct or an incorrect response. A correct answer does not imply that the learner understands the reasoning. If an explanation is requested before answering, distinguish it from a hint and make any answer reveal explicit; requesting it does not count as solving the exercise.

A lesson opened from an exercise is teaching support for that delivery. It counts as showing the answer only when the lesson contains this exact instance with its result or a worked visual for the same values; then the learner is told before the lesson opens and may choose visual help instead, and a later correct answer is recorded as answered after the answer was shown. Other lesson reading before answering is recorded as help, not as a reveal (owner decision DL-026).

An explanation should connect each visible action to a mathematical relationship, rather than merely animate the final number. For example:

| Exercise | Visual reasoning |
| --- | --- |
| `4 + 4 = 8` | Show two labeled groups of four, combine them, and explain that the total counts all objects in both groups. |
| `8 + 5 = 13` | Show that eight needs two to complete ten, split five into two and three, and connect the picture to `8 + 2 + 3 = 10 + 3 = 13`. |
| `x + 3 = 7` | Use a balance to remove three from both sides, explaining that the same operation preserves equality and leaves `x = 4`. |

These are examples of supported teaching approaches, not mandatory solution strategies. Explain the demonstrated method without assuming it is the one the learner used. A wrong response may suggest a useful explanation; it does not by itself diagnose a persistent misconception.

For authored examples, review the question, solution, reasoning, and visual together. For generated exercises, derive the prompt, answer, intermediate steps, and visual quantities from the same deterministic mathematical instance and solution model. Tested domain code computes nontrivial steps; localized text and reusable visual components present them. This does not require AI-generated explanations.

Each exercise family must declare which explanations and representations are supported and for which values. Do not assume a component that explains `8 + 5` can also explain `19 + 1`: the prototype's single-ten-frame approach would require different handling for an operand above ten. Either constrain the enabled definition to supported values or supply an appropriate, tested representation. Do not generate a plausible-looking explanation outside that contract.

Record explanatory support and answer reveals in the [progress observation model](../learning/mastery.md#progress-tracking-before-a-mastery-algorithm). Showing an explanation after an answer must not retroactively mark that answer as helped, but it becomes support context for subsequent work on that instance. Hiding or replaying the explanation does not erase that history. Checks of understanding retain their stated disclosure policy; an independent check must not reveal solutions early while continuing to label the work independent.

Worked explanations must ship in both Norwegian and English, including the reason for each step and accessible descriptions. Provide equivalent text or semantic mathematics and keyboard/touch operation, with a static or step-controlled alternative to animation. Do not expose an answer in the accessible version before it is disclosed in the visual version.

### Coverage and current implementation status

The [prototype](../../Prototype/mathkx-designsystemet/HANDOFF.md) demonstrates grouped counters, ten-frame/make-ten models, and a stepped equation balance for selected authored examples and questions. It is evidence of a possible interaction design, not a universal explanation engine or a tested generated-exercise pipeline.

Implement and verify explanations per supported exercise family. Tests must cover agreement among the question, validator, worked steps, visual state, and accessible text at boundary values; reveal timing and support recording; both languages; and preservation of the learner's work. Mathematical and teaching review remain necessary alongside automated checks. Richer subjects can add other representations as they are authored and validated, without promising an automatic visual explanation for every possible mathematics problem.

### Help during checks of understanding

Practice and supported self-checks may offer visual help on request. A check intended to observe independent work must state its support policy before starting. If a learner requests teaching help during such a check, offer a clear transition to supported work or an explanation after submission; never silently treat a helped response as independent evidence. The first-release default policy is independent: no teaching help inside the check, feedback at the end, and an explicit one-way switch to supported practice from the current exercise onward; answers saved before the switch stay independent (owner decision DL-028).

Record which authored support was revealed and whether it was available before or after the response. Hiding help does not erase that history. Using teaching help is not an incorrect answer and does not prescribe a score deduction or mastery decrease. The future learning model decides how to interpret the observation.

Accessible ways to perceive or operate the same task are not teaching hints. Screen-reader descriptions, keyboard operation, zoom, and reduced motion must remain available regardless of the check's hint policy and must not be counted as negative mastery evidence. If a visual model is itself the original question, viewing that model is not optional help usage.

### Accessibility and implementation boundaries

Provide the same mathematical information through an equivalent accessible representation: for the addition example, two labeled groups containing four individually navigable objects each, without announcing an extra answer that the visual presentation does not reveal. The help control must work by keyboard, announce its expanded state, preserve usable focus, and fit small screens. Any animation needs a static or step-controlled equivalent and reduced-motion support.

Visual-help labels, instructions, and accessible descriptions must ship in Norwegian and English with the exercise. Derive operand counts and any explanation steps from the same canonical instance as the prompt and validator. The visual component renders that model; it does not independently generate a question or decide mathematical correctness. Content contributors should reference a named, tested representation and its configuration rather than code a separate visualization for every question.

When implemented, verify direct answering, reveal/hide without loss of work, agreement between prompt and model across supported values, support-event recording, both languages, and keyboard and screen-reader operation.

## Open questions

- How are multi-step exercises and partial answers represented?
- When should an interaction accept mathematically equivalent forms?
- How do generated questions expose their reasoning for explanations?
- How are hints localized and connected to common misconceptions?
- What evidence should an interactive action contribute to mastery?
