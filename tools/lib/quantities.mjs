// The pilot quantity model (specs/001 data-model.md "Quantity model").
// Registries and definitions name quantities; this module is the one place that knows how
// concrete values relate to them. A box is { quantity: [min, max] } with integer bounds.

export const RELATIONS = {
  "sum-of-two-operands": {
    // a and b are the operands; operand covers both; sum is a + b.
    derive({ a, b }) {
      return { operand: [Math.min(a, b), Math.max(a, b)], sum: [a + b, a + b] };
    },
    feasible(box) {
      const operand = box.operand;
      const sum = box.sum;
      if (!operand || !sum) return true;
      const low = 2 * operand[0];
      const high = 2 * operand[1];
      return low <= sum[1] && sum[0] <= high;
    },
  },
};

export const PILOT_RELATION = "sum-of-two-operands";

const isInteger = (v) => Number.isInteger(v);

/** Domain box of a generated definition: parameter bounds mapped onto the generator's quantities. */
export function domainBox(generatorEntry, parameters) {
  const box = {};
  for (const [name, bounds] of Object.entries(parameters)) {
    const declared = generatorEntry.parameters[name];
    if (!declared) continue;
    box[declared.quantity] = [bounds.min, bounds.max];
  }
  return box;
}

/**
 * Point box of concrete values (a fixed task's prompt, or a visual directive's attributes).
 * Every integer value becomes a quantity of its own; when a and b are integers the pilot
 * relation adds operand and sum.
 */
export function pointBox(values, relation = PILOT_RELATION) {
  const box = {};
  for (const [key, value] of Object.entries(values)) {
    if (isInteger(value)) box[key] = [value, value];
  }
  if (isInteger(values.a) && isInteger(values.b) && RELATIONS[relation]) {
    Object.assign(box, RELATIONS[relation].derive(values));
  }
  return box;
}

export function feasible(relation, box) {
  const r = RELATIONS[relation];
  return r ? r.feasible(box) : true;
}

/**
 * Checks that `inner` lies inside `supports` for every quantity `supports` declares.
 * Returns a list of violations: { quantity, supports: [min, max], actual?: [min, max] }.
 */
export function containment(supports, inner) {
  const violations = [];
  for (const [quantity, { min, max }] of Object.entries(supports)) {
    const actual = inner[quantity];
    if (!actual) violations.push({ quantity, supports: [min, max] });
    else if (actual[0] < min || actual[1] > max) violations.push({ quantity, supports: [min, max], actual });
  }
  return violations;
}
