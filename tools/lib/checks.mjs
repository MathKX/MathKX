// Self-checks (specs/006 contracts/check-content.md "The content check"): unique identities, and each question a pilot
// definition of the check's skill, with a seed exactly when the definition is generated. Runs no generator: two seeds
// that give the same operands are caught by the domain tests (CheckQuestionsTests), not here.
import { versioned } from "./registry.mjs";
import { missingSkillOptions } from "./skills.mjs";

const MAX_SEED = 2n ** 64n - 1n;

export function checkChecks(entries, { skills, definitions, diagnostics }) {
  const identities = new Map(); // id@version -> file

  for (const { file, data } of entries) {
    const key = versioned(data.id, data.version);
    if (identities.has(key)) {
      diagnostics.error(file, `duplicate check identity ${data.id} version ${data.version}; also defined in ${diagnostics.relative(identities.get(key))}`);
      continue;
    }
    identities.set(key, file);

    if (!skills.has(data.skill)) {
      diagnostics.error(file, `skill ${data.skill} is not a defined skill`, missingSkillOptions(data.skill, { field: "skill" }));
    }

    const seen = new Map(); // a question's identity -> its first index
    data.questions.forEach((question, i) => {
      const field = `questions[${i}]`;
      const definitionKey = versioned(question.definition, question.version);
      const hasSeed = question.seed !== undefined;
      // Seeds are compared as numbers: the schema forbids leading zeros, but the identity is the value.
      const identity = hasSeed ? `${definitionKey}#${BigInt(question.seed)}` : definitionKey;
      if (seen.has(identity)) diagnostics.error(file, `the same question as questions[${seen.get(identity)}]`, { field });
      else seen.set(identity, i);

      const definition = definitions.get(definitionKey);
      if (!definition || definition.kind !== "definition") {
        diagnostics.error(file, `${definitionKey} is not a pilot exercise definition`, { field: `${field}.definition` });
        return;
      }
      if (definition.data.skill !== data.skill) {
        diagnostics.error(file, `${definitionKey} serves ${definition.data.skill}, not ${data.skill}; a check covers one skill`, { field: `${field}.definition` });
      }
      if (definition.data.source === "generated") {
        if (!hasSeed) diagnostics.error(file, `${definitionKey} is generated; give the seed of the question`, { field });
        else if (BigInt(question.seed) > MAX_SEED) diagnostics.error(file, "seed is outside the unsigned 64-bit range", { field: `${field}.seed` });
      } else if (hasSeed) {
        diagnostics.error(file, `${definitionKey} is a fixed task; remove the seed`, { field: `${field}.seed` });
      }
    });
  }
}
