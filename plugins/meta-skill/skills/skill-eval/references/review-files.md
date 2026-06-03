# Eval Files And Evidence

Read this when inspecting or explaining `.meta-skill/evals/`, scenarios, run bundles, deterministic tests, judge results, or feedback.

## Workbench Layout

```text
.meta-skill/
  evals/
    evals.json
    scenarios/
      R1-basic-task/
        task.md
        scenario.json
        criteria.json
        turns.json        optional
        capability.txt   optional
        resources/       optional
    judges/
    runs/
  tests/
    manifest.json
    unit/
    eval/
```

## Eval Manifest

`.meta-skill/evals/evals.json` records suite metadata and defaults:

```json
{
  "schema_version": 1,
  "skill_name": "source-pack-triage",
  "suite": {
    "name": "default",
    "description": "Behavior, routing, gates, and known failure-mode coverage."
  },
  "scenarios": {
    "path": "scenarios"
  },
  "defaults": {
    "runner": "app_server",
    "run_source": "working_payload",
    "timeout_ms": 120000
  }
}
```

## Scenario Files

Folder names use strict ID plus slug:

```text
R1-stock-lookup
F1-complicated-multiturn
T1-nonactivation-boundary
G1-human-approval-stop
```

Required files:

- `task.md`: initial user turn
- `scenario.json`: metadata, family, type, topics, resources
- `criteria.json`: assertions, tests, judges, thresholds

Optional files:

- `turns.json`: follow-up user turns as an array of `{ "content": "..." }`
- `capability.txt`: human note for reports
- `resources/`: scenario-private files copied into the staged workspace

Families are strict:

- `R` -> `regression`
- `F` -> `failure_mode`
- `T` -> `trigger`
- `G` -> `gate`

Types are `behavior`, `trigger`, `artifact`, or `gate`.

## Criteria

```json
{
  "schema_version": 1,
  "what_it_tests": "Multi-turn prioritization and recommendation quality",
  "expected_behavior": "Completes the workflow efficiently and stays source-grounded.",
  "assertions": [
    "Uses source evidence for material claims.",
    "Answers the follow-up turn directly."
  ],
  "tests": ["source-citations-present"],
  "judges": [
    {
      "id": "recommendation-quality",
      "threshold": {
        "overall_min": 4
      }
    }
  ]
}
```

Scenarios may have no tests or judges, but that makes them manual-review only and should be reported as a warning.

## Test Manifest

`.meta-skill/tests/manifest.json` maps stable test IDs to commands:

```json
{
  "schema_version": 1,
  "tests": [
    {
      "id": "extract-sources-unit",
      "kind": "unit",
      "command": "uv run pytest .meta-skill/tests/unit/test_extract_sources.py",
      "description": "Unit tests for scripts/extract_sources.py."
    },
    {
      "id": "source-citations-present",
      "kind": "eval",
      "command": "node .meta-skill/tests/eval/source-citations-present.test.js"
    }
  ]
}
```

Use `unit` for runtime scripts and helpers. Use `eval` for checks against saved run evidence.

When eval tests are run as part of a saved run, the CLI sets:

- `META_SKILL_RUN_ID`
- `META_SKILL_RUN_ROOT`
- `META_SKILL_PROJECT_ROOT`

Eval tests should inspect those exact paths instead of sorting `.meta-skill/evals/runs/` or assuming the latest run.

## Run Bundle

Each run writes:

```text
.meta-skill/evals/runs/<run-id>/
  run.json
  events.jsonl
  results.jsonl
  tests.jsonl
  grades.jsonl
  feedback.jsonl
  report.json
  report.html
  snapshots/
    <scenario-folder>/
      task.md
      scenario.json
      criteria.json
      turns.json          optional
      capability.txt      optional
  scenarios/
    <scenario-folder>/
      stage/
      rpc.jsonl
      thread.json
      turns.jsonl
      usage.json
      final.md
      artifacts/
```

`run.json` is the plan. `events.jsonl` is the chronological execution ledger. `results.jsonl` is derived summary data. `tests.jsonl`, `grades.jsonl`, and `feedback.jsonl` are append-only annotation streams.

`snapshots/<scenario-folder>/` stores evaluator-side task, metadata, criteria, and turns as they existed when the run started. Judges read these snapshots with saved final outputs. If an older run has no snapshot, the CLI marks the judge evidence basis as legacy current-project criteria.

`report.json` is the normalized view consumed by `report.html`, `eval open --json`, and the runs `index.json`. It contains run summary, scenario attempts, tests, judges, feedback, artifacts, and readiness.

`runs/index.json` stores one summary row per run for `eval open --list`, `eval list`, and future local evidence browsers.

The staged solver workspace includes `task.md`, `scenario.json`, `turns.json`, `capability.txt`, and `resources/` when present. It must not include `criteria.json`; criteria are evaluator evidence, not solver context.

`usage.json` is the canonical structured token evidence for a scenario. It records `schema_version`, availability, per-turn `tokenUsage.last`, cumulative App Server `tokenUsage.total` when present, and a scenario summary. `turns.jsonl` also carries token usage on assistant rows for transcript-adjacent inspection, and `results.jsonl.payload.token_usage` carries a denormalized scenario summary.

For multi-turn scenarios, the scenario summary uses App Server cumulative `tokenUsage.total` from the final reporting turn as authoritative. Do not sum per-turn `last` values when explaining scenario totals. Compare multiple runs only in a separate report-level artifact; do not pool separate executions into one run total.

Every result should include token usage fields. If exact usage is unavailable, the fields should explicitly say unavailable and why.

`needs_review` means unresolved. It records that scenario execution produced evidence for a human, deterministic test, or judge to inspect; it is not a passing result.

## Evidence Claims

| Claim | Required support |
|---|---|
| Execution completed | `results.jsonl` scenario status plus `final.md`, `turns.jsonl`, and `thread.json` |
| Deterministic pass | `tests.jsonl` rows with passing eval tests and no lint/test failures |
| Judge pass | `grades.jsonl` rows where thresholds are satisfied; threshold failure overrides a judge's raw `pass: true` |
| Human pass | `feedback.jsonl` rows with reviewer label, notes, and scenario |
| Release-ready | Fresh `report.json` readiness, human approval, and release metadata such as `release --from-run <run-id>` |

## Feedback

Feedback rows are append-only JSONL. Use labels such as `pass`, `fail`, `needs_review`, and `defer`. `defer` is a human label, not a framework result status.

When feedback motivates an edit, cite the run ID, scenario ID, label, first failure step, and notes in the improvement plan.
