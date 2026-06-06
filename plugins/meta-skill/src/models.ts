export type EvalRunSourceKind = "working_payload" | "no_skill";
export type SkillActivation = "forced" | "none" | "discoverable";

export interface EvalRunSource {
  kind: EvalRunSourceKind;
  label: string;
  skill_root?: string | null;
  skill_activation: SkillActivation;
}

export interface TokenUsage {
  input_tokens: number | null;
  output_tokens: number | null;
  total_tokens: number | null;
  cached_input_tokens?: number | null;
  reasoning_tokens?: number | null;
  model_context_window?: number | null;
  unavailable_reason: string | null;
}

export interface EvalFixture {
  path: string;
  description?: string;
}

export interface EvalMetadata {
  title: string;
  topics?: string[];
  capability?: string;
  fixtures?: EvalFixture[];
  metadata?: Record<string, unknown>;
}

export const EVAL_PHASES = ["Quality", "Implementation", "Validation"] as const;

export type EvalPhase = (typeof EVAL_PHASES)[number];

export interface EvalCriterion {
  criterion: string;
  phase?: EvalPhase;
  dimension?: string;
  question: string;
  evidence?: string;
}

export interface EvalCriteria {
  criteria: EvalCriterion[];
  tests?: string[];
}

export interface EvalRecord {
  folder: string;
  id: string;
  path: string;
  metadata: EvalMetadata;
  criteria: EvalCriteria;
  problemDescription: string;
  outputSpecification: string;
  task: string;
  turns: Array<{ content: string }>;
}

export interface Issue {
  severity: "failure" | "warning";
  message: string;
  path?: string;
}

export interface LintReport {
  ok: boolean;
  failures: Issue[];
  warnings: Issue[];
  tests: Array<{
    id: string;
    kind: "deterministic";
    status: "passed" | "failed" | "skipped";
    command?: string;
    output?: string;
  }>;
}
