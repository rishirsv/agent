import path from "node:path";
import { AppServerUnavailableError, appServerConfig, codexVersion } from "../app-server/client";
import { AppServerScenarioRunner } from "../app-server/runner";
import { lintProject } from "../lint";
import {
  CliError,
  appendJsonl,
  ensureDir,
  eventEnvelope,
  exists,
  nextSequencedId,
  projectPaths,
  relativePath,
  requirePortableSkill,
  touch,
  unavailableTokenUsage,
  utcNow,
  writeJson
} from "../project";
import { judgeRun } from "./judge";
import { classifyScenarioStatus, recordScenarioResult, runStatus } from "./results";
import { loadScenarios, writeRunScenarioSnapshots } from "./scenarios";
import { refreshRunEvidence } from "./runs";
import type { EvalRunOptions, RunFailureClassification } from "./types";
import type { EvalRunSource, EvalRunSourceKind } from "../models";

export async function runEval(options: EvalRunOptions): Promise<{ runId: string; runRoot: string; report: string; ok: boolean; status: "passed" | "needs_review" | "failed"; manualReviewRequired: boolean; failureClassifications: RunFailureClassification[] }> {
  if (options.appServerEndpoint) {
    throw new CliError("--app-server-endpoint is not supported yet; omit it to use the managed stdio App Server", 2);
  }

  const root = await requirePortableSkill(options.project);
  const p = projectPaths(root);
  if (!(await exists(p.evalManifest))) throw new CliError("eval workbench is missing; run `meta-skill eval init <project>` first");

  const preflight = await lintProject(root, { executeTests: false });
  if (preflight.failures.length) {
    throw new CliError(`lint failed before eval run:\n${preflight.failures.map((failure) => `- ${failure.message}`).join("\n")}`);
  }

  const scenarios = await loadScenarios(root, options.selector);
  if (!scenarios.length) throw new CliError("no scenarios selected");

  const runSourceKind = options.runSource || "working_payload";
  const runSourceConfig = evalRunSourceConfig(runSourceKind, root, p.releaseSkill);
  if (runSourceKind === "snapshot_payload") {
    if (!(await exists(path.join(p.releaseSkill, "SKILL.md")))) {
      throw new CliError("`--snapshot` requires .meta-skill/versions/release/skill/SKILL.md; run `meta-skill release <project>` first");
    }
  }

  const runId = await nextSequencedId(p.runs, options.label || runSourceConfig.defaultLabel);
  const runRoot = path.join(p.runs, runId);
  await ensureDir(runRoot);
  for (const file of ["events.jsonl", "results.jsonl", "tests.jsonl", "grades.jsonl", "feedback.jsonl"]) {
    await touch(path.join(runRoot, file));
  }

  const appServer = await appServerConfig(options.appServerEndpoint);
  const runnerVersion = await codexVersion();
  const runJson = {
    schema_version: 1,
    run_id: runId,
    created_at: utcNow(),
    status: "running",
    label: options.label || null,
    suite: "default",
    scenarios_path: "../../scenarios",
    scenarios: { selection: scenarios.map((scenario) => scenario.folder) },
    run_source: runSourceConfig.runSource,
    runner: {
      backend: "app_server",
      app_server: appServer,
      codex_version: runnerVersion,
      protocol: "generated-ts",
      sandbox: "read-only",
      approval_policy: "never",
      network_access: false,
      timeout_ms: 120000
    },
    orchestration: {
      mode: "thread_per_scenario",
      turn_count: null
    }
  };
  await writeJson(path.join(runRoot, "run.json"), runJson);
  await appendJsonl(path.join(runRoot, "events.jsonl"), eventEnvelope({ type: "run_started", run_id: runId, source: "meta-skill eval run", payload: runJson }));
  await writeRunScenarioSnapshots(runRoot, scenarios);

  const runner = options.scenarioRunner || new AppServerScenarioRunner();
  let hasFailures = false;
  const scenarioStatuses = new Set<string>();
  const failureClassifications = new Set<RunFailureClassification>();
  try {
    for (const scenario of scenarios) {
      await appendJsonl(path.join(runRoot, "events.jsonl"), eventEnvelope({ type: "scenario_started", run_id: runId, scenario_id: scenario.id, source: "meta-skill eval run", payload: { folder: scenario.folder, run_source: runSourceConfig.runSource } }));
      try {
        const result = await runner.run({ projectRoot: root, skillRoot: runSourceConfig.skillRoot, attachSkill: runSourceConfig.runSource.attached_skill, scenario, runSource: runSourceConfig.runSource, runId, runRoot, appServer });
        scenarioStatuses.add(result.status);
        const classification = classifyScenarioStatus(result.status);
        if (classification) {
          hasFailures = true;
          failureClassifications.add(classification);
        }
        await recordScenarioResult(runRoot, runId, scenario, runSourceConfig.runSource, result.status, result.token_usage, result.evidence_path, result.error, classification);
      } catch (error) {
        hasFailures = true;
        const message = error instanceof AppServerUnavailableError || error instanceof Error ? error.message : String(error);
        const classification: RunFailureClassification = error instanceof AppServerUnavailableError ? "app_server_unavailable" : "harness_unavailable";
        failureClassifications.add(classification);
        scenarioStatuses.add("errored");
        const evidencePath = relativePath(runRoot, path.join(runRoot, "scenarios", scenario.folder));
        const tokenUsage = unavailableTokenUsage("App Server execution failed before token metrics were available.");
        await recordScenarioResult(runRoot, runId, scenario, runSourceConfig.runSource, "errored", tokenUsage, evidencePath, message, classification);
        await appendJsonl(path.join(runRoot, "events.jsonl"), eventEnvelope({ type: "scenario_failed", run_id: runId, scenario_id: scenario.id, source: "app_server", payload: { run_source: runSourceConfig.runSource, error: message, failure_classification: classification, token_usage: tokenUsage } }));
      }
    }
  } finally {
    runner.close();
  }

  if (!options.noLint) {
    const lint = await lintProject(root, { runId });
    if (!lint.ok) {
      hasFailures = true;
      failureClassifications.add("lint_test_failure");
    }
  } else {
    await appendJsonl(path.join(runRoot, "tests.jsonl"), eventEnvelope({ type: "lint_skipped", run_id: runId, source: "meta-skill eval run", payload: { reason: "--no-lint" } }));
  }

  if (options.withJudges) {
    const judges = await (options.judgeRunner || judgeRun)({ project: root, runId, allJudges: true, allScenarios: true });
    if (!judges.ok) hasFailures = true;
    for (const classification of judges.failureClassifications || []) failureClassifications.add(classification);
    if (!judges.ok && !(judges.failureClassifications || []).length) failureClassifications.add("judge_failure");
  }

  const status = runStatus(hasFailures, scenarioStatuses);
  const ok = status === "passed";
  const manualReviewRequired = status === "needs_review";
  const sortedFailureClassifications = [...failureClassifications].sort();
  const finalRunJson = {
    ...runJson,
    status,
    completed_at: utcNow(),
    ok,
    manual_review_required: manualReviewRequired,
    failure_classifications: sortedFailureClassifications
  };
  await writeJson(path.join(runRoot, "run.json"), finalRunJson);
  await appendJsonl(path.join(runRoot, "events.jsonl"), eventEnvelope({ type: "run_completed", run_id: runId, source: "meta-skill eval run", payload: { ok, status, manual_review_required: manualReviewRequired, failure_classifications: finalRunJson.failure_classifications } }));
  const { report } = await refreshRunEvidence(root, runId);
  return { runId, runRoot, report, ok, status, manualReviewRequired, failureClassifications: sortedFailureClassifications };
}

function evalRunSourceConfig(kind: EvalRunSourceKind, projectRoot: string, releaseSkill: string): { skillRoot?: string; runSource: EvalRunSource; defaultLabel: string } {
  if (kind === "snapshot_payload") {
    return { skillRoot: releaseSkill, runSource: { kind, label: "Saved snapshot payload", skill_root: "../../../versions/release/skill", attached_skill: true }, defaultLabel: "saved-snapshot" };
  }
  if (kind === "no_skill") {
    return { runSource: { kind, label: "No skill", skill_root: null, attached_skill: false }, defaultLabel: "no-skill" };
  }
  return { skillRoot: projectRoot, runSource: { kind: "working_payload", label: "Working payload", skill_root: "../../../..", attached_skill: true }, defaultLabel: "working-payload" };
}
