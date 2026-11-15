// Diagnostics collector and formatting for the content validator.
// Format (specs/001 contracts/diagnostics.md):
//   <repo-relative path>[:<line>][ <field>:] <message>[ (<expected>)]
// Warnings are prefixed "warning:". Paths use forward slashes on every platform.
import path from "node:path";

export function createDiagnostics(repoRoot) {
  const items = [];
  const relative = (file) =>
    (path.isAbsolute(file) ? path.relative(repoRoot, file) : file).replaceAll("\\", "/");
  function add(severity, file, message, { line, field, expected } = {}) {
    items.push({ severity, file: relative(file), line, field, message, expected });
  }
  return {
    items,
    relative,
    error: (file, message, options) => add("error", file, message, options),
    warning: (file, message, options) => add("warning", file, message, options),
    get errorCount() {
      return items.filter((d) => d.severity === "error").length;
    },
    get warningCount() {
      return items.filter((d) => d.severity === "warning").length;
    },
    sorted() {
      return [...items].sort(
        (a, b) => a.file.localeCompare(b.file) || (a.line ?? 0) - (b.line ?? 0) || (a.field ?? "").localeCompare(b.field ?? "")
      );
    },
  };
}

export function formatDiagnostic(d) {
  let text = d.file;
  if (d.line != null) text += `:${d.line}`;
  if (d.field) text += ` ${d.field}:`;
  text += ` ${d.message}`;
  if (d.expected) text += ` (${d.expected})`;
  return d.severity === "warning" ? `warning: ${text}` : text;
}

export function summary(counts, { errors = 0, warnings = 0 } = {}) {
  const parts = [
    `${counts.files} file(s)`,
    `${counts.skills} skill(s)`,
    `${counts.lessons} lesson(s)`,
    `${counts.definitions} definition(s)`,
    `${counts.checks ?? 0} check(s)`,
    `${counts.registries} ${counts.registries === 1 ? "registry" : "registries"}`,
  ];
  if (errors > 0) parts.push(`${errors} error(s)`);
  if (warnings > 0) parts.push(`${warnings} warning(s)`);
  return `Content validation ${errors > 0 ? "failed" : "passed"}: ${parts.join(", ")}.`;
}

/** Formats an integer range the way diagnostics show it: "2–10". */
export const range = (min, max) => `${min}–${max}`;
