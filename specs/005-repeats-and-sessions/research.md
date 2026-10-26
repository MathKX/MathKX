# Research: Repeat Avoidance, "Repeat This Question", and Session Controls

Phase 0 of [plan.md](plan.md). Each decision records what was chosen, why, and what was rejected. Decisions of specs 002 to 004 stand unless a decision here says otherwise.

## R1. Where avoidance runs

**Decision**: In the learner app, over a pool the service publishes. For each variation (definition and version), the service publishes every question of the pool with the smallest seed that produces it: operands and seeds, no sums (R2, `contracts/pool.md`). The app knows the recent questions from the guest record, chooses a question outside the window, and requests it by that seed through the existing instance request.

**Rationale**:
- **Privacy**: the recent history stays in the browser (spec FR-016). The service only sees identities, as it does for every question today.
- **Bounded and luck-free**: a question costs at most two instance requests and one pool request per variation per visit (R3), so FR-005 holds for any pool, including one smaller than the window.
- **Identity**: generation is untouched. A chosen question's seed is one the generator maps to it, so every delivery stays reproducible (ADR 0004; addendum §D: "selection history stays outside generation").

**Alternatives considered**:
- **A service endpoint that takes the recent questions and returns a fresh one**: it would send a list of the learner's recent questions to the service with every request, which FR-016 rules out.
- **Redrawing random seeds until the question is fresh**: the number of attempts depends on luck, and it can fail although fresh questions exist, which FR-005 rules out. Each attempt is also a request.
- **Choosing uniformly from the pool for every question**: it changes how every question is drawn. It would also break the golden-seed end-to-end checks of specs 002 to 004, which pin the first draw.

## R2. The pool and each question's smallest seed

**Decision**: `MathKX.Domain` gains `QuestionPool`. For a generated definition, it takes the generator's canonical enumeration and finds, for each question, the smallest seed whose draw is that question. It tries seeds 0, 1, 2, … and stops when every question has one, or fails at a fixed limit of 65,536 seeds. A fixed task's pool is its one question with no seed. The service computes every pilot pool at startup and fails to start if a pool cannot be covered within the limit, naming the definition. `GET /api/definitions/{id}/{version}/pool` returns `[{ seed, a, b }]` in canonical order (`contracts/pool.md`).

**Rationale**:
- **Deterministic**: the generator draws one uniform index into the canonical enumeration (spec 002 `contracts/generator-addition-pair.md`), so for a pool of `n` questions, covering it takes about `n · ln n` seeds on average (about 200 for 45 questions). The limit is far above that and makes the work fixed rather than lucky.
- **A fixture**: the first entries of each pilot table, checked in, catch an accidental change to the generator or the random source, alongside the existing golden seeds.
- **Tied to the generator version**: a definition pins its generator version, so a new generator version is a new definition version with its own table, and old identities keep replaying.

**Alternatives considered**:
- **Inverting the generator**: SplitMix64 with rejection sampling has no practical inverse; searching small seeds is simpler and exact.
- **Checking a seed table into content**: it would duplicate what the generator decides and could drift from it; constitution III keeps computation in tested code.
- **Computing the pool on each request**: cheap, but it repeats the same work for every learner; startup computation also fails fast.

## R3. Choosing a question

**Decision**: `src/web/src/state/selection.ts` (pure) and the store's `load()` for every question the learner did not choose:
1. **Draw as today**: draw a seed and request the instance (unchanged).
2. **Fresh**: if its two numbers, in either order, are not among the variation's window (R4), deliver it.
3. **Recent**: otherwise, from the variation's pool (fetched once per variation per visit), take the questions outside the window. If there are any, choose the one at index `seed mod n`, where `n` is how many there are and `seed` is the first draw's seed as an unsigned integer. Request that question by its pool seed and deliver it. The first instance is neither shown nor recorded.
4. **Exhausted**: if none is outside the window, deliver the first draw with `repeatReason: "exhausted"` and `repeatOf` set to the most recent delivery of that question, and show the notice `practice.poolExhausted`.
5. **Pool unavailable**: if the pool request fails, deliver the first draw as today, without a notice. Avoidance is an improvement, never a reason not to deliver a question.

**Rationale**:
- **The common case is today's**: when the first draw is fresh (most draws, since neither pilot pool is close to exhausted by eight questions), nothing changes.
- **Deterministic and reproducible**: the choice in step 3 is a function of the first draw and the record, so a test can script it.
- **Bounded**: the work has a fixed limit of two instance requests.

**Alternatives considered**:
- **Choosing the least recent question when the pool is exhausted**: kinder for a pool slightly larger than the window, but the window already guarantees the eight most recent are avoided, and only the fixed task reaches exhaustion today.
- **A notice whenever avoidance redrew**: it would describe a mechanism, not something the learner needs to know.

## R4. The window

**Decision**: the last eight deliveries of the same definition and version in the guest record, by `startedAt` and then record order. It includes every delivery that was shown (repeats on request, chance repeats, unanswered ones, and those with only unreadable input). Questions are compared by their two numbers regardless of order, `{a, b}`. The question in progress is in the window.

**Rationale**: it is the addendum's rule ("unordered within the recent window over at most the last eight deliveries in the current definition"). A shown question is a seen question whatever its outcome. Reading the record makes avoidance survive reloads and later visits (FR-004), and "Clear my work" clears it.

**Alternatives considered**:
- **A time window**: unrelated to how much of the pool the learner has seen.
- **Ordered comparison**: `7 + 3` right after `3 + 7` reads as a repeat to most learners (revised brief).

## R5. "Repeat this question"

**Decision**: the store gains `repeatQuestion(deliveryId)`. It loads that delivery's identity through `load()` with the seed fixed (no avoidance) and records `repeatOf: deliveryId` and `repeatReason: "requested"` on the new delivery. The current question is closed as any new question closes it (spec 002: `skipped` when nothing was submitted). From a replay, the store first sets practice to the question's skill (from the resolved instance's `skill`) and its ladder position to the question's variation when that variation is on the ladder, then the replay page navigates to practice. The origin lesson carries over as for any question of the run (spec 003).
- **On the practice screen**: "Repeat this question" (`practice.repeat`) is shown once the current delivery has a submission.
- **In a replay**: it is shown for every recorded question except the unanswered question in progress, which keeps "Continue".

**Rationale**:
- **Reuse**: the existing load path already handles the ladder, the origin lesson, superseded requests, and load failures (spec 002 and 003). A fixed seed is the only difference.
- **Replay stays read-only**: the repeat is a practice action the learner takes; the replay page dispatches nothing itself (spec 004 FR-012).

**Alternatives considered**:
- **Reusing the old delivery** (clearing its events): it would rewrite history (DL-015).
- **Offering "Repeat" before any answer**: it would repeat a question the learner has not tried; "Another question" already replaces it.

## R6. Repeats in "My work" and replay

**Decision**: `progress.ts` gains `repeatKind(delivery, record)`:
- `"requested"` when `repeatReason` is `"requested"`;
- `"chance"` when `repeatReason` is `"exhausted"` or spec 004's `repeats` marks it (same definition, version, and ordered numbers as an earlier delivery);
- `null` otherwise.

The tag is `progress.repeatRequestedTag` ("Repeated on request") for `"requested"` and spec 004's `progress.repeatTag` for `"chance"`. The skill keeps spec 004's repeat sentence (all repeats) and adds `progress.repeatsRequested` ("{n} of these you repeated on purpose.") when there are any. Replay shows the same tag.

**Rationale**: mastery.md requires repeated exposure to stay distinguishable; deliberate repetition is a different thing from repetition by chance. Spec 004's sentence stays true: every repeat on request is also a repeat of a question already had.

**Alternatives considered**:
- **Excluding repeats on request from the counts**: they are practice and have outcomes; hiding them would understate the work.
- **One tag for both**: it would hide the learner's own choice.

## R7. Sessions and "Finish practice"

**Decision**:
- **The record**: the guest record gains `session: { start: string | null; last: { from: string | null; to: string } | null }`. `start` is when the current session began (the time of the previous finish, or `null` for the whole record).
- **"Finish practice"** (`practice.finish`): it dispatches spec 002's `end` (the unanswered question stays resumable, DL-026 (4)). It then sets `session.last` to `{ from: start, to: now }`, sets `start` to now, and navigates to `/session`.
- **`SessionPage`**: it summarizes the deliveries whose `startedAt` falls in `last`, with spec 004's functions:
  - per skill: spec 002's count sentence, the repeat sentences (R6), and nothing else;
  - "Practise again" (`session.again`) to `/practice/{skillId}`, which resumes the unfinished question or starts a new one;
  - a link to "My work".
- **No questions**: the page says `session.empty`.
- **Clearing**: "Clear my work" resets `session`.

**Rationale**:
- **The session runs between finishes** (spec FR-014), so a lesson detour or a look at "My work" never splits it.
- **A page for the summary**: a reload keeps it, and the learner can return to it.
- **Reuse**: it uses spec 004's tested counting, with no new arithmetic.

**Alternatives considered**:
- **Ending a session when the practice page unmounts**: every detour would split it.
- **Showing the summary in place on the practice screen**: it would be lost on a reload and compete with the question.
- **A session list**: F9 and later.

## R8. Tests, CI, and what stays out

**Decision**:
- **Tests**: as listed in the plan's Technical Context and each contract. `e2e/repeats.spec.ts` on both Playwright projects; no new CI job.
- **Wording**: the wording scan (spec 004 `progress-wording.test.tsx`) extends to the session page and the new dictionary section.
- **Out of scope** (as the spec states): self-checks (F8); profiles and persistence (F9); automatic adaptation and recommendations; a least-recently-seen order for exhausted pools; a session history.

**Rationale**: the existing jobs run each suite, and CI time has room (2 min 29 s of 10).

**Alternatives considered**: none worth recording.
