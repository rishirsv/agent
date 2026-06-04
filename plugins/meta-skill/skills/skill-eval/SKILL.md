---
name: skill-eval
description: Use when setting up, running, auditing, or interpreting App Server-backed eval cases for reusable skills with `meta-skill run`, `report`, `judge`, or `feedback`; not for rewriting skills, best-practice skill review, packaging, or installing.
---

# Skill Eval

Measure a reusable skill with `.meta-skill/cases/` and `.meta-skill/runs/`. This lane sets up manually authored cases, runs Codex App Server-backed evidence collection, inspects fact-backed reports, imports feedback, and runs optional App Server-backed judges. It does not generate cases, rewrite, package, or edit the skill.

## Reference Map

| Need | Read |
|---|---|
| Eval command examples and evidence semantics | [cli.md](references/cli.md) |
| Human-authored judge rubrics | [judge-prompts.md](references/judge-prompts.md) |

## Beginner Path

```bash
meta-skill project init .
meta-skill lint .
meta-skill run .
meta-skill report
```

Case folders live at `.meta-skill/cases/<ID-slug>/` and require one `case.md`. Put optional solver-visible files under `fixtures/`; use `## Task` for the first turn and `## Turn 2`, `## Turn 3`, and so on for real follow-up user turns.

## Operating Rules

- Case evals measure behavior; they do not apply source edits.
- By default, the runner force-attaches the current portable payload on the first turn. Treat runs as forced-skill final-answer evidence, not proof of true trigger routing or writable file behavior.
- A run evaluates exactly one source: the current payload or no skill with `--no-skill`.
- Criteria are evaluator evidence in `case.md` frontmatter and must not be staged into solver workspaces.
- Deterministic tests are executable files under `.meta-skill/tests/unit/` and `.meta-skill/tests/eval/`; eval tests may annotate saved run evidence with `meta-skill lint . --run <run-id>`.
- Eval tests should read `META_SKILL_RUN_ID`, `META_SKILL_RUN_ROOT`, and `META_SKILL_PROJECT_ROOT` when lint annotates a saved run. Do not guess the newest run folder.
- Judges are optional because they cost tokens; ask before running them unless the user explicitly requests judge scoring or passes `--with-judges`.
- Judges read frozen run cases plus final output. Threshold failures are recorded as check observations; the report does not compute pass/fail.
- `run`, `judge`, `feedback`, `lint --run`, and `decide` append facts to `facts.jsonl`; reports compute from facts and never persist.
- Token usage is measured telemetry, not a quality score. Token cost is recorded on fact rows and summarized by `meta-skill report`.
- Multi-turn case totals come from App Server cumulative `tokenUsage.total` on the final reporting turn; inspect `rpc.jsonl` for per-turn token events.
- If App Server does not return exact metrics, the evidence says unavailable explicitly with a reason.
- Managed App Server requests are not retried with backoff or jitter. A process-exit failure may get one case-level respawn attempt before the run records App Server unavailable evidence.
- `rpc.jsonl` is the durable raw App Server trace for a case.
- Completed execution is not pass proof. Report what executed, which declared checks have observations, which checks are missing, execution/check errors, feedback, decisions, and token cost.

## Case Design

Start with 3-5 cases:

1. `R` regression: a normal task the skill should handle.
2. `F` failure mode: a hard, ambiguous, or multi-turn behavior.
3. `G` gate: approval, safe stop, or safe default.
4. Source-grounding case when the skill depends on files.

Prefer deterministic tests before judges. Use judges only for subjective qualities such as usefulness, source faithfulness, tone fit, recommendation quality, or handling ambiguity.

## Inspect Evidence

Run evidence lives under:

```text
.meta-skill/runs/<run-id>/
```

Inspect `meta-skill report <run-id> --json` for machine-readable evidence, then drill into `facts.jsonl`, `cases/<case>/case.md`, `cases/<case>/rpc.jsonl`, and `cases/<case>/final.md`.

If the user wants to turn evidence into edits, hand off to `skill-improve` with the run ID, case ID, missing/error note, check observation, and any human feedback.

## Output

For setup or run help, return the next command, what it reads or writes, and where evidence will live.

For interpretation, summarize selected cases, executed cases, missing checks, execution/check errors, feedback, decisions, measured token totals, token usage availability, skipped lint or judges, and the next useful step. Do not describe evidence as pass/fail unless quoting a raw user/test/judge observation.
