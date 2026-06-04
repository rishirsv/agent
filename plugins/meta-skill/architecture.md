# Meta Skill Architecture

Meta Skill is a local CLI for creating portable skills, collecting eval evidence, recording human decisions about reviewed diffs, and packaging the current portable payload.

## Command Taxonomy

Commands have one side-effect class:

| Kind | Commands | Rule |
|---|---|---|
| Producer | `run`, `judge`, `feedback`, `decide` | append evidence facts |
| Projection | `report`, `lint` | compute output and do not persist report artifacts |
| Transform | `create`, `project init`, `package` | write files the user explicitly requested |

## Eval Evidence

Runs live under `.meta-skill/evals/runs/<run-id>/`:

```text
facts.jsonl
payload/
cases/<case-folder>/
  case.md
  rpc.jsonl
  final.md
```

`facts.jsonl` is the single append-only fact log. It records run lifecycle, payload freezing, case definitions, case trial completion, check observations, feedback, decisions, and token cost.

Per-case files have one nature each:

- `case.md`: frozen definition
- `rpc.jsonl`: raw App Server trace
- `final.md`: final answer

Reports are deterministic projections over facts. JSON reports expose `subject`, `missing`, `errors`, `usage`, `cases`, and `decisions`. Markdown may include human-facing case titles.

`decide` appends a `decision_recorded` fact to the selected run after the human has reviewed the working-tree diff. The fact records the accept/reject call, the evidence references that justified it, and the commit blessed by an accept decision. Git remains the mechanism that applies payload edits and provides the diff review surface.

## Runner Boundary

The App Server runner has one contract:

```text
(world, turns, policy) -> (final, rpc, usage)
```

The same execution shape is used for solver runs and judge work. Token cost uses the final cumulative App Server `tokenUsage.total`; if exact usage is unavailable, fact rows store null numeric fields plus `unavailable_reason`.

The solver-visible world contains the portable payload and solver-visible resources. Harness metadata lives in facts, not in the staged world.

## Packaging

`package` validates and packages the current portable payload. `.meta-skill/` is workbench state and is never packaged.
