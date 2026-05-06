# Refactor patterns and evidence checklists

Use these patterns to generate candidates and gather evidence quickly. Avoid turning these into speculative rewrites.

## Duplicate abstractions consolidation

**Typical smell**

- Two or more implementations of the same concept: multiple HTTP clients, config loaders, feature-flag wrappers, date/time utilities, mappers/serializers, retry logic, error normalization, etc.
- Inconsistent semantics at the edges: one path retries, another doesn't; one maps errors differently; different timeouts; different default flags.

**Evidence to collect**

- Paths for each implementation.
- A short list of representative call sites for each.
- Concrete semantic diffs (defaults, options, error handling).
- Whether the duplication is intentional (docs/ADRs) or accidental.

**Bounded, low-risk refactor shape**

- Choose one implementation as the “source of truth”.
- Add a compatibility adapter/wrapper for the other one, then migrate call sites gradually.
- Delete the obsolete implementation when all consumers are migrated.

## Scattered single concept

**Typical smell**

- A domain concept exists everywhere but nowhere: auth decisions, permission checks, money/currency handling, pagination, retry/backoff, cache keys, idempotency, “is this resource active?” rules.
- Call sites contain repeated fragments that should be one policy.

**Evidence to collect**

- Grep/search results showing repeated patterns across directories.
- A list of “variants” (how many slightly different versions exist).
- Bugs implied by repeated defensive code.

**Bounded, low-risk refactor shape**

- Extract a small pure function/policy module with tests.
- Migrate call sites one-by-one.
- Keep old helpers as thin wrappers until migration completes.

## Thin wrappers and re-export chains

**Typical smell**

- Many small files that only re-export symbols or call through to another module.
- Layering adds indirection without enforcing invariants.

**Evidence to collect**

- List of wrapper files and what they wrap.
- Call-site confusion: imports vary, duplicate entrypoints, circular deps risk.

**Bounded, low-risk refactor shape**

- Replace chains with a single canonical import path.
- Remove wrapper layers once all call sites are migrated.

## Dead or near-dead code removal

**Typical smell**

- Deprecated modules still referenced “just in case”.
- Unused utilities; code guarded by always-false flags; abandoned feature branches.

**Evidence to collect**

- Proof of non-use: no references in repo, no exports used, feature flags removed.
- CI/test coverage for affected paths.

**Bounded, low-risk refactor shape**

- Remove or isolate the dead path behind a build-time flag.
- Add a regression test that would fail if the dead path were unexpectedly needed (when feasible).

## Leaky abstractions

**Typical smell**

- Call sites routinely compensate for a helper’s shortcomings: manual conversions, repeated try/catch, re-parsing, repeated null checks, duplicated validation.
- Abstraction claims a contract but callers do the contract work.

**Evidence to collect**

- Common “fixups” at call sites (before/after patterns).
- Bugs implied by repeated defensive logic.

**Bounded, low-risk refactor shape**

- Tighten the contract at the abstraction boundary.
- Add targeted tests for the contract.
- Migrate call sites to stop compensating.

## Quick “candidate viability” checklist

A candidate is usually viable if most are true:

- Public API surface is small.
- Dependencies are well understood.
- Tests exist (or can be added minimally).
- Migration can be staged.
- Rollback is straightforward.

A candidate is usually NOT viable (for this skill) if:

- It requires broad re-architecture.
- It depends on unknown runtime behavior that only production reveals.
- It requires simultaneous multi-team coordination without clear ownership.
