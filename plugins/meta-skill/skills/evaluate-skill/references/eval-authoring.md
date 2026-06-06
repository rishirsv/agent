# Eval Authoring

Read this when turning `.meta-skill/eval-scenarios.md` rows into executable evals under `.meta-skill/evals/<slug>/`.

## Strong Eval Pattern

Strong evals use a production-shaped task pattern:

- Realistic scenario title.
- Capability subtitle.
- Concrete problem description.
- Explicit deliverables, output files, or answer shape.
- Observable criteria that name exact behaviors, patterns, omissions, or artifacts.
- Baseline risk and expected skill lift, even when no-skill and skill-mounted runs are scored separately.

Do not write toy prompts. The eval should be a task where the skill guidance materially changes the answer.

## Scenario Archetypes

Use these portable archetypes when expanding a scenario plan:

| Scenario | What it teaches |
|---|---|
| Build a reusable component or output set | Multi-file or multi-artifact output, version-specific patterns, exact APIs, and anti-patterns. |
| Build a generic reusable kit | Typed abstractions, reusable patterns, and correctness details that should transfer across inputs. |
| Build a stateful workflow system | State transitions, cleanup, edge cases, and no-unsafe-shortcut validation. |
| Build a split-responsibility workflow | File boundaries, handoffs between roles or components, and architecture constraints. |
| Configure a typed navigation or routing flow | Structured configuration, validation, typed accessors, and end-to-end consistency. |

## Authoring Pipeline

1. Start from one `.meta-skill/eval-scenarios.md` Scenario Plan row.
2. Expand it into one eval folder.
3. Put solver-visible work in `task.md`.
4. Put evaluator-only judgment in `criteria.json`.
5. Add fixtures only when source material should be visible to the solver.
6. Run lint before running the eval.

## `task.md`

`task.md` is the solver-visible assignment.

```md
# <Scenario Title>

Capability: <capability>
Topics: <topic>

## Problem Description

<realistic context and constraints>

## Output Specification

<explicit deliverables, files, artifacts, or answer shape>

## Task

<actual user request>
```

Use `## Turn 2`, `## Turn 3`, and later turns only for real follow-up user behavior. Do not put criteria, scoring hints, or hidden expected answers in `task.md`.

## `criteria.json`

`criteria.json` is evaluator-only JSON.

```json
{
  "fixtures": [
    {
      "path": "fixtures/source.md",
      "description": "Solver-visible source material"
    }
  ],
  "tests": [],
  "metadata": {
    "baseline_risk": "<what a base agent may miss>",
    "expected_skill_lift": "<what the skill should improve>"
  },
  "criteria": [
    {
      "criterion": "<observable check>",
      "phase": "Quality",
      "dimension": "<dimension>",
      "question": "<answerable question>",
      "evidence": "response"
    },
    {
      "criterion": "<observable check>",
      "phase": "Implementation",
      "dimension": "<dimension>",
      "question": "<answerable question>",
      "evidence": "response, transcript"
    },
    {
      "criterion": "<observable check>",
      "phase": "Validation",
      "dimension": "<dimension>",
      "question": "<answerable question>",
      "evidence": "response, tests"
    }
  ]
}
```

Phases are fixed: `Quality`, `Implementation`, and `Validation`.

Dimensions are dynamic but additive. Start with the shared base dimensions from `.meta-skill/eval-scenarios.md`, then add skill-specific dimensions only when the scenario needs them.

## Criteria Style

Prefer criteria like:

- `No any types`
- `Specific event types`
- `No directive mixing`
- `Typed form state`
- `Source faithfulness`
- `Required content captured`

Avoid criteria like:

- `Good answer`
- `Helpful`
- `Uses the skill well`
- `High quality`

A strong criterion names the exact behavior, pattern, omission, or artifact to inspect.

## Coverage Recipe

Aim for three to five evals:

- Normal workflow.
- Hard ambiguity.
- Source-grounding.
- Safe stop or approval gate.
- Multi-turn workflow only when naturally required.

## Authoring Checklist

- `task.md` does not leak criteria or hidden expected answers.
- `task.md` names realistic constraints and deliverables.
- `criteria.json` has at least one Quality, Implementation, and Validation criterion.
- Every criterion has observable evidence.
- Fixtures are declared and solver-visible only when needed.
- Deterministic tests live directly under `.meta-skill/tests/`.
