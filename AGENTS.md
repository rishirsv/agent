# AGENTS.md

## Perks Repo

In `~/Code/perks`:

- `skills/`, `.codex/agents/`, `assets/perks/`, and `AGENTS.md` are the source files to edit.
- `disabled-skills/` contains repo-only skill references that are intentionally not synced into generated plugin packages.
- Do not hand-edit generated plugin packages under `plugins/codex/perks/` or `plugins/claude/perks/`.
- If `AGENTS.md`, `.codex/agents/`, `assets/perks/`, or anything under `skills/` changes, run `scripts/sync-plugins.sh` before committing.
