# Contract: "Finish practice" and the session summary

Part of [plan.md](../plan.md) Phase 1. Research R7; spec User Story 3, FR-011 to FR-014; Clarifications Q1.

## The session in the record

`PersistedState.session: { start: string | null; last: { from: string | null; to: string } | null }`:
- **`start`**: when the current session began, meaning the time of the previous "Finish practice"; `null` means since the record began.
- **`last`**: the range of the most recently finished session.
- **Compatibility**: a record written before this feature has no `session`, and hydrates as `{ start: null, last: null }`. The storage schema version stays 1.
- **Clearing**: "Clear my work" resets `session`.

A delivery belongs to a session range `{ from, to }` when `from < startedAt ≤ to`, or `startedAt ≤ to` when `from` is `null`. Lesson detours, "My work", replays, and later visits do not end a session (spec FR-014).

## "Finish practice"

A button `practice.finish` ("Finish practice" / "Avslutt øvingen") on the practice screen, `data-testid="finish-practice"`, available at any time. It calls `store.finishPractice()`, which:
1. dispatches spec 002's `end` (an unanswered question stays resumable with its draft and support, DL-026 (4));
2. sets `session.last` to `{ from: session.start, to: now }` and `session.start` to now.

The page then navigates to `/session`.

## `/session` (`SessionPage`)

| Part | Content |
| --- | --- |
| Heading (`PageHeading`) | `session.title` |
| Per skill with questions in `session.last` | the skill's name; spec 002's count sentence (`record.summary` or `record.summaryOne`); `progress.repeats` and `progress.repeatsRequested` when there are any |
| No questions in the range | `session.empty` |
| No finished session (`last` is `null`, for example after "Clear my work") | `session.none`, with the link to practice |
| Actions | "Practise again" (`session.again`) to `/practice/{skillId}` for the session's last skill, which resumes the unfinished question or starts a new one; a link to "My work" (`nav.record`) |

The summary uses spec 004's `groupBySkill` over the deliveries in the range, without lesson history and without the question list. It shows no percentage, score, streak, time, or mastery word (FR-013), and the wording scan covers the page and the `session` dictionary section.

| Key | en | nb |
| --- | --- | --- |
| `practice.finish` | Finish practice | Avslutt øvingen |
| `session.title` | Your practice session | Øvingsøkten din |
| `session.empty` | You did not answer any questions in this session. | Du svarte ikke på noen oppgaver i denne økten. |
| `session.none` | You have no finished practice session yet. | Du har ingen avsluttet øvingsøkt ennå. |
| `session.again` | Practise again | Øv igjen |

## Tests

**`tests/session.test.tsx`**, with the fake API:
1. **The summary**: three answered questions and one unfinished with a draft, then "Finish practice", give a summary of 4 questions with "1 unfinished".
2. **"Practise again"**: resumes the draft and help state.
3. **Detours**: a lesson detour and a look at "My work" inside the session do not split it.
4. **A second session**: its summary counts only its own questions.
5. **No questions**: finishing at once shows `session.empty`.
6. **Old records**: a record from before this feature summarizes all its questions on the first finish.
7. **Reload**: the summary survives a reload; "Clear my work" leads to `session.none`.
8. **Repeats**: the repeat sentences appear when there are repeats.
9. **Languages**: both.
