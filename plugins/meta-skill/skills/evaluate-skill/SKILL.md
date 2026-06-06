---
name: evaluate-skill
description: Use when setting up, running, auditing, or interpreting App Server-backed evals for reusable skills with `meta-skill run`; not for rewriting skills, best-practice skill review, packaging, or installing.
---

# Evaluate Skill

Measure a reusable skill with `.meta-skill/evals/` and `.meta-skill/runs/`. This lane sets up manually authored evals, runs Codex App Server-backed evidence collection, and inspects saved run evidence. It does not rewrite, package, or edit the skill.

## Reference Map

| Need | Read |
|---|---|
| Eval command examples and evidence semantics | [cli.md](references/cli.md) |
| Writing strong eval tasks and criteria | [eval-authoring.md](references/eval-authoring.md) |

## Beginner Path

```bash
meta-skill project init .
meta-skill evals create .
meta-skill lint .
meta-skill run .
```

`meta-skill evals create` reads `.meta-skill/eval-scenarios.md` and creates draft `.meta-skill/evals/<slug>/task.md` and `.meta-skill/evals/<slug>/criteria.json` files. Refine the generated task text before running. Put optional solver-visible files under `fixtures/`; use `## Task` for the first turn and `## Turn 2`, `## Turn 3`, and so on for real follow-up user turns.

## Operating Rules

- Evals measure behavior; they do not apply source edits.
- By default, the runner force-attaches the current portable payload on the first turn. Treat runs as mounted-skill behavior evidence, not proof of true trigger routing or writable file behavior.
- A run evaluates exactly one source: the current payload or no skill with `--no-skill`.
- Criteria are evaluator evidence in `criteria.json` and must not be staged into solver workspaces.
- Deterministic tests are executable files directly under `.meta-skill/tests/`; do not create nested test folders.
- Token usage is measured telemetry, not a quality score. Token cost is recorded in `transcript.json`.
- Multi-turn eval totals come from App Server cumulative `tokenUsage.total` on the final turn; inspect `rpc.jsonl` for per-turn token events.
- If App Server does not return exact metrics, the evidence says unavailable explicitly with a reason.
- Managed App Server requests are not retried with backoff or jitter. A process-exit failure may get one eval-level respawn attempt before the run records the execution error.
- `rpc.jsonl` is the durable raw App Server trace for an eval. The runner keeps bounded in-memory event windows only for extraction. If those windows overflow, inspect `rpc.jsonl`; `transcript.json` records a warning item, and `response.md` says the final answer is unavailable when final assistant deltas were not retained for the current turn.
- Current eval guidance uses manually authored evals, one execution source per run, and read-only App Server evidence.
- Completed execution is not pass proof. Report what executed, execution errors, saved evidence paths, measured token totals, and token usage availability.

## Eval Design

Start from `.meta-skill/eval-scenarios.md`, which should stay high-level: evaluation purpose, source distillation, base quality/implementation/validation dimensions, additive skill-specific dimensions, and a Scenario Plan table. Then generate or author 3-5 evals.

Each eval folder contains:

1. `task.md`: solver-visible title, capability, problem description, output specification, first turn, and real follow-up turns.
2. `criteria.json`: evaluator-only JSON for fixtures, tests, metadata, and criteria objects with `criterion`, `phase`, `dimension`, `question`, and `evidence`.

Good evals cover normal workflow, hard ambiguity, source-grounding, and safe-stop behavior. Criteria should include the shared base dimensions across Quality, Implementation, and Validation, then add only skill-specific dimensions needed by the scenario. Write questions that can be answered from `response.md`, `transcript.json`, deterministic tests, or declared artifacts.

Prefer deterministic tests when code can answer the question. Use manual review of `response.md` and `transcript.json` for subjective qualities.

## Inspect Evidence

Run evidence lives under:

```text
.meta-skill/runs/<run-id>/
```

Inspect `evals/<eval>/task.md`, `evals/<eval>/criteria.json`, `evals/<eval>/rpc.jsonl`, `evals/<eval>/transcript.json`, and `evals/<eval>/response.md`.

If the user wants to turn evidence into edits, hand off to `improve-skill` with the run ID, eval ID, saved evidence file, and observed issue.

## Output

For setup or run help, return the next command, what it reads or writes, and where evidence will live.

For interpretation, summarize selected evals, executed evals, execution errors, saved evidence paths, measured token totals, token usage availability, skipped lint, and the next useful step. Do not describe execution as pass/fail unless quoting a deterministic test result.
