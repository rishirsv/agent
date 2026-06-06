import { promises as fs } from "node:fs";
import path from "node:path";
import { AppServerUnavailableError, appServerConfig } from "../app-server/client.ts";
import { AppServerEvalRunner } from "../app-server/runner.ts";
import { lintProject } from "../lint.ts";
import {
  CliError,
  copyPortablePayload,
  ensureDir,
  exists,
  nextSequencedId,
  projectPaths,
  requirePortableSkill
} from "../project.ts";
import { loadEvals } from "./evals.ts";
import type { EvalRunOptions } from "./types.ts";
import type { EvalRunSource, EvalRunSourceKind } from "../models.ts";

export async function runEval(options: EvalRunOptions): Promise<{ runId: string; runRoot: string; ok: boolean; errors: string[]; evals: string[] }> {
  const root = await requirePortableSkill(options.project);
  const p = projectPaths(root);
  if (!(await exists(p.evals))) throw new CliError("eval workbench is missing; run `meta-skill project init <project>` first");

  const preflight = await lintProject(root, { executeTests: false, evalSelector: options.selector });
  if (preflight.failures.length) {
    throw new CliError(`lint failed before run:\n${preflight.failures.map((failure) => `- ${failure.message}`).join("\n")}`);
  }

  const evals = await loadEvals(root, options.selector);
  if (!evals.length) throw new CliError("no evals selected");

  const runSourceKind = options.runSource || "working_payload";
  const runSourceConfig = evalRunSourceConfig(runSourceKind);
  const runId = await nextSequencedId(p.runs, options.label || runSourceConfig.defaultLabel);
  const runRoot = path.join(p.runs, runId);
  await ensureDir(runRoot);
  const appServer = await appServerConfig();

  if (runSourceKind === "working_payload") {
    await copyPortablePayload(root, path.join(runRoot, "payload"));
  }

  const runner =
    options.evalRunner ||
    new AppServerEvalRunner({
      turnTimeoutMs: options.turnTimeoutMs,
      maxTraceEvents: options.traceBufferEvents
    });
  const errors: string[] = [];
  const completedEvals: string[] = [];
  try {
    for (const item of evals) {
      const evalRoot = path.join(runRoot, "evals", item.folder);
      await ensureDir(evalRoot);
      await Promise.all([
        fs.copyFile(path.join(item.path, "task.md"), path.join(evalRoot, "task.md")),
        fs.copyFile(path.join(item.path, "criteria.json"), path.join(evalRoot, "criteria.json"))
      ]);
      const fixtures = path.join(item.path, "fixtures");
      if (await exists(fixtures)) await fs.cp(fixtures, path.join(evalRoot, "fixtures"), { recursive: true });
      try {
        const skillRoot = runSourceKind === "working_payload" ? path.join(runRoot, "payload") : undefined;
        await runner.run({ projectRoot: root, skillRoot, skill_activation: runSourceConfig.runSource.skill_activation, eval: { ...item, path: evalRoot }, runSource: runSourceConfig.runSource, runId, runRoot, appServer });
      } catch (error) {
        const message = error instanceof AppServerUnavailableError || error instanceof Error ? error.message : String(error);
        errors.push(message);
      }
      completedEvals.push(item.folder);
    }
  } finally {
    runner.close();
  }

  if (!options.noLint) {
    const lint = await lintProject(root, { evalSelector: options.selector });
    if (!lint.ok) errors.push("lint checks recorded non-passing observations");
  }

  return { runId, runRoot, ok: errors.length === 0, errors, evals: completedEvals };
}

function evalRunSourceConfig(kind: EvalRunSourceKind): { runSource: EvalRunSource; defaultLabel: string } {
  if (kind === "no_skill") {
    return { runSource: { kind, label: "No skill", skill_root: null, skill_activation: "none" }, defaultLabel: "no-skill" };
  }
  return { runSource: { kind: "working_payload", label: "Working payload", skill_root: "payload", skill_activation: "forced" }, defaultLabel: "working-payload" };
}
