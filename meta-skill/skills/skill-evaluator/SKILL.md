---
name: skill-evaluator
description: "The measurement specialist within meta-skill: author and run evaluation suites for a target, using judge or human grading plus deterministic validations to compare tasks across no-skill, current-skill, and edited-skill conditions. Specializes in agent skills and generalizes through a rubric builder. Reached through meta-skill's routing; invoke directly only when named. Not for authoring new skills, reproducing one failure, or generating candidate improvements autonomously."
---

# Skill Evaluator

Author an **evaluation suite** for a target and run the parts that can be
mechanized. The evaluator runs the same tasks under different agent-harness
conditions: no skill, the current skill, and selected edited-skill attempts. It
does not fix the target and does not generate new candidate improvements.

The suite has two pillars:

- **Evaluations** — semantic, judge- or human-graded task outcomes.
- **Validations** — deterministic pass/fail checks.

Master a universal eval craft: anything can be evaluated. This skill
**specializes in agent skills** with built-in defaults and **generalizes to any
artifact** by building a rubric from the artifact's job.

**Measure, don't fix.** Report comparisons, failed tasks, and coverage limits;
hand fixes to `skill-doctor`. Future autonomous candidate generation belongs to
`skill-autoresearch`.

## Route By Target

| Target | Use |
|---|---|
| An agent skill | Built-in defaults: output-quality dimensions, triggering tasks, and shipped general checks. |
| Any other artifact | The generalist rubric builder — [references/generalist.md](references/generalist.md). |

## Workbench

Artifacts live in the gitignored workbench at the target skill's project root:
`<project>/.meta-skill/`. The project root already names the skill and contains
the portable payload at `<project>/skill/`, so do not add another skill-name
namespace.

```text
.meta-skill/
  evals.json
  cases/
    <task-id>/
      task.md
      fixtures/
      rubric.md
      expected.*
      validate.*
  runs/
    <run-id>/
      run.json
      progress.jsonl
      events/
        <trial-id>.jsonl
      results.jsonl
      grades.jsonl
      candidates/
        no-skill/
        current/
        attempt-1/
```

Authority is split cleanly:

- `evals.json` owns all metadata: suite membership, defaults, runner plan,
  condition selection, repetition counts, and materialization intent. The
  current schema stores conditions in fields named `candidates`.
- Task folders own authored content: `task.md`, fixtures, rubric content,
  expected outputs, and validator code.
- `runs/<run-id>/` owns what actually ran.

`task.md` contains only visible solver bytes. Never put front matter, hidden
rubrics, expected outputs, validator hints, grader notes, or harness metadata in
`task.md`.

## Reference Map

Read only what the task needs:

| Need | Read |
|---|---|
| Choose the smallest eval loop, compare task outcomes across conditions, or skip a suite | [references/methodology.md](references/methodology.md) |
| Choose the eval type, grader mix, and example task shape | [references/eval-types.md](references/eval-types.md) |
| Author `evals.json`, materialize `task.md` task folders, and keep hidden files out of the solver workspace | [references/evaluations.md](references/evaluations.md) |
| Calibrate the judge against human grades | [references/calibration.md](references/calibration.md) |
| Author deterministic validations and task-local `validate.*` checks | [references/validations.md](references/validations.md) |
| Evaluate a target that is not an agent skill | [references/generalist.md](references/generalist.md) |
| Use the central Meta Skill CLI for materialize, run, progress, grade, validate, and runner selection | [cli.md](../../references/cli.md) |

## Vocabulary

| Term | Meaning |
|---|---|
| **suite** | A set of related evaluation tasks, conditions, and grading rules. |
| **task** | The user work being evaluated. In today's file layout, one task folder lives under `.meta-skill/cases/<task-id>/`. |
| **condition** | The agent-harness setup for a trial: no skill, current skill, or an edited-skill attempt. The current schema stores this in the `candidate` field. |
| **trial** | One execution of one task under one condition. Repetitions create multiple trials. |
| **transcript** | The event stream and compact evidence captured while the trial ran. |
| **outcome** | The final answer, files, artifacts, or state the grader should judge. |
| **grader** | Code, model, or human judgment over a trial outcome. |
| **run** | One eval batch over selected tasks and conditions. |

Use **condition** in user-facing prose. Use `candidate` only where the current
CLI/schema requires that field name. Do not use `candidate_id` or `attempt_id`;
use `trial_id` for one execution.

## Workflow

### 1. Scope

Name the target and its job, then pick the route: skill defaults or generalist
rubric builder. For a skill, state whether triggering is in scope. Choose the
eval type and grader mix with [references/eval-types.md](references/eval-types.md).

Before authoring, check "When Not To Evaluate" in
[references/methodology.md](references/methodology.md); a one-off fix, an
unstable draft, or a purely deterministic question does not need a suite.

### 2. Author The Suite Manifest

Write or update `.meta-skill/evals.json` — see
[references/evaluations.md](references/evaluations.md). Keep metadata minimal:
target, defaults, tasks, repetition counts, runner intent, condition selection,
materialization intent, optional expectations, and optional grader declarations.

Do not put hidden metadata in `task.md`. Do not create another metadata file in
task folders.

### 3. Materialize Task Folders

Create `.meta-skill/cases/<task-id>/task.md` and optional fixtures, rubric,
expected output, and validator files. `task.md` is the prompt or task shown to
the solver. Hidden files remain outside the solver workspace. For each task,
make the success criteria clear enough that a domain reviewer could tell
whether a good agent should pass.

### 4. Author Graders

Author deterministic checks — see [references/validations.md](references/validations.md).
General checks already ship with the plugin. Add task-local `validate.*` files
only when a task needs exact, deterministic checks.

Use model rubrics for semantic quality, human grades for calibration or domain
judgment, and code validators for exact outcome, artifact, or transcript checks.
Prefer outcome graders over process graders unless the process behavior itself
is the requirement.

Use explicit `graders[]` entries when a task needs named metrics, required gates,
or stable report fields. Use `expectations[]` for hidden model-judge checks that
are visible to the grader but not to the solver. Mark must-not-break code
validators with `gate: true`; a gate failure blocks promotion even when a model
rubric score improves.

### 5. Calibrate

Before trusting a judge at scale, compare judge grades with human grades on a
small spot-check slice — see [references/calibration.md](references/calibration.md).
Refine the rubric on disagreement.

### 6. Run And Report

Run selected conditions against selected tasks. Default to:

- `codex_thread` with worktree isolation for one-off trials and doctor fixes.
  This is the Desktop child-thread route in
  [skill-trial-runs.md](../../references/skill-trial-runs.md), not an
  `eval run --runner` value.
- `codex_app_server` through the Python SDK for batch evals, A/B comparisons,
  and initial autoresearch
- `codex_exec` for simple fallback or CI-like automation

The CLI accepts only `codex_app_server` and `codex_exec` as concrete eval
runners.

For `codex_exec`, store raw transcripts as `events/<trial-id>.jsonl`, derive compact
status into `progress.jsonl`, and capture the outcome with
`--output-last-message`. Use `--output-schema` for judge or editor/control
children, not for solver trials whose natural output is being graded.

For `codex_app_server`, use the CLI reference to run through the plugin adapter.
The worker should consume run artifacts and progress files, not call raw App
Server JSON-RPC directly. App Server is the primary workbench runner, but live
control commands should not be added unless a real eval task requires them.

After grading, render the run with
`scripts/meta-skill eval report --run <run-id>` (see
[cli.md](../../references/cli.md)) instead of hand-assembling a summary from
run files. The report separates runner completion from behavioral grades and
lists failed, ungraded, and missing-evidence trials. Use `eval list` to find
earlier runs in the same workbench.

Report per-task outcomes, grades, aggregate performance, failed tasks, and the
no-skill/current-skill/edited-skill condition comparison. Hand fixes to
`skill-doctor`.

## Output

Close with:

- suite location
- what metadata and tasks were authored
- what conditions and tasks were run
- what was skipped
- headline metrics and comparison outcome
- failed tasks handed to `skill-doctor`
- coverage limits

A green suite is not proof of full coverage. Say what was measured and what
remains untested.

## Guardrails

- Author and measure; route fixes to `skill-doctor`.
- Do not generate new candidates autonomously; route that future work to
  `skill-autoresearch`.
- Keep all metadata in `evals.json`.
- Keep `task.md` visible-only.
- Keep hidden files out of the solver workspace.
- Use condition/task/trial/outcome/grader in prose; use `candidate` only for the
  current manifest and run-file field.
- Calibrate a judge before trusting its scores at scale.
- Report coverage limits, not just pass rates.
