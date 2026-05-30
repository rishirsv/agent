# Architecture-Refinement Reference

Use this lane when the user wants to refine or improve codebase architecture, find module-deepening opportunities, or record architecture/code-quality debt. This lane is tracker-first: it does not edit the code that has the problem.

Look for architectural friction, shallow modules, leaky seams, and awkward test surfaces. Use consistent architecture language and turn findings into actionable follow-up work rather than live refactors.

## Contract

- Analyze and record findings; do not edit the problem code.
- Use parallel review workers as the default review engine. If subagents are unavailable, run the same reviews yourself as separate passes.
- Preserve the target repo's tracker format when one exists.
- Merge into existing related entries instead of duplicating them.
- Prefer actionable evidence over architecture essays.
- Use domain vocabulary from the repo when it exists.
- If a finding is speculative, mark it as speculative and explain what evidence would confirm it.
- If a finding conflicts with an existing architecture decision or ADR, record it only when the current friction is strong enough to justify reopening the decision.
- If the user asks for implementation, stop this lane, make the scope change explicit, then switch to the simplify or hard-cut lane.

## Inputs And Outputs

Use the user's requested scope, current git state and recent diffs, relevant code, tests, validation commands, docs, architecture decisions, domain vocabulary, existing tracker entries, and evidence gathered from repo inspection.

Produce repo-native tracker updates plus a concise chat summary. If no tracker exists, ask for the tracker path before creating one.

## Vocabulary

Use this vocabulary consistently:

- **Module**: anything with an interface and an implementation, including a function, class, package, screen, workflow, or slice.
- **Interface**: everything a caller must know to use the module correctly: types, invariants, ordering constraints, error modes, configuration, and performance characteristics.
- **Implementation**: the code inside a module.
- **Depth**: leverage at the interface. A deep module gives callers a lot of behavior through a small interface; a shallow module's interface is nearly as complex as its implementation.
- **Seam**: where an interface lives; a place behavior can be altered without editing in place.
- **Adapter**: a concrete thing satisfying an interface at a seam.
- **Leverage**: what callers get from depth: more capability per unit of interface they must learn.
- **Locality**: what maintainers get from depth: change, bugs, knowledge, and verification concentrated in one place.

Principles:

- Depth is a property of the interface, not the implementation.
- The interface is the test surface; tests that must reach past it are a signal that the module may be the wrong shape.
- Use the deletion test: if deleting the module makes complexity vanish, it is probably pass-through; if the complexity reappears across callers, the module may be earning its keep.
- One adapter usually means a hypothetical seam; two adapters usually means a real seam.

## Signals To Look For

Look for opportunities where a deeper module would improve locality, leverage, or testability:

- Understanding one concept requires bouncing through many small modules.
- A module's interface exposes nearly as much complexity as its implementation.
- Callers must know ordering, flags, retries, validation details, persistence shape, or failure modes that should live behind one interface.
- Pure functions were extracted for testability, but real bugs live in orchestration across callers.
- Tests mock internals, reach past interfaces, or duplicate setup across many files.
- The same concept appears under different names in multiple modules.
- Feature-specific logic leaked into shared modules or unrelated paths.
- New flags, adapters, or hooks exist for only one current variation.
- A shared module is shallow glue, but deleting it would not move meaningful complexity back to callers.
- Validation gaps make later refactors risky.
- Hot-path work, broad file reads, repeated computation, or N+1 behavior is caused by scattered ownership.

## Workflow

### 1. Identify Scope And Evidence

Inspect the repo before scanning:

```bash
git status -sb
git diff --stat
rg --files
```

Read only the docs and code needed to understand the requested scope. Build a small map of entry points, runtime paths, core interfaces, state and data ownership, persistence, network or external adapters, tests, validation commands, architecture docs, ADRs, domain glossaries, and tracker entries.

Honor the user's scope:

- A screen means scan the screen, model/state/data path, adjacent tests, and nearby shared modules.
- A repo area means scan that directory/module plus callers and tests needed to understand the interface.
- A logic flow means scan entry points, outputs, invariants, and verification surface.
- A file list means stay focused on those files and directly related callers/helpers.

For a general scan, map first, then inspect 2-4 high-signal slices:

1. Recent git changes or recently modified files.
2. Core modules, workflows, screens, packages, or runtime surfaces.
3. Existing architecture docs, ADRs, domain glossaries, plans, or tracker files.
4. Tests, validation commands, CI config, and known verification gaps.

For deep cleanup, generated-code cleanup, or scoped file-list scans:

1. Identify behavior that must not change in the target files.
2. Check whether existing tests cover that behavior.
3. If critical behavior is untested, record the narrowest regression test needed before implementation.
4. Skip this behavior lock for routine scans where changes are small and well-tested.

### 2. Locate The Tracker

Find the output target in this order:

1. Use the tracker path named by the user.
2. Use an existing repo-native tracker or backlog from `AGENTS.md`, `README.md`, docs indexes, or common paths such as `WORK-TRACKER.md`, `TECH-DEBT.md`, `docs/TECH-DEBT.md`, `docs/tech-debt.md`, or `BACKLOG.md`.
3. If no tracker exists, ask the user where to record findings and which filename matches their convention. Do not create a tracker unprompted.

Only when the user confirms a path, create the file and seed it with a short maintenance note: entries need evidence, location, why it matters, suggested improvement, and verification; merge related findings; update status as work moves.

### 3. Launch Review Agents In Parallel

Spawn subagents to launch three worker agents concurrently in a single message. Pass each agent the full diff or scoped evidence packet so it has the complete context.

Each worker must:

- Use available skills, plugins, repo guidance, and repo review guidance when they apply to the scanned code.
- Consider the architecture vocabulary and principles above.
- Return tracker-ready findings with evidence, representative files, recommendation strength, and verification expectations.
- Return no implementation patches.

If subagents are unavailable, run the same three reviews yourself as separate passes before aggregating findings.

#### Agent 1: Reuse, Structure, And Architecture Review

For each change or scoped area:

1. **Search for existing utilities and helpers** that could replace newly written code. Use `rg` to find similar patterns elsewhere in the codebase. Common locations are utility directories, shared modules, and files adjacent to the changed ones.
2. **Flag any new function that duplicates existing functionality.** Suggest the existing function to use instead.
3. **Flag any inline logic that could use an existing utility**: hand-rolled string manipulation, manual path handling, custom environment checks, ad-hoc type guards, and similar patterns are common candidates.
4. **Look for structural simplifications** that preserve behavior while deleting branches, modes, helper layers, special cases, or concepts.
5. **Flag refactors that move complexity around without reducing it.** Prefer reframing the model, ownership boundary, or default flow so less code is needed.
6. **Flag feature-specific logic added to shared or unrelated paths.** Push logic toward the canonical package, module, helper, or abstraction that already owns the concept.
7. **Flag new ad-hoc conditionals and one-off flags** that make an existing flow harder to reason about. Prefer a clearer model, dispatcher, policy object, or focused helper.
8. **Flag shallow modules** where the interface is nearly as complex as the implementation.
9. **Apply the deletion test** to suspected pass-through modules: if deleting the module makes complexity vanish, it was not earning its keep; if complexity reappears across many callers, it may be worth deepening.
10. **Flag leaky seams** where callers must know implementation details.
11. **Flag concepts spread across many files** when one deeper module could improve locality.
12. **Flag interfaces that make tests reach into internals** instead of exercising behavior through the public seam.
13. **Flag seams with only one adapter** unless the variation is imminent and concrete.

Favor findings where reuse or simplification also improves module depth, leverage, or locality.

#### Agent 2: Code Quality Review

Review the same changes or scoped area for quality problems and drafted-code patterns:

1. **Redundant state**: state that duplicates existing state, cached values that could be derived, observers/effects that could be direct calls.
2. **Parameter sprawl**: adding new parameters or booleans to a function instead of generalizing or restructuring existing ownership.
3. **Copy-paste with slight variation**: near-duplicate code blocks that should be unified with a shared abstraction or a simpler single flow.
4. **Leaky abstractions**: exposing internal details that should be encapsulated, or breaking existing abstraction seams.
5. **Stringly-typed code**: using raw strings where constants, enums, string unions, or branded types already exist in the codebase.
6. **Needless abstraction**: pass-through wrappers, single-use helper layers, identity helpers, speculative indirection, or generic mechanisms that hide a simple data shape.
7. **Over-defensive code**: try/catch around code that cannot throw, null checks on values that are never null, fallback defaults that can never trigger, and broad "just in case" guards that hide invariants.
8. **Verbose naming**: names that restate the type or context (`userDataObject`, `handleOnClickEvent`), or names padded with unnecessary qualifiers.
9. **Dead code / debug leftovers**: unused imports, unreachable branches, stale feature flags, `console.log` statements, commented-out code blocks, and abandoned TODO scaffolding.
10. **Unnecessary comments and narration**: comments that restate obvious code, explain what changed instead of why it must exist, or sound like implementation notes from a draft.
11. **Cast-heavy or loose contracts**: `any`, `unknown`, forced casts, unnecessary optionality, or ad-hoc object shapes used to bypass clear type seams.
12. **Boilerplate scaffolding**: placeholder helpers, generic adapters, empty extension points, or configuration surfaces that were added because they seem reusable but are not needed by the current design.
13. **Inconsistent local style**: code that ignores the surrounding file's naming, error handling, import organization, testing pattern, or module shape in a way that makes the change look pasted in.

Tie quality findings back to architecture when possible: explain whether the problem weakens locality, expands an interface, leaks an implementation detail, or hides a useful invariant.

#### Agent 3: Efficiency And Verification Review

Review the same changes or scoped area for efficiency and confidence:

1. **Unnecessary work**: redundant computations, repeated file reads, duplicate network/API calls, N+1 patterns.
2. **Missed concurrency**: independent operations run sequentially when they could run in parallel.
3. **Hot-path bloat**: new blocking work added to startup or per-request/per-render hot paths.
4. **Unnecessary existence checks**: pre-checking file/resource existence before operating: operate directly and handle the error.
5. **Memory**: unbounded data structures, missing cleanup, event listener leaks, retained references.
6. **Overly broad operations**: reading entire files when only a portion is needed, loading all items when filtering for one.
7. **Verification gaps**: important behavior that lacks a focused test, manual check, or validation command.
8. **Awkward test surfaces**: tests that must reach past the interface or mock internals because the module shape lacks depth or locality.

Tie efficiency and verification findings back to architecture when possible: the strongest entries explain which module, interface, or seam should own the improvement.

### 4. Aggregate And Triage Findings

Wait for all three agents to complete. Aggregate their findings before editing the tracker. Prefer deleting complexity over rearranging it when describing the suggested improvement.

Explore organically. Do not follow a rigid checklist when the code points somewhere more important.

Do not treat code as healthy merely because tests pass if it leaves needless indirection, weak locality, loose contracts, drafted scaffolding, or a more tangled local design. Skip false positives without debate.

For each candidate, capture:

- Files or modules involved.
- Problem: what architectural friction exists.
- Suggested improvement: what should move behind which interface or seam.
- Benefit: locality, leverage, testability, efficiency, or verification confidence.
- Recommendation strength: `Strong`, `Worth exploring`, or `Speculative`.
- Verification expected after implementation.

Record only findings actionable enough to guide later work.

Prefer findings with:

- repeated friction across callers, tests, or workflows
- clear locality or leverage gain
- duplicated logic that should move behind one interface
- a shared module absorbing feature-specific complexity
- a validation gap that makes future changes risky
- pass-through layers, over-defensive code, or drafted scaffolding that obscures the intended model
- efficiency risk caused by scattered ownership

Skip or downgrade:

- pure preferences without evidence
- refactors that only move complexity around
- one-off polish that belongs in ordinary code review
- findings already represented by a current tracker item

Recommendation strengths:

- `Strong`: clear evidence, meaningful locality/leverage or risk reduction, bounded next step.
- `Worth exploring`: plausible improvement, enough evidence to investigate.
- `Speculative`: weak evidence; record only if useful for future exploration.

### 5. Update The Tracker

Preserve the current tracker style. If there is no style, use this fallback:

```markdown
### <short title>

- Recommendation: Strong | Worth exploring | Speculative
- Evidence: <scan date, user request, PR/comment id, command, or other evidence>
- Where: <file/module/area>
- Finding: <what is causing friction>
- Why it matters: <risk, maintenance cost, locality/leverage loss, or user impact>
- Suggested improvement: <bounded architecture or simplification direction>
- Verification: <focused check, test, review, or manual proof expected after implementation>
```

Do not dump raw notes into the tracker. Preserve the evidence and summarize the actionable debt.

After updating the tracker, run tracker quality gates:

- Verify entries are minimal and scoped; no unrelated tracker churn crept in.
- Verify every new entry has evidence, location, why it matters, suggested improvement, and verification.
- Run a relevant non-mutating validation command only if needed to confirm evidence or identify the expected verification.
- Do not run broad test, lint, or typecheck commands just to prove no code changed.

### 6. Report Back

Summarize:

- Tracker path updated or created.
- Number of entries added, merged, skipped, or downgraded.
- Top recommendation and why it is first.
- Areas scanned and intentionally left unscanned.

Do not claim fixes were made.
