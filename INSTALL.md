# INSTALL.md

Copy the prompt below into Claude on the target Mac.

---

You are helping me fully reset and reinstall OpenAI Codex on this Mac using my `rs-tools` repo as the source of truth.

Goal: delete the existing Codex app, Codex CLI, Codex configs, Codex caches, Codex plugins, and Codex skills; reinstall the Codex CLI fresh; clone my `rs-tools` repo; install its Codex config and local plugin marketplace; and verify Codex works with my `rs-core` plugin.

Repo:

    https://github.com/rishirsv/rs-tools.git

Important behavior:

- You are allowed to delete existing Codex app/config/cache/plugin/skill files.
- Do not delete unrelated OpenAI API keys, shell profiles, project repos, or non-Codex application data.
- Do not edit secrets into any repo file.
- Use macOS commands.
- Prefer explicit commands and explain what each destructive command will remove before running it.
- If a path does not exist, continue.

## Steps

1. Inspect current Codex state.

Run:

    which codex || true
    codex --version || true
    ls -la ~/.codex 2>/dev/null || true
    ls -la ~/.codex/plugins 2>/dev/null || true
    ls -la ~/.codex/skills 2>/dev/null || true
    ls -ld /Applications/Codex.app 2>/dev/null || true

2. Remove Codex app, CLI, and all Codex home data.

Remove only Codex-specific paths:

    rm -rf ~/.codex
    rm -rf /Applications/Codex.app
    rm -f /opt/homebrew/bin/codex
    rm -f /usr/local/bin/codex
    rm -rf /opt/homebrew/lib/node_modules/@openai/codex
    rm -rf /usr/local/lib/node_modules/@openai/codex

If `which codex` showed another path, inspect it first. Remove it only if it is clearly the Codex CLI.

3. Install Codex CLI fresh.

Use the current official install path. If Homebrew has a current Codex package, prefer it. Otherwise use npm:

    npm install -g @openai/codex

Then verify:

    which codex
    codex --version

4. Clone or update `rs-tools`.

Use:

    mkdir -p ~/Code
    if [ -d ~/Code/rs-tools/.git ]; then
      cd ~/Code/rs-tools
      git pull --ff-only
    else
      git clone https://github.com/rishirsv/rs-tools.git ~/Code/rs-tools
      cd ~/Code/rs-tools
    fi

5. Install the repo Codex config into the machine config.

Create `~/.codex` and copy the repo config:

    mkdir -p ~/.codex
    cp ~/Code/rs-tools/.codex/config.toml ~/.codex/config.toml

Then inspect it:

    sed -n '1,220p' ~/.codex/config.toml

Expected important settings:

    approval_policy = "never"
    sandbox_mode = "danger-full-access"
    web_search = "live"

    [marketplaces.rs-tools]
    source_type = "local"
    source = "/Users/rishi/Code/rs-tools/.agents/plugins/marketplace.json"

    [plugins."rs-core@rs-tools"]
    enabled = true

If this Mac's username is not `rishi`, update the `source` path in `~/.codex/config.toml` to the actual cloned repo path, for example:

    source = "/Users/<username>/Code/rs-tools/.agents/plugins/marketplace.json"

Also update `~/Code/rs-tools/.codex/config.toml` the same way if needed.

6. Register or refresh the local marketplace.

From `~/Code/rs-tools`, run:

    codex plugin marketplace add ~/Code/rs-tools
    codex plugin marketplace upgrade rs-tools || true

If `marketplace add` says it already exists, continue.

7. Open Codex once so it initializes plugin/cache state.

Run:

    cd ~/Code/rs-tools
    codex --help

If Codex requires login, run:

    codex login

Then restart Codex after login.

8. Verify the rs-tools plugin files.

Check:

    test -f ~/Code/rs-tools/.agents/plugins/marketplace.json
    test -f ~/Code/rs-tools/plugins/rs-core/.codex-plugin/plugin.json
    find ~/Code/rs-tools/plugins/rs-core/skills -maxdepth 2 -name SKILL.md | sort

Expected skills include:

    agent-browser
    commit
    handoff
    hard-cut
    oracle
    rs-tools
    yeet

9. Verify Codex config no longer enables the OpenAI-curated GitHub plugin.

Run:

    rg -n 'github@openai-curated|rs-core@rs-tools|marketplaces.rs-tools' ~/.codex/config.toml || true

Expected:

    [plugins."github@openai-curated"]
    enabled = false

    [plugins."rs-core@rs-tools"]
    enabled = true

If the GitHub plugin block is missing, that is acceptable. Do not enable it.

10. Final report.

Report:

- Codex CLI path and version.
- Whether `~/.codex/config.toml` was installed.
- Whether `rs-tools` was cloned or updated.
- Whether the `rs-tools` marketplace is registered.
- Whether `rs-core` appears enabled.
- Any login or restart still required.
