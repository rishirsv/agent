import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import { appendFact } from "./facts.ts";
import { buildRunEvidenceReport, renderEvidenceReportJson } from "./report.ts";
import { writeText } from "./project.ts";

describe("evidence reporting", () => {
  it("renders deterministic JSON fields", async () => {
    const runRoot = await fs.mkdtemp(path.join(os.tmpdir(), "meta-skill-report-"));
    await appendFact(runRoot, { type: "run_started", run_id: "001-basic", source: "test", payload: { label: "basic" } });
    await appendFact(runRoot, {
      type: "case_defined",
      run_id: "001-basic",
      case_id: "R1",
      source: "test",
      payload: { id: "R1", folder: "R1-basic", title: "Basic", tests: ["case-check"], judges: ["quality"] }
    });
    await appendFact(runRoot, {
      type: "case_trial_finished",
      run_id: "001-basic",
      case_id: "R1",
      source: "test",
      payload: {
        final_path: "cases/R1-basic/final.md",
        rpc_path: "cases/R1-basic/rpc.jsonl",
        usage: { input_tokens: 1, output_tokens: 2, total_tokens: 3, unavailable_reason: null }
      }
    });
    await appendFact(runRoot, { type: "check_observed", run_id: "001-basic", case_id: "R1", source: "case-check", payload: { kind: "test", id: "case-check", outcome: "observed" } });
    await writeText(path.join(runRoot, "cases", "R1-basic", "final.md"), "done");

    const json = renderEvidenceReportJson(await buildRunEvidenceReport(runRoot));
    const parsed = JSON.parse(json);

    assert.equal(parsed.subject.id, "001-basic");
    assert.deepEqual(Object.keys(parsed), ["subject", "missing", "errors", "usage", "cases", "decisions"]);
    assert.deepEqual(Object.keys(parsed.cases[0]), ["id", "folder", "checks", "observations", "final", "rpc", "usage"]);
    assert.deepEqual(parsed.missing, [{ case_id: "R1", checks: [{ kind: "judge", id: "quality" }] }]);
    assert.equal(parsed.usage.total_tokens, 3);
  });
});
