import { promises as fs } from "node:fs";
import path from "node:path";
import type { LintReport, RunIndex, RunIndexRow, RunReadiness, RunReport } from "./models";
import { formatLintReport, lintProject } from "./lint";
import {
  buildRunReport,
  indexRowFromReport,
  indexRowFromRun,
  materializeEvalRunReport,
  normalizeRunIndexRowForRead,
  normalizeRunReportForRead,
  renderEvalReportHtml,
  renderReviewReportMarkdown,
  updateRunsIndex
} from "./report";
import { CliError, exists, parseSkillFrontmatter, projectPaths, readJson, requirePortableSkill, utcNow, writeText } from "./project";

export const REPORT_VIEWS = ["status", "runs", "eval", "review", "release", "full", "lint"] as const;
export type ReportView = (typeof REPORT_VIEWS)[number];
export type ReportRefreshPolicy = "read" | "refresh" | "refresh-if-missing";

export interface ReportAction {
  label: string;
  why: string;
  command: string | null;
}

export interface ReportReadiness extends Omit<RunReadiness, "status"> {
  status: RunReadiness["status"] | "unknown";
}

export interface MetaSkillReport {
  schema_version: 1;
  generated_at: string;
  project: {
    path: string;
    skill_name: string;
    has_workbench: boolean;
  };
  subject: {
    view: ReportView;
    run_id?: string;
    review_id?: string;
  };
  summary: {
    status: "ready" | "needs_review" | "blocked" | "unknown";
    headline: string;
    latest_run_id?: string;
    latest_review_id?: string;
    release_exists: boolean;
    run_count: number;
  };
  evidence: {
    lint?: LintReport;
    runs: RunIndexRow[];
    latest_eval_run?: {
      run_id: string;
      run_root: string;
      report_path?: string;
      html_path?: string;
      report: RunReport;
    };
    latest_review?: {
      review_id: string;
      review_root: string;
      review_path: string;
      report_md_path?: string;
      review: Record<string, unknown>;
    };
    release?: {
      exists: boolean;
      version_path?: string;
      version?: Record<string, unknown>;
      source_run_id?: string | null;
      payload_digest?: string;
      newer_run_exists?: boolean;
      freshness_note?: string;
    };
    plans: Array<{ plan_id: string; path: string; status?: string }>;
    sessions: Array<{ session_id: string; path: string; status?: string; decision?: string }>;
    evidence_errors: string[];
  };
  readiness: ReportReadiness;
  next_action: ReportAction;
}

export interface BuildReportOptions {
  project: string;
  view?: ReportView;
  runId?: string;
  reviewId?: string;
  refresh?: ReportRefreshPolicy;
  executeLint?: boolean;
}

export function isReportView(value: string): value is ReportView {
  return (REPORT_VIEWS as readonly string[]).includes(value);
}

export async function buildMetaSkillReport(options: BuildReportOptions): Promise<MetaSkillReport> {
  const root = await requirePortableSkill(options.project);
  const p = projectPaths(root);
  const view = options.view || "status";
  const refresh = options.refresh || "read";
  const frontmatter = await parseSkillFrontmatter(p.skillMd);
  const evidenceErrors: string[] = [];
  const lint = options.executeLint === false ? undefined : await lintProject(root, { executeTests: false });
  const runs = await listRunSummariesForReport(root, {}, refresh).catch((error) => {
    evidenceErrors.push(error instanceof Error ? error.message : String(error));
    return [] as RunIndexRow[];
  });
  const selectedRunId = options.runId || runs.at(-1)?.run_id;
  const latestEvalRun = selectedRunId
    ? await readEvalRunForReport(root, selectedRunId, refresh).catch((error) => {
        evidenceErrors.push(error instanceof Error ? error.message : String(error));
        return undefined;
      })
    : undefined;
  const latestReview = await readReviewForReport(root, options.reviewId).catch((error) => {
    evidenceErrors.push(error instanceof Error ? error.message : String(error));
    return undefined;
  });
  const release = await readReleaseForReport(root, runs).catch((error) => {
    evidenceErrors.push(error instanceof Error ? error.message : String(error));
    return { exists: false, newer_run_exists: false };
  });
  const plans = await listPlanStates(p.plans);
  const sessions = await listSessionStates(p.sessions);
  const readiness = readinessForProject(lint, latestEvalRun?.report, release, evidenceErrors);
  const nextAction = nextActionForProject(root, lint, runs, latestEvalRun?.report, release, readiness);

  return {
    schema_version: 1,
    generated_at: utcNow(),
    project: {
      path: root,
      skill_name: frontmatter.name || path.basename(root),
      has_workbench: await exists(p.meta)
    },
    subject: {
      view,
      run_id: selectedRunId,
      review_id: latestReview?.review_id
    },
    summary: {
      status: readiness.status,
      headline: readiness.summary,
      latest_run_id: selectedRunId,
      latest_review_id: latestReview?.review_id,
      release_exists: Boolean(release?.exists),
      run_count: runs.length
    },
    evidence: {
      lint,
      runs,
      latest_eval_run: latestEvalRun,
      latest_review: latestReview,
      release,
      plans,
      sessions,
      evidence_errors: evidenceErrors
    },
    readiness,
    next_action: nextAction
  };
}

export async function listRunSummariesForReport(project: string, options: { limit?: number; status?: string } = {}, refresh: ReportRefreshPolicy = "read"): Promise<RunIndexRow[]> {
  const root = await requirePortableSkill(project);
  const p = projectPaths(root);
  if (!(await exists(p.runs))) return [];
  let rows: RunIndexRow[];
  if (refresh === "refresh") {
    rows = (await refreshRunsIndex(p.runs)).runs;
  } else if (refresh === "refresh-if-missing") {
    rows = (await ensureRunsIndex(p.runs)).runs;
  } else {
    rows = await readRunsIndexWithoutWrites(p.runs);
  }
  rows = [...rows].sort((a, b) => String(a.run_id).localeCompare(String(b.run_id)));
  if (options.status) rows = rows.filter((row) => row.status === options.status || row.assessment_status === options.status || row.readiness_status === options.status);
  if (options.limit !== undefined) rows = rows.slice(Math.max(0, rows.length - options.limit));
  return rows;
}

export async function openRunForReport(project: string, runId?: string, refresh: ReportRefreshPolicy = "refresh"): Promise<{ report: string; reportJson: string; runId: string; data: RunReport }> {
  const root = await requirePortableSkill(project);
  const runs = await listRunSummariesForReport(root, {}, refresh === "read" ? "read" : "refresh-if-missing");
  const selected = runId || runs.at(-1)?.run_id;
  if (!selected) throw new CliError("no eval runs found; run `meta-skill eval run <project>` first");
  const p = projectPaths(root);
  const runRoot = path.join(p.runs, selected);
  if (!(await exists(runRoot))) throw new CliError(`run does not exist: ${selected}`);
  if (!(await exists(path.join(runRoot, "run.json")))) throw new CliError(`run is missing run.json: ${selected}`);
  if (refresh === "read") {
    const data = await readOrBuildRunReport(runRoot);
    return {
      report: path.join(runRoot, "report.html"),
      reportJson: path.join(runRoot, "report.json"),
      runId: selected,
      data
    };
  }
  return materializeEvalRunReport(runRoot);
}

export async function materializeReviewReport(reviewRoot: string, review: Record<string, unknown>): Promise<string> {
  const report = path.join(reviewRoot, "report.md");
  await writeText(report, renderReviewReportMarkdown(review));
  return report;
}

export function renderReportMarkdown(report: MetaSkillReport, view: ReportView = report.subject.view): string {
  if (view === "lint") return report.evidence.lint ? renderLintReportMarkdown(report.evidence.lint) : "No lint evidence available.";
  if (view === "runs") return renderRunListMarkdown(report.evidence.runs);
  if (view === "eval") return report.evidence.latest_eval_run ? renderEvalRunMarkdown(report.evidence.latest_eval_run.report) : "No eval runs found.";
  if (view === "review") return report.evidence.latest_review ? renderReviewReportMarkdown(report.evidence.latest_review.review) : "No review evidence found.";
  if (view === "release") return renderReleaseMarkdown(report);
  if (view === "full") {
    return [
      renderStatusMarkdown(report),
      report.evidence.lint ? `## Lint\n\n${renderLintReportMarkdown(report.evidence.lint)}` : "## Lint\n\nNo lint evidence available.",
      `## Eval Runs\n\n${renderRunListMarkdown(report.evidence.runs)}`,
      report.evidence.latest_eval_run ? `## Latest Eval\n\n${renderEvalRunMarkdown(report.evidence.latest_eval_run.report)}` : "## Latest Eval\n\nNo eval runs found.",
      report.evidence.latest_review ? `## Latest Review\n\n${renderReviewSummaryMarkdown(report.evidence.latest_review.review)}` : "## Latest Review\n\nNo review evidence found.",
      `## Release\n\n${renderReleaseMarkdown(report)}`,
      renderPlanSessionMarkdown(report)
    ].join("\n\n");
  }
  return renderStatusMarkdown(report);
}

export function renderReportHtml(report: MetaSkillReport, view: ReportView = report.subject.view): string {
  if (view === "eval" && report.evidence.latest_eval_run) return renderEvalReportHtml(report.evidence.latest_eval_run.report);
  const markdown = renderReportMarkdown(report, view);
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Meta Skill Report ${escapeHtml(report.project.skill_name)}</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 32px; color: #1f2937; }
    pre { white-space: pre-wrap; background: #f9fafb; border: 1px solid #e5e7eb; padding: 12px; border-radius: 4px; }
  </style>
</head>
<body>
  <pre>${escapeHtml(markdown)}</pre>
</body>
</html>`;
}

export function renderLintReportMarkdown(report: LintReport): string {
  return formatLintReport(report);
}

export function renderRunListMarkdown(runs: RunIndexRow[]): string {
  const normalizedRuns = runs.map(normalizeRunIndexRowForRead).filter((run) => run.run_id);
  if (!normalizedRuns.length) return "No eval runs found.";
  const header = "Run ID\tStatus\tCreated\tCompleted\tLabel\tSource\tScenarios\tManual Review\tFailures\tReadiness";
  const rows = normalizedRuns.map((run) =>
    [
      run.run_id,
      run.status,
      run.created_at || "",
      run.completed_at || "",
      run.label || "",
      run.run_source.label,
      String(run.scenario_count),
      run.manual_review_required ? "yes" : "no",
      run.failure_classifications.length ? run.failure_classifications.join(",") : "none",
      run.readiness_status
    ].join("\t")
  );
  return [header, ...rows].join("\n");
}

export function renderEvalRunMarkdown(report: RunReport): string {
  report = normalizeRunReportForRead(report);
  const lines = [
    `# Meta Skill Eval ${report.summary.run_id}`,
    "",
    "## At a Glance",
    `- Status: ${report.summary.status}${report.summary.status === "needs_review" ? " (unresolved; not pass proof)" : ""}`,
    `- Readiness: ${report.readiness.status}`,
    `- Scenarios: ${report.summary.scenario_count}`,
    `- Unresolved: ${report.summary.unresolved_count}`,
    `- Failure classifications: ${report.summary.failure_classifications.length ? report.summary.failure_classifications.join(", ") : "none"}`,
    `- Manual review required: ${report.summary.manual_review_required ? "yes" : "no"}`,
    "",
    "## Readiness",
    report.readiness.summary,
    "",
    "## Scenarios"
  ];
  if (!report.scenarios.length) lines.push("- No scenario rows recorded.");
  for (const scenario of report.scenarios) {
    lines.push(`- ${scenario.id} ${scenario.title || scenario.folder}: ${scenario.status}${scenario.unresolved ? " (unresolved)" : ""}`);
    for (const attempt of scenario.attempts) {
      const detail = [attempt.run_source.label, attempt.status, attempt.failure_classification || attempt.error || ""].filter(Boolean).join(" / ");
      lines.push(`  - ${detail}`);
    }
  }
  lines.push("", "## Evidence Paths");
  for (const artifact of report.artifacts) lines.push(`- ${artifact.scenario_id}: ${artifact.path}`);
  if (!report.artifacts.length) lines.push("- No artifact files recorded.");
  lines.push("", "## Tests, Judges, Feedback");
  lines.push(`- Tests: ${report.tests.length}`);
  lines.push(`- Judges: ${report.judges.length}`);
  lines.push(`- Feedback: ${report.feedback.length}`);
  return lines.join("\n");
}

function renderStatusMarkdown(report: MetaSkillReport): string {
  const findings = findingsFor(report);
  const lines = [
    `# Meta Skill Report: ${report.project.skill_name}`,
    "",
    "## At a Glance",
    `- Readiness: ${report.readiness.status}`,
    `- Lint: ${lintSummary(report.evidence.lint)}`,
    `- Latest eval run: ${report.summary.latest_run_id || "none"}`,
    `- Latest review: ${report.summary.latest_review_id || "none"}`,
    `- Release: ${report.evidence.release?.exists ? "exists" : "missing"}`,
    "",
    "## Recommended Next Step",
    `- ${report.next_action.label}`,
    `- Why: ${report.next_action.why}`,
    `- Command: ${report.next_action.command ? `\`${report.next_action.command}\`` : "none"}`,
    "",
    "## Findings",
    ...findings.map((finding) => `- ${finding}`),
    "",
    "## Evidence",
    `- Runs: ${report.evidence.runs.length}`,
    `- Plans: ${report.evidence.plans.length}`,
    `- Sessions: ${report.evidence.sessions.length}`
  ];
  if (!findings.length) lines.splice(lines.indexOf("## Findings") + 1, 0, "- No blocking findings.");
  return lines.join("\n");
}

function renderReleaseMarkdown(report: MetaSkillReport): string {
  const release = report.evidence.release;
  if (!release?.exists) return "No release snapshot exists.";
  return [
    `- Release snapshot: ${release.version_path || "unknown"}`,
    `- Source run: ${release.source_run_id || "none"}`,
    `- Payload digest: ${release.payload_digest || "unknown"}`,
    `- Freshness: ${release.freshness_note || "No newer run detected."}`
  ].join("\n");
}

function renderReviewSummaryMarkdown(review: Record<string, unknown>): string {
  const quality = review.quality as { score?: number; discovery?: number; implementation?: number; validation?: number } | undefined;
  const suggestions = Array.isArray(review.suggestions) ? review.suggestions : [];
  return [
    `- Quality: ${quality?.score ?? "unavailable"}%`,
    `- Discovery: ${quality?.discovery ?? "unavailable"}%`,
    `- Implementation: ${quality?.implementation ?? "unavailable"}%`,
    `- Validation: ${quality?.validation ?? "unavailable"}%`,
    `- Suggestions: ${suggestions.length}`
  ].join("\n");
}

function renderPlanSessionMarkdown(report: MetaSkillReport): string {
  return [`## Plans and Sessions`, `- Plans: ${report.evidence.plans.length}`, `- Sessions: ${report.evidence.sessions.length}`].join("\n");
}

function readinessForProject(lint: LintReport | undefined, run: RunReport | undefined, release: MetaSkillReport["evidence"]["release"] | undefined, errors: string[]): ReportReadiness {
  if (errors.length) return { status: "blocked", summary: "Some evidence could not be read.", blockers: errors, unresolved: 0, basis: "report evidence read" };
  if (lint?.failures.length) return { status: "blocked", summary: "Lint has blocking failures.", blockers: lint.failures.map((failure) => failure.message), unresolved: 0, basis: "lint" };
  if (run?.readiness.status === "blocked") return run.readiness;
  if (run?.readiness.status === "needs_review") return run.readiness;
  if (release?.newer_run_exists) return { status: "needs_review", summary: "A newer run exists after the release snapshot.", blockers: [], unresolved: 1, basis: "release version and eval runs" };
  if (lint?.warnings.length) return { status: "needs_review", summary: "Lint passed with warnings.", blockers: [], unresolved: lint.warnings.length, basis: "lint" };
  if (run?.readiness.status === "ready") return run.readiness;
  return { status: "unknown", summary: "Not enough evidence exists yet to classify readiness.", blockers: [], unresolved: 0, basis: "project state" };
}

function nextActionForProject(root: string, lint: LintReport | undefined, runs: RunIndexRow[], run: RunReport | undefined, release: MetaSkillReport["evidence"]["release"] | undefined, readiness: ReportReadiness): ReportAction {
  const project = shellPath(root);
  if (lint?.failures.length) return { label: "Fix lint failures", why: "Lint has blocking failures.", command: `meta-skill lint ${project}` };
  if (!runs.length) return { label: "Run evals", why: "No eval runs exist yet.", command: `meta-skill eval run ${project}` };
  if (run?.readiness.status === "blocked") return { label: "Inspect eval blockers", why: run.readiness.summary, command: `meta-skill report ${project} --view eval --run ${run.summary.run_id}` };
  if (run?.readiness.status === "needs_review") return { label: "Inspect latest eval evidence", why: run.readiness.summary, command: `meta-skill report ${project} --view eval --run ${run.summary.run_id}` };
  if (readiness.status === "ready" && !release?.exists && run) return { label: "Create release snapshot", why: "Latest run is ready and no release snapshot exists.", command: `meta-skill release ${project} --from-run ${run.summary.run_id}` };
  if (release?.exists && !release.newer_run_exists) return { label: "Package release", why: "Release snapshot exists and no newer run was detected.", command: `meta-skill package ${project} --source release` };
  return { label: "Inspect full report", why: "Evidence is available but needs human direction.", command: `meta-skill report ${project} --view full` };
}

async function readEvalRunForReport(root: string, runId: string, refresh: ReportRefreshPolicy): Promise<MetaSkillReport["evidence"]["latest_eval_run"]> {
  const p = projectPaths(root);
  const runRoot = path.join(p.runs, runId);
  const opened = await openRunForReport(root, runId, refresh === "read" ? "read" : refresh);
  return {
    run_id: opened.runId,
    run_root: runRoot,
    report_path: opened.reportJson,
    html_path: opened.report,
    report: opened.data
  };
}

async function readOrBuildRunReport(runRoot: string): Promise<RunReport> {
  const reportPath = path.join(runRoot, "report.json");
  if (await exists(reportPath)) return normalizeRunReportForRead(await readJson<RunReport>(reportPath));
  return buildRunReport(runRoot);
}

async function readReviewForReport(root: string, reviewId?: string): Promise<MetaSkillReport["evidence"]["latest_review"] | undefined> {
  const p = projectPaths(root);
  if (!(await exists(p.reviews))) return undefined;
  const selected = reviewId || (await latestDirectory(p.reviews));
  if (!selected) return undefined;
  const reviewRoot = path.join(p.reviews, selected);
  const reviewPath = path.join(reviewRoot, "review.json");
  if (!(await exists(reviewPath))) return undefined;
  return {
    review_id: selected,
    review_root: reviewRoot,
    review_path: reviewPath,
    report_md_path: (await exists(path.join(reviewRoot, "report.md"))) ? path.join(reviewRoot, "report.md") : undefined,
    review: await readJson<Record<string, unknown>>(reviewPath)
  };
}

async function readReleaseForReport(root: string, runs: RunIndexRow[]): Promise<MetaSkillReport["evidence"]["release"]> {
  const p = projectPaths(root);
  const versionPath = path.join(p.release, "version.json");
  if (!(await exists(versionPath))) return { exists: false, newer_run_exists: false };
  const version = await readJson<Record<string, unknown>>(versionPath);
  const sourceRunId = (version.source_run_id as string | null | undefined) || null;
  const latestRunId = runs.at(-1)?.run_id;
  const newerRunExists = Boolean(sourceRunId && latestRunId && sourceRunId !== latestRunId);
  return {
    exists: true,
    version_path: versionPath,
    version,
    source_run_id: sourceRunId,
    payload_digest: typeof version.payload_digest === "string" ? version.payload_digest : undefined,
    newer_run_exists: newerRunExists,
    freshness_note: newerRunExists ? "A newer run exists." : "No newer run detected."
  };
}

async function listPlanStates(root: string): Promise<Array<{ plan_id: string; path: string; status?: string }>> {
  return (await listJsonDir(root, "plan.json", "plan_id")).map((plan) => ({ plan_id: plan.id, path: plan.path, status: plan.status }));
}

async function listSessionStates(root: string): Promise<Array<{ session_id: string; path: string; status?: string; decision?: string }>> {
  const sessions = await listJsonDir(root, "session.json", "session_id");
  return sessions.map((session) => ({ session_id: session.id, path: session.path, status: session.status, decision: session.decision }));
}

async function listJsonDir(root: string, fileName: string, idKey: string): Promise<Array<{ id: string; path: string; status?: string; decision?: string }>> {
  if (!(await exists(root))) return [];
  const rows: Array<{ id: string; path: string; status?: string; decision?: string }> = [];
  for (const entry of (await fs.readdir(root, { withFileTypes: true })).filter((item) => item.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
    const itemPath = path.join(root, entry.name, fileName);
    if (!(await exists(itemPath))) continue;
    const data = await readJson<Record<string, unknown>>(itemPath);
    rows.push({
      id: String(data[idKey] || entry.name),
      path: itemPath,
      status: typeof data.status === "string" ? data.status : undefined,
      decision: typeof data.decision === "string" ? data.decision : undefined
    });
  }
  return rows;
}

async function ensureRunsIndex(runsRoot: string): Promise<RunIndex> {
  const indexPath = path.join(runsRoot, "index.json");
  if (await exists(indexPath)) return readJson<RunIndex>(indexPath);
  if (!(await exists(runsRoot))) return { schema_version: 1, updated_at: new Date(0).toISOString(), runs: [] };
  const dirs = (await fs.readdir(runsRoot, { withFileTypes: true })).filter((entry) => entry.isDirectory());
  for (const dir of dirs) {
    const runRoot = path.join(runsRoot, dir.name);
    if ((await exists(path.join(runRoot, "run.json"))) && !(await exists(path.join(runRoot, "report.json")))) {
      await materializeEvalRunReport(runRoot);
    }
  }
  return updateRunsIndex(runsRoot);
}

async function refreshRunsIndex(runsRoot: string): Promise<RunIndex> {
  if (!(await exists(runsRoot))) return { schema_version: 1, updated_at: new Date(0).toISOString(), runs: [] };
  const dirs = (await fs.readdir(runsRoot, { withFileTypes: true })).filter((entry) => entry.isDirectory());
  for (const dir of dirs) {
    const runRoot = path.join(runsRoot, dir.name);
    if (await exists(path.join(runRoot, "run.json"))) await materializeEvalRunReport(runRoot, { updateIndex: false });
  }
  return updateRunsIndex(runsRoot);
}

async function readRunsIndexWithoutWrites(runsRoot: string): Promise<RunIndexRow[]> {
  const indexPath = path.join(runsRoot, "index.json");
  if (await exists(indexPath)) return (await readJson<RunIndex>(indexPath)).runs.map(normalizeRunIndexRowForRead).filter((row) => row.run_id);
  if (!(await exists(runsRoot))) return [];
  const rows: RunIndexRow[] = [];
  for (const dir of (await fs.readdir(runsRoot, { withFileTypes: true })).filter((entry) => entry.isDirectory())) {
    const runRoot = path.join(runsRoot, dir.name);
    const reportPath = path.join(runRoot, "report.json");
    const runPath = path.join(runRoot, "run.json");
    if (await exists(reportPath)) rows.push(indexRowFromReport(await readJson<RunReport>(reportPath)));
    else if (await exists(runPath)) rows.push(indexRowFromRun(await readJson<Record<string, unknown>>(runPath), dir.name));
  }
  return rows;
}

async function latestDirectory(parent: string): Promise<string | undefined> {
  if (!(await exists(parent))) return undefined;
  return (await fs.readdir(parent, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b))
    .at(-1);
}

function findingsFor(report: MetaSkillReport): string[] {
  const findings: string[] = [];
  for (const failure of report.evidence.lint?.failures || []) findings.push(`Lint failure: ${failure.message}`);
  for (const warning of report.evidence.lint?.warnings || []) findings.push(`Lint warning: ${warning.message}`);
  for (const blocker of report.evidence.latest_eval_run?.report.readiness.blockers || []) findings.push(`Eval blocker: ${blocker}`);
  const unresolved = report.evidence.latest_eval_run?.report.readiness.unresolved || 0;
  if (unresolved) findings.push(`Eval unresolved: ${unresolved} scenario${unresolved === 1 ? "" : "s"} need review.`);
  if (report.evidence.release?.newer_run_exists) findings.push("Release: A newer run exists after the release snapshot.");
  for (const error of report.evidence.evidence_errors) findings.push(`Evidence error: ${error}`);
  return findings;
}

function lintSummary(lint: LintReport | undefined): string {
  if (!lint) return "not run";
  if (lint.failures.length) return `failed with ${lint.failures.length} failure${lint.failures.length === 1 ? "" : "s"}`;
  if (lint.warnings.length) return `passed with ${lint.warnings.length} warning${lint.warnings.length === 1 ? "" : "s"}`;
  return "passed";
}

function shellPath(target: string): string {
  return target.includes(" ") ? JSON.stringify(target) : target;
}

function escapeHtml(value: unknown): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
