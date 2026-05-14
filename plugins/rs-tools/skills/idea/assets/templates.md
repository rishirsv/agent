# Templates

Use only when no project-native artifact already exists. Keep the artifact compact and source-of-truth oriented, not transcript-like.

## Idea Note

```md
# <Idea>

## Direction

<The idea to carry forward.>

## Locked

- <Decision, term, constraint, assumption, or non-goal.>

## Open

- <Open trail, or `None`. Say whether it blocks the next move.>

## Next Move

<Decision, artifact, research handoff, plan handoff, implementation handoff, or stop.>
```

## Domain/Context Note

```md
# <Domain Or Context>

## Language

**<Canonical Term>**: <One-sentence definition.>
_Avoid_: <aliases, overloaded terms, or rejected meanings>

## Relationships

- <How terms, roles, artifacts, systems, or concepts relate.>

## Boundaries

- <Ownership, in/out boundary, lifecycle rule, or flagged ambiguity.>

## Open

- <Open trail, or `None`.>
```

## Product/Spec Brief

```md
# <Idea Or Product Area>

## Outcome

<Who this serves and what should be different when it works.>

## Shape

- <Capability, artifact, workflow, behavior, or reader-facing result.>

## Non-Goals

- <What this explicitly does not include.>

## Acceptance

- <Observable sign the idea worked.>

## Open

- <Open trail, or `None`.>
```

## Decision Record

Use only when the decision is hard to reverse, surprising without context, and trade-off driven.

```md
# <Decision>

<1-3 sentences: context, decision, why this trade-off won, and what future readers should preserve.>
```

## ExecPlan

Use when the idea is ready for implementation sequencing and a durable plan is the next artifact. Match the project's plan-location convention. In Rishi's `rs-tools` repos, active plans live at `docs/exec-plans/active/<feature-slug>-plan.md`.

```md
# <Feature Or Change Name> ExecPlan

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

If the repository has plan instructions, name the path here and maintain this plan according to those instructions.

## Purpose / Big Picture

<What someone gains after this change, why it matters, and how they should be able to see it working. Explain the user-visible outcome in plain language.>

## Phase Outcomes

- Phase 1: <Non-technical outcome this phase accomplishes.>
- Phase 2: <Non-technical outcome this phase accomplishes.>
- Phase 3: <Non-technical outcome this phase accomplishes.>

## Progress

Use this checklist shape:

- [ ] 1.0 <Parent task title>
  - [ ] 1.1 <Sub-task>
  - [ ] 1.2 <Sub-task>
  - [ ] 1.3 Validation for 1.0: <tests, manual checks, or deliverable review>

Update this section at every stopping point so it reflects the actual current state.

## Locked Inputs From Idea

- <Decision, term, constraint, non-goal, validation expectation, or artifact-routing choice the plan must preserve.>

## Context And Orientation

<Repository/project context a future planner or implementer needs. Name relevant project-relative paths, terms, modules, docs, artifacts, or systems. Define non-obvious terms in plain language.>

## Plan Must Include

- <Sequence of edits and additions, with project-relative paths and concrete ownership.>
- <Commands, checks, or artifact reviews to run, including working directory when useful.>
- <Any dependency, interface, migration, rollback, or recovery concern the implementer must handle.>

## Validation And Acceptance

- <Observable behavior, artifact review, command, test, or evidence that proves the work is done.>

## Idempotence And Recovery

- <What should be safe to repeat, and how a future agent should recover from likely failure points.>

## Surprises & Discoveries

- Observation: <Unexpected finding, or `None yet`.>
  Evidence: <Concise evidence, if applicable.>

## Decision Log

- Decision: <Decision made.>
  Rationale: <Why it was made.>
  Date/Author: <Date and author.>

## Outcomes & Retrospective

<What shipped, what remains, and lessons learned. Use `Not started yet` for a new plan.>

## Open

- <Open trail, or `None`. Say whether it blocks planning.>
```
