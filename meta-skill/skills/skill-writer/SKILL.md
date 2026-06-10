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
resources/       optional
examples/        optional when examples are runtime material
.meta-skill/     optional private workbench, excluded from packages
```

This skill owns greenfield authoring. Route existing-skill fixes to
`skill-doctor`, measurement to `skill-evaluator`, and lifecycle orchestration to
`meta-skill`.

## Reference Map

Read only what the task needs:

| Need | Read |
|---|---|
| Decide what a skill is, whether the idea is skill-shaped, and what artifact should be created if it is not a skill | [skill-shape.md](references/skill-shape.md) |
| Distill source packs, example input/output pairs, transcripts plus notes, or prior artifacts into reusable skill rules | [source-distillation.md](references/source-distillation.md) |
| Decide whether the workflow should become a skill; classify the skill type; write the trigger contract, frontmatter, runtime body, instruction strength, setup/state, future measurement handoff, evidence boundaries, and voice | [design.md](references/design.md) |
| Capture an active or prior Codex thread/session into a durable skill | [session-capture.md](references/session-capture.md) |
| Add compact runtime snippets after the design decision is clear | [cookbook.md](references/cookbook.md) |
| Use the central Meta Skill CLI for validate, package, workbench, eval, progress, and runner workflows | [cli.md](../../references/cli.md) |
| Understand OpenAI/Codex UI metadata fields when authoring `agents/openai.yaml` | [openai_yaml.md](references/openai_yaml.md) |
| Run a trial of a draft skill in an isolated Codex thread or worktree | [skill-trial-runs.md](../../references/skill-trial-runs.md) |

Treat [design.md](references/design.md) as the governing principle guide. Treat
[cookbook.md](references/cookbook.md) as a recipe lookup, not a template to copy
wholesale.
Use [cli.md](../../references/cli.md) for the plugin command surface. Worker
skills do not expose local script interfaces.

## Workflow

### 1. Interview

Start from existing context: the conversation, provided files, comparable skills,
Codex thread/session evidence, and any source material. For a request to capture
the current or prior thread into a skill, read
[session-capture.md](references/session-capture.md). Ask only for missing
decisions that change routing, runtime behavior, resources, or approval gates.
For source packs, example input/output pairs, transcripts plus notes, prior
artifacts, or other source-derived skill requests, read
[source-distillation.md](references/source-distillation.md) before drafting.
When the request is still an idea rather than a settled skill, read
[skill-shape.md](references/skill-shape.md) before drafting.

Complete this answer-set before scaffolding. Answers may come from the
conversation, a captured session, source material, comparable skills, repo
conventions, or a question:

| Field | Required answer |
|---|---|
| Job | The one recurring job the skill does, not what happened once. |
| Trigger | Real user language that should fire the skill, plus the nearest `not for` boundary. |
| Inputs and output | What the skill consumes and the expected output shape or artifact. |
| Invariants and failure shields | What the skill should preserve, prevent, or flag; include common mistakes and user corrections. |
| Fragility | Whether the work is judgment prose, fixed-shape output, script-backed, or a strict sequence. |
| Gates | Approvals required before external writes, destructive actions, publishing, sending, install/sync, or final client-facing delivery. |
| Project mode | Portable-only, or project mode with `.meta-skill/` docs, research, fixtures, package artifacts, and team reuse material. |

Fill every answer from context first. Resolve answers before asking by mining
the current conversation, provided files, source packs, user corrections,
session-capture output, comparable skills, and the skill type in
[design.md](references/design.md). Ask only for decisions that change routing,
runtime behavior, resources, approval gates, or project mode.

When a question is needed, ask in one screen with numbered questions, lettered
options, a recommended default, and a `defaults` fast path:

```md
Skill outline - a couple of quick decisions before I scaffold.

1. When should it trigger?
a) <real user phrasing inferred from context> (recommended)
b) <broader alternative>
c) Not sure - use default

2. Set up a workbench?
a) Portable-only, no workbench (recommended)
b) Project mode with `.meta-skill/` authoring docs, research, fixtures, and package output
c) Not sure - use default

Reply with: `defaults`, or a compact answer like `1a 2b`.
```

Always recommend an answer. Do not ask open-ended questions when tight choices
would resolve the ambiguity faster. If a required answer is thin but not
blocking, record the best defensible default and mark the uncertainty in
`Still open`.

Reflect the settled shape as a compact **Draft Skill Outline** before editing.
When scaffolding a new skill, put this outline in `SKILL.md` itself, then
iterate it into final runtime guidance:

```md
Draft Skill Outline
- Job: extract tables from supplier PDFs into one normalized CSV.
- Trigger (+ not for): "pull the line items out of these invoices"; not for summarizing PDF prose.
- Inputs and output: a folder of PDFs -> one CSV with validated columns.
- Invariants and failure shields: never invent missing values; flag pages that fail to parse.
- Fragility: deterministic, script-backed extraction and validation.
- Gates: none; portable-only.
- Project mode: portable-only.
- Still open: none.
```

Before scaffolding, pressure-check the trigger by naming one should-trigger
prompt, one should-not-trigger prompt, and the nearest near miss. Use
[design.md](references/design.md) for trigger-contract quality.

The interview self-bypasses when context is complete, the user says "just build
it" or "no questions," or the idea is not skill-shaped. Skipping changes the
clarification budget, not the quality budget: the draft outline still needs a
real job sentence, trigger contract, and output shape before runtime drafting.

### 2. Design

Build a skill only when reusable runtime guidance would change future agent
behavior. Use [skill-shape.md](references/skill-shape.md) to distinguish skills
from one-off answers, project docs, memory, utilities, validators, apps, or
managed agent systems; route to the better artifact when the idea is not
skill-shaped.

Use [design.md](references/design.md) to decide:

- the recurring job and ownership boundary
- the skill type and the resource/test shape it implies
- frontmatter name and description
- runtime body shape and section names
- instruction strength: prose, checklist, template, script, or strict sequence
- setup, config, state, and memory requirements
- future measurement handoff for realistic prompts, expected outputs, and objective checks when the user asks for that lane
- input and evidence boundaries
- failure handling, approval gates, output shape, and final checks

Use [cookbook.md](references/cookbook.md) only after the design decision is
clear. Pick the smallest pattern card that changes runtime behavior.

### 3. Build

Create or edit the source skill files directly. Prefer a lean `SKILL.md` with
linked references over an overstuffed body.

When creating a new skill, create the target directory and runtime files
directly. Resolve relative `<skill-dir>` from the user's current working
directory. The portable payload is the project root: `<skill-dir>/SKILL.md`,
`agents/`, and any runtime folders the design actually needs. If the user wants
project-mode evaluation or packaging state, run
`scripts/meta-skill workbench init --target <skill-dir>` after the payload
exists.

In project mode, keep non-runtime authoring material under `.meta-skill/`.
Use `.meta-skill/docs/research/` for research reports, `.meta-skill/docs/` for
other durable authoring notes, and `.meta-skill/tests/` as a flat folder for
test fixtures or check inputs when the user provides them. Keep
`.meta-skill/tests/` flat; do not create nested test-category folders inside it.

Follow these payload rules:

- Keep build notes, raw source examples, review notes, future measurement material, and
  rejected options out of the portable payload.
- Put runtime references in `references/`, one level deep. Link every reference
  directly from `SKILL.md`, and start each reference with when to read it.
- Put scripts in `scripts/` only when deterministic code is safer or cheaper
  than prose. Link every script directly from `SKILL.md`, state when to run it,
  what inputs it accepts, what output means, and what nonzero exit means.
- Put assets in `assets/` only for approved reusable runtime materials such as
  templates, schemas, starter files, icons, or boilerplate.
- Use `resources/`, `examples/`, or another folder only when the runtime skill
  needs that material. Link it directly from `SKILL.md`, name when to read or use
  it, and keep source-specific or build-only material in `.meta-skill/docs/`
  unless the skill is intentionally organization-specific.
- Include `agents/openai.yaml` for generated skills when the surrounding runtime
  expects UI metadata. Keep `display_name`, `short_description`, and
  `default_prompt` user-facing; `default_prompt` should mention
  `$<skill-name>`. Read [openai_yaml.md](references/openai_yaml.md) before
  generating optional metadata fields.
- Add human gates before external writes, destructive edits, packaging,
  installing, syncing, publishing, posting, sending, submitting, or final
  client-facing delivery.

Generalize source material into reusable behavior. Do not copy user prompts,
model names, provider docs, raw research links, author provenance, thread IDs,
one-off file paths, or local build notes into runtime unless they are direct
runtime dependencies.

When the intake requires research, prefer a bounded research pass before
runtime drafting. Use an available researcher sub-agent or research-oriented
skill when the environment provides one and the research can run independently;
otherwise do the smallest reliable source review yourself. Save concise research
reports in `.meta-skill/docs/research/` for project-mode skills, and copy only
the operational conclusions into runtime guidance.

### 4. Validate And Stop

Review changed skill files directly. Check that linked references, scripts, and
assets exist. Run any deterministic tests already available for the skill or its
authoring repo.

For standalone portable skill folders, run
`scripts/meta-skill validate <path-to-skill-folder>`. For script resources added during
authoring, run a smoke test or representative sample and report any untested
scripts.

If the user asks for one-off testing, or if one realistic isolated run would
materially improve confidence in a fragile trigger, resource, script, or output
contract, read
[skill-trial-runs.md](../../references/skill-trial-runs.md) and offer a skill
trial run. It is optional by default and is not release proof; route systematic
multi-scenario measurement to `skill-evaluator`. For that handoff, provide 2-3
realistic user tasks, expected outcomes or reference solutions, known failure
or near-miss examples, and any must-not-break constraints so the evaluator can
compare outcomes across no-skill, current-skill, and edited-skill conditions.

Stop before packaging, installing, publishing, syncing, external writes, or
final delivery unless the user explicitly approved that action or the current
repo instructions require it. When packaging is approved, use
`scripts/meta-skill package <skill-dir>`; it exports only the portable payload from the
project root and excludes `.meta-skill/`.

## Output

Close with the skill path, what was created or changed, validation run or
skipped, and anything still open. Keep the report short.
