import assert from "node:assert/strict";
import { cp, mkdir, mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repoRoot = fileURLToPath(new URL("../", import.meta.url));
const validator = path.join(repoRoot, "tools/validate-content.mjs");
const exercisePath = "content/exercises/examples/linear-equation-basic.json";
const json = async (rel) => JSON.parse(await readFile(path.join(repoRoot, rel), "utf8"));
const baseExercise = await json(exercisePath);
const baseWithin10 = await json("content/exercises/numbers/addition-within-10.json");
const baseCrossingTen = await json("content/exercises/numbers/addition-crossing-ten.json");
const baseFourPlusFour = await json("content/exercises/numbers/addition-4-plus-4.json");
const baseBonds = await json("content/skills/numbers.number-bonds-to-ten.json");
const baseAddition = await json("content/skills/numbers.addition-within-20.json");
const ADD_CODES = baseWithin10.misconceptionCodes;

// Each test invokes the real CLI against an isolated repository-shaped fixture that holds the
// schemas, the five registries, one 0.1 skill and exercise. Helpers add pilot content on demand.
async function fixture(t) {
  const tempRoot = await realpath(os.tmpdir());
  const root = await mkdtemp(path.join(tempRoot, "mathkx-validator-"));
  t.after(async () => {
    const resolved = await realpath(root);
    assert.equal(path.dirname(resolved), tempRoot);
    assert.ok(path.basename(resolved).startsWith("mathkx-validator-"));
    await rm(resolved, { recursive: true, force: true });
  });
  await cp(path.join(repoRoot, "schemas"), path.join(root, "schemas"), { recursive: true });
  await cp(path.join(repoRoot, "content/registry"), path.join(root, "content/registry"), { recursive: true });
  async function write(relativePath, value) {
    const target = path.join(root, relativePath);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, JSON.stringify(value));
  }
  async function writeText(relativePath, text) {
    const target = path.join(root, relativePath);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, text);
  }
  async function skill(id, prerequisites = [], filename = `${id}.json`, extra = {}) {
    await write(`content/skills/${filename}`, {
      $schema: "../../schemas/skill.schema.json", schemaVersion: "0.1", id, prerequisites, ...extra,
    });
  }
  async function registry(kind, mutate) {
    const file = `content/registry/${kind}.json`;
    const data = JSON.parse(await readFile(path.join(root, file), "utf8"));
    mutate(data);
    await write(file, data);
  }
  async function definition(filename, data) {
    await write(`content/exercises/numbers/${filename}.json`, data);
  }
  async function pilot({ ladder = true } = {}) {
    await write("content/skills/numbers.number-bonds-to-ten.json", baseBonds);
    await write("content/skills/numbers.addition-within-20.json", ladder ? baseAddition : { ...baseAddition, ladder: undefined });
    await definition("addition-within-10", baseWithin10);
    await definition("addition-crossing-ten", baseCrossingTen);
    await definition("addition-4-plus-4", baseFourPlusFour);
  }
  async function lesson(id, { json: meta = {}, nb = NB, en = EN, files = {} } = {}) {
    const folder = `content/lessons/${id}`;
    await write(`${folder}/lesson.json`, { ...baseLesson(id), ...meta });
    if (nb !== null) await writeText(`${folder}/nb.md`, nb);
    if (en !== null) await writeText(`${folder}/en.md`, en);
    await writeText(`${folder}/assets/ten-frame-3-7.svg`, "<svg xmlns='http://www.w3.org/2000/svg'/>");
    for (const [name, content] of Object.entries(files)) await writeText(`${folder}/${name}`, content);
  }
  await skill("algebra.linear-equations");
  await write(exercisePath, baseExercise);
  return {
    root, write, writeText, skill, registry, definition, pilot, lesson,
    run() {
      const result = spawnSync(process.execPath, [validator, "--root", root], { encoding: "utf8", timeout: 30000 });
      assert.ifError(result.error);
      return { status: result.status, output: result.stdout + result.stderr };
    },
  };
}

function expectFailure(result, ...patterns) {
  assert.equal(result.status, 1, result.output);
  for (const pattern of patterns) assert.match(result.output, pattern);
  assert.doesNotMatch(result.output, /Validation tooling error/);
}
function expectPass(result, ...patterns) {
  assert.equal(result.status, 0, result.output);
  for (const pattern of patterns) assert.match(result.output, pattern);
}

const baseLesson = (id) => ({
  $schema: "../../../schemas/lesson.schema.json", schemaVersion: "0.1-pilot", id, version: 1, status: "pilot",
  skills: ["numbers.number-bonds-to-ten", "numbers.addition-within-20"],
  practice: [{ definition: "numbers.addition.within-10", version: 1 }],
  visuals: ["ten-frame-explorer", "make-ten"],
  translations: { nb: "nb.md", en: "en.md" },
});

const NB = `---
title: Tiervenner
objective: Du lærer tiervennene.
---

## Hva er tiervenner? {#what}

Tre og sju er tiervenner: $3 + 7 = 10$.

| Par | Regnestykke |
| --- | --- |
| 3 og 7 | $3 + 7 = 10$ |

![En tierramme.](assets/ten-frame-3-7.svg)

:::visual{type="ten-frame-explorer" start="3"}
:::

## Hvorfor? {#why}

:::example{title="Eksempel: 8 + 5" id="example"}
Først til ti: $8 + 5 = 13$.
:::

:::visual{type="make-ten" a="8" b="5"}
:::

## Øv {#practice}

:::practice{definition="numbers.addition.within-10" version="1"}
:::
`;

const EN = `---
title: Number bonds to ten
objective: You learn the number bonds to ten.
---

## What are number bonds? {#what}

Three and seven are a bond: $3 + 7 = 10$.

| Pair | Sum |
| --- | --- |
| 3 and 7 | $3 + 7 = 10$ |

![A ten-frame.](assets/ten-frame-3-7.svg)

:::visual{type="ten-frame-explorer" start="3"}
:::

## Why? {#why}

:::example{title="Example: 8 + 5" id="example"}
Make ten first: $8 + 5 = 13$.
:::

:::visual{type="make-ten" a="8" b="5"}
:::

## Practise {#practice}

:::practice{definition="numbers.addition.within-10" version="1"}
:::
`;

// ---------------------------------------------------------------------------------------------
// Existing behaviour (0.1 skills and exercises)

test("accepts a valid definition and referenced skill", async (t) => {
  const f = await fixture(t);
  expectPass(f.run(), /1 skill\(s\), 0 lesson\(s\), 1 definition\(s\), 5 registries/);
});

for (const changedParameters of [false, true]) {
  test(`rejects duplicate exercise ID/version with ${changedParameters ? "different" : "identical"} content`, async (t) => {
    const f = await fixture(t);
    const copy = structuredClone(baseExercise);
    if (changedParameters) copy.parameters.solutionMax = 20;
    await f.write("content/exercises/examples/duplicate.json", copy);
    const result = f.run();
    expectFailure(result, /duplicate exercise identity algebra\.linear-equations\.basic version 1/);
    assert.match(result.output, /content\/exercises\/examples\/duplicate\.json/);
    assert.match(result.output, /content\/exercises\/examples\/linear-equation-basic\.json/);
  });
}

test("allows distinct versions of the same exercise ID", async (t) => {
  const f = await fixture(t);
  await f.write("content/exercises/examples/version-2.json", { ...baseExercise, version: 2 });
  expectPass(f.run(), /2 definition\(s\)/);
});

for (const value of [null, [], "text", 7, true]) {
  test(`reports ${JSON.stringify(value)} as invalid content and continues checking other files`, async (t) => {
    const f = await fixture(t);
    await f.write("content/00-invalid.json", value);
    await f.write(exercisePath, { ...baseExercise, skill: "numbers.missing" });
    const result = f.run();
    expectFailure(result, /content\/00-invalid\.json\s+content must be a JSON object/);
    assert.match(result.output, /skill numbers\.missing is not a defined skill/);
  });
}

test("rejects duplicate skill IDs and names the first file with a repository-relative path", async (t) => {
  const f = await fixture(t);
  await f.skill("algebra.linear-equations", [], "duplicate.json");
  expectFailure(f.run(), /content\/skills\/duplicate\.json duplicate skill ID algebra\.linear-equations; also defined in content\/skills\/algebra\.linear-equations\.json/);
});

test("rejects missing prerequisites", async (t) => {
  const f = await fixture(t);
  await f.skill("algebra.linear-equations", ["numbers.missing"]);
  expectFailure(f.run(), /prerequisite numbers\.missing is not a defined skill/);
});

test("rejects a prerequisite cycle", async (t) => {
  const f = await fixture(t);
  await f.skill("algebra.linear-equations", ["numbers.integer-operations"]);
  await f.skill("numbers.integer-operations", ["numbers.powers"]);
  await f.skill("numbers.powers", ["algebra.linear-equations"]);
  expectFailure(f.run(), /prerequisite cycle:/);
});

test("rejects a self prerequisite", async (t) => {
  const f = await fixture(t);
  await f.skill("algebra.linear-equations", ["algebra.linear-equations"]);
  expectFailure(f.run(), /lists itself as a prerequisite/);
});

test("accepts a graph with a shared prerequisite", async (t) => {
  const f = await fixture(t);
  await f.skill("algebra.linear-equations", ["numbers.powers", "numbers.square-roots"]);
  await f.skill("numbers.powers", ["numbers.integer-operations"]);
  await f.skill("numbers.square-roots", ["numbers.integer-operations"]);
  await f.skill("numbers.integer-operations");
  expectPass(f.run());
});

test("reports schema violations", async (t) => {
  const f = await fixture(t);
  await f.write(exercisePath, { ...baseExercise, version: 0 });
  expectFailure(f.run(), /schema violation: \/version must be >= 1/);
});

test("reports malformed JSON", async (t) => {
  const f = await fixture(t);
  await writeFile(path.join(f.root, exercisePath), "{");
  expectFailure(f.run(), /invalid JSON:/);
});

test("requires a schema reference", async (t) => {
  const f = await fixture(t);
  await f.write("content/invalid.json", {});
  expectFailure(f.run(), /missing "\$schema"/);
});

test("rejects schema paths outside schemas", async (t) => {
  const f = await fixture(t);
  await f.write("content/invalid.json", { $schema: "../outside.json" });
  expectFailure(f.run(), /"\$schema" must point inside schemas/);
});

// ---------------------------------------------------------------------------------------------
// Discovery and registries (T012)

test("reports a file naming an unknown schema instead of skipping it", async (t) => {
  const f = await fixture(t);
  await f.write("content/exercises/other.json", { $schema: "../../schemas/other.schema.json" });
  expectFailure(f.run(), /content\/exercises\/other\.json unknown schema other\.schema\.json \(one of: skill\.schema\.json/);
});

test("still checks underscore-prefixed paths outside content/_templates/", async (t) => {
  const f = await fixture(t);
  await f.writeText("content/exercises/_draft/bad.json", "{");
  expectFailure(f.run(), /content\/exercises\/_draft\/bad\.json invalid JSON/);
});

test("skips the lesson template folder", async (t) => {
  const f = await fixture(t);
  await f.write("content/_templates/lesson/lesson.json", { id: "<lesson-id>", note: "placeholder" });
  expectPass(f.run());
});

test("rejects a duplicate registry name", async (t) => {
  const f = await fixture(t);
  await f.registry("generators", (r) => r.entries.push(structuredClone(r.entries[0])));
  expectFailure(f.run(), /content\/registry\/generators\.json entries\[1\]: duplicate name addition-pair@1/);
});

test("rejects a misconception code naming an unknown validator", async (t) => {
  const f = await fixture(t);
  await f.registry("misconception-codes", (r) => { r.entries[0].validator = "nope"; });
  expectFailure(f.run(), /misconception-codes\.json entries\[0\]\.validator: nope is not a registered validator \(one of: integer-answer\)/);
});

test("rejects a visual component naming an unknown representation", async (t) => {
  const f = await fixture(t);
  await f.registry("visual-components", (r) => { r.entries[1].representation = "nope"; });
  expectFailure(f.run(), /visual-components\.json entries\[1\]\.representation: nope is not a registered representation/);
});

test("rejects a generator relation outside the implemented set", async (t) => {
  const f = await fixture(t);
  await f.registry("generators", (r) => { r.entries[0].relation = "sum-of-two-operand"; });
  expectFailure(f.run(), /generators\.json schema violation: .*relation must be equal to one of the allowed values/);
});

// ---------------------------------------------------------------------------------------------
// Pilot definitions (T013, T014)

const generated = (overrides = {}, parameters = {}) => ({
  ...baseWithin10, ...overrides,
  generator: { ...baseWithin10.generator, ...overrides.generator, parameters: { ...baseWithin10.generator.parameters, ...parameters } },
});

test("accepts the pilot definitions, skills, and ladder", async (t) => {
  const f = await fixture(t);
  await f.pilot();
  expectPass(f.run(), /3 skill\(s\), 0 lesson\(s\), 4 definition\(s\), 5 registries/);
});

test("rejects an unregistered generator version", async (t) => {
  const f = await fixture(t);
  await f.pilot();
  await f.definition("addition-within-10", generated({ generator: { version: 2 } }));
  expectFailure(f.run(), /addition-within-10\.json generator: addition-pair@2 is not registered \(one of: addition-pair@1\)/);
});

test("rejects a parameter outside the generator's domain", async (t) => {
  const f = await fixture(t);
  await f.pilot();
  await f.definition("addition-within-10", generated({}, { operand: { min: 1, max: 25 } }));
  expectFailure(f.run(), /generator\.parameters\.operand: max 25 is outside the generator's domain 0–20/);
});

test("rejects min greater than max", async (t) => {
  const f = await fixture(t);
  await f.pilot();
  await f.definition("addition-within-10", generated({}, { operand: { min: 9, max: 1 } }));
  expectFailure(f.run(), /generator\.parameters\.operand: min 9 is greater than max 1/);
});

test("rejects a parameter the generator does not declare", async (t) => {
  const f = await fixture(t);
  await f.pilot();
  await f.definition("addition-within-10", generated({}, { foo: { min: 1, max: 2 } }));
  expectFailure(f.run(), /generator\.parameters\.foo: not a parameter of addition-pair@1 \(one of: operand, sum\)/);
});

test("rejects a constraint the generator does not declare", async (t) => {
  const f = await fixture(t);
  await f.pilot();
  await f.definition("addition-within-10", generated({ generator: { constraints: ["integer-solution"] } }));
  expectFailure(f.run(), /generator\.constraints\[0\]: integer-solution is not a constraint of addition-pair@1 \(addition-pair@1 declares none\)/);
});

test("rejects bounds that admit no operand pair", async (t) => {
  const f = await fixture(t);
  await f.pilot();
  await f.definition("addition-crossing-ten", { ...baseCrossingTen, generator: { ...baseCrossingTen.generator, parameters: { operand: { min: 1, max: 2 }, sum: { min: 11, max: 18 } } } });
  expectFailure(f.run(), /addition-crossing-ten\.json generator\.parameters: no operand pair within 1–2 has a sum within 11–18/);
});

test("rejects a generated definition with an instance and a fixed one with a generator", async (t) => {
  const f = await fixture(t);
  await f.pilot();
  await f.definition("addition-within-10", { ...baseWithin10, instance: baseFourPlusFour.instance });
  await f.definition("addition-4-plus-4", { ...baseFourPlusFour, generator: baseWithin10.generator });
  expectFailure(f.run(), /addition-within-10\.json schema violation: .*\/instance/, /addition-4-plus-4\.json schema violation: .*\/generator/);
});

test("rejects a pilot definition that reuses a 0.1 identity", async (t) => {
  const f = await fixture(t);
  await f.pilot();
  await f.definition("clash", { ...baseWithin10, id: "algebra.linear-equations.basic", skill: "algebra.linear-equations" });
  expectFailure(f.run(), /duplicate exercise identity algebra\.linear-equations\.basic version 1/);
});

test("hints at the numbers.* registry for a retired arithmetic.* skill ID", async (t) => {
  const f = await fixture(t);
  await f.pilot();
  await f.definition("addition-within-10", { ...baseWithin10, skill: "arithmetic.addition" });
  expectFailure(f.run(), /skill arithmetic\.addition is not a defined skill \(the registry uses numbers\.\*\)/);
});

test("rejects a representation whose range does not cover the definition", async (t) => {
  const f = await fixture(t);
  await f.pilot();
  await f.definition("addition-crossing-ten", { ...baseCrossingTen, generator: { ...baseCrossingTen.generator, parameters: { operand: { min: 2, max: 9 }, sum: { min: 11, max: 20 } } } });
  expectFailure(f.run(), /representations\.help\[0\]: make-ten supports sum 11–18 but the definition allows sum 11–20/);
});

test("checks fixed tasks against representation ranges through the quantity model", async (t) => {
  const f = await fixture(t);
  await f.pilot();
  await f.definition("nine-nine", { ...baseFourPlusFour, id: "numbers.addition.nine-plus-nine", instance: { prompt: { a: 9, b: 9 }, validation: { answer: 18 } } });
  await f.definition("two-two", { ...baseFourPlusFour, id: "numbers.addition.two-plus-two", instance: { prompt: { a: 2, b: 2 }, validation: { answer: 4 } }, representations: { help: ["make-ten"], explanation: ["make-ten"] } });
  expectFailure(f.run(),
    /nine-nine\.json representations\.help\[0\]: groups supports sum 2–10 but the task has sum 18/,
    /two-two\.json representations\.help\[0\]: make-ten supports sum 11–18 but the task has sum 4/);
});

test("rejects unregistered representations and validators", async (t) => {
  const f = await fixture(t);
  await f.pilot();
  await f.definition("addition-within-10", { ...baseWithin10, representations: { help: ["nope"], explanation: ["groups"] }, validator: { name: "nonexistent", version: 1 } });
  expectFailure(f.run(),
    /representations\.help\[0\]: nope is not a registered representation \(one of: groups, make-ten, ten-frame-explorer\)/,
    /validator: nonexistent@1 is not registered \(one of: integer-answer@1\)/);
});

test("rejects fixed validation data that does not fit the validator's artifact", async (t) => {
  const f = await fixture(t);
  await f.pilot();
  await f.definition("addition-4-plus-4", { ...baseFourPlusFour, instance: { prompt: { a: 4, b: 4 }, validation: { answer: "eight" } } });
  expectFailure(f.run(), /instance\.validation\.answer: expected integer for validator integer-answer@1/);
});

test("rejects misconception codes that are unregistered or not emitted by the validator", async (t) => {
  const f = await fixture(t);
  await f.pilot();
  await f.registry("misconception-codes", (r) => r.entries.push({ code: "add.extra", validator: "integer-answer" }));
  await f.definition("addition-within-10", { ...baseWithin10, misconceptionCodes: ["add.nope", "add.extra"] });
  expectFailure(f.run(),
    /misconceptionCodes\[0\]: add\.nope is not a registered misconception code/,
    /misconceptionCodes\[1\]: add\.extra is not emitted by validator integer-answer@1/);
});

// ---------------------------------------------------------------------------------------------
// Lessons (T019, T020, T021)

test("accepts a valid lesson pair", async (t) => {
  const f = await fixture(t);
  await f.pilot();
  await f.lesson("my-lesson");
  expectPass(f.run(), /1 lesson\(s\)/);
});

test("rejects a lesson whose folder name differs from its id", async (t) => {
  const f = await fixture(t);
  await f.pilot();
  await f.lesson("my-lessons", { json: { id: "my-lesson" } });
  expectFailure(f.run(), /my-lessons\/lesson\.json id: my-lesson does not equal the folder name my-lessons/);
});

test("rejects a missing translation file and a released lesson without it", async (t) => {
  const f = await fixture(t);
  await f.pilot();
  await f.lesson("my-lesson", { en: null, json: { status: "released" } });
  expectFailure(f.run(), /lesson\.json translations\.en: en\.md does not exist in the lesson folder/, /lesson\.json status: released requires both translations/);
});

test("rejects translations that alias one file", async (t) => {
  const f = await fixture(t);
  await f.pilot();
  await f.lesson("my-lesson", { json: { translations: { nb: "en.md", en: "en.md" } } });
  expectFailure(f.run(), /schema violation: \/translations\/nb must be equal to constant/);
});

test("rejects unknown skills and lessons, and hints at numbers.* for retired IDs", async (t) => {
  const f = await fixture(t);
  await f.pilot();
  await f.lesson("my-lesson", { json: { skills: ["nope.skill", "arithmetic.addition"], relatedLessons: ["nope"] } });
  expectFailure(f.run(),
    /lesson\.json skills\[0\]: nope\.skill is not a defined skill/,
    /lesson\.json skills\[1\]: arithmetic\.addition is not a defined skill \(the registry uses numbers\.\*\)/,
    /lesson\.json relatedLessons\[0\]: nope is not a defined lesson \(a folder under content\/lessons\/\)/);
});

test("rejects a practice entry whose definition does not exist", async (t) => {
  const f = await fixture(t);
  await f.pilot();
  await f.lesson("my-lesson", { json: { practice: [{ definition: "numbers.addition.nope", version: 1 }] } });
  expectFailure(f.run(), /lesson\.json practice\[0\]: definition numbers\.addition\.nope@1 is not defined \(a file under content\/exercises\/\)/);
});

test("warns, without failing, when a practice definition serves a skill the lesson does not list", async (t) => {
  const f = await fixture(t);
  await f.pilot();
  await f.lesson("my-lesson", { json: { skills: ["numbers.number-bonds-to-ten"] } });
  expectPass(f.run(), /warning: content\/lessons\/my-lesson\/lesson\.json practice\[0\]: definition numbers\.addition\.within-10@1 serves skill numbers\.addition-within-20, which is not among this lesson's skills/, /1 warning\(s\)/);
});

test("rejects the prototype's check field with a hint", async (t) => {
  const f = await fixture(t);
  await f.pilot();
  await f.lesson("my-lesson", { json: { check: "check-addition" } });
  expectFailure(f.run(), /\(check\): check is not part of the pilot; self-checks are a later feature, remove this line/);
});

test("reports an extra language file", async (t) => {
  const f = await fixture(t);
  await f.pilot();
  await f.lesson("my-lesson", { files: { "sv.md": "---\ntitle: x\nobjective: y\n---\n" } });
  expectFailure(f.run(), /content\/lessons\/my-lesson\/sv\.md unsupported language file; the pilot ships nb\.md and en\.md only/);
});

test("checks front matter keys", async (t) => {
  const f = await fixture(t);
  await f.pilot();
  await f.lesson("my-lesson", { en: EN.replace("objective: You learn the number bonds to ten.", "author: me") });
  expectFailure(f.run(), /en\.md front matter: missing objective \(a non-empty string\)/, /en\.md front matter: unexpected key author \(title and objective only\)/);
});

test("requires anchors on section headings and rejects duplicates", async (t) => {
  const f = await fixture(t);
  await f.pilot();
  await f.lesson("my-lesson", { en: EN.replace("## Why? {#why}", "## Why?").replace("## Practise {#practice}", "## Practise {#what}") });
  expectFailure(f.run(), /en\.md:\d+ heading: "Why\?" has no \{#anchor\} \(## Title \{#anchor\}\)/, /en\.md:\d+ heading: anchor \{#what\} is used twice/);
});

test("reports an anchor present in one language only, naming both files", async (t) => {
  const f = await fixture(t);
  await f.pilot();
  await f.lesson("my-lesson", { en: EN.replace("## Why? {#why}", "## Why? {#reason}") });
  expectFailure(f.run(),
    /nb\.md:\d+ anchor: \{#why\} is missing in en\.md \(anchors must match across languages\)/,
    /en\.md:\d+ anchor: \{#reason\} is missing in nb\.md/);
});

test("rejects a table without a delimiter row", async (t) => {
  const f = await fixture(t);
  await f.pilot();
  await f.lesson("my-lesson", { en: EN.replace("| --- | --- |\n", "") });
  expectFailure(f.run(), /en\.md:\d+ table without a delimiter row \(a line like "\| --- \| --- \|" after the header\)/);
});

test("checks images and links", async (t) => {
  const f = await fixture(t);
  await f.pilot();
  await f.lesson("my-lesson", { en: EN.replace("![A ten-frame.](assets/ten-frame-3-7.svg)", "![](assets/ten-frame-3-7.svg)\n\n![Missing](assets/missing.svg)\n\nSee [the other lesson](other.md).") });
  expectFailure(f.run(),
    /en\.md:\d+ image: image assets\/ten-frame-3-7\.svg has no alternative text/,
    /en\.md:\d+ image: image assets\/missing\.svg does not exist/,
    /en\.md:\d+ link: link other\.md does not exist/);
});

test("rejects unknown directives, unregistered components, and unlisted visual types", async (t) => {
  const f = await fixture(t);
  await f.pilot();
  await f.lesson("my-lesson", {
    json: { visuals: ["ten-frame-explorer"] },
    en: EN.replace(':::visual{type="ten-frame-explorer" start="3"}\n:::', ':::note{kind="tip"}\nText\n:::\n\n:::visual{type="nope"}\n:::\n\n:::visual{type="ten-frame-explorer" start="3"}\n:::'),
  });
  expectFailure(f.run(),
    /en\.md:\d+ directive: unknown directive note \(one of: visual, example, practice\)/,
    /en\.md:\d+ directive visual\{type="nope"\}: unregistered visual component nope \(one of: ten-frame-explorer, groups, make-ten\)/,
    /en\.md:\d+ directive visual\{type="make-ten"\}: type make-ten is not listed in lesson\.json visuals/);
});

test("checks visual attributes: range, unknown names, and combined representation bounds", async (t) => {
  const f = await fixture(t);
  await f.pilot();
  await f.lesson("my-lesson", {
    json: { visuals: ["ten-frame-explorer", "make-ten", "groups"] },
    en: EN.replace('start="3"', 'start="11" foo="1"').replace('a="8" b="5"', 'a="2" b="2"') + '\n:::visual{type="groups" a="9" b="9"}\n:::\n',
  });
  expectFailure(f.run(),
    /directive visual\{type="ten-frame-explorer"\}: attribute start is 11, outside the declared range 0–10/,
    /directive visual\{type="ten-frame-explorer"\}: attribute foo is not declared for component ten-frame-explorer \(one of: start\)/,
    /directive visual\{type="make-ten"\}: make-ten supports sum 11–18 but a=2 b=2 gives sum 4/,
    /directive visual\{type="groups"\}: groups supports sum 2–10 but a=9 b=9 gives sum 18/);
});

test("requires practice directives and metadata entries to correspond", async (t) => {
  const f = await fixture(t);
  await f.pilot();
  await f.lesson("my-lesson", {
    json: { practice: [{ definition: "numbers.addition.within-10", version: 1 }, { definition: "numbers.addition.crossing-ten", version: 1 }] },
    en: EN.replace('definition="numbers.addition.within-10"', 'definition="numbers.addition.four-plus-four"'),
  });
  expectFailure(f.run(),
    /en\.md:\d+ directive practice\{definition="numbers\.addition\.four-plus-four" version="1"\}: numbers\.addition\.four-plus-four@1 has no entry in lesson\.json practice/,
    /lesson\.json practice\[1\]: definition numbers\.addition\.crossing-ten@1 has no :::practice directive in nb\.md/,
    /lesson\.json practice\[0\]: definition numbers\.addition\.within-10@1 has no :::practice directive in en\.md/);
});

test("requires an id and a title on examples", async (t) => {
  const f = await fixture(t);
  await f.pilot();
  await f.lesson("my-lesson", { en: EN.replace(':::example{title="Example: 8 + 5" id="example"}', ':::example{title=""}') });
  expectFailure(f.run(), /en\.md:\d+ directive example: example directive needs an id attribute/, /example directive needs a non-empty title/);
});

test("reports unsupported notation with its section and accepts decimal commas", async (t) => {
  const f = await fixture(t);
  await f.pilot();
  await f.lesson("my-lesson", {
    nb: NB.replace("$3 + 7 = 10$.", "$3 + 7 = 10$ og $2,5$."),
    en: EN.replace("$3 + 7 = 10$.", "$3 + 7 = 10$ and $2.5$ and $\\sqrt{2}$."),
  });
  const result = f.run();
  expectFailure(result, /en\.md:\d+ section \{#what\}: unsupported notation "\\sqrt" in \$\\sqrt\{2\}\$ \(the pilot grammar in content\/AUTHORING\.md\)/);
  assert.doesNotMatch(result.output, /2\.5/);
});

// ---------------------------------------------------------------------------------------------
// Pairing (T028)

test("passes when only prose, order, and localized attributes differ", async (t) => {
  const f = await fixture(t);
  await f.pilot();
  const en = EN
    .replace("Three and seven are a bond: $3 + 7 = 10$.", "A different sentence first. Then: $3 + 7 = 10$ is a bond, and $2.5$ is written with a point.")
    .replace('title="Example: 8 + 5"', 'title="Worked example"')
    .replace(':::example{title="Worked example" id="example"}\nMake ten first: $8 + 5 = 13$.\n:::\n\n:::visual{type="make-ten" a="8" b="5"}\n:::', ':::visual{type="make-ten" a="8" b="5"}\n:::\n\n:::example{title="Worked example" id="example"}\nMake ten first: $8 + 5 = 13$.\n:::');
  await f.lesson("my-lesson", { nb: NB.replace("$3 + 7 = 10$.", "$3 + 7 = 10$ og $2,5$."), en });
  expectPass(f.run());
});

test("reports a differing non-localized directive attribute with both values", async (t) => {
  const f = await fixture(t);
  await f.pilot();
  await f.lesson("my-lesson", { en: EN.replace('start="3"', 'start="4"') });
  expectFailure(f.run(), /en\.md:\d+ directive visual\{type="ten-frame-explorer"\}: attribute start is "4" here and "3" in nb\.md/);
});

test("reports differing mathematics with the section and the counterpart", async (t) => {
  const f = await fixture(t);
  await f.pilot();
  await f.lesson("my-lesson", { en: EN.replace("Three and seven are a bond: $3 + 7 = 10$.", "Three and six: $3 + 6 = 9$.") });
  expectFailure(f.run(),
    /en\.md:\d+ section \{#what\}: expression 3\+6=9 has no counterpart in nb\.md \(nb\.md has 3\+7=10\)/,
    /nb\.md:\d+ section \{#what\}: expression 3\+7=10 has no counterpart in en\.md \(en\.md has 3\+6=9\)/);
});

test("reports directives present in one language only", async (t) => {
  const f = await fixture(t);
  await f.pilot();
  await f.lesson("my-lesson", { en: EN.replace(':::example{title="Example: 8 + 5" id="example"}\nMake ten first: $8 + 5 = 13$.\n:::\n\n', "").replace(':::practice{definition="numbers.addition.within-10" version="1"}\n:::\n', "") });
  expectFailure(f.run(),
    /nb\.md:\d+ directive: directive example\{id="example"\} appears 1 time\(s\) here and 0 time\(s\) in en\.md/,
    /nb\.md:\d+ directive: directive practice\{definition="numbers\.addition\.within-10" version="1"\} appears 1 time\(s\) here and 0 time\(s\) in en\.md/);
});

test("reports an anchor, an attribute, and an expression divergence in one run", async (t) => {
  const f = await fixture(t);
  await f.pilot();
  await f.lesson("my-lesson", { en: EN.replace("## Why? {#why}", "## Why? {#reason}").replace('start="3"', 'start="4"').replace("$3 + 7 = 10$.", "$3 + 6 = 9$.") });
  expectFailure(f.run(), /anchor: \{#reason\} is missing in nb\.md/, /attribute start is "4" here and "3" in nb\.md/, /expression 3\+6=9 has no counterpart in nb\.md/);
});

// ---------------------------------------------------------------------------------------------
// Ladders (T031)

test("rejects a ladder entry that belongs to another skill or does not exist, and duplicates", async (t) => {
  const f = await fixture(t);
  await f.pilot();
  await f.write("content/skills/numbers.addition-within-20.json", {
    ...baseAddition,
    ladder: [
      ...baseAddition.ladder,
      { definition: "algebra.linear-equations.basic", version: 1, description: { nb: "x", en: "y" } },
      { definition: "numbers.addition.within-10", version: 1, description: { nb: "x", en: "y" } },
      { definition: "numbers.addition.crossing-ten", version: 2, description: { nb: "x", en: "y" } },
    ],
  });
  expectFailure(f.run(),
    /numbers\.addition-within-20\.json ladder\[2\]: definition algebra\.linear-equations\.basic@1 belongs to skill algebra\.linear-equations, not numbers\.addition-within-20/,
    /ladder\[3\]: duplicate entry numbers\.addition\.within-10@1/,
    /ladder\[4\]: definition numbers\.addition\.crossing-ten@2 is not defined \(a file under content\/exercises\/\)/);
});

test("rejects a ladder entry missing a language and an empty ladder", async (t) => {
  const f = await fixture(t);
  await f.pilot();
  const [first] = baseAddition.ladder;
  await f.write("content/skills/numbers.addition-within-20.json", { ...baseAddition, ladder: [{ ...first, description: { nb: first.description.nb } }] });
  await f.write("content/skills/numbers.number-bonds-to-ten.json", { ...baseBonds, ladder: [] });
  expectFailure(f.run(),
    /addition-within-20\.json schema violation: \/ladder\/0\/description must have required property 'en'/,
    /number-bonds-to-ten\.json schema violation: \/ladder must NOT have fewer than 1 items/);
});
