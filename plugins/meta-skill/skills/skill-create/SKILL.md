---
name: skill-create
description: Use when turning a workflow, example output, existing skill draft, or repeated knowledge-work task into a reusable portable skill; not for running evals, improving from evidence, packaging, installing, or publishing.
---

# Skill Create

Create practical reusable skills. The default output is a portable skill payload rooted at the skill directory:

```text
SKILL.md
agents/
references/      optional
scripts/         optional
assets/          optional
```

Add the hidden `.meta-skill/` workbench only when the user requests project mode or clearly needs evals, tests, comparison, team reuse, or a maintained production capability.

## Reference Map

Read only what the task needs:

| Need | Read |
|---|---|
| Decide whether the workflow should become a skill; write frontmatter, runtime guidance, boundaries, and trigger contract | [design.md](references/design.md) |
| Look up compact snippets after the design decision is clear | [cookbook.md](references/cookbook.md) |
| Distill a source pack or past outputs into reusable runtime guidance without leaking engagement-specific facts | [distillation.md](references/distillation.md) |
| Decide what belongs in `SKILL.md`, `references/`, `scripts/`, `assets/`, and `.meta-skill/` | [structure.md](references/structure.md) |
| Use the shared CLI conventions | [cli-conventions.md](references/cli-conventions.md) |
| Copy or adapt the project spec shape | [skill-spec-template.md](assets/skill-spec-template.md) |

## CLI

Use the shared TypeScript CLI through the plugin package `meta-skill` bin:

```bash
meta-skill create <skill-dir> --slug <slug> --title "<title>" --description "<Use when ...; not for ...>" --job "<job>"
meta-skill create <skill-dir> --project --slug <slug> --title "<title>" --description "<Use when ...; not for ...>" --job "<job>"
meta-skill project init <skill-dir>
meta-skill lint <skill-dir>
```

`meta-skill create` scaffolds a portable payload. `--project` adds `.meta-skill/`. `project init` adds `.meta-skill/` to an existing portable skill without moving the payload into a nested folder.

## Creation Loop

1. Decide whether the request is skill-shaped.
2. Draft the trigger contract and nearest non-trigger boundary.
3. Distill source material when the skill is source-derived.
4. Draft the portable runtime payload.
5. Add `.meta-skill/` only when requested or clearly implied.
6. Run `meta-skill lint <skill-dir>` and stop before packaging, install, or publish unless the user explicitly asks.

Ask one focused question only when the answer changes routing, runtime instructions, resources, gates, or project mode. Include your recommended answer.

Single-shot creation is opt-in. If the user says "one shot," "no questions," or equivalent, make the strongest reasonable decisions and record unresolved choices in `.meta-skill/spec.md` when project mode exists.

## Runtime Payload Rules

- Keep build notes, review notes, raw source examples, and eval evidence out of the portable payload.
- Quote or escape YAML frontmatter values when they contain punctuation.
- `agents/openai.yaml` should use supported Codex metadata (`name` and `description`) unless a documented interface shape is intentionally used.
- Add runtime references, scripts, or assets only when they are real reusable materials.
- Link every runtime reference, script, or asset directly from `SKILL.md`.
- Runtime scripts should get or recommend unit tests in `.meta-skill/tests/manifest.json` when project mode exists.
- Add human gates before packaging, installing, publishing, syncing, source edits, external writes, or final client/user-facing delivery.

## Output

For new builds, report the path, files created, routing contract, nearest non-trigger boundary, resources added or omitted, project-mode decision, lint result, and any spec gaps.

For review, eval, or evidence-backed edits, hand off to `skill-improve` or `skill-eval` instead of silently crossing lanes.
