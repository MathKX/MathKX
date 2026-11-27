// Shapes of the practice service (specs/002 contracts/api.md). No sum anywhere except a correct
// validation result, a revealing step, and the check summary's answer (specs/006).

export interface NamedVersion {
  name: string;
  version: number;
}

export interface Identity {
  definitionId: string;
  version: number;
  seed?: string;
}

/** How a question asks for its answer (specs/009 FR-003, specs/010): a + b = ?, x + a = b, or ax = b. */
export type QuestionForm = "addition" | "unknown-addend" | "unknown-factor" | "two-step";

export interface InstanceDto {
  identity: Identity;
  skill: string;
  a: number;
  b: number;
  /** The third number of ax + c = b (specs/011); absent for every other form. */
  c?: number;
  prompt: string;
  /** Absent on instances stored before spec 009, which are all addition. */
  form?: QuestionForm;
  representations: { help: string[]; explanation: string[] };
  generator?: NamedVersion;
  validator: NamedVersion;
  /** Lessons whose practice lists this definition, with whether each shows this instance's answer (specs/003).
   * Absent on instances stored before spec 003; never carries the sum. */
  lessons?: LessonDisclosure[];
}

export interface LessonDisclosure {
  id: string;
  discloses: boolean;
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

/** A lesson translation as authored, front matter included (specs/003 contracts/api.md). */
export interface LessonContentDto {
  id: string;
  version: number;
  language: string;
  markdown: string;
}

/** Steps for a lesson visual with authored values; the last step shows the total (lesson content, not an instance). */
export interface VisualStepsDto {
  type: string;
  a: number;
  b: number;
  steps: StepDto[];
}

export interface TenFrameExplorerDto {
  type: "ten-frame-explorer";
  states: { filled: number; partner: number }[];
}

export type BalanceTilt = "balanced" | "left-down" | "right-down";

/** One balance explorer state (specs/008): unit weights left on each pan, the tilt, and whether x stands alone and level. */
export interface BalanceState {
  left: number;
  right: number;
  tilt: BalanceTilt;
  solved: boolean;
}

/** One sharing explorer state (specs/010): weights in each group, weights not shared yet, kept, and solved. */
export interface SharingState {
  each: number;
  loose: number;
  kept: boolean;
  solved: boolean;
}

/** One two-step explorer state (specs/011): loose weights beside the boxes, weights on the right, weights in each group, weights not shared yet, kept, and solved. */
export interface TwoStepState {
  left: number;
  right: number;
  each: number;
  loose: number;
  kept: boolean;
  solved: boolean;
}

export interface TwoStepExplorerDto {
  type: "balance-two-step-explorer";
  a: number;
  c: number;
  b: number;
  states: TwoStepState[];
}

export interface SharingExplorerDto {
  type: "balance-sharing-explorer";
  a: number;
  b: number;
  states: SharingState[];
}

export interface BalanceExplorerDto {
  type: "balance-explorer";
  a: number;
  b: number;
  states: BalanceState[];
}

export interface LadderEntry {
  definition: string;
  version: number;
  description: Localized;
}

export interface SkillDto {
  id: string;
  /** The learner-facing name; never shown as or compared like an ID (specs/004). */
  name: Localized;
  prerequisites: string[];
  ladder: LadderEntry[];
  /** Keys (`id@version`) of every definition of this skill, ladder or not. */
  definitions: string[];
}

/** A variation's pool (specs/005 contracts/pool.md): every question with the smallest seed giving it; never a sum. */
export interface PoolDto {
  definition: string;
  version: number;
  /** In the generator's canonical order; `seed` is null for a fixed task. */
  questions: { seed: string | null; a: number; b: number; c?: number }[];
}

/** One question of a self-check (specs/006 contracts/api.md): an identity, never operands. `seed` is absent for a fixed task. */
export interface CheckQuestionDto {
  definition: string;
  version: number;
  seed?: string;
}

/** A self-check: its skill, title and scope per language, and its questions in order; never a sum. */
export interface CheckDto {
  id: string;
  version: number;
  skill: string;
  title: Localized;
  scope: Localized;
  questions: CheckQuestionDto[];
}

/** The answer to one question and the operands it belongs to; requested only by the check summary (specs/006). */
export interface AnswerDto {
  identity: Identity;
  a: number;
  b: number;
  c?: number;
  answer: { kind: "integer"; value: number };
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
  getSkills(): Promise<SkillDto[]>;
  getSkill(id: string): Promise<SkillDto>;
  getInstance(definitionId: string, version: number, seed: string | null): Promise<InstanceDto>;
  getPool(definitionId: string, version: number): Promise<PoolDto>;
  getStep(identity: Identity, kind: StepKind, index: number): Promise<StepDto>;
  validate(identity: Identity, originalText: string, submissionId: string): Promise<ValidationResponse>;
  getLessonContent(id: string, lang: string): Promise<LessonContentDto>;
  getVisualSteps(type: string, a: number, b: number): Promise<VisualStepsDto>;
  getTenFrameExplorer(): Promise<TenFrameExplorerDto>;
  getBalanceExplorer(a: number, b: number): Promise<BalanceExplorerDto>;
  getSharingExplorer(a: number, b: number): Promise<SharingExplorerDto>;
  getTwoStepExplorer(a: number, c: number, b: number): Promise<TwoStepExplorerDto>;
  /** The newest version of every check, by ID (specs/006). */
  getChecks(): Promise<CheckDto[]>;
  getCheck(id: string, version: number): Promise<CheckDto>;
  /** Only the check summary calls this, and only after the check. */
  getAnswer(identity: Identity): Promise<AnswerDto>;
}
