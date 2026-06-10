---
name: meta-skill
description: "Use for ANY work on an agent skill — authoring a new skill, reviewing or improving an existing one, diagnosing why a skill misbehaves, or evaluating how well a skill performs. Routes ambiguous or multi-step skill-lifecycle requests to skill-writer, skill-doctor, or skill-evaluator and orchestrates work across them. Not for non-skill tasks."
---

# Meta-Skill

Skinny, always-read front door for the agent-skill lifecycle. Understand the
whole flow here, then route to one specialist and orchestrate multi-step work.

Central CLI reference for future agents:
`../../references/cli.md` (source repo).

## The Lifecycle

| Intent | Specialist |
|---|---|
| Make a new skill | `skill-writer` |
| Improve / fix an existing skill | `skill-doctor` |
| Measure task outcomes across no-skill/current-skill/edited-skill conditions | `skill-evaluator` |
| Run a one-prompt trial of a draft or fix | The owning lane using `skill-trial-runs.md` |

## Routing

- Detect intent from the request; pick exactly one specialist.
- Create (blank page) → `skill-writer`.
- Improve / "is it good?" / "it's broken" → `skill-doctor`.
- Measure / "how well does it work?" → `skill-evaluator` for task/condition/trial evidence.
- One-prompt testing → stay with the owning lane and use
  [skill-trial-runs.md](../../references/skill-trial-runs.md).
- Validation or packaging → use the central CLI through the lane doing the work.
- "Use this skill" for a non-skill task is not Meta-Skill work; use the target
  skill directly.
- Ambiguous → clarify here, then route.

## Orchestration (multi-step)

- Sequence specialists toward a goal no single one owns.
- e.g. write → evaluate; doctor → evaluate → loop until target.
- Stop looping when the goal gate is met or the user must decide.

## Front-Door Model

- Implicit / ambiguous skill requests enter here.
- Explicit invocation of a specialist may go direct.
- Route *across* skills; never do a specialist's job inline.

## Guardrails

- Stay skinny; defer detail to the specialists and their references.
- Don't reach inside a worker's workflow.
