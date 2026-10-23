// Validates every stress fixture against the draft contracts in ../contracts (the pilot)
// and against ./contracts-next (the proposed additive extensions), using the same Ajv
// configuration as tools/validate-content.mjs. Usage, from the repository root:
//   node specs/001-pilot-content-contract/stress-fixtures/check.mjs [--json]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const here = path.dirname(fileURLToPath(import.meta.url));
const schemaSets = {
  pilot: path.join(here, "..", "contracts"),
  next: path.join(here, "contracts-next"),
};

function loadSet(dir) {
  if (!fs.existsSync(dir)) return null;
  const ajv = new Ajv2020({ strict: true, allErrors: true });
  addFormats(ajv);
  const validators = {};
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".schema.json"))) {
    validators[f] = ajv.compile(JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")));
  }
  return validators;
}

function describe(errors) {
  return errors.map((e) => {
    const where = e.instancePath || "/";
    if (e.keyword === "additionalProperties") return `${where}: unexpected property "${e.params.additionalProperty}"`;
    if (e.keyword === "enum") return `${where}: ${e.message} (${e.params.allowedValues.join(", ")})`;
    if (e.keyword === "required") return `${where}: missing "${e.params.missingProperty}"`;
    return `${where}: ${e.message}`;
  });
}

const sets = Object.fromEntries(Object.entries(schemaSets).map(([k, d]) => [k, loadSet(d)]));
const scenarios = fs.readdirSync(here, { withFileTypes: true }).filter((e) => e.isDirectory() && e.name !== "contracts-next").map((e) => e.name).sort();
const report = {};
for (const scenario of scenarios) {
  const dir = path.join(here, scenario);
  report[scenario] = {};
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort()) {
    const data = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
    const schemaName = path.basename(data.$schema ?? "");
    report[scenario][file] = {};
    for (const [setName, validators] of Object.entries(sets)) {
      if (!validators) { report[scenario][file][setName] = "no schema set"; continue; }
      const validate = validators[schemaName];
      if (!validate) { report[scenario][file][setName] = `unknown schema ${schemaName}`; continue; }
      report[scenario][file][setName] = validate(data) ? "ok" : describe(validate.errors);
    }
  }
}

if (process.argv.includes("--json")) {
  console.log(JSON.stringify(report, null, 2));
} else {
  for (const [scenario, files] of Object.entries(report)) {
    console.log(`\n## ${scenario}`);
    for (const [file, outcome] of Object.entries(files)) {
      for (const [setName, result] of Object.entries(outcome)) {
        if (result === "ok") console.log(`  ${setName.padEnd(5)} ok    ${file}`);
        else if (typeof result === "string") console.log(`  ${setName.padEnd(5)} ??    ${file}: ${result}`);
        else { console.log(`  ${setName.padEnd(5)} FAIL  ${file}`); for (const line of result) console.log(`           - ${line}`); }
      }
    }
  }
}
const pilotFailures = Object.values(report).flatMap((files) => Object.values(files)).filter((o) => o.pilot !== "ok").length;
const nextFailures = Object.values(report).flatMap((files) => Object.values(files)).filter((o) => o.next && o.next !== "ok").length;
console.log(`\npilot contracts: ${pilotFailures} file(s) rejected; next contracts: ${sets.next ? `${nextFailures} file(s) rejected` : "not present"}`);
