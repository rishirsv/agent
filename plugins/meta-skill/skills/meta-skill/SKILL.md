---
name: meta-skill
description: "Primary router for the Meta Skill plugin. Use when Meta Skill is at-mentioned, when the user asks what Meta Skill can do or how to use the CLI, or when a request may involve creating, evaluating, reviewing, improving, packaging, or releasing reusable skills; not for performing a focused lane without loading the selected lane skill."
---

# Meta Skill

Route broad Meta Skill requests to the right focused lane. Treat a Meta Skill mention as strong intent to use this plugin for reusable skill work. Keep this skill as the router and top-level CLI guide; do not perform focused skill creation, eval design, or evidence-backed improvement logic here.

Meta Skill helps authors create portable skill payloads, add maintained `.meta-skill/` workbenches when needed, run scenario evidence through the shared CLI, inspect results honestly, and make bounded evidence-backed improvements.

## Router Only

When a request matches `skill-create`, `skill-eval`, or `skill-improve`, load the focused skill before drafting, running commands, editing payload files, or interpreting evidence. If a request spans lanes, name the sequence once, then follow each selected lane in order.

Use the smallest useful lane set:

- Start with `skill-create` for new reusable skills, existing draft redesigns, source-pack distillation, workflow capture, trigger-contract decisions, runtime payload structure, and portable-vs-project-mode choices.
- Use `skill-eval` for `.meta-skill/cases/` setup, manual case authoring, App Server-backed `meta-skill run` execution, run inspection, baseline runs, and eval evidence interpretation.
- Use `skill-improve` for best-practice review, lint-backed findings, eval-backed edits, trace-backed fixes, human-feedback-backed patches, and bounded redesign of existing skills.
- Handle package, release, install, publish, marketplace, or promotion questions at the Meta Skill level until a focused lane is needed for validation or edits. Require explicit user approval before any such action.

## Route Order

1. Classify the user intent: create, eval, improve, package/release, or broad help.
2. If the user asks for broad help, answer from this skill without reading every focused skill.
3. If the request names a focused lane or maps clearly to one, load that skill and follow its runtime contract.
4. If the request spans lanes, sequence them in the useful authoring order:

```text
create portable skill -> project init when needed -> lint -> author cases -> run -> inspect evidence -> improve -> lint/run again -> package only after approval
```

5. Before finalizing, report the chosen lane, files changed or evidence created, validation run, and any human gate still outstanding.

## Broad Help

For requests such as `what can you do?`, `how do I use Meta Skill?`, `help`, `orient me`, or CLI capability questions, answer from the map below instead of routing into a focused lane unless the user asks to start work.

Use this shape:

```md
Meta Skill can help with:
- Creating portable reusable skills from a workflow, draft, source pack, or example output
- Adding a `.meta-skill/` workbench for cases, runs, tests, and maintained-skill evidence
- Running App Server-backed skill evals and inspecting saved evidence
- Reviewing or patching skills from lint, eval, trace, or human-feedback evidence
- Packaging a validated payload after explicit approval

Good first prompts:
- `@Meta Skill create a reusable skill for this workflow.`
- `@Meta Skill add eval cases for this skill.`
- `@Meta Skill improve this skill from run <run-id>.`
```

Keep the answer user-facing. Avoid exposing implementation details unless the user asks how the CLI or plugin internals work.

## CLI Guidance

Use the `meta-skill` CLI for stable file actions the user has authorized. Prefer the source project path over installed runtime copies.

Common commands:

```bash
meta-skill create <skill-dir> --slug <slug> --title "<title>" --description "<Use when ...; not for ...>" --job "<job>"
meta-skill create <skill-dir> --project --slug <slug> --title "<title>" --description "<Use when ...; not for ...>" --job "<job>"
meta-skill project init <skill-dir>
meta-skill lint <project-or-skill>
meta-skill run <project> [--case <id>] [--type <R|F|G>] [--topic <topic>] [--label "..."] [--no-skill]
meta-skill package <project> [--out <zip>] [--out-dir <dir>]
```

Command routing:

- `create` writes a portable skill payload. Add `--project` only when the user needs cases, tests, comparison, release discipline, or maintained-skill evidence.
- `project init` adds `.meta-skill/` to an existing portable payload without moving the runtime files.
- `lint` validates the portable payload, workbench shape, links, cases, and deterministic tests. Use it after create, after edits, before runs, and before packaging.
- `run` records new eval evidence under `.meta-skill/runs/<run-id>/`. Working-payload runs force-attach the selected skill, so treat the result as mounted-skill behavior evidence, not true trigger-routing proof.
- `package` runs lint and exports the current portable payload. Use it only after explicit user approval for packaging, and keep install, publish, marketplace sync, or promotion as separate explicit approvals.

## Skill Map

### skill-create

Route here for turning a workflow, example output, existing skill draft, or repeated knowledge-work task into a reusable portable skill. It owns trigger boundaries, skill-or-not decisions, runtime payload design, source-pack distillation, conversation-to-skill capture, project-mode decisions, and creation-time lint.

Do not use it for running evals, improving from evidence, packaging, installing, or publishing.

### skill-eval

Route here for setting up, running, auditing, or interpreting App Server-backed eval cases with `meta-skill run`. It owns `.meta-skill/cases/`, `.meta-skill/runs/`, case types `R`, `F`, and `G`, baseline runs with `--no-skill`, and evidence readouts.

Do not use it for rewriting skills, best-practice review, packaging, installing, or publishing.

### skill-improve

Route here for reviewing or patching an existing skill from evidence: lint output, eval run ID, case ID, test failure, trace, saved evidence file, or human feedback. It owns review-only findings, surgical edits, bounded redesigns, and rerunning relevant validation after edits.

Do not use it for creating new skills, running eval cases, autonomous rewrites without evidence, packaging, installing, or publishing.

## Top-Level Gates

Ask for explicit approval before packaging, installing, publishing, syncing to a marketplace, promoting a candidate into source, writing to external systems, or final-delivering a user-facing artifact.

Completed lint or eval execution is useful evidence, not proof that a skill is good. When reporting results, name what ran, what files exist, what the evidence shows, and what remains unverified.
