---
name: handoff
description: Use when creating a concise continuation handoff for another agent or future session after the user asks for a handoff, session summary, continuation brief, context transfer, next-agent instructions, a new Codex thread, or a worktree-backed continuation thread.
---

# Handoff

Create a practical continuation brief for the current task, branch, PR, issue, plan, or conversation.

Default to an inline handoff. Write a file only when the user asks for one, the handoff is too large for chat, or a durable artifact is clearly needed. If saving a file, use the user-requested path; otherwise use a clearly named temporary handoff path and report it.

## Codex Thread Handoff

When the user explicitly asks to hand work to a new Codex thread, create the thread after preparing a compact handoff prompt.

Use the smallest matching route:

- **Inline handoff**: user asks for a handoff, recap, or continuation brief.
- **Saved handoff**: user asks to save the handoff or the brief is too large for chat.
- **New thread**: user asks for a new, separate, or fresh Codex thread to continue the work in the same project.
- **New worktree thread**: user asks for a new worktree, isolated workspace, separate branch/worktree, or parallel implementation lane.
- **Forked thread**: user asks to fork this conversation or preserve completed history in the child thread.

Use `create_thread` for a new standalone continuation. For repo-scoped work, target the saved project and choose:

- `environment: { type: "local" }` when the next thread should use the current project checkout.
- `environment: { type: "worktree" }` when the next thread should run in an isolated worktree.

Use `fork_thread` when the user wants a child thread derived from this thread's completed history. Use a same-directory fork for shared-checkout continuation and a worktree fork for isolated continuation.

The new thread prompt should include the handoff content, the intended outcome, relevant paths or URLs, current branch/worktree assumptions, validation already run, validation still needed, blockers, and suggested skills. Do not include secrets or unnecessary personal data.

After a successful `create_thread`, report the created thread using the required Codex thread directive in the final response. If worktree setup is queued and returns a pending worktree id, report that pending id instead.

## Workflow

1. Identify what the next session is supposed to accomplish.
2. Summarize completed work, current state, important decisions, and active constraints.
3. Reference artifacts by path or URL instead of duplicating them.
4. List the next concrete actions in execution order.
5. Name validation already run and validation still needed.
6. Call out blockers, assumptions, risks, and unknowns.
7. Suggest only the Agent skills that would materially help the next agent.
8. If the user asked for a new thread or worktree continuation, create or fork it using the route above.

## Output

Use this shape:

```md
# Handoff: <task>

## Purpose
<what the next agent should accomplish>

## Current State
<what is done, partially done, or unchanged>

## Key Decisions
<decisions already made and why>

## Artifacts
- `<path or URL>` - <why it matters>

## Next Actions
1. <concrete next step>
2. <concrete next step>

## Validation
- Run: <checks already run>
- Still needed: <checks/manual review still needed>

## Risks And Unknowns
- <risk or assumption>

## Suggested Skills
- `$skill` - <why it helps>
```

For a thread-creation prompt, use the same sections plus a short instruction at the top:

```md
Continue this task from the handoff below. Start by reading the referenced files and repo instructions, then proceed with the next actions.
```

## Guardrails

- Do not paste secrets, tokens, private keys, or unnecessary personal data.
- Do not duplicate long content already captured in plans, PRs, commits, docs, or diffs.
- Do not hide uncertainty.
- Keep it useful to a fresh agent who will not replay the conversation.
- Do not create, fork, move, archive, pin, rename, or message Codex threads unless the user explicitly asks for thread management.
- Do not use a worktree thread when the user only asked for a normal handoff.
