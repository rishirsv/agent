# Verification And Cleanup

Read this before calling a bug fixed, especially after temporary instrumentation or manual reproduction.

## Verification Ladder

Use the smallest check that proves the original failure changed, then add broader checks only when they are relevant.

1. Original repro: the same command, test, UI flow, request, or manual steps that failed before.
2. Regression guard: a focused unit/integration/e2e test when practical.
3. Adjacent checks: typecheck, lint, local build, or suite slice covering the touched files.
4. Human verification: user reruns the exact flow when the agent cannot access the app, credentials, hardware, external system, or judgment call.

Do not substitute a broad passing suite for the original repro if the original failure can still be checked.

## Verification Notes

Record commands and outcomes precisely:

```text
Baseline: `npm test -- auth-reset.test.ts` failed with missing token branch.
After fix: `npm test -- auth-reset.test.ts` passed.
Cleanup check: `python scripts/probe_inventory.py --root .` returned no markers.
```

If a command cannot run, say why: missing dependency, unavailable service, credentials, sandbox limit, production-only data, or time/resource constraint.

## Manual Reproduction

When the user must reproduce:

- Give exact steps, starting URL or command, account/environment assumptions, and what to observe.
- Ask for the smallest result: pass/fail plus the relevant visible error, log, or screenshot.
- Keep the instrumentation in place only until the manual result is captured.
- Remove probes after the user confirms the result or after enough evidence is collected to refine the next probe.

## Cleanup Checklist

Before final response, verify:

- Temporary probes and `DEBUG_AGENT_PROBE` markers are gone.
- Collector tokens, URLs, scratch files, and local-only config are gone or intentionally gitignored.
- No debug logs expose secrets or personal data in tracked files.
- No broad formatting churn hides the actual fix.
- The final diff contains the minimal fix plus any justified regression test.
- Verification was rerun after cleanup if cleanup touched executable code.

Run:

```bash
python scripts/probe_inventory.py --root .
```

A nonzero result means cleanup is incomplete unless the remaining marker is intentionally in test fixture text or documentation; if so, state that exception.

## Final Report Pattern

Use this when the debugging session made code changes:

```text
Root cause: <precise mechanism> proven by <runtime/test/log evidence>.
Fix: <minimal change> in <files>.
Verification: <commands/repro> passed; <manual verification> pending if applicable.
Cleanup: temporary probes removed; probe inventory passed.
Remaining risks: <only material residual uncertainty>.
```

If the root cause remains unresolved, do not soften the result. Say no proven root cause was found and give the next narrow probe or missing input.
