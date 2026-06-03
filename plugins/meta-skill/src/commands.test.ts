import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import { formatEvalRunSummary, runCommand } from "./commands";
import { CliError } from "./project";
import { createSkill } from "./skills";

describe("command output", () => {
  it("prints needs_review as unresolved evidence", () => {
    const output = formatEvalRunSummary(".", {
      runId: "001-basic",
      status: "needs_review",
      manualReviewRequired: true,
      failureClassifications: [],
      report: "/tmp/report.html"
    });

    assert.match(output, /status: needs_review/);
    assert.match(output, /manual review required: yes/);
    assert.match(output, /failure classifications: none/);
    assert.match(output, /needs_review is unresolved evidence, not pass proof/);
  });

  it("rejects unsupported attached App Server endpoints before creating a run", async () => {
    await assert.rejects(
      runCommand(["eval", "run", ".", "--app-server-endpoint", "http://127.0.0.1:1234"]),
      (error) => error instanceof CliError && error.exitCode === 2 && /not supported yet/.test(error.message)
    );
  });

  it("prints the central report status view", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "meta-skill-command-report-"));
    const project = path.join(root, "command-report");
    await createSkill({
      target: project,
      slug: "command-report",
      description: "Use when testing command report output; not for publishing.",
      project: true
    });
    const lines: string[] = [];
    const original = console.log;
    console.log = (value?: unknown) => {
      lines.push(String(value ?? ""));
    };
    try {
      await runCommand(["report", project]);
    } finally {
      console.log = original;
    }

    assert.match(lines.join("\n"), /Meta Skill Report: command-report/);
    assert.match(lines.join("\n"), /Recommended Next Step/);
  });
});
