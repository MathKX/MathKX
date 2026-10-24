# Data Model: Lesson Rendering and the Detour Back to an Exercise

Phase 1 of [plan.md](plan.md). Entities this feature adds or changes, by layer. Spec 002's [data model](../002-practice-flow/data-model.md) stands for everything not listed here. Names are the planned type names; the contracts give the exact shapes.

## Content snapshot (`MathKX.Domain.Content`, filled by `MathKX.Content`)

| Entity | Fields | Rules |
| --- | --- | --- |
| `LessonTranslation` (new) | `Language` (`nb`, `en`), `File` (`nb.md`), `Markdown` (full text with front matter), `FrontMatter` (existing `LessonFrontMatter`), `Facts` (`LessonFacts`) | One per language listed in `lesson.json` `translations`; loaded once at startup with the rest of the catalog |
| `LessonAssets` (new) | `Names` (file names in the lesson's `assets/` folder, sorted) | Only regular files directly in `assets/`; names match `^[A-Za-z0-9][A-Za-z0-9._-]*$`; dotfiles (`.gitkeep`, `.DS_Store`) are ignored and never listed or served; anything else fails the load with the path |
| `ContentCatalog` (changed) | gains `Translations[(lessonId, language)]`, `Assets[lessonId]`, and `LessonsForDefinition(definitionKey)` (lessons whose `practice` lists `id@version`, ordered by lesson ID) | `FrontMatters` stays for existing callers |

## Lesson facts and disclosure (`MathKX.Domain.Lessons`)

| Entity | Fields | Rules |
| --- | --- | --- |
| `LessonFacts` | `Expressions`: list of `LessonExpression { Source, Normalized, Display }`; `Visuals`: list of `LessonVisual { Type, Attributes: IReadOnlyDictionary<string,int> }` | Built per translation by `LessonFactsReader`; `Normalized` is the prototype's normalization: whitespace removed and `−` and `–` read as `-` (the disclosure rule compares addends and results only; the validator's full normalization is not needed); order of expressions is document order; directives inside fenced or indented code are not visuals |
| `DisclosureDecision` | `Discloses` (bool), `Where` (`expression`, `visual`, or none) | Pure function `LessonDisclosure.For(LessonFacts, Instance)`; the lesson's decision is the decision of any translation that discloses (`expression` preferred when both apply); `contracts/disclosure.md` |

## Visual models (`MathKX.Domain.Explanations`)

| Entity | Fields | Rules |
| --- | --- | --- |
| `StepModel` (unchanged shape) | as spec 002 | `StepModels.ForValues(a, b, representation, kind)` is the single source; the instance overload calls it with the instance's operands after checking the instance offers the representation |
| `TenFrameExplorerState` (new) | `Filled` (0–10), `Partner` (10 − filled) | `TenFrameExplorer.States()` returns all eleven in order |

## Service shapes (`MathKX.Api.Dto`)

| Shape | Fields | Notes |
| --- | --- | --- |
| `InstanceDto` (changed) | gains `lessons: [{ id, discloses }]` | Lessons whose practice lists the instance's definition and version; empty list when none; never the sum |
| `LessonContentDto` (new) | `id`, `version`, `language`, `markdown` | The translation's Markdown as authored |
| `VisualStepsDto` (new) | `type`, `a`, `b`, `steps: StepModel[]` | Lesson visuals only; the last step shows the total |
| `TenFrameExplorerDto` (new) | `type`, `states: [{ filled, partner }]` | |

## Learner app session (`src/web/src/state`)

| Entity | Fields | Rules |
| --- | --- | --- |
| `InstanceDto` in the store (changed) | gains `lessons?` | Absent on instances stored before this feature: the lesson page re-resolves the identity before deciding |
| `Delivery` (changed) | gains `originLessonId?` | Set on the first delivery when practice starts from a lesson's practice entry (`startPractice(skillId, preferred, originLessonId)`); copied to every later delivery of the same practice run, including after a reload; unset when practice starts from the practice route; selects the practice screen's lesson link (`contracts/detour.md`); not an event and not evidence; deliveries stored before this feature have none |
| Current question (derived, not stored) | the current delivery when it has no `correct` submission and no `skipped` event | Wider than spec 002's `resumable`, which covers only questions without any submission |
| `LessonVisit` (new, in memory, not persisted) | `lessonId`, `deliveryId` (or none), `detour` (bool), `discloses` (bool), `gate` (`closed`, `open`), `fromQuestion` (bool, read from the address when the visit starts), `shown` (bool), `bannerDismissed` (bool), `sectionAnchor` | Created on entering a lesson route, discarded on leaving it; `shown` turns true on the first render of the lesson content and triggers at most one recording |
| `from=question` (new, an address parameter, not stored) | part of the practice screen's lesson link target, `/lessons/{id}?from=question` | Read when a visit starts, then removed with `history.replaceState`; a modified click carries it into the new tab and leaves the source tab unchanged; lets an opening after a correct answer be recorded only when it came from the question. There is no in-memory origin marker |
| `pendingHelpOpen` (new, in memory) | the delivery ID for which "Show visual help instead" was chosen | Consumed when the practice view mounts and presents that delivery, by calling `toggleHelp()` (which records `visual-help-opened`); dropped if that delivery is no longer current |
| `Event` (unchanged set) | `support` with `lesson-opened` or `lesson-reveal` | Recorded only by the visit rule in `contracts/detour.md` |
| `Tag` (changed) | gains `lessonAfter` | Derived from `lesson-opened` after the first `correct`; ordered after `explainAfter` |

## State transitions of a lesson visit

```text
enter /lessons/:id
  ├─ no current question, or the lesson does not list its definition ─> ordinary reading: load and show; record nothing
  │                                                                       (reached with from=question and an answered question: record lesson-opened as later support once shown)
  └─ current question and the lesson lists its definition (detour)
       ├─ instance lacks lessons ─> re-resolve the identity, then decide
       ├─ discloses = false ─> gate open ─> load ─> shown ─> record lesson-opened
       └─ discloses = true  ─> gate closed: notice, no request for the lesson
             ├─ Open the lesson anyway ─> gate open ─> load ─> shown ─> record lesson-reveal
             │                                         └─ load fails or learner leaves first ─> record nothing
             ├─ Show visual help instead ─> pendingHelpOpen, go to practice ─> on mount toggleHelp() records visual-help-opened
             └─ Cancel ─> go to practice; record nothing
leave the route ─> visit discarded; the question stays current, with its draft and support state
```
