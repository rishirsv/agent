# Structure

Read this when deciding what goes into the portable runtime payload versus the `.meta-skill/` workbench.

## Portable Payload

The portable payload is the project root:

```text
<skill-dir>/
  SKILL.md
  agents/
  references/      optional
  scripts/         optional
  assets/          optional
  resources/       optional
  <other runtime files or folders>
```

Any root-level runtime file or folder may package unless it is explicit private,
workbench, dependency, build/cache, package-artifact, editor, or OS junk state.
`.meta-skill/` never packages.

## Project Workbench

Project mode adds only the implemented hidden authoring state under
`.meta-skill/`:

```text
.meta-skill/
  spec.md
  eval-scenarios.md
  review.md
  evals/<slug>/task.md
  evals/<slug>/criteria.json
  runs/<run-id>/
  tests/
```

For new project-mode skills, create `.meta-skill/` beside the portable payload. For an existing portable skill, add `.meta-skill/` in place without moving the payload.

Do not create or document alternate workbench surfaces as current behavior:
`reviews/`, `plans/`, `sessions/`, `evals.json`, and `tests/manifest.json` are
not live workbench paths. Review evidence uses the single `.meta-skill/review.md`
file.

## Runtime Resource Test

A runtime resource earns its place when it prevents repeated mistakes, saves tokens, standardizes fragile output, or performs deterministic work better than prose.

Keep a file in `.meta-skill/` when it is build reasoning, raw examples, eval evidence, decision evidence, or local test state.

## References

Use `references/` for runtime guidance a future agent should read only when needed.

- Link every reference directly from `SKILL.md`.
- Keep references one level deep.
- Start each reference with when to read it.
- Keep source-specific, client-specific, or build-only detail in `.meta-skill/spec.md` unless the skill is intentionally organization-specific.

## Scripts

Use `scripts/` only when code is safer or cheaper than prose.

- Link every script directly from `SKILL.md`.
- State when to run it, what inputs it accepts, what output means, and what nonzero exit means.
- Prefer standard-library dependencies unless a package materially improves reliability.
- If project mode exists, add or recommend executable deterministic tests for runtime scripts directly under `.meta-skill/tests/`.

## Assets

Use `assets/` only for approved reusable runtime materials such as templates, schemas, starter workbooks, icons, or boilerplate.

- Link or name how each asset is used.
- Do not place raw user uploads, unapproved examples, sensitive files, or licensed materials in the portable payload without explicit approval.

## Metadata

`agents/openai.yaml` is part of the portable payload for generated skills. Include `interface.default_prompt` and keep it consistent with what the skill actually does. The file may also hold Codex UI metadata, an invocation policy, or declared tool dependencies. It uses `interface`, `policy`, and `dependencies` sections only — the skill name and description live in `SKILL.md` frontmatter, not in this file. Keep `display_name`, `short_description`, and `default_prompt` user-facing, with no system or implementation-plumbing terms unless the user-facing task directly depends on that exact named surface.

## Packaging

Packaging exports only the portable payload from the project root. It excludes `.meta-skill/` and should write package metadata next to the artifact when packaging exists in the surrounding workflow.
