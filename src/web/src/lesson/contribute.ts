// The lesson's contribution links (specs/003 FR-017, research R10): the source file of the selected language, and a
// prepared public issue that names only the lesson's identity, version, language, and section, never learner data.

export const REPOSITORY = "https://github.com/MathKX/MathKX";

export function editUrl(lessonId: string, file: string): string {
  return `${REPOSITORY}/blob/main/content/lessons/${encodeURIComponent(lessonId)}/${encodeURIComponent(file)}`;
}

export function issueUrl(title: string, body: string): string {
  return `${REPOSITORY}/issues/new?${new URLSearchParams({ title, body }).toString()}`;
}
