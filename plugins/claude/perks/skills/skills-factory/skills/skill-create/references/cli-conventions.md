# CLI Conventions

Shared rules for every `skillfactory` command across the three Skills Factory lanes (`skill-create`, `skill-review`, `skill-improve`). Read once and assume these conventions hold in every per-lane reference unless that reference explicitly overrides them.

## Scope Map

- Command Shape: how subcommands and verbs nest.
- Path Argument: how positional paths resolve and which roots are refused.
- Exit Codes: 0, 1, 2 and what each one means.
- Output Channels: what goes to stdout vs. stderr.
- Format: markdown default and `--format json`.
- Common Flags: shared meaning across every command.
- Interactive vs. Non-Interactive: opening reports, prompting, baseline acceptance.
- Human Gates: actions that need a human before commit.
- Implicit Init: how `review run` behaves on an uninitialized project.
- Run Identifiers: the shape and meaning of run and session ids.

## Command Shape

The CLI is one binary with two levels of nesting:

```
skillfactory <area> <verb> [args] [flags]
```

- Top-level verbs that act on a single skill or workspace are flat: `skillfactory create`, `skillfactory validate`.
- Lane verbs are grouped under an area: `skillfactory review <verb>`, `skillfactory improve <verb>`.
- A verb is one word. Do not add a third nesting level.

The eight built verbs are:

```
skillfactory create
skillfactory validate
skillfactory review init
skillfactory review run
skillfactory review open
skillfactory improve plan
skillfactory improve run
skillfactory improve decide
```

## Path Argument

Most commands take a positional path that resolves to a project root or a review root:

- If the argument is omitted, the command resolves against the current working directory.
- A project root is the folder that contains the canonical portable payload at `skill/SKILL.md`.
- A review root is either `<project>/reviews/` (flat mode) or `<project>/reviews/<name>/` (named mode).
- `.agents/skills/...` paths are runtime installs, not source. Commands refuse them by default; pass `--allow-installed-skill` only for explicit installed-copy smoke tests.

## Exit Codes

- `0` — success, or success with advisory warnings.
- `1` — invalid input, missing required state, or failed deterministic check.
- `2` — usage error (bad flags, unknown subcommand). argparse owns this code.

Commands that succeed but discover advisory findings (audit warnings, judge concerns) still exit `0`. Use `--strict` on commands that support it to promote warnings to exit `1`.

## Output Channels

- **stdout** carries results: report paths, generated file paths, next-step commands, structured output when `--format json` is used.
- **stderr** carries progress, status lines, and human-readable errors. Reserve it for things a script would normally discard.
- A successful command ends with one `next step:` line on stdout when there is a useful follow-up.

Non-interactive callers should be able to consume stdout alone.

## Format

- `--format markdown` (default) prints human-readable output.
- `--format json` prints a single JSON object. The schema is per-command and is documented in that command's reference.

## Common Flags

These flags carry the same meaning everywhere they appear:

- `--audit` — run an audit pass before the main action. Audit output prints first, then a blank line, then the main action's output.
- `--label "..."` — human-readable label attached to a run or session. Defaults to the candidate skill's Git commit subject when available.
- `--no-open` — never open a report or artifact in a viewer, even in an interactive terminal.
- `--from-skill-spec <path>` — seed config from a structured spec block. Plain-prose specs are not parsed; the block must be structured.
- `--keep-workspace` — keep staged role workspaces for debugging. Off by default.
- `--allow-absolute-paths` — allow durable config to reference absolute paths. Off by default; portable configs use relative paths.
- `--allow-installed-skill` — allow `.agents/skills/...` source paths. Off by default.

## Interactive vs. Non-Interactive

A command is interactive when stdout is a TTY and the user did not pass `--no-open` or an equivalent suppressor.

- Interactive runs may open reports, prompt for confirmation, and ask whether to accept a first-run baseline.
- Non-interactive runs must not open viewers, never prompt, and never write a baseline. They print the report path and the exact follow-up command instead.

## Human Gates

A human must approve before any of these actions:

- packaging a skill or building a `dist/`
- installing into `.agents/skills/`
- syncing to a workspace marketplace
- publishing or releasing
- writing to external systems (HTTP POST, file uploads, send/post)
- promoting a candidate into canonical source
- accepting a review baseline beyond the first-run prompt

A CLI command may prepare these actions, but the final commit is gated. Non-interactive runs surface the proposed action and stop; they do not auto-confirm.

## Implicit Init

`skillfactory review run` on a project that has no `review.yaml` will create defaults and proceed. The CLI prints one line to stderr (`No review found. Creating default review and proceeding.`) and continues with the run. To opt out, run `skillfactory review init` first or pass `--no-init` where supported.

## Run Identifiers

Run and session IDs are timestamp-based and stable: `YYYY-MM-DDTHHMMSSZ-<short-sha>-<rand>`. Treat them as opaque. The CLI accepts a prefix where unambiguous.

## What This Document Does Not Cover

Per-command flags, compare modes, baseline semantics, prompt selection, and lane-specific outputs live in each lane's own references:

- `skill-review`: see `references/cli.md` in the sibling `skill-review` skill for review compare modes, baseline acceptance, and prompt filtering.
- `skill-improve`: see the sibling `skill-improve` skill's references for improve session lifecycle and decision recording. (Plan-of-record; add when written.)
