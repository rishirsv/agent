# Eval Report Command (`eval list` / `eval report`)

## Purpose

Run evidence today is spread across `run.json`, `progress.jsonl`,
`results.jsonl`, `grades.jsonl`, `evidence/*.json`, and judge event files; the
E2E dogfood needed a hand-authored report. Add a deterministic, read-only
renderer so a human (or parent agent) can answer "what ran, what passed, what
failed, what is ungraded, what should I do next" from one command. This merges
the tracker's "Upgrade Eval Viewing" and the rendering half of "Polish The
Skill Lifecycle Report". True North: skill-evaluator lifecycle reporting and
readiness decisions.

## Non-Goals

- No mutation of any workbench file; report is read-only.
- No baseline/candidate impact categories yet (next plan layers them in).
- No HTML/UI; Markdown and JSON only.
- No re-grading or re-running.

## Source Files Likely Touched

- `meta-skill/src/meta_skill/report.py` (new)
- `meta-skill/src/meta_skill/cli.py` (two subcommands)
- `meta-skill/src/meta_skill/runner.py` (reuse `resolve_run_dir`; while here,
  dedupe the copy in `grading.py` into one shared helper, e.g. `io.py`)
- `meta-skill/references/cli.md` (document commands)
- `meta-skill/skills/skill-evaluator/SKILL.md` (point Run-and-Report at it)

## Implementation Steps

1. `eval list [--suite …] [--json]`: enumerate `.meta-skill/runs/`, one row per
   run: run_id, created_at, runner, trial counts by status, grade count,
   candidates.
2. `eval report --run <id-or-path> [--json] [--out <file>]`: render one run:
   - header: run_id, suite, runner, candidates (branch/commit/digest, dirty flag);
   - per-case × per-candidate table: trial status, rubric score/label,
     validator pass-rate, ungraded flags, token usage (or "unavailable");
   - distinct sections separating **runner completion** from **behavioral
     grades** (the dogfood found these conflate);
   - pointers: final output path, events path, judge events path;
   - a "needs attention" list: failed trials, ungraded cases, invalid judge
     JSON, missing usage.
3. Keep output deterministic: stable ordering (case id, candidate, repetition),
   no timestamps beyond those read from files, no absolute-path leakage when a
   relative path under the workbench suffices.
4. `--out` writes Markdown to a caller-named file (e.g.
   `.meta-skill/runs/<run-id>/report.md`); default prints to stdout.

## Tests / Fixtures

- Fixture run directories (checked into a test fixtures area used by
  `characterize_meta_skill.py` or a sibling test script) covering: clean pass,
  failed trial, ungraded case, invalid judge JSON, missing usage, multiple
  candidates, repetitions > 1.
- Golden-file assertions: rendered Markdown and `--json` output byte-stable.

## Validation Commands

```sh
python3 meta-skill/src/characterize_meta_skill.py
scripts/meta-skill eval list --json            # against a fixture workbench
scripts/meta-skill eval report --run <fixture-run> --json
scripts/sync-plugins.sh
```

## Completion Criteria

- Both commands documented in `cli.md` and exercised against fixtures.
- Golden outputs stable across two consecutive invocations.
- The dogfood flow can replace its hand-authored summary with `eval report`.

## Stop Rule

If rendering requires new fields the runner does not already write, record the
gap in the tracker and render "unavailable" — do not modify the runner in this
plan. If the report module exceeds ~300 lines, cut sections, not determinism.

## Risks

- Golden files are brittle to wording churn; keep table structure minimal.
- Run dirs from older runs may lack `evidence/`; the renderer must tolerate
  missing files per-section.

## Handoff Notes

`baseline-impact-comparison.md` extends this report with impact categories.
The lifecycle "winner / next action" framing lands there, not here.
