import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import type { CaseRunInput, CaseRunResult } from "./app-server/runner.ts";
import type { TokenUsage } from "./models.ts";
import { importFeedback, runEval } from "./evals.ts";
import { readFacts } from "./facts.ts";
import { createSkill } from "./skills.ts";
import { ensureDir, exists, readText, writeJson, writeText } from "./project.ts";

describe("eval evidence hard cut", () => {
  it("writes one fact log and three per-case files", async () => {
    const project = await fixtureProject("fact-run");
    await writeCase(project);
    const result = await runEval({
      project,
      selector: {},
      noLint: true,
      caseRunner: caseRunner()
    });

    assert.equal(await exists(path.join(result.runRoot, "facts.jsonl")), true);
    assert.equal(await exists(path.join(result.runRoot, "payload", "SKILL.md")), true);
    assert.equal(await exists(path.join(result.runRoot, "cases", "R1-basic", "case.md")), true);
    assert.equal(await exists(path.join(result.runRoot, "cases", "R1-basic", "rpc.jsonl")), true);
    assert.equal(await exists(path.join(result.runRoot, "cases", "R1-basic", "final.md")), true);

    const facts = await readFacts(result.runRoot);
    assert.deepEqual(facts.map((fact) => fact.type), ["run_started", "payload_frozen", "case_defined", "case_trial_finished", "check_observed", "run_finished"]);
    assert.equal((facts.find((fact) => fact.type === "case_trial_finished")?.payload.usage as TokenUsage).total_tokens, 2);
  });

  it("imports feedback into facts", async () => {
    const project = await fixtureProject("feedback-run");
    await writeCase(project);
    const result = await runEval({ project, selector: {}, noLint: true, caseRunner: caseRunner() });
    const feedback = path.join(path.dirname(project), "feedback.jsonl");
    await writeText(feedback, JSON.stringify({ case_id: "R1", source: "reviewer", label: "note", notes: "Looks usable." }));

    await importFeedback(project, result.runId, feedback);

    const facts = await readFacts(result.runRoot);
    assert.equal(facts.some((fact) => fact.type === "feedback_imported" && fact.case_id === "R1"), true);
  });
});

function caseRunner() {
  return {
    async run(input: CaseRunInput): Promise<CaseRunResult> {
      const caseRoot = path.join(input.runRoot, "cases", input.case.folder);
      await ensureDir(caseRoot);
      await writeText(path.join(caseRoot, "rpc.jsonl"), JSON.stringify({ direction: "server", message: { ok: true } }));
      await writeText(path.join(caseRoot, "final.md"), "Final answer.");
      return {
        execution_status: "completed",
        token_usage: tokenUsageEvidence(1, 1, 2),
        final_path: path.join(caseRoot, "final.md"),
        rpc_path: path.join(caseRoot, "rpc.jsonl"),
        evidence_path: path.join("cases", input.case.folder),
        turn_ids: ["turn"]
      };
    },
    close() {}
  };
}

async function fixtureProject(slug: string): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "meta-skill-"));
  const target = path.join(root, slug);
  await createSkill({
    target,
    project: true,
    slug,
    title: slug,
    description: `Use when testing ${slug}; not for unrelated tasks.`,
    job: "Handle the task."
  });
  return target;
}

async function writeCase(project: string): Promise<void> {
  const caseRoot = path.join(project, ".meta-skill", "evals", "cases", "R1-basic");
  await ensureDir(caseRoot);
  await writeText(
    path.join(caseRoot, "case.md"),
    `---
title: Basic
criteria:
  expected_behavior: Answer directly.
  assertions:
    - Answers.
  tests: []
  judges: []
---

## Task

Answer directly.
`
  );
  await writeJson(path.join(project, ".meta-skill", "tests", "manifest.json"), { schema_version: 1, tests: [] });
}

function tokenUsageEvidence(input: number, output: number, total: number): TokenUsage {
  return { input_tokens: input, output_tokens: output, total_tokens: total, cached_input_tokens: null, reasoning_tokens: null, model_context_window: null, unavailable_reason: null };
}
