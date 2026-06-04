import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { runCommand } from "./commands.ts";

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
    assert.match(help, /meta-skill run <project>/);
    assert.match(help, /meta-skill report \[run-id\]/);
    assert.doesNotMatch(help, /meta-skill review/);
    assert.match(help, /meta-skill decide <project> --run <run-id>/);
    assert.match(help, /meta-skill package <project>/);
    assert.doesNotMatch(help, /meta-skill plan/);
    assert.doesNotMatch(help, /meta-skill promote/);
  });
});
