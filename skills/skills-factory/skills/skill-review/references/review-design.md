# Review Design

Read this when building, auditing, or improving a review prompt set, deciding whether to add checks or judges, or interpreting repeated failures.

## Scope Map

- Lifecycle: the recommended evidence-first review loop.
- Smallest Useful Review: starter prompt mix.
- Error Analysis: how to turn traces into repeated failure patterns.
- Trigger Reviews: activation-specific prompt behavior.
- Mid-Workflow Gates: approval-stop and safe-path review modes.
- Checks: deterministic evaluator-side validation.
- Judges: advisory model review boundaries.
- Source Retrieval Skills: separating retrieval misses from generation misses.
- Audit: read-only review-shape diagnostics.
- Manual Release Review: v1 release-facing evidence posture.

## Lifecycle

Use this lifecycle:

```text
audit the current review shape
  -> run realistic cases
  -> review full traces and outputs
  -> identify repeated failure patterns
  -> encode those categories as prompts, checks, and advisory judges
  -> compare against a baseline
  -> preserve human feedback
  -> revise the skill or review deliberately
```

Observed failures come before evaluator machinery. Do not start by asking a broad judge whether the answer is good. First inspect realistic runs and identify how the skill actually fails.

## Smallest Useful Review

Start with 3-5 prompts:

1. One normal task the skill should handle well.
2. One edge case where the skill often fails.
3. One negative or near-miss task where the skill should not overreach.
4. One source-grounding case if the skill uses source material.
5. One trigger prompt if routing or activation matters.

If edge cases are unknown, run a few realistic prompts first and write edge cases from observed failures.

## Error Analysis

For each reviewed prompt, ask:

1. Did the skill satisfy the task?
2. If not, where did it first go wrong?
3. Was the issue in the prompt, source material, retrieval, script execution, reasoning, template use, final writing, or trigger decision?
4. Is this a one-off issue or a repeated pattern?
5. Could a deterministic check catch it, or does it need human or advisory-judge review?

Write observations before tags. Start with plain-language notes. Add `failure_categories` only after repeated observations show a useful pattern.

For multi-step or agentic traces, record the first upstream failure first. Downstream failures often cascade from that point.

Useful targets:

- starter review: 3-5 prompts and a few manual notes
- early pattern finding after a significant change: 20-50 reviewed traces
- mature release-facing review: move toward 100+ reviewed traces, or enough evidence that new traces stop revealing new categories
- mature judge work: enough labeled examples to compare advisory judges against human labels

## Trigger Reviews

Trigger reviews measure activation, not output quality.

Prompt fields:

```yaml
type: trigger
trigger_expected: should_not_trigger
task: Help me prepare a corporate tax memo.
```

Allowed expectations:

- `should_trigger`
- `should_not_trigger`
- `ambiguous`

Trigger results:

- `triggered`
- `did_not_trigger`
- `unclear`

Show activation outcomes separately from output-quality outcomes in reports.

## Mid-Workflow Gates

When a skill requires approval before proceeding, the review must specify expected gate behavior.

Modes:

- `expect_stop`: the review expects the skill to stop and ask for human approval
- `default_safe_path`: the runner passes a non-interactive signal and the skill proceeds along a documented safe default
- `scripted_approval`: the review supplies simple approval text such as `yes` or `proceed`

`default_safe_path` must be explicit. Do not silently treat non-interactive mode as approval.

If the skill cannot satisfy the selected gate mode, mark the role `needs_review` when human action is needed or `errored` when the run cannot continue.

## Checks

Checks are evaluator-side automatic tests for clear rules.

Good check targets:

- expected file exists
- workbook opens
- generated JSON parses
- required sections appear
- script exited successfully
- citation pattern is present

Rules:

- Command checks run from the evaluator process, never from the candidate process.
- Checks run after role outputs are copied into the run bundle.
- Checks may read run evidence, role artifacts, and allowed fixtures.
- Checks must not mutate candidate outputs.
- Capture stdout, stderr, exit code, and command identity.

Prefer checks before judges. If deterministic code can answer the question, do not make a judge guess.

## Judges

Judges are advisory in v1.

They may:

- summarize quality issues
- help reviewers triage outputs
- produce advisory scores or comments
- appear in `grades.json` and `report.html`

They may not:

- accept a baseline
- promote a skill
- replace manual review
- act as gate-authoritative evidence

Judge-writing guidance:

- Use judges only for subjective criteria that checks cannot handle.
- Prefer one judge per recurring failure pattern.
- Use binary pass/fail decisions before multi-point scoring.
- Feed the judge only the context needed for that pattern.
- Ask for a short critique before the verdict.
- Use examples from reviewed traces, not invented ideals.
- Pin `model_id` for release-facing evidence.
- Avoid broad overall-quality judges as the main signal.

When reports show advisory judge output, label whether that judge has been validated against human labels for this review. If not, show it as unvalidated advisory help.

## Source Retrieval Skills

For retrieval-heavy skills, separate retrieval from generation when possible. A bad answer may mean:

- the skill did not retrieve the right source material
- the skill retrieved the right source material but used it poorly

Capture retrieval evidence in `trace.jsonl` or `artifacts/`, then use checks or feedback notes to distinguish:

- source material found
- source material missed
- irrelevant source material used
- answer faithful to retrieved source
- answer unsupported by retrieved source

This distinction matters because retrieval failures and generation failures usually need different fixes.

## Audit

`skillfactory review run --audit` runs an audit pass before the next run. The audit itself is read-only — it inspects the workspace and reports the next useful step, such as:

- add prompts
- run the first baseline
- review traces
- add an automatic check
- write down repeated failure patterns
- import feedback
- replace a broad judge with a deterministic check
- capture retrieval evidence for source-heavy skills

`run` and `open` may suggest running with `--audit` after reviewed evidence exists, but they should not run it automatically.

## Manual Release Review

V1 has no sealed gates. For release-facing evidence:

- use ordinary prompts with clear `topics`
- run the relevant review
- inspect the report
- record a `review_decision` feedback row
- keep judges advisory unless separately validated against human labels

Do not make release claims from one run without reviewer judgment and enough coverage for the risk.
