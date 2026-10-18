Applies the prototype changes recorded in `docs/reviews/round-01/decision-log.md` after the round-04 review, and nothing beyond them. Base: `main` at `523daed7781809cc79f1dc883afef71683cb3164`. Only files under `Prototype/mathkx-designsystemet/` change.

| Row | Change | Check |
| --- | --- | --- |
| DL-029 | Help-first outcome labels in `summarizeDelivery`: non-revealing help before the first correct answer gives `correctWithVisualHelp` / `correctWithHelp`, even after a wrong answer. `correctAfterFeedback` is reserved for feedback-only retries. Reveals still lead, invalid input is never a retry, and help after the first correct answer changes nothing. The wrong answer stays visible as the new tag “Feedback on an earlier answer” in the workspace, session summary, My learning and progress page. The post-answer banner leads with “Correct with visual help” and mentions the earlier feedback. | `tests/domain.test.mjs`: table of 18 event sequences. Browser “DL-029”: 7 → visual help (no counting to the end) → 8 on 4 + 4, both languages |
| DL-035 | `GroupsVisual` “together” step: counters are named “First group, counter i of a” / “Second group, counter i of b”, never with the total. | Browser “DL-035”: 3 + 5, step 2 of 3, no accessible name or accessibility-tree text contains 8, both languages |
| DL-036 | The check summary's “Worth revisiting” tag is shown only on items the “Worth revisiting” card lists. | Browser “DL-036”: one wrong independent item, one skipped independent item, switch, one solved with help, one skipped; the tag is only on the wrong independent item |
| DL-037 | The C12 touch-target check tests width as well as height (44 × 44). It found one failure: the Bokmål breadcrumb “Øv” (21 × 44 px). Breadcrumb links now have a 44 px minimum width; the check was not loosened. | Browser “C12”, lesson and practice pages, all four configurations |

Documentation inside the prototype:
- `ASSUMPTIONS.md`: the four DL-026 rules, the DL-028 check policy and the help-first rule move to “Requirements the prototype follows”. Assumption numbers are kept stable because the decision log refers to them.
- `CHANGELOG.md` and `REVIEW-RESPONSE.md`: a new “Round-04 fixes” section.
- `HANDOFF.md`'s statement that iPad, VoiceOver, learners and educators remain untested is unchanged.

On `feedback-shown`: feedback is treated as implied by an incorrect response. A second response is only possible in practice and supported check mode, which always show feedback. This is documented in `observations.js` and `ASSUMPTIONS.md`. No new event type was added.

No skill IDs were renamed (DL-004). Nothing outside the prototype folder changed.

**Checks (cloud workspace, Chromium via Playwright 1.56.1):**
- `npm test`: 33/33 passed.
- `npm run build`: passed, 937.73 kB (gzip 244.67 kB).
- `npm run test:browser`: 92/92 passed. That is 23 scenarios × 4 configurations (nb 820×1180 light, en 390×844 dark, en 1180×820 light, nb 390×844 dark), with zero console errors and zero axe violations.
- Dictionaries: 614 keys in each language, no mismatches.
- The new checks were also run against a build with the four defects restored. C12, DL-029, DL-035 and DL-036 each failed as expected.

**Not tested:** real iPad, VoiceOver, learners or educators.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01Y1aFfF6qqRorYBLUEvyQtZ
