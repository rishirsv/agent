---
name: simplify
description: "Use when cleaning up recent code changes for clarity, reuse, quality, and efficiency."
---

# Simplify

Review all changed files for reuse, quality, and efficiency. Fix any issues found.

## Phase 1: Identify Changes

Run `git diff` (or `git diff HEAD` if there are staged changes) to see what changed. If there are no git changes, review the most recently modified files that the user mentioned or that you edited earlier in this conversation.

### Behavior Lock (optional deep cleanup only)

Activate this phase when the user explicitly asks to "deslop", "clean up AI output", or passes a scoped file list.

1. Identify behavior that must not change in the target files
2. Check if existing tests cover that behavior — run them
3. If critical behavior is untested, add the narrowest regression test needed before editing
4. Skip this phase for routine /simplify runs where changes are small and well-tested

## Phase 2: Launch Three Review Agents in Parallel

Spawn subagents to launch all three `worker` agents concurrently in a single message. Pass each agent the full diff so it has the complete context.

### Agent 1: Code Reuse Review

For each change:

1. **Search for existing utilities and helpers** that could replace newly written code. Use `rg` to find similar patterns elsewhere in the codebase — common locations are utility directories, shared modules, and files adjacent to the changed ones.
2. **Flag any new function that duplicates existing functionality.** Suggest the existing function to use instead.
3. **Flag any inline logic that could use an existing utility** — hand-rolled string manipulation, manual path handling, custom environment checks, ad-hoc type guards, and similar patterns are common candidates.
4. **Dead code / debug leftovers**: unused imports, unreachable branches, stale feature flags, `console.log` statements, commented-out code blocks

### Agent 2: Code Quality Review

Review the same changes for hacky patterns:

1. **Redundant state**: state that duplicates existing state, cached values that could be derived, observers/effects that could be direct calls
2. **Parameter sprawl**: adding new parameters to a function instead of generalizing or restructuring existing ones
3. **Copy-paste with slight variation**: near-duplicate code blocks that should be unified with a shared abstraction
4. **Leaky abstractions**: exposing internal details that should be encapsulated, or breaking existing abstraction boundaries
5. **Stringly-typed code**: using raw strings where constants, enums (string unions), or branded types already exist in the codebase-
6. **Needless abstraction**: pass-through wrappers, single-use helper layers, speculative indirection that adds a level without adding value
7. **Over-defensive code**: try/catch around code that can't throw, null checks on values that are never null, fallback defaults that can never trigger
8. **Verbose naming**: names that restate the type or context (`userDataObject`, `handleOnClickEvent`), or names padded with unnecessary qualifiers

### Agent 3: Efficiency Review

Review the same changes for efficiency:

1. **Unnecessary work**: redundant computations, repeated file reads, duplicate network/API calls, N+1 patterns
2. **Missed concurrency**: independent operations run sequentially when they could run in parallel
3. **Hot-path bloat**: new blocking work added to startup or per-request/per-render hot paths
4. **Unnecessary existence checks**: pre-checking file/resource existence before operating (TOCTOU anti-pattern) — operate directly and handle the error
5. **Memory**: unbounded data structures, missing cleanup, event listener leaks
6. **Overly broad operations**: reading entire files when only a portion is needed, loading all items when filtering for one

## Phase 3: Fix Issues

Wait for all three agents to complete. Aggregate their findings and fix each issue directly. If a finding is a false positive or not worth addressing, note it and move on — do not argue with the finding, just skip it.

After all fixes, run quality gates:

- Run the relevant subset of the project's test suite covering changed files
- Run lint if configured
- Run typecheck if configured
- Verify the diff is minimal and scoped — no unrelated changes crept in

When done, briefly summarize what was fixed (or confirm the code was already clean).
