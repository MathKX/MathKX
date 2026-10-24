// Shapes of the practice service (specs/002 contracts/api.md). No sum anywhere except a correct
// validation result and a revealing step.

export interface NamedVersion {
  name: string;
  version: number;
}

export interface Identity {
  definitionId: string;
  version: number;
  seed?: string;
}

export interface InstanceDto {
  identity: Identity;
  skill: string;
  a: number;
  b: number;
  prompt: string;
  representations: { help: string[]; explanation: string[] };
  generator?: NamedVersion;
  validator: NamedVersion;
}

export type ValidationStatus = "correct" | "incorrect" | "invalid-response" | "partially-correct" | "review-needed";

export interface ValidationResponse {
  status: ValidationStatus;
  code: string;
  values: Record<string, number | string>;
  validator: NamedVersion;
  submissionId?: string;
}

export type StepKind = "help" | "explanation";

export interface StepDto {
  kind: StepKind;
  representation: string;
  index: number;
  count: number;
  reveals: boolean;
  visual: Record<string, unknown>;
  text: { code: string; values: Record<string, number | string> };
}

export interface Localized {
  nb: string;
  en: string;
}

export interface PracticeEntry {
  definition: string;
  version: number;
  skill: string;
}

export interface LessonSummary {
  id: string;
  version: number;
  status: string;
  skills: string[];
  titles: Localized;
  practice: PracticeEntry[];
}

export interface LessonDetail extends LessonSummary {
  objectives: Localized;
  visuals: string[];
  translations: Localized;
}

export interface LadderEntry {
  definition: string;
  version: number;
  description: Localized;
}

export interface SkillDto {
  id: string;
  prerequisites: string[];
  ladder: LadderEntry[];
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** The calls the learner app makes; a test can substitute a fake. */
export interface PracticeApi {
  getLessons(): Promise<LessonSummary[]>;
  getLesson(id: string): Promise<LessonDetail>;
  getSkill(id: string): Promise<SkillDto>;
  getInstance(definitionId: string, version: number, seed: string | null): Promise<InstanceDto>;
  getStep(identity: Identity, kind: StepKind, index: number): Promise<StepDto>;
  validate(identity: Identity, originalText: string, submissionId: string): Promise<ValidationResponse>;
}
