# Mastery

Mastery is the project's preferred measure of learning progress, but it is not yet a formula.

## Working meaning

Mastery is an estimate of how reliably a learner can use a skill with appropriate independence and across suitable variations. It is not synonymous with a percentage of exercises completed or the result of one attempt.

A future model may consider correctness, task difficulty, repeated evidence, recency, hint use, representation changes, and transfer to related problems. Those are candidates for investigation, not adopted inputs.

The [exercise capability model](../architecture/exercise-capability-model.md#9-mastery-evidence-requirements) defines structured observations the exercise system may emit without assigning weights or turning them into a mastery algorithm. In particular, accessibility accommodations and ordinary time-on-task are not negative mastery evidence.

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
