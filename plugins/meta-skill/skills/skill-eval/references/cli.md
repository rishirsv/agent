Read this for eval command semantics and examples. The full command surface lives in the sibling skill-create [cli-conventions.md](../../skill-create/references/cli-conventions.md); do not invent commands or flags beyond it.

## Run Selection

```bash
meta-skill run .
meta-skill run . --case F1
meta-skill run . --case F1-multiturn
meta-skill run . --type G
meta-skill run . --topic source-faithfulness
meta-skill run . --no-skill
```

`run` freezes the current portable payload and each selected `case.md`, writes per-case `rpc.jsonl` and `final.md`, appends facts to `facts.jsonl`, and prints the run report. `--no-skill` omits the payload and records control evidence. Exit code is `1` when the run records errors.

## Lint And Judges

```bash
meta-skill lint . --run 001-working-payload
meta-skill run . --with-judges
meta-skill judge . --run 001-working-payload --judge final-answer-quality --case G2
meta-skill judge . --run 001-working-payload --all-judges --all-cases
```

`lint --run` appends deterministic check observations to the run's `facts.jsonl`. `judge` reads frozen run cases and final outputs, then appends judge observations.

## Feedback

```bash
meta-skill feedback import . --run 001-working-payload reviewer-feedback.jsonl
```

Each line is one JSON object preserved verbatim as a fact payload. Optional `case_id` links the row to a case; optional `source` names the reviewer.

## Reports

```bash
meta-skill report
meta-skill report 001-working-payload
meta-skill report 001-working-payload R1
meta-skill report 001-working-payload --json
```

Reports are projections over `facts.jsonl` and are never persisted. JSON exposes `subject`, `missing`, `errors`, `usage`, `cases`, and `decisions`, plus `runs` at project level. Markdown may include human-facing case titles.
