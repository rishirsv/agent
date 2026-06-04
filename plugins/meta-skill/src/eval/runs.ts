import path from "node:path";
import { appendFact } from "../facts.ts";
import type { EvidenceReport } from "../models.ts";
import { CliError, exists, projectPaths, readText, requirePortableSkill } from "../project.ts";
import { buildProjectEvidenceReport, buildRunEvidenceReport, latestRunId } from "../report.ts";

export async function importFeedback(project: string, runId: string, feedbackFile: string): Promise<{ rows: number }> {
  const root = await requirePortableSkill(project);
  const p = projectPaths(root);
  const runRoot = path.join(p.runs, runId);
  if (!(await exists(runRoot))) throw new CliError(`run does not exist: ${runId}`);
  const input = await readText(path.resolve(feedbackFile));
  let rows = 0;
  for (const line of input.split(/\r?\n/).filter(Boolean)) {
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(line) as Record<string, unknown>;
    } catch {
      throw new CliError(`invalid feedback JSONL row: ${line.slice(0, 120)}`);
    }
    const caseId = parsed.case_id ? String(parsed.case_id) : undefined;
    await appendFact(runRoot, {
      type: "feedback_imported",
      run_id: runId,
      ...(caseId ? { case_id: caseId } : {}),
      source: String(parsed.source || "feedback-import"),
      payload: parsed
    });
    rows += 1;
  }
  return { rows };
}

export async function listRuns(project: string): Promise<string[]> {
  const report = await buildProjectEvidenceReport(project);
  return (report.runs || []).map((row) => row.id);
}

export async function openRun(project: string, runId?: string, caseId?: string): Promise<{ runId: string; data: EvidenceReport }> {
  const root = await requirePortableSkill(project);
  const selected = runId || (await latestRunId(root));
  if (!selected) throw new CliError("no runs found; run `meta-skill run <project>` first");
  const runRoot = path.join(projectPaths(root).runs, selected);
  if (!(await exists(runRoot))) throw new CliError(`run does not exist: ${selected}`);
  return { runId: selected, data: await buildRunEvidenceReport(runRoot, { caseId }) };
}
