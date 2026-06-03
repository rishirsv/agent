# AGENTS.md

## Agent Repo

In `~/Code/agent`:

- `skills/`, `.codex/agents/`, `assets/agent/`, and `AGENTS.md` are the source files to edit.
- Save all plan documents under `.plans/`; do not leave ExecPlans or planning docs inside plugin, skill, or package directories.
- Do not hand-edit generated plugin packages under `plugins/codex/agent/` or `plugins/claude/agent/`.
- If `AGENTS.md`, `.codex/agents/`, `assets/agent/`, or anything under `skills/` changes, run `scripts/sync-plugins.sh` before committing.
