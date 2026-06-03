"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordScenarioResult = recordScenarioResult;
exports.attemptsInRun = attemptsInRun;
exports.classifyScenarioStatus = classifyScenarioStatus;
exports.runStatus = runStatus;
const node_fs_1 = require("node:fs");
const node_path_1 = __importDefault(require("node:path"));
const project_1 = require("../project");
async function recordScenarioResult(runRoot, runId, scenario, runSource, status, tokenUsage, evidencePath, error, failureClassification) {
    await (0, project_1.appendJsonl)(node_path_1.default.join(runRoot, "results.jsonl"), (0, project_1.eventEnvelope)({
        type: "scenario_result",
        run_id: runId,
        scenario_id: scenario.id,
        source: "meta-skill eval run",
        payload: {
            run_source: runSource,
            status,
            scenario_folder: scenario.folder,
            evidence_path: evidencePath,
            token_usage: tokenUsage,
            failure_classification: failureClassification || null,
            error
        }
    }));
}
async function attemptsInRun(runRoot, scenarioFolder) {
    const scenarioRoot = node_path_1.default.join(runRoot, "scenarios", scenarioFolder);
    if (await (0, project_1.exists)(node_path_1.default.join(scenarioRoot, "final.md")))
        return [{ runSource: await runSourceFor(runRoot), evidencePath: node_path_1.default.join("scenarios", scenarioFolder) }];
    const attempts = [];
    // Legacy read-only support for runs that wrote scenarios/<scenario>/<side>/ evidence.
    for (const side of ["candidate", "release"]) {
        if (await (0, project_1.exists)(node_path_1.default.join(scenarioRoot, side)))
            attempts.push({ runSource: legacyRunSource(side), evidencePath: node_path_1.default.join("scenarios", scenarioFolder, side), legacySide: side });
    }
    return attempts.length ? attempts : [{ runSource: await runSourceFor(runRoot), evidencePath: node_path_1.default.join("scenarios", scenarioFolder) }];
}
async function runSourceFor(runRoot) {
    try {
        const run = JSON.parse(await node_fs_1.promises.readFile(node_path_1.default.join(runRoot, "run.json"), "utf8"));
        if (run.run_source?.kind)
            return run.run_source;
        if (typeof run.subject === "string")
            return legacyRunSource(run.subject);
        if (run.subject?.id)
            return legacyRunSource(String(run.subject.id));
    }
    catch {
        // Missing run.json is handled by the caller's evidence checks.
    }
    return { kind: "working_payload", label: "Working payload", skill_root: "../../../..", attached_skill: true };
}
function legacyRunSource(value) {
    if (value === "release")
        return { kind: "legacy_side", label: "Legacy saved snapshot side", skill_root: "../../../versions/release/skill", attached_skill: true };
    return { kind: "legacy_side", label: "Legacy working payload side", skill_root: "../../../..", attached_skill: true };
}
function classifyScenarioStatus(status) {
    return status === "failed" || status === "errored" ? "scenario_failed" : null;
}
function runStatus(hasFailures, scenarioStatuses) {
    if (hasFailures)
        return "failed";
    return scenarioStatuses.has("needs_review") ? "needs_review" : "passed";
}
