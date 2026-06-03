export type ScenarioFamilyCode = "R" | "F" | "T" | "G";

export type ScenarioFamily =
  | "regression"
  | "failure_mode"
  | "trigger"
  | "gate";

export type ScenarioType = "behavior" | "trigger" | "artifact" | "gate";

export type TokenMetric =
  | { available: true; value: number }
  | { available: false; reason: string };

export type LegacyEvalSide = "candidate" | "release";
export type EvalRunSourceKind = "working_payload" | "snapshot_payload" | "no_skill";

export interface EvalRunSource {
  kind: EvalRunSourceKind | string;
  label: string;
  skill_root?: string | null;
  attached_skill: boolean;
}

export interface TokenUsage {
  input_tokens: TokenMetric;
  output_tokens: TokenMetric;
  total_tokens: TokenMetric;
  cached_tokens?: TokenMetric;
  reasoning_tokens?: TokenMetric;
}

export type TokenAvailability = "present" | "partial" | "unavailable";
export type TokenSampleUnit = "turn" | "scenario";

export interface TokenStat {
  total: number;
  average: number;
  min: number;
  max: number;
}

export interface TokenUsageSummary {
  availability: TokenAvailability;
  sample_unit: TokenSampleUnit;
  sample_count: number;
  unavailable_count: number;
  input_tokens: TokenStat;
  output_tokens: TokenStat;
  total_tokens: TokenStat;
  cached_tokens?: TokenStat;
  reasoning_tokens?: TokenStat;
  unavailable_reasons: string[];
}

export interface TokenUsageTurn {
  turn_id: string;
  index: number;
  usage: TokenUsage;
  cumulative_usage?: TokenUsage;
  source_event: "thread/tokenUsage/updated";
}

export interface TokenUsageEvidence {
  schema_version: 1;
  availability: TokenAvailability;
  turns: TokenUsageTurn[];
  summary: TokenUsageSummary;
}

export interface RunTokenUsageSummary {
  by_run_source: Partial<Record<string, TokenUsageSummary>>;
  availability_counts: {
    available: number;
    unavailable: number;
  };
}

export interface EvalManifest {
  schema_version: 1;
  skill_name: string;
  suite: {
    name: string;
    description?: string;
  };
  scenarios: {
    path: string;
  };
  defaults: {
    runner: "app_server";
    run_source: EvalRunSourceKind;
    timeout_ms: number;
  };
}

export interface ScenarioMetadata {
  schema_version: 1;
  id: string;
  family: ScenarioFamily;
  type: ScenarioType;
  title: string;
  topics?: string[];
  include?: string[];
  setup?: string[];
  metadata?: Record<string, unknown>;
}

export interface ScenarioCriteria {
  schema_version: 1;
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

export interface ScenarioRecord {
  folder: string;
  id: string;
  path: string;
  metadata: ScenarioMetadata;
  criteria: ScenarioCriteria;
  task: string;
  turns: Array<{ content: string }>;
  evidence_basis?: "run_snapshot" | "legacy_current_project";
  snapshot_path?: string;
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

export interface EventEnvelope {
  schema_version: 1;
  type: string;
  run_id?: string;
  scenario_id?: string;
  /** Read-only compatibility for old run evidence written before eval subjects replaced sides. */
  side?: LegacyEvalSide;
  created_at: string;
  source: string;
  payload: Record<string, unknown>;
}

export interface RunReportAttempt {
  run_source: EvalRunSource;
  status: string;
  evidence_path: string;
  final_path?: string;
  final_preview?: string;
  token_usage?: TokenUsageSummary;
  failure_classification?: string | null;
  error?: string;
  raw?: Record<string, unknown>;
  /** Read-only compatibility marker for old scenario/<side>/ evidence. */
  legacy_side?: LegacyEvalSide;
}

export interface RunReportScenario {
  id: string;
  folder: string;
  title?: string;
  family?: string;
  type?: string;
  topics: string[];
  capability?: string | null;
  criteria?: {
    what_it_tests?: string;
    expected_behavior?: string;
    assertions: string[];
    tests: string[];
    judges: string[];
  };
  metadata?: Record<string, unknown>;
  evidence_basis: "run_snapshot" | "legacy_current_project" | "unavailable";
  attempts: RunReportAttempt[];
  status: string;
  unresolved: boolean;
}

export interface RunReadiness {
  status: "ready" | "needs_review" | "blocked";
  summary: string;
  blockers: string[];
  unresolved: number;
  basis: string;
}

export interface RunReport {
  schema_version: 2;
  generated_at: string;
  run: Record<string, unknown>;
  summary: {
    run_id: string;
    label?: string | null;
    status: string;
    created_at?: string;
    completed_at?: string;
    scenario_count: number;
    attempt_count: number;
    result_count: number;
    run_source: EvalRunSource;
    manual_review_required: boolean;
    failure_classifications: string[];
    assessment_status: "passed" | "needs_review" | "failed" | "unknown";
    unresolved_count: number;
    token_usage: RunTokenUsageSummary;
  };
  scenarios: RunReportScenario[];
  tests: EventEnvelope[];
  judges: EventEnvelope[];
  feedback: EventEnvelope[];
  artifacts: Array<{ scenario_id: string; path: string; kind: string; legacy_side?: LegacyEvalSide }>;
  readiness: RunReadiness;
}

export interface RunIndexRow {
  run_id: string;
  label?: string | null;
  status: string;
  created_at?: string;
  completed_at?: string;
  scenario_count: number;
  run_source: EvalRunSource;
  manual_review_required: boolean;
  failure_classifications: string[];
  assessment_status: string;
  unresolved_count: number;
  readiness_status: string;
}

export interface RunIndex {
  schema_version: 1;
  updated_at: string;
  runs: RunIndexRow[];
}
