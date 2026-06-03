# Scenario Design

Read this when creating or auditing scenario coverage for a reusable skill.

## Lifecycle

Use this loop:

```text
lint workbench
  -> add realistic scenarios
  -> run App Server-backed eval
  -> inspect traces, final outputs, artifacts, tests, judges, and feedback
  -> identify repeated failure patterns
  -> add deterministic tests where possible
  -> add optional judges only for subjective qualities
  -> hand evidence to skill-improve for bounded edits
```

Observed failures come before evaluator machinery. Do not begin with a broad judge asking whether the answer is good.

## Starter Coverage

Start with 3-5 scenarios:

1. `R`: normal expected behavior.
2. `F`: known hard behavior, ambiguity, multi-turn handling, or source-grounding risk.
3. `T`: activation or non-activation boundary.
4. `G`: approval, safe stop, or safe default.
5. Artifact/source scenario when the skill creates files or uses evidence.

Each scenario needs at least one concrete assertion.

## Multi-Turn Cases

Use `task.md` for the first turn and `turns.json` for follow-ups:

```json
[
  { "content": "Now tighten the recommendation for an executive reader." },
  { "content": "List the two biggest risks in the source material." }
]
```

Do not pack a transcript into one prompt when the behavior depends on real follow-up turns.

## Deterministic Tests

Prefer tests when the check is objective:

- expected artifact exists
- JSON parses
- required section appears
- citation pattern is present
- script exits successfully
- token or turn budget is within limit

Scenario criteria reference test IDs from `.meta-skill/tests/manifest.json`; they do not embed commands.

## Judges

Use judges for subjective qualities:

- source faithfulness
- recommendation quality
- tone fit
- artifact usefulness
- handling ambiguity

Judges are optional by default because they cost tokens. Keep them narrow and human-authored. Store judge prompts in `.meta-skill/evals/judges/` and thresholds in scenario `criteria.json`.

## Error Analysis

For each failure, identify the first place it went wrong:

- trigger decision
- user task interpretation
- source retrieval or artifact read
- runtime script
- tool call
- final response
- generated artifact
- human gate

Pass this first-failure note to `meta-skill plan` or the improvement discussion.

## Release-Facing Evidence

There is no sealed release gate. For release confidence, prefer:

- relevant `R`, `F`, `T`, and `G` coverage for the risk
- deterministic tests where possible
- human-reviewed judge prompt quality when judges matter
- fresh saved-snapshot runs with `meta-skill eval run . --snapshot` when snapshot evidence matters
- explicit human review before release or package decisions
- `meta-skill release . --from-run <run-id>` when a run supports readiness, so the release metadata records the evidence basis

Working-payload and saved-snapshot App Server scenarios force-attach the staged skill and run read-only final-answer checks. Use them for forced-skill behavior evidence. No-skill runs are available with `--no-skill`, but compare them against skill-attached runs only as a separate report-level analysis over multiple run IDs. Do not claim true trigger routing or writable artifact proof until the runner supports those modes.
