---
name: skill-improve
description: Use when reviewing, auditing, patching, or surgically editing an existing skill from eval evidence with the prompt-doctor loop and bounded-edit discipline; not for creating new skills, autonomous optimization, or silent source promotion.
---

# Skill Improve

Edit an existing skill with precision. Consume `skill-eval` evidence (or a direct user complaint), translate it into the smallest useful change, test the candidate, record the human decision. This lane owns the prompt-doctor loop, surgical update rules, and the measurement-vs-edit mode split.

## Reference Map

Read only what the task needs:

| Need | Read |
|---|---|
| Run the review/edit mode decision, prompt-doctor loop, finding shape, surgical update rules, and review output contract | [prompt-doctor.md](references/prompt-doctor.md) |
| Apply the shared CLI conventions across `skill-create`, `skill-eval`, and `skill-improve` | sibling `skill-create` skill's `references/cli-conventions.md` |
| Look up creation-time best practices the edit must respect (design, structure, distillation) | sibling `skill-create` skill's references |

## Runtime Contract

- Use the project spec at the skill's project root (`plugins/meta-skill/docs/meta-skill-spec.md`) as the source of truth.
- Use the shared `meta-skill` CLI for commands, with improvement commands under `meta-skill improve ...`.
- Require eval evidence — a `skill-eval` run, traces, or a concrete observed failure — before proposing a patch.
- Keep generated experiment state in `.skill-improve/`.
- Require a human decision before applying, promoting, packaging, installing, or syncing any candidate change.
- The v1 CLI is a three-verb skeleton (`plan`, `run`, `decide`). Real candidate orchestration and patch application are future work; in v1 the skeleton records intent and decisions while a human carries out the edit.

## Edit Discipline

The substantive doctrine lives in [prompt-doctor.md](references/prompt-doctor.md). The headlines:

- **First, pick mode.** Review-only findings versus surgical edit versus redesign. Default to review-only unless the user explicitly authorized edits. Do not silently rewrite files.
- **First read before any change.** Identify the skill's name, trigger contract, job, runtime surface, and the user's requested scope. A broad review request must not become an unbounded rewrite.
- **Smallest useful change.** When a real failure mode is found, locate the smallest surface that caused it (a phrase, an example, a workflow branch, a missing boundary) and patch only that. Prefer removing encouragement or ambiguity over adding broad rules.
- **Preserve what works.** Operating Rules block is protected. Trigger meaning, output contract, tone, and unrelated resources stay unchanged unless they are the problem.
- **An edit that only restates existing guidance or trades one ambiguity for another is not an improvement.** Reject it. Runtime drift without measurable benefit is a regression.
- **Record decisions in the project spec.** Changed behavior, residual risk, and rejected edits worth remembering.
- **Forward-test with evidence integrity.** Pass the skill, user-style task, and raw artifacts; do not pass the suspected bug, intended fix, or prior conclusions unless that is the thing being tested.

Read [prompt-doctor.md](references/prompt-doctor.md) before running the loop. It covers the review lanes (activation, runtime clarity, resources, controls, project wrapper), the prompt-doctor seven-step loop, finding shape, the full surgical update rules, redesign rules, common high-value fixes, and the review-output contract.

## Starter Commands

```bash
meta-skill improve plan <project> [--from-run <review-run-id>]
meta-skill improve run <project> --session <session-id>
meta-skill improve decide <session-id> --accept   # or --reject
```

- `plan` writes `.skill-improve/sessions/<id>/candidate.md` — the human-editable bounded-edit plan. Fill it in using the prompt-doctor loop.
- `run` records the candidate intent. In v1, real candidate orchestration is not built; rerun `meta-skill eval run` by hand against the candidate working tree.
- `decide` records the human accept/reject. After `--accept`, apply the edit by hand, rerun review, and commit.

Shared CLI conventions (exit codes, output channels, common flags, human gates) live in the sibling `skill-create` skill's `references/cli-conventions.md` and apply to every `meta-skill ...` command.

## Boundaries

- Do not replace `skill-eval`; rerun review gates to test candidate changes.
- Do not rewrite whole skills by default. Bounded edits only.
- Do not auto-promote candidate output into canonical source. A human applies the patch.
- Do not invent new measurement. This lane consumes review evidence; it does not write new prompts.
- Do not edit without first reading [prompt-doctor.md](references/prompt-doctor.md) when the failure mode is non-trivial.

## Output

For review-only mode, report verdict, findings ordered by severity, exact suggested replacements for language issues, validation commands to run, and risks intentionally left unresolved.

For edit mode, report files changed, behavior preserved, behavior changed, validation run and result, and residual risk left for user review.
