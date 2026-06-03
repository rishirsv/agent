import { promises as fs } from "node:fs";
import path from "node:path";
import type { EvalRunSource, ScenarioRecord, TokenMetric, TokenUsage, TokenUsageSummary, TokenUsageTurn } from "../models";
import { appendJsonl, copyPortablePayload, ensureDir, parseSkillFrontmatter, readText, unavailableTokenUsage, writeJson, writeText } from "../project";
import type { AppServerConfig, AppServerLine } from "./client";
import { AppServerJsonClient } from "./client";

interface AppServerClientLike {
  request(method: string, params: unknown): Promise<Record<string, unknown>>;
  waitFor(predicate: (message: Record<string, unknown>) => boolean, timeoutMs: number): Promise<Record<string, unknown>>;
  eventCount(): number;
  eventsSince(index: number): Record<string, unknown>[];
  close(): void;
  flush?(): Promise<void>;
}

type AppServerTokenUsageTurn = Omit<TokenUsageTurn, "source_event"> & {
  source_event?: TokenUsageTurn["source_event"];
};

export interface AppServerScenarioRunnerOptions {
  clientFactory?: (onLine: (line: AppServerLine) => Promise<void>) => AppServerClientLike;
  turnTimeoutMs?: number;
}

export interface ScenarioRunInput {
  projectRoot: string;
  skillRoot?: string;
  attachSkill: boolean;
  scenario: ScenarioRecord;
  runSource: EvalRunSource;
  runId: string;
  runRoot: string;
  appServer: AppServerConfig;
}

export interface ScenarioRunResult {
  status: "passed" | "failed" | "needs_review" | "errored";
  token_usage: TokenUsageSummary;
  final_path: string;
  evidence_path: string;
  error?: string;
}

export class AppServerScenarioRunner {
  private client: AppServerClientLike | undefined;
  private readonly clientFactory: (onLine: (line: AppServerLine) => Promise<void>) => AppServerClientLike;
  private readonly turnTimeoutMs: number;
  private rpcPath: string | undefined;

  constructor(options: AppServerScenarioRunnerOptions = {}) {
    this.clientFactory = options.clientFactory || ((onLine) => new AppServerJsonClient(onLine));
    this.turnTimeoutMs = options.turnTimeoutMs || 120000;
  }

  async run(input: ScenarioRunInput): Promise<ScenarioRunResult> {
    const rawRoot = path.join(input.runRoot, "scenarios", input.scenario.folder);
    await ensureDir(rawRoot);
    await ensureDir(path.join(rawRoot, "artifacts"));
    const stageRoot = path.join(rawRoot, "stage");
    await stageWorkspace(input, stageRoot);
    const attachmentName = input.attachSkill && input.skillRoot ? await runtimeSkillName(input.skillRoot) : undefined;

    const rpcPath = path.join(rawRoot, "rpc.jsonl");
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
    const thread = start.thread as { id?: string } | undefined;
    const threadId = thread?.id;
    if (!threadId) throw new Error("App Server thread/start response did not include thread.id");

    const turnRecords: Array<{ role: "user" | "assistant"; index: number; source: string; content: string; status: string; turn_id?: string; token_usage?: TokenUsage; cumulative_token_usage?: TokenUsage }> = [];
    const usageTurns: AppServerTokenUsageTurn[] = [];
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
        ...(result.tokenEvent ? { source_event: "thread/tokenUsage/updated" as const } : {})
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
      schema_version: 1 as const,
      availability: scenarioSummary.availability,
      turns: usageTurns,
      summary: scenarioSummary
    };

    await writeJson(path.join(rawRoot, "thread.json"), {
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
    await writeText(path.join(rawRoot, "turns.jsonl"), turnRecords.map((row) => JSON.stringify(row)).join("\n"));
    await writeJson(path.join(rawRoot, "usage.json"), usageEvidence);
    await writeText(path.join(rawRoot, "final.md"), final || "(no final assistant message captured)");

    return {
      status: "needs_review",
      token_usage: scenarioSummary,
      final_path: path.join(rawRoot, "final.md"),
      evidence_path: path.relative(input.runRoot, rawRoot)
    };
  }

  close(): void {
    this.client?.close();
    this.client = undefined;
  }

  private async ensureClient(appServer: AppServerConfig): Promise<AppServerClientLike> {
    if (!this.client) {
      this.client = this.clientFactory(async (line) => {
        if (!this.rpcPath) return;
        await appendJsonl(this.rpcPath, {
          schema_version: 1,
          direction: line.direction,
          message: line.message
        });
      });
      if (this.client instanceof AppServerJsonClient) await this.client.connect(appServer);
    }
    return this.client;
  }
}

async function runTurn(
  client: AppServerClientLike,
  threadId: string,
  stageRoot: string,
  scenario: ScenarioRecord,
  content: string,
  includeSkill: boolean,
  turnTimeoutMs: number,
  attachmentName?: string
): Promise<{ turnId: string; final: string; tokenUsage: TokenUsage; cumulativeTokenUsage?: TokenUsage; tokenEvent: boolean }> {
  const mark = client.eventCount();
  const input = [
    ...(includeSkill && attachmentName ? [{ type: "skill", name: attachmentName, path: path.join(stageRoot, "skill") }] : []),
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
  const turn = started.turn as { id?: string } | undefined;
  const turnId = turn?.id;
  if (!turnId) throw new Error("App Server turn/start response did not include turn.id");

  await client.waitFor(
    (message) => message.method === "turn/completed" && (message.params as { threadId?: string; turn?: { id?: string } } | undefined)?.threadId === threadId && (message.params as { turn?: { id?: string } } | undefined)?.turn?.id === turnId,
    turnTimeoutMs
  );
  const events = client.eventsSince(mark);
  const final = events
    .filter((message) => message.method === "item/agentMessage/delta" && (message.params as { threadId?: string; turnId?: string } | undefined)?.threadId === threadId && (message.params as { turnId?: string } | undefined)?.turnId === turnId)
    .map((message) => String((message.params as { delta?: string }).delta || ""))
    .join("");
  const tokenEvent = [...events]
    .reverse()
    .find((message) => message.method === "thread/tokenUsage/updated" && (message.params as { threadId?: string; turnId?: string } | undefined)?.threadId === threadId && (message.params as { turnId?: string } | undefined)?.turnId === turnId);
  if (!tokenEvent) {
    return { turnId, final, tokenUsage: unavailableTokenUsage(`App Server token metrics were unavailable for turn ${turnId}.`), tokenEvent: false };
  }
  const tokenUsage = (tokenEvent.params as { tokenUsage?: { last?: unknown; total?: unknown } }).tokenUsage;
  return {
    turnId,
    final,
    tokenUsage: toTokenUsage(tokenUsage?.last, `App Server last token metrics were unavailable for turn ${turnId}.`),
    cumulativeTokenUsage: tokenUsage?.total ? toTokenUsage(tokenUsage.total, `App Server cumulative token metrics were unavailable for turn ${turnId}.`) : undefined,
    tokenEvent: true
  };
}

function toTokenUsage(raw: unknown, reason = "App Server token metrics were unavailable."): TokenUsage {
  const metrics = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : undefined;
  if (!metrics) return unavailableTokenUsage(reason);
  const input = metricFrom(metrics.inputTokens ?? metrics.input_tokens, reason);
  const output = metricFrom(metrics.outputTokens ?? metrics.output_tokens, reason);
  const total = metricFrom(metrics.totalTokens ?? metrics.total_tokens, reason);
  const cached = metricFrom(
    metrics.cachedTokens ?? metrics.cached_tokens ?? metrics.cachedInputTokens ?? metrics.cached_input_tokens ?? objectValue(metrics.input_token_details).cached_tokens ?? objectValue(metrics.inputTokenDetails).cachedTokens,
    reason
  );
  const reasoning = metricFrom(
    metrics.reasoningTokens ?? metrics.reasoning_tokens ?? metrics.reasoningOutputTokens ?? metrics.reasoning_output_tokens ?? objectValue(metrics.output_tokens_details).reasoning_tokens ?? objectValue(metrics.outputTokenDetails).reasoningTokens,
    reason
  );
  return {
    input_tokens: input,
    output_tokens: output,
    total_tokens: total,
    ...(cached.available ? { cached_tokens: cached } : {}),
    ...(reasoning.available ? { reasoning_tokens: reasoning } : {})
  };
}

function summarizeScenarioUsage(turns: AppServerTokenUsageTurn[]): TokenUsageSummary {
  const finalTurn = turns.at(-1);
  const reason = finalTurn
    ? `App Server cumulative token metrics were unavailable for final reporting turn ${finalTurn.turn_id}; scenario totals require tokenUsage.total from that turn.`
    : "App Server completed without a final reporting turn; scenario totals require tokenUsage.total from the final turn.";
  const sample = finalTurn?.cumulative_usage?.total_tokens.available ? finalTurn.cumulative_usage : unavailableTokenUsage(reason);
  return summarizeUsageSamples([sample], "scenario");
}

function summarizeUsageSamples(samples: TokenUsage[], sampleUnit: "turn" | "scenario"): TokenUsageSummary {
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

function tokenStat(metrics: Array<TokenMetric | undefined>) {
  const values = metrics.filter((metric): metric is { available: true; value: number } => Boolean(metric?.available)).map((metric) => metric.value);
  if (!values.length) return { total: 0, average: 0, min: 0, max: 0 };
  const total = values.reduce((sum, value) => sum + value, 0);
  return { total, average: total / values.length, min: Math.min(...values), max: Math.max(...values) };
}

function reasonsForUsage(usage: TokenUsage): string[] {
  return [usage.input_tokens, usage.output_tokens, usage.total_tokens, usage.cached_tokens, usage.reasoning_tokens]
    .filter((metric): metric is { available: false; reason: string } => Boolean(metric && !metric.available))
    .map((metric) => metric.reason);
}

function metricFrom(value: unknown, reason: string): TokenMetric {
  return typeof value === "number" && Number.isFinite(value) ? { available: true, value } : { available: false, reason };
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

async function stageWorkspace(input: ScenarioRunInput, stageRoot: string): Promise<void> {
  await fs.rm(stageRoot, { recursive: true, force: true });
  await ensureDir(stageRoot);
  if (input.attachSkill && input.skillRoot) await copyPortablePayload(input.skillRoot, path.join(stageRoot, "skill"));
  await ensureDir(path.join(stageRoot, "scenario"));
  for (const name of ["task.md", "scenario.json", "turns.json", "capability.txt"]) {
    const source = path.join(input.scenario.path, name);
    try {
      await fs.copyFile(source, path.join(stageRoot, "scenario", name));
    } catch {
      // Optional scenario files are simply absent from the staged workspace.
    }
  }
  const resources = path.join(input.scenario.path, "resources");
  try {
    await fs.cp(resources, path.join(stageRoot, "scenario", "resources"), { recursive: true });
  } catch {
    // Scenario resources are optional.
  }
  await writeText(
    path.join(stageRoot, "HARNESS.md"),
    `# Meta Skill App Server Harness\n\nRun ${input.runId}, scenario ${input.scenario.id}, source ${input.runSource.label}.\n`
  );
}

async function runtimeSkillName(skillRoot: string): Promise<string> {
  const frontmatter = await parseSkillFrontmatter(path.join(skillRoot, "SKILL.md"));
  return frontmatter.name || path.basename(skillRoot);
}
