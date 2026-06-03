import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import type { ScenarioRunInput, ScenarioRunResult } from "./app-server/runner";
import { openRun, runEval } from "./evals";
import { buildMetaSkillReport, listRunSummariesForReport, renderReportMarkdown } from "./reporting";
import { exists, writeJson, writeText } from "./project";
import { createSkill } from "./skills";

describe("central reporting service", () => {
  it("builds read-only project reports without materializing missing eval artifacts", async () => {
    const project = await fixtureProject("report-read-only");
    await writeScenario(project);
    const result = await runEval({
      project,
      selector: {},
      noLint: true,
      scenarioRunner: scenarioRunner("passed")
    });
    await fs.rm(path.join(result.runRoot, "report.json"));
    await fs.rm(path.join(result.runRoot, "report.html"));
    await fs.rm(path.join(path.dirname(result.runRoot), "index.json"));

    const report = await buildMetaSkillReport({ project, view: "status", executeLint: false });

    assert.equal(report.summary.latest_run_id, result.runId);
    assert.equal(report.evidence.latest_eval_run?.report.summary.run_id, result.runId);
    assert.equal(await exists(path.join(result.runRoot, "report.json")), false);
    assert.equal(await exists(path.join(result.runRoot, "report.html")), false);
    assert.equal(await exists(path.join(path.dirname(result.runRoot), "index.json")), false);
  });

  it("keeps old eval open behavior as a shared-service materialized read", async () => {
    const project = await fixtureProject("report-open-compat");
    await writeScenario(project);
    const result = await runEval({
      project,
      selector: {},
      noLint: true,
      scenarioRunner: scenarioRunner("needs_review")
    });
    await fs.rm(path.join(result.runRoot, "report.json"));
    await fs.rm(path.join(result.runRoot, "report.html"));
    await fs.rm(path.join(path.dirname(result.runRoot), "index.json"));

    const opened = await openRun(project, result.runId);
    const rows = await listRunSummariesForReport(project, {}, "read");

    assert.equal(opened.data.summary.run_id, result.runId);
    assert.equal(await exists(path.join(result.runRoot, "report.json")), true);
    assert.equal(await exists(path.join(result.runRoot, "report.html")), true);
    assert.equal(rows.at(-1)?.run_id, result.runId);
  });

  it("renders status and eval views from the same report model", async () => {
    const project = await fixtureProject("report-render");
    await writeScenario(project);
    const result = await runEval({
      project,
      selector: {},
      noLint: true,
      scenarioRunner: scenarioRunner("needs_review")
    });

    const report = await buildMetaSkillReport({ project, view: "status", runId: result.runId, executeLint: false });
    const status = renderReportMarkdown(report, "status");
    const evalView = renderReportMarkdown(report, "eval");

    assert.match(status, /Meta Skill Report: report-render/);
    assert.match(status, /Recommended Next Step/);
    assert.match(evalView, new RegExp(`Meta Skill Eval ${result.runId}`));
    assert.match(evalView, /unresolved; not pass proof/);
  });
});

function scenarioRunner(status: ScenarioRunResult["status"], error?: string) {
  return {
    async run(input: ScenarioRunInput): Promise<ScenarioRunResult> {
      const sideRoot = path.join(input.runRoot, "scenarios", input.scenario.folder, input.side);
      await fs.mkdir(path.join(sideRoot, "stage", "skill"), { recursive: true });
      await writeText(path.join(sideRoot, "stage", "skill", "SKILL.md"), "fixture");
      await writeText(path.join(sideRoot, "final.md"), "Fixture final.");
      await writeText(path.join(sideRoot, "turns.jsonl"), "");
      await writeJson(path.join(sideRoot, "thread.json"), { schema_version: 1, thread_id: "fixture", turn_ids: ["turn"], status: "completed" });
      await writeText(path.join(sideRoot, "rpc.jsonl"), "");
      return {
        status,
        token_usage: {
          input_tokens: { available: true, value: 1 },
          output_tokens: { available: true, value: 1 },
          total_tokens: { available: true, value: 2 }
        },
        final_path: path.join(sideRoot, "final.md"),
        evidence_path: path.join("scenarios", input.scenario.folder, input.side),
        error
      };
    },
    close() {}
  };
}

async function fixtureProject(slug: string): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "meta-skill-reporting-"));
  const project = path.join(root, slug);
  await createSkill({
    target: project,
    slug,
    description: `Use when testing ${slug}; not for publishing.`,
    project: true
  });
  return project;
}

async function writeScenario(project: string): Promise<void> {
  const scenario = path.join(project, ".meta-skill", "evals", "scenarios", "R1-basic");
  await fs.mkdir(scenario, { recursive: true });
  await writeText(path.join(scenario, "task.md"), "Do the eval task.");
  await writeJson(path.join(scenario, "scenario.json"), {
    schema_version: 1,
    id: "R1",
    family: "regression",
    type: "behavior",
    title: "Basic behavior",
    topics: ["smoke"],
    include: [],
    setup: [],
    metadata: {}
  });
  await writeJson(path.join(scenario, "criteria.json"), {
    schema_version: 1,
    what_it_tests: "Basic behavior",
    expected_behavior: "The skill should answer directly.",
    assertions: ["Answers directly."],
    tests: [],
    judges: []
  });
}
