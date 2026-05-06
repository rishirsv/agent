---
name: yeet
description: Use only when the user explicitly asks to stage, commit, push, and open a GitHub pull request in one end-to-end flow using the GitHub CLI (`gh`).
---

# Yeet

Stage the intended changes, commit them cleanly, push the branch, and open a reviewer-friendly PR in one flow.

## Prerequisites

- Require GitHub CLI `gh`. Check `gh --version`. If missing, ask the user to install `gh` and stop.
- Require authenticated `gh` session. Run `gh auth status`. If not authenticated, ask the user to run `gh auth login` and re-run `gh auth status` before continuing.

## Naming conventions

- Branch: `{description}` when starting from the default branch and the scope is obvious.
- Commit: `{description}` as a terse, recallable subject.
- PR title: `{description}` summarizing the full diff.

If the repo already has an obvious branch naming pattern, follow that instead of forcing a new one.

## Workflow

Follow this order:

1. Inspect git state, branch, recent commits, remotes, and GitHub auth.
2. Infer the intended publication scope from the request, diff, and files touched in this session.
3. If the worktree is dirty or detached but the intended slice is obvious, isolate that slice instead of stopping.
4. Stage only the intended files.
5. Commit tersely with the description.
6. Optionally rebase onto the current base branch when the repo policy or user request calls for it and doing so is clearly safe.
7. Run checks if there is an obvious relevant command and they were not already run.
8. Push with tracking.
9. Open a draft PR with a detailed prose body that reflects the real issue, fix, and validation.
10. Report the PR URL, branch, commit, and any follow-up state.

## Preflight

Start with the smallest useful checks:

```bash
git status --short
git status -sb
git branch --show-current
git log --oneline -10
git diff --stat
git diff --staged --stat
git remote -v
gh --version
gh auth status
```

Inspect full diffs only when needed:

```bash
git diff
git diff --staged
git diff -- path/to/file
git diff --staged -- path/to/file
```

## Dirty or detached repo guard rails

Treat dirty worktrees and detached `HEAD` as scoping problems to solve, not automatic blockers.

- If the user asked to yeet the work and the intended slice is clear, assume they want you to isolate and publish that slice.
- Do not stage everything with `git add -A` unless the full worktree clearly belongs to the requested publication.
- Prefer explicit path staging over broad staging.
- Leave unrelated edits untouched and uncommitted.
- If the current branch is the default branch, detached, or clearly unsuitable for a PR, create a scoped branch and continue when the intended slice is obvious.
- If the current worktree is too polluted to safely separate the intended diff in place, create a clean branch or worktree from the appropriate starting point and reapply only the intended changes there.
- If only part of a file should be included and there is no safe non-interactive split available, stop and ask one concise question.
- If multiple plausible publication scopes exist, stop and ask one concise question.

## Branch and staging strategy

Use the lightest safe path:

1. Keep the current branch when it is already a focused feature branch.
2. If on the default branch and the scope is obvious, create a branch:

```bash
git switch -c "description"
```

3. If detached or otherwise unsuitable but the scope is obvious, create a scoped branch before staging.
4. Stage only the intended paths:

```bash
git add -- path/to/file another/path
```

5. Recheck the staged diff before committing:

```bash
git diff --staged --stat
git diff --staged
```

Use `git restore --staged -- <path>` only to remove clearly unintended staged files from the PR scope.

## Commit rules

- Keep the commit focused on one logical change.
- Use one terse subject that matches the intended publication slice.
- If the staged set is already correct, keep it instead of restaging.
- If there is nothing to commit, say so plainly and stop.

Use this shape:

```bash
git commit -m "description"
```

## Optional rebase to base branch

Support an optional "update to current main before PR creation" step.

- Do not treat rebasing onto the base branch as mandatory for every PR.
- First fetch the remote base branch before deciding:

```bash
git fetch origin main
```

- Compare the current branch against `origin/main` or the repo's actual default base branch if it is not `main`.
- If the branch is not behind the base branch, continue normally.
- If the branch is behind and the user explicitly asked for rebasing, or repo instructions require being current before PR creation, update the branch before opening the PR.
- If the branch is behind but has not been pushed yet or is clearly local-only, rebasing onto the base branch is the preferred update method.
- If the branch is already pushed or likely shared, do not silently rewrite history unless the user or repo instructions clearly call for that behavior.
- If the safe choice is unclear, ask one concise question instead of guessing.

Use this shape when rebasing is clearly appropriate:

```bash
git rebase origin/main
```

If the repo uses a different default branch, substitute that branch name consistently in the fetch, compare, and rebase commands.

## Check and push mechanics

Preserve the original yeet flow, but keep it explicit and safe:

- Run checks if not already. Reuse validation already done in this session when still relevant.
- If there is an obvious repo-local validation command, run it before pushing.
- If checks fail because dependencies or tools are missing and the fix is straightforward, install or set up what is needed and retry once.
- Push with tracking explicitly:

```bash
git push -u origin "$(git branch --show-current)"
```

- If push fails, inspect the actual failure before mutating branch state.
- If push fails because the current branch has no upstream, use the command above.
- Do not pull or merge automatically just to force publication.
- Rebase onto the base branch only when the user asked for it, repo instructions require it, or the skill invocation context clearly says to do it when safe.

## PR writing philosophy

Keep the published-changes writing style.

- Open the PR as a draft.
- Write the PR description as detailed prose, not a terse bullet summary.
- Cover:
  - the issue
  - the cause and effect on users
  - the root cause
  - the fix
  - the tests or checks used to validate
- Edit the title and body so they reflect the actual diff, not generic commit text.
- Write the PR description to a temp file with real newlines and pass it with `--body-file`.

## PR creation

Use explicit non-interactive commands:

```bash
gh pr create --draft --title "description" --body-file /tmp/pr-body.md --head "$(git branch --show-current)"
```

Avoid relying on `gh pr create --fill` unless the user explicitly wants commit-derived text.

If there is already an open PR for the branch, return that PR and use `gh pr edit` only when needed.

## Safety rules

- Never push unrelated work.
- Never silently create a broad PR from a mixed worktree.
- Never use destructive cleanup commands.
- Never amend unless the user asks.
- Never merge automatically just to force publication.
- Never give up just because the repo is dirty or detached if the intended scope is still clear.
- Never dump raw terminal transcripts or giant changelogs into the PR body.

When rebasing:

- Never silently rebase a branch that looks shared unless the repo policy clearly allows it.
- Never force-push rewritten history without being explicit about it.
- If a rebase creates conflicts that are not straightforward, stop and surface the conflict instead of plowing ahead.

## Failure handling

- If `gh auth status` is not healthy, stop and report the auth problem.
- If the scope is unclear, stop and ask one concise question.
- If the commit fails because nothing is staged, re-check the intended scope instead of forcing it.
- If `gh pr create` fails, reuse the drafted title and body rather than rewriting them from scratch.
- If validation was skipped, say so plainly in the final report.
