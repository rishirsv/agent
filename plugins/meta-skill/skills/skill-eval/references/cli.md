Read this for exact Meta Skill eval command guidance.

## Commands

```bash
meta-skill project init <project>
meta-skill run <project> [--case <id>] [--type <R|F|G>] [--topic <topic>] [--label "..."] [--no-skill] [--with-judges] [--no-lint]
meta-skill judge <project> --run <run-id> (--judge <id> | --all-judges) (--case <id> | --all-cases)
meta-skill feedback import <project> --run <run-id> <feedback.jsonl>
meta-skill report [run-id] [case-id] [--project <dir>] [--json]
```

## Run Selection

```bash
meta-skill run .
meta-skill run . --case F1
meta-skill run . --case F1-multiturn
meta-skill run . --type G
meta-skill run . --topic source-faithfulness
meta-skill run . --no-skill
```

`run` freezes the current portable payload, freezes each selected `case.md`, writes per-case `rpc.jsonl` and `final.md`, appends facts to `facts.jsonl`, and prints the run report. `--no-skill` omits the payload and records control evidence.

## Lint And Judges

```bash
meta-skill lint . --run 001-working-payload
meta-skill run . --with-judges
meta-skill judge . --run 001-working-payload --judge final-answer-quality --case G2
meta-skill judge . --run 001-working-payload --all-judges --all-cases
```

`lint --run` appends deterministic check observations to `facts.jsonl`. `judge` reads frozen run cases and final outputs, then appends judge observations to `facts.jsonl`.

## Feedback

```bash
meta-skill feedback import . --run 001-working-payload reviewer-feedback.jsonl
```

Feedback rows are append-only facts. Use labels such as `note`, `accept`, `reject`, or any reviewer vocabulary that helps the user interpret the evidence.

## Reports

```bash
meta-skill report
meta-skill report 001-working-payload
meta-skill report 001-working-payload R1
meta-skill report 001-working-payload --json
```

Reports are projections. JSON exposes `subject`, `missing`, `errors`, `usage`, `cases`, and `decisions`; Markdown may include human-facing case titles.
