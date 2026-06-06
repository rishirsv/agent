# Meta Skill Architecture

Meta Skill is a local TypeScript CLI for creating portable skills, collecting eval evidence, and packaging the current portable payload.

## Command Taxonomy

Commands have one side-effect class:

| Kind | Commands | Rule |
|---|---|---|
| Producer | `run` | write run evidence |
| Projection | `lint` | compute output without mutating run evidence |
| Transform | `create`, `project init`, `evals create`, `package` | write files the user explicitly requested |

The current top-level command surface is `create`, `project init`, `evals create`, `lint`, `run`, and `package`. `evals create` drafts executable eval files from `.meta-skill/eval-scenarios.md`. `run` selects authored evals by `--eval` or `--topic`; it evaluates either the working payload or a no-skill control with `--no-skill`.

## Project Shape

The project root is the portable skill payload:

```text
SKILL.md
agents/
references/
scripts/
assets/
<other runtime files or folders>/
.meta-skill/
```

Only `SKILL.md` is required by the portable payload. `references/`, `scripts/`, and `assets/` are the first-class runtime support folders that create/lint know how to copy and link-check. Other non-excluded runtime files or folders can ship in the payload when the skill needs them. `.meta-skill/` is authoring and evidence state, not runtime payload, and packaging ignores it.

Workbench state uses the flat project-local layout:

```text
.meta-skill/
  spec.md
  eval-scenarios.md
  evals/
  tests/
  runs/
```

`.meta-skill/eval-scenarios.md` is the high-level create-time scenario plan. Executable evals live under `.meta-skill/evals/<slug>/` with lowercase hyphenated folder names. Eval files may be manually authored or drafted from the scenario plan with `meta-skill evals create`, then refined before running.

## Eval Evidence

Runs live under `.meta-skill/runs/<run-id>/`:

```text
payload/
evals/<eval-folder>/
  task.md
  criteria.json
  rpc.jsonl
  transcript.json
  response.md
```

`payload/` exists only for working-payload runs. No-skill control runs omit the frozen payload.

Per-eval files have one nature each:

- `task.md`: frozen solver-visible task definition
- `criteria.json`: frozen evaluator-only criteria, fixtures, tests, and metadata
- `rpc.jsonl`: raw App Server trace
- `transcript.json`: normalized App Server transcript
- `response.md`: final answer

## Runner Boundary

The App Server runner has one contract:

```text
(world, turns, policy) -> (final, rpc, transcript)
```

Token cost uses the final cumulative App Server `tokenUsage.total`; if exact usage is unavailable, `transcript.json` stores null numeric fields plus `unavailable_reason`.

The solver-visible world contains the portable payload and solver-visible resources. Harness metadata stays out of the staged world.

Working-payload eval runs force-attach the payload on the first turn. No-skill control runs mount no payload. Solver threads run read-only, with approval policy `never` and network disabled.

`rpc.jsonl` preserves generated App Server JSON-RPC rows as the durable raw event log. The runner also keeps bounded in-memory event windows for per-turn extraction; when a window overflows, `transcript.json` records a warning item and the raw event log remains the source for forensic inspection. If the current turn overflows before final assistant deltas are retained, `response.md` and the transcript say the final answer is unavailable instead of reusing a previous turn's final text.

`transcript.json` is the normalized behavior view for the run: turn IDs, final text or explicit unavailable-final warning, completion status, token usage, command execution items, file change items, tool calls, approval requests, warning items, and unknown event methods.

The current runner measures behavior for mounted-payload and no-skill executions. Trigger routing, writable output production, side-by-side uplift scoring, fork trees, and tool-chaos policies are roadmap capabilities that require additional App Server protocol support or assertion layers.

## Packaging

`package` validates and packages the current portable payload. `.meta-skill/` is workbench state and is never packaged.

## Runtime Source

The CLI runs directly from `src/` through `scripts/meta-skill.js`. Validation is native TypeScript: `npm test`, `npm run typecheck`, and repo-level `git diff --check`.
