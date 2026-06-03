import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { PassThrough } from "node:stream";
import { describe, it } from "node:test";
import type { ScenarioRecord } from "../models";
import { exists, readJson, readText, writeJson, writeText } from "../project";
import { AppServerScenarioRunner } from "./runner";
import { AppServerJsonClient } from "./client";

const workingRunSource = { kind: "working_payload", label: "Working payload", skill_root: "../../../..", attached_skill: true } as const;

describe("AppServerScenarioRunner", () => {
  it("writes source-honest App Server evidence with real turn IDs and flushed trace", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "meta-skill-runner-"));
    const skillRoot = path.join(root, "skill");
    const scenario = await fixtureScenario(root, [{ content: "Second turn." }]);
    await writeText(path.join(skillRoot, "SKILL.md"), "---\nname: runner-skill\ndescription: Use when testing runner staging; not for live evals.\n---\n\n# Skill\n");
    const runRoot = path.join(root, "run");
    const fake = new FakeScenarioClient();
    const runner = new AppServerScenarioRunner({ clientFactory: (onLine) => fake.attach(onLine), turnTimeoutMs: 25 });

    const result = await runner.run({
      projectRoot: skillRoot,
      skillRoot,
      attachSkill: true,
      scenario,
      runSource: workingRunSource,
      runId: "001-test",
      runRoot,
      appServer: {
        mode: "managed",
        endpoint: null,
        auth: "inherited",
        protocol: "generated-ts",
        generatedTypes: "test"
      }
    });

    assert.equal(result.status, "needs_review");
    const scenarioRoot = path.join(runRoot, "scenarios", scenario.folder);
    const thread = await readJson<{ thread_id: string; turn_ids: string[]; status: string }>(path.join(scenarioRoot, "thread.json"));
    assert.deepEqual(thread, {
      schema_version: 1,
      thread_id: "thread-1",
      turn_ids: ["turn-1", "turn-2"],
      parent_thread_id: null,
      forked_from_id: null,
      resume_from_id: null,
      app_server: {
        mode: "managed",
        endpoint: null,
        auth: "inherited",
        protocol: "generated-ts",
        generatedTypes: "test"
      },
      status: "completed",
      error: null
    });
    assert.equal(await readText(path.join(scenarioRoot, "final.md")), "final turn-2\n");
    const turns = (await readText(path.join(scenarioRoot, "turns.jsonl"))).trim().split("\n").map((line) => JSON.parse(line));
    assert.deepEqual(
      turns.map((turn) => [turn.role, turn.index, turn.turn_id || null]),
      [
        ["user", 0, null],
        ["assistant", 0, "turn-1"],
        ["user", 1, null],
        ["assistant", 1, "turn-2"]
      ]
    );
    const traceRows = (await readText(path.join(scenarioRoot, "rpc.jsonl"))).trim().split("\n").map((line) => JSON.parse(line));
    assert.equal(traceRows.length >= 3, true);
    assert.equal(fake.flushed, true);

    const threadStart = fake.requests.find((request) => request.method === "thread/start");
    assert.equal((threadStart?.params as { approvalPolicy?: string }).approvalPolicy, "never");
    assert.equal((threadStart?.params as { sandbox?: string }).sandbox, "read-only");
    assert.equal((threadStart?.params as { experimentalRawEvents?: boolean }).experimentalRawEvents, true);

    const turnStarts = fake.requests.filter((request) => request.method === "turn/start");
    assert.equal(turnStarts.length, 2);
    assert.deepEqual((turnStarts[0].params as { sandboxPolicy?: unknown }).sandboxPolicy, { type: "readOnly", networkAccess: false });
    const firstInput = (turnStarts[0].params as { input: Array<{ type: string }> }).input;
    const secondInput = (turnStarts[1].params as { input: Array<{ type: string }> }).input;
    assert.equal(firstInput.some((item) => item.type === "skill"), true);
    assert.equal((firstInput.find((item) => item.type === "skill") as { name?: string } | undefined)?.name, "runner-skill");
    assert.equal(secondInput.some((item) => item.type === "skill"), false);
    assert.equal(await exists(path.join(scenarioRoot, "stage", "scenario", "task.md")), true);
    assert.equal(await exists(path.join(scenarioRoot, "stage", "scenario", "scenario.json")), true);
    assert.equal(await exists(path.join(scenarioRoot, "stage", "scenario", "criteria.json")), false);
    assert.equal(result.token_usage.total_tokens.total, 24);
    assert.equal(result.token_usage.input_tokens.total, 10);
    assert.equal(result.token_usage.cached_tokens?.total, 4);
    assert.equal(result.token_usage.output_tokens.total, 14);
    assert.equal(result.token_usage.reasoning_tokens?.total, 0);
    const usage = await readJson<{ availability: string; turns: Array<{ usage: unknown; cumulative_usage?: unknown; source_event?: string }>; summary: { total_tokens: { total: number } } }>(path.join(scenarioRoot, "usage.json"));
    assert.equal(usage.availability, "present");
    assert.equal(usage.turns.length, 2);
    assert.equal(usage.summary.total_tokens.total, 24);
    assert.equal(usage.turns[0].source_event, "thread/tokenUsage/updated");
    assert.deepEqual((turns.find((turn) => turn.role === "assistant" && turn.index === 0) as { token_usage?: unknown }).token_usage, {
      input_tokens: { available: true, value: 5 },
      output_tokens: { available: true, value: 7 },
      total_tokens: { available: true, value: 12 },
      cached_tokens: { available: true, value: 2 },
      reasoning_tokens: { available: true, value: 0 }
    });
  });

  it("records unavailable token usage when a completed turn has no token event", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "meta-skill-runner-no-usage-"));
    const skillRoot = path.join(root, "skill");
    const scenario = await fixtureScenario(root, []);
    await writeText(path.join(skillRoot, "SKILL.md"), "# Skill\n");
    const fake = new FakeScenarioClient({ emitTokenUsage: false });
    const runner = new AppServerScenarioRunner({ clientFactory: (onLine) => fake.attach(onLine), turnTimeoutMs: 25 });

    const result = await runner.run({
      projectRoot: skillRoot,
      skillRoot,
      attachSkill: true,
      scenario,
      runSource: workingRunSource,
      runId: "001-test",
      runRoot: path.join(root, "run"),
      appServer: { mode: "managed", endpoint: null, auth: "inherited", protocol: "generated-ts", generatedTypes: "test" }
    });

    assert.equal(result.token_usage.availability, "unavailable");
    assert.match(result.token_usage.unavailable_reasons[0], /turn-1/);
    const usage = await readJson<{ turns: Array<{ source_event?: string }> }>(path.join(root, "run", "scenarios", scenario.folder, "usage.json"));
    assert.equal("source_event" in usage.turns[0], false);
  });

  it("does not promote per-turn usage into scenario totals when final cumulative usage is missing", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "meta-skill-runner-last-only-"));
    const skillRoot = path.join(root, "skill");
    const scenario = await fixtureScenario(root, []);
    await writeText(path.join(skillRoot, "SKILL.md"), "# Skill\n");
    const fake = new FakeScenarioClient({ emitCumulativeTokenUsage: false });
    const runner = new AppServerScenarioRunner({ clientFactory: (onLine) => fake.attach(onLine), turnTimeoutMs: 25 });
    const runRoot = path.join(root, "run");

    const result = await runner.run({
      projectRoot: skillRoot,
      skillRoot,
      attachSkill: true,
      scenario,
      runSource: workingRunSource,
      runId: "001-test",
      runRoot,
      appServer: { mode: "managed", endpoint: null, auth: "inherited", protocol: "generated-ts", generatedTypes: "test" }
    });

    assert.equal(result.token_usage.availability, "unavailable");
    assert.equal(result.token_usage.total_tokens.total, 0);
    assert.match(result.token_usage.unavailable_reasons[0], /cumulative token metrics were unavailable for final reporting turn turn-1/);
    const scenarioRoot = path.join(runRoot, "scenarios", scenario.folder);
    const usage = await readJson<{ turns: Array<{ usage: unknown; cumulative_usage?: unknown; source_event?: string }>; summary: { availability: string; total_tokens: { total: number } } }>(path.join(scenarioRoot, "usage.json"));
    assert.equal(usage.summary.availability, "unavailable");
    assert.equal(usage.summary.total_tokens.total, 0);
    assert.deepEqual(usage.turns[0].usage, {
      input_tokens: { available: true, value: 5 },
      output_tokens: { available: true, value: 7 },
      total_tokens: { available: true, value: 12 },
      cached_tokens: { available: true, value: 2 },
      reasoning_tokens: { available: true, value: 0 }
    });
    assert.equal("cumulative_usage" in usage.turns[0], false);
    assert.equal(usage.turns[0].source_event, "thread/tokenUsage/updated");
  });

  it("writes each reused-client scenario trace to that scenario rpc.jsonl", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "meta-skill-runner-trace-"));
    const skillRoot = path.join(root, "skill");
    const scenario = await fixtureScenario(root, []);
    await writeText(path.join(skillRoot, "SKILL.md"), "# Skill\n");
    const runRoot = path.join(root, "run");
    const fake = new FakeScenarioClient();
    const runner = new AppServerScenarioRunner({ clientFactory: (onLine) => fake.attach(onLine), turnTimeoutMs: 25 });
    const appServer = { mode: "managed" as const, endpoint: null, auth: "inherited" as const, protocol: "generated-ts" as const, generatedTypes: "test" };
    const secondScenario = { ...scenario, folder: "R2-second", id: "R2" };

    await runner.run({ projectRoot: skillRoot, skillRoot, attachSkill: true, scenario, runSource: workingRunSource, runId: "001-test", runRoot, appServer });
    await runner.run({ projectRoot: skillRoot, skillRoot, attachSkill: true, scenario: secondScenario, runSource: workingRunSource, runId: "001-test", runRoot, appServer });

    const firstTrace = await readText(path.join(runRoot, "scenarios", scenario.folder, "rpc.jsonl"));
    const secondTrace = await readText(path.join(runRoot, "scenarios", secondScenario.folder, "rpc.jsonl"));
    assert.match(firstTrace, /thread\/start/);
    assert.match(secondTrace, /thread\/start/);
  });

  it("covers the runner JSONL protocol contract without a live App Server", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "meta-skill-runner-contract-"));
    const skillRoot = path.join(root, "skill");
    const scenario = await fixtureScenario(root, []);
    await writeText(path.join(skillRoot, "SKILL.md"), "# Skill\n");
    const child = new ProtocolFixtureChild();
    const runner = new AppServerScenarioRunner({
      clientFactory: (onLine) => new AppServerJsonClient({ onLine, spawnProcess: () => child.asChild(), requestTimeoutMs: 1000 }),
      turnTimeoutMs: 1000
    });

    const result = await runner.run({
      projectRoot: skillRoot,
      skillRoot,
      attachSkill: true,
      scenario,
      runSource: workingRunSource,
      runId: "001-test",
      runRoot: path.join(root, "run"),
      appServer: { mode: "managed", endpoint: null, auth: "inherited", protocol: "generated-ts", generatedTypes: "test" }
    });

    assert.equal(result.status, "needs_review");
    assert.deepEqual(
      child.messages.map((message) => message.method),
      ["initialize", "initialized", "thread/start", "turn/start"]
    );
    assert.equal("jsonrpc" in child.messages[0], false);
    assert.equal((child.messages.find((message) => message.method === "thread/start")?.params as { sandbox?: string }).sandbox, "read-only");
    assert.deepEqual((child.messages.find((message) => message.method === "turn/start")?.params as { sandboxPolicy?: unknown }).sandboxPolicy, { type: "readOnly", networkAccess: false });
  });

  it("times out when a turn never completes", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "meta-skill-runner-timeout-"));
    const skillRoot = path.join(root, "skill");
    const scenario = await fixtureScenario(root, []);
    await writeText(path.join(skillRoot, "SKILL.md"), "# Skill\n");
    const fake = new FakeScenarioClient({ completeTurns: false });
    const runner = new AppServerScenarioRunner({ clientFactory: (onLine) => fake.attach(onLine), turnTimeoutMs: 5 });

    await assert.rejects(
      runner.run({
        projectRoot: skillRoot,
        skillRoot,
        attachSkill: true,
        scenario,
        runSource: workingRunSource,
        runId: "001-test",
        runRoot: path.join(root, "run"),
        appServer: { mode: "managed", endpoint: null, auth: "inherited", protocol: "generated-ts", generatedTypes: "test" }
      }),
      /Timed out waiting/
    );
  });
});

async function fixtureScenario(root: string, turns: Array<{ content: string }>): Promise<ScenarioRecord> {
  const scenarioPath = path.join(root, "scenario");
  await fs.mkdir(scenarioPath, { recursive: true });
  await writeText(path.join(scenarioPath, "task.md"), "First turn.");
  await writeJson(path.join(scenarioPath, "scenario.json"), {
    schema_version: 1,
    id: "R1",
    family: "regression",
    type: "behavior",
    title: "Runner",
    topics: [],
    include: [],
    setup: [],
    metadata: {}
  });
  await writeJson(path.join(scenarioPath, "criteria.json"), {
    schema_version: 1,
    what_it_tests: "Runner",
    expected_behavior: "Runs",
    assertions: [],
    tests: [],
    judges: []
  });
  if (turns.length) await writeJson(path.join(scenarioPath, "turns.json"), turns);
  return {
    folder: "R1-runner",
    id: "R1",
    path: scenarioPath,
    metadata: await readJson(path.join(scenarioPath, "scenario.json")),
    criteria: await readJson(path.join(scenarioPath, "criteria.json")),
    task: "First turn.",
    turns
  };
}

class FakeScenarioClient {
  requests: Array<{ method: string; params: unknown }> = [];
  flushed = false;
  private events: Record<string, unknown>[] = [];
  private turnCount = 0;
  private pendingTrace: Promise<void>[] = [];
  private onLine: (line: { direction: "client" | "server" | "stderr"; message: unknown }) => Promise<void> = async () => {};

  constructor(private options: { completeTurns?: boolean; emitTokenUsage?: boolean; emitCumulativeTokenUsage?: boolean } = { completeTurns: true, emitTokenUsage: true, emitCumulativeTokenUsage: true }) {}

  attach(onLine: (line: { direction: "client" | "server" | "stderr"; message: unknown }) => Promise<void>): this {
    this.onLine = onLine;
    return this;
  }

  async request(method: string, params: unknown): Promise<Record<string, unknown>> {
    this.requests.push({ method, params });
    this.pendingTrace.push(this.onLine({ direction: "client", message: { method, params } }));
    if (method === "thread/start") return { thread: { id: "thread-1" } };
    if (method === "turn/start") {
      this.turnCount += 1;
      const turnId = `turn-${this.turnCount}`;
      this.events.push({ method: "item/agentMessage/delta", params: { threadId: "other-thread", turnId, delta: "wrong" } });
      this.events.push({ method: "item/agentMessage/delta", params: { threadId: "thread-1", turnId, delta: `final ${turnId}` } });
      this.events.push({ method: "item/agentMessage/delta", params: { threadId: "thread-1", turnId, delta: "\n" } });
      if (this.options.emitTokenUsage !== false) {
        this.events.push({
          method: "thread/tokenUsage/updated",
          params: {
            threadId: "thread-1",
            turnId,
            tokenUsage: {
              last: { inputTokens: 5, cachedInputTokens: 2, outputTokens: 7, reasoningOutputTokens: 0, totalTokens: 12 },
              ...(this.options.emitCumulativeTokenUsage === false ? {} : { total: { inputTokens: 5 * this.turnCount, cachedInputTokens: 2 * this.turnCount, outputTokens: 7 * this.turnCount, reasoningOutputTokens: 0, totalTokens: 12 * this.turnCount } })
            }
          }
        });
      }
      if (this.options.completeTurns !== false) this.events.push({ method: "turn/completed", params: { threadId: "thread-1", turn: { id: turnId } } });
      return { turn: { id: turnId } };
    }
    return {};
  }

  waitFor(predicate: (message: Record<string, unknown>) => boolean, timeoutMs: number): Promise<Record<string, unknown>> {
    const event = this.events.find(predicate);
    if (event) return Promise.resolve(event);
    return new Promise((_, reject) => setTimeout(() => reject(new Error("Timed out waiting for App Server notification")), timeoutMs));
  }

  eventCount(): number {
    return this.events.length;
  }

  eventsSince(index: number): Record<string, unknown>[] {
    return this.events.slice(index);
  }

  async flush(): Promise<void> {
    await Promise.all(this.pendingTrace);
    this.flushed = true;
  }

  close(): void {}
}

class ProtocolFixtureChild extends EventEmitter {
  stdin = new PassThrough();
  stdout = new PassThrough();
  stderr = new PassThrough();
  messages: Array<Record<string, unknown>> = [];
  private buffer = "";

  constructor() {
    super();
    this.stdin.on("data", (chunk) => {
      this.buffer += chunk.toString();
      let newline = this.buffer.indexOf("\n");
      while (newline >= 0) {
        const line = this.buffer.slice(0, newline);
        this.buffer = this.buffer.slice(newline + 1);
        if (line.trim()) this.receive(JSON.parse(line) as Record<string, unknown>);
        newline = this.buffer.indexOf("\n");
      }
    });
  }

  asChild() {
    return this as unknown as import("node:child_process").ChildProcessWithoutNullStreams;
  }

  kill(): boolean {
    this.emit("exit", 0);
    return true;
  }

  private receive(message: Record<string, unknown>): void {
    this.messages.push(message);
    if (message.method === "initialize") {
      this.respond(message.id, {});
      return;
    }
    if (message.method === "initialized") return;
    if (message.method === "thread/start") {
      this.respond(message.id, { thread: { id: "thread-contract" } });
      return;
    }
    if (message.method === "turn/start") {
      this.respond(message.id, { turn: { id: "turn-contract" } });
      this.writeStdout(`${JSON.stringify({ method: "item/agentMessage/delta", params: { threadId: "thread-contract", turnId: "turn-contract", delta: "contract final" } })}\n`);
      this.writeStdout(`${JSON.stringify({ method: "thread/tokenUsage/updated", params: { threadId: "thread-contract", turnId: "turn-contract", tokenUsage: { last: { inputTokens: 3, outputTokens: 4, totalTokens: 7 } } } })}\n`);
      this.writeStdout(`${JSON.stringify({ method: "turn/completed", params: { threadId: "thread-contract", turn: { id: "turn-contract" } } })}\n`);
    }
  }

  private respond(id: unknown, result: unknown): void {
    this.writeStdout(`${JSON.stringify({ id, result })}\n`);
  }

  private writeStdout(text: string): void {
    this.stdout.write(text);
  }
}
