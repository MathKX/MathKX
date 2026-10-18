// Honest, descriptive activity labels derived from what the learner did.
// No percentages, no mastery claims.
import { practiceSets, checks } from './content/catalog.js';

export function lessonStatus(progress, lessonId) {
  return progress.lessons[lessonId]?.explored ? 'explored' : 'notStarted';
}

export function practiceStatus(progress, setId) {
  const set = practiceSets[setId];
  if (!set) return 'notStarted';
  const ids = new Set(set.questions.map((q) => q.id));
  const attempts = progress.attempts.filter((a) => ids.has(a.qid) && a.mode === 'practice');
  if (!attempts.length) return 'notStarted';
  const correct = attempts.filter((a) => a.correct);
  if (correct.some((a) => a.help?.length)) return 'practicedHelp';
  if (correct.length) return 'practicedIndependent';
  return 'practiced';
}

export function checkStatus(progress, checkId) {
  return progress.attempts.some((a) => a.mode === 'check' && a.set === checkId) ? 'checked' : 'notStarted';
}

export function statusColor(s) {
  return s === 'notStarted' ? 'neutral' : s === 'checked' || s === 'practicedIndependent' ? 'success' : 'info';
}

export { checks };
