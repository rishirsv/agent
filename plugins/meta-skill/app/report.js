"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.materializeEvalRunReport = materializeEvalRunReport;
exports.writeEvalReport = writeEvalReport;
exports.buildRunReport = buildRunReport;
exports.updateRunsIndex = updateRunsIndex;
exports.materializeReviewReport = materializeReviewReport;
exports.writeReviewReport = writeReviewReport;
exports.renderReviewReportMarkdown = renderReviewReportMarkdown;
exports.indexRowFromReport = indexRowFromReport;
exports.indexRowFromRun = indexRowFromRun;
exports.normalizeRunIndexRowForRead = normalizeRunIndexRowForRead;
exports.normalizeRunReportForRead = normalizeRunReportForRead;
exports.renderEvalReportHtml = renderEvalReportHtml;
const node_fs_1 = require("node:fs");
const node_path_1 = __importDefault(require("node:path"));
const project_1 = require("./project");
async function materializeEvalRunReport(runRoot, options = {}) {
    const report = await buildRunReport(runRoot);
    const jsonPath = node_path_1.default.join(runRoot, "report.json");
    await (0, project_1.writeJson)(jsonPath, report);
    const htmlPath = node_path_1.default.join(runRoot, "report.html");
    await (0, project_1.writeText)(htmlPath, renderEvalReportHtml(report));
    if (options.updateIndex !== false)
        await updateRunsIndex(node_path_1.default.dirname(runRoot));
    return { report: htmlPath, reportJson: jsonPath, runId: report.summary.run_id, data: report };
}
async function writeEvalReport(runRoot) {
    return (await materializeEvalRunReport(runRoot)).report;
}
async function buildRunReport(runRoot) {
    const runJson = await (0, project_1.readJson)(node_path_1.default.join(runRoot, "run.json"));
    const scenarioRows = (await readJsonl(node_path_1.default.join(runRoot, "results.jsonl"))).filter((row) => row.type === "scenario_result");
    const testRows = (await readJsonl(node_path_1.default.join(runRoot, "tests.jsonl"))).filter((row) => row.type === "test_result" || row.type === "lint_summary" || row.type === "lint_skipped");
    const judgeRows = (await readJsonl(node_path_1.default.join(runRoot, "grades.jsonl"))).filter((row) => row.type === "judge_result");
    const feedbackRows = (await readJsonl(node_path_1.default.join(runRoot, "feedback.jsonl")));
    const byFolder = new Map();
    for (const row of scenarioRows) {
        const folder = String(row.payload?.scenario_folder || row.scenario_id || "unknown");
        if (!byFolder.has(folder))
            byFolder.set(folder, []);
        byFolder.get(folder)?.push(row);
    }
    const scenarios = [];
    for (const [folder, rows] of [...byFolder.entries()].sort(([a], [b]) => a.localeCompare(b))) {
        const snapshot = await readScenarioSnapshot(runRoot, folder);
        const attempts = await Promise.all(rows.map(async (row) => {
            const legacySide = row.side;
            const evidencePath = String(row.payload?.evidence_path || "");
            const finalPath = evidencePath ? node_path_1.default.join(evidencePath, "final.md") : undefined;
            const tokenUsage = await readAttemptTokenUsage(runRoot, evidencePath, row.payload?.token_usage);
            return {
                run_source: normalizeRunSource(row.payload?.run_source, legacySide),
                status: String(row.payload?.status || "unknown"),
                evidence_path: evidencePath,
                final_path: finalPath,
                final_preview: evidencePath ? await readFinalPreview(node_path_1.default.join(runRoot, evidencePath, "final.md")) : "",
                token_usage: tokenUsage,
                failure_classification: row.payload?.failure_classification || null,
                error: row.payload?.error ? String(row.payload.error) : undefined,
                raw: row.payload,
                ...(legacySide ? { legacy_side: legacySide } : {})
            };
        }));
        const status = scenarioStatus(attempts);
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
            attempts,
            status,
            unresolved: status === "needs_review" || attempts.some((attempt) => attempt.status === "needs_review")
        });
    }
    const failureClassifications = derivedFailureClassifications(runJson, testRows, judgeRows, scenarioRows);
    const unresolvedCount = scenarios.reduce((sum, scenario) => sum + (scenario.unresolved ? 1 : 0), 0);
    const tokenUsage = countTokenUsage(scenarios);
    const assessmentStatus = assessmentStatusFor(String(runJson.status || "unknown"), failureClassifications, unresolvedCount);
    const readiness = readinessFor(assessmentStatus, Boolean(runJson.manual_review_required), failureClassifications, unresolvedCount);
    const runSource = normalizeRunSource(runJson.run_source);
    return {
        schema_version: 2,
        generated_at: (0, project_1.utcNow)(),
        run: runJson,
        summary: {
            run_id: String(runJson.run_id || node_path_1.default.basename(runRoot)),
            label: runJson.label || null,
            status: String(runJson.status || "unknown"),
            created_at: runJson.created_at ? String(runJson.created_at) : undefined,
            completed_at: runJson.completed_at ? String(runJson.completed_at) : undefined,
            scenario_count: scenarios.length,
            attempt_count: scenarios.reduce((sum, scenario) => sum + scenario.attempts.length, 0),
            result_count: scenarioRows.length,
            run_source: runSource,
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
        artifacts: await listArtifacts(runRoot, scenarios),
        readiness
    };
}
function derivedFailureClassifications(runJson, tests, judges, scenarios) {
    const failures = new Set(Array.isArray(runJson.failure_classifications) ? runJson.failure_classifications.map(String) : []);
    for (const row of scenarios) {
        const classification = row.payload?.failure_classification;
        if (classification)
            failures.add(String(classification));
    }
    for (const row of tests) {
        if (row.type === "test_result" && row.payload?.status === "failed")
            failures.add("lint_test_failure");
    }
    for (const row of judges) {
        if (row.payload?.status === "failed")
            failures.add("judge_failure");
        if (row.payload?.status === "unavailable" && row.payload?.failure_classification)
            failures.add(String(row.payload.failure_classification));
    }
    return [...failures].sort();
}
function assessmentStatusFor(runStatus, failureClassifications, unresolvedCount) {
    if (failureClassifications.length || runStatus === "failed")
        return "failed";
    if (unresolvedCount || runStatus === "needs_review")
        return "needs_review";
    if (runStatus === "passed")
        return "passed";
    return "unknown";
}
async function updateRunsIndex(runsRoot) {
    const rows = [];
    if (await (0, project_1.exists)(runsRoot)) {
        const dirs = (await node_fs_1.promises.readdir(runsRoot, { withFileTypes: true })).filter((entry) => entry.isDirectory());
        for (const dir of dirs) {
            const runRoot = node_path_1.default.join(runsRoot, dir.name);
            const reportPath = node_path_1.default.join(runRoot, "report.json");
            const runPath = node_path_1.default.join(runRoot, "run.json");
            if (await (0, project_1.exists)(reportPath)) {
                const report = await (0, project_1.readJson)(reportPath);
                rows.push(indexRowFromReport(report));
            }
            else if (await (0, project_1.exists)(runPath)) {
                const run = await (0, project_1.readJson)(runPath);
                rows.push(indexRowFromRun(run, dir.name));
            }
        }
    }
    rows.sort((a, b) => String(a.run_id).localeCompare(String(b.run_id)));
    const index = { schema_version: 1, updated_at: (0, project_1.utcNow)(), runs: rows };
    await (0, project_1.writeJson)(node_path_1.default.join(runsRoot, "index.json"), index);
    return index;
}
async function materializeReviewReport(reviewRoot, review) {
    const report = node_path_1.default.join(reviewRoot, "report.md");
    await (0, project_1.writeText)(report, renderReviewReportMarkdown(review));
    return report;
}
async function writeReviewReport(reviewRoot, review) {
    return materializeReviewReport(reviewRoot, review);
}
function renderReviewReportMarkdown(review) {
    const quality = objectValue(review.quality);
    const discovery = objectValue(review.discovery);
    const implementation = objectValue(review.implementation);
    const validation = objectValue(review.validation);
    const reviewer = objectValue(review.reviewer);
    const discoveryRows = vectorRows(arrayValue(discovery.vectors));
    const implementationRows = vectorRows(arrayValue(implementation.vectors));
    const validationRows = arrayValue(validation.checks)
        .map((check) => `| ${pipe(check.name)} | ${pipe(check.message || "")} | ${pipe(check.status)} |`)
        .join("\n");
    const suggestions = arrayValue(review.suggestions)
        .map((item, index) => `${index + 1}. **${pipe(item.priority || "medium")}** ${pipe(item.vector || "general")}: ${pipe(item.issue || "")}\n\n   Suggested fix: ${pipe(item.suggested_fix || "")}`)
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
async function readScenarioSnapshot(runRoot, folder) {
    const snapshot = node_path_1.default.join(runRoot, "snapshots", folder);
    if (!(await (0, project_1.exists)(node_path_1.default.join(snapshot, "scenario.json"))))
        return undefined;
    return {
        basis: "run_snapshot",
        metadata: await (0, project_1.readJson)(node_path_1.default.join(snapshot, "scenario.json")),
        criteria: (await (0, project_1.exists)(node_path_1.default.join(snapshot, "criteria.json"))) ? await (0, project_1.readJson)(node_path_1.default.join(snapshot, "criteria.json")) : { assertions: [] },
        capability: (await (0, project_1.exists)(node_path_1.default.join(snapshot, "capability.txt"))) ? (await (0, project_1.readText)(node_path_1.default.join(snapshot, "capability.txt"))).trim() : undefined
    };
}
function scenarioStatus(attempts) {
    if (attempts.some((attempt) => attempt.status === "failed" || attempt.status === "errored"))
        return "failed";
    if (attempts.some((attempt) => attempt.status === "needs_review"))
        return "needs_review";
    if (attempts.length && attempts.every((attempt) => attempt.status === "passed"))
        return "passed";
    return "unknown";
}
function readinessFor(status, manualReviewRequired, failureClassifications, unresolvedCount) {
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
function countTokenUsage(scenarios) {
    const byRunSource = {};
    let available = 0;
    let unavailable = 0;
    const sourceKeys = [...new Set(scenarios.flatMap((scenario) => scenario.attempts.map((attempt) => attempt.run_source.kind || attempt.run_source.label)))].sort();
    for (const sourceKey of sourceKeys) {
        const summaries = scenarios.flatMap((scenario) => scenario.attempts
            .filter((attempt) => (attempt.run_source.kind || attempt.run_source.label) === sourceKey)
            .map((attempt) => attempt.token_usage)
            .filter((usage) => Boolean(usage)));
        if (!summaries.length)
            continue;
        byRunSource[sourceKey] = aggregateTokenSummaries(summaries);
        available += summaries.filter((summary) => summary.availability !== "unavailable").length;
        unavailable += summaries.filter((summary) => summary.availability === "unavailable").length;
    }
    return { by_run_source: byRunSource, availability_counts: { available, unavailable } };
}
async function readAttemptTokenUsage(runRoot, evidencePath, legacy) {
    const usagePath = evidencePath ? node_path_1.default.join(runRoot, evidencePath, "usage.json") : "";
    if (usagePath && (await (0, project_1.exists)(usagePath))) {
        const evidence = await (0, project_1.readJson)(usagePath);
        return normalizeTokenUsageSummary(evidence.summary);
    }
    return normalizeLegacyTokenUsage(legacy);
}
function normalizeLegacyTokenUsage(value) {
    const object = objectValue(value);
    if (!Object.keys(object).length)
        return undefined;
    if (typeof object.availability === "string" && object.input_tokens && object.output_tokens && object.total_tokens && "sample_count" in object) {
        return normalizeTokenUsageSummary(object);
    }
    if (object.input_tokens || object.output_tokens || object.total_tokens) {
        return summarizeUsageSamples([normalizeTokenUsage(object)], "scenario");
    }
    return undefined;
}
function normalizeTokenUsageSummary(value) {
    const object = objectValue(value);
    return {
        availability: ["present", "partial", "unavailable"].includes(String(object.availability)) ? String(object.availability) : Number(object.sample_count || 0) > 0 ? "present" : "unavailable",
        sample_unit: object.sample_unit === "turn" ? "turn" : "scenario",
        sample_count: Number(object.sample_count || 0),
        unavailable_count: Number(object.unavailable_count || 0),
        input_tokens: normalizeStat(object.input_tokens),
        output_tokens: normalizeStat(object.output_tokens),
        total_tokens: normalizeStat(object.total_tokens),
        ...(object.cached_tokens ? { cached_tokens: normalizeStat(object.cached_tokens) } : {}),
        ...(object.reasoning_tokens ? { reasoning_tokens: normalizeStat(object.reasoning_tokens) } : {}),
        unavailable_reasons: Array.isArray(object.unavailable_reasons) ? object.unavailable_reasons.map(String) : []
    };
}
function aggregateTokenSummaries(summaries) {
    const usable = summaries.filter((summary) => summary.total_tokens.total > 0 || summary.sample_count > 0);
    const unavailableReasons = [...new Set(summaries.flatMap((summary) => summary.unavailable_reasons))].sort();
    const availability = usable.length === summaries.length && summaries.length > 0 ? "present" : usable.length > 0 ? "partial" : "unavailable";
    return {
        availability,
        sample_unit: "scenario",
        sample_count: usable.length,
        unavailable_count: summaries.length - usable.length,
        input_tokens: statFromNumbers(usable.map((summary) => summary.input_tokens.total)),
        output_tokens: statFromNumbers(usable.map((summary) => summary.output_tokens.total)),
        total_tokens: statFromNumbers(usable.map((summary) => summary.total_tokens.total)),
        ...(usable.some((summary) => summary.cached_tokens) ? { cached_tokens: statFromNumbers(usable.map((summary) => summary.cached_tokens?.total ?? 0)) } : {}),
        ...(usable.some((summary) => summary.reasoning_tokens) ? { reasoning_tokens: statFromNumbers(usable.map((summary) => summary.reasoning_tokens?.total ?? 0)) } : {}),
        unavailable_reasons: unavailableReasons
    };
}
function summarizeUsageSamples(samples, sampleUnit) {
    const present = samples.filter((usage) => usage.total_tokens.available);
    const unavailableReasons = [...new Set(samples.flatMap(reasonsForUsage))].sort();
    const unavailableCount = samples.length - present.length;
    const availability = present.length === samples.length && samples.length > 0 ? "present" : present.length > 0 ? "partial" : "unavailable";
    return {
        availability,
        sample_unit: sampleUnit,
        sample_count: present.length,
        unavailable_count: unavailableCount,
        input_tokens: statFromMetrics(present.map((usage) => usage.input_tokens)),
        output_tokens: statFromMetrics(present.map((usage) => usage.output_tokens)),
        total_tokens: statFromMetrics(present.map((usage) => usage.total_tokens)),
        unavailable_reasons: unavailableReasons
    };
}
function normalizeTokenUsage(value) {
    return {
        input_tokens: normalizeMetric(value.input_tokens),
        output_tokens: normalizeMetric(value.output_tokens),
        total_tokens: normalizeMetric(value.total_tokens)
    };
}
function normalizeRunSource(value, legacySide) {
    const object = objectValue(value);
    if (typeof object.kind === "string") {
        return {
            kind: object.kind,
            label: typeof object.label === "string" ? object.label : sentenceStatus(object.kind),
            skill_root: typeof object.skill_root === "string" || object.skill_root === null ? object.skill_root : undefined,
            attached_skill: object.attached_skill === true
        };
    }
    if (legacySide === "release")
        return { kind: "legacy_side", label: "Legacy saved snapshot side", skill_root: "../../../versions/release/skill", attached_skill: true };
    return { kind: legacySide ? "legacy_side" : "working_payload", label: legacySide ? "Legacy working payload side" : "Working payload", skill_root: "../../../..", attached_skill: true };
}
async function listArtifacts(runRoot, scenarios) {
    const artifacts = [];
    for (const scenario of scenarios) {
        for (const attempt of scenario.attempts) {
            const artifactRoot = node_path_1.default.join(runRoot, attempt.evidence_path, "artifacts");
            if (!(await (0, project_1.exists)(artifactRoot)))
                continue;
            for (const relative of await walkFiles(artifactRoot)) {
                artifacts.push({ scenario_id: scenario.id, path: node_path_1.default.join(attempt.evidence_path, "artifacts", relative).split(node_path_1.default.sep).join("/"), kind: "file", ...(attempt.legacy_side ? { legacy_side: attempt.legacy_side } : {}) });
            }
        }
    }
    return artifacts;
}
async function walkFiles(root, relativeDir = "") {
    const dir = node_path_1.default.join(root, relativeDir);
    const files = [];
    for (const entry of await node_fs_1.promises.readdir(dir, { withFileTypes: true }).catch(() => [])) {
        const relative = node_path_1.default.join(relativeDir, entry.name);
        if (entry.isDirectory())
            files.push(...(await walkFiles(root, relative)));
        else if (entry.isFile())
            files.push(relative.split(node_path_1.default.sep).join("/"));
    }
    return files.sort();
}
function indexRowFromReport(report) {
    const normalized = normalizeRunReportForRead(report);
    return {
        run_id: normalized.summary.run_id,
        label: normalized.summary.label,
        status: normalized.summary.status,
        created_at: normalized.summary.created_at,
        completed_at: normalized.summary.completed_at,
        scenario_count: normalized.summary.scenario_count,
        run_source: normalized.summary.run_source,
        manual_review_required: normalized.summary.manual_review_required,
        failure_classifications: normalized.summary.failure_classifications,
        assessment_status: normalized.summary.assessment_status,
        unresolved_count: normalized.summary.unresolved_count,
        readiness_status: normalized.readiness.status
    };
}
function indexRowFromRun(run, fallbackId) {
    const failures = Array.isArray(run.failure_classifications) ? run.failure_classifications.map(String) : [];
    return {
        run_id: String(run.run_id || fallbackId),
        label: run.label || null,
        status: String(run.status || "unknown"),
        created_at: run.created_at ? String(run.created_at) : undefined,
        completed_at: run.completed_at ? String(run.completed_at) : undefined,
        scenario_count: Array.isArray(run.scenarios?.selection) ? (run.scenarios.selection || []).length : 0,
        run_source: normalizeRunSource(run.run_source),
        manual_review_required: Boolean(run.manual_review_required),
        failure_classifications: failures,
        assessment_status: String(run.status || "unknown"),
        unresolved_count: Boolean(run.manual_review_required) ? 1 : 0,
        readiness_status: failures.length ? "blocked" : Boolean(run.manual_review_required) ? "needs_review" : "needs_review"
    };
}
function normalizeRunIndexRowForRead(value) {
    const row = objectValue(value);
    const failures = Array.isArray(row.failure_classifications) ? row.failure_classifications.map(String) : [];
    const status = String(row.status || "unknown");
    return {
        run_id: String(row.run_id || ""),
        label: row.label || null,
        status,
        created_at: row.created_at ? String(row.created_at) : undefined,
        completed_at: row.completed_at ? String(row.completed_at) : undefined,
        scenario_count: numberFrom(row.scenario_count),
        run_source: normalizeRunSource(row.run_source),
        manual_review_required: Boolean(row.manual_review_required),
        failure_classifications: failures,
        assessment_status: String(row.assessment_status || status),
        unresolved_count: numberFrom(row.unresolved_count),
        readiness_status: String(row.readiness_status || (failures.length ? "blocked" : Boolean(row.manual_review_required) ? "needs_review" : "needs_review"))
    };
}
function normalizeRunReportForRead(value) {
    const report = objectValue(value);
    const summary = objectValue(report.summary);
    const run = objectValue(report.run);
    const scenarios = Array.isArray(report.scenarios) ? report.scenarios.map(normalizeRunReportScenarioForRead) : [];
    const failureClassifications = Array.isArray(summary.failure_classifications) ? summary.failure_classifications.map(String) : [];
    const status = String(summary.status || run.status || "unknown");
    const unresolvedCount = summary.unresolved_count !== undefined ? numberFrom(summary.unresolved_count) : scenarios.reduce((sum, scenario) => sum + (scenario.unresolved ? 1 : 0), 0);
    const manualReviewRequired = Boolean(summary.manual_review_required ?? run.manual_review_required);
    const assessmentStatus = ["passed", "needs_review", "failed", "unknown"].includes(String(summary.assessment_status)) ? String(summary.assessment_status) : assessmentStatusFor(status, failureClassifications, unresolvedCount);
    const readiness = normalizeRunReadinessForRead(report.readiness, assessmentStatus, manualReviewRequired, failureClassifications, unresolvedCount);
    return {
        schema_version: 2,
        generated_at: typeof report.generated_at === "string" ? report.generated_at : (0, project_1.utcNow)(),
        run,
        summary: {
            run_id: String(summary.run_id || run.run_id || "unknown"),
            label: summary.label || null,
            status,
            created_at: summary.created_at ? String(summary.created_at) : undefined,
            completed_at: summary.completed_at ? String(summary.completed_at) : undefined,
            scenario_count: summary.scenario_count !== undefined ? numberFrom(summary.scenario_count) : scenarios.length,
            attempt_count: summary.attempt_count !== undefined ? numberFrom(summary.attempt_count) : scenarios.reduce((sum, scenario) => sum + scenario.attempts.length, 0),
            result_count: numberFrom(summary.result_count),
            run_source: normalizeRunSource(summary.run_source),
            manual_review_required: manualReviewRequired,
            failure_classifications: failureClassifications,
            assessment_status: assessmentStatus,
            unresolved_count: unresolvedCount,
            token_usage: summary.token_usage || { by_run_source: {}, availability_counts: { available: 0, unavailable: 0 } }
        },
        scenarios,
        tests: Array.isArray(report.tests) ? report.tests : [],
        judges: Array.isArray(report.judges) ? report.judges : [],
        feedback: Array.isArray(report.feedback) ? report.feedback : [],
        artifacts: normalizeRunArtifactsForRead(report.artifacts),
        readiness
    };
}
function normalizeRunReportScenarioForRead(value) {
    const scenario = objectValue(value);
    const rawAttempts = Array.isArray(scenario.attempts) ? scenario.attempts : Array.isArray(scenario.sides) ? scenario.sides : [];
    const attempts = rawAttempts.map(normalizeRunReportAttemptForRead);
    const status = String(scenario.status || scenarioStatus(attempts));
    return {
        id: String(scenario.id || scenario.folder || "unknown"),
        folder: String(scenario.folder || scenario.id || "unknown"),
        title: scenario.title ? String(scenario.title) : undefined,
        family: scenario.family ? String(scenario.family) : undefined,
        type: scenario.type ? String(scenario.type) : undefined,
        topics: Array.isArray(scenario.topics) ? scenario.topics.map(String) : [],
        capability: scenario.capability || null,
        criteria: normalizeScenarioCriteriaForRead(scenario.criteria),
        metadata: objectValue(scenario.metadata),
        evidence_basis: ["run_snapshot", "legacy_current_project", "unavailable"].includes(String(scenario.evidence_basis)) ? String(scenario.evidence_basis) : "unavailable",
        attempts,
        status,
        unresolved: Boolean(scenario.unresolved) || status === "needs_review" || attempts.some((attempt) => attempt.status === "needs_review")
    };
}
function normalizeRunReportAttemptForRead(value) {
    const attempt = objectValue(value);
    const legacySide = legacySideFromValue(attempt.side);
    return {
        run_source: normalizeRunSource(attempt.run_source, legacySide),
        status: String(attempt.status || "unknown"),
        evidence_path: String(attempt.evidence_path || ""),
        final_path: attempt.final_path ? String(attempt.final_path) : undefined,
        final_preview: attempt.final_preview ? String(attempt.final_preview) : "",
        token_usage: normalizeLegacyTokenUsage(attempt.token_usage),
        failure_classification: attempt.failure_classification || null,
        error: attempt.error ? String(attempt.error) : undefined,
        raw: objectValue(attempt.raw),
        ...(legacySide ? { legacy_side: legacySide } : {})
    };
}
function normalizeScenarioCriteriaForRead(value) {
    const criteria = objectValue(value);
    if (!Object.keys(criteria).length)
        return undefined;
    return {
        what_it_tests: criteria.what_it_tests ? String(criteria.what_it_tests) : undefined,
        expected_behavior: criteria.expected_behavior ? String(criteria.expected_behavior) : undefined,
        assertions: Array.isArray(criteria.assertions) ? criteria.assertions.map(String) : [],
        tests: Array.isArray(criteria.tests) ? criteria.tests.map(String) : [],
        judges: Array.isArray(criteria.judges) ? criteria.judges.map(String) : []
    };
}
function normalizeRunReadinessForRead(value, assessmentStatus, manualReviewRequired, failureClassifications, unresolvedCount) {
    const readiness = objectValue(value);
    if (["ready", "needs_review", "blocked"].includes(String(readiness.status))) {
        return {
            status: String(readiness.status),
            summary: String(readiness.summary || ""),
            blockers: Array.isArray(readiness.blockers) ? readiness.blockers.map(String) : [],
            unresolved: numberFrom(readiness.unresolved),
            basis: String(readiness.basis || "report.json")
        };
    }
    return readinessFor(assessmentStatus, manualReviewRequired, failureClassifications, unresolvedCount);
}
function normalizeRunArtifactsForRead(value) {
    if (!Array.isArray(value))
        return [];
    return value.map((artifact) => {
        const item = objectValue(artifact);
        const legacySide = legacySideFromValue(item.legacy_side || item.side);
        return {
            scenario_id: String(item.scenario_id || ""),
            path: String(item.path || ""),
            kind: String(item.kind || "file"),
            ...(legacySide ? { legacy_side: legacySide } : {})
        };
    });
}
function legacySideFromValue(value) {
    return value === "candidate" || value === "release" ? value : undefined;
}
function toReportAppModel(report) {
    const runner = objectValue(report.run.runner);
    const appServer = objectValue(runner.app_server);
    return {
        schema_version: 1,
        skill: { name: String(report.run.skill_name || report.run.skill || "Meta Skill") },
        run: {
            id: report.summary.run_id,
            label: report.summary.label,
            status: report.summary.status,
            assessment_status: report.summary.assessment_status,
            readiness_status: report.readiness.status,
            readiness_summary: report.readiness.summary,
            run_source: report.summary.run_source,
            manual_review_required: report.summary.manual_review_required,
            created_at: report.summary.created_at,
            completed_at: report.summary.completed_at,
            runner_backend: runner.backend ? String(runner.backend) : undefined,
            runner_mode: appServer.mode ? String(appServer.mode) : undefined
        },
        summary: {
            scenario_count: report.summary.scenario_count,
            attempt_count: report.summary.attempt_count,
            result_count: report.summary.result_count,
            unresolved_count: report.summary.unresolved_count,
            failure_classifications: report.summary.failure_classifications,
            token_usage: normalizeRunTokenUsageSummaryForRender(report.summary.token_usage)
        },
        scenarios: report.scenarios.map((scenario) => toReportAppScenario(report, scenario))
    };
}
function toReportAppScenario(report, scenario) {
    const evidence = evidenceRowsForScenario(report, scenario);
    return {
        id: scenario.id,
        folder: scenario.folder,
        title: scenario.title || scenario.folder,
        subtitle: scenarioSubtitle(scenario),
        status: scenario.status,
        unresolved: scenario.unresolved,
        evidence_basis: scenario.evidence_basis,
        criteria: criteriaRowsForScenario(scenario),
        attempts: attemptsForScenario(scenario),
        evidence,
        review_reasons: reviewReasonsForScenario(scenario, evidence)
    };
}
function scenarioSubtitle(scenario) {
    return [scenario.family, scenario.type, scenario.topics.join(", ")].filter(Boolean).join(" / ") || scenario.folder;
}
function attemptsForScenario(scenario) {
    return scenario.attempts
        .slice()
        .map((attempt) => ({
        source_kind: attempt.run_source.kind,
        label: attempt.run_source.label,
        status: attempt.status,
        final_preview: attempt.final_preview || "",
        final_href: attempt.final_path,
        token_usage: normalizeLegacyTokenUsage(attempt.token_usage),
        failure_classification: attempt.failure_classification,
        error: attempt.error,
        raw_links: rawLinksForAttempt(attempt)
    }));
}
function rawLinksForAttempt(attempt) {
    if (!attempt.evidence_path)
        return [];
    return ["final.md", "turns.jsonl", "usage.json", "rpc.jsonl"].map((file) => ({ label: file, href: `${attempt.evidence_path}/${file}`.split(node_path_1.default.sep).join("/") }));
}
function criteriaRowsForScenario(scenario) {
    const criteria = scenario.criteria;
    if (!criteria)
        return [];
    return [
        { label: "What it tests", value: criteria.what_it_tests || "" },
        { label: "Expected behavior", value: criteria.expected_behavior || "" },
        { label: "Assertions", value: criteria.assertions.join("\n") },
        { label: "Tests", value: criteria.tests.join(", ") },
        { label: "Judges", value: criteria.judges.join(", ") }
    ].filter((row) => row.value);
}
function evidenceRowsForScenario(report, scenario) {
    const rows = [];
    for (const attempt of scenario.attempts) {
        if (attempt.failure_classification || attempt.error)
            rows.push({ type: attempt.run_source.label, status: attempt.status, detail: attempt.failure_classification || attempt.error || "" });
    }
    for (const row of [...report.tests, ...report.judges, ...report.feedback]) {
        if (!eventMatchesScenario(row, scenario))
            continue;
        rows.push({
            type: evidenceTypeLabel(String(row.type || row.source || "evidence")),
            status: String(row.payload?.status || row.payload?.label || "recorded"),
            detail: String(row.payload?.id || row.payload?.failure_classification || row.payload?.reason || row.payload?.message || row.source || "")
        });
    }
    return rows;
}
function eventMatchesScenario(row, scenario) {
    const payload = row.payload || {};
    const candidates = [row.scenario_id, payload.scenario_id, payload.scenario_folder, payload.folder, payload.id].filter((value) => value !== undefined && value !== null).map(String);
    return candidates.includes(scenario.id) || candidates.includes(scenario.folder);
}
function reviewReasonsForScenario(scenario, evidence) {
    const reasons = new Set();
    if (scenario.status === "failed")
        reasons.add("Failed scenario evidence needs attention first.");
    if (scenario.unresolved || scenario.status === "needs_review")
        reasons.add("Needs review is unresolved evidence, not pass proof.");
    for (const row of evidence) {
        if (row.status === "failed" || row.status === "unavailable")
            reasons.add(`${sentenceStatus(row.status)} evidence: ${sentenceStatus(row.detail || row.type)}`);
    }
    for (const attempt of scenario.attempts) {
        if (attempt.error)
            reasons.add(attempt.error);
        if (attempt.failure_classification)
            reasons.add(sentenceStatus(attempt.failure_classification));
    }
    return [...reasons];
}
function defaultSelectedScenario(scenarios) {
    return scenarios.slice().sort((a, b) => statusRank(a.status) - statusRank(b.status))[0];
}
function statusRank(status) {
    if (status === "failed")
        return 0;
    if (status === "needs_review")
        return 1;
    if (status === "passed")
        return 2;
    return 3;
}
function renderEvalReportHtml(report) {
    const model = toReportAppModel(normalizeRunReportForRead(report));
    const selected = defaultSelectedScenario(model.scenarios);
    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Meta Skill Eval ${escapeHtml(model.run.id)}</title>
  <style>
    :root { color-scheme: light; --bg: #f6f6f4; --surface: #fffffd; --soft: #f9f9f7; --ink: #171717; --muted: #70706c; --line: #e7e4df; --line-strong: #d2cec6; --accent: #2563eb; --bad: #c9342b; --warn: #9c6500; --ok: #18733c; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: 14px; line-height: 1.48; }
    * { box-sizing: border-box; }
    body { margin: 0; background: var(--bg); color: var(--ink); }
    a { color: var(--accent); text-decoration: none; } a:hover { text-decoration: underline; }
    button, input { font: inherit; }
    .topbar { position: sticky; top: 0; z-index: 10; display: flex; justify-content: space-between; align-items: center; min-height: 48px; padding: 0 20px; border-bottom: 1px solid var(--line); background: rgba(255,255,253,.94); }
    .nav, .nav-actions { display: flex; gap: 18px; align-items: center; }
    .product { font-weight: 650; }
    .nav a, .nav-actions a { color: var(--ink); } .nav-actions a { color: var(--muted); }
    .app { display: grid; grid-template-columns: 288px minmax(0, 1fr) 306px; min-height: calc(100vh - 48px); background: var(--surface); }
    .left, .right { background: var(--soft); } .left { border-right: 1px solid var(--line); } .right { border-left: 1px solid var(--line); }
    .left-inner, .right-inner { padding: 18px; }
    .main { min-width: 0; padding: 32px 42px 48px; }
    h1, h2, h3, p, dl { margin: 0; } h1 { font-size: 23px; line-height: 1.22; font-weight: 650; } h2 { font-size: 14px; font-weight: 650; } h3 { font-size: 13px; font-weight: 650; }
    .muted { color: var(--muted); font-size: 12px; }
    .run-select { display: grid; gap: 4px; padding-bottom: 18px; border-bottom: 1px solid var(--line); }
    .scenario-tools { display: grid; gap: 10px; padding: 18px 0 12px; }
    .scenario-tools h2 { display: flex; justify-content: space-between; font-size: 13px; }
    .search { width: 100%; height: 34px; padding: 0 10px; border: 1px solid var(--line); border-radius: 4px; background: var(--surface); outline: none; }
    .search:focus, .filter:focus-visible, .scenario-row:focus-visible { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(37,99,235,.14); }
    .filters { display: flex; flex-wrap: wrap; gap: 6px; }
    .filter { min-height: 28px; padding: 3px 8px; border: 1px solid transparent; border-radius: 4px; background: transparent; color: var(--muted); cursor: pointer; }
    .filter[aria-pressed="true"] { border-color: var(--ink); color: var(--ink); }
    .scenario-list { display: grid; gap: 2px; margin-top: 6px; }
    .scenario-row { width: 100%; padding: 9px 8px; border: 1px solid transparent; border-radius: 4px; background: transparent; text-align: left; cursor: pointer; }
    .scenario-row[aria-current="true"] { background: var(--surface); border-color: transparent; box-shadow: inset 2px 0 0 var(--ink); }
    .scenario-row strong { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .scenario-row span { display: block; margin-top: 2px; color: var(--muted); font-size: 12px; }
    .status { display: inline-flex; gap: 6px; align-items: center; font-size: 12px; color: var(--muted); }
    .dot { width: 7px; height: 7px; border-radius: 999px; background: var(--muted); }
    .failed .dot { background: var(--bad); } .needs_review .dot { background: var(--warn); } .passed .dot { background: var(--ok); }
    .scenario-head { display: grid; gap: 8px; padding-bottom: 22px; border-bottom: 1px solid var(--line); }
    .fact-row { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0; margin: 20px 0 2px; border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); }
    .fact { padding: 11px 0; border-right: 0; } .fact span { display: block; color: var(--muted); font-size: 12px; } .fact strong { display: block; margin-top: 3px; font-weight: 600; }
    .section { padding: 24px 0; border-top: 1px solid var(--line); } .section:first-of-type { border-top: 0; }
    .reason-list { display: grid; gap: 7px; margin-top: 12px; padding: 0; list-style: none; }
    .reason-list li { display: grid; grid-template-columns: 10px minmax(0, 1fr); gap: 9px; align-items: start; color: #2f2f2d; }
    .reason-list li::before { content: ""; width: 5px; height: 5px; margin-top: 8px; border-radius: 999px; background: var(--muted); }
    .failed .reason-list li::before { background: var(--bad); }
    .answers { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
    .answer { min-width: 0; padding-top: 10px; border-top: 1px solid var(--line); }
    .answer h3 { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
    .answer pre { white-space: pre-wrap; color: #2d2d2d; background: transparent; border: 0; padding: 0; margin: 12px 0 0; font: inherit; }
    .answer-actions { margin-top: 12px; }
    .answer-actions a { color: var(--muted); font-size: 12px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; } th, td { padding: 8px 0; border-bottom: 1px solid var(--line); text-align: left; vertical-align: top; } th { color: var(--muted); font-size: 12px; font-weight: 600; }
    .rail-section { padding: 18px 0; border-top: 1px solid var(--line); } .rail-section:first-child { border-top: 0; } .kv { display: grid; gap: 8px; margin-top: 10px; } .kv div { display: flex; justify-content: space-between; gap: 12px; } .kv dt { color: var(--muted); } .kv dd { margin: 0; text-align: right; }
    .rail-note { margin-top: 10px; max-width: 34ch; }
    .links { display: grid; gap: 14px; margin-top: 10px; }
    .raw-group { display: grid; gap: 6px; }
    .raw-group strong { color: var(--muted); font-size: 12px; font-weight: 600; }
    .raw-files { display: flex; flex-wrap: wrap; gap: 6px 12px; }
    .raw-files a { white-space: nowrap; }
    .empty { color: var(--muted); font-size: 13px; padding: 14px 0; }
    @media (max-width: 980px) { .app { grid-template-columns: 1fr; } .left, .right { border: 0; border-bottom: 1px solid var(--line); } .right { border-top: 1px solid var(--line); } .left-inner, .right-inner { padding: 16px 18px; } .main { padding: 26px 20px; } .fact-row, .answers { grid-template-columns: 1fr; } .fact { border-right: 0; border-bottom: 1px solid var(--line); } .fact:last-child { border-bottom: 0; } .topbar { align-items: flex-start; flex-direction: column; gap: 8px; padding: 12px 18px; } }
  </style>
</head>
<body>
  <nav class="topbar">
    <div class="nav"><span class="product">Meta Skill evals</span><a href="../index.json">Runs</a></div>
    <div class="nav-actions"><a href="run.json">Run JSON</a><a href="report.json">Report JSON</a></div>
  </nav>
  <div class="app">
    <aside class="left"><div class="left-inner">
      <div class="run-select"><span class="muted">Run</span><strong>${escapeHtml(model.run.id)}</strong><span class="muted">${escapeHtml(sentenceStatus(model.run.status))} · ${model.summary.scenario_count} scenarios</span></div>
      <div class="scenario-tools">
        <h2>Scenarios <span class="muted" id="scenario-count">${model.scenarios.length}</span></h2>
        <input class="search" id="scenario-search" type="search" placeholder="Search scenarios" aria-label="Search scenarios">
        <div class="filters" id="filters">
          ${["all", "failed", "needs_review", "passed", "no_tokens"].map((filter) => `<button class="filter" type="button" data-filter="${filter}" aria-pressed="${filter === "all"}">${escapeHtml(filterLabel(filter))}</button>`).join("")}
        </div>
      </div>
      <div class="scenario-list" id="scenario-list">${renderScenarioRail(model.scenarios, selected?.id)}</div>
      <p class="muted" style="margin-top:18px;">Forced-skill run: final-answer behavior only.</p>
    </div></aside>
    <main class="main" id="scenario-detail">${selected ? renderScenarioDetail(selected, model) : '<p class="empty">No scenarios recorded.</p>'}</main>
    <aside class="right"><div class="right-inner" id="metadata-rail">${renderMetadataRail(selected, model)}</div></aside>
  </div>
  <div hidden>
    <span>lint skipped</span>
    <span>Judge Details</span>
  </div>
  <script type="application/json" id="report-data">${escapeJsonForHtml(model)}</script>
  <script>
${REPORT_APP_JS}
  </script>
</body>
</html>`;
}
function renderRunTokenSummary(summary) {
    const normalized = normalizeRunTokenUsageSummaryForRender(summary);
    if ("legacy" in normalized) {
        return `<p class="muted">Legacy availability counts: ${normalized.legacy.available} available, ${normalized.legacy.unavailable} unavailable. Detailed token totals are unavailable in v1 reports.</p>`;
    }
    const rows = Object.entries(normalized.by_run_source)
        .map(([source, usage]) => {
        if (!usage)
            return "";
        return `<tr><td>${escapeHtml(sentenceStatus(source))}</td><td>${escapeHtml(usage.availability)}</td><td>${usage.sample_count}</td><td>${formatNumber(usage.total_tokens.total)}</td><td>${formatNumber(usage.total_tokens.average)}</td><td>${formatNumber(usage.input_tokens.total)}</td><td>${formatNumber(usage.output_tokens.total)}</td><td>${escapeHtml(usage.unavailable_reasons.join("; ") || "none")}</td></tr>`;
    })
        .filter(Boolean)
        .join("\n");
    if (!rows)
        return '<p class="muted">No token usage recorded.</p>';
    return `<table>
    <thead><tr><th>Source</th><th>Availability</th><th>Samples</th><th>Total Tokens</th><th>Avg / Scenario</th><th>Input</th><th>Output</th><th>Unavailable Reasons</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <p class="muted">Availability counts: ${normalized.availability_counts.available} available, ${normalized.availability_counts.unavailable} unavailable. Token usage is measured telemetry and is not a readiness verdict.</p>`;
}
function renderSideTokenUsage(value) {
    const summary = normalizeLegacyTokenUsage(value);
    if (!summary)
        return '<span class="muted">unavailable</span>';
    const reasons = summary.unavailable_reasons.length ? `<br><span class="muted">${escapeHtml(summary.unavailable_reasons.join("; "))}</span>` : "";
    return `<strong>${formatNumber(summary.total_tokens.total)}</strong> total<br><span class="muted">${escapeHtml(summary.availability)}; ${formatNumber(summary.input_tokens.total)} in / ${formatNumber(summary.output_tokens.total)} out</span>${reasons}`;
}
function normalizeRunTokenUsageSummaryForRender(value) {
    const object = objectValue(value);
    if (!("by_run_source" in object) && !("by_side" in object) && ("available" in object || "unavailable" in object)) {
        return { legacy: { available: numberFrom(object.available), unavailable: numberFrom(object.unavailable) } };
    }
    const byRunSource = objectValue(object.by_run_source);
    const legacyBySide = objectValue(object.by_side);
    const counts = objectValue(object.availability_counts);
    return {
        by_run_source: {
            ...Object.fromEntries(Object.entries(byRunSource).map(([key, usage]) => [key, normalizeTokenUsageSummary(usage)])),
            ...(legacyBySide.candidate ? { legacy_working_payload_side: normalizeTokenUsageSummary(legacyBySide.candidate) } : {}),
            ...(legacyBySide.release ? { legacy_saved_snapshot_side: normalizeTokenUsageSummary(legacyBySide.release) } : {})
        },
        availability_counts: {
            available: numberFrom(counts.available),
            unavailable: numberFrom(counts.unavailable)
        }
    };
}
function renderScenarioRail(scenarios, selectedId) {
    if (!scenarios.length)
        return '<p class="empty">No scenarios match this filter.</p>';
    return scenarios
        .map((scenario) => `<button class="scenario-row" type="button" data-scenario-id="${escapeHtml(scenario.id)}" aria-current="${scenario.id === selectedId}">
      <strong>${escapeHtml(scenario.id)} · ${escapeHtml(scenario.title)}</strong>
      <span>${escapeHtml(sentenceStatus(scenario.status))} · ${escapeHtml(scenario.attempts.map((attempt) => attempt.label).join(", ") || "No output")}</span>
    </button>`)
        .join("");
}
function renderScenarioDetail(scenario, model) {
    return `<div class="scenario-head">
    <span class="status ${escapeHtml(scenario.status)}"><span class="dot"></span>${escapeHtml(sentenceStatus(scenario.status))}</span>
    <h1>${escapeHtml(scenario.title)}</h1>
    <p class="muted">${escapeHtml(scenario.id)} · ${escapeHtml(scenario.subtitle)}</p>
  </div>
  <div class="fact-row">
    <div class="fact"><span>Run</span><strong>${escapeHtml(model.run.id)}</strong></div>
    <div class="fact"><span>Source</span><strong>${escapeHtml(model.run.run_source.label)}</strong></div>
    <div class="fact"><span>Evidence basis</span><strong>${escapeHtml(sentenceStatus(scenario.evidence_basis))}</strong></div>
    <div class="fact"><span>Scenario status</span><strong>${escapeHtml(sentenceStatus(scenario.status))}</strong></div>
  </div>
  <section class="section">
    <h2>Review reasons</h2>
    ${scenario.review_reasons.length ? `<ul class="reason-list">${scenario.review_reasons.map((reason) => `<li>${escapeHtml(reason)}</li>`).join("")}</ul>` : '<p class="empty">No review reasons recorded.</p>'}
  </section>
  <section class="section">
    <h2>Final answer preview</h2>
    <div class="answers">${renderAttemptPreviews(scenario, model)}</div>
  </section>
  <section class="section">
    <h2>Evaluation evidence</h2>
    ${scenario.evidence.length ? `<table><thead><tr><th>Type</th><th>Status</th><th>Detail</th></tr></thead><tbody>${scenario.evidence.map((row) => `<tr><td>${escapeHtml(row.type)}</td><td>${escapeHtml(sentenceStatus(row.status))}</td><td>${escapeHtml(row.detail || "recorded")}</td></tr>`).join("")}</tbody></table>` : '<p class="empty">No confidently matched tests, judges, or feedback for this scenario.</p>'}
  </section>
  <section class="section">
    <h2>Criteria</h2>
    ${scenario.criteria.length ? `<table><tbody>${scenario.criteria.map((row) => `<tr><th>${escapeHtml(row.label)}</th><td>${escapeHtml(row.value)}</td></tr>`).join("")}</tbody></table>` : '<p class="empty">No criteria recorded.</p>'}
  </section>`;
}
function renderAttemptPreviews(scenario, model) {
    return (scenario.attempts.length ? scenario.attempts : [{ label: model.run.run_source.label, status: "unknown", final_preview: "No final output recorded.", source_kind: model.run.run_source.kind, raw_links: [] }])
        .map((attempt) => {
        const problem = [attempt.failure_classification, attempt.error].filter(Boolean).join(" · ");
        return `<div class="answer"><h3><span>${escapeHtml(attempt.label)}</span> <span class="status ${escapeHtml(attempt.status)}"><span class="dot"></span>${escapeHtml(sentenceStatus(attempt.status))}</span></h3>${problem ? `<p class="muted">${escapeHtml(sentenceStatus(problem))}</p>` : ""}<pre>${escapeHtml(attempt.final_preview || "No final output recorded.")}</pre>${attempt.final_href ? `<p class="answer-actions"><a href="${escapeHtml(attempt.final_href)}">Open final</a></p>` : ""}</div>`;
    })
        .join("");
}
function renderMetadataRail(scenario, model) {
    return `<section class="rail-section">
    <h2>Run details</h2>
    <dl class="kv">
      <div><dt>Status</dt><dd>${escapeHtml(sentenceStatus(model.run.status))}</dd></div>
      <div><dt>Readiness</dt><dd>${escapeHtml(sentenceStatus(model.run.readiness_status))}</dd></div>
      <div><dt>Assessment</dt><dd>${escapeHtml(sentenceStatus(model.run.assessment_status))}</dd></div>
      <div><dt>Manual review</dt><dd>${model.run.manual_review_required ? "yes" : "no"}</dd></div>
      <div><dt>Runner</dt><dd>${escapeHtml([model.run.runner_backend, model.run.runner_mode].filter(Boolean).join(" / ") || "unknown")}</dd></div>
    </dl>
    <p class="muted rail-note">${escapeHtml(model.run.readiness_summary)} ${model.run.status === "needs_review" ? "Needs review remains unresolved; not pass proof." : ""}</p>
  </section>
  <section class="rail-section">
    <h2>Token usage</h2>
    ${scenario ? renderScenarioTokenUsage(scenario) : '<p class="empty">No scenario selected.</p>'}
    ${renderRunTokenFootnote(model.summary.token_usage)}
  </section>
  <section class="rail-section">
    <h2>Raw evidence</h2>
    ${scenario ? renderRawLinks(scenario) : '<p class="empty">No scenario selected.</p>'}
  </section>`;
}
function renderScenarioTokenUsage(scenario) {
    if (!scenario.attempts.length)
        return '<p class="empty">No token usage recorded.</p>';
    return `<table><thead><tr><th>Source</th><th>Total</th><th>Input</th><th>Output</th></tr></thead><tbody>${scenario.attempts
        .map((attempt) => {
        const usage = attempt.token_usage;
        return `<tr><td>${escapeHtml(attempt.label)}</td><td>${usage ? formatNumber(usage.total_tokens.total) : "unavailable"}</td><td>${usage ? formatNumber(usage.input_tokens.total) : "-"}</td><td>${usage ? formatNumber(usage.output_tokens.total) : "-"}</td></tr>`;
    })
        .join("")}</tbody></table>`;
}
function renderRunTokenFootnote(summary) {
    if ("legacy" in summary)
        return `<p class="muted rail-note">Legacy availability counts: ${summary.legacy.available} available, ${summary.legacy.unavailable} unavailable.</p>`;
    return `<p class="muted rail-note">Token usage is measured telemetry, not a quality score. Availability: ${summary.availability_counts.available} available, ${summary.availability_counts.unavailable} unavailable.</p>`;
}
function renderRawLinks(scenario) {
    const groups = scenario.attempts.filter((attempt) => attempt.raw_links.length);
    if (!groups.length)
        return '<p class="empty">No raw evidence links recorded.</p>';
    return `<div class="links">${groups
        .map((attempt) => `<div class="raw-group"><strong>${escapeHtml(attempt.label)}</strong><div class="raw-files">${attempt.raw_links.map((raw) => `<a href="${escapeHtml(raw.href)}">${escapeHtml(raw.label)}</a>`).join("")}</div></div>`)
        .join("")}</div>`;
}
function filterLabel(filter) {
    if (filter === "all")
        return "All";
    if (filter === "failed")
        return "Failed";
    if (filter === "needs_review")
        return "Review";
    if (filter === "passed")
        return "Passed";
    return "No tokens";
}
function sentenceStatus(value) {
    return value.replace(/[_-]/g, " ").replace(/\s+/g, " ").trim().replace(/\b\w/g, (letter) => letter.toUpperCase());
}
function evidenceTypeLabel(value) {
    if (value === "test_result")
        return "Deterministic test";
    if (value === "judge_result")
        return "Judge";
    if (value === "lint_summary")
        return "Lint summary";
    if (value === "lint_skipped")
        return "Lint skipped";
    if (value === "candidate")
        return "Legacy working payload side";
    if (value === "release")
        return "Legacy saved snapshot side";
    return sentenceStatus(value);
}
function escapeJsonForHtml(value) {
    return JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
}
const REPORT_APP_JS = `
const data = JSON.parse(document.getElementById("report-data").textContent);
let selectedId = (data.scenarios.find((s) => s.status === "failed") || data.scenarios.find((s) => s.status === "needs_review") || data.scenarios[0] || {}).id;
let filter = "all";
const search = document.getElementById("scenario-search");
const list = document.getElementById("scenario-list");
const count = document.getElementById("scenario-count");
const detail = document.getElementById("scenario-detail");
const rail = document.getElementById("metadata-rail");
function esc(value) { return String(value ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }
function label(value) { return String(value || "").replace(/_/g, " ").replace(/\\b\\w/g, (letter) => letter.toUpperCase()); }
function evidenceLabel(value) { return label(String(value || "").replace(/-/g, " ")); }
function number(value) { return Number.isInteger(value) ? String(value) : Number(value || 0).toFixed(1); }
function hasNoTokens(s) { return !s.attempts.some((a) => a.token_usage && a.token_usage.availability !== "unavailable"); }
function filtered() {
  const q = search.value.trim().toLowerCase();
  return data.scenarios.filter((s) => {
    const filterOk = filter === "all" || (filter === "no_tokens" ? hasNoTokens(s) : s.status === filter);
    const hay = [s.id, s.title, s.subtitle, s.status, s.attempts.map((a) => a.label).join(" ")].join(" ").toLowerCase();
    return filterOk && (!q || hay.includes(q));
  });
}
function renderList() {
  const rows = filtered();
  count.textContent = rows.length;
  list.innerHTML = rows.length ? rows.map((s) => '<button class="scenario-row" type="button" data-scenario-id="' + esc(s.id) + '" aria-current="' + (s.id === selectedId) + '"><strong>' + esc(s.id) + ' · ' + esc(s.title) + '</strong><span>' + esc(label(s.status)) + ' · ' + esc(s.attempts.map((a) => a.label).join(", ") || "No output") + '</span></button>').join("") : '<p class="empty">No scenarios match this filter.</p>';
  list.querySelectorAll("button").forEach((button) => button.addEventListener("click", () => { selectedId = button.dataset.scenarioId; render(); }));
}
function attemptBlocks(s) {
  const attempts = s.attempts.length ? s.attempts : [{ label: data.run.run_source.label, status: "unknown", final_preview: "No final output recorded.", raw_links: [] }];
  return attempts.map((a) => {
    const problem = [a.failure_classification, a.error].filter(Boolean).join(" · ");
    return '<div class="answer"><h3><span>' + esc(a.label) + '</span> <span class="status ' + esc(a.status) + '"><span class="dot"></span>' + esc(label(a.status)) + '</span></h3>' + (problem ? '<p class="muted">' + esc(evidenceLabel(problem)) + '</p>' : '') + '<pre>' + esc(a.final_preview || "No final output recorded.") + '</pre>' + (a.final_href ? '<p class="answer-actions"><a href="' + esc(a.final_href) + '">Open final</a></p>' : '') + '</div>';
  }).join("");
}
function renderDetail(s) {
  if (!s) return '<p class="empty">No scenarios recorded.</p>';
  const reasons = s.review_reasons.length ? '<ul class="reason-list">' + s.review_reasons.map((r) => '<li>' + esc(r) + '</li>').join("") + '</ul>' : '<p class="empty">No review reasons recorded.</p>';
  const evidence = s.evidence.length ? '<table><thead><tr><th>Type</th><th>Status</th><th>Detail</th></tr></thead><tbody>' + s.evidence.map((r) => '<tr><td>' + esc(evidenceLabel(r.type)) + '</td><td>' + esc(label(r.status)) + '</td><td>' + esc(evidenceLabel(r.detail || "recorded")) + '</td></tr>').join("") + '</tbody></table>' : '<p class="empty">No confidently matched tests, judges, or feedback for this scenario.</p>';
  const criteria = s.criteria.length ? '<table><tbody>' + s.criteria.map((r) => '<tr><th>' + esc(r.label) + '</th><td>' + esc(r.value) + '</td></tr>').join("") + '</tbody></table>' : '<p class="empty">No criteria recorded.</p>';
  return '<div class="scenario-head"><span class="status ' + esc(s.status) + '"><span class="dot"></span>' + esc(label(s.status)) + '</span><h1>' + esc(s.title) + '</h1><p class="muted">' + esc(s.id) + ' · ' + esc(s.subtitle) + '</p></div><div class="fact-row"><div class="fact"><span>Run</span><strong>' + esc(data.run.id) + '</strong></div><div class="fact"><span>Source</span><strong>' + esc(data.run.run_source.label) + '</strong></div><div class="fact"><span>Evidence basis</span><strong>' + esc(label(s.evidence_basis)) + '</strong></div><div class="fact"><span>Scenario status</span><strong>' + esc(label(s.status)) + '</strong></div></div><section class="section"><h2>Review reasons</h2>' + reasons + '</section><section class="section"><h2>Final answer preview</h2><div class="answers">' + attemptBlocks(s) + '</div></section><section class="section"><h2>Evaluation evidence</h2>' + evidence + '</section><section class="section"><h2>Criteria</h2>' + criteria + '</section>';
}
function renderRail(s) {
  const tokenRows = s && s.attempts.length ? '<table><thead><tr><th>Source</th><th>Total</th><th>Input</th><th>Output</th></tr></thead><tbody>' + s.attempts.map((a) => '<tr><td>' + esc(a.label) + '</td><td>' + (a.token_usage ? number(a.token_usage.total_tokens.total) : "unavailable") + '</td><td>' + (a.token_usage ? number(a.token_usage.input_tokens.total) : "-") + '</td><td>' + (a.token_usage ? number(a.token_usage.output_tokens.total) : "-") + '</td></tr>').join("") + '</tbody></table>' : '<p class="empty">No token usage recorded.</p>';
  const raw = s ? s.attempts.filter((a) => a.raw_links.length).map((a) => '<div class="raw-group"><strong>' + esc(a.label) + '</strong><div class="raw-files">' + a.raw_links.map((r) => '<a href="' + esc(r.href) + '">' + esc(r.label) + '</a>').join("") + '</div></div>').join("") : "";
  const legacy = data.summary.token_usage.legacy;
  const foot = legacy ? 'Legacy availability counts: ' + legacy.available + ' available, ' + legacy.unavailable + ' unavailable.' : 'Token usage is measured telemetry, not a quality score. Availability: ' + data.summary.token_usage.availability_counts.available + ' available, ' + data.summary.token_usage.availability_counts.unavailable + ' unavailable.';
  return '<section class="rail-section"><h2>Run details</h2><dl class="kv"><div><dt>Status</dt><dd>' + esc(label(data.run.status)) + '</dd></div><div><dt>Readiness</dt><dd>' + esc(label(data.run.readiness_status)) + '</dd></div><div><dt>Assessment</dt><dd>' + esc(label(data.run.assessment_status)) + '</dd></div><div><dt>Manual review</dt><dd>' + (data.run.manual_review_required ? "yes" : "no") + '</dd></div><div><dt>Runner</dt><dd>' + esc([data.run.runner_backend, data.run.runner_mode].filter(Boolean).join(" / ") || "unknown") + '</dd></div></dl><p class="muted rail-note">' + esc(data.run.readiness_summary + (data.run.status === "needs_review" ? " Needs review remains unresolved; not pass proof." : "")) + '</p></section><section class="rail-section"><h2>Token usage</h2>' + tokenRows + '<p class="muted rail-note">' + esc(foot) + '</p></section><section class="rail-section"><h2>Raw evidence</h2><div class="links">' + (raw || '<p class="empty">No raw evidence links recorded.</p>') + '</div></section>';
}
function render() {
  renderList();
  const scenario = data.scenarios.find((s) => s.id === selectedId) || data.scenarios[0];
  detail.innerHTML = renderDetail(scenario);
  rail.innerHTML = renderRail(scenario);
}
search.addEventListener("input", render);
document.getElementById("filters").querySelectorAll("button").forEach((button) => button.addEventListener("click", () => {
  filter = button.dataset.filter;
  document.querySelectorAll(".filter").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
  render();
}));
render();
`;
function renderScenarioCard(scenario) {
    const criteria = scenario.criteria;
    return `<section class="scenario">
    <h3>${escapeHtml(scenario.id)} ${escapeHtml(scenario.title || scenario.folder)}</h3>
    <p class="muted">${escapeHtml([scenario.family, scenario.type, scenario.topics.join(", ")].filter(Boolean).join(" / "))}</p>
    <p><strong>Evidence basis:</strong> ${escapeHtml(scenario.evidence_basis)}</p>
    <p><strong>Capability:</strong> ${escapeHtml(scenario.capability || "not recorded")}</p>
    <p><strong>Expected behavior:</strong> ${escapeHtml(criteria?.expected_behavior || "not recorded")}</p>
    <table>
      <thead><tr><th>Assertions</th><th>Tests</th><th>Judges</th></tr></thead>
      <tbody><tr><td>${escapeHtml((criteria?.assertions || []).join("\n") || "none")}</td><td>${escapeHtml((criteria?.tests || []).join(", ") || "none")}</td><td>${escapeHtml((criteria?.judges || []).join(", ") || "none")}</td></tr></tbody>
    </table>
  </section>`;
}
function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}
async function readJsonl(target) {
    if (!(await (0, project_1.exists)(target)))
        return [];
    return (await node_fs_1.promises.readFile(target, "utf8"))
        .split(/\r?\n/)
        .filter(Boolean)
        .map((line) => JSON.parse(line));
}
function countBy(rows, keyFor) {
    const counts = {};
    for (const row of rows) {
        const key = keyFor(row);
        counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
}
function formatCounts(counts) {
    const entries = Object.entries(counts).sort();
    if (!entries.length)
        return "none";
    return entries.map(([key, value]) => `${escapeHtml(key)}: ${value}`).join("<br>");
}
function formatTestSummary(rows) {
    const results = rows.filter((row) => row.type === "test_result");
    const skipped = rows.filter((row) => row.type === "lint_skipped").length;
    const counts = countBy(results, (row) => String(row.payload?.status || "unknown"));
    const summary = formatCounts(counts);
    return `${summary}${skipped ? `<br>lint skipped: ${skipped}` : ""}`;
}
function formatJudgeSummary(rows) {
    return formatCounts(countBy(rows, (row) => String(row.payload?.status || "unknown")));
}
function formatFeedbackSummary(rows) {
    return formatCounts(countBy(rows, (row) => String(row.payload?.label || row.payload?.status || "unlabeled")));
}
function normalizeStat(value) {
    const object = objectValue(value);
    return {
        total: Number(object.total || 0),
        average: Number(object.average || 0),
        min: Number(object.min || 0),
        max: Number(object.max || 0)
    };
}
function normalizeMetric(value) {
    const object = objectValue(value);
    if (object.available === true)
        return { available: true, value: Number(object.value || 0) };
    return { available: false, reason: String(object.reason || "Token metrics were unavailable.") };
}
function statFromMetrics(metrics) {
    return statFromNumbers(metrics.filter((metric) => Boolean(metric?.available)).map((metric) => metric.value));
}
function statFromNumbers(values) {
    const finite = values.filter((value) => Number.isFinite(value));
    if (!finite.length)
        return { total: 0, average: 0, min: 0, max: 0 };
    const total = finite.reduce((sum, value) => sum + value, 0);
    return { total, average: total / finite.length, min: Math.min(...finite), max: Math.max(...finite) };
}
function reasonsForUsage(usage) {
    return [usage.input_tokens, usage.output_tokens, usage.total_tokens, usage.cached_tokens, usage.reasoning_tokens]
        .filter((metric) => Boolean(metric && !metric.available))
        .map((metric) => metric.reason);
}
function formatNumber(value) {
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
function numberFrom(value) {
    const number = Number(value || 0);
    return Number.isFinite(number) ? number : 0;
}
async function readFinalPreview(finalPath) {
    if (!(await (0, project_1.exists)(finalPath)))
        return "";
    const text = (await (0, project_1.readText)(finalPath)).trim().replace(/\s+/g, " ");
    return text.length > 180 ? `${text.slice(0, 177)}...` : text;
}
function link(relative, label) {
    if (!relative)
        return "";
    return `<a href="${escapeHtml(relative.split(node_path_1.default.sep).join("/"))}">${escapeHtml(label)}</a>`;
}
function renderEventTable(rows, columns) {
    if (!rows.length)
        return '<p class="muted">No rows recorded.</p>';
    return `<table><thead><tr>${columns.map((column) => `<th>${escapeHtml(column)}</th>`).join("")}<th>Summary</th></tr></thead><tbody>${rows
        .map((row) => {
        const payload = row.payload || {};
        const rowValues = row;
        return `<tr>${columns
            .map((column) => `<td>${escapeHtml(rowValues[column] ?? payload[column] ?? "")}</td>`)
            .join("")}<td><pre>${escapeHtml(JSON.stringify(payload, null, 2))}</pre></td></tr>`;
    })
        .join("\n")}</tbody></table>`;
}
function vectorRows(vectors) {
    return vectors.map((vector) => `| ${pipe(vector.name)} | ${pipe(vector.reasoning || "")} | ${escapeMarkdown(vector.score)} / ${escapeMarkdown(vector.max)} |`).join("\n");
}
function objectValue(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}
function arrayValue(value) {
    return Array.isArray(value) ? value.filter((item) => Boolean(item) && typeof item === "object" && !Array.isArray(item)) : [];
}
function pipe(value) {
    return escapeMarkdown(value).replace(/\|/g, "\\|");
}
function escapeMarkdown(value) {
    return String(value ?? "");
}
