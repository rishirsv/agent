---
name: tech-debt
description: "Use when finishing a coding session or cleanup pass to find duplicated code introduced, expanded, or exposed by the session, consolidate it into shared modules or components, remove redundant copies, and run verification."
---

# Tech Debt

Review the current session's changes and the surrounding codebase for redundant duplicated code. Consolidate real duplicates into a single shared implementation, update call sites, delete the extra copies, and verify the cleanup.

## Phase 1: Identify Session Changes

Run `git diff` to see what changed. If there are staged changes, run `git diff HEAD` so the full session is visible. If there are no git changes, review the files most recently edited in this conversation or explicitly mentioned by the user.

Create a session debt map before editing:

1. List every changed source file, every new file, and the nearest sibling directories around them.
2. Mark any new helper, component, hook, utility, formatter, mapper, selector, or wrapper added during the session.
3. Mark any copied block, repeated render shape, repeated data transform, or repeated branching logic that appears more than once in the changed area.
4. Expand the scan from the changed files outward into the nearest existing shared layers, utility folders, design-system folders, domain modules, and adjacent feature folders.
5. Ignore generated, vendored, built, cached, or lockfile paths unless the user explicitly asks to include them.

### Behavior Lock

Before deduplicating, identify behavior that must not change.

1. Check existing tests for the touched behavior and run the narrowest relevant subset first.
2. If a duplicate block is risky and untested, add the smallest regression coverage needed before moving code.
3. Keep the cleanup behavioral, not product-changing. This skill removes debt; it does not redesign features.

## Phase 2: Classify the Project Structure

Tech debt cleanup varies by project, so determine ownership before creating a shared abstraction.

Treat paths relative to the repo root and classify them into these buckets:

1. **Feature-local code**: logic used by one feature or screen. Keep it local unless two or more independent files in that feature truly share it.
2. **Domain-shared code**: logic reused across sibling features in the same product area. Prefer a domain-level shared module at the nearest common directory.
3. **App-wide shared code**: generic utilities, shared UI primitives, cross-cutting hooks, core services, and design-system components. Reuse an existing shared layer if one already exists.
4. **Platform or entrypoint code**: bootstrapping, framework entry files, platform-specific adapters, routing shells. Do not force these into a generic shared layer unless the abstraction already exists.
5. **Tests, stories, fixtures, examples**: use them as evidence, but do not let them define production ownership.

Placement rules:

1. Put the canonical implementation in the narrowest shared location that fits all real consumers.
2. If the repo already has a shared library or common module, extend it instead of creating a competing folder.
3. If no shared location exists, create the smallest new shared module at the nearest common ancestor of the real consumers.
4. Do not create a top-level `shared` or `utils` dumping ground when a tighter domain boundary is available.
5. Do not leave compatibility wrappers or duplicate fallback implementations unless the user explicitly asks for transition support.

## Phase 3: Launch Three Duplicate-Code Agents in Parallel

Spawn subagents to launch all three `worker` agents concurrently in a single message. Pass each agent the full diff, the session debt map, and the candidate directories to inspect.

### Agent 1: Exact and Near-Exact Duplicate Scan

For each changed file and nearby shared file:

1. Search for repeated function names, component names, hook names, helper names, and exported symbols.
2. Search for repeated distinctive snippets with `rg`: repeated condition chains, repeated view or layout structures, repeated object shapes, repeated literal strings, repeated transform pipelines, and repeated import clusters. Use nearby existing implementations as examples rather than assuming a specific language or UI framework shape.
3. Flag copy-paste blocks even when variable names differ slightly.
4. Report duplicate clusters with file paths, symbol names, and whether the duplication was introduced this session or already existed nearby.

### Agent 2: Structural Duplicate Scan

Review the same area for duplicates that are not text-identical but clearly perform the same job:

1. Compare parameter lists, return shapes, prop contracts, and data flow.
2. Compare control-flow order: the same guards, transforms, side effects, and final output in slightly different words.
3. Compare render skeletons: repeated component or view trees, repeated slot or layout patterns, repeated modifier or style patterns, and repeated empty, loading, or error states.
4. Flag local abstractions that are the same concept with thin naming or cosmetic variation.

### Agent 3: Consolidation and Shared-Library Scan

Review the same area to decide where the code should live after cleanup:

1. Identify the single canonical implementation that should survive.
2. Choose the correct shared destination based on the project structure rules above.
3. Flag duplicated code that should stay local because it is not actually shared behavior.
4. Describe the import and call-site updates needed to move all consumers onto the canonical implementation.

## Phase 4: Confirm What Counts as Real Tech Debt

Wait for all three agents to complete. Aggregate their findings into duplicate clusters and keep only the clusters that are real debt.

A duplicate is real tech debt when all of these are true:

1. The code has the same responsibility, not just a similar theme.
2. The inputs and outputs are materially the same, even if local names differ.
3. The behavior can be unified without crossing an invalid ownership boundary.
4. The remaining abstraction is smaller and clearer than the repeated copies.

Do not treat these as debt by default:

1. Generated code, vendor code, fixtures, snapshots, and intentionally duplicated test scaffolding.
2. Platform-specific implementations with genuinely different runtime behavior.
3. Similar code that belongs to different owners or domains.
4. Cases where a shared abstraction would become a bloated mega-helper or mega-component.

Identify the tech debt collected during the session by tagging each cluster:

1. **Introduced now**: the session created a new duplicate copy.
2. **Expanded now**: the session touched an existing pattern and added another variant or call site.
3. **Exposed now**: the duplicate already existed, but the session moved nearby enough that consolidating it is now the obvious cleanup step.

Prioritize clusters in this order:

1. Introduced now
2. Expanded now
3. Exposed now

Within each tier, prefer clusters with the most duplicated live code, the clearest shared home, and the lowest behavioral risk.

## Phase 5: Consolidate the Code

Fix the confirmed debt directly.

1. Choose one canonical implementation for each cluster.
2. Extract shared logic into the right shared module, hook, utility, component, or service based on the project structure rules.
3. Update every affected caller to import or consume the canonical implementation from that shared location.
4. Delete the redundant copies once all callers are migrated.
5. Remove dead wrappers, dead imports, stale props, stale parameters, and unused tests created only to support the duplicate copies.
6. Keep the abstraction narrow. Share the repeated behavior, not unrelated feature differences.

When components are duplicated:

1. Extract the shared primitive, presenter, or hook first if that keeps ownership clear.
2. Create a truly shared component only when the rendered behavior and API are actually the same.
3. Avoid one giant component with many mode flags if a smaller shared foundation keeps the code cleaner.

## Phase 6: Verify

After all fixes, run quality gates in this order:

1. Run the relevant subset of the test suite covering the changed files.
2. Run `npm test` when the repo provides it, or the package-manager equivalent if the project uses `pnpm`, `yarn`, or `bun`.
3. Run the linter, typically `npm run lint` or the package-manager equivalent.
4. Run typecheck if the repo provides one.
5. Verify the diff is minimal and scoped and that the duplicate implementations are actually gone.

When done, briefly summarize:

1. Which duplicate clusters were removed
2. Where the new canonical shared code lives
3. Which callers were updated
4. Any remaining duplicate cluster intentionally deferred because it was not real debt or was too risky to change in this pass

## Optional Referent: Swift/iOS

When working on a SwiftUI app, always use these skills as part of the reviews.

- Build iOS Apps plugin: use its iOS-oriented workflows and `xcodebuildmcp` support when the cleanup touches app structure, simulator verification, or platform-specific behavior.
- [SwiftUI UI Patterns](/Users/rishi/.codex/plugins/cache/openai-curated/build-ios-apps/b1986b3d3da5bb8a04d3cb1e69af5a29bb5c2c04/skills/swiftui-ui-patterns/SKILL.md): use for state ownership, layout patterns, navigation, sheets, previews, and nearby SwiftUI examples.
- [SwiftUI View Refactor](/Users/rishi/.codex/plugins/cache/openai-curated/build-ios-apps/b1986b3d3da5bb8a04d3cb1e69af5a29bb5c2c04/skills/swiftui-view-refactor/SKILL.md): use for extracting small view types, stabilizing view trees, and removing inline actions or side effects.
- [SwiftUI Performance Audit](/Users/rishi/.codex/plugins/cache/openai-curated/build-ios-apps/b1986b3d3da5bb8a04d3cb1e69af5a29bb5c2c04/skills/swiftui-performance-audit/SKILL.md): use when duplicated code may be causing invalidation fan-out, layout thrash, or runtime cost.
- [SwiftUI Liquid Glass](/Users/rishi/.codex/plugins/cache/openai-curated/build-ios-apps/b1986b3d3da5bb8a04d3cb1e69af5a29bb5c2c04/skills/swiftui-liquid-glass/SKILL.md): use when the cleanup touches iOS 26+ glass surfaces or shared glass primitives.
- [iOS App Intents](/Users/rishi/.codex/plugins/cache/openai-curated/build-ios-apps/b1986b3d3da5bb8a04d3cb1e69af5a29bb5c2c04/skills/ios-app-intents/SKILL.md): use when duplicate logic spans app intents, entities, system surfaces, or deep-link handoff paths.
- [iOS Debugger Agent](/Users/rishi/.codex/plugins/cache/openai-curated/build-ios-apps/b1986b3d3da5bb8a04d3cb1e69af5a29bb5c2c04/skills/ios-debugger-agent/SKILL.md): use when you need simulator builds, runtime inspection, UI verification, or log review after cleanup.

For non-Swift projects, follow the same pattern: use the closest platform- or framework-specific review skills available for that stack before consolidating shared code.
