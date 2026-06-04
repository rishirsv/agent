# Case Design

Read this when creating or auditing case coverage for a reusable skill.

## Lifecycle

Use this loop:

```text
lint workbench
  -> add realistic cases
  -> run App Server-backed eval
  -> inspect traces, final outputs, tests, judges, and feedback
  -> identify repeated failure patterns
  -> add deterministic tests where possible
  -> add optional judges only for subjective qualities
  -> hand evidence to skill-improve for bounded edits
```

Observed failures come before evaluator machinery. Do not begin with a broad judge asking whether the answer is good.

## Starter Coverage

Start with 3-5 cases:

1. `R`: normal expected behavior.
2. `F`: known hard behavior, ambiguity, multi-turn handling, or source-grounding risk.
3. `G`: approval, safe stop, or safe default.
4. Source-grounding case when the skill uses files or evidence.

Each case needs at least one concrete assertion.

## Multi-Turn Cases

Use `## Task` in `case.md` for the first turn and `## Turn N` headings for follow-ups:

```md
## Task

Summarize the source pack.

## Turn 2

Now tighten the recommendation for an executive reader.

## Turn 3

List the two biggest risks in the source material.
```

Do not pack a transcript into one prompt when the behavior depends on real follow-up turns.

## Deterministic Tests

Prefer tests when the check is objective:

- JSON parses
- required section appears
- citation pattern is present
- script exits successfully
- token or turn budget is within limit

Case criteria reference test IDs from `.meta-skill/tests/manifest.json`; they do not embed commands.

## Judges

Use judges for subjective qualities:

- source faithfulness
- recommendation quality
- tone fit
- final-answer usefulness
- handling ambiguity

Judges are optional by default because they cost tokens. Keep them narrow and human-authored. Store judge prompts in `.meta-skill/evals/judges/` and thresholds in `case.md` frontmatter.

## Error Analysis

For each failure, identify the first place it went wrong:

- trigger decision
- user task interpretation
- source retrieval or staged fixture read
- runtime script
- tool call
- final response
- final response
- human gate

Pass this first-failure note to `meta-skill plan` or the improvement discussion.

## Decision-Facing Evidence

For user decisions and improvement work, prefer:

- relevant `R`, `F`, and `G` coverage for the risk
- deterministic tests where possible
- human-reviewed judge prompt quality when judges matter
- explicit feedback or `decide` facts when a human has interpreted the evidence
- current-payload runs plus optional no-skill control runs when comparison helps the user

Current-payload App Server cases force-mount the selected skill and run read-only final-answer checks. Use them for forced-skill behavior evidence. No-skill runs are available with `--no-skill` as manual control evidence, not as an automated uplift score. Do not claim true trigger routing or writable file proof until the runner supports discoverable activation.
