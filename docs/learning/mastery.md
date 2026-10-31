# Mastery

Mastery is the project's preferred measure of learning progress, but it is not yet a formula.

## Working meaning

Mastery is an estimate of how reliably a learner can use a skill with appropriate independence and across suitable variations. It is not synonymous with a percentage of exercises completed or the result of one attempt.

A future model may consider correctness, task difficulty, repeated evidence, recency, hint use, representation changes, and transfer to related problems. Those are candidates for investigation, not adopted inputs.

The [exercise capability model](../architecture/exercise-capability-model.md#9-mastery-evidence-requirements) defines structured observations the exercise system may emit without assigning weights or turning them into a mastery algorithm. In particular, accessibility accommodations and ordinary time-on-task are not negative mastery evidence.

## Progress tracking before a mastery algorithm

MathKX should provide a useful record of a learner's progress before it can reliably estimate mastery. Keep three responsibilities separate: record what happened, summarize those observations honestly, and eventually interpret evidence through a validated learning model. An activity summary is not an assessment that a skill has been mastered.

The intended observation model records or resolves:

- The target skills, learning purpose (learning, exploration, practice, or a check), and actual task features.
- The exercise definition ID and version, generated-instance seed where applicable, and generator/validator compatibility needed to interpret or replay it. Fixed authored tasks retain stable references without requiring random generation.
- A distinct delivery/session reference, ordered submissions, and submission identities so a network retry does not duplicate work and deliberate practice of the same instance remains a separate learning occasion.
- The learner's response artifact and typed validation result, distinguishing correct, incorrect, partially correct, invalid input, and responses that cannot be assessed automatically.
- Teaching support actually shown, including visual help, explanation steps, corrective feedback, and answer reveals, with enough ordering to establish whether it preceded a response.

These are semantic requirements, not a finalized database or API schema. Collect only the observations needed for the learning purpose; this is not a requirement to retain every interaction, raw response, or timing indefinitely. Accessibility operation is not teaching support, and the absence of a recorded help event does not prove that no outside help was used.

### Learner-facing summaries

Summaries can show skills practised, lessons explored, and the outcomes of work, using descriptions such as “Correct on the first mathematical response,” “Correct after feedback,” and “Correct with visual help.” Their definitions must follow the observed sequence, not merely the last answer or submission count.

- Correcting an unreadable input is not a mathematical failure or evidence of learning after corrective feedback.
- A successful retry after mathematical feedback must not be presented as a first independent answer.
- When non-revealing teaching help and corrective feedback both precede the first correct response, the help leads the summary (“Correct with visual help” or “Correct with help”) and the earlier wrong answer stays visible as a tag; “Correct after feedback” is reserved for retries with feedback and no teaching help. Any answer reveal takes precedence over both. Feedback is implied by an incorrect response in modes that always show it; an independent check must never assume feedback was shown. (Owner decision [DL-029](../reviews/round-01/decision-log.md).)
- Partial correctness remains distinct from “not automatically assessed.” Do not promise that someone will review a response unless an actual review workflow exists.
- Opening a lesson, requesting more questions, or completing many exercises does not establish mastery. Repeated exposure to the same question must remain distinguishable from work on new variations.
- Asking for help or easier work is not failure and does not itself reduce mastery. Preserve the support context without imposing an automatic penalty.

These summaries should help the learner understand what they have worked on and choose useful next practice. Automatic diagnosis of prerequisite gaps, mastery thresholds, and recommendations remain future learning-model decisions.

### Persistence and current implementation status

Persistent profiles and progress across sessions and devices are established requirements under [ADR 0006](../architecture/decisions/0006-support-profiles-without-personal-details.md). Progress belongs to a stable profile independent of display language or optional recovery email. The database is PostgreSQL ([ADR 0008](../architecture/decisions/0008-store-profiles-and-progress-in-postgresql.md)), hosted with the application in Norway East ([ADR 0009](../architecture/decisions/0009-host-on-azure-app-service.md)). The authentication mechanism, retention and deletion rules, and the exact record schema remain undecided, and no production persistence exists yet.

The [current prototype](../../Prototype/mathkx-designsystemet/HANDOFF.md) demonstrates local activity history and simulated profiles. It does not implement production accounts, cross-device persistence, the complete observation model above, or a validated mastery/recommendation algorithm. A guest-only internal milestone may keep work in the browser with clear wording about that limitation; it does not replace the profile requirement for the application. The application does this today (specs 002 to 005): the guest record holds each delivery with its ordered events, the earlier question it repeats when the learner asked for that or the variation had no other, each lesson view, which deliveries belong to the current practice session, and the summary of the last finished one. It stays in the browser, and "My work" summarizes it as counts per skill, with repeats marked by kind, lesson views labelled as views, and a read-only replay. The accumulated record is never uploaded, and the service keeps no learner record. Individual requests still carry what each needs: loading or replaying a question sends its identity (definition, version, and seed), and checking an answer sends that identity with the answer text and its submission ID.

If guest history is later imported, distinguish its origin from observations recorded by the service. Revalidating a submitted answer against a reproducible exercise can confirm mathematical correctness; it cannot establish who answered or whether help was used. Do not silently turn imported history into verified independent-performance evidence.

## Product constraints

- Mastery signals should be understandable enough to support meaningful learner feedback.
- Uncertainty should be represented honestly; absence of evidence is not evidence of failure.
- A temporary mistake should not erase established progress.
- Practice should not become repetitive simply to increase a score.
- Learners may request more practice, repeat familiar work, or adjust challenge. These choices alone do not increase or decrease mastery; interpret the actual task and response evidence, with support context, through the future learning model.
- Revisited prerequisites should remain connected to the learner's stated goal.
- Any mastery algorithm needs tests, observable behavior, and a documented rationale.

## Open questions

- Is mastery categorical, continuous, probabilistic, or a combination?
- How much evidence is enough, and how does confidence differ from mastery?
- When and how should older evidence decay?
- How are hints, explanations, and partially correct interactions interpreted?
- How can the model avoid bias from accessibility needs or unfamiliar interaction types?
- What controls should learners and educators have over recommendations?

No implementation should treat this document as an algorithm specification.
