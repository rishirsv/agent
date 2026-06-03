"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.REPORT_VIEWS = void 0;
exports.isReportView = isReportView;
exports.buildMetaSkillReport = buildMetaSkillReport;
exports.listRunSummariesForReport = listRunSummariesForReport;
exports.openRunForReport = openRunForReport;
exports.materializeReviewReport = materializeReviewReport;
exports.renderReportMarkdown = renderReportMarkdown;
exports.renderReportHtml = renderReportHtml;
exports.renderLintReportMarkdown = renderLintReportMarkdown;
exports.renderRunListMarkdown = renderRunListMarkdown;
exports.renderEvalRunMarkdown = renderEvalRunMarkdown;
const node_fs_1 = require("node:fs");
const node_path_1 = __importDefault(require("node:path"));
const lint_1 = require("./lint");
const report_1 = require("./report");
const project_1 = require("./project");
exports.REPORT_VIEWS = ["status", "runs", "eval", "review", "release", "full", "lint"];
function isReportView(value) {
    return exports.REPORT_VIEWS.includes(value);
}
async function buildMetaSkillReport(options) {
    const root = await (0, project_1.requirePortableSkill)(options.project);
    const p = (0, project_1.projectPaths)(root);
    const view = options.view || "status";
    const refresh = options.refresh || "read";
    const frontmatter = await (0, project_1.parseSkillFrontmatter)(p.skillMd);
    const evidenceErrors = [];
    const lint = options.executeLint === false ? undefined : await (0, lint_1.lintProject)(root, { executeTests: false });
    const runs = await listRunSummariesForReport(root, {}, refresh).catch((error) => {
        evidenceErrors.push(error instanceof Error ? error.message : String(error));
        return [];
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
        generated_at: (0, project_1.utcNow)(),
        project: {
            path: root,
            skill_name: frontmatter.name || node_path_1.default.basename(root),
            has_workbench: await (0, project_1.exists)(p.meta)
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
async function listRunSummariesForReport(project, options = {}, refresh = "read") {
    const root = await (0, project_1.requirePortableSkill)(project);
    const p = (0, project_1.projectPaths)(root);
    if (!(await (0, project_1.exists)(p.runs)))
        return [];
    let rows;
    if (refresh === "refresh") {
        rows = (await refreshRunsIndex(p.runs)).runs;
    }
    else if (refresh === "refresh-if-missing") {
        rows = (await ensureRunsIndex(p.runs)).runs;
    }
    else {
        rows = await readRunsIndexWithoutWrites(p.runs);
    }
    rows = [...rows].sort((a, b) => String(a.run_id).localeCompare(String(b.run_id)));
    if (options.status)
        rows = rows.filter((row) => row.status === options.status || row.assessment_status === options.status || row.readiness_status === options.status);
    if (options.limit !== undefined)
        rows = rows.slice(Math.max(0, rows.length - options.limit));
    return rows;
}
async function openRunForReport(project, runId, refresh = "refresh") {
    const root = await (0, project_1.requirePortableSkill)(project);
    const runs = await listRunSummariesForReport(root, {}, refresh === "read" ? "read" : "refresh-if-missing");
    const selected = runId || runs.at(-1)?.run_id;
    if (!selected)
        throw new project_1.CliError("no eval runs found; run `meta-skill eval run <project>` first");
    const p = (0, project_1.projectPaths)(root);
    const runRoot = node_path_1.default.join(p.runs, selected);
    if (!(await (0, project_1.exists)(runRoot)))
        throw new project_1.CliError(`run does not exist: ${selected}`);
    if (!(await (0, project_1.exists)(node_path_1.default.join(runRoot, "run.json"))))
        throw new project_1.CliError(`run is missing run.json: ${selected}`);
    if (refresh === "read") {
        const data = await readOrBuildRunReport(runRoot);
        return {
            report: node_path_1.default.join(runRoot, "report.html"),
            reportJson: node_path_1.default.join(runRoot, "report.json"),
            runId: selected,
            data
        };
    }
    return (0, report_1.materializeEvalRunReport)(runRoot);
}
async function materializeReviewReport(reviewRoot, review) {
    const report = node_path_1.default.join(reviewRoot, "report.md");
    await (0, project_1.writeText)(report, (0, report_1.renderReviewReportMarkdown)(review));
    return report;
}
function renderReportMarkdown(report, view = report.subject.view) {
    if (view === "lint")
        return report.evidence.lint ? renderLintReportMarkdown(report.evidence.lint) : "No lint evidence available.";
    if (view === "runs")
        return renderRunListMarkdown(report.evidence.runs);
    if (view === "eval")
        return report.evidence.latest_eval_run ? renderEvalRunMarkdown(report.evidence.latest_eval_run.report) : "No eval runs found.";
    if (view === "review")
        return report.evidence.latest_review ? (0, report_1.renderReviewReportMarkdown)(report.evidence.latest_review.review) : "No review evidence found.";
    if (view === "release")
        return renderReleaseMarkdown(report);
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
function renderReportHtml(report, view = report.subject.view) {
    if (view === "eval" && report.evidence.latest_eval_run)
        return (0, report_1.renderEvalReportHtml)(report.evidence.latest_eval_run.report);
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
function renderLintReportMarkdown(report) {
    return (0, lint_1.formatLintReport)(report);
}
function renderRunListMarkdown(runs) {
    const normalizedRuns = runs.map(report_1.normalizeRunIndexRowForRead).filter((run) => run.run_id);
    if (!normalizedRuns.length)
        return "No eval runs found.";
    const header = "Run ID\tStatus\tCreated\tCompleted\tLabel\tSource\tScenarios\tManual Review\tFailures\tReadiness";
    const rows = normalizedRuns.map((run) => [
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
    ].join("\t"));
    return [header, ...rows].join("\n");
}
function renderEvalRunMarkdown(report) {
    report = (0, report_1.normalizeRunReportForRead)(report);
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
    if (!report.scenarios.length)
        lines.push("- No scenario rows recorded.");
    for (const scenario of report.scenarios) {
        lines.push(`- ${scenario.id} ${scenario.title || scenario.folder}: ${scenario.status}${scenario.unresolved ? " (unresolved)" : ""}`);
        for (const attempt of scenario.attempts) {
            const detail = [attempt.run_source.label, attempt.status, attempt.failure_classification || attempt.error || ""].filter(Boolean).join(" / ");
            lines.push(`  - ${detail}`);
        }
    }
    lines.push("", "## Evidence Paths");
    for (const artifact of report.artifacts)
        lines.push(`- ${artifact.scenario_id}: ${artifact.path}`);
    if (!report.artifacts.length)
        lines.push("- No artifact files recorded.");
    lines.push("", "## Tests, Judges, Feedback");
    lines.push(`- Tests: ${report.tests.length}`);
    lines.push(`- Judges: ${report.judges.length}`);
    lines.push(`- Feedback: ${report.feedback.length}`);
    return lines.join("\n");
}
function renderStatusMarkdown(report) {
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
    if (!findings.length)
        lines.splice(lines.indexOf("## Findings") + 1, 0, "- No blocking findings.");
    return lines.join("\n");
}
function renderReleaseMarkdown(report) {
    const release = report.evidence.release;
    if (!release?.exists)
        return "No release snapshot exists.";
    return [
        `- Release snapshot: ${release.version_path || "unknown"}`,
        `- Source run: ${release.source_run_id || "none"}`,
        `- Payload digest: ${release.payload_digest || "unknown"}`,
        `- Freshness: ${release.freshness_note || "No newer run detected."}`
    ].join("\n");
}
function renderReviewSummaryMarkdown(review) {
    const quality = review.quality;
    const suggestions = Array.isArray(review.suggestions) ? review.suggestions : [];
    return [
        `- Quality: ${quality?.score ?? "unavailable"}%`,
        `- Discovery: ${quality?.discovery ?? "unavailable"}%`,
        `- Implementation: ${quality?.implementation ?? "unavailable"}%`,
        `- Validation: ${quality?.validation ?? "unavailable"}%`,
        `- Suggestions: ${suggestions.length}`
    ].join("\n");
}
function renderPlanSessionMarkdown(report) {
    return [`## Plans and Sessions`, `- Plans: ${report.evidence.plans.length}`, `- Sessions: ${report.evidence.sessions.length}`].join("\n");
}
function readinessForProject(lint, run, release, errors) {
    if (errors.length)
        return { status: "blocked", summary: "Some evidence could not be read.", blockers: errors, unresolved: 0, basis: "report evidence read" };
    if (lint?.failures.length)
        return { status: "blocked", summary: "Lint has blocking failures.", blockers: lint.failures.map((failure) => failure.message), unresolved: 0, basis: "lint" };
    if (run?.readiness.status === "blocked")
        return run.readiness;
    if (run?.readiness.status === "needs_review")
        return run.readiness;
    if (release?.newer_run_exists)
        return { status: "needs_review", summary: "A newer run exists after the release snapshot.", blockers: [], unresolved: 1, basis: "release version and eval runs" };
    if (lint?.warnings.length)
        return { status: "needs_review", summary: "Lint passed with warnings.", blockers: [], unresolved: lint.warnings.length, basis: "lint" };
    if (run?.readiness.status === "ready")
        return run.readiness;
    return { status: "unknown", summary: "Not enough evidence exists yet to classify readiness.", blockers: [], unresolved: 0, basis: "project state" };
}
function nextActionForProject(root, lint, runs, run, release, readiness) {
    const project = shellPath(root);
    if (lint?.failures.length)
        return { label: "Fix lint failures", why: "Lint has blocking failures.", command: `meta-skill lint ${project}` };
    if (!runs.length)
        return { label: "Run evals", why: "No eval runs exist yet.", command: `meta-skill eval run ${project}` };
    if (run?.readiness.status === "blocked")
        return { label: "Inspect eval blockers", why: run.readiness.summary, command: `meta-skill report ${project} --view eval --run ${run.summary.run_id}` };
    if (run?.readiness.status === "needs_review")
        return { label: "Inspect latest eval evidence", why: run.readiness.summary, command: `meta-skill report ${project} --view eval --run ${run.summary.run_id}` };
    if (readiness.status === "ready" && !release?.exists && run)
        return { label: "Create release snapshot", why: "Latest run is ready and no release snapshot exists.", command: `meta-skill release ${project} --from-run ${run.summary.run_id}` };
    if (release?.exists && !release.newer_run_exists)
        return { label: "Package release", why: "Release snapshot exists and no newer run was detected.", command: `meta-skill package ${project} --source release` };
    return { label: "Inspect full report", why: "Evidence is available but needs human direction.", command: `meta-skill report ${project} --view full` };
}
async function readEvalRunForReport(root, runId, refresh) {
    const p = (0, project_1.projectPaths)(root);
    const runRoot = node_path_1.default.join(p.runs, runId);
    const opened = await openRunForReport(root, runId, refresh === "read" ? "read" : refresh);
    return {
        run_id: opened.runId,
        run_root: runRoot,
        report_path: opened.reportJson,
        html_path: opened.report,
        report: opened.data
    };
}
async function readOrBuildRunReport(runRoot) {
    const reportPath = node_path_1.default.join(runRoot, "report.json");
    if (await (0, project_1.exists)(reportPath))
        return (0, report_1.normalizeRunReportForRead)(await (0, project_1.readJson)(reportPath));
    return (0, report_1.buildRunReport)(runRoot);
}
async function readReviewForReport(root, reviewId) {
    const p = (0, project_1.projectPaths)(root);
    if (!(await (0, project_1.exists)(p.reviews)))
        return undefined;
    const selected = reviewId || (await latestDirectory(p.reviews));
    if (!selected)
        return undefined;
    const reviewRoot = node_path_1.default.join(p.reviews, selected);
    const reviewPath = node_path_1.default.join(reviewRoot, "review.json");
    if (!(await (0, project_1.exists)(reviewPath)))
        return undefined;
    return {
        review_id: selected,
        review_root: reviewRoot,
        review_path: reviewPath,
        report_md_path: (await (0, project_1.exists)(node_path_1.default.join(reviewRoot, "report.md"))) ? node_path_1.default.join(reviewRoot, "report.md") : undefined,
        review: await (0, project_1.readJson)(reviewPath)
    };
}
async function readReleaseForReport(root, runs) {
    const p = (0, project_1.projectPaths)(root);
    const versionPath = node_path_1.default.join(p.release, "version.json");
    if (!(await (0, project_1.exists)(versionPath)))
        return { exists: false, newer_run_exists: false };
    const version = await (0, project_1.readJson)(versionPath);
    const sourceRunId = version.source_run_id || null;
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
async function listPlanStates(root) {
    return (await listJsonDir(root, "plan.json", "plan_id")).map((plan) => ({ plan_id: plan.id, path: plan.path, status: plan.status }));
}
async function listSessionStates(root) {
    const sessions = await listJsonDir(root, "session.json", "session_id");
    return sessions.map((session) => ({ session_id: session.id, path: session.path, status: session.status, decision: session.decision }));
}
async function listJsonDir(root, fileName, idKey) {
    if (!(await (0, project_1.exists)(root)))
        return [];
    const rows = [];
    for (const entry of (await node_fs_1.promises.readdir(root, { withFileTypes: true })).filter((item) => item.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
        const itemPath = node_path_1.default.join(root, entry.name, fileName);
        if (!(await (0, project_1.exists)(itemPath)))
            continue;
        const data = await (0, project_1.readJson)(itemPath);
        rows.push({
            id: String(data[idKey] || entry.name),
            path: itemPath,
            status: typeof data.status === "string" ? data.status : undefined,
            decision: typeof data.decision === "string" ? data.decision : undefined
        });
    }
    return rows;
}
async function ensureRunsIndex(runsRoot) {
    const indexPath = node_path_1.default.join(runsRoot, "index.json");
    if (await (0, project_1.exists)(indexPath))
        return (0, project_1.readJson)(indexPath);
    if (!(await (0, project_1.exists)(runsRoot)))
        return { schema_version: 1, updated_at: new Date(0).toISOString(), runs: [] };
    const dirs = (await node_fs_1.promises.readdir(runsRoot, { withFileTypes: true })).filter((entry) => entry.isDirectory());
    for (const dir of dirs) {
        const runRoot = node_path_1.default.join(runsRoot, dir.name);
        if ((await (0, project_1.exists)(node_path_1.default.join(runRoot, "run.json"))) && !(await (0, project_1.exists)(node_path_1.default.join(runRoot, "report.json")))) {
            await (0, report_1.materializeEvalRunReport)(runRoot);
        }
    }
    return (0, report_1.updateRunsIndex)(runsRoot);
}
async function refreshRunsIndex(runsRoot) {
    if (!(await (0, project_1.exists)(runsRoot)))
        return { schema_version: 1, updated_at: new Date(0).toISOString(), runs: [] };
    const dirs = (await node_fs_1.promises.readdir(runsRoot, { withFileTypes: true })).filter((entry) => entry.isDirectory());
    for (const dir of dirs) {
        const runRoot = node_path_1.default.join(runsRoot, dir.name);
        if (await (0, project_1.exists)(node_path_1.default.join(runRoot, "run.json")))
            await (0, report_1.materializeEvalRunReport)(runRoot, { updateIndex: false });
    }
    return (0, report_1.updateRunsIndex)(runsRoot);
}
async function readRunsIndexWithoutWrites(runsRoot) {
    const indexPath = node_path_1.default.join(runsRoot, "index.json");
    if (await (0, project_1.exists)(indexPath))
        return (await (0, project_1.readJson)(indexPath)).runs.map(report_1.normalizeRunIndexRowForRead).filter((row) => row.run_id);
    if (!(await (0, project_1.exists)(runsRoot)))
        return [];
    const rows = [];
    for (const dir of (await node_fs_1.promises.readdir(runsRoot, { withFileTypes: true })).filter((entry) => entry.isDirectory())) {
        const runRoot = node_path_1.default.join(runsRoot, dir.name);
        const reportPath = node_path_1.default.join(runRoot, "report.json");
        const runPath = node_path_1.default.join(runRoot, "run.json");
        if (await (0, project_1.exists)(reportPath))
            rows.push((0, report_1.indexRowFromReport)(await (0, project_1.readJson)(reportPath)));
        else if (await (0, project_1.exists)(runPath))
            rows.push((0, report_1.indexRowFromRun)(await (0, project_1.readJson)(runPath), dir.name));
    }
    return rows;
}
async function latestDirectory(parent) {
    if (!(await (0, project_1.exists)(parent)))
        return undefined;
    return (await node_fs_1.promises.readdir(parent, { withFileTypes: true }))
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort((a, b) => a.localeCompare(b))
        .at(-1);
}
function findingsFor(report) {
    const findings = [];
    for (const failure of report.evidence.lint?.failures || [])
        findings.push(`Lint failure: ${failure.message}`);
    for (const warning of report.evidence.lint?.warnings || [])
        findings.push(`Lint warning: ${warning.message}`);
    for (const blocker of report.evidence.latest_eval_run?.report.readiness.blockers || [])
        findings.push(`Eval blocker: ${blocker}`);
    const unresolved = report.evidence.latest_eval_run?.report.readiness.unresolved || 0;
    if (unresolved)
        findings.push(`Eval unresolved: ${unresolved} scenario${unresolved === 1 ? "" : "s"} need review.`);
    if (report.evidence.release?.newer_run_exists)
        findings.push("Release: A newer run exists after the release snapshot.");
    for (const error of report.evidence.evidence_errors)
        findings.push(`Evidence error: ${error}`);
    return findings;
}
function lintSummary(lint) {
    if (!lint)
        return "not run";
    if (lint.failures.length)
        return `failed with ${lint.failures.length} failure${lint.failures.length === 1 ? "" : "s"}`;
    if (lint.warnings.length)
        return `passed with ${lint.warnings.length} warning${lint.warnings.length === 1 ? "" : "s"}`;
    return "passed";
}
function shellPath(target) {
    return target.includes(" ") ? JSON.stringify(target) : target;
}
function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}
