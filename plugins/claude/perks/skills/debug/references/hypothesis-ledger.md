# Hypothesis Ledger

Read this when the bug is ambiguous, intermittent, cross-stack, or has more than one plausible cause. Use it to keep the investigation evidence-led instead of drifting into speculative edits.

## Ledger Template

Use this compact table in notes or the final response when helpful:

| ID | Hypothesis | Why plausible | Discriminating signal | Probe or check | Result | Status |
|---|---|---|---|---|---|---|
| H1 |  |  | What would prove or rule it out | Command, log, assertion, or runtime probe | Observed evidence only | open / supported / ruled out |

Keep hypotheses mutually distinct. “Maybe state is wrong” and “maybe props are wrong” are separate only if they would produce different observations or require different probes.

## Good Hypotheses

A useful hypothesis has four parts:

1. A concrete mechanism: the wrong branch, stale cache key, missing await, timezone conversion, race, serialization mismatch, boundary condition, permissions mismatch, version skew, data-shape mismatch.
2. A predicted observation: variable value, execution path, error code, timing, emitted event, request payload, database state, DOM state, or test assertion.
3. A cheap check: existing log, focused command, stack frame, debugger breakpoint, targeted test, or temporary probe.
4. A cleanup path: what to remove after the check.

Weak hypothesis: “the API is broken.”

Better hypothesis: “The client sends `workspaceId` as `undefined` when the route is opened from the pinned project link, so the server falls back to the user’s default workspace. Confirm by logging the route params and request body at the submit boundary.”

## Hypothesis Count

Default to three to six hypotheses. Use fewer only when the existing evidence already proves the root cause. Add more only when the first round rules everything out.

Prioritize hypotheses that explain all observed facts, can be tested cheaply, and would lead to a minimal fix. Do not prioritize a hypothesis merely because it is easy to patch.

## Evidence Labels

Use these labels consistently:

- `observed`: directly seen in logs, tests, stack traces, runtime probes, or code execution.
- `inferred`: reasoned from observed evidence and code path.
- `assumed`: plausible but not yet proven.
- `ruled out`: contradicted by a discriminating observation.

Do not call a hypothesis the root cause until it has at least one supporting observation and no unresolved contradiction that would change the fix.

## Parallel Investigation

When the runtime supports subagents or parallel workers, split only read-only exploration or independent hypothesis checks. Keep edits and final root-cause decisions in the main session. Good parallel slices:

- One worker traces the frontend path while another traces the backend path.
- One worker inspects recent diffs while another reviews failing tests.
- One worker searches similar incidents while another maps the local call graph.

Avoid parallel edits to the same files during diagnosis; they make evidence and cleanup harder to trust.

## When To Stop Probing

Stop probing and patch when one hypothesis explains the failure, predicts the observed runtime data, and points to a small fix. Continue probing when evidence is only circumstantial, the proposed patch is broad, or two hypotheses imply different fixes.

Stop and report instead of guessing when reproduction requires missing credentials, production-only data, unavailable hardware, or a risky external action the user has not approved.
