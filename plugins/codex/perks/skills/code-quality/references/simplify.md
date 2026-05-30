# Simplify Reference

This reference preserves the simplify lane rules. If the invocation is read-only, perform the same review passes and report findings without editing. If subagents are unavailable, or this lane is being used inside a read-only reviewer, run the same three passes yourself before fixing or reporting.

Review all changed files for reuse, structural simplicity, AI-generated code slop, quality, and efficiency. Fix any issues found while preserving behavior unless the user explicitly asks for behavior changes.

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

Tell each agent to use available skills, plugins, repo instructions, and repo review guidance when they apply to the changed code.

### Agent 1: Reuse and Structural Simplification Review

For each change:

1. **Search for existing utilities and helpers** that could replace newly written code. Use `rg` to find similar patterns elsewhere in the codebase — common locations are utility directories, shared modules, and files adjacent to the changed ones.
2. **Flag any new function that duplicates existing functionality.** Suggest the existing function to use instead.
3. **Flag any inline logic that could use an existing utility** — hand-rolled string manipulation, manual path handling, custom environment checks, ad-hoc type guards, and similar patterns are common candidates.
4. **Look for structural simplifications** that preserve behavior while deleting branches, modes, helper layers, special cases, or concepts.
5. **Ask whether a clearer reframing would delete the problem instead of polishing it.** Prefer changing the model, ownership boundary, or default flow when that removes whole concepts, branches, modes, or helper layers.
6. **Flag refactors that move complexity around without reducing it.** Prefer reframing the model, ownership boundary, or default flow so less code is needed.
7. **Flag feature-specific logic added to shared or unrelated paths.** Push logic toward the canonical package, module, helper, or abstraction that already owns the concept.
8. **Flag new ad-hoc conditionals and one-off flags** that make an existing flow harder to reason about. Prefer a clearer model, dispatcher, policy object, or focused helper.
9. **Notice changed files that are becoming hard to navigate.** Large files are not automatically wrong, especially generated outputs, data files, JSON layouts, or codebases where the format is inherently bulky. When a source file becomes mixed-purpose, crosses a locally unusual size threshold, or nears roughly 1,000 lines without a clear reason, consider whether focused modules with descriptive names would make future changes easier.

### Agent 2: AI Slop and Code Quality Review

Review the same changes for AI-generated slop and hacky patterns:

1. **Redundant state**: state that duplicates existing state, cached values that could be derived, observers/effects that could be direct calls.
2. **Parameter sprawl**: adding new parameters or booleans to a function instead of generalizing or restructuring existing ownership.
3. **Copy-paste with slight variation**: near-duplicate code blocks that should be unified with a shared abstraction or a simpler single flow.
4. **Leaky abstractions**: exposing internal details that should be encapsulated, or breaking existing abstraction boundaries.
5. **Stringly-typed code**: using raw strings where constants, enums (string unions), or branded types already exist in the codebase.
6. **Needless abstraction**: pass-through wrappers, single-use helper layers, identity helpers, speculative indirection, or generic mechanisms that hide a simple data shape.
7. **Over-defensive code**: try/catch around code that cannot throw, null checks on values that are never null, fallback defaults that can never trigger, and broad "just in case" guards that hide invariants.
8. **Verbose naming**: names that restate the type or context (`userDataObject`, `handleOnClickEvent`), or names padded with unnecessary qualifiers.
9. **Dead code / debug leftovers**: unused imports, unreachable branches, stale feature flags, `console.log` statements, commented-out code blocks, and abandoned TODO scaffolding.
10. **Unnecessary comments and narration**: comments that restate obvious code, explain what changed instead of why it must exist, or sound like implementation notes from an AI draft.
11. **Cast-heavy or loose contracts**: `any`, `unknown`, forced casts, unnecessary optionality, or ad-hoc object shapes used to bypass clear type boundaries.
12. **Boilerplate scaffolding**: placeholder helpers, generic adapters, empty extension points, or configuration surfaces that were added because they seem reusable but are not needed by the current design.
13. **Inconsistent local style**: code that ignores the surrounding file's naming, error handling, import organization, testing pattern, or component/module shape in a way that makes the change look pasted in.

### Agent 3: Efficiency Review

Review the same changes for efficiency:

1. **Unnecessary work**: redundant computations, repeated file reads, duplicate network/API calls, N+1 patterns
2. **Missed concurrency**: independent operations run sequentially when they could run in parallel
3. **Hot-path bloat**: new blocking work added to startup or per-request/per-render hot paths
4. **Unnecessary existence checks**: pre-checking file/resource existence before operating (TOCTOU anti-pattern) — operate directly and handle the error
5. **Memory**: unbounded data structures, missing cleanup, event listener leaks
6. **Overly broad operations**: reading entire files when only a portion is needed, loading all items when filtering for one

## Phase 3: Fix Issues

Wait for all three agents to complete. Aggregate their findings and fix each issue directly. Prefer deleting complexity over rearranging it. If a finding is a false positive or not worth addressing, note it and move on — do not argue with the finding, just skip it.

Do not accept a change merely because tests pass if it leaves obvious AI slop, needless indirection, or a more tangled local design. If a structural cleanup is valid but too large to handle safely in the current pass, leave a short follow-up note with the exact scope.

After all fixes, run quality gates:

- Run the relevant subset of the project's test suite covering changed files
- Run lint if configured
- Run typecheck if configured
- Verify the diff is minimal and scoped — no unrelated changes crept in

## Explanation Style

Explain cleanup work for a smart non-engineer who understands the project but not coding terminology.
Start with the simple version: what was messy, what changed, and why it matters in practical terms.
Use plain English for technical ideas; if a term is necessary, define it in one short everyday sentence.
Prefer short paragraphs and concrete file references over dense engineering language or raw code.

When done, briefly summarize what was fixed (or confirm the code was already clean).
