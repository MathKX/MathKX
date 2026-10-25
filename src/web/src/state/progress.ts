// The progress view's derivation (specs/004 contracts/progress-view.md): pure functions over the guest record, the
// skill list, and the lesson list. Outcomes and counts are spec 002's derive and summarize, unchanged; this file only
// groups, orders, marks repeats, and counts lesson views.
import type { SkillDto } from "../api/types";
import type { Delivery } from "./observations";
import type { LessonView } from "./store";
import { derive, revealSource, summarize, TAG_ORDER, type Derived, type Summary, type Tag } from "./outcomes";

/** Definition key (`id@version`) → skill ID, from each skill's `definitions`. */
export function skillOfDefinition(skills: SkillDto[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const skill of skills) for (const key of skill.definitions) map.set(key, skill.id);
  return map;
}

const keyOf = (d: Delivery) => `${d.instance.definitionId}@${d.instance.version}`;

/** Record order, oldest first: by `startedAt`, then by position in the record. */
function chronological(deliveries: Delivery[]): Delivery[] {
  return deliveries
    .map((d, index) => ({ d, index }))
    .sort((x, y) => (x.d.startedAt < y.d.startedAt ? -1 : x.d.startedAt > y.d.startedAt ? 1 : x.index - y.index))
    .map(({ d }) => d);
}

/** IDs of deliveries that repeat an earlier one: the same definition, version, and operands in the same order. */
export function repeats(deliveries: Delivery[]): Set<string> {
  const seen = new Set<string>();
  const repeated = new Set<string>();
  for (const d of chronological(deliveries)) {
    const question = `${keyOf(d)} ${d.instance.a} ${d.instance.b}`;
    if (seen.has(question)) repeated.add(d.id);
    else seen.add(question);
  }
  return repeated;
}

const REVEAL_TAG = { explanation: "revealExplanation", counting: "revealCounting", help: "revealHelp", lesson: "revealLesson" } as const;

/**
 * The reveal tags of a delivery with no correct submission. `derive` emits reveal tags only when it reaches the
 * first correct submission; once there is one, it carries them and this returns `[]`.
 */
export function revealsWithoutCorrect(delivery: Delivery): Tag[] {
  if (delivery.events.some((e) => e.type === "submission" && e.status === "correct")) return [];
  const tags = new Set<Tag>();
  for (const e of delivery.events) {
    const source = revealSource(e);
    if (source) tags.add(REVEAL_TAG[source]);
  }
  return TAG_ORDER.filter((t) => tags.has(t));
}

/** The question practice can resume: the resumable or current delivery, not answered correctly and not skipped. */
export function inProgress(delivery: Delivery, resumableId: string | null): boolean {
  return delivery.id === resumableId && !delivery.events.some((e) => (e.type === "submission" && e.status === "correct") || e.type === "skipped");
}

export interface ListedQuestion {
  delivery: Delivery;
  derived: Derived;
  /** `derive`'s tags, then `revealsWithoutCorrect`. */
  tags: Tag[];
  repeat: boolean;
}

export interface LessonHistory {
  lessonId: string;
  views: number;
  /** The latest view's `at`. */
  last: string;
}

/** Per lesson: how many views, and the latest. A view records that the lesson was shown, nothing more. */
export function lessonHistory(views: LessonView[]): Map<string, LessonHistory> {
  const history = new Map<string, LessonHistory>();
  for (const { lessonId, at } of views) {
    const seen = history.get(lessonId);
    history.set(lessonId, seen ? { lessonId, views: seen.views + 1, last: at > seen.last ? at : seen.last } : { lessonId, views: 1, last: at });
  }
  return history;
}

/** What the progress view needs of a lesson: which skills it teaches. */
export interface LessonSkills {
  id: string;
  skills: string[];
}

export interface SkillGroup {
  /** `null` for "Other practice": definitions no skill lists. */
  skillId: string | null;
  /** Counted questions, newest first. */
  questions: ListedQuestion[];
  summary: Summary;
  repeatCount: number;
  /** Viewed lessons that teach the skill, latest view first; always empty for "Other practice". */
  lessons: LessonHistory[];
  /** The latest `startedAt` among its questions, or view among its lessons. */
  lastActivity: string;
}

/**
 * Groups the counted deliveries by the skill of their definition (outcome "none" is neither counted nor listed), and
 * puts each viewed lesson under every named skill it teaches. A skill with views and no practice is listed too.
 */
export function groupBySkill(deliveries: Delivery[], skills: SkillDto[], resumableId: string | null, views: LessonView[] = [], lessons: LessonSkills[] = []): SkillGroup[] {
  const skillOf = skillOfDefinition(skills);
  const repeated = repeats(deliveries);
  const byGroup = new Map<string | null, Delivery[]>();
  for (const d of chronological(deliveries)) {
    const group = skillOf.get(keyOf(d)) ?? null;
    byGroup.set(group, [...(byGroup.get(group) ?? []), d]);
  }
  const named = new Set(skills.map((s) => s.id));
  const lessonsBySkill = new Map<string, LessonHistory[]>();
  for (const history of lessonHistory(views).values()) {
    const lesson = lessons.find((l) => l.id === history.lessonId);
    for (const skillId of lesson?.skills ?? []) {
      if (named.has(skillId)) lessonsBySkill.set(skillId, [...(lessonsBySkill.get(skillId) ?? []), history]);
    }
  }
  for (const skillId of lessonsBySkill.keys()) if (!byGroup.has(skillId)) byGroup.set(skillId, []);

  const groups: SkillGroup[] = [];
  for (const [skillId, members] of byGroup) {
    const questions = members
      .map((delivery) => {
        const derived = derive(delivery, { resumable: delivery.id === resumableId });
        return { delivery, derived, tags: [...derived.tags, ...revealsWithoutCorrect(delivery)], repeat: repeated.has(delivery.id) };
      })
      .filter((q) => q.derived.outcome !== "none")
      .reverse();
    const viewed = skillId === null ? [] : [...(lessonsBySkill.get(skillId) ?? [])].sort((x, y) => (x.last < y.last ? 1 : x.last > y.last ? -1 : 0));
    if (questions.length === 0 && viewed.length === 0) continue;
    const latest = [questions[0]?.delivery.startedAt, viewed[0]?.last].filter((t): t is string => t !== undefined).sort().at(-1)!;
    groups.push({
      skillId,
      questions,
      summary: summarize(questions.map((q) => q.delivery), resumableId),
      repeatCount: questions.filter((q) => q.repeat).length,
      lessons: viewed,
      lastActivity: latest,
    });
  }
  return groups;
}

/** Skills by their latest activity (a question or a lesson view), newest first; "Other practice" last. */
export function skillOrder(groups: SkillGroup[]): SkillGroup[] {
  return [...groups].sort((x, y) => {
    if ((x.skillId === null) !== (y.skillId === null)) return x.skillId === null ? 1 : -1;
    return x.lastActivity < y.lastActivity ? 1 : x.lastActivity > y.lastActivity ? -1 : 0;
  });
}
