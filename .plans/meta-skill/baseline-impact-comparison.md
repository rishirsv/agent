# Baseline (No-Skill) Candidate And Impact Comparison

## Purpose

The strongest external eval concept (registry reference, Tessl dogfood
findings) is impact: the same case run **without** the skill vs **with** it.
Today `resolve_candidate` only supports `current_worktree` / git-ref sources,
and staging always copies a `skill/` payload, so a no-skill baseline is
impossible and score comparison is a manual JSON read. Add a `none` candidate
source and per-case impact categories in `eval report`. True North:
skill-evaluator candidate measurement and baseline comparison.

## Non-Goals

- No pooled scores across candidates; evidence stays per-candidate per-trial.
- No automatic winner promotion; the report recommends, the human decides.
- No statistical significance machinery; counts and per-case categories only.

## Source Files Likely Touched

- `meta-skill/src/meta_skill/candidates.py` (`resolve_candidate`: `kind: "none"`)
- `meta-skill/src/meta_skill/staging.py` (skip payload copy for `none`;
  `payload_digest: null`)
- `meta-skill/src/meta_skill/artifacts.py` (source fields tolerate none-kind)
- `meta-skill/src/meta_skill/report.py` (impact section)
- `meta-skill/skills/skill-evaluator/references/evaluations.md` (author a
  baseline candidate)
- `meta-skill/references/cli.md`

## Implementation Steps

1. Manifest: support `{"candidate": "baseline", "display": "No skill",
   "source": {"kind": "none"}}`. Validation rejects `none` combined with a ref.
2. `resolve_candidate`: for `none`, return cwd=project, no branch/commit
   semantics beyond recording HEAD for context, `payload_path: null`,
   `payload_digest: null`.
3. `stage_solver_workspace`: when `payload_path` is null, stage only `task.md`
   and fixtures; never create `skill/`. Record `staged_payload_digest: null`.
4. Trial prompt is unchanged — the task must read identically with and without
   the payload; any skill-pointing instruction lives in the staged workspace,
   not the prompt (per Tessl gap #4, record `skill_root` in run metadata when a
   payload IS staged).
5. `eval report`: when a run contains a `none` candidate plus ≥1 payload
   candidate, add an Impact section. Per case, classify using rubric/validator
   labels: `candidate_improves`, `candidate_regresses`, `both_fail`,
   `baseline_already_succeeds`, `needs_human_review` (missing/ungraded/invalid
   grades). Never pool token usage across sources.
6. `evaluations.md`: short "Baseline candidate" subsection — when to include
   one, and that baseline trials count toward cost/time budgets.

## Tests / Fixtures

- Fake-runner fixture run with `baseline` + `current` over 3 cases producing
  one of each impact category.
- Staging test: `none` candidate workspace contains exactly `task.md` (+ listed
  fixtures), no `skill/`.
- Report golden file including the Impact table.
- Characterization additions for the new manifest shape.

## Validation Commands

```sh
python3 meta-skill/src/characterize_meta_skill.py
scripts/meta-skill eval run --suite <fixture-suite> --candidates baseline,current --json   # fake runner fixture
scripts/meta-skill eval report --run <fixture-run> --json
scripts/sync-plugins.sh
```

## Completion Criteria

- A suite can run `baseline` vs `current` end to end on fixtures; report shows
  per-case impact categories with per-source evidence paths.
- No source pooling; baseline evidence files clearly labeled.

## Stop Rule

If chat-only cases cannot be classified because grading lacks a response-scoring
path (Tessl gap #5), mark them `needs_human_review` and file a tracker item —
do not extend the judge in this plan.

## Risks

- Trigger-style cases may behave oddly with no payload staged (nothing to
  fire); document that impact runs use quality/failure cases first.
- `run.json` consumers must tolerate null digest/payload fields.

## Handoff Notes

This is the measurement backbone `skill-autoresearch` gates on. Categories and
field names here become that lane's vocabulary — keep them stable.
