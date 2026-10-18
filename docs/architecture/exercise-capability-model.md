# Exercise capability model

**Status:** Decision-ready capability model; input to Exercise Format v1, not an implemented contract

This document answers the following question:

> What kinds of mathematical learning activities must MathKX be capable of representing, presenting, generating, validating, adapting, and making accessible?

It is located under `docs/architecture/` because its primary purpose is to set boundaries for the exercise format and the future generator, validator, interaction, evidence, and authoring contracts. Pedagogical intent is the source of those requirements, so this document also extends the [learning model](../learning/learning-model.md) and [exercise experience](../design/exercise-experience.md). It does not define a mastery algorithm or a curriculum.

## 1. Scope and terminology

### Scope

The product's long-term scope extends from foundational arithmetic through university-level mathematics; see the [vision](../vision.md#mathematical-scope). The scenarios and phases below are an initial capability foundation, not an exhaustive university syllabus. Advanced subjects will require additional representative scenarios and validated extensions as content is introduced; the existing limits on symbolic equivalence and automatic proof grading still apply.

The model covers:

- the purposes for which an exercise can be used;
- what the learner is mathematically doing;
- how mathematics is represented;
- how the learner acts and what response artifact the action produces;
- how an instance is generated and reproduced;
- how a response is validated and converted into structured evidence;
- how hints, explanations, feedback, and composition work;
- what each interaction family requires for accessibility and internationalization; and
- what content contributors need to author and verify.

It deliberately does not specify application projects, UI component APIs, persistence, session-selection algorithms, a mastery formula, symbolic-algebra technology, AI grading, or a complete JSON schema.

### Core terms

| Term | Meaning |
| --- | --- |
| **Mathematical activity** | The mathematical work the learner performs, such as estimating, transforming an expression, interpreting a graph, constructing a triangle, or justifying a claim. |
| **Pedagogical purpose** | Why the activity is being offered now, such as exploration, guided practice, diagnosis, retrieval, or transfer. It is not an input control. |
| **Representation** | A semantic form in which mathematical information appears, such as notation, a table, number line, graph, diagram, manipulative, or simulation. |
| **Interaction** | How the learner acts, such as entering a quantity, selecting a region, ordering items, placing a point, or constructing an object. |
| **Response artifact** | The structured mathematical result of the interaction, independent of pointer events or framework state. Examples include a rational number, an ordered list of IDs, coordinates, a graph model, construction objects, or authored prose. |
| **Validation** | The deterministic or review-based process that compares a response artifact with mathematical constraints or a rubric and returns a structured result. Parsing and validation are separate concerns. |
| **Exercise definition** | Versioned authored data describing a reusable family of learning interactions and naming code extensions where needed. |
| **Exercise instance** | A concrete, replayable activity resolved from a definition and, where applicable, a seed. It contains the presentation and private validation data needed for the attempt. |
| **Attempt** | A learner's work on an instance, including response artifacts, support context, and validation results. |
| **Mastery evidence** | Structured observations emitted from an attempt for later interpretation. Evidence is not itself a mastery update. |
| **Composition** | A bounded set of related prompts, parts, or steps within one exercise instance. Composition is not session adaptation. |
| **Learning session** | A sequence chosen by a future learning engine. It may revisit prerequisites and later return to a goal; that orchestration does not belong in exercise-definition JSON. |

### How to read decisions and uncertainty

- **Decision** means a durable MathKX constraint, either already established or settled by this model.
- **Recommendation** means concrete input for Exercise Format v1 that still needs schema and implementation design.
- **Proposed direction** means important later capability for which the exact contract is intentionally open.
- **Open question** means no decision should be inferred.

### Research basis

Research and standards inform the coverage; they do not become MathKX's domain model:

- The National Research Council describes mathematical proficiency as intertwined conceptual understanding, procedural fluency, strategic competence, adaptive reasoning, and productive disposition. This argues against treating correctness on routine calculations as the whole construct ([*Adding It Up*, chapter 4](https://nap.nationalacademies.org/skim.php?chap=115-156&record_id=9822)).
- The OECD mathematics framework separates reasoning from the modeling processes of formulating, employing, and interpreting/evaluating. This supports representing modeling and interpretation as distinct activities rather than as generic word problems ([PISA 2022 mathematics framework](https://www.oecd.org/en/publications/pisa-2022-assessment-and-analytical-framework_dfe0bf9c-en/full-report/component-3.html)).
- The US Institute of Education Sciences recommends spaced learning, active retrieval, interleaved worked examples and problem solving, integrated concrete and abstract representations, and deep explanatory questions. These are delivery and support needs, not merely item types ([Organizing Instruction and Study](https://ies.ed.gov/ncee/wwc/PracticeGuide/1)). Its mathematics problem-solving guide also supports visual representations, multiple strategies, and reflection ([Improving Mathematical Problem Solving in Grades 4 Through 8](https://ies.ed.gov/ncee/WWC/PracticeGuide/16/Published)).
- NCTM's formative-assessment position emphasizes feedback, self-reflection, and evidence of reasoning and misconceptions. MathKX therefore needs more structured output than correct/incorrect ([NCTM formative assessment position](https://www.nctm.org/uploadedFiles/Conferences_and_Professional_Development/Annual_Meeting_and_Exposition/Formative%20Assessment%20position%20statement.pdf)).
- Evidence-centered assessment design separates what is being measured, the observable evidence, and the task that elicits it. This reinforces the separation between skill claims, response artifacts, validation, and later inference ([ETS overview of assessment-design models](https://www.ets.org/research/policy_research_reports/publications/chapter/2010/ihnm.html)).
- CAST recommends multiple means of representation and action/expression, including support for mathematical notation, varied response methods, assistive technology, graduated support, and reflection ([UDL Guidelines 3.0](https://udlguidelines.cast.org/action-expression/)).
- WCAG 2.2 requires semantic relationships, keyboard operation, color-independent meaning, programmatic component state and feedback, and a non-dragging path for dragging functionality. A nominal text description is not an equivalent way to complete a mathematical construction ([WCAG 2.2](https://www.w3.org/TR/WCAG22/)).
- MathML provides a web representation for the structure and meaning of notation. MathKX need not select a storage syntax here, but rendered mathematics must retain semantics rather than become an image or opaque string ([MathML](https://www.w3.org/TR/MathML/)).
- Unicode CLDR shows that decimal and grouping symbols, digit systems, percentages, and other number conventions vary by locale. Parsing and display cannot assume English notation ([Unicode LDML numbers](https://www.unicode.org/reports/tr35/tr35-numbers.html)).
- QTI demonstrates the practical breadth of assessment interactions and the value of accommodation-aware, web-friendly contracts. MathKX is not adopting QTI, whose interoperability scope differs from a generative learning platform ([1EdTech QTI 3](https://www.1edtech.org/standards/qti/index)). Established graphing tools also demonstrate that interactive graphs can support keyboard control, mathematical speech, descriptions, and audio tracing, although MathKX must test its own learning-equivalent designs ([Desmos accessibility features](https://help.desmos.com/hc/en-us/articles/4404860698253-Introduction-to-Accessibility-Features)).

## 2. Design dimensions

### The dimensions are independent

**Decision:** MathKX models the following dimensions separately and composes them explicitly. No value such as `solve-linear-equation`, `number-input`, or `mastery-check` may stand in for all of them.

| Dimension | Question answered | Example |
| --- | --- | --- |
| Target and evidence claim | What knowledge or capability could this task provide evidence about? | Solve a one-variable linear equation independently. |
| Pedagogical purpose | Why is it being offered? | Guided practice or a mastery check. |
| Mathematical activity | What mathematical work is required? | Transform and solve. |
| Representation | In what semantic forms is information shown? | Equation notation linked to an equation balance. |
| Interaction | How does the learner act? | Move weights, enter a final value, or both. |
| Response artifact | What mathematical object does the interaction produce? | A sequence of balance-preserving operations and a scalar solution. |
| Validation | What makes the artifact acceptable? | Each operation preserves equivalence; the final value satisfies the equation. |
| Generation | Where do the concrete values and assets come from? | A named deterministic generator with bounded integer parameters. |
| Composition | How are related parts organized? | Optional balance exploration followed by one final response. |
| Support and feedback | What help and interpretation are available? | Progressive hint, prerequisite reminder, and misconception-specific feedback. |
| Accessibility and locale | How is the same objective operable and understandable for different learners and locales? | Keyboard commands and semantic operation list; locale-aware number entry. |
| Session orchestration | What happens before and after the exercise? | Temporarily revisit inverse operations, then return to the equation. |

This separation prevents three recurring errors:

1. an input control being mistaken for a mathematical task;
2. an automatically scorable response being mistaken for complete evidence of understanding; and
3. session adaptation being encoded as arbitrary branches inside content data.

### Pedagogical purposes

Purposes describe intended use. Several may apply to the same definition, but the active purpose of a delivered instance belongs to the session context because it affects allowed support and evidence interpretation.

| Purpose family | Includes | Modeling consequence |
| --- | --- | --- |
| **Explore and notice** | Initial exploration, prediction, observation, linked-representation play | Usually a delivery mode with prompts and observations. It may be lightly validated or ungraded. |
| **Study a solution** | Worked examples, faded examples, identify or explain a step | A composition/support pattern. A worked example is not merely an exercise whose answer is already visible. |
| **Practice with support** | Guided practice, scaffolded practice, prerequisite reminders | Session purpose plus support policy; scaffolds may be a definition variant or bounded part structure. |
| **Practice independently** | Independent practice, fluency, retrieval | Session purpose. Retrieval and allowed aids affect evidence context; they do not create a new interaction type. |
| **Diagnose** | Diagnostic check, prerequisite diagnosis, misconception elicitation | Requires explicit evidence claims and carefully authored response patterns. It must not infer a misconception solely from one wrong answer. |
| **Assess formatively** | Formative check, self-check, targeted feedback | A delivery purpose emphasizing actionable feedback. |
| **Check mastery** | Mastery check or confirmation across variations | Session-level use of suitable definitions. A definition can be eligible, but one attempt cannot establish mastery. |
| **Review for retention** | Spaced review and mixed retrieval | Selection and scheduling behavior, not an exercise type. |
| **Transfer and apply** | Non-routine problem, unfamiliar representation, application, modeling | Definition metadata/evidence claim and task design; the session engine chooses when transfer evidence is appropriate. |
| **Reflect and communicate** | Explain, justify, compare strategies, self-evaluate | Mathematical activity and response mode; validation may be rubric-based rather than automatic. |

The `difficulty` of a task is not a purpose. Nor is it a single global label: difficulty may arise from values, language, number of steps, representation, required independence, unfamiliar context, distractors, or reasoning demand. Format v1 should preserve task features and leave calibration open.

### Evidence before interface

An exercise should be designed from a small evidence argument:

1. state the skill claim or learning objective;
2. identify an observable response that would support or challenge that claim;
3. choose a mathematical activity and representation that elicit it;
4. select an interaction that captures the response without adding irrelevant barriers; and
5. define validation and support context so later inference is honest.

This does not require a psychometric model in each JSON file. It does require the format to avoid erasing the distinction between a skill reference, an answer control, and the evidence produced.

## 3. Exercise capability taxonomy

The following activity families consolidate the preliminary list into mathematical actions. They are not mutually exclusive; a modeling task may require representing, calculating, and justifying.

| Activity family | Included activities | Important distinctions |
| --- | --- | --- |
| **Recall and recognize** | Recall facts, properties, definitions, notation, or a familiar example | Recognition from options and unaided production provide different evidence. Speed is not assumed to be part of the construct. |
| **Compute, estimate, and measure** | Numerical calculation, mental computation, approximation, estimation, counting, measuring, use of units | Exact computation, order-of-magnitude reasoning, and physical/virtual measurement require different tolerances and representations. |
| **Transform and solve** | Simplify, expand, factor, rearrange, solve equations or inequalities, apply algorithms, complete missing steps | A correct endpoint and a valid derivation are different response artifacts. Equivalent forms require mathematical validation. |
| **Compare, classify, associate, and order** | Compare magnitude or properties, classify objects, match equivalent representations, order values or steps | Membership rules, equality semantics, duplicate items, partial mappings, and order ties must be explicit. |
| **Represent, translate, and interpret** | Read notation, tables, graphs, diagrams, or data; convert between representations; locate values; complete patterns | Interpretation asks what a representation says; translation constructs another representation; linked representations expose how changes correspond. |
| **Construct and manipulate** | Plot, draw, make or modify graphs, build expressions, construct geometry, transform shapes, organize data, use manipulatives | The response is a structured mathematical object or action history, not the final pixel arrangement. Construction constraints may admit many valid products. |
| **Analyze data and chance** | Collect and organize data, summarize distributions, reason statistically, conduct probability experiments, compare expected and observed outcomes | Simulation output, learner choices, and conclusions are separate artifacts. Random experiments must be replayable where they affect the instance. |
| **Model and solve problems** | Formulate a situation mathematically, select assumptions and variables, employ mathematics, interpret and evaluate results, multi-step problem solving | A task can target one modeling phase or several. Context is not decorative, and several defensible models may exist. |
| **Inspect, diagnose, and revise** | Identify an error, select a misconception, critique reasoning, correct a solution, evaluate a model | Selecting a flawed step, explaining why, and repairing it are progressively stronger activities. Distractors alone do not prove a misconception. |
| **Explain, justify, and prove** | Explain reasoning, connect steps, justify a claim, construct or evaluate an argument or proof | A prose response, formal proof structure, diagram, or ordered justification may all be valid; many require a rubric or educator review. |
| **Investigate and conjecture** | Explore cases, notice invariants, pose questions, make and test conjectures, pursue open-ended investigations | Often cannot be reduced to one expected answer. The system should preserve work and prompts without pretending the investigation is fully auto-graded. |

### Content domains are separate

Arithmetic, algebra, geometry, functions, statistics, and probability are content domains, not activity types. The same activity—such as classify, construct, or justify—can apply in many domains. Curricula and grade levels remain outside both identities.

The [mathematics domain coverage](../learning/mathematics-domains.md) expands this scope through university mathematics. Domain coverage and exercise capabilities evolve together: a topic needs appropriate representations, response artifacts, and validation before usable content can be delivered.

### Composition requirements

MathKX eventually needs the following bounded shapes:

- a single prompt and response;
- several independent responses sharing one stimulus;
- related parts with explicit, acyclic dependencies;
- a multi-step derivation whose steps are individually reviewable;
- a scaffolded variant of a task, including faded worked steps;
- optional authored support paths that rejoin the task;
- multiple valid solution paths represented by constraints rather than exhaustive branching;
- several linked representations sharing a mathematical model;
- an investigation with checkpoints and an ungraded or rubric-reviewed conclusion; and
- a task with an automatically validated portion plus an educator-reviewed explanation.

**Decision:** an exercise definition may describe bounded parts, dependencies, and named support variants, but it must not contain general loops, executable expressions, arbitrary conditions, or session navigation. Optional prerequisite practice and return-to-goal behavior belong to the learning engine. Nontrivial derivation checking or path logic belongs to named, tested domain code.

## 4. Interaction taxonomy

An interaction contract has at least four concerns: semantic configuration, learner operation, response artifact, and accessible operation. The validator consumes the artifact, not DOM events or component state.

**Phase terms used below:**

- **Foundation/MVP** — implement and test end to end in the first useful learner slice.
- **Exercise Format v1** — the stable format should support or reserve a typed contract even if every renderer ships after the MVP slice.
- **Later** — design an extension point now but defer the concrete contract/component.
- **Research required** — do not claim reliable general support until pedagogy, accessibility, and validation are investigated.

| Interaction family | Suitable mathematical uses and response artifact | Validation needs | Keyboard, screen reader, mobile, and other accessibility needs | Phase |
| --- | --- | --- | --- | --- |
| **Choice and selection** | Recall/recognition, classification, graph/region selection, error identification. Artifact: stable option ID(s), never localized labels. | Single/multiple key, cardinality, partial credit policy, distractor/misconception metadata kept distinct from scoring. | Native choice semantics; logical focus order; selection state announced; large touch targets; no color-only or location-only instructions; options reflow. | Foundation/MVP |
| **Structured scalar and quantity entry** | Integers, decimals, rationals, percentages, approximations, measurements, and values with units. Artifact: parsed numeric/quantity value plus original input. | Exact rational/decimal semantics, tolerance rule, significant figures where relevant, allowed units and conversions, parsing errors separated from math errors. | Labeled input; on-screen and physical keyboard; locale-aware separators and digits; mathematical value spoken back; unit chooser or clear unit syntax; errors announced without clearing work. | Foundation/MVP |
| **Symbolic entry** | Expressions, equations, inequalities, intervals, sets, matrices, or missing algebraic steps. Artifact: a typed syntax tree or domain object plus original notation. | Grammar, assumptions/domain, normalization, equivalence or property checks, and clear distinction between syntax and mathematics. | Accessible equation editor with linear keyboard path, MathML or equivalent semantics, speech review and cursor navigation, usable on-screen symbol palette, no image-only notation. | Exercise Format v1 for syntax contract; advanced equivalence later |
| **Association, grouping, and ordering** | Match equivalent forms, sequence proof steps, order magnitudes, sort objects into classes. Artifact: ID mapping, ordered ID list, or group membership. | Completeness, one-to-one/many-to-one rules, duplicates, ties, unordered groups, partial correctness. | Select-then-place and move-up/down controls as alternatives to drag; announced positions and groups; keyboard reordering; touch targets and undo; source/target relationships exposed semantically. | Foundation/MVP for ordering/grouping; richer matching in Format v1 |
| **Blank, table, and grid completion** | Missing number/step, value tables, two-way tables, data organization. Artifact: keyed cell values or typed missing node. | Per-cell types, cross-cell constraints, dependency and partial results, blank-versus-zero distinction. | Real table/grid semantics; headers associated with cells; predictable tab/arrow behavior; row-oriented mobile alternative when needed; status and validation per cell; never rely on visual coordinates alone. | Exercise Format v1 |
| **Discrete spatial placement and selection** | Number-line values, coordinates, graph points, diagram regions, transformations on a grid. Artifact: semantic coordinate/value/region ID. | Snapping or continuum policy, coordinate tolerance, boundary rules, required multiplicity, order and labels. | Arrow-key movement with announced values; direct numeric coordinate/value entry that preserves the objective; zoom/pan separation; non-drag controls; large targets; screen-reader description of scale and current position. | Exercise Format v1 |
| **Graph construction and modification** | Plot functions or datasets, change parameters, draw intervals/regions, edit vertices or curves. Artifact: graph model—points, functions, domains, segments, or constraints. | Mathematical equivalence over a stated domain, sampling risks, discontinuities, tolerances, topology, required features. | Keyboard-accessible object list and editors; semantic axes/ranges; audio or tabular exploration where it preserves the objective; non-drag editing; high zoom and contrast; responsive toolbars. | Later; simple point plotting in Format v1 |
| **Direct manipulation and manipulatives** | Fraction bars, equation balances, base-ten objects, transformations, dynamic linked representations. Artifact: semantic object state and, only when pedagogically relevant, valid action sequence. | Invariants, equivalence classes, constraints, completion condition, reversible actions; do not validate screen coordinates. | Every drag has click/tap and keyboard alternatives; object/state announced; undo/reset; adequate targets; reduced motion; non-visual interaction must perform the same mathematical operation. | Later, with a narrow linked-representation pilot after v1 |
| **Geometry construction, drawing, and measurement** | Construct perpendicular bisector, transform a polygon, sketch a trend, measure length/angle. Artifact: geometric object graph, constraints, measurements, or stroke data where path is essential. | Incidence, parallel/perpendicular/congruent constraints, tolerance, degeneracy, multiple valid constructions, distinction between appearance and mathematical properties. | Keyboard construction commands and object tree; precise coordinate/property editing; tactile/non-visual research; zoom and snap controls; path drawing only when the path is the actual construct. | Later; freehand proof/sketch review is research required |
| **Step-by-step derivation and composite response** | Solve with visible steps, multi-part modeling, correct an error then explain. Artifact: ordered typed steps/parts with dependencies and status. | Per-step and whole-solution constraints, valid alternatives, partial correctness, propagation of an earlier error, provenance of generated hints. | Semantic step list; add/edit/reorder controls; clear dependency and focus; preserve work across feedback; small-screen part navigation without hidden context. | Exercise Format v1 for bounded parts; general derivation equivalence later |
| **Written reasoning and rubric response** | Short explanation, justification, modeling assumptions, critique, proof, reflection. Artifact: authored text and optional structured claims/evidence links. | Exact keywords are inadequate; use educator/rubric review or narrowly structured deterministic checks. Partial automation must be transparent. | Standard accessible text editing; language and direction metadata; no forced handwriting or speech; allow structured alternatives when writing mechanics are not the target. | Format v1 may capture ungraded/review-needed text; scoring research required |
| **Simulation and experiment control** | Probability trials, sampling, function or statistics explorers, data collection. Artifact: configuration, deterministic event stream or summary, learner predictions, and conclusions. | Seeded simulation rules, state transitions, statistical summaries, checkpoint constraints; never treat observing an animation as evidence by itself. | Start/step/pause/reset; no auto-play dependency; reduced motion; data table/text summary and sonification where useful; keyboard controls; no time pressure. | Later |

### Interaction rules

**Decision:**

- `interaction type`, `response artifact type`, and `validator` are separate contracts even when Format v1 offers convenient compatible combinations.
- A renderer must expose its semantic state and return a domain response artifact; it must not decide mathematical correctness.
- Pointer gestures, drag/drop, handwriting, animation, color, and timing are never the only means of operation or meaning unless the path, color perception, or timing is explicitly the learning objective and a fair accessible assessment design has been established.
- Switching to an accessible operation must not silently lower the mathematical objective or reduce the attempt's mastery evidence.
- Response variants that genuinely change the construct—recognition versus recall, for example—must be visible to evidence consumers. Pure access accommodations must not be interpreted as weaker performance.

## 5. Representation taxonomy

Representations are semantic mathematical views, not file formats or React component names. A prompt can combine them, and several views can bind to the same instance model.

| Representation family | Examples | Format and rendering requirements |
| --- | --- | --- |
| **Natural language and context** | Instructions, stories, claims, explanations, modeling situations | Localizable structured content; language and direction metadata; avoid embedding variables in untranslatable sentence fragments; distinguish relevant context from decoration. |
| **Structured mathematical notation** | Numbers, expressions, equations, inequalities, sets, intervals, proof statements | Preserve a syntax/semantic tree or equivalent source; render accessibly; support mathematical speech and locale conventions; do not store only pixels or presentation HTML. |
| **Tabular and discrete data** | Value tables, frequency tables, two-way tables, lists, matrices | Explicit headers, cell roles, units, missing values, and ordering; semantic table presentation and responsive alternatives. |
| **One-dimensional spatial models** | Number lines, timelines, scales, rulers | Domain, scale, ticks, marked values/intervals, orientation, and units are data; provide value-based exploration and entry. |
| **Coordinate and function views** | Cartesian/polar axes, plotted points, curves, regions, transformations | Coordinate system, domain/range, scale, objects, and relationships are semantic; accessible exploration cannot depend only on visual shape. |
| **Geometric diagrams and constructions** | Shapes, nets, angles, congruence marks, construction objects | Distinguish exact mathematical relations from illustrative appearance; expose objects and relations; declare whether a diagram is to scale. |
| **Manipulatives and structural models** | Fraction bars, counters, algebra tiles, base-ten blocks, equation balances | Objects and operations bind to mathematical values/invariants; visual layout is derived; direct manipulation is one control method, not the stored answer. |
| **Images and real-world media** | Photograph to measure, map, contextual illustration | Stable asset references, intrinsic dimensions/crop intent, rights/provenance, localized alternatives, and a task-equivalent non-visual path when the image carries the mathematics. |
| **Measurement and units** | Scales, clocks, protractors, rulers, dimensional quantities | Unit semantics, precision, scale, and measurement uncertainty are explicit; display conventions are locale-sensitive. |
| **Time-varying media** | Animation of transformation, worked step animation | Controls, transcript/step alternative, reduced-motion behavior, and deterministic state; animation should reveal a relationship rather than decorate it. |
| **Simulation and dynamic model** | Probability trials, sampling distribution, parameter explorer | State, controls, seed/event source, observables, and summary views are explicit; animation is only one projection of the model. |
| **Linked multiple representations** | Fraction bar ↔ number line ↔ rational notation; equation ↔ graph ↔ table | Views share stable bindings to one mathematical model. The definition identifies the intended link and editable views; the component owns synchronized rendering, not mathematical truth. |

### Representation decisions

**Decision:**

- Presentation content is structured and semantic. `format: "math"` plus a template string is insufficient for mixed text, notation, tables, assets, and linked views.
- A representation may be read-only, learner-editable, or derived from another representation. That role must be explicit.
- When one view changes another, the instance owns the shared mathematical state and bindings; duplicating values in independently templated strings risks contradictions.
- Visual assets must say whether they are decorative, illustrative, or mathematically operative. Mathematically operative assets require objective-preserving alternatives and semantic descriptions.
- The stored representation kind remains framework-neutral. Component registry names and compatibility versions belong to the delivery contract, not author-authored layout code.

## 6. Generation models

Generation resolves authored intent into a concrete instance. It includes fixed content as well as randomization.

| Model | Appropriate use | Data versus tested code | Reproducibility requirement |
| --- | --- | --- | --- |
| **Fixed authored instance** | A carefully designed proof critique, real dataset, diagram, or misconception item where variation is not beneficial | Data can hold the prompt, assets, response specification, and authored validation data | Definition ID and version identify the content; a seed may be accepted but has no effect |
| **Parameterized template** | Simple substitution whose constraints are local and easily validated, such as a fact family chosen from an authored set | Data holds typed choices/ranges and content blocks; a generic tested resolver performs substitution | Seed deterministically selects values and authored variants |
| **Named deterministic generator** | Linear equations, equivalent fractions, valid geometry, coherent multi-part problems | Tested .NET domain code performs mathematical construction and emits typed presentation and private validation data; JSON supplies validated parameters | Definition ID, definition version, seed, and generator compatibility identity reproduce the instance |
| **Generator-selected authored assets** | Select a graph, dataset, diagram, context, misconception, or localized asset from a curated bank | Authored assets and metadata are data; tested selection code enforces constraints and compatibility | Seed and versioned asset set produce the same selection |
| **Constrained random generation** | Vary values while controlling structure, arithmetic complexity, representation, and distractors | Only trivial constraints belong in data; constraint solving, rejection policy, and mathematical checks belong in tested code | Random stream and retry order are stable under the compatibility contract |
| **Multi-part generation** | Shared scenario with dependent sub-questions or a coherent derivation | A named generator emits all shared state and parts atomically so hints, diagrams, and answers cannot drift | One seed resolves the whole instance; part-level regeneration is not implicit |
| **Simulation configuration** | Probability experiments, sampling, dynamic models | Definition configures a named simulation; tested code owns transitions and calculations | Initial state and any generated event stream use explicit deterministic seeds; learner actions are replayable inputs when needed |

### When data is sufficient

Data is appropriate for:

- stable IDs, version numbers, skill and evidence references;
- authored content, assets, option sets, rubrics, hints, and explanations;
- small enumerations and simple bounded parameters;
- semantic representation and interaction selection;
- declared units, tolerances, constraints, and intended purposes; and
- deterministic test fixtures.

Tested domain code is required for:

- symbolic construction or equivalence;
- mathematical constraint solving and rejection sampling;
- geometry validity and construction constraints;
- graph/function equivalence;
- unit and dimensional reasoning beyond simple lookup;
- derived multi-part values and solution structures;
- simulation state transitions;
- nontrivial misconception classification; and
- any algorithm whose failure can make the question ambiguous, invalid, or misleading.

**Decision:** JSON does not gain arithmetic expressions, loops, arbitrary branching, executable predicates, or a general templating language to avoid named code. Generator-specific parameter schemas and semantic checks make extensions discoverable without turning data into a program.

### Reproducibility envelope

The established conceptual identity remains:

```text
(exercise definition ID, exercise definition version, seed)
```

Format v1 and the generator architecture must define how that identity resolves a compatible generator implementation, random-number algorithm, referenced asset versions, and locale-independent mathematical instance. Display locale may change rendering, but it must not change generated mathematics or accepted values unless the definition explicitly represents a locale-specific mathematical convention.

The concrete instance should record enough provenance to diagnose replay failures, including resolved definition version, named generator and compatibility version, seed representation, and referenced asset/content versions. The exact versioning mechanism remains open.

### Generation hazards and required checks

Generators and authored pools must be tested for:

- division by zero, invalid domains, overflow, non-finite values, and illegal unit operations;
- accidental ambiguity, missing information, unintended multiple answers, or no valid answer;
- values that produce ugly notation, unreasonable mental load, culturally inappropriate contexts, or unpredictable difficulty;
- reducible fractions or trivial coefficients when the objective requires otherwise;
- invalid, degenerate, off-canvas, or misleading geometry and diagrams;
- graphs whose viewport hides important features or falsely suggests properties;
- distractors that duplicate the correct answer after normalization;
- correlations or biased event streams in probability tasks;
- localized text, pluralization, decimal notation, and units that no longer match generated values;
- hints, worked steps, explanations, diagrams, and validators that refer to different resolved values; and
- rejection loops whose termination or output changes unexpectedly.

Property-based tests across seeds are useful but insufficient. Each generator also needs reviewed golden seeds covering boundaries, deterministic replay tests, parameter-schema tests, and agreement tests between solution construction and validation.

## 7. Validation models

Validation has four layers:

```text
raw interaction input
  -> parse to response artifact
  -> apply mathematical validator
  -> return structured validation result
  -> emit attempt evidence for later interpretation
```

A parse failure is not a mathematical misconception. A validation result is not a mastery decision.

### Automation classes

| Class | Meaning | Examples |
| --- | --- | --- |
| **A — deterministic automatic** | Mature, bounded rules with explainable results | Choice keys, exact integer/rational values, ordered IDs, coordinate point on a grid, numeric tolerance, simple unit conversion |
| **B — deterministic advanced mathematics** | Automatable in principle but needs substantial tested domain logic and declared assumptions | Symbolic expression equivalence, solution sets of equations/inequalities, graph equivalence, geometry constraints, derivation checking |
| **C — partially automatable** | Structural checks can help, but a complete validity judgment needs a rubric or human interpretation | Modeling assumptions, a proof with structured claims, a sketch plus explanation, multi-strategy reasoning |
| **D — educator or rubric review** | Authored work is preserved and routed for review; the system does not manufacture a score | Extended explanation, open investigation, novel proof, critique with contextual judgment |
| **E — deliberately deferred** | Trustworthy general validation is not established | General natural-language mathematical grading, arbitrary handwritten proof recognition, unconstrained construction intent |

### Required validation capabilities

| Response | Expected validation semantics | Class and cautions |
| --- | --- | --- |
| Exact scalar | Integer, finite decimal, Boolean, stable option or region ID | A; locale-aware parsing precedes canonical comparison |
| Approximate numeric | Absolute/relative tolerance, interval, rounding mode, or significant figures chosen for the task | A; never use an unexplained universal epsilon |
| Rational and equivalent numeric form | Exact normalized rational, with optional form constraints such as simplified or mixed form only when the skill requires them | A; mathematical equality and requested representation are separate checks |
| Quantity with units | Numeric relation plus compatible dimensions and allowed unit policy | A for curated unit families; B for general dimensional algebra |
| Expression | Structural match, normal form, numeric identity on a safe domain, or symbolic equivalence under stated assumptions | B; random point sampling alone cannot prove equivalence |
| Equation, inequality, interval, or set | Compare solution sets, boundaries, inclusivity, domain, and logical equivalence | B; surface syntax is insufficient |
| Coordinate or geometric object | Coordinates/tolerance plus declared properties and constraints | A for discrete points; B for general constructions and transformations |
| Ordered or unordered collection | Set, multiset, sequence, mapping, group membership, cardinality, and partial-match rules | A; duplicate and tie semantics must be explicit |
| Multiple valid answers | A constraint/predicate or finite accepted set with equivalence semantics | A or B; do not enumerate infinite forms in JSON |
| Multi-step work | Step validity, equivalence to previous step, final goal, dependencies, and partial result | A for authored finite paths; B for general algebraic derivations; preserve productive alternate methods |
| Graph | Object/feature constraints or function relation over a declared domain | B; pixel or sparse-sample equality is unsafe |
| Construction | Required relationships, object types, tolerances, and permitted tools | B; validate semantics rather than exact action sequence unless method is the objective |
| Written reasoning | Rubric dimensions, reviewer status, optional structured claims | C/D; exact phrase matching is not reasoning assessment |

### Validation result contract

A future validator should return a typed result rather than a Boolean. Candidate fields include:

- overall status: `correct`, `partially-correct`, `incorrect`, `invalid-response`, or `review-needed`;
- criterion results with stable IDs and optional fractional attainment;
- normalized response artifact where safe;
- feedback codes and parameters, not final localized prose;
- matched misconception **candidates** with strength/provenance, never an unqualified learner diagnosis;
- invalid-input details distinct from mathematical results;
- whether another valid solution path was recognized;
- validator identity and compatibility version; and
- audit/debug details that are not necessarily exposed to the learner.

Feedback should explain what can be concluded from the response without leaking private answer data to the client before submission.

### AI grading boundary

**Decision:** MathKX does not establish AI-based grading. General explanation and proof assessment remain review-needed or deliberately deferred. Future investigation would need evidence of mathematical validity, consistency across languages and learner groups, transparent uncertainty, contestability, privacy protection, security against prompt/content attacks, cost and availability bounds, and a non-AI fallback. An AI judgment must never be silently presented as deterministic truth or used as mastery evidence without an explicit, validated policy.

## 8. Hints, feedback, and misconceptions

### Support model

| Capability | Primary owner | Requirement |
| --- | --- | --- |
| Progressive authored hint | Definition, resolved into instance | Stable hint ID, ordered disclosure or prerequisite relation, localized semantic content, and answer-reveal level |
| Generated hint or worked step | Generator/instance | Derived from the same solution structure as the question and validator; reproducible and tested |
| Prerequisite reminder | Definition metadata plus learning engine | Definition may name relevant skills/support; the engine decides whether to offer or schedule prerequisite work |
| Alternate representation | Definition/instance plus renderer | Must bind to the same mathematics, say whether it is a hint, and remain accessible |
| Authored explanation | Definition/instance | May show one or more strategies; clearly distinguished from the learner's own work |
| Targeted deterministic feedback | Validator result plus localized feedback catalog | Stable code and safe parameters; feedback is specific, actionable, and does not overclaim a misconception |
| Misconception candidate | Authored distractor/validator | Stable misconception ID, expected response pattern, and evidence strength; corroboration may require later attempts |
| Retry policy | Learning/session engine, constrained by definition capabilities | Preserve work, clarify whether answer/instance changes, and avoid repeated blind guessing |
| “I'm stuck” transition | Learner experience and learning engine | Offer hint, worked example, representation change, or prerequisite practice without treating help as failure |
| Return to original goal | Learning engine | Preserve the original instance/work where appropriate and explain why the detour was useful |

### Hint principles

- Hints progress from orientation and recall through strategy and partial execution; they need not all reveal equal amounts.
- Support can change the evidence context. The attempt records which support was available and requested, but the learner is not punished simply for seeking help.
- Generated explanations must come from a known solution structure, not a separately templated derivation that can drift from the instance.
- A wrong answer may match a known error pattern without proving the learner holds a stable misconception. Feedback may say what the response suggests, not label the learner.
- Feedback distinguishes entry/interaction problems, calculation slips, conceptual errors, and unreviewed responses.
- The definition describes available support; session policy chooses when and how it appears. No exercise JSON encodes a general tutoring conversation.

## 9. Mastery-evidence requirements

The exercise system emits trustworthy observations. A future mastery model decides how, if at all, to use them.

### Minimum provenance

Every evidence event needs:

- exercise definition ID and version;
- instance identity and seed/provenance;
- generator and validator compatibility identities;
- target skill/evidence-claim IDs;
- active pedagogical purpose and task-feature metadata;
- interaction and response-artifact types; and
- timestamps needed for ordering, with duration only when justified.

### Candidate observations

| Observation | Meaning and guardrail |
| --- | --- |
| Validation outcome | Overall and criterion-level result, including invalid and review-needed—not coerced to binary correctness |
| Degree of independence | Observable support context: hints requested, worked steps exposed, answer reveal, or educator assistance if known. “Independence” is inferred later, not claimed directly by the renderer. |
| Attempts and revisions | Submission count and meaningful revisions within the same instance; do not equate persistence or correction with lower ability. |
| Partial steps | Which declared criteria or derivation steps were satisfied, including valid work after an earlier propagated error |
| Misconception signal | Stable candidate ID, triggering response pattern, validator source, and confidence category; never a diagnosis from a distractor alone |
| Representation and interaction | Which construct-relevant representation/response variant was used or changed; access accommodations are separated from construct changes |
| Transfer conditions | Authored task feature indicating unfamiliar context, representation, or combination; transfer is not inferred from a generic “hard” label |
| Response artifact | Canonical mathematical response or privacy-minimized features where retention is necessary; raw prose/action logs require a clear need |
| Time | Optional and coarse unless speed is explicitly part of the objective; pause/background time and assistive-technology effects make ordinary duration weak evidence |
| Review status | Pending/reviewed rubric result and reviewer provenance; absence of automatic score is not failure |

### Evidence exclusions and fairness

**Decision:**

- Using a screen reader, keyboard mode, enlarged display, reduced motion, alternative input path, localized notation, or extra time is not negative mastery evidence.
- Accessibility preferences should not be copied into content analytics unless required for operation and handled under a privacy policy. Evidence may record a construct-relevant response variant without recording a disability or diagnosis.
- Time-on-task is not emitted as a universal quality score. It may support debugging or an explicitly timed fluency objective with a suitable alternative, but it is not a default mastery signal.
- “First try,” streaks, and exercise count are not substitutes for evidence quality.
- A single response is evidence about an attempt, not proof of mastery or a stable misconception.
- Evidence consumers must be able to distinguish missing, invalid, incorrect, partially correct, and awaiting review.

## 10. Accessibility and internationalization requirements

Accessibility is part of each capability contract, not an optional description field. WCAG conformance is a minimum delivery requirement; mathematical equivalence of access paths is an additional product requirement.

### Cross-cutting accessibility contract

Every representation and interaction family must specify and test:

- keyboard-only discovery, operation, review, correction, submission, reset, and escape;
- programmatic name, role, state, value, relationships, reading order, and status messages;
- mathematical speech and navigable notation, using MathML or an equivalently semantic delivery path;
- a non-visual method that preserves the mathematical objective for diagrams and spatial tasks;
- alternatives to dragging, path gestures, hover, device motion, and pointer precision;
- color-independent labels and patterns plus adequate text and non-text contrast;
- zoom, reflow, orientation changes, large targets, touch, and mobile software keyboards;
- reduced-motion behavior and controls for animation, audio, simulation, and automatic updates;
- preserved work and focus after validation, hints, responsive layout changes, and errors; and
- testing with assistive technologies and disabled learners rather than schema presence alone.

A long description of a graph is sufficient only when the objective is to extract exactly the described facts. It is not equivalent when the objective is to explore the graph, locate a point, compare trends, or construct a curve. An alternative may use an accessible object list, value table, numeric coordinate controls, structured relations, audio tracing, or another mode—but it must elicit comparable mathematics.

### Internationalization contract

Definitions and instances separate canonical mathematical values from localized rendering and entry. They must support:

- stable language-neutral IDs for skills, definitions, generators, validators, representations, interactions, hints, rubrics, and misconceptions;
- localizable complete messages rather than concatenated English fragments;
- language and bidirectional metadata for text, notation, tables, controls, and authored responses;
- right-to-left page layouts without assuming mathematical expressions always follow the surrounding text direction;
- locale-aware decimal/group separators, signs, digits, percentages, list separators, and number grouping;
- accepted input conventions that normalize to canonical values without making the correct answer locale-dependent;
- notation conventions that vary by audience or locale, with explicit display policy where mathematical meaning could change;
- units and unit labels separated into canonical quantity semantics and localized display;
- pluralization, grammatical agreement, and variable placement in generated messages;
- translatable alt text, descriptions, hints, explanations, feedback, and rubrics; and
- asset variants or culturally neutral assets where text, symbols, currency, maps, or context is embedded.

Locale is not an input to mathematical randomness. The same instance identity produces the same canonical mathematics across locales, while localization produces an equivalent presentation. Truly locale-specific content should be an explicit authored variant, not an ambient generator side effect.

## 11. Content-authoring implications

Teachers and content contributors should be able to author without application code:

- fixed exercises and bounded parameterized definitions;
- stable references to skills, purposes, evidence claims, interactions, representations, generators, validators, assets, hints, misconceptions, and rubrics;
- authored content and translations;
- option sets, expected scalar/quantity values, finite mappings, tolerances, and simple constraints;
- bounded parts and explicit dependencies;
- accessibility descriptions and objective-preserving alternative configurations;
- deterministic preview seeds and expected outcomes; and
- reviewed examples for boundary values and common wrong responses.

They should request or select a named code extension for symbolic logic, constrained generation, geometry, simulations, graph equivalence, and other nontrivial mathematics.

### Authoring workflow requirements

The repository workflow should eventually provide:

- discoverable catalogs and documentation for valid skill IDs, activity/purpose terms, component capabilities, named generators, and validators;
- JSON Schema syntax validation plus generator-/validator-specific parameter schemas;
- semantic reference validation and compatible interaction/response/validator checks;
- deterministic previews by locale, viewport, input mode, and seed;
- keyboard and screen-reader preview paths, not only a visual screenshot;
- golden seed tests, boundary seed suites, and generated-sample inspection;
- checks for duplicate options after normalization, ambiguous answers, invalid assets, missing descriptions, and untranslated content;
- solution/hint/explanation/validator agreement checks;
- source and license/provenance metadata for datasets and assets;
- pull-request review that includes mathematical, pedagogical, localization, and accessibility perspectives as appropriate; and
- concise errors that point to the responsible definition field or named extension contract.

The format must remain readable in a pull request. A visual authoring tool may come later, but it should produce the same reviewable format rather than become an opaque source of truth.

## 12. Representative exercise scenarios

These 17 scenarios are architecture tests, not a starter content library or approved skill taxonomy. They deliberately span routine, visual, multi-part, open, and review-needed work.

### S1. Retrieve a multiplication relationship

- **Skill:** multiplication facts and inverse relationships.
- **Learning objective:** Produce a factor in a familiar fact family without prompts that turn recall into recognition.
- **Learner prompt:** “`7 × ? = 56`.”
- **Representation:** Structured equation notation.
- **Interaction type:** Structured integer entry; a diagnostic variant may use choice options, but it represents a different evidence condition.
- **Generation approach:** Parameterized selection from a reviewed fact-family table, with commuted and inverse forms controlled explicitly.
- **Validation approach:** Class A exact integer validation.
- **Possible hints:** Recall `7 × 8`; show an equal-groups representation; connect division and multiplication.
- **Misconception or prerequisite relevance:** Reversal of factors is harmless here; repeated addition and division facts are related prerequisites. Time is not scored unless fluency speed is explicitly and fairly targeted.
- **Accessibility approach:** Semantic equation with mathematical speech, ordinary labeled numeric input, locale-aware digits, no timer by default.
- **Why it matters architecturally:** Separates production from multiple-choice recognition, and shows that retrieval is a session purpose while the activity and interaction remain reusable. **Phase:** Foundation/MVP.

### S2. Estimate before calculating a quantity

- **Skill:** decimal estimation and reasonableness with money or quantities.
- **Learning objective:** Choose a defensible magnitude before exact computation.
- **Learner prompt:** “Three items cost 19.80, 5.15, and 9.60 units of currency. Give a quick estimate of the total and then calculate the exact total.”
- **Representation:** Localized natural language and a short quantity list.
- **Interaction type:** Two-part quantity entry: estimate, then exact value.
- **Generation approach:** Named or constrained generator selecting coherent prices and a currency-neutral canonical unit; locale rendering supplies separators and labels.
- **Validation approach:** Class A interval or declared tolerance for the estimate; exact canonical decimal for the total. The estimate must be submitted before the exact result is revealed.
- **Possible hints:** Round each value to a nearby whole or multiple of five; compare the exact result with the estimate.
- **Misconception or prerequisite relevance:** Decimal place value and addition; implausible estimates provide a signal distinct from arithmetic error.
- **Accessibility approach:** Values are text and structured quantities, not an image of a receipt; full locale-aware entry and unit speech; related parts have explicit headings.
- **Why it matters architecturally:** Requires dependent parts, purpose-specific reveal policy, tolerances, quantities, and locale separation—none fit one `answer.type`. **Phase:** Exercise Format v1.

### S3. Link a fraction bar, number line, and notation

- **Skill:** fractions as numbers and equivalent representations.
- **Learning objective:** Connect `3/4` to a partitioned whole and its location on a number line.
- **Learner prompt:** “Make three quarters in the bar. Then place the same value on the number line.”
- **Representation:** Linked fraction bar, number line, and rational notation.
- **Interaction type:** Select bar parts and place a number-line point; response artifact is canonical rational state plus point value.
- **Generation approach:** Fixed task initially; later a named generator chooses denominators and equivalent partitions with display constraints.
- **Validation approach:** Class A exact rational equality across both views, plus completeness of each part.
- **Possible hints:** Count equal parts; show the numerator/denominator roles; highlight equal intervals without filling the answer.
- **Misconception or prerequisite relevance:** Unequal partitioning, counting tick marks instead of intervals, or treating numerator and denominator as independent whole numbers.
- **Accessibility approach:** Bar cells are a labeled group with select/deselect controls; the number line supports arrow movement and direct rational value entry; the synchronized value is announced. The non-visual path still requires creating both representations.
- **Why it matters architecturally:** Requires shared semantic state and two editable representations rather than a decorative `visualization`. **Phase:** Exercise Format v1, with a narrow component pilot.

### S4. Order rational numbers in mixed forms

- **Skill:** compare fractions, decimals, and percentages.
- **Learning objective:** Order equivalent and non-equivalent rational values by magnitude across notation forms.
- **Learner prompt:** “Put `0.6`, `5/8`, `60%`, and `2/3` in increasing order. Values that are equal may share a position.”
- **Representation:** Structured notation tokens, optionally paired with a read-only number line.
- **Interaction type:** Ordering with explicit tie groups; artifact is an ordered partition of stable item IDs.
- **Generation approach:** Generator-selected authored sets reviewed for desired equivalences and spacing.
- **Validation approach:** Class A ordered-group comparison with equality semantics and partial criterion results.
- **Possible hints:** Convert one representation; locate approximate positions on a number line.
- **Misconception or prerequisite relevance:** Comparing written digits or denominators rather than values; percentage scale confusion.
- **Accessibility approach:** Move-before/after and group-with controls, keyboard ordering, positions announced, no drag requirement; notation is speech-accessible.
- **Why it matters architecturally:** Ordinary ordered arrays cannot express ties, and option display values must remain separate from stable IDs. **Phase:** Foundation/MVP for simple ordering, Format v1 for tie groups.

### S5. Simplify an expression while preserving structure

- **Skill:** collect like terms and understand algebraic equivalence.
- **Learning objective:** Transform `3x + 2 + 4x - 5` to an equivalent simpler expression and identify the operation used.
- **Learner prompt:** “Simplify the expression. Then name which terms you combined.”
- **Representation:** Structured algebraic notation.
- **Interaction type:** Symbolic expression entry plus selection of source term IDs.
- **Generation approach:** Named generator emits an expression tree, term provenance, safe variable assumptions, and a solution structure.
- **Validation approach:** Class B symbolic equivalence plus Class A term-selection criteria; an exact expected string is insufficient.
- **Possible hints:** Mark like terms; show coefficients separately; offer a partially grouped expression.
- **Misconception or prerequisite relevance:** Combining constants with variable terms, dropping a sign, or concatenating coefficients.
- **Accessibility approach:** Keyboard-accessible expression editor, mathematical speech and structural navigation; terms have stable spoken labels and selection controls; mobile symbol palette does not replace typing.
- **Why it matters architecturally:** Requires structured notation, generated provenance, multi-artifact validation, and advanced named mathematics. **Phase:** symbolic syntax in Format v1; equivalence engine later.

### S6. Solve an equation with an equation balance

- **Skill:** solve one-variable linear equations using equivalence-preserving operations.
- **Learning objective:** Understand that the same operation must be applied to both sides and determine the solution.
- **Learner prompt:** “Use the balance to solve `3x + 2 = 14`, then enter the value of `x`.”
- **Representation:** Linked equation notation and semantic balance model.
- **Interaction type:** Direct manipulation or operation commands followed by scalar entry; artifact stores mathematical operations and the final value, not coordinates.
- **Generation approach:** Named deterministic generator constructs equations with controlled integer solutions, balance objects, valid operation paths, and aligned hints.
- **Validation approach:** Class A invariant checks for a curated operation set and exact substitution for the final answer; general derivation equivalence is Class B.
- **Possible hints:** Remove equal constants from both sides; divide both sides into equal groups; show the corresponding notation after an operation.
- **Misconception or prerequisite relevance:** One-sided operations, sign errors, inverse operations, and division facts.
- **Accessibility approach:** Buttons or command list apply the same operations as drag gestures; equation and balance state are announced; undo works in every mode; motion can be reduced.
- **Why it matters architecturally:** The preliminary example names `equation-balance` but cannot bind it to the equation, store operations, express an accessible alternative, or validate the interaction. **Phase:** Later direct manipulation; Foundation/MVP may deliver the equation with scalar entry.

### S7. Match a linear relationship across table, equation, and graph

- **Skill:** recognize equivalent representations of linear functions.
- **Learning objective:** Connect rate and intercept across three representations.
- **Learner prompt:** “Match each table and graph to the equation that describes it.”
- **Representation:** Several tables, equations, and coordinate graphs.
- **Interaction type:** Many-to-one or one-to-one matching using stable representation IDs.
- **Generation approach:** Named generator creates function models first, then derives all views and checks graph viewport separation.
- **Validation approach:** Class A mapping comparison because the generator supplies identity; no visual image matching.
- **Possible hints:** Compare `y` when `x = 0`; compare how much `y` changes when `x` increases by one.
- **Misconception or prerequisite relevance:** Confusing slope and intercept; reading graph scale incorrectly.
- **Accessibility approach:** Each graph has a semantic summary and accessible value exploration; matching uses select-then-associate controls and a reviewable association list; tables expose headers.
- **Why it matters architecturally:** Requires representation blocks derived from a shared model, accessible graph alternatives, and matching separate from mathematical identity. **Phase:** Exercise Format v1 after accessible simple graphs.

### S8. Plot coordinates and interpret order

- **Skill:** ordered pairs in a Cartesian coordinate system.
- **Learning objective:** Plot `(-2, 3)` and distinguish horizontal from vertical coordinates.
- **Learner prompt:** “Place point `P` at `(-2, 3)`.”
- **Representation:** Structured ordered pair and coordinate plane.
- **Interaction type:** Discrete spatial point placement; artifact is point label and exact coordinates.
- **Generation approach:** Constrained parameterized task or named generator controlling range, quadrants, axes, and collisions.
- **Validation approach:** Class A coordinate equality; optional partial criteria for correct `x` or `y`.
- **Possible hints:** Move along the `x`-axis first; then move parallel to the `y`-axis.
- **Misconception or prerequisite relevance:** Coordinate reversal, sign direction, or counting grid lines incorrectly.
- **Accessibility approach:** Arrow-key movement announces coordinates; labeled numeric `x` and `y` fields provide a non-pointer path with the same objective; axes, range, and point state are spoken; touch placement snaps visibly and audibly.
- **Why it matters architecturally:** Demonstrates that direct coordinate entry can be an objective-preserving access path rather than a weaker fallback. **Phase:** Exercise Format v1.

### S9. Transform a polygon on a coordinate plane

- **Skill:** translations and geometric transformations.
- **Learning objective:** Apply vector `(3, -1)` to every vertex and describe the invariant properties.
- **Learner prompt:** “Translate triangle `ABC` by `(3, -1)`. Select the properties that stay the same.”
- **Representation:** Coordinate diagram with semantic polygon objects and vector notation.
- **Interaction type:** Move the polygon or edit output coordinates, plus multiple selection.
- **Generation approach:** Named generator chooses non-degenerate polygons whose image stays in the viewport.
- **Validation approach:** Class B vertex correspondence/transformation constraints plus Class A property selection.
- **Possible hints:** Apply the vector to one vertex; compare side lengths and orientation.
- **Misconception or prerequisite relevance:** Applying the vector to only one vertex, reversing signs, confusing translation with reflection.
- **Accessibility approach:** Vertex table and “apply vector” controls mirror drag behavior; object list exposes coordinates and relationships; selection of invariants uses ordinary controls; zoom does not hide tool state.
- **Why it matters architecturally:** Combines construction and conceptual evidence, admits different operation paths, and must validate geometry rather than final pixels. **Phase:** Later.

### S10. Construct and measure an angle bisector

- **Skill:** angle measurement and geometric construction.
- **Learning objective:** Construct a bisector and verify the resulting equal angles.
- **Learner prompt:** “Construct the bisector of angle `ABC`, then measure both new angles.”
- **Representation:** Geometry canvas, object tree, exact incidence relations, and measurement labels.
- **Interaction type:** Geometry construction commands plus measurement; artifact is a geometric object graph and quantities.
- **Generation approach:** Fixed authored configuration initially; later a named geometry generator avoids degenerate or off-canvas angles.
- **Validation approach:** Class B ray-incidence and equal-angle constraints with declared tolerance; measurements checked against the constructed object.
- **Possible hints:** Choose a point equidistant from both sides; compare the two resulting angles.
- **Misconception or prerequisite relevance:** Visual “looks centered” judgment, incorrect vertex, imprecise measurement, misunderstanding rays.
- **Accessibility approach:** Keyboard command palette, focusable object tree, property editor, and announced relations; a non-visual construction by selecting named objects and constraints must be researched with blind learners before claiming equivalence.
- **Why it matters architecturally:** Exposes the limits of generic drag/drop and the need for semantic construction constraints and accessibility research. **Phase:** Later / research required for a complete non-visual experience.

### S11. Compare distributions, not just averages

- **Skill:** interpret center, spread, and shape in data distributions.
- **Learning objective:** Compare two datasets with equal means but different spread and justify which is more consistent.
- **Learner prompt:** “Both groups have the same mean. Which group is more consistent, and what in the data supports your answer?”
- **Representation:** Dot plots linked to accessible sorted tables and summary statistics.
- **Interaction type:** Choice plus short written or structured evidence selection.
- **Generation approach:** Generator-selected reviewed datasets with the intended equal-center/different-spread relationship.
- **Validation approach:** Class A selection; structured evidence criteria can be automatic; free explanation is Class C/D review-needed.
- **Possible hints:** Compare distances from the mean; look at the range; inspect both the plot and table.
- **Misconception or prerequisite relevance:** Treating equal means as identical distributions or confusing range with maximum.
- **Accessibility approach:** Dot plots have navigable values and grouped frequency tables; patterns/labels distinguish groups; explanation input supports direction/language; no information is color-only.
- **Why it matters architecturally:** Requires multiple response statuses in one task and an honest mix of automatic and review-needed validation. **Phase:** Exercise Format v1 for structured version; reviewed prose later.

### S12. Organize raw observations into a frequency table

- **Skill:** data collection and organization.
- **Learning objective:** Tally categorical observations and produce consistent frequencies.
- **Learner prompt:** “Organize the 20 observations into the table. Check that your frequencies account for all observations.”
- **Representation:** Localized list/cards of observations and a semantic frequency table.
- **Interaction type:** Table completion or classification into groups; artifact is category-to-count mapping.
- **Generation approach:** Parameterized authored data pool or named generator with explicit categories, counts, and shuffled order.
- **Validation approach:** Class A cell values plus cross-cell total and source-classification consistency.
- **Possible hints:** Mark observations already counted; verify the total; sort by category first.
- **Misconception or prerequisite relevance:** Double counting, omitted items, treating labels as ordered quantities.
- **Accessibility approach:** Each observation has a stable ID and text label; table headers are semantic; group assignment works through menus as well as drag; counted status is announced but not color-only.
- **Why it matters architecturally:** Requires cross-cell validation and input state tied to source items, not isolated blanks. **Phase:** Exercise Format v1.

### S13. Predict and run a probability experiment

- **Skill:** relate theoretical probability to experimental frequency.
- **Learning objective:** Predict a result, run repeatable trials, and explain variation rather than expect exact equality.
- **Learner prompt:** “Predict the proportion of heads in 20 fair coin tosses. Run the experiment, then repeat with 200 tosses. What changes?”
- **Representation:** Simulation controls, event/summary table, proportion graph, and natural-language reflection.
- **Interaction type:** Prediction entry, simulation control, and structured conclusion selection or prose.
- **Generation approach:** Named seeded simulation with separate deterministic event stream; instance records rules and seeds.
- **Validation approach:** Class A prediction range and structured conclusions; no exact required random outcome; prose is Class C/D.
- **Possible hints:** Compare distance from one half; focus on proportion rather than number of heads; repeat without changing fairness.
- **Misconception or prerequisite relevance:** Law-of-small-numbers expectations, gambler's fallacy, counts versus proportions.
- **Accessibility approach:** Step/run/pause/reset controls; full event and summary table; reduced motion; optional sonification; graph is not the only source of results; no timed observation.
- **Why it matters architecturally:** Separates simulation state, random stream, learner action, prediction, observation, and conclusion. **Phase:** Later.

### S14. Model and compare two pricing plans

- **Skill:** formulate, use, and interpret linear models.
- **Learning objective:** Choose variables, create expressions for two plans, find a break-even point, and interpret it in context.
- **Learner prompt:** “Plan A costs 40 plus 2 per use. Plan B costs 10 plus 5 per use. Represent each plan, find where they cost the same, and recommend a plan for 15 uses.”
- **Representation:** Natural-language context, equations, table/graph on request, and units.
- **Interaction type:** Bounded multi-part response: variable meaning, two expressions, quantity solution, and structured or written interpretation.
- **Generation approach:** Fixed authored task first; named multi-part generator later ensures meaningful integer/non-integer intersections and coherent units.
- **Validation approach:** Class B expression equivalence, Class A break-even quantity and recommendation under the stated use, Class C/D explanation.
- **Possible hints:** Identify fixed and per-use costs; create a row for zero uses; set the costs equal.
- **Misconception or prerequisite relevance:** Swapping rate and intercept, ignoring units/domain, treating the intersection cost as the number of uses.
- **Accessibility approach:** Complete text context; semantic expressions and tables; graph is optional and has value-table exploration; parts preserve state and relationships on mobile.
- **Why it matters architecturally:** Represents several phases of modeling and several validation classes without an arbitrary workflow. **Phase:** Exercise Format v1 for bounded parts with fixed values; generated variants later.

### S15. Diagnose and repair a flawed solution

- **Skill:** reason about equality and algebraic transformations.
- **Learning objective:** Identify the first invalid step, explain the violated principle, and correct the work.
- **Learner prompt:** Show `2(x + 3) = 14`, `2x + 3 = 14`, `2x = 11`, `x = 5.5`; ask “Select the first invalid step and repair it.”
- **Representation:** Ordered derivation with stable step and term IDs.
- **Interaction type:** Step selection plus corrected symbolic step; optional structured reason.
- **Generation approach:** Generator-selected authored misconception patterns, or a named generator that produces aligned erroneous and correct derivations.
- **Validation approach:** Class A first-error ID and reason code; Class B corrected-expression equivalence.
- **Possible hints:** Expand each term inside the parentheses; test whether the second line has the same value as the first for a sample `x`.
- **Misconception or prerequisite relevance:** Incomplete distribution. Matching this pattern is a misconception candidate, not a learner label.
- **Accessibility approach:** Semantic ordered list; steps and changes are spoken; selection is not tied to visual highlighting; expression correction uses accessible math entry.
- **Why it matters architecturally:** Requires error provenance, stable sub-object IDs, mixed validation, and feedback that distinguishes candidate misconceptions from scores. **Phase:** Exercise Format v1 with authored finite patterns.

### S16. Justify a parity claim

- **Skill:** mathematical reasoning and proof with algebraic representation.
- **Learning objective:** Explain why the sum of two odd integers is even for all odd integers.
- **Learner prompt:** “A few examples suggest that odd + odd is even. Give a reason that works for every pair of odd integers.”
- **Representation:** Natural language with optional structured algebraic notation and a proof scaffold.
- **Interaction type:** Written reasoning, or a structured proof variant that orders/selects claims and supplies expressions.
- **Generation approach:** Fixed authored task and rubric; no randomization needed.
- **Validation approach:** Structured scaffold can receive Class A/B criterion results; unrestricted proof is Class D educator/rubric review. Example checking alone is flagged as incomplete only in the structured variant.
- **Possible hints:** Represent odd integers as `2a + 1` and `2b + 1`; identify a factor of two in the sum.
- **Misconception or prerequisite relevance:** Confusing examples with proof; using the same variable for both arbitrary odd integers without explanation.
- **Accessibility approach:** Standard text and accessible math editor; proof scaffold has semantic claim order; no handwriting requirement; reviewers see the original notation and language metadata.
- **Why it matters architecturally:** Proves that valid exercises may be valuable without automatic final grading and that structured and open variants provide different evidence. **Phase:** Format v1 captures review-needed responses; general scoring deliberately unsupported.

### S17. Investigate a growing pattern

- **Skill:** detect structure, generalize, and form a conjecture.
- **Learning objective:** Explore a visual/numeric growth pattern, propose a rule, and test its limits.
- **Learner prompt:** “Build the next two figures. Record the number of tiles in each figure. Propose a rule for figure `n` and explain how the picture supports it.”
- **Representation:** Linked tile construction, table, algebraic notation, and explanation.
- **Interaction type:** Direct construction, table completion, symbolic rule, and written justification with optional checkpoints.
- **Generation approach:** Fixed authored investigation or named generator choosing a known pattern family and emitting model bindings.
- **Validation approach:** Class A counts for generated stages; Class B rule equivalence over the intended domain; Class D explanation/review. Alternative correct rules must be accepted.
- **Possible hints:** Mark what is added each time; compare first differences; relate a row in the table to a part of the figure.
- **Misconception or prerequisite relevance:** Extrapolating from too few cases, off-by-one indexing, treating a recurrence as an explicit rule without clarification.
- **Accessibility approach:** Tile construction also works through row/group controls and a semantic object list; the table and pattern description allow non-visual exploration while still requiring generalization; explanation is not forced into one medium when that is not the target.
- **Why it matters architecturally:** Stress-tests linked representations, several artifacts, alternate valid paths, and partial/reviewed outcomes. It should not be forced into a fully auto-graded workflow. **Phase:** Later / research required.

## 13. Phased capability matrix

The phase is a recommended delivery commitment, not a claim that later mathematics is less important. Format v1 must offer explicit extension points for later families without pretending their complete contracts are already known. The **Scenario** column confirms that every Foundation/MVP and Format v1 priority is exercised above.

| Capability | Example mathematical use | Required interaction / response | Validation approach | Visualization dependency | Accessibility implications | Generation approach | Recommended phase | Rationale | Scenario |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Choice and stable option IDs | Identify a flawed algebra step | Single/multiple selection | A: finite key and cardinality | None; options may include semantic math | Native semantics, announced state, reflow, non-color labels | Fixed or generator-selected options | Foundation/MVP | Low implementation risk and useful diagnostic coverage when distractors are reviewed | S15; S1 variant |
| Scalar numeric response | Recall a fact or solve an equation endpoint | Integer/decimal artifact plus original input | A: exact canonical value | None | Locale parsing, math speech, mobile keypad, error recovery | Fixed, template, or named generator | Foundation/MVP | Establishes parse/artifact/validator separation without making all answers text | S1, S6 |
| Exact rational and quantity response | Enter a fraction or measured value with a unit | Rational/quantity artifact | A: exact value, unit compatibility | Optional read-only model | Fraction speech, unit control, locale notation | Fixed or named generator | Foundation/MVP | Avoids float/string assumptions in the core domain | S2, S3 |
| Simple ordering and classification | Sort values or observations | Ordered IDs or group memberships | A: sequence/mapping, partial criteria | Optional | Non-drag move/group controls, positions announced, touch targets | Fixed or curated generated pool | Foundation/MVP | Broad mathematical use and proves interactions are not text-only | S4, S12 |
| Progressive authored hints and coded feedback | Remind a learner to round or apply distribution | Hint request events; feedback codes | A: validator emits codes, not localized truth | May reveal semantic representation | Focus/work preservation, live status, accessible hint content | Authored; values resolved from instance | Foundation/MVP | Needed for a useful learning slice and evidence context | S1, S2, S15 |
| Fixed authored definitions | Proof critique or reviewed dataset | Any supported response | Depends on response | Depends on task | Same per-family contract as generated tasks | Fixed data | Foundation/MVP | Generation must not be mandatory when authorship is pedagogically stronger | S16, S11 |
| Named deterministic generator contract | Coherent linear equations | Instance provenance; no learner interaction by itself | Generator/validator agreement tests | Generator may emit presentation models | Generated output must include semantics and access data | Tested named .NET extension | Foundation/MVP | Reproducibility and safe mathematics are foundational even for a small slice | S6, S1 |
| Typed evidence event | Record criteria, hint use, and purpose | Attempt/evidence artifact | Validator result with provenance | None | Accommodations separated from construct variants; privacy minimization | Instance and attempt metadata | Foundation/MVP | Prevents a Boolean-only attempt model and premature mastery assumptions | S1, S4, S6, S12, S15 |
| Bounded multi-part composition | Estimate, then calculate exactly | Typed part artifacts with explicit dependencies | A/B per part and aggregate status | Shared stimulus optional | Semantic part navigation, preserved state, mobile context | Fixed or atomically generated | Exercise Format v1 | Needed for modeling, estimation, and mixed evidence without a workflow language | S2, S14 |
| Structured content and math blocks | Mix prose, equations, and units | Read-only semantic presentation | N/A directly | Renderer for each semantic block | MathML/equivalent semantics, language/direction, reflow | Authored plus generated bindings | Exercise Format v1 | Replaces fragile single template strings and enables localization | S2, S14–S16 |
| Symbolic response syntax contract | Enter a simplified expression or corrected step | Typed expression/equation tree | A structural or B named validator | Accessible equation editor | Linear keyboard path, speech/navigation, mobile symbol entry | Named generator may emit syntax/assumptions | Exercise Format v1 | v1 needs a response shape and extension boundary even if full equivalence comes later | S5, S15 |
| Table/grid response | Complete a frequency or value table | Keyed typed cells | A: cells plus cross-cell rules | Semantic table renderer | Headers, predictable focus, row mobile alternative | Fixed or generated shared table model | Exercise Format v1 | Supports data and functions and exercises partial validation | S12, S2 |
| Discrete number-line and coordinate placement | Locate `3/4` or plot `(-2,3)` | Canonical value/coordinate | A: equality or declared snapping tolerance | Number-line/coordinate renderer | Arrow and direct-value path, announced scale/state, non-drag control | Fixed or constrained generator | Exercise Format v1 | The narrowest high-value spatial interaction family | S3, S8 |
| Read-only semantic graph/diagram | Interpret a distribution or line | Selection/structured evidence | A for structured response | Graph/diagram view from semantic model | Value table/object exploration, descriptions, zoom/contrast | Authored asset or generated model | Exercise Format v1 | Visual interpretation is central even before graph construction | S7, S11 |
| Linked representation binding | Fraction bar linked to number line | Two response artifacts over shared state | A: cross-view mathematical equality | Two registered semantic views | Each view operable; synchronization announced; equal objective non-visually | Fixed pilot then named generator | Exercise Format v1 | Prevents the format from freezing around one prompt and one decorative visualization | S3 |
| Matching with stable associations | Equation ↔ table ↔ graph | ID mapping | A: mapping with partial criteria | Often graphs/tables | Select-then-associate alternative, relationship review | Derived views from a shared generated model | Exercise Format v1 | Tests multi-representation identity without relying on visual similarity | S7 |
| Authored misconception and error patterns | First invalid distribution step | Step/reason ID; optional repair | A for pattern, B for symbolic repair | None | Semantic derivation list and accessible highlighting | Curated patterns or named generator | Exercise Format v1 | Enables targeted feedback without claiming a learner diagnosis | S15 |
| Review-needed written response | Explain a parity claim | Prose plus optional structured claims | D: rubric/educator review | None or supporting diagram | Accessible editor, language/direction, non-handwriting path | Fixed task/rubric | Exercise Format v1 | The format must preserve valuable ungraded mathematics instead of excluding it | S16, S11 |
| Validator compatibility and typed partial results | Mixed automatic/reviewed modeling task | Criterion result structure | A–D explicitly declared | None | Feedback state announced and not only color-coded | Validator named/versioned with definition | Exercise Format v1 | Required for trustworthy replay and future evidence interpretation | S11, S14 |
| Advanced symbolic equivalence | Accept `7x-3` and `-3+7x` | Expression/equation/set tree | B: deterministic CAS/domain logic | None | Accessible editor remains required | Named tested validator | Later | Syntax can stabilize before a reliable equivalence scope and assumptions model | S5, S14 |
| Direct manipulation | Operate an equation balance or fraction bars | Semantic state/actions | A/B invariant and goal constraints | Manipulative component | Full keyboard/non-drag path, state announcements, reduced motion | Named model/generator | Later | High pedagogical value but component, evidence, and access contracts need focused pilots | S6 |
| Graph construction and equivalence | Draw a function over a domain | Graph object model | B: feature/domain equivalence | Interactive graph | Object list/editors, audio/table exploration, zoom/pan controls | Named generator/validator | Later | General graph equality and accessible construction are substantial | S9 analogue; capability stressed by S7/S8 |
| Geometry construction and measurement | Construct an angle bisector | Geometry object graph and quantities | B: relationship constraints/tolerance | Geometry canvas | Command/object-tree path; non-visual equivalence needs user research | Fixed config then named generator | Later | Pixel comparison and generic drag/drop are unacceptable | S10 |
| Seeded simulations | Compare 20 and 200 coin tosses | Controls, prediction, event summary, conclusion | A for structure; C/D for explanation | Simulation and chart/table | Step/pause/reset, reduced motion, text/data alternative | Named seeded state machine | Later | Requires a second deterministic event stream and careful evidence boundaries | S13 |
| Open investigation checkpoints | Generalize a tile pattern | Construction, table, expression, prose | A/B checkpoints plus D review | Linked manipulative/table views | Multiple expression paths that preserve objective | Fixed or named pattern model | Later | Valuable but should follow bounded composition and linked-view experience | S17 |
| General natural-language or AI grading | Score any explanation or proof | Unrestricted prose | E: deliberately unsupported | None | Bias, language, contestability, privacy | None adopted | Research required / unsupported | Trust and validity are not established | S16 shows review path |
| Arbitrary handwriting/freehand proof recognition | Grade a handwritten proof | Stroke/image artifact | E, possibly D human review | Drawing/ink canvas | Motor, vision, device, and recognition barriers | None adopted | Research required / unsupported | Capturing ink may be useful later; automatic mathematical interpretation is not a current capability | S16 alternative deliberately omitted |
| Time as default performance evidence | Reward fast completion | Timer telemetry | Unsupported as universal scoring | Timer UI | Creates access and anxiety barriers; pause/background ambiguity | N/A | Deliberately unsupported | Timing is only valid when explicitly part of the construct | S1 guardrail |
| General workflow logic in definitions | Encode tutoring loops and prerequisite routing in JSON | Arbitrary conditions/branches | Unsafe and untestable as content | Any | Complex unpredictable navigation harms access | Would be an embedded programming language | Deliberately unsupported | Session adaptation belongs to the learning engine; code owns nontrivial logic | S6 hints and return path |

### Recommended initial slice

The first implementation should prove four end-to-end response families: choice, scalar/quantity, simple ordering/classification, and one discrete spatial interaction (number line or coordinate point). It should also prove structured content, deterministic generation, authored hints, typed validation results, and evidence provenance. Format v1 should cover bounded parts, table responses, symbolic syntax extension points, linked representation bindings, review-needed responses, and semantic graph presentation without requiring complete implementations of advanced equivalence, geometry, graph construction, or simulations.

## 14. Risks and failure modes

| Risk | Failure mode | Required mitigation |
| --- | --- | --- |
| **Dimension collapse** | `answer.type` or a component name implicitly decides activity, validation, evidence, and accessibility | Typed independent contracts and compatibility checks; scenario-based format tests |
| **Text-field architecture** | Every activity is distorted into typed text because it is easy to serialize | Deliver at least ordering/classification and one spatial response in the first slice; keep response artifacts extensible |
| **Component-driven mathematics** | React state or screen coordinates become mathematical truth | Components emit semantic artifacts; validators and generators live in tested domain code |
| **JSON as a programming language** | Templates gain expressions, loops, branching, or validation scripts | Keep bounded data structures; name discoverable, versioned code extensions |
| **False determinism** | The same ID/version/seed changes after generator, RNG, asset, or locale changes | Define a compatibility envelope, capture provenance, and test replay across releases |
| **Invalid random instances** | Division by zero, ambiguity, duplicate answers, degenerate geometry, or misleading views reach learners | Parameter schemas, invariant/property tests, golden seeds, boundary suites, preview sampling, and generator-validator agreement tests |
| **Hint drift** | Hint, diagram, worked steps, and answer derive values independently | Generate all dependent material from one instance/solution model |
| **String equality as mathematics** | Equivalent fractions, expressions, equations, sets, or graphs are rejected; malformed forms are accepted | Parse to typed artifacts and use response-specific deterministic validators |
| **Universal tolerance** | One epsilon accepts mathematically wrong answers or rejects reasonable measurements | Declare task-specific absolute/relative/rounding/measurement semantics |
| **Pixel validation** | A graph or construction that looks close passes despite wrong mathematics—or an equivalent result fails | Validate functions, coordinates, objects, and constraints over declared domains |
| **Overclaiming misconceptions** | One distractor labels a learner or routes them into unnecessary remediation | Emit corroboratable misconception candidates with provenance; leave inference to the learning engine |
| **Binary evidence loss** | Partial work, invalid input, reviewed work, and support context all become wrong | Typed criteria and statuses; preserve review-needed and partial outcomes |
| **Accessibility as metadata only** | An alt-text field exists but the interaction remains impossible without sight or dragging | Require an objective-preserving operation contract and assistive-technology testing per family |
| **Accommodation penalty** | Keyboard, screen reader, reduced motion, locale, or extra time is interpreted as lower mastery | Separate access path from construct-changing variants; prohibit negative use of accommodation signals |
| **Localization changes mathematics** | Decimal commas, RTL layout, currency, notation, or pluralization alter parsing or generated values | Canonical mathematical instance plus locale-aware rendering/parsing and complete-message localization |
| **Interaction bias** | A learner is assessed on unfamiliar UI mechanics rather than mathematics | Consistent controls, practice/sandbox states, undo, explicit instructions, and evidence metadata for construct-relevant variants |
| **Premature complexity** | v1 attempts to stabilize geometry, simulations, proof grading, and all composition cases | Implement the phased slice, reserve typed extensions, and use later pilots to design later contracts |
| **Excluding rich mathematics** | Only auto-gradable tasks are representable | Preserve rubric/review-needed responses without pretending to score them automatically |
| **Workflow leakage** | Definitions dictate prerequisite routing, retry loops, or session recommendations | Definitions expose affordances and metadata; the learning engine owns orchestration |
| **Privacy-heavy telemetry** | Raw action streams, prose, disability inferences, and timings are retained without a learning need | Minimize evidence, document purpose, restrict raw logs, and leave persistence policy open |

## 15. Decisions

The durable decisions below apply to Exercise Format v1 design. The central separation decision is also recorded in [ADR 0005](decisions/0005-separate-exercise-capability-dimensions.md).

| Decision | Status and basis |
| --- | --- |
| Model pedagogical purpose, mathematical activity, representation, interaction, response artifact, validation, generation, composition, support, accessibility, and session orchestration as separate dimensions. | **Settled here;** required to answer the capability question without control-driven design. |
| Preserve the existing separation between definition, generated instance, attempt, and mastery evidence. | **Existing direction, reaffirmed.** |
| Store and exchange semantic mathematical response artifacts; never make DOM events, pointer paths, pixels, or framework component state the answer contract. | **Settled here.** |
| Keep composition bounded and declarative; keep adaptive session routing and nontrivial mathematical logic out of JSON. | **Existing boundary, made concrete here.** |
| Support fixed authored content as well as parameterized and named deterministic generation. | **Settled here;** mandatory generators would exclude important tasks. |
| Preserve `(definition ID, definition version, seed)` as conceptual replay identity and add an explicit compatibility/provenance design before v1. | **Existing decision plus v1 requirement.** |
| Separate parsing, validation, structured validation result, and later evidence interpretation. | **Settled here.** |
| Permit valuable `review-needed` exercise responses; automatic grading is not a requirement for representability. | **Settled here.** |
| Treat accessibility as a capability contract for every representation and interaction. Equivalent access must preserve the mathematical objective. | **Existing principle, made enforceable here.** |
| Do not use accessibility accommodations or ordinary time-on-task as negative mastery evidence. | **Settled here, consistent with the learning model.** |
| Keep IDs and canonical mathematics language-neutral; localization changes equivalent presentation and parsing, not ambient generation. | **Existing direction, made concrete here.** |
| Do not establish AI grading. | **Existing unresolved boundary; explicitly not adopted.** |

### Proposed directions, not decisions

- Use controlled semantic registries for representations, interactions, generators, validators, feedback codes, rubrics, and misconception IDs.
- Use typed content blocks and data bindings rather than one mixed template string.
- Represent bounded composition as an acyclic part graph or an equivalently constrained structure.
- Return criterion-level validation results and normalized artifacts where safe.
- Include evidence claims and purpose eligibility in definitions, while recording active purpose on delivered attempts.
- Pilot linked fractions/number-line representations before general manipulatives.
- Use accessible object lists, property editors, tables, and audio as candidate alternatives for spatial systems; validate these designs with learners rather than assuming equivalence.

These directions should guide v1 prototypes, but their exact field names and interfaces are intentionally not fixed by this document.

## 16. Open questions

### Format and compatibility

- How are generator, validator, interaction, representation, and asset compatibility versions resolved from a definition version?
- Is the seed an integer, byte sequence, or opaque versioned value, and which deterministic random algorithm is used?
- What structured content format best supports localization, semantic mathematics, generated bindings, and pull-request readability?
- How should controlled vocabularies evolve without turning every new mathematical activity into a schema release?
- What is the smallest bounded composition model that supports shared stimuli, dependent parts, and faded scaffolds without becoming a workflow engine?

### Mathematics and validation

- What expression grammar, assumptions, domains, and equivalence scope should the first symbolic validator support?
- How should quantities, units, significant figures, and measurement uncertainty be represented?
- Which graph features and domains define equivalence for early graph-construction tasks?
- What geometry kernel and tolerance model could support reliable construction validation?
- How are alternate valid derivations recognized without accepting steps that are locally equivalent but pedagogically invalid for the stated objective?

### Evidence and learning

- How are evidence claims authored when one task involves several skills, and how are construct-relevant secondary skills distinguished from prerequisites?
- Which task features are stable authored metadata and which require empirical calibration?
- How long should raw response artifacts, written explanations, or simulation event traces be retained, if at all?
- How is educator review represented and reconciled without turning this document into a grading workflow specification?
- How should learners see, contest, or correct misconception-related inferences in a future learning engine?

### Accessibility and internationalization

- Which math editor and semantic notation interchange best meet keyboard, speech, braille, localization, and mobile needs?
- Which non-visual designs preserve the objective for graph exploration, geometry construction, spatial transformations, and measurement?
- When does changing the response mode change the construct rather than provide access, and how should authors declare that distinction?
- Which notation conventions need explicit audience profiles beyond ordinary locale data?
- What automated checks can catch inaccessible authored alternatives without creating false confidence in untested interactions?

### Authoring and governance

- Who owns registries, canonical activity terms, misconception IDs, evidence claims, and generator parameter schemas?
- What preview and seed-review volume is proportionate for each generator risk class?
- When should a content definition use a new named extension rather than a more general existing capability?
- What review roles are required before a definition or generator is considered trustworthy?

## 17. Recommendations for Exercise Format v1

### Findings about the exploratory `0.1` schema

The current [`exercise.schema.json`](../../schemas/exercise.schema.json) is a useful conversation aid but cannot represent the capability model:

| `0.1` limitation | Consequence |
| --- | --- |
| `generator` and `parameters` are required | Fixed authored exercises and authored asset selection have no natural representation. |
| Exactly one `skill` is required and no evidence claim exists | Multi-skill tasks, prerequisites, and the intended observable are conflated or lost. |
| `difficulty` is one unconstrained string | Different sources of challenge and uncalibrated versus calibrated claims cannot be distinguished. |
| `question.template` is one string with an undocumented placeholder convention | Mixed semantic content, safe generated bindings, localization, RTL text, tables, assets, and multiple representations cannot be modeled reliably. |
| `answer.type` is the only answer contract | Interaction, response artifact, parser, mathematical validator, constraints, partial criteria, and accessible operation are conflated. |
| `visualization` is optional and detached | It cannot declare read-only/editable/derived role, bind to generated state, link representations, or return a response. |
| There is no composition | Shared stimuli, related parts, dependent reveal, multi-step responses, and mixed auto/review outcomes are unavailable. |
| There are no hints, explanations, feedback codes, or misconception references | Support cannot be authored or guaranteed to match the generated solution. |
| There is no purpose or active delivery context | Exploration, retrieval, diagnosis, and mastery-check use cannot be interpreted honestly. |
| There is no accessibility or localization contract | An interaction name can appear without an objective-preserving access path or translatable content structure. |
| Generator parameters are untyped and semantic references are unchecked | Invalid definitions are schema-valid; contributor discovery and previews are weak. |
| Definition version is the only compatibility signal | Generator, validator, RNG, component, and asset evolution can silently break replay. |
| Only a Boolean-like future is implied by the shape | Partial, invalid, alternate-path, and review-needed outcomes have no home. |

The illustrative linear-equation definition is especially revealing: `answer.type: "number"` can capture only the endpoint, while `visualization.type: "equation-balance"` cannot say whether the balance presents, teaches, or receives the answer; how it binds to the generated equation; which balance operations are valid; or how a keyboard/screen-reader learner performs the same mathematics.

**Recommendation:** do not patch `0.1` incrementally in this task. These limitations require a deliberate v1 design using representative scenarios and typed extension contracts. A small schema edit would create false stability without resolving the model. The schema and example therefore remain unchanged and valid as explicitly exploratory artifacts.

### Minimum semantic layers

Exercise Format v1 should make the following layers explicit without trying to solve all later capabilities:

1. **Identity and references** — schema version, language-neutral definition ID/version, target skill references, and stable evidence-claim references or equivalent structured intent.
2. **Purpose eligibility and task features** — supported pedagogical uses and authored construct-relevant features; active delivery purpose remains instance/session context.
3. **Generation** — a tagged choice among fixed authored instance data, bounded parameterization, and a named deterministic generator with a generator-specific parameter schema.
4. **Semantic content** — localizable content blocks for prose, mathematics, tables, assets, and named representations, with safe typed bindings to instance data.
5. **Composition** — a small bounded part structure with stable part IDs, shared stimuli, declared dependencies/reveal policy, and no executable workflow language.
6. **Interaction** — named semantic interaction plus typed configuration and declared response-artifact schema; presentation and operation stay framework-neutral.
7. **Validation** — named or declarative validator compatible with the response artifact, typed criteria, private validation data, and explicit automatic/review-needed class.
8. **Support** — stable hints, explanations, feedback codes, misconception candidates, and prerequisite relevance, resolved from the same instance model.
9. **Representation bindings** — read-only/editable/derived roles, shared state bindings, and controlled component capabilities.
10. **Accessibility and localization requirements** — language/direction, semantic descriptions, objective-preserving alternative interaction configuration, and capability checks rather than a generic alt-text escape hatch.

Field names should be chosen during v1 schema design. The format should use discriminated/typed alternatives rather than bags of `additionalProperties`, while leaving a versioned registry path for named extensions.

### Instance contract

A generated instance should contain:

- replay provenance and resolved extension identities;
- canonical mathematical state and stable object IDs;
- localized or localizable semantic presentation data without private answer leakage;
- resolved representation bindings and interaction configurations;
- bounded part state and response schemas;
- private validation data and solution structure where needed;
- resolved hints/explanations guaranteed to match the instance; and
- accessibility-relevant semantic descriptions and equivalent-operation data.

The boundary between server/private and learner-visible instance data must be explicit. Correct answers, validator secrets, or future hint content should not be exposed merely because one JSON object is convenient.

### Attempt and evidence contract

An attempt should preserve:

- the instance identity;
- typed response artifacts and meaningful revisions/submissions;
- active purpose and construct-relevant response variant;
- support requested or revealed;
- typed validation result and review status;
- criterion and misconception-candidate signals; and
- minimal provenance needed by a future evidence consumer.

Mastery updates, recommendation decisions, prerequisite routing, session history, and accessibility diagnoses do not belong in the exercise definition or validator result.

### Extension contracts

Before v1 is called stable, at least one representative named generator, validator, representation, and non-text interaction should prove:

- discovery and documentation;
- parameter/configuration schema validation;
- compatibility declaration;
- deterministic replay;
- semantic response and validation boundaries;
- localized preview;
- keyboard, screen-reader, touch, and reduced-motion behavior as relevant; and
- end-to-end evidence output.

The first contracts should be narrow. A `coordinate-point` interaction is preferable to a prematurely universal `geometry-canvas`; exact rational validation is preferable to an undefined `math-equivalent` validator.

### Format v1 acceptance scenarios

Use at least S1, S2, S3, S4, S8, S11, S12, S14, S15, and S16 as design fixtures. Together they require:

- generated and fixed content;
- choice, scalar/quantity, ordering, table, spatial, symbolic-extension, and written response artifacts;
- structured notation, tables, graphs/diagrams, and linked representations;
- one- and multi-part composition;
- exact, tolerance, partial, advanced-extension, and review-needed validation;
- authored and generated support;
- misconception candidates and typed evidence; and
- concrete accessibility and localization behavior.

S5–S7, S9, S10, S13, and S17 remain pressure tests for extension boundaries. Format v1 should not claim their complete advanced validators or components.

### Recommended next design sequence

1. Write v1 use cases and expected instance/attempt artifacts for the acceptance scenarios.
2. Define the minimal response-artifact and validation-result type system before choosing author-facing field names.
3. Define reproducibility and extension compatibility/versioning.
4. Prototype schema alternatives with fixed and generated, single- and multi-part, automatic and review-needed examples.
5. Validate the schema through authoring previews and semantic checks, not JSON syntax alone.
6. Implement only the recommended initial slice, then use observed constraints to extend later interaction families.

This sequence supplies actionable input to Exercise Format v1 while respecting the repository's foundation-stage boundary: no backend, frontend, generator, validator, mastery algorithm, or authoring application is introduced by this model.
