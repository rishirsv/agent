import { promises as fs } from "node:fs";
import path from "node:path";
import { AppServerUnavailableError, appServerConfig, codexVersion } from "../app-server/client.ts";
import { AppServerCaseRunner } from "../app-server/runner.ts";
import { appendFact } from "../facts.ts";
import { lintProject } from "../lint.ts";
import { buildRunEvidenceReport } from "../report.ts";
import {
  CliError,
  copyPortablePayload,
  ensureDir,
  exists,
  nextSequencedId,
  projectPaths,
  relativePath,
  requirePortableSkill,
  unavailableTokenUsage
} from "../project.ts";
import { judgeRun } from "./judge.ts";
import { loadCases } from "./cases.ts";
import type { EvalRunOptions, RunFailureClassification } from "./types.ts";
import type { EvalRunSource, EvalRunSourceKind } from "../models.ts";

export async function runEval(options: EvalRunOptions): Promise<{ runId: string; runRoot: string; ok: boolean; errors: string[] }> {
  if (options.appServerEndpoint) {
    throw new CliError("--app-server-endpoint is not supported yet; omit it to use the managed stdio App Server", 2);
  }

  const root = await requirePortableSkill(options.project);
  const p = projectPaths(root);
  if (!(await exists(p.evalManifest))) throw new CliError("eval workbench is missing; run `meta-skill project init <project>` first");

  const preflight = await lintProject(root, { executeTests: false });
  if (preflight.failures.length) {
    throw new CliError(`lint failed before run:\n${preflight.failures.map((failure) => `- ${failure.message}`).join("\n")}`);
  }

  const cases = await loadCases(root, options.selector);
  if (!cases.length) throw new CliError("no cases selected");

  const runSourceKind = options.runSource || "working_payload";
  const runSourceConfig = evalRunSourceConfig(runSourceKind);
  const runId = await nextSequencedId(p.runs, options.label || runSourceConfig.defaultLabel);
  const runRoot = path.join(p.runs, runId);
  await ensureDir(runRoot);

  const appServer = await appServerConfig(options.appServerEndpoint);
  const runnerVersion = await codexVersion();
  await appendFact(runRoot, {
    type: "run_started",
    run_id: runId,
    source: "meta-skill run",
    payload: {
      label: options.label || null,
      suite: "default",
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
      }
    }
  });

  if (runSourceKind === "working_payload") {
    const files = await copyPortablePayload(root, path.join(runRoot, "payload"));
    await appendFact(runRoot, { type: "payload_frozen", run_id: runId, source: "meta-skill run", payload: { path: "payload", files } });
  }

  const runner = options.caseRunner || new AppServerCaseRunner();
  const errors: string[] = [];
  try {
    for (const item of cases) {
      const caseRoot = path.join(runRoot, "cases", item.folder);
      await ensureDir(caseRoot);
      await fs.copyFile(path.join(item.path, "case.md"), path.join(caseRoot, "case.md"));
      await appendFact(runRoot, {
        type: "case_defined",
        run_id: runId,
        case_id: item.id,
        source: "meta-skill run",
        payload: {
          id: item.id,
          folder: item.folder,
          title: item.metadata.title,
          type: item.type,
          topics: item.metadata.topics || [],
          tests: item.criteria.tests || [],
          judges: (item.criteria.judges || []).map((judge) => judge.id),
          case_path: path.join("cases", item.folder, "case.md")
        }
      });
      try {
        const skillRoot = runSourceKind === "working_payload" ? path.join(runRoot, "payload") : undefined;
        const result = await runner.run({ projectRoot: root, skillRoot, skill_activation: runSourceConfig.runSource.skill_activation, case: { ...item, path: caseRoot }, runSource: runSourceConfig.runSource, runId, runRoot, appServer });
        await appendFact(runRoot, {
          type: "case_trial_finished",
          run_id: runId,
          case_id: item.id,
          source: "meta-skill run",
          payload: {
            run_source: runSourceConfig.runSource,
            execution: result.execution_status,
            evidence_path: result.evidence_path,
            final_path: relativePath(runRoot, result.final_path),
            rpc_path: relativePath(runRoot, result.rpc_path),
            thread_id: result.thread_id || null,
            turn_ids: result.turn_ids,
            usage: result.token_usage
          }
        });
      } catch (error) {
        const message = error instanceof AppServerUnavailableError || error instanceof Error ? error.message : String(error);
        const classification: RunFailureClassification = error instanceof AppServerUnavailableError ? "app_server_unavailable" : "runner_unavailable";
        errors.push(message);
        await appendFact(runRoot, {
          type: "case_trial_finished",
          run_id: runId,
          case_id: item.id,
          source: "meta-skill run",
          payload: {
            run_source: runSourceConfig.runSource,
            execution: "errored",
            evidence_path: path.join("cases", item.folder),
            failure_classification: classification,
            error: message,
            usage: unavailableTokenUsage("App Server execution failed before token metrics were available.")
          }
        });
      }
    }
  } finally {
    runner.close();
  }

  if (!options.noLint) {
    const lint = await lintProject(root, { runId });
    if (!lint.ok) errors.push("lint checks recorded non-passing observations");
  } else {
    await appendFact(runRoot, { type: "check_observed", run_id: runId, source: "meta-skill run", payload: { kind: "test", id: "lint", outcome: "skipped", reason: "--no-lint" } });
  }

  if (options.withJudges) {
    const judges = await (options.judgeRunner || judgeRun)({ project: root, runId, allJudges: true, allCases: true });
    if (!judges.ok) errors.push("judge checks recorded errors");
  }

  await appendFact(runRoot, { type: "run_finished", run_id: runId, source: "meta-skill run", payload: { errors: errors.length } });
  await buildRunEvidenceReport(runRoot);
  return { runId, runRoot, ok: errors.length === 0, errors };
}

function evalRunSourceConfig(kind: EvalRunSourceKind): { runSource: EvalRunSource; defaultLabel: string } {
  if (kind === "no_skill") {
    return { runSource: { kind, label: "No skill", skill_root: null, skill_activation: "none" }, defaultLabel: "no-skill" };
  }
  return { runSource: { kind: "working_payload", label: "Working payload", skill_root: "payload", skill_activation: "forced" }, defaultLabel: "working-payload" };
}
