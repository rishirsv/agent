# Eval CLI Reference

Read this for exact `meta-skill eval ...` command guidance.

## Commands

```bash
meta-skill eval init <project>
meta-skill eval generate <project> [--count <n>] [--family <R|F|T|G>] [--topic <topic>] [--strategy merge|replace] [--json]
meta-skill eval run <project> [--scenario <id>] [--family <R|F|T|G>] [--topic <topic>] [--label "..."] [--snapshot | --no-skill] [--with-judges] [--no-lint]
meta-skill eval judge <project> --run <run-id> (--judge <id> | --all-judges) (--scenario <id> | --all-scenarios)
meta-skill eval feedback import <project> --run <run-id> <feedback.jsonl>
meta-skill eval open <project> [--run <run-id>] [--list] [--json]
meta-skill eval list <project> [--limit <n>] [--status <status>] [--json]
meta-skill eval view <project> [--run <run-id>] [--last] [--json]
```

Use `meta-skill project init <project>` first when `.meta-skill/` does not exist.

## Scenario Selection

When no selector is provided, `eval run` selects every scenario.

```bash
meta-skill eval run . --scenario F1
meta-skill eval run . --scenario F1-multiturn
meta-skill eval run . --family G
meta-skill eval run . --topic source-faithfulness
```

Selectors narrow the run. `--family` uses the strict ID prefix: `R`, `F`, `T`, or `G`.

## Run Source

The working payload at the project root is the default.

```bash
meta-skill eval run .
meta-skill eval run . --snapshot
meta-skill eval run . --no-skill
```

`--snapshot` runs the saved snapshot payload from `.meta-skill/versions/release/skill/`. It should error with a helpful next step when no saved snapshot exists.

`--no-skill` runs the same scenario with no skill attached. Do not compare it inside the same run; create separate run IDs and compare them in a separate report-level artifact when that command exists.

`--compare` was removed. A run evaluates one source only.

## Generate Scenarios

`meta-skill eval generate` is scaffolded but not implemented. Keep scenario authoring manual for now:

```text
.meta-skill/evals/scenarios/<ID-slug>/
  task.md
  scenario.json
  criteria.json
```

Generated no-skill-aware scenarios are future work. Do not claim generated scenarios are release-facing evidence until a human has reviewed them.

## Lint And Judges

`eval run` always performs preflight structural validation before scenario execution. It also runs deterministic lint/test annotations after scenario execution by default:

```bash
meta-skill eval run .
meta-skill eval run . --no-lint
```

Eval-test commands receive run-scoped environment variables when they execute during `eval run` or `meta-skill lint . --run <run-id>`:

- `META_SKILL_RUN_ID`: the current run ID
- `META_SKILL_RUN_ROOT`: absolute path to `.meta-skill/evals/runs/<run-id>`
- `META_SKILL_PROJECT_ROOT`: absolute path to the portable skill project

Use these variables instead of guessing the newest run folder.

Judges are independent and opt-in:

```bash
meta-skill eval run . --with-judges
meta-skill eval judge . --run 004-saved-snapshot --judge artifact-quality --scenario G2
meta-skill eval judge . --run 004-saved-snapshot --all-judges --all-scenarios
```

`eval judge` works over saved run snapshots and final outputs. It does not rerun scenarios. If an older run has no snapshot, the CLI marks that legacy basis instead of silently treating current criteria as the original criteria.

## Feedback

Human feedback is append-only evidence:

```bash
meta-skill eval feedback import . --run 003-after-edit reviewer-feedback.jsonl
```

Use feedback as evidence for `meta-skill plan`, not as source changes.

After feedback import, the CLI regenerates `report.json`, `report.html`, and the runs `index.json`.

## Opening Reports

```bash
meta-skill eval open .
meta-skill eval open . --list
meta-skill eval open . --list --json
meta-skill eval open . --run 001-working-payload
meta-skill eval open . --run 001-working-payload --json
meta-skill eval list . --limit 5
meta-skill eval view . --last
```

There is no `latest` folder or symlink. The command may choose the newest run when no run is specified.
