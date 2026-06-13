# GitHub CLI Preflight

Read this before publishing when auth, remotes, branch tracking, base branch, or PR existence is uncertain.

## Required Checks

Run the smallest command set that proves the publication surface:

```bash
git status --short
git status -sb
git branch --show-current
git remote -v
git log --oneline -10
gh --version
gh auth status
gh repo view --json defaultBranchRef
```

If `gh` is missing, stop and ask the user to install GitHub CLI. If `gh auth status` is unhealthy, stop and ask the user to authenticate with `gh auth login`.

## Base Branch

Prefer the base branch in this order:

1. Explicit user instruction.
2. Repo instructions.
3. Existing upstream PR base, if reusing a PR.
4. GitHub default branch from `gh repo view --json defaultBranchRef`.

Fetch before comparing:

```bash
git fetch origin "$base_branch"
```

Do not leave `$base_branch` implicit before `gh pr create`. If the command cannot determine the base branch, stop and ask one concise question.

## Existing PR

Before creating a PR, check whether the current branch already has one:

```bash
gh pr view --json number,url,state,isDraft,headRefName,baseRefName,title,body
```

If it exists, reuse it. Preserve its draft or ready state unless the user asks to change it. Update title/body only when they are stale or generic.

## Tracking

After pushing, verify upstream tracking:

```bash
git rev-parse --abbrev-ref --symbolic-full-name @{u}
```

If the branch has no upstream, push explicitly:

```bash
git push -u origin "$(git branch --show-current)"
```

## Reviewers

Only request human reviewers when the user asks. For Codex review, use a PR comment with `@codex review`; do not use GitHub reviewer assignment.
