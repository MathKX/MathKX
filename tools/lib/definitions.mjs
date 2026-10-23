// Exercise definitions: the exploratory 0.1 examples and the 0.1-pilot definitions.
// Indexes them by id@version and checks pilot definitions against the registries.
import { range } from "./diagnostics.mjs";
import { listKeys, versioned } from "./registry.mjs";
import { missingSkillOptions } from "./skills.mjs";
import { containment, domainBox, feasible, pointBox } from "./quantities.mjs";

const isInteger = (v) => Number.isInteger(v);

export function indexDefinitions(entries, { skills, registries, diagnostics }) {
  const definitions = new Map(); // id@version -> { file, data, kind }

  for (const entry of entries) {
    const { file, data } = entry;
    const key = versioned(data.id, data.version);
    if (definitions.has(key)) {
      const other = diagnostics.relative(definitions.get(key).file);
      diagnostics.error(file, `duplicate exercise identity ${data.id} version ${data.version}; also defined in ${other}`);
      continue;
    }
    definitions.set(key, entry);
  }

  for (const { file, data, kind } of definitions.values()) {
    if (!skills.has(data.skill)) {
      diagnostics.error(file, `skill ${data.skill} is not a defined skill`, missingSkillOptions(data.skill));
    }
    if (kind === "definition") checkPilotDefinition(file, data, registries, diagnostics);
  }
  return definitions;
}

function checkPilotDefinition(file, data, registries, diagnostics) {
  const error = (message, options) => diagnostics.error(file, message, options);

  // Validator.
  const validatorKey = versioned(data.validator.name, data.validator.version);
  const validator = registries.validators.get(validatorKey)?.entry;
  if (!validator) error(`${validatorKey} is not registered`, { field: "validator", expected: listKeys(registries.validators) });

  // Domain box: from generator parameters, or from the authored prompt.
  let box = null;
  if (data.source === "generated") {
    const generatorKey = versioned(data.generator.name, data.generator.version);
    const generator = registries.generators.get(generatorKey)?.entry;
    if (!generator) {
      error(`${generatorKey} is not registered`, { field: "generator", expected: listKeys(registries.generators) });
    } else {
      const declared = Object.keys(generator.parameters);
      for (const [name, bounds] of Object.entries(data.generator.parameters)) {
        const field = `generator.parameters.${name}`;
        const domain = generator.parameters[name];
        if (!domain) {
          error(`not a parameter of ${generatorKey}`, { field, expected: `one of: ${declared.join(", ")}` });
          continue;
        }
        if (bounds.min > bounds.max) error(`min ${bounds.min} is greater than max ${bounds.max}`, { field });
        for (const edge of ["min", "max"]) {
          const value = bounds[edge];
          if (value < domain.min || value > domain.max) {
            error(`${edge} ${value} is outside the generator's domain ${range(domain.min, domain.max)}`, { field });
          }
        }
      }
      for (const name of declared) {
        if (!(name in data.generator.parameters)) error(`parameter ${name} of ${generatorKey} is not given`, { field: "generator.parameters" });
      }
      const allowed = generator.constraints ?? [];
      (data.generator.constraints ?? []).forEach((name, i) => {
        if (!allowed.includes(name)) {
          error(`${name} is not a constraint of ${generatorKey}`, {
            field: `generator.constraints[${i}]`,
            expected: allowed.length ? `one of: ${allowed.join(", ")}` : `${generatorKey} declares none`,
          });
        }
      });
      box = domainBox(generator, data.generator.parameters);
      if (generator.relation && box.operand && box.sum && !feasible(generator.relation, box)) {
        error(`no operand pair within ${range(...box.operand)} has a sum within ${range(...box.sum)}`, { field: "generator.parameters" });
      }
    }
  } else {
    const prompt = data.instance.prompt;
    box = pointBox(prompt);
    for (const role of ["help", "explanation"]) {
      data.representations[role].forEach((name) => {
        const representation = registries.representations.get(name)?.entry;
        if (!representation) return;
        for (const quantity of representation.reads) {
          if (!isInteger(prompt[quantity])) {
            error(`representation ${name} reads ${quantity}, which is missing or not an integer`, { field: "instance.prompt" });
          }
        }
      });
    }
    if (validator) checkValidationArtifact(file, data.instance.validation, validator, validatorKey, diagnostics);
  }

  // Representations: registered, offering the role, and covering the domain box.
  for (const role of ["help", "explanation"]) {
    data.representations[role].forEach((name, i) => {
      const field = `representations.${role}[${i}]`;
      const representation = registries.representations.get(name)?.entry;
      if (!representation) {
        error(`${name} is not a registered representation`, { field, expected: listKeys(registries.representations) });
        return;
      }
      if (!representation.role.includes(role)) {
        error(`${name} does not offer the ${role} role`, { field, expected: `one of: ${representation.role.join(", ")}` });
      }
      if (!box) return;
      for (const v of containment(representation.supports, box)) {
        if (!v.actual) {
          error(`${name} needs quantity ${v.quantity}, which the definition does not determine`, { field });
        } else if (data.source === "generated") {
          error(`${name} supports ${v.quantity} ${range(...v.supports)} but the definition allows ${v.quantity} ${range(...v.actual)}`, { field });
        } else {
          error(`${name} supports ${v.quantity} ${range(...v.supports)} but the task has ${v.quantity} ${v.actual[0]}`, { field });
        }
      }
    });
  }

  // Misconception codes: registered and emitted by the named validator.
  data.misconceptionCodes.forEach((code, i) => {
    const field = `misconceptionCodes[${i}]`;
    if (!registries.codes.has(code)) {
      error(`${code} is not a registered misconception code`, { field, expected: listKeys(registries.codes) });
    } else if (validator && !(validator.emits ?? []).includes(code)) {
      error(`${code} is not emitted by validator ${validatorKey}`, { field, expected: `one of: ${(validator.emits ?? []).join(", ")}` });
    }
  });
}

function checkValidationArtifact(file, validation, validator, validatorKey, diagnostics) {
  const artifact = validator.artifact;
  if (artifact.type === "integer") {
    const keys = Object.keys(validation);
    for (const key of keys) {
      if (key !== "answer") diagnostics.error(file, `unexpected key ${key} for validator ${validatorKey}`, { field: "instance.validation", expected: "answer only" });
    }
    const answer = validation.answer;
    if (!isInteger(answer)) {
      diagnostics.error(file, `expected integer for validator ${validatorKey}`, { field: "instance.validation.answer" });
    } else if ((artifact.min != null && answer < artifact.min) || (artifact.max != null && answer > artifact.max)) {
      diagnostics.error(file, `${answer} is outside ${range(artifact.min ?? "-∞", artifact.max ?? "∞")} for validator ${validatorKey}`, { field: "instance.validation.answer" });
    }
  }
}
