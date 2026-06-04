import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import { AppServerCaseRunner } from "./runner.ts";
import type { CaseRecord } from "../models.ts";
import { exists, readText, writeText } from "../project.ts";

describe("AppServerCaseRunner", () => {
  it("writes only rpc and final per case and returns usage", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "meta-skill-runner-"));
    const runRoot = path.join(root, "run");
    const skillRoot = path.join(root, "skill");
    await fs.mkdir(skillRoot, { recursive: true });
    await writeText(path.join(skillRoot, "SKILL.md"), "---\nname: demo\n---\n# Demo\n");
    const fake = new FakeClient();
    const runner = new AppServerCaseRunner({ clientFactory: (onLine) => fake.attach(onLine), turnTimeoutMs: 25 });

    const result = await runner.run({
      projectRoot: skillRoot,
      skillRoot,
      skill_activation: "forced",
      case: caseRecord(root),
      runSource: { kind: "working_payload", label: "Working payload", skill_root: "payload", skill_activation: "forced" },
      runId: "001-test",
      runRoot,
      appServer: { mode: "managed", endpoint: null, auth: "inherited", protocol: "generated-ts", generatedTypes: "test" }
    });

    const caseRoot = path.join(runRoot, "cases", "R1-basic");
    assert.equal(await exists(path.join(caseRoot, "rpc.jsonl")), true);
    assert.equal(await exists(path.join(caseRoot, "final.md")), true);
    assert.equal(result.token_usage.total_tokens, 24);
    assert.match(await readText(path.join(caseRoot, "final.md")), /final answer/);
  });
});

class FakeClient {
  private onLine?: (line: { direction: "client" | "server" | "stderr"; message: unknown }) => Promise<void>;
  private events: Record<string, unknown>[] = [];

  attach(onLine: (line: { direction: "client" | "server" | "stderr"; message: unknown }) => Promise<void>) {
    this.onLine = onLine;
    return {
      request: async (method: string) => {
        await this.onLine?.({ direction: "client", message: { method } });
        if (method === "thread/start") return { thread: { id: "thread-1" } };
        this.events.push({ method: "thread/tokenUsage/updated", params: { threadId: "thread-1", turnId: "turn-1", tokenUsage: { total: { inputTokens: 10, outputTokens: 14, totalTokens: 24, cachedInputTokens: 4, reasoningOutputTokens: 0 } } } });
        return { turn: { id: "turn-1" } };
      },
      waitFor: async () => ({ msg: { type: "turn/completed" } }),
      eventCount: () => 0,
      eventsSince: () => [
        { method: "item/agentMessage/delta", params: { threadId: "thread-1", turnId: "turn-1", delta: "final answer" } },
        ...this.events
      ],
      close: () => {},
      flush: async () => {}
    };
  }
}

function caseRecord(root: string): CaseRecord {
  return {
    folder: "R1-basic",
    id: "R1",
    path: root,
    type: "regression",
    metadata: { title: "Basic" },
    criteria: { expected_behavior: "Runs", assertions: [], tests: [], judges: [] },
    task: "Answer.",
    turns: []
  };
}
