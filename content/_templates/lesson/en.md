---
title: <Title in English>
objective: <One sentence on what the learner will learn. Both keys are required; no other keys.>
---

<!-- Level 2 and 3 headings need an anchor {#id}. The same set of anchors in nb.md and en.md; order and prose may differ. -->

## <First section> {#first}

<Explanatory text. Mathematics is written as $3 + 7 = 10$ (inline) or $$8 + 5 = 13$$ (on its own line). Decimals may be 2,5 in Norwegian and 2.5 in English; the check compares them as the same value.>

| <Column> | <Column> |
| --- | --- |
| <row> | <row> |

<!-- Tables need the delimiter line "| --- | --- |" under the header row. -->

![<Alternative text describing the image>](assets/<file>.svg)

:::visual{type="ten-frame-explorer" start="3"}
:::

<!-- :::visual uses a registered component (content/registry/visual-components.json) and its attributes; the type must be listed in lesson.json visuals. Attributes are not translated and must be identical in both languages. -->

## <Second section> {#second}

:::example{title="<Translated title>" id="example"}
<Worked example. title is translated freely; id is shared by both languages.>
:::

## Practise {#practice}

:::practice{definition="<definition-id>" version="1"}
:::

<!-- :::practice names an exercise definition and version; the same pair must appear in lesson.json practice. -->
