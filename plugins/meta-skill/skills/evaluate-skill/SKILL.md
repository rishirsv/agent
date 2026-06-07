---
name: evaluate-skill
description: Use when creating a skill eval suite, running skill evals, auditing eval evidence, or interpreting .meta-skill eval runs; not for rewriting skills, best-practice skill review, packaging, or installing.
---

# Evaluate Skill

Turn realistic skill-use requests into inspectable behavior evidence. This lane helps an agent author `.meta-skill/evals/`, orchestrate Codex Desktop child-thread runs, and interpret saved `.meta-skill/runs/` evidence without rewriting, packaging, or editing the skill under test.

## Reference Map

| Need | Read |
|---|---|
| Writing strong eval tasks and criteria | [eval-authoring.md](references/eval-authoring.md) |
| Running Codex child-thread comparisons and collecting compact evidence | [codex-threads-runner.md](../../references/codex-threads-runner.md) |

For isolated subagent sampling patterns, use `../../references/subagent-patterns.md`.

## Beginner Path

1. Add or confirm `.meta-skill/` when the skill is not already in project mode and durable evidence is needed.
2. Fill `.meta-skill/eval-scenarios.md` first if using scenario-plan generation.
3. Author `.meta-skill/evals/<slug>/task.md`, `.meta-skill/evals/<slug>/criteria.json`, and optional `fixtures/` directly.
4. Review eval files for rubric leakage, realistic task pressure, and inspectable criteria.
5. Collect evidence from saved runs, Codex child threads, subagent trials, manual review, or user-provided traces.

Before running or reviewing an eval, refine `task.md` into a request an end user or maintainer would plausibly write, and refine `criteria.json` into binary questions answerable from saved evidence, human review, or explicitly captured validation output. Put optional solver-visible files under `fixtures/`; task text can refer to them as `fixtures/<file>`. Use `## Task` for the first turn and `## Turn 2`, `## Turn 3`, and later headings only for realistic follow-up turns.

## Operating Rules

- Evals measure behavior; they do not apply source edits.
- The parent Codex Desktop thread is the cockpit. Use child threads, and worktree child threads for edit candidates, as the visible execution surface.
- Compare variants explicitly: `no_skill`, `current_payload`, or candidate worktrees. Record variant identity before comparing scores so drifting prompts, payloads, models, or source states do not get mixed together.
- Criteria are evaluator-only evidence in `criteria.json`; never stage criteria, expected answers, scoring notes, or parent hypotheses into solver workspaces.
- Solver prompts should read like normal user requests. They must not tell the solver it is running a test, benchmark, grader pass, or self-eval case.
- Deterministic tests are executable files directly under `.meta-skill/tests/`; do not create nested test folders.
- Token usage is measured telemetry, not a quality score. If exact token usage is unavailable, label it unavailable instead of inventing or backfilling it.
- Child prompts should request a compact structured result block in the final answer. The parent should use that block and compact extraction rows before reading full transcripts.
- Extraction is read-only support machinery. Prefer stable Codex thread read/export APIs when available, use local control-plane read APIs only when available and gated, and fall back to local thread indexes or rollout logs only as read-only observation. Never write to Codex local storage.
- Completed execution is not a pass verdict. Report what ran, execution errors, saved evidence paths, measured or unavailable telemetry, review-required score totals, and remaining proof limits.
- When using subagents to sample tasks or review evidence, keep them isolated and read-only. The parent agent owns scoring, edits, validation, and final synthesis.

## Eval Design

Start from observed failures, user feedback, saved traces, or a focused scenario plan. Use optional `.meta-skill/eval-scenarios.md` planning when you need to distill a high-level source into candidate scenarios, then generate or author three to five concrete evals under `.meta-skill/evals/`.

Each eval folder contains:

1. `task.md`: solver-visible title, problem description, output specification, first turn, and real follow-up turns. It should not contain `Capability:` or `Topics:` metadata.
2. `criteria.json`: evaluator-only JSON for fixtures, tests, metadata, and criteria objects with `criterion`, `phase`, `dimension`, `question`, `evidence`, and optional `max_score`.

Good evals cover normal workflow, hard ambiguity, source-grounding, and safe-stop behavior. Criteria should include Quality, Implementation, and Validation dimensions, then add only scenario-specific dimensions that measure the expected skill lift. Write questions that can be answered from child result blocks, `results.jsonl`, optional compact reports, selected child-thread/worktree evidence, declared artifacts, human review, or explicitly captured validation command output. Fixtures are optional; use them only when the task depends on provided files, source packets, screenshots, or generated evidence such as a review worksheet.

Prefer deterministic tests when code can answer the question; their output is validation evidence only when you explicitly save or quote it in the handoff. Use manual review of child result blocks, compact reports, and selected child-thread/worktree evidence for subjective qualities. Scores remain review-required until a human or scorer assigns evidence-backed scores.

## Inspect Evidence

Run evidence lives under:

```text
.meta-skill/runs/<run-id>/
```

Inspect `run.json`, `results.jsonl`, optional projections such as `threads.jsonl` or `report.md`, and the referenced child threads or worktrees when the compact rows are missing, disputed, or high impact. Use `task_id`, `attempt_id`, and `variant_id` to connect the result back to source `.meta-skill/evals/<eval>/task.md` and `criteria.json`.

If the user wants to turn evidence into edits, hand off to `improve-skill` with the run ID, eval ID, saved evidence file, and observed issue.

## Output

For setup or run help, return the next action, what it reads or writes, and where evidence will live.

For interpretation, summarize selected evals, executed evals, execution errors, saved evidence paths, measured token totals, token usage availability, review-required score totals, skipped validation, and the next useful step. Do not describe execution as pass/fail unless quoting a deterministic test result or completed scorer output.
