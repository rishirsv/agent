"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.judgeRun = judgeRun;
exports.judgePassed = judgePassed;
const node_path_1 = __importDefault(require("node:path"));
const client_1 = require("../app-server/client");
const project_1 = require("../project");
const report_1 = require("../report");
const scenarios_1 = require("./scenarios");
const results_1 = require("./results");
async function judgeRun(options) {
    const root = await (0, project_1.requirePortableSkill)(options.project);
    const p = (0, project_1.projectPaths)(root);
    const runRoot = node_path_1.default.join(p.runs, options.runId);
    if (!(await (0, project_1.exists)(runRoot)))
        throw new project_1.CliError(`run does not exist: ${options.runId}`);
    if (!options.judge && !options.allJudges)
        throw new project_1.CliError("eval judge requires --judge <id> or --all-judges", 2);
    if (!options.scenario && !options.allScenarios)
        throw new project_1.CliError("eval judge requires --scenario <id> or --all-scenarios", 2);
    const scenarios = await (0, scenarios_1.loadRunScenarioSnapshots)(root, runRoot, options.allScenarios ? {} : { scenario: [options.scenario] });
    let annotations = 0;
    let ok = true;
    const failureClassifications = new Set();
    let judgeClient;
    let judgeExecutor = options.judgeExecutor;
    try {
        if (!judgeExecutor) {
            const appServer = await (0, client_1.appServerConfig)();
            judgeClient = new client_1.AppServerJsonClient(async (line) => {
                await (0, project_1.appendJsonl)(node_path_1.default.join(runRoot, "grades.rpc.jsonl"), {
                    schema_version: 1,
                    direction: line.direction,
                    message: line.message
                });
            });
            await judgeClient.connect(appServer);
            judgeExecutor = (input) => runJudge(judgeClient, input);
        }
        for (const scenario of scenarios) {
            const judgeIds = options.allJudges ? (scenario.criteria.judges || []).map((judge) => judge.id) : [options.judge];
            for (const judgeId of judgeIds) {
                const judgePath = node_path_1.default.join(p.judges, `${judgeId}.md`);
                if (!(await (0, project_1.exists)(judgePath)))
                    throw new project_1.CliError(`judge does not exist: ${judgeId}`);
                const judgePrompt = await (0, project_1.readText)(judgePath);
                const threshold = (scenario.criteria.judges || []).find((judge) => judge.id === judgeId)?.threshold;
                for (const attempt of await (0, results_1.attemptsInRun)(runRoot, scenario.folder)) {
                    const finalPath = node_path_1.default.join(runRoot, attempt.evidencePath, "final.md");
                    if (!(await (0, project_1.exists)(finalPath))) {
                        ok = false;
                        failureClassifications.add("harness_unavailable");
                        await (0, project_1.appendJsonl)(node_path_1.default.join(runRoot, "grades.jsonl"), (0, project_1.eventEnvelope)({
                            type: "judge_result",
                            run_id: options.runId,
                            scenario_id: scenario.id,
                            ...(attempt.legacySide ? { side: attempt.legacySide } : {}),
                            source: judgeId,
                            payload: {
                                judge_id: judgeId,
                                run_source: attempt.runSource,
                                status: "unavailable",
                                failure_classification: "harness_unavailable",
                                reason: `missing scenario final evidence: ${(0, project_1.relativePath)(runRoot, finalPath)}`
                            }
                        }));
                        annotations += 1;
                        continue;
                    }
                    const final = await (0, project_1.readText)(finalPath);
                    const result = await judgeExecutor({ projectRoot: root, judgeId, judgePrompt, scenario, runSourceLabel: attempt.runSource.label, final });
                    const passed = judgePassed(result, threshold);
                    ok = ok && passed;
                    if (!passed)
                        failureClassifications.add("judge_failure");
                    await (0, project_1.appendJsonl)(node_path_1.default.join(runRoot, "grades.jsonl"), (0, project_1.eventEnvelope)({
                        type: "judge_result",
                        run_id: options.runId,
                        scenario_id: scenario.id,
                        ...(attempt.legacySide ? { side: attempt.legacySide } : {}),
                        source: judgeId,
                        payload: {
                            judge_id: judgeId,
                            run_source: attempt.runSource,
                            status: passed ? "passed" : "failed",
                            failure_classification: passed ? null : "judge_failure",
                            threshold: threshold || null,
                            evidence_basis: scenario.evidence_basis || "run_snapshot",
                            result
                        }
                    }));
                    annotations += 1;
                }
            }
        }
    }
    catch (error) {
        ok = false;
        const message = error instanceof Error ? error.message : String(error);
        const classification = error instanceof client_1.AppServerUnavailableError ? "app_server_unavailable" : "judge_failure";
        failureClassifications.add(classification);
        for (const scenario of scenarios) {
            const judgeIds = options.allJudges ? (scenario.criteria.judges || []).map((judge) => judge.id) : [options.judge];
            for (const judgeId of judgeIds) {
                for (const attempt of await (0, results_1.attemptsInRun)(runRoot, scenario.folder)) {
                    await (0, project_1.appendJsonl)(node_path_1.default.join(runRoot, "grades.jsonl"), (0, project_1.eventEnvelope)({
                        type: "judge_result",
                        run_id: options.runId,
                        scenario_id: scenario.id,
                        ...(attempt.legacySide ? { side: attempt.legacySide } : {}),
                        source: judgeId,
                        payload: {
                            judge_id: judgeId,
                            run_source: attempt.runSource,
                            status: "unavailable",
                            failure_classification: classification,
                            reason: message
                        }
                    }));
                    annotations += 1;
                }
            }
        }
    }
    finally {
        await judgeClient?.flush();
        judgeClient?.close();
    }
    await (0, report_1.writeEvalReport)(runRoot);
    return { annotations, ok, failureClassifications: [...failureClassifications].sort() };
}
async function runJudge(client, input) {
    const start = await client.request("thread/start", {
        cwd: input.projectRoot,
        runtimeWorkspaceRoots: [input.projectRoot],
        approvalPolicy: "never",
        sandbox: "read-only",
        experimentalRawEvents: false,
        persistExtendedHistory: false,
        ephemeral: true,
        baseInstructions: "You are a strict Meta Skill eval judge. Return only JSON.",
        developerInstructions: "Evaluate the saved scenario evidence against the judge prompt. Do not use tools."
    });
    const threadId = start.thread?.id;
    if (!threadId)
        throw new Error("judge thread/start response did not include thread.id");
    const mark = client.eventCount();
    const prompt = [
        "# Judge Prompt",
        input.judgePrompt,
        "# Scenario",
        JSON.stringify({ id: input.scenario.id, folder: input.scenario.folder, run_source: input.runSourceLabel, evidence_basis: input.scenario.evidence_basis || "run_snapshot", metadata: input.scenario.metadata, criteria: input.scenario.criteria }, null, 2),
        "# Final Output",
        input.final,
        "# Required Output",
        'Return compact JSON with: {"overall": number from 1 to 5, "pass": boolean, "rationale": string, "dimensions": object}.'
    ].join("\n\n");
    const turn = await client.request("turn/start", {
        threadId,
        input: [{ type: "text", text: prompt, text_elements: [] }],
        cwd: input.projectRoot,
        runtimeWorkspaceRoots: [input.projectRoot],
        approvalPolicy: "never",
        sandboxPolicy: { type: "readOnly", networkAccess: false }
    });
    const turnId = turn.turn?.id;
    if (!turnId)
        throw new Error("judge turn/start response did not include turn.id");
    await client.waitFor((message) => message.method === "turn/completed" && message.params?.threadId === threadId && message.params?.turn?.id === turnId, 120000);
    const text = client
        .eventsSince(mark)
        .filter((message) => message.method === "item/agentMessage/delta" && message.params?.turnId === turnId)
        .map((message) => String(message.params.delta || ""))
        .join("")
        .trim();
    return parseJudgeJson(text);
}
function parseJudgeJson(text) {
    const fenced = /```(?:json)?\s*([\s\S]*?)```/.exec(text);
    const raw = fenced ? fenced[1] : text;
    try {
        return JSON.parse(raw);
    }
    catch {
        return { overall: 0, pass: false, rationale: text || "Judge returned no parseable JSON.", dimensions: {} };
    }
}
function judgePassed(result, threshold) {
    const overall = typeof result.overall === "number" ? result.overall : 0;
    if (threshold?.overall_min !== undefined && overall < threshold.overall_min)
        return false;
    for (const [name, min] of Object.entries(threshold?.dimensions || {})) {
        const dimensions = result.dimensions && typeof result.dimensions === "object" ? result.dimensions : {};
        const value = Number(dimensions[name] ?? 0);
        if (value < min)
            return false;
    }
    if (typeof result.pass === "boolean")
        return result.pass;
    return overall >= 3;
}
