# AGENTS.md

## Agent Repo

In `~/Code/agent`:

- `skills/`, `.codex/agents/`, `plugins/codex/agent/assets/`, and `AGENTS.md` are the source files to edit.
- Save all plan documents under `.plans/`; do not leave ExecPlans or planning docs inside plugin, skill, or package directories.
- Do not install Agent skills directly under `~/.codex/skills/`; `scripts/sync-plugins.sh` packages them into the Agent plugin and removes old managed direct Desktop skill copies.
- Do not hand-edit generated plugin package files under `plugins/codex/agent/agents/` or `plugins/claude/agent/`.
- After editing any skill payload, review the changed skill files directly and run any deterministic tests that exist for that skill before syncing or committing.
- If `AGENTS.md`, `.codex/agents/`, `plugins/codex/agent/assets/`, or anything under `skills/` changes, run `scripts/sync-plugins.sh` before committing.
