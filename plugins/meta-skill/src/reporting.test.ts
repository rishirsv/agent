import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import type { ScenarioRunInput, ScenarioRunResult } from "./app-server/runner";
import type { RunReport, TokenUsageSummary } from "./models";
import { openRun, runEval } from "./evals";
import { renderEvalReportHtml } from "./report";
import { buildMetaSkillReport, listRunSummariesForReport, renderReportMarkdown, renderRunListMarkdown } from "./reporting";
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

  it("renders legacy v1 token availability counts without throwing", () => {
    const report = {
      schema_version: 1,
      generated_at: "2026-06-02T00:00:00.000Z",
      run: { runner: { backend: "app_server", app_server: { mode: "managed" } } },
      summary: {
        run_id: "legacy-run",
        label: null,
        status: "needs_review",
        scenario_count: 1,
        attempt_count: 1,
        result_count: 1,
        run_source: { kind: "working_payload", label: "Working payload", skill_root: "../../../..", attached_skill: true },
        manual_review_required: true,
        failure_classifications: [],
        assessment_status: "needs_review",
        unresolved_count: 1,
        token_usage: { available: 2, unavailable: 1 }
      },
      scenarios: [
        {
          id: "R1",
          folder: "R1-legacy",
          title: "Legacy",
          topics: [],
          evidence_basis: "run_snapshot",
          attempts: [
            {
              run_source: { kind: "working_payload", label: "Working payload", skill_root: "../../../..", attached_skill: true },
              status: "needs_review",
              evidence_path: "scenarios/R1-legacy",
              final_path: "scenarios/R1-legacy/final.md",
              final_preview: "Fixture final.",
              token_usage: {
                input_tokens: { available: true, value: 1 },
                output_tokens: { available: true, value: 2 },
                total_tokens: { available: true, value: 3 }
              }
            }
          ],
          status: "needs_review",
          unresolved: true
        }
      ],
      tests: [],
      judges: [],
      feedback: [],
      artifacts: [],
      readiness: {
        status: "needs_review",
        summary: "Legacy report fixture.",
        blockers: [],
        unresolved: 1,
        basis: "report.json"
      }
    } as unknown as RunReport;

    const html = renderEvalReportHtml(report);

    assert.match(html, /Legacy availability counts: 2 available, 1 unavailable/);
    assert.match(html, /<td>3<\/td>/);
  });

  it("normalizes legacy side-shaped reports and indexes in read mode", async () => {
    const project = await fixtureProject("report-legacy-side-read");
    const runsRoot = path.join(project, ".meta-skill", "evals", "runs");
    const runRoot = path.join(runsRoot, "001-legacy");
    await fs.mkdir(runRoot, { recursive: true });
    await writeJson(path.join(runRoot, "run.json"), { run_id: "001-legacy", status: "needs_review", manual_review_required: true });
    await writeJson(path.join(runRoot, "report.json"), {
      schema_version: 2,
      generated_at: "2026-06-02T00:00:00.000Z",
      run: { run_id: "001-legacy", status: "needs_review", manual_review_required: true },
      summary: {
        run_id: "001-legacy",
        label: null,
        status: "needs_review",
        scenario_count: 1,
        side_count: 2,
        result_count: 2,
        comparison_mode: "release",
        manual_review_required: true,
        failure_classifications: [],
        assessment_status: "needs_review",
        unresolved_count: 1,
        token_usage: { by_side: {}, availability_counts: { available: 0, unavailable: 2 } }
      },
      scenarios: [
        {
          id: "R1",
          folder: "R1-legacy",
          title: "Legacy report",
          topics: [],
          evidence_basis: "legacy_current_project",
          sides: [
            { side: "candidate", status: "needs_review", evidence_path: "scenarios/R1-legacy/candidate", final_preview: "Old working payload output." },
            { side: "release", status: "passed", evidence_path: "scenarios/R1-legacy/release", final_preview: "Old saved snapshot output." }
          ],
          status: "needs_review",
          unresolved: true
        }
      ],
      tests: [],
      judges: [],
      feedback: [],
      comparisons: [],
      artifacts: [],
      readiness: { status: "needs_review", summary: "Legacy report.", blockers: [], unresolved: 1, basis: "report.json" }
    });
    await writeJson(path.join(runsRoot, "index.json"), {
      schema_version: 1,
      updated_at: "2026-06-02T00:00:00.000Z",
      runs: [
        {
          run_id: "001-legacy",
          label: null,
          status: "needs_review",
          scenario_count: 1,
          comparison_mode: "release",
          manual_review_required: true,
          failure_classifications: [],
          assessment_status: "needs_review",
          unresolved_count: 1,
          readiness_status: "needs_review"
        }
      ]
    });

    const runs = await listRunSummariesForReport(project, {}, "read");
    const listMarkdown = renderRunListMarkdown(runs);
    const report = await buildMetaSkillReport({ project, view: "eval", runId: "001-legacy", executeLint: false });
    const evalMarkdown = renderReportMarkdown(report, "eval");
    const html = renderEvalReportHtml(report.evidence.latest_eval_run?.report as RunReport);

    assert.match(listMarkdown, /Working payload/);
    assert.match(evalMarkdown, /Legacy working payload side \/ needs_review/);
    assert.match(evalMarkdown, /Legacy saved snapshot side \/ passed/);
    assert.match(html, /Old working payload output/);
    assert.match(html, /Old saved snapshot output/);
  });

  it("renders the eval report app shell and selects failed scenarios first", () => {
    const html = renderEvalReportHtml(reportFixture());

    assert.match(html, /Meta Skill evals/);
    assert.match(html, /Scenarios/);
    assert.match(html, /Final answer preview/);
    assert.match(html, /Evaluation evidence/);
    assert.match(html, /Token usage/);
    assert.match(html, /Raw evidence/);
    assert.match(html, /data-scenario-id="R2" aria-current="true"/);
    assert.match(html, /Needs review is unresolved evidence, not pass proof/);
    assert.match(html, /Forced-skill run: final-answer behavior only/);
    assert.match(html, /Working payload failed answer/);
    assert.match(html, /<td>Working payload<\/td><td>30<\/td>/);
    assert.match(html, /href="scenarios\/R2-failed\/final\.md"/);
    assert.match(html, /href="scenarios\/R2-failed\/turns\.jsonl"/);
    assert.match(html, /href="scenarios\/R2-failed\/usage\.json"/);
    assert.match(html, /href="scenarios\/R2-failed\/rpc\.jsonl"/);
    assert.doesNotMatch(html, /Artifact section/i);
  });

  it("renders one-source reports without extra attempts", () => {
    const report = reportFixture();
    report.scenarios = [report.scenarios[2]];

    const html = renderEvalReportHtml(report);

    assert.match(html, /Working payload passed answer/);
    assert.doesNotMatch(html, /No saved snapshot attempt in this run/);
  });
});

function reportFixture(): RunReport {
  const workingSource = { kind: "working_payload", label: "Working payload", skill_root: "../../../..", attached_skill: true } as const;
  const failedUsage = tokenSummary(10, 20, 30);
  const passedUsage = tokenSummary(3, 4, 7);
  return {
    schema_version: 2,
    generated_at: "2026-06-03T00:00:00.000Z",
    run: { skill_name: "fixture-skill", runner: { backend: "app_server", app_server: { mode: "managed" } } },
    summary: {
      run_id: "app-run",
      label: "fixture",
      status: "needs_review",
      scenario_count: 3,
      attempt_count: 3,
      result_count: 3,
      run_source: workingSource,
      manual_review_required: true,
      failure_classifications: ["scenario_failure"],
      assessment_status: "failed",
      unresolved_count: 1,
      token_usage: { by_run_source: { working_payload: failedUsage }, availability_counts: { available: 2, unavailable: 1 } }
    },
    scenarios: [
      {
        id: "R1",
        folder: "R1-review",
        title: "Review case",
        family: "regression",
        type: "behavior",
        topics: ["review"],
        evidence_basis: "run_snapshot",
        criteria: { what_it_tests: "Review", expected_behavior: "Review expected.", assertions: ["Review assertion."], tests: [], judges: [] },
        attempts: [{ run_source: workingSource, status: "needs_review", evidence_path: "scenarios/R1-review", final_path: "scenarios/R1-review/final.md", final_preview: "Working payload review answer.", token_usage: undefined }],
        status: "needs_review",
        unresolved: true
      },
      {
        id: "R2",
        folder: "R2-failed",
        title: "Failed case",
        family: "regression",
        type: "behavior",
        topics: ["failure"],
        evidence_basis: "run_snapshot",
        criteria: { what_it_tests: "Failure", expected_behavior: "Pass the check.", assertions: ["No failure."], tests: ["check"], judges: ["judge"] },
        attempts: [{ run_source: workingSource, status: "failed", evidence_path: "scenarios/R2-failed", final_path: "scenarios/R2-failed/final.md", final_preview: "Working payload failed answer.", token_usage: failedUsage, failure_classification: "scenario_failure" }],
        status: "failed",
        unresolved: false
      },
      {
        id: "R3",
        folder: "R3-passed",
        title: "Passed case",
        family: "regression",
        type: "behavior",
        topics: ["pass"],
        evidence_basis: "run_snapshot",
        criteria: { expected_behavior: "Pass.", assertions: [], tests: [], judges: [] },
        attempts: [{ run_source: workingSource, status: "passed", evidence_path: "scenarios/R3-passed", final_path: "scenarios/R3-passed/final.md", final_preview: "Working payload passed answer.", token_usage: passedUsage }],
        status: "passed",
        unresolved: false
      }
    ],
    tests: [{ schema_version: 1, type: "test_result", run_id: "app-run", scenario_id: "R2", created_at: "now", source: "fixture", payload: { scenario_id: "R2", status: "failed", id: "check" } }],
    judges: [{ schema_version: 1, type: "judge_result", run_id: "app-run", scenario_id: "R2", created_at: "now", source: "fixture", payload: { scenario_id: "R2", status: "failed", failure_classification: "judge_failure" } }],
    feedback: [],
    artifacts: [],
    readiness: { status: "blocked", summary: "Run has blocking failures.", blockers: ["scenario_failure"], unresolved: 1, basis: "report.json" }
  };
}

function scenarioRunner(status: ScenarioRunResult["status"], error?: string) {
  return {
    async run(input: ScenarioRunInput): Promise<ScenarioRunResult> {
      const scenarioRoot = path.join(input.runRoot, "scenarios", input.scenario.folder);
      await fs.mkdir(path.join(scenarioRoot, "stage", "skill"), { recursive: true });
      await writeText(path.join(scenarioRoot, "stage", "skill", "SKILL.md"), "fixture");
      await writeText(path.join(scenarioRoot, "final.md"), "Fixture final.");
      await writeText(path.join(scenarioRoot, "turns.jsonl"), "");
      await writeJson(path.join(scenarioRoot, "thread.json"), { schema_version: 1, thread_id: "fixture", turn_ids: ["turn"], status: "completed" });
      await writeText(path.join(scenarioRoot, "rpc.jsonl"), "");
      return {
        status,
        token_usage: tokenSummary(1, 1, 2),
        final_path: path.join(scenarioRoot, "final.md"),
        evidence_path: path.join("scenarios", input.scenario.folder),
        error
      };
    },
    close() {}
  };
}

function tokenSummary(input: number, output: number, total: number): TokenUsageSummary {
  return {
    availability: "present",
    sample_unit: "scenario",
    sample_count: 1,
    unavailable_count: 0,
    input_tokens: { total: input, average: input, min: input, max: input },
    output_tokens: { total: output, average: output, min: output, max: output },
    total_tokens: { total, average: total, min: total, max: total },
    unavailable_reasons: []
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
