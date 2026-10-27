# Contract: "Finish practice" and the session summary

Part of [plan.md](../plan.md) Phase 1. Research R7; spec User Story 3, FR-011 to FR-014; Clarifications Q1.

## The session in the record

`PersistedState.session: { current: string[]; last: { finishedAt: string; questions: { id: string; outcome: Outcome; repeat: "requested" | "chance" | null }[] } | null }`:
- **`current`**: the IDs of the deliveries worked in the current session, in order and without duplicates. A delivery joins when it becomes the current question: delivered, resumed (spec 002), or repeated ([repeat.md](repeat.md)). So a question resumed in a later session belongs to that session too.
- **`last`**: the most recently finished session, as a snapshot taken at "Finish practice": each question's outcome and repeat kind as they were then. A later answer to a resumed question changes its outcome in "My work" and in the next session's summary, but not in the summary already shown, which stays as it was until the next finish replaces it.
- **Compatibility**: a record written before this feature has no `session`, and hydrates as `{ current: <every delivery ID, in record order>, last: null }`, so its first finish summarizes all its questions. The storage schema version stays 1.
- **Clearing**: "Clear my work" resets `session` to `{ current: [], last: null }`.

Lesson detours, "My work", replays, and later visits do not end a session (spec FR-014).

## "Finish practice"

A button `practice.finish` ("Finish practice" / "Avslutt øvingen") on the practice screen, `data-testid="finish-practice"`, available at any time. It calls `store.finishPractice()`, which dispatches one action:
1. **Closes the question**: spec 002's `end`, so an unanswered question stays resumable with its draft and support (DL-026 (4)).
2. **Takes the snapshot**: for each ID in `session.current`, the outcome by spec 002's `derive` (with the resumable delivery as resumable), and the repeat kind by `repeatKind` against the **complete** record ([repeat.md](repeat.md)), never against the session's questions alone. Questions with outcome "none" are left out. The snapshot becomes `session.last`, with `finishedAt` now.
3. **Releases the current question**: `instance` and `currentDeliveryId` are cleared, and the draft, help, and explanation state live on only in `resumable`. Without this, practice on the same skill would reopen the finished question, because `startPractice` keeps a question in progress.
4. **Starts the next session**: `session.current` becomes empty.

The page then navigates to `/session`.

**"Practise again"** goes to `/practice/{skillId}`. With no current question, `startPractice` resumes the resumable question when there is one, and otherwise loads a new question by the choosing rule ([selection.md](selection.md)). Either way, that question joins the new session.

## `/session` (`SessionPage`)

| Part | Content |
| --- | --- |
| Heading (`PageHeading`) | `session.title` |
| Per skill with questions in `session.last` | the skill's name; spec 002's count sentence (`record.summary` or `record.summaryOne`) over the snapshot's outcomes; `progress.repeats` and `progress.repeatsRequested` from the snapshot's repeat kinds, when there are any |
| No questions in the snapshot (practice that never showed a question, for example after a load failure) | `session.empty` |
| No finished session (`last` is `null`, for example after "Clear my work") | `session.none`, with the link to practice |
| Actions | "Practise again" (`session.again`) to `/practice/{skillId}` for the session's last skill, which resumes the unfinished question or starts a new one; a link to "My work" (`nav.record`) |

The summary groups the snapshot's questions by skill with spec 004's `skillOfDefinition` (each ID still names its delivery in the record), and counts the snapshot's outcomes and repeat kinds. It shows no lesson history and no question list. It shows no percentage, score, streak, time, or mastery word (FR-013), and the wording scan covers the page and the `session` dictionary section.

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
2. **"Practise again" after an unfinished question**: resumes its draft and help state.
3. **"Practise again" after a completed question** (PR 43 review): finishing right after a correct answer, then "Practise again", delivers a new question, never the finished one.
4. **A question resumed across sessions** (PR 43 review): finish with a draft, choose "Practise again", answer correctly, and finish again. The second summary counts that question as correct; the first summary, read before the second finish, still says "unfinished".
5. **Detours**: a lesson detour and a look at "My work" inside the session do not split it.
6. **A second session**: its summary counts its own questions and any it resumed.
7. **Repeats against the full record** (PR 43 review): a chance repeat of a question from an earlier session (beyond the window, no `repeatReason`) counts as a repeat in the session summary, as it does in "My work".
8. **Old records**: a record from before this feature summarizes all its questions on the first finish.
9. **Reload**: the summary survives a reload; "Clear my work" leads to `session.none`.
10. **No questions**: a session whose question never loaded shows `session.empty`.
11. **Languages**: both.
