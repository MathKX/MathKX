// specs/004 contracts/progress-view.md "Derivation": grouping by skill, repeats, reveals without a correct
// answer, and order, checked against spec 002's derive and summarize applied to the same deliveries.
import { describe, expect, it } from "vitest";
import { derive, summarize } from "../src/state/outcomes";
import { groupBySkill, repeats, revealsWithoutCorrect, skillOfDefinition, skillOrder } from "../src/state/progress";
import {
  BONDS_DEFINITION, CROSSING, SKILLS, WITHIN_TEN, at, correct, delivery, ended, everyOutcome, guidanceOnly, incorrect, support,
  twoSkills, unknownDefinition, withRepeats,
} from "./records";

describe("skillOfDefinition", () => {
  it("maps every listed definition key to its skill", () => {
    const map = skillOfDefinition(SKILLS);
    expect(map.get(`${WITHIN_TEN}@1`)).toBe("numbers.addition-within-20");
    expect(map.get(`${BONDS_DEFINITION}@1`)).toBe("numbers.number-bonds-to-ten");
    expect(map.get(`${WITHIN_TEN}@2`)).toBeUndefined();
  });
});

describe("groupBySkill", () => {
  it("counts each skill exactly as summarize counts the same deliveries (SC-001)", () => {
    const record = [...everyOutcome(), ...twoSkills()];
    const groups = groupBySkill(record, SKILLS, null);
    const skillOf = skillOfDefinition(SKILLS);
    for (const group of groups) {
      const own = record.filter((d) => (skillOf.get(`${d.instance.definitionId}@${d.instance.version}`) ?? null) === group.skillId);
      expect(group.summary).toEqual(summarize(own, null));
    }
    const addition = groups.find((g) => g.skillId === "numbers.addition-within-20")!;
    expect(addition.summary.questions).toBe(14);
  });

  it("counts the nine questions of spec User Story 1 scenario 1 with their five outcomes", () => {
    const groups = groupBySkill(everyOutcome().slice(0, 9), SKILLS, null);
    expect(groups).toHaveLength(1);
    expect(groups[0]!.summary).toEqual({
      questions: 9,
      counts: { correctFirst: 4, correctWithVisualHelp: 2, correctAfterFeedback: 1, correctAfterExplanation: 1, skipped: 1 },
    });
  });

  it("neither counts nor lists a delivery with only unreadable input", () => {
    expect(groupBySkill(guidanceOnly(), SKILLS, null)).toEqual([]);
  });

  it("puts a definition no skill lists under Other practice", () => {
    const [group] = groupBySkill(unknownDefinition(), SKILLS, null);
    expect(group!.skillId).toBeNull();
    expect(group!.questions[0]!.delivery.instance).toMatchObject({ a: 2, b: 2 });
  });

  it("lists questions newest first, by start time and then record order", () => {
    const sameTime = [delivery({ id: "x", startedAt: at(5) }), delivery({ id: "y", startedAt: at(5) }), delivery({ id: "z", startedAt: at(1) })]
      .map((d) => ({ ...d, events: [correct(8)] }));
    const [group] = groupBySkill(sameTime, SKILLS, null);
    expect(group!.questions.map((q) => q.delivery.id)).toEqual(["y", "x", "z"]);
  });

  it("counts a question in progress as unfinished when it is the resumable one", () => {
    const current = delivery({ id: "now", startedAt: at(1), events: [] });
    expect(groupBySkill([current], SKILLS, null)).toEqual([]);
    const [group] = groupBySkill([current], SKILLS, "now");
    expect(group!.questions[0]!.derived.outcome).toBe("unfinished");
  });

  it("counts a definition under the skill that lists it now", () => {
    const moved = SKILLS.map((s) => ({ ...s, definitions: s.id === "numbers.number-bonds-to-ten" ? [`${WITHIN_TEN}@1`] : s.definitions.filter((k) => k !== `${WITHIN_TEN}@1`) }));
    const [group] = groupBySkill([delivery({ events: [correct(8)] })], moved, null);
    expect(group!.skillId).toBe("numbers.number-bonds-to-ten");
  });
});

describe("repeats", () => {
  it("marks only a later delivery with the same definition, version, and operands in order", () => {
    expect([...repeats(withRepeats())]).toEqual(["again"]);
    const [group] = groupBySkill(withRepeats(), SKILLS, null);
    expect(group!.repeatCount).toBe(1);
    expect(group!.questions.map((q) => [q.delivery.id, q.repeat])).toEqual([["again", true], ["swapped", false], ["first", false]]);
  });

  it("treats a different seed with the same operands as a repeat, and a different version or definition as new", () => {
    const record = [
      delivery({ id: "a", startedAt: at(1), a: 3, b: 7, seed: "1" }),
      delivery({ id: "b", startedAt: at(2), a: 3, b: 7, seed: "2" }),
      delivery({ id: "c", startedAt: at(3), a: 3, b: 7, version: 2 }),
      delivery({ id: "d", startedAt: at(4), a: 3, b: 7, definitionId: CROSSING }),
    ];
    expect([...repeats(record)]).toEqual(["b"]);
  });

  it("decides the earlier delivery by start time, not by record position", () => {
    const record = [delivery({ id: "late", startedAt: at(9), a: 3, b: 7 }), delivery({ id: "early", startedAt: at(1), a: 3, b: 7 })];
    expect([...repeats(record)]).toEqual(["late"]);
  });
});

describe("revealsWithoutCorrect", () => {
  it.each([
    ["lesson", [support("lesson-reveal"), ended], ["revealLesson"]],
    ["help", [support("visual-help-opened"), support("help-step", true), ended], ["revealHelp"]],
    ["explanation step", [support("explanation-open"), support("explanation-step", true), ended], ["revealExplanation"]],
    ["answer reveal", [support("answer-reveal"), incorrect(5)], ["revealExplanation"]],
    ["counting", [support("counting"), support("counting-complete"), ended], ["revealCounting"]],
    ["several", [support("lesson-reveal"), support("counting-complete"), support("help-step", true), ended], ["revealCounting", "revealHelp", "revealLesson"]],
  ] as const)("lists a %s reveal on a question never answered correctly", (_name, events, tags) => {
    const d = delivery({ events: [...events] });
    expect(derive(d).tags).toEqual([]); // derive emits reveal tags only at a correct submission
    expect(revealsWithoutCorrect(d)).toEqual(tags);
  });

  it("is empty when the question was answered correctly (derive carries the reveal) and without reveals", () => {
    const answered = delivery({ events: [support("lesson-reveal"), correct(8)] });
    expect(revealsWithoutCorrect(answered)).toEqual([]);
    expect(derive(answered).tags).toEqual(["revealLesson"]);
    expect(revealsWithoutCorrect(delivery({ events: [support("visual-help-opened"), support("help-step", false), ended] }))).toEqual([]);
  });

  it("adds the tags to the question list without changing outcome or counts", () => {
    const d = delivery({ events: [support("lesson-reveal"), ended] });
    const [group] = groupBySkill([d], SKILLS, null);
    expect(group!.questions[0]!.derived.outcome).toBe(derive(d).outcome);
    expect(group!.questions[0]!.tags).toEqual(["revealLesson"]);
    expect(group!.summary).toEqual(summarize([d], null));
  });
});

describe("skillOrder", () => {
  it("puts the skill with the latest activity first and Other practice last", () => {
    const record = [
      ...unknownDefinition().map((d) => ({ ...d, startedAt: at(30) })),
      delivery({ startedAt: at(1), events: [correct(8)] }),
      delivery({ definitionId: BONDS_DEFINITION, startedAt: at(10), a: 3, b: 7, events: [correct(10)] }),
    ];
    expect(skillOrder(groupBySkill(record, SKILLS, null)).map((g) => g.skillId)).toEqual(["numbers.number-bonds-to-ten", "numbers.addition-within-20", null]);
  });
});
