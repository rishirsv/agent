Read this for the hard-cut eval evidence shape.

## Case Files

Cases live under:

```text
.meta-skill/evals/cases/<ID-slug>/case.md
```

`case.md` contains frontmatter criteria and user turns. Criteria are evaluator evidence and are not shown to the solver.

## Run Files

Runs live under:

```text
.meta-skill/evals/runs/<run-id>/
  facts.jsonl
  payload/
  cases/<case-folder>/
    case.md
    rpc.jsonl
    final.md
```

`facts.jsonl` is the single append-only log. It records run lifecycle, payload freezing, case definitions, trial completion, check observations, feedback imports, user decisions, and token cost.

`payload/` is the frozen current portable payload for normal runs. No-skill runs omit it.

Each case has exactly three files: frozen `case.md`, raw App Server `rpc.jsonl`, and final answer `final.md`.

## Fact Rows

Expected row types:

- `run_started`
- `payload_frozen`
- `case_defined`
- `case_trial_finished`
- `check_observed`
- `feedback_imported`
- `decision_recorded`
- `run_finished`

Evidence refs point to `facts.jsonl` lines, for example `{ "path": "facts.jsonl", "line": 12 }`.

## Reports

`meta-skill report` computes from facts and never persists. Reports show:

- missing declared checks
- execution and check errors
- check observations
- imported feedback
- decisions
- token cost
- final and RPC pointers

Reports do not compute verdicts, readiness, or pass/fail status. Users determine meaning from facts.

## Token Usage

Token usage lives on trial/check fact rows. Multi-turn case totals use App Server cumulative `tokenUsage.total` from the final reporting turn. If exact usage is unavailable, numeric fields are null and `unavailable_reason` explains why.
