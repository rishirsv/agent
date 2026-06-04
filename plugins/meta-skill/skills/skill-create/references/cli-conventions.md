# CLI Conventions

Read this for shared `meta-skill` command behavior across create, eval, and improve lanes.

## Command Surface

Meta Skill uses one TypeScript CLI with top-level commands:

```bash
meta-skill create ...
meta-skill create --project ...
meta-skill project init <skill-dir>
meta-skill lint <project-or-skill> [--run <run-id>] [--json]
meta-skill run <project> [--case <id>] [--type <R|F|G>] [--topic <topic>] [--label "..."] [--no-skill] [--with-judges] [--no-lint]
meta-skill judge <project> --run <run-id> (--judge <id> | --all-judges) (--case <id> | --all-cases)
meta-skill feedback import <project> --run <run-id> <feedback.jsonl>
meta-skill report [run-id] [case-id] [--project <dir>] [--json]
meta-skill decide <project> --run <run-id> --evidence <path[:line]> [--evidence <path[:line]> ...] [--commit <sha>] --accept | --reject
meta-skill package <project> [--out <zip>] [--out-dir <dir>]
```

Use the supported surface above for command examples and workflow guidance.

## Path Model

The project root is also the current portable payload. It contains `SKILL.md` plus optional `agents/`, `references/`, `scripts/`, and `assets/`.

Workbench state lives under `.meta-skill/`. Commands must not create alternate root-level workbench folders.

Installed skill copies are runtime state, not canonical source. Prefer the source project path.

## Output And Exit Codes

- `0`: success, including success with advisory warnings.
- `1`: invalid project state, failed deterministic check, or unavailable runner.
- `2`: usage error, unknown command, or bad flags.

Human-readable results print to stdout. Errors print to stderr. Use `--json` only where the command supports machine-readable output.

## Human Gates

Commands may prepare evidence and packages, but the human gate remains explicit. Evidence-backed source edits are allowed when the user asks for edit mode. Require user approval before packaging, installing, publishing, syncing, external writes, or promoting a candidate as accepted.

## Evidence Rules

Run IDs are readable sequenced folders such as `001-working-payload`. Treat them as opaque once created.

Every eval run records unavailable token metrics explicitly when exact usage cannot be collected. Do not hide missing usage fields.

Case authoring is manual. Current eval reports are printed projections over saved facts and case evidence. Current eval guidance uses manually authored cases, one execution source per run, read-only App Server evidence, and direct TypeScript runtime validation.
