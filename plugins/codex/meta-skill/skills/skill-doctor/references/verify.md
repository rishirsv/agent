# Verify

After approved edits are applied, confirm the targeted problem is resolved
without regressing the skill, then refresh the score. The doctor confirms *one*
case; `skill-evaluator` measures many tasks across conditions.

## Run the deterministic tests

```
scripts/meta-skill validate <skill-dir>
```

This runs the canonical deterministic checks from the plugin-level CLI source
tree and prints a combined **Verify-tests %** — one of the three thirds of the
Overall Quality Score. Re-running it here refreshes that third after an edit;
the same runner fills it during a Judge Review (see
[rubric.md](rubric.md)).

## Confirm the fix

- **After Diagnose:** re-run the reproduced failing case; confirm it no longer occurs.
- **After a Judge Review:** re-check that each addressed gap is now closed.

## Regression scan (quick, static)

- Verify-tests pass-rate did not drop.
- `description` not silently over-broadened (triggering unchanged unless that
  was the intended fix).
- References still resolve; no dead links.
- SKILL.md still skinny; no new drift with sibling skills or docs.

## Escalate

- Anything needing systematic, multi-scenario confidence or no-skill/current-skill
  outcome comparison → `skill-evaluator`.
- Recurring deterministic failure patterns belong in the shared
  `meta-skill/src/` checks, not worker-local script folders.
