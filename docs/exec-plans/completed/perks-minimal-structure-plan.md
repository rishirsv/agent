# Perks Minimal Structure Plan

## Purpose

Determine the minimal durable structure for the Perks repo after the Codex plugin announcements, including whether Perks needs a marketplace, how it should sync across machines, and which folders can be removed or moved out of the active repo.

Final direction from Rishi: make the repo public, make `skills/` the canonical previous-plugin skills folder, move the former loose skill bench to `skill-workbench/`, scaffold Codex and Claude plugin packages, and make one active Codex loader agent for repo sync discipline.

## Phase Outcomes

1. Research: current OpenAI Codex plugin, marketplace, CLI, and skill guidance is summarized from live sources; Claude plugin/settings compatibility is checked from current docs or examples.
2. Repo audit: every top-level and major nested folder is classified as essential, optional, archive/reference, generated, or removable.
3. Recommendation: Perks has a clear target layout and cross-machine sync story with the fewest moving pieces.
4. Cleanup: once the target is clear, remove or move folders that are not needed and update docs/configs.
5. Validation: plugin manifests, marketplace/config, symlinks, and skill discovery paths still work.

## Implementation Checklist

- [x] 1.0 Research current platform guidance
  - [x] 1.1 Review OpenAI Codex plugin and skill docs, including today's announcement trail if available.
  - [x] 1.2 Review current Codex CLI plugin commands and install/sync behavior.
  - [x] 1.3 Review Claude plugin and settings structure enough to decide what compatibility files are worth keeping.
  - [x] 1.4 Validation for 1.0: cite sources and separate confirmed facts from inference.
- [x] 2.0 Audit the repo tree
  - [x] 2.1 Inventory all top-level folders and hidden config folders.
  - [x] 2.2 Confirm there is no active plugin under `plugins/perks`.
  - [x] 2.3 Inventory loose `skills/`, `references/`, `configs/`, and `docs/` folders.
  - [x] 2.4 Validation for 2.0: every folder has a disposition and reason.
- [x] 3.0 Choose target structure and sync model
  - [x] 3.1 Decide whether `.agents/plugins/marketplace.json` is required, optional, or removable for single-plugin Perks.
  - [x] 3.2 Decide whether Claude files should stay, be symlinked, or be removed.
  - [x] 3.3 Define cross-machine auto-sync: Git source, install/update command, cache refresh, and global config handling.
  - [x] 3.4 Validation for 3.0: target structure maps cleanly to official docs and local CLI behavior.
- [x] 4.0 Kill current plugin and document paused state
  - [x] 4.1 Remove the current `plugins/perks` bundle.
  - [x] 4.2 Remove active Codex and Claude marketplace files.
  - [x] 4.3 Remove repo-local config that registers/enables `perks@perks`.
  - [x] 4.4 Remove stale local `rs-tools` plugin cache.
  - [x] 4.5 Validation for 4.0: Codex sees no Perks marketplace/plugin and repo docs say the plugin is paused.
- [x] 5.0 Prune and document final minimal repo
  - [x] 5.1 Remove `references/` and `docs/skill-reviews/`.
  - [x] 5.2 Move previous plugin skills into canonical `skills/`.
  - [x] 5.3 Remove active Claude local settings and old config snapshots.
  - [x] 5.4 Move former loose skill bench into `skill-workbench/`.
  - [x] 5.5 Update README/INSTALL/AGENTS/config docs to describe the minimal structure.
  - [x] 5.6 Validation for 5.0: stale-path scan, plugin validation if a plugin exists, and clean git diff review.
- [x] 6.0 Scaffold active plugin sync
  - [x] 6.1 Scaffold `plugins/codex/perks` with `.codex-plugin/plugin.json`.
  - [x] 6.2 Scaffold `plugins/claude/perks` with `.claude-plugin/plugin.json`.
  - [x] 6.3 Add Codex and Claude marketplace manifests.
  - [x] 6.4 Add `scripts/sync-plugins.sh` to copy `skills/` into both plugin packages and refresh local runtime state.
  - [x] 6.5 Add `.codex/agents/loader.toml` as the active repo sync helper agent.
  - [x] 6.6 Validation for 6.0: run the sync script, validate manifests, install `perks@perks`, and refresh local caches.

## Validation

- `codex --version`
- `codex plugin --help`
- `codex plugin marketplace --help`
- `scripts/sync-plugins.sh`
- `test -d skills`
- `test -d skill-workbench`
- `test -d plugins/codex/perks/skills`
- `test -d plugins/claude/perks/skills`
- `test -f .agents/plugins/marketplace.json`
- `test -f .claude-plugin/marketplace.json`
- `find . -maxdepth 3 -type d | sort`
- `codex plugin list --marketplace perks`
- `claude plugin list`
- `rg -n 'plugin-drafts|agent-templates|plugins/perks|references/|docs/skill-reviews' README.md AGENTS.md INSTALL.md docs/exec-plans/completed/perks-minimal-structure-plan.md .gitignore --hidden`

## Decision Log

- The existing Perks plugin is intentionally removed before deeper pruning so the audit is not biased toward preserving the old bundle.
- Claude plugin metadata should not be symlinked while the new plugin shape is undecided.
- Codex project subagents use `.codex/agents/*.toml`, not `.agents/`; `.agents/` remains only a possible future Codex plugin marketplace location.
- Claude project subagents use `.claude/agents/*.md`; Claude plugin subagents use `agents/` at the plugin root.
- There are no agent templates for now. The repo has one active Codex agent at `.codex/agents/loader.toml`.
- `skills/` is now the source of truth. Plugin skill folders are generated copies.

## Surprises/Discoveries

- `codex plugin marketplace add rishirsv/perks --ref main --sparse .agents/plugins --sparse plugins/perks` creates a Git marketplace config with `source_type = "git"`, `source = "https://github.com/rishirsv/perks.git"`, `ref = "main"`, and sparse paths. This is likely the future cross-machine sync base if Perks remains a Codex plugin.
- Codex plugin validation currently requires a non-empty `version` in `.codex-plugin/plugin.json`, while Claude docs recommend omitting plugin versions for fast-moving internal plugins that should update on every commit. That means shared/symlinked Codex and Claude manifests create an update-behavior tradeoff.
- OpenAI Codex docs show custom project agents under `.codex/agents/*.toml`.
- Claude docs show project agents under `.claude/agents/*.md` and plugin agents under the plugin root `agents/` directory.
- Codex local marketplace registration must point at the repo root; passing the marketplace JSON file or `.agents/plugins/` directory directly failed. From the repo root, Codex discovers `.agents/plugins/marketplace.json`.

## Completion Notes

- Public repo cleanup shipped in this pass: `references/`, `docs/skill-reviews/`, old config snapshots, and active Claude local settings were removed.
- Current shape: previous plugin skills are canonical in `skills/`, former loose skills are in `skill-workbench/`, plugin builds live under `plugins/codex/perks/` and `plugins/claude/perks/`, and `scripts/sync-plugins.sh` rebuilds/registers/cache-refreshes both runtimes.
- Remaining follow-up: prune and redesign the skill set itself.
