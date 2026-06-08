---
name: skill-writer
description: "The greenfield-authoring specialist within meta-skill: create a new reusable agent skill from an intent, repeated workflow, example output, Codex thread/session, or source material by designing the trigger contract, runtime guidance, resources, metadata, and validation. Reached through meta-skill's routing; invoke directly only when explicitly named. Not for improving, diagnosing, or evaluating an existing skill, and not for packaging, installing, publishing, or syncing skills."
---

# Skill Writer

Create practical, reusable skills. Build the portable runtime payload rooted at
the skill directory:

```text
SKILL.md
agents/          recommended
references/      optional
scripts/         optional
assets/          optional
```

This skill owns greenfield authoring. Route existing-skill fixes to
`skill-doctor`, measurement to `skill-evaluator`, and lifecycle orchestration to
`meta-skill`.

## Reference Map

Read only what the task needs:

| Need | Read |
|---|---|
| Decide whether the workflow should become a skill; write the trigger contract, frontmatter, runtime body, instruction strength, evidence boundaries, and voice | [design.md](references/design.md) |
| Capture an active or prior Codex thread/session into a durable skill | [session-capture.md](references/session-capture.md) |
| Add compact runtime snippets after the design decision is clear | [cookbook.md](references/cookbook.md) |
| Run one isolated Codex thread trial for the draft skill | [isolated-thread-trial.md](../../references/isolated-thread-trial.md) |

Treat [design.md](references/design.md) as the governing principle guide. Treat
[cookbook.md](references/cookbook.md) as a recipe lookup, not a template to copy
wholesale.

## Workflow

### 1. Understand

Start from existing context: the conversation, provided files, comparable skills,
Codex thread/session evidence, and any source material. For a request to capture
the current or prior thread into a skill, read
[session-capture.md](references/session-capture.md). Ask only for missing
decisions that change routing, runtime behavior, resources, or approval gates.

Reflect the settled shape as a compact **Current Understanding** before editing:

```md
Current Understanding
- Job: extract tables from supplier PDFs into one normalized CSV.
- Trigger: "pull the line items out of these invoices"; not for summarizing PDF prose.
- Inputs -> output: a folder of PDFs -> one CSV with validated columns.
- Guardrails: never invent missing values; flag pages that fail to parse.
- Fragility: deterministic, script-backed extraction and validation.
- Gates: none; portable-only.
- Still open: none.
```

Before scaffolding, pressure-check the trigger by naming one should-trigger
prompt, one should-not-trigger prompt, and the nearest near miss. Use
[design.md](references/design.md) for trigger-contract quality.

### 2. Design

Build a skill only when reusable runtime guidance would change future agent
behavior. If the request is a one-off answer, an obvious general capability, a
project-specific rule, or a validation-code problem, say so and stop or route to
the right artifact.

Use [design.md](references/design.md) to decide:

- the recurring job and ownership boundary
- frontmatter name and description
- runtime body shape and section names
- instruction strength: prose, checklist, template, script, or strict sequence
- input and evidence boundaries
- failure handling, approval gates, output shape, and final checks

Use [cookbook.md](references/cookbook.md) only after the design decision is
clear. Pick the smallest pattern card that changes runtime behavior.

### 3. Build

Create or edit the source skill files directly. Prefer a lean `SKILL.md` with
linked references over an overstuffed body.

Follow these payload rules:

- Keep build notes, raw source examples, review notes, eval evidence, and
  rejected options out of the portable payload.
- Put runtime references in `references/`, one level deep. Link every reference
  directly from `SKILL.md`, and start each reference with when to read it.
- Put scripts in `scripts/` only when deterministic code is safer or cheaper
  than prose. Link every script directly from `SKILL.md`, state when to run it,
  what inputs it accepts, what output means, and what nonzero exit means.
- Put assets in `assets/` only for approved reusable runtime materials such as
  templates, schemas, starter files, icons, or boilerplate.
- Include `agents/openai.yaml` for generated skills when the surrounding runtime
  expects UI metadata. Keep `display_name`, `short_description`, and
  `default_prompt` user-facing; `default_prompt` should mention
  `$<skill-name>`.
- Add human gates before external writes, destructive edits, packaging,
  installing, syncing, publishing, posting, sending, submitting, or final
  client-facing delivery.

Generalize source material into reusable behavior. Do not copy user prompts,
model names, provider docs, raw research links, author provenance, thread IDs,
one-off file paths, or local build notes into runtime unless they are direct
runtime dependencies.

### 4. Validate And Stop

Review changed skill files directly. Check that linked references, scripts, and
assets exist. Run any deterministic tests already available for the skill or its
authoring repo.

If the user asks for one-off testing, or if one realistic isolated run would
materially improve confidence in a fragile trigger, resource, script, or output
contract, read
[isolated-thread-trial.md](../../references/isolated-thread-trial.md) and offer
an isolated Codex thread trial. It is optional by default and is not release
proof; route systematic multi-scenario measurement to `skill-evaluator`.

Stop before packaging, installing, publishing, syncing, external writes, or
final delivery unless the user explicitly approved that action or the current
repo instructions require it.

## Output

Close with the skill path, what was created or changed, validation run or
skipped, and anything still open. Keep the report short.
