---
name: docs-gardener
description: "Use when writing or updating durable project documentation such as README.md, AGENTS.md, ARCHITECTURE.md, DESIGN.md, runbooks, API docs, or migration notes, including scaffolding a DESIGN.md in the Google Stitch open format and style-preserving updates that match an existing doc's voice; not for design critique, planning artifacts, code review, or one-off prose unrelated to project documentation."
---

# Docs Gardener

Write or update durable project documentation that a maintainer or future agent can rely on. Preserve the existing doc's structure and voice unless the user explicitly asks for a reflow.

## Reference Map

| Need | Read |
|---|---|
| Scaffold or refine a `DESIGN.md` in the Google Stitch open format | [references/design-md-format.md](references/design-md-format.md) |
| Seed a new `README.md` | [assets/README_template.md](assets/README_template.md) |
| Seed a new `AGENTS.md` | [assets/AGENTS_template.md](assets/AGENTS_template.md) |
| Seed a new `ARCHITECTURE.md` | [assets/ARCHITECTURE_template.md](assets/ARCHITECTURE_template.md) |
| Seed a new `DESIGN.md` | [assets/DESIGN_template.md](assets/DESIGN_template.md) |

## Scope

In scope:

- writing or updating project-level operating docs such as `README.md`, `AGENTS.md`, `ARCHITECTURE.md`, `DESIGN.md`
- runbooks, API docs, migration notes, and module-level docs
- repairing broken links, stale paths, and drift between docs and code in the touched area
- creating a `DESIGN.md` for AI coding agents using the Google Stitch open format

Not in scope:

- design critique or polish on rendered UI (use `$interface-craft`)
- planning artifacts, execution plans, specs (use `$improve-plan` for plans)
- code review or technical debt logging (use `$gh-review` or `$code-quality`)
- proposals, slide narratives, or reader-facing prose unrelated to project documentation (use `$doc-coauthoring`)

## Workflow

1. Identify the audience: users, contributors, operators, maintainers, or future agents. Audience decides voice, depth, and location.
2. Find the closest existing owner doc. Update it instead of creating a sibling. If no owner exists, choose the smallest obvious location.
3. Verify behavior before writing. Read relevant code, tests, config, scripts, and existing docs. Do not document guessed behavior; state uncertainty when source evidence is incomplete.
4. When updating, mirror the existing doc's voice — see Style Preservation.
5. Write or update. Prefer runnable commands, concrete paths, and checked snippets over prose.
6. Prune stale content discovered in the same scope. Drop sections that no longer match the code or the workflow.
7. Update direct inbound links, indexes, and trackers in the same pass so the graph stays coherent.
8. Validate: check links, commands, paths, and code references. Where a snippet should run, confirm it does or mark it as unverified.

## Writing Principles

- One canonical owner per concern. Update the owner before creating a sibling doc.
- Concrete beats prose. Commands, paths, examples, and tables outperform paragraphs.
- Audience-first depth. A `README.md` for users hides what only contributors need; an `AGENTS.md` for agents hides what only humans need.
- Verify against source. If evidence is missing or ambiguous, ask, caveat, or leave the field blank rather than invent.
- Prune as you go. Stale guidance discovered in scope should be removed in the same edit.
- No parallel explanations. If two docs explain the same thing, pick the owner and link from the other.
- Public APIs document inputs, outputs, side effects, and failure modes when those are not obvious from the signature.

## Style Preservation

When updating an existing doc, sample the doc's style before writing:

- voice and tone (terse vs narrative, declarative vs instructional)
- heading depth and casing
- list style (bulleted vs numbered, sentence vs fragment)
- code-block conventions (language tags, command vs example)
- example density and shape
- sentence and paragraph length

Mirror what you find. If the existing style is broken or inconsistent in a way that makes a clean update impossible, name the conflict in chat and propose the reflow before applying it.

For brand-new docs, take the cue from neighboring docs in the same directory or repo. A `docs/` folder full of terse runbooks should produce a terse runbook, not a verbose explainer.

## Templates

Use a template only when creating a new durable doc and no existing scaffold is usable. Adapt the template to the project; do not leave placeholders or import sections the project does not need.

- `README.md` — project purpose, setup, common commands. Seed: [assets/README_template.md](assets/README_template.md).
- `AGENTS.md` — agent and contributor operating contract: scope, safety boundaries, verifiable loop. Seed: [assets/AGENTS_template.md](assets/AGENTS_template.md).
- `ARCHITECTURE.md` — stable system shape, boundaries, and invariants, when architecture is non-obvious. Seed: [assets/ARCHITECTURE_template.md](assets/ARCHITECTURE_template.md).
- `DESIGN.md` — design system for AI coding agents, Google Stitch open format. Seed: [assets/DESIGN_template.md](assets/DESIGN_template.md); spec: [references/design-md-format.md](references/design-md-format.md).

Other docs (runbooks, API docs, migration notes, module READMEs) do not need a template. Apply the writing principles and mirror neighbors.

## Output

For new or updated docs, report:

- doc(s) changed or created
- audience identified
- behavior or source verified
- inbound links or indexes updated
- validation performed (link check, command, snippet, path)
- gaps, assumptions, or uncertainty left

For read-only review of existing docs, lead with findings ordered by severity and include exact paths and snippets.

## Guardrails

- Do not document guessed behavior; verify or state the uncertainty.
- Do not turn doc work into feature implementation, refactoring, or planning.
- Do not create parallel docs alongside an existing canonical owner.
- Do not import opinionated structure from a template that the project does not already follow.
- For `DESIGN.md`, the Stitch token YAML frontmatter is normative; the prose around tokens is contextual.
