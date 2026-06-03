import type { AppServerScenarioRunner } from "../app-server/runner";
import type { EvalRunSourceKind, ScenarioRecord } from "../models";

export interface EvalSelector {
  scenario?: string[];
  family?: string;
  topic?: string[];
}

export interface EvalRunOptions {
  project: string;
  selector: EvalSelector;
  label?: string;
  runSource?: EvalRunSourceKind;
  withJudges?: boolean;
  noLint?: boolean;
  appServerEndpoint?: string;
  scenarioRunner?: Pick<AppServerScenarioRunner, "run" | "close">;
  judgeRunner?: (options: JudgeOptions) => Promise<JudgeRunResult>;
}

export interface JudgeOptions {
  project: string;
  runId: string;
  judge?: string;
  allJudges?: boolean;
  scenario?: string;
  allScenarios?: boolean;
  judgeExecutor?: (input: JudgeExecutionInput) => Promise<Record<string, unknown>>;
}

export interface JudgeExecutionInput {
  projectRoot: string;
  judgeId: string;
  judgePrompt: string;
  scenario: ScenarioRecord;
  runSourceLabel: string;
  final: string;
}

export type RunFailureClassification =
  | "app_server_unavailable"
  | "harness_unavailable"
  | "judge_failure"
  | "lint_test_failure"
  | "scenario_failed";

export interface JudgeRunResult {
  annotations: number;
  ok: boolean;
  failureClassifications?: RunFailureClassification[];
}
