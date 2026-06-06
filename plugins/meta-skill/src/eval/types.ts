import type { AppServerEvalRunner } from "../app-server/runner.ts";
import type { EvalRunSourceKind } from "../models.ts";

export interface EvalSelector {
  eval?: string[];
  topic?: string[];
}

export interface EvalRunOptions {
  project: string;
  selector: EvalSelector;
  label?: string;
  runSource?: EvalRunSourceKind;
  noLint?: boolean;
  turnTimeoutMs?: number;
  traceBufferEvents?: number;
  evalRunner?: Pick<AppServerEvalRunner, "run" | "close">;
}

export type RunFailureClassification =
  | "app_server_unavailable"
  | "runner_unavailable"
  | "eval_error";
