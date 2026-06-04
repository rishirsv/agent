import path from "node:path";
import { appendFact } from "./facts.ts";
import type { EvidenceRef } from "./models.ts";
import { CliError, exists, projectPaths, requirePortableSkill } from "./project.ts";

export async function recordDecision(options: {
  project: string;
  runId: string;
  decision: "accept" | "reject";
  evidence: EvidenceRef[];
  commit?: string;
}): Promise<{ runRoot: string }> {
  if (!options.evidence.length) throw new CliError("decide requires at least one --evidence <path[:line]> reference");
  if (options.decision === "accept" && !options.commit) throw new CliError("decide --accept requires --commit <sha>");

  const root = await requirePortableSkill(options.project);
  const p = projectPaths(root);
  const runRoot = path.join(p.runs, options.runId);
  if (!(await exists(runRoot))) throw new CliError(`eval run does not exist: ${options.runId}`);

  await appendFact(runRoot, {
    type: "decision_recorded",
    run_id: options.runId,
    source: "meta-skill decide",
    payload: {
      decision: options.decision,
      evidence: options.evidence,
      commit: options.commit || null
    }
  });
  return { runRoot };
}
