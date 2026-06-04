import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import type { SkillActivation, EvalRunSource, CaseRecord, TokenUsage } from "../models.ts";
import { appendJsonl, ensureDir, exists, parseSkillFrontmatter, unavailableTokenUsage, writeText } from "../project.ts";
import type { AppServerConfig, AppServerLine } from "./client.ts";
import { AppServerJsonClient, AppServerUnavailableError } from "./client.ts";

interface AppServerClientLike {
  request(method: string, params: unknown): Promise<Record<string, unknown>>;
  waitFor(predicate: (message: Record<string, unknown>) => boolean, timeoutMs: number): Promise<Record<string, unknown>>;
  eventCount(): number;
  eventsSince(index: number): Record<string, unknown>[];
  close(): void;
  flush?(): Promise<void>;
}

export interface AppServerCaseRunnerOptions {
  clientFactory?: (onLine: (line: AppServerLine) => Promise<void>) => AppServerClientLike;
  turnTimeoutMs?: number;
  maxCaseRespawns?: number;
}

export interface CaseRunInput {
  projectRoot: string;
  skillRoot?: string;
  skill_activation: SkillActivation;
  case: CaseRecord;
  runSource: EvalRunSource;
  runId: string;
  runRoot: string;
  appServer: AppServerConfig;
}

export interface CaseRunResult {
  execution_status: "completed" | "errored";
  token_usage: TokenUsage;
  final_path: string;
  rpc_path: string;
  evidence_path: string;
  thread_id?: string;
  turn_ids: string[];
  error?: string;
}

export class AppServerCaseRunner {
  private client: AppServerClientLike | undefined;
  private readonly clientFactory: (onLine: (line: AppServerLine) => Promise<void>) => AppServerClientLike;
  private readonly turnTimeoutMs: number;
  private readonly maxCaseRespawns: number;
  private rpcPath: string | undefined;

  constructor(options: AppServerCaseRunnerOptions = {}) {
    this.clientFactory = options.clientFactory || ((onLine) => new AppServerJsonClient(onLine));
    this.turnTimeoutMs = options.turnTimeoutMs || 120000;
    this.maxCaseRespawns = options.maxCaseRespawns ?? 1;
  }

  async run(input: CaseRunInput): Promise<CaseRunResult> {
    for (let attempt = 0; ; attempt += 1) {
      try {
        return await this.runOnce(input);
      } catch (error) {
        if (!(error instanceof AppServerUnavailableError) || attempt >= this.maxCaseRespawns) throw error;
        this.close();
      }
    }
  }

  private async runOnce(input: CaseRunInput): Promise<CaseRunResult> {
    if (input.skill_activation === "discoverable") {
      throw new Error("Discoverable skill activation requires an App Server availability-only skill API.");
    }
    const rawRoot = path.join(input.runRoot, "cases", input.case.folder);
    await ensureDir(rawRoot);
    const runtimeRoot = await fs.mkdtemp(path.join(os.tmpdir(), "meta-skill-case-"));
    const forceSkill = input.skill_activation === "forced";
    const attachmentName = forceSkill && input.skillRoot ? await runtimeSkillName(input.skillRoot) : undefined;
    const workspaceRoots = await runtimeWorkspaceRoots(runtimeRoot, input.case.path);

    try {
      const rpcPath = path.join(rawRoot, "rpc.jsonl");
      await this.client?.flush?.();
      this.rpcPath = rpcPath;
      const client = await this.ensureClient(input.appServer);

      const start = await client.request("thread/start", {
        cwd: runtimeRoot,
        runtimeWorkspaceRoots: workspaceRoots,
        approvalPolicy: "never",
        sandbox: "read-only",
        experimentalRawEvents: true,
        persistExtendedHistory: false,
        ephemeral: true,
        baseInstructions: forceSkill ? "You are executing a Meta Skill eval case. Follow the mounted skill payload exactly and answer the user's task." : "You are executing a Meta Skill eval case without an attached skill. Answer the user's task directly.",
        developerInstructions: [
          forceSkill ? "Use the skill mounted in this turn as the only runtime skill guidance." : "No skill is mounted for this case. Answer without skill-specific runtime guidance.",
          "The user messages are supplied directly. Solver-visible fixture files, when present, are mounted as read-only workspace roots.",
          forceSkill ? "Do not modify files. Produce the final answer that the skill would give the user." : "Do not modify files. Produce the final answer you would give without a skill."
        ].join("\n")
      });
      const thread = start.thread as { id?: string } | undefined;
      const threadId = thread?.id;
      if (!threadId) throw new Error("App Server thread/start response did not include thread.id");

      const turnIds: string[] = [];
      let finalCumulativeUsage: TokenUsage | undefined;
      let final = "";
      const turns = [{ content: input.case.task, source: "case.md#Task" }, ...input.case.turns.map((turn, index) => ({ content: turn.content, source: `case.md#Turn ${index + 2}` }))];
      for (const [index, turn] of turns.entries()) {
        const result = await runTurn(client, threadId, runtimeRoot, workspaceRoots, turn.content, index === 0 && forceSkill, this.turnTimeoutMs, attachmentName, input.skillRoot);
        final = result.final || final;
        finalCumulativeUsage = result.cumulativeTokenUsage;
        if (result.turnId) turnIds.push(result.turnId);
      }
      await client.flush?.();
      const caseSummary = summarizeCaseUsage(finalCumulativeUsage);
      await writeText(path.join(rawRoot, "final.md"), final || "(no final assistant message captured)");

      return {
        execution_status: "completed",
        token_usage: caseSummary,
        final_path: path.join(rawRoot, "final.md"),
        rpc_path: rpcPath,
        evidence_path: path.relative(input.runRoot, rawRoot),
        thread_id: threadId,
        turn_ids: turnIds
      };
    } finally {
      await fs.rm(runtimeRoot, { recursive: true, force: true });
    }
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
  runtimeRoot: string,
  workspaceRoots: string[],
  content: string,
  includeSkill: boolean,
  turnTimeoutMs: number,
  attachmentName?: string,
  skillRoot?: string
): Promise<{ turnId: string; final: string; cumulativeTokenUsage?: TokenUsage }> {
  const mark = client.eventCount();
  const input = [
    ...(includeSkill && attachmentName && skillRoot ? [{ type: "skill", name: attachmentName, path: skillRoot }] : []),
    { type: "text", text: content, text_elements: [] }
  ];
  const started = await client.request("turn/start", {
    threadId,
    input,
    cwd: runtimeRoot,
    runtimeWorkspaceRoots: workspaceRoots,
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
  if (!tokenEvent) return { turnId, final };
  const params = tokenEvent.params as { tokenUsage?: { last?: unknown; total?: unknown }; modelContextWindow?: unknown };
  const tokenUsage = params.tokenUsage;
  const modelContextWindow = numberOrNull(params.modelContextWindow);
  return {
    turnId,
    final,
    cumulativeTokenUsage: tokenUsage?.total ? toTokenUsage(tokenUsage.total, `App Server cumulative token metrics were unavailable for turn ${turnId}.`, modelContextWindow) : undefined
  };
}

function toTokenUsage(raw: unknown, reason = "App Server token metrics were unavailable.", modelContextWindow: number | null = null): TokenUsage {
  const metrics = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : undefined;
  if (!metrics) return unavailableTokenUsage(reason);
  const input = numberOrNull(metrics.inputTokens);
  const output = numberOrNull(metrics.outputTokens);
  const total = numberOrNull(metrics.totalTokens);
  const cachedInput = numberOrNull(metrics.cachedInputTokens);
  const reasoning = numberOrNull(metrics.reasoningOutputTokens);
  const unavailableReason = input === null || output === null || total === null ? reason : null;
  return {
    input_tokens: input,
    output_tokens: output,
    total_tokens: total,
    cached_input_tokens: cachedInput,
    reasoning_tokens: reasoning,
    model_context_window: modelContextWindow,
    unavailable_reason: unavailableReason
  };
}

function summarizeCaseUsage(finalCumulativeUsage?: TokenUsage): TokenUsage {
  if (finalCumulativeUsage?.total_tokens !== null && finalCumulativeUsage?.total_tokens !== undefined) return finalCumulativeUsage;
  return unavailableTokenUsage("App Server completed without tokenUsage.total on the final turn.");
}

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

async function runtimeWorkspaceRoots(runtimeRoot: string, casePath: string): Promise<string[]> {
  const roots = [runtimeRoot];
  const fixtures = path.join(casePath, "fixtures");
  if (await exists(fixtures)) roots.push(fixtures);
  return roots;
}

async function runtimeSkillName(skillRoot: string): Promise<string> {
  const frontmatter = await parseSkillFrontmatter(path.join(skillRoot, "SKILL.md"));
  return frontmatter.name || path.basename(skillRoot);
}
