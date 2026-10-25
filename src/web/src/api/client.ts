import {
  ApiError,
  type Identity,
  type InstanceDto,
  type LessonContentDto,
  type LessonDetail,
  type LessonSummary,
  type PracticeApi,
  type SkillDto,
  type StepDto,
  type StepKind,
  type TenFrameExplorerDto,
  type ValidationResponse,
  type VisualStepsDto,
} from "./types";

const NO_SEED = "-";

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(input, { ...init, headers: { accept: "application/json", ...(init?.headers ?? {}) } });
  } catch (error) {
    throw new ApiError(0, "unreachable", error instanceof Error ? error.message : String(error));
  }
  if (!response.ok) {
    let code = "error";
    let detail = response.statusText;
    try {
      const problem = (await response.json()) as { code?: string; detail?: string; title?: string };
      code = problem.code ?? problem.title ?? code;
      detail = problem.detail ?? detail;
    } catch {
      // not a problem-details body
    }
    throw new ApiError(response.status, code, detail);
  }
  return (await response.json()) as T;
}

const seedSegment = (identity: Identity) => identity.seed ?? NO_SEED;

/** The real client. No retries: a retry of a validation would duplicate a submission; the store decides. */
export const practiceApi: PracticeApi = {
  getLessons: () => request<LessonSummary[]>("/api/lessons"),
  getLesson: (id) => request<LessonDetail>(`/api/lessons/${encodeURIComponent(id)}`),
  getSkills: () => request<SkillDto[]>("/api/skills"),
  getSkill: (id) => request<SkillDto>(`/api/skills/${encodeURIComponent(id)}`),
  getInstance: (definitionId, version, seed) =>
    request<InstanceDto>(`/api/instances/${encodeURIComponent(definitionId)}/${version}/${seed ?? NO_SEED}`),
  getStep: (identity, kind: StepKind, index) =>
    request<StepDto>(`/api/instances/${encodeURIComponent(identity.definitionId)}/${identity.version}/${seedSegment(identity)}/steps/${kind}/${index}`),
  validate: (identity, originalText, submissionId) =>
    request<ValidationResponse>("/api/validations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ identity, artifact: { kind: "integer", originalText }, submissionId }),
    }),
  getLessonContent: (id, lang) => request<LessonContentDto>(`/api/lessons/${encodeURIComponent(id)}/content/${encodeURIComponent(lang)}`),
  getVisualSteps: (type, a, b) => request<VisualStepsDto>(`/api/visuals/${encodeURIComponent(type)}?a=${a}&b=${b}`),
  getTenFrameExplorer: () => request<TenFrameExplorerDto>("/api/visuals/ten-frame-explorer"),
};

/** A fresh seed from the platform's cryptographic source: seed selection, not generation; never a secret. */
export function newSeed(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  let value = 0n;
  for (const byte of bytes) value = (value << 8n) | BigInt(byte);
  return value.toString(10);
}
