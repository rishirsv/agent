import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { runCommand } from "./commands.ts";
import { CliError } from "./project.ts";

describe("commands", () => {
  it("prints the flat command surface", async () => {
    const logs: string[] = [];
    const original = console.log;
    console.log = (message?: unknown) => {
      logs.push(String(message ?? ""));
    };
    try {
      assert.equal(await runCommand(["--help"]), 0);
    } finally {
      console.log = original;
    }

    const help = logs.join("\n");
    assert.match(help, /meta-skill evals create <project>/);
    assert.match(help, /meta-skill run <project>/);
    assert.doesNotMatch(help, /meta-skill report/);
    assert.doesNotMatch(help, /meta-skill review/);
    assert.doesNotMatch(help, /meta-skill decide/);
    assert.doesNotMatch(help, /meta-skill feedback/);
    assert.doesNotMatch(help, /meta-skill judge/);
    assert.match(help, /meta-skill package <project>/);
    assert.doesNotMatch(help, /meta-skill plan/);
    assert.doesNotMatch(help, /meta-skill promote/);
    assert.doesNotMatch(help, /app-server-endpoint/);
    assert.doesNotMatch(help, /--type/);
    assert.match(help, /turn-timeout-ms/);
    assert.match(help, /trace-buffer-events/);
  });

  it("reports unknown flags as CLI usage errors", async () => {
    await assert.rejects(runCommand(["lint", "--wat"]), (error) => {
      assert.ok(error instanceof CliError);
      assert.equal(error.exitCode, 2);
      assert.match(error.message, /Unknown option '--wat'/);
      return true;
    });
  });

  it("reports missing flag values as CLI usage errors", async () => {
    await assert.rejects(runCommand(["package", "--out"]), (error) => {
      assert.ok(error instanceof CliError);
      assert.equal(error.exitCode, 2);
      assert.match(error.message, /Option '--out <value>' argument missing/);
      return true;
    });
  });
});
