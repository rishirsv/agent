---
name: skill-improve
description: Use when reviewing, patching, or recording decisions for an existing skill from lint, eval, judge, trace, saved evidence file, or human-feedback evidence; not for creating new skills, running eval cases, autonomous rewrites, packaging, installing, or publishing.
---

# Skill Improve

Improve an existing skill with evidence and restraint. This lane owns best-practice review, evidence-backed edits to the working portable payload, and accept/reject decision records.

## Reference Map

| Need | Read |
|---|---|
| Review/edit mode, prompt-doctor loop, finding shape, surgical update rules, and review output | [prompt-doctor.md](references/prompt-doctor.md) |
| Shared CLI behavior | sibling `skill-create` skill's [cli-conventions.md](../skill-create/references/cli-conventions.md) |
| Creation-time structure and payload rules | sibling `skill-create` references |

## Runtime Contract

- Use `.meta-skill/` as the workbench.
- Require evidence before patching: lint output, eval run ID, case ID, test failure, judge note, trace, saved evidence file, or human feedback. Each edit should cite at least one evidence reference.
- Do not invent proof, auto-apply edits, package, install, or publish.
- Treat completed eval execution as evidence only, not pass proof. Before editing from it, name what ran, what facts/files exist, and what the evidence shows.

## Commands

```bash
meta-skill decide <project> --run <run-id> --evidence <path[:line]> --commit <sha> --accept
meta-skill decide <project> --run <run-id> --evidence <path[:line]> --reject
```

Edit the working portable payload directly after the evidence justifies the change. Git is the application mechanism and diff review surface.

`decide` appends a `decision_recorded` fact to `.meta-skill/runs/<run-id>/facts.jsonl`. Accept records the commit the human approved; reject records intent and evidence but does not restore files.

## Edit Discipline

Read [prompt-doctor.md](references/prompt-doctor.md) before non-trivial edits.

- Pick mode first: review-only, surgical edit, or redesign.
- Read the skill before changing it.
- Keep the smallest useful change tied to evidence.
- Preserve trigger meaning, output contract, tone, and unrelated resources unless they are the problem.
- Update `SKILL.md`, relevant references, cases, deterministic tests, and `.meta-skill/spec.md` when the change affects their stated behavior or eval intent.
- Rerun `meta-skill lint` and relevant `meta-skill run` cases after edits.

## Output

For review-only mode, report findings ordered by severity, evidence, impact, precise fixes, and validation commands.

For edit mode, report files changed, behavior preserved, behavior changed, validation run and result, and residual risk.
