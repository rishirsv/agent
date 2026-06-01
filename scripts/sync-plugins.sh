#!/usr/bin/env zsh
set -euo pipefail

ROOT="${0:A:h:h}"
PLUGIN_NAME="perks"
VERSION="0.1.0"
MARKETPLACE_SOURCE="${PERKS_MARKETPLACE_SOURCE:-rishirsv/perks}"

SOURCE_SKILLS="$ROOT/skills"
SOURCE_CODEX_AGENTS="$ROOT/.codex/agents"
SOURCE_ASSETS="$ROOT/assets/$PLUGIN_NAME"
CODEX_PLUGIN="$ROOT/plugins/codex/$PLUGIN_NAME"
CLAUDE_PLUGIN="$ROOT/plugins/claude/$PLUGIN_NAME"
CODEX_PLUGIN_AGENTS="$CODEX_PLUGIN/agents"
CLAUDE_PLUGIN_AGENTS="$CLAUDE_PLUGIN/agents"
CODEX_MARKETPLACE_DIR="$ROOT/.agents/plugins"
CODEX_MARKETPLACE="$CODEX_MARKETPLACE_DIR/marketplace.json"
CLAUDE_MARKETPLACE="$ROOT/.claude-plugin/marketplace.json"
CLAUDE_MARKETPLACE_COMPAT="$ROOT/marketplace.json"
SYSTEM_AGENTS_SOURCE="$ROOT/AGENTS.md"
CODEX_SYSTEM_AGENTS="$HOME/.codex/AGENTS.md"
CODEX_USER_AGENTS="$HOME/.codex/agents"
CODEX_USER_AGENT_MARKER="$CODEX_USER_AGENTS/.perks-managed-agents"
CLAUDE_SYSTEM_AGENTS="$HOME/.claude/CLAUDE.md"
CLAUDE_USER_AGENTS="$HOME/.claude/agents"
CLAUDE_USER_AGENT_MARKER="$CLAUDE_USER_AGENTS/.perks-managed-agents"

if [[ ! -d "$SOURCE_SKILLS" ]]; then
  echo "Missing source skills directory: $SOURCE_SKILLS" >&2
  exit 1
fi

if [[ ! -f "$SYSTEM_AGENTS_SOURCE" ]]; then
  echo "Missing system agents source: $SYSTEM_AGENTS_SOURCE" >&2
  exit 1
fi

mkdir -p \
  "$CODEX_PLUGIN/.codex-plugin" \
  "$CODEX_PLUGIN/skills" \
  "$CODEX_PLUGIN_AGENTS" \
  "$CODEX_PLUGIN/assets" \
  "$CLAUDE_PLUGIN/.claude-plugin" \
  "$CLAUDE_PLUGIN/skills" \
  "$CLAUDE_PLUGIN_AGENTS" \
  "$ROOT/.agents/plugins" \
  "$ROOT/.claude-plugin"

rsync -a --delete --exclude '.DS_Store' "$SOURCE_SKILLS/" "$CODEX_PLUGIN/skills/"
rsync -a --delete --exclude '.DS_Store' "$SOURCE_SKILLS/" "$CLAUDE_PLUGIN/skills/"

if [[ -d "$SOURCE_CODEX_AGENTS" ]]; then
  rsync -a --delete --exclude '.DS_Store' "$SOURCE_CODEX_AGENTS/" "$CODEX_PLUGIN_AGENTS/"
else
  rm -rf "$CODEX_PLUGIN_AGENTS"
fi

if [[ -d "$SOURCE_CODEX_AGENTS" ]]; then
  python3 - "$SOURCE_CODEX_AGENTS" "$CLAUDE_PLUGIN_AGENTS" <<'PY'
import re
import sys
from pathlib import Path

source = Path(sys.argv[1])
target = Path(sys.argv[2])
target.mkdir(parents=True, exist_ok=True)
for stale in target.glob("*.md"):
    stale.unlink()


def parse_codex_agent(path: Path) -> dict:
    text = path.read_text()
    data = {"skills": []}

    for key in ["name", "description", "model", "model_reasoning_effort", "sandbox_mode"]:
        match = re.search(rf'^{key}\s*=\s*"([^"]*)"', text, re.MULTILINE)
        if match:
            data[key] = match.group(1)

    instruction_match = re.search(r'developer_instructions\s*=\s*"""(.*?)"""', text, re.DOTALL)
    data["developer_instructions"] = instruction_match.group(1).strip() if instruction_match else ""

    for match in re.finditer(r'^\s*path\s*=\s*"([^"]*/skills/([^/]+)/SKILL\.md)"', text, re.MULTILINE):
        data["skills"].append(match.group(2))

    return data


def claude_model(codex_model):
    if codex_model and codex_model.endswith("-mini"):
        return "haiku"
    return "sonnet"


def claude_effort(codex_effort):
    if codex_effort in {"low", "medium", "high", "xhigh", "max"}:
        return codex_effort
    return "medium"


def tools_for(sandbox_mode):
    if sandbox_mode == "read-only":
        return ["Read", "Grep", "Glob", "Bash", "Skill"]
    return ["Read", "Grep", "Glob", "Bash", "Write", "Edit", "MultiEdit", "Skill"]


def yaml_scalar(value):
    text = str(value)
    if not text:
        return '""'
    if re.search(r"[:#\[\]{}&*!|>'\"%@`]", text) or text.strip() != text:
        return '"' + text.replace("\\", "\\\\").replace('"', '\\"') + '"'
    return text


def yaml_frontmatter(data):
    lines = []
    for key, value in data.items():
        if isinstance(value, list):
            lines.append(f"{key}:")
            for item in value:
                lines.append(f"- {yaml_scalar(item)}")
        else:
            lines.append(f"{key}: {yaml_scalar(value)}")
    return "\n".join(lines) + "\n"


for path in sorted(source.glob("*.toml")):
    agent = parse_codex_agent(path)
    name = str(agent.get("name", path.stem))
    frontmatter = {
        "name": name,
        "description": str(agent.get("description", "")),
        "model": claude_model(agent.get("model") if isinstance(agent.get("model"), str) else None),
        "effort": claude_effort(agent.get("model_reasoning_effort") if isinstance(agent.get("model_reasoning_effort"), str) else None),
        "tools": tools_for(agent.get("sandbox_mode") if isinstance(agent.get("sandbox_mode"), str) else None),
    }

    skills = agent.get("skills", [])
    if isinstance(skills, list) and skills:
        frontmatter["skills"] = skills

    body = str(agent.get("developer_instructions", "")).strip()
    output = "---\n"
    output += yaml_frontmatter(frontmatter)
    output += "---\n\n"
    output += body
    output += "\n"
    (target / f"{name}.md").write_text(output)
PY
else
  rm -rf "$CLAUDE_PLUGIN_AGENTS"
fi

if [[ -d "$SOURCE_ASSETS" ]]; then
  rsync -a --delete --exclude '.DS_Store' "$SOURCE_ASSETS/" "$CODEX_PLUGIN/assets/"
fi

mkdir -p "$HOME/.codex" "$HOME/.claude" "$CODEX_USER_AGENTS" "$CLAUDE_USER_AGENTS"
cp "$SYSTEM_AGENTS_SOURCE" "$CODEX_SYSTEM_AGENTS"

if [[ -f "$CODEX_USER_AGENT_MARKER" ]]; then
  while IFS= read -r managed_agent; do
    [[ -n "$managed_agent" ]] || continue
    rm -f "$CODEX_USER_AGENTS/$managed_agent"
  done < "$CODEX_USER_AGENT_MARKER"
fi

: > "$CODEX_USER_AGENT_MARKER"
if [[ -d "$SOURCE_CODEX_AGENTS" ]]; then
  for agent_file in "$SOURCE_CODEX_AGENTS"/*.toml(N); do
    cp "$agent_file" "$CODEX_USER_AGENTS/${agent_file:t}"
    print -r -- "${agent_file:t}" >> "$CODEX_USER_AGENT_MARKER"
  done
fi

if [[ -f "$CLAUDE_USER_AGENT_MARKER" ]]; then
  while IFS= read -r managed_agent; do
    [[ -n "$managed_agent" ]] || continue
    rm -f "$CLAUDE_USER_AGENTS/$managed_agent"
  done < "$CLAUDE_USER_AGENT_MARKER"
fi

: > "$CLAUDE_USER_AGENT_MARKER"
if [[ -d "$CLAUDE_PLUGIN_AGENTS" ]]; then
  for agent_file in "$CLAUDE_PLUGIN_AGENTS"/*.md(N); do
    target_agent="$CLAUDE_USER_AGENTS/${agent_file:t}"
    if [[ -e "$target_agent" ]]; then
      mv "$target_agent" "$target_agent.bak.$(date +%Y%m%d%H%M%S)"
    fi
    cp "$agent_file" "$target_agent"
    print -r -- "${agent_file:t}" >> "$CLAUDE_USER_AGENT_MARKER"
  done
fi

if [[ -e "$CLAUDE_SYSTEM_AGENTS" && ! -L "$CLAUDE_SYSTEM_AGENTS" ]]; then
  mv "$CLAUDE_SYSTEM_AGENTS" "$CLAUDE_SYSTEM_AGENTS.bak.$(date +%Y%m%d%H%M%S)"
fi
ln -sfn "$SYSTEM_AGENTS_SOURCE" "$CLAUDE_SYSTEM_AGENTS"

python3 - "$ROOT" "$PLUGIN_NAME" "$VERSION" <<'PY'
import json
import sys
from pathlib import Path

root = Path(sys.argv[1])
name = sys.argv[2]
version = sys.argv[3]

codex_plugin = root / "plugins" / "codex" / name / ".codex-plugin" / "plugin.json"
claude_plugin = root / "plugins" / "claude" / name / ".claude-plugin" / "plugin.json"
codex_marketplace = root / ".agents" / "plugins" / "marketplace.json"
claude_marketplace = root / ".claude-plugin" / "marketplace.json"
claude_marketplace_compat = root / "marketplace.json"

codex_manifest = {
    "name": name,
    "version": version,
    "description": "Rishi's personal Codex workflows and reusable skills.",
    "author": {"name": "Rishi"},
    "repository": "https://github.com/rishirsv/perks",
    "license": "UNLICENSED",
    "keywords": ["personal", "skills", "workflow"],
    "skills": "./skills/",
    "interface": {
        "displayName": "Perks",
        "shortDescription": "Rishi's personal Codex workflows.",
        "longDescription": "Perks packages Rishi's reusable coding, review, planning, and workflow skills for Codex.",
        "developerName": "Rishi",
        "category": "Productivity",
        "capabilities": ["Read", "Write"],
        "defaultPrompt": "Use Perks for this workflow.",
        "brandColor": "#006DFF",
        "composerIcon": "./assets/icon.png",
        "logo": "./assets/logo.png",
        "screenshots": []
    }
}

claude_manifest = {
    "name": name,
    "version": version,
    "description": "Rishi's personal Claude workflows and reusable skills.",
    "author": {"name": "Rishi"},
    "repository": "https://github.com/rishirsv/perks",
    "license": "UNLICENSED",
    "keywords": ["personal", "skills", "workflow"],
    "skills": "./skills/"
}

codex_catalog = {
    "name": name,
    "interface": {"displayName": "Perks"},
    "plugins": [
        {
            "name": name,
            "source": {"source": "local", "path": "./plugins/codex/perks"},
            "policy": {"installation": "AVAILABLE", "authentication": "ON_INSTALL"},
            "category": "Productivity"
        }
    ]
}

meta_skill_plugin = root / "plugins" / "meta-skill" / ".codex-plugin" / "plugin.json"
if meta_skill_plugin.exists():
    codex_catalog["plugins"].append(
        {
            "name": "meta-skill",
            "source": {"source": "local", "path": "./plugins/meta-skill"},
            "policy": {"installation": "AVAILABLE", "authentication": "ON_INSTALL"},
            "category": "Coding",
        }
    )

claude_catalog = {
    "name": name,
    "owner": {"name": "Rishi"},
    "metadata": {
        "version": version,
        "description": "Rishi's personal Claude plugin marketplace and reusable skills."
    },
    "plugins": [
        {
            "name": name,
            "description": "Rishi's personal Claude workflows and reusable skills.",
            "source": "./plugins/claude/perks",
            "version": version,
            "category": "productivity",
            "tags": ["personal", "skills", "workflow"]
        }
    ]
}

for path, data in [
    (codex_plugin, codex_manifest),
    (claude_plugin, claude_manifest),
    (codex_marketplace, codex_catalog),
    (claude_marketplace, claude_catalog),
    (claude_marketplace_compat, claude_catalog),
]:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2) + "\n")
PY

CODEX_VALIDATOR="/Users/rishi/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py"
if [[ -f "$CODEX_VALIDATOR" ]]; then
  python3 "$CODEX_VALIDATOR" "$CODEX_PLUGIN"
fi

if command -v claude >/dev/null 2>&1; then
  claude plugin validate "$CLAUDE_PLUGIN"
  claude plugin validate "$ROOT"
fi

if command -v codex >/dev/null 2>&1; then
  codex plugin remove "rs-tools@rs-tools" >/dev/null 2>&1 || true
  codex plugin marketplace remove "rs-tools" >/dev/null 2>&1 || true
  codex plugin marketplace remove "$PLUGIN_NAME" >/dev/null 2>&1 || true
  codex plugin marketplace add "$MARKETPLACE_SOURCE" --sparse .agents --sparse plugins/codex --sparse plugins/meta-skill
  codex plugin remove "$PLUGIN_NAME@$PLUGIN_NAME" >/dev/null 2>&1 || true
  codex plugin add "$PLUGIN_NAME@$PLUGIN_NAME"
fi

if command -v claude >/dev/null 2>&1; then
  claude plugin uninstall "rs-tools@rs-tools" --scope user >/dev/null 2>&1 || true
  claude plugin marketplace remove "rs-tools" >/dev/null 2>&1 || true
  claude plugin marketplace remove "$PLUGIN_NAME" >/dev/null 2>&1 || true
  claude plugin marketplace add "$MARKETPLACE_SOURCE" --sparse .claude-plugin plugins/claude
  claude plugin uninstall "$PLUGIN_NAME@$PLUGIN_NAME" >/dev/null 2>&1 || true
  claude plugin install "$PLUGIN_NAME@$PLUGIN_NAME" --scope user || claude plugin update "$PLUGIN_NAME@$PLUGIN_NAME" --scope user
fi

CODEX_CACHE="$HOME/.codex/plugins/cache/$PLUGIN_NAME/$PLUGIN_NAME/$VERSION"
CLAUDE_CACHE="$HOME/.claude/plugins/cache/$PLUGIN_NAME/$PLUGIN_NAME/$VERSION"
mkdir -p "$CODEX_CACHE" "$CLAUDE_CACHE"
rsync -a --delete --exclude '.DS_Store' "$CODEX_PLUGIN/" "$CODEX_CACHE/"
rsync -a --delete --exclude '.DS_Store' "$CLAUDE_PLUGIN/" "$CLAUDE_CACHE/"

echo "Synced skills to:"
echo "  $CODEX_PLUGIN/skills"
echo "  $CLAUDE_PLUGIN/skills"
echo "Refreshed local caches:"
echo "  $CODEX_CACHE"
echo "  $CLAUDE_CACHE"
echo "Synced system agent instructions:"
echo "  $CODEX_SYSTEM_AGENTS"
echo "  $CLAUDE_SYSTEM_AGENTS -> $SYSTEM_AGENTS_SOURCE"
echo "Synced Codex custom agents:"
echo "  $CODEX_USER_AGENTS"
echo "Synced Claude custom agents:"
echo "  $CLAUDE_USER_AGENTS"
