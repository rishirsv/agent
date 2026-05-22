# Perks

Source repo for Rishi's personal Perks skills and local Codex/Claude plugin builds.

## Edit Surface

Day to day, only edit:

- `skills/`: active Perks skills.
- `AGENTS.md`: compact system guidance shared by this repo, Codex, and Claude.

Then run:

```sh
scripts/sync-plugins.sh
```

Everything else exists to package, install, sync, or stage those two surfaces.

## Structure

- `skills/`: canonical Perks skills. This is the source folder to edit.
- `skill-workbench/`: WIP and imported skills that are not part of the active Perks plugin yet.
- `plugins/codex/perks/`: generated Codex plugin package.
- `plugins/claude/perks/`: generated Claude plugin package.
- `.agents/plugins/marketplace.json`: Codex marketplace entry for the local Perks plugin.
- `.claude-plugin/marketplace.json` and `marketplace.json`: Claude marketplace entry for the local Perks plugin.
- `AGENTS.md`: compact system guidance shared by this repo, Codex, and Claude.
- `.codex/config.toml`: repo-local Codex config for working in this repo.
- `.codex/agents/loader.toml`: active Codex helper agent for Perks repo sync discipline.
- `scripts/sync-plugins.sh`: rebuilds plugin folders from `skills/`, validates manifests, registers/install plugins, and refreshes local caches.

## Sync

After any change under `skills/`, run:

```sh
scripts/sync-plugins.sh
```

The script updates:

- `plugins/codex/perks/skills/`
- `plugins/claude/perks/skills/`
- Codex marketplace/install state
- Claude marketplace/install state
- `~/.codex/AGENTS.md` by copying repo `AGENTS.md`
- `~/.claude/CLAUDE.md` by symlinking to repo `AGENTS.md`
- Local plugin caches under `~/.codex/plugins/cache/perks/perks/0.1.0` and `~/.claude/plugins/cache/perks/perks/0.1.0`

## Repo Codex Config

This repo keeps its Codex config in `.codex/config.toml`.

User-specific secrets, auth, and machine-wide defaults should stay in `~/.codex/config.toml`.

Codex instructions stay in root `AGENTS.md`; they do not move into `.codex/`. Codex project subagents use `.codex/agents/*.toml`, not `.agents/`.

Claude project subagents use `.claude/agents/*.md`. Claude plugin subagents should live under `agents/` at the plugin root.
