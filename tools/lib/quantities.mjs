// The pilot quantity model (specs/001 data-model.md "Quantity model").
// Registries and definitions name quantities; this module is the one place that knows how
// concrete values relate to them. A box is { quantity: [min, max] } with integer bounds.
import { range } from "./diagnostics.mjs";

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
    infeasible(box) {
      return `no operand pair within ${range(...box.operand)} has a sum within ${range(...box.sum)}`;
    },
  },
  "unknown-addend": {
    // specs/009: x + a = b. a is the addend, b the total, and x = b - a the unknown.
    derive({ a, b }) {
      return { addend: [a, a], total: [b, b], unknown: [b - a, b - a] };
    },
    feasible(box) {
      const { addend, unknown, total } = box;
      if (!addend || !unknown || !total) return true;
      return addend[0] + unknown[0] <= total[1] && total[0] <= addend[1] + unknown[1];
    },
    infeasible(box) {
      return `no addend within ${range(...box.addend)} and unknown within ${range(...box.unknown)} give a total within ${range(...box.total)}`;
    },
  },
  "unknown-factor": {
    // specs/010: ax = b. a is the factor, b the product, and x = b / a the unknown (a whole number when b is a multiple).
    derive({ a, b }) {
      const x = a !== 0 && b % a === 0 ? b / a : undefined;
      return { factor: [a, a], product: [b, b], ...(x === undefined ? {} : { unknown: [x, x] }) };
    },
    feasible(box) {
      // Products of whole numbers leave gaps (factor 3, unknown 2–3 gives only 6 and 9), so comparing the bounds is
      // not enough: look for one factor with a whole unknown in range whose product falls in range (PR 64 review).
      const { factor, unknown, product } = box;
      if (!factor || !unknown || !product) return true;
      for (let f = factor[0]; f <= factor[1]; f++) {
        if (f <= 0) {
          if (f === 0 && product[0] <= 0 && 0 <= product[1] && unknown[0] <= unknown[1]) return true;
          continue;
        }
        const low = Math.max(unknown[0], Math.ceil(product[0] / f));
        const high = Math.min(unknown[1], Math.floor(product[1] / f));
        if (low <= high) return true;
      }
      return false;
    },
    infeasible(box) {
      return `no factor within ${range(...box.factor)} and unknown within ${range(...box.unknown)} give a product within ${range(...box.product)}`;
    },
    /** A fixed ax = b needs a positive factor and a product it divides exactly, or x is not a whole number (PR 64 review). */
    unsolvable({ a, b }) {
      if (!(a > 0)) return `ax = b needs a factor a greater than 0, but a is ${a}`;
      if (!(b > 0) || b % a !== 0) return `ax = b needs b to be a times a whole number greater than 0, but ${a}x = ${b} gives x = ${b}/${a}`;
      return undefined;
    },
  },
};

RELATIONS["two-step"] = {
  // specs/011: ax + c = b. a is the factor, c the addend, b the total, and x = (b - c) / a the unknown.
  derive({ a, b, c }) {
    const box = { factor: [a, a], total: [b, b] };
    if (!Number.isInteger(c)) return box;
    box.addend = [c, c];
    if (a !== 0 && (b - c) % a === 0) box.unknown = [(b - c) / a, (b - c) / a];
    return box;
  },
  feasible(box) {
    // As for unknown-factor, products leave gaps: look for one factor and addend with a whole unknown in range.
    const { factor, addend, unknown, total } = box;
    if (!factor || !addend || !unknown || !total) return true;
    for (let f = Math.max(1, factor[0]); f <= factor[1]; f++) {
      for (let c = addend[0]; c <= addend[1]; c++) {
        const low = Math.max(unknown[0], Math.ceil((total[0] - c) / f));
        const high = Math.min(unknown[1], Math.floor((total[1] - c) / f));
        if (low <= high) return true;
      }
    }
    return false;
  },
  infeasible(box) {
    return `no factor within ${range(...box.factor)}, addend within ${range(...box.addend)}, and unknown within ${range(...box.unknown)} give a total within ${range(...box.total)}`;
  },
  /** A fixed ax + c = b needs integers a, b, c with a above 0 and a whole-number x of at least 1. */
  unsolvable({ a, b, c }) {
    if (!Number.isInteger(c)) return "ax + c = b needs c, the number added to ax, as an integer";
    if (!(a > 0)) return `ax + c = b needs a factor a greater than 0, but a is ${a}`;
    if (!(b - c > 0) || (b - c) % a !== 0) return `ax + c = b needs b − c to be a times a whole number greater than 0, but ${a}x + ${c} = ${b} gives x = ${b - c}/${a}`;
    return undefined;
  },
};

export const PILOT_RELATION = "sum-of-two-operands";


/** The relation that produces each question form a validator judges (specs/009); the registry schema lists the forms. */
export const FORM_RELATIONS = {
  addition: "sum-of-two-operands",
  "unknown-addend": "unknown-addend",
  "unknown-factor": "unknown-factor",
  "two-step": "two-step",
};

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

/** The message for a box the relation finds infeasible. */
export function infeasible(relation, box) {
  return RELATIONS[relation].infeasible(box);
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
