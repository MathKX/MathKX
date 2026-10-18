# Requirement → screen/state checklist

Routes are hash routes in the prototype (`#/…`). “✓ browser” means a scenario in `tests/browser/review-checks.mjs` (`npm run test:browser`, Chromium, four size/language/theme configurations); “✓ unit” means `tests/domain.test.mjs` (`npm test`); “✓ by hand” means checked in Chromium during iteration 2 without a script; “manual” means it still needs a person or device. See [What was tested](ASSUMPTIONS.md#what-was-actually-tested) and [REVIEW-RESPONSE.md](REVIEW-RESPONSE.md).

## Learner journey goals

| # | A learner can… | Where | Status |
| --- | --- | --- | --- |
| 1 | Start without a profile | `#/` → Start learning; `#/home` empty state; practice and lessons open to guests | ✓ browser (every scenario starts as a guest) |
| 2 | Understand a lesson | `#/lesson/number-bonds-to-ten` (nb/en) | content review + learners needed |
| 3 | Try an exercise and get useful feedback | `#/practice/arithmetic.add-within-20` | ✓ browser (states); learner check needed |
| 4 | Request visual help and a full explanation | same, “Show visual help”, “Explain the solution” | ✓ browser |
| 5 | Continue with easier or harder practice | Next exercise panel | ✓ browser |
| 6 | Understand what progress means | `#/home`, `#/progress/arithmetic.add-within-20`, `?sample=1` | ✓ rendered; comprehension needs learners |
| 7 | Return later without losing context | Finish session → summary or `#/home` “Continue with …” (unanswered question, draft and support kept); profile sign-in | ✓ browser, in one browser |

## 1. Explanation flow

| Requirement | Screen / state | Status |
| --- | --- | --- |
| Visual help and explanation are separate actions | Practice workspace, two buttons | ✓ |
| Explanation before answering, with explicit answer reveal | Confirmation “The explanation ends with the answer” (names the step); “The next step shows the answer” note; only revealing steps are recorded as a reveal | ✓ browser + unit |
| Explanation after correct and after incorrect | Same button after a response | ✓ both |
| 8 + 5 shows all steps to `= 13`, back/forward | `?variant=across-10`, Explain, Next step ×3 | ✓ |
| Visual, equation, text agree at every step | One step object per step; balance check step pictures x replaced by its value | ✓ unit (equation reaches the answer, no answer before the revealing step, balance phase); picture by hand + browser R03-06 |
| Earlier response not relabelled | Tag “Explanation opened after answering”; summary outcome unchanged; a lesson detour after answering changes nothing | ✓ unit |
| Self-check policy stated before start | `#/check/check-addition` intro | ✓ |
| Explicit transition to supported practice | Check → “I need help” → switch block → supported mode tag; summary, progress and Home keep the boundary | ✓ browser + unit |

## 2. Practice and challenge

| Requirement | Screen / state | Status |
| --- | --- | --- |
| Another question / More like this / Make it easier / More challenge / Finish | Next exercise panel | ✓ |
| Concrete variation names | Variant tag + button subtitles | ✓ |
| Change applies to next question, work preserved | Pending tag “Next: …”, undo; “More like this” says it replaces a pending change | ✓ browser |
| Visual help available in all variations | Every variant declares help + explanation | ✓ unit test |
| Session end distinguishes answered/skipped/unfinished | `#/practice/<skill>/summary/<id>`; answers after a reveal are not counted as found | ✓ browser |
| Honest repeat | 5th question in “Addition within five” → repeat tag + notice | ✓ unit; UI notice by hand |
| Unavailable variation | Make it easier on “within five”; More challenge on “across ten” | ✓ |

## 3. Progress

| Requirement | Screen / state | Status |
| --- | --- | --- |
| Lesson viewed | Home “Lessons you have opened”; progress page | ✓ |
| First correct, no help | Sample 4 + 4 | ✓ |
| Correct with visual help | Sample 3 + 5 | ✓ |
| Correct with help (lesson or part of the explanation, answer not shown) | Sample 1 + 8 | ✓ unit + browser |
| Answer shown by counting all or in the lesson | Practice 4 + 4 (count all), 8 + 5 (lesson) | ✓ unit + browser |
| Incorrect then correct after feedback | Sample 6 + 3 (answers 8, 9) | ✓ |
| Explanation opened after answering | Sample 2 + 7 | ✓ |
| Skipped task, unfinished session | Sample 5 + 4; session 2 “not finished”, 9 + 4 | ✓ |
| Answered after the answer was shown | Sample 8 + 5 | ✓ |
| No percentages/thresholds/badges | All progress screens | ✓ by inspection |
| Continue where I left off with reason | Home card; suggestion with “Why” | ✓ |
| Empty state | `#/home` as a new guest | ✓ |

## 4. Tablet workspace

| Requirement | Screen / state | Status |
| --- | --- | --- |
| 390 / 820 / 1180 px layouts | Practice workspace with help/explanation open; 8 + 5 chain wraps at 390 px | ✓ browser (no sideways scroll) + screenshots |
| On-screen keyboard layout | Banner switch “Simulate on-screen keyboard”; real visualViewport detection | Simulated ✓; real iPad: **manual** |
| 44 × 44 targets, no hover/drag dependence | Buttons, keyboard keys, graph arrows, breadcrumbs, lesson links | ✓ browser (lesson page), by inspection elsewhere; real touch: **manual** |
| Keyboard alternatives, focus, text equivalents | All visuals have lists/labels/captions; axe clean; no missing label targets | ✓ browser (axe, 13 routes × 4 configurations); VoiceOver: **manual** |
| Reduced motion | Only a fade, disabled by `prefers-reduced-motion` | ✓ CSS; device check manual |
| Language/layout changes preserve state | Switch NB/EN mid-explanation (step kept), resize | ✓ |

## 5. Advanced design example

| Requirement | Screen / state | Status |
| --- | --- | --- |
| f(x) = x² graph with tangent at a selected point | `#/preview/derivative` | ✓ |
| Visual + textual slope explanation | Slope triangle, text, Δy/Δx | ✓ |
| Select a point or change a value, with keyboard/direct entry | Tap graph, arrow buttons, `x =` field | ✓ |
| Marked as design preview | Tag + warning, library “Design preview” | ✓ |
| Fractions and powers render; unsupported never silently lost | Notation test card (√ shown with notice) | ✓ |
| Landing shows breadth without overstating | Domain tags “1 topic ready / Design preview / Planned”, advanced card | ✓ |

## 6. Lessons and contribution

| Requirement | Screen / state | Status |
| --- | --- | --- |
| Complete bilingual Markdown lesson with objective, prerequisites, explanation, worked example, visual, practice entry | `#/lesson/number-bonds-to-ten` | ✓ |
| Open explanation from exercise and return | “Read in the lesson” → banner → “Back to the exercise”; recorded as help, or as a reveal (with a warning first) when the lesson shows this exercise's answer | ✓ browser + unit |
| Source preview aligned to proposed layout | “Edit lesson source” dialog with folder tree and file tabs | ✓ |
| Separate suggest and edit actions | Two buttons top and bottom of lesson | ✓ |
| Contribution preview without private data | Suggest → Preview suggestion | ✓ |

## 7. Profile and recovery

| Requirement | Screen / state | Status |
| --- | --- | --- |
| No name/email/birth date/school required | `#/profile/new` step 1 | ✓ |
| ID vs password distinction | Step 1 two panels; ID box text | ✓ |
| Save/copy ID | Step 2 copy + download | ✓ (download needs host capability) |
| Continue without email | Step 3 | ✓ |
| Correct email during verification | “Change the email address” | ✓ |
| Pending / failed / completed | Verify later; 3 wrong codes → locked; code 246810 | ✓ |
| Interrupted setup and returning | “Keep learning now” → banner → “Continue setup” | ✓ |
| Guest work on create / sign in | Step 1 card; sign-in radio choice; “guest work” tags on Home and progress (created and imported); imported sessions shown as “added from guest work” | ✓ browser |
| Settings add/remove recovery email | `#/settings` | ✓ (from iteration 1) |
| Change a confirmed email without losing it | `#/settings` → Change → Verify later: old address still used until the new one is confirmed; cancel keeps it | ✓ browser G7 |
