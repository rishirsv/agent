---
name: gh-review
description: "Work with GitHub pull request review operations in the current repository. Use when the user asks to summarize open PRs, triage PR state, review a PR with Codex, collect or address PR comments, fix PR CI, route deferred feedback into the repo's tracker, or merge open PRs safely using gh CLI."
---

# GH Review

Use the current git repository as the target. Do not assume a fixed repo, branch naming scheme, or tracker path.

This skill extends the upstream `gh-address-comments` idea from one open PR on the current branch into a repo-level review operations workflow.

## Preflight

Require GitHub CLI:

```bash
gh --version
gh auth status
git status -sb
gh repo view --json nameWithOwner,url
```

If `gh auth status` fails, ask the user to authenticate with `gh auth login` and stop.

Set the skill script path from the installed skill:

```bash
GH_REVIEW_SCRIPT="${CODEX_HOME:-$HOME/.codex}/plugins/cache/perks/perks/0.1.0/skills/gh-review/scripts/gh_review_collect.py"
```

When working in this repo source copy, use:

```bash
GH_REVIEW_SCRIPT="/Users/rishi/Code/perks/skills/gh-review/scripts/gh_review_collect.py"
```

## Mode Selection

Infer the mode from the user's words:

- Default or unclear: triage open PRs. Show state, review/check signals, simple non-technical summaries, implementation detail, and initial thoughts. Do not modify files.
- "review", "review it", or a PR number/URL with review intent: resolve the PR, open or prepare a fresh Codex review context, and run a normal code review.
- "address comments", "fix comments", "work through comments", "handle comments", or "address review feedback": collect unresolved review-thread state, implement clear actionable feedback, verify, then update/push the PR when requested.
- "fix CI", "checks", "failing check", or "red build": inspect failing checks/logs, patch only branch-caused failures, verify, and update the PR when requested.
- "tracker", "backlog", "follow-up", "last week", or "capture comments": collect review comments and route durable follow-up into the repo's native tracker or planning system.
- "merge", "merge PRs", "merge all open PRs", or "ship PRs": plan and execute safe PR merges without deleting branches.

If multiple modes apply, use the stronger action in this order: merge PRs, fix CI, address comments, tracker follow-up, review PR, triage PRs.

## Triage PRs

Use this mode when the prompt is vague, the user asks what PRs need attention, or no prompt is provided.

Run:

```bash
python3 "$GH_REVIEW_SCRIPT" triage --format markdown
gh pr list --state open --json number,title,url,headRefName,baseRefName,isDraft,mergeable,reviewDecision,statusCheckRollup,updatedAt
```

Summarize each PR in plain language:

- What it appears to change for a non-technical reader.
- Implementation detail: branch, likely touched area from the title/body/diff when inspected, and any notable architectural or docs surface.
- Current state: draft/ready, review decision, comments, CI/check signals, mergeability.
- Initial thought: review needed, comments need attention, CI needs investigation, merge-ready-looking, or needs clarification.

Do not modify files, post comments, push, or merge in triage mode.

## Summarize Open PRs

Run:

```bash
python3 "$GH_REVIEW_SCRIPT" open-prs --format markdown
```

Summarize:

- PR number, title, state, draft status, branch, author, updated date, and URL.
- Review decision and comment count when available.
- Apparent next step: review needed, comments need attention, CI/merge state unknown, or ready-looking.

Do not modify files in this mode.

## Review A PR With Codex

Resolve the PR from explicit number/URL, or from the user's selected open PR.

Run:

```bash
gh pr view <number-or-url> --json number,title,url,headRefName,baseRefName,author,state,isDraft,body
gh pr diff <number-or-url>
```

Then launch a reviewer sub-agent when the environment exposes one. Use the dedicated `reviewer` role or the closest available read-only code-review sub-agent, not a default implementation worker.

Give the reviewer sub-agent a compact prompt with:

- repo path
- PR URL or number
- base branch and head branch
- the user's review focus, if any
- instruction to remain read-only
- instruction to lead with findings ordered by severity
- instruction to include file/line references and verification gaps
- instruction to return a concise summary plus a Markdown-ready review body

If no reviewer sub-agent is available, perform the review in the current thread and say that the environment did not expose a reviewer sub-agent.

Save the review body to a temporary Markdown file before responding:

```bash
mkdir -p .codex/tmp/gh-review
REVIEW_FILE=".codex/tmp/gh-review/pr-<number>-review.md"
```

The temporary review file should include:

- PR title, URL, base/head branches, and review date.
- Findings first, ordered by severity.
- Open questions or assumptions.
- Verification gaps or checks not run.
- Brief implementation summary only after findings.

Return a concise chat summary and the temporary review file path. Do not post the review to GitHub by default.

If the user asks to post or push the review to GitHub, use:

```bash
gh pr comment <number-or-url> --body-file "$REVIEW_FILE"
```

After posting, report the PR URL and comment action. Do not post draft notes, uncertain findings, or empty no-issue reviews unless the user explicitly asks.

Review stance:

- Read repo review guidance first: `*review*.md`, `AGENTS.md`, `.codex/`, and relevant docs.
- Compare the PR branch against its merge base.
- Lead with findings, ordered by severity, with file and line references.
- Do not implement fixes during review mode unless the user asks to address them.

## Collect Review Comments

Default time window is 7 days. Use a longer or shorter window when the user asks.

Run one of:

```bash
python3 "$GH_REVIEW_SCRIPT" comments --since-days 7 --format markdown
python3 "$GH_REVIEW_SCRIPT" comments --since-days 14 --format json
python3 "$GH_REVIEW_SCRIPT" comments --pr 123 --format markdown
```

The script collects top-level PR comments, review bodies, and inline review-thread comments from open, merged, and closed PRs. It prints source URLs and tags resolved/outdated threads so they can be triaged instead of silently dropped.

Classify comments before deciding what to do with them:

- Actionable defect or regression risk.
- Product follow-up.
- Test gap.
- Docs gap.
- Architecture, ownership, maintainability, or verification debt.
- Cleanup.
- Won't fix or not worth carrying.
- Question or clarification.
- Already handled, obsolete, praise, or not follow-up.

## Update Tracker

Locate the target tracker:

1. Use the document named by the user.
2. Read repo instructions for tracker ownership, such as `AGENTS.md`, `README.md`, `.codex/`, or docs guidance.
3. Search likely tracker destinations, including `WORK-TRACKER.md`, `docs/TECH-DEBT.md`, `TECH-DEBT.md`, `docs/ROADMAP.md`, `docs/PARITY_CHECKLIST.md`, `docs/exec-plans/`, issue templates, or repo-specific planning docs.
4. Ask before creating a new tracker unless the user explicitly requested one.

Preserve the tracker format. Merge into existing related items instead of duplicating.

Each added item should include:

- Source PR and comment URL.
- Classification: bug follow-up, product follow-up, test gap, docs gap, architecture debt, cleanup, won't fix, or other repo-native category.
- Short title.
- Where the issue lives.
- What the reviewer noticed.
- Why it matters.
- Simplest useful fix.
- Verification.

Keep comments from merged or closed PRs as durable follow-up entries, not as live PR-resolution tasks. Only call something "tech debt" when the local tracker or classification actually fits architecture debt, owner drift, duplication, or proof debt.

## Address Comments

Use this mode when the user asks to address or fix PR comments. Resolve the PR from the supplied number/URL or the current branch.

First inspect live feedback:

```bash
python3 "$GH_REVIEW_SCRIPT" comments --pr <number> --format markdown
gh pr view <number-or-url> --json number,title,url,headRefName,baseRefName,author,state,isDraft,mergeable,reviewDecision,statusCheckRollup,body
```

Build a short numbered list of unresolved actionable items, grouped by review thread and file. Prefer GraphQL review-thread state from the script because actionable feedback can live only in inline threads.

If the user says "address all comments," proceed on clearly actionable unresolved items. Ask only for ambiguous, product-decision, won't-fix, or defer decisions.

Priority order:

1. Correctness, data loss, security, or user-visible regressions.
2. Verification gaps that block confidence in recent work.
3. Architecture or ownership debt that will make the next change harder.
4. Small cleanup that is safe and unblocks a larger item.
5. Cosmetic or preference-only comments.

For each selected item:

1. Read the source comment and nearby code.
2. Check whether the PR branch still exists and whether the feedback is already obsolete on the default branch.
3. Implement the smallest durable fix in the current repo.
4. Run focused verification.
5. Reply to or summarize handled review threads when the workflow asks for PR publication or review refresh.
6. Re-fetch review-thread state after resolving or replying when possible.
7. Update tracker entries only for intentionally deferred follow-up, not for comments fixed in the PR.

Do not resolve or hide comments on already merged/closed PRs unless the user explicitly asks.

When the user asks to update the PR, publish the fixes using the repo's normal commit/PR workflow. If the user only asked for a local pass, stop after patching and verification.

## Fix CI

Use this mode when the user's intent is failing checks rather than review comments.

Inspect:

```bash
gh pr view <number-or-url> --json number,title,url,headRefName,baseRefName,statusCheckRollup
gh run list --branch <headRefName> --limit 10
```

Patch only failures that are caused by the PR branch. Do not fold unrelated lint, formatting, or flaky infrastructure work into the branch unless the user asks.

## Merge Readiness

Use this mode when the user asks whether a PR can merge or asks for a pre-merge check.

Confirm:

- PR is not draft unless drafts were explicitly included.
- Required checks are passing or clearly optional.
- Review decision is approving/neutral, or unresolved feedback is intentionally deferred.
- Mergeability/conflicts are clear.
- Repo-specific docs, tracker, test-index, or release gates are satisfied.

Report the smallest blocker list before mutating anything.

## Merge Open PRs

When the user asks to merge open PRs, treat it as an operations workflow, not a blind batch command.

First inspect:

```bash
python3 "$GH_REVIEW_SCRIPT" open-prs --format markdown
gh pr list --state open --json number,title,url,headRefName,baseRefName,isDraft,mergeable,reviewDecision,statusCheckRollup,updatedAt
git status -sb
git branch --show-current
git remote -v
```

Create a safe merge order:

- Skip draft PRs unless the user explicitly includes drafts.
- Prefer PRs with passing required checks, no merge conflicts, and approving/neutral review state.
- Merge dependency or foundation PRs before PRs that build on them.
- Merge older low-risk PRs before newer dependent PRs when no dependency signal exists.
- Re-check the open PR list after every merge because later PRs may change mergeability.
- If two PRs touch the same files or tracker docs, merge one, update/rebase the next, then re-run checks before merging it.

For each PR:

1. Fetch review comments first if the PR has unresolved or important feedback:

   ```bash
   python3 "$GH_REVIEW_SCRIPT" comments --pr <number> --format markdown
   ```

2. If comments should become durable follow-up, update the repo-native tracker before merging.
3. Use the repo's preferred merge method if documented. Otherwise choose:
   - `gh pr merge <number> --squash` for ordinary feature/fix PRs.
   - `gh pr merge <number> --merge` when preserving multiple commits matters.
   - `gh pr merge <number> --rebase` only when the repo convention clearly prefers linear commit replay.
4. Do not pass `--delete-branch`. Do not delete local or remote branches after merge.
5. If GitHub reports the PR branch is out of date, update it with the least surprising repo-native path:
   - Prefer `gh pr checkout <number>`, `git fetch origin`, then `git rebase origin/<base>` for a normal feature branch when conflicts are manageable.
   - Use `git merge origin/<base>` instead when the repo avoids rebasing shared PR branches or when preserving branch history is safer.
   - Push the updated PR branch, wait for checks if applicable, then merge.
6. If conflicts are non-trivial, stop merging that PR, report the blocker, and continue only with independent PRs that are still safe.

After the merge wave:

- Leave branches intact.
- Confirm `gh pr list --state open`.
- Confirm the local worktree is clean or explain any intentional tracker changes.
- Report merged PRs, skipped PRs, preserved branches, tracker updates, and any follow-up comments.

## Commit Hygiene

Preserve unrelated work. If the worktree is dirty, isolate only the files needed for the selected review-debt item. Do not delete branches unless the user asks.

When the user asks to publish the fixes, use the repo's normal commit/PR workflow.
