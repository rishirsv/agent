---
name: gh-review
description: "Use when operating on GitHub pull requests in the current repository with gh CLI: triage or summarize PRs, review one PR, collect or address review comments, inspect PR-caused CI failures, capture deferred feedback, or run safe merge readiness and merge workflows. Not for non-PR code review."
---

# GH Review

Operate on GitHub PR state in the current repository. Default to read-only work unless the user explicitly asks for local fixes, tracker edits, posting, pushing, resolving, or merging.

Use the bundled collector [scripts/gh_review_collect.py](scripts/gh_review_collect.py) when it saves GitHub API work or prevents missed review state. Use detailed references only for the selected mode:

- [references/review-pr.md](references/review-pr.md) for read-only PR review.
- [references/tracker-entry.md](references/tracker-entry.md) for deferred tracker follow-up.
- [references/fix-ci.md](references/fix-ci.md) for failing PR checks.
- [references/merge.md](references/merge.md) for merge readiness and merge waves.

## Preflight

Use the current git repository as the target. Do not assume branch names, tracker paths, merge methods, or plugin install paths.

Require:

```bash
gh --version
gh auth status
git status -sb
gh repo view --json nameWithOwner,url
```

If `gh auth status` fails, stop and ask the user to authenticate with `gh auth login`.

Resolve the bundled collector without hard-coded plugin versions:

```bash
GH_REVIEW_SCRIPT="${GH_REVIEW_SCRIPT:-}"

if [ -z "$GH_REVIEW_SCRIPT" ] && [ -f "skills/gh-review/scripts/gh_review_collect.py" ]; then
  GH_REVIEW_SCRIPT="skills/gh-review/scripts/gh_review_collect.py"
fi

if [ -z "$GH_REVIEW_SCRIPT" ]; then
  GH_REVIEW_SCRIPT="$(
    find \
      "${CODEX_HOME:-$HOME/.codex}" \
      "$HOME/.claude" \
      -path '*/skills/gh-review/scripts/gh_review_collect.py' \
      -type f 2>/dev/null | head -n 1
  )"
fi

test -f "$GH_REVIEW_SCRIPT" || {
  echo "Could not find gh_review_collect.py. Set GH_REVIEW_SCRIPT to the script path." >&2
  exit 1
}
```

## Mode Selection

Choose exactly one mode. If multiple modes match, use the safest read-only mode unless the user clearly requested mutation.

- `triage`: default for vague requests, open-PR summaries, or "what needs attention?" Read-only.
- `review-pr`: review one PR by number, URL, or current branch. Read-only unless the user asks to post.
- `collect-comments`: collect review comments for one PR or a time window. Read-only.
- `address-comments`: implement clearly actionable unresolved PR feedback. Mutates local files; pushes, posts, and resolves only when requested.
- `fix-ci`: inspect failing PR checks and patch only PR-caused failures. Mutates local files; pushes only when requested.
- `tracker-follow-up`: route durable deferred feedback into the repo-native tracker. Mutates tracker docs only.
- `merge-readiness`: report blockers before merge. Read-only.
- `merge`: perform safe merges only when the user explicitly asks to merge.

## Mutation Gates

Never post comments, resolve threads, push commits, update trackers, or merge PRs unless the selected mode requires it and the user asked for that action.

Preserve unrelated work. If the worktree is dirty, isolate only the files needed for the selected review item. Do not delete branches unless the user asks.

## Mode Workflows

### Triage

Run:

```bash
python3 "$GH_REVIEW_SCRIPT" triage --format markdown
gh pr list --state open --json number,title,url,headRefName,baseRefName,isDraft,mergeable,reviewDecision,statusCheckRollup,updatedAt
```

Summarize PRs in plain language: apparent change, implementation surface, branch/base, draft/review/check/merge state, blockers, and next action. Do not mutate anything.

### Review PR

Resolve the PR from the prompt, a PR URL, a number, or the current branch. Read [references/review-pr.md](references/review-pr.md).

Use:

```bash
gh pr view <number-or-url> --json number,title,url,headRefName,baseRefName,author,state,isDraft,body
gh pr diff <number-or-url>
```

Lead with findings ordered by severity and include file/line references. Save a review body to a temporary Markdown file when useful. Do not post by default.

### Collect Comments

Use one of:

```bash
python3 "$GH_REVIEW_SCRIPT" comments --since-days 7 --format markdown
python3 "$GH_REVIEW_SCRIPT" comments --since-days 14 --format json
python3 "$GH_REVIEW_SCRIPT" comments --pr 123 --unresolved-only --format markdown
```

Classify comments before acting: defect, product follow-up, test gap, docs gap, architecture debt, cleanup, question, obsolete, praise, or no-follow-up.

### Address Comments

Resolve the PR, collect unresolved comments, and patch only clear actionable feedback:

```bash
python3 "$GH_REVIEW_SCRIPT" comments --pr <number> --unresolved-only --format markdown
gh pr view <number-or-url> --json number,title,url,headRefName,baseRefName,author,state,isDraft,mergeable,reviewDecision,statusCheckRollup,body
```

Ask only for ambiguous product decisions, won't-fix decisions, or intentional deferrals. Re-fetch comment state after local fixes when useful. Publish fixes, replies, or thread resolutions only when the user asks.

When multiple PRs have actionable review comments, prefer parallel isolated fixes over editing every PR in the main thread:

- Keep the main thread responsible for triage, assignment, re-triage, merge order, conflict decisions, and final merge.
- Assign one subagent per PR or tightly related PR stack. Use `Worker High` for these subagents.
- Tell each subagent to check out only its PR branch in an isolated worktree, collect unresolved review comments, make the narrow fix, run the smallest appropriate focused verification, and report exact changes plus residual risk.
- Do not let subagents merge PRs. They may push fixes, post replies, or resolve threads only when the user has explicitly asked for those actions.
- After subagents finish, re-fetch live PR state in the main thread, confirm comments/checks/mergeability, dry-run risky merge combinations in a clean worktree, then merge centrally.

### Fix CI

Read [references/fix-ci.md](references/fix-ci.md). Inspect failing checks and bounded logs:

```bash
gh pr view <number-or-url> --json number,title,url,headRefName,baseRefName,statusCheckRollup
gh run list --branch <headRefName> --limit 10
gh run view <run-id> --log-failed
```

Patch only failures caused by the PR branch. Do not fold unrelated lint, formatting, or flaky infrastructure work into the branch unless requested.

### Tracker Follow-Up

Read [references/tracker-entry.md](references/tracker-entry.md). Locate the repo-native tracker from user input, `AGENTS.md`, `README.md`, docs, or common tracker paths. Preserve local format and merge related entries rather than duplicating them.

Every deferred entry should include source PR/comment URL, classification, location, why it matters, simplest useful fix, and verification.

### Merge Readiness

Read [references/merge.md](references/merge.md). Prefer the collector when available:

```bash
python3 "$GH_REVIEW_SCRIPT" readiness --pr <number> --format markdown
```

Report blockers first: draft state, failing/pending checks, unresolved feedback, merge conflicts, missing tracker/doc gates, or repo-specific release gates.

### Merge

Read [references/merge.md](references/merge.md). Start with a dry plan:

```bash
python3 "$GH_REVIEW_SCRIPT" merge-plan --format markdown
gh pr list --state open --json number,title,url,headRefName,baseRefName,isDraft,mergeable,reviewDecision,statusCheckRollup,updatedAt
git status -sb
git branch --show-current
git remote -v
```

Merge only explicit targets or the safe set requested by the user. Do not pass `--delete-branch`. Re-check PR state after each merge because later PRs may change.

## Output By Mode

- `triage`: PRs, plain-language change summary, state, blockers, next action.
- `review-pr`: findings first, file/line references, verification gaps, review body path if saved.
- `collect-comments`: grouped comments, resolved/outdated/unresolved state, proposed classification.
- `address-comments`: items handled, files changed, validation run, remaining comments.
- `fix-ci`: failing checks inspected, root cause, patch, validation, residual CI risk.
- `tracker-follow-up`: tracker path, entries added or merged, source PR/comment URLs.
- `merge-readiness`: blockers first, then safe next action.
- `merge`: merged PRs, skipped PRs, preserved branches, tracker/comment follow-up.
