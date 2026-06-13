# Scope And Staging

Read this before staging, splitting, or committing a dirty worktree.

## Scope Check

Make the commit tell one coherent story. File count and line count are not the deciding factors; reviewability and reversibility are.

Keep one commit when:

- all changes support the same feature, bug fix, docs update, refactor, test, or maintenance task,
- tests or docs directly support the main change,
- multiple files changed because one behavior crosses normal module boundaries.

Split or ask before committing when:

- the diff contains unrelated product surfaces, fixes, docs, or cleanup,
- one part could be reviewed, reverted, or shipped independently,
- the subject would need vague glue such as `misc`, `updates`, or `cleanup and fixes`,
- the body would need two unrelated explanations.

## Existing Staging

Treat an existing staged set as user intent, but verify it:

```bash
git diff --staged --stat
git diff --staged --name-only
```

If staged files look unrelated to the requested commit, ask before changing the index. If unrelated files are clearly staged by accident, unstage only those explicit paths and report that you did so.

## Dirty Worktree

Dirty worktrees are normal. Solve the scope problem instead of stopping.

- Stage explicit paths for the intended commit.
- Leave unrelated work unstaged and uncommitted.
- Preserve untracked files unless they are clearly part of the requested commit.
- If partial-file staging is needed and cannot be done safely non-interactively, ask one concise question.

## Multiple Commits

When splitting, use this order:

1. Foundational refactors or mechanical moves.
2. Behavior changes.
3. Tests and docs only when they stand alone; otherwise include them with the behavior they verify or explain.

Re-run `git status --short` and `git diff --staged --stat` before every commit.
