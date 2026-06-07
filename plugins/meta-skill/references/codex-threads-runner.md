# Codex Threads Runner

Use this reference when Meta Skill work needs evals, comparison, auto-research,
or iterative improvement evidence. The parent Codex Desktop thread is the
visible cockpit. It creates child threads, tracks child worktrees, compares
compact results, and decides whether to continue, reject, or ask the user to
approve a promotion.

This is not a Meta Skill command surface or hidden local runner. APIs and
scripts are support machinery only.

## Canonical Run Files

Keep the durable artifact model small:

```text
.meta-skill/runs/<run-id>/
  run.json
  results.jsonl
```

`run.json` is the control ledger: run status, parent thread id, variants, child
tasks, child thread ids, pending worktree ids, cwd, extraction source,
confidence, and missing fields.

`results.jsonl` is append-only compact evidence: one row per task attempt with
task id, attempt id, variant id, thread id, status, decision, score when
available, and a short summary.

Generated files such as `threads.jsonl`, `scores.jsonl`, `report.md`, or
`report.html` are rebuildable projections. Do not copy raw transcripts, full
diffs, or debug folders by default. The child thread and worktree remain the
heavy evidence surface.

## Parent Flow

1. Choose a `run_id` and create `run.json`.
2. Convert eval cases, feedback, or research tasks into child prompts.
3. Include a compact `codex_thread_result` JSON block contract in every child
   prompt.
4. Spawn local child threads for read-only sampling and worktree child threads
   for edit candidates.
5. Record `thread_id` immediately, or `pending_worktree_id` until a worktree
   child resolves.
6. Collect compact child results before reading full transcripts.
7. Append or refresh `results.jsonl`.
8. Compare variants only after checking source ref, payload digest, model,
   effort, and worktree state.
9. Continue the same child, spawn a sibling, accept, reject, or ask for user
   approval based on evidence.

The parent should not read every child transcript. Open full child threads only
for missing result blocks, close calls, high-impact failures, accepted
candidates, or user-requested inspection.

## Child Result Contract

Ask every child to end with a parseable JSON block shaped like:

```json
{
  "codex_thread_result": {
    "schema_version": 1,
    "run_id": "skill-eval-001",
    "task_id": "case-a",
    "attempt_id": "case-a.current.1",
    "variant_id": "current",
    "status": "completed",
    "decision": "accepted|rejected|partial|review-required|follow-up",
    "score": "3/3",
    "changed_files": [],
    "worktree": {
      "mode": "local|codex-managed|manual-git-worktree|scratch-copy",
      "cwd": "/path/to/project",
      "git_head": "abc123",
      "branch": "main",
      "dirty": false
    },
    "validation": [
      {
        "name": "manual review",
        "outcome": "passed|failed|skipped",
        "notes": "short note"
      }
    ],
    "evidence": "short evidence summary",
    "risks": [],
    "next_action": "one concrete next action"
  }
}
```

The human summary can follow the JSON block. The JSON block is the parent
contract.

## Extraction

Extraction keeps the parent from loading many child conversations into context.
Use this priority:

1. Stable Codex thread read/export APIs when available.
2. Available local control-plane read/list/turn/event APIs when stable enough.
3. Local thread indexes and rollout logs only as read-only fallback
   observation.
4. Manual parent inspection when no stable programmatic surface exists.

Never write to Codex local storage. Label fallback fields with source,
confidence, missing fields, and degraded-evidence notes. Reference raw rollout
logs by path and digest instead of copying them into the run folder.

## Improvement Loop

Use a flat comparison model:

```text
run
  variants:
    no_skill
    current_payload
    candidate_a
    candidate_b
  tasks:
    <case> x <variant> x <attempt>
```

Candidate edits belong in child worktrees. Auto-improve may create candidate
branches, compact evidence, and recommendations, but it must not merge,
package, install, publish, or promote source changes without user approval.

Before recommending promotion, inspect the candidate worktree dirty state,
branch, HEAD, changed files, diffstat, validation output, regression or holdout
results, and unresolved risks.
