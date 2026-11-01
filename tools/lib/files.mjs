// Discovery of content files, "$schema" resolution, known-schema dispatch, and Ajv setup.
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

export const SCHEMAS = {
  skill: "skill.schema.json",
  exercise: "exercise.schema.json", // exploratory 0.1, unchanged
  lesson: "lesson.schema.json",
  definition: "exercise-definition.pilot.schema.json",
  registry: "registry.schema.json",
  check: "self-check.pilot.schema.json",
};
const KNOWN = new Map(Object.entries(SCHEMAS).map(([kind, name]) => [name, kind]));

/** The one directory under content/ the validator skips: copyable templates with placeholders. */
export const TEMPLATES_DIR = "_templates";

export async function listJsonFiles(contentDir) {
  const out = [];
  async function walk(dir, depth) {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch (error) {
      if (error.code === "ENOENT") return;
      throw error;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (depth === 0 && entry.name === TEMPLATES_DIR) continue;
        await walk(full, depth + 1);
      } else if (entry.isFile() && entry.name.endsWith(".json")) {
        out.push(full);
      }
    }
  }
  await walk(contentDir, 0);
  return out.sort();
}

export async function readJson(file) {
  return JSON.parse(await readFile(file, "utf8"));
}

export function createSchemaLoader(schemasDir) {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const compiled = new Map();
  return async function compileSchema(schemaPath) {
    if (compiled.has(schemaPath)) return compiled.get(schemaPath);
    const validate = ajv.compile(await readJson(schemaPath));
    compiled.set(schemaPath, validate);
    return validate;
  };
}

export function formatAjvErrors(errors, schemaKind) {
  return errors
    .map((e) => {
      let text = `${e.instancePath || "/"} ${e.message}`;
      if (e.params?.additionalProperty) {
        text += ` (${e.params.additionalProperty})`;
        if (schemaKind === "lesson" && e.params.additionalProperty === "check") {
          text += ": check is not a lesson field; a check names its skill in content/checks/, remove this line";
        }
      }
      return text;
    })
    .join("; ");
}

/**
 * Discovers and schema-validates every JSON file under content/.
 * Returns { fileCount, entries } where entries are { file, data, kind } for files that passed.
 * File-level failures are reported on the diagnostics collector without a field segment.
 */
export async function loadContentFiles({ repoRoot, diagnostics }) {
  const contentDir = path.join(repoRoot, "content");
  const schemasDir = path.join(repoRoot, "schemas");
  const compileSchema = createSchemaLoader(schemasDir);
  const files = await listJsonFiles(contentDir);
  const entries = [];

  for (const file of files) {
    let data;
    try {
      data = await readJson(file);
    } catch (error) {
      diagnostics.error(file, `invalid JSON: ${error.message}`);
      continue;
    }
    if (data === null || typeof data !== "object" || Array.isArray(data)) {
      diagnostics.error(file, "content must be a JSON object");
      continue;
    }
    if (typeof data.$schema !== "string") {
      diagnostics.error(file, 'missing "$schema"; every content file must name its schema');
      continue;
    }
    const schemaPath = path.resolve(path.dirname(file), data.$schema);
    const relToSchemas = path.relative(schemasDir, schemaPath);
    if (relToSchemas.startsWith("..") || path.isAbsolute(relToSchemas)) {
      diagnostics.error(file, `"$schema" must point inside schemas/, got ${data.$schema}`);
      continue;
    }
    const schemaName = path.basename(schemaPath);
    const kind = KNOWN.get(schemaName);
    if (!kind) {
      diagnostics.error(file, `unknown schema ${schemaName}`, { expected: `one of: ${[...KNOWN.keys()].join(", ")}` });
      continue;
    }
    let validate;
    try {
      validate = await compileSchema(schemaPath);
    } catch (error) {
      diagnostics.error(file, `cannot load schema ${data.$schema}: ${error.message}`);
      continue;
    }
    if (!validate(data)) {
      diagnostics.error(file, `schema violation: ${formatAjvErrors(validate.errors, kind)}`);
      continue;
    }
    entries.push({ file, data, kind });
  }
  return { fileCount: files.length, entries };
}
