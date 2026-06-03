import { promises as fs } from "node:fs";
import path from "node:path";
import type { EvalRunSource, LegacyEvalSide, ScenarioRecord } from "../models";
import { appendJsonl, eventEnvelope, exists } from "../project";
import type { RunFailureClassification } from "./types";

export async function recordScenarioResult(
  runRoot: string,
  runId: string,
  scenario: ScenarioRecord,
  runSource: EvalRunSource,
  status: string,
  tokenUsage: unknown,
  evidencePath: string,
  error?: string,
  failureClassification?: RunFailureClassification | null
): Promise<void> {
  await appendJsonl(
    path.join(runRoot, "results.jsonl"),
    eventEnvelope({
      type: "scenario_result",
      run_id: runId,
      scenario_id: scenario.id,
      source: "meta-skill eval run",
      payload: {
        run_source: runSource,
        status,
        scenario_folder: scenario.folder,
        evidence_path: evidencePath,
        token_usage: tokenUsage,
        failure_classification: failureClassification || null,
        error
      }
    })
  );
}

export async function attemptsInRun(runRoot: string, scenarioFolder: string): Promise<Array<{ runSource: EvalRunSource; evidencePath: string; legacySide?: LegacyEvalSide }>> {
  const scenarioRoot = path.join(runRoot, "scenarios", scenarioFolder);
  if (await exists(path.join(scenarioRoot, "final.md"))) return [{ runSource: await runSourceFor(runRoot), evidencePath: path.join("scenarios", scenarioFolder) }];
  const attempts: Array<{ runSource: EvalRunSource; evidencePath: string; legacySide?: LegacyEvalSide }> = [];
  // Legacy read-only support for runs that wrote scenarios/<scenario>/<side>/ evidence.
  for (const side of ["candidate", "release"] as const) {
    if (await exists(path.join(scenarioRoot, side))) attempts.push({ runSource: legacyRunSource(side), evidencePath: path.join("scenarios", scenarioFolder, side), legacySide: side });
  }
  return attempts.length ? attempts : [{ runSource: await runSourceFor(runRoot), evidencePath: path.join("scenarios", scenarioFolder) }];
}

async function runSourceFor(runRoot: string): Promise<EvalRunSource> {
  try {
    const run = JSON.parse(await fs.readFile(path.join(runRoot, "run.json"), "utf8")) as { run_source?: EvalRunSource; subject?: { id?: string } | string };
    if (run.run_source?.kind) return run.run_source;
    if (typeof run.subject === "string") return legacyRunSource(run.subject);
    if (run.subject?.id) return legacyRunSource(String(run.subject.id));
  } catch {
    // Missing run.json is handled by the caller's evidence checks.
  }
  return { kind: "working_payload", label: "Working payload", skill_root: "../../../..", attached_skill: true };
}

function legacyRunSource(value: string): EvalRunSource {
  if (value === "release") return { kind: "legacy_side", label: "Legacy saved snapshot side", skill_root: "../../../versions/release/skill", attached_skill: true };
  return { kind: "legacy_side", label: "Legacy working payload side", skill_root: "../../../..", attached_skill: true };
}

export function classifyScenarioStatus(status: string): RunFailureClassification | null {
  return status === "failed" || status === "errored" ? "scenario_failed" : null;
}

export function runStatus(hasFailures: boolean, scenarioStatuses: Set<string>): "passed" | "needs_review" | "failed" {
  if (hasFailures) return "failed";
  return scenarioStatuses.has("needs_review") ? "needs_review" : "passed";
}
