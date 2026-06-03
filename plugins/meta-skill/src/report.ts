import { promises as fs } from "node:fs";
import path from "node:path";
import type { EvalSide, EventEnvelope, RunComparison, RunIndex, RunIndexRow, RunReadiness, RunReport, RunReportScenario, RunReportSide } from "./models";
import { exists, readJson, readText, utcNow, writeJson, writeText } from "./project";

export async function materializeEvalRunReport(runRoot: string, options: { updateIndex?: boolean } = {}): Promise<{ report: string; reportJson: string; runId: string; data: RunReport }> {
  const report = await buildRunReport(runRoot);
  const jsonPath = path.join(runRoot, "report.json");
  await writeJson(jsonPath, report);
  const htmlPath = path.join(runRoot, "report.html");
  await writeText(htmlPath, renderEvalReportHtml(report));
  if (options.updateIndex !== false) await updateRunsIndex(path.dirname(runRoot));
  return { report: htmlPath, reportJson: jsonPath, runId: report.summary.run_id, data: report };
}

export async function writeEvalReport(runRoot: string): Promise<string> {
  return (await materializeEvalRunReport(runRoot)).report;
}

export async function buildRunReport(runRoot: string): Promise<RunReport> {
  const runJson = await readJson<Record<string, unknown>>(path.join(runRoot, "run.json"));
  const scenarioRows = (await readJsonl(path.join(runRoot, "results.jsonl"))).filter((row) => row.type === "scenario_result");
  const testRows = (await readJsonl(path.join(runRoot, "tests.jsonl"))).filter((row) => row.type === "test_result" || row.type === "lint_summary" || row.type === "lint_skipped") as EventEnvelope[];
  const judgeRows = (await readJsonl(path.join(runRoot, "grades.jsonl"))).filter((row) => row.type === "judge_result") as EventEnvelope[];
  const feedbackRows = (await readJsonl(path.join(runRoot, "feedback.jsonl"))) as EventEnvelope[];
  const byFolder = new Map<string, EventEnvelope[]>();
  for (const row of scenarioRows as EventEnvelope[]) {
    const folder = String(row.payload?.scenario_folder || row.scenario_id || "unknown");
    if (!byFolder.has(folder)) byFolder.set(folder, []);
    byFolder.get(folder)?.push(row);
  }

  const scenarios: RunReportScenario[] = [];
  for (const [folder, rows] of [...byFolder.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const snapshot = await readScenarioSnapshot(runRoot, folder);
    const sides = await Promise.all(
      rows.map(async (row): Promise<RunReportSide> => {
        const side = row.side || "candidate";
        const evidencePath = String(row.payload?.evidence_path || "");
        const finalPath = evidencePath ? path.join(evidencePath, "final.md") : undefined;
        return {
          side,
          status: String(row.payload?.status || "unknown"),
          evidence_path: evidencePath,
          final_path: finalPath,
          final_preview: evidencePath ? await readFinalPreview(path.join(runRoot, evidencePath, "final.md")) : "",
          token_usage: row.payload?.token_usage,
          failure_classification: (row.payload?.failure_classification as string | null | undefined) || null,
          error: row.payload?.error ? String(row.payload.error) : undefined,
          raw: row.payload
        };
      })
    );
    const status = scenarioStatus(sides);
    scenarios.push({
      id: snapshot?.metadata?.id || String(rows[0]?.scenario_id || folder.split("-")[0]),
      folder,
      title: snapshot?.metadata?.title,
      family: snapshot?.metadata?.family,
      type: snapshot?.metadata?.type,
      topics: snapshot?.metadata?.topics || [],
      capability: snapshot?.capability || null,
      criteria: snapshot?.criteria
        ? {
            what_it_tests: snapshot.criteria.what_it_tests,
            expected_behavior: snapshot.criteria.expected_behavior,
            assertions: snapshot.criteria.assertions || [],
            tests: snapshot.criteria.tests || [],
            judges: (snapshot.criteria.judges || []).map((judge) => judge.id)
          }
        : undefined,
      metadata: snapshot?.metadata?.metadata,
      evidence_basis: snapshot?.basis || "unavailable",
      sides,
      status,
      unresolved: status === "needs_review" || sides.some((side) => side.status === "needs_review")
    });
  }

  const comparisons = scenarios.map(compareScenario);
  const failureClassifications = derivedFailureClassifications(runJson, testRows, judgeRows, scenarioRows as EventEnvelope[]);
  const unresolvedCount = scenarios.reduce((sum, scenario) => sum + (scenario.unresolved ? 1 : 0), 0);
  const tokenUsage = countTokenUsage(scenarios);
  const comparisonMode = scenarios.some((scenario) => scenario.sides.some((side) => side.side === "release")) ? "release" : "none";
  const assessmentStatus = assessmentStatusFor(String(runJson.status || "unknown"), failureClassifications, unresolvedCount);
  const readiness = readinessFor(assessmentStatus, Boolean(runJson.manual_review_required), failureClassifications, unresolvedCount);

  return {
    schema_version: 1,
    generated_at: utcNow(),
    run: runJson,
    summary: {
      run_id: String(runJson.run_id || path.basename(runRoot)),
      label: (runJson.label as string | null | undefined) || null,
      status: String(runJson.status || "unknown"),
      created_at: runJson.created_at ? String(runJson.created_at) : undefined,
      completed_at: runJson.completed_at ? String(runJson.completed_at) : undefined,
      scenario_count: scenarios.length,
      side_count: scenarios.reduce((sum, scenario) => sum + scenario.sides.length, 0),
      result_count: scenarioRows.length,
      comparison_mode: comparisonMode,
      manual_review_required: Boolean(runJson.manual_review_required),
      failure_classifications: failureClassifications,
      assessment_status: assessmentStatus,
      unresolved_count: unresolvedCount,
      token_usage: tokenUsage
    },
    scenarios,
    tests: testRows,
    judges: judgeRows,
    feedback: feedbackRows,
    comparisons,
    artifacts: await listArtifacts(runRoot, scenarios),
    readiness
  };
}

function derivedFailureClassifications(runJson: Record<string, unknown>, tests: EventEnvelope[], judges: EventEnvelope[], scenarios: EventEnvelope[]): string[] {
  const failures = new Set(Array.isArray(runJson.failure_classifications) ? runJson.failure_classifications.map(String) : []);
  for (const row of scenarios) {
    const classification = row.payload?.failure_classification;
    if (classification) failures.add(String(classification));
  }
  for (const row of tests) {
    if (row.type === "test_result" && row.payload?.status === "failed") failures.add("lint_test_failure");
  }
  for (const row of judges) {
    if (row.payload?.status === "failed") failures.add("judge_failure");
    if (row.payload?.status === "unavailable" && row.payload?.failure_classification) failures.add(String(row.payload.failure_classification));
  }
  return [...failures].sort();
}

function assessmentStatusFor(runStatus: string, failureClassifications: string[], unresolvedCount: number): "passed" | "needs_review" | "failed" | "unknown" {
  if (failureClassifications.length || runStatus === "failed") return "failed";
  if (unresolvedCount || runStatus === "needs_review") return "needs_review";
  if (runStatus === "passed") return "passed";
  return "unknown";
}

export async function updateRunsIndex(runsRoot: string): Promise<RunIndex> {
  const rows: RunIndexRow[] = [];
  if (await exists(runsRoot)) {
    const dirs = (await fs.readdir(runsRoot, { withFileTypes: true })).filter((entry) => entry.isDirectory());
    for (const dir of dirs) {
      const runRoot = path.join(runsRoot, dir.name);
      const reportPath = path.join(runRoot, "report.json");
      const runPath = path.join(runRoot, "run.json");
      if (await exists(reportPath)) {
        const report = await readJson<RunReport>(reportPath);
        rows.push(indexRowFromReport(report));
      } else if (await exists(runPath)) {
        const run = await readJson<Record<string, unknown>>(runPath);
        rows.push(indexRowFromRun(run, dir.name));
      }
    }
  }
  rows.sort((a, b) => String(a.run_id).localeCompare(String(b.run_id)));
  const index: RunIndex = { schema_version: 1, updated_at: utcNow(), runs: rows };
  await writeJson(path.join(runsRoot, "index.json"), index);
  return index;
}

export async function materializeReviewReport(reviewRoot: string, review: Record<string, unknown>): Promise<string> {
  const report = path.join(reviewRoot, "report.md");
  await writeText(report, renderReviewReportMarkdown(review));
  return report;
}

export async function writeReviewReport(reviewRoot: string, review: Record<string, unknown>): Promise<string> {
  return materializeReviewReport(reviewRoot, review);
}

export function renderReviewReportMarkdown(review: Record<string, unknown>): string {
  const quality = objectValue(review.quality);
  const discovery = objectValue(review.discovery);
  const implementation = objectValue(review.implementation);
  const validation = objectValue(review.validation);
  const reviewer = objectValue(review.reviewer);
  const discoveryRows = vectorRows(arrayValue(discovery.vectors));
  const implementationRows = vectorRows(arrayValue(implementation.vectors));
  const validationRows = arrayValue(validation.checks)
    .map((check: Record<string, unknown>) => `| ${pipe(check.name)} | ${pipe(check.message || "")} | ${pipe(check.status)} |`)
    .join("\n");
  const suggestions = arrayValue(review.suggestions)
    .map((item: Record<string, unknown>, index: number) => `${index + 1}. **${pipe(item.priority || "medium")}** ${pipe(item.vector || "general")}: ${pipe(item.issue || "")}\n\n   Suggested fix: ${pipe(item.suggested_fix || "")}`)
    .join("\n\n");
  return `# Skill Quality Review

Quality: ${quality.score ?? "unavailable"}%

Reviewer: ${reviewer.name || "meta-skill-reviewer"} (${reviewer.status || "represented"})

## Discovery: ${quality.discovery ?? "unavailable"}%

Can an agent discover and select this skill at the right time?

${discovery.assessment || ""}

| Dimension | Reasoning | Score |
|---|---|---:|
${discoveryRows || "| none | No discovery vectors were available. | 0 / 0 |"}

## Implementation: ${quality.implementation ?? "unavailable"}%

Are the instructions useful, concise, and operational?

${implementation.assessment || ""}

| Dimension | Reasoning | Score |
|---|---|---:|
${implementationRows || "| none | No implementation vectors were available. | 0 / 0 |"}

## Validation: ${quality.validation ?? "unavailable"}%

Does the skill satisfy structural and packaging expectations?

${validation.assessment || ""}

| Check | Description | Result |
|---|---|---|
${validationRows || "| none | No validation checks were available. | unavailable |"}

## Suggestions

${suggestions || "No material suggestions."}
`;
}

async function readScenarioSnapshot(
  runRoot: string,
  folder: string
): Promise<
  | {
      basis: "run_snapshot";
      metadata: {
        id: string;
        family: string;
        type: string;
        title?: string;
        topics?: string[];
        metadata?: Record<string, unknown>;
      };
      criteria: {
        what_it_tests?: string;
        expected_behavior?: string;
        assertions?: string[];
        tests?: string[];
        judges?: Array<{ id: string }>;
      };
      capability?: string;
    }
  | undefined
> {
  const snapshot = path.join(runRoot, "snapshots", folder);
  if (!(await exists(path.join(snapshot, "scenario.json")))) return undefined;
  return {
    basis: "run_snapshot",
    metadata: await readJson(path.join(snapshot, "scenario.json")),
    criteria: (await exists(path.join(snapshot, "criteria.json"))) ? await readJson(path.join(snapshot, "criteria.json")) : { assertions: [] },
    capability: (await exists(path.join(snapshot, "capability.txt"))) ? (await readText(path.join(snapshot, "capability.txt"))).trim() : undefined
  };
}

function scenarioStatus(sides: RunReportSide[]): string {
  if (sides.some((side) => side.status === "failed" || side.status === "errored")) return "failed";
  if (sides.some((side) => side.status === "needs_review")) return "needs_review";
  if (sides.length && sides.every((side) => side.status === "passed")) return "passed";
  return "unknown";
}

function compareScenario(scenario: RunReportScenario): RunComparison {
  const candidate = scenario.sides.find((side) => side.side === "candidate");
  const release = scenario.sides.find((side) => side.side === "release");
  if (!release) {
    return { scenario_id: scenario.id, scenario_folder: scenario.folder, kind: "none", classification: "not_comparable", candidate_status: candidate?.status };
  }
  if (candidate?.status === "needs_review" || release.status === "needs_review") {
    return { scenario_id: scenario.id, scenario_folder: scenario.folder, kind: "release", classification: "needs_review", candidate_status: candidate?.status, release_status: release.status };
  }
  if (candidate?.status === "failed" && release.status !== "failed") {
    return { scenario_id: scenario.id, scenario_folder: scenario.folder, kind: "release", classification: "candidate_regresses", candidate_status: candidate.status, release_status: release.status };
  }
  if (candidate?.status === "passed" && release.status === "failed") {
    return { scenario_id: scenario.id, scenario_folder: scenario.folder, kind: "release", classification: "candidate_beats_release", candidate_status: candidate.status, release_status: release.status };
  }
  if (candidate?.status === "failed" && release.status === "failed") {
    return { scenario_id: scenario.id, scenario_folder: scenario.folder, kind: "release", classification: "both_fail", candidate_status: candidate.status, release_status: release.status };
  }
  return { scenario_id: scenario.id, scenario_folder: scenario.folder, kind: "release", classification: "no_regression", candidate_status: candidate?.status, release_status: release.status };
}

function readinessFor(status: string, manualReviewRequired: boolean, failureClassifications: string[], unresolvedCount: number): RunReadiness {
  if (status === "failed" || failureClassifications.length) {
    return {
      status: "blocked",
      summary: "Run has blocking failures; do not treat it as release-ready evidence.",
      blockers: failureClassifications.length ? failureClassifications : ["run_failed"],
      unresolved: unresolvedCount,
      basis: "run.json, results.jsonl, tests.jsonl, grades.jsonl, feedback.jsonl"
    };
  }
  if (status === "needs_review" || manualReviewRequired || unresolvedCount) {
    return {
      status: "needs_review",
      summary: "Run produced unresolved evidence that still needs deterministic, judge, or human review.",
      blockers: [],
      unresolved: unresolvedCount,
      basis: "run.json, results.jsonl, tests.jsonl, grades.jsonl, feedback.jsonl"
    };
  }
  if (status === "passed") {
    return {
      status: "ready",
      summary: "Run has no recorded failures or unresolved scenario evidence.",
      blockers: [],
      unresolved: 0,
      basis: "run.json, results.jsonl, tests.jsonl, grades.jsonl, feedback.jsonl"
    };
  }
  return {
    status: "needs_review",
    summary: "Run status is unknown; inspect raw evidence before using it.",
    blockers: [],
    unresolved: unresolvedCount,
    basis: "run.json, results.jsonl, tests.jsonl, grades.jsonl, feedback.jsonl"
  };
}

function countTokenUsage(scenarios: RunReportScenario[]): { available: number; unavailable: number } {
  let available = 0;
  let unavailable = 0;
  for (const scenario of scenarios) {
    for (const side of scenario.sides) {
      const usage = side.token_usage as { total_tokens?: { available?: boolean } } | undefined;
      if (usage?.total_tokens?.available) available += 1;
      else unavailable += 1;
    }
  }
  return { available, unavailable };
}

async function listArtifacts(runRoot: string, scenarios: RunReportScenario[]): Promise<Array<{ scenario_id: string; side: EvalSide; path: string; kind: string }>> {
  const artifacts: Array<{ scenario_id: string; side: EvalSide; path: string; kind: string }> = [];
  for (const scenario of scenarios) {
    for (const side of scenario.sides) {
      const artifactRoot = path.join(runRoot, side.evidence_path, "artifacts");
      if (!(await exists(artifactRoot))) continue;
      for (const relative of await walkFiles(artifactRoot)) {
        artifacts.push({ scenario_id: scenario.id, side: side.side, path: path.join(side.evidence_path, "artifacts", relative).split(path.sep).join("/"), kind: "file" });
      }
    }
  }
  return artifacts;
}

async function walkFiles(root: string, relativeDir = ""): Promise<string[]> {
  const dir = path.join(root, relativeDir);
  const files: string[] = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true }).catch(() => [])) {
    const relative = path.join(relativeDir, entry.name);
    if (entry.isDirectory()) files.push(...(await walkFiles(root, relative)));
    else if (entry.isFile()) files.push(relative.split(path.sep).join("/"));
  }
  return files.sort();
}

export function indexRowFromReport(report: RunReport): RunIndexRow {
  return {
    run_id: report.summary.run_id,
    label: report.summary.label,
    status: report.summary.status,
    created_at: report.summary.created_at,
    completed_at: report.summary.completed_at,
    scenario_count: report.summary.scenario_count,
    comparison_mode: report.summary.comparison_mode,
    manual_review_required: report.summary.manual_review_required,
    failure_classifications: report.summary.failure_classifications,
    assessment_status: report.summary.assessment_status,
    unresolved_count: report.summary.unresolved_count,
    readiness_status: report.readiness.status
  };
}

export function indexRowFromRun(run: Record<string, unknown>, fallbackId: string): RunIndexRow {
  const failures = Array.isArray(run.failure_classifications) ? run.failure_classifications.map(String) : [];
  return {
    run_id: String(run.run_id || fallbackId),
    label: (run.label as string | null | undefined) || null,
    status: String(run.status || "unknown"),
    created_at: run.created_at ? String(run.created_at) : undefined,
    completed_at: run.completed_at ? String(run.completed_at) : undefined,
    scenario_count: Array.isArray((run.scenarios as { selection?: unknown[] } | undefined)?.selection) ? ((run.scenarios as { selection: unknown[] }).selection || []).length : 0,
    comparison_mode: "none",
    manual_review_required: Boolean(run.manual_review_required),
    failure_classifications: failures,
    assessment_status: String(run.status || "unknown"),
    unresolved_count: Boolean(run.manual_review_required) ? 1 : 0,
    readiness_status: failures.length ? "blocked" : Boolean(run.manual_review_required) ? "needs_review" : "needs_review"
  };
}

export function renderEvalReportHtml(report: RunReport): string {
  const scenarioRows = report.scenarios.flatMap((scenario) =>
    scenario.sides.map((side) => {
      const failure = side.failure_classification || side.error || "";
      return `<tr><td>${escapeHtml(scenario.id)}</td><td>${escapeHtml(scenario.title || scenario.folder)}</td><td>${escapeHtml(side.side)}</td><td>${escapeHtml(side.status)}</td><td>${link(side.final_path || "", side.final_preview || "final.md")}</td><td><code>${escapeHtml(JSON.stringify(side.token_usage || {}))}</code></td><td>${link(side.evidence_path, side.evidence_path)} ${link(`${side.evidence_path}/rpc.jsonl`, "rpc")} ${link(`${side.evidence_path}/turns.jsonl`, "turns")}</td><td>${escapeHtml(failure)}</td></tr>`;
    })
  );
  const scenarioCards = report.scenarios.map(renderScenarioCard).join("\n");
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Meta Skill Eval ${escapeHtml(report.summary.run_id)}</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 32px; color: #1f2937; }
    table { border-collapse: collapse; width: 100%; margin: 12px 0 24px; }
    th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; vertical-align: top; }
    th { background: #f3f4f6; }
    code { background: #f3f4f6; padding: 2px 4px; border-radius: 4px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin: 16px 0; }
    .box { border: 1px solid #d1d5db; padding: 12px; border-radius: 6px; }
    .scenario { border-top: 2px solid #e5e7eb; padding-top: 16px; margin-top: 20px; }
    .muted { color: #6b7280; }
    pre { white-space: pre-wrap; background: #f9fafb; border: 1px solid #e5e7eb; padding: 8px; border-radius: 4px; max-height: 180px; overflow: auto; }
  </style>
</head>
<body>
  <h1>Meta Skill Eval ${escapeHtml(report.summary.run_id)}</h1>
  <p><strong>Label:</strong> ${escapeHtml(report.summary.label || "")}</p>
  <p><strong>Status:</strong> ${escapeHtml(report.summary.status)} ${report.summary.status === "needs_review" ? '<span class="muted">(unresolved; not pass proof)</span>' : ""}</p>
  <p><strong>Manual review required:</strong> ${report.summary.manual_review_required ? "yes" : "no"}</p>
  <p><strong>Failure classifications:</strong> ${escapeHtml(report.summary.failure_classifications.length ? report.summary.failure_classifications.join(", ") : "none")}</p>
  <p><strong>Readiness:</strong> ${escapeHtml(report.readiness.status)}. ${escapeHtml(report.readiness.summary)}</p>
  <p><strong>Runner:</strong> ${escapeHtml((report.run.runner as { backend?: string } | undefined)?.backend || "")} (${escapeHtml((report.run.runner as { app_server?: { mode?: string } } | undefined)?.app_server?.mode || "")})</p>
  <div class="grid">
    <div class="box"><strong>Scenario Status</strong><br>${formatCounts(countBy(report.scenarios, (scenario) => scenario.status))}</div>
    <div class="box"><strong>Tests</strong><br>${formatTestSummary(report.tests)}</div>
    <div class="box"><strong>Judges</strong><br>${formatJudgeSummary(report.judges)}</div>
    <div class="box"><strong>Feedback</strong><br>${formatFeedbackSummary(report.feedback)}</div>
  </div>
  <h2>Scenario Results</h2>
  <table>
    <thead><tr><th>Scenario</th><th>Title</th><th>Side</th><th>Status</th><th>Final Answer</th><th>Token Usage</th><th>Evidence</th><th>Failure</th></tr></thead>
    <tbody>
      ${scenarioRows.join("\n")}
    </tbody>
  </table>
  <h2>Scenario Details</h2>
  ${scenarioCards || '<p class="muted">No scenario rows recorded.</p>'}
  <h2>Test Details</h2>
  ${renderEventTable(report.tests, ["type", "source", "status", "id", "failure_classification"])}
  <h2>Judge Details</h2>
  ${renderEventTable(report.judges, ["scenario_id", "side", "source", "status", "failure_classification"])}
  <h2>Feedback Details</h2>
  ${renderEventTable(report.feedback, ["scenario_id", "side", "source", "label"])}
</body>
</html>`;
}

function renderScenarioCard(scenario: RunReportScenario): string {
  const comparison = compareScenario(scenario);
  const criteria = scenario.criteria;
  return `<section class="scenario">
    <h3>${escapeHtml(scenario.id)} ${escapeHtml(scenario.title || scenario.folder)}</h3>
    <p class="muted">${escapeHtml([scenario.family, scenario.type, scenario.topics.join(", ")].filter(Boolean).join(" / "))}</p>
    <p><strong>Evidence basis:</strong> ${escapeHtml(scenario.evidence_basis)}</p>
    <p><strong>Capability:</strong> ${escapeHtml(scenario.capability || "not recorded")}</p>
    <p><strong>Comparison:</strong> ${escapeHtml(comparison.classification)}</p>
    <p><strong>Expected behavior:</strong> ${escapeHtml(criteria?.expected_behavior || "not recorded")}</p>
    <table>
      <thead><tr><th>Assertions</th><th>Tests</th><th>Judges</th></tr></thead>
      <tbody><tr><td>${escapeHtml((criteria?.assertions || []).join("\n") || "none")}</td><td>${escapeHtml((criteria?.tests || []).join(", ") || "none")}</td><td>${escapeHtml((criteria?.judges || []).join(", ") || "none")}</td></tr></tbody>
    </table>
  </section>`;
}

function escapeHtml(value: unknown): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function readJsonl(target: string): Promise<Array<Record<string, any>>> {
  if (!(await exists(target))) return [];
  return (await fs.readFile(target, "utf8"))
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function countBy<T>(rows: T[], keyFor: (row: T) => string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const row of rows) {
    const key = keyFor(row);
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

function formatCounts(counts: Record<string, number>): string {
  const entries = Object.entries(counts).sort();
  if (!entries.length) return "none";
  return entries.map(([key, value]) => `${escapeHtml(key)}: ${value}`).join("<br>");
}

function formatTestSummary(rows: EventEnvelope[]): string {
  const results = rows.filter((row) => row.type === "test_result");
  const skipped = rows.filter((row) => row.type === "lint_skipped").length;
  const counts = countBy(results, (row) => String(row.payload?.status || "unknown"));
  const summary = formatCounts(counts);
  return `${summary}${skipped ? `<br>lint skipped: ${skipped}` : ""}`;
}

function formatJudgeSummary(rows: EventEnvelope[]): string {
  return formatCounts(countBy(rows, (row) => String(row.payload?.status || "unknown")));
}

function formatFeedbackSummary(rows: EventEnvelope[]): string {
  return formatCounts(countBy(rows, (row) => String(row.payload?.label || row.payload?.status || "unlabeled")));
}

async function readFinalPreview(finalPath: string): Promise<string> {
  if (!(await exists(finalPath))) return "";
  const text = (await readText(finalPath)).trim().replace(/\s+/g, " ");
  return text.length > 180 ? `${text.slice(0, 177)}...` : text;
}

function link(relative: string, label: string): string {
  if (!relative) return "";
  return `<a href="${escapeHtml(relative.split(path.sep).join("/"))}">${escapeHtml(label)}</a>`;
}

function renderEventTable(rows: EventEnvelope[], columns: string[]): string {
  if (!rows.length) return '<p class="muted">No rows recorded.</p>';
  return `<table><thead><tr>${columns.map((column) => `<th>${escapeHtml(column)}</th>`).join("")}<th>Summary</th></tr></thead><tbody>${rows
    .map((row) => {
      const payload = row.payload || {};
      const rowValues = row as unknown as Record<string, unknown>;
      return `<tr>${columns
        .map((column) => `<td>${escapeHtml(rowValues[column] ?? payload[column] ?? "")}</td>`)
        .join("")}<td><pre>${escapeHtml(JSON.stringify(payload, null, 2))}</pre></td></tr>`;
    })
    .join("\n")}</tbody></table>`;
}

function vectorRows(vectors: Array<Record<string, unknown>>): string {
  return vectors.map((vector) => `| ${pipe(vector.name)} | ${pipe(vector.reasoning || "")} | ${escapeMarkdown(vector.score)} / ${escapeMarkdown(vector.max)} |`).join("\n");
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function arrayValue(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object" && !Array.isArray(item)) : [];
}

function pipe(value: unknown): string {
  return escapeMarkdown(value).replace(/\|/g, "\\|");
}

function escapeMarkdown(value: unknown): string {
  return String(value ?? "");
}
