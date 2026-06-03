---
name: skill-eval
description: Use when setting up, running, auditing, or interpreting App Server-backed scenario evals for reusable skills with `meta-skill eval`; not for rewriting skills, best-practice skill review, packaging, installing, or promoting releases.
---

# Skill Eval

Measure a reusable skill with `.meta-skill/evals/` scenario runs. This lane sets up scenarios, runs Codex App Server-backed evals, inspects evidence, imports feedback, handles draft scenario-generation requests honestly, and runs optional App Server-backed judges. It does not rewrite or promote the skill.

## Reference Map

| Need | Read |
|---|---|
| Exact eval command syntax and examples | [cli.md](references/cli.md) |
| Scenario, run, feedback, and evidence file shapes | [review-files.md](references/review-files.md) |
| Designing useful scenario coverage and deterministic tests | [review-design.md](references/review-design.md) |
| Human-authored judge prompts and rubrics | [judge-prompts.md](references/judge-prompts.md) |

## Beginner Path

```bash
meta-skill project init .
meta-skill eval init .
meta-skill lint .
meta-skill eval run .
meta-skill eval open .
```

Scenario folders live at `.meta-skill/evals/scenarios/<ID-slug>/` and require `task.md`, `scenario.json`, and `criteria.json`. Use `turns.json` for real follow-up user turns.

## Operating Rules

- Scenario evals measure behavior; they do not apply source edits.
- By default, the runner force-attaches the working payload on the first turn. Treat working-payload and saved-snapshot runs as forced-skill final-answer evidence, not proof of true trigger routing or artifact-writing behavior.
- A run evaluates exactly one source: the working payload, a saved snapshot payload with `--snapshot`, or no skill with `--no-skill`.
- `--compare` was removed. Comparisons belong in separate report-level artifacts over multiple run IDs, not inside one run.
- Saved snapshot runs use `.meta-skill/versions/release/skill/`, not stale output from an old run.
- `eval generate` is scaffolded but unsupported; do not present generated scenarios as available proof.
- Multi-turn scenarios must use `task.md` for the first turn and `turns.json` for follow-up turns.
- Criteria are evaluator evidence and must not be staged into solver workspaces.
- Deterministic tests belong in `.meta-skill/tests/manifest.json` and may annotate saved run evidence with `meta-skill lint . --run <run-id>`.
- Eval tests should read `META_SKILL_RUN_ID`, `META_SKILL_RUN_ROOT`, and `META_SKILL_PROJECT_ROOT` when lint annotates a saved run. Do not guess the newest run folder.
- Judges are optional because they cost tokens; ask before running them unless the user explicitly requests judge scoring or passes `--with-judges`.
- Judges read saved run snapshots plus final output. Threshold failures override a raw judge `pass: true`.
- Standalone judges, feedback imports, and `lint --run` annotations refresh `report.json`, `report.html`, and `.meta-skill/evals/runs/index.json`.
- Token usage is measured telemetry, not a quality score. Inspect `usage.json` for canonical per-scenario usage and `report.html`/`report.json` for run summaries.
- Multi-turn scenario totals come from App Server cumulative `tokenUsage.total` on the final reporting turn; per-turn `tokenUsage.last` is retained only as turn evidence.
- If App Server does not return exact metrics, the evidence should say unavailable explicitly with a reason.
- `needs_review` is unresolved evidence, not pass proof. Report what executed, where final answers and traces live, and what still needs deterministic tests, judge approval, or human review.

## Scenario Design

Start with 3-5 scenarios:

1. `R` regression: a normal task the skill should handle.
2. `F` failure mode: a hard, ambiguous, or multi-turn behavior.
3. `T` trigger: activation or non-activation boundary.
4. `G` gate: approval, safe stop, or safe default.
5. Source-grounding or artifact scenario when the skill depends on files.

Prefer deterministic tests before judges. Use judges only for subjective qualities such as usefulness, source faithfulness, tone fit, recommendation quality, or handling ambiguity.

## Inspect Evidence

Run evidence lives under:

```text
.meta-skill/evals/runs/<run-id>/
```

Inspect `report.html` first, use `report.json` or `meta-skill eval open . --run <run-id> --json` for machine-readable summaries, then drill into `events.jsonl`, `results.jsonl`, `tests.jsonl`, `grades.jsonl`, `feedback.jsonl`, snapshots, and `scenarios/<scenario>/`.

If the user wants to turn evidence into edits, hand off to `skill-improve` with the run ID, scenario ID, first-failure note, test or judge result, and any human feedback.

## Output

For setup or run help, return the next command, what it reads or writes, and where evidence will live.

For interpretation, summarize the run source, selected scenarios, pass/fail/needs-review/error counts, measured token totals, token usage availability, skipped lint or judges, and the next useful step. Never describe `needs_review` as passing.
