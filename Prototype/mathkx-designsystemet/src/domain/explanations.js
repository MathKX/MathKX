// Worked-explanation and visual-help step models. Every step carries the visual
// state, the equation and the text, all derived from the same instance values,
// so the picture, the notation and the words cannot disagree.

// `reveals` marks the steps that show the answer. Opening an explanation is not
// itself an answer reveal; reaching a revealing step is (exercise-experience.md:
// "make any answer reveal explicit").
const s = (visual, eq, nb, en, reveals = false) => ({ visual, eq, text: { nb, en }, reveals });

/** Index of the first step that shows the answer, or -1. */
export const firstRevealStep = (steps) => (steps ? steps.findIndex((x) => x.reveals) : -1);

/** Which representations a variant supports for these values. */
export function supports(model, q) {
  if (model === 'groups') return q.a + q.b <= 10 && q.a >= 1 && q.b >= 1;
  if (model === 'make-ten') return q.a <= 9 && q.b <= 9 && q.a + q.b > 10 && 10 - q.a <= q.b;
  if (model === 'balance') return q.a >= 1 && q.c > q.a && q.c <= 20;
  return false;
}

/** Visual help: support while trying. Never shows the result. */
export function helpSteps(model, q) {
  if (!supports(model, q)) return null;
  if (model === 'groups') return null; // groups help is its own interactive counting view
  if (model === 'make-ten') {
    const { a, b } = q; const need = 10 - a; const rest = b - need;
    return [
      s({ kind: 'make-ten', a, b, phase: 0 }, `${a} + ${b}`, `${a} i tierrammen. ${b} ved siden av.`, `${a} in the ten-frame. ${b} beside it.`),
      s({ kind: 'make-ten', a, b, phase: 1 }, `${a} + ${b} = ${a} + ${need} + ${rest}`, `${a} trenger ${need} for å bli 10. Del ${b} i ${need} og ${rest}.`, `${a} needs ${need} to make 10. Split ${b} into ${need} and ${rest}.`),
      s({ kind: 'make-ten', a, b, phase: 2 }, `10 + ${rest} = ?`, `Flytt ${need} inn i tierrammen. Nå er den full. Hvor mye er 10 og ${rest} til sammen?`, `Move ${need} into the ten-frame. Now it is full. What is 10 and ${rest} altogether?`),
    ];
  }
  if (model === 'balance') {
    const { a, c } = q;
    return [
      s({ kind: 'balance', a, c, phase: 0 }, `x + ${a} = ${c}`, `Vekten er i balanse: x og ${a} enere på venstre side veier like mye som ${c} enere på høyre side.`, `The balance is level: x and ${a} ones on the left weigh the same as ${c} ones on the right.`),
      s({ kind: 'balance', a, c, phase: 1 }, `x + ${a} − ${a} = ${c} − ${a}`, `Ta bort ${a} enere fra begge sider. Da er vekten fortsatt i balanse.`, `Remove ${a} ones from both sides. The balance stays level.`),
      s({ kind: 'balance', a, c, phase: 2 }, `x = ?`, 'Nå er x alene på venstre side. Hvor mange enere er igjen på høyre side?', 'Now x is alone on the left. How many ones are left on the right?'),
    ];
  }
  return null;
}

/** Worked explanation: the complete reasoning, including the answer. */
export function explanationSteps(model, q) {
  if (!supports(model, q)) return null;
  if (model === 'groups') {
    const { a, b } = q; const sum = a + b;
    return [
      s({ kind: 'groups', a, b, mode: 'separate' }, `${a} + ${b}`, `Den første gruppen har ${a} brikker. Den andre gruppen har ${b}.`, `The first group has ${a} counters. The second group has ${b}.`),
      s({ kind: 'groups', a, b, mode: 'together' }, `${a} + ${b}`, 'Pluss betyr at vi slår gruppene sammen til én gruppe.', 'Plus means we put the two groups together into one group.'),
      s({ kind: 'groups', a, b, mode: 'numbered' }, `${a} + ${b} = ${sum}`, `Vi teller alle brikkene: ${a} fra den første gruppen og videre ${b} til. Til sammen er det ${sum}.`, `We count all the counters: ${a} from the first group, then ${b} more. Altogether there are ${sum}.`, true),
    ];
  }
  if (model === 'make-ten') {
    const { a, b } = q; const need = 10 - a; const rest = b - need; const sum = a + b;
    return [
      s({ kind: 'make-ten', a, b, phase: 0 }, `${a} + ${b}`, `Start med ${a} i tierrammen og ${b} ved siden av.`, `Start with ${a} in the ten-frame and ${b} beside it.`),
      s({ kind: 'make-ten', a, b, phase: 1 }, `${a} + ${b} = ${a} + ${need} + ${rest}`, `${a} trenger ${need} for å bli 10, så vi deler ${b} i ${need} og ${rest}.`, `${a} needs ${need} to make 10, so we split ${b} into ${need} and ${rest}.`),
      s({ kind: 'make-ten', a, b, phase: 2 }, `${a} + ${need} + ${rest} = 10 + ${rest}`, `${a} + ${need} = 10. Tierrammen er full, og ${rest} er igjen ved siden av.`, `${a} + ${need} = 10. The ten-frame is full, with ${rest} left beside it.`),
      s({ kind: 'make-ten', a, b, phase: 3 }, `${a} + ${b} = ${a} + ${need} + ${rest} = 10 + ${rest} = ${sum}`, `10 og ${rest} er ${sum}. Derfor er ${a} + ${b} = ${sum}.`, `10 and ${rest} make ${sum}. So ${a} + ${b} = ${sum}.`, true),
    ];
  }
  if (model === 'balance') {
    const { a, c } = q; const x = c - a;
    return [
      s({ kind: 'balance', a, c, phase: 0 }, `x + ${a} = ${c}`, `Likhetstegnet betyr at sidene er like mye verdt, som en vekt i balanse.`, 'The equals sign means both sides are worth the same, like a level balance.'),
      s({ kind: 'balance', a, c, phase: 1 }, `x + ${a} − ${a} = ${c} − ${a}`, `Vi tar bort ${a} på begge sider. Når vi gjør det samme på begge sider, holder likheten.`, `We remove ${a} from both sides. Doing the same to both sides keeps them equal.`),
      s({ kind: 'balance', a, c, phase: 3 }, `x = ${x}`, `Nå står x alene, og det er ${x} enere på høyre side. Altså er x = ${x}.`, `Now x is alone, and there are ${x} ones on the right. So x = ${x}.`, true),
      // Phase 4 returns to the original balance with x replaced by its value.
      s({ kind: 'balance', a, c, phase: 4 }, `${x} + ${a} = ${c}`, `Sjekk: sett ${x} enere inn der x sto i den opprinnelige vekten. ${x} + ${a} = ${c}, og vekten er i balanse, så svaret stemmer.`, `Check: put ${x} ones where x was in the original balance. ${x} + ${a} = ${c}, and the balance is level, so the answer works.`, true),
    ];
  }
  return null;
}
