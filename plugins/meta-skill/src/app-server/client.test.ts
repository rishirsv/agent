import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { PassThrough } from "node:stream";
import { describe, it } from "node:test";
import { AppServerJsonClient, AppServerProtocolError, AppServerUnavailableError, type AppServerLine } from "./client.ts";

describe("AppServerJsonClient", () => {
  it("sends initialize then initialized before later requests", async () => {
    const child = new FakeChild();
    const messages: Array<Record<string, unknown>> = [];
    child.onMessage((message) => {
      messages.push(message);
      if (message.method === "initialize") child.respond(message.id, { ok: true });
      if (message.method === "thread/start") child.respond(message.id, { thread: { id: "thread-1" } });
    });

    const client = new AppServerJsonClient({ spawnProcess: () => child.asChild() });
    await client.connect(managedConfig());
    const start = await client.request("thread/start", {});

    assert.deepEqual(start, { thread: { id: "thread-1" } });
    assert.deepEqual(
      messages.map((message) => message.method),
      ["initialize", "initialized", "thread/start"]
    );
    assert.equal("jsonrpc" in messages[0], false);
    client.close();
  });

  it("parses chunked JSONL, traces stderr and invalid JSON, and resolves waiters", async () => {
    const child = new FakeChild();
    const lines: AppServerLine[] = [];
    child.onMessage((message) => {
      if (message.method === "initialize") child.respond(message.id, {});
    });
    const client = new AppServerJsonClient({
      spawnProcess: () => child.asChild(),
      onLine: (line) => {
        lines.push(line);
      }
    });
    await client.connect(managedConfig());

    child.writeStdout("not json\n{\"method\":\"part");
    child.writeStdout("ial/event\",\"params\":{\"value\":1}}\n");
    child.writeStderr("warning\n");
    const event = await client.waitFor((message) => message.method === "partial/event", 50);
    await client.flush();

    assert.deepEqual(event, { method: "partial/event", params: { value: 1 } });
    assert.equal(client.eventCount(), 1);
    assert.equal(lines.some((line) => line.direction === "server" && line.message === "not json"), true);
    assert.equal(lines.some((line) => line.direction === "stderr" && line.message === "warning\n"), true);
    client.close();
  });

  it("retains all App Server events in memory for current extraction", async () => {
    const child = new FakeChild();
    const lines: AppServerLine[] = [];
    child.onMessage((message) => {
      if (message.method === "initialize") child.respond(message.id, {});
    });
    const client = new AppServerJsonClient({
      spawnProcess: () => child.asChild(),
      onLine: (line) => {
        lines.push(line);
      }
    });
    await client.connect(managedConfig());

    child.writeStdout(`${JSON.stringify({ method: "event/one" })}\n`);
    child.writeStdout(`${JSON.stringify({ method: "event/two" })}\n`);
    child.writeStdout(`${JSON.stringify({ method: "event/three" })}\n`);
    await client.flush();

    assert.equal(client.eventCount(), 3);
    assert.deepEqual(
      client.eventsSince(0).map((message) => message.method),
      ["event/one", "event/two", "event/three"]
    );
    assert.equal(lines.some((line) => line.direction === "server" && (line.message as { method?: string }).method === "event/three"), true);
    client.close();
  });

  it("surfaces overloaded request errors without client-side retry", async () => {
    const child = new FakeChild();
    let attempts = 0;
    child.onMessage((message) => {
      if (message.method === "initialize") child.respond(message.id, {});
      if (message.method === "thread/start") {
        attempts += 1;
        child.reject(message.id, -32001, "Server overloaded; retry later.");
      }
    });
    const client = new AppServerJsonClient({ spawnProcess: () => child.asChild() });
    await client.connect(managedConfig());

    await assert.rejects(client.request("thread/start", {}), (error) => error instanceof AppServerProtocolError && error.code === -32001 && /overloaded/.test(error.message));
    assert.equal(attempts, 1);
    client.close();
  });

  it("does not retry non-overload protocol errors", async () => {
    const child = new FakeChild();
    let attempts = 0;
    child.onMessage((message) => {
      if (message.method === "initialize") child.respond(message.id, {});
      if (message.method === "thread/start") {
        attempts += 1;
        child.reject(message.id, -32602, "Invalid params");
      }
    });
    const client = new AppServerJsonClient({ spawnProcess: () => child.asChild() });
    await client.connect(managedConfig());

    await assert.rejects(client.request("thread/start", {}), (error) => error instanceof AppServerProtocolError && error.code === -32602 && /Invalid params/.test(error.message));
    assert.equal(attempts, 1);
    client.close();
  });

  it("rejects timed out and process-exited pending requests", async () => {
    const timeoutChild = new FakeChild();
    timeoutChild.onMessage((message) => {
      if (message.method === "initialize") timeoutChild.respond(message.id, {});
    });
    const timeoutClient = new AppServerJsonClient({ spawnProcess: () => timeoutChild.asChild(), requestTimeoutMs: 5 });
    await timeoutClient.connect(managedConfig());
    await assert.rejects(timeoutClient.request("thread/start", {}), /timed out: thread\/start/);
    timeoutClient.close();

    const exitChild = new FakeChild();
    exitChild.onMessage((message) => {
      if (message.method === "initialize") exitChild.respond(message.id, {});
      if (message.method === "turn/start") setImmediate(() => exitChild.emit("exit", 1));
    });
    const exitClient = new AppServerJsonClient({ spawnProcess: () => exitChild.asChild(), requestTimeoutMs: 1000 });
    await exitClient.connect(managedConfig());
    const waiting = exitClient.waitFor((message) => message.method === "turn/completed", 1000);
    await assert.rejects(exitClient.request("turn/start", {}), (error) => error instanceof AppServerUnavailableError && /process exited/.test(error.message));
    await assert.rejects(waiting, (error) => error instanceof AppServerUnavailableError && /process exited/.test(error.message));
    assert.throws(() => exitClient.notify("initialized"), /not connected/);
    await assert.rejects(exitClient.request("thread/start", {}), /not connected/);
  });
});

function managedConfig() {
  return {
    mode: "managed" as const,
    endpoint: null,
    auth: "inherited" as const,
    protocol: "generated-ts" as const,
    generatedTypes: "test"
  };
}

class FakeChild extends EventEmitter {
  stdin = new PassThrough();
  stdout = new PassThrough();
  stderr = new PassThrough();
  private buffer = "";
  private handler: (message: Record<string, unknown>) => void = () => {};

  constructor() {
    super();
    this.stdin.on("data", (chunk) => {
      this.buffer += chunk.toString();
      let newline = this.buffer.indexOf("\n");
      while (newline >= 0) {
        const line = this.buffer.slice(0, newline);
        this.buffer = this.buffer.slice(newline + 1);
        if (line.trim()) this.handler(JSON.parse(line) as Record<string, unknown>);
        newline = this.buffer.indexOf("\n");
      }
    });
  }

  asChild() {
    return this as unknown as import("node:child_process").ChildProcessWithoutNullStreams;
  }

  onMessage(handler: (message: Record<string, unknown>) => void): void {
    this.handler = handler;
  }

  respond(id: unknown, result: unknown): void {
    this.writeStdout(`${JSON.stringify({ id, result })}\n`);
  }

  reject(id: unknown, code: number, message: string): void {
    this.writeStdout(`${JSON.stringify({ id, error: { code, message } })}\n`);
  }

  writeStdout(text: string): void {
    this.stdout.write(text);
  }

  writeStderr(text: string): void {
    this.stderr.write(text);
  }

  kill(): boolean {
    this.emit("exit", 0);
    return true;
  }
}
