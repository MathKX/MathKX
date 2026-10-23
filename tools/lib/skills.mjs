// Skill registry checks: unique IDs, prerequisite references, self-reference, cycles, ladders.

const RETIRED_PREFIX = "arithmetic.";
export const RETIRED_HINT = "the registry uses numbers.*";

/** Returns the diagnostic options to attach when `id` is not a defined skill. */
export function missingSkillOptions(id, extra = {}) {
  return id.startsWith(RETIRED_PREFIX) ? { ...extra, expected: RETIRED_HINT } : extra;
}

export function indexSkills(entries, diagnostics) {
  const skills = new Map(); // id -> { file, data }
  for (const { file, data } of entries) {
    if (skills.has(data.id)) {
      diagnostics.error(file, `duplicate skill ID ${data.id}; also defined in ${diagnostics.relative(skills.get(data.id).file)}`);
      continue;
    }
    skills.set(data.id, { file, data });
  }

  for (const [id, { file, data }] of skills) {
    (data.prerequisites ?? []).forEach((prerequisite, i) => {
      if (prerequisite === id) diagnostics.error(file, `skill ${id} lists itself as a prerequisite`, { field: `prerequisites[${i}]` });
      else if (!skills.has(prerequisite)) {
        diagnostics.error(file, `prerequisite ${prerequisite} is not a defined skill`, missingSkillOptions(prerequisite, { field: `prerequisites[${i}]` }));
      }
    });
  }

  // Cycle detection over the prerequisite graph (iterative DFS with colours).
  const WHITE = 0, GREY = 1, BLACK = 2;
  const colour = new Map([...skills.keys()].map((id) => [id, WHITE]));
  const reported = new Set();
  for (const start of skills.keys()) {
    if (colour.get(start) !== WHITE) continue;
    const stack = [[start, 0]];
    const trail = [start];
    colour.set(start, GREY);
    while (stack.length > 0) {
      const frame = stack[stack.length - 1];
      const [id, index] = frame;
      const prerequisites = (skills.get(id).data.prerequisites ?? []).filter((p) => skills.has(p));
      if (index < prerequisites.length) {
        frame[1] = index + 1;
        const next = prerequisites[index];
        const c = colour.get(next);
        if (c === WHITE) {
          colour.set(next, GREY);
          trail.push(next);
          stack.push([next, 0]);
        } else if (c === GREY) {
          const cycle = trail.slice(trail.indexOf(next)).concat(next);
          const key = [...cycle].sort().join(">");
          if (!reported.has(key)) {
            reported.add(key);
            diagnostics.error(skills.get(next).file, `prerequisite cycle: ${cycle.join(" -> ")}`);
          }
        }
      } else {
        colour.set(id, BLACK);
        trail.pop();
        stack.pop();
      }
    }
  }
  return skills;
}

/** Ladder entries must be unique, resolve to defined definitions, and belong to this skill. */
export function checkLadders(skills, definitions, diagnostics) {
  for (const [id, { file, data }] of skills) {
    if (!Array.isArray(data.ladder)) continue;
    const seen = new Set();
    data.ladder.forEach((entry, i) => {
      const key = `${entry.definition}@${entry.version}`;
      const field = `ladder[${i}]`;
      if (seen.has(key)) {
        diagnostics.error(file, `duplicate entry ${key}`, { field });
        return;
      }
      seen.add(key);
      const definition = definitions.get(key);
      if (!definition) {
        diagnostics.error(file, `definition ${key} is not defined`, { field, expected: "a file under content/exercises/" });
        return;
      }
      if (definition.data.skill !== id) {
        diagnostics.error(file, `definition ${key} belongs to skill ${definition.data.skill}, not ${id}`, { field });
      }
    });
  }
}
