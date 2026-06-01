# Review Files And Evidence

Read this when inspecting or explaining review folders, config files, run bundles, result statuses, or feedback rows.

## Scope Map

- Folder Layouts: flat, useful, advanced, and named review structures.
- Path Rules: durable config path resolution and portability limits.
- `review.yaml`: required and recommended review config fields.
- `prompts.yaml`: prompt cases, trigger prompts, fixtures, checks, and rubrics.
- `baseline.yaml`: accepted baseline skill identity.
- Run Bundle: generated evidence folder and role-side artifacts.
- Statuses And Outcomes: role statuses and comparison outcomes.
- Feedback: append-only reviewer rows and review decisions.

## Folder Layouts

Beginner flat layout:

```text
<project>/
  skill/
    SKILL.md
  reviews/
    review.yaml
    prompts.yaml
    runs/
```

Useful review:

```text
<project>/
  skill/
    SKILL.md
  reviews/
    review.yaml
    prompts.yaml
    checks/
    runs/
```

Advanced self-contained review:

```text
<project>/
  skill/
    SKILL.md
  reviews/
    review.yaml
    prompts.yaml
    baseline.yaml
    fixtures.yaml
    fixtures/
    checks/
    judges/
    runs/
```

Multiple reviews use `reviews/<review-name>/` with the same files inside each named review. Flat and named layouts must not coexist in one project.

Mode detection:

- `reviews/review.yaml` means flat single-review mode.
- `reviews/<name>/review.yaml` means named multi-review mode.
- Both at once is an invalid layout the CLI should refuse.

## Path Rules

Durable config paths resolve relative to the review root unless a supported prefix is used.

Supported prefixes:

- no prefix: review-root-relative path
- `review://`: review-root-relative path
- `project://`: project-root-relative path
- `repo://`: repository-root-relative path when known

Refuse absolute paths by default. `--allow-absolute-paths` is exploratory only and should be recorded as weakened portability.

Refuse paths under `.agents/skills/` by default because installed copies are runtime state. `--allow-installed-skill` is only for explicit smoke tests.

All durable config and generated text artifacts should be UTF-8 with LF line endings.

## `review.yaml`

Minimal shape:

```yaml
version: 1
skill_root: ../../skill
runner:
  name: codex
default_compare: auto
review:
  html: true
  feedback: local
```

Required:

- `version`: durable config version, must be `1`
- `skill_root`: source skill payload to evaluate
- `runner`: adapter name or adapter config

Recommended:

- `name`: optional display name; omit in flat mode unless the user supplied a real name
- `default_compare`: usually `auto`
- `review.html`: usually `true`
- `review.feedback`: usually `local`

Allowed `default_compare` values are `auto`, `none`, `baseline`, and `without_skill`.

## `prompts.yaml`

Minimal shape:

```yaml
version: 1
prompts:
  - id: first-use-summary
    task: Summarize the attached source pack for a new reviewer.
    expected_behavior: The output should be concise, sourced, and should not invent missing facts.
```

Prompt fields:

- `id`: required stable prompt identifier
- `task`: required user-facing task text
- `type`: `standard` by default; `trigger` for activation checks
- `trigger_expected`: required for trigger prompts; one of `should_trigger`, `should_not_trigger`, or `ambiguous`
- `expected_behavior`: human-readable expectation
- `topics`: tags for filtering and reporting
- `fixtures`: fixture IDs from `fixtures.yaml`
- `checks`: check IDs from `checks/`
- `rubric`: human or advisory-judge review dimensions
- `approval_mode`: `expect_stop`, `default_safe_path`, or `scripted_approval`

The active `prompts.yaml` drives current runs. Baseline comparisons execute the saved baseline skill version against the active prompt set, including prompts added after baseline acceptance.

## `baseline.yaml`

`baseline.yaml` records the accepted baseline skill version. It is created only after explicit acceptance.

Preferred baseline identity is an immutable Git commit:

```yaml
version: 1
id: init-2026-05-26
accepted_from_run: 2026-05-26T143000Z-a1b2
accepted_at: 2026-05-26T14:45:00Z
accepted_by: human
skill:
  kind: git_commit
  commit: abc1234
  skill_root: ../../skill
prompt_snapshot:
  run_id: 2026-05-26T143000Z-a1b2
  prompts_sha256: sha256:...
notes: First usable run.
```

If the skill is not in Git, the CLI may record a local snapshot under generated evidence. Git commits are preferred. Dirty working trees should not be accepted as baselines unless the user explicitly chooses a file snapshot.

## Run Bundle

Each run writes:

```text
runs/<run-id>/
  run.yaml
  results.jsonl
  report.html
  evidence/
    generated/
      prompts/
        <prompt-id>/
          sides/
            <role>/
              prompt.txt
              trace.jsonl
              final.md
              stdout.txt
              stderr.txt
              artifacts/
              checks.json
              grades.json
    feedback.jsonl
```

`trace.jsonl` is the first place to inspect when deciding where an output went wrong. It should contain operational events such as prompt identity, role, runner and model identity, tool or command invocations when available, artifact references, final response path, errors, and token usage when available. It is not a private reasoning log.

`final.md` is the text output when one exists. Binary or structured deliverables belong in `artifacts/`, even when there is also a text summary.

## Statuses And Outcomes

Framework role statuses:

- `passed`
- `failed`
- `needs_review`
- `errored`
- `missing_evidence`

Status precedence:

- `errored`: runner, script, fixture, or artifact production did not complete
- `failed`: role completed, but a required deterministic check failed or human reviewer marked fail
- `needs_review`: role completed, but evidence still needs human judgment
- `passed`: role completed and required checks passed, or human reviewer marked pass

Comparison outcomes:

- `improvement`
- `regression`
- `unchanged`
- `inconclusive`
- `missing_baseline_evidence`
- `missing_candidate_evidence`
- `null` for `compare: none`

For `compare: none`, avoid improvement and regression language.

## Feedback

Feedback lives at:

```text
runs/<run-id>/evidence/feedback.jsonl
```

Feedback row shape:

```json
{"schema_version":1,"type":"feedback","feedback_id":"fb-20260526-001","timestamp":"2026-05-26T15:20:00Z","run_id":"2026-05-26T150000Z-c8d2","prompt_id":"source-grounded-summary","role":"candidate","label":"fail","reviewer":"human","failure_categories":["unsupported_claim"],"first_failure_step":"final_response","notes":"Claimed revenue growth was customer-led, but the source pack only showed product-level revenue."}
```

Allowed labels:

- `pass`
- `fail`
- `needs_review`
- `defer`

`defer` is only a human feedback label. The framework must not assign it as a result status.

Review decision row shape:

```json
{"schema_version":1,"type":"review_decision","decision_id":"rd-20260526-001","timestamp":"2026-05-26T15:30:00Z","run_id":"2026-05-26T150000Z-c8d2","decision":"accepted","reviewer":"human","notes":"Accept as evidence for manual release review."}
```

`feedback import` must validate every row and require `run_id` to match the target run.
