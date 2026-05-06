# Scoring rubric

Use this rubric to rank the **top 5** refactor candidates and select **exactly one**.

## Principles

- **Evidence beats optimism.** Score only what you can support with repository evidence.
- **Blast radius is real.** A high-payoff refactor can still lose if it risks breaking core flows.
- **Verification matters.** Prefer refactors you can prove safe with existing tests/builds.
- **Keep it bounded.** If the best idea is too big, shrink it until it is safely shippable.

## Dimensions (1–5)

Score each dimension from **1 (bad)** to **5 (excellent)**.

### Payoff

How much does this refactor improve the codebase per unit time?

- **5:** Removes a major source of complexity/duplication that shows up everywhere; unlocks velocity across many features; reduces bug surface meaningfully.
- **3:** Improves a recurring annoyance for one subsystem or a small set of teams.
- **1:** Mostly cosmetic or narrow; little leverage.

Signals to cite:

- Number of call sites / repeated patterns
- Contradictory implementations of the same concept
- Boilerplate removed per feature
- Historical bugs implied by defensive call-site code (e.g., repeated workarounds)

### Blast radius

How widely can this change impact runtime behavior?

- **5 (low blast radius):** Localized module/package; minimal public API changes; consumers are few and easy to update.
- **3:** Touches a shared package with moderate fan-out, but has clear seams and good tests.
- **1 (high blast radius):** Core primitives or cross-cutting concerns with many consumers; hard-to-test or behavior-sensitive.

### Risk

Likelihood of introducing subtle regressions.

- **5 (low risk):** Refactor is mostly structural; behavior can be locked down by tests; clear invariants; easy rollback.
- **3:** Some semantic coupling but manageable with staging.
- **1 (high risk):** Behavior is poorly understood, poorly tested, or highly stateful; changes may cause production-only issues.

### Cost

Effort and time to complete safely.

- **5 (low cost):** Small, clear scope; can be done in a day or two; limited coordination.
- **3:** Multiple modules or migration steps; likely a week.
- **1 (high cost):** Large migration, coordination, long tail cleanup.

### Confidence

How confident you are *based on evidence*.

- **5:** You can point to concrete duplication/scatter and you understand dependency edges; tests or build gates exist.
- **3:** The shape is clear but some unknowns remain.
- **1:** The candidate is based on hunches or partial reading.

## Suggested weighting

Prefer a simple weighted score to force decisiveness.

- **Weighted Score = (2 × Payoff) + (1 × Blast radius) + (1 × Confidence) − (2 × Risk) − (1 × Cost)**

Notes:

- Blast radius is scored as **low blast radius = higher score**.
- Risk is scored as **high risk = lower score**.

If two candidates are close (within ~2 points), choose the one with:

- Better verification gates
- Narrower scope
- Easier rollback

## “Too big” downgrading rule

If the best candidate has a poor Risk or Cost score, shrink the refactor until:

- You can stage it behind compatibility adapters
- You can verify it with existing CI/test gates
- You can ship it incrementally

The goal is **one refactor that ships safely**, not a perfect architecture.
