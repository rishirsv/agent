# Eval Scenarios

## Evaluation Purpose

Measure whether Evaluate Skill helps agents create realistic skill evals, keep evaluator criteria hidden, and interpret run evidence without overstating proof.

## Source Distillation

| Source | Claim / rule / pattern | Why it matters for evals |
|---|---|---|
| `SKILL.md` | Evaluate Skill authors `.meta-skill/evals/`, runs evals, and interprets saved `.meta-skill/runs/` evidence without editing the skill under test. | Evals should check setup, run, and interpretation guidance rather than source-edit behavior. |
| `SKILL.md` | Solver prompts should read like normal user requests and must not expose test, benchmark, grader, or self-eval framing. | The task authoring workflow must protect criteria privacy and realistic solver behavior. |
| `references/eval-authoring.md` | Good evals start from observed failures, create binary criteria, and make the expected skill lift inspectable. | Evals should check that agents turn real failure pressure into useful task and criteria files. |
| `SKILL.md` | Completed execution is evidence only, not a pass verdict. | Evidence interpretation must report proof limits, score status, paths, and next steps honestly. |

## Evaluation Framework

### Quality

Base dimensions:
- Specificity
- Completeness
- Trigger Term Quality
- Distinctiveness / Conflict Risk

Additive dimensions:
- Realistic Task Framing
- Proof-Limit Honesty

### Implementation

Base dimensions:
- Conciseness
- Actionability
- Workflow Clarity
- Progressive Disclosure

Additive dimensions:
- Criteria Privacy
- Evidence Interpretation

### Validation

Base dimensions:
- Structural correctness
- Metadata correctness
- Required body/content presence
- Formatting compatibility

Additive dimensions:
- Prompt Boundary Protection
- Eval Artifact Completeness

## Scenario Plan

| Scenario | Phase focus | User task shape | Baseline risk | Expected skill lift | Dimensions exercised | Source basis |
|---|---|---|---|---|---|---|
| Author a realistic eval suite | Quality / Implementation / Validation | User has a concrete fail state from a docs skill and asks for a small eval suite plan and file drafts. | Base agent writes generic scoring prompts, leaks criteria into the solver task, or skips binary evidence criteria. | Produces realistic task and criteria drafts, keeps hidden criteria out of solver-visible text, and names validation commands and proof limits. | Quality: Realistic Task Framing; Implementation: Criteria Privacy; Validation: Eval Artifact Completeness | `SKILL.md`, `references/eval-authoring.md` |
| Interpret run evidence honestly | Quality / Implementation / Validation | User provides a run ID, selected evals, saved evidence paths, token usage status, and an execution error. | Base agent says the skill passed or failed by vibes, omits evidence paths, or treats review-required scores as automatic pass/fail. | Summarizes executed evals, errors, evidence paths, score status, token usage availability, and the next useful step without overstating proof. | Quality: Proof-Limit Honesty; Implementation: Evidence Interpretation; Validation: Prompt Boundary Protection | `SKILL.md`, shared CLI evidence semantics |
