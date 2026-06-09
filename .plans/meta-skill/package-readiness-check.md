# Package Readiness Check (`package --check`)

## Purpose

`package` validates structure and zips, but cannot answer "is this skill ready
to share?" Add a read-only readiness mode that aggregates existing evidence
into a gated yes/no with named gaps — local readiness gates instead of a
registry. Tracker item "Publish / Package Readiness Gates". True North:
readiness decisions from evidence; mutation (actual packaging/publishing)
stays human-gated.

## Non-Goals

- No registry, version store, or publish transport.
- No new evidence production — it reads what review/eval/validate already
  wrote; missing evidence is a named gap, not a trigger to generate it.
- No blocking changes to plain `package` behavior.

## Source Files Likely Touched

- `meta-skill/src/meta_skill/readiness.py` (new)
- `meta-skill/src/meta_skill/packaging.py` / `cli.py` (`package --check`)
- `meta-skill/references/cli.md`
- `meta-skill/skills/skill-doctor/references/verify.md` (point escalation at it)
- `meta-skill/skills/skill-evaluator/SKILL.md` (gated-outcome pointer)

## Implementation Steps

1. `package <skill-dir> --check [--json]` runs checks and reports without
   writing a zip:
   - deterministic validation passes (reuse `validate_report`);
   - `review.md` exists in the project workbench and contains an Overall
     Quality Score (threshold configurable later; v1 reports presence + score);
   - latest run under `.meta-skill/runs/` has no unresolved failed trials and
     no `ungraded` rows for gate-split cases;
   - payload excludes `.meta-skill/` and other workbench material;
   - every reference/script/asset linked from `SKILL.md` resolves (reuse
     `dead_references` lint);
   - report each as pass / fail / missing-evidence with the artifact path.
2. Output: overall `ready: true|false`, per-gate rows, and "what to do next"
   strings (e.g. "run skill-doctor Judge Review — no review.md found").
3. Exit non-zero when not ready; plain `package` is unchanged and does NOT
   require readiness (packaging stays a human-approved action).

## Tests / Fixtures

- Fixture projects: fully ready; missing review; stale/failed run; unresolved
  ungraded gate case; payload leaking `.meta-skill/`; broken reference link.
- Golden JSON output per fixture.

## Validation Commands

```sh
python3 meta-skill/src/characterize_meta_skill.py
scripts/meta-skill package <fixture-ready> --check --json
scripts/meta-skill package <fixture-missing-review> --check --json   # expect exit 1
scripts/sync-plugins.sh
```

## Completion Criteria

- All fixture states produce correct gate rows and exit codes.
- `cli.md` documents the mode; doctor/evaluator payloads point at it as the
  readiness escalation.

## Stop Rule

V1 gates are presence/threshold checks over existing artifacts only. If a gate
needs new evidence formats (e.g. human-decision records), report
`missing-evidence` and file a tracker item — do not invent new artifact types
here.

## Risks

- "Latest run" semantics are ambiguous with multiple suites/run histories;
  v1: most recent run dir by id, named in the output so the human can verify.
- Score thresholds invite gaming; v1 reports the score rather than enforcing a
  cut-off, until calibration practice matures.

## Handoff Notes

`skill-autoresearch` should require `--check` pass on the winning candidate's
worktree before proposing it — note this in that lane when both exist.
