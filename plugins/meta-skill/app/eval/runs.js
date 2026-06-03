"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.importFeedback = importFeedback;
exports.listRuns = listRuns;
exports.listRunSummaries = listRunSummaries;
exports.openRun = openRun;
exports.refreshRunEvidence = refreshRunEvidence;
const node_path_1 = __importDefault(require("node:path"));
const project_1 = require("../project");
const reporting_1 = require("../reporting");
async function importFeedback(project, runId, feedbackFile) {
    const root = await (0, project_1.requirePortableSkill)(project);
    const p = (0, project_1.projectPaths)(root);
    const runRoot = node_path_1.default.join(p.runs, runId);
    if (!(await (0, project_1.exists)(runRoot)))
        throw new project_1.CliError(`run does not exist: ${runId}`);
    const input = await (0, project_1.readText)(node_path_1.default.resolve(feedbackFile));
    let rows = 0;
    for (const line of input.split(/\r?\n/).filter(Boolean)) {
        let parsed;
        try {
            parsed = JSON.parse(line);
        }
        catch {
            throw new project_1.CliError(`invalid feedback JSONL row: ${line.slice(0, 120)}`);
        }
        const envelope = parsed.schema_version === 1 && typeof parsed.type === "string"
            ? parsed
            : (0, project_1.eventEnvelope)({ type: "human_feedback", run_id: runId, source: String(parsed.source || "feedback-import"), payload: parsed });
        await (0, project_1.appendJsonl)(node_path_1.default.join(runRoot, "feedback.jsonl"), envelope);
        rows += 1;
    }
    const refreshed = await refreshRunEvidence(root, runId);
    return { rows, report: refreshed.report };
}
async function listRuns(project) {
    const rows = await listRunSummaries(project);
    return rows.map((row) => row.run_id);
}
async function listRunSummaries(project, options = {}) {
    return (0, reporting_1.listRunSummariesForReport)(project, options, "refresh-if-missing");
}
async function openRun(project, runId) {
    return (0, reporting_1.openRunForReport)(project, runId, "refresh");
}
async function refreshRunEvidence(project, runId) {
    return (0, reporting_1.openRunForReport)(project, runId, "refresh");
}
