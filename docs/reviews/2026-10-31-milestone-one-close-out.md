# Milestone one: close-out review

**Date**: 2026-10-31. **Who**: the implementing session (Claude Opus 5.5), for the owner. **What**: what milestone one promised, what was built and how it was verified, and what is still open. The milestone was defined in the revised build brief §3, §7, and §10 and in the corrections addendum §D, both under [`docs/reviews/round-01/claude-fable/`](round-01/claude-fable/). This review was the evidence for the owner's decision. **Decided by the owner, 2026-10-31 (decision log DL-041): milestone one is closed, and the open checks are carried forward.**

## Summary

- **Code**: every implementation item of the milestone backlog is built, tested in CI, and deployed: specs 001 to 005, PRs 20 to 49.
- **Human checks**: of the brief's verification inside the milestone, the automated tests and the bilingual walkthrough are done. The physical-iPad pass and every learner and contributor check are not; only a person can do them.
- **Decision**: the decision log puts self-checks (F8) "after milestone one". The owner closed the milestone with the checks for a person still open and carried forward (DL-041), so F8 may begin. The section "Owner decision" keeps the trade-off as it was presented.

## The milestone as promised

A learner opens the "Number bonds to ten" lesson in Norwegian or English and goes to practice. They can ask for the visual model before answering, answer, and get feedback that names the likely slip. They ask for another question, or an easier or harder one, without losing work, switch language mid-exercise without losing work, and see an honest record of what they did. Tested domain code generates the mathematics from a replayable identity.

| Objective | Delivered by | Status |
| --- | --- | --- |
| **O1**: sums up to ten | Definition `numbers.addition.within-10` (45 questions) | built |
| **O3**: single-digit sums 11 to 18 | Definition `numbers.addition.crossing-ten` (36 questions), with make-ten help | built |
| **O2**: missing part to ten | — | deferred to milestone two by the addendum, as planned |

## Backlog (addendum §D)

| # | Item | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Skills, lesson layout, pilot schemas, validator | done | Spec 001, PR 20; `npm run validate` in CI |
| 2 | C# random source, `addition-pair` generator, `within-10`, validator with misconception codes, result type | done | Spec 002, PR 24; ADR 0011 (PR 25) for seeds and the random source |
| 3 | Thin service: instance and validate | done | Spec 002, PR 24; contract tests |
| 4 | Web app: shell, counters, ten-frame, notation, dictionaries | done | Spec 002, PR 24; dictionary parity and literal checks |
| 5 | Practice flow for `within-10` with the observation record in the browser | done | Spec 002, PR 24 |
| 6 | Lesson rendering with the `:::visual`, `:::example`, and `:::practice` directives | done | Spec 003, PRs 30 to 34 |
| 7 | `crossing-ten`, make-ten help, challenge transitions, honest ends | done | Spec 002, PR 24 |
| 8 | Derived outcome labels and summaries; idempotent submissions | done | Spec 002 (derivation), spec 004 (the progress view, PRs 36 to 42) |
| 9 | Repeat avoidance with "Repeat this question" | done | Spec 005, PRs 44 to 49 |
| 10 | CI | done | Every pull request runs all checks; 3 min 1 s on PR 48, against a 10-minute limit |
| 11 | Bilingual walkthrough script (brief §7) | done, with recorded differences | [2026-10-24 practice flow](walkthroughs/2026-10-24-practice-flow-bilingual.md) and [2026-10-24 lesson rendering](walkthroughs/2026-10-24-lesson-rendering-production.md); see "Differences from the brief" |
| 12 | One physical-iPad pass in Safari with VoiceOver | **not done** | Needs the owner and a device; every walkthrough so far records it as not done |

None of the cut-order items (9, 7, 6) was cut.

## Beyond the milestone

These were built in the same period, without changing the milestone's promises:
- **Deployment**: every merge to `main` deploys to Azure App Service in Norway East (ADR 0009; PRs 26 and 47). The milestone itself only required CI.
- **Spec 004**: the progress view, with "My work" by skill under localized skill names, lesson-view history, and read-only replay of any recorded question.
- **Spec 005**: "Finish practice", with a session summary and "Practise again".

## Differences from the brief

These are recorded, not smoothed over. Each follows a later decision.
- **Script line 5** expects "looks like a calculation" for `4+4`, and decimals to be accepted. Spec 002 FR-008, decided after the brief, treats both as input guidance and never as an attempt. If the extra message is wanted, it is a dictionary and validator-code addition for content review.
- **Script line 7** reviews "the topic page". In the application, that is the record page, now "My work".
- **The guest record** keeps work in the browser only. There are no profiles or server-side learner data (§3 "What it is not"; F9).

## Open checks for a person

These are carried forward past the milestone (DL-041). The validation plan is in the brief's §10. Each check below is recorded as findings, not scores.

| Check | Source | Who | Status |
| --- | --- | --- | --- |
| Physical iPad in Safari: field, submit, and feedback with the keyboard open; help with the keyboard open; rotation; VoiceOver reading the expression, groups, live feedback, lesson tables, MathML, and both visuals; external keyboard | Backlog 12; brief §7; spec 003 SC-006 | Owner, with a device | open |
| The initial learner, 15 minutes with the addition practice: finds help unprompted; understands "Correct with visual help" and "Correct after feedback" | Brief §10; spec 002 SC-006 | Owner, with the learner if willing | open |
| After one minute on "My work": which skill was practised, how the questions went, which lesson was viewed | Spec 004 SC-005 | Same session as above | open |
| Repeats a hard question, then says which questions were repeated on purpose | Spec 005 SC-005 | Same session as above | open |
| An adult who did not grow up with "tiervenner": the lesson in English, then five questions. Does the framing land, and does anything read as childish? | Brief §10 | Owner's choice of reader | open |
| Content review of the nine skill names in both languages | Spec 004 (PR 41) | Owner or a translator | open |
| First contributor check: edit a lesson sentence, preview, validate, in under 15 minutes | Spec 003 SC-007 | A contributor new to the repository | open (the brief puts it before release) |
| A mathematics educator reviews O1 and O3, the two skills, the misconception codes and texts, and the ladder sentences | Brief §10 | An educator | open (the brief puts it before milestone two) |

The three learner checks can be done in one session.

## Owner decision

**Decided 2026-10-31 (DL-041): close now, with the checks carried forward.** The options as they were presented follow.

The decision log's verdict for F8 is "specify with corrections, after milestone one".

- **Close milestone one now, with the checks above carried forward.**
  - **For**: the code is complete and deployed. The brief puts the learner checks "after the milestone" (§10). The device pass is backlog item 12, but it asks only for findings, and the milestone "does not claim iPad support". Closing now leaves item 12 undone, so the close should say so.
  - **Against**: milestone two builds on the same shell. A device or learner finding that changes the shell is cheaper to act on before a second family and self-checks are added.
- **Run the iPad pass and the learner session first, then close.**
  - **For**: the shell's accessibility and wording meet a real device and a real learner before more is built on them.
  - **Against**: it waits on people and a device, and nothing on the implementation side is blocked meanwhile.
- **Either way, the educator review comes before milestone two** (brief §10).

The brief's §8 lists what milestone two holds: self-checks (F8), the one-step equations family with balance help, and O2 (missing part to ten). Profiles and persistence (F9) are a release gate and need a design proposal first.

## Release gates (brief §9.1), for orientation

The milestone did not aim to meet these, and they stay open for release:
- persistent profiles and recovery (ADR 0006; F9);
- iPad checked on actual devices;
- contribution through review: `CONTRIBUTING.md` documents the path, but the first contributor check has not been run.

The brief's §9.2 additions are not gates, and the privacy notice is one of them. DL-007 deferred all of them to the profile design proposal, which evaluates each one as an input, not a requirement.

Bilingual coverage of the interface, the lesson, exercises, help, and feedback holds for the pilot content, with dictionary parity enforced in CI. So do deterministic replay (ADR 0004), honest progress language with no mastery claims, and Designsystemet with Tailwind (ADR 0007).
