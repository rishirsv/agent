"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppServerScenarioRunner = void 0;
const node_fs_1 = require("node:fs");
const node_path_1 = __importDefault(require("node:path"));
const project_1 = require("../project");
const client_1 = require("./client");
class AppServerScenarioRunner {
    client;
    clientFactory;
    turnTimeoutMs;
    rpcPath;
    constructor(options = {}) {
        this.clientFactory = options.clientFactory || ((onLine) => new client_1.AppServerJsonClient(onLine));
        this.turnTimeoutMs = options.turnTimeoutMs || 120000;
    }
    async run(input) {
        const rawRoot = node_path_1.default.join(input.runRoot, "scenarios", input.scenario.folder);
        await (0, project_1.ensureDir)(rawRoot);
        await (0, project_1.ensureDir)(node_path_1.default.join(rawRoot, "artifacts"));
        const stageRoot = node_path_1.default.join(rawRoot, "stage");
        await stageWorkspace(input, stageRoot);
        const attachmentName = input.attachSkill && input.skillRoot ? await runtimeSkillName(input.skillRoot) : undefined;
        const rpcPath = node_path_1.default.join(rawRoot, "rpc.jsonl");
        await this.client?.flush?.();
        this.rpcPath = rpcPath;
        const client = await this.ensureClient(input.appServer);
        const start = await client.request("thread/start", {
            cwd: stageRoot,
            runtimeWorkspaceRoots: [stageRoot],
            approvalPolicy: "never",
            sandbox: "read-only",
            experimentalRawEvents: true,
            persistExtendedHistory: false,
            ephemeral: true,
            baseInstructions: input.attachSkill ? "You are executing a Meta Skill scenario. Follow the staged skill payload exactly and answer the user's task." : "You are executing a Meta Skill scenario without an attached skill. Answer the user's task directly.",
            developerInstructions: [
                input.attachSkill ? "Use the skill mounted in this turn as the only runtime skill guidance." : "No skill is mounted for this scenario. Answer without skill-specific runtime guidance.",
                "Treat stage/scenario/task.md as the first user request and stage/scenario/turns.json as follow-up user turns.",
                input.attachSkill ? "Do not modify files. Produce the final answer that the skill would give the user." : "Do not modify files. Produce the final answer you would give without a skill."
            ].join("\n")
        });
        const thread = start.thread;
        const threadId = thread?.id;
        if (!threadId)
            throw new Error("App Server thread/start response did not include thread.id");
        const turnRecords = [];
        const usageTurns = [];
        let final = "";
        const turns = [{ content: input.scenario.task, source: "task.md" }, ...input.scenario.turns.map((turn) => ({ content: turn.content, source: "turns.json" }))];
        for (const [index, turn] of turns.entries()) {
            turnRecords.push({ role: "user", index, source: turn.source, content: turn.content, status: "sent" });
            const result = await runTurn(client, threadId, stageRoot, input.scenario, turn.content, index === 0 && input.attachSkill, this.turnTimeoutMs, attachmentName);
            final = result.final || final;
            usageTurns.push({
                turn_id: result.turnId,
                index,
                usage: result.tokenUsage,
                cumulative_usage: result.cumulativeTokenUsage,
                ...(result.tokenEvent ? { source_event: "thread/tokenUsage/updated" } : {})
            });
            turnRecords.push({
                role: "assistant",
                index,
                source: "app-server",
                content: result.final,
                status: "completed",
                turn_id: result.turnId,
                token_usage: result.tokenUsage,
                cumulative_token_usage: result.cumulativeTokenUsage
            });
        }
        await client.flush?.();
        const scenarioSummary = summarizeScenarioUsage(usageTurns);
        const usageEvidence = {
            schema_version: 1,
            availability: scenarioSummary.availability,
            turns: usageTurns,
            summary: scenarioSummary
        };
        await (0, project_1.writeJson)(node_path_1.default.join(rawRoot, "thread.json"), {
            schema_version: 1,
            thread_id: threadId,
            turn_ids: turnRecords.filter((row) => row.role === "assistant").map((row) => row.turn_id),
            parent_thread_id: null,
            forked_from_id: null,
            resume_from_id: null,
            app_server: input.appServer,
            status: "completed",
            error: null
        });
        await (0, project_1.writeText)(node_path_1.default.join(rawRoot, "turns.jsonl"), turnRecords.map((row) => JSON.stringify(row)).join("\n"));
        await (0, project_1.writeJson)(node_path_1.default.join(rawRoot, "usage.json"), usageEvidence);
        await (0, project_1.writeText)(node_path_1.default.join(rawRoot, "final.md"), final || "(no final assistant message captured)");
        return {
            status: "needs_review",
            token_usage: scenarioSummary,
            final_path: node_path_1.default.join(rawRoot, "final.md"),
            evidence_path: node_path_1.default.relative(input.runRoot, rawRoot)
        };
    }
    close() {
        this.client?.close();
        this.client = undefined;
    }
    async ensureClient(appServer) {
        if (!this.client) {
            this.client = this.clientFactory(async (line) => {
                if (!this.rpcPath)
                    return;
                await (0, project_1.appendJsonl)(this.rpcPath, {
                    schema_version: 1,
                    direction: line.direction,
                    message: line.message
                });
            });
            if (this.client instanceof client_1.AppServerJsonClient)
                await this.client.connect(appServer);
        }
        return this.client;
    }
}
exports.AppServerScenarioRunner = AppServerScenarioRunner;
async function runTurn(client, threadId, stageRoot, scenario, content, includeSkill, turnTimeoutMs, attachmentName) {
    const mark = client.eventCount();
    const input = [
        ...(includeSkill && attachmentName ? [{ type: "skill", name: attachmentName, path: node_path_1.default.join(stageRoot, "skill") }] : []),
        { type: "text", text: content, text_elements: [] }
    ];
    const started = await client.request("turn/start", {
        threadId,
        input,
        cwd: stageRoot,
        runtimeWorkspaceRoots: [stageRoot],
        approvalPolicy: "never",
        sandboxPolicy: { type: "readOnly", networkAccess: false }
    });
    const turn = started.turn;
    const turnId = turn?.id;
    if (!turnId)
        throw new Error("App Server turn/start response did not include turn.id");
    await client.waitFor((message) => message.method === "turn/completed" && message.params?.threadId === threadId && message.params?.turn?.id === turnId, turnTimeoutMs);
    const events = client.eventsSince(mark);
    const final = events
        .filter((message) => message.method === "item/agentMessage/delta" && message.params?.threadId === threadId && message.params?.turnId === turnId)
        .map((message) => String(message.params.delta || ""))
        .join("");
    const tokenEvent = [...events]
        .reverse()
        .find((message) => message.method === "thread/tokenUsage/updated" && message.params?.threadId === threadId && message.params?.turnId === turnId);
    if (!tokenEvent) {
        return { turnId, final, tokenUsage: (0, project_1.unavailableTokenUsage)(`App Server token metrics were unavailable for turn ${turnId}.`), tokenEvent: false };
    }
    const tokenUsage = tokenEvent.params.tokenUsage;
    return {
        turnId,
        final,
        tokenUsage: toTokenUsage(tokenUsage?.last, `App Server last token metrics were unavailable for turn ${turnId}.`),
        cumulativeTokenUsage: tokenUsage?.total ? toTokenUsage(tokenUsage.total, `App Server cumulative token metrics were unavailable for turn ${turnId}.`) : undefined,
        tokenEvent: true
    };
}
function toTokenUsage(raw, reason = "App Server token metrics were unavailable.") {
    const metrics = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : undefined;
    if (!metrics)
        return (0, project_1.unavailableTokenUsage)(reason);
    const input = metricFrom(metrics.inputTokens ?? metrics.input_tokens, reason);
    const output = metricFrom(metrics.outputTokens ?? metrics.output_tokens, reason);
    const total = metricFrom(metrics.totalTokens ?? metrics.total_tokens, reason);
    const cached = metricFrom(metrics.cachedTokens ?? metrics.cached_tokens ?? metrics.cachedInputTokens ?? metrics.cached_input_tokens ?? objectValue(metrics.input_token_details).cached_tokens ?? objectValue(metrics.inputTokenDetails).cachedTokens, reason);
    const reasoning = metricFrom(metrics.reasoningTokens ?? metrics.reasoning_tokens ?? metrics.reasoningOutputTokens ?? metrics.reasoning_output_tokens ?? objectValue(metrics.output_tokens_details).reasoning_tokens ?? objectValue(metrics.outputTokenDetails).reasoningTokens, reason);
    return {
        input_tokens: input,
        output_tokens: output,
        total_tokens: total,
        ...(cached.available ? { cached_tokens: cached } : {}),
        ...(reasoning.available ? { reasoning_tokens: reasoning } : {})
    };
}
function summarizeScenarioUsage(turns) {
    const finalTurn = turns.at(-1);
    const reason = finalTurn
        ? `App Server cumulative token metrics were unavailable for final reporting turn ${finalTurn.turn_id}; scenario totals require tokenUsage.total from that turn.`
        : "App Server completed without a final reporting turn; scenario totals require tokenUsage.total from the final turn.";
    const sample = finalTurn?.cumulative_usage?.total_tokens.available ? finalTurn.cumulative_usage : (0, project_1.unavailableTokenUsage)(reason);
    return summarizeUsageSamples([sample], "scenario");
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
        input_tokens: tokenStat(present.map((usage) => usage.input_tokens)),
        output_tokens: tokenStat(present.map((usage) => usage.output_tokens)),
        total_tokens: tokenStat(present.map((usage) => usage.total_tokens)),
        ...(present.some((usage) => usage.cached_tokens?.available) ? { cached_tokens: tokenStat(present.map((usage) => usage.cached_tokens)) } : {}),
        ...(present.some((usage) => usage.reasoning_tokens?.available) ? { reasoning_tokens: tokenStat(present.map((usage) => usage.reasoning_tokens)) } : {}),
        unavailable_reasons: unavailableReasons
    };
}
function tokenStat(metrics) {
    const values = metrics.filter((metric) => Boolean(metric?.available)).map((metric) => metric.value);
    if (!values.length)
        return { total: 0, average: 0, min: 0, max: 0 };
    const total = values.reduce((sum, value) => sum + value, 0);
    return { total, average: total / values.length, min: Math.min(...values), max: Math.max(...values) };
}
function reasonsForUsage(usage) {
    return [usage.input_tokens, usage.output_tokens, usage.total_tokens, usage.cached_tokens, usage.reasoning_tokens]
        .filter((metric) => Boolean(metric && !metric.available))
        .map((metric) => metric.reason);
}
function metricFrom(value, reason) {
    return typeof value === "number" && Number.isFinite(value) ? { available: true, value } : { available: false, reason };
}
function objectValue(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}
async function stageWorkspace(input, stageRoot) {
    await node_fs_1.promises.rm(stageRoot, { recursive: true, force: true });
    await (0, project_1.ensureDir)(stageRoot);
    if (input.attachSkill && input.skillRoot)
        await (0, project_1.copyPortablePayload)(input.skillRoot, node_path_1.default.join(stageRoot, "skill"));
    await (0, project_1.ensureDir)(node_path_1.default.join(stageRoot, "scenario"));
    for (const name of ["task.md", "scenario.json", "turns.json", "capability.txt"]) {
        const source = node_path_1.default.join(input.scenario.path, name);
        try {
            await node_fs_1.promises.copyFile(source, node_path_1.default.join(stageRoot, "scenario", name));
        }
        catch {
            // Optional scenario files are simply absent from the staged workspace.
        }
    }
    const resources = node_path_1.default.join(input.scenario.path, "resources");
    try {
        await node_fs_1.promises.cp(resources, node_path_1.default.join(stageRoot, "scenario", "resources"), { recursive: true });
    }
    catch {
        // Scenario resources are optional.
    }
    await (0, project_1.writeText)(node_path_1.default.join(stageRoot, "HARNESS.md"), `# Meta Skill App Server Harness\n\nRun ${input.runId}, scenario ${input.scenario.id}, source ${input.runSource.label}.\n`);
}
async function runtimeSkillName(skillRoot) {
    const frontmatter = await (0, project_1.parseSkillFrontmatter)(node_path_1.default.join(skillRoot, "SKILL.md"));
    return frontmatter.name || node_path_1.default.basename(skillRoot);
}
