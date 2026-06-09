---
name: skill-evaluator
description: "The measurement specialist within meta-skill: author and run evaluation suites for a target, using judge or human grading plus deterministic validations to quantify triggering, quality, candidate performance, and variance. Specializes in agent skills and generalizes through a rubric builder. Reached through meta-skill's routing; invoke directly only when named. Not for authoring new skills, reproducing one failure, or generating candidates autonomously."
---

# Skill Evaluator

Author an **evaluation suite** for a target and run the parts that can be
mechanized. The evaluator measures selected candidates; it does not fix the
target and does not generate new candidate improvements.

The suite has two pillars:

- **Evaluations** — semantic, judge- or human-graded cases.
- **Validations** — deterministic pass/fail checks.

Master a universal eval craft: anything can be evaluated. This skill
**specializes in agent skills** with built-in defaults and **generalizes to any
artifact** by building a rubric from the artifact's job.

**Measure, don't fix.** Report metrics, failed cases, and gated outcomes; hand
fixes to `skill-doctor`. Future autonomous candidate generation belongs to
`skill-autoresearch`.

## Route By Target

| Target | Use |
|---|---|
| An agent skill | Built-in defaults: output-quality dimensions, triggering cases, and shipped general checks. |
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
    <case-id>/
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
        current/
        attempt-1/
```

Authority is split cleanly:

- `evals.json` owns all metadata: suite membership, defaults, runner plan,
  splits, candidate selection, repetition counts, and materialization intent.
- Case folders own authored content: `task.md`, fixtures, rubric content,
  expected outputs, and validator code.
- `runs/<run-id>/` owns what actually ran.

`task.md` contains only visible solver bytes. Never put front matter, hidden
rubrics, expected outputs, validator hints, split names, grader notes, or harness
metadata in `task.md`.

## Reference Map

Read only what the task needs:

| Need | Read |
|---|---|
| Author `evals.json`, materialize `task.md` cases, and keep hidden files out of the solver workspace | [references/evaluations.md](references/evaluations.md) |
| Calibrate the judge against human grades | [references/calibration.md](references/calibration.md) |
| Author deterministic validations and case-local `validate.*` checks | [references/validations.md](references/validations.md) |
| Evaluate a target that is not an agent skill | [references/generalist.md](references/generalist.md) |
| Use the central Meta Skill CLI for materialize, run, progress, grade, validate, and runner selection | [cli.md](../../references/cli.md) |

## Vocabulary

| Term | Meaning |
|---|---|
| **candidate** | The thing under test: `current`, `attempt-1`, `attempt-2`. Use the field name `candidate`, not `candidate_id`. |
| **trial** | One execution of one case under one candidate. Repetitions create multiple trials. |
| **case** | One task folder under `.meta-skill/cases/<case-id>/`. |
| **run** | One eval batch over selected candidates and cases. |
| **grade** | Code, model, or human judgment over a trial result. |

"Attempt 1" is user-facing display text for a candidate. Do not use
`attempt_id` internally; use `trial_id` for one execution.

## Workflow

### 1. Scope

Name the target and its job, then pick the route: skill defaults or generalist
rubric builder. For a skill, state whether triggering is in scope.

### 2. Author The Suite Manifest

Write or update `.meta-skill/evals.json` — see
[references/evaluations.md](references/evaluations.md). Keep metadata minimal:
target, defaults, cases, splits, repetition counts, runner intent, candidate
selection, and materialization intent.

Do not put hidden metadata in `task.md`. Do not create another metadata file in
case folders.

### 3. Materialize Case Folders

Create `.meta-skill/cases/<case-id>/task.md` and optional fixtures, rubric,
expected output, and validator files. `task.md` is the prompt or task shown to
the solver. Hidden files remain outside the solver workspace.

### 4. Author Validations

Author deterministic checks — see [references/validations.md](references/validations.md).
General checks already ship with the plugin. Add case-local `validate.*` files
only when a case needs exact, deterministic checks.

### 5. Calibrate

Before trusting a judge at scale, compare judge grades with human grades on a
small gold slice — see [references/calibration.md](references/calibration.md).
Refine the rubric on disagreement.

### 6. Run And Report

Run selected candidates against selected cases. Default to:

- `codex_thread` with worktree isolation for one-off trials and doctor fixes.
  This is the Desktop child-thread route in
  [skill-trial-runs.md](../../references/skill-trial-runs.md), not an
  `eval run --runner` value.
- `codex_app_server` through the Python SDK for batch evals, A/B comparisons,
  and initial autoresearch
- `codex_exec` for simple fallback or CI-like automation

The CLI accepts only `codex_app_server` and `codex_exec` as concrete eval
runners.

For `codex_exec`, store raw streams as `events/<trial-id>.jsonl`, derive compact
status into `progress.jsonl`, and capture solver output with
`--output-last-message`. Use `--output-schema` for judge or editor/control
children, not for solver trials whose natural output is being graded.

For `codex_app_server`, use the CLI reference to run through the plugin adapter.
The worker should consume run artifacts and progress files, not call raw App
Server JSON-RPC directly. App Server is the primary workbench runner, but live
control commands should not be added unless a real eval case requires them.

Report per-case results, grades, aggregate performance, failed cases, and gates.
Hand fixes to `skill-doctor`.

## Output

Close with:

- suite location
- what metadata and cases were authored
- what candidates and cases were run
- what was skipped
- headline metrics and gated outcome
- failed cases handed to `skill-doctor`
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
- Use `candidate` for the thing under test and `trial_id` for one execution.
- Calibrate a judge before trusting its scores at scale.
- Report coverage limits, not just pass rates.
