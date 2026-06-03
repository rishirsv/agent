import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import { runEval } from "./evals";
import { lintProject } from "./lint";
import type { TokenUsageSummary } from "./models";
import { CliError, exists, readJson, readText, writeJson, writeText } from "./project";
import { createSkill } from "./skills";

describe("lint, command parsing, and eval evidence", () => {
  it("validates scenario manifests, tests, and judges", async () => {
    const project = await fixtureProject("scenario-check");
    await writeScenario(project, {
      folder: "R1-basic",
      id: "R1",
      family: "regression",
      tests: ["exact-output"],
      judges: ["artifact-quality"]
    });

    let report = await lintProject(project, { executeTests: false });
    assert.equal(report.ok, false);
    assert.match(report.failures.map((item) => item.message).join("\n"), /missing test id/);
    assert.match(report.failures.map((item) => item.message).join("\n"), /missing judge id/);

    await writeJson(path.join(project, ".meta-skill", "tests", "manifest.json"), {
      schema_version: 1,
      tests: [{ id: "exact-output", kind: "eval", command: "node -e \"process.exit(0)\"" }]
    });
    await writeText(
      path.join(project, ".meta-skill", "evals", "judges", "artifact-quality.md"),
      `---\nid: artifact-quality\ntype: rubric\nscale: 1-5\ninputs: [task, final]\n---\n\n# Artifact Quality\n\n## Rubric\n\n5: Excellent.\n1: Poor.\n\n## Output\n\nReturn JSON.\n\n## Calibration Example\n\nGood output scores 5.\n`
    );
    report = await lintProject(project, { executeTests: false });
    assert.equal(report.failures.length, 0);
  });

  it("writes App Server run evidence and fails when eval tests fail", async () => {
    const project = await fixtureProject("eval-run-check");
    await writeScenario(project, {
      folder: "F1-multiturn",
      id: "F1",
      family: "failure_mode",
      turns: [{ content: "Now tighten it." }]
    });
    await writeJson(path.join(project, ".meta-skill", "tests", "manifest.json"), {
      schema_version: 1,
      tests: [{ id: "failing-eval", kind: "eval", command: "node -e \"process.exit(1)\"" }]
    });
    const result = await runEval({
      project,
      selector: {},
      scenarioRunner: {
        async run(input) {
          const scenarioRoot = path.join(input.runRoot, "scenarios", input.scenario.folder);
          await fs.mkdir(path.join(scenarioRoot, "stage", "skill"), { recursive: true });
          await writeText(path.join(scenarioRoot, "stage", "skill", "SKILL.md"), "fixture");
          await writeText(path.join(scenarioRoot, "final.md"), "Fixture final.");
          await writeText(path.join(scenarioRoot, "turns.jsonl"), "");
          await writeJson(path.join(scenarioRoot, "thread.json"), { schema_version: 1, thread_id: "fixture", turn_ids: ["turn"], status: "completed" });
          await writeText(path.join(scenarioRoot, "rpc.jsonl"), "");
          return {
            status: "needs_review",
            token_usage: tokenSummary(1, 1, 2),
            final_path: path.join(scenarioRoot, "final.md"),
            evidence_path: path.join("scenarios", input.scenario.folder)
          };
        },
        close() {}
      }
    });
    assert.equal(result.ok, false);
    assert.equal(await exists(path.join(result.runRoot, "run.json")), true);
    assert.equal(await exists(path.join(result.runRoot, "events.jsonl")), true);
    assert.equal(await exists(path.join(result.runRoot, "results.jsonl")), true);
    assert.equal(await exists(path.join(result.runRoot, "tests.jsonl")), true);
    assert.equal(await exists(path.join(result.runRoot, "grades.jsonl")), true);
    assert.equal(await exists(path.join(result.runRoot, "feedback.jsonl")), true);
    assert.equal(await exists(path.join(result.runRoot, "scenarios", "F1-multiturn", "rpc.jsonl")), true);
    assert.equal(await exists(path.join(result.runRoot, "scenarios", "F1-multiturn", "stage", "skill", "SKILL.md")), true);

    const tests = await readText(path.join(result.runRoot, "tests.jsonl"));
    assert.match(tests, /"status":"failed"/);
    const before = await readJson<{ tests: unknown[] }>(path.join(result.runRoot, "report.json"));
    const lint = await lintProject(project, { runId: result.runId });
    assert.equal(lint.annotations, 2);
    const after = await readJson<{ tests: unknown[]; summary: { failure_classifications: string[] } }>(path.join(result.runRoot, "report.json"));
    assert.equal(after.tests.length > before.tests.length, true);
    assert.deepEqual(after.summary.failure_classifications, ["lint_test_failure"]);
    const index = await readJson<{ runs: Array<{ run_id: string; readiness_status: string }> }>(path.join(path.dirname(result.runRoot), "index.json"));
    assert.equal(index.runs.some((row) => row.run_id === result.runId && row.readiness_status === "blocked"), true);
  });
});

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
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "meta-skill-test-"));
  const project = path.join(root, slug);
  await createSkill({
    target: project,
    slug,
    description: `Use when testing ${slug} behavior for reusable skill work; not for publishing.`,
    project: true
  });
  return project;
}

async function writeScenario(
  project: string,
  options: {
    folder: string;
    id: string;
    family: "regression" | "failure_mode" | "trigger" | "gate";
    tests?: string[];
    judges?: string[];
    turns?: Array<{ content: string }>;
  }
): Promise<void> {
  const scenario = path.join(project, ".meta-skill", "evals", "scenarios", options.folder);
  await fs.mkdir(scenario, { recursive: true });
  await writeText(path.join(scenario, "task.md"), "Do the eval task.");
  await writeJson(path.join(scenario, "scenario.json"), {
    schema_version: 1,
    id: options.id,
    family: options.family,
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
    tests: options.tests || [],
    judges: (options.judges || []).map((id) => ({ id }))
  });
  if (options.turns) await writeJson(path.join(scenario, "turns.json"), options.turns);
}
