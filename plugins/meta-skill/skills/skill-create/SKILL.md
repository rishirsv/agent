---
name: skill-create
description: Use when turning a workflow, example output, existing skill draft, or repeated knowledge-work task into a reusable skill with clear trigger routing, runtime guidance, and useful resources; not for packaging, installing, publishing, or multi-skill orchestration.
---

# Skill Create

Create or improve practical reusable skills. Make each runtime skill easy to trigger, easy to follow, and light enough that a future agent can use it without rereading the build conversation.

## Reference Map

Read only what the task needs:

| Need | Read |
|---|---|
| Decide whether the workflow should become a skill; capture intent; write frontmatter, body, instruction strength, evidence posture, and trigger boundaries | [design.md](references/design.md) |
| Look up compact snippets by signal after the design decision is clear | [cookbook.md](references/cookbook.md) |
| Distill a source pack and past outputs into a reusable skill without leaking engagement-specific facts | [distillation.md](references/distillation.md) |
| Copy or adapt the canonical project spec shape | [skill-spec-template.md](assets/skill-spec-template.md) |
| Lay out the project shell and the portable runtime payload — references, scripts, assets, metadata, dependencies, human gates, scaffold and release posture | [structure.md](references/structure.md) |
| Apply the shared CLI conventions across `skill-create`, `skill-eval`, and `skill-improve` | [cli-conventions.md](references/cli-conventions.md) |

## CLI

Scaffolding and validation are CLI verbs, not scripts in this payload:

- `meta-skill create ...` — scaffold a clean project wrapper, spec, portable `SKILL.md`, and `agents/openai.yaml` (see step 3).
- `meta-skill validate <path>` — run structural validation (see step 5).

The shared `meta-skill` binary is repo infrastructure, not part of the portable skill payload. Both verbs are implemented in the engine at `plugins/meta-skill/cli/` and run through the `plugins/meta-skill/bin/meta-skill` shim. The CLI expects Python 3 with PyYAML available; if PyYAML is missing, install it in the local development environment before running the shim.

## Hard Constraints

- Keep build notes, review notes, and source examples in project docs, outside the portable runtime payload.
- Do not write downstream skills as if they are adapted from this builder, a research process, Anthropic, OpenAI, or a larger internal spec. Fold good ideas into a cohesive standalone skill.
- Add a human gate before packaging, installing, syncing, publishing, external writes, sending, posting, promotion, or final client/user-facing delivery.
- If the user asks for review, report findings first. Edit only when the user asks for updates or clearly authorizes surgical changes.

## Workflow

### 1. Capture intent and decide skill-or-not

First mine the conversation, uploaded files, existing skill draft, examples, and repo conventions. Do not ask for facts you can read.

If the user asks to review, audit, patch, update, rewrite, or improve an existing skill, hand off to the sibling `skill-improve` skill, which owns the surgical-edit and prompt-doctor doctrine. Use the build workflow below only for genuinely new skills or redesigns that require a new wrapper. Do not scaffold a wrapper during a review/update unless the project wrapper is missing and the user authorized creating it.

Create or update a skill when the pattern is reusable, non-obvious, likely to recur, and better captured as runtime guidance than as a one-off answer. Do not turn it into a skill when the need is a single-use artifact, a standard capability the base model already handles, a project convention better suited to local docs, or a mechanical constraint better enforced by a validator/script.

Resolve only the decisions that change the skill:

- the repeated job the skill should help with
- realistic trigger phrases, should-not-trigger phrases, and near misses
- required inputs and what to do when they are missing
- source-output pairs when old input files and completed outputs are the basis for the reusable workflow
- output shape, tone/personality, evidence/caveat behavior, and unacceptable shortcuts
- repeated mechanical work that truly needs a script rather than ordinary tool use or prose guidance
- reference material that future agents need during execution
- assets or templates that are approved reusable runtime materials
- high-risk moments that need approval or explicit stop conditions

Ask one focused question only when the answer would materially change routing, runtime instructions, resources, or gates. Include your recommended answer so the user can accept or correct it quickly.

If the user explicitly requests a single-shot build — phrasings like "one-shot," "no questions, just build it," "don't interview me," "go ahead and draft it" — skip the focused-question gate and proceed with the strongest interpretation of what they have given you. Make material decisions yourself and record them in the spec under Open Questions or as inline notes so the user can review and redirect. Single-shot is opt-in; the default remains the focused-question interview above.

When prior engagement files and finished work products are provided, work through [distillation.md](references/distillation.md) before drafting. It is the dedicated flow for source-derived skills: classification, mechanism gates, failure modes, and source provenance.

### 2. Draft the runtime skill

Use [design.md](references/design.md) for the detailed writing rules.

Write frontmatter first, then draft only the sections the job needs. Derive headings from the workflow rather than copying a universal template. Pull from [cookbook.md](references/cookbook.md) only when a ready snippet would prevent a likely miss, and from [structure.md](references/structure.md) when adding references, scripts, assets, metadata, dependencies, or human gates. Add only resources or control language that changes behavior; move ordinary preferences into the nearest relevant section.

### 3. Create or update the project wrapper

Use the host project’s convention when it exists. If none exists, use this portable wrapper shape:

```text
<project-dir>/
  AGENTS.md
  <skill-dir>/
    SKILL.md
    references/        # optional
    scripts/           # optional, only for real runtime scripts
    assets/            # optional
    agents/openai.yaml
  docs/
    spec.md
```

`<skill-dir>` is the portable runtime payload. Project docs are not part of that portable payload. See [structure.md](references/structure.md) for project shape and portable-root rules.

For a new scaffold, prefer:

```bash
meta-skill create \
  --project-dir <project-dir> \
  --portable-dir <skill-dir> \
  --slug source-pack-triage \
  --title "Source Pack Triage" \
  --description "Use when turning a messy set of uploaded examples into one reusable workflow skill; not for installing or publishing skills." \
  --job "Turn a repeated example-driven workflow into a compact reusable skill." \
  --trigger "help me turn these examples into a skill"
```

`meta-skill create` creates a clean wrapper, a project spec, a portable `SKILL.md`, and `agents/openai.yaml`. It is not a skill author. It should not infer review mode, source controls, artifact handling, tone, output contract, or failure handling from flags. Do that design work in the agent reasoning loop using the references in this skill.

Keep unresolved decisions in the project spec, not runtime `SKILL.md`. If a runtime-critical field is missing during generation, use a conservative runtime default that asks, caveats, or produces the clearest useful result rather than writing a placeholder.

Only pass runtime references, scripts, or assets when they are real files to copy into the portable payload. Do not pass planned resource names to make the skill look more complete.

Also add a minimal project-level `AGENTS.md` that declares the canonical portable root.

### 4. Author the spec

Write the project spec as the build contract and review handoff. Start from the scaffold spec, then copy or adapt [skill-spec-template.md](assets/skill-spec-template.md) so the final spec uses the canonical shape. It should contain decisions a future review, research, or improvement loop cannot safely infer from `SKILL.md`.

Keep runtime instructions in `<skill-dir>/SKILL.md`; keep build reasoning in the project spec.

Resolve or delete every `<angle-bracket>` prompt in the scaffolded spec before treating the skill as authored. Delete sections that do not apply (e.g., Optimization Evidence and Update Log on new builds) rather than filling them with "none." Unresolved questions belong in the conversation, PR, or issue tracker — not as a placeholder in the spec.

### 5. Validate and review

Run structural validation from the repo root with `meta-skill validate`, pointing it at the project wrapper and portable skill folder.

```bash
meta-skill validate <project-dir> --portable-dir <skill-dir>
```

Run deterministic checks before subjective review. Fix failures. Treat warnings as review prompts: decide per warning whether to fix it, justify the decision in the spec, or report it as residual risk. Do not blanket-ignore warnings or rewrite unrelated surfaces just because a warning exists. Run the smallest useful review pass after edits: activation, runtime clarity, section fit, resource usefulness, gates, failure handling, evidence discipline, and portable-payload cleanliness.

For existing-skill edits driven by review evidence, hand off to the sibling `skill-improve` skill. It owns the prompt-doctor loop, surgical update rules, finding shape, and the bounded-edit cycle that wraps around `meta-skill eval` evidence.

## Output

For new builds, report:

- project path
- files created or updated
- routing contract and nearest non-trigger boundary
- runtime references, scripts, assets, and why each belongs
- gates and resources added or intentionally omitted
- validation result
- spec gaps and review notes

For a review or surgical edit, hand off to `skill-improve`, which owns the review-output and edit-output contracts.
