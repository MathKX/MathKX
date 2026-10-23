// Lesson checks: folder and metadata, references, each translation's structure, directives,
// notation, and the cross-language pairing.
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { range } from "./diagnostics.mjs";
import { parseLessonMarkdown, BEFORE_FIRST_HEADING } from "./markdown.mjs";
import { normalize } from "./notation.mjs";
import { comparePair } from "./pairing.mjs";
import { containment, pointBox } from "./quantities.mjs";
import { listKeys, versioned } from "./registry.mjs";
import { missingSkillOptions } from "./skills.mjs";

const LANGUAGES = ["nb", "en"];
const DIRECTIVES = ["visual", "example", "practice"];
const FRONT_MATTER_KEYS = ["title", "objective"];

const exists = async (file) => stat(file).then(() => true, () => false);

export async function checkLessons(entries, { skills, definitions, registries, diagnostics }) {
  const lessons = new Map(); // id -> { file, data }
  for (const { file, data } of entries) {
    if (lessons.has(data.id)) {
      diagnostics.error(file, `duplicate lesson ID ${data.id}; also defined in ${diagnostics.relative(lessons.get(data.id).file)}`, { field: "id" });
      continue;
    }
    lessons.set(data.id, { file, data });
  }

  for (const { file, data } of lessons.values()) {
    const folder = path.dirname(file);
    const folderName = path.basename(folder);
    if (folderName !== data.id) diagnostics.error(file, `${data.id} does not equal the folder name ${folderName}`, { field: "id", expected: "the lesson folder is named after its id" });

    // References.
    const skillList = (field, ids) => (ids ?? []).forEach((id, i) => {
      if (!skills.has(id)) diagnostics.error(file, `${id} is not a defined skill`, missingSkillOptions(id, { field: `${field}[${i}]` }));
    });
    skillList("skills", data.skills);
    skillList("prerequisites", data.prerequisites);
    skillList("relatedSkills", data.relatedSkills);
    (data.relatedLessons ?? []).forEach((id, i) => {
      if (!lessons.has(id)) diagnostics.error(file, `${id} is not a defined lesson`, { field: `relatedLessons[${i}]`, expected: "a folder under content/lessons/" });
    });
    const practiceKeys = data.practice.map((p) => versioned(p.definition, p.version));
    data.practice.forEach((p, i) => {
      const key = practiceKeys[i];
      const definition = definitions.get(key);
      if (!definition) {
        diagnostics.error(file, `definition ${key} is not defined`, { field: `practice[${i}]`, expected: "a file under content/exercises/" });
      } else if (!data.skills.includes(definition.data.skill)) {
        diagnostics.warning(file, `definition ${key} serves skill ${definition.data.skill}, which is not among this lesson's skills`, { field: `practice[${i}]` });
      }
    });

    // Translation files: exactly nb.md and en.md.
    const translations = {};
    for (const language of LANGUAGES) {
      const name = data.translations[language];
      const target = path.join(folder, name);
      if (!(await exists(target))) {
        diagnostics.error(file, `${name} does not exist in the lesson folder`, { field: `translations.${language}` });
        continue;
      }
      translations[language] = target;
    }
    for (const name of await readdir(folder)) {
      if (name.endsWith(".md") && !Object.values(data.translations).includes(name)) {
        diagnostics.error(path.join(folder, name), "unsupported language file; the pilot ships nb.md and en.md only", { expected: "remove it or wait until that language is a release requirement" });
      }
    }
    if (data.status === "released" && Object.keys(translations).length < LANGUAGES.length) {
      diagnostics.error(file, "released requires both translations", { field: "status" });
    }

    // Each translation on its own.
    const parsed = {};
    for (const language of LANGUAGES) {
      const target = translations[language];
      if (!target) continue;
      const text = await readFile(target, "utf8");
      const result = parseLessonMarkdown(text);
      parsed[language] = { file: target, parsed: result };
      await checkTranslation(target, result, { folder, data, practiceKeys, registries, diagnostics });
    }
    if (parsed.nb && parsed.en) comparePair(parsed.nb, parsed.en, diagnostics);
  }
  return lessons.size;
}

async function checkTranslation(file, parsed, { folder, data, practiceKeys, registries, diagnostics }) {
  const error = (message, options) => diagnostics.error(file, message, options);
  const base = path.basename(file);

  // Front matter.
  if (!parsed.frontMatter.ok) error(parsed.frontMatter.error, { field: "front matter", expected: "title and objective between --- fences" });
  else {
    const fm = parsed.frontMatter.data;
    for (const key of FRONT_MATTER_KEYS) {
      if (typeof fm[key] !== "string" || fm[key].trim() === "") error(`missing ${key}`, { field: "front matter", expected: "a non-empty string" });
    }
    for (const key of Object.keys(fm)) {
      if (!FRONT_MATTER_KEYS.includes(key)) error(`unexpected key ${key}`, { field: "front matter", expected: "title and objective only" });
    }
  }

  // Headings and anchors.
  const anchors = new Set();
  for (const h of parsed.headings) {
    if (h.level !== 2 && h.level !== 3) continue;
    if (!h.anchor) { error(`"${h.text}" has no {#anchor}`, { line: h.line, field: "heading", expected: "## Title {#anchor}" }); continue; }
    if (anchors.has(h.anchor)) error(`anchor {#${h.anchor}} is used twice`, { line: h.line, field: "heading" });
    anchors.add(h.anchor);
  }

  // Tables without a delimiter row.
  for (const p of parsed.pipeParagraphs) {
    error("table without a delimiter row", { line: p.line, expected: 'a line like "| --- | --- |" after the header' });
  }

  // Images and links.
  const isExternal = (url) => /^(?:[a-z]+:)?\/\//i.test(url) || /^(mailto|tel):/i.test(url);
  for (const image of parsed.images) {
    if (image.alt.trim() === "") error(`image ${image.url} has no alternative text`, { line: image.line, field: "image" });
    if (!isExternal(image.url) && !(await exists(path.join(folder, image.url)))) error(`image ${image.url} does not exist`, { line: image.line, field: "image", expected: "a file under the lesson's assets/" });
  }
  for (const link of parsed.links) {
    if (isExternal(link.url)) continue;
    if (link.url.startsWith("#")) {
      if (!anchors.has(link.url.slice(1))) error(`link ${link.url} does not match an anchor in this file`, { line: link.line, field: "link" });
    } else if (!(await exists(path.join(folder, link.url.split("#")[0])))) {
      error(`link ${link.url} does not exist`, { line: link.line, field: "link" });
    }
  }

  // Directives.
  const exampleIds = new Set();
  const seenPractice = new Set();
  for (const d of parsed.directives) {
    const at = { line: d.line };
    if (d.form !== "container") { error(`directive ${d.name} is not a container directive`, { ...at, field: "directive", expected: ":::name{...} on its own line, a body, and a closing ::: line" }); continue; }
    if (!DIRECTIVES.includes(d.name)) { error(`unknown directive ${d.name}`, { ...at, field: "directive", expected: `one of: ${DIRECTIVES.join(", ")}` }); continue; }
    if (d.name === "visual") checkVisual(d, { error, data, registries });
    if (d.name === "example") {
      const field = `directive example{id="${d.attributes.id ?? ""}"}`;
      if (!d.attributes.id) error("example directive needs an id attribute", { ...at, field: "directive example" });
      else if (exampleIds.has(d.attributes.id)) error(`example id ${d.attributes.id} is used twice`, { ...at, field });
      else exampleIds.add(d.attributes.id);
      if (!d.attributes.title || d.attributes.title.trim() === "") error("example directive needs a non-empty title", { ...at, field });
    }
    if (d.name === "practice") {
      const { definition, version } = d.attributes;
      const field = `directive practice{definition="${definition ?? ""}" version="${version ?? ""}"}`;
      if (!definition || !version) { error("practice directive needs definition and version attributes", { ...at, field: "directive practice" }); continue; }
      if (!/^[1-9]\d*$/.test(version)) { error(`version must be a positive integer, got "${version}"`, { ...at, field }); continue; }
      const key = versioned(definition, Number(version));
      seenPractice.add(key);
      if (!practiceKeys.includes(key)) error(`${key} has no entry in lesson.json practice`, { ...at, field, expected: practiceKeys.length ? `one of: ${practiceKeys.join(", ")}` : "add it to lesson.json practice" });
    }
  }
  practiceKeys.forEach((key, i) => {
    if (!seenPractice.has(key)) diagnostics.error(path.join(folder, "lesson.json"), `definition ${key} has no :::practice directive in ${base}`, { field: `practice[${i}]` });
  });

  // Notation.
  for (const m of parsed.math) {
    const n = normalize(m.value);
    if (!n.ok) {
      const section = m.section === BEFORE_FIRST_HEADING ? m.section : `{#${m.section}}`;
      error(`unsupported notation "${n.error}" in $${m.value}$`, { line: m.line, field: `section ${section}`, expected: "the pilot grammar in content/AUTHORING.md" });
    }
  }
  void data;
}

function checkVisual(d, { error, data, registries }) {
  const at = { line: d.line };
  const type = d.attributes.type;
  if (!type) { error("visual directive needs a type attribute", { ...at, field: "directive visual", expected: listKeys(registries.components) }); return; }
  const field = `directive visual{type="${type}"}`;
  const component = registries.components.get(type)?.entry;
  if (!component) { error(`unregistered visual component ${type}`, { ...at, field, expected: listKeys(registries.components) }); return; }
  if (!(data.visuals ?? []).includes(type)) error(`type ${type} is not listed in lesson.json visuals`, { ...at, field });

  const values = {};
  const declared = component.attributes ?? {};
  for (const [name, raw] of Object.entries(d.attributes)) {
    if (name === "type") continue;
    const spec = declared[name];
    if (!spec) { error(`attribute ${name} is not declared for component ${type}`, { ...at, field, expected: Object.keys(declared).length ? `one of: ${Object.keys(declared).join(", ")}` : `${type} takes no attributes` }); continue; }
    if (spec.type === "integer") {
      if (!/^-?\d+$/.test(raw)) { error(`attribute ${name} must be an integer, got "${raw}"`, { ...at, field }); continue; }
      const value = Number(raw);
      if ((spec.min != null && value < spec.min) || (spec.max != null && value > spec.max)) {
        error(`attribute ${name} is ${value}, outside the declared range ${range(spec.min ?? "-∞", spec.max ?? "∞")}`, { ...at, field });
        continue;
      }
      values[name] = value;
    } else values[name] = raw;
  }
  for (const [name, spec] of Object.entries(declared)) {
    if (spec.required && !(name in d.attributes)) error(`attribute ${name} is required for component ${type}`, { ...at, field });
  }

  if (component.representation) {
    const representation = registries.representations.get(component.representation)?.entry;
    const keys = Object.keys(values).sort().join(",");
    if (!representation) return; // reported by the registry check
    if (keys !== "a,b") { error(`no quantity mapping for component ${type} in the pilot`, { ...at, field, expected: "attributes a and b (per-component derivation is a deferred extension)" }); return; }
    for (const v of containment(representation.supports, pointBox(values))) {
      if (!v.actual) error(`${component.representation} needs quantity ${v.quantity}, which a and b do not determine`, { ...at, field });
      else error(`${component.representation} supports ${v.quantity} ${range(...v.supports)} but a=${values.a} b=${values.b} gives ${v.quantity} ${v.actual[0]}`, { ...at, field });
    }
  }
}
