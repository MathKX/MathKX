#!/usr/bin/env node
// Validates MathKX content.
//
// 1. Every JSON file under content/ is validated against the schema it names in "$schema".
// 2. Every skill ID is unique.
// 3. Every exercise "skill" and every skill "prerequisites" entry resolves to a defined skill.
// 4. The skill prerequisite graph is acyclic.
//
// Exit code 0 when everything passes, 1 on validation failures, 2 on tooling errors.
// Usage: node tools/validate-content.mjs [--root <repo root>]

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootArg = process.argv.indexOf("--root");
const repoRoot = rootArg !== -1 ? path.resolve(process.argv[rootArg + 1]) : path.resolve(scriptDir, "..");
const contentDir = path.join(repoRoot, "content");
const schemasDir = path.join(repoRoot, "schemas");

const SKILL_SCHEMA = "skill.schema.json";
const EXERCISE_SCHEMA = "exercise.schema.json";

const failures = [];
function fail(file, message) {
  failures.push({ file: path.relative(repoRoot, file).replaceAll("\\", "/"), message });
}

async function listJsonFiles(dir) {
  const out = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") return out;
    throw error;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await listJsonFiles(full)));
    else if (entry.isFile() && entry.name.endsWith(".json")) out.push(full);
  }
  return out.sort();
}

async function readJson(file) {
  const text = await readFile(file, "utf8");
  return JSON.parse(text);
}

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const compiledSchemas = new Map();

async function compileSchema(schemaPath) {
  if (compiledSchemas.has(schemaPath)) return compiledSchemas.get(schemaPath);
  const schema = await readJson(schemaPath);
  const validate = ajv.compile(schema);
  compiledSchemas.set(schemaPath, validate);
  return validate;
}

function formatAjvErrors(errors) {
  return errors
    .map((e) => `${e.instancePath || "/"} ${e.message}${e.params?.additionalProperty ? ` (${e.params.additionalProperty})` : ""}`)
    .join("; ");
}

async function main() {
  const files = await listJsonFiles(contentDir);
  if (files.length === 0) {
    console.log("No content files found under content/. Nothing to validate.");
    return 0;
  }

  const skills = new Map(); // id -> { file, prerequisites }
  const exercises = []; // { file, id, skill }

  for (const file of files) {
    let data;
    try {
      data = await readJson(file);
    } catch (error) {
      fail(file, `invalid JSON: ${error.message}`);
      continue;
    }

    if (typeof data.$schema !== "string") {
      fail(file, 'missing "$schema"; every content file must name its schema');
      continue;
    }

    const schemaPath = path.resolve(path.dirname(file), data.$schema);
    const relToSchemas = path.relative(schemasDir, schemaPath);
    if (relToSchemas.startsWith("..") || path.isAbsolute(relToSchemas)) {
      fail(file, `"$schema" must point inside schemas/, got ${data.$schema}`);
      continue;
    }

    let validate;
    try {
      validate = await compileSchema(schemaPath);
    } catch (error) {
      fail(file, `cannot load schema ${data.$schema}: ${error.message}`);
      continue;
    }

    if (!validate(data)) {
      fail(file, `schema violation: ${formatAjvErrors(validate.errors)}`);
      continue;
    }

    const schemaName = path.basename(schemaPath);
    if (schemaName === SKILL_SCHEMA) {
      if (skills.has(data.id)) {
        fail(file, `duplicate skill ID ${data.id}; also defined in ${skills.get(data.id).file}`);
        continue;
      }
      skills.set(data.id, { file, prerequisites: data.prerequisites ?? [] });
    } else if (schemaName === EXERCISE_SCHEMA) {
      exercises.push({ file, id: data.id, skill: data.skill });
    }
  }

  // Reference checks.
  for (const [id, skill] of skills) {
    for (const prerequisite of skill.prerequisites) {
      if (prerequisite === id) fail(skill.file, `skill ${id} lists itself as a prerequisite`);
      else if (!skills.has(prerequisite)) fail(skill.file, `prerequisite ${prerequisite} is not a defined skill`);
    }
  }
  for (const exercise of exercises) {
    if (!skills.has(exercise.skill)) fail(exercise.file, `skill ${exercise.skill} is not a defined skill`);
  }

  // Cycle detection over the prerequisite graph (iterative DFS with colors).
  const WHITE = 0, GREY = 1, BLACK = 2;
  const color = new Map([...skills.keys()].map((id) => [id, WHITE]));
  const reportedCycles = new Set();
  for (const start of skills.keys()) {
    if (color.get(start) !== WHITE) continue;
    const stack = [[start, 0]];
    const pathIds = [];
    color.set(start, GREY);
    pathIds.push(start);
    while (stack.length > 0) {
      const frame = stack[stack.length - 1];
      const [id, index] = frame;
      const prerequisites = skills.get(id).prerequisites.filter((p) => skills.has(p));
      if (index < prerequisites.length) {
        frame[1] = index + 1;
        const next = prerequisites[index];
        const c = color.get(next);
        if (c === WHITE) {
          color.set(next, GREY);
          pathIds.push(next);
          stack.push([next, 0]);
        } else if (c === GREY) {
          const cycle = pathIds.slice(pathIds.indexOf(next)).concat(next);
          const key = [...cycle].sort().join(">");
          if (!reportedCycles.has(key)) {
            reportedCycles.add(key);
            fail(skills.get(next).file, `prerequisite cycle: ${cycle.join(" -> ")}`);
          }
        }
      } else {
        color.set(id, BLACK);
        pathIds.pop();
        stack.pop();
      }
    }
  }

  const summary = `${files.length} content file(s), ${skills.size} skill(s), ${exercises.length} exercise definition(s)`;
  if (failures.length > 0) {
    console.error(`Content validation failed: ${failures.length} problem(s) in ${summary}.\n`);
    for (const f of failures) console.error(`  ${f.file}\n    ${f.message}`);
    return 1;
  }
  console.log(`Content validation passed: ${summary}.`);
  return 0;
}

main().then(
  (code) => process.exit(code),
  (error) => {
    console.error(`Validation tooling error: ${error.stack ?? error.message}`);
    process.exit(2);
  }
);
