---
name: refactor
description: "Use when choosing the single highest-value refactor for a codebase based on payoff, cost, and risk, with an evidence-backed recommendation and execution plan."
---

# Refactor

## Operating stance

- **Be autonomous and decisive.** Do not ask clarifying questions. If something is ambiguous, choose the safest reasonable default, write down the assumption, and proceed.
- **Pick exactly one refactor.** Not a laundry list. Find the *highest value per unit risk and effort*.
- **Stay evidence-driven.** Base claims on what you can point to in the repository: file paths, call sites, duplication, tests, docs. Avoid speculative rewrites.
- **Keep the code working.** Preserve behavior. Prefer refactors that are easy to validate with existing tests/builds.
- **Prioritize architectural ROI.** Optimize for: blast radius vs payoff, cognitive load reduction, bug surface area reduction, velocity unlock, and risk tolerance.
- **Avoid traps.** No cosmetic cleanup, no "boil the ocean", no speculative abstractions, no rewriting stable working components.

## Default workflow

Follow these steps in order. Do not skip steps unless the repo is tiny.

### 1) Establish scope, constraints, and "definition of safe"

- Infer constraints from repo signals (docs, CI config, build scripts): supported platforms, deployment model, runtime criticality, backwards-compat requirements, and test maturity.
- Create an **Assumption Ledger** (bullet list) capturing anything you must assume to proceed (e.g., "CI runs `npm test`", "monorepo packages are independent").
- Determine **verification gates** you will not cross without green signals:
  - Minimum: build/compile succeeds.
  - Prefer: unit/integration tests pass.
  - If tests are weak/absent: add *minimal* smoke verification only if required to prove correctness, otherwise choose a lower-risk refactor.

**Optional accelerators:** run `scripts/repo_probe.py` to quickly surface docs, stack signals, and hotspots.

### 2) Deep repo analysis starting from documentation

Start broad, then narrow:

1. Read **README** and any **docs/**, **ARCHITECTURE**, **DESIGN**, **ADR** or onboarding docs.
2. Identify the **system shape**:
   - Entry points (apps/services/CLIs)
   - Core packages/libraries
   - Data boundaries (DB, APIs, queues)
   - Cross-cutting concerns (config, logging, auth, networking)
3. Build a **mental model** (keep it short):
   - High-level diagram in words: layers + boundaries + direction of dependencies
   - Primary flows (request handling, job processing, UI state, etc.)
   - "Reference modules": most imported, most depended-on, or most copied patterns

**How to find reference modules quickly (evidence-first):**

- Locate entrypoints via conventions (e.g., `main.*`, `index.*`, `App.*`, `server.*`) and framework configs.
- Follow imports/dependency edges outward from the entrypoints.
- Identify central modules by:
  - Repeated imports/usages across many directories
  - "god" utilities or shared layers
  - Duplicated patterns with small differences

**Optional accelerators:**

- `scripts/duplicate_filenames.py` to expose duplicated "utility" concepts and parallel abstractions.
- `scripts/thin_wrapper_scan.py` to expose thin pass-through layers and re-export chains.

### 3) Generate the top 5 refactor candidates

Identify candidates that are *high leverage* and *bounded*. Look for:

- **Duplicate abstractions:** same concept implemented 2+ times (e.g., multiple HTTP clients, multiple config loaders).
- **Scattered single concept:** one domain idea smeared across files (e.g., feature flags, retry logic, error mapping).
- **Thin wrappers / re-export chains:** layers that add little value but increase indirection.
- **Dead/near-dead code:** unused modules, deprecated paths, old implementations still referenced "just in case".
- **Leaky abstractions:** callers compensating for a broken contract (repetitive conversions, manual error handling, repeated boilerplate around a helper).

For each candidate, collect **hard evidence**:

- Where it lives (paths)
- Who depends on it (representative call sites)
- Why it hurts (duplication count, inconsistent behavior, boilerplate, bug-prone patterns)
- Feasibility signal (tests around it, narrow API surface, ability to stage safely)

### 4) Score candidates and select one

Score all 5 candidates using the rubric in `references/scoring_rubric.md`, then **pick one**.

Selection rules:

- Default to **high payoff / low blast radius**.
- If two candidates are close, prefer the one with:
  - Better verification (tests/build coverage)
  - More local changes (fewer packages/services touched)
  - Clear rollback path
- If evidence is weak, downgrade the scope until evidence is strong.

### 5) Produce the refactor decision and plan

Write a decisive recommendation using the output template below.

Then produce an execution plan that is **small-batch, reversible, and verifiable**.

- Prefer **phases** when the refactor touches multiple packages or needs migration.
- Prefer a **single task list** when change is localized.
- Always include verification commands/steps inferred from the repo.

### 6) Implement only when explicitly requested

If the invocation clearly asks you to **implement** (or your runtime policy says to apply changes), do it safely:

- Make changes in small commits/patches.
- Keep behavior identical; do not "improve" semantics while refactoring.
- Run verification gates at the end of each phase.
- Update docs/comments only when they become wrong due to the refactor.

## Output template

Produce the following sections in order. Keep it crisp but specific.

### Assumptions

- Bullet list of assumptions you made to proceed.

### Repo mental model

- 5-12 bullets describing architecture, boundaries, and key flows.

### Top 5 refactor candidates

For each candidate:

- **Name:**
- **Evidence:** (paths + brief call-site references)
- **Why it matters:** (cognitive load, bug surface, velocity)
- **Blast radius / risk:**
- **Estimated effort:**
- **Score:** (use the rubric)

### Decision

State the single chosen refactor and why it wins.

### Current state

Describe what exists today and what pain it creates (evidence-backed).

### Proposed change

Describe the refactor at the architecture/API level. Include invariants and what must *not* change.

### Impacted areas

- **Directories:**
- **Files:** (list the expected high-touch files; include patterns if large)
- **Interfaces/entrypoints:** (APIs, public exports, consumers)

### Expected outcome

Describe measurable outcomes: fewer concepts, fewer variants, fewer call-site patterns, reduced complexity.

### Acceptance criteria

Define checkable criteria. Always include:

- Tests/builds pass.
- No behavior change (describe how verified).
- Migration complete (if any) and old path removed/disabled.

### Risks and mitigations

List real risks and how you will reduce them (staging, feature flags, compatibility adapters, targeted tests, rollback).

### Refactor plan

Provide either:

- **Phased plan** with per-phase goals, steps, and verification gates, or
- **Step-by-step task list** if it is localized.

Always include:

- Verification commands inferred from the repo.
- Rollback plan (how to revert safely if needed).

## Bundled resources

- `scripts/repo_probe.py` - quick repo signal scan (docs, stack hints, size hotspots).
- `scripts/duplicate_filenames.py` - report duplicated filenames and where they cluster.
- `scripts/thin_wrapper_scan.py` - report thin wrappers / re-export modules.
- `references/scoring_rubric.md` - scoring rubric and weighting guidance.
- `references/refactor_patterns.md` - concrete heuristics for common high-ROI refactors.
