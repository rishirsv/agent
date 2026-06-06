import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import type { SkillActivation, EvalRunSource, EvalRecord, TokenUsage } from "../models.ts";
import { ensureDir, exists, parseSkillFrontmatter, writeText } from "../project.ts";
import type { AppServerConfig, AppServerLine } from "./client.ts";
import { AppServerJsonClient, AppServerUnavailableError } from "./client.ts";
import { summarizeEvalUsage } from "./evidence.ts";
import { BoundedTraceBuffer, JsonlTraceRecorder } from "./trace.ts";
import { collectTranscript, type Transcript, type TranscriptTurn } from "./transcript.ts";

const DEFAULT_TURN_TIMEOUT_MS = 120000;
const DEFAULT_TRACE_EVENTS = 10000;
const EVAL_APPROVAL_POLICY = "never";
const THREAD_SANDBOX = "read-only";
const TURN_SANDBOX_POLICY = { type: "readOnly" as const, networkAccess: false };

interface AppServerClientLike {
  request(method: string, params: unknown): Promise<Record<string, unknown>>;
  waitFor(predicate: (message: Record<string, unknown>) => boolean, timeoutMs: number): Promise<Record<string, unknown>>;
  eventCount(): number;
  eventsSince(index: number): Record<string, unknown>[];
  close(): void;
  flush?(): Promise<void>;
}

export interface AppServerEvalRunnerOptions {
  clientFactory?: (onLine: (line: AppServerLine) => Promise<void>) => AppServerClientLike;
  turnTimeoutMs?: number;
  maxEvalRespawns?: number;
  maxTraceEvents?: number;
}

export interface EvalRunInput {
  projectRoot: string;
  skillRoot?: string;
  skill_activation: SkillActivation;
  eval: EvalRecord;
  runSource: EvalRunSource;
  runId: string;
  runRoot: string;
  appServer: AppServerConfig;
}

export interface EvalRunResult {
  execution_status: "completed" | "errored";
  token_usage: TokenUsage;
  response_path: string;
  rpc_path: string;
  transcript_path: string;
  evidence_path: string;
  thread_id?: string;
  turn_ids: string[];
  error?: string;
}

export class AppServerEvalRunner {
  private client: AppServerClientLike | undefined;
  private readonly clientFactory: (onLine: (line: AppServerLine) => Promise<void>) => AppServerClientLike;
  private readonly turnTimeoutMs: number;
  private readonly maxEvalRespawns: number;
  private readonly maxTraceEvents: number;
  private readonly traceRecorder = new JsonlTraceRecorder();
  private rawTrace = new BoundedTraceBuffer(DEFAULT_TRACE_EVENTS);

  constructor(options: AppServerEvalRunnerOptions = {}) {
    this.clientFactory = options.clientFactory || ((onLine) => new AppServerJsonClient(onLine));
    this.turnTimeoutMs = options.turnTimeoutMs || DEFAULT_TURN_TIMEOUT_MS;
    this.maxEvalRespawns = options.maxEvalRespawns ?? 1;
    this.maxTraceEvents = options.maxTraceEvents ?? DEFAULT_TRACE_EVENTS;
  }

  async run(input: EvalRunInput): Promise<EvalRunResult> {
    for (let attempt = 0; ; attempt += 1) {
      try {
        return await this.runOnce(input);
      } catch (error) {
        if (!(error instanceof AppServerUnavailableError) || attempt >= this.maxEvalRespawns) throw error;
        this.close();
      }
    }
  }

  private async runOnce(input: EvalRunInput): Promise<EvalRunResult> {
    if (input.skill_activation === "discoverable") {
      throw new Error("Discoverable skill activation requires an App Server availability-only skill API.");
    }
    const rawRoot = path.join(input.runRoot, "evals", input.eval.folder);
    await ensureDir(rawRoot);
    const runtimeRoot = await fs.mkdtemp(path.join(os.tmpdir(), "meta-evaluate-skill-"));
    const forceSkill = input.skill_activation === "forced";
    const attachmentName = forceSkill && input.skillRoot ? await runtimeSkillName(input.skillRoot) : undefined;
    const workspaceRoots = await runtimeWorkspaceRoots(runtimeRoot, input.eval.path);

    try {
      const rpcPath = path.join(rawRoot, "rpc.jsonl");
      const transcriptPath = path.join(rawRoot, "transcript.json");
      await this.client?.flush?.();
      await this.traceRecorder.flush();
      this.traceRecorder.reset(rpcPath);
      this.rawTrace = new BoundedTraceBuffer(this.maxTraceEvents);
      const client = await this.ensureClient(input.appServer);

      const start = await client.request("thread/start", {
        cwd: runtimeRoot,
        runtimeWorkspaceRoots: workspaceRoots,
        approvalPolicy: EVAL_APPROVAL_POLICY,
        sandbox: THREAD_SANDBOX,
        experimentalRawEvents: true,
        persistExtendedHistory: false,
        ephemeral: true,
        baseInstructions: forceSkill ? "You are executing a Meta Skill eval. Follow the mounted skill payload exactly and answer the user's task." : "You are executing a Meta Skill eval without an attached skill. Answer the user's task directly.",
        developerInstructions: [
          forceSkill ? "Use the skill mounted in this turn as the only runtime skill guidance." : "No skill is mounted for this eval. Answer without skill-specific runtime guidance.",
          "The user messages are supplied directly. Solver-visible fixture files, when present, are mounted as read-only workspace roots.",
          forceSkill ? "Do not modify files. Produce the final answer that the skill would give the user." : "Do not modify files. Produce the final answer you would give without a skill."
        ].join("\n")
      });
      const thread = start.thread as { id?: string } | undefined;
      const threadId = thread?.id;
      if (!threadId) throw new Error("App Server thread/start response did not include thread.id");

      const turnIds: string[] = [];
      let final = "";
      const transcript: Transcript = { source: "codex_app_server", threadId, turns: [] };
      const turns = [{ content: input.eval.task, source: "task.md#Task" }, ...input.eval.turns.map((turn, index) => ({ content: turn.content, source: `task.md#Turn ${index + 2}` }))];
      for (const [index, turn] of turns.entries()) {
        const result = await runTurn(client, this.rawTrace, threadId, runtimeRoot, workspaceRoots, turn.content, index === 0 && forceSkill, this.turnTimeoutMs, attachmentName, input.skillRoot);
        transcript.turns.push(result);
        final = result.finalText;
        turnIds.push(result.turnId);
      }
      await client.flush?.();
      await this.traceRecorder.flush();
      const evalSummary = summarizeEvalUsage(transcript.turns.at(-1));
      await writeText(path.join(rawRoot, "response.md"), final || "(no final assistant message captured)");
      await writeText(transcriptPath, `${JSON.stringify(transcript, null, 2)}\n`);

      return {
        execution_status: "completed",
        token_usage: evalSummary,
        response_path: path.join(rawRoot, "response.md"),
        rpc_path: rpcPath,
        transcript_path: transcriptPath,
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
        this.rawTrace.append({ direction: line.direction, message: line.message });
        this.traceRecorder.append({ direction: line.direction, message: line.message });
      });
      if (this.client instanceof AppServerJsonClient) await this.client.connect(appServer);
    }
    return this.client;
  }
}

async function runTurn(
  client: AppServerClientLike,
  rawTrace: BoundedTraceBuffer,
  threadId: string,
  runtimeRoot: string,
  workspaceRoots: string[],
  content: string,
  includeSkill: boolean,
  turnTimeoutMs: number,
  attachmentName?: string,
  skillRoot?: string
): Promise<TranscriptTurn> {
  const traceMark = rawTrace.mark();
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
    approvalPolicy: EVAL_APPROVAL_POLICY,
    sandboxPolicy: TURN_SANDBOX_POLICY
  });
  const turn = started.turn as { id?: string } | undefined;
  const turnId = turn?.id;
  if (!turnId) throw new Error("App Server turn/start response did not include turn.id");

  await client.waitFor(
    (message) => message.method === "turn/completed" && (message.params as { threadId?: string; turn?: { id?: string } } | undefined)?.threadId === threadId && (message.params as { turn?: { id?: string } } | undefined)?.turn?.id === turnId,
    turnTimeoutMs
  );
  await client.flush?.();
  const traceSlice = rawTrace.since(traceMark);
  const traceEvents = traceSlice.events;
  const hasServerMessages = traceEvents.some((event) => event.direction === "server" && event.message && typeof event.message === "object" && "method" in event.message);
  const collectedTurn = collectTranscript(hasServerMessages ? traceEvents : client.eventsSince(mark), { threadId, turnId });
  if (!traceSlice.overflowed) return collectedTurn;
  return withTraceOverflowWarning(collectedTurn, traceSlice.droppedEventCount);
}

async function runtimeWorkspaceRoots(runtimeRoot: string, evalPath: string): Promise<string[]> {
  const roots = [runtimeRoot];
  const fixtures = path.join(evalPath, "fixtures");
  if (await exists(fixtures)) roots.push(fixtures);
  return roots;
}

async function runtimeSkillName(skillRoot: string): Promise<string> {
  const frontmatter = await parseSkillFrontmatter(path.join(skillRoot, "SKILL.md"));
  return frontmatter.name || path.basename(skillRoot);
}

function withTraceOverflowWarning(turn: TranscriptTurn, droppedEventCount: number): TranscriptTurn {
  const text = overflowFinalWarning(turn.turnId, droppedEventCount);
  return {
    ...turn,
    finalText: turn.finalText || text,
    items: [
      ...turn.items,
      {
        id: null,
        type: "warning",
        method: "metaSkill/traceBuffer/overflow",
        text,
        raw: {
          droppedEventCount,
          warning: "The in-memory App Server trace buffer overflowed; rpc.jsonl remains the durable raw event log."
        }
      }
    ],
    unknownMethods: [...new Set([...turn.unknownMethods, "metaSkill/traceBuffer/overflow"])].sort()
  };
}

function overflowFinalWarning(turnId: string, droppedEventCount: number): string {
  return `Final assistant message unavailable for turn ${turnId}: the in-memory App Server trace buffer overflowed before final assistant deltas were captured (${droppedEventCount} dropped event${droppedEventCount === 1 ? "" : "s"}). Inspect rpc.jsonl for the durable raw event log.`;
}
