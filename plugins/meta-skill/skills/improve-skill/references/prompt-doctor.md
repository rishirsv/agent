# Prompt Doctor

Read this when translating skill evidence into the smallest useful improvement.

## Route Selection

| User asks for | Default route |
|---|---|
| "improve this skill", "review this skill", "diagnose this fail state", "what would you change", "is this good" | Clarify and diagnose |
| "update", "patch", "fix", "apply your changes", "make the edit" | Apply a surgical edit |
| "run evals", "use this trace", "use a subagent", "iterate", "autonomously improve" | Evidence loop |
| Ambiguous improvement request | Clarify and diagnose |

Clarify and diagnose is the default. Do not silently rewrite the target skill payload, generated plugin packages, docs, or source files just because the user provided feedback or asked what should change. Human feedback is evidence; it is not edit authorization unless the user asks to make, apply, update, patch, or fix now.

Writing `.meta-skill/review.md` is allowed and expected during diagnosis/review because it is a review artifact, not a payload edit.

## First Read

Before diagnosing or changing anything, identify:

- skill name and folder
- current description and trigger contract
- core job
- linked references, scripts, assets, and metadata
- `.meta-skill/review.md` and other `.meta-skill/` evidence available
- user's requested scope
- whether the user authorized edits or only requested diagnosis

Do not let a broad improvement request become an unbounded rewrite.

## Evidence Sources

Valid improvement evidence includes:

- file/link review failures or warnings
- completed `.meta-skill/review.md` with a concrete finding heading
- `.meta-skill/runs/<run-id>/results.jsonl` rows tied to a concrete `task_id` and `attempt_id`
- `.meta-skill/runs/<run-id>/run.json` task state or variant metadata
- a child thread result block, child thread id, or selected child-thread/worktree evidence
- optional compact projections such as `.meta-skill/runs/<run-id>/report.md` or `threads.jsonl`
- source `.meta-skill/evals/<eval-folder>/task.md` plus evaluator-only `criteria.json` tied to the result by `task_id`
- explicitly captured deterministic test or validation output
- saved artifacts tied to the run, eval, or user-observed failure
- concrete user-observed failure

Generated review worksheets that still contain `Agent review required` placeholders are not edit evidence. Complete the review first, or cite a different concrete evidence source.

If evidence is missing, ask the user to provide concrete feedback, run available deterministic tests, inspect saved eval evidence, or authorize a manual review path.

For read-only review requests, complete `.meta-skill/review.md` as a Quality page using [review-criteria.md](review-criteria.md) when artifact writes are allowed. Treat broad "do not edit files" instructions as forbidding target payload, generated package, docs, and source edits, not the review artifact write, unless the user explicitly forbids artifact writes too. If the user requires zero writes, say the full review artifact cannot be produced under that constraint, then do a manual read-only review or ask permission to write `.meta-skill/review.md`. The completed report is the evidence artifact. For later edit requests, cite `.meta-skill/review.md` and the finding heading before changing the portable payload.

For subagent review, keep the subagent as evidence support. The parent owns diagnosis, candidate edits, final editing, validation, and the user-facing recommendation.

## Review Lanes

Use only lanes relevant to the request:

- Activation: trigger clarity, realistic phrasing, near misses, non-trigger boundary.
- Runtime clarity: default path, output contract, stop/ask points, final checks.
- Resources: linked references/scripts/assets, dependency clarity, source leakage, stale files.
- Runtime contamination: copied user prompt text, model names, provider docs, raw research links, author or source provenance, thread IDs, one-off file paths, and source notes in `SKILL.md`, references, scripts, assets, or metadata instead of reusable behavior or true runtime dependencies.
- Controls: user files as data, approval gates, external writes, package/publish gates.
- Eval evidence: `.meta-skill/evals/`, executable tests under `.meta-skill/tests/`, result-block quality, telemetry availability.
- Review score: `.meta-skill/review.md` Quality Score, Discovery, Implementation, Validation, and combined findings.

## Prompt Doctor Loop

1. Name the observed fail state in plain language.
2. Classify the issue: activation, runtime clarity, output contract, resource, runtime contamination, evidence, cross-skill boundary, approval/control, or validation gap.
3. Separate recurring failure pattern from one-off edge eval.
4. Find the smallest likely source: description, boundary, example, workflow branch, output contract, reference pointer, script contract, or missing gate.
5. Produce two or three candidate edits that would fix the behavior while preserving the skill's approved trigger and runtime surface.
6. Recommend one edit and explain why it is the smallest strong fix.
7. If the user authorized direct edits, apply the recommended edit. Otherwise, stop with a standard clarify-style approval question.
8. Add a broad rule only when the agent would likely repeat the mistake without it.
9. Record changed behavior, evidence, rejected tempting edits, and residual risk in `.meta-skill/spec.md` when durable notes are needed.

Prefer replacing a misleading sentence over adding a prohibition. Preserve unrelated behavior.

## Diagnosis Shape

```markdown
## Current Understanding

<what the user wants improved and what must be preserved>

## Diagnosis

Observed fail state: <specific bad behavior>
Likely source: <description, workflow branch, output contract, reference, script, or missing gate>
Evidence: <file path, run ID, eval ID, trace, user feedback, or exact section>

## Candidate Edits

1. <edit option and tradeoff>
2. <edit option and tradeoff>
3. <optional edit option and tradeoff>

Recommended edit: <one option>
Validation to run: <file review, eval inspection, test, or review refresh>
```

Avoid vague diagnoses like "make it clearer." Name the phrase, section, workflow branch, or evidence row causing the risk.

## Surgical Update Rules

- Preserve name and folder unless rename is in scope.
- Preserve user-approved trigger meaning.
- Preserve output contract, tone, and runtime surface unless they are the problem.
- For direct edit requests, still state the diagnosis briefly before patching.
- Keep unrelated resources unchanged.
- Delete stale or unreferenced files only when clearly superseded or unsafe.
- Prefer smaller changes when two edits protect behavior equally well.
- Reject edits that restate existing guidance or trade one ambiguity for another.
- Update `.meta-skill/spec.md` when behavior changes.
- Keep candidate edits inside the portable payload: `SKILL.md`, `agents/`, `references/`, `scripts/`, `assets/`.

Autonomous or iterative improvement loops require explicit user instruction. Without that instruction, do one bounded diagnosis/edit cycle and stop.

## Output Contracts

For clarify-and-diagnose route, report current understanding, diagnosis, two or three candidate edits, the recommended edit, validation to run, and an approval question.

For surgical edit route, report evidence, files changed, behavior preserved, behavior changed, validation run and result, and residual risk.

For evidence loop route, report what evidence ran, what it proves and does not prove, the recommended next edit or stop condition, and whether any edit was applied.
