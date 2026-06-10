# Validations

Read when authoring deterministic validations: pass/fail checks with no
judgment.

Validations are code graders over trial outcomes and artifacts. They may read
transcripts when the check is about process or tool use, but outcome checks
should judge the produced answer, files, or state first.

Validations come in two tiers. Keep the terminology straight:

- **scripts** are a skill's runtime deterministic code, or shipped plugin checks.
- **validators** are evaluator-owned checks for one task.
- **tests** are shared deterministic checks in the hidden workbench.

## Two Tiers

| Tier | Scope | Form | Home | Durability |
|---|---|---|---|---|
| **General checks** | Every skill | Canonical CLI validators run by `scripts/meta-skill validate` | Plugin tree | Durable, shipped |
| **Task-local validators** | One task | `validate.*` beside `task.md` | Hidden task folder | Local eval content |
| **Shared workbench tests** | One target suite | Authored tests reused across cases | `.meta-skill/tests/` | Local eval content |

General checks already exist and apply to any skill: skill body present, valid
front matter, length bounds, and deprecated-surface avoidance. Do not re-author
them per target.

## Deterministic First

Prefer a deterministic validator over a judge dimension wherever the check can
be made exact: required strings, file presence, schema shape, exit codes,
state checks, exact outcome checks, and transcript metrics such as turns, tool
calls, or token use. Judges are for semantic quality a script cannot decide.

When authoring a rubric, each judged criterion should state why it cannot be
deterministic. If no reason survives writing it down, move the check into
`validate.*`.

Task-local validators check behavior unique to one task. They live beside the
task as `validate.*`, but they are hidden from the solver. They run after the
trial outcome exists.

When a validator protects a must-not-break condition, declare it as a gate in
`evals.json`:

```json
{
  "id": "prompt-boundary",
  "kind": "code",
  "metric": "boundary",
  "path": "validate.py",
  "required": true,
  "gate": true
}
```

A gate failure blocks promotion even if model-rubric quality improves.

## Solver Boundary

The solver workspace receives:

- `task.md`
- fixtures listed in `evals.json`
- the condition payload, when present

The solver workspace does not receive:

- `rubric.md`
- `expected.*`
- `validate.*`
- grader prompts
- human labels

Validators run outside the solver workspace and may read hidden expected output,
the outcome file, selected artifacts, transcripts, and task metadata from
`evals.json`.

## Validator Contract

A task-local validator should accept explicit paths rather than discovering
global state:

```text
validate.ts \
  --output runs/<run-id>/candidates/<condition>/<trial-id>/final.md \
  --expected cases/<task-id>/expected.json \
  --events runs/<run-id>/events/<trial-id>.jsonl \
  --json
```

It should print a compact JSON object:

```json
{
  "passed": 3,
  "total": 4,
  "checks": [
    {
      "name": "mentions approval gate",
      "passed": true,
      "evidence": "final.md includes the approval step"
    }
  ]
}
```

The runner converts validator output into `grades.jsonl` rows with
`grader.kind = "code"`. Explicit `graders[]` entries preserve their `id`,
`metric`, and `gate` fields in the grade row.

Code graders should return named checks rather than one opaque pass/fail. Named
checks make partial credit and failure diagnosis possible.

## Boundary With skill-doctor

A failure pattern general to *all* skills graduates to a shipped script in the
`skill-doctor` Verify path. A failure specific to one target stays local to the
eval suite.

If a validation failure identifies a fix, report the failure and hand it to
`skill-doctor`. The evaluator does not edit the target.
