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
const baseExercise = JSON.parse(await readFile(path.join(repoRoot, exercisePath), "utf8"));

// Each test invokes the real CLI against an isolated repository-shaped fixture.
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
  async function write(relativePath, value) {
    const target = path.join(root, relativePath);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, JSON.stringify(value));
  }
  async function skill(id, prerequisites = [], filename = `${id}.json`) {
    await write(`content/skills/${filename}`, {
      $schema: "../../schemas/skill.schema.json", schemaVersion: "0.1", id, prerequisites,
    });
  }
  await skill("algebra.linear-equations");
  await write(exercisePath, baseExercise);
  return {
    root, write, skill,
    run() {
      const result = spawnSync(process.execPath, [validator, "--root", root], {
        encoding: "utf8", timeout: 15000,
      });
      assert.ifError(result.error);
      return { status: result.status, output: result.stdout + result.stderr };
    },
  };
}

function expectFailure(result, pattern) {
  assert.equal(result.status, 1, result.output);
  assert.match(result.output, pattern);
  assert.doesNotMatch(result.output, /Validation tooling error/);
}

test("accepts a valid definition and referenced skill", async (t) => {
  const f = await fixture(t);
  const result = f.run();
  assert.equal(result.status, 0, result.output);
  assert.match(result.output, /1 skill\(s\), 1 exercise definition\(s\)/);
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
  const result = f.run();
  assert.equal(result.status, 0, result.output);
  assert.match(result.output, /2 exercise definition\(s\)/);
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

test("rejects duplicate skill IDs", async (t) => {
  const f = await fixture(t);
  await f.skill("algebra.linear-equations", [], "duplicate.json");
  expectFailure(f.run(), /duplicate skill ID algebra\.linear-equations/);
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
  const result = f.run();
  assert.equal(result.status, 0, result.output);
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
