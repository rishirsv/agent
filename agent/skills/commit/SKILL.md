---
name: commit
description: "Use when the user asks to commit local work, create git commits, stage intended changes, split changes into logical commits, write or improve a commit message, run git commit, or explicitly commit and push the current branch; not for opening pull requests, publishing draft PRs, existing PR handling, or CI repair."
---

# Commit

Create clean git commits from intended changes without sweeping unrelated work into history. Push only when the user explicitly asks for the push modifier.

## References

- Read [scope-and-staging.md](references/scope-and-staging.md) before staging, splitting, or committing a dirty worktree.
- Read [message-style.md](references/message-style.md) before writing or improving a commit message.

## Workflow

1. Inspect git state, branch, staged diff, unstaged diff, untracked files, and recent commit style.
2. Infer the intended commit scope from the user request, staged files, changed files, and work done in this session.
3. Decide whether the work should be one commit or several logical commits. Split unrelated changes instead of hiding them in one message.
4. Stage only intended paths for the next commit. Preserve user-staged changes when they already match the requested scope.
5. Review the staged diff before committing.
6. Write the commit message from the staged diff, following [message-style.md](references/message-style.md) and the repo's recent history.
7. Commit locally only when the user asked to commit. If the user only asked for a message, output the message and stop.
8. If the user explicitly asked to push, follow the Push Modifier section after the commit succeeds.
9. Report the commit SHA, subject, files included, validation evidence, push state, and any uncommitted work left behind.

## Preflight

Start with:

```bash
git status --short
git status -sb
git diff --stat
git diff --staged --stat
git diff --name-only
git diff --staged --name-only
git branch --show-current
git remote -v
git log --oneline -10
```

Inspect full diffs only as needed:

```bash
git diff -- path/to/file
git diff --staged -- path/to/file
```

If nothing is staged and no intended unstaged changes are clear, ask one concise scope question. If the user asked only for a commit message and nothing is staged, say there is no staged diff to summarize.

## Staging And Splitting

Prefer explicit path staging:

```bash
git add -- path/to/file another/path
```

Avoid `git add -A` unless the entire worktree clearly belongs to the same requested commit. If only part of a file belongs in the commit, use an interactive or patch-based staging path only when it can be done safely; otherwise ask one concise question.

When multiple commits are appropriate, commit the most independent or foundational slice first, then re-check status before each next commit.

## Commit Message

Default to Conventional Commits when the repo has no stronger local style. Follow recent repo history when it is clear and consistent.

Use a temp file for multi-line messages:

```bash
git commit --file "$message_file"
```

Use a single `-m` only for simple one-line commits:

```bash
git commit -m "type(scope): subject"
```

Do not add AI attribution trailers such as generated-by or co-authored-by unless the repo or user explicitly asks for them.

## Push Modifier

Treat `commit push`, `$commit push`, `commit and push`, and `save and push` as explicit push requests. Do not infer push intent from plain `commit`, `save`, or `checkpoint`.

Push only after the intended local commit exists. If there is nothing to commit but the user explicitly asked to push existing local commits, inspect the branch and push only if the branch/upstream state is clear.

Before pushing, check:

```bash
git status -sb
git branch --show-current
git symbolic-ref --short refs/remotes/origin/HEAD
git rev-parse --abbrev-ref --symbolic-full-name @{u}
```

If the branch has an upstream, push normally:

```bash
git push
```

If the branch has no upstream and is a suitable feature/work branch, set tracking explicitly:

```bash
git push -u origin "$(git branch --show-current)"
```

Stop and ask one concise question before pushing when the branch is detached, the remote is unclear, the current branch appears to be the repo default branch, or the push would require force. Do not open a pull request from this skill; if the user asks to publish or open a PR, hand off to `publish-pr`.

## Validation

Run relevant validation when it is obvious, cheap, and not already fresh from the session. Prefer targeted tests for the changed area over broad suites by default.

If validation is skipped, say why in the final report. Do not invent validation evidence from the commit message or diff.

## Boundaries

- Do not push unless the user explicitly uses the push modifier.
- Do not open a pull request.
- Do not merge, rebase shared history, amend existing commits, or force-push unless the user explicitly asks.
- Do not commit unrelated user work.
- Do not silently discard or revert files.

If the user asks to publish, open a PR, create a draft PR, or send the work for review, commit the intended local work first when needed, then hand off the publication portion to `publish-pr`.
