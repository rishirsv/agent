# Brief Types

Use this reference only after Clarify has inspected relevant local context. Pick the one row that matches the request; do not load every brief type into the answer.

## Brief Matrix

| Brief type | Must know | Ask when missing | Route after clarity |
|---|---|---|---|
| Product / PRD | problem, desired outcome, primary user/job, in/out scope, acceptance signal | "What should be true for this to count as done?" | `$docs-writer` for a PRD or canonical feature/domain doc |
| Design / UI | target surface, what it should do, visual direction or source, expected interactivity | "What should it do, what should it look like, and how interactive should it be?" | design/prototype workflow or `$docs-writer` for durable design docs |
| Docs | reader, owner document, durable purpose, evidence to verify | "Who needs this doc, and what should they be able to do after reading it?" | `$docs-writer` |
| Debug | symptom, expected behavior, actual behavior, repro/failing command, affected flow | "What did you expect, what happened, and how can I reproduce it?" | `$debug` |
| Handoff | recipient, current state, completed work, next action, blockers, proof | "Who is receiving this, and what should they do next?" | `$handoff` |
| Decision / Interview | decision to make, competing options, constraints, source of truth, reversibility | "Which choice are we deciding between, and what would make one wrong?" | `$interview` or existing owner doc |
| Commit / PR | intended scope, files included, validation expectations, publish target | "Should this be a local commit only, or a PR-ready publish flow?" | `$commit` or `$yeet` |

## Common Understanding Checkpoint

When enough context exists, use this compact shape:

```md
Common Understanding
- **Goal**: ...
- **Current Understanding**: ...
- **Scope**: ...
- **Constraints And Defaults**: ...
- **Still Open**: None
- **Recommended Route**: ...
- **Recommended Next Step**: ...
```

## Question Shape

When context is missing, ask only the smallest route-changing set:

```md
Need To Know

1. <Plain question>?
a) <Recommended/default>
b) <Alternative>
c) Not sure - use default

Why this matters: <One short practical reason.>
```
