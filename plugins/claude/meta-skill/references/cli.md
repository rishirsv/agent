# Meta Skill CLI Reference

This reference is for agents using Meta Skill from this repo or from an
installed plugin package. It describes the command surface, when to use each
command, and which files are authoritative.

## Launchers

Use one of these launchers:

- Repo checkout: `scripts/meta-skill`
- Installed plugin package: `<plugin-root>/src/meta-skill`

Do not assume a global `meta-skill` binary is on `PATH`.

Both launchers are self-bootstrapping:

- They create a per-user virtual environment under
  `${XDG_CACHE_HOME:-~/.cache}/meta-skill/venv` by default.
- They install or upgrade dependencies from
  `meta-skill/src/requirements.txt` before running.
- `META_SKILL_PYTHON`, `META_SKILL_CACHE_DIR`, and `META_SKILL_VENV` override
  interpreter and cache locations.
- `META_SKILL_SKIP_DEP_UPDATE=1` skips dependency updates and uses the existing
  environment.

## Output Rules

- `--json` makes stdout machine-readable.
- Human diagnostics and dependency-install noise may still go to stderr.
- Commands that produce durable results write them to the workbench and return
  the path in stdout or JSON.

## Authority Split

The CLI is an orchestration layer. The workbench is authoritative.

- `.meta-skill/evals.json` defines the suite, defaults, candidates, and cases.
- `.meta-skill/cases/<case-id>/` owns authored case content: visible `task.md`,
  fixtures, hidden validators, hidden expected outputs, and rubrics.
- `.meta-skill/runs/<run-id>/` owns run plans, progress, events, outputs, and
  grades.

Do not treat CLI stdout as the system of record once files have been written.

## Runner Policy

Use the default runner unless you have a specific fallback reason:

- Primary: `codex_app_server`
- Fallback: `codex_exec`

`eval run --runner auto` resolves to the suite default runner and otherwise to
`codex_app_server`. App Server is the main path. Use `codex_exec` only when you
need the simpler fallback surface.

## Case Authoring Rules

- `task.md` is for the visible task only. Do not hide metadata in it.
- Put metadata in `.meta-skill/evals.json`, not in extra case-local metadata
  files.
- Do not add worker-local script surfaces under lane skills. Shared behavior
  belongs behind this CLI.

## Command Surface

Current top-level commands:

```sh
scripts/meta-skill doctor [--json]
scripts/meta-skill workbench init [--target <path>] [--dry-run] [--json]
scripts/meta-skill eval materialize [--suite .meta-skill/evals.json] [--force] [--json]
scripts/meta-skill eval run [--suite .meta-skill/evals.json] [--runner auto|codex_app_server|codex_exec] [--candidates <ids>] [--split <name>] [--repetitions <n>] [--model <id>] [--json]
scripts/meta-skill eval progress --run <run-id-or-path> [--watch] [--json]
scripts/meta-skill eval grade --run <run-id-or-path> [--json]
scripts/meta-skill validate <skill-dir> [--json]
scripts/meta-skill package <skill-dir> [--out-dir <dir>] [--json]
```

## Commands

### `doctor`

Use `doctor` before first use on a machine or when the runner environment looks
suspect.

What it checks:

- Python version
- CLI source and canonical validator presence
- Legacy worker-local scripts are absent
- `openai_codex` SDK availability
- App Server SDK symbols needed by the primary runner

Optional capabilities:

- `codex_exec` fallback availability, when an external `codex` binary exists

Output:

- Exit code `0` when primary App Server checks pass
- Exit code `1` when one or more primary checks fail
- JSON or human-readable check list

Example:

```sh
scripts/meta-skill doctor --json
```

### `workbench init`

Use this once per target skill or project to create the standard workbench
layout.

What it does:

- Creates `.meta-skill/`
- Creates `.meta-skill/cases/`, `.meta-skill/runs/`, and `.meta-skill/tests/`
- Seeds `.meta-skill/evals.json` if it does not exist

Inputs:

- `--target <path>`: target repo or skill directory; defaults to the current
  directory
- `--dry-run`: report planned changes without writing them

Output:

- Reports the target, workbench path, and created files/directories

Example:

```sh
scripts/meta-skill workbench init --target skills/my-skill --json
```

### `eval materialize`

Use this after editing `.meta-skill/evals.json` or when a case directory has
not been created yet.

What it does:

- Reads the suite manifest from `--suite`
- Creates `.meta-skill/cases/<case-id>/`
- Writes the seeded task file for each case, usually `task.md`
- Creates parent directories for declared fixtures

Inputs:

- `--suite`: suite file; defaults to `.meta-skill/evals.json`
- `--force`: overwrite existing seeded task files

Output:

- A change list showing which case files were created, overwritten, or skipped

Notes:

- If a case uses a custom task path in the manifest, that file is materialized
  instead of `task.md`.
- The seeded task text is visible prompt content. Keep it free of hidden
  control metadata.

### `eval run`

Use this to execute a suite or a selected slice of it.

What it does:

- Loads cases and candidates from `.meta-skill/evals.json`
- Verifies each selected case already has a materialized task file
- Chooses a runner: App Server first, `codex_exec` fallback
- Stages a solver workspace with only `task.md`, declared fixtures, and the
  candidate payload
- Creates a new run directory under `.meta-skill/runs/<run-id>/`
- Executes each case/candidate/trial combination
- Writes progress, events, and output artifact paths

Inputs:

- `--suite`: suite file; defaults to `.meta-skill/evals.json`
- `--runner`: `auto`, `codex_app_server`, or `codex_exec`
- `--candidates <ids>`: restrict to selected candidates
- `--split <name>`: restrict to a manifest split
- `--repetitions <n>`: override case or suite repetition count
- `--model <id>`: pass a model override to the runner

Output:

- Summary with `run_id`, `run_dir`, runner, trial count, and pass/fail counts
- Exit code `0` when all trials pass
- Exit code `1` when one or more trials fail

Authoritative run files:

```text
.meta-skill/runs/<run-id>/
  run.json
  progress.jsonl
  results.jsonl
  grades.jsonl
  events/<trial-id>.jsonl
  events/<trial-id>.judge.jsonl
  evidence/<trial-id>.json
  candidates/<candidate>/<trial-id>/final.md
```

What each file is for:

- `run.json`: run plan, selected runner, candidates, and trial list
- `progress.jsonl`: queued/running/passed/failed status changes
- `results.jsonl`: per-trial summary, timestamps, output path, event path, and
  runner detail
- `grades.jsonl`: validator grading results after `eval grade`
- `events/*.jsonl`: raw runner event stream for a trial
- `events/*.judge.jsonl`: raw judge event stream when rubric grading runs
- `evidence/*.json`: compact thread/runtime evidence for a trial
- `final.md`: captured final output for that candidate/trial

Solver workspaces are staged under
`.meta-skill/solver-workspaces/<run-id>/<trial-id>/`. They are run-scoped
working directories for visible task bytes, listed fixtures, and the candidate
payload, not authoritative result artifacts.

Hidden case files stay grader-side. `rubric.md`, `expected.*`, `validate.*`,
grader prompts, and human labels are never copied into the solver workspace.

### `eval progress`

Use this to inspect a run without reopening all result files manually.

What it does:

- Reads `run.json`, `progress.jsonl`, `results.jsonl`, and `grades.jsonl`
- Summarizes per-status counts and how many results and grades exist

Inputs:

- `--run <run-id-or-path>`: either a run id under `.meta-skill/runs/` or a full
  run directory path
- `--watch`: refresh until all trials reach a terminal state

Output:

- Current progress counts
- Result count
- Grade count
- Trial count

### `eval grade`

Use this after `eval run` when the cases include deterministic validators,
rubrics, or both.

What it does:

- Reads `results.jsonl` from the selected run
- Looks for `rubric.md` inside each case directory and, when present, records a
  model rubric grade through App Server
- Looks for `validate.*` files inside each case directory
- Runs each validator with `--output`, `--events`, and `--json`
- Optionally passes `--expected <file>` when an `expected.*` file exists
- Writes or updates `.meta-skill/runs/<run-id>/grades.jsonl`

Inputs:

- `--run <run-id-or-path>`

Output:

- Grade summary and `grades_path`

Notes:

- If a case has neither `rubric.md` nor `validate.*`, the run is marked
  ungraded for that case and the rationale points the reader to `rubric.md` for
  human or judge grading.
- Validators and case-local rubrics are the supported grading hooks. Do not add
  worker-local grading wrappers outside the case directory.
- Rubric grading writes judge events to
  `.meta-skill/runs/<run-id>/events/<trial-id>.judge.jsonl` and records model
  evidence in `grades.jsonl`.

### `validate`

Use this for deterministic validation of a skill payload before review,
packaging, or sync.

What it checks:

- `SKILL.md` exists
- Frontmatter parses
- Required fields such as `name` and `description` exist
- Unknown frontmatter keys are flagged
- File length stays within the current limit
- Body content exists
- Authoring lint checks from the canonical shared validator path

Inputs:

- `<skill-dir>`: skill directory or direct path to `SKILL.md`

Output:

- JSON or human-readable validation report with per-check results and a pass
  rate

Notes:

- `validate` combines `validate_skill` and `lint_authoring`.
- The command exits non-zero when the combined report contains failures.

### `package`

Use this when you need a packaged skill payload emitted to an output directory.
Packaging validates first and stops if validation fails.

Inputs:

- `<skill-dir>`: skill directory or direct path to `SKILL.md`
- `--out-dir <dir>`: destination directory for packaged output

Output:

- Zip artifact path and sidecar package metadata JSON path, optionally in JSON

## Common Flows

### First-time setup for a target

```sh
scripts/meta-skill doctor --json
scripts/meta-skill workbench init --target <target> --json
```

### Add or refresh cases from the suite

```sh
scripts/meta-skill eval materialize --json
```

Then edit the generated case `task.md` files and any validators or fixtures.

### Run and inspect a suite

```sh
scripts/meta-skill eval run --json
scripts/meta-skill eval progress --run <run-id> --watch --json
scripts/meta-skill eval grade --run <run-id> --json
```

### Validate a skill payload

```sh
scripts/meta-skill validate <skill-dir> --json
```

### Dogfood the skill lifecycle

Use this flow before claiming the full lifecycle works. Run it in an isolated
worktree and use the installed plugin launcher, not only source files.

```sh
PLUGIN=<plugin-cache-root>/agent/meta-skill/0.1.0
CLI="$PLUGIN/src/meta-skill"

git worktree add --detach /tmp/meta-skill-e2e HEAD
cd /tmp/meta-skill-e2e

# Create two target project folders outside source payloads:
# quick-skill/skill and hefty-skill/skill.
"$CLI" workbench init --target quick-skill --json
"$CLI" workbench init --target hefty-skill --json
"$CLI" validate quick-skill/skill --json
"$CLI" validate hefty-skill/skill --json
"$CLI" package quick-skill/skill --out-dir quick-skill/.meta-skill/dist --json
"$CLI" package hefty-skill/skill --out-dir hefty-skill/.meta-skill/dist --json

# Author .meta-skill/evals.json, task.md, rubric.md, and validate.* cases.
"$CLI" eval materialize --suite quick-skill/.meta-skill/evals.json --json
"$CLI" eval run --suite quick-skill/.meta-skill/evals.json --runner codex_app_server --json
"$CLI" eval grade --run <quick-run-dir> --json
"$CLI" eval progress --run <quick-run-dir> --json
```

The dogfood report should include two skill ideas, review evidence, eval run
directories, model and deterministic grade summaries, feedback, the revised
candidate change, and `score-comparison.json`.

## Boundaries

- Prefer the CLI over calling helper code under `meta-skill/src/` directly.
- Prefer App Server as the main runner.
- Use `codex_exec` only as the explicit fallback path.
- Keep task text visible and literal; no hidden task metadata.
- Keep shared behavior at the plugin CLI layer; do not recreate worker-local
  script surfaces.
