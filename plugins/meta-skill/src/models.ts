export type CaseTypeCode = "R" | "F" | "G";

export type CaseType =
  | "regression"
  | "failure_mode"
  | "gate";

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

export interface RunTokenUsageSummary {
  input_tokens: number | null;
  output_tokens: number | null;
  total_tokens: number | null;
  case_count: number;
  unavailable_case_count: number;
}

export interface EvalManifest {
  schema_version: 1;
  skill_name: string;
  suite: {
    name: string;
    description?: string;
  };
  cases: {
    path: "cases";
  };
  defaults: {
    runner: "app_server";
    run_source: EvalRunSourceKind;
    timeout_ms: number;
  };
}

export interface CaseFixture {
  path: string;
  description?: string;
}

export interface CaseMetadata {
  title: string;
  topics?: string[];
  capability?: string;
  fixtures?: CaseFixture[];
  metadata?: Record<string, unknown>;
}

export interface CaseCriteria {
  what_it_tests?: string;
  expected_behavior: string;
  assertions: string[];
  tests?: string[];
  judges?: Array<{
    id: string;
    threshold?: {
      overall_min?: number;
      dimensions?: Record<string, number>;
    };
  }>;
  rubric?: string;
}

export interface CaseRecord {
  folder: string;
  id: string;
  path: string;
  type: CaseType;
  metadata: CaseMetadata;
  criteria: CaseCriteria;
  task: string;
  turns: Array<{ content: string }>;
}

export interface TestManifest {
  schema_version: 1;
  tests: Array<{
    id: string;
    kind: "unit" | "eval";
    command: string;
    grader?: string;
    description?: string;
  }>;
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
    kind: "unit" | "eval";
    status: "passed" | "failed" | "skipped";
    command?: string;
    output?: string;
  }>;
  annotations?: number;
}

export interface EvidenceRef {
  path: string;
  line?: number;
}

export type FactKind =
  | "run_started"
  | "payload_frozen"
  | "case_defined"
  | "case_trial_finished"
  | "check_observed"
  | "feedback_imported"
  | "decision_recorded"
  | "run_finished";

export interface FactRow {
  type: FactKind;
  run_id: string;
  case_id?: string;
  created_at: string;
  source: string;
  payload: Record<string, unknown>;
}

export interface CheckRef {
  kind: "test" | "judge";
  id: string;
}

export interface MissingCheck {
  case_id: string;
  checks: CheckRef[];
}

export interface ReportError {
  case_id?: string;
  message: string;
  classification?: string;
  evidence: EvidenceRef;
}

export interface ReportObservation {
  kind: "test" | "judge" | "feedback";
  id: string;
  outcome?: string;
  evidence: EvidenceRef;
}

export interface ReportCase {
  id: string;
  folder: string;
  title?: string;
  checks: CheckRef[];
  observations: ReportObservation[];
  final?: EvidenceRef;
  rpc?: EvidenceRef;
  usage?: TokenUsage;
}

export interface EvidenceReport {
  subject: { kind: "project" | "run" | "case"; id?: string };
  runs?: Array<{ id: string; label?: string | null; created_at?: string; finished_at?: string; case_count: number }>;
  missing: MissingCheck[];
  errors: ReportError[];
  usage: RunTokenUsageSummary;
  cases: ReportCase[];
  decisions: Array<{ decision: string; evidence: EvidenceRef; payload: Record<string, unknown> }>;
}
