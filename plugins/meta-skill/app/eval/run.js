"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runEval = runEval;
const node_path_1 = __importDefault(require("node:path"));
const client_1 = require("../app-server/client");
const runner_1 = require("../app-server/runner");
const lint_1 = require("../lint");
const project_1 = require("../project");
const judge_1 = require("./judge");
const results_1 = require("./results");
const scenarios_1 = require("./scenarios");
const runs_1 = require("./runs");
async function runEval(options) {
    if (options.appServerEndpoint) {
        throw new project_1.CliError("--app-server-endpoint is not supported yet; omit it to use the managed stdio App Server", 2);
    }
    const root = await (0, project_1.requirePortableSkill)(options.project);
    const p = (0, project_1.projectPaths)(root);
    if (!(await (0, project_1.exists)(p.evalManifest)))
        throw new project_1.CliError("eval workbench is missing; run `meta-skill eval init <project>` first");
    const preflight = await (0, lint_1.lintProject)(root, { executeTests: false });
    if (preflight.failures.length) {
        throw new project_1.CliError(`lint failed before eval run:\n${preflight.failures.map((failure) => `- ${failure.message}`).join("\n")}`);
    }
    const scenarios = await (0, scenarios_1.loadScenarios)(root, options.selector);
    if (!scenarios.length)
        throw new project_1.CliError("no scenarios selected");
    const runSourceKind = options.runSource || "working_payload";
    const runSourceConfig = evalRunSourceConfig(runSourceKind, root, p.releaseSkill);
    if (runSourceKind === "snapshot_payload") {
        if (!(await (0, project_1.exists)(node_path_1.default.join(p.releaseSkill, "SKILL.md")))) {
            throw new project_1.CliError("`--snapshot` requires .meta-skill/versions/release/skill/SKILL.md; run `meta-skill release <project>` first");
        }
    }
    const runId = await (0, project_1.nextSequencedId)(p.runs, options.label || runSourceConfig.defaultLabel);
    const runRoot = node_path_1.default.join(p.runs, runId);
    await (0, project_1.ensureDir)(runRoot);
    for (const file of ["events.jsonl", "results.jsonl", "tests.jsonl", "grades.jsonl", "feedback.jsonl"]) {
        await (0, project_1.touch)(node_path_1.default.join(runRoot, file));
    }
    const appServer = await (0, client_1.appServerConfig)(options.appServerEndpoint);
    const runnerVersion = await (0, client_1.codexVersion)();
    const runJson = {
        schema_version: 1,
        run_id: runId,
        created_at: (0, project_1.utcNow)(),
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
    await (0, project_1.writeJson)(node_path_1.default.join(runRoot, "run.json"), runJson);
    await (0, project_1.appendJsonl)(node_path_1.default.join(runRoot, "events.jsonl"), (0, project_1.eventEnvelope)({ type: "run_started", run_id: runId, source: "meta-skill eval run", payload: runJson }));
    await (0, scenarios_1.writeRunScenarioSnapshots)(runRoot, scenarios);
    const runner = options.scenarioRunner || new runner_1.AppServerScenarioRunner();
    let hasFailures = false;
    const scenarioStatuses = new Set();
    const failureClassifications = new Set();
    try {
        for (const scenario of scenarios) {
            await (0, project_1.appendJsonl)(node_path_1.default.join(runRoot, "events.jsonl"), (0, project_1.eventEnvelope)({ type: "scenario_started", run_id: runId, scenario_id: scenario.id, source: "meta-skill eval run", payload: { folder: scenario.folder, run_source: runSourceConfig.runSource } }));
            try {
                const result = await runner.run({ projectRoot: root, skillRoot: runSourceConfig.skillRoot, attachSkill: runSourceConfig.runSource.attached_skill, scenario, runSource: runSourceConfig.runSource, runId, runRoot, appServer });
                scenarioStatuses.add(result.status);
                const classification = (0, results_1.classifyScenarioStatus)(result.status);
                if (classification) {
                    hasFailures = true;
                    failureClassifications.add(classification);
                }
                await (0, results_1.recordScenarioResult)(runRoot, runId, scenario, runSourceConfig.runSource, result.status, result.token_usage, result.evidence_path, result.error, classification);
            }
            catch (error) {
                hasFailures = true;
                const message = error instanceof client_1.AppServerUnavailableError || error instanceof Error ? error.message : String(error);
                const classification = error instanceof client_1.AppServerUnavailableError ? "app_server_unavailable" : "harness_unavailable";
                failureClassifications.add(classification);
                scenarioStatuses.add("errored");
                const evidencePath = (0, project_1.relativePath)(runRoot, node_path_1.default.join(runRoot, "scenarios", scenario.folder));
                const tokenUsage = (0, project_1.unavailableTokenUsage)("App Server execution failed before token metrics were available.");
                await (0, results_1.recordScenarioResult)(runRoot, runId, scenario, runSourceConfig.runSource, "errored", tokenUsage, evidencePath, message, classification);
                await (0, project_1.appendJsonl)(node_path_1.default.join(runRoot, "events.jsonl"), (0, project_1.eventEnvelope)({ type: "scenario_failed", run_id: runId, scenario_id: scenario.id, source: "app_server", payload: { run_source: runSourceConfig.runSource, error: message, failure_classification: classification, token_usage: tokenUsage } }));
            }
        }
    }
    finally {
        runner.close();
    }
    if (!options.noLint) {
        const lint = await (0, lint_1.lintProject)(root, { runId });
        if (!lint.ok) {
            hasFailures = true;
            failureClassifications.add("lint_test_failure");
        }
    }
    else {
        await (0, project_1.appendJsonl)(node_path_1.default.join(runRoot, "tests.jsonl"), (0, project_1.eventEnvelope)({ type: "lint_skipped", run_id: runId, source: "meta-skill eval run", payload: { reason: "--no-lint" } }));
    }
    if (options.withJudges) {
        const judges = await (options.judgeRunner || judge_1.judgeRun)({ project: root, runId, allJudges: true, allScenarios: true });
        if (!judges.ok)
            hasFailures = true;
        for (const classification of judges.failureClassifications || [])
            failureClassifications.add(classification);
        if (!judges.ok && !(judges.failureClassifications || []).length)
            failureClassifications.add("judge_failure");
    }
    const status = (0, results_1.runStatus)(hasFailures, scenarioStatuses);
    const ok = status === "passed";
    const manualReviewRequired = status === "needs_review";
    const sortedFailureClassifications = [...failureClassifications].sort();
    const finalRunJson = {
        ...runJson,
        status,
        completed_at: (0, project_1.utcNow)(),
        ok,
        manual_review_required: manualReviewRequired,
        failure_classifications: sortedFailureClassifications
    };
    await (0, project_1.writeJson)(node_path_1.default.join(runRoot, "run.json"), finalRunJson);
    await (0, project_1.appendJsonl)(node_path_1.default.join(runRoot, "events.jsonl"), (0, project_1.eventEnvelope)({ type: "run_completed", run_id: runId, source: "meta-skill eval run", payload: { ok, status, manual_review_required: manualReviewRequired, failure_classifications: finalRunJson.failure_classifications } }));
    const { report } = await (0, runs_1.refreshRunEvidence)(root, runId);
    return { runId, runRoot, report, ok, status, manualReviewRequired, failureClassifications: sortedFailureClassifications };
}
function evalRunSourceConfig(kind, projectRoot, releaseSkill) {
    if (kind === "snapshot_payload") {
        return { skillRoot: releaseSkill, runSource: { kind, label: "Saved snapshot payload", skill_root: "../../../versions/release/skill", attached_skill: true }, defaultLabel: "saved-snapshot" };
    }
    if (kind === "no_skill") {
        return { runSource: { kind, label: "No skill", skill_root: null, attached_skill: false }, defaultLabel: "no-skill" };
    }
    return { skillRoot: projectRoot, runSource: { kind: "working_payload", label: "Working payload", skill_root: "../../../..", attached_skill: true }, defaultLabel: "working-payload" };
}
