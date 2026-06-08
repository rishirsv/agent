# Isolated Thread Trial

Read this when a Meta-Skill lane needs one realistic, isolated Codex child
thread to test a skill draft or candidate improvement. This is a one-prompt
trial workflow, not the full evaluation process.

## When To Use

- A user asks to test one prompt against a new or changed skill.
- A new skill passes deterministic checks, and a one-off activation/runtime
  trial would materially improve confidence.
- `skill-doctor` has a candidate edit and should try it in isolation before the
  parent applies it to the source skill.
- The user wants an inspectable thread/worktree result instead of a full eval
  suite.

Do not use this as release proof. Escalate to `skill-evaluator` when the user
needs multi-scenario measurement, baseline comparison, variance, or publish
readiness.

## Default Isolation

Use a project **worktree** child thread by default. Start it from the current
working tree so the child sees the draft skill or candidate edit snapshot
without committing it in the parent checkout.

Use a local child thread only for read-only checks where file isolation does not
matter. Use a projectless thread only when the skill is intentionally being
tested outside a repo.

Current thread tooling supports project `local` and `worktree` environments. It
does not expose an immediate environment setup script for `create_thread`, so
seed the child through the worktree snapshot and the prompt.

## Parent Flow

1. Pick one realistic prompt. Prefer a should-trigger prompt that exercises the
   skill's main value.
2. Create a project worktree child thread from the current working tree.
3. Prompt the child with the target skill path, the trial prompt, expected
   behavior, and the result contract below.
4. Keep the parent as the decision-maker. The child may propose, test, or edit
   inside its worktree, but it does not promote changes to the parent checkout.
5. Read the child result. If useful, record compact evidence under
   `.meta-skill/runs/<run-id>/`; otherwise, treat the child thread as the
   evidence surface.
6. Apply source edits in the parent checkout only when the user authorized
   payload changes.

## Child Prompt Contract

Ask the child to put this block first in its final answer:

```md
META_SKILL_TRIAL_RESULT
status: pass|partial|fail|blocked
target_skill: <path>
prompt_tested: <short label>
decision: keep|revise|reject|needs_eval
evidence: <one or two sentences>
recommended_next_action: <smallest useful next step>
END_META_SKILL_TRIAL_RESULT
```

After the block, the child may add concise reasoning, changed files in its
worktree, or notable caveats.

## Optional Evidence Files

Use these only when the parent needs durable tracking across more than chat:

```text
.meta-skill/runs/<run-id>/
  run.json
  results.jsonl
```

`run.json` records the parent thread, target skill, child thread or pending
worktree id, prompt label, and status. `results.jsonl` appends the parsed
`META_SKILL_TRIAL_RESULT` row.

Do not copy raw transcripts, full diffs, or debug folders by default. The child
thread and worktree remain the heavy evidence surface.

## Skill Writer Use

After building and validating a new skill, offer this trial when the user
asks for one-off testing or when the skill is fragile enough that one isolated
run would catch likely activation, resource, or runtime-contract failures.

The isolated trial is optional by default. It should not block ordinary skill
creation unless the user explicitly asks for mandatory isolated testing.

## Skill Doctor Use

Use the child worktree to test a candidate prompt-doctor edit without mutating
the parent checkout. The child may apply the candidate edit inside its worktree,
run a review or one prompt, and report whether the edit improved the observed
failure.

The parent then decides whether to apply the approved edit to the source skill,
refresh review/verify evidence, or escalate to `skill-evaluator`.
