# Meta Skill Architecture

Meta Skill is a Codex skill bundle for creating, evaluating, and improving
portable reusable skills. It has no command wrapper, local eval runner, or local
API. Codex Desktop is the visible cockpit for evaluation and improvement runs.

## Shape

The plugin is only:

```text
plugins/meta-skill/
  .codex-plugin/plugin.json
  assets/
  references/
  skills/
```

The source of truth is the skill guidance under `skills/` plus shared references
under `references/`. Runtime code belongs inside an individual generated skill
only when that skill itself needs a reusable script.

## Lanes

Meta Skill works through three focused lanes:

| Lane | Owns |
|---|---|
| `create-skill` | deciding whether a workflow should become a skill, drafting the portable payload, and choosing portable-only versus project mode |
| `evaluate-skill` | authoring `.meta-skill/evals/`, orchestrating Codex child-thread evidence, and explaining proof limits |
| `improve-skill` | reviewing or editing an existing skill from concrete evidence |

The top-level `meta-skill` skill is only a router. It chooses the lane, keeps
human approval gates visible, and does not perform lane-specific work itself.

## Skill Project Shape

A portable skill payload is rooted at the skill directory:

```text
SKILL.md
agents/
references/      optional
scripts/         optional
assets/          optional
```

Add `.meta-skill/` only for maintained skill projects that need durable
authoring notes, evals, tests, review artifacts, or run evidence:

```text
.meta-skill/
  spec.md
  eval-scenarios.md
  review.md
  evals/
  tests/
  runs/
```

`.meta-skill/` is authoring and evidence state. It is not runtime payload.

## Evidence

Evaluation is Codex Desktop-first. The parent thread starts and supervises
visible child threads, optionally in separate worktrees, then records only the
compact state needed to compare results and resume the batch.

The canonical run files are:

```text
.meta-skill/runs/<run-id>/
  run.json
  results.jsonl
```

Optional projections such as `threads.jsonl`, `scores.jsonl`, and `report.md`
may be regenerated from the ledger, child-thread results, and read-only
extraction. Do not persist copied raw transcripts by default; cite child thread
ids, worktree paths, and source digests for drill-down.

Completed evidence is not proof by itself. Agents should inspect the compact
rows and any selected child-thread/worktree evidence, cite what they show, and
say what remains unverified.

## Validation

There is no shared Meta Skill validator. Validation is now local to the edited
skill: read the changed payload, check links and referenced files manually, run
any deterministic tests that exist for that skill, and report what was or was
not verified.
