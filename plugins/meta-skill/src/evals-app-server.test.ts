import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import { AppServerUnavailableError } from "./app-server/client";
import type { ScenarioRunInput, ScenarioRunResult } from "./app-server/runner";
import type { TokenUsageSummary } from "./models";
import { importFeedback, judgeRun, listRunSummaries, openRun, runEval } from "./evals";
import { judgePassed } from "./eval/judge";
import { packageProject } from "./package";
import { exists, readJson, readText, writeJson, writeText } from "./project";
import { createSkill } from "./skills";
import { releaseProject } from "./versions";

type JsonlRow = Record<string, unknown> & { type?: string; payload?: Record<string, unknown> };

describe("App Server eval orchestration", () => {
  it("records read-only runner metadata and closes the scenario runner", async () => {
    const project = await fixtureProject("eval-app-server-metadata");
    await writeScenario(project);
    let closed = false;
    const result = await runEval({
      project,
      selector: {},
      noLint: true,
      scenarioRunner: {
        async run(input) {
          const scenarioRoot = path.join(input.runRoot, "scenarios", input.scenario.folder);
          await fs.mkdir(scenarioRoot, { recursive: true });
          await writeText(path.join(scenarioRoot, "final.md"), "ok");
          await writeText(path.join(scenarioRoot, "rpc.jsonl"), "");
          await writeJson(path.join(scenarioRoot, "thread.json"), { schema_version: 1, thread_id: "thread", turn_ids: ["turn-1"], status: "completed" });
          return {
            status: "needs_review",
            token_usage: tokenSummary(1, 2, 3),
            final_path: path.join(scenarioRoot, "final.md"),
            evidence_path: path.join("scenarios", input.scenario.folder)
          };
        },
        close() {
          closed = true;
        }
      }
    });

    assert.equal(result.ok, false);
    assert.equal(result.status, "needs_review");
    assert.equal(result.manualReviewRequired, true);
    assert.equal(closed, true);
    const run = await readJson<{
      status: string;
      ok: boolean;
      manual_review_required: boolean;
      failure_classifications: string[];
      runner: { sandbox: string; approval_policy: string; network_access: boolean; backend: string; protocol: string };
    }>(path.join(result.runRoot, "run.json"));
    assert.equal(run.status, "needs_review");
    assert.equal(run.ok, false);
    assert.equal(run.manual_review_required, true);
    assert.deepEqual(run.failure_classifications, []);
    assert.equal(run.runner.backend, "app_server");
    assert.equal(run.runner.protocol, "generated-ts");
    assert.equal(run.runner.sandbox, "read-only");
    assert.equal(run.runner.approval_policy, "never");
    assert.equal(run.runner.network_access, false);
    const tests = await readText(path.join(result.runRoot, "tests.jsonl"));
    assert.match(tests, /"type":"lint_skipped"/);
    const completed = (await readJsonl(path.join(result.runRoot, "events.jsonl"))).find((row) => row.type === "run_completed");
    assert.equal(completed?.payload?.status, "needs_review");
    assert.equal(completed?.payload?.manual_review_required, true);
    assert.deepEqual(completed?.payload?.failure_classifications, []);
    const report = await readText(result.report);
    assert.match(report, /unresolved; not pass proof/);
    assert.match(report, /Fixture final|ok/);
    assert.match(report, /lint skipped/);
    const normalized = await readJson<{ summary: { run_id: string; status: string; unresolved_count: number }; scenarios: unknown[]; readiness: { status: string } }>(path.join(result.runRoot, "report.json"));
    assert.equal(normalized.summary.run_id, result.runId);
    assert.equal(normalized.summary.status, "needs_review");
    assert.equal(normalized.summary.unresolved_count, 1);
    assert.equal(normalized.scenarios.length, 1);
    assert.equal(normalized.readiness.status, "needs_review");
    const index = await readJson<{ runs: Array<{ run_id: string; status: string; readiness_status: string }> }>(path.join(path.dirname(result.runRoot), "index.json"));
    assert.deepEqual(index.runs.map((row) => [row.run_id, row.status, row.readiness_status]), [[result.runId, "needs_review", "needs_review"]]);
    const opened = await openRun(project, result.runId);
    assert.equal(opened.data.summary.run_id, result.runId);
    const listed = await listRunSummaries(project);
    assert.equal(listed.at(-1)?.run_id, result.runId);
  });

  it("classifies App Server scenario failures without reporting a false green", async () => {
    const project = await fixtureProject("eval-app-server-failure");
    await writeScenario(project);
    let closed = false;
    const result = await runEval({
      project,
      selector: {},
      noLint: true,
      scenarioRunner: {
        async run() {
          throw new AppServerUnavailableError("App Server process exited");
        },
        close() {
          closed = true;
        }
      }
    });

    assert.equal(result.ok, false);
    assert.equal(closed, true);
    assert.equal(await exists(path.join(result.runRoot, "scenarios", "R1-basic", "final.md")), false);
    const run = await readJson<{ status: string; ok: boolean; failure_classifications: string[] }>(path.join(result.runRoot, "run.json"));
    assert.equal(run.status, "failed");
    assert.equal(run.ok, false);
    assert.deepEqual(run.failure_classifications, ["app_server_unavailable"]);
    const results = await readJsonl(path.join(result.runRoot, "results.jsonl"));
    assert.equal(results[0]?.payload?.status, "errored");
    assert.equal(results[0]?.payload?.failure_classification, "app_server_unavailable");
    const events = await readText(path.join(result.runRoot, "events.jsonl"));
    assert.match(events, /"type":"scenario_failed"/);
    assert.match(events, /"failure_classification":"app_server_unavailable"/);
    assert.match(events, /"available":false/);
  });

  it("classifies failed scenario results separately from harness failures", async () => {
    const project = await fixtureProject("eval-scenario-failed");
    await writeScenario(project);
    const result = await runEval({
      project,
      selector: {},
      noLint: true,
      scenarioRunner: scenarioRunner("failed", "Scenario assertions failed.")
    });

    assert.equal(result.ok, false);
    const run = await readJson<{ status: string; failure_classifications: string[] }>(path.join(result.runRoot, "run.json"));
    assert.equal(run.status, "failed");
    assert.deepEqual(run.failure_classifications, ["scenario_failed"]);
    const results = await readJsonl(path.join(result.runRoot, "results.jsonl"));
    assert.equal(results[0]?.payload?.status, "failed");
    assert.equal(results[0]?.payload?.failure_classification, "scenario_failed");
    assert.equal(results[0]?.payload?.error, "Scenario assertions failed.");
  });

  it("runs unassisted scenarios without attaching a skill", async () => {
    const project = await fixtureProject("eval-no-skill");
    await writeScenario(project);
    let sawNoSkill = false;
    const result = await runEval({
      project,
      selector: {},
      runSource: "no_skill",
      noLint: true,
      scenarioRunner: {
        async run(input) {
          sawNoSkill = !input.attachSkill && !input.skillRoot && input.runSource.kind === "no_skill";
          const scenarioRoot = path.join(input.runRoot, "scenarios", input.scenario.folder);
          await fs.mkdir(scenarioRoot, { recursive: true });
          await writeText(path.join(scenarioRoot, "final.md"), "Unassisted final.");
          await writeText(path.join(scenarioRoot, "rpc.jsonl"), "");
          await writeJson(path.join(scenarioRoot, "thread.json"), { schema_version: 1, thread_id: "thread", turn_ids: ["turn"], status: "completed" });
          return {
            status: "passed",
            token_usage: tokenSummary(1, 1, 2),
            final_path: path.join(scenarioRoot, "final.md"),
            evidence_path: path.join("scenarios", input.scenario.folder)
          };
        },
        close() {}
      }
    });

    assert.equal(result.ok, true);
    assert.equal(sawNoSkill, true);
    assert.equal(await exists(path.join(result.runRoot, "scenarios", "R1-basic", "stage", "skill", "SKILL.md")), false);
    const run = await readJson<{ run_source: { kind: string; attached_skill: boolean } }>(path.join(result.runRoot, "run.json"));
    assert.equal(run.run_source.kind, "no_skill");
    assert.equal(run.run_source.attached_skill, false);
  });

  it("marks runs failed when deterministic checks or judges fail", async () => {
    const project = await fixtureProject("eval-failure-status");
    await writeScenario(project);
    await writeJson(path.join(project, ".meta-skill", "tests", "manifest.json"), {
      schema_version: 1,
      tests: [{ id: "failing-eval", kind: "eval", command: "node -e \"process.exit(1)\"" }]
    });

    const result = await runEval({
      project,
      selector: {},
      withJudges: true,
      scenarioRunner: scenarioRunner("passed"),
      async judgeRunner() {
        return { annotations: 1, ok: false, failureClassifications: ["judge_failure"] };
      }
    });

    assert.equal(result.ok, false);
    const run = await readJson<{ status: string; ok: boolean; failure_classifications: string[] }>(path.join(result.runRoot, "run.json"));
    assert.equal(run.status, "failed");
    assert.equal(run.ok, false);
    assert.deepEqual(run.failure_classifications, ["judge_failure", "lint_test_failure"]);
    const tests = await readText(path.join(result.runRoot, "tests.jsonl"));
    assert.match(tests, /"status":"failed"/);
    const report = await readText(result.report);
    assert.match(report, /lint_test_failure/);
    assert.match(report, /Judge Details/);
  });

  it("enforces judge thresholds before trusting pass and refreshes normalized reports", async () => {
    const project = await fixtureProject("eval-judge-threshold");
    await writeScenario(project, {
      judges: [{ id: "artifact-quality", threshold: { overall_min: 4 } }]
    });
    await writeText(
      path.join(project, ".meta-skill", "evals", "judges", "artifact-quality.md"),
      `---\nid: artifact-quality\ntype: rubric\nscale: 1-5\n---\n\n# Artifact Quality\n\n## Output\n\nReturn JSON.\n\n## Calibration Example\n\nGood output scores 5.\n`
    );

    const result = await runEval({
      project,
      selector: {},
      noLint: true,
      scenarioRunner: scenarioRunner("passed")
    });
    await writeJson(path.join(project, ".meta-skill", "evals", "scenarios", "R1-basic", "criteria.json"), {
      schema_version: 1,
      what_it_tests: "Changed current criteria",
      expected_behavior: "Changed after the run.",
      assertions: ["Changed."],
      tests: [],
      judges: [{ id: "artifact-quality", threshold: { overall_min: 1 } }]
    });

    const judged = await judgeRun({
      project,
      runId: result.runId,
      allJudges: true,
      allScenarios: true,
      async judgeExecutor() {
        return { overall: 3, pass: true, rationale: "Looks okay.", dimensions: {} };
      }
    });

    assert.equal(judged.ok, false);
    assert.deepEqual(judged.failureClassifications, ["judge_failure"]);
    assert.equal(judgePassed({ overall: 3, pass: true }, { overall_min: 4 }), false);
    const grades = await readJsonl(path.join(result.runRoot, "grades.jsonl"));
    assert.equal(grades.at(-1)?.payload?.status, "failed");
    assert.equal((grades.at(-1)?.payload?.threshold as { overall_min?: number })?.overall_min, 4);
    assert.equal(grades.at(-1)?.payload?.evidence_basis, "run_snapshot");
    const normalized = await readJson<{ summary: { assessment_status: string; failure_classifications: string[] }; judges: JsonlRow[]; readiness: { status: string } }>(path.join(result.runRoot, "report.json"));
    assert.equal(normalized.summary.assessment_status, "failed");
    assert.deepEqual(normalized.summary.failure_classifications, ["judge_failure"]);
    assert.equal(normalized.judges.at(-1)?.payload?.status, "failed");
    assert.equal(normalized.readiness.status, "blocked");
    const html = await readText(result.report);
    assert.match(html, /Judge Details/);
    assert.match(html, /judge_failure/);
  });

  it("refreshes normalized report and run index after feedback import", async () => {
    const project = await fixtureProject("eval-feedback-refresh");
    await writeScenario(project);
    const result = await runEval({
      project,
      selector: {},
      noLint: true,
      scenarioRunner: scenarioRunner("passed")
    });
    const feedback = path.join(path.dirname(project), "feedback.jsonl");
    await writeText(feedback, JSON.stringify({ scenario_id: "R1", source: "reviewer", label: "fail", note: "Missing source grounding." }));

    const imported = await importFeedback(project, result.runId, feedback);

    assert.equal(imported.rows, 1);
    const normalized = await readJson<{ feedback: JsonlRow[] }>(path.join(result.runRoot, "report.json"));
    assert.equal(normalized.feedback.length, 1);
    assert.equal(normalized.feedback[0].payload?.label, "fail");
    const index = await readJson<{ runs: Array<{ run_id: string }> }>(path.join(path.dirname(result.runRoot), "index.json"));
    assert.equal(index.runs.some((row) => row.run_id === result.runId), true);
  });

  it("passes run-scoped environment variables to eval tests", async () => {
    const project = await fixtureProject("eval-env-vars");
    await writeScenario(project);
    await writeJson(path.join(project, ".meta-skill", "tests", "manifest.json"), {
      schema_version: 1,
      tests: [
        {
          id: "run-env",
          kind: "eval",
          command:
            "node -e \"const fs=require('fs'); const path=require('path'); if (!process.env.META_SKILL_RUN_ID || !process.env.META_SKILL_RUN_ROOT || !process.env.META_SKILL_PROJECT_ROOT) process.exit(1); fs.writeFileSync(path.join(process.env.META_SKILL_RUN_ROOT, 'env-proof.json'), JSON.stringify({runId: process.env.META_SKILL_RUN_ID, projectRoot: process.env.META_SKILL_PROJECT_ROOT}));\""
        }
      ]
    });

    const result = await runEval({
      project,
      selector: {},
      scenarioRunner: scenarioRunner("passed")
    });

    assert.equal(result.ok, true);
    const proof = await readJson<{ runId: string; projectRoot: string }>(path.join(result.runRoot, "env-proof.json"));
    assert.equal(proof.runId, result.runId);
    assert.equal(proof.projectRoot, project);
  });

  it("runs a saved snapshot payload and packages it without packaging .meta-skill", async () => {
    const project = await fixtureProject("snapshot-e2e");
    await writeScenario(project);
    const release = await releaseProject(project);
    assert.equal(await exists(path.join(release.releaseRoot, "skill", ".meta-skill")), false);

    const result = await runEval({
      project,
      selector: {},
      runSource: "snapshot_payload",
      noLint: true,
      scenarioRunner: scenarioRunner("passed")
    });

    assert.equal(result.ok, true);
    assert.equal(await exists(path.join(result.runRoot, "scenarios", "R1-basic", "final.md")), true);
    const run = await readJson<{ run_source: { kind: string; label: string } }>(path.join(result.runRoot, "run.json"));
    assert.equal(run.run_source.kind, "snapshot_payload");
    assert.equal(run.run_source.label, "Saved snapshot payload");
    const outDir = path.join(path.dirname(project), "release-pkg");
    const packaged = await packageProject({ project, source: "release", outDir });
    assert.equal(await exists(path.join(packaged.artifact, "SKILL.md")), true);
    assert.equal(await exists(path.join(packaged.artifact, ".meta-skill")), false);
  });
});

function scenarioRunner(status: ScenarioRunResult["status"], error?: string) {
  return {
    async run(input: ScenarioRunInput): Promise<ScenarioRunResult> {
      const scenarioRoot = path.join(input.runRoot, "scenarios", input.scenario.folder);
      await fs.mkdir(scenarioRoot, { recursive: true });
      if (input.attachSkill) {
        await fs.mkdir(path.join(scenarioRoot, "stage", "skill"), { recursive: true });
        await writeText(path.join(scenarioRoot, "stage", "skill", "SKILL.md"), "fixture");
      }
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
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "meta-skill-eval-"));
  const project = path.join(root, slug);
  await createSkill({
    target: project,
    slug,
    description: `Use when testing ${slug}; not for publishing.`,
    project: true
  });
  return project;
}

async function writeScenario(
  project: string,
  options: {
    judges?: Array<{
      id: string;
      threshold?: {
        overall_min?: number;
        dimensions?: Record<string, number>;
      };
    }>;
  } = {}
): Promise<void> {
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
    judges: options.judges || []
  });
}

async function readJsonl(target: string): Promise<JsonlRow[]> {
  return (await readText(target))
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}
