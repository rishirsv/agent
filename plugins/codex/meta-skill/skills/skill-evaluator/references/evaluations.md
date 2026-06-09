# Evaluations

Read when authoring semantic evaluation cases for a target.

Evaluations need a judge — an LLM by default, a human when taste or domain
knowledge exceeds the model. They live in a gitignored workbench at
`<project>/.meta-skill/`.

Use the central CLI reference at `../../../references/cli.md` for materialization,
runner selection, progress, and grading commands.

## Authoring Model

Use a manifest plus materialized case folders:

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
```

`evals.json` is authoritative for metadata: target, defaults, runner plan,
splits, repetitions, candidate selection, and materialization intent.

Case folders are authoritative for authored content after materialization:
visible task bytes, fixtures, rubric content, expected outputs, and validator
code.

`task.md` contains only bytes the solver may see. Do not put YAML front matter,
split names, expected output, rubric text, validator hints, grader notes, target
metadata, or harness instructions in `task.md`.

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
      "display": "Current",
      "source": { "kind": "git_ref", "ref": "HEAD" }
    },
    {
      "candidate": "attempt-1",
      "display": "Attempt 1",
      "source": { "kind": "branch", "ref": "meta-skill/client-email/attempt-1" }
    }
  ],
  "cases": [
    {
      "id": "natural-trigger",
      "type": "trigger",
      "split": "dev",
      "repetitions": 5,
      "task": {
        "path": "task.md",
        "seed": "Ask for a skill improvement without naming the skill."
      },
      "fixtures": ["fixtures/source-skill.md"]
    }
  ]
}
```

Keep the manifest small. Use conventional files inside each case folder:

- `task.md` — visible solver task
- `fixtures/` — visible files copied into the solver workspace when listed in
  `evals.json`
- `rubric.md` — hidden judge rubric
- `expected.*` — hidden oracle or reference output
- `validate.*` — hidden deterministic validator

The `task.seed` value is used only when `task.md` does not exist. A materializer
must not overwrite existing authored content unless the caller explicitly forces
it.

## Two Prompt Styles

Match the task text to what the case measures:

| Case type | `task.md` style | Runs | Measures |
|---|---|---|---|
| **Quality** | Names the skill when invocation should be forced. | once / few | Output quality given the skill fired. |
| **Trigger** | Natural request; never names the skill. | many | Fire / no-fire rate and variance. |
| **Failure** | Reproduces a known failure or regression. | few | Whether the candidate fixed the failure. |
| **Gate** | Exercises a must-not-break requirement. | one / few | Promotion safety. |

A trigger task must read like a real user request. Naming the skill defeats the
test. Trigger cases need the target seeded into a clean environment so it can
fire; the environment-specific seeding mechanism remains behind the central CLI
runner adapter.

## Hidden Boundary

Hidden means not staged into the solver workspace and not included in the prompt.
It does not mean hidden files need a separate top-level directory.

```text
case folder
-> materializer
-> solver workspace containing task.md, listed fixtures, and candidate payload
-> solver output
-> evaluator reads rubric.md, expected.*, validate.*, output, and event logs
-> grades.jsonl
```

The solver sees `task.md`, listed fixtures, and the candidate payload. The solver
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

Have the judge write reasoning before the score and cite the solver output it
graded. For a skill, default quality dimensions cover correctness, completeness
against the request, format/structure, and adherence to the skill's stated
guarantees. Adjust per target; a non-skill target derives dimensions from
[generalist.md](generalist.md).

## Candidates And Trials

Use `candidate` for the thing under test:

```json
{ "candidate": "attempt-1", "display": "Attempt 1" }
```

Use `trial_id` for one execution of one case under one candidate:

```text
natural-trigger.attempt-1.t3
```

Do not use `attempt_id` internally. "Attempt 1" is display text for a candidate.

Candidate source lives in git branches and worktrees. Run evidence records the
branch, commit, worktree path when active, and `payload_digest`. The digest is
computed from the staged `skill/` payload tree, not from the commit.

`runs/<run-id>/candidates/<candidate>/` stores output artifacts only. Never store
source copies there.
