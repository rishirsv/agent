---
name: publish-pr
description: "Use when the user asks to yeet, publish this, open a PR, push this branch, create a draft PR, send this for review, or turn already scoped local work into a reviewer-friendly GitHub draft pull request with a pushed branch; not for local-only commits, broad implementation work, existing PR review-thread handling, or standalone CI repair."
---

# Publish PR

Turn an already scoped local change into a pushed branch and reviewer-friendly draft PR without sweeping unrelated work into it.

## References

- Read [github-cli-preflight.md](references/github-cli-preflight.md) before publishing. Use it to verify GitHub auth, remotes, branch tracking, base branch, and existing PR state.
- Read [branch-naming.md](references/branch-naming.md) before creating or renaming a branch.
- Read [pr-body-template.md](references/pr-body-template.md) before drafting the PR title or body.
- Read [babysit-pr.md](references/babysit-pr.md) only when the user invokes `yeet review`, asks for Codex review, or explicitly asks you to babysit the newly published PR. Phrases like "send this for review" mean publish a reviewer-ready PR; they do not by themselves request a Codex review comment.

## Core Workflow

1. Inspect the current branch, worktree, staged diff, recent commits, remotes, base branch, and GitHub auth.
2. Infer the intended publication scope from the request, current diff, staged files, current branch, commits made in this session, and validation evidence.
3. Run the split-scope check before staging or pushing. Publish one reviewer-visible story; leave unrelated work untouched.
4. Create or keep a branch using the repo policy and [branch-naming.md](references/branch-naming.md). Rename only unpublished local branches when the better name is obvious.
5. Resolve the base branch before PR creation. Prefer the user-specified base, then repo instructions, then an existing PR base, then `gh repo view --json defaultBranchRef`.
6. Stage only intended paths. Prefer explicit path staging over broad staging.
7. Commit only when there are intended uncommitted changes. If the intended work is already committed, do not amend or create a cosmetic commit.
8. Run relevant local validation when an obvious command exists and no fresh evidence is already available.
9. Push with upstream tracking.
10. Create a new draft PR or reuse an existing PR with an explicit title, body file, base branch, and head branch.
11. Verify publication with the validation harness.
12. If the invocation is `yeet review`, `publish-pr review`, or the user explicitly asks for Codex review/babysitting, post the Codex review request and follow [babysit-pr.md](references/babysit-pr.md).
13. Report branch, commit range, PR URL, validation evidence, review-request state, and any remaining blockers.

## Scope Discipline

Treat dirty worktrees and detached heads as scoping problems to solve, not automatic blockers.

Keep one PR when the changed files support the same user-visible outcome, bug fix, docs update, refactor, or maintenance task. Supporting tests, fixtures, generated files, docs, and config changes can belong in the same PR when they explain or verify the main change.

Split, publish only the intended slice, or ask one concise question when the diff contains unrelated product surfaces, unrelated bug fixes, mixed cleanup and feature work, or a branch name would need vague glue such as `misc`, `updates`, or `cleanup-and-feature`.

If only part of a file should be included and there is no safe non-interactive split available, stop and ask one concise question.

## Publication Commands

Use explicit, non-interactive commands. Adjust the base branch when repo instructions or the user specify a different target.

```bash
git status --short
git status -sb
git branch --show-current
git remote -v
gh auth status
gh repo view --json defaultBranchRef
git diff --stat
git diff --staged --stat
```

Push with tracking:

```bash
git push -u origin "$(git branch --show-current)"
```

Create a new draft PR:

```bash
gh pr create --draft --base "$base_branch" --head "$(git branch --show-current)" --title "$title" --body-file "$body_file"
```

If an open PR already exists for the current branch, reuse it:

```bash
gh pr view --json number,url,state,isDraft,headRefName,baseRefName
```

Use `gh pr edit` only when the existing PR title, body, or base branch needs to match the publication request. If an existing PR is already marked ready, do not silently convert its review state; report that it already exists and preserve its state unless the user asks.

## Validation Harness

Before final reporting, verify:

- `gh auth status` succeeds.
- The current branch has an upstream: `git rev-parse --abbrev-ref --symbolic-full-name @{u}`.
- The PR exists and points at the expected head and base: `gh pr view --json number,url,state,isDraft,headRefName,baseRefName`.
- The PR diff matches the intended scope. Compare local merge-base diff and PR files when useful:

```bash
git fetch origin "$base_branch"
git diff --name-status "$(git merge-base HEAD "origin/$base_branch")"..HEAD
gh pr diff --name-only
```

- Checks have started or the no-checks state is explained. Prefer:

```bash
gh pr checks --json name,state,bucket,startedAt,completedAt,link
```

Treat `gh pr checks` exit code 8 as pending, not failure. After a freshly opened PR, retry briefly if GitHub reports no checks yet; checks can lag PR creation. If the repo genuinely has no checks, say so.

## Review Request Modifier

For `yeet review` or an explicit Codex-review request, post the current documented Codex review trigger as a separate PR comment:

```bash
gh pr comment "$pr_url_or_number" --body "@codex review"
```

Use exactly `@codex review` unless the user adds focus text after that prefix. Do not put the review request in the PR body. If posting the comment fails, keep the PR published and report the comment failure clearly.

## Safety Rules

- Do not push unrelated work.
- Do not silently create a broad PR from a mixed worktree.
- Do not use destructive cleanup commands.
- Do not amend, rebase a shared branch, or force-push unless the user or repo policy clearly asks for it.
- Do not merge automatically.
- Do not request non-Codex human reviewers unless the user asks.
- Do not dump raw terminal transcripts or commit logs into the PR body.
