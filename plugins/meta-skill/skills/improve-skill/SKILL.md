---
name: improve-skill
description: "Use when a user asks to improve a skill, prompt doctor a skill, review a skill, fix my skill, update a skill, or make evidence-backed changes to an existing reusable skill: run/read review.md, fix lint issues, patch SKILL.md, references, scripts, or assets, and incorporate eval, trace, or human-feedback findings; not for creating new skills, running evals, broad rewrites without evidence, packaging, installing, or publishing."
---

# Improve Skill

Improve an existing skill with evidence and restraint. This lane owns best-practice review and evidence-backed edits to the working portable payload.

## Reference Map

| Need | Read |
|---|---|
| Diagnose-first route, Prompt Doctor loop, candidate edits, surgical update rules, and output shapes | [prompt-doctor.md](references/prompt-doctor.md) |
| Quality page shape, review dimensions, scoring rules, and finding format | [review-criteria.md](references/review-criteria.md) |

For isolated subagent trials or adversarial reviews, use the shared Meta Skill reference at `../../references/subagent-patterns.md`.

## Runtime Contract

- Use `.meta-skill/` as the workbench.
- `meta-skill review <skill-dir>` writes deterministic validation evidence and a Quality-page worksheet at `.meta-skill/review.md`.
- In review-only mode, writing `.meta-skill/review.md` is permitted and expected. It is a review artifact, not an edit to the target portable payload, generated plugin packages, docs, or source files.
- Interpret user constraints like "do not edit files" in review-only contexts as "do not edit the target skill payload, generated plugin packages, docs, or source files" unless the user explicitly forbids review artifact writes too.
- If the user requires zero writes, say that `meta-skill review` cannot produce its full artifact under that constraint, then do a manual read-only review or ask permission to write `.meta-skill/review.md`.
- Pick one route:
  - Clarify and diagnose: default for "improve this skill," "review this skill," "diagnose this fail state," "what should change," or ambiguous improvement requests. Run the Prompt Doctor loop, produce a common understanding and two or three candidate edits, recommend one, and ask before changing the target payload.
  - Apply a surgical edit: use only when the user explicitly says to make, apply, update, patch, or fix now. Briefly name the diagnosis, then make the smallest evidence-backed payload edit.
  - Evidence loop: use when the user provides or asks for evals, traces, subagent review, or explicit autonomous/iterative improvement. Gather bounded evidence, diagnose, and either propose the next edit or apply one if the user authorized autonomous edits.
- The reviewing agent must complete Discovery, Implementation, Quality Score, and combined findings from [review-criteria.md](references/review-criteria.md) before reporting the review to the user. Use multi-sentence overall assessments and evidence-backed dimension reasoning; do not leave terse checklist judgments.
- When the target has `.meta-skill/eval-scenarios.md` or `.meta-skill/evals/*/criteria.json`, mirror those Quality, Implementation, and Validation dimensions in the review. The review should judge whether the skill guidance can actually satisfy the same dimensions its evals claim to measure.
- Require evidence before patching: lint output, eval run ID, eval ID, test failure, trace, saved evidence file, or human feedback. Each edit should cite at least one evidence reference.
- Do not invent proof, auto-apply edits, package, install, or publish. Never fabricate validation rows, lint results, deterministic test status, scores, run IDs, or evidence files; if evidence is missing, say what is missing and keep the finding evidence-scoped.
- Treat completed eval execution as evidence only, not pass proof. Before editing from it, name what ran, what files exist, and what the evidence shows.
- For non-trivial edits, use an isolated read-only subagent review when available. Follow the shared subagent patterns at `../../references/subagent-patterns.md`: the subagent receives a compact scope and realistic maintainer request, while the parent keeps hidden criteria, scoring, edits, and final validation.

When the user has authorized edits, edit the working portable payload directly after evidence justifies the change. Git is the application mechanism and diff review surface.

## Edit Discipline

Read [prompt-doctor.md](references/prompt-doctor.md) before non-trivial edits.

- Diagnosis is not permission to edit. Human feedback is evidence, but the default response is a clarified diagnosis with candidate edits unless the user explicitly authorized changes.
- Read the skill before changing it.
- For diagnosis/review requests, run `meta-skill review <skill-dir>` when a Quality-page artifact is useful, read [review-criteria.md](references/review-criteria.md), and complete `.meta-skill/review.md` before reporting. This artifact write is allowed unless the user specifically asks for zero writes. Reasoning should cite concrete phrases, sections, links, validation output, or missing artifacts. If eval scenarios or criteria exist, use their dimensions as the review lens rather than inventing a separate framework.
- When delegating read-only review to a subagent, tell it that `.meta-skill/review.md` writes are allowed only for the review artifact while target payload edits, generated package edits, sync, commit, and publishing are not.
- Keep the smallest useful change tied to evidence.
- Preserve trigger meaning, output contract, tone, and unrelated resources unless they are the problem.
- Update `SKILL.md`, relevant references, evals, deterministic tests, and `.meta-skill/spec.md` when the change affects their stated behavior or eval intent.
- Rerun `meta-skill lint` and relevant `meta-skill run` evals after edits.

## Output

For clarify-and-diagnose route, report current understanding, observed fail state or improvement target, root cause in the skill, two or three candidate edits, the recommended edit, behavior to preserve, validation to run, and the approval question.

For surgical edit route, report evidence, files changed, behavior preserved, behavior changed, validation run and result, and residual risk.

For evidence loop route, report what evidence ran, what it proves and does not prove, the recommended next edit or stop condition, and whether any edit was applied.
