import path from "node:path";
import type { EventEnvelope, RunIndexRow, RunReport } from "../models";
import { CliError, appendJsonl, eventEnvelope, exists, projectPaths, readText, requirePortableSkill } from "../project";
import { listRunSummariesForReport, openRunForReport } from "../reporting";

export async function importFeedback(project: string, runId: string, feedbackFile: string): Promise<{ rows: number; report: string }> {
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
    const envelope: EventEnvelope =
      parsed.schema_version === 1 && typeof parsed.type === "string"
        ? (parsed as unknown as EventEnvelope)
        : eventEnvelope({ type: "human_feedback", run_id: runId, source: String(parsed.source || "feedback-import"), payload: parsed });
    await appendJsonl(path.join(runRoot, "feedback.jsonl"), envelope);
    rows += 1;
  }
  const refreshed = await refreshRunEvidence(root, runId);
  return { rows, report: refreshed.report };
}

export async function listRuns(project: string): Promise<string[]> {
  const rows = await listRunSummaries(project);
  return rows.map((row) => row.run_id);
}

export async function listRunSummaries(project: string, options: { limit?: number; status?: string } = {}): Promise<RunIndexRow[]> {
  return listRunSummariesForReport(project, options, "refresh-if-missing");
}

export async function openRun(project: string, runId?: string): Promise<{ report: string; reportJson: string; runId: string; data: RunReport }> {
  return openRunForReport(project, runId, "refresh");
}

export async function refreshRunEvidence(project: string, runId: string): Promise<{ report: string; reportJson: string; runId: string; data: RunReport }> {
  return openRunForReport(project, runId, "refresh");
}
