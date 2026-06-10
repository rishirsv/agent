# Evaluations

Read when authoring semantic evaluation tasks for a target.

Evaluations need a judge — an LLM by default, a human when taste or domain
knowledge exceeds the model. They live in a gitignored workbench at
`<project>/.meta-skill/`.

Use the central CLI reference at `../../../references/cli.md` for materialization,
runner selection, progress, and grading commands.

## Authoring Model

Use a manifest plus materialized task folders:

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
```

`evals.json` is authoritative for metadata: target, defaults, runner plan,
repetitions, condition selection, and materialization intent.

Task folders are authoritative for authored content after materialization:
visible task bytes, fixtures, rubric content, expected outputs, and validator
code. The directory is still named `cases/` in today's file layout, but the
user-facing concept is an evaluation task.

`task.md` contains only bytes the solver may see. Do not put YAML front matter,
expected output, rubric text, validator hints, grader notes, target metadata, or
harness instructions in `task.md`.

Use this vocabulary in prose:

| Term | Meaning |
|---|---|
| **suite** | A group of related evaluation tasks and grading rules. |
| **task** | The user work being evaluated; stored today as `cases/<task-id>/task.md`. |
| **condition** | The agent-harness setup: no skill, current skill, or edited-skill attempt. Stored today in manifest/run fields named `candidate`. |
| **trial** | One task executed once under one condition. |
| **transcript** | The event stream and compact evidence from the trial. |
| **outcome** | The final answer, files, artifacts, or state to grade. |
| **grader** | A human, model, or code validator judging an outcome. |

## Minimal `evals.json`

One manifest per target, in `<project>/.meta-skill/evals.json`:

```json
{
  "schema_version": 1,
  "target": {
    "type": "skill",
    "ref": "skill/SKILL.md"
  },
  "defaults": {
    "runner": "codex_app_server",
    "repetitions": 1
  },
  "candidates": [
    {
      "candidate": "current",
      "display": "Current skill",
      "source": { "kind": "git_ref", "ref": "HEAD" }
    },
    {
      "candidate": "attempt-1",
      "display": "Edited skill attempt 1",
      "source": { "kind": "branch", "ref": "meta-skill/client-email/attempt-1" }
    }
  ],
  "cases": [
    {
      "id": "natural-trigger",
      "type": "trigger",
      "repetitions": 5,
      "task": {
        "path": "task.md",
        "seed": "Ask for a skill improvement without naming the skill."
      },
      "fixtures": ["fixtures/source-skill.md"],
      "expectations": [
        "The response routes to skill-improvement behavior.",
        "The response does not expose hidden grading instructions."
      ],
      "graders": [
        {
          "id": "activation-rubric",
          "kind": "model",
          "metric": "activation",
          "path": "rubric.md"
        },
        {
          "id": "prompt-boundary",
          "kind": "code",
          "metric": "boundary",
          "path": "validate.py",
          "required": true,
          "gate": true
        }
      ]
    }
  ]
}
```

Keep the manifest small. Use conventional files inside each task folder:

- `task.md` — visible solver task
- `fixtures/` — visible files copied into the solver workspace when listed in
  `evals.json`
- `rubric.md` — hidden judge rubric
- `expected.*` — hidden oracle or reference output
- `validate.*` — hidden deterministic validator
- `expectations[]` — optional hidden expectation checklist in `evals.json`
- `graders[]` — optional hidden grader declaration in `evals.json`

The `task.seed` value is used only when `task.md` does not exist. A materializer
must not overwrite existing authored content unless the caller explicitly forces
it.

Although the schema field is currently `candidates`, explain those rows as
**conditions**. The condition changes the agent harness; the task prompt stays
the same. A no-skill condition uses `source.kind: "none"` and stages no skill
payload.

## Grader Declaration

Graders may be implicit or explicit.

Implicit discovery keeps small suites cheap: if `rubric.md` exists, the grader
runs a model rubric; if `validate.*` exists, each validator runs as a code
grader. Use explicit `graders[]` when a task needs named metrics, required
gates, or a stable report contract.

```json
{
  "expectations": [
    "The output includes validation guidance.",
    "The output avoids source-specific provenance."
  ],
  "graders": [
    {
      "id": "quality-rubric",
      "kind": "model",
      "metric": "quality",
      "path": "rubric.md"
    },
    {
      "id": "exact-structure",
      "kind": "code",
      "metric": "structure",
      "path": "validate.py",
      "required": true,
      "gate": true
    }
  ]
}
```

Supported grader kinds:

| Kind | Runtime behavior |
|---|---|
| `code` | Runs the named `validate.*` file and writes `grader.kind = "code"` to `grades.jsonl`. |
| `model` | Runs the rubric/expectation judge and writes `grader.kind = "model"` to `grades.jsonl`. |
| `human` | Declares that a human grade row is expected; the runner does not fabricate it. |

`required` or `gate` means the grader is promotion-blocking. A condition may
score well on a rubric and still be rejected if a gate fails.

`expectations[]` are hidden verifier statements. They are not copied into
`task.md`; the model judge uses them to emit named checks with evidence. Exact
expectations should still move into `validate.*` whenever code can check them
fairly.

## Task Types

Match the task text to what the task measures:

| Task type | `task.md` style | Runs | Measures |
|---|---|---|---|
| **Quality** | Names the skill when invocation should be forced. | once / few | Output quality given the skill fired. |
| **Trigger** | Natural request; never names the skill. | many | Fire / no-fire rate and variance. |
| **Failure** | Reproduces a known failure or regression. | few | Whether the edited-skill condition fixed the failure. |
| **Gate** | Exercises a must-not-break requirement. | one / few | Promotion safety. |

For a fuller set of eval types, grader choices, and task examples, read
[eval-types.md](eval-types.md).

A trigger task must read like a real user request. Naming the skill defeats the
test. Trigger tasks need the target seeded into a clean environment so it can
fire; the environment-specific seeding mechanism remains behind the central CLI
runner adapter.

For impact comparison, keep `task.md` stable across conditions. Do not write
"use the skill" into the task. The same visible task should run under no-skill,
current-skill, and edited-skill conditions.

## Hidden Boundary

Hidden means not staged into the solver workspace and not included in the prompt.
It does not mean hidden files need a separate top-level directory.

```text
task folder
-> materializer
-> solver workspace containing task.md, listed fixtures, and condition payload when present
-> transcript and outcome
-> evaluator reads rubric.md, expected.*, validate.*, outcome, and transcript
-> grades.jsonl
```

The solver sees `task.md`, listed fixtures, and the condition payload when the
condition supplies one. A no-skill condition supplies no payload. The solver
does not see `rubric.md`, `expected.*`, `validate.*`, judge prompts, or human
labels.

## Anchored Rubric

A judge is only as reliable as its rubric. Put semantic criteria in
`rubric.md`, not in `task.md`.

For each dimension give discrete level descriptions, not a bare 0-3:

| Score | Meaning |
|---|---|
| 3 | Meets the criterion fully; usable as-is. |
| 2 | Usable with a concrete, named weakness. |
| 1 | Weak or risky; a real gap an agent would hit. |
| 0 | Missing, wrong, or unsafe for the dimension. |

Have the judge write reasoning before the score and cite the outcome it graded.
For a skill, default quality dimensions cover correctness, completeness against
the request, format/structure, and adherence to the skill's stated
guarantees. Adjust per target; a non-skill target derives dimensions from
[generalist.md](generalist.md).

Prefer multiple focused grader dimensions over one vague score. A task may have
several graders or assertions: exact outcome checks, transcript metrics,
tool-call checks, and a rubric for the quality that cannot be checked by code.

## Coverage Statement

Close every suite report with a coverage statement; a green suite without one
overclaims. State:

- tasks by type — for example 3 quality / 2 trigger / 1 gate
- which behaviors of the target the tasks actually exercised
- known behaviors not yet tested, and why

Keep it to a few bullets. No-skill/current-skill/edited-skill condition
comparison guidance lives in [methodology.md](methodology.md).

## Conditions And Trials

Use **condition** in user-facing prose for the agent-harness setup:

```json
{ "candidate": "attempt-1", "display": "Edited skill attempt 1" }
```

Use `candidate` only for the current manifest and run-file field. Do not add
`candidate_id`.

Use `trial_id` for one execution of one task under one condition:

```text
natural-trigger.attempt-1.t3
```

Do not use `attempt_id` internally. "Attempt 1" is display text for a condition.

Condition source lives in git branches, worktrees, or `source.kind: "none"` for
the no-skill baseline. Run evidence records the branch, commit, worktree path
when active, and `payload_digest`. The digest is computed from the staged
`skill/` payload tree, not from the commit. For no-skill conditions, payload
path and digest are null.

A no-skill baseline uses `source.kind: "none"`:

```json
{
  "candidate": "no-skill",
  "display": "No skill",
  "source": { "kind": "none" }
}
```

Do not fake a no-skill baseline by staging a different skill payload. The
no-skill condition runs the same task with no `skill/` payload staged.

`runs/<run-id>/candidates/<condition>/` stores outcome artifacts only. Never
store source copies there.

When a run contains a no-skill condition and at least one payload condition,
`eval report` adds per-task impact categories:

- `candidate_improves`
- `candidate_regresses`
- `both_fail`
- `baseline_already_succeeds`
- `needs_human_review`

## Reference Solutions

Add a reference solution or expected output when the task is deterministic,
artifact-heavy, or intended to gate promotion. The reference proves the task is
solvable and that the graders can pass a known-good result.

Do not make the solver see the reference solution. Keep it in `expected.*` or a
hidden fixture used by validators and graders.
