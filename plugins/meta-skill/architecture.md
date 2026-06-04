# Meta Skill Architecture

Meta Skill is a local TypeScript CLI for creating portable skills, collecting eval evidence, recording human decisions about reviewed diffs, and packaging the current portable payload.

## Command Taxonomy

Commands have one side-effect class:

| Kind | Commands | Rule |
|---|---|---|
| Producer | `run`, `judge`, `feedback`, `decide` | append evidence facts |
| Projection | `report`, `lint` | compute output and keep reports read-only |
| Transform | `create`, `project init`, `package` | write files the user explicitly requested |

The current top-level command surface is `create`, `project init`, `lint`, `run`, `judge`, `feedback import`, `report`, `decide`, and `package`. `run` selects manually authored cases by `--case`, `--type <R|F|G>`, or `--topic`; it evaluates either the working payload or a no-skill control with `--no-skill`.

## Project Shape

The project root is the portable skill payload:

```text
SKILL.md
agents/
references/
scripts/
assets/
resources/
.meta-skill/
```

Only `SKILL.md` is required by the portable payload. Runtime support folders are allowed when the skill needs them. `.meta-skill/` is authoring and evidence state, not runtime payload, and packaging ignores it.

Workbench state uses the flat project-local layout:

```text
.meta-skill/
  spec.md
  cases/
  tests/
    unit/
    eval/
  runs/
```

Executable cases live under `.meta-skill/cases/<ID-slug>/`. The case ID prefix is the case type: `R` for regression, `F` for failure mode, and `G` for gate. Case authoring is manual.

## Eval Evidence

Runs live under `.meta-skill/runs/<run-id>/`:

```text
facts.jsonl
payload/
cases/<case-folder>/
  case.md
  rpc.jsonl
  trajectory.json
  final.md
```

`payload/` exists only for working-payload runs. No-skill control runs omit the frozen payload.

`facts.jsonl` is the single append-only fact log. It records run lifecycle, payload freezing, case definitions, case trial completion, check observations, feedback, decisions, and token cost. Token usage is stored on `case_trial_finished` payloads as nullable numeric fields plus one `unavailable_reason`.

Per-case files have one nature each:

- `case.md`: frozen definition
- `rpc.jsonl`: raw App Server trace
- `trajectory.json`: normalized App Server turn evidence
- `final.md`: final answer

Reports are deterministic projections over facts plus referenced case evidence. They print Markdown by default or JSON with `--json`; report output is not written back into `.meta-skill/`. JSON reports expose `subject`, `missing`, `errors`, `usage`, `cases`, and `decisions`. Run/case reports include final, RPC, trajectory, check, feedback, decision, and token evidence references when present.

`decide` appends a `decision_recorded` fact to the selected run after the human has reviewed the working-tree diff. The fact records the accept/reject call, the evidence references that justified it, and the commit blessed by an accept decision. Git remains the mechanism that applies payload edits and provides the diff review surface.

## Runner Boundary

The App Server runner has one contract:

```text
(world, turns, policy) -> (final, rpc, trajectory, usage)
```

The same execution shape is used for solver runs and judge work. Token cost uses the final cumulative App Server `tokenUsage.total`; if exact usage is unavailable, fact rows store null numeric fields plus `unavailable_reason`.

The solver-visible world contains the portable payload and solver-visible resources. Harness metadata lives in facts, not in the staged world.

Working-payload eval runs force-attach the payload on the first turn. No-skill control runs mount no payload. Solver threads run read-only, with approval policy `never` and network disabled.

`rpc.jsonl` preserves generated App Server JSON-RPC rows with a protocol-boundary `schema_version`. `trajectory.json` is the normalized behavior view for the run: turn IDs, final text, completion status, token usage, command execution items, file change items, tool calls, approval requests, and unknown event methods. Reports summarize trajectory counts, and judges may receive the compact trajectory summary with the frozen case and final answer.

The current runner measures behavior for mounted-payload and no-skill executions. Trigger routing, writable output production, side-by-side uplift scoring, generated cases, fork trees, and tool-chaos policies are roadmap capabilities that require additional App Server protocol support or assertion layers.

## Packaging

`package` validates and packages the current portable payload. `.meta-skill/` is workbench state and is never packaged.

## Runtime Source

The CLI runs directly from `src/` through `scripts/meta-skill.js`. Validation is native TypeScript: `npm test`, `npm run typecheck`, and repo-level `git diff --check`.
