#!/usr/bin/env node
// Validates MathKX content (specs/001 contracts/diagnostics.md):
//
// 1. Registries under content/registry/ load and are internally consistent.
// 2. Every JSON file under content/ (except content/_templates/) names a known schema and validates against it.
// 3. Skills: unique IDs, prerequisites resolve, no self-reference, no cycles, ladders resolve.
// 4. Definitions: unique (id, version), skill resolves, registered generator/validator/representations,
//    parameter domains, feasibility, representation coverage, fixed-task artifacts, misconception codes.
// 5. Lessons: folder and metadata, references, both translations, structure, directives, notation, pairing.
//
// Exit code 0 when everything passes (warnings allowed), 1 on content errors, 2 on tooling errors.
// Usage: node tools/validate-content.mjs [--root <repo root>]

import path from "node:path";
import { fileURLToPath } from "node:url";
import { createDiagnostics, formatDiagnostic, summary } from "./lib/diagnostics.mjs";
import { loadContentFiles } from "./lib/files.mjs";
import { indexRegistries } from "./lib/registry.mjs";
import { checkLadders, checkNames, indexSkills } from "./lib/skills.mjs";
import { indexDefinitions } from "./lib/definitions.mjs";
import { checkLessons } from "./lib/lessons.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootArg = process.argv.indexOf("--root");
const repoRoot = rootArg !== -1 ? path.resolve(process.argv[rootArg + 1]) : path.resolve(scriptDir, "..");

async function main() {
  const diagnostics = createDiagnostics(repoRoot);
  const { fileCount, entries } = await loadContentFiles({ repoRoot, diagnostics });
  if (fileCount === 0) {
    console.log("No content files found under content/. Nothing to validate.");
    return 0;
  }
  const ofKind = (kind) => entries.filter((e) => e.kind === kind);

  const registries = indexRegistries(ofKind("registry"), diagnostics);
  const skills = indexSkills(ofKind("skill"), diagnostics);
  const definitions = indexDefinitions([...ofKind("exercise"), ...ofKind("definition")], { skills, registries, diagnostics });
  checkNames(skills, diagnostics);
  checkLadders(skills, definitions, diagnostics);
  const lessonCount = await checkLessons(ofKind("lesson"), { skills, definitions, registries, diagnostics });

  const counts = { files: fileCount, skills: skills.size, lessons: lessonCount, definitions: definitions.size, registries: registries.count };
  const line = summary(counts, { errors: diagnostics.errorCount, warnings: diagnostics.warningCount });
  const output = diagnostics.errorCount > 0 ? console.error : console.log;
  for (const d of diagnostics.sorted()) output(formatDiagnostic(d));
  if (diagnostics.items.length > 0) output("");
  output(line);
  return diagnostics.errorCount > 0 ? 1 : 0;
}

main().then(
  (code) => process.exit(code),
  (error) => {
    console.error(`Validation tooling error: ${error.stack ?? error.message}`);
    process.exit(2);
  }
);
