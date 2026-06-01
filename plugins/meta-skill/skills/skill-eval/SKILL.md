---
name: skill-eval
description: Use when setting up, running, auditing, or interpreting local Meta Skill reviews for reusable skills with `meta-skill eval`; not for rewriting skills, optimizing candidates, packaging, installing, or promoting releases.
---

# Skill Eval

Help a user measure a reusable skill with the `meta-skill eval` CLI. This skill guides review setup, prompt design, run interpretation, evidence inspection, and reviewer feedback. It does not edit, optimize, package, install, or promote the skill under review.

## Route First

- Use this skill for review scaffolds, review prompt design, running `meta-skill eval ...`, interpreting reports, baseline handling, feedback capture, and manual review workflow.
- Use `skill-create` when the user wants to create or update a skill's runtime instructions.
- Use `skill-improve` after review evidence exists and the user wants a bounded improvement plan or candidate patch.
- If the user asks to implement the underlying CLI, treat that as product engineering work against the repository specs, not as a runtime review workflow.

## Operating Rules

- Measurement comes first. Review evidence can inform later edits, but this lane does not rewrite or promote skills.
- A baseline is an immutable saved skill version, usually a Git commit. It is not cached output from an earlier run.
- Comparison runs re-execute every side fresh. Do not call a candidate better or worse by comparing against stale baseline output.
- Copy-only isolation is the safety boundary: staged role workspaces should contain only the role skill payload, prompt package, allowed fixtures, neutral harness files, and output directory.
- Command checks run evaluator-side after outputs return. Candidate runs produce artifacts; evaluator checks validate them.
- Human feedback is append-only evidence. Reruns, report regeneration, and baseline changes must preserve reviewer rows.
- Judges are advisory in v1. They can help triage, but they do not accept baselines, make release decisions, or replace human review.
- Report cost as tokens and duration, not USD estimates.

## Beginner Path

```bash
meta-skill eval init .
meta-skill eval run
meta-skill eval open
meta-skill eval run
```

Use `meta-skill eval init . --from-skill-spec docs/my-skill-spec.md` when a skill-create project spec contains a structured review seed. If the skill clearly needs multiple review tracks, initialize with `--name <review-name>`; otherwise keep the default flat `reviews/` layout.

`meta-skill eval run` on an uninitialized project auto-creates `review.yaml` and `prompts.yaml` and then proceeds, printing one stderr line so the implicit step is visible. Run `init` first when you want to pre-seed prompts from a spec.

Use `meta-skill eval run --audit` to audit the workspace and then run in the same command. The standalone `review audit` verb is gone.

The first run usually has no baseline. It runs the current skill once, opens the report in interactive use, and asks whether to save the current skill version as the baseline. The default answer is no. Accept only when the first-run evidence is good enough to compare future changes against.

Shared CLI conventions (exit codes, output channels, common flags, human gates) live in the sibling `skill-create` skill's `references/cli-conventions.md` and apply to every `meta-skill ...` command.

## Review Setup

For the review layout, config fields, result statuses, feedback rows, and evidence bundle contents, read [references/review-files.md](references/review-files.md).

Start from the target skill project, not from an installed copy:

1. Confirm the canonical skill source root, usually `skill/`.
2. Refuse `.agents/skills/` as the source by default; installed copies are runtime state, not canonical source.
3. Keep review artifacts inside the target project's `reviews/` folder.
4. Use flat `reviews/` mode for one review and `reviews/<name>/` mode only when multiple reviews are real.
5. Do not mix flat and named review layouts in the same project.

Useful defaults:

- `review.yaml` defines the review, skill root, runner, and compare default.
- `prompts.yaml` defines active prompt cases.
- `runs/` stores generated local evidence.
- `baseline.yaml` appears only after explicit baseline acceptance.
- `checks/`, `fixtures/`, and `judges/` are optional mature-review additions.

## Run And Compare

For full command syntax and compare mode details, read [references/cli.md](references/cli.md).

Use `meta-skill eval run` with `default_compare: auto` unless the user has a reason to override it:

- No baseline: run one side as `output`.
- Accepted baseline: run fresh `candidate` and `baseline` sides.
- `--compare none`: smoke test, prompt debugging, or first observation; do not use improvement or regression language.
- `--compare without_skill`: compare a skill-guided run against a neutral plain-agent run; use mainly for instruction-shaped skills.

Interactive runs may open the latest report and ask for first-run baseline acceptance. Non-interactive runs must not open reports, prompt, or save baselines; they should print the report path and exact follow-up command.

Use `--label "..."` for a human-readable run label. If omitted, the CLI should use the candidate skill's Git commit subject when available.

## Design Useful Reviews

For review lifecycle, error analysis, trigger reviews, checks, judges, and release-facing review posture, read [references/review-design.md](references/review-design.md).

Start small and realistic:

1. One normal task the skill should handle well.
2. One edge case where the skill often fails.
3. One negative or near-miss task where the skill should not overreach.
4. One source-grounding case if the skill uses source material.
5. One trigger prompt if routing or activation matters.

Build the review from observed failures. Run realistic cases, inspect the traces, write plain-language observations, then turn repeated patterns into prompts, deterministic checks, or advisory judges. Do not start with a broad judge that asks whether the answer is generally good.

Prefer checks before judges. Use a command check when a human should not inspect something obvious, such as missing files, invalid JSON, absent required sections, broken workbook outputs, or failed citation presence. Use judges only for subjective patterns checks cannot handle.

## Inspect Evidence

The report is the navigation surface, but the run bundle is the durable record. For each prompt, inspect:

- `trace.jsonl` for the first place execution went wrong.
- `final.md` for the role's text output, when present.
- `artifacts/` for generated files such as workbooks, decks, JSON, images, CSVs, or folders.
- `checks.json` for deterministic evaluator-side results.
- `grades.json` for advisory judge output.
- `feedback.jsonl` for saved reviewer feedback.

When comparing against a baseline, confirm both sides were executed in the current run. If the report mentions previous-iteration evidence, treat it as cached history, not controlled comparison evidence.

## Reviewer Feedback

Record feedback as evidence, not as source changes. The allowed human labels are `pass`, `fail`, `needs_review`, and `defer`; `defer` is a reviewer label, never a framework status.

For failed or unclear outputs, capture:

- what happened in plain language
- the first failure step, such as `prompt`, `retrieval`, `script`, `tool_call`, `artifact`, `final_response`, or `trigger`
- optional failure tags only after repeated observations show a useful pattern
- enough notes for a later maintainer to understand the issue without rerunning the whole review

If the user wants to turn feedback into changes, hand off to `skill-improve` or `skill-create` with the relevant run IDs, prompt IDs, first-failure notes, and preserved success cases.

## Output To The User

For setup or run help, return the next command, what it will create or read, and what the user should inspect after it finishes. Prefer plain paths and commands over framework terms.

For report interpretation, summarize:

- run mode and baseline identity, if any
- pass, fail, needs-review, errored, and missing-evidence counts
- improvement, regression, unchanged, or inconclusive counts only for comparison runs
- prompts that need human review and why
- token usage and duration when available
- next useful step, such as add prompts, inspect traces, import feedback, accept a baseline, add a check, or rerun with `meta-skill eval run --audit`

For audit help, report missing or weak ingredients first. Keep it read-only: do not edit prompts, checks, judges, or source skill files unless the user separately asks for those edits.

## Gotchas

- Do not treat one LLM run as proof. It is one observation; release claims need broader prompt coverage or manual review.
- Do not compare `candidate` output against old baseline output. Baseline comparison means fresh execution of both skill versions.
- Do not put evaluator-private files, answer keys, baseline config, judge prompts, old runs, or feedback inside candidate staged workspaces.
- Do not use `without_skill` as the main comparison for script-backed or template-backed skills; removing the skill also removes the machinery needed to do the job.
- Do not infer review prompts from freeform prose in a skill spec. `--from-skill-spec` requires a structured `review_seed` block.
- Do not let advisory judge scores hide failed required dimensions or deterministic check failures.
- Do not make source promotion, package creation, installation, sync, or release decisions from this lane.

## References

- [references/cli.md](references/cli.md): Read for command syntax, compare modes, baseline acceptance, and interactive versus non-interactive behavior.
- [references/review-files.md](references/review-files.md): Read for review layout, config files, run bundles, statuses, evidence, and feedback schema.
- [references/review-design.md](references/review-design.md): Read when designing or auditing prompts, checks, trigger reviews, judges, and human review loops.
