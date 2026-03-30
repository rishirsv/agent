#!/bin/bash
# Auto-Research-Eval Setup — Scaffold .autoresearch/ for skill optimization
#
# Usage:
#   ./setup.sh <target-skill-path>              # Scaffold with target skill
#   ./setup.sh <target-skill-path> <output-dir>  # Custom output directory
#   ./setup.sh --help                            # Show help

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE_DIR="$SCRIPT_DIR/templates"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

usage() {
  echo "Auto-Research-Eval Setup"
  echo ""
  echo "Usage: $0 <target-skill-path> [output-dir]"
  echo ""
  echo "Arguments:"
  echo "  target-skill-path   Path to the skill file to optimize (e.g., SKILL.md)"
  echo "  output-dir          Where to create the run directory (default: .autoresearch)"
  echo ""
  echo "Examples:"
  echo "  $0 skills/my-skill/SKILL.md"
  echo "  $0 skills/my-skill/SKILL.md .autoresearch-my-skill"
  exit 0
}

# Parse arguments
case "$1" in
  --help|-h|"")
    usage
    ;;
esac

TARGET_SKILL="$1"
TARGET_DIR="${2:-.autoresearch}"

# Validate target skill exists
if [ ! -f "$TARGET_SKILL" ]; then
  echo -e "${RED}Error: Target skill not found: $TARGET_SKILL${NC}"
  exit 1
fi

# Check if target directory already exists
if [ -d "$TARGET_DIR" ]; then
  echo -e "${YELLOW}Warning: $TARGET_DIR already exists.${NC}"
  echo -e "Files will be refreshed (target.md.original will NOT be overwritten)."
  echo ""
fi

# Create directory structure
echo -e "${CYAN}Creating directory structure...${NC}"
mkdir -p "$TARGET_DIR"/{test_inputs,judges}

# Copy target skill
if [ ! -f "$TARGET_DIR/target.md.original" ]; then
  cp "$TARGET_SKILL" "$TARGET_DIR/target.md.original"
  echo -e "  ${GREEN}✓${NC} Saved original: target.md.original"
fi
cp "$TARGET_SKILL" "$TARGET_DIR/target.md"
cp "$TARGET_SKILL" "$TARGET_DIR/target.md.best"
echo -e "  ${GREEN}✓${NC} Copied target: target.md, target.md.best"

# Copy templates
TEMPLATES=(
  "run.sh"
  "evaluate.py"
  "dashboard.py"
  "dashboard.html"
  "agents.sh"
  "PROMPT_optimize.md"
  "config.toml"
  "state.json"
  "guardrails.md"
)

echo -e "${CYAN}Copying templates...${NC}"
for tmpl in "${TEMPLATES[@]}"; do
  if [ -f "$TEMPLATE_DIR/$tmpl" ]; then
    cp "$TEMPLATE_DIR/$tmpl" "$TARGET_DIR/$tmpl"
    echo -e "  ${GREEN}✓${NC} $tmpl"
  else
    echo -e "  ${YELLOW}!${NC} Template not found: $tmpl"
  fi
done

# Make scripts executable
chmod +x "$TARGET_DIR/run.sh" 2>/dev/null || true
chmod +x "$TARGET_DIR/dashboard.py" 2>/dev/null || true
chmod +x "$TARGET_DIR/evaluate.py" 2>/dev/null || true

# Create empty files (only if they don't exist)
for f in program.md progress.md errors.log; do
  if [ ! -f "$TARGET_DIR/$f" ]; then
    touch "$TARGET_DIR/$f"
    echo -e "  ${GREEN}✓${NC} Created $f"
  fi
done

# Inject skill name into state.json
SKILL_NAME="$(cd "$(dirname "$TARGET_SKILL")" && basename "$(pwd)")"
if command -v python3 &>/dev/null && [ -f "$TARGET_DIR/state.json" ]; then
  python3 -c "
import json, sys
path = sys.argv[1]
name = sys.argv[2]
with open(path, 'r') as f:
    data = json.load(f)
data['skill_name'] = name
with open(path, 'w') as f:
    json.dump(data, f, indent=2)
    f.write('\n')
" "$TARGET_DIR/state.json" "$SKILL_NAME" 2>/dev/null || true
fi

echo ""
echo -e "${GREEN}Setup complete!${NC}"
echo ""
echo "Directory: $TARGET_DIR/"
echo "Target:    $TARGET_SKILL → $TARGET_DIR/target.md"
echo ""
echo "Next steps:"
echo "  1. Add test inputs:    $TARGET_DIR/test_inputs/*.md"
echo "  2. Define evals:       $TARGET_DIR/config.toml"
echo "  3. Write judge prompts: $TARGET_DIR/judges/*.md (for judge-based evals)"
echo "  4. Set constraints:    $TARGET_DIR/program.md"
echo "  5. Run:                $TARGET_DIR/run.sh"
echo ""
