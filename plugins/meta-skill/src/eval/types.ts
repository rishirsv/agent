import type { AppServerCaseRunner } from "../app-server/runner.ts";
import type { CaseRecord, EvalRunSourceKind } from "../models.ts";

export interface EvalSelector {
  case?: string[];
  type?: string;
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
  caseRunner?: Pick<AppServerCaseRunner, "run" | "close">;
  judgeRunner?: (options: JudgeOptions) => Promise<JudgeRunResult>;
}

export interface JudgeOptions {
  project: string;
  runId: string;
  judge?: string;
  allJudges?: boolean;
  case?: string;
  allCases?: boolean;
  judgeExecutor?: (input: JudgeExecutionInput) => Promise<Record<string, unknown>>;
}

export interface JudgeExecutionInput {
  projectRoot: string;
  judgeId: string;
  judgePrompt: string;
  case: CaseRecord;
  runSourceLabel: string;
  final: string;
}

export type RunFailureClassification =
  | "app_server_unavailable"
  | "runner_unavailable"
  | "judge_failure"
  | "lint_test_failure"
  | "case_error";

export interface JudgeRunResult {
  annotations: number;
  ok: boolean;
  failureClassifications?: RunFailureClassification[];
}
