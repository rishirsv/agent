# CLI Reference

Read this when the user needs exact `skillfactory review ...` command guidance, compare mode selection, or baseline handling.

Shared rules that apply to every `skillfactory` command (command shape, exit codes, output channels, common flags, interactive vs. non-interactive, human gates) live in the sibling `skill-create` skill's `references/cli-conventions.md`. This reference only documents review-specific behavior.

## Scope Map

- Beginner Commands: first 30 minutes and spec-seeded setup.
- Command Surface: supported v1 command syntax.
- Compare Modes: `auto`, `none`, `baseline`, and `without_skill`.
- Baseline Acceptance: what gets saved and what never auto-saves.
- Opening Reports: static report, served review, and feedback import.
- Non-Interactive Runs: CI and script-safe behavior.
- Out Of V1: commands and concepts not to suggest as current features.

## Beginner Commands

```bash
skillfactory review init .
skillfactory review run
skillfactory review open
skillfactory review run
```

Seed from a skill-create spec only when it contains a structured `review_seed` block:

```bash
skillfactory review init . --from-skill-spec docs/my-skill-spec.md
```

Use `--name <review-name>` only when multiple reviews are already needed, such as `quality`, `trigger`, `workbook`, or `release`.

## Command Surface

```bash
skillfactory review init [<project-dir>] [--name <review-name>] [--skill-root <path>] [--runner codex] [--from-skill-spec <path>]
skillfactory review run [<review-name-or-root>] [--compare <auto|none>] [--prompt <id>] [--prompt-range <start-end>] [--topic <topic>] [--label <label>] [--audit] [--no-open]
skillfactory review open [<review-name-or-root>] [--run <run-id>] [--list] [--history] [--serve]
```

Plan-of-record commands (not built yet; do not suggest as current):

```bash
skillfactory review report regenerate <run-root>
skillfactory review baseline accept [<review-name-or-root>] --from-run <run-id> [--id <baseline-id>]
skillfactory review baseline reject [<review-name-or-root>] [--id <baseline-id>]
skillfactory review baseline show [<review-name-or-root>]
skillfactory review feedback import <run-root> <feedback-jsonl>
```

When no review is specified, use the only known review. In flat mode this is `reviews/`. In named mode with exactly one review, use that review. In named mode with multiple reviews, ask the user to pick a review or pass the name.

## Compare Modes

`auto` is the default.

- No baseline: one-side run with role `output`.
- Baseline exists: two-side run with roles `candidate` and `baseline` (plan-of-record; not built yet).
- TTY first run: may ask whether to save the baseline, defaulting to no.
- Non-TTY first run: never auto-save the baseline.

`none` is a single-side run with role `output`. Use it for smoke tests, prompt debugging, or early observations. Do not report improvements, regressions, or unchanged counts.

`baseline` is a controlled two-side comparison and `without_skill` compares a skill-guided run to a neutral plain-agent run. Both are plan-of-record; current builds support only `auto` (which collapses to `none` when no baseline exists) and `none`.

## Baseline Acceptance

Baseline acceptance records a skill identity, not generated output.

Rules:

- First-run prompts default to no: `[y/N]`.
- Non-interactive runs never prompt or auto-accept.
- Branches and tags must resolve to immutable commits before storage.
- Dirty working trees are refused unless the user explicitly snapshots the files.
- Replacing a baseline requires an explicit `baseline accept`.
- Every baseline comparison re-executes the baseline and candidate.

After a good first run, accept with:

```bash
skillfactory review baseline accept --from-run <run-id>
```

## Opening Reports

Interactive `skillfactory review run` may open the report automatically. Use `--no-open` to suppress that.

```bash
skillfactory review open
skillfactory review open --list
skillfactory review open --run <run-id>
skillfactory review open --history
skillfactory review open --serve
```

Static `report.html` is read-only. Write-capable review needs `open --serve` or a static export/import flow followed by:

```bash
skillfactory review feedback import <run-root> <feedback-jsonl>
```

## Non-Interactive Runs

In non-interactive or CI use:

- do not open reports
- do not prompt for baseline acceptance
- do not save baselines automatically
- print the report path and exact next command
- show token usage and duration when available

## Audit Within Run

The standalone `skillfactory review audit` verb is gone. Audit is now a flag on `run`:

```bash
skillfactory review run --audit
```

It prints the audit output, a blank line, and then proceeds with the normal run.

## Implicit Init

`skillfactory review run` on a project with no `review.yaml` will create defaults and continue. The CLI prints `No review found. Creating default review and proceeding.` to stderr. Run `skillfactory review init` first when you want to pre-seed prompts from a spec.

## Out Of V1

Do not suggest these as current commands:

- `skillfactory review audit` (use `skillfactory review run --audit` instead)
- `skillfactory review run --compare run`
- `skillfactory review init --seed`
- `skillfactory review run --reruns`
- `skillfactory review prune`
- `skillfactory review baseline ...` and `skillfactory review feedback import` (plan-of-record)
- `skillfactory review report regenerate` (plan-of-record)
- sealed gate commands
- gate-authoritative judges
- USD cost budgets
