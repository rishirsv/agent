import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import { appendFact } from "./facts.ts";
import { lintProject } from "./lint.ts";
import { readFacts } from "./facts.ts";
import { createSkill } from "./skills.ts";
import { ensureDir, writeJson, writeText } from "./project.ts";

describe("lint", () => {
  it("annotates saved runs through facts", async () => {
    const project = await fixtureProject("lint-facts");
    const runRoot = path.join(project, ".meta-skill", "evals", "runs", "001-run");
    await ensureDir(runRoot);
    await appendFact(runRoot, { type: "run_started", run_id: "001-run", source: "test", payload: {} });
    await writeJson(path.join(project, ".meta-skill", "tests", "manifest.json"), { schema_version: 1, tests: [{ id: "unit", kind: "eval", command: "true" }] });

    const result = await lintProject(project, { runId: "001-run" });

    assert.equal(result.annotations, 2);
    const facts = await readFacts(runRoot);
    assert.equal(facts.filter((fact) => fact.type === "check_observed").length, 2);
  });
});

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
  await ensureDir(path.join(target, ".meta-skill", "evals", "runs"));
  await writeText(path.join(target, ".meta-skill", "evals", "cases", "R1-basic", "case.md"), "---\ntitle: Basic\ncriteria:\n  expected_behavior: ok\n  assertions: []\n---\n\n## Task\n\nok\n");
  return target;
}
