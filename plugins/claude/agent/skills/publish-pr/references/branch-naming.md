# Branch Naming

Read this before creating or renaming a branch.

## Default Pattern

Use `{type}/{short-outcome}` when starting from the default branch or an unsuitable branch and the scope is obvious.

Types:

- `feat/` for user-facing features or new capabilities.
- `fix/` for bugs, regressions, or broken behavior.
- `docs/` for documentation-only changes.
- `refactor/` for structure changes that preserve behavior.
- `test/` for test-only changes.
- `chore/` for maintenance that does not fit the others.

Keep the slug short, lowercase, hyphenated, and outcome-oriented.

Good:

- `feat/workout-rest-controls`
- `fix/cloud-sync-retry-loop`
- `docs/pr-filing-guidance`

Avoid:

- `codex/implement-workout-rest-controls`
- `feat/misc-updates`
- agent-centered names such as `feat/codex-updates`

## Existing Repo Policy

If the repo already uses an obvious branch naming policy, follow it. Do not use `codex/` as the default namespace unless the repo requires it or the user asks.

## Rename Rules

Rename only unpublished local branches when the better name is obvious.

Treat a branch as pushed if it has an upstream or remote head:

```bash
git rev-parse --abbrev-ref --symbolic-full-name @{u}
git ls-remote --heads origin "$(git branch --show-current)"
```

Do not rename pushed or shared branches unless the user asks.
