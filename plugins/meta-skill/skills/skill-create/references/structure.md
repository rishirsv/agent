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

Project mode adds hidden authoring state:

```text
<skill-dir>/
  SKILL.md
  agents/
  references/
  scripts/
  assets/
  resources/
  .meta-skill/
    spec.md
    evals/
      evals.json
      cases/<ID-slug>/
      judges/
      runs/
    tests/
      manifest.json
      unit/
      eval/
```

Use `meta-skill create --project ...` for new project-mode skills and `meta-skill project init <skill-dir>` for an existing portable skill.

Do not create alternate root-level workbench folders.

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
- If project mode exists, add or recommend unit tests for runtime scripts in `.meta-skill/tests/manifest.json`.

## Assets

Use `assets/` only for approved reusable runtime materials such as templates, schemas, starter workbooks, icons, or boilerplate.

- Link or name how each asset is used.
- Do not place raw user uploads, unapproved examples, sensitive files, or licensed materials in the portable payload without explicit approval.

## Metadata

`agents/openai.yaml` is part of the portable payload when the runtime needs interface metadata. Keep it aligned with `SKILL.md` frontmatter.

## Packaging

`meta-skill package` exports only the portable payload from the project root. It excludes `.meta-skill/` and writes package metadata next to the artifact.
